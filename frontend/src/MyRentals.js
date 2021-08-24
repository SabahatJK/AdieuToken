import React, { useState, useEffect, useRef ,useContext } from "react";
import Web3 from 'web3'
import './PropertyListings.css'

import {
  connectWallet,
  getCurrentWalletConnected //import here
} from "./connection.js";

import { BOOKINGMANAGER_ABI, BOOKINGMANAGER_ADDRESS } from '../config'
import WalletContext from './context';
import {extractBlockchainError} from './connection'
import moment from 'moment';

import { withStyles, makeStyles, createTheme } from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';
import { ThemeProvider } from '@material-ui/core'
import Button from '@material-ui/core/Button';


import Snackbar from '@material-ui/core/Snackbar';
import Slide from '@material-ui/core/Slide';
import Backdrop from '@material-ui/core/Backdrop';
import CircularProgress from '@material-ui/core/CircularProgress';



const StyledTableCell = withStyles((theme) => ({
  head: {
    backgroundColor: theme.palette.common.black,
    color: theme.palette.common.white,
  },
  body: {
//    fontSize: 14,
  },
}))(TableCell);

const StyledTableRow = withStyles((theme) => ({
  root: {
    '&:nth-of-type(odd)': {
      backgroundColor: theme.palette.action.hover,
    },
  },
}))(TableRow);

const theme = createTheme({
    overrides: {
        MuiTableCell: {
            root: {  //This can be referred from Material UI API documentation.
                padding: '5px',
                width: '600px'
            },
        },
      MuiTableContainer: {
        root: {  //This can be referred from Material UI API documentation.

          width: '90%',
        }
      }
    },
});

const useStyles = makeStyles((theme) => ({
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
  table: {
    minWidth: 700,
  },

}));

function TransitionLeft(props) {
  return <Slide {...props} direction="left" />;
}

function TransitionUp(props) {
  return <Slide {...props} direction="up" />;
}

function TransitionRight(props) {
  return <Slide {...props} direction="right" />;
}

function TransitionDown(props) {
  return <Slide {...props} direction="down" />;
}

