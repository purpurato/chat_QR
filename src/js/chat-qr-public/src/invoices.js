import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import store from "./redux/store";
import {withRouter} from 'react-router-dom';
import {Card, Container, Row, Col, Alert, Button, ButtonToolbar, Form, ListGroup} from "react-bootstrap"
import {PlusCircle, XCircle, Layers, PlusSquare, Check, Activity} from 'react-feather';
import ChatQrService from './chat-qr-service'
import _ from 'underscore'
import {
  ScatterChart, Scatter, Cell, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import qs from 'query-string'
import jwt from 'jsonwebtoken'

var Color = require('color');



class Invoices extends Component{
  constructor(props) {
    super(props);

    const {http} = props;

    this.chatqrservice = new ChatQrService();
    this.chatqrservice.setHttp(http);

    this.state = {
      invoices: [], 
      currencies: ['COP'],
      selectedCurrency: 'COP',
      selectedInvoice: {},
      selectedBusiness: {}
    }
  }

  componentDidMount(){
  	const self = this;

    const {public_invoice, admin_invoice} = self.props;

    if(public_invoice){
      self.decodeInvoiceToken();
    }else{
      Promise.all([self.getInvoices(), self.getInvoice()]);
    }
    
  }

  decodeInvoiceToken(){
    const self = this;
    const {history} = self.props;

    if(history.location.search){
      var token = qs.parse(history.location.search);
      jwt.decode(token.token);
      var selectedInvoice = jwt.decode(token.token);
      
      self.setState({...self.state, selectedInvoice});
    }
  }

  getInvoice(){
    const self = this;
    const {history} = self.props;
    if(history && history.location && history.location.search){
      const invoiceid = qs.parse(history.location.search).invoice;
      if(invoiceid){
        return self.chatqrservice.getInvoice(invoiceid)
        .then(function(res){
          var selectedInvoice = res.data;
          return self.chatqrservice.getBusiness(selectedInvoice.chat_id)
          .then(function(res){
            var selectedBusiness = res.data;
            self.setState({...self.state, selectedInvoice, selectedBusiness});
          })
        });
      }
    }
    return Promise.resolve();
  }

  getInvoices(){
    const self = this;

    return self.chatqrservice.getInvoices()
    .then(function(res){
      var invoices = res.data;
      return Promise.all(_.map(invoices, function(invoice, chat_id){
        return self.chatqrservice.getBusiness(chat_id)
        .then(function(res){
          return {
            invoices: invoice,
            business: res.data
          };
        });
      }))
      .then(function(invoices){
        var currencies = _.uniq(_.pluck(_.pluck(invoices, 'business'), 'currency'));
        self.setState({...self.state, invoices, currencies});
      });
    });
  }

  verifyUnconfirmedInvoices(){
    const self = this;
    self.chatqrservice.verifyInvoices()
    .then(function(res){
      console.log(res);
    })
  }

  getScatter(invoices, selectedCurrency){
    const self = this;
    const length = invoices.length;
    const {history} = self.props;

    var filteredInvoices = _.filter(invoices, (invoice)=>{
      return (invoice.business.currency === selectedCurrency || selectedCurrency === 'BTC');
    });
    
    return _.map(filteredInvoices, function(invoice, index){
      var color = Color.hsv(Math.floor(360*(index/length)), 100, 100).string();
      return (
        <Scatter name={invoice.business.name} data={invoice.invoices} fill={color} onClick={(invoice)=>{
          history.push({
            search: qs.stringify({
              invoice: invoice._id
            })
          });
          self.setState({...self.state, selectedInvoice: invoice});
        }}/>
      )
    })
  }

  changeCurrency(e){
    const self = this;
    const selectedCurrency = e.target.value;
    self.setState({...self.state, selectedCurrency});
  }

  getCurrencies(){
    const self = this;
    const {currencies} = self.state;

    return (<Form.Control as="select" onChange={(e)=>{self.changeCurrency(e)}}>
      {_.map(currencies, (c)=>{return (<option>{c}</option>)})}
      <option>BTC</option>
    </Form.Control>
    )

  }

  drawSingleInvoiceTransactionButton(selectedInvoice){
    const self = this;
    const {txurl, history} = self.props;

    var txids = selectedInvoice.txids? selectedInvoice.txids: [selectedInvoice.txid];

    if(txids[0]){
      return _.map(txids, function(txid){
        return (<Button onClick={()=>{history.push(txurl + "/" + txid)}} ><Activity/></Button>);
      });  
    }else{
      return '';
    }
  }

  drawSingleInvoice(selectedInvoice, selectedBusiness){
    const self = this;

    var displayBusinessName = '';
    
    if(selectedBusiness && !_.isEmpty(selectedBusiness)){
      displayBusinessName = selectedBusiness.name;
    }

    return (
        <Card>
          <Card.Header as="h5" style={{padding: 0}}><Alert variant="info" style={{marginBottom: 0}}>Invoice {displayBusinessName}</Alert></Card.Header>
          <Card.Body>
            <Alert variant="light">
              <ListGroup>
                <ListGroup.Item variant="light">
                  <Row>
                    <Col>Total invoice</Col><Col style={{textAlign: "right"}}>{selectedInvoice.invoice}</Col>
                  </Row>
                </ListGroup.Item>
                <ListGroup.Item variant="light">
                  <Row>
                    <Col>Date</Col><Col style={{textAlign: "right"}}>{(new Date(selectedInvoice.date)).toString()}</Col>
                  </Row>
                </ListGroup.Item>
                <ListGroup.Item variant="light">
                  <Row>
                    <Col>Qr</Col><Col style={{textAlign: "right"}}>{selectedInvoice.qr_string}</Col>
                  </Row>
                </ListGroup.Item>
                <ListGroup.Item variant="light">
                  <Row>
                    <Col>Rate</Col><Col style={{textAlign: "right"}}>{selectedInvoice.rate}</Col>
                  </Row>
                </ListGroup.Item>
                <ListGroup.Item variant="light">
                  <Row>
                    <Col>Status</Col><Col style={{textAlign: "right"}}><Alert variant={(()=>{
                      if(selectedInvoice.status === "CONFIRMED"){
                        return "success";
                      }else if(selectedInvoice.status === "ALIVE"){
                        return "warning";
                      }else{
                        return "danger";
                      }
                    })()}>{selectedInvoice.status}</Alert></Col>
                  </Row>
                </ListGroup.Item>
                <ListGroup.Item variant="light">
                  <Row>
                    <Col>BTC total</Col><Col style={{textAlign: "right"}}>{selectedInvoice.value}</Col>
                  </Row>
                </ListGroup.Item>
                <ListGroup.Item variant="light">
                  <Row>
                    <Col>Transaction</Col><Col style={{textAlign: "right"}}>{self.drawSingleInvoiceTransactionButton(selectedInvoice)}</Col>
                  </Row>
                </ListGroup.Item>
              </ListGroup>
            </Alert>
          </Card.Body>
        </Card>)
  }

  drawInvoice(){
    const self = this;
    const {history} = self.props;
    const {selectedInvoice, selectedBusiness} = self.state;
    
    if(!_.isEmpty(selectedInvoice)){
      return self.drawSingleInvoice(selectedInvoice, selectedBusiness);
    }
    return '';
  }

  drawScatterPlot(invoice){
    const self = this;
    const {invoices, selectedCurrency} = self.state;

    var datakey = selectedCurrency === 'BTC'? 'value': 'invoice';

    return (
      <Card>
        <Card.Header as="h5" style={{padding: 0}}><Alert variant="info" style={{marginBottom: 0}}>Transactions</Alert></Card.Header>
        <Card.Body>
          <Alert variant="light">
            <ButtonToolbar>
              {self.getCurrencies()}
            </ButtonToolbar>
          </Alert>
          <Alert variant="light">
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart
                margin={{ top: 10, right: 20, bottom: 10, left: 50 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" name="date" type="number" scale="time" domain={['dataMin', 'dataMax']} tickFormatter={(timeTick)=>{
                  return new Date(timeTick);
                }}/>
                <YAxis dataKey={datakey} name="currency" unit={selectedCurrency} type="number"/>
                <Tooltip cursor={{ strokeDasharray: '3 3' }} formatter={(value, name, props)=>{
                  if(name == "date"){
                    var date = new Date(value);
                    return [date.toString(), name];
                  }
                  return [value, name];
                }}/>
                <Legend/>
                {self.getScatter(invoices, selectedCurrency)}
              </ScatterChart>
            </ResponsiveContainer>
          </Alert>
        </Card.Body>
      </Card>);
  }

  drawUnconfirmedInvoices(){
    const self = this;
    const {invoices} = self.state;

    return _.map(invoices, function(inv_buss){
      var unconfirmed = _.filter(inv_buss.invoices, function(inv){
        return inv.status === 'CREATED' || inv.status === 'ALIVE';
      });

      return (<Row>
        {
          _.map(unconfirmed, function(unc_inv){
            return (<Col>{self.drawSingleInvoice(unc_inv)}</Col>);
          })
        }
        </Row>
      );
    })
  }

  render() {
    const self = this;
    const {public_invoice, admin_invoice} = self.props;
    
    if(public_invoice){
      return (<Container fluid="true">
        <Row>
          <Col>
            {self.drawInvoice()}
          </Col>
        </Row>
    </Container>);
    }else if(admin_invoice){
      return (<Container fluid="true">
        <Row>
          <ButtonToolbar>
              <Button onClick={(e)=>{self.verifyUnconfirmedInvoices(e)}}><Activity/> Verify all invoices</Button>
            </ButtonToolbar>
        </Row>
        <Row>
          {self.drawUnconfirmedInvoices()}
        </Row>
      </Container>);
    }else{
      return (<Container fluid="true">
        <Row>
          <Col>
            {self.drawScatterPlot()}
          </Col>
        </Row>
        <Row>
          <Col>
            {self.drawInvoice()}
          </Col>
        </Row>
      </Container>);
    }
  }
}

const mapStateToProps = (state, ownProps) => {
  return {
    http: state.jwtAuthReducer.http, 
    user: state.jwtAuthReducer.user
  }
}

export default withRouter(connect(mapStateToProps)(Invoices));

