import React from "react";
import './PropertyListings.css'


export default class Header extends React.Component {
  render() {
    return (
      <div align="center" className="blackBackground">
          <img src={process.env.PUBLIC_URL +'/AdieuNFT.png'} alt="Adieu NFT" width="600" height="100"></img>

      </div>
    );
  }
}
