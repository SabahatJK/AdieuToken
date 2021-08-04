import React, { Component } from 'react';
import { render } from 'react-dom';
import Modal from 'react-modal';
import moment from 'moment';

import DayPickerInput from 'react-day-picker/DayPickerInput';
import 'react-day-picker/lib/style.css';

import Web3 from 'web3'
import IpfsAPI from 'ipfs-api'

import MyProperties from './MyProperties';
import './PropertyListings.css'

import { PROPERTMANAGER_ABI, PROPERTMANAGER_ADDRESS } from '../config'

// @dev Takes care of the whole rental process/workflow
// first is the charging of non refundable fee
// then comes charging the deposit
// finally the rent

class MyListings extends Component {

    constructor(props) {
        super(props)
        this.state = {
          account: '',
          modalIsOpen: false,
          address : '',
          rent : 0,
          deposit : 0,
          nonRefund : 0,
          startDate: 0,
          endDate : 0,
          ifpsUrl : '',
          beds : 0,
          bath: 0,
          sqtFeet: 0,
          Type : 0,
          Heating: '',
          Cooling : '',
          Parking: '',
          imageUrl : '',
          description: '',
          propertyCount : 0,
          properties : [],

          selectedDay: undefined,
          isEmpty: true,
          isDisabled: false,
        }; 
    };

    handleDayChange = (selectedDay, modifiers, dayPickerInput) =>{
      const input = dayPickerInput.getInput();
      this.setState({
        selectedDay,
        isEmpty: !input.value.trim(),
        isDisabled: modifiers.disabled === true,
      });
    }  
  handleIntegerChange = (event) => {
      const regexp = new RegExp(`^-?[0-9]*$`);
      const target = event.target;
      const value = target.value;
      const name = target.name;
      if (regexp.test(value)) 
      {
        this.setState({
          [name]: value
        });
      }
    }

    handleInputChange = (event) => {

      const target = event.target;
      const value = target.value;
      const name = target.name;
      this.setState({
        [name]: value
      });
    }

    // Intalize web3
    async init()  {
      // intalize web3 with local ganache
      const web3 = new Web3(Web3.givenProvider || "http://localhost:8545")
      // get accounts
      const accounts = await web3.eth.getAccounts()
      // Set State
      this.setState({web3})
      this.setState({ account: accounts[0] })

  
      const propertyManagerInstance = new web3.eth.Contract(PROPERTMANAGER_ABI, PROPERTMANAGER_ADDRESS)
      // save to state ?/
      this.setState({ propertyManagerInstance })
      // get count of the properties on blockhain via web3 
      const propertyCount = await propertyManagerInstance.methods.getOwnerCount(accounts[0]).call()

      // save count
      this.setState({ propertyCount })
      // loop and get each propertu details
      for (var i = 0; i < propertyCount; i++) {
        const index = await propertyManagerInstance.methods.ownerTokens(accounts[0], i).call()
        const property = await propertyManagerInstance.methods.getDetails(index).call()
        //save to state
        this.setState({
          properties: [...this.state.properties, property]
        })
      }      

    }
  componentWillMount() {
    // intalize web3
    this.init();
    
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
        <p></p>
        <button onClick={this.openModal} className="blackSubmit"> Add Listing </button>
        <Modal isOpen={this.state.modalIsOpen} onRequestClose={this.closeModal}>
        <p></p>
        <form onSubmit={this.handleSubmit}>  
          <table  width="99%" cellSpacing="5px" >
              
            <tr className="blackHeader">
              <td align="left" colSpan="2"><div> Add Listings </div>  
              </td>
              <td align="right"  colSpan="2">
                  <button onClick={this.closeModal}>X</button>  
              </td>
            </tr>
            <tr className="table_padding">  
              <td>
                Address :
              </td>
              <td>
                <input
                    id="address"
                    name="address"
                    type="text"
                    style={{width: "370px"}}
                    placeholder="Address here"
                    value={this.state.address}
                    onChange={this.handleChange}
                />
              </td>

         
              <td>
                Rent :
              </td>
              <td>                
                <input
                    id="rent"
                    name="rent"
                    type="text"
                    
                    value={this.state.rent}
                    onChange={this.handleIntegerChange}
                />
              </td>

            </tr>
            <tr cellPadding="10px">  
                <td>
                  Start Date :
                </td>
                <td>                  
                  <DayPickerInput

                    value={this.state.startDate}
                    onDayChange={this.handleDayChange}
                    dayPickerProps={{
                      selectedDays: this.state.startDate,
                     
                    }}
                  />
                  </td>
                <td>
                  End Date :
                  </td>
                <td>                  

                  <DayPickerInput
                    
                    value={this.state.startDate}
                    onDayChange={this.handleDayChange}
                    dayPickerProps={{
                      selectedDays: this.state.startDate,
                     
                    }}
                  />
                  </td>

            </tr>            
            <tr>
              <td></td>
            </tr>
            </table>
         </form>
        </Modal>
        <div className="row">
          <MyProperties properties={this.state.properties} ></MyProperties>
        </div>

      </div>
    );
  }
}

export default MyListings;