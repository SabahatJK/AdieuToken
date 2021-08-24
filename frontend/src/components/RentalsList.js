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

function RentalList(props)  {

  const classes = useStyles();

  const [walletAddress, setWallet] = useState("");
  const [bookingCount, setBookingCount] = useState("");
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState('');
  const walletInfo = useContext(WalletContext);

  const [contextWallet, setContextWallet] = useContext(WalletContext);
  const [openBackdrop, setOpenBackdrop] = useState(false);
  const [bookingInstance, setBookingInstance] = useState(null);
  const [isRent, setIsRent] = useState(false);
  const [isSubmit, setIsSubmit] = useState(true);
  const [counter, setSetCounter]  = useState(0);

  const [isUpdated, setIsUpdated] = useState(false);

  const [withdrawn, setWithdrawn] = useState('');
  const [breachStatus, setBreachStatus] = useState('');


  const myBookingRef = useRef(bookings);


 useEffect(() => {
      setWallet(walletInfo);
      loadBlockchainData(walletInfo);
 }, [walletInfo]);

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


async function loadBlockchainData()  {
    //setBookings([]);
    const walletResponse = await connectWallet();
    const walletAddr = await walletResponse.address;

    const web3 = new Web3(Web3.givenProvider || "http://localhost:8545")
    const bookingInstance = new web3.eth.Contract(BOOKINGMANAGER_ABI, BOOKINGMANAGER_ADDRESS)
    //setWeb3(web3);
    setBookingInstance(bookingInstance);

        const bookingCount = await bookingInstance.methods.getCntForTenant(walletAddr).call({from: walletAddr});
        setBookingCount(bookingCount);
        let newBookings = [];
        var i  = 0;
          for (i = 0; i < bookingCount; i++) {
            try {
            const index = await bookingInstance.methods.propertyBookings(props.propertyId, i).call({from : walletAddr});
            const booking = await bookingInstance.methods.getDetails(index).call({from : walletAddr});
            (booking._status === 3)? booking.isToken = true : booking.isToken = false;
            const isRefund = await bookingInstance.methods.getRefund(booking.tokenid).call({from : walletAddr})
            booking.isRefund = isRefund
            const isWithdrawal = await bookingInstance.methods.getWithdrawal(booking.tokenid).call({from : walletAddr});
            booking.isWithdrawal = isWithdrawal;
            setSetCounter(i + 1);
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

    };

};

// Get the token Address from blockchain, so can be added to the metamask
async function withdraw(tokenId)  {
  if (tokenId > 0 )
  {
    const walletResponse = await connectWallet();
    const walletAddr = await walletResponse.address;

    const web3 = new Web3(Web3.givenProvider || "http://localhost:8545")
    const bookingInstance = new web3.eth.Contract(BOOKINGMANAGER_ABI, BOOKINGMANAGER_ADDRESS)

      try {
        await bookingInstance.methods.withdraw(tokenId).send({from: walletAddr})
        .on('error', function(error, receipt) { // If the transaction was rejected by the network with a receipt, the second parameter will be the receipt.
          let sError = extractBlockchainError(error.message);
          //setErrors("Withdarwal of Rent  @ : " + sError);
          alert("Withdarwal of Rent  @ : " + sError);
          console.error(error);
        })
        .then(function(receipt){
          let txtHash = receipt["transactionHash"]
          console.log(receipt["transactionHash"])
          setWithdrawn(txtHash);

      });

    } catch (error) {
      //alert("An error occured while loading data : " + " i " + error.message);
      let sError = extractBlockchainError(error.message);
      alert(" Load Data from Blockchain @ index   : " + sError);

      }
  }
}
async function breach(tokenId, breachFee, rent) {

  if (tokenId > 0 )
  {
    const walletResponse = await connectWallet();
    const walletAddr = await walletResponse.address;

    const web3 = new Web3(Web3.givenProvider || "http://localhost:8545")
    const bookingInstance = new web3.eth.Contract(BOOKINGMANAGER_ABI, BOOKINGMANAGER_ADDRESS)

      let txtHash;
      try {
        await this.state.bookingInstance.methods.contractBreached(tokenId, String(breachFee))
        .send({from: walletAddr, value : web3.utils.toBN(rent*.5)})
        .on('error', function(error, receipt) { // If the transaction was rejected by the network with a receipt, the second parameter will be the receipt.
          let sError = extractBlockchainError(error.message);
          alert("Withdarwal of Rent  @ : " + sError);
          console.error(error)
        })
          .then(function(receipt){
            txtHash = receipt["transactionHash"];
            console.log(receipt["transactionHash"]);
            setBreachStatus(txtHash);
          });
      } catch (error) {
        let sError = extractBlockchainError(error.message);
        alert(" Load Data from Blockchain @ index : " + sError);

      }
    }
}
//booking._status,booking.tokenid, booking._rent, booking._deposit,noOfWeeks
function showWidthdraw(tokenId, startDate, noOfWeeks, rent, isWithdrawal ) {
  var current = moment().format("L");
  if (moment(current).unix() >  (Number(startDate) + Number(noOfWeeks)*7*24*60*60 + 5*24*60*60)  )
  {
    if (isWithdrawal)
    <Button  variant="contained"   onClick={() => withdraw(tokenId)}>Withdraw Rent</Button>
  else {

  }
  }
};

//booking._status,booking.tokenid, booking._rent, booking._deposit,noOfWeeks
  function showBreachButton (status, tokenId, breachFee, startDate, noOfWeeks, rent, isRefund, isWithdrawal ) {
    if (status === '3')
    {
      var current = moment().format("L");
      if ((moment(current).unix() > Number(startDate)) && (isRefund && isWithdrawal))
        {
          return <Button  variant="contained"   onClick={() => breach(tokenId, breachFee, rent)}>Breach</Button>
        }

    }
    else {
          return '';
    }

  }

  return (
      <div className="grid">
        {(counter > 0) &&
          <>
        <Backdrop className={classes.backdrop} open={openBackdrop}>
          <CircularProgress color="inherit" />
        </Backdrop>
            <ThemeProvider  theme={theme}>
              <TableContainer component={Paper}>
                 <Table className={classes.table} aria-label="My Rentals">
                  <TableHead>
                    <TableRow>
                    <StyledTableCell align="left" >Token Id</StyledTableCell>
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
                        <StyledTableCell>
                          {booking.tokenid}
                        </StyledTableCell>
                              <StyledTableCell align="left">{ booking.token}</StyledTableCell>
                              <StyledTableCell align="left">{moment.unix(booking.startDate).format('L')}</StyledTableCell>
                              <StyledTableCell align="left">{booking.noOfWeeks}</StyledTableCell>
                              <StyledTableCell align="left">{booking._rent/ 1000000000000000000} eth</StyledTableCell>
                              <StyledTableCell align="left">{booking._deposit/ 1000000000000000000} eth</StyledTableCell>
                              <StyledTableCell align="left">{getStatus(booking._status)}</StyledTableCell>
                              <StyledTableCell align="left">
                              {showWidthdraw(booking.tokenid, booking.startDate,
                                  booking.noOfWeeks, booking._rent, booking.isWithdrawal)}
                              &nbsp;
                              {showBreachButton(booking._status,booking.tokenid,
                                    Number(booking._rent)*0.5, booking.startDate,
                                    booking.noOfWeeks, booking._rent, booking.isRefund,
                                    booking.isWithdrawal )}

                              </StyledTableCell>


                      </StyledTableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              </ThemeProvider>
              </>
        }
      </div>
  );

}
export default RentalList;
