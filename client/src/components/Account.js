import React from "react";
import "./Account.css";
import eth from "../assets/eth.png";

// Functional component representing the account information display
const Account = ({ account }) => {
    return (
        <div className="Account">
            {/* Ethereum icon */}
            <div className="ethIcon">
                <img src={eth} alt="eth" />
            </div>
            {/* Wallet information */}
            <div>
                {/* Display the account address or a message if no wallet is connected */}
                <p className="wallet">
                    {account ? account : "No wallet connected"}
                </p>
                {/* Indicate the cryptocurrency (Ethereum) */}
                <p className="ethereum">Ethereum</p>
            </div>
        </div>
    );
};

export default Account;
