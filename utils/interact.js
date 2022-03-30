import Web3 from "web3";

const web3 = new Web3(
  Web3.givenProvider ||
    `https://rinkeby.infura.io/v3/${process.env.NEXT_PUBLIC_INFURA_API_KEY}`
);

const peppersAbi = require("../artifacts/contracts/LPC.sol/LPC.json").abi;
const peppersAddres = "0xe23f887c5c1C7a2F7Ecb8945241479Bb55C39da1";

const peppersContract = new web3.eth.Contract(peppersAbi, peppersAddres);

const saleStatuses = {
  0: "Pending",
  1: "Pre Sale",
  2: "Public Sale",
  3: "Sold Out",
};

export const onSaleStatusChange = () => {
  peppersContract.events
    .StatusChanged()
    .on("data", (event) => {
      console.log(event.returnValues);
    })
    .on("error", (error) => {
      console.log(error);
    });
};

// let's fetch a balance
web3.eth.getBalance(
  "0x933572D5F83B00A998102b7bf1a99c0f197E685B",
  async (err, result) => {
    if (err) {
      console.log(err);
      return;
    }
    let balance = web3.utils.fromWei(result, "ether");
    console.log(balance + " ETH");
  }
);

export const getSaleStatus = async () => {
  const status = await peppersContract.methods.status().call();

  return saleStatuses[status];
};
