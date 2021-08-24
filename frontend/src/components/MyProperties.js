import React, { useState, useEffect } from "react";
import moment from 'moment';

import Web3 from 'web3'
import {
  /*connectWallet,*/
  getCurrentWalletConnected,
  extractBlockchainError //import here
} from "./connection.js"
import { PROPERTMANAGER_ABI, PROPERTMANAGER_ADDRESS } from '../config'

import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import Button from '@material-ui/core/Button';
import Backdrop from '@material-ui/core/Backdrop';
import CircularProgress from '@material-ui/core/CircularProgress';
import TextField from '@material-ui/core/TextField';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import { TextareaAutosize } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
//import WalletContext from './context';

//import ConnectContext from "./Conn"
//import {pinJSONToIPFS} from './pinata.js'

import PropertyListingsA from './PropertyListingsA';
import './PropertyListings.css'


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
const stylesAddress={
 width: "300px"
}

const stylesTextArea={
  width: "100%"
}
/*const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};
*/
// @dev Takes care adding a new listing
// charges 100 wei for each transaction
// creates an object in pinata for ifps and the tokenuri


function MyProperties(props)  {
  const defaultValues = {
          address : '',
          rent : '',
          startDate: moment(),
          endDate : moment(),
          ifpsUrl : '',
          beds : '',
          baths: '',
          sqtFeet: '',
          type : '',
          heating: '',
          cooling : '',
          parking: '',
          imageUrl : '',
          description: '',
    };

    const today = moment().format("L");
    //const [walletAddress, setWallet] = useState("");
    const [formValues, setFormValues] = useState(defaultValues);
    const [modalIsOpen, setModalIsOpen] = useState(false);
    //const [propertyCount, setPropertyCount] = useState(-1);
    const[propertyManagerInstance, setPropertyManagerInstance] = useState(null);
    const [properties, setProperties] = useState([]);


    //const [ifpsUrl, setIfpsUrl]  = useState("");
    const [submitDisabled, setSubmitDisabled]  = useState(false);
    //const [tokenUri, setTokenUri]  = useState("");
    const [error, setError]  = useState("");
    const [formErrors, setFormError]  = useState([]);
    const [counter, setSetCounter]  = useState(0);


    //const [web3, setWeb3] = useState(null);
    //const[bookingInstance, setBookingInstance] = useState(null);

    const classes = useStyles();
    const [openBackdrop, setOpenBackdrop] = useState(false);
    //const[disabled, setDisabled] = useState("");
    //const walletInfo = useContext(WalletContext);
    const heatingTypes = [
      'No Data',
      'Electric',
      'Gas',
      'Oil',
      'Forced Air',
      'Heat Pump',
    ];

    const coolingTypes = [
      'No Data',
      'Electric',
      'Gas',
      'Oil',
      'Central Air',
      'Window Unit',
      'Split'
    ];


  useEffect(() => {
    loadProperyList();
  },[]);


    //const classes = useStyles();
    // handle the start date, should have had a single handler for
    // start date and end date, but somehow it was not working
    // so adding a seperate handler for each, have to fix

    const handleChange = (e) => {
      const { name, value } = e.target;
      setFormValues({
        ...formValues,
        [name]: value,
      });
    };

  /*  const handleChangeMultiple = (e) => {
      const { name, options } = e.target;
      const value = [];
      for (let i = 0, l = options.length; i < l; i += 1) {
        if (options[i].selected) {
          value.push(options[i].value);
        }
      }
      setFormValues({
        ...formValues,
        [name]: value,
      });
  };
*/

    // handle all integer inputs
    const handleIntegerChange = event => {
      // regex to check for integers
      const regexp = new RegExp(`^-?[0-9]*$`);
      const target = event.target;
      const value = target.value;
      const name = target.name;
      if (regexp.test(value))
      {
        setFormValues({
          ...formValues,
          [name]: value,
        });
      }
    }
    const handleSubmit =  async (event) => {
      event.preventDefault();
      setFormError([]);
      if (validateForm())
      {

        try{

          setSubmitDisabled(true);
          generateIfps();

          }
          catch(error){
            setErrorMessage(error.message);
            setSubmitDisabled(false);
            alert(error.message);
          }

        }
      else {

        setSubmitDisabled(false);
      }
    }

    // Generates an file on pinata with the details that dont need to be stored
    // in the blockhain, but needed for front end
  async function generateIfps()  {
      setSubmitDisabled(false);
      // create content that need to be saved to pinata
      const JSONBody =
      {
        Address: formValues.address,
        Beds : formValues.beds,
        Baths : formValues.baths,
        SqtFeet : formValues.sqtFeet,
        Type: formValues.type,
        Heating : formValues.heating,
        Cooling : formValues.cooling,
        Parking : formValues.parking,
        Description : formValues.description,
        Images: formValues.imageUrl
      }

      //make pinata call, via netlify as have to keep the keys secret
      const pinataResponse =  await fetch('/.netlify/functions/pinata', {
                                method: "POST",
                                body: JSON.stringify({JSONBody})
                              }).then((res) => res.json()

                              );

      // check for sucess
      if (!pinataResponse.success) {
        setSubmitDisabled(false);
        setError(pinataResponse.message);
        alert(pinataResponse.message);
        return {
              success: false,
              status: pinataResponse.message

          }
      }
      else {
      let ifpsHash = pinataResponse.pinataUrl;

      //setIfpsUrl(ifpsHash);
      generateTokenURI(ifpsHash);
      }
  }

  async function generateTokenURI(ifpsHash)  {
      //var self = this
      const JSONBody = {
        Address : formValues.address,
        startDate : formValues.startDate,
        endDate : formValues.endDate,
     }
     //make pinata call
     //const pinataResponse = await pinJSONToIPFS(body);
     //make pinata call
     const pinataResponse =  await fetch('/.netlify/functions/pinata', {
                               method: "POST",
                               body: JSON.stringify({JSONBody})
                             }).then((res) => res.json());

     if (!pinataResponse.success) {
         setSubmitDisabled(false);
         setError(pinataResponse.message)
         return {
             success: false,
             status: pinataResponse.message,

         }
     }
     else {
       let tokenUri = pinataResponse.pinataUrl;
       //setTokenUri(tokenUri);
       addListing(ifpsHash, tokenUri);
      }
  }
// load data from blockhain
  async function loadProperyList (address) {
    //setProperties([]);
    const walletResponse = await getCurrentWalletConnected();
    const walletAddr = await walletResponse.address;

    const web3 = new Web3(Web3.givenProvider || "http://localhost:8545")
    //setWeb3(web3);
    // get accounts

    const propertyManagerInstance = new web3.eth.Contract(PROPERTMANAGER_ABI, PROPERTMANAGER_ADDRESS)
    // save to state ?/
    setPropertyManagerInstance(propertyManagerInstance);
    let propertyCount;
    // get count of the properties on blockhain via web3
    try
    {
      propertyCount = await propertyManagerInstance.methods.getOwnerCount(walletAddr).call({from: walletAddr});
      // save count
      //setPropertyCount(propertyCount);
    }
    catch (error) {
      let sError = extractBlockchainError(error.message);
      setError("Deposit  @ : " + sError);
      console.log(error)
      }
    var newProperties = [];
    // loop and get each propertu details
    for (var i = 0; i < propertyCount; i++) {
      const index = await propertyManagerInstance.methods.ownerTokens(walletAddr, i).call({from : walletAddr});
      const property = await propertyManagerInstance.methods.getDetails(index).call({from : walletAddr});
      newProperties = newProperties.concat( property);
      setSetCounter(i + 1);
      //setProperties([...properties, property]);
      setProperties(newProperties);
    }

  }

  // add listing to blockchain
  async function addListing(ifpsHash, Uri) {

    const walletResponse = await getCurrentWalletConnected();
    const walletAddr = await walletResponse.address;

    setSubmitDisabled(true);
    setOpenBackdrop(true);
    try {
      await propertyManagerInstance.methods.addListing(walletAddr,
                          formValues.address,
                          Uri,
                          ifpsHash,
                          formValues.rent,
                          moment(formValues.startDate).unix(),
                          moment(formValues.endDate).unix()).send({from: walletAddr, value: 100})
                          .then(function(receipt){
                              console.log(receipt);
                              closeModal();

                          });

        setSetCounter(counter + 1);
        loadProperyList(walletAddr);

    } catch(error) {


      let sError = extractBlockchainError(error.message);
      setError("Add Listing  @ : " + sError);
      //closeModal();
    }
    finally{
      setOpenBackdrop(false);
      setSubmitDisabled(false);
    }
  }

  function setErrorMessage(sErr) {

    setFormError([...formErrors, sErr]);

    }

    //this.setState(prevState => ({
  //    errors: [...prevState.errors, sErr],
  //  }));


  // validate the form
  function validateForm() {
    let isValid = true;
    // To do add validation via google
    if (formValues.address.trim() === "" || formValues.address.length < 10)
    {
      let sError = "Please enter a valid address";
      setErrorMessage(sError);
      isValid = false;
    }
    if (formValues.rent.trim() === "" || Number(formValues.rent) < 1  )
    {
      let sError = "Please enter an rent (should be greater than 100)"
      setErrorMessage(sError);
      isValid = false;
    }
    if (formValues.sqtFeet.trim() === "" || Number(formValues.sqtFeet) < 100  )
    {
      let sError = "Please enter a valid Sqfeet (should be greater than 100)"
      setErrorMessage(sError);
      isValid = false;
    }
    var dateReg = /^\d{4}[-]\d{2}[-]\d{2}$/


    if (formValues.startDate.trim() === "" || !dateReg.test(formValues.startDate.trim())  )
    {
      let sError = "Please enter a valid Start Date"
      setErrorMessage(sError);
      isValid = false;
    }

    if ( moment(formValues.startDate) < moment(moment().format("L"))  )
    {
      let sError = "Start Date cannot be less than today"
      setErrorMessage(sError);
      isValid = false;
    }
    if ( moment(formValues.ensDate) < moment(moment().format("L"))  )
    {
      let sError = "End Date cannot be less than today"
      setErrorMessage(sError);
      isValid = false;
    }

    if (formValues.endDate.trim() === "" || !dateReg.test(formValues.endDate.trim())  )
    {
      let sError = "Please enter a valid End Date"
      setErrorMessage(sError);
      isValid = false;
    }

    if ( (moment(formValues.endDate) <= moment(formValues.startDate).add(7, "days"))   )
    {
      let sError = "The property has to be listed for atleast a  week"
      setErrorMessage(sError);
      isValid = false;
    }
    if (formValues.type === '' )
    {
      let sError = "Please select a Type";
      setErrorMessage(sError);
      isValid = false;
    }
    if (formValues.beds.trim() === "" || Number(formValues.beds) < 1  )
    {
      let sError = "Please enter the number of beds";
      setErrorMessage(sError);
      isValid = false;
    }

    if (formValues.baths.trim() === "" || Number(formValues.baths) < 1  )
    {
      let sError = "Please enter the number of baths";
      setErrorMessage(sError);
      isValid = false;
    }
    if (formValues.parking === "" )
    {
      let sError = "Please select a Parking";
      setErrorMessage(sError);
      isValid = false;
    }
    if (formValues.heating === "" )
    {
      let sError = "Please select a Heating";
      setErrorMessage(sError);
      isValid = false;
    }
    if (formValues.cooling === "" )
    {
      let sError = "Please select a Cooling";
      setErrorMessage(sError);
      isValid = false;
    }


    var imageRegex = /(https?:\/\/.*\.(?:png|jpg|webp))/i
    if (formValues.imageUrl.trim() === "" || !imageRegex.test(formValues.imageUrl) )
    {
      let sError = "Please enter a valid Image URL";
      setErrorMessage(sError);
      isValid = false;
    }

    if (formValues.description.trim() === "" || formValues.description.length < 10)
    {
      let sError = "Please enter a description, should be atleast 10 characters";
      setErrorMessage(sError);
      isValid = false;
    }
    return isValid;

  };

  // open Modal
  function openModal() {
        setFormError([]);
        setError("");
        setModalIsOpen(true);
        setSubmitDisabled(false);
    };
    // Close Modal
  function closeModal() {
        setModalIsOpen(false);
        setSubmitDisabled(false);
    };


    return (
      <div id="addList">

        <br/>
        <Button variant="contained" onClick={openModal}>Add Listing</Button>

        <br/>
        <Dialog open={modalIsOpen}
          aria-labelledby="form-dialog-title"
          fullWidth={true}
          maxWidth={"md"}
        >
        <DialogContent>
        <Backdrop className={classes.backdrop} open={openBackdrop}>
          <CircularProgress color="inherit" />
        </Backdrop>


        <div>
          <form  onSubmit={handleSubmit} method="POST" >

            <table height="90%" cellSpacing="10" cellPadding="20" >
              <thead className="blackHeader">
                <tr>
                <td colSpan="8" text-align="center">
                  <div className="float-container">
                  <div align="left" className="float-child">Add Listing </div>
                  </div>
                </td>
                </tr>
              </thead>
              <tbody>
              <tr>
                <td colSpan="6">
                <div>
                  <b> Please Note:  A service fee of 100 wei is charged for each property listing. </b>
                </div>

                { error.length > 0  &&
                    <div className="error">
                      ERROR : Please correct the errors and continue
                      <ul>
                      <li className="error" > {error} </li>
                      </ul>
                    </div> }
                </td>
              </tr>

                <tr>
                  <td colSpan="4">

                    { formErrors.length > 0  &&
                    <div className="error">
                     ERRORS : Please correct the errors and continue
                     <ul className="error">
                          { formErrors.map((err => {
                            return (

                                <li>{err}</li>

                            )
                          }))
                        }
                  </ul>

                  </div>
                }
                  </td>
                </tr>
                <tr className="table_padding" >
                  <td>
                    Address :
                  </td>
                  <td colspan="3">
                  <TextField id="address" name="address"
                      required
                      style={stylesAddress}
                      value={formValues.address}
                      defaultValue={formValues.address}
                      placeholder="Enter Address"
                      InputLabelProps={{
                        required: true,
                      }}
                    onChange={handleChange} />


                  </td>
                      <td>
                        Start Date :
                      </td>
                      <td>

                        <TextField id="startDate" name="startDate"
                            required
                            type="date"
                            value={formValues.startDate}

                            format="MM/dd/yyyy"
                            inputProps={{
                              min: moment().format('YYYY-MM-DD')

                            }}
                            defaultValue={formValues.startDate}
                            placeholder="Enter availability Start Date"
                            InputLabelProps={{
                              required: true,
                            }}
                            onChange={handleChange} />
                          </td>
                      <td>
                        End Date :
                        </td>
                      <td>
                      <TextField id="endDate" name="endDate"
                          required
                          type="date"
                          value={formValues.endDate}
                          format="MM/dd/yyyy"
                          inputProps={{
                            min: moment().format('YYYY-MM-DD')

                          }}
                          defaultValue={new Date()}
                          placeholder="Enter availability end Date"
                          InputLabelProps={{
                            required: true,
                          }}
                          onChange={handleChange} />

                        </td>
                  </tr>
                  <tr>
                  <td>
                    Rent :
                  </td>
                  <td>

                    <TextField id="rent" name="rent"
                        required
                        type="Number"
                        value={formValues.rent}
                        inputProps={{
                          min: 1,
                        }}
                        defaultValue={formValues.rent}
                        placeholder="Enter rent in wei"
                        InputLabelProps={{
                          required: true,
                        }}
                        onChange={handleIntegerChange} />

                  </td>
                  <td>
                  SqtFeet :
                  </td>
                  <td>
                    <TextField id="sqtFeet" name="sqtFeet"
                        required
                        type="Number"
                        value={formValues.sqtFeet}
                        inputProps={{
                          min: 100,
                        }}
                        defaultValue={formValues.sqtFeet}
                        placeholder="Enter square footage"
                        InputLabelProps={{
                          required: true,
                        }}
                        onChange={handleChange} />

                  </td>

                      <td>
                  Type :
                  </td>
                  <td>

                  <Select
                     required
                      id="type"
                      name="type"
                      value={formValues.type}
                      defaultValue='Choose Type'
                      //disabled={disabled}
                      onChange={handleChange}
                      className={classes.selectEmpty}
                      >
                        <MenuItem disabled value='Choose Type'>Choose Type</MenuItem>
                        <MenuItem value='Single Family'>Single Family</MenuItem>
                        <MenuItem value='Townhouse'>'Townhouse'</MenuItem>
                        <MenuItem value='Condo'>Condo</MenuItem>
                    </Select>
                  </td>
                  <td>Parking</td>
                  <td>
                  <Select
                     required
                      id="parking"
                      name="parking"
                      value={formValues.parking}
                      defaultValue='Choose Parking'
                      //disabled={disabled}
                      onChange={handleChange}
                      className={classes.selectEmpty}
                      >
                        <MenuItem value='No Parking space'>No Parking space</MenuItem>
                        <MenuItem value='1 Attached Garage space'>'1 Attached Garage space'</MenuItem>
                        <MenuItem value='2 Attached Garage space'>2 Attached Garage space</MenuItem>
                    </Select>
                  </td>


                </tr>
                <tr className="table_padding">
                  <td>
                    Beds :
                  </td>
                  <td>
                    <TextField id="beds" name="beds"
                        required
                        type="Number"
                        value={formValues.beds}
                        inputProps={{
                          min: 1,

                        }}
                        defaultValue={formValues.beds}
                        placeholder="Enter # of Beds"
                        InputLabelProps={{
                          required: true,
                        }}
                        onChange={handleChange} />

                  </td>


                  <td>
                    Baths :
                  </td>
                  <td>

                    <TextField id="baths" name="baths"
                        required
                        type="Number"
                        value={formValues.baths}
                        inputProps={{
                          min: 1,

                        }}
                        defaultValue={formValues.baths}
                        placeholder="Enter # of Baths"
                        InputLabelProps={{
                          required: true,
                        }}
                        onChange={handleChange} />

                  </td>

                        <td> Heating</td>
                        <td>

                        <Select
                           required
                            id="heating"
                            name="heating"
                            value={formValues.heating}
                            defaultValue={formValues.heating}
                            //disabled={disabled}
                            onChange={handleChange}
                            className={classes.selectEmpty}
                            >
                              {heatingTypes.map((name) => (
                                <MenuItem key={name} value={name} >
                                  {name}
                                </MenuItem>
                              ))}
                          </Select>


                          </td>
                        <td> Cooling</td>
                        <td>
                        <Select
                           required
                            id="cooling"
                            name="cooling"
                            value={formValues.cooling}
                            defaultValue={formValues.cooling}
                            //disabled={disabled}
                            onChange={handleChange}
                            className={classes.selectEmpty}
                            >
                              {coolingTypes.map((name) => (
                                <MenuItem key={name} value={name} >
                                  {name}
                                </MenuItem>
                              ))}
                          </Select>
                        </td>
                        </tr>
                        <tr>
                        <td >
                            Image :
                          </td>
                          <td colSpan="7">
                          <TextField id="imageUrl" name="imageUrl"
                              required
                              type="url"
                              style={stylesTextArea}
                              value={formValues.imageUrl}
                              inputProps={{
                                min: 1,

                              }}
                              defaultValue={formValues.imageUrl}
                              placeholder="Enter the image URL"
                              InputLabelProps={{
                                required: true,
                              }}
                              onChange={handleChange} />



                        </td>
                  </tr>
                  <tr>
                    <td>Description:</td>
                    <td colSpan="7">

                      <TextareaAutosize id="description" name="description"
                          disabled={false}
                          required
                          maxRows = {10}
                          minRows = {3}
                          style={stylesTextArea}
                          defaultValue= ''
                          placeholder="Enter Description"
                          onChange={handleChange}
                           />

                    </td>
                </tr>
                <tr>

                <td colSpan="8" align="right">
                  <hr/>
                  <DialogActions>

                    <Button type="submit" variant="contained" disabled={submitDisabled}>
                            Submit
                    </Button>
                    <div>
                      <Button variant="contained" onClick={closeModal}>Close</Button>
                    </div>

                  </DialogActions>
                  </td>
                </tr>
              </tbody>

            </table>

          </form>
          </div>
          </DialogContent>

         </Dialog>

        <br/>
        <main role="main" className="col-lg-12 d-flex justify-content-center">
                      <div id="loader" className="text-center">
                        <p className="text-center">Loading...{counter}</p>
                      </div>
       </main>
       <br/>

        <div className="row">

          <PropertyListingsA properties={properties} showButtons={false} ></PropertyListingsA>
        </div>

      </div>
    );

}

export default MyProperties;
