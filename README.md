npm install

add your keys on .env

deploy on matic
npx hardhat run --network matic scripts/2_deploy.js

start frontend
cd client
npm start

TEST
npx hardhat test



------



DEPLOY
npx hardhat run --network localhost scripts/1_deploy.js
gt 
FRONTEND
// client is the directory where we put all our front end code
npx create-react-app client
(if there is a conflict with src if means you have already deployed the contract and created the directory, so delete client folder and run the command again without first deploying)
cd client
npm i react-bootstrap-icons ethers bootstrap

npm start to start the app
