//import react
import React, { useState,useEffect, useRef, useContext } from "react";

import Web3 from 'web3'
import { PROPERTMANAGER_ABI, PROPERTMANAGER_ADDRESS } from '../config'
import {
  connectWallet,
  getCurrentWalletConnected //import here
} from "./connection.js";
import WalletContext from './context'

import PropertyListings from './PropertyListings';

/*
 @dev Component to get properties to rent from blockchain
 display using PropertyListing Component

*/
function Rental(props) {
  const [propertyCount, setPropertyCount] = useState(-1);
  const [properties, setProperties] = useState([]);
  const [walletAddress, setWallet] = useState("");
  const myPropertiesRef = useRef(properties);
  const [counter, setSetCounter]  = useState(0);
  const walletInfo = useContext(WalletContext);


  useEffect(() => {
   loadProperyList(walletInfo);

  },[]);



 async function loadProperyList(address)  {

   const walletResponse = await getCurrentWalletConnected();
   const walletAddr = await walletResponse.address;

  // Get web3 provider - pointing to connected or ganache
  const web3 = new Web3(Web3.givenProvider || "http://localhost:8545");

  // create an instnace of the PropertyManager smart contract
  const propertyManagerInstance = new web3.eth.Contract(PROPERTMANAGER_ABI, PROPERTMANAGER_ADDRESS);
  // save to state ?/
  //setPropertyManagerInstance(propertyManagerInstance);
  // get count of the properties on blockhain via web3
  const propertyCount = await propertyManagerInstance.methods.getCount().call({from: walletAddr});
  // save count
  setPropertyCount(propertyCount);
  // loop and get each propertu details
  var newProperties = [];
  for (var i = 0; i <= propertyCount; i++) {
    try {
      const property = await propertyManagerInstance.methods.getDetails(i).call({from: walletAddr});
      //save to state
      newProperties = newProperties.concat( property);
      setProperties(newProperties);
      setSetCounter(i + 1);
    }
    catch(error)
    // @dev Load the properties from blockchain
      {
        //throw error;
        continue;
      }

  }
  setProperties(newProperties);
}


  return(

      <div >
        <nav>
        </nav>
        <div className="container-fluid">
        <br/>
          <main role="main" className="col-lg-12 d-flex justify-content-center">
                      <div id="loader" className="text-center">
                        <p className="text-center">Loading...{counter}</p>
                      </div>
          <br/>
          </main>
          <br/>
        <div className="row">
          <PropertyListings properties= {properties} showButtons={true}/>
        </div>
      </div>
    </div>
  );
};


export default Rental;
