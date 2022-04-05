require("@nomiclabs/hardhat-etherscan");
const hre = require("hardhat");
const { calculateMerkleRoot } = require("../utils/whitelist");

// This script is used to `deploy` the Smart Contract
async function main() {
  // Prepare constructor parameters for the contract
  // @param _payees The addresses that will receive the funds.
  // @param _shares The shares that each payee will receive.
  // @param _merkleroot The root of the merkle tree.
  // @param _maxBatchSize refers to how much a minter can mint at a time.
  const payees = [
    "0x988532153104a1cCE146512FC76a0C8e8d898b3e",
    "0x4c6909d0Fc32021A8563EbCa112e1e53dC7c8CAb",
    "0x4AcD27F41f544364a0d79FAaa2a144CcFb27F399",
  ];
  const shares = [45, 45, 10];
  const merkleRoot = calculateMerkleRoot();
  const maxBatchSize = 15;

  const nftFactory = await hre.ethers.getContractFactory("LegalPeppersClub");
  const nftContract = await nftFactory.deploy(
    payees,
    shares,
    merkleRoot,
    maxBatchSize
  );

  await nftContract.deployed();

  // When you get the deployed contract address, you can use it to verify the contract.
  // Before running the verify script, make sure to wait for the deploy transaction to be mined.
  console.log("Legal Peppers Club deployed to:", lpc.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
