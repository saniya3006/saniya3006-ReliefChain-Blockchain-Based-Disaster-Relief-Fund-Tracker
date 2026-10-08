# Hosting ReliefChain online

This guide puts ReliefChain on the internet for free:

```
Website  (React)    →  Vercel   (free)      https://<your-app>.vercel.app
Backend  (FastAPI)  →  Render   (free)      https://<your-backend>.onrender.com
Contract (Solidity) →  Sepolia  (Ethereum's free public test network)
```

On Sepolia every donation is a real, public blockchain transaction that anyone can open on **sepolia.etherscan.io**. Test ETH has **no real value**, so no real money is involved.

Total time: about 30–45 minutes. You need a GitHub account with access to the repository, a Google account (for the faucet) and the MetaMask browser extension.

> **Safety rule:** use a **brand-new MetaMask account that only ever holds test ETH**. Its private key will be stored on Render. Never use a wallet that holds real money.

---

## Step 1: Create a test wallet and get free Sepolia ETH

1. Install **MetaMask** from [metamask.io](https://metamask.io) and create a wallet (or open your existing one).
2. Click the account name at the top → **Add account** → name it `ReliefChain Test`.
3. Copy this account's **address** (starts with `0x…`).
4. Open a Sepolia faucet, paste the address and request test ETH, for example the **Google Cloud Web3 faucet** (search "Google Cloud Sepolia faucet"; sign in with a Google account). Faucets change over time; any Sepolia faucet works.
5. In MetaMask, switch the network to **Sepolia** (enable "Show test networks" in settings if needed) and check that the ETH arrived.
   - About **0.05 Sepolia ETH** is plenty. A full deploy with demo data used ~6 million gas in testing.
6. Get the private key: account menu (⋮) → **Account details** → **Show private key** → enter your MetaMask password → copy it.

## Step 2: Deploy the smart contract to Sepolia (on your laptop)

In the project folder:

```bash
copy .env.example .env          # Windows   (macOS/Linux: cp .env.example .env)
```

Open the new `.env` file and paste the private key from Step 1:

```
SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
SEPOLIA_PRIVATE_KEY=0x...your test wallet private key...
```

Then deploy:

```bash
npx hardhat test                                         # make sure everything passes
npx hardhat run scripts/deploy.js --network sepolia      # takes ~5 minutes
```

The script prints the contract address and creates **`backend/contract/ReliefChain.sepolia.json`** (address + ABI; no secrets). It also creates the 4 demo campaigns with sample donations. Each transaction waits for a Sepolia block (~12 s), which is why it takes a few minutes. To deploy without demo data: `set SKIP_SEED=1` (Windows) before the command.

Check it: open `https://sepolia.etherscan.io/address/<the printed contract address>`. You should see the transactions.

Commit the new file so Render can use it:

```bash
git add backend/contract/ReliefChain.sepolia.json
git commit -m "Add Sepolia deployment"
git push
```

> `.env` is in `.gitignore`, so your private key is **not** committed. Double-check with `git status` that `.env` is never listed.

## Step 3: Host the backend on Render

1. Go to [render.com](https://render.com) and **sign up with GitHub**, using the GitHub account that owns the repository (or one with access to it).
2. Click **New → Blueprint**, select the ReliefChain repository and click **Connect**. Render reads `render.yaml` and prepares a service called `reliefchain-backend`.
3. It asks for three values:

   | Key | Value |
   | --- | --- |
   | `PRIVATE_KEY` | The **same** test-wallet private key you used to deploy (it must be the contract owner) |
   | `ADMIN_KEY` | A new admin password of your choice (not `reliefchain-admin`) |
   | `FRONTEND_ORIGINS` | Leave as `https://example.com` for now; you'll fix it in Step 5 |

4. Click **Apply**. The first build takes a few minutes.
5. Copy the service URL, e.g. `https://reliefchain-backend.onrender.com`, and open `<that URL>/api/health`. You should see `"network":"Sepolia Testnet"` and `"backendIsOwner":true`.

## Step 4: Host the website on Vercel

1. Go to [vercel.com](https://vercel.com) and **sign up with GitHub** (same account as above).
2. Click **Add New → Project** and **Import** the ReliefChain repository.
3. Set:
   - **Root Directory:** `frontend`
   - **Framework Preset:** Vite (detected automatically)
   - **Environment Variable:** `VITE_API_URL` = your Render URL from Step 3 (no `/api`, no trailing slash)
4. Click **Deploy**. After about a minute you get a URL like `https://reliefchain-xyz.vercel.app`.

## Step 5: Connect the two

1. In Render → your service → **Environment**, set `FRONTEND_ORIGINS` to your Vercel URL (e.g. `https://reliefchain-xyz.vercel.app`, no trailing slash). If you have several URLs, separate them with commas.
2. Save. Render redeploys automatically (about 1–2 minutes).
3. Open your Vercel URL. The navbar pill should say **Sepolia Testnet · #block** in green.

## Step 6: Test it

- Donate a small amount → after ~15 seconds you get the transaction hash, with an **Etherscan** link next to it.
- Open **Verify**: the record is fetched from Sepolia, with a "View this transaction on Etherscan" link.
- Log in to **Admin** with your new `ADMIN_KEY` and record an allocation.

---

## Good to know

| Topic | Details |
| --- | --- |
| **Free Render sleeps** | After ~15 minutes without visitors the backend sleeps; the next visit takes ~1 minute to wake it. **Before a demo, open the backend `/api/health` URL once.** |
| **Speed** | Each donation/allocation waits for a Sepolia block: ~12–20 seconds (locally it was instant). |
| **Data is permanent** | Unlike the local Hardhat chain, Sepolia data stays forever. A fresh deploy creates a new contract with a new address; commit the new `ReliefChain.sepolia.json` and push. |
| **Running low on test ETH** | Each transaction costs a tiny amount of test ETH from the backend wallet. Top up from the faucet if transactions start failing with "insufficient funds". |
| **Updating the site** | Every `git push` to `main` redeploys both Vercel and Render automatically. |
| **Local development still works** | Without any of these settings, everything runs locally exactly as before (`README.md`). |

## Troubleshooting

| Problem | Fix |
| --- | --- |
| Website says "Cannot reach the ReliefChain backend" | Backend is asleep or still building: open the Render URL and wait ~1 minute. Check `VITE_API_URL` in Vercel (redeploy after changing it). |
| Browser console shows a CORS error | `FRONTEND_ORIGINS` in Render must exactly match the Vercel URL (https, no trailing slash). |
| `/api/health` says "Contract not deployed" | `backend/contract/ReliefChain.sepolia.json` was not committed/pushed (Step 2). |
| Health shows `"backendIsOwner": false` | Render's `PRIVATE_KEY` is not the wallet that deployed the contract. |
| Deploy script: "insufficient funds" | The test wallet needs more Sepolia ETH (Step 1). |
| Admin login fails | Use the `ADMIN_KEY` you set in Render, not the local one. |
