"""
Blockchain layer: everything that talks to the ReliefChain smart contract.

The backend owns ONE wallet (the relief organization's wallet). That wallet
deployed the contract, so it is the contract `owner` and is the only address
allowed to write records (create campaigns, record donations, allocate funds).
"""
import json
import os
import re
import threading
from datetime import datetime, timezone
from pathlib import Path

from web3 import Web3
from web3.exceptions import ContractLogicError, TransactionNotFound
from web3.logs import DISCARD

CONTRACT_FILE = Path(__file__).parent / "contract" / "ReliefChain.json"

STATUS = ["ACTIVE", "COMPLETED", "CLOSED"]
CATEGORIES = ["Food", "Medicine", "Shelter", "Transportation", "Other"]


class ChainError(Exception):
    """A friendly error that the API returns to the user."""

    def __init__(self, message, status_code=400):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


class Blockchain:
    def __init__(self):
        self.rpc_url = os.getenv("RPC_URL", "http://127.0.0.1:8545")
        self.w3 = Web3(Web3.HTTPProvider(self.rpc_url, request_kwargs={"timeout": 20}))
        private_key = os.getenv("PRIVATE_KEY")
        if not private_key:
            raise RuntimeError("PRIVATE_KEY missing in backend/.env")
        self.account = self.w3.eth.account.from_key(private_key)
        self._tx_lock = threading.Lock()  # send one transaction at a time (correct nonces)
        self._contract_mtime = None
        self.contract = None
        self.deploy_block = 0

    # ------------------------------------------------------------------
    # Connection helpers
    # ------------------------------------------------------------------
    def _load_contract(self):
        """(Re)load address + ABI written by scripts/deploy.js."""
        if not CONTRACT_FILE.exists():
            raise ChainError(
                "Contract not deployed. Run: npx hardhat run scripts/deploy.js --network localhost", 503
            )
        mtime = CONTRACT_FILE.stat().st_mtime
        if mtime != self._contract_mtime:
            info = json.loads(CONTRACT_FILE.read_text())
            self.contract = self.w3.eth.contract(address=info["address"], abi=info["abi"])
            self.deploy_block = info.get("deployBlock", 0)
            self._contract_mtime = mtime

    def ready(self):
        """Make sure the blockchain is reachable and the contract exists."""
        try:
            connected = self.w3.is_connected()
        except Exception:
            connected = False
        if not connected:
            raise ChainError(
                f"Cannot reach the blockchain at {self.rpc_url}. Is `npx hardhat node` running?", 503
            )
        self._load_contract()
        if self.w3.eth.get_code(self.contract.address) in (b"", b"\x00"):
            raise ChainError(
                "Contract not found on this blockchain (node was probably restarted). "
                "Run: npx hardhat run scripts/deploy.js --network localhost",
                503,
            )
        return self.contract

    def health(self):
        c = self.ready()
        owner = c.functions.owner().call()
        return {
            "connected": True,
            "rpcUrl": self.rpc_url,
            "chainId": self.w3.eth.chain_id,
            "blockNumber": self.w3.eth.block_number,
            "contractAddress": c.address,
            "backendWallet": self.account.address,
            "contractOwner": owner,
            "backendIsOwner": owner.lower() == self.account.address.lower(),
        }

    # ------------------------------------------------------------------
    # Sending transactions
    # ------------------------------------------------------------------
    def _send(self, fn):
        """Sign a contract call with the backend wallet, send it, wait for it to be mined."""
        self.ready()
        with self._tx_lock:
            try:
                # estimate_gas runs the call first: if a `require` would fail we
                # get the revert reason here and no transaction is sent.
                gas = fn.estimate_gas({"from": self.account.address})
                tx = fn.build_transaction(
                    {
                        "from": self.account.address,
                        "nonce": self.w3.eth.get_transaction_count(self.account.address, "pending"),
                        "gas": int(gas * 1.2),
                        "chainId": self.w3.eth.chain_id,
                    }
                )
            except ContractLogicError as e:
                raise ChainError(_revert_reason(e))
            signed = self.account.sign_transaction(tx)
            tx_hash = self.w3.eth.send_raw_transaction(signed.raw_transaction)
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash, timeout=60)
        if receipt.status != 1:
            raise ChainError("Transaction failed on the blockchain")
        return receipt

    def _tx_result(self, receipt):
        return {
            "txHash": receipt.transactionHash.to_0x_hex(),
            "blockNumber": receipt.blockNumber,
            "gasUsed": receipt.gasUsed,
        }

    def create_campaign(self, name, disaster_type, location, description, image_url, target, deadline):
        c = self.ready()
        receipt = self._send(
            c.functions.createCampaign(name, disaster_type, location, description, image_url, target, deadline)
        )
        events = c.events.CampaignCreated().process_receipt(receipt, errors=DISCARD)
        return {**self._tx_result(receipt), "campaignId": events[0].args.campaignId if events else None}

    def donate(self, campaign_id, donor_name, amount):
        c = self.ready()
        receipt = self._send(c.functions.donate(campaign_id, donor_name, amount))
        return self._tx_result(receipt)

    def allocate(self, campaign_id, category, amount, note):
        c = self.ready()
        receipt = self._send(c.functions.allocateFunds(campaign_id, category, amount, note))
        return self._tx_result(receipt)

    def close_campaign(self, campaign_id):
        c = self.ready()
        receipt = self._send(c.functions.closeCampaign(campaign_id))
        return self._tx_result(receipt)

    # ------------------------------------------------------------------
    # Reading data (free view calls + event logs)
    # ------------------------------------------------------------------
    def campaign_count(self):
        return self.ready().functions.campaignCount().call()

    def get_all_campaigns(self):
        raw = self.ready().functions.getAllCampaigns().call()
        return [_campaign_dict(r) for r in raw]

    def get_campaign(self, campaign_id):
        c = self.ready()
        try:
            return _campaign_dict(c.functions.getCampaign(campaign_id).call())
        except ContractLogicError as e:
            raise ChainError(_revert_reason(e), 404)

    def _event_tx_map(self, event, campaign_id, index_field):
        """index -> (txHash, blockNumber), read from the contract's event logs."""
        logs = event.get_logs(from_block=self.deploy_block, argument_filters={"campaignId": campaign_id})
        return {
            log.args[index_field]: {"txHash": log.transactionHash.to_0x_hex(), "blockNumber": log.blockNumber}
            for log in logs
        }

    def get_donations(self, campaign_id):
        c = self.ready()
        raw = c.functions.getDonations(campaign_id).call()
        txs = self._event_tx_map(c.events.DonationReceived, campaign_id, "donationIndex")
        result = []
        for i, (donor_name, amount, ts) in enumerate(raw):
            result.append(
                {
                    "index": i,
                    "donorName": donor_name,
                    "amount": amount,
                    "timestamp": ts,
                    **txs.get(i, {"txHash": None, "blockNumber": None}),
                }
            )
        return list(reversed(result))  # newest first

    def get_allocations(self, campaign_id):
        c = self.ready()
        raw = c.functions.getAllocations(campaign_id).call()
        txs = self._event_tx_map(c.events.FundsAllocated, campaign_id, "allocationIndex")
        result = []
        for i, (category, amount, note, ts) in enumerate(raw):
            result.append(
                {
                    "index": i,
                    "category": CATEGORIES[category],
                    "amount": amount,
                    "note": note,
                    "timestamp": ts,
                    **txs.get(i, {"txHash": None, "blockNumber": None}),
                }
            )
        return result

    def recent_transactions(self, limit=20):
        """Latest donation + allocation events across all campaigns."""
        c = self.ready()
        names = {x["id"]: x["name"] for x in self.get_all_campaigns()}
        items = []
        for log in c.events.DonationReceived.get_logs(from_block=self.deploy_block):
            items.append(
                {
                    "type": "Donation",
                    "campaignId": log.args.campaignId,
                    "campaignName": names.get(log.args.campaignId, ""),
                    "label": log.args.donorName,
                    "amount": log.args.amount,
                    "timestamp": log.args.timestamp,
                    "txHash": log.transactionHash.to_0x_hex(),
                    "blockNumber": log.blockNumber,
                }
            )
        for log in c.events.FundsAllocated.get_logs(from_block=self.deploy_block):
            items.append(
                {
                    "type": "Allocation",
                    "campaignId": log.args.campaignId,
                    "campaignName": names.get(log.args.campaignId, ""),
                    "label": CATEGORIES[log.args.category],
                    "amount": log.args.amount,
                    "timestamp": log.args.timestamp,
                    "txHash": log.transactionHash.to_0x_hex(),
                    "blockNumber": log.blockNumber,
                }
            )
        items.sort(key=lambda x: (x["blockNumber"], x["type"]), reverse=True)
        return items[:limit], len(items)

    # ------------------------------------------------------------------
    # Verification
    # ------------------------------------------------------------------
    def verify(self, tx_hash):
        """Look up a transaction directly on the blockchain and decode it."""
        c = self.ready()
        try:
            tx = self.w3.eth.get_transaction(tx_hash)
            receipt = self.w3.eth.get_transaction_receipt(tx_hash)
        except (TransactionNotFound, ValueError):
            raise ChainError("Transaction not found on the blockchain", 404)

        block = self.w3.eth.get_block(receipt.blockNumber)
        result = {
            "found": True,
            "txHash": receipt.transactionHash.to_0x_hex(),
            "status": "Confirmed" if receipt.status == 1 else "Failed",
            "blockNumber": receipt.blockNumber,
            "confirmations": self.w3.eth.block_number - receipt.blockNumber + 1,
            "timestamp": block.timestamp,
            "from": tx["from"],
            "to": tx.get("to"),
            "gasUsed": receipt.gasUsed,
            "isReliefChain": (tx.get("to") or "").lower() == c.address.lower(),
            "events": [],
        }
        if not result["isReliefChain"]:
            return result

        names = {}

        def campaign_name(cid):
            if cid not in names:
                try:
                    names[cid] = c.functions.getCampaign(cid).call()[1]
                except Exception:
                    names[cid] = f"Campaign #{cid}"
            return names[cid]

        for ev in c.events.DonationReceived().process_receipt(receipt, errors=DISCARD):
            result["events"].append(
                {
                    "type": "Donation",
                    "campaignId": ev.args.campaignId,
                    "campaignName": campaign_name(ev.args.campaignId),
                    "donorName": ev.args.donorName,
                    "amount": ev.args.amount,
                }
            )
        for ev in c.events.FundsAllocated().process_receipt(receipt, errors=DISCARD):
            result["events"].append(
                {
                    "type": "Allocation",
                    "campaignId": ev.args.campaignId,
                    "campaignName": campaign_name(ev.args.campaignId),
                    "category": CATEGORIES[ev.args.category],
                    "amount": ev.args.amount,
                    "note": ev.args.note,
                }
            )
        for ev in c.events.CampaignCreated().process_receipt(receipt, errors=DISCARD):
            result["events"].append(
                {
                    "type": "Campaign Created",
                    "campaignId": ev.args.campaignId,
                    "campaignName": ev.args.name,
                    "amount": ev.args.targetAmount,
                }
            )
        for ev in c.events.CampaignStatusChanged().process_receipt(receipt, errors=DISCARD):
            result["events"].append(
                {
                    "type": "Status Changed",
                    "campaignId": ev.args.campaignId,
                    "campaignName": campaign_name(ev.args.campaignId),
                    "status": STATUS[ev.args.status],
                }
            )
        return result


