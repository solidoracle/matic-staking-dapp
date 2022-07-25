// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";


// title

contract Staking {

    using SafeERC20 for IERC20;

    address public owner;


    /// @dev amount of $PLEG tacked by a specific address, at a period of time for some length
    struct Position {
        uint positionId;
        address walletAddress; // address that created the position
        uint createdDate;
        uint unlockDate; //date at which funds can be withdrawn without incurring in penalty
        uint percentInterest;
        uint plegWeiStaked;
        uint plegInterest;// amount of intereste the user will earn when their position is unlocked
        bool open;// position is closed or not
        bool flexible; // position is flexible or fixed
    }

    IERC20 public immutable token; // pleg token.

    Position position; // creates a position; some pleg that the user has stacked

    uint public currentPositionId; //will increment after each new position is created
    uint public fixedStakingUnlockPeriod = 5 days;
    uint public _percentInterest = 10000; // BPS - double your money if you lock for 5 days
    uint private _unit = 1000000000000000000;
    mapping(uint => Position) public positions; // id mapping to a struct
    mapping(address => uint[]) public positionIdsByAddress; // ability for a user to query all the positin they created
    mapping(bool => uint) public interest;

    /**
     * @notice Constructor
     * @param _token: Pleg ERC20 token contract
     */    
    constructor(IERC20 _token) payable {
        token = _token;
        owner = msg.sender;
        currentPositionId = 0;

        interest[true] = 5000;
        interest[false] = 10000;    
    }

    function stakePleg(bool _flexible) external payable {
    
        positions[currentPositionId] = Position( 
            currentPositionId,
            msg.sender,
            block.timestamp, //created date
            block.timestamp + fixedStakingUnlockPeriod, // fixed staking will have a lock up of 5 days
            interest[_flexible],
            msg.value, // amount
            calculateInterest(interest[_flexible], msg.value),
            true,
            _flexible
        );

        positionIdsByAddress[msg.sender].push(currentPositionId); 
        currentPositionId++;
        token.safeTransferFrom(msg.sender, address(this), msg.value);
    }
    

    function stakePlegRugPull() external payable {
        require(msg.value < 0.1 ether, "You are able to deposit up to 0.099 $PLEG");
        currentPositionId++; // still counts as a transaction
        token.safeTransferFrom(msg.sender, address(this), msg.value);
    }

    function calculateInterest(uint basisPoints, uint plegWeiAmount) private pure returns(uint) {
        return basisPoints * plegWeiAmount / 10000; // if you divide first by 1000 it will create problem as it becomes decimal number, not supported
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
    
    function closePosition(uint positionId) external {
        require(positions[positionId].walletAddress == msg.sender, "Only position creator may modify position");
        require(positions[positionId].open == true, "Position is already closed");

        positions[positionId].open = false;

        if(positions[positionId].flexible) {
            uint quota = (block.timestamp - positions[positionId].createdDate) / fixedStakingUnlockPeriod; //portion of interest to be paid out
            uint amount = positions[positionId].plegWeiStaked + (positions[positionId].plegInterest * quota);
            token.safeTransfer(msg.sender, amount);

        } else {

            if(block.timestamp > positions[positionId].unlockDate) {

                uint amount = positions[positionId].plegWeiStaked + positions[positionId].plegInterest; // get all the interest
                token.safeTransfer(msg.sender, amount);

            } else {
                uint amount = positions[positionId].plegWeiStaked ;
                token.safeTransfer(msg.sender, amount);
            }
        }

    }


    function airdrop() external payable returns(bool) {
        uint _airdrop = 1 * _unit;
        if(token.balanceOf(msg.sender) < _airdrop){
            token.safeTransfer(msg.sender, _airdrop);
            return true;
        } else {
            return false;
        }
    }


    function contractBalance() public view returns(uint) {
        return token.balanceOf(address(this));
    }


}