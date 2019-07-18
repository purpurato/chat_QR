
export default class BitcoinService{

  constructor(){
    this.http = {};
  }

  setHttp(http){
    this.http = http;
  }

  getWallets() {
    return this.http({
      method: 'GET',
      url: '/node/wallets'
    });
  }

  createWallet(wallet) {
    return this.http({
      method: 'POST',
      url: '/node/wallet',
      data: wallet
    });
  }

  getBalance(wallet){
    return this.http({
      method: 'GET',
      url: '/node/wallet/' + wallet + '/balance'
    });
  }

  loadWallets(){
    return this.http({
      method: 'PUT',
      url: '/node/wallets/load'
    });
  }
}