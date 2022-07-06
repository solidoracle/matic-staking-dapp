// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

// title

contract Staking {

    address public owner;


    /// @dev amount of $PLEG tacked by a specific address, at a period of time for some length
    struct Position {
        uint positionId;
        address walletAddress; // address that created the position
        uint createdDate;
        uint unlockDate; //date at which funds can be withdrawn withou incurring in penalty
        uint percentInterest;
        uint plegWeiStaked;
        uint plegInterest;// amount of intereste the user will earn when their position is unlocked
        bool open;// position is closed or not
    }

    Position position; // creates a position; some pleg that the user has stacked

    uint public currentPositionId; //will increment after each new position is created
    mapping(uint => Position) public positions;
    mapping(address => uint[]) public positionIdsByAddress; // ability for a user to query all the positin they created
    mapping(uint => uint) public tiers; //data on number of days and interest rate that they can stake their $PLEG at
    uint[] public lockPeriods;


    //able to send $PLEG to the contract, so that it can pay the interest
    constructor() payable {
        owner = msg.sender;
        currentPositionId = 0;

        tiers[30] = 700; // 700 bp apy in 30 days
        tiers[90] = 1000; 
        tiers[180] = 1200;

        lockPeriods.push(30);
        lockPeriods.push(90);
        lockPeriods.push(180);

    }



    function stakePleg(uint numDays) external payable {
        require(tiers[numDays] > 0 , "Mapping not found"); //we don't want people to send $PLEG with an arbitrary number of days without it being pre-approved

        positions[currentPositionId] = Position( //TODO understand 
            currentPositionId,
            msg.sender,
            block.timestamp, //created date
            block.timestamp + (numDays * 1 days), //unlock days. must multiply by "1 days otherwise Soldity doesn't understand the object
            tiers[numDays],
            msg.value, //the pleg stakes - amount of pleg
            calculateInterest(tiers[numDays], numDays, msg.value),
            true
        );

        positionIdsByAddress[msg.sender].push(currentPositionId); 
        currentPositionId++;

    }
    

    // pure because it doesn't touch the blockchain
    function calculateInterest(uint basisPoints, uint numDays, uint plegWeiAmount) private pure returns(uint) {
        return basisPoints * plegWeiAmount / 10000; // if you divide first by 1000 it will create problem as it becomes decimal number, not supported
    }



    //change lock periods by owner

    function modifyLockPeriods(uint numDays, uint basisPoints) external {
        require(owner == msg.sender , "Only owner may modify staking periods");
        // add require statement if you don't want to override existing tiers
        tiers[numDays] = basisPoints;

        lockPeriods.push(numDays); // so its possible to query all the staking lengths at one time
    }


    function getLockPeriod() external view returns(uint[] memory) {
        return lockPeriods;
    }

    function getInterestRate(uint numDays) external view returns(uint) {
        return tiers[numDays];
    }

    function getPositionById(uint positionId) external view returns(Position memory) {
        return positions[positionId];
    }

    function getPositoinIdsForAddress(address walletAddress) external view returns(uint[] memory) {
        return positionIdsByAddress[walletAddress];
    }

    function changeUnlockDate(uint positionId, uint newUnlockDate) external {
        require(owner == msg.sender , "Only owner may modify unlock dates");

        positions[positionId].unlockDate = newUnlockDate;

    }

    //unstake, like withdraw function
    function closePosition(uint positionId) external {
        require(positions[positionId].walletAddress == msg.sender, "Only position creator may modify position");
        require(positions[positionId].open == true, "Position is closed");

        positions[positionId].open = false;

        //penalty if withdraw early
        if(block.timestamp > positions[positionId].unlockDate) {
            uint amount = positions[positionId].plegWeiStaked + positions[positionId].plegInterest;
            payable(msg.sender).call{value: amount}("");
        } else {
            payable(msg.sender).call{value: positions[positionId].plegWeiStaked}("");
        }

    }





}