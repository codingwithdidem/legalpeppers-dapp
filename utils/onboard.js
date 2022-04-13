import { init } from "@web3-onboard/react";
import walletLinkModule from "@web3-onboard/walletlink";
import walletConnectModule from "@web3-onboard/walletconnect";
import injectedModule from "@web3-onboard/injected-wallets";

const RINKEBY_RPC_URL = `https://rinkeby.infura.io/v3/${process.env.NEXT_PUBLIC_INFURA_API_KEY}`;

const injected = injectedModule();
const walletLink = walletLinkModule();
const walletConnect = walletConnectModule();

const initOnboard = init({
  wallets: [injected, walletLink, walletConnect],
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
    icon: "<svg><svg/>",
    description: "Legal Peppers Club minting website",
    recommendedInjectedWallets: [
      { name: "Coinbase", url: "https://wallet.coinbase.com/" },
      { name: "MetaMask", url: "https://metamask.io" },
    ],
  },
});

export { initOnboard };
