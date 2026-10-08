"""
ReliefChain FastAPI backend.

    User -> React website -> FastAPI backend (this file) -> ReliefChain smart contract

Run:  uvicorn main:app --reload --port 8010
Docs: http://127.0.0.1:8010/docs
"""
import os
import secrets
from datetime import datetime, timezone

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, Header, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, field_validator

load_dotenv()  # before importing blockchain.py, which reads env vars at import time

from blockchain import CATEGORIES, Blockchain, ChainError  # noqa: E402

ADMIN_KEY = os.getenv("ADMIN_KEY", "")
MAX_DONATION = 10_000_000  # ₹1 crore sanity limit per donation (demo)

app = FastAPI(title="ReliefChain API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    # Local dev origins + the hosted frontend URL(s) from FRONTEND_ORIGINS (comma-separated)
    allow_origins=["http://localhost:5180", "http://127.0.0.1:5180"]
    + [o.strip().rstrip("/") for o in os.getenv("FRONTEND_ORIGINS", "").split(",") if o.strip()],
    allow_methods=["*"],
    allow_headers=["*"],
)

chain = Blockchain()


@app.exception_handler(ChainError)
def chain_error_handler(_: Request, exc: ChainError):
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.message})


@app.exception_handler(RequestValidationError)
def validation_error_handler(_: Request, exc: RequestValidationError):
    # Turn pydantic's error list into one readable sentence for the UI.
    messages = []
    for err in exc.errors():
        field = str(err["loc"][-1]).replace("_", " ")
        messages.append(f"{field}: {err['msg'].removeprefix('Value error, ')}")
    return JSONResponse(status_code=422, content={"detail": "; ".join(messages)})


@app.exception_handler(Exception)
def unexpected_error_handler(_: Request, exc: Exception):
    # Never leak a stack trace to the user; show a friendly message instead.
    print("Unexpected error:", repr(exc))
    return JSONResponse(status_code=500, content={"detail": f"Unexpected server error: {exc}"})


# ----------------------------------------------------------------------
# Request models (input validation)
# ----------------------------------------------------------------------
class DonationIn(BaseModel):
    donor_name: str = Field(min_length=1, max_length=64)
    amount: int = Field(gt=0, le=MAX_DONATION, description="Amount in whole rupees")

    @field_validator("donor_name")
    @classmethod
    def clean_name(cls, v):
        v = " ".join(v.split())
        if not v:
            raise ValueError("Donor name is required")
        return v


