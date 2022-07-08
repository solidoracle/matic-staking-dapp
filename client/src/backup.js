/*
    <div className='appBody'> 
    <div className='marketContainer'>
      <div className='subContainer'>
        <span>
          <img className='logoImg'  src='eth-logo.webp'/>
        </span>
        <span className='marketHeader'>Ethereum Market</span>
      </div>


      <div className='row'>
        <div className='col-md-4'>
          <div onClick={() => openStakingModal(30, '7%')} className='marketOption'>
            <div className='glyphContainer hoverButton'>
              <span className='glyph'>
                <Coin /> // comes from react bootstrap icons
              </span>
            </div>
            <div className='optionData'>
              <span>1 Month</span>
              <span className='optionPercent'>7%</span>
            </div>
          </div>
        </div>

        <div className='col-md-4'>
          <div onClick={() => openStakingModal(90, '10%')} className='marketOption'>
            <div className='glyphContainer hoverButton'>
              <span className='glyph'>
                <Coin /> // comes from react bootstrap icons
              </span>
            </div>
            <div className='optionData'>
              <span>3 Months</span>
              <span className='optionPercent'>10%</span>
            </div>
          </div>
        </div>

        <div className='col-md-4'>
          <div onClick={() => openStakingModal(180, '12%')} className='marketOption'>
            <div className='glyphContainer hoverButton'>
              <span className='glyph'>
                <Coin /> // comes from react bootstrap icons
              </span>
            </div>
            <div className='optionData'>
              <span>6 Months</span>
              <span className='optionPercent'>12%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>     

  <div className='assetContainer'>
    <div className='subContainer'>
      <span className='marketHeader'>Staked Assets</span>
    </div>
    <div>
      <div className='row columnHeaders'>
          <div className='col-md-2'>Assets</div>
          <div className='col-md-2'>Percent Interest</div>
          <div className='col-md-2'>Staked</div>
          <div className='col-md-2'>Interest</div>
          <div className='col-md-2'>Days remaining</div>
          <div className='col-md-2'></div>
      </div>
    </div>
    <br />
    {assets.length > 0 && assets.map((a, idx) => (
      <div className='row'>
        <div className='col-md-2'>
          <span>
            <img className='stakedLogoImg' src='eth-logo.webp' />
          </span>
        </div>
        <div className='col-md-2'>
          {a.percentInterest} %
        </div>
        <div className='col-md-2'>
          {a.plegStaked} 
        </div>
        <div className='col-md-2'>
          {a.plegInterest} 
        </div>
        <div className='col-md-2'>
          {a.daysRemainig} 
        </div>
        <div className='col-md-2'>
          {a.open ? (
            <div onClick={() => withdraw(a.positionId)} className='orangeMiniButton'>Withdraw</div>
          ) : (
            <span>closed</span>
          )} %
        </div>
      </div>
    ))}
  </div>
<div>
</div>
{showStakeModal && (
  <StakeModal
  onClose={() => setShowStakeModal(false)}
  stakingLength={stakingLength}
  stakingLPercent={stakingLPercent}
  amount={amont}
  setAmount={setAmount}
  stakePleg={stakePleg}
  />
)}



