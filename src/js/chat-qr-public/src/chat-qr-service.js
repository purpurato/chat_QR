
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

  createBusiness(business) {
    return this.http({
      method: 'POST',
      url: '/business',
      data: business
    });
  }
  
}