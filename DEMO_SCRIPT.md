# ReliefChain: Demo Script (about 4 minutes)

## Before the demo (do this 10 minutes early)

Four terminals in the project folder:

```bash
# Terminal 1 – blockchain (keep open)
npx hardhat node

# Terminal 2 – deploy contract + demo data (run once after the node starts)
npx hardhat run scripts/deploy.js --network localhost

# Terminal 3 – backend
cd backend
.venv\Scripts\activate
uvicorn main:app --reload --port 8010

# Terminal 4 – frontend
cd frontend
npm run dev
```

Open **http://localhost:5180** and check the navbar pill says **Hardhat Local · #…** in green.
Optional: run `npx hardhat test` once and keep the "15 passing" output on screen to show later.

---

## Script

### 1. Introduction (≈30 s)
> "Good morning. Our project is **ReliefChain**, a blockchain-based disaster-relief fund tracker.
> When people donate after a flood, they usually can't see whether their money was counted or how it was used. ReliefChain records every donation and every use of funds in a smart contract, so anyone can see and verify it."

**Action:** Home page. Point at the live numbers.
> "These numbers are read live from our smart contract running on a local Ethereum blockchain. The campaigns are fictional demo data."

### 2. Campaigns (≈20 s)
**Action:** Click **Campaigns** → open **Chennai Flood Relief 2026**.
> "Each campaign has a target, the amount raised, progress, donor count and a status: Active, Completed or Closed. All of this is stored in the smart contract."

### 3. Donate (≈40 s)
**Action:** Enter name **Rahul**, amount **₹500**, click **DONATE NOW**.
> "When I click Donate, the React website sends the request to our FastAPI backend. The backend calls the `donate` function of the smart contract and signs the transaction with the relief organization's wallet. Only that wallet is allowed to write, so outsiders cannot add fake donations."

**Action:** Point at **Donation Successful ✓**.
> "The transaction is mined. This is the **transaction hash**, a unique ID for this donation on the blockchain, and this is the block number. This is the donor's receipt."

### 4. Donation history (≈20 s)
**Action:** Scroll to **Donation History**.
> "Rahul's donation is now at the top with the same hash, and the raised amount went up by ₹500. The history comes from the contract, and the hashes come from the contract's event logs."

### 5. Fund allocation by admin (≈50 s)
**Action:** Click **Admin** → log in (`reliefchain-admin`) → **Allocate Funds** → Chennai → **Medicine**, ₹500, note "ORS packets" → **Allocate funds**.
> "Now I'm the relief organization. I record that ₹500 was used for medicine. This is also a blockchain transaction with its own hash."

**Action:** Type an amount bigger than *Available* and submit.
> "If I try to allocate more than was actually donated, it's rejected. The smart contract has a rule: **allocation can never exceed available funds**. The admin cannot claim to have spent money that doesn't exist."

**Action:** Go back to the Chennai campaign page → **Fund Allocation** section.
> "The donut chart shows exactly how the money was split: food, medicine, shelter and transport."

### 6. Transparency dashboard (≈30 s)
**Action:** Click **Transparency**.
> "This is the public transparency dashboard: total raised, total allocated, remaining funds, donors and number of transactions, plus a ledger of the latest blockchain transactions. Everything is computed from smart-contract data."

### 7. Verify the transaction (≈30 s)
**Action:** Click **Verify** next to a transaction (or go to Verify and paste Rahul's hash).
> "Anyone can verify a transaction. We fetch it directly from the blockchain, not from a database. It shows Transaction Found, the campaign, the amount, the donor, the block number, and status Confirmed."

**Action (optional):** Change one character of the hash → Verify.
> "A fake hash is simply not found."

### 8. Closing (≈20 s)
> "To conclude: the blockchain gives us a **transparent and tamper-evident record** of donations and fund allocations. Once recorded, nobody can secretly edit or delete them, and anyone can verify them.
> We are also clear that **blockchain alone does not prove a charity is genuine**. That needs off-chain verification like registration and audits. Thank you."

---

## If something goes wrong

| Problem | Fix |
|---|---|
| Red "Blockchain offline" pill | Terminal 1: `npx hardhat node` must be running |
| "Contract not found on this blockchain" | Node was restarted; re-run the deploy command (Terminal 2) |
| "Cannot reach the ReliefChain backend" | Start the backend (Terminal 3) |
| Admin login fails | Use the `ADMIN_KEY` value in `backend/.env` |
| Port already in use | Close the other app, or change the port in `vite.config.js` / the uvicorn command |
