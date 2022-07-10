require("@nomiclabs/hardhat-waffle");
require("dotenv").config();

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: {
    version: "0.8.0",
  },
  networks: {
    hardhat: {
      chainId: 31337
    },
    matic: {
      url: process.env.STAGING_ALCHEMY_KEY,
      accounts: [process.env.PRIVATE_KEY]
    }
  },
  paths: {
    artifacts: "./client/src/artifacts", // we are changing the location where the artifacts are generated when we compile so the frontend has easier access to them
  }  
};
