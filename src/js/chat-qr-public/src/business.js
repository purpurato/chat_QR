import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import store from "./redux/store";
import {withRouter} from 'react-router-dom';
import {Card, Form, Container, Row, Alert, Button, ButtonToolbar, ListGroup, Table} from "react-bootstrap"
import {PlusCircle, XCircle, Layers, PlusSquare, Check} from 'react-feather';
import ChatQrService from './chat-qr-service'
import _ from 'underscore'

class Business extends Component{
  constructor(props) {
    super(props);

    const {http} = props;

    this.chatqrservice = new ChatQrService();
    this.chatqrservice.setHttp(http);

    this.state = {
    	viewAddBusiness: false,
    	newBusiness: {
    		"name": "",
    		"users": [],
    		"chat_id": "",
			"type": "business",
			"wallet": {
				"wallet_name": ""
			}
    	},
    	businesses: []
    }
  }

  componentDidMount(){
  	const self = this;

    self.chatqrservice.getBusinesses()
    .then(function(res){
    	self.setState({...self.state, businesses: res.data});
    });
  }

  setViewAddBusiness(viewAddBusiness){
    this.setState({...this.state, viewAddBusiness})
  }

  createBusiness(event){
    const self = this;
    const {newBusiness, businesses} = self.state;

    event.preventDefault();
    
    self.chatqrservice.createBusiness(newBusiness)
    .then(function(){
      businesses.push(newBusiness);

      self.setState({...self.state, 
      	addNewEmail: "",
        newBusiness: {
    		"name": "",
    		"users": [],
    		"chat_id": "",
			"type": "business",
			"wallet": {
				"wallet_name": ""
			}
    	},
        businesses
      }, ()=>{self.setViewAddBusiness(false)});
    })
    .catch(alert)
  }

  getBusinesses(){
    const {businesses} = this.state;
    
    var business_items = _.map(businesses, function(b){
      return (<tr>
          <td>{b.name}</td>
          <td>{b.chat_id}</td>
          <td>{b.wallet.wallet_name}</td>
        </tr>);
    })

    return (
      <Card>
        <Card.Header as="h5" style={{padding: 0}}><Alert variant="info" style={{marginBottom: 0}}>Business</Alert></Card.Header>
        <Card.Body>
          <Table striped bordered hover variant="dark">
            <thead>
              <tr>
                <th>Name</th>
                <th>Chat Id</th>
                <th>Wallet</th>
              </tr>
            </thead>
            <tbody>
              {business_items}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
      );
  }

  getBusinessUsers(){
  	const self = this;
  	const {newBusiness} = self.state;

  	return _.map(newBusiness.users, function(e, index){
  		return (<ListGroup.Item>{e} <Button variant="warning" onClick={()=>{
        	const {newBusiness} = self.state;
        	newBusiness.users.splice(index, 1);
        	self.setState({...self.state, newBusiness});
        }}><XCircle/></Button></ListGroup.Item>);
  	})
  }

  getAddNewBusiness(){
  	const self = this;
    const {newBusiness, addNewEmail} = self.state;

    return (
      <Card>
        <Card.Body>
          <Alert variant="info">
            <Form onSubmit={this.createBusiness.bind(this)}>
              <Form.Group controlId="businessName">
                <Form.Label>Business name</Form.Label>
                <Form.Control type="text" placeholder="Enter business name" value={newBusiness.name} onChange={(e)=>{
                  var business = newBusiness;
                  business.name = e.target.value;
                  this.setState({...this.state, newBusiness: business});
                }}/>
              </Form.Group>
              <Form.Group controlId="businessName">
                <Form.Label>Chat Id</Form.Label>
                <Form.Control type="number" placeholder="Telegram chat id" value={newBusiness.chat_id} onChange={(e)=>{
                  var business = newBusiness;
                  business.chat_id = e.target.value;
                  this.setState({...this.state, newBusiness: business});
                }}/>
              </Form.Group>
              <Form.Group controlId="businessUser">
                <Form.Label>User email</Form.Label>
                <Form.Control type="text" placeholder="Add user email" value={addNewEmail} onChange={(e)=>{
                  this.setState({...this.state, addNewEmail: e.target.value});
                }}/>
                <Button variant="info" onClick={()=>{
                	const {newBusiness, addNewEmail} = self.state;
                	newBusiness.users.push(addNewEmail);
                	console.log(newBusiness);
                	self.setState({...self.state, newBusiness, addNewEmail: ""});
                }}>
                	<PlusCircle/>
              	</Button>
              	<ListGroup variant="info">
				  {self.getBusinessUsers()}
				</ListGroup>
              </Form.Group>
              <Form.Group controlId="walletName">
                <Form.Label>Wallet name</Form.Label>
                <Form.Control type="text" placeholder="Wallet name" value={newBusiness.wallet.wallet_name} onChange={(e)=>{
                  var business = newBusiness;
                  business.wallet.wallet_name = e.target.value;
                  this.setState({...this.state, newBusiness: business});
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

  render() {
    const self = this;
    const {user} = self.props;
    const {viewAddBusiness} = self.state;

    var businessView;
    if(viewAddBusiness){
      businessView = self.getAddNewBusiness();
    }else{
      businessView = self.getBusinesses();
    }

    return (<Container>
    	<Row>
          <ButtonToolbar>
            <Button variant="primary" onClick={()=>{self.setViewAddBusiness(false)}}><Layers/></Button>
            <Button variant="primary" onClick={()=>{self.setViewAddBusiness(true)}}><PlusSquare/></Button>
          </ButtonToolbar>
        </Row>
		<Row class="justify-content-center">
		  {businessView}
		</Row>
	</Container>);               

  }
}

const mapStateToProps = (state, ownProps) => {
  return {
    http: state.jwtAuthReducer.http, 
    user: state.jwtAuthReducer.user
  }
}

export default withRouter(connect(mapStateToProps)(Business));

