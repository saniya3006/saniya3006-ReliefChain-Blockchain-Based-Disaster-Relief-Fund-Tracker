require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config(); // reads .env in the project root (never committed)

const { SEPOLIA_RPC_URL, SEPOLIA_PRIVATE_KEY } = process.env;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.24",
    settings: { optimizer: { enabled: true, runs: 200 } },
  },
  networks: {
    // Local blockchain started with `npx hardhat node`
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
    // Public Ethereum test network used for hosting (see HOSTING.md)
    sepolia: {
      url: SEPOLIA_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com",
      chainId: 11155111,
      accounts: SEPOLIA_PRIVATE_KEY ? [SEPOLIA_PRIVATE_KEY] : [],
    },
  },
};
