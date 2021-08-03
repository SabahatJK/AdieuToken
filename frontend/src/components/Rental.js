import ReactDOM from 'react-dom';
import React, { Component } from 'react'
import Web3 from 'web3'
import { PROPERTMANAGER_ABI, PROPERTMANAGER_ADDRESS } from '../config'

import PropertyListings from './PropertyListings';

/*
 @dev Component to get properties to rent from blockchain
 display using PropertyListing Component

*/
class Rental extends Component {

  componentWillMount() {
      this.loadBlockchainData()
  } 

  componentDidMount() {
    // Check if web3 is enabled and loaded
    var web3 = new Web3();
      if (window.ethereum) {
        web3 = new Web3(window.ethereum);
        try {
          window.ethereum.enable().then(function() {

          });
        } catch (e) {
          // User has denied account access to DApp...
          alert("You have denied access to the dapp")
        }
      }
      // Legacy DApp Browsers
      else if (window.web3) {
        web3 = new Web3(web3.currentProvider);
        window.ethereum.enable();
      }
      // Non-DApp Browsers
      else {
        alert("You have to install MetaMask !");
      }
      
      console.log(" typoe of = ", typeof web3);
      if (typeof web3 != "undefined") {
        this.web3Provider = web3.currentProvider;

      } else {
        this.web3Provider = new Web3.providers.HttpProvider(
          "http://127.0.0.1:8545"
        );
        window.ethereum.enable();
      }

  }
  // @dev Load the properties from blockchain
  async loadBlockchainData() {
    // Get web3 provider - pointing to ganache
    const web3 = new Web3(Web3.givenProvider || "http://localhost:8545")
    // Get the accounts 
    const accounts = await web3.eth.getAccounts()
    // Set state
    this.setState({ account: accounts[0] })
    // create an instnace of the PropertyManager smart contract
    const propertyManagerInstance = new web3.eth.Contract(PROPERTMANAGER_ABI, PROPERTMANAGER_ADDRESS)
    // save to state ?/
    this.setState({ propertyManagerInstance })
    // get count of the properties on blockhain via web3 
      const propertyCount = await propertyManagerInstance.methods.getCount().call()
    // save count
    this.setState({ propertyCount })
    // loop and get each propertu details
    for (var i = 0; i <= propertyCount; i++) {
      const property = await propertyManagerInstance.methods.getDetails(i).call()
      //save to state
      this.setState({
        properties: [...this.state.properties, property]
      })
    }
}

constructor(props) {
  super(props)
  this.state = {
    account: '',
    propertyCount: 0,
    properties: []
  };
 
 
}    
render() {
    return (
      <div>
        <nav>
        </nav>
        <div className="container-fluid">
          <main role="main" className="col-lg-12 d-flex justify-content-center">
                      <div id="loader" className="text-center">
                        <p className="text-center">Loading...{this.state.propertyCount}</p>
                      </div>
          </main>
        <div className="row">
          <PropertyListings properties= {this.state.properties}></PropertyListings>
        </div>
      </div>
    </div>
  );
  };
}

export default Rental;