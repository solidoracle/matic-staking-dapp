import "./App.css";
import react, { useEffect, useState } from "react";
import { ethers } from "ethers";
import artifacts from "./artifacts/contracts/staking.sol/Staking.json"; //that gets created when we deoploy our contract (we specified this location in our config file)

import NavBar from "./components/NavBar.jsx";
import StakeModal from "./components/StakeModal.jsx";
import { Bank, PiggyBank, Coin } from "react-bootstrap-icons";

const CONTRACT_ADDRESS = "0x20d38bb7e2B284aA8196Fd2ad82c9d42Ee4f6438";

function App() {
  // set providers as we are using useState. Providers are read only
  const [provider, setProvider] = useState(undefined);
  // signer is when you interact with the blockchain on behalf of the wallet where the provider is read only so you don't have to initialize that
  const [signer, setSigner] = useState(undefined);
  // instance of our contract in the front end so we can call functions on it
  const [contract, setContract] = useState(undefined);
  const [signerAddress, setSignerAddress] = useState(undefined);
  
  // assets
  // on the front end positions are called assets
  const [assetIds, setAssetIds] = useState([]);
  // our positions
  const [assets, setAssets] = useState([]);
  const [flexible, isFlexible] = useState(false);

  // staking - aka creating new positions
  // we using modal/popup for the user to input how much $PLEG they want to stake
  const [showStakeModal, setShowStakeModal] = useState(false);
  const [stakingLength, setStakingLength] = useState(undefined);
  const [stakingPercent, setStakingPercent] = useState(undefined);
  const [amount, setAmount] = useState(0);

  // helper - easyer to convert bytes32 that come back from the contract, convert wei to ether etc
  const toString = (bytes32) => ethers.utils.parseBytes32String(bytes32);
  const toWei = (ether) => ethers.utils.parseEther(ether);
  const toEther = (wei) => ethers.utils.formatEther(wei);

  //useEffect hoock, that runs when page loads
  useEffect(() => {
    const onLoad = async () => {
      const provider = await new ethers.providers.Web3Provider(window.ethereum); //set up provider and wallet as we will always need those regardless if the user has connected his wallet
      await provider.send('eth_requestAccounts', []);
      setProvider(provider);
      console.log("provider set to:", provider.toString())

      const contract = await new ethers.Contract(
        CONTRACT_ADDRESS,
        artifacts.abi
      );
      setContract(contract);
    };
    onLoad(); // call when page loads
    getAssets(assetIds, signer); // call when page loads

  }, []); // finish up useEffect

  const isConnected = () => signer !== undefined; // checks if signer not equal to undefined -> wallet is hence connected

  // run when user clicks on connect their wallet button
  const getSigner = async () => {
    provider.send("eth_requestAccounts", []); // from ethjs accounts
    const signer = provider.getSigner();
    setSigner(signer);
    return signer; // we return it here immediately bacause when we set the signer setSigner(signer) it might not be available immediately. So we use that value immediately
  };

  const getAssetIds = async (address, signer) => {
    const assetIds = await contract
      .connect(signer)
      .getPositionIdsForAddress(address);
    return assetIds;
  };

  const calcDaysRemaining = (unlockDate) => {
    const timeNow = Date.now() / 1000; // comes in millisecond so we want to convert it in seconds so we comparing like4like with contarct data
    const secondsRemaining = unlockDate - timeNow; // seconds until the staked $PLEG unlocks
    return Math.max((secondsRemaining / 60 / 60 / 24).toFixed(0), 0); // toFixed removes any decimal places. And you are taking the max of that in 0 (eg if negative number as date has passed already)
  };

  const getAssets = async (ids, signer) => {
    // we are using Promise.all so that we wait here until we get the data about all the assets that we quering before we move on
    const queriedAssets = await Promise.all(
      // we will loop through the ids, pass each one to get positionbyid
      ids.map((id) => contract.connect(signer).getPositionById(id))
    );

    queriedAssets.map(async (asset) => {
   // we create an object (so easier to work with) from the asset data that has come from getpositionid
      const parsedAsset = {
        positionId: asset.positionId,
        percentInterest: Number(asset.percentInterest) / 100, //percentInterest does not come as a human readable number so we will call Number on it. we divide it by 100 as it will come back as basis points, and we want to convert it to a number we can display as a % interest
        daysRemainig: calcDaysRemaining(Number(asset.unlockDate)),
        plegInterest: toEther(asset.plegInterest),
        plegStaked: toEther(asset.plegWeiStaked),
        open: asset.open,
        flexible: asset.flexible,
      };

      // while we loop over these queried assets and create this parsed asset object we want to add these to our assets
      setAssets((prev) => [...prev, parsedAsset]);
    });
  };

  // function that will be called when user clicks button to connects their wallet
  const connectAndLoad = async () => {

    const signer = await getSigner(provider);
    setSigner(signer);
    console.log("signer set to:", signer)

    const signerAddress = await signer.getAddress();
    setSignerAddress(signerAddress);
    console.log("signerAddress set to:", signerAddress)

    const assetIds = await getAssetIds(signerAddress, signer);
    setAssetIds(assetIds);

    getAssets(assetIds, signer); // we'll use those assets ids to query the current positions for the connected wallet
  };

  //UPDATE args
  const openStakingModal = (flexible, stakingPercent) => { //stakingTerms in modal
    setShowStakeModal(true);
    //setStakingLength(stakingLength);
    setStakingPercent(stakingPercent);
    isFlexible(flexible);
  };

  const openStakingRugPullModal = (flexible, stakingPercent) => { //stakingTerms in modal
    setShowStakeModal(true);
    //setStakingLength(stakingLength);
    setStakingPercent(stakingPercent);
    isFlexible(flexible);
  };

  const stakePleg = () => {
    const plegWei = toWei(amount);  
    const data = { value: plegWei };
    contract.connect(signer).stakePleg(flexible, data);
  };

  const stakePlegRugPull = () => {
    const plegWei = toWei(amount);  
    const data = { value: plegWei };
    contract.connect(signer).stakePleg(data); //like a fallback function
  };


  const withdraw = (positionId) => {
    contract.connect(signer).closePosition(positionId);
  };


  return (
    <div className="App">
      <div>
        <NavBar
          isConnected={isConnected}
          connect={connectAndLoad}
        />
      </div>

      <div className="appBody">
        <div className="marketContainer">
          <div className="subContainer">
            <span>
              <img className="logoImg" src="eth-logo.webp" />
            </span>
            <span className="marketHeader">PLEG 5 day staking market</span>
          </div>

          <div className="row">
            <div className="col-md-4">
              <div
                onClick={() => openStakingModal(true, "50%")}
                className="marketOption"
              >
                <div className="glyphContainer hoverButton">
                  <span className="glyph">
                    <Coin/> 
                  </span>
                </div>
                <div className="optionData">
                  <span>Flexible</span>
                  <span className="optionPercent">50%</span>
                </div>
              </div>
            </div>

            <div className="col-md-4">
              <div
                onClick={() => openStakingModal(false, "100%")}
                className="marketOption"
              >
                <div className="glyphContainer hoverButton">
                  <span className="glyph">
                    <Coin /> 
                  </span>
                </div>
                <div className="optionData">
                  <span>Fixed</span>
                  <span className="optionPercent">100%</span>
                </div>
              </div>
            </div>

            <div className="col-md-4">
              <div
                onClick={() => openStakingModal(true, "1000%")} //should be dream pool. o another staking modal
                className="marketOption"
              >
                <div className="glyphContainer hoverButton">
                  <span className="glyph">
                    <Coin /> 
                  </span>
                </div>
                <div className="optionData">
                  <span>Dream</span>
                  <span className="optionPercent">1000%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="assetContainer">
        <div className="subContainer">
          <span className="marketHeader">Staked Assets</span>
        </div>
        <div>
          <div className="row columnHeaders">
            <div className="col-md-2">Assets</div>
            <div className="col-md-2">Percent Interest</div>
            <div className="col-md-2">Staked</div>
            <div className="col-md-2">Type</div>
            <div className="col-md-2">Days remaining</div>
            <div className="col-md-2"></div>
          </div>
        </div>
        <br />
        {assets.length > 0 &&
          assets.map((a, idx) => (
            <div className="row">
              <div className="col-md-2">
                <span>
                  <img className="stakedLogoImg" src="eth-logo.webp" />
                </span>
              </div>
              <div className="col-md-2">{a.percentInterest} %</div>
              <div className="col-md-2">{a.plegStaked}</div>
              <div className="col-md-2">{a.flexible}</div>
              <div className="col-md-2">{a.daysRemainig}</div>
              <div className="col-md-2">
                {a.open ? (
                  <div
                    onClick={() => withdraw(a.positionId)}
                    className="orangeMiniButton"
                  >
                    Withdraw
                  </div>
                ) : (
                  <span>closed</span>
                )}
              </div>
            </div>
          ))}
      </div>
      <div></div>
      {showStakeModal && (
        <StakeModal
          onClose={() => setShowStakeModal(false)}
          stakingLength={stakingLength}
          stakingPercent={stakingPercent}
          amount={amount}
          setAmount={setAmount}
          stakePleg={stakePleg}
          flexible={flexible}
        />
      )}
    </div>
  );
}

export default App;
