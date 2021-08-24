require('dotenv').config();

const axios = require('axios');

//export const pinJSONToIPFS = async(JSONBody) => {
exports.handler = async function (event, context) {
    console.log(event);
    console.log(context);


    const {JSONBody} = JSON.parse(event.body)
    console.log(JSONBody)
    console.log("this is json");
    console.log(JSONBody)


    const url = 'https://api.pinata.cloud/pinning/pinJSONToIPFS';
    // get the enviroment varaibles from the .env file
    const key = process.env.PINATA_KEY;
    const secret = process.env.PINATA_SECRET;
    console.log(event);
    //making axios POST request to Pinata ⬇️
    try {
      return axios
          .post(url, JSONBody, {
              headers: {
                  pinata_api_key: key,
                  pinata_secret_api_key: secret,
              }
          })
          .then(function (response) {
             return {
                 statusCode: 200,
                 body: JSON.stringify({success: true,  pinataUrl: "https://gateway.pinata.cloud/ipfs/" + response.data.IpfsHash })
             };
          })
          .catch(function (error) {
              console.log(error.message)
              return {
                  statusCode: 500,
                  body: JSON.stringify({success: false,  message: error.message, body:JSONBody })
              }

      });
    } catch (err) {
    return {
      statusCode: 404,
      body: err.toString(),
    };
  }
};
