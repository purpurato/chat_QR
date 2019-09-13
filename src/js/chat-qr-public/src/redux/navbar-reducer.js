
const initialState = {
  uri: '/',
  queryParams: '',
  http: ''
};

const navbarReducer = (state = initialState, action) => {
  switch (action.type) {
    case 'user-login':{
      return {
        ...state,
        showLogin: action.showLogin
      }
    }
    case 'http-factory':{
      return {
        ...state,
        http: action.http
      }
    }
    case 'map-clicked':{
      return {
        ...state,
        mapClicked: action.event
      }
    }
    default: {
      return state;
    }
  }
};

export default navbarReducer;