def _campaign_dict(r):
    (
        cid, name, disaster_type, location, description, image_url, target, raised,
        allocated, deadline, created_at, creator, status, donor_count, donation_count,
    ) = r
    now = int(datetime.now(timezone.utc).timestamp())
    label = STATUS[status]
    ended = label == "ACTIVE" and now > deadline
    return {
        "id": cid,
        "name": name,
        "disasterType": disaster_type,
        "location": location,
        "description": description,
        "imageUrl": image_url,
        "targetAmount": target,
        "raisedAmount": raised,
        "allocatedAmount": allocated,
        "availableAmount": raised - allocated,
        "remainingAmount": max(target - raised, 0),
        "progress": round(min(raised * 100 / target, 100), 2) if target else 0,
        "deadline": deadline,
        "createdAt": created_at,
        "creator": creator,
        # A campaign past its deadline is shown as CLOSED (the contract also rejects donations)
        "status": "CLOSED" if ended else label,
        "deadlinePassed": now > deadline,
        "donorCount": donor_count,
        "donationCount": donation_count,
    }


def _revert_reason(e):
    msg = str(e.message if hasattr(e, "message") and e.message else e)
    # Hardhat format: "... reverted with reason string 'Invalid campaign ID'"
    match = re.search(r"reason string '([^']*)", msg)
    if match:
        return match.group(1)
    for prefix in ("execution reverted: ", "execution reverted"):
        if msg.startswith(prefix):
            msg = msg[len(prefix):]
    if "OwnableUnauthorizedAccount" in msg or "0x118cdaa7" in msg:
        return "Unauthorized: backend wallet is not the contract owner"
    return msg.strip(" :'\"") or "Transaction rejected by the smart contract"
