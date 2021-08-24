//import react
import React, { useState, useEffect } from "react";
//import {pinJSONToIPFS} from './pinata.js'
//import Modal from 'react-modal';
import moment from 'moment';
import Web3 from 'web3'
import {
/*connectWallet,*/
  getCurrentWalletConnected,
  extractBlockchainError //import here
} from "./connection.js";


import './PropertyListings.css'
import { BOOKINGMANAGER_ABI, BOOKINGMANAGER_ADDRESS } from '../config'

import Backdrop from '@material-ui/core/Backdrop';
import CircularProgress from '@material-ui/core/CircularProgress';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
//import InputLabel from '@material-ui/core/InputLabel';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';

import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
//import DialogContentText from '@material-ui/core/DialogContentText';
//import DialogTitle from '@material-ui/core/DialogTitle';




import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles((theme) => ({
  overrides: {
      MuiSelect: {
          root: {  //This can be referred from Material UI API documentation.
              width: '100px'
          },
      },
    MuiTableContainer: {
      root: {  //This can be referred from Material UI API documentation.

        width: '90%',
      }
    }
  },
  backdrop: {
    zIndex: theme.zIndex.drawer + 1,
    color: '#fff',
  },
  root: {
    '& > *': {
      margin: theme.spacing(1),
      width: '25ch',
    },
  },
  selectEmpty: {
    marginTop: theme.spacing(2),
  },
  modal: {
   display: 'flex',
   alignItems: 'center',
   justifyContent: 'center',
 },
 paper: {
   backgroundColor: theme.palette.background.paper,
   border: '2px solid #000',
   boxShadow: theme.shadows[5],
   padding: theme.spacing(2, 4, 3),
 },

}));

const stylesInput={
  width: '100px',
}

// @dev Takes care of the whole rental process/workflow
// first is the charging of non refundable fee
// then comes charging the deposit
// finally the rent

