import React, { Component } from 'react';
import { render } from 'react-dom';
import Modal from 'react-modal';
import moment from 'moment';
import Web3 from 'web3'
import './PropertyListings.css'
import { BOOKINGMANAGER_ABI, BOOKINGMANAGER_ADDRESS } from '../config'

// @dev Takes care of the whole rental process/workflow
// first is the charging of non refundable fee
// then comes charging the deposit
// finally the rent

class Workflow extends Component {

    constructor(props) {
        super(props)
        this.state = {
          account: '',
          modalIsOpen: false,
          secondModalIsOpen: false,
          nonRefundableFee : this.props.nonRefundableFee,
          depositFee :  this.props.depositFee,
          rentFee : this.props.rentFee,
          noOfWeeks: 0,
          startDate : this.props.startDate,
          endDate : this.props.endDate,
          txError : '',
          reservTxHash : '',
          depositTxHash: '',
          rentalTxHash : '',
          tokenAddr :  '',
          tokenId : -1

        }; 
        this.handleSubmit = this.handleSubmit.bind(this);
        this.init = this.init.bind(this);
        //this.calculateWeeks = this.calculateWeeks.bind(this);
    };
    // Intalize web3
    async init()  {
      // intalize web3 with local ganache
      const web3 = new Web3(Web3.givenProvider || "http://localhost:8545")
      // get accounts
      const accounts = await web3.eth.getAccounts()
      // get instance of the BookingManager Contract
      const bookingInstance = new web3.eth.Contract(BOOKINGMANAGER_ABI, BOOKINGMANAGER_ADDRESS)
      console.log("this.props.propertyId: " + this.props.propertyId);
      // Set State
      this.setState({web3})
      this.setState({ account: accounts[0] })
      this.setState({bookingInstance})
      

    }
  // Calculate the weeks between start date and end date to display 
  // on the dropdown, not using calender, as no time
  calculateWeeks = () => {
      let weeks = []
      // set the first week as the start date
      weeks[0] = this.props.startDate 
      // calculate a week in unix time
      const week = 7*24*60*60;
      // calculate the number of weeks between start date and end date
      // using floor to ignore any left over days after the last week
      const noWeeks = Math.floor(parseInt(this.props.endDate) - parseInt(this.state.startDate) )/7/24/60/60;
      
      console.log("No of weeks " + noWeeks)
      // Loop and get the weeks, any left over days are ignored
      for (let i = 1; i<= noWeeks ; i++)
      {
          // calculate the starting date of the week
          weeks[i] =  parseInt(this.props.startDate) + i*parseInt(week); 
      }
      this.setState({weeks})

    }
  componentWillMount() {
    // calculate the starting dates of all weeks
    this.calculateWeeks()
    // intalize web3
    this.init();
  }
  // update the value in state for each change 
  handleChange = event => {
        const {name, value} = event.target
        this.setState({
        noOfWeeks  : value
        })
        
  }
  // update the value in state for each dropdown
  handleSelect = event => {
    const {name, value} = event.target
    this.setState({
      startDate: value
    })
}
// Get the token Address from blockchain, so can be added to the metamask 
getToken = async(tokenId) => {
  // just make sure tokenId is not null
  if (tokenId > 0 )
  {
    // get the token address from the BookingManager Contract
    const tokenAddr = await this.state.bookingInstance.methods.getTokenAddress(tokenId).call();
    this.setState({tokenAddr : "Please add the token to your metamask, to see your minted token : " + tokenAddr})
  }
}
// Call rent on the smart contract, that actually mints the token to the
// first address in metamask
rent = async(tokenId) => {
  if (tokenId > 0 )
  {
    var self = this;
    let txtHash
    let tokenURI = "URI";
    var txError
    var self = this
    // call blockchain async and wait till done
    await this.state.bookingInstance.methods.rent(
      tokenId, tokenURI).send(
      {from: this.state.account, 
      value: this.props.rentFee*this.state.noOfWeeks})
      .on('error', function(error, receipt) { // If the transaction was rejected by the network with a receipt, the second parameter will be the receipt.
        alert(JSON.parse(JSON.stringify(error))["message"]);
        console.log(error)
        txError = error
      })
      // Once done, get the transaction hash and call getToken to get the
      // address of the token just minted    
      .then(function(receipt){
        console.log("receipt")
        txtHash = receipt["transactionHash"]
        console.log(receipt["transactionHash"])
        self.getToken(tokenId)
    });

  this.setState({txError}) 
  this.setState({rentalTxHash : "Rent Tx Hash: " + txtHash})                   
 
  }
}
// Connect to metmask and pay the required depoist 
// Wait untill done and then call
deposit = async(tokenId) => {
  if (tokenId > 0 )
  {
      var self = this;
      //this.setState({TokenId, tokenId})
      let txtHash
      let txError
      await this.state.bookingInstance.methods.deposit(
      tokenId).send(
      {from: this.state.account, 
      value: this.props.depositFee*this.state.noOfWeeks}).then(function(receipt){
        txtHash = receipt["transactionHash"]
        console.log(receipt["transactionHash"])
        self.rent(tokenId)
    });

  this.setState({txError}) 
  this.setState({depositTxHash : "Deposit Tx Hash: " + txtHash})                   
  
  }

}
// On submit, intiate the rental process, pay the nonRefundable fee
// wait, untill the block is minted and then get the tokenid from the 
// events (using past events on the latest block)
async handleSubmit(event) {
      event.preventDefault()

      let txError = ''
      let txtHash = ''
      // intiate the rental process by calling reserve
      await this.state.bookingInstance.methods.reserve(
                            this.props.propertyId, 
                            this.state.startDate, 
                            this.state.noOfWeeks, 
                            this.state.account).send(
                            {from: this.state.account, 
                            value: this.props.nonRefundableFee})
                            .on('transactionHash', function(hash){
                              txtHash = hash
                              
                          })
                          .on('confirmation', function(confirmationNumber, receipt){
                            //this.setState({confirmation : confirmationNumber})
                          })
                          .on('error', function(error, receipt) { // If the transaction was rejected by the network with a receipt, the second parameter will be the receipt.
                            alert(JSON.parse(JSON.stringify(error))["message"]);
                            console.log(error)
                            txError = error
                          });
    this.setState({txError : txError}) 
    this.setState({reservTxHash : "Reservation Tx: " + txtHash}) 
    // setting this to self, need to look into to get a better way
    // need to do this is undefined in call back functions and have to call the
    // deosit function once we have the tokenid
    var self = this;
    // Get past events and wait
    const results =  this.state.bookingInstance.getPastEvents('NonRefundable', {
        fromBlock: 'latest',
        toBlock: 'latest'
    }, function(error, events){ console.log(events); })
      .then(function(events){
        // parse the json and get the tokenId
        let tokenId = JSON.parse(JSON.stringify(events))[0]["returnValues"][0]
        // call deposit
        self.deposit(tokenId)
    });
  }
  // open Modal     
    openModal = () => {
        this.setState({ modalIsOpen: true });
    };
    // Close Modal
    closeModal = () => {
        this.setState({ modalIsOpen: false });
    };

