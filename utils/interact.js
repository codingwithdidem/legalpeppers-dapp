import Web3 from "web3";
const keccak256 = require("keccak256");
import { calculateMerkleTree } from "./whitelist";
import { config } from "../dapp.config";

const web3 = new Web3(
  Web3.givenProvider ||
    `https://rinkeby.infura.io/v3/${process.env.NEXT_PUBLIC_INFURA_API_KEY}`
);

const peppersAbi =
  require("../artifacts/contracts/LegalPeppersClub.sol/LegalPeppersClub.json").abi;
const peppersAddres = config.contractAddress;

export const peppersContract = new web3.eth.Contract(peppersAbi, peppersAddres);

export const getSaleStatus = async () => {
  const status = await peppersContract.methods.status().call();
  return status;
};

export const getNftPrice = async () => {
  const price = await peppersContract.methods.PRICE().call();
  const ethPrice = web3.utils.fromWei(price, "ether");

  return ethPrice;
};

export const getTotalSupply = async () => {
  const totalSupply = await peppersContract.methods.totalSupply().call();
  return totalSupply;
};

export const getMaxSupply = async () => {
  const maxSupply = await peppersContract.methods.maxSupply().call();
  return maxSupply;
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

  const merkleTree = calculateMerkleTree();
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
