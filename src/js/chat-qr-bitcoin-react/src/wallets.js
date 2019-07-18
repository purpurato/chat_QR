import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import {withRouter} from 'react-router-dom';
import {CreditCard, PlusSquare, Check, BookOpen} from 'react-feather';
import BitcoinService from './service'
import _ from 'underscore';
import {Container, Row, Col, Card, Table, Button, ButtonToolbar, Alert, Form} from 'react-bootstrap';

class Wallets extends Component{
  constructor(props) {
    super(props);

    const {http} = props;

    this.bitcoin = new BitcoinService();
    this.bitcoin.setHttp(http);

    this.state = {
      wallets: [],
      viewAddWallet: false,
      newWallet: {
        wallet_name: '',
        disable_private_keys: false,
        blank: false
      }
    }
  }

  componentDidMount(){
    const self = this;

    self.getWallets();
  }

  getWallets(){
    const self = this;
    self.bitcoin.getWallets()
    .then(function(res){
      var wallets = res.data;
      return Promise.all(_.map(wallets, function(w){
        return self.bitcoin.getBalance(w.wallet)
        .then(function(res){
          w.balance = res.data.result;
        })
      }))
      .then(function(res){
        return wallets;
      });
    })
    .then(function(wallets){
      self.setState({...self.state, wallets});
    })
  }

  setViewAddWallet(viewAddWallet){
    this.setState({...this.state, viewAddWallet})
  }

  createWallet(event){
    const self = this;
    const {newWallet, wallets} = self.state;

    event.preventDefault();

    self.bitcoin.createWallet(newWallet)
    .then(function(){
      wallets.push({
        wallet: newWallet.wallet_name,
        balance: 0
      });

      self.setState({...self.state, 
        newWallet: {
          wallet_name: '',
          disable_private_keys: false,
          blank: false
        },
        wallets
      }, ()=>{self.setViewAddWallet(false)})
    })
    .catch(alert)
  }

  getWalletsView(){
    const {wallets} = this.state;
    var total = 0;
    var wallet_items = _.map(wallets, function(w){
      total += Number(w.balance);
      return (<tr>
          <td>{w.wallet}</td>
          <td>{w.balance}</td>
        </tr>);
    })

    return (
      <Card>
        <Card.Header as="h5" style={{padding: 0}}><Alert variant="info" style={{marginBottom: 0}}>Wallets</Alert></Card.Header>
        <Card.Body>
          <Table striped bordered hover variant="dark">
            <thead>
              <tr>
                <th>Name</th>
                <th>Balance</th>
              </tr>
            </thead>
            <tbody>
              {wallet_items}
            </tbody>
            <tfoot>
              <tr>
                <th>Total:</th>
                <th>{total}</th>
              </tr>
            </tfoot>
          </Table>
        </Card.Body>
      </Card>
      );
  }

  getAddNewWallet(){
    const {newWallet} = this.state;
    return (
      <Card>
        <Card.Body>
          <Alert variant="info">
            <Form onSubmit={this.createWallet.bind(this)}>
              <Form.Group controlId="walletName">
                <Form.Label>Wallet name</Form.Label>
                <Form.Control type="text" placeholder="Enter wallet name" value={newWallet.wallet_name} onChange={(e)=>{
                  var wallet = newWallet;
                  wallet.wallet_name = e.target.value;

                  this.setState({...this.state, newWallet: wallet});
                }}/>
              </Form.Group>
              <Form.Group controlId="disable_private_keys">
                <Form.Check type="checkbox" label="Disable Private Keys" value={newWallet.disable_private_keys} onChange={(e)=>{
                  var wallet = newWallet;
                  wallet.disable_private_keys = e.target.checked;
                  this.setState({...this.state, newWallet: wallet});
                }}/>
              </Form.Group>
              <Form.Group controlId="blank">
                <Form.Check type="checkbox" label="Blank wallet" value={newWallet.blank} onChange={(e)=>{
                  var wallet = newWallet;
                  wallet.blank = e.target.checked;
                  this.setState({...this.state, newWallet: wallet});
                }}/>
              </Form.Group>
              <Button variant="primary" type="submit">
                <Check/>
              </Button>
            </Form>
          </Alert>
        </Card.Body>
      </Card>
      );
  }

  loadWallets(){
    const self = this;
    self.bitcoin.loadWallets()
    .then(function(res){
      return self.getWallets();
    })
  }

  render() {
    const self = this;
    const {user} = self.props;
    const {viewAddWallet} = self.state;

    var walletsView;

    if(viewAddWallet){
      walletsView = self.getAddNewWallet();
    }else{
      walletsView = self.getWalletsView();
    }

    return (<Container>
        <Row>
          <ButtonToolbar>
            <Button variant="primary" onClick={()=>{self.setViewAddWallet(false)}}><CreditCard/></Button>
            <Button variant="primary" onClick={()=>{self.setViewAddWallet(true)}}><PlusSquare/></Button>
            <Button variant="primary" onClick={()=>{self.loadWallets()}}><BookOpen/></Button>
          </ButtonToolbar>
        </Row>
        <Row>
          {walletsView}
        </Row>
      </Container>
      );

  }
}

const mapStateToProps = (state, ownProps) => {
  return {
    http: state.jwtAuthReducer.http, 
    user: state.jwtAuthReducer.user
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    userLogin: (showLogin) => {
      dispatch({
        type: 'user-login',
        showLogin: showLogin
      });
    }
  }
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(Wallets));

// const httpFactory = http => ({
//   type: 'http-factory',
//   http: http
// });

// export default connect(mapStateToProps, {httpFactory})(NavBar);