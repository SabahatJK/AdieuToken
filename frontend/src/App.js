//import react
import ReactDOM from 'react-dom';
import React, { Component } from 'react'

//import web3
import Web3 from 'web3'
//import router

import {
  BrowserRouter as Router,
  Route,
  Link,
  Switch
} from 'react-router-dom';

import Header from './components/Header';
import Footer from './components/Footer';
import Home from './';
import About from './components/About';
import Rental from './components/Rental';
import Listings from './components/Listings';
import MyRentals from './components/MyRentals';

import './App.css'

class App extends Component {

constructor(props) {
  super(props)
}    
render() {
    return (
      <div>
        <nav>
        </nav>
        <Header/>
        <div className="main">
        <Router>  
          <div  align="center">
            <table width="50%" align="center">
              <tr>
                  <td>
                    <Link to="/About">About Us</Link>
                  </td>
                  <td>
                  <Link to="/Rental">Want to rent?</Link>
                  </td>
                  <td>
                  <Link to="/Listings">Want to List a Property?</Link>
                  </td>
                  <td>
                  <Link to="/MyRentals">My Rentals</Link>
                  </td>

              </tr>
            </table>
          <Switch>

              <Route exact path='/About' component={About}></Route>
              <Route exact path='/Listings' component={Listings}></Route>
              <Route exact path='/Rental' component={Rental}></Route>
              <Route exact path='/MyRentals' component={MyRentals}></Route>
            </Switch>
          </div>
       </Router>
       <br></br>
       <br></br>
       <br></br>
      </div>
      <Footer></Footer>
    </div>
  );
  };
}


export default App;