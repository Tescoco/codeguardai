// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title VulnerableBank - A deliberately vulnerable smart contract for testing
 * @dev This contract contains multiple security vulnerabilities for demonstration
 * WARNING: This is for educational purposes only - DO NOT deploy to mainnet
 */
contract VulnerableBank {
    mapping(address => uint256) public balances;
    mapping(address => bool) public isAdmin;
    address public owner;
    uint256 public totalSupply;
    uint256 public withdrawalLimit = 1000 ether;
    
    event Deposit(address indexed user, uint256 amount);
    event Withdrawal(address indexed user, uint256 amount);
    event AdminAdded(address indexed admin);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _;
    }
    
    constructor() {
        owner = msg.sender;
        isAdmin[msg.sender] = true;
    }
    
    // VULNERABILITY 1: Reentrancy Attack
    function withdraw(uint256 _amount) public {
        require(balances[msg.sender] >= _amount, "Insufficient balance");
        
        // External call before state change - VULNERABLE TO REENTRANCY
        (bool success, ) = msg.sender.call{value: _amount}("");
        require(success, "Transfer failed");
        
        // State change after external call - TOO LATE!
        balances[msg.sender] -= _amount;
        totalSupply -= _amount;
        
        emit Withdrawal(msg.sender, _amount);
    }
    
    // VULNERABILITY 2: Integer Overflow (if using older Solidity versions)
    function deposit() public payable {
        // In older versions without automatic overflow protection
        balances[msg.sender] += msg.value;
        totalSupply += msg.value;
        
        emit Deposit(msg.sender, msg.value);
    }
    
    // VULNERABILITY 3: Access Control Issues
    function emergencyWithdraw(address _user, uint256 _amount) public {
        // Missing access control - anyone can call this!
        require(balances[_user] >= _amount, "Insufficient balance");
        
        balances[_user] -= _amount;
        payable(_user).transfer(_amount);
    }
    
    // VULNERABILITY 4: Unchecked External Call
    function batchTransfer(address[] memory _recipients, uint256[] memory _amounts) public {
        require(_recipients.length == _amounts.length, "Array length mismatch");
        
        for (uint256 i = 0; i < _recipients.length; i++) {
            require(balances[msg.sender] >= _amounts[i], "Insufficient balance");
            
            balances[msg.sender] -= _amounts[i];
            balances[_recipients[i]] += _amounts[i];
            
            // Unchecked external call - doesn't handle failure
            _recipients[i].call{value: _amounts[i]}("");
        }
    }
    
    // VULNERABILITY 5: Timestamp Dependence
    function timeLimitedWithdraw(uint256 _amount) public {
        require(balances[msg.sender] >= _amount, "Insufficient balance");
        
        // Vulnerable to miner manipulation
        require(block.timestamp % 2 == 0, "Can only withdraw on even timestamps");
        
        balances[msg.sender] -= _amount;
        payable(msg.sender).transfer(_amount);
    }
    
    // VULNERABILITY 6: Gas Limit DoS
    function payoutAll(address[] memory _users) public onlyOwner {
        // Unbounded loop - can run out of gas
        for (uint256 i = 0; i < _users.length; i++) {
            if (balances[_users[i]] > 0) {
                uint256 amount = balances[_users[i]];
                balances[_users[i]] = 0;
                payable(_users[i]).transfer(amount);
            }
        }
    }
    
    // VULNERABILITY 7: Front-running Vulnerability
    function competitiveWithdraw() public {
        uint256 prize = address(this).balance / 10; // 10% of contract balance
        
        // First caller gets the prize - vulnerable to front-running
        require(balances[msg.sender] > 0, "No balance");
        
        balances[msg.sender] = 0;
        payable(msg.sender).transfer(prize);
    }
    
    // VULNERABILITY 8: Weak Access Control
    function addAdmin(address _newAdmin) public {
        // Should have proper access control
        require(isAdmin[msg.sender], "Not an admin");
        isAdmin[_newAdmin] = true;
        
        emit AdminAdded(_newAdmin);
    }
    
    // VULNERABILITY 9: Logic Error in Calculation
    function calculateInterest(uint256 _principal, uint256 _rate, uint256 _time) public pure returns (uint256) {
        // Logic error: should divide by 100 for percentage
        return (_principal * _rate * _time) / 365;
    }
    
    // VULNERABILITY 10: Unsafe Delegation
    function adminCall(address _target, bytes memory _data) public {
        require(isAdmin[msg.sender], "Not an admin");
        
        // Dangerous delegation - admin can call any function
        (bool success, ) = _target.call(_data);
        require(success, "Call failed");
    }
    
    // VULNERABILITY 11: State Variable Default Visibility
    uint256 secretValue; // Should be private, but defaults to internal
    
    // VULNERABILITY 12: Uninitialized Storage Pointer (in older versions)
    function dangerousFunction() public {
        // This pattern was vulnerable in older Solidity versions
        uint256[] storage someArray;
        someArray.push(1);
    }
    
    // VULNERABILITY 13: tx.origin Usage
    function restrictedFunction() public {
        // tx.origin is vulnerable to phishing attacks
        require(tx.origin == owner, "Not authorized");
        
        // Some privileged operation
        withdrawalLimit = 10000 ether;
    }
    
    // VULNERABILITY 14: Incorrect Event Data
    function transferWithEvent(address _to, uint256 _amount) public {
        require(balances[msg.sender] >= _amount, "Insufficient balance");
        
        balances[msg.sender] -= _amount;
        balances[_to] += _amount;
        
        // Event logs wrong sender address
        emit Transfer(address(this), _to, _amount);
    }
    
    // VULNERABILITY 15: Missing Zero Address Check
    function setOwner(address _newOwner) public onlyOwner {
        // Should check for zero address
        owner = _newOwner;
    }
    
    // Additional event for vulnerability demonstration
    event Transfer(address indexed from, address indexed to, uint256 value);
    
    // Function to receive Ether
    receive() external payable {
        deposit();
    }
    
    // View functions
    function getBalance(address _user) public view returns (uint256) {
        return balances[_user];
    }
    
    function getContractBalance() public view returns (uint256) {
        return address(this).balance;
    }
}