  render() {
    return (
      <div>
        <button onClick={this.openModal} className="blackSubmit"> Rent </button>


        <Modal isOpen={this.state.modalIsOpen} onRequestClose={this.closeModal}>
        <form onSubmit={this.handleSubmit}>  
          <table  width="99%" blackHeader>
              
            <tr className="blackHeader">
                <td align="left"><div> {this.props.propertAddress} </div>  
                </td>
                <td align="right"><button onClick={this.closeModal}>X</button>  
                </td>

            </tr> 
            
            <tr>
            <td>
                  <table>
                  <tr>
                    <td> Select Starting Week:  </td>
                    <td> 
                      <select id="selNoOfWeeks"
                      placeholder="Select Starting week"
                      onChange={this.handleSelect}
                      
                      >

                      { this.state.weeks.map((item) => {
                        return(
                          <option value={item} >
                            {moment.unix(item).format('L')}
                          </option>
                        )})}
                      </select>
                    </td>
                  </tr>
                  <tr>
                    
                      <td> # of Consecutive weeks: </td>
                      <td>
                          <input 
                            id="noOfWeeks"
                            name="noOfWeeks"
                            type="text"
                            placeholder="Enter the # of Weeks"
                            onChange={this.handleChange} // Prop: Puts data into state
                          />
                      </td>
                      </tr>
                    
                  </table>
                   
                </td>

                <td>
                   <b>NOTE : This will be show up as three seperate transactions on your account </b>
                    <br></br>
                    <ul>
                        <li>A Non Refundable Fee of <span className="content"><label id="lblNonRefundable">{Math.round(this.props.nonRefundableFee / 1000000000000000000, 3)} eth</label></span></li>
                        <li>Refundable Deposit  <span className="content"><label id="lblDeposit">{Math.round(this.props.depositFee * this.state.noOfWeeks/ 1000000000000000000, 3)} eth</label></span></li>
                        <li> Total Rent  <label id="lblRent">{Math.round(this.props.depositFee * this.state.noOfWeeks/ 1000000000000000000, 3)} eth</label></li>
                    </ul>
                </td>
                
            </tr>   
            <tr>
             <td>
             <button type="submit" className="blackSubmit">
                    Submit
            </button>     
            </td>   
            </tr>

            <tr>
              <div>
                <br/>
                <br/>
                <label id="lblRvTxHash">{this.state.reservTxHash}</label><br></br>
                <label id="lblDepositTxHash">{this.state.depositTxHash}</label> <br></br>
                <label id="lblRentTxHash">{this.state.rentalTxHash}</label> <br></br>
                <br/>
                <b><label>{this.state.tokenAddr} </label></b>
              </div>
            </tr>
            <tr>
              <td colspan="2">
                  <label id="lblerror" >{this.state.error}</label>

              </td>

            </tr>

          </table>  
          
        </form>  
        </Modal>

        <Modal
          isOpen={this.state.secondModalIsOpen}
          onRequestClose={this.closeSecondModal}
        >
          <button onClick={this.closeSecondModal}>close</button>
          <div>second modal</div>
        </Modal>
      </div>
    );
  }
}

export default Workflow;