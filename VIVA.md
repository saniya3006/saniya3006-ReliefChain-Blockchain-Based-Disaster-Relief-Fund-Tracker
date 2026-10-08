# ReliefChain: Viva Preparation

Short, simple answers. Read them aloud a couple of times. Most viva questions are some version of these.

---

### 1. What is blockchain?
A blockchain is a **shared digital ledger** made of blocks. Each block holds a list of transactions and the **hash of the previous block**, so the blocks form a chain. If someone changes an old block, its hash changes and the chain no longer matches. That makes tampering easy to detect. Copies of the ledger are kept by many computers (nodes), so no single person controls it.

### 2. Why did you use blockchain in this project?
Charity records are usually kept in a private database that the charity can edit or hide. We wanted donations and fund allocations to be **public, permanent and verifiable**. On a blockchain, once a donation or allocation is recorded, it cannot be secretly changed or deleted, and anyone can check it using its transaction hash.

### 3. What is a smart contract?
A smart contract is a **program stored on the blockchain** that runs exactly as written. Nobody can change its rules after deployment. Our contract `ReliefChain.sol` stores campaigns, donations and allocations, and enforces rules such as *"only the owner can write"* and *"you cannot allocate more money than was donated"*.

### 4. What is Solidity?
Solidity is the **programming language** used to write smart contracts for Ethereum. Its syntax is similar to JavaScript/C++. We used Solidity 0.8.24, which also has built-in overflow checks.

### 5. What is MetaMask?
MetaMask is a **browser-extension crypto wallet**. It stores a user's private key and lets them sign blockchain transactions from websites.
**In our project we deliberately did not use MetaMask.** Donors shouldn't need a crypto wallet. The FastAPI backend holds the organization's wallet and signs transactions on the donor's behalf. MetaMask could be added in future for donors who want to sign their own donations.

### 6. What is Ethereum?
Ethereum is a public blockchain that can run **smart contracts**. Its currency is Ether (ETH), which is used to pay **gas** (transaction fees). We used a **local Ethereum network** (Hardhat) so no real ETH or money is involved.

### 7. What is Hardhat?
Hardhat is a **development tool for Ethereum**. We used it to:
- run a **local blockchain** on our computer (`npx hardhat node`) with 20 free test accounts,
- **compile** the Solidity contract,
- **test** it (15 automated tests),
- **deploy** it (`scripts/deploy.js`).

### 8. What is ethers.js / web3.py?
They are **libraries that let a program talk to the blockchain**: read contract data, build and sign transactions, read events.
- **ethers.js** (JavaScript) is used in our Hardhat tests and deploy script.
- **web3.py** (Python) is used in our FastAPI backend to call the smart contract.

### 9. Why not use a normal database?
A normal database is controlled by one party. The admin can **edit or delete** rows and nobody would know. Donors also cannot independently check it.
With blockchain:
- records are **tamper-evident** (changing history breaks the hash chain),
- every record has a **transaction hash** anyone can verify,
- the **rules are in the smart contract**, not in the admin's hands (e.g. over-allocation is impossible).

We still keep **images** off-chain (local files), because storing large files on a blockchain is very expensive.

### 10. What is the role of hashing (SHA / Keccak) here?
- Every **transaction** gets a unique hash (its ID), the "receipt number" we show to donors.
- Every **block** contains the hash of the previous block, which is what makes the chain tamper-evident.
- Ethereum uses **Keccak-256** (a SHA-3 family hash). In our contract we also use `keccak256(donorName)` to turn a name into a fixed 32-byte key for counting unique donors.

### 11. How is transparency achieved?
1. Every donation and allocation is written to the smart contract.
2. Every write produces a **transaction hash** and is stored in a **block**.
3. The **Transparency Dashboard** shows total raised, allocated, remaining, by category, and a public ledger of transactions, all read from the contract.
4. The **Verify** page fetches any transaction directly from the blockchain and decodes it.

