
export default class ChatQrService{

  constructor(){
    this.http = {};
  }

  setHttp(http){
    this.http = http;
  }

  getBusinesses() {
    return this.http({
      method: 'GET',
      url: '/businesses'
    });
  }

  getBusinessesPublicInfo() {
    return this.http({
      method: 'GET',
      url: '/businesses/public'
    });
  }

  getBusiness(chat_id) {
    return this.http({
      method: 'GET',
      url: '/business/' + chat_id
    });
  }

  createBusiness(business) {
    return this.http({
      method: 'POST',
      url: '/business',
      data: business
    });
  }

  updateBusiness(business){
    return this.http({
      method: 'PUT',
      url: '/business',
      data: business
    }); 
  }

  getInvoices(){
    return this.http({
      method: 'GET',
      url: '/invoices'
    });
  }

  verifyInvoices(){
    return this.http({
      method: 'PUT',
      url: '/invoices'
    });
  }

  getInvoice(id){
    return this.http({
      method: 'GET',
      url: '/invoice/' + id
    });
  }

  getCurrencies(){
    return this.http({
      method: 'GET',
      url: '/currencies'
    }); 
  }

  getMapsKey(){
    return this.http({
      method: 'GET',
      url: '/maps/key'
    }); 
  }
  
}