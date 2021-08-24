import React from "react";


function About(account) {
    return (
      <div className="mainMontent">
      <div align="center" className="about">
          <h1 align="center">We Created a dual-sync / one-chain NFT</h1>
          <br/>
          <p>
            Both for property owners ("owners") as well as Vacationers ("renters").
            Vacay !</p>
            <br/>
          <p>
            Mint as you go tokenomics ensure that both owners and renters have unique NFT Tokens to add to their collection when renting unique and fun properties. This is the first working blockchain ERC721 implementation of bi-directional; 100% on-chain renting completely cutting out the "middleman" problem ENTIRELY. Renters and Owners communicate, interact, and transact directly.
          </p>
          <br/>
          <p>
            The Adieu platform is NOT an interested party nor a middleman; rather it's a hosting entity that prefers everything (when possible) be written and transacted ON the blockchain. Adieu does not have ownership, management, oversight, or any control whatsoever once contracts deploy on Mainnet.
          </p>
          <br/>
          <p align="center">
            <b> This dApp has been hosted on Kovan Testnet.</b> <br/>
            The address of the smart contracts are as follows:
            <br/><br/>
                - Property Manager : 0x9BCfBf25Efd3882336B7370A32534eb0E1FE148C <br/>
                - Booking Manager : 0x98bF4D1E6EC0159026806a6B358eeA4D2dDDC263

          </p>
      </div>
      </div>
    );
  }
  export default About;