function MyRentals(props)  {
  const classes = useStyles();

  const [openBackdrop, setOpenBackdrop] = useState(false);
  const [openTransition, setOpenTransition] = useState(false);
  const [transition, setTransition] = useState(undefined);
  const [transitionMessage, setTransitionMessage] = useState("");

  const[disabled, setDisabled] = useState("");

  const [walletAddress, setWallet] = useState("");
  const [bookingCount, setBookingCount] = useState("");
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState('');
  //const [web3, setWeb3] = useState(null);
  const [bookingInstance, setBookingInstance] = useState(null);

  const [reservTxHash, setReservTxHash] = useState("");
  const [depositTxHash, setDepositTxHash] = useState("");
  const [rentalTxHash, setRentalTxHash] = useState("");

  const [tokenAddr, setTokenAddr] = useState("");
  const [tokenId, setTokenId] = useState(1);
  const [tokenURI, setTokenURI] = useState("");

  const [submitDisabled, setSubmitDisabled] = useState(false);
  const [status, setStatus] = useState("");
  const [isRent, setIsRent] = useState(false);
  const [isSubmit, setIsSubmit] = useState(true);
  const [counter, setSetCounter]  = useState(0);

  const [isUpdated, setIsUpdated] = useState(false);

  const walletInfo = useContext(WalletContext);
  const [contextWallet, setContextWallet] = useContext(WalletContext);

  const myBookingRef = useRef(bookings);

 useEffect(() => {
      setWallet(walletInfo);
      loadBlockchainData(walletInfo);
 }, [walletInfo]);


async function loadBlockchainData(address)  {
    let walletAddr;
    if (address === undefined || address.trim() === "")
    {
      const obj = getCurrentWalletConnected();
      walletAddr = obj.address;
      setContextWallet(walletAddr);
    }
    else {
      walletAddr = address;
    }
    setWallet(walletAddr);
    setError('');
    //setBookings([]);

    const web3 = new Web3(Web3.givenProvider || "http://localhost:8545")
    const bookingInstance = new web3.eth.Contract(BOOKINGMANAGER_ABI, BOOKINGMANAGER_ADDRESS)
    //setWeb3(web3);
    setBookingInstance(bookingInstance);
    if (!props.isPropertyRental)
    {

      const bookingCount = await bookingInstance.methods.getCntForTenant(address).call({from: walletAddr});
      setBookingCount(bookingCount);
      let newBookings = [];
      var i  = 0;
      for (i = 0; i < bookingCount; i++) {
        try {

          const index = await bookingInstance.methods.tenantTokens(walletAddr, i).call({from: walletAddr})
          const booking = await bookingInstance.methods.getDetails(index).call({from: address})
          const isRefund = await bookingInstance.methods.getRefund(booking.tokenid).call({from: walletAddr})
          booking.isRefund = isRefund;
          booking.isToken = (booking._status === "3") ? true : false;
          setSetCounter(i + 1)
          newBookings = newBookings.concat( booking);
        }
        catch(error) {
          //alert("An error occured while loading data : " + " i " + error.message);
          let sError = extractBlockchainError(error.message);
          setError(" Load Data from Blockchain @ index " + i + " : " + sError);
          continue;
        }
        setBookings(newBookings);
      }
    }
    else {

        const bookingCount = await bookingInstance.methods.getCntForTenant(walletAddr).call({from: walletAddr});
        alert("properttId" + props.propertyId);
        setBookingCount(bookingCount);
        let newBookings = [];
        var i  = 0;
          for (i = 0; i < bookingCount; i++) {
            try {
            const index = await bookingInstance.methods.propertyBookings(props.propertyId, i).call({from : walletAddr})
            alert(index)
            const booking = await bookingInstance.methods.getDetails(index).call({from : walletAddr})
            //const isRefund = await bookingInstance.methods.getRefund(booking.tokenid).call()
            //booking.isRefund = isRefund
            //const isWithdrawal = await bookingInstance.methods.getWithdrawal(booking.tokenid).call()
            //booking.isWithdrawal = isWithdrawal
            setSetCounter(i + 1)
            newBookings = newBookings.concat( booking);
            }


            catch(error)
           {
             //alert("An error occured while loading data : " + " i " + error.message);
             let sError = extractBlockchainError(error.message);
             setError(" Load Data from Blockchain @ index " + i + " : " + sError);
             //continue;
             throw(error);
           }
           setBookings(newBookings);

      }
    };

};
function sleep(milliseconds)  {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
}
async function generateTokenURI() {
   //make metadata

  const JSONBody = {
    name : 'Adieu Token :' + props.propertAddress,
    property : props.propertAddress,
    startDate : props.startDate,
    noOfWeeks : props.noOfWeeks
  }

  //make pinata call
   // Pass the date into the request body
  const pinataResponse = await fetch('/.netlify/functions/pinata', {
                            method: "POST",
                            body: JSON.stringify({JSONBody})
                          }).then((res) => res.json());
  console.log(pinataResponse)
  if (!pinataResponse.success) {
      setError("😢 Something went wrong while uploading your tokenURI. Error : " + pinataResponse.message )
  }
  else {
    var tokenURI = pinataResponse.pinataUrl;
    setOpenTransition(false);
    await sleep(1000);
    setTokenURI(tokenURI);
    setTransitionMessage("Token URI : "  + tokenURI );
    setOpenTransition(true);
    setTransition(() => TransitionUp);
    return tokenURI;
}
}

async function payRent(tokenId, rent, noOfWeeks, key) {
  if (tokenId > 0 )
  {
    setOpenBackdrop(true);
    try {

        const tokenURI = generateTokenURI();
        // call blockchain async and wait till done
        await bookingInstance.methods.rent(
          tokenId, tokenURI).send(
          {from: walletAddress,
          value: rent})
          .on('error', function(error, receipt) { // If the transaction was rejected by the network with a receipt, the second parameter will be the receipt.
            alert(JSON.parse(JSON.stringify(error))["message"]);
            console.log(error)
            setError(JSON.parse(JSON.stringify(error))["message"])
          })
          // Once done, get the transaction hash and call getToken to get the
          // address of the token just minted
          .then(function(receipt){
            setOpenTransition(false);
            console.log("receipt")
            let txtHash = receipt["transactionHash"]
            setRentalTxHash(txtHash);
            setIsRent(false);
            bookings[key]._status = '3';
            bookings[key].tokenURI = tokenURI;
            setBookings(bookings)

            setTransitionMessage("Rent receipt TX hash : "  + txtHash );
            setTransition(() => TransitionRight);
            setOpenTransition(true);
            setOpenBackdrop(false);

            //loadBlockchainData();
        });

    } catch (error) {
        setError("An error occured @ the deposit stage. Error : " + error.message)
        alert("SAn error occured @ the deposit stage. Error : " + error.message);
        setOpenBackdrop(false);

    } finally {

    }
  }
}

// Connect to metmask and pay the required depoist
// Wait untill done and then call
async function payDeposit(tokenId, deposit, rent, noOfWeeks, key){
  if (tokenId > 0 )
  {
      setOpenBackdrop(true);
      try{

          await bookingInstance.methods.deposit(
          tokenId).send(
          {from: walletAddress,
          value: deposit}).then(function(receipt){
            let txtHash = receipt["transactionHash"]
            setDepositTxHash("Deposit Tx Hash: " + txtHash)
            //setStatus(2);
            console.log(receipt["transactionHash"]);
            setOpenTransition(false);
            setTransitionMessage("Deposit receipt TX hash : "  + txtHash );
            setOpenTransition(true);
            setTransition(() => TransitionRight);

            bookings[key]._status = '2';
            setBookings(bookings);

            payRent(tokenId, rent, noOfWeeks, key);
        });
        //loadBlockchainData();
      }
      catch(error) {
        setError("An error occured @ the deposit stage. Error : " + error.message)
        alert("An error occured @ the deposit stage. Error : " + error.message);
        setOpenBackdrop(false);
      }
  }

}
// Get the token Address from blockchain, so can be added to the metamask

async function refund(tokenId, deposit, noOfWeeks, key){
  if (tokenId > 0 )
  {
      setOpenBackdrop(true);
      try{
        await bookingInstance.methods.refund(
        tokenId).send(
        {from: walletAddress}).then(function(receipt){
          let txtHash = receipt["transactionHash"]
          console.log(receipt["transactionHash"])
          loadBlockchainData()
      });
    }
    catch(error) {
      setError("An error occured @ the Refund transaction. Error : " + error.message)
      setOpenBackdrop(false);
    }
  }
}
//booking._status,booking.tokenid, booking._rent, booking._deposit,noOfWeeks
function getStatusButton(status, tokenId, rent, deposit, noOfWeeks, key ) {
  switch(status) {
    case '0':
      return "Non Refundable FeeRequired"
    case '1':
      return <Button  variant="contained"   onClick={() => payDeposit(tokenId, deposit, rent, noOfWeeks, key)}>Deposit</Button>
    case '2':
      return <Button variant="contained"   onClick={() => payRent(tokenId, rent, noOfWeeks, key)}>Rent</Button>
    default:
      return "----"
  }

}
function getStatus(status, tokenId, rent, deposit, noOfWeeks ) {
  switch(status) {
    case '0':
      return 'Non Refundable FeeRequired'
    case '1':
      return "Deposit Required"
    case '2':
      return 'Rent Required'
    default:
      return 'Rented'
  }

}
const handleCloseTransition= () => {
  setOpenTransition(false);
};



//booking._status,booking.tokenid, booking._rent, booking._deposit,noOfWeeks
function showWidthdraw(tokenId, startDate, noOfWeeks, deposit, isRefund, key )  {
  var current = moment().format("L");
  if (moment(current).unix() >  (Number(startDate) + Number(noOfWeeks)*7*24*60*60 + 5*24*60*60) )
  {
    if (isRefund)
      return <Button  variant="contained"
          onClick={() =>refund(tokenId, deposit, noOfWeeks, key)}>Refund</Button>
    else
      return '----'
  }
};
    return (
      <div>
      <Backdrop className={classes.backdrop} open={openBackdrop}>
        <CircularProgress color="inherit" />
      </Backdrop>

        <br/>
        { error.length > 0  &&
            <div className="error">
              ERROR : The following errors occured:
              <ul>
              <li className="error" > {error} </li>
              </ul>
            </div> }


            <main role="main" >
              <div id="loader" className="text-center">
                <p className="text-center">Loading...{counter}</p>
              </div>
          </main>
        <br/>
        <br/>

          <ThemeProvider  theme={theme}>
            <TableContainer component={Paper}>
              <Table className={classes.table} aria-label="My Rentals">
                <TableHead>
                  <TableRow>
                  <StyledTableCell></StyledTableCell>
                    <StyledTableCell>Address</StyledTableCell>
                    <StyledTableCell align="left" >Token</StyledTableCell>
                    <StyledTableCell align="left">Start Date</StyledTableCell>
                    <StyledTableCell align="left"># of Weeks</StyledTableCell>
                    <StyledTableCell align="left">Rent</StyledTableCell>
                    <StyledTableCell align="left">Deposit</StyledTableCell>
                    <StyledTableCell align="left">Status</StyledTableCell>
                    <StyledTableCell align="left"></StyledTableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {bookings.map((booking, key) => (
                    <StyledTableRow key={booking.tokenid}>
                      <StyledTableCell component="th" scope="row">
                        {booking.tokenid}
                      </StyledTableCell>
                            <StyledTableCell align="left"> {booking.addr}</StyledTableCell>
                            <StyledTableCell align="left">{booking.isToken && booking.token}</StyledTableCell>
                            <StyledTableCell align="left">{moment.unix(booking.startDate).format('L')}</StyledTableCell>
                            <StyledTableCell align="left">{booking.noOfWeeks}</StyledTableCell>
                            <StyledTableCell align="left">{booking._rent/ 1000000000000000000}</StyledTableCell>
                            <StyledTableCell align="left">{booking._deposit/ 1000000000000000000}</StyledTableCell>
                            <StyledTableCell align="left">{getStatus(booking._status)}</StyledTableCell>
                            <StyledTableCell align="left">
                              {getStatusButton(booking._status,booking.tokenid, booking._rent, booking._deposit,booking.noOfWeeks, key )}
                              &nbsp; {showWidthdraw(booking.tokenid, booking.startDate, booking.noOfWeeks, booking._deposit, booking.isRefund, key)}

                      </StyledTableCell>


                    </StyledTableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            </ThemeProvider>
            <Snackbar
                open={openTransition}
                onClose={handleCloseTransition}
                TransitionComponent={transition}
                message={transitionMessage}
                key={transition ? transition.name : ''}
              />

        </div>
  );
}

export default MyRentals;
