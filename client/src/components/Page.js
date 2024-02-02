import React, { useState, useEffect } from "react";
import Account from "./Account";
import Received from "./Received";
import Send from "./Send";
import "./Page.css";
import { ethers } from "ethers";
import DataTransfer from "../artifacts/contracts/DataTransfer.sol/DataTransfer.json";

// Main component representing the application page
const Page = () => {
    // State variables for account, contract, provider, and loading status
    const [account, setAccount] = useState("");
    const [contract, setContract] = useState(null);
    const [provider, setProvider] = useState(null);
    const [loading, setLoading] = useState(false);

    // Ethereum smart contract address
    const contractAddress = "0x5d18A58aFb7F7De7FD02eE924632D906d6452B78";

    // Effect to initialize the Ethereum provider and set up event listeners
    useEffect(() => {
        const loadProvider = async () => {
            try {
                // Create Ethereum provider using Metamask
                const provider = new ethers.providers.Web3Provider(
                    window.ethereum
                );

                if (!provider) {
                    throw new Error("Metamask is not installed");
                }

                // Reload page on Ethereum chain change
                window.ethereum.on("chainChanged", () => {
                    window.location.reload();
                });

                // Handle Ethereum accounts change
                window.ethereum.on("accountsChanged", (accounts) => {
                    if (accounts.length === 0) {
                        // User disconnected their account
                        setAccount("");
                    } else {
                        // User switched or connected their account
                        connectWallet();
                    }
                });

                // Set up a signer and instantiate the contract
                const signer = provider.getSigner();
                const contract = new ethers.Contract(
                    contractAddress,
                    DataTransfer.abi,
                    signer
                );
                setContract(contract);
                setProvider(provider);
            } catch (error) {
                if (error.code === 4001) {
                    // User rejected the request
                    console.error("User rejected the connection request.");
                    // You can handle this by displaying a message to the user or taking other actions.
                } else {
                    // Handle other errors
                    console.error(
                        "Error connecting to Ethereum account:",
                        error
                    );
                }
            }
        };

        // Load Ethereum provider on component mount
        loadProvider();
    }, []);

    // Function to connect the wallet using Metamask
    const connectWallet = async () => {
        try {
            if (!window.ethereum) return alert("Please install MetaMask.");

            // Request accounts from Metamask
            const accounts = await window.ethereum.request({
                method: "eth_requestAccounts",
            });

            // Set the connected account
            setAccount(accounts[0]);
        } catch (error) {
            console.error(error);
        }
    };

    // JSX structure of the page component
    return (
        <div className={`Page ${loading ? "loading" : ""}`}>
            {/* Logo */}
            <div className="logo">
                <p>B-FILE</p>
            </div>
            {/* First layer containing information and account display */}
            <div className="firstLayer">
                <div className="information">
                    <p>TRANSFER</p>
                    <p>DATA</p>
                    <p>ACROSS</p>
                    <p>WORLD</p>
                </div>
                <Account account={account} />
            </div>
            {/* Second layer with a brief description and connect wallet button */}
            <div className="secondLayer">
                <p>Transfer data with Ethereum blockchain net.</p>
                <button onClick={connectWallet}>Connect Wallet</button>
            </div>
            {/* Third layer containing received and send components */}
            <div className="thirdLayer">
                <Received
                    contract={contract}
                    account={account}
                    provider={provider}
                />
                <Send
                    contract={contract}
                    account={account}
                    loading={loading}
                    setLoading={setLoading}
                />
            </div>
        </div>
    );
};

export default Page;
