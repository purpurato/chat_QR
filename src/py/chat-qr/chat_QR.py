import qrcode, requests, telegram, logging
from telegram.ext import Updater, MessageHandler, Filters #CommandHandler

# Users. To be defined, for now just bitcoin address. 
address = '1DExbZqgmQ2SEBbRrrQb9aAR6RxvrApoGH'

# Bot info and associated instances
tkn = '682085125:AAFHd5kEI_BINtisvIxlnwfi8IkyjnvD5xU'
bot = telegram.Bot(tkn)
updater = Updater(tkn)
dispatcher = updater.dispatcher

# Logs for exceptions
logging.basicConfig(format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
level=logging.INFO)

# To be modified in the future if more exchanges operate
def rate():
    """Retrieve BTCCOP rate from localbitcoins"""
    url_lb = 'https://localbitcoins.com/bitcoinaverage/ticker-all-currencies/'
    get_lb = requests.get(url_lb)
    ticker = get_lb.json()['COP']['rates']['last']
    return float(ticker)

# QR code creation
def qr_invoice(invoice_cop, rate):
    """Returns QR code with price in BTC using rate() """
    btc_amnt = float(invoice_cop)/rate()
    btc_amnt = str(btc_amnt)
    invoice_qr = qrcode.make('bitcoin:' + address + 
    '?amount=' + str(btc_amnt))
    invoice_qr.save('Inv.png')
    #return invoice_qr

def answer_qr(bot, update):
    """Response to message with QR invoice in bitcoin"""
    cop_price = update.message.text
    qr_invoice(cop_price, rate)
    bot.send_photo(chat_id=update.message.chat_id, 
    photo=open('Inv.png', 'rb'))
        
# Transactions need to be checked if sent 
# and response sent to user and to admin. 
    
answer_qr_handler = MessageHandler(Filters.text, answer_qr)
dispatcher.add_handler(answer_qr_handler)
    
updater.start_polling()
