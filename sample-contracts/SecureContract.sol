// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title SecureContract
 * @dev A secure smart contract demonstrating best practices
 * @notice This contract implements proper access controls and security measures
 */
contract SecureContract is Ownable, ReentrancyGuard, Pausable {
    
    /// @notice Mapping of user balances
    mapping(address => uint256) public balances;
    
    /// @notice Total contract balance
    uint256 public totalBalance;
    
    /// @notice Maximum deposit amount
    uint256 public constant MAX_DEPOSIT = 10 ether;
    
    /// @notice Events for transparency
    event Deposit(address indexed user, uint256 amount);
    event Withdrawal(address indexed user, uint256 amount);
    event EmergencyWithdraw(address indexed user, uint256 amount);
    
    /// @notice Custom errors for gas efficiency
    error InsufficientBalance();
    error ExceedsMaxDeposit();
    error TransferFailed();
    error ZeroAmount();
    
    /**
     * @notice Constructor sets the initial owner
     */
    constructor() {
        // Owner is set by Ownable constructor
    }
    
    /**
     * @notice Deposit ETH into the contract
     * @dev Uses proper checks and emits events
     */
    function deposit() external payable whenNotPaused {
        if (msg.value == 0) revert ZeroAmount();
        if (msg.value > MAX_DEPOSIT) revert ExceedsMaxDeposit();
        
        balances[msg.sender] += msg.value;
        totalBalance += msg.value;
        
        emit Deposit(msg.sender, msg.value);
    }
    
    /**
     * @notice Withdraw ETH from the contract
     * @param amount The amount to withdraw
     * @dev Protected against reentrancy and follows CEI pattern
     */
    function withdraw(uint256 amount) external nonReentrant whenNotPaused {
        if (amount == 0) revert ZeroAmount();
        if (balances[msg.sender] < amount) revert InsufficientBalance();
        
        // Checks-Effects-Interactions pattern
        balances[msg.sender] -= amount;
        totalBalance -= amount;
        
        // Interaction (external call) comes last
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        if (!success) revert TransferFailed();
        
        emit Withdrawal(msg.sender, amount);
    }
    
    /**
     * @notice Emergency withdraw for contract owner
     * @dev Only owner can call this function
     */
    function emergencyWithdraw() external onlyOwner {
        uint256 amount = address(this).balance;
        totalBalance = 0;
        
        (bool success, ) = payable(owner()).call{value: amount}("");
        if (!success) revert TransferFailed();
        
        emit EmergencyWithdraw(owner(), amount);
    }
    
    /**
     * @notice Pause the contract
     * @dev Only owner can pause
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @notice Unpause the contract
     * @dev Only owner can unpause
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @notice Get contract balance
     * @return The current contract balance
     */
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }
    
    /**
     * @notice Get user balance
     * @param user The user address
     * @return The user's balance
     */
    function getUserBalance(address user) external view returns (uint256) {
        return balances[user];
    }
    
    /**
     * @notice Fallback function - rejects direct ETH sends
     * @dev Use deposit() function instead
     */
    receive() external payable {
        revert("Use deposit() function");
    }
} 