import './App.css';
import react, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import artifacts from './artifacts/contracts/staking.sol/Staking.json' //that gets created when we deoploy our contract (we specified this location in our config file)

import NavBar from './components/NavBar.jsx'
import StakeModal from './components/StakeModal.jsx'
import { Bank, PiggyBank, Coin } from 'react-bootstrap-icons'

const CONTRACT_ADDRESS ='0x5FbDB2315678afecb367f032d93F642f64180aa3'

function App() {
  // general
  // set providers as we are using useState. Providers are read only
  const [provider, setProvider] = useState(undefined)
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
  const [amount, setAmount] = useState(0)

  // helper - easyer to convert bytes32 that come back from the contract, convert wei to ether etc
  const toString = bytes32 => ethers.utils.parseBytes32String(bytes32)
  const toWei = ether => ethers.utils.parseEther(ether)
  const toEther = wei => ethers.utils.formatEther(wei)

  //useEffect hoock, that runs when page loads
  useEffect(() => {
    const onLoad = async () => {
      const provider = await new ethers.providers.Web3Provider(window.ethereum) //set up provider and wallet as we will always need thos regardless if the user has connected his wallet
      setProvider(provider)

      const contract = await new ethers.Contract(
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

  const calcDaysRemaining = (unlockDate) => {
    const timeNow = Date.now() / 1000 // comes in millisecond so we want to convert it in seconds so we comparing like4like with contarct data
    const secondsRemaining = unlockDate - timeNow // seconds until the staked $PLEG unlocks
    return Math.max( (secondsRemaining / 60 /60 / 24).toFixed(0), 0 ) // toFixed removes any decimal places. And you are taking the max of that in 0 (eg if negative number as date has passed already)
  }

  const getAssets = async (ids, signer) => {
    // we are using Promise.all so that we wait here until we get the data about all the assets that we quering before we move on
    const queriedAssets = await Promise.all( // we will loop through the ids, pass each one to get positionbyid
    ids.map(id => contract.connect(signer).getPositionById(id))
    )

    queriedAssets.map(async asset => {
      const parsedAsset = {  // we create an object (so easier to work with) from the asset data that has come from getpositionid
        positionId: asset.positionId,
        percentInterest: Number(asset.percentInterest) / 100, //percentInterest does not come as a human readable number so we will call Number on it. we divide it by 100 as it will come back as basis points, and we want to convert it to a number we can display as a % interest
        daysRemainig: calcDaysRemaining( Number(asset.unlockDate) ),
        plegInterest: toEther(asset.plegInterest),
        plegStaked: toEther(asset.plegWeiStaked),
        open: asset.open,
      }

      // while we loop over these queried assets and create this parsed asset object we want to add these to our assets
      setAssetIds(prev => [...prev, parsedAsset])
    })
  }

  // function that will be called when user clicks button to connects their wallet
  const connectAndLoad = async () => {
    const signer = await getSigner(provider)
    setSigner(signer)

    const signerAddress = await signer.getAddress()
    setSignerAddress(signerAddress)

    const assetIds = await getAssetIds(signerAddress, signer)
    setAssetIds(assetIds)

    getAssets(assetIds, signer) // we'll use those assets ids to query the current positions for the connected wallet
  } 


  const openStakingModal = (stakingLength, stakingPercent) => {
    setShowStakeModal(true)
    setStakingLength(stakingLength)
    setStakingLPercent(stakingPercent)
  }

  // function stakePleg

  const stakePleg = () => {
    const plegWei = toWei(amount)
    const data = { value: plegWei }
    contract.connect(signer).stakePleg(stakingLength, data)
  }

  // withdraw function takes a positionId 
  const withdraw = positionId => {
    contract.connect(signer).closePosition(positionId)
  }



// UI incorporate
return (
  <div className="App">
    <div>
      <NavBar // component we are definin in 
      isConnected={isConnected}
      connect={connectAndLoad}
      />
    </div>


  </div>
  
);
}

export default App;
