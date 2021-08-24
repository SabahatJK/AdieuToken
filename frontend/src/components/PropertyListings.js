import React from 'react'
import './PropertyListings.css'
import PropertyDetails from './PropertyDetails';
//import Workflow from './Workflow';
import moment from 'moment';
import AddRental from './AddRental';

// @ dev component to display all llistings
// uses PropertyDetails to display the details from IPFS
// Displays the rent button via workflow componet
import { withStyles, makeStyles } from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';
import { ThemeProvider } from '@material-ui/core'
import { createTheme } from '@material-ui/core/styles';



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

const useStyles = makeStyles({
  table: {
    minWidth: 700,
  },
});

const theme = createTheme({
    overrides: {
        MuiTableCell: {
            root: {  //This can be referred from Material UI API documentation.
                padding: '5px',
            },
        },
      MuiTableContainer: {
        root: {  //This can be referred from Material UI API documentation.

          width: '90%',
        }
      }
    },
});

function PropertyListings(props) {
      const classes = useStyles();
      return (
         <div>

              <ThemeProvider  theme={theme} >
               {props.properties.map((property, key) => {
                 return (
                   <div key={key}>

                   <br/>
                     <TableContainer component={Paper} key={key}>
                       <Table className={classes.table} aria-label="My Rentals"  key={key}>

                         <TableHead >
                          <StyledTableRow>

                            <StyledTableCell align="left"><span>{property.pAddr} &nbsp;</span>
                            </StyledTableCell>
                            {!props.showButtons &&  <StyledTableCell align="left">Token : <span>{property.token.trim()}</span>
                            </StyledTableCell>}
                            <StyledTableCell align="left">
                              Rent: <span>{(property.rentFee/ 1000000000000000000).toFixed(3)} eth </span>
                            </StyledTableCell>
                            <StyledTableCell align="left">Deposit: <span className="content">{(property.depositFee/ 1000000000000000000).toFixed(3)} eth </span></StyledTableCell>
                            <StyledTableCell align="center">Non Refundable Fee: <span className="content">{(property.nonRefundableFee/ 1000000000000000000).toFixed(3)} eth </span></StyledTableCell>
                            <StyledTableCell align="center">
                                Availability : <span className="content">
                                {moment.unix(property.startAvailability).format('L')}
                                      </span> -
                                <span className="content">
                                {moment.unix(property.endAvailability).format('L')}
                              </span>
                              </StyledTableCell>
                            {props.showButtons &&

                            <StyledTableCell align="center" >
                              <AddRental propertyId={property.token_id}
                                startDate={property.startAvailability}
                                endDate={property.endAvailability}
                                propertAddress={property.pAddr}
                                rentFee={property.rentFee}
                                depositFee = {property.rentFee}
                                nonRefundableFee = {property.nonRefundableFee} />

                            </StyledTableCell>}
                        </StyledTableRow>
                        </TableHead>
                        <TableBody>
                        <StyledTableRow>
                          <StyledTableCell align="center" colSpan={9}>
                            <PropertyDetails ifpsUrl={property.ifps}   />
                          </StyledTableCell>
                        </StyledTableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>
                    </div>

              )})}
              </ThemeProvider>
        </div>

      )

  }


export default PropertyListings;
