import React, { Component } from 'react'
import './PropertyListings.css'

// @dev Displays the details from a file uploaded to pinata
class PropertyDetails extends Component {
  
  constructor(props) {
    super(props)
    this.state = {
      details: []
    }
  };

  
  componentWillMount() {
    // get details from IPFS using the url stored in listings 
    const details = this.fetchIPFS(this.props.ifpsUrl);
    console.log(details)
  } 
  
    
  // Fetch Data from  IPFS @ ifpsUrl
  async  fetchIPFS(ifpsUrl) {
    try {
      // fetch
      let response = await fetch(ifpsUrl);
      // wait for the response, as ayunchornous
      let responseData  = await response.json();
      // set State
      this.setState({details : responseData})
      return (responseData);
      
     } catch(error) {
      console.error(error);
    }
  }
       
  render() {
        return (
          <div border="1">
      <table width="99%" cellPadding="1" >
        <tr>
          <td>
            <img src={this.state.details["Images"]} width="100" height="100"></img> 
          </td>
          <td>
          &nbsp;&nbsp;
          </td>
            <td> {this.state.details["Description"]}  </td>
        </tr>
        </table>
        <table width="90%" >
              <tr>
                <td> SqtFeet: {this.state.details["SqtFeet"]} sqft </td>
                <td> Type: {this.state.details["Type"]} </td>
                <td> Beds: {this.state.details["Beds"]} bds </td>
                <td> Baths: {this.state.details["Baths"]} ba </td>
                <td> Heating: {this.state.details["Heating"]} </td>
                <td> Cooling: {this.state.details["Cooling"]} </td>
                <td> Parking: {this.state.details["Parking"]} </td>
                
              </tr>
        </table>
        <br></br>
        <br></br>
        <br></br>
                        
      </div>
       );
    }
  }    


export default PropertyDetails;