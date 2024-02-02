import React from "react";
import "./ReceivedFile.css";
import CryptoJS from "crypto-js";
import axios from "axios";

// Component to display and download a received file
function ReceivedFile({ aesKey, ipfsHash, sender, fileName }) {
    // Function to download the file
    const downloadFile = async () => {
        try {
            // Convert string array to number array for AES key
            const aesKeyNumeric = aesKey.map(Number);

            // Fetch the encrypted data from IPFS
            const response = await axios.get(ipfsHash);

            // Check if the response status is successful
            if (response.status !== 200) {
                throw new Error(
                    `Failed to fetch the file. Status: ${response.status}`
                );
            }

            // Decode the base64-encoded ciphertext
            const encodedCiphertext = response.data;
            const key = CryptoJS.lib.WordArray.create(aesKeyNumeric);

            const chunkSize = 1024 * 1024 * 50;
            const uint8ArrayArray = [];

            // Decrypt the file in chunks
            for (let i = 0; i < encodedCiphertext.length; i += chunkSize) {
                const chunk = encodedCiphertext.slice(i, i + chunkSize);
                const decryptedChunk = CryptoJS.AES.decrypt(
                    { ciphertext: CryptoJS.enc.Base64.parse(chunk) },
                    key,
                    {
                        mode: CryptoJS.mode.ECB,
                        padding: CryptoJS.pad.Pkcs7,
                    }
                );

                // Convert decrypted chunk to Uint8Array
                const uint8Array = new Uint8Array(decryptedChunk.sigBytes);
                for (let i = 0; i < decryptedChunk.sigBytes; i++) {
                    uint8Array[i] =
                        (decryptedChunk.words[i >>> 2] >>> (24 - (i % 4) * 8)) &
                        0xff;
                }
                uint8ArrayArray.push(uint8Array);
            }

            // Concatenate Uint8Arrays
            let concatenatedUint8Array = new Uint8Array();
            for (let i = 0; i < uint8ArrayArray.length; i++) {
                concatenatedUint8Array = concatenateUint8Arrays(
                    concatenatedUint8Array,
                    uint8ArrayArray[i]
                );
            }

            // Function to concatenate Uint8Arrays
            function concatenateUint8Arrays(a, b) {
                const result = new Uint8Array(a.length + b.length);
                result.set(a);
                result.set(b, a.length);
                return result;
            }

            // Create a Blob from Uint8Array
            const blob = new Blob([concatenatedUint8Array], {
                type: "application/octet-stream",
            });

            // Create a link element, trigger download
            const link = document.createElement("a");
            link.href = window.URL.createObjectURL(blob);
            link.download = fileName;
            link.click();
        } catch (error) {
            console.error(
                "Error downloading or decrypting the file:",
                error.message
            );
        }
    };

    // Function to format the file name for display
    const formatFileName = () => {
        if (fileName.length < 20) return fileName;
        let formattedName =
            fileName.substring(0, 10) +
            "..." +
            fileName.substring(fileName.length - 10, fileName.length);

        // Replace newline characters with spaces
        formattedName = formattedName.replace(/[\r\n]+/g, " ");

        return formattedName;
    };

    // JSX structure of the component
    return (
        <div className="ReceivedFile">
            <div>Received from {sender}</div>
            <div className="file">
                <div>{formatFileName()}</div>
                <div className="buttons">
                    {/* Download button */}
                    <button type="primary" onClick={downloadFile}>
                        Download
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ReceivedFile;
