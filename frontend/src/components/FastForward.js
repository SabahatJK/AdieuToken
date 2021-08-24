import { useEffect, useState } from "react";
import DayPickerInput from 'react-day-picker/DayPickerInput';
import 'react-day-picker/lib/style.css';
import moment from 'moment';

import {
  formatDate,
  parseDate,
} from 'react-day-picker/moment';

import Web3 from 'web3';
import {
  connectWallet,
  getCurrentWalletConnected //import here
} from "./connection.js";

import { BOOKINGMANAGER_ABI, BOOKINGMANAGER_ADDRESS } from '../config'
import './PropertyListings.css';


function FastForward()  {

  //State variables
  const [walletAddress, setWallet] = useState("");
  const [status, setStatus] = useState("");
  const [propertyBookingInstance, setBookingManagerInstance]= useState(null);
  const [fDate, setFDate]= useState('');

    useEffect(async () => {
       const {address, status} = await getCurrentWalletConnected();
       setWallet(address)
       setStatus(status);

       addWalletListener();
  }, []);


    const handleDayChange = (selectedDay, modifiers, dayPickerInput) =>{
      const input = dayPickerInput.getInput();
      setFDate(input.value);
    }
      // add listner to when the account is changed.
    async function  addWalletListener() {
        if (window.ethereum) {
          var self = this;
          window.ethereum.on("accountsChanged", (accounts) => {
            if (accounts.length > 0) {
              setWallet(accounts[0]);
            } else {
              setWallet(accounts[0]);
            }
          });
        }
      };

      // Intalize web3,connect to wallet, add listner for change in account, load data

      const fastForward = async () => {
        var self = this;
        try {
          const web3 = new Web3(Web3.givenProvider || "http://localhost:8545")
          // get accounts
          const propertyBookingInstance = new web3.eth.Contract(BOOKINGMANAGER_ABI, BOOKINGMANAGER_ADDRESS)

          await propertyBookingInstance.methods.fastForward(
                              moment(fDate).unix()).send({from: walletAddress})
                              .then(function(receipt){
                                  console.log(receipt);
                                  alert("Sucessfully changed the date to " + fDate);
                              })

        } catch(error){
          alert("Error Occured : " + error.message);
          console.log(error);
        }
      }

    const clickHandler = () => {
        fastForward();
      }


    return (
        <div>
            <table>
              <tbody>
                <tr>
                    <td>
                      Fast Forward Date:
                    </td>
                    <td>
                    <DayPickerInput
                      id="fDate"
                      name="fDate"
                      value={fDate}
                      formatDate={formatDate}
                      parseDate={parseDate}
                      placeholder={`${formatDate(new Date())}`}
                      onDayChange={handleDayChange}
                    />
                    </td>
                </tr>
                <tr>
                  <td colspan="2">
                      <button
                         className="blackSubmit"
                          onClick={clickHandler}
                      >
                          Foward Time
                      </button>

                  </td>
                </tr>
              </tbody>
            </table>
                  </div>
    );

};
export default FastForward;
