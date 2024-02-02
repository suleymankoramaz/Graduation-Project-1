require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
    solidity: "0.8.9",
    networks: {
        sepolia: {
            url: "https://rpc.sepolia.org",
            accounts: [
                "976228d5aaa3a103bc6b8b519a0a61561b68da3e9fc941ff35303d046e251300",
            ],
        },
    },
    paths: {
        artifacts: "./client/src/artifacts",
    },
};