function AddRental(props)  {

  //State variables
  //const [walletAddress, setWallet] = useState("");
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [noOfWeeks, setNoOfWeeks] = useState(1);
  const [startDate, setStartDate] = useState("");
  const [reservTxHash, setReservTxHash] = useState("");
  const [depositTxHash, setDepositTxHash] = useState("");
  const [rentalTxHash, setRentalTxHash] = useState("");

  const [tokenAddr, setTokenAddr] = useState("");
  const [tokenId, setTokenId] = useState(-1);
  const [tokenURI, setTokenURI] = useState("");

  //const [submitDisabled, setSubmitDisabled] = useState(false);
  const [isDeposit, setIsDeposit] = useState(false);
  const [isRent, setIsRent] = useState(false);
  const [isSubmit, setIsSubmit] = useState(true);
  const [errors, setErrors] = useState("");
  const[weeks, setWeeks] = useState([]);
  //const [web3, setWeb3] = useState(null);
  //const[bookingInstance, setBookingInstance] = useState(null);

  const classes = useStyles();
  const [openBackdrop, setOpenBackdrop] = useState(false);

  const[disabled, setDisabled] = useState("");

  /*Const handleClose = () => {
      setModalIsOpen(false);
    };
*/
//  const[beforeDate, setBeforeDate] = useState('');
//  const[afterDate, setAfterDate] = useState('');


useEffect(() => {
   calculateWeeks();
   // intalize web3
   //init();
},[]);


    // Intalize web3
/*  async function init() {
      connectWallet();
      const {address, } = await getCurrentWalletConnected();
      //setWallet(address);
      addWalletListener();
      // intalize web3 with local ganache
      const web3 = new Web3(Web3.givenProvider || "http://localhost:8545");
      // get instance of the BookingManager Contract
      const bookingInstance = new web3.eth.Contract(BOOKINGMANAGER_ABI, BOOKINGMANAGER_ADDRESS)
      //setWeb3(web3);
      //setBookingInstance(bookingInstance);


    }
  */
  // Calculate the weeks between start date and end date to display
  // on the dropdown, not using calender, as no time
  function calculateWeeks() {
      //setStartDate(moment.unix(props.startDate).format('L'));

      let weeks = [];
      // set the first week as the start date
      //weeks[0] = props.startDate;
      // calculate a week in unix time
      const week = 7*24*60*60;
      // calculate the number of weeks between start date and end date
      // using floor to ignore any left over days after the last week
      const noWeeks =  (Math.floor(parseInt(props.endDate)) - parseInt(props.startDate))/week;
      //const noWeeks = 52;
      //console.log("No of weeks " + noWeeks)
      // Loop and get the weeks, any left over days are ignored
      for (let i = 0; i<= noWeeks -1 ; i++)
      {
        //console.log((parseInt(props.startDate) + i*parseInt(week)));
        //console.log(moment(new Date()/1000).valueOf())
        if ((parseInt(props.startDate) + i*parseInt(week)) >= moment(new Date()).valueOf()/1000)
          // calculate the starting date of the week
          weeks[i] =  parseInt(props.startDate) + i*parseInt(week);
      }

      setWeeks(weeks);

    }

  // update the value in state for each change
  const handleChange = event => {
        //const {name, value} = event.target.value
        const regexp = new RegExp(`^[1-9]\d*$`);
        if (regexp.test(event.target.value))
        {
          setNoOfWeeks( event.target.value);
        }
  }
  // update the value in state for each dropdown
  const handleSelect = event => {
    //const {name, value} = event.target;
    setStartDate( event.target.value);
  }
/*
  const handleDayChange = (selectedDay, modifiers, dayPickerInput) =>{
    const input = dayPickerInput.getInput();
    setStartDate(input.value);
  }
*/

// Get the token Address from blockchain, so can be added to the metamask
  async function getToken(tokenId) {
  // just make sure tokenId is not null
  if (tokenId > 0 )
  {
    try {
      const walletResponse = await getCurrentWalletConnected();
      const walletAddr = await walletResponse.address;
      const web3 = new Web3(Web3.givenProvider || "http://localhost:8545");
      // get instance of the BookingManager Contract
      const bookingInstance = new web3.eth.Contract(BOOKINGMANAGER_ABI, BOOKINGMANAGER_ADDRESS)

      //setSubmitDisabled(true);
      setOpenBackdrop(true);
      // get the token address from the BookingManager Contract
      const tokenAddr = await bookingInstance.methods.getTokenAddress(tokenId).call({from : walletAddr});
      setTokenAddr("Please add the token to your metamask, to see your minted token : " + tokenAddr);
      setIsRent(false);
      setIsDeposit(false);
      setIsSubmit(true);

    } catch (error) {
      setErrors(error.message);
    } finally {
      //setSubmitDisabled(false);
      setOpenBackdrop(false);


    }

  }
}
  async function generateTokenURI() {
     //make metadata
    const JSONBody = {
    name : 'Adieu Token :' + props.propertAddress,
    property : props.propertAddress,
    startDate : startDate,
    noOfWeeks : noOfWeeks
  }

  //make pinata call
   // Pass the date into the request body
  const pinataResponse = await fetch('/.netlify/functions/pinata', {
                            method: "POST",
                            body: JSON.stringify({JSONBody})
                          }).then((res) => res.json());
  console.log(pinataResponse);
  if (!pinataResponse.success) {

    setErrors("Uploading Token URI to pinata  @ : " + pinataResponse.message);
    setOpenBackdrop(false);
    //setSubmitDisabled(false);


  }
  var tokenURI = pinataResponse.pinataUrl;
  setTokenURI("Token URI @Pinata : " + tokenURI)
  return tokenURI;

}

// Call rent on the smart contract, that actually mints the token to the
// first address in metamask
  async function rent(tokenId) {
  setErrors("");
  try {
    if (tokenId > 0 )
    {
      const walletResponse = await getCurrentWalletConnected();
      const walletAddr = await walletResponse.address;
      const web3 = new Web3(Web3.givenProvider || "http://localhost:8545");
      // get instance of the BookingManager Contract
      const bookingInstance = new web3.eth.Contract(BOOKINGMANAGER_ABI, BOOKINGMANAGER_ADDRESS)

      //setSubmitDisabled(true);
      setOpenBackdrop(true);
      setDisabled(true);
      let txtHash;
      const tokenURI = generateTokenURI()
      if (tokenURI !== "") {
        // call blockchain async and wait till done
        await bookingInstance.methods.rent(
          tokenId, tokenURI).send(
          {from: walletAddr,
          value: web3.utils.toBN(props.rentFee*noOfWeeks)})
          .on('error', function(error, receipt) { // If the transaction was rejected by the network with a receipt, the second parameter will be the receipt.
            let sError = extractBlockchainError(error.message);
            setErrors("Rent  @ : " + sError);
            console.error(error)
          })
          // Once done, get the transaction hash and call getToken to get the
          // address of the token just minted
          .then(function(receipt){
            console.log("receipt")
            txtHash = receipt["transactionHash"]
            console.log(receipt["transactionHash"])

            getToken(tokenId);
        });

        setRentalTxHash("Rent Tx Hash: " + txtHash);
        setIsRent(false);
        setIsDeposit(false);
        //setSubmitDisabled(true);

      }
    }
  } catch(error) {
    let sError = extractBlockchainError(error.message);
    setErrors("Rent  @ : " + sError);
    //setSubmitDisabled(false);
  }
  finally {
    //setSubmitDisabled(false);
    setOpenBackdrop(false);
  }
}
// Connect to metmask and pay the required depoist
// Wait untill done and then call
  async function deposit(tokenId) {
    setErrors("");
    try {
      if (tokenId > 0 )
      {
          const walletResponse = await getCurrentWalletConnected();
          const walletAddr = await walletResponse.address;
          const web3 = new Web3(Web3.givenProvider || "http://localhost:8545");
          // get instance of the BookingManager Contract
          const bookingInstance = new web3.eth.Contract(BOOKINGMANAGER_ABI, BOOKINGMANAGER_ADDRESS)

          setOpenBackdrop(true);
          //setSubmitDisabled(true);
          setDisabled(true);
          //this.setState({TokenId, tokenId})
          let txtHash;
          await bookingInstance.methods.deposit(
          tokenId).send(
          {from: walletAddr,
          value: web3.utils.toBN(props.depositFee*noOfWeeks)}).then(function(receipt){
            txtHash = receipt["transactionHash"]
            console.log(receipt["transactionHash"])
            setTokenId(tokenId)
            setDepositTxHash("Deposit Tx Hash: " + txtHash)
            setIsRent(true);
            setIsDeposit(false);
            setIsSubmit(false);
            //setSubmitDisabled(false);
            rent(tokenId)
        });
      }

    } catch(error) {

      let sError = extractBlockchainError(error.message);
      setErrors("Deposit  @ : " + sError);
      //setSubmitDisabled(false);
      setOpenBackdrop(false);
      throw (error);
    }

}
// On submit, intiate the rental process, pay the nonRefundable fee
// wait, untill the block is minted and then get the tokenid from the
// events (using past events on the latest block)
  const handleSubmit = async(event) => {
    event.preventDefault()
    if (!startDate && !noOfWeeks)
      setErrors("");
      if (isSubmit === true)
        {

          setDisabled(true);
          setOpenBackdrop(true);
          if (parseInt(props.endDate) < (parseInt(startDate)  + parseInt(noOfWeeks)*7*24*60*60))
          {
            var strMessage = "Unfortunately this is beyond the end availibility ("
                +   moment.unix(props.endDate).format('L')
                + ") of the property, please reduce the number of weeks";
            setErrors(strMessage);

          }
          else {
            //setSubmitDisabled(false);
            setDepositTxHash("");
            setRentalTxHash("");
            setReservTxHash("");
            let txtHash = '';
            try {

            const walletResponse = await getCurrentWalletConnected();
            const walletAddr = await walletResponse.address;
            const web3 = new Web3(Web3.givenProvider || "http://localhost:8545");
            // get instance of the BookingManager Contract
            const bookingInstance = new web3.eth.Contract(BOOKINGMANAGER_ABI, BOOKINGMANAGER_ADDRESS)

            // intiate the rental process by calling reserve
            await bookingInstance.methods.reserve(
                                  props.propertyId,
                                  parseInt(startDate),
                                  noOfWeeks,
                                  walletAddr).send(
                                  {from: walletAddr,
                                  value: web3.utils.toBN(props.nonRefundableFee)})
                                  .on('transactionHash', function(hash){
                                    txtHash = hash


                                })
                                .on('receipt', function(receipt){
                                  console.log(JSON.parse(JSON.stringify(receipt)))
                                  console.log(JSON.parse(JSON.stringify(receipt))["events"]["NonRefundable"][0]["returnValues"]["tokenId"])
                                  var tokenId = JSON.parse(JSON.stringify(receipt))["events"]["NonRefundable"][0]["returnValues"]["tokenId"]
                                  setTokenId(tokenId);
                                  deposit(tokenId);

                                })
                                .on('confirmation', function(confirmationNumber, receipt){
                                })
                                //this.setState({confirmation : confirmationNumber})
                                .on('error', function(error, receipt) { // If the transaction was rejected by the network with a receipt, the second parameter will be the receipt.
                                  alert(JSON.stringify(error));
                                  let sError = extractBlockchainError(error.message);
                                  //alert()
                                  setErrors("Add Rental  @ : " + sError);
                                  //setSubmitDisabled(false);
                                  setOpenBackdrop(false);
                                  console.error(error)
                                });
            setReservTxHash("Reservation Tx: " + txtHash)
            setDisabled(true);
            setIsRent(false);
            setIsDeposit(true);
            setIsSubmit(false);

          } catch(error) {
              setDisabled(false);
              //let sError = extractBlockchainError(error.message);
              //setErrors("Add Rental  @ : " + sError);
              setErrors("Add Rental  @ : " + error.message);
              setOpenBackdrop(false);


          }
        }
      }
  }
  // open Modal
  function openModal() {
        setModalIsOpen(true);
        setIsSubmit(true);
        setIsDeposit(false);
        setIsRent(false);
        setReservTxHash("");
        setDepositTxHash("");
        setRentalTxHash("")
        setTokenURI("");
        setErrors("");
        setTokenAddr("");
        //setSubmitDisabled(false);
        setDisabled(false);

    };
    // Close Modal
  function closeModal() {
        setModalIsOpen(false);
    };


  return (
      <div key={props.propertyId}>
        <Button variant="contained" onClick={openModal}>Rent</Button>

        <Dialog open={modalIsOpen}  aria-labelledby="form-dialog-title" >
          <form  onSubmit={handleSubmit}  method="POST">
              <DialogContent>
                <Backdrop className={classes.backdrop} open={openBackdrop}>
                  <CircularProgress color="inherit" />
                </Backdrop>

                   <table  width="99%" blackHeader>
                     <tbody>
                       <tr className="blackHeader">
                           <td colSpan="2" text-align="center">
                             <div className="float-container">
                             <div align="left" className="float-child">{props.propertAddress} </div>

                             <div align="right" className="float-child">
                             </div>
                             </div>
                           </td>
                         </tr>

                       <tr>
                       <td>
                           <table>
                               <tbody>

                                 <tr>
                                   <td> Select Starting Week:  </td>
                                   <td>


                                       <Select
                                        required
                                        style={stylesInput}
                                         id="startDate"
                                         name="startDate"
                                         value={startDate}
                                         disabled={disabled}
                                         onChange={handleSelect}
                                         className={classes.selectEmpty}
                                       >
                                           { weeks.map((item, key1) => {
                                                     return(
                                                       <MenuItem key={key1} value={item}>{moment.unix(item).format('L')}</MenuItem>
                                                     )})}

                                               </Select>

                                   </td>

                                     <td> # of Consecutive weeks: </td>
                                     <td>
                                         <TextField id="noOfWeeks"
                                             required
                                             style={stylesInput}
                                             disabled={disabled}
                                             type="number"
                                             InputLabelProps={{
                                               required: true,
                                             }}
                                             inputProps={{
                                               min: 1,

                                             }}
                                             onChange={handleChange} />

                                     </td>
                                     </tr>
                                   </tbody>
                               </table>

                             </td>

                             <td>
                                <b>NOTE : This will be show up as three seperate transactions on your account </b>
                                 <br></br>
                                 <ul>
                                     <li>A Non Refundable Fee of <span className="content"><label id="lblNonRefundable">{(props.nonRefundableFee / 1000000000000000000).toFixed(3) } eth</label></span></li>
                                     <li>Refundable Deposit  <span className="content"><label id="lblDeposit">{(props.depositFee * noOfWeeks/ 1000000000000000000).toFixed(3)} eth</label></span></li>
                                     <li> Total Rent  <label id="lblRent">{(props.depositFee * noOfWeeks/ 1000000000000000000).toFixed(3)} eth</label></li>
                                 </ul>
                             </td>

                         </tr>
                       <tr>
                         <td colSpan="3">
                         <div className="lightBorder">
                           <br/>
                           <br/>
                           <label id="lblRvTxHash">{reservTxHash}</label><br></br>
                           <label id="lblDepositTxHash">{depositTxHash}</label> <br></br>
                           <label id="lblTokenURI">{tokenURI}</label> <br></br>
                           <label id="lblRentTxHash">{rentalTxHash}</label> <br></br>
                           <br/>
                           <b><label>{tokenAddr} </label></b>
                         </div>
                         </td>
                       </tr>
                       <tr>
                         <td colSpan="2" width="100%">

                         { errors.length > 0  &&
                             <div className="error">
                               ERROR : Please correct the errors and continue
                               <ul>
                               <li className="error" > {errors} </li>
                               </ul>
                             </div> }
                         </td>
                       </tr>

                     </tbody>
                   </table>

              <hr/>
              </DialogContent>

                <DialogActions>

                  <div>

                  {isSubmit && <Button variant="contained" type="submit" disabled={disabled}>Submit</Button>}

                 {isDeposit && <Button variant="contained" onClick={() =>deposit(tokenId)}>Deposit </Button>}

                 {isRent && <Button variant="contained" onClick={() =>rent(tokenId)}>Rent </Button>}
                 </div>
                 <div>
                   <Button variant="contained" onClick={closeModal}>Close</Button>
                 </div>


                </DialogActions>
                </form>
               </Dialog>

      </div>
    );

}

export default AddRental;
