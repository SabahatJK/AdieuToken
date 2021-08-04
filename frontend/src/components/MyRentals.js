import ReactDOM from 'react-dom';
import React, { Component } from 'react'
import Web3 from 'web3'
import './PropertyListings.css'

import { BOOKINGMANAGER_ABI, BOOKINGMANAGER_ADDRESS } from '../config'
import moment from 'moment';



class MyRentals extends Component {
  componentWillMount() {
    this.init()
  } 
  
  init = async() =>  {
    //const { account, propertyId, startDate, noOfWeeks } = this.state
    const web3 = new Web3(Web3.givenProvider || "http://localhost:8545")
    const accounts = await web3.eth.getAccounts()
    const bookingInstance = new web3.eth.Contract(BOOKINGMANAGER_ABI, BOOKINGMANAGER_ADDRESS)
    this.setState({web3})
    this.setState({ account: accounts[0] })
    this.setState({bookingInstance})
    const bookingCount = await bookingInstance.methods.getCntForTenant(accounts[0]).call()
    this.setState({ bookingCount})
    for (var i = 0; i < this.state.bookingCount; i++) {
      const index = await bookingInstance.methods.tenantTokens(this.state.account, i).call()
      const booking = await bookingInstance.methods.getDetails(index).call()
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
getStatus =(status) => {
  switch(status) {
    case '0':
      return 'Non Refundable FeeRequired'
    case '1':
      return 'Deposit Required'
    case '2':
      return 'Rent Required'
    default:
      return 'Rented'
  }

}  
render() {
    return (
      <div>
        <p></p>
        <main role="main" className="col-lg-12 d-flex justify-content-center">
                      <div id="loader" className="text-center">
                        <p className="text-center">Loading...{this.state.bookingCount}</p>
                      </div>
          </main>
        <p></p>  
        <table className="rentaltable" >
          <tr className="blackHeader">
            <td> Address </td>
            <td> Start Date </td>
            <td> # Of Weeks </td>
            <td> Rent </td>
            <td> Deposit </td>
            <td> Status </td>
          </tr>
        { this.state.bookings.map((booking, key) => {
              return(
                  <tbody>
                    <tr>
                      <td>

                        <span className="content">{booking.addr} &nbsp;</span>
                      </td>
                      <td>
                      <span className="content">{moment.unix(booking.startDate).format('L')} &nbsp;</span>
                      

                      </td>
                      <td>
                      <span className="content">{booking.noOfWeeks} &nbsp;</span>
                      
                      </td>
                      <td>
                      <span className="content">{booking._rent/ 1000000000000000000} eth &nbsp;</span>
                      
                      </td>
                      <td>
                      <span className="content">{booking._deposit/ 1000000000000000000} eth &nbsp;</span>
                      
                      </td>
                      <td>
                      <span className="content">{this.getStatus(booking._status)} &nbsp;</span>

                        </td>
                    </tr>
                    </tbody>
              )
            })}
            </table>
        </div>
  );
  };
}

export default MyRentals;