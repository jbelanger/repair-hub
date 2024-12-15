require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.27",
  paths: {
    sources: "./src",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545",
  },
  sepolia: {
    url: "https://sepolia.infura.io/v3/cb216a419ae1451997d35de6e17afbb1", // Get from Infura
    accounts: ["97cb8679701b801e637b55a9e018903d08ccc1f59ff4550ac8eb87ae374bf468"] // Your wallet private key
  },
  },
};
