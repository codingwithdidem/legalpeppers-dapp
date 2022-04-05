import { useState, useEffect } from "react";
import { useConnectWallet, useSetChain, useWallets } from "@web3-onboard/react";

import { initOnboard } from "../utils/onboard";
import { config } from "../dapp.config";
import { pickStatusTitle } from "../utils/helpers";
import {
  peppersContract,
  getSaleStatus,
  publicMint,
  presaleMint,
  getNftPrice,
  getTotalSupply,
  getMaxSupply,
} from "../utils/interact";

export default function Mint() {
  const [{ wallet }, connect, disconnect] = useConnectWallet();
  const [{ chains, connectedChain, settingChain }, setChain] = useSetChain();
  const connectedWallets = useWallets();

  const [onboard, setOnboard] = useState(null);
  const [saleStatus, setSaleStatus] = useState(null);
  const [maxSupply, setMaxSupply] = useState(0);
  const [totalSupply, setTotalSupply] = useState(0);

  const [maxMintAmount, setMaxMintAmount] = useState(10);
  const [mintAmount, setMintAmount] = useState(1);
  const [status, setStatus] = useState(null);
  const [nftPrice, setNftPrice] = useState(0);
  const [isMinting, setIsMinting] = useState(false);

  useEffect(() => {
    const init = async () => {
      setSaleStatus(await getSaleStatus());
      setNftPrice(await getNftPrice());
      setTotalSupply(await getTotalSupply());
      setMaxSupply(await getMaxSupply());

      // Event Listeners
      addSaleStatusListener();
      addMintListener();
    };

    init();
  }, []);

  useEffect(() => {
    setOnboard(initOnboard);
  }, []);

  useEffect(() => {
    if (!connectedWallets.length) return;

    const connectedWalletsLabelArray = connectedWallets.map(
      ({ label }) => label
    );
    window.localStorage.setItem(
      "connectedWallets",
      JSON.stringify(connectedWalletsLabelArray)
    );
  }, [connectedWallets]);

  useEffect(() => {
    const previouslyConnectedWallets = JSON.parse(
      window.localStorage.getItem("connectedWallets")
    );

    if (previouslyConnectedWallets?.length) {
      async function setWalletFromLocalStorage() {
        await connect({
          autoSelect: previouslyConnectedWallets[0],
        });
      }
      setWalletFromLocalStorage();
    }
  }, [onboard, connect]);

  const incrementMintAmount = () => {
    if (mintAmount < maxMintAmount) {
      setMintAmount(mintAmount + 1);
    }
  };

  const decrementMintAmount = () => {
    if (mintAmount > 1) {
      setMintAmount(mintAmount - 1);
    }
  };

  const presaleMintHandler = () => {
    setIsMinting(true);

    presaleMint(mintAmount)
      .on("transactionHash", (txHash) => {
        setStatus({
          success: true,
          message: (
            <a
              href={`https://rinkeby.etherscan.io/tx/${txHash}`}
              target="_blank"
            >
              Minting {mintAmount} LPCs... Click to check out your transaction
              on Etherscan
            </a>
          ),
        });

        setIsMinting(false);
      })
      .on("error", (error) => {
        setStatus({
          success: false,
          message: error.message,
        });
        setIsMinting(false);
      });
  };

  const publicMintHandler = () => {
    setIsMinting(true);

    publicMint(mintAmount)
      .on("transactionHash", (txHash) => {
        setStatus({
          success: true,
          message: (
            <a
              href={`https://rinkeby.etherscan.io/tx/${txHash}`}
              target="_blank"
            >
              Minting {mintAmount} LPCs... Click to check out your transaction
              on Etherscan
            </a>
          ),
        });

        setIsMinting(false);
      })
      .on("error", (error) => {
        setStatus({
          success: false,
          message: error.message,
        });
        setIsMinting(false);
      });
  };

  const addSaleStatusListener = () => {
    peppersContract.events.StatusChanged({}, (err, event) => {
      if (err) {
        console.log(err);
        return;
      }

      const newStatus = event.returnValues.status;
      setSaleStatus(newStatus);

      console.log(`Status changed to ${pickStatusTitle(newStatus)}`);
    });
  };

  const addMintListener = () => {
    peppersContract.events.Transfer(
      {
        filter: {
          _to: window.ethereum.selectedAddress,
        },
      },
      (err, event) => {
        if (err) {
          console.log(err);
          return;
        }

        const { tokenId } = event.returnValues;

        console.log(event.returnValues);

        setStatus({
          success: true,
          message: (
            <a
              href={`https://rinkeby.rarible.com/token/${config.contractAddress}:${tokenId}?tab=details`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Minted {mintAmount} LPCs! Click to see your LPCs.
            </a>
          ),
        });
      }
    );
  };

  const isSalePaused = pickStatusTitle(saleStatus) === "Pending";

  return (
    <div className="min-h-screen h-full w-full overflow-hidden flex flex-col items-center justify-center">
      <div className="relative w-full md:w-[800px] h-full flex flex-col items-center justify-center">
        <div className="flex flex-col items-center justify-center h-full w-full px-2 py-2">
          <div className=" shadow-2xl z-10 md:max-w-3xl w-full bg-gray-900 bg-clip-padding bg-opacity-80 backdrop-filter filter backdrop-blur-sm py-4 rounded-md px-2 md:px-10 flex flex-col items-center">
            <h1 className="font-chalk uppercase font-bold text-3xl md:text-4xl bg-gradient-to-br  from-brand-white to-brand-green bg-clip-text text-transparent mt-3">
              {pickStatusTitle(saleStatus)}
            </h1>
            <h3 className=" font-sans text-sm text-pink-200 tracking-widest">
              {wallet?.accounts[0]?.address
                ? wallet?.accounts[0]?.address.slice(0, 8) +
                  "..." +
                  wallet?.accounts[0]?.address.slice(-4)
                : ""}
            </h3>

            <div className="flex flex-col md:flex-row md:space-x-14 w-full mt-10 md:mt-14">
              <div className="relative w-full">
                <div className="font-chalk z-10 absolute top-2 left-2 opacity-80 filter backdrop-blur-lg text-base px-4 py-2 bg-black border border-brand-purple rounded-md flex items-center justify-center text-white font-semibold">
                  <p>
                    <span className="text-brand-pink">{totalSupply}</span> /{" "}
                    {maxSupply}
                  </p>
                </div>

                <img
                  src="/images/lpc.png"
                  className="object-cover w-full sm:h-[280px] md:w-[250px] rounded-md"
                />
              </div>

              <div className="flex flex-col items-center w-full px-4 mt-16 md:mt-0">
                <div className="font-chalk flex items-center justify-between w-full">
                  <button
                    className={`shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:shadow-none hover:bg-brand-pink-light w-10 h-10 md:w-14 md:h-12 flex items-center  justify-center text-brand-background transition duration-100 ease-in-out font-chalk bg-brand-pink border-2 border-[rgba(0,0,0,1)] font-bold rounded-md`}
                    onClick={incrementMintAmount}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 md:h-8 md:w-8 text-gray-100"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                  </button>

                  <p className="flex items-center justify-center flex-1 grow text-center font-bold text-brand-pink text-3xl md:text-4xl">
                    {mintAmount}
                  </p>

                  <button
                    className={` shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:shadow-none hover:bg-brand-pink-light  w-10 h-10 md:w-14 md:h-12 flex items-center  justify-center text-brand-background transition duration-100 ease-in-out font-chalk bg-brand-pink border-2 border-[rgba(0,0,0,1)] font-bold rounded-md`}
                    onClick={decrementMintAmount}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 md:h-8 md:w-8 text-gray-100"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M18 12H6"
                      />
                    </svg>
                  </button>
                </div>

                <p className="text-sm text-pink-200 tracking-widest mt-3">
                  Max Mint Amount: {maxMintAmount}
                </p>

                <div className="border-t border-b py-4 mt-16 w-full">
                  <div className="w-full text-xl font-chalk flex items-center justify-between text-brand-yellow">
                    <p>Total</p>

                    <div className="flex items-center space-x-3">
                      <p>
                        {Number.parseFloat(nftPrice * mintAmount).toFixed(3)}{" "}
                        ETH
                      </p>{" "}
                      <span className="text-gray-400">+ GAS</span>
                    </div>
                  </div>
                </div>

                {/* Mint Button && Connect Wallet Button */}
                {wallet?.accounts[0]?.address ? (
                  <button
                    className={` ${
                      isSalePaused || isMinting
                        ? "bg-gray-900 cursor-not-allowed"
                        : "bg-brand-pink hover:bg-brand-pink-light"
                    } w-full transition duration-300 ease-in-out font-chalk mt-12  border-2 border-[rgba(0,0,0,1)] shadow-[0px_3px_0px_0px_rgba(0,0,0,1)] active:shadow-none px-6 py-3 rounded-md text-2xl text-white mx-4 tracking-wide uppercase`}
                    disabled={isSalePaused || isMinting}
                    onClick={
                      pickStatusTitle(saleStatus) === "Pre Sale"
                        ? presaleMintHandler
                        : publicMintHandler
                    }
                  >
                    {isSalePaused
                      ? "Sale is not active"
                      : isMinting
                      ? "Minting..."
                      : "Mint"}
                  </button>
                ) : (
                  <button
                    className="transition duration-300 ease-in-out font-chalk mt-12 w-full bg-brand-pink hover:bg-brand-pink-light border-2 border-[rgba(0,0,0,1)] shadow-[0px_3px_0px_0px_rgba(0,0,0,1)] active:shadow-none px-6 py-3 rounded-md text-2xl text-white mx-4 tracking-wide uppercase"
                    onClick={() => connect()}
                  >
                    Connect Wallet
                  </button>
                )}
              </div>
            </div>

            {/* Status */}
            {status && (
              <div
                className={`border ${
                  status.success ? "border-green-500" : "border-brand-pink-400 "
                } rounded-md text-start h-full px-4 py-4 w-full mx-auto mt-8 md:mt-4"`}
              >
                <p className="flex flex-col space-y-2 text-white text-sm md:text-base break-words ...">
                  {status.message}
                </p>
              </div>
            )}

            {/* Contract Address */}
            <div className="flex flex-col items-center mt-10 py-2 w-full">
              <h3 className=" font-chalk text-2xl text-brand-green uppercase mt-6">
                Contract Address
              </h3>
              <a
                href={`https://rinkeby.etherscan.io/address/${config.contractAddress}#readContract`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-300 mt-4"
              >
                <span className="break-all ...">{config.contractAddress}</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
