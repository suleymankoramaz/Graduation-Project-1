import React, { useEffect } from "react";
import "./Send.css";
import { useState } from "react";
import axios from "axios";
import CryptoJS from "crypto-js";
import { useDropzone } from "react-dropzone";

const Send = ({ contract, account, loading, setLoading }) => {
    // State to manage text input, file, AES key, upload progress, and upload time
    const [textInput, setTextInput] = useState("");
    const [file, setFile] = useState(null);
    const [aesKey, setAesKey] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadTime, setUploadTime] = useState(null);

    // Effect to reset state when the account changes
    useEffect(() => {
        setTextInput("");
        setFile(null);
        setAesKey(null);
        setUploadProgress(0);
        setUploadTime(null);
    }, [account]);

    // Function to handle reading and encrypting chunks of a file
    const handleFileReader = async (event) => {
        const uploadedFile = event[0];

        if (uploadedFile) {
            setLoading(true);

            const chunkSize = 1024 * 1024 * 50;
            let offset = 0;
            const aes = CryptoJS.lib.WordArray.random(16);

            // Convert AES key to string for display
            const aesKeyString = aes.words.map((word) => "" + word);

            setAesKey(aesKeyString);

            const readChunk = async (file, offset, size) => {
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        resolve(new Uint8Array(event.target.result));
                    };
                    reader.onerror = (error) => reject(error);
                    reader.readAsArrayBuffer(file.slice(offset, offset + size));
                });
            };

            const encryptChunk = (chunk, key) => {
                const wordArrayContent = CryptoJS.lib.WordArray.create(chunk);
                const encryptedData = CryptoJS.AES.encrypt(
                    wordArrayContent,
                    key,
                    {
                        mode: CryptoJS.mode.ECB,
                        padding: CryptoJS.pad.Pkcs7,
                    }
                );
                return encryptedData.toString();
            };

            const encryptAndUploadChunks = async () => {
                const fileChunks = [];
                while (offset < uploadedFile.size) {
                    const chunk = await readChunk(
                        uploadedFile,
                        offset,
                        chunkSize
                    );
                    const encryptedChunk = encryptChunk(chunk, aes);
                    fileChunks.push(encryptedChunk);
                    offset += chunkSize;
                }

                const encryptedFile = fileChunks.join("");

                setFile({
                    data: encryptedFile,
                    fileName: uploadedFile.name,
                });
            };

            try {
                await encryptAndUploadChunks();
            } catch (error) {
                console.error("Error encrypting/uploading file:", error);
            } finally {
                setLoading(false); // Reset loading state when upload completes (success or error)
            }
        }
    };

    // Dropzone configuration
    const { getRootProps, getInputProps } = useDropzone({
        onDrop: handleFileReader,
        acceptedFiles: "*",
        maxFiles: 1,
    });

    // Function to handle text input change
    const handleTextChange = (e) => {
        setTextInput(e.target.value);
    };

    // Function to handle form submission
    const handleSubmit = async (e) => {
        try {
            e.preventDefault();
            if (!file) {
                alert("Please upload a file");
                return;
            }

            if (textInput.toLowerCase().localeCompare(account) === 0) {
                alert("You cannot send data to yourself :)");
                return;
            }

            if (textInput === "") {
                alert("Please enter a MetaMask address");
                return;
            }

            // Check if the textInput is a valid Ethereum address
            const isValidAddress = /^0x[a-fA-F0-9]{40}$/.test(textInput);

            if (!isValidAddress) {
                alert("Invalid MetaMask address");
                return;
            }

            // Create FormData to append the encrypted data as a Blob
            const formData = new FormData();
            formData.append(
                "file",
                new Blob([file.data], { type: "application/octet-stream" }),
                file.fileName
            );

            const startTime = new Date().getTime();

            // Upload encrypted file to Pinata IPFS service
            const resFile = await axios({
                method: "post",
                url: "https://api.pinata.cloud/pinning/pinFileToIPFS",
                data: formData,
                headers: {
                    pinata_api_key: `YOUR_API_KEY`,
                    pinata_secret_api_key: `YOUR_SECRET_API_KEY`,
                    "Content-Type": "multipart/form-data",
                },
                onUploadProgress: (progressEvent) => {
                    const progress = Math.round(
                        (progressEvent.loaded / progressEvent.total) * 100
                    );
                    setUploadProgress(progress);
                },
            });

            if (resFile.status === 400) {
                alert("Failed to upload file");
                setUploadProgress(0);
                setUploadTime(null);
                return;
            }
            const endTime = new Date().getTime();
            const elapsedTime = (endTime - startTime) / 1000; // in seconds

            setUploadTime(elapsedTime.toFixed(2)); // Keep two decimal places

            // Construct the image hash from Pinata IPFS
            const ImgHash = `https://gateway.pinata.cloud/ipfs/${resFile.data.IpfsHash}`;

            // Call the contract to send the file information
            await contract.sendFile(textInput, ImgHash, aesKey, file.fileName);

            alert(
                "Successfully sent file, please wait for the transaction to be mined..."
            );

            // Reset state after successful submission
            setFile(null);
            setAesKey(null);
            setTextInput("");
            setUploadProgress(0);
            setUploadTime(null);
        } catch (error) {
            if (error.code === "ACTION_REJECTED") {
                alert("Transaction rejected");
                setUploadProgress(0);
                setUploadTime(null);
            }
        }
    };

    // Function to handle removing uploaded file
    const handleRemoveFile = () => {
        setFile(null);
        setAesKey(null);
    };

    // Function to stop uploading and reset state
    const stopUploading = () => {
        setLoading(false);
        setFile(null);
        setAesKey(null);
    };

    return (
        <div className="Send">
            <form onSubmit={handleSubmit}>
                {/* Input field for recipient address */}
                <div className="addressTo">
                    <input
                        type="text"
                        id="textInput"
                        value={textInput}
                        onChange={handleTextChange}
                        placeholder="Address to"
                    />
                </div>
                {/* Dropzone for file upload */}
                <div {...getRootProps()}>
                    <input {...getInputProps()} />
                    <button type="button" className="uploadButton">
                        Upload/Drop
                    </button>
                </div>

                {/* File upload, loading, and progress display */}
                <div className="submit">
                    <div className="upload">
                        <div className="uploadedFile">
                            <p>{file ? file.fileName : "No file uploaded"}</p>
                            {file && (
                                <div>
                                    <button
                                        type="button"
                                        onClick={handleRemoveFile}
                                        className="removeButton"
                                    >
                                        Remove File
                                    </button>
                                </div>
                            )}
                        </div>
                        {/* Loading state and progress */}
                        {loading ? (
                            <div className="loadingPopup">
                                <p>Uploading...</p>
                                <button type="button" onClick={stopUploading}>
                                    Cancel
                                </button>
                            </div>
                        ) : (
                            uploadProgress > 0 && (
                                <div className="uploadProcess">
                                    <p>{`Uploading: ${uploadProgress}%`}</p>
                                    {uploadTime && (
                                        <div>
                                            <p>Time: {uploadTime} seconds</p>
                                            <p>Please confirm transaction..</p>
                                        </div>
                                    )}
                                </div>
                            )
                        )}
                    </div>

                    <hr />
                    {/* Submit button */}
                    <button type="submit" className="sendButton">
                        Send Data
                    </button>
                </div>
            </form>
        </div>
    );
};

export default Send;
