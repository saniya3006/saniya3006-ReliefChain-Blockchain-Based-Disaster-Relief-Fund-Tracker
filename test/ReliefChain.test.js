const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

// Category / Status enums mirror the Solidity enums
const Category = { Food: 0, Medicine: 1, Shelter: 2, Transportation: 3, Other: 4 };
const Status = { Active: 0, Completed: 1, Closed: 2 };

describe("ReliefChain", function () {
  let reliefChain, owner, outsider;
  const TARGET = 1000000n; // ₹10,00,000

  async function deadlineInDays(days) {
    return (await time.latest()) + days * 24 * 60 * 60;
  }

  async function createSampleCampaign(target = TARGET) {
    const deadline = await deadlineInDays(30);
    await reliefChain.createCampaign(
      "Chennai Flood Relief",
      "Flood",
      "Chennai, Tamil Nadu",
      "Emergency support for families affected by flooding.",
      "/images/flood.jpg",
      target,
      deadline
    );
    return 1n;
  }

  beforeEach(async function () {
    [owner, outsider] = await ethers.getSigners();
    const ReliefChain = await ethers.getContractFactory("ReliefChain");
    reliefChain = await ReliefChain.deploy();
    await reliefChain.waitForDeployment();
  });

  // 1. Contract deployment
  describe("Deployment", function () {
    it("sets the deployer as owner (admin)", async function () {
      expect(await reliefChain.owner()).to.equal(owner.address);
    });

    it("starts with zero campaigns", async function () {
      expect(await reliefChain.campaignCount()).to.equal(0n);
      expect(await reliefChain.getAllCampaigns()).to.have.length(0);
    });
  });

  // 2. Campaign creation
  describe("Campaign creation", function () {
    it("creates a campaign and emits CampaignCreated", async function () {
      const deadline = await deadlineInDays(30);
      await expect(
        reliefChain.createCampaign("Chennai Flood Relief", "Flood", "Chennai", "desc", "/img.jpg", TARGET, deadline)
      )
        .to.emit(reliefChain, "CampaignCreated")
        .withArgs(1n, "Chennai Flood Relief", TARGET, deadline);

      const c = await reliefChain.getCampaign(1);
      expect(c.name).to.equal("Chennai Flood Relief");
      expect(c.disasterType).to.equal("Flood");
      expect(c.targetAmount).to.equal(TARGET);
      expect(c.raisedAmount).to.equal(0n);
      expect(c.status).to.equal(Status.Active);
      expect(c.creator).to.equal(owner.address);
      expect(await reliefChain.campaignCount()).to.equal(1n);
    });

    it("rejects empty name, zero target and past deadline", async function () {
      const deadline = await deadlineInDays(30);
      const past = (await time.latest()) - 10;
      await expect(reliefChain.createCampaign("", "Flood", "X", "d", "", TARGET, deadline)).to.be.revertedWith(
        "Name is required"
      );
      await expect(reliefChain.createCampaign("A", "Flood", "X", "d", "", 0, deadline)).to.be.revertedWith(
        "Target must be greater than 0"
      );
      await expect(reliefChain.createCampaign("A", "Flood", "X", "d", "", TARGET, past)).to.be.revertedWith(
        "Deadline must be in the future"
      );
    });
  });

  // 3. Donation
  describe("Donation", function () {
    it("records a donation and emits DonationReceived", async function () {
      const id = await createSampleCampaign();
      await expect(reliefChain.donate(id, "Rahul", 500))
        .to.emit(reliefChain, "DonationReceived")
        .withArgs(id, "Rahul", 500n, 0n, (ts) => ts > 0n);

      const c = await reliefChain.getCampaign(id);
      expect(c.raisedAmount).to.equal(500n);
      expect(c.donorCount).to.equal(1n);
      expect(c.donationCount).to.equal(1n);

      const donations = await reliefChain.getDonations(id);
      expect(donations).to.have.length(1);
      expect(donations[0].donorName).to.equal("Rahul");
      expect(donations[0].amount).to.equal(500n);
    });

    it("rejects zero amount and empty donor name", async function () {
      const id = await createSampleCampaign();
      await expect(reliefChain.donate(id, "Rahul", 0)).to.be.revertedWith("Donation must be greater than 0");
      await expect(reliefChain.donate(id, "", 100)).to.be.revertedWith("Donor name must be 1-64 characters");
    });

    it("rejects donations after the deadline", async function () {
      const id = await createSampleCampaign();
      await time.increase(31 * 24 * 60 * 60);
      await expect(reliefChain.donate(id, "Rahul", 500)).to.be.revertedWith("Campaign has ended");
    });
  });

  // 4. Multiple donations
  describe("Multiple donations", function () {
    it("adds up totals and counts unique donors", async function () {
      const id = await createSampleCampaign();
      await reliefChain.donate(id, "Rahul", 5000);
      await reliefChain.donate(id, "Priya", 10000);
      await reliefChain.donate(id, "Rahul", 2500); // same donor again
      await reliefChain.donate(id, "Arjun", 25000);

      const c = await reliefChain.getCampaign(id);
      expect(c.raisedAmount).to.equal(42500n);
      expect(c.donorCount).to.equal(3n); // Rahul, Priya, Arjun
      expect(c.donationCount).to.equal(4n);
      expect(await reliefChain.totalDonationCount()).to.equal(4n);
      expect(await reliefChain.getDonations(id)).to.have.length(4);
    });

    it("marks campaign COMPLETED when target is reached and blocks further donations", async function () {
      const id = await createSampleCampaign(1000n);
      await reliefChain.donate(id, "Rahul", 600);
      await expect(reliefChain.donate(id, "Priya", 400))
        .to.emit(reliefChain, "CampaignStatusChanged")
        .withArgs(id, Status.Completed);
      expect((await reliefChain.getCampaign(id)).status).to.equal(Status.Completed);
      await expect(reliefChain.donate(id, "Arjun", 100)).to.be.revertedWith("Campaign is not active");
    });
  });

  // 5. Fund allocation
  describe("Fund allocation", function () {
    it("records allocations and updates available funds", async function () {
      const id = await createSampleCampaign();
      await reliefChain.donate(id, "Rahul", 100000);

      await expect(reliefChain.allocateFunds(id, Category.Food, 40000, "Food packets"))
        .to.emit(reliefChain, "FundsAllocated")
        .withArgs(id, Category.Food, 40000n, "Food packets", 0n, (ts) => ts > 0n);
      await reliefChain.allocateFunds(id, Category.Medicine, 20000, "Medical kits");
      await reliefChain.allocateFunds(id, Category.Shelter, 30000, "Tents");
      await reliefChain.allocateFunds(id, Category.Transportation, 10000, "Trucks");

      const c = await reliefChain.getCampaign(id);
      expect(c.allocatedAmount).to.equal(100000n);
      expect(await reliefChain.getAvailableFunds(id)).to.equal(0n);

      const allocations = await reliefChain.getAllocations(id);
      expect(allocations).to.have.length(4);
      expect(allocations[0].category).to.equal(Category.Food);
      expect(allocations[2].amount).to.equal(30000n);
    });
  });

  // 6. Unauthorized admin action
  describe("Access control", function () {
    it("blocks non-owners from all write functions", async function () {
      const id = await createSampleCampaign();
      const deadline = await deadlineInDays(30);
      const asOutsider = reliefChain.connect(outsider);

      await expect(
        asOutsider.createCampaign("Fake", "Flood", "X", "d", "", TARGET, deadline)
      ).to.be.revertedWithCustomError(reliefChain, "OwnableUnauthorizedAccount");
      await expect(asOutsider.donate(id, "Fake", 999999)).to.be.revertedWithCustomError(
        reliefChain,
        "OwnableUnauthorizedAccount"
      );
      await expect(asOutsider.allocateFunds(id, Category.Food, 1, "x")).to.be.revertedWithCustomError(
        reliefChain,
        "OwnableUnauthorizedAccount"
      );
      await expect(asOutsider.closeCampaign(id)).to.be.revertedWithCustomError(
        reliefChain,
        "OwnableUnauthorizedAccount"
      );
    });
  });

  // 7. Invalid campaign
  describe("Invalid campaign", function () {
    it("reverts for campaign IDs that do not exist", async function () {
      await createSampleCampaign();
      await expect(reliefChain.getCampaign(0)).to.be.revertedWith("Invalid campaign ID");
      await expect(reliefChain.getCampaign(99)).to.be.revertedWith("Invalid campaign ID");
      await expect(reliefChain.donate(99, "Rahul", 500)).to.be.revertedWith("Invalid campaign ID");
      await expect(reliefChain.allocateFunds(99, Category.Food, 1, "x")).to.be.revertedWith("Invalid campaign ID");
      await expect(reliefChain.closeCampaign(99)).to.be.revertedWith("Invalid campaign ID");
    });
  });

  // 8. Invalid allocation
  describe("Invalid allocation", function () {
    it("rejects allocations larger than available funds", async function () {
      const id = await createSampleCampaign();
      await reliefChain.donate(id, "Rahul", 1000);
      await expect(reliefChain.allocateFunds(id, Category.Food, 1001, "too much")).to.be.revertedWith(
        "Allocation exceeds available funds"
      );
      await reliefChain.allocateFunds(id, Category.Food, 700, "ok");
      // only 300 left now
      await expect(reliefChain.allocateFunds(id, Category.Shelter, 301, "too much")).to.be.revertedWith(
        "Allocation exceeds available funds"
      );
    });

    it("rejects zero allocations and invalid categories", async function () {
      const id = await createSampleCampaign();
      await reliefChain.donate(id, "Rahul", 1000);
      await expect(reliefChain.allocateFunds(id, Category.Food, 0, "x")).to.be.revertedWith(
        "Amount must be greater than 0"
      );
      await expect(reliefChain.allocateFunds(id, 9, 10, "x")).to.be.reverted; // not a valid enum value
    });
  });

  // 9. Campaign closing
  describe("Campaign closing", function () {
    it("closes a campaign, blocks donations, still allows allocation of remaining funds", async function () {
      const id = await createSampleCampaign();
      await reliefChain.donate(id, "Rahul", 5000);

      await expect(reliefChain.closeCampaign(id))
        .to.emit(reliefChain, "CampaignStatusChanged")
        .withArgs(id, Status.Closed);
      expect((await reliefChain.getCampaign(id)).status).to.equal(Status.Closed);

      await expect(reliefChain.donate(id, "Priya", 100)).to.be.revertedWith("Campaign is not active");
      await expect(reliefChain.closeCampaign(id)).to.be.revertedWith("Campaign already closed");

      await reliefChain.allocateFunds(id, Category.Food, 5000, "Remaining funds to food");
      expect(await reliefChain.getAvailableFunds(id)).to.equal(0n);
    });
  });
});
