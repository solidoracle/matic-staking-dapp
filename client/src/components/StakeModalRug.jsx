
import React, { useState } from 'react';

const StakeModalRug = props => {
    const {
        onClose,
        stakingLength,
        stakingPercent,
        setAmount,
        stakePlegRugPull,
        flexible,
    } = props


    return (
        <>
            <div className='modal-class' onClick={props.onClose}>
                <div className='modal-content' onClick={e => e.stopPropagation()}>
                    <div className='modal-body'>
                        <h2 className='titleHeader'>Stake Pleg</h2>

                        <div className='row'>
                            <div className='col-md-9 fieldContainer'>
                                <input
                                className='inputField'
                                placeholder='0.0'
                                onChange={e => props.setAmount(e.target.value)}
                                />
                            </div>
                            <div className='col-md-3 inputFieldUnitsContainer'>
                                <span>PLEG</span>
                            </div>
                        </div>

                        <div className='row'>
                            <h6 className='titleHeader stakingTerms'>5 days @ {stakingPercent} APY</h6>
                        </div>
                        <div className='row'>
                           <div
                            onClick={() => stakePlegRugPull()}   
                            className='orangeButton'                         
                           >
                               Stake
                            </div>
                        </div>
                    </div>
                </div>        
            </div>      
        </>
    )
}


export default StakeModalRug
