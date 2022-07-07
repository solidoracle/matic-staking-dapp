import './App.css';
import react, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import artifacts from './artifacts/contracts/Staking.sol/Staking.json' //that gets created when we deoploy our contract (we specified this location in our config file)

const CONTRACT_ADDRESS ='0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9'

function App() {
  // general
  // set providers as we are using useState. Providers are read only
  const [provide, setProvider] = useState(undefined)
  // signer is when you interact with the blockchain on behalf of the wallet where the provider is read only so you don't have to initialize that
  const [signer, setSigner] = useState(undefined)
  // instance of our contract in the front end so we can call functions on it
  const [contract, setContract] = useState(undefined)
  const [signerAddress, setSignerAddress] = useState(undefined)
 
  // assets
  // on the front end positions are called assets
  const [assetIds, setAssetIds] = useState([])
  // our positions
  const [assets, setAssets] = useState([])

  // staking - aka creating new positions
  // we using modal for the user to input how much $PLEG they want to stake 
  const [showStakeModal, setShowStakeModal] = useState(false)
  const [stakingLength, setStakingLength] = useState(undefined)
  const [stakingLPercent, setStakingLPercent] = useState(undefined)
  const [amont, setAmount] = useState(0)

  // helper - easyer to convert bytes32 that come back from the contract, convert wei to ether etc
  const toString = bytes32 => ethers.utils.parseBytes32String(bytes32)
  const toWei = ether => ethers.utils.parseEhter(ether)
  const toEther = wei => ethers.utils.formatEther(wei)

  //useEffect hoock, that runs when page loads
  useEffect(() => {
    const onLoad = async () => {
      const provider = await new ethers.providers.Web3Provider(window.ethereum) //set up provider and wallet as we will always need thos regardless if the user has connected his wallet
      setProvider(provider)

      const contract = await new ethers.contract(
        CONTRACT_ADDRESS,
        artifacts.abi
      )
      setContract(contract)
    }
    onLoad() // call unload
  }, []) // finish up useEffect

  const isConnected = () => signer !== undefined   // checks if signer not equal to undefined -> wallet is hence connected

  // run when user clicks on connect their wallet button
  const getSigner = async () => {
    provider.send("ether_requestAccounts", []) // from ethjs accounts
    const signer = provider.getSigner()
    return signer // we return it here immediately bacause when we set the signer setSigner(signer) it might not be available immediately. So we use that value immediately
  }

  const getAssetIds = async (address, signer) => {
    const assetIds = await contract.connect(signer).getPositionIdsForAddress(address)
    return assetIds
  }

  
  const getAssets = async (ids, signer) => {
    // we are using Promise.all so that we wait here until we get the data about all the assets that we quering before we move on
    const queriedAssets = await Promise.all( // we will loop through the ids, pass each one to get positionbyid
    ids.map(id => contract.connect(signer).getPositionById(id))
    )

    queriedAssets.map(async asset => {
      const parsedAsset = {  // we create an object (so easier to work with) from the asset data that has come from getpositionid
        positionId: ,
        percentInterest: ,
        daysRemainig; ,
        plegInterest: ,
        react
      }
    })

  }


  return (
    <div className="App">
      
    </div>
  );
}

export default App;
