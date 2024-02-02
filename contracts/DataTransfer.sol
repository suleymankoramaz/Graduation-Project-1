// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.0;

// Contract to facilitate data transfer between accounts
contract DataTransfer {
    // Array to store instances of Account contracts
    Account[] private accounts;

    // Function to create a new account or retrieve an existing one
    function createAccount(address account) public returns (Account) {
        if (!checkAccount(account)) {
            Account newAccount = new Account(account);
            accounts.push(newAccount);
            return newAccount;
        } else {
            return getAccount(account);
        }
    }

    // Function to check if an account exists
    function checkAccount(address account) view public returns (bool) {
        for (uint256 i = 0; i < accounts.length; i++) {
            if (accounts[i].getAddress() == account) {
                return true;
            }
        }
        return false;
    }

    // Function to retrieve an account by its address
    function getAccount(address account) private view returns (Account) {
        if (checkAccount(account)) {
            for (uint256 i = 0; i < accounts.length; i++) {
                if (accounts[i].getAddress() == account) {
                    return accounts[i];
                }
            }
        }

        revert ("Account does not exist");
    }

    // Function to send a file to an account
    function sendFile(address account, string memory IPFSHash, string[] memory aesKey, string memory fileName) public {
        createAccount(account);
        Account receiver = getAccount(account);
        receiver.addReceived(msg.sender, IPFSHash, aesKey, fileName);
    }

    // Function to retrieve the addresses of all accounts
    function getAccounts() view public returns (address[] memory) {
        address[] memory rtn = new address[](accounts.length);
        for (uint256 i = 0; i < accounts.length; i++) {
            rtn[i] = accounts[i].getAddress();
        }
        return rtn;
    }

    // Function to retrieve the addresses of senders for the caller
    function getSenders() public view returns (address[] memory) {
        return getAccount(msg.sender).getSenders();
    }

    // Function to retrieve received data from a specific sender for the caller
    function getReceivedFrom(address account) public view returns (string[] memory) {
        return getAccount(msg.sender).getReceived(account);
    }

}

// Contract to manage ownership
contract Ownable {
    address public owner;

    // Modifier to restrict access to only the owner
    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can call this function");
        _;
    }

    // Constructor to set the owner to the deployer
    constructor() {
        owner = msg.sender;
    }
}

// Contract to represent an account
contract Account is Ownable {

    address public accountAddress;
    mapping(address => string[]) private received;
    address[] private uniqueSenders;

    // Constructor to set the account address
    constructor(address _accountAddress) {
        accountAddress = _accountAddress;
    }

    // Function to retrieve the account address
    function getAddress() view public returns (address) {
        return accountAddress;
    }

    // Function to add received data, restricted to the owner
    function addReceived(address sender, string memory IPFSHash, string[] memory aesKey, string memory fileName) public onlyOwner {
        received[sender].push(IPFSHash);
        for(uint256 i = 0; i < aesKey.length; i++) {
            received[sender].push(aesKey[i]);
        }
        received[sender].push(fileName);

        // Add the sender to the uniqueSenders array if not already added
        updateUniqueSenders(sender);
    }

    // Function to update the uniqueSenders array
    function updateUniqueSenders(address sender) private {
        // Add the sender to the uniqueSenders array if not already added
        if (!containsSender(sender)) {
            uniqueSenders.push(sender);
        }
    }

    // Function to check if a sender is already in the uniqueSenders array
    function containsSender(address sender) view private returns (bool) {
        for (uint256 i = 0; i < uniqueSenders.length; i++) {
            if (uniqueSenders[i] == sender) {
                return true;
            }
        }
        return false;
    }

    // Function to retrieve senders, restricted to the owner
    function getSenders() view public onlyOwner returns (address[] memory) {
        return uniqueSenders;
    }

    // Function to retrieve received data from a specific sender, restricted to the owner
    function getReceived(address sender) view public onlyOwner returns (string[] memory) {
        return received[sender];
    }

}
