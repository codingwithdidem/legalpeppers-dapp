import Web3 from "web3";
const { MerkleTree } = require("merkletreejs");
const keccak256 = require("keccak256");
import whitelist from "./whitelist";

const web3 = new Web3(
  Web3.givenProvider ||
    `https://rinkeby.infura.io/v3/${process.env.NEXT_PUBLIC_INFURA_API_KEY}`
);

const peppersAbi = require("../artifacts/contracts/LPC.sol/LPC.json").abi;
const peppersAddres = "0xe23f887c5c1C7a2F7Ecb8945241479Bb55C39da1";

export const peppersContract = new web3.eth.Contract(peppersAbi, peppersAddres);

export const getSaleStatus = async () => {
  const status = await peppersContract.methods.status().call();
  return status;
};

// Mint Functions

export const publicMint = (amount) => {
  if (!window.ethereum.selectedAddress) {
    return {
      success: false,
      status: "To be able to mint, you need to connect your wallet",
    };
  }
  return peppersContract.methods.mint(amount).send({
    from: window.ethereum.selectedAddress,
    value: web3.utils.toWei(String(0.033 * amount), "ether"),
  });
};

export const presaleMint = async (amount) => {
  if (!window.ethereum.selectedAddress) {
    return {
      success: false,
      status: "To be able to mint, you need to connect your wallet",
    };
  }

  // Calculate merkle root from the whitelist array
  const leafNodes = whitelist.map((addr) => keccak256(addr));
  const merkleTree = new MerkleTree(leafNodes, keccak256, { sortPairs: true });
  const root = merkleTree.getRoot();

  const leaf = keccak256(window.ethereum.selectedAddress);
  const proof = merkleTree.getHexProof(leaf);

  // Verify Merkle Proof
  const isValid = merkleTree.verify(proof, leaf, root);

  if (!isValid) {
    return {
      success: false,
      status: "Invalid Merkle Proof - You are not on the whitelist",
    };
  }

  return peppersContract.methods.presaleMint(amount, proof).send({
    from: window.ethereum.selectedAddress,
    value: web3.utils.toWei(String(0.033 * amount), "ether"),
  });
};
