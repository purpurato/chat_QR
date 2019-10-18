import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import store from "./redux/store";
import {withRouter} from 'react-router-dom';
import {Home, User, Users, Cpu, Settings, LogOut, LogIn, CreditCard, Layers, Archive} from 'react-feather';
import NavDropdown from 'react-bootstrap/NavDropdown';
import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';
import Image from 'react-bootstrap/Image';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';

class Footer extends Component{
  constructor(props) {
    super(props);
  }

  render() {
    const self = this;
    const {user} = self.props;

    return (<Navbar expand="sm" bg="primary" variant="primary" sticky="bottom" >
      <Nav.Link bsPrefix="nav-link-white" href="mailto:contact@bit2cash.site">Contact us</Nav.Link>
      <Navbar.Collapse className="justify-content-end">
        <Navbar.Brand href="#"><Image src="/icons/SVG/Logo_Con_Fondo/Versión_horizontal/Horizontal_con_fondo_morado.svg" style={{height: "5vh"}}/></Navbar.Brand>
	    </Navbar.Collapse>
    </Navbar>);               

  }
}

export default Footer;


