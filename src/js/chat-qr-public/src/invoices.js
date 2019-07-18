import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import store from "./redux/store";
import {withRouter} from 'react-router-dom';
import {Card, Form, Container, Row, Alert, Button, ButtonToolbar, ListGroup, Table} from "react-bootstrap"
import {PlusCircle, XCircle, Layers, PlusSquare, Check} from 'react-feather';
import ChatQrService from './chat-qr-service'
import _ from 'underscore'
import {
  ScatterChart, Scatter, Cell, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
var Color = require('color');

class Invoices extends Component{
  constructor(props) {
    super(props);

    const {http} = props;

    this.chatqrservice = new ChatQrService();
    this.chatqrservice.setHttp(http);

    this.state = {
      invoices: []
    }
  }

  componentDidMount(){
  	const self = this;

    self.getInvoices();
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
        self.setState({...self.state, invoices});
      });
    });
  }

  getScatter(invoices){
    const self = this;
    const length = invoices.length;
    return _.map(invoices, function(invoice, index){
      var color = Color.hsv(Math.floor(360*(index/length)), 100, 100).string();
      return (
        <Scatter name={invoice.business.name} data={invoice.invoices} fill={color} />
      )
    })
  }

  drawScatterPlot(invoice){
    const self = this;
    const {invoices} = self.state;


    return (
      <Card>
        <Card.Header as="h5" style={{padding: 0}}><Alert variant="info" style={{marginBottom: 0}}>BTC transactions</Alert></Card.Header>
        <Card.Body>
          <Alert variant="light">
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart
                margin={{ top: 10, right: 20, bottom: 10, left: 50 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" name="date" type="number" scale="time" domain={['dataMin', 'dataMax']} tickFormatter={(timeTick)=>{
                  return new Date(timeTick);
                }}/>
                <YAxis dataKey="value" name="bitcoin" unit="btc" type="number"/>
                <Tooltip cursor={{ strokeDasharray: '3 3' }} formatter={(value, name, props)=>{
                  if(name == "date"){
                    var date = new Date(value);
                    return [date.toString(), name];
                  }
                  return [value, name];
                }}/>
                <Legend/>
                {self.getScatter(invoices)}
              </ScatterChart>
            </ResponsiveContainer>
          </Alert>
        </Card.Body>
      </Card>);
  }

  render() {
    const self = this;
    const {invoices} = self.state;
    
    return (<Container fluid="true">
    	{self.drawScatterPlot()}
	</Container>);               

  }
}

const mapStateToProps = (state, ownProps) => {
  return {
    http: state.jwtAuthReducer.http, 
    user: state.jwtAuthReducer.user
  }
}

export default withRouter(connect(mapStateToProps)(Invoices));

