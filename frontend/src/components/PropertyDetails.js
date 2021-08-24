//import react
import React, { useState, useLayoutEffect } from "react";

import './PropertyListings.css'

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
    },
});


// @dev Displays the details from a file uploaded to pinata
function PropertyDetails(props)  {
  const classes = useStyles();
  const [details, setDetails] = useState([]);

  useLayoutEffect(() => {
    // get details from IPFS using the url stored in listings
    fetchIPFS(props.ifpsUrl);
 }, []);

  // Fetch Data from  IPFS @ ifpsUrl
  async  function fetchIPFS(ifpsUrl) {
    try {
      // fetch
      let response = await fetch(ifpsUrl);
      // wait for the response, as ayunchornous
      let responseData  = await response.json();
      // set State
      setDetails(responseData);
      return (responseData);

     } catch(error) {
      //console.error(error);
    }
  }

return (
  <ThemeProvider  theme={theme}>
      <TableContainer component={Paper}>
        <Table className={classes.table} aria-label="Details">
          <TableBody>
             <StyledTableRow>
                <StyledTableCell align="left" colSpan={1}>
                    <img src={details["Images"]} alt={details["propertAddress"]} width="100" height="100"></img>

                </StyledTableCell>
                <StyledTableCell align="left" colSpan={5}>
                  {details["Description"]}
                </StyledTableCell>
                </StyledTableRow>
                <StyledTableRow>
                <StyledTableCell align="left"> SqtFeet: {details["SqtFeet"]} sqft </StyledTableCell>
                <StyledTableCell align="center">Type: {details["Type"]}</StyledTableCell>
                <StyledTableCell align="center">Beds: {details["Beds"]} bds</StyledTableCell>
                <StyledTableCell align="center">Heating: {details["Heating"]}</StyledTableCell>
                <StyledTableCell align="center">Cooling: {details["Cooling"]}</StyledTableCell>
                <StyledTableCell align="center">
                      Parking: {details["Parking"]}
                </StyledTableCell>

            </StyledTableRow>
        </TableBody>
      </Table>
    </TableContainer>
    </ThemeProvider>
  );
}

export default PropertyDetails;
