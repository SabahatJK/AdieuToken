import ReactDOM from 'react-dom';
import React, { Component } from 'react'
import Web3 from 'web3'
import { BOOKINGMANAGER_ABI, BOOKINGMANAGER_ADDRESS } from '../config'



class MyRentals extends Component {
  componentWillMount() {
    this.init()
  } 
  
  init = async() =>  {
    //const { account, propertyId, startDate, noOfWeeks } = this.state
    const web3 = new Web3(Web3.givenProvider || "http://localhost:8545")
    const accounts = await web3.eth.getAccounts()
    const bookingInstance = new web3.eth.Contract(BOOKINGMANAGER_ABI, BOOKINGMANAGER_ADDRESS)
    console.log("this.props.propertyId: " + this.props.propertyId);
    this.setState({web3})
    this.setState({ account: accounts[0] })
    this.setState({bookingInstance})
    const bookingCount = await bookingInstance.methods.getBookingCnt(accounts[0]).call()
    this.setState({ bookingCount })
    for (var i = 0; i <= bookingCount; i++) {
      const bookingId = await bookingInstance.methods.tenantTokens(this.state.account, i).call()
      const booking = await bookingInstance.methods.getDetails(bookingId).call()
      this.setState({
        bookings: [...this.state.bookings, booking]
      })
    }
}  
    

constructor(props) {
  super(props)
  this.state = {
    account: '',
    bookingCount: 0,
    bookings: []
  };
 
 
}    
render() {
    return (
      <div>
          <div id="loader" className="text-center">
            <p className="text-center">Loading...{this.state.bookingCount}</p>
          </div>
        <div className="row">
          This is a test
        </div>
      </div>
  );
  };
}

export default MyRentals;