const { MerkleTree } = require("merkletreejs");
const keccak256 = require("keccak256");

const whitelist = [
  "0x988532153104a1cCE146512FC76a0C8e8d898b3e",
  "0x4c6909d0Fc32021A8563EbCa112e1e53dC7c8CAb",
  "0x2932b7A2355D6fecc4b5c0B6BD44cC31df247a2e",
];

const calculateMerkleTree = () => {
  const leafNodes = whitelist.map((addr) => keccak256(addr));
  const merkleTree = new MerkleTree(leafNodes, keccak256, { sortPairs: true });

  return merkleTree;
};

const calculateMerkleRoot = () => {
  const merkleTree = calculateMerkleTree();
  const root = merkleTree.getRoot();

  return root;
};

module.exports = {
  whitelist,
  calculateMerkleTree,
  calculateMerkleRoot,
};
