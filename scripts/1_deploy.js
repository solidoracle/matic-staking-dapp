// to deploy the contract and seed some staked ethe so that we can immediately display tat in the front end

const { ethers } = require("hardhat");

async function main() {
    [signer1, signer2] = await ethers.getSigners();

    const Staking = await ethers.getContractFactory('Staking', signer1);

    staking = await Staking.deploy({
        value: ethers.utils.parseEther('10')
    });

    // we'll need to know the address its deployed to so we can reference it in the front end
    console.log("staking contract deployed to:", staking.address, "by", signer1.address)

    // we need a provider, use it to get blocks that the blocks were deployed to so we can we can get those blocks timestamp and backdate stuff
    const provider = waffle.provider;
    let data;
    let transaction;
    let receipt;
    let block;
    let newUnlockDate;

    data = { value: ethers.utils.parseEther('0.5')}
    transaction = await staking.connect(signer2).stakePleg(30, data)

    data = { value: ethers.utils.parseEther('1')}
    transaction = await staking.connect(signer2).stakePleg(180, data)

    data = { value: ethers.utils.parseEther('1.75')}
    transaction = await staking.connect(signer2).stakePleg(180, data)

    // in these transactions we will backdate the unlock date

    data = { value: ethers.utils.parseEther('5')}
    transaction = await staking.connect(signer2).stakePleg(90, data)
    receipt = await transaction.wait()
    block = await provider.getBlock(receipt.BlockNumber)
    newUnlockDate = block.timestamp - (60 * 60 * 24 * 100) //60'' 60' 24h 100 days. We backdating the position 100 days like we did in the testing
    await staking.connect(signer1).changeUnlockDate(3, newUnlockDate) // only signer1 is able to change the unlock date

    data = { value: ethers.utils.parseEther('1.75')}
    transaction = await staking.connect(signer2).stakePleg(180, data)
    receipt = await transaction.wait()
    block = await provider.getBlock(receipt.BlockNumber)
    newUnlockDate = block.timestamp - (60 * 60 * 24 * 100) //60'' 60' 24h 100 days. We backdating the position 100 days like we did in the testing
    await staking.connect(signer1).changeUnlockDate(4, newUnlockDate)
}

// npx hardhat run --network localhost scripts/1_deploy.js (need to first launch a blockchain locally: npx hardhat node)

// snipped, what calls main and deploys the contract
main()
    .then(() => process.exit(0))
    .catch((error) =>{
        console.error(error);
        process.exit(1);
    });
