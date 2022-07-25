async function main() {
    if (network.name === "hardhat") {
      console.warn(
        "You are trying to deploy a contract to the Hardhat Network, which" +
          "gets automatically created and destroyed every time. Use the Hardhat" +
          " option '--network localhost'"
      );
    }
  
    // ethers is available in the global scope
    const [deployer] = await ethers.getSigners();
    console.log(
      "Deploying the contracts with the account:",
      await deployer.getAddress()
    );
  
    console.log("Account balance:", (await deployer.getBalance()).toString());
  
    const Staking = await ethers.getContractFactory("Staking");
    const staking = await Staking.deploy('0xde6A914c93e9c5E2785eAb6b5a005c6B6F89C1e3');
    await staking.deployed();
  
    console.log("Staking contract address:", staking.address);
  
    // We also save the contract's artifacts and address in the frontend directory
    saveFrontendFiles(staking); 
  }
  
  function saveFrontendFiles(staking) {
    const fs = require("fs");
    const contractsDir = "./client/src/artifacts/contracts/staking.sol";
  
    /*if (!fs.existsSync(contractsDir)) {
      fs.mkdirSync(contractsDir);
    }
  
    fs.writeFileSync(
      contractsDir + "/Staking.json",
      JSON.stringify({ Staking: staking.address }, undefined, 2)
    );*/
  
    const StakingArtifact = artifacts.readArtifactSync("Staking");
  
    fs.writeFileSync(
      contractsDir + "/Staking.json",
      JSON.stringify(StakingArtifact, null, 2)
    );
  }
  
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
  