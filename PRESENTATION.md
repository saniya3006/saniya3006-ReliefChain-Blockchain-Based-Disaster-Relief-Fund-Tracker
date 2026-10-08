# ReliefChain: Presentation Slides

*10 slides. Copy each slide's content into PowerPoint/Google Slides. Speaker notes are in italics.*

---

## Slide 1: Title

# ReliefChain
### Blockchain-Based Disaster Relief Fund Tracker

*Syllabus topic: "Develop a Blockchain based application for transparent and genuine charity."*

- Student name(s) · Roll number(s)
- Guide name · Department · College · Year

*Notes: "Our project tracks disaster-relief donations and how the money is used, on a blockchain."*

---

## Slide 2: Problem Statement

- After floods, earthquakes and cyclones, people donate generously, but **cannot see what happens to their money**.
- Donation records live in a **private database**: they can be edited, deleted or never published.
- Donors cannot check whether their donation was counted, or how funds were split between food, medicine and shelter.
- **Result:** low trust → fewer donations.

---

## Slide 3: Existing System

| Existing system | Problem |
|---|---|
| Charity keeps records in its own database / spreadsheets | Can be changed silently |
| Annual reports published months later | Not real-time |
| Receipt is a PDF or email | Cannot be independently verified |
| Usage of funds shown as totals only | No category-wise trail |

---

## Slide 4: Proposed System

**ReliefChain** records every donation and every fund allocation in a **smart contract**.

- Donor enters **name + ₹ amount** → recorded on the blockchain → gets a **transaction hash** receipt
- Admin records **allocations**: Food, Medicine, Shelter, Transport, Other
- Smart contract **rejects** allocations larger than donated funds
- **Transparency dashboard** + **transaction verification** for everyone

*Example:* Rahul → ₹500 → Flood Relief (tx `0x83a7…91fd`)

---

## Slide 5: Architecture

```
User / Admin
     ↓
React Website  (Vite + Tailwind)
     ↓   REST API
FastAPI Backend  (Python + web3.py, holds owner wallet)
     ↓   JSON-RPC
ReliefChain Smart Contract  (Solidity)
     ↓
Hardhat Local Ethereum Blockchain
```

- Images stored locally; **all financial data on-chain**
- No separate database: the contract is the single source of truth

---

## Slide 6: Blockchain & Smart Contract

**ReliefChain.sol** (Solidity 0.8.24, OpenZeppelin `Ownable`)

| Function | Purpose |
|---|---|
| `createCampaign()` | New relief campaign |
| `donate()` | Record donation, auto-COMPLETED at target |
| `allocateFunds()` | Record use of funds by category |
| `closeCampaign()` | Stop donations |
| `getCampaign()` / `getDonations()` / `getAllocations()` | Public reads |

**Events:** CampaignCreated · DonationReceived · FundsAllocated
**Security:** onlyOwner · valid campaign ID · amount > 0 · active & before deadline · **no over-allocation**

---

## Slide 7: Main Features

- 🏠 Campaign listing with progress bars and status (🟢 Active / 🔵 Completed / 🔴 Closed)
- 💝 Donation with on-chain receipt (transaction hash + block number)
- 📜 Donation history with "Verify" links
- 🥧 Fund allocation donut chart and category cards
- 📊 Transparency dashboard and public ledger
- 🔍 Transaction verification directly from the blockchain
- 🛠️ Admin panel: create, allocate, close
- ✅ 15 smart-contract tests + 5 backend integration tests

---

## Slide 8: Screenshots / Live Demo

*(Insert screenshots: Home, Campaign page, Donation Successful, Transparency Dashboard, Verify, Admin)*

**Live demo flow:** open campaign → donate ₹500 → show tx hash → history → admin allocation → transparency → verify hash

---

## Slide 9: Advantages & Limitations

| Advantages | Limitations |
|---|---|
| Records are public and tamper-evident | Blockchain cannot prove the charity itself is genuine |
| Anyone can verify any transaction | Allocations are self-reported by the organization |
| Rules enforced by code (no over-allocation) | Donors trust the backend to record their donation |
| Donors need no crypto wallet | No real payment gateway (demo) |
| Category-wise trail of fund usage | Local chain resets on restart |

> **Blockchain does not automatically prove that a charity is genuine. It provides a transparent and tamper-evident record of donations and fund allocations.**

---

## Slide 10: Conclusion & Future Scope

**Conclusion:** ReliefChain shows how a smart contract can make charity finances **transparent, verifiable and rule-based**, while being honest that organization verification remains an off-chain process.

**Future scope**
- UPI / payment gateway with on-chain payment reference
- Optional MetaMask donations signed by donors
- Bills and receipts on IPFS, hash stored with each allocation
- Multi-signature approval for allocations
- Public testnet / Polygon deployment

### Thank you! Questions?
