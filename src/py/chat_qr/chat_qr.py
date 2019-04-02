import qrcode, requests, telegram, logging
from telegram.ext import Updater, MessageHandler, Filters #CommandHandler
import threading
from io import BytesIO

class ChatQr(threading.Thread):

    def __init__(self):
        threading.Thread.__init__(self)
    
    def setConfiguration(self, conf):
        self.conf = conf

    def getConfiguration(self):
        return self.conf

    def setDb(self, db):
        self.db = db

    # To be modified in the future if more exchanges operate
    def rate(self):
        try:
            """Retrieve BTCCOP rate from localbitcoins"""
            url_lb = 'https://localbitcoins.com/bitcoinaverage/ticker-all-currencies/'
            get_lb = requests.get(url_lb)
            ticker = get_lb.json()['COP']['rates']['last']
            return float(ticker)
        except Exception as e:
            print("uploadDocuments", file=sys.stderr)
            print(e, file=sys.stderr)
            return 1

    def getWalletAddress(self, chat_id):
        wallet = self.db.getWallet(chat_id)
        return wallet["address"]

    # QR code creation
    def getQr(self, chat_id, cop_price):
        """Returns QR code with price in BTC using rate() """

        address = self.getWalletAddress(chat_id)
        btc_amnt = float(cop_price)/self.rate()
        btc_amnt = str(btc_amnt)
        invoice_qr = qrcode.make('bitcoin:' + address + '?amount=' + str(btc_amnt))
        bio = BytesIO()
        bio.name = 'qr.png'
        invoice_qr.get_image().save(bio, format="png")
        bio.seek(0)
        return bio

    def answer(self, update, context):
        """Response to message with QR invoice in bitcoin"""
        message = update.message.text

        if message[0] == "$":
            cop_price = message[1:]
            qrimg = self.getQr(chat_id=update.message.chat_id, cop_price=cop_price)
            context.bot.send_photo(chat_id=update.message.chat_id, photo=qrimg)
        else:
            print(message)

    def sendMessage(self, message):
        self.bot.send_message(**message)
            
    # Transactions need to be checked if sent 
    # and response sent to user and to admin. 
    
    def run(self):
        
        # Bot info and associated instances
        token = self.getConfiguration()["token"]
        self.bot = telegram.Bot(token)
        self.updater = Updater(token, use_context=True)
        self.dispatcher = self.updater.dispatcher
        
        # Logs for exceptions
        logging.basicConfig(format='%(asctime)s - %(name)s - %(levelname)s - %(message)s', level=logging.INFO)
        
        answer_qr_handler = MessageHandler(Filters.text, self.answer)
        self.dispatcher.add_handler(answer_qr_handler)
        self.updater.start_polling()
