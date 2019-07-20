import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import {withRouter} from 'react-router-dom';
import {ArrowRightCircle} from 'react-feather';
import BitcoinService from './service'
import _ from 'underscore';
import {Container, Row, Col, Card, Button, Alert, ListGroup} from 'react-bootstrap';

class Transaction extends Component{
  constructor(props) {
    super(props);

    const {http} = props;

    this.bitcoin = new BitcoinService();
    this.bitcoin.setHttp(http);

    this.state = {
      transaction: {
        txout: {}
      },
    }
  }

  componentDidMount(){
    const self = this;

    self.getTransaction();
  }

  getTransaction(){
    const self = this;
    const {location, match} = self.props;
    const {params} = match;

    var transaction = {
      tvin: []
    };

    self.bitcoin.getTransaction(params.txid)
    .then(function(res){
      var txout = res.data;
      transaction.txout = txout;

      return Promise.all([
          Promise.all(_.map(txout.vin, function(tvin){
              return self.bitcoin.getTransaction(tvin.txid)
              .then(function(res){
                  var txin = res.data;
                  if(txin){
                    transaction.tvin.push({
                      addresses: txin.vout[tvin.vout].scriptPubKey.addresses, 
                      value: txin.vout[tvin.vout].value
                    })  
                    return txin.vout[tvin.vout].value;
                  }
                  return 0;
              });
          }))
          .then(function(res){
              var sum = _.reduce(res, function(memo, num){ return memo + num; }, 0);
              return sum;
          }),
          Promise.all(_.map(txout.vout, function(vout){
              return vout.value;
          }))
          .then(function(res){
              var sum = _.reduce(res, function(memo, num){ return memo + num; }, 0);
              return sum;
          })
      ])
      .then(function(total){
        var totalin = total[0], totalout = total[1];

        transaction.totalin = totalin;
        transaction.totalout = totalout;

        var fees = totalin - totalout;
        if(fees < 0){
          fees = 0;
        }
        transaction.fees = fees;

        var feeperbyte = (fees/0.00000001)/txout.size;
        transaction.feeperbyte = feeperbyte;
        
        var feeperweightunit = (fees/0.00000001)/txout.weight;
        transaction.feeperweightunit = feeperweightunit;

        self.setState({...self.state, transaction});
      });
        

    });
    
  }

  getTvinView(transaction){

    var listItems = _.map(transaction.tvin, function(tvin){
      return (<ListGroup.Item variant="light">{tvin.addresses}</ListGroup.Item>);
    })

    return (<ListGroup>
              {listItems}
            </ListGroup>);
  }

   getTvoutView(transaction){
    const {txout} = transaction;

    var listItems = _.map(transaction.txout.vout, function(vout){
      return (<ListGroup.Item variant="light">
        <Row>
          <Col>{vout.scriptPubKey.addresses}</Col><Col style={{textAlign: "right"}}>{vout.value} BTC</Col>
        </Row>
      </ListGroup.Item>);
    })

    return (<ListGroup>
              {listItems}
            </ListGroup>);
  }

  getConfirmedTransactionView(transaction){
    const {txout} = transaction;

    if(txout.confirmations > 0){
      return (<Alert variant="success" style={{margin: 0}}>{txout.confirmations} confirmations</Alert>)
    }else{
      return (<Alert variant="danger" style={{margin: 0}}>Unconfirmed transaction!</Alert>)
    }
  }

  getSummaryTransactionView(transaction){
    const {txout} = transaction;

    var date = (new Date(txout.time)).toString();

    return (
      <ListGroup>
        <ListGroup.Item variant="light">
          <Row>
            <Col>Size</Col><Col style={{textAlign: "right"}}>{txout.size}</Col>
          </Row>
        </ListGroup.Item>
        <ListGroup.Item variant="light">
          <Row>
            <Col>Weight</Col><Col style={{textAlign: "right"}}>{txout.weight}</Col>
          </Row>
        </ListGroup.Item>
        <ListGroup.Item variant="light">
          <Row>
            <Col>Received Time</Col><Col style={{textAlign: "right"}}>{date}</Col>
          </Row>
        </ListGroup.Item>
      </ListGroup>);
  }

  getInputsOutputsView(transaction){
    return (
      <ListGroup>
        <ListGroup.Item variant="light">
          <Row>
            <Col>Total Input</Col><Col style={{textAlign: "right"}}>{transaction.totalin}</Col>
          </Row>
        </ListGroup.Item>
        <ListGroup.Item variant="light">
          <Row>
            <Col>Total Output</Col><Col style={{textAlign: "right"}}>{transaction.totalout}</Col>
          </Row>
        </ListGroup.Item>
        <ListGroup.Item variant="light">
          <Row>
            <Col>Fees</Col><Col style={{textAlign: "right"}}>{transaction.fees}</Col>
          </Row>
        </ListGroup.Item>
        <ListGroup.Item variant="light">
          <Row>
            <Col>Fee per byte</Col><Col style={{textAlign: "right"}}>{transaction.feeperbyte}</Col>
          </Row>
        </ListGroup.Item>
        <ListGroup.Item variant="light">
          <Row>
            <Col>Fee per weight unit</Col><Col style={{textAlign: "right"}}>{transaction.feeperweightunit}</Col>
          </Row>
        </ListGroup.Item>
        
      </ListGroup>);
  }

  render() {
    const self = this;
    
    const {transaction} = self.state;
    console.log(transaction)
    return (<Container fluid="true">
        <Card>
          <Card.Header style={{padding: 0}}><Alert variant="info" style={{margin: 0}}><h5>Transaction</h5></Alert></Card.Header>
          <Card.Body>
            <Row>
              <Col sm={5} style={{padding: 0}}>
                <Card bg="primary">
                  <Card.Body>
                    {self.getTvinView(transaction)}
                  </Card.Body>
                </Card>
              </Col>
              <Col sm={1} style={{padding: 0}}>
                <Card bg="info">
                  <Card.Body style={{margin: "auto"}}>
                    <ArrowRightCircle/>
                  </Card.Body>
                </Card>
              </Col>
              <Col sm={6} style={{padding: 0}}>
                <Card bg="primary">
                  <Card.Body>
                    {self.getTvoutView(transaction)}
                  </Card.Body>
                </Card>
              </Col>
            </Row>
            <Row>
              <Col sm={{ span: 5, offset: 7 }}>
                <Card bg="primary">
                  <Card.Body>
                    {self.getConfirmedTransactionView(transaction)}
                  </Card.Body>
                </Card>
              </Col>
            </Row>
            <Row>
              <Col sm={6}>
                <Card bg="primary">
                  <Card.Header>Summary</Card.Header>
                  <Card.Body>
                    {self.getSummaryTransactionView(transaction)}
                  </Card.Body>
                </Card>
              </Col>
              <Col sm={6}>
                <Card bg="primary">
                  <Card.Header>Inputs and Outputs</Card.Header>
                  <Card.Body>
                    {self.getInputsOutputsView(transaction)}
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      </Container>
    );

  }
}

const mapStateToProps = (state, ownProps) => {
  return {
    http: state.jwtAuthReducer.http
  }
}

export default withRouter(connect(mapStateToProps)(Transaction));
