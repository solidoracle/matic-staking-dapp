import "./App.css";
import react, { useEffect, useState } from "react";
import { ethers } from "ethers";
import artifacts from "./artifacts/contracts/staking.sol/Staking.json";  
import NavBar from "./components/NavBar.jsx";
import StakeModal from "./components/StakeModal.jsx";
import { Bank, PiggyBank, Coin } from "react-bootstrap-icons";

const CONTRACT_ADDRESS = "0x20d38bb7e2B284aA8196Fd2ad82c9d42Ee4f6438";

function App() {
  const [provider, setProvider] = useState(undefined);
  const [signer, setSigner] = useState(undefined);
  const [contract, setContract] = useState(undefined);
  const [signerAddress, setSignerAddress] = useState(undefined);
  
  // assets
  const [assetIds, setAssetIds] = useState([]);
  // our positions
  const [assets, setAssets] = useState([]);
  const [flexible, isFlexible] = useState(false);

  // staking
  const [showStakeModal, setShowStakeModal] = useState(false);
  const [stakingLength, setStakingLength] = useState(undefined);
  const [stakingPercent, setStakingPercent] = useState(undefined);
  const [amount, setAmount] = useState(0);

  // helper
  const toString = (bytes32) => ethers.utils.parseBytes32String(bytes32);
  const toWei = (ether) => ethers.utils.parseEther(ether);
  const toEther = (wei) => ethers.utils.formatEther(wei);
 
  useEffect(() => {
    const onLoad = async () => {
      const provider = await new ethers.providers.Web3Provider(window.ethereum);  
      await provider.send('eth_requestAccounts', []);
      setProvider(provider);
      console.log("provider set to:", provider.toString())

      const contract = await new ethers.Contract(
        CONTRACT_ADDRESS,
        artifacts.abi
      );
      setContract(contract);
    };
    onLoad();  
    getAssets(assetIds, signer); 

  }, []);

  const isConnected = () => signer !== undefined;  

   
  const getSigner = async () => {
    provider.send("eth_requestAccounts", []);  
    const signer = provider.getSigner();
    setSigner(signer);
    return signer;  
  };

  const getAssetIds = async (address, signer) => {
    const assetIds = await contract
      .connect(signer)
      .getPositionIdsForAddress(address);
    return assetIds;
  };

  const calcDaysRemaining = (unlockDate) => {
    const timeNow = Date.now() / 1000; 
    const secondsRemaining = unlockDate - timeNow;  
    return Math.max((secondsRemaining / 60 / 60 / 24).toFixed(0), 0); 
  };

  const getAssets = async (ids, signer) => {
    
    const queriedAssets = await Promise.all(
       
      ids.map((id) => contract.connect(signer).getPositionById(id))
    );

    queriedAssets.map(async (asset) => {
    
      const parsedAsset = {
        positionId: asset.positionId,
        percentInterest: Number(asset.percentInterest) / 100,  
        daysRemainig: calcDaysRemaining(Number(asset.unlockDate)),
        plegInterest: toEther(asset.plegInterest),
        plegStaked: toEther(asset.plegWeiStaked),
        open: asset.open,
        flexible: asset.flexible,
      };

       
      setAssets((prev) => [...prev, parsedAsset]);
    });
  };

   
  const connectAndLoad = async () => {

    const signer = await getSigner(provider);
    setSigner(signer);
    console.log("signer set to:", signer)

    const signerAddress = await signer.getAddress();
    setSignerAddress(signerAddress);
    console.log("signerAddress set to:", signerAddress)

    const assetIds = await getAssetIds(signerAddress, signer);
    setAssetIds(assetIds);

    getAssets(assetIds, signer);  
  };

 
  const openStakingModal = (flexible, stakingPercent) => { 
    setShowStakeModal(true);

    setStakingPercent(stakingPercent);
    isFlexible(flexible);
  };

  const openStakingRugPullModal = (flexible, stakingPercent) => { 
    setShowStakeModal(true);
 
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
    contract.connect(signer).stakePleg(data);  
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
            <span className="marketHeader">MATIC 5 day staking market</span>
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
                onClick={() => openStakingModal(true, "1000%")} 
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