class CampaignIn(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    disaster_type: str = Field(min_length=1, max_length=40)
    location: str = Field(min_length=1, max_length=100)
    description: str = Field(min_length=1, max_length=1000)
    image_url: str = Field(default="", max_length=300)
    target_amount: int = Field(gt=0, le=10_000_000_000)
    end_date: str = Field(description="YYYY-MM-DD")


class AllocationIn(BaseModel):
    category: str
    amount: int = Field(gt=0)
    note: str = Field(default="", max_length=200)

    @field_validator("category")
    @classmethod
    def valid_category(cls, v):
        if v not in CATEGORIES:
            raise ValueError(f"Category must be one of {CATEGORIES}")
        return v


class AdminLogin(BaseModel):
    admin_key: str


def require_admin(x_admin_key: str = Header(default="")):
    """Simple admin protection for the mini-project: a shared admin key from .env."""
    if not ADMIN_KEY or not secrets.compare_digest(x_admin_key, ADMIN_KEY):
        raise HTTPException(status_code=401, detail="Unauthorized: invalid admin key")


# ----------------------------------------------------------------------
# Public endpoints
# ----------------------------------------------------------------------
@app.get("/api/health")
def health():
    return chain.health()


@app.get("/api/campaigns")
def list_campaigns():
    return chain.get_all_campaigns()


@app.get("/api/campaigns/{campaign_id}")
def campaign_details(campaign_id: int):
    campaign = chain.get_campaign(campaign_id)
    return {
        **campaign,
        "donations": chain.get_donations(campaign_id),
        "allocations": chain.get_allocations(campaign_id),
    }


@app.post("/api/campaigns/{campaign_id}/donate")
def donate(campaign_id: int, body: DonationIn):
    chain.get_campaign(campaign_id)  # 404 if it does not exist
    result = chain.donate(campaign_id, body.donor_name, body.amount)
    return {"message": "Donation recorded on the blockchain", **result}


@app.get("/api/stats")
def stats():
    campaigns = chain.get_all_campaigns()
    by_category = chain.allocation_totals()
    recent, tx_count = chain.recent_transactions(limit=15, campaigns=campaigns)
    total_raised = sum(c["raisedAmount"] for c in campaigns)
    total_allocated = sum(c["allocatedAmount"] for c in campaigns)
    return {
        "totalCampaigns": len(campaigns),
        "activeCampaigns": sum(1 for c in campaigns if c["status"] == "ACTIVE"),
        "completedCampaigns": sum(1 for c in campaigns if c["status"] == "COMPLETED"),
        "closedCampaigns": sum(1 for c in campaigns if c["status"] == "CLOSED"),
        "totalRaised": total_raised,
        "totalAllocated": total_allocated,
        "remainingFunds": total_raised - total_allocated,
        "totalDonors": sum(c["donorCount"] for c in campaigns),
        "totalDonations": sum(c["donationCount"] for c in campaigns),
        "totalTransactions": tx_count,
        "allocationByCategory": [{"category": k, "amount": v} for k, v in by_category.items()],
        "recentTransactions": recent,
        "campaigns": campaigns,
    }


@app.get("/api/verify/{tx_hash}")
def verify(tx_hash: str):
    tx_hash = tx_hash.strip()
    if not (tx_hash.startswith("0x") and len(tx_hash) == 66):
        raise HTTPException(status_code=400, detail="Invalid transaction hash (must be 0x + 64 hex characters)")
    try:
        int(tx_hash, 16)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid transaction hash (not hexadecimal)")
    return chain.verify(tx_hash)


# ----------------------------------------------------------------------
# Admin endpoints (need X-Admin-Key header)
# ----------------------------------------------------------------------
@app.post("/api/admin/login")
def admin_login(body: AdminLogin):
    if not ADMIN_KEY or not secrets.compare_digest(body.admin_key, ADMIN_KEY):
        raise HTTPException(status_code=401, detail="Invalid admin key")
    return {"ok": True}


@app.post("/api/admin/campaigns", dependencies=[Depends(require_admin)])
def create_campaign(body: CampaignIn):
    try:
        end = datetime.strptime(body.end_date, "%Y-%m-%d").replace(hour=23, minute=59, second=59, tzinfo=timezone.utc)
    except ValueError:
        raise HTTPException(status_code=400, detail="End date must be in YYYY-MM-DD format")
    result = chain.create_campaign(
        body.name.strip(),
        body.disaster_type.strip(),
        body.location.strip(),
        body.description.strip(),
        body.image_url.strip(),
        body.target_amount,
        int(end.timestamp()),
    )
    return {"message": "Campaign created on the blockchain", **result}


@app.post("/api/admin/campaigns/{campaign_id}/allocate", dependencies=[Depends(require_admin)])
def allocate(campaign_id: int, body: AllocationIn):
    chain.get_campaign(campaign_id)
    result = chain.allocate(campaign_id, CATEGORIES.index(body.category), body.amount, body.note.strip())
    return {"message": "Allocation recorded on the blockchain", **result}


@app.post("/api/admin/campaigns/{campaign_id}/close", dependencies=[Depends(require_admin)])
def close_campaign(campaign_id: int):
    chain.get_campaign(campaign_id)
    result = chain.close_campaign(campaign_id)
    return {"message": "Campaign closed", **result}
