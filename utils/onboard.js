import Onboard from "@web3-onboard/core";
import { init } from "@web3-onboard/react";
import injectedModule from "@web3-onboard/injected-wallets";

const RINKEBY_RPC_URL = `https://rinkeby.infura.io/v3/${process.env.NEXT_PUBLIC_INFURA_API_KEY}`;

const injected = injectedModule();

const initOnboard = init({
  wallets: [injected],
  chains: [
    {
      id: "0x4",
      token: "rETH",
      label: "Ethereum Rinkeby Testnet",
      rpcUrl: RINKEBY_RPC_URL,
    },
  ],
  // appMetadata: {
  //   name: "Legal Peppers Club",
  //   icon: "<SVG_ICON_STRING>",
  //   logo: "<SVG_LOGO_STRING>",
  //   description: "Legal Peppers Club minting website",
  //   recommendedInjectedWallets: [
  //     { name: "Coinbase", url: "https://wallet.coinbase.com/" },
  //     { name: "MetaMask", url: "https://metamask.io" },
  //   ],
  // },
});

export { initOnboard };
