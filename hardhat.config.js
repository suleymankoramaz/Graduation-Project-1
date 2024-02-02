require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
    solidity: "0.8.9",
    networks: {
        sepolia: {
            url: "https://rpc.sepolia.org",
            accounts: ["YOUR_ACCOUNT_PRIVATE_KEY"],
        },
    },
    paths: {
        artifacts: "./client/src/artifacts",
    },
};
