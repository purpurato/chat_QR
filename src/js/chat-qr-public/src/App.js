import React, { Component } from 'react';
import { Route, HashRouter } from 'react-router-dom';

import "./custom.scss"

import {JWTAuth, JWTAuthInterceptor, JWTAuthUsers, JWTAuthProfile, JWTAuthService} from 'react-hapi-jwt-auth';
import Business from './business'
import Invoices from './invoices'
import NavBar from './nav-bar'
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

  wallets(){
    return (<Container>
        <Row class="justify-content-center">
          <Wallets/>
        </Row>
      </Container>);
  }

  transaction(){
    return (<Transaction />);
  }

  home(){
    const {user} = this.state;
    return (
      <Container>
        
          <Invoices txurl="/node/tx"/>
        
      </Container>);
  }

  welcome(){
    const {user} = this.state;
    return (
      <Container>
        <Row>
          <Col sm={8}>
            <Image src="/icons/logo.png" fluid />
          </Col>
          <Col sm={4}>
            <Card>
              <Card.Body>
                <Card.Title class='alert alert-primary'>Bitcoin</Card.Title>
                <Card.Text>
                  Accept bitcoin payments with our Telegram application. We will give you COP.
                </Card.Text>
              </Card.Body>
            </Card>
            <Card>
              <Card.Body>
                <Card.Title class='alert alert-primary'>Market analysis</Card.Title>
                <Card.Text>
                  With our customized AI models. We can give you insight into your local markets to grow your business.
                </Card.Text>
              </Card.Body>
            </Card>
            <Card>
              <Card.Body>
                <Card.Title class='alert alert-primary'>Market analysis</Card.Title>
                <Card.Text>
                  Use our Telegram bot to create QR codes that can be presented to your customer. 
                  Download Telegram from <a href="https://telegram.org/">https://telegram.org/</a> and add
                  our bot <a href="https://telegram.me/bitcopbot">@bit-2cash</a> to your contacts. 
                  To create a new QR code send a message using '$' and the amount of the transaction. 
                  We will give you corresponding amount in COP at the end of the month. 
                  Contact us at <a href="mailto:contact@bit-2cash.com">contact@bit-2cash.com</a>
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>);
  }

  render(){
    return (
      <div className="App">
        <HashRouter>
          <header className="App-header">
            <NavBar/>
          </header>
          <Container fluid="true" style={{height: "95%", minHeight: "90vh"}}>
            <Route path="/login" component={this.login.bind(this)}/>
            <Route path="/logout" component={this.login.bind(this)}/>
            <Route path="/user" component={this.profile.bind(this)}/>
            <Route path="/admin/users" component={this.adminUsers.bind(this)}/>
            <Route path="/admin/business" component={this.adminBusiness.bind(this)}/>
            <Route path="/admin/wallets" component={this.wallets.bind(this)}/>
            <Route path="/home" component={this.home.bind(this)}/>
            <Route path="/node/tx/:txid" component={this.transaction.bind(this)}/>
            <Route exact path="/" component={this.welcome.bind(this)}/>
          </Container>
          <footer class="alert alert-dark" style={{fontSize: "small", width: "100%"}}>
            <Row className="justify-content-md-center">
              <Col md="auto">
                <a href="mailto:contact@bit-2cash.com">Contact us</a>
              </Col>
            </Row>
            <Row className="justify-content-md-center">
              <Col md="auto">
                Copyright &copy; 2019 - bit-2cash
              </Col>
            </Row>
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