import { init } from "@web3-onboard/react";
import walletConnectModule from "@web3-onboard/walletconnect";
import coinbaseModule from "@web3-onboard/coinbase";
import injectedModule from "@web3-onboard/injected-wallets";

import PepperLogo from "../Pepper";
const RINKEBY_RPC_URL = `https://rinkeby.infura.io/v3/${process.env.NEXT_PUBLIC_INFURA_API_KEY}`;

const injected = injectedModule();
const coinbaseWallet = coinbaseModule();
const walletConnect = walletConnectModule();

const initOnboard = init({
  wallets: [injected, coinbaseWallet, walletConnect],
  chains: [
    {
      id: "0x4",
      token: "rETH",
      label: "Ethereum Rinkeby Testnet",
      rpcUrl: RINKEBY_RPC_URL,
    },
  ],

  appMetadata: {
    name: "LegalPeppers",
    icon: PepperLogo,
    description: "Legal Peppers Club minting website",
    recommendedInjectedWallets: [
      { name: "Coinbase", url: "https://wallet.coinbase.com/" },
      { name: "MetaMask", url: "https://metamask.io" },
    ],
    agreement: {
      version: "1.0.0",
      termsUrl: "https://www.blocknative.com/terms-conditions",
      privacyUrl: "https://www.blocknative.com/privacy-policy",
    },
    gettingStartedGuide: "https://blocknative.com",
    explore: "https://blocknative.com",
  },
});

export { initOnboard };
