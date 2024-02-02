const hre = require("hardhat");

async function main() {
  const contract = await hre.ethers.getContractFactory("DataTransfer");
  const DataTransfer = await contract.deploy();

  await DataTransfer.waitForDeployment();

  console.log("Contract deployed to:", await DataTransfer.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
