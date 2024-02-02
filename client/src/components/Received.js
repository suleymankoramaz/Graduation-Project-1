import React, { useState, useEffect, useCallback } from "react";
import "./Received.css";
import { Pagination } from "antd";
import ReceivedFile from "./ReceivedFile";

// Component to display received files and manage pagination
const Received = ({ contract, account, provider }) => {
    // State to store received data, current page, and page size
    const [receivedData, setReceivedData] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 2;

    // Callback function to fetch data from the smart contract
    const getSendersData = useCallback(async () => {
        if (contract && account) {
            try {
                // Check if the account has received data
                let condition = await contract.checkAccount(account);
                if (condition) {
                    // Retrieve sender addresses
                    const senders = await contract.getSenders();

                    const receivedDataArray = [];

                    // Iterate through sender addresses to fetch received data
                    for (let i = 0; i < senders.length; i++) {
                        const senderAddress = senders[i];
                        const data = await contract.getReceivedFrom(
                            senderAddress
                        );

                        // Process received data in chunks of 6 (ipfsHash, aesKey[4], fileName)
                        for (let i = 0; i < data.length; i += 6) {
                            if (data[i] === "") {
                                break;
                            }
                            const ipfsHash = data[i];
                            const aesKey = [
                                data[i + 1],
                                data[i + 2],
                                data[i + 3],
                                data[i + 4],
                            ];
                            const fileName = data[i + 5];

                            receivedDataArray.push({
                                sender: senderAddress,
                                ipfsHash: ipfsHash,
                                aesKey: aesKey,
                                fileName: fileName,
                            });
                        }
                        setReceivedData(receivedDataArray);
                    }

                    setReceivedData(receivedDataArray);
                }
            } catch (error) {
                console.log(error);
            }
        }
    }, [contract, account]);

    // Effect to fetch data on component mount and clean up on unmount
    useEffect(() => {
        const fetchData = async () => {
            await getSendersData();
        };

        fetchData();

        // Cleanup mechanism: Clear receivedData when component is unmounted
        return () => {
            setReceivedData([]);
        };
    }, [account, getSendersData]);

    // Function to handle pagination page change
    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    // Function to render received files based on the current page
    const renderReceivedFiles = () => {
        const startIndex = (currentPage - 1) * pageSize;
        const endIndex = startIndex + pageSize;

        return receivedData
            .slice(startIndex, endIndex)
            .map((data, index) => (
                <ReceivedFile
                    key={index}
                    aesKey={data.aesKey}
                    ipfsHash={data.ipfsHash}
                    sender={data.sender}
                    fileName={data.fileName}
                    contract={contract}
                    account={account}
                    getSendersData={getSendersData}
                />
            ));
    };

    return (
        <div className="Received">
            <div className="receivedFiles">
                <h1>Received Files</h1>
                <button onClick={getSendersData}>REFRESH</button>
            </div>
            {/* Render received files */}
            {renderReceivedFiles()}

            {/* Display message if no received files */}
            {receivedData.length !== 0 ? null : <p>No received file.</p>}
            {/* Pagination component */}
            <Pagination
                current={currentPage}
                pageSize={pageSize}
                total={receivedData.length}
                onChange={handlePageChange}
                className="padding"
            />
        </div>
    );
};

export default Received;
