// SPDX-License-Identifier: MIT
pragma solidity ^0.7.0;

contract VulnerableContract {
    address public owner;
    mapping(address => uint256) public balances;
    
    constructor() {
        owner = msg.sender;
    }
    
    // Vulnerability 1: Missing access control
    function setOwner(address newOwner) public {
        owner = newOwner;
    }
    
    // Vulnerability 2: Reentrancy vulnerability
    function withdraw(uint256 amount) public {
        require(balances[msg.sender] >= amount, "Insufficient balance");
        
        // External call before state change (vulnerable to reentrancy)
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");
        
        balances[msg.sender] -= amount; // State change after external call
    }
    
    // Vulnerability 3: Integer overflow (pre-0.8 Solidity)
    function deposit() public payable {
        balances[msg.sender] += msg.value; // Can overflow without SafeMath
    }
    
    // Vulnerability 4: tx.origin usage
    function transferOwnership(address newOwner) public {
        require(tx.origin == owner, "Only owner"); // Should use msg.sender
        owner = newOwner;
    }
    
    // Vulnerability 5: Timestamp dependence
    function timeBasedAction() public {
        require(block.timestamp % 2 == 0, "Can only call on even timestamps");
        // Some action here
    }
    
    // Vulnerability 6: Unchecked external call
    function sendEther(address payable recipient, uint256 amount) public {
        require(balances[msg.sender] >= amount, "Insufficient balance");
        recipient.send(amount); // Return value not checked
        balances[msg.sender] -= amount;
    }
    
    // Function with proper access control (should not be flagged)
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call");
        _;
    }
    
    function adminFunction() public onlyOwner {
        // Safe function with proper access control
    }
    
    // Fallback function
    receive() external payable {
        balances[msg.sender] += msg.value;
    }
} 