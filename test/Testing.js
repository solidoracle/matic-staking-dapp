const { expect } = require("chai");
const { ethers } = require("hardhat");
const { isCallTrace } = require("hardhat/internal/hardhat-network/stack-traces/message-trace");

describe('Staking', function(){
    beforeEach(async function(){
        [signer1, signer2] = await ethers.getSigners(); //instances that act on behalf of wallets

        Staking = await ethers.getContractFactory('Staking', signer1);

        staking = await Staking.deploy({ //we will deploy the contract and send ether at the same time
            value: ethers.utils.parseEther('10') //singer1 will give 10 eth to the contract
        })
    })


    describe('deploy', function() {
        it('should set owner', async function() {
            expect(await staking.owner()).to.equal(signer1.address)
        })
        it('sets up tiers and lockPeriods', async function() {
            expect(await staking.lockPeriods(0)).to.equal(30)
            expect(await staking.lockPeriods(1)).to.equal(90)
            expect(await staking.lockPeriods(2)).to.equal(180)
        
            expect(await staking.tiers(30)).to.equal(700)
            expect(await staking.tiers(90)).to.equal(1000)
            expect(await staking.tiers(180)).to.equal(1200) // await because it returns a promise
        })
    })

    //Safe math style is used because we are dealing with big numbers, it's just how you do it
    
    describe('stakePleg', function() {
        it('transfers pleg', async function() {
            const provider = waffle.provider; // we need a provider to interact with the blockchain
            let contractBalance;
            let signerBalance;
            const transferAmount = ethers.utils.parseEther('2.0')

            contractBalance = await provider.getBalance(staking.address)
            signerBalance = await signer1.getBalance()

            const data = { value: transferAmount }
            const transaction = await staking.connect(signer1).stakePleg(30,data); //need to connect the signer to blockchain when doing a transaction on chain
            const receipt = await await transaction.wait()
            const gasUsed = receipt.gasUsed.mul(receipt.effectiveGasPrice)

            // test in signer1's pleg balance
            expect(
                await signer1.getBalance()
            ).to.equal(
                signerBalance.sub(transferAmount).sub(gasUsed)
            )

            // test the change in contract's pleg balance
            expect(
                await provider.getBalance(staking.address)
            ).to.equal(
                contractBalance.add(transferAmount)
            )
        })
        it('adds a position to positions', async function () {
            const provider = waffle.provider;
            let position;
            const transferAmount = ethers.utils.parseEther('1.0')

            position = await staking.positions(0)

            expect(position.positionId).to.equal(0)
            expect(position.walletAddress).to.equal('0x0000000000000000000000000000000000000000')
            expect(position.createDate).to.equal(0)
            expect(position.unlockDate).to.equal(0)
            expect(position.percentageInterest).to.equal(0)
            expect(position.plegWeiStaked).to.equal(0)
            expect(position.plegInterest).to.equal(0)
            expect(position.open).to.equal(false)

            expect( await staking.currentPositionId().to.equali(0))

            data = { value: transferAmount }
            const transactoin = await staking.connect(signer1).stakePleg(90, data);
            const receipt = await transactoin.wait()
            const block = await provider.getBlock(receipt.blockNumber) //get the block from the receipt. We are getting the created date, the block that the blockchain stored this transaction, is the same date when the transaction was exectuted

            position = await staking.positions(0)

            expect(position.positionId).to.equal(0)
            expect(position.walletAddress).to.equal(singer1.address)
            expect(position.createDate).to.equal(block.timestamp)
            expect(position.unlockDate).to.equal(block.timestamp + (86400 * 90)) //86,4k is the seconds in a day
            expect(position.percentageInterest).to.equal(1000)
            expect(position.plegWeiStaked).to.equal(transferAmount)
            expect(position.plegInterest).to.equal( ) // calculate it ourselves and compare it to what is stored in the position
            expect(position.open).to.equal(false)







        })
        

    })




})