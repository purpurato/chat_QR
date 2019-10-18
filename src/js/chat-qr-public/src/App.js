import React, { Component } from 'react';
import { Route, HashRouter } from 'react-router-dom';

import "./custom.scss"
import "./App.css"

import {JWTAuth, JWTAuthInterceptor, JWTAuthUsers, JWTAuthProfile, JWTAuthService} from 'react-hapi-jwt-auth';
import Business from './business'
import Invoices from './invoices'
import NavBar from './nav-bar'
import Footer from './footer'
import Carousel from 'react-bootstrap/Carousel';
import Image from 'react-bootstrap/Image'
import Modal from 'react-bootstrap/Modal';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';

import axios from 'axios';
import store from "./redux/store";
import { connect } from "react-redux";
import Container from "react-bootstrap/Container"
import {Wallets, Transaction} from "chat-qr-bitcoin-react"
import Welcome from './welcome'

class App extends Component {

  constructor(props){
    super(props);

    let http = axios;
    if(process.env.NODE_ENV === 'development'){
      http = axios.create({
        baseURL: 'http://localhost:9190'
      });
    }

    this.state = {
      user: {},
      showLogin: true
    }

    store.dispatch({
      type: 'http-factory',
      http: http
    });

    const self = this;

    const interceptor = new JWTAuthInterceptor();
    interceptor.setHttp(http);
    interceptor.update();
    
    const jwtauth = new JWTAuthService();
    jwtauth.setHttp(http);
    jwtauth.getUser()
    .then(function(user){
      self.setState({...self.state, user: user, showLogin: false});
      store.dispatch({
        type: 'user-factory', 
        user: user
      });
    });
  }

  componentWillReceiveProps(newProps){
     if(newProps.user != this.props.user){
         this.setState({user: newProps.user})
     }
     this.setState({showLogin: true});
  }

  handleHide(){
    this.setState({...this.state, showLogin: false});
  }

  login(){
    const {showLogin} = this.state;

    return (<Modal size="lg" show={showLogin} onHide={this.handleHide.bind(this)}>
              <div class="alert alert-info">
                <Modal.Header closeButton>
                  <Modal.Title>Please login</Modal.Title>
                </Modal.Header>
              </div>
              <Modal.Body><JWTAuth></JWTAuth></Modal.Body>
            </Modal>);
  }

  profile(){
    return (<div class="container">
        <div class="row justify-content-center">
          <div class="card col-8">
            <div class="card-body">
              <JWTAuthProfile></JWTAuthProfile>
            </div>
          </div>
        </div>
      </div>);
  }

  adminUsers(){
    return (<Row class="justify-content-center">
        <JWTAuthUsers/>
      </Row>);
  }

  adminBusiness(){
    return (<Row class="justify-content-center">
        <Business/>
      </Row>);
  }

  adminWallets(){
    return (<Container>
        <Row class="justify-content-center">
          <Wallets/>
        </Row>
      </Container>);
  }

  adminInvoices(){
    return (<Invoices txurl="/node/tx" admin_invoice/>); 
  }

  transaction(){
    return (<Transaction />);
  }

  home(){
    const {user} = this.state;
    return (<Invoices txurl="/node/tx"/>);
  }

  public_invoice(){
    return (<Invoices txurl="/node/tx" public_invoice/>);
  }

  welcome(){
    const {user} = this.state;
    return (
      <Welcome development={process.env.NODE_ENV === 'development'}/>
    );
  }

  render(){
    return (
      <div className="App">
        <HashRouter>
          <header className="App-header">
            <NavBar/>
          </header>
          <Container fluid="true" style={{height: "95%", minHeight: "90vh", "padding-top": "8vh"}}>
            <Route path="/login" component={this.login.bind(this)}/>
            <Route path="/logout" component={this.login.bind(this)}/>
            <Route path="/user" component={this.profile.bind(this)}/>
            <Route path="/admin/users" component={this.adminUsers.bind(this)}/>
            <Route path="/admin/business" component={this.adminBusiness.bind(this)}/>
            <Route path="/admin/wallets" component={this.adminWallets.bind(this)}/>
            <Route path="/admin/invoices" component={this.adminInvoices.bind(this)}/>
            <Route path="/home" component={this.home.bind(this)}/>
            <Route path="/node/tx/:txid" component={this.transaction.bind(this)}/>
            <Route path="/invoice" component={this.public_invoice.bind(this)}/>
            <Route exact path="/" component={this.welcome.bind(this)}/>
          </Container>
          <footer>
            <Footer/>
          </footer>
        </HashRouter>
      </div>
    );
  }
  
}

const mapStateToProps = (state, ownProps) => {
  return {
    user: state.jwtAuthReducer.user,
    showLogin: state.navbarReducer.showLogin
  }
}

export default connect(mapStateToProps)(App);