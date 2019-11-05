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

class NavBar extends Component{
  constructor(props) {
    super(props);

    this.state = {
      showLogin: false
    }
  }

  getComputing(){
    const {user} = this.props;
    if(user && user.scope && user.scope.indexOf('clusterpost') != -1){
      return <Nav.Link><Link class="nav-link" to="/computing"><Cpu/> Computing</Link></Nav.Link>
    }
  }

  getSettings(){
    const {user, history} = this.props;

    if(user && user.scope && user.scope.indexOf('admin') != -1){
      return ( 
        <Nav.Link>
          <NavDropdown title={<t><Settings/> Settings</t>} id="basic-nav-dropdown">
            <NavDropdown.Item onClick={()=>{history.push('/admin/users')}}><Users/> Users</NavDropdown.Item>
            <NavDropdown.Item onClick={()=>{history.push('/admin/business')}}><Layers/> Business</NavDropdown.Item>
            <NavDropdown.Item onClick={()=>{history.push('/admin/wallets')}}><CreditCard/> Wallets</NavDropdown.Item>
            <NavDropdown.Item onClick={()=>{history.push('/admin/invoices')}}><Archive/> Invoices</NavDropdown.Item>
          </NavDropdown>
        </Nav.Link>
        );
    }
  }

  onUserLogin(){
    this.props.userLogin(!this.state.showLogin);
    this.setState({...this.state, showLogin: !this.state.showLogin});    
    this.props.history.push('/login');
  }

  getUserDropDown(){
    const {user, history} = this.props;
    
    if(user && user.scope && user.scope.indexOf('default') != -1){
      return (<Nav.Link>
          <NavDropdown title={<User/>} id="basic-nav-dropdown">
            <NavDropdown.Item onClick={()=>{history.push('/user')}}><User/> Profile</NavDropdown.Item>
            <NavDropdown.Divider/>
            <NavDropdown.Item onClick={()=>{history.push('/logout')}}><LogOut/> Logout</NavDropdown.Item>
          </NavDropdown>
        </Nav.Link>);
    }else{
      return (<Nav.Link>
          <NavDropdown title={<User/>} id="basic-nav-dropdown">
            <NavDropdown.Item onClick={this.onUserLogin.bind(this)}><LogIn/> Login</NavDropdown.Item>
          </NavDropdown>
        </Nav.Link>);
    }
  }

  getHome(){
    const {user} = this.props;
    if(user && user.scope){
      return (<Nav.Link><Link class="nav-link" to="/home"><Home/> Home</Link></Nav.Link>)
    }
  }

  render() {
    const self = this;
    const {user} = self.props;

    return (<Navbar bg="secondary" fixed="top" >
      <Navbar.Brand href="#/"><Image src="/icons/SVG/Logo_Con_Fondo/Isotipo/Isotipo_con_fondo_amarillo.svg" style={{height: "5vh"}}/></Navbar.Brand>
      <Navbar.Toggle />
      <Navbar.Collapse className="justify-content-end">
        <Nav className="mr-auto">
          {self.getHome()}
          {self.getComputing()}
          {self.getSettings()}
          {self.getUserDropDown()}
        </Nav>
      </Navbar.Collapse>
    </Navbar>);               

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

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(NavBar));

// const httpFactory = http => ({
//   type: 'http-factory',
//   http: http
// });

// export default connect(mapStateToProps, {httpFactory})(NavBar);