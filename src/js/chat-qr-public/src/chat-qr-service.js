
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

  getInvoices(){
    return this.http({
      method: 'GET',
      url: '/invoices'
    });
  }
  
}