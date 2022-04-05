require("@nomiclabs/hardhat-etherscan");
const hre = require("hardhat");
const { calculateMerkleRoot } = require("../utils/whitelist");

// This script is used to update the merkle root in the deployed contract.
// This is needed when the whitelist is updated.
async function main() {
  const nftFactory = await hre.ethers.getContractFactory("LegalPeppersClub");
  const nftContract = await nftFactory.attach(
    "0xdd65B3ee85e004c6d26659876EE2c11D50b10185" // Deployed contract address
  );

  // Re-calculate merkle root from the whitelist array.
  const root = calculateMerkleRoot();
  // Set the re-calculated merkle root to the contract.
  await nftContract.setMerkleRoot(root);

  console.log("Whitelist root set to:", root);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