### 12. How is fund allocation tracked?
The admin calls `allocateFunds(campaignId, category, amount, note)`. The contract:
- checks the caller is the owner,
- checks `amount <= raised − alreadyAllocated` (cannot spend money that doesn't exist),
- stores the allocation (category, amount, note, time) and emits a `FundsAllocated` event.

The website shows allocations as a **donut chart**, category cards and a list, each with its own transaction hash.

### 13. Can blockchain guarantee a genuine charity?
**No.** Blockchain does **not** prove that an organization is genuine, or that goods actually reached victims. It only guarantees that **what was recorded** is public and cannot be secretly changed. Checking that a charity is genuine (registration, audits, field reports) is an **off-chain, administrative** process. Our project says this clearly on the Home, Transparency and About pages.

### 14. What happens if a transaction fails?
Before sending, the backend **simulates** the call (`estimate_gas`). If any `require` in the contract fails, e.g. *"Campaign is not active"* or *"Allocation exceeds available funds"*, the transaction is **not sent**, nothing changes on the blockchain, and the user sees that error message. If a transaction does fail on-chain, it is **reverted**: all its changes are undone, as if it never happened.

### 15. What is a wallet address?
A wallet address is a **public identifier** of an account on Ethereum, a 42-character hex string like `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`. It is derived from the account's public key. The matching **private key** is secret and is used to sign transactions. Our contract owner is Hardhat test Account #0.

### 16. What is a transaction hash?
A transaction hash is the **unique 66-character ID** (`0x` + 64 hex characters) of a blockchain transaction. It is calculated by hashing the signed transaction. With it, anyone can look up the transaction: block number, sender, receiver, status, and which events it emitted. In ReliefChain it acts as the **donation receipt**.

### 17. What are the limitations?
- Donors don't sign their own transactions, so they must trust the organization's backend to record their donation (it cannot be changed once recorded).
- No real payment gateway: rupee amounts are recorded, not transferred.
- Allocations are self-reported by the organization.
- Unique donors are counted by name; donor names are public.
- Runs on a local blockchain; restarting the node clears the data.

### 18. What is the future scope?
- UPI/payment-gateway integration, with the payment reference stored on-chain.
- Optional MetaMask donations signed by donors themselves.
- Upload bills/receipts to IPFS and store their hash with each allocation.
- Multi-signature approval for allocations.
- Deploy on a public testnet or a low-fee chain (e.g. Polygon) with block-explorer links.

---

## Extra questions you may be asked

**What is gas?** The fee for running a transaction on Ethereum, paid in ETH. On our local Hardhat network the test accounts have free fake ETH.

**What is `onlyOwner`?** A modifier from OpenZeppelin's `Ownable` contract. It makes a function revert unless it's called by the owner (the deployer). All our write functions use it.

**What is an event?** A log the contract emits (e.g. `DonationReceived`). It is cheap to store and easy to search, and that's how we find the transaction hash of each donation for the history table.

**What is a `view` function?** A read-only function (e.g. `getCampaign`). Calling it is free and doesn't create a transaction.

**What does `require` do?** It checks a condition; if false, the whole transaction is reverted with an error message.

**What is a block?** A group of transactions plus a header containing the previous block's hash, a timestamp, etc. Hardhat mines a new block for every transaction.

**Why is the status COMPLETED automatic?** In `donate()`, if `raisedAmount >= targetAmount` the contract sets the status to COMPLETED and stops accepting donations.

**Why FastAPI?** It is a simple, fast Python web framework. It validates input with Pydantic and auto-generates API docs at `/docs`.

**Where is the private key kept?** In `backend/.env`, never on the blockchain and never in the frontend. For the demo it is Hardhat's public test key, which must never be used on a real network.

**What is tamper-evident vs tamper-proof?** Tamper-*evident* means changes can be detected. Blockchain records are practically impossible to change secretly, so any attempt is evident.
