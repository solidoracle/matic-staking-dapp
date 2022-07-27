import React from 'react'

const NavBar = props => {
    return (
        <>
         <div className="navBar">
            <div className='navButton'> POLYGON STAKING </div>
            <div className='navButton'> DASHBOARD </div>
            {props.isConnected() ? (
                <div className='connectButton'>
                    Connected
                </div>
            ) : (
                <div
                onClick={() => props.connect()}
                className="connectButton">
                    Connect Wallet and Load Open Positions
                </div>
            )}
         </div>
        </>
    )
}

export default NavBar