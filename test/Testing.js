const { expect } = require("chai");
const { ethers } = require("hardhat");
const { isCallTrace } = require("hardhat/internal/hardhat-network/stack-traces/message-trace");

describe('Staking', function(){
    beforeEach(async function(){
        [signer1, signer2] = await ethers.getSigners(); //instances that act on behalf of wallets

        Staking = await ethers.getContractFactory('Staking', signer1);

        staking = await Staking.deploy({ //we will deploy the contract and send ether at the same time, which is the money interest is paid with
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
            expect(position.createdDate).to.equal(0)
            expect(position.unlockDate).to.equal(0)
            expect(position.percentInterest).to.equal(0)
            expect(position.plegWeiStaked).to.equal(0)
            expect(position.plegInterest).to.equal(0)
            expect(position.open).to.equal(false)

            expect(await staking.currentPositionId()).to.equal(0)

            data = { value: transferAmount }
            const transaction = await staking.connect(signer1).stakePleg(90, data);
            const receipt = await transaction.wait()
            const block = await provider.getBlock(receipt.blockNumber) //get the block from the receipt. We are getting the created date, the block that the blockchain stored this transaction, is the same date when the transaction was exectuted

            position = await staking.positions(0)

            expect(position.positionId).to.equal(0)
            expect(position.walletAddress).to.equal(signer1.address)
            expect(position.createdDate).to.equal(block.timestamp)
            expect(position.unlockDate).to.equal(block.timestamp + (86400 * 90)) //86,4k is the seconds in a day
            expect(position.percentInterest).to.equal(1000)
            expect(position.plegWeiStaked).to.equal(transferAmount)
            expect(position.plegInterest).to.equal( ethers.BigNumber.from(transferAmount).mul(1000).div(10000) ) // converting transfer amount into  a big number. calculate it ourselves and compare it to what is stored in the position
            expect(position.open).to.equal(true)

            expect(await staking.currentPositionId()).to.equal(1) //MF: why 1?

        })
        
        it('adds address and positionId to positionIdsByAddress', async function () {
            const transferAmount = ethers.utils.parseEther('0.5')

            const data = { value: transferAmount }

            await staking.connect(signer1).stakePleg(30, data)
            await staking.connect(signer1).stakePleg(30, data)
            await staking.connect(signer2).stakePleg(90, data)

            expect(await staking.positionIdsByAddress(signer1.address, 0)).to.equal(0) // this is how you access a mapping with an array
            expect(await staking.positionIdsByAddress(signer1.address, 1)).to.equal(1)  // we're accessing a public variable directly (not a method that returns the value) 
            expect(await staking.positionIdsByAddress(signer2.address, 0)).to.equal(2)
        })
    })

    describe('modifyLockPeriods', function () {
        describe('owner', function () {
            it('should create a new lock period', async function() {
                await staking.connect(signer1).modifyLockPeriods(100, 999)

                expect(await staking.tiers(100)).to.equal(999)
                expect(await staking.lockPeriods(3)).to.equal(100)
            })
            it('should modify an existing lock period', async function() {
                await staking.connect(signer1).modifyLockPeriods(30, 150)

                expect(await staking.tiers(30)).to.equal(150)
            })
        })

        describe('non-owner', function () {
            it('revers', async function () {
                expect(
                    staking.connect(signer2).modifyLockPeriods(100, 999)
                ).to.be.revertedWith(
                    'Only owner may modify staking periods')
            })
        })
    })


    describe('getLockPeriods', function() {
        it('returns all lock periods', async () => {
            const lockPeriods = await staking.getLockPeriod()

            expect(
                lockPeriods.map(v => Number(v._hex)) //lock periods are returned as a hex value, so converting to a number here [mapping value v to a number]
            ).to.eql( //it checkes nested equality instead of equality. when comparing arrays use eql
                [30,90,180]
            )
        })
    })

    describe('getInteresRate', function (){
        it('returns the interest rate for a specific lockPeriod', async () => {
            const interestRate = await staking.getInterestRate(30)
            expect(interestRate).to.equal(700)
        })
    })

    describe('getPositionById', function () {
        it('returns data about a specific position, given a positionId', async () => {
            const provider = waffle.provider;

            const transferAmount = ethers.utils.parseEther('5')
            const data = { value: transferAmount }
            const transaction = await staking.connect(signer1).stakePleg(90, data)
            const receipt = transaction.wait() // we need to have created that position first before testing
            const block = await provider.getBlock(receipt.blockNumber) // so that we can compare the timestamp in the block, and the created date and return the position below

            const position = await staking.connect(signer1.address).getPositionById(0)

            expect(position.positionId).to.equal(0)
            expect(position.walletAddress).to.equal(signer1.address)
            expect(position.createdDate).to.equal(block.timestamp)
            expect(position.unlockDate).to.equal(block.timestamp + (86400 * 90))
            expect(position.percentInterest).to.equal(1000)
            expect(position.plegWeiStaked).to.equal(transferAmount)
            expect(position.plegInterest).to.equal( ethers.BigNumber.from(transferAmount).mul(1000).div(10000) ) 
            expect(position.open).to.equal(true)
        })
    })

    describe('getPositionIdsForAddress', function () {
        it('returns a list of positionIds created by a specific address', async () => {
            let data
            let transaction

            data = { value: ethers.utils.parseEther('5')}
            transaction = await staking.connect(signer1).stakePleg(90, data) // we are not testing the staking function, but we need to create a positions so that we can run this test

            data = { value: ethers.utils.parseEther('10')}
            transaction = await staking.connect(signer1).stakePleg(90, data) // we are not testing the staking function, but we need to create a positions so that we can run this test

            const positionIds = await staking.getPositionIdsForAddress(signer1.address)

            expect(
                positionIds.map(p => Number(p))
            ).to.eql( //eql as dealing with an array
                [0,1]
            ) 
        })
    })

    describe('changeUnlockDate', function() {
        describe('owner', function() {
            it('changes the unlockDate', async () => {
                const data = { value: ethers.utils.parseEther('8') }
                const transaction = await staking.connect(signer2).stakePleg(90, data)
                const position0Id = await staking.getPositionById(0)

                const newUnlockDate = position0Id.unlockDate - (86400 * 500)
                await staking.connect(signer1).changeUnlockDate(0, newUnlockDate)
                const positionNew = await staking.getPositionById(0)

                expect(
                    positionNew.unlockDate
                ).to.be.equal(
                    position0Id.unlockDate - (86400 * 500)
                )
            })
        })


        describe('non-owner', function() {
            it('reverts', async () => {
                const data = { value: ethers.utils.parseEther('8') }
                const transaction = await staking.connect(signer2).stakePleg(90, data)
                const position0Id = await staking.getPositionById(0)

                const newUnlockDate = position0Id.unlockDate - (86400 * 500)
        
                // in the expect we call the transaction to modify it.It how this works when you are expecting a function to revert
                expect(
                    staking.connect(signer2).changeUnlockDate(0, newUnlockDate) //signer 2 so that it reverts
                ).to.be.revertedWith(
                    'Only owner may modify staking periods'
                )
            })
        })
    })

    describe('closePosition', function() {
        describe('after unlock date', function (){
            it('transfers principal and interest', async () => {
                let transaction;
                let receipt;
                let block;
                const provider = waffle.provider;

                const data = { value: ethers.utils.parseEther('8') }
                transaction = await staking.connect(signer2).stakePleg(90, data)
                receipt = transaction.wait()
                block = await provider.getBlock(receipt.blockNumber)
                
                // if we create a transaction now it's impossible to get past the unlock date. so we are going to use the change unlock function to backdate the unlock date to a time in the past so it unlocks as of now 
                const newUnlockDate = block.timestamp - (86400 * 100)
                await staking.connect(signer1).changeUnlockDate(0, newUnlockDate)

                const position = await staking.getPositionById(0)

                //signers balance increased by the amount they originally stake, the amount the interest the earned on that - gas fees to unstake
                const signerBalanceBefore = await signer2.getBalance()

                transaction = await staking.connect(signer2).closePosition(0)
                receipt = await transaction.wait()

                const gasUsed = receipt.gasUsed.mul(receipt.effectiveGasPrice)
                const signerBalanceAfter = await signer2.getBalance()

                expect(
                    signerBalanceAfter
                ).to.equal(
                    signerBalanceBefore
                    .sub(gasUsed)
                    .add(position.plegWeiStaked)
                    .add(position.plegInterest)
                    )
            })
        })
        describe('before unlock date', function (){
            it('transfers only principal', async () => {
                let transaction;
                let receipt;
                let block;
                const provider = waffle.provider;

                const data = { value: ethers.utils.parseEther('5') } // change the amount so that it's easier to catch errors
                transaction = await staking.connect(signer2).stakePleg(90, data)
                receipt = transaction.wait()
                block = await provider.getBlock(receipt.blockNumber)
                
                const position = await staking.getPositionById(0)
                
                const signerBalanceBefore = await signer2.getBalance()

                transaction = await staking.connect(signer2).closePosition(0)
                receipt = await transaction.wait()

                const gasUsed = receipt.gasUsed.mul(receipt.effectiveGasPrice)
                const signerBalanceAfter = await signer2.getBalance()

                expect(
                    signerBalanceAfter
                ).to.equal(
                    signerBalanceBefore
                    .sub(gasUsed)
                    .add(position.plegWeiStaked)
                    )
            })
        })
    })


})