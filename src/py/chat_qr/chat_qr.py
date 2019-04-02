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
    def getRate(self):
        try:
            """Retrieve BTCCOP rate from localbitcoins"""
            url_lb = self.conf["rate"]["url"]
            get_lb = requests.get(url_lb)
            ticker = get_lb.json()
            cop_rate = eval("ticker" + self.conf["rate"]["json_keys"])
            return float(cop_rate)
        except Exception as e:
            print("getRate", file=sys.stderr)
            print(e, file=sys.stderr)
            return 1

    def getWalletAddress(self, chat_id):
        wallet = self.db.getWallet(chat_id)
        return wallet["address"]

    # QR code creation
    def getQrImg(self, chat_id, cop_price):
        address = self.getWalletAddress(chat_id)
        btc_amnt = float(cop_price)/self.getRate()
        btc_amnt = str(btc_amnt)
        invoice_qr = qrcode.make('bitcoin:' + address + '?amount=' + str(btc_amnt))
        bio = BytesIO()
        bio.name = 'qr.png'
        invoice_qr.get_image().save(bio, format="png")
        bio.seek(0)
        return bio

    def messageHandler(self, update, context):
        """Response to message with QR invoice in bitcoin"""
        message = update.message.text

        if message[0] == "$":
            cop_price = message[1:]
            qrimg = self.getQrImg(chat_id=update.message.chat_id, cop_price=cop_price)
            context.bot.send_photo(chat_id=update.message.chat_id, photo=qrimg)
        else:
            print(message)

    def sendMessage(self, message):
        self.bot.send_message(**message)

    def sendPhoto(self, message):
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
        
        answer_qr_handler = MessageHandler(Filters.text, self.messageHandler)
        self.dispatcher.add_handler(answer_qr_handler)
        self.updater.start_polling()
