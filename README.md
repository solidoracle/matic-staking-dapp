# MATIC STAKING DAPP

A simple dapp that allows you to stake test matic. 


## Deployment

To deploy the project first install npm

```bash
npm install
cd client 
npm install
```

To deploy on MATIC Testnet add your keys to a .env file then run

```bash
npx hardhat run --network matic scripts/2_deploy.js
```

Remember to past your staking contract number in the App.js file in Client


## Running Tests

To run tests, run the following command

```bash
  npx hardhat test
```


## Start Front End


```bash
  cd client 
  npm start
```


