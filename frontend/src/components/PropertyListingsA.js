import React from 'react'
import './PropertyListings.css'
import PropertyDetails from './PropertyDetails';
//import Workflow from './Workflow';
import moment from 'moment';
import AddRental from './AddRental';
import RentalsList from './RentalsList';

import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
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

import Accordion from '@material-ui/core/Accordion';
import AccordionDetails from '@material-ui/core/AccordionDetails';
import AccordionSummary from '@material-ui/core/AccordionSummary';
import Typography from '@material-ui/core/Typography';



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
            },
        },
      MuiTableContainer: {
        root: {  //This can be referred from Material UI API documentation.

          width: '100%',
        }
      }
    },
});

const useStyles = makeStyles({
  table: {
    minWidth: 700,
  },


});


function PropertyListings(props) {
      const classes = useStyles();
      const [expanded, setExpanded] = React.useState(false);

        const handleChange = (panel) => (event, isExpanded) => {
          setExpanded(isExpanded ? panel : false);
        };


      return (
         <div className="grid">
              {props.properties.map((property, key) => {
                 return (
                   <div>
                   <br/>
                   <ThemeProvider  theme={theme} >
                     <Accordion expanded={expanded === key} onChange={handleChange(key)}>
                      <AccordionSummary
                        aria-controls="panel1bh-content"
                        id={"panel1bh-header"+key}


                      >
                          <Typography >
                           <TableContainer component={Paper} key={key}>
                             <Table className={classes.table} aria-label="My Rentals"  key={key}>

                               <TableHead >
                                <StyledTableRow>

                                  <StyledTableCell align="left"><span>{property.token_id} - {property.pAddr} &nbsp;</span>
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
                          </Typography>
                        </AccordionSummary>


                        <AccordionDetails>
                        <Typography>
                          <RentalsList propertyId={property.token_id} />
                          </Typography>
                        </AccordionDetails>

                      </Accordion>
                      </ThemeProvider>

                    </div>
                  )})}
        </div>

      )

  }


export default PropertyListings;
