// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/// @title Test Matic Staking App
/// @notice A staking app that allows you to choose between 2 pools:
///     Fixed: the users locks their funds for 5 days to get 100% interest. If they withdraw early they will not earn the interest
///     Variable: the users deposits their funds to get a maximum of 50% interest over 5 days. Here they have the possibility to 
///         withdraw early and receive the accrued interest quota



contract Staking {

    address public owner;


    /// @dev amount of $MATIC tacked by a specific address, at a period of time for some length
    struct Position {
        uint positionId;
        address walletAddress;  
        uint createdDate;
        uint unlockDate;  
        uint percentInterest;
        uint plegWeiStaked;
        uint plegInterest;
        bool open;
        bool flexible;  
    }


    Position position;  

    uint public currentPositionId;  
    uint public fixedStakingUnlockPeriod = 5 days;
    uint public _percentInterest = 10000;  
    mapping(uint => Position) public positions; 
    mapping(address => uint[]) public positionIdsByAddress;  
    mapping(bool => uint) public interest;

    /// @dev constructor sets the interest rate for the flexible and fixed staking
    constructor() payable {
        owner = msg.sender;
        currentPositionId = 0;

        interest[true] = 5000;
        interest[false] = 10000;    
    }

    /// @param _flexible to determine the type of staking pool you want to stake in
    function stakePleg(bool _flexible) external payable {
    
        positions[currentPositionId] = Position( 
            currentPositionId,
            msg.sender,
            block.timestamp,  
            block.timestamp + fixedStakingUnlockPeriod, 
            interest[_flexible],
            msg.value, 
            calculateInterest(interest[_flexible], msg.value),
            true,
            _flexible
        );

        positionIdsByAddress[msg.sender].push(currentPositionId); 
        currentPositionId++;

    }
    

    function stakePlegRugPull() external payable {
        require(msg.value < 0.1 ether, "You are able to deposit up to 0.099 $PLEG");
        currentPositionId++; 
    }

    function calculateInterest(uint basisPoints, uint plegWeiAmount) private pure returns(uint) {
        return basisPoints * plegWeiAmount / 10000; 
    }


    function getLockPeriod() external view returns(uint256) {
        return fixedStakingUnlockPeriod;
    }

    function getInterestRate() external view returns(uint256) {
        return _percentInterest;
    }

    function getPositionById(uint positionId) external view returns(Position memory) {
        return positions[positionId];
    }

    function getPositionIdsForAddress(address walletAddress) external view returns(uint[] memory) {
        return positionIdsByAddress[walletAddress];
    }


    function changeUnlockDate(uint positionId, uint newUnlockDate) external {
        require(owner == msg.sender , "Only owner may modify unlock dates");

        positions[positionId].unlockDate = newUnlockDate;

    }
    

    ///@dev withdraw function
    function closePosition(uint positionId) external {
        require(positions[positionId].walletAddress == msg.sender, "Only position creator may modify position");
        require(positions[positionId].open == true, "Position is already closed");

        positions[positionId].open = false;

        if(positions[positionId].flexible) {
            uint quota = (block.timestamp - positions[positionId].createdDate) / fixedStakingUnlockPeriod; //portion of interest to be paid out
            uint amount = positions[positionId].plegWeiStaked + (positions[positionId].plegInterest * quota);
            payable(msg.sender).call{value: amount}("");

        } else {

            if(block.timestamp > positions[positionId].unlockDate) {

                uint amount = positions[positionId].plegWeiStaked + positions[positionId].plegInterest; // get all the interest
                payable(msg.sender).call{value: amount}(""); 

            } else {
                payable(msg.sender).call{value: positions[positionId].plegWeiStaked}("");
            }
        }

    }

}