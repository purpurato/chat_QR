
import threading
from threading import Thread
import websocket
import ssl
from urllib.parse import urlencode
import json
import sys


class ChatQrTransaction(threading.Thread):

    def __init__(self):
        threading.Thread.__init__(self)
    
    def setConfiguration(self, conf):
        self.conf = conf

    def getConfiguration(self):
        return self.conf

    def setDb(self, db):
        self.db = db

    def setChatQr(self, chatqr):
        self.chatqr = chatqr

    def wsBlocks(self):

        def on_block_message(ws, block):
            
            inline_keyboard = [[{
                "text": "View",
                "callback_data": json.dumps({"th": block.x.hash})
            }]]

            transaction = self.db.getChatId(block.x.hash)

            if transaction is not None:
                message = {
                    "chat_id": transaction["chat_id"], 
                    "text": "Confirmed!",
                    "reply_markup": json.dumps({ "inline_keyboard": inline_keyboard })
                }

                transaction["block"] = block

                self.db.uploadDocuments(transaction)

                self.chatqr.sendMessage(message)
            

        def on_block_error(ws, error):
            print("on_block_error", file=sys.stderr)
            print(error, file=sys.stderr)

        def on_block_close(ws):
            print("### on_block_close ###")

        def on_block_open(ws):
            ws.send(json.dumps({"op":"unconfirmed_sub"}))
        
        ws = websocket.WebSocketApp("wss://ws.blockchain.info/inv",
                                  on_message = on_block_message,
                                  on_error = on_block_error,
                                  on_close = on_block_close)
        ws.on_open = on_block_open
        ws.run_forever(sslopt={"cert_reqs": ssl.CERT_NONE})

    def wsWallets(self):

        def wsWallet(wallet):
            
            def on_wallet_message(ws, transaction):
                trans = {
                    "chat_id": wallet["chat_id"], 
                    "transaction": transaction,
                    "type": "transaction"
                }
                
                self.db.uploadDocuments(trans)

                inline_keyboard = [[{
                    "text": "View",
                    "callback_data": json.dumps({"th": transaction.x.hash})
                }]]

                message = {
                    "chat_id": wallet["chat_id"], 
                    "text": "New transaction",
                    "reply_markup": json.dumps({ "inline_keyboard": inline_keyboard })
                }

                self.chatqr.sendMessage(message)

            def on_wallet_error(ws, error):
                print("on_block_error", file=sys.stderr)
                print(error, file=sys.stderr)

            def on_wallet_close(ws):
                print("### on_block_close ###")

            def on_wallet_open(ws):
                print("Wallet sub:", wallet["wallet"]["address"])
                ws.send(json.dumps({"op":"addr_sub", "addr": wallet["wallet"]["address"]}))
            
            ws = websocket.WebSocketApp("wss://ws.blockchain.info/inv",
                                      on_message = on_wallet_message,
                                      on_error = on_wallet_error,
                                      on_close = on_wallet_close)
            ws.on_open = on_wallet_open
            ws.run_forever(sslopt={"cert_reqs": ssl.CERT_NONE})

        wallets = self.db.getWallets()
        wallet_threads = []
        for w in wallets:
            if "chat_id" in w and "wallet" in w and "address" in w["wallet"]:
                thread_wallet = Thread(target = wsWallet, args=[w])
                thread_wallet.start()
                wallet_threads.append(thread_wallet)

        for t in wallet_threads:
            t.join()
    
    def run(self):
        
        thwsBlocks = Thread(target = self.wsBlocks)
        thwsBlocks.start()

        self.wsWallets()

        thwsBlocks.join()
        
        