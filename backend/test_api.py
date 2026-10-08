"""
Integration tests: FastAPI backend <-> real ReliefChain contract on the local Hardhat node.

Needs:  npx hardhat node   +   npx hardhat run scripts/deploy.js --network localhost
Run:    .venv/Scripts/python -m pytest -v      (Windows)
        .venv/bin/python -m pytest -v          (macOS/Linux)

Note: these tests write real transactions (a test campaign, donations,
allocations) to the local chain. Re-run deploy.js afterwards for clean demo data.
"""
import os

from dotenv import load_dotenv
from fastapi.testclient import TestClient

load_dotenv()
from main import app  # noqa: E402

client = TestClient(app)
ADMIN = {"X-Admin-Key": os.getenv("ADMIN_KEY", "")}


def _new_campaign(target=1000):
    r = client.post(
        "/api/admin/campaigns",
        headers=ADMIN,
        json={
            "name": "Pytest Relief",
            "disaster_type": "Flood",
            "location": "Test",
            "description": "Integration test campaign",
            "image_url": "",
            "target_amount": target,
            "end_date": "2099-12-31",
        },
    )
    assert r.status_code == 200, r.text
    return r.json()["campaignId"]


def test_health_backend_is_owner():
    r = client.get("/api/health")
    assert r.status_code == 200
    assert r.json()["backendIsOwner"] is True


def test_donation_flow_and_verification():
    cid = _new_campaign()
    r = client.post(f"/api/campaigns/{cid}/donate", json={"donor_name": "Rahul", "amount": 500})
    assert r.status_code == 200, r.text
    tx = r.json()["txHash"]
    assert tx.startswith("0x") and len(tx) == 66

    c = client.get(f"/api/campaigns/{cid}").json()
    assert c["raisedAmount"] == 500
    assert c["donations"][0]["donorName"] == "Rahul"
    assert c["donations"][0]["txHash"] == tx  # history links to the real transaction

    v = client.get(f"/api/verify/{tx}").json()
    assert v["status"] == "Confirmed"
    assert v["isReliefChain"] is True
    assert v["events"][0]["type"] == "Donation"
    assert v["events"][0]["amount"] == 500


def test_allocation_and_over_allocation():
    cid = _new_campaign()
    client.post(f"/api/campaigns/{cid}/donate", json={"donor_name": "Priya", "amount": 1000})
    r = client.post(f"/api/admin/campaigns/{cid}/allocate", headers=ADMIN, json={"category": "Food", "amount": 600})
    assert r.status_code == 200, r.text
    r = client.post(f"/api/admin/campaigns/{cid}/allocate", headers=ADMIN, json={"category": "Shelter", "amount": 401})
    assert r.status_code == 400
    assert r.json()["detail"] == "Allocation exceeds available funds"
    c = client.get(f"/api/campaigns/{cid}").json()
    assert c["allocatedAmount"] == 600 and c["availableAmount"] == 400


def test_completed_and_closed_status():
    cid = _new_campaign(target=100)
    client.post(f"/api/campaigns/{cid}/donate", json={"donor_name": "A", "amount": 100})
    assert client.get(f"/api/campaigns/{cid}").json()["status"] == "COMPLETED"

    cid2 = _new_campaign()
    assert client.post(f"/api/admin/campaigns/{cid2}/close", headers=ADMIN).status_code == 200
    assert client.get(f"/api/campaigns/{cid2}").json()["status"] == "CLOSED"
    r = client.post(f"/api/campaigns/{cid2}/donate", json={"donor_name": "B", "amount": 10})
    assert r.status_code == 400 and r.json()["detail"] == "Campaign is not active"


def test_rejections():
    # no admin key
    assert client.post("/api/admin/campaigns/1/close").status_code == 401
    # invalid campaign
    r = client.post("/api/campaigns/9999/donate", json={"donor_name": "X", "amount": 5})
    assert r.status_code == 404 and r.json()["detail"] == "Invalid campaign ID"
    # invalid input
    assert client.post("/api/campaigns/1/donate", json={"donor_name": " ", "amount": 0}).status_code == 422
    # fake / malformed hashes
    assert client.get("/api/verify/0x" + "a" * 64).status_code == 404
    assert client.get("/api/verify/hello").status_code == 400
