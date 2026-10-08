/**
 * Deploys ReliefChain to the selected network and seeds DEMO data.
 *
 *   npx hardhat run scripts/deploy.js --network localhost
 *
 * Writes backend/contract/ReliefChain.json (local) or ReliefChain.<network>.json
 * (address + ABI) so the FastAPI backend knows which contract to talk to.
 *
 *   npx hardhat run scripts/deploy.js --network sepolia     (hosting; see HOSTING.md)
 *
 * NOTE: all campaigns, donor names and amounts created here are FICTIONAL
 * demonstration data. Every one of them is still a real blockchain
 * transaction on the local Hardhat network.
 */
const fs = require("fs");
const path = require("path");
const { ethers, network } = require("hardhat");

const DAY = 24 * 60 * 60;
const Category = { Food: 0, Medicine: 1, Shelter: 2, Transportation: 3, Other: 4 };

const DEMO_CAMPAIGNS = [
  {
    name: "Chennai Flood Relief 2026",
    disasterType: "Flood",
    location: "Chennai, Tamil Nadu",
    description:
      "Emergency support for families affected by flooding: food kits, clean drinking water, medicines and temporary shelter. (Demo campaign)",
    imageUrl: "/images/flood.svg",
    target: 1000000,
    days: 45,
    donations: [
      ["Rahul Sharma", 5000],
      ["Priya Nair", 10000],
      ["Arjun Mehta", 2500],
      ["Kavya Iyer", 25000],
      ["Anonymous", 15000],
      ["Sneha Reddy", 7500],
    ],
    allocations: [
      [Category.Food, 25000, "Dry ration kits for 250 families"],
      [Category.Medicine, 12000, "First-aid and medicine kits"],
      [Category.Shelter, 15000, "Tarpaulin sheets and blankets"],
      [Category.Transportation, 5000, "Boat and truck hire for supply delivery"],
    ],
  },
  {
    name: "Assam Flood Relief",
    disasterType: "Flood",
    location: "Brahmaputra Valley, Assam",
    description:
      "Relief for villages cut off by river flooding: food, water purification tablets and transport of supplies by boat. (Demo campaign)",
    imageUrl: "/images/flood2.svg",
    target: 500000,
    days: 30,
    donations: [
      ["Vikram Das", 3000],
      ["Meera Joshi", 12000],
      ["Rohit Verma", 6000],
    ],
    allocations: [[Category.Food, 10000, "Rice and dal distribution"]],
  },
  {
    name: "Earthquake Emergency Relief",
    disasterType: "Earthquake",
    location: "Himalayan foothills (fictional demo region)",
    description:
      "Emergency shelter, medical aid and rebuilding support for families whose homes were damaged in an earthquake. (Demo campaign)",
    imageUrl: "/images/earthquake.svg",
    target: 750000,
    days: 60,
    donations: [
      ["Ananya Gupta", 20000],
      ["Farhan Khan", 8000],
    ],
    allocations: [],
  },
  {
    name: "Cyclone Relief - East Coast",
    disasterType: "Cyclone",
    location: "Coastal Odisha",
    description:
      "Support for fishing communities after a cyclone: shelter repair, food supplies and replacement of essential equipment. (Demo campaign)",
    imageUrl: "/images/cyclone.svg",
    target: 300000,
    days: 20,
    donations: [],
    allocations: [],
  },
];

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(`Network:  ${network.name}`);
  console.log(`Deployer: ${deployer.address} (becomes contract owner / admin)`);

  const ReliefChain = await ethers.getContractFactory("ReliefChain");
  const reliefChain = await ReliefChain.deploy();
  await reliefChain.waitForDeployment();
  const address = await reliefChain.getAddress();
  const deployTx = reliefChain.deploymentTransaction();
  const deployReceipt = await deployTx.wait();
  console.log(`ReliefChain deployed to: ${address} (block ${deployReceipt.blockNumber})`);

  // Save address + ABI for the backend
  const artifact = await hre.artifacts.readArtifact("ReliefChain");
  const outDir = path.join(__dirname, "..", "backend", "contract");
  fs.mkdirSync(outDir, { recursive: true });
  // localhost -> ReliefChain.json (git-ignored), other networks -> ReliefChain.<network>.json (committed for hosting)
  const local = network.name === "localhost" || network.name === "hardhat";
  const outFile = local ? "ReliefChain.json" : `ReliefChain.${network.name}.json`;
  fs.writeFileSync(
    path.join(outDir, outFile),
    JSON.stringify(
      {
        address,
        chainId: Number((await ethers.provider.getNetwork()).chainId),
        deployBlock: deployReceipt.blockNumber,
        deployedAt: new Date().toISOString(),
        abi: artifact.abi,
      },
      null,
      2
    )
  );
  console.log(`Saved contract info to backend/contract/${outFile}`);

  if (process.env.SKIP_SEED) return;

  console.log("\nSeeding DEMO data (fictional campaigns, real transactions)...");
  const now = (await ethers.provider.getBlock("latest")).timestamp;
  for (const c of DEMO_CAMPAIGNS) {
    await (
      await reliefChain.createCampaign(
        c.name,
        c.disasterType,
        c.location,
        c.description,
        c.imageUrl,
        c.target,
        now + c.days * DAY
      )
    ).wait();
    const id = await reliefChain.campaignCount();
    for (const [donor, amount] of c.donations) {
      await (await reliefChain.donate(id, donor, amount)).wait();
    }
    for (const [category, amount, note] of c.allocations) {
      await (await reliefChain.allocateFunds(id, category, amount, note)).wait();
    }
    console.log(
      `  #${id} ${c.name}: ${c.donations.length} donations, ${c.allocations.length} allocations`
    );
  }
  console.log("Done.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
