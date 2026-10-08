// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title  ReliefChain - Blockchain-Based Disaster Relief Fund Tracker
 * @notice A tamper-evident public ledger of disaster-relief donations and of
 *         how the collected money is allocated (Food, Medicine, Shelter ...).
 *
 *         Architecture:  User -> React website -> FastAPI backend -> this contract
 *
 *         The FastAPI backend holds the relief organization's wallet, which is
 *         the OWNER of this contract. Only the owner can write records, so
 *         outsiders cannot insert fake donations or fake allocations.
 *         Anyone can READ every record, and every write is a blockchain
 *         transaction with its own transaction hash that can be verified.
 *
 *         Amounts are stored in whole Indian Rupees (INR). The actual rupee
 *         payment would be collected by a payment gateway in a real system;
 *         the blockchain stores the permanent record of it.
 *
 * @dev    Blockchain does NOT prove that the organization is genuine. That is
 *         an off-chain (administrative) verification process. It only
 *         guarantees that recorded activity cannot be secretly edited or
 *         deleted afterwards.
 */
contract ReliefChain is Ownable {
    // ------------------------------------------------------------------
    // Data types
    // ------------------------------------------------------------------

    enum Status {
        Active,     // 0 - accepting donations
        Completed,  // 1 - target reached (set automatically)
        Closed      // 2 - closed by admin
    }

    enum Category {
        Food,           // 0
        Medicine,       // 1
        Shelter,        // 2
        Transportation, // 3
        Other           // 4
    }

    struct Campaign {
        uint256 id;
        string name;
        string disasterType;     // e.g. "Flood", "Earthquake"
        string location;
        string description;
        string imageUrl;         // short path only - the image file itself is NOT stored on-chain
        uint256 targetAmount;    // INR
        uint256 raisedAmount;    // INR, total donated
        uint256 allocatedAmount; // INR, total allocated to relief categories
        uint256 deadline;        // unix timestamp
        uint256 createdAt;       // unix timestamp
        address creator;
        Status status;
        uint256 donorCount;      // number of UNIQUE donors
        uint256 donationCount;   // number of donation transactions
    }

    struct Donation {
        string donorName;
        uint256 amount;    // INR
        uint256 timestamp;
    }

    struct Allocation {
        Category category;
        uint256 amount;    // INR
        string note;       // e.g. "5,000 food packets from XYZ Suppliers"
        uint256 timestamp;
    }

    // ------------------------------------------------------------------
    // Storage
    // ------------------------------------------------------------------

    uint256 public campaignCount;
    uint256 public totalDonationCount; // across all campaigns

    mapping(uint256 => Campaign) private campaigns;               // id => campaign (ids start at 1)
    mapping(uint256 => Donation[]) private campaignDonations;     // id => donations
    mapping(uint256 => Allocation[]) private campaignAllocations;  // id => allocations

    // id => keccak256(donor name) => has donated before?
    // The name is HASHED to a fixed 32-byte key, which is cheaper to store
    // and compare than a full string. Used to count unique donors.
    mapping(uint256 => mapping(bytes32 => bool)) private hasDonated;

    // ------------------------------------------------------------------
    // Events - a permanent, searchable log. The backend reads these to find
    // the transaction hash of every donation / allocation.
    // ------------------------------------------------------------------

    event CampaignCreated(uint256 indexed campaignId, string name, uint256 targetAmount, uint256 deadline);
    event DonationReceived(uint256 indexed campaignId, string donorName, uint256 amount, uint256 donationIndex, uint256 timestamp);
    event FundsAllocated(uint256 indexed campaignId, Category category, uint256 amount, string note, uint256 allocationIndex, uint256 timestamp);
    event CampaignStatusChanged(uint256 indexed campaignId, Status status);

    // ------------------------------------------------------------------
    // Modifiers
    // ------------------------------------------------------------------

    /// SECURITY: every function that takes a campaign id checks it exists,
    /// so no record can be attached to a campaign that was never created.
    modifier validCampaign(uint256 _campaignId) {
        require(_campaignId > 0 && _campaignId <= campaignCount, "Invalid campaign ID");
        _;
    }

    /// The deployer (relief organization / backend wallet) becomes the owner.
    constructor() Ownable(msg.sender) {}

    // ------------------------------------------------------------------
    // Write functions (onlyOwner)
    // ------------------------------------------------------------------

    /**
     * @notice Create a new disaster relief campaign.
     * SECURITY: onlyOwner - random wallets must not be able to create fake
     * campaigns under the ReliefChain name.
     */
    function createCampaign(
        string memory _name,
        string memory _disasterType,
        string memory _location,
        string memory _description,
        string memory _imageUrl,
        uint256 _targetAmount,
        uint256 _deadline
    ) external onlyOwner returns (uint256) {
        // Validation: no empty / meaningless campaigns.
        require(bytes(_name).length > 0, "Name is required");
        require(_targetAmount > 0, "Target must be greater than 0");
        require(_deadline > block.timestamp, "Deadline must be in the future");

        campaignCount++;
        uint256 id = campaignCount;

        Campaign storage c = campaigns[id];
        c.id = id;
        c.name = _name;
        c.disasterType = _disasterType;
        c.location = _location;
        c.description = _description;
        c.imageUrl = _imageUrl;
        c.targetAmount = _targetAmount;
        c.deadline = _deadline;
        c.createdAt = block.timestamp;
        c.creator = msg.sender;
        c.status = Status.Active;

        emit CampaignCreated(id, _name, _targetAmount, _deadline);
        return id;
    }

    /**
     * @notice Record a donation to a campaign.
     * SECURITY:
     *  - onlyOwner: only the official backend can record donations, so
     *    nobody can inflate a campaign's total with fake entries.
     *  - amount > 0 and a donor name are required (no empty records).
     *  - campaign must be ACTIVE and not past its deadline.
     */
    function donate(uint256 _campaignId, string calldata _donorName, uint256 _amount)
        external
        onlyOwner
        validCampaign(_campaignId)
    {
        Campaign storage c = campaigns[_campaignId];

        require(_amount > 0, "Donation must be greater than 0");
        require(bytes(_donorName).length > 0 && bytes(_donorName).length <= 64, "Donor name must be 1-64 characters");
        require(c.status == Status.Active, "Campaign is not active");
        require(block.timestamp <= c.deadline, "Campaign has ended");

        bytes32 donorKey = keccak256(bytes(_donorName));
        if (!hasDonated[_campaignId][donorKey]) {
            hasDonated[_campaignId][donorKey] = true;
            c.donorCount++; // first donation from this donor
        }

        c.raisedAmount += _amount;
        c.donationCount++;
        totalDonationCount++;

        campaignDonations[_campaignId].push(Donation(_donorName, _amount, block.timestamp));
        uint256 index = campaignDonations[_campaignId].length - 1;

        emit DonationReceived(_campaignId, _donorName, _amount, index, block.timestamp);

        // Automatic status: target reached => COMPLETED
        if (c.raisedAmount >= c.targetAmount) {
            c.status = Status.Completed;
            emit CampaignStatusChanged(_campaignId, Status.Completed);
        }
    }

    /**
     * @notice Record how part of a campaign's funds is used (Food, Medicine ...).
     * SECURITY:
     *  - onlyOwner: only the relief organization can record allocations.
     *  - amount <= available: you can never allocate more than was donated
     *    and not yet allocated, i.e. the organization cannot claim to have
     *    spent money that it never received.
     */
    function allocateFunds(
        uint256 _campaignId,
        Category _category,
        uint256 _amount,
        string calldata _note
    ) external onlyOwner validCampaign(_campaignId) {
        require(_amount > 0, "Amount must be greater than 0");

        Campaign storage c = campaigns[_campaignId];
        uint256 available = c.raisedAmount - c.allocatedAmount;
        require(_amount <= available, "Allocation exceeds available funds");

        c.allocatedAmount += _amount;
        campaignAllocations[_campaignId].push(Allocation(_category, _amount, _note, block.timestamp));
        uint256 index = campaignAllocations[_campaignId].length - 1;

        emit FundsAllocated(_campaignId, _category, _amount, _note, index, block.timestamp);
    }

    /**
     * @notice Close a campaign so it stops accepting donations.
     *         Already-collected funds can still be allocated afterwards.
     * SECURITY: onlyOwner - outsiders cannot shut down a campaign.
     */
    function closeCampaign(uint256 _campaignId) external onlyOwner validCampaign(_campaignId) {
        Campaign storage c = campaigns[_campaignId];
        require(c.status != Status.Closed, "Campaign already closed");
        c.status = Status.Closed;
        emit CampaignStatusChanged(_campaignId, Status.Closed);
    }

    // ------------------------------------------------------------------
    // Read-only (view) functions - free, no transaction needed
    // ------------------------------------------------------------------

    function getCampaign(uint256 _campaignId) external view validCampaign(_campaignId) returns (Campaign memory) {
        return campaigns[_campaignId];
    }

    function getAllCampaigns() external view returns (Campaign[] memory) {
        Campaign[] memory list = new Campaign[](campaignCount);
        for (uint256 i = 0; i < campaignCount; i++) {
            list[i] = campaigns[i + 1];
        }
        return list;
    }

    function getDonations(uint256 _campaignId) external view validCampaign(_campaignId) returns (Donation[] memory) {
        return campaignDonations[_campaignId];
    }

    function getAllocations(uint256 _campaignId) external view validCampaign(_campaignId) returns (Allocation[] memory) {
        return campaignAllocations[_campaignId];
    }

    /// Funds donated but not yet allocated.
    function getAvailableFunds(uint256 _campaignId) external view validCampaign(_campaignId) returns (uint256) {
        Campaign storage c = campaigns[_campaignId];
        return c.raisedAmount - c.allocatedAmount;
    }
}
