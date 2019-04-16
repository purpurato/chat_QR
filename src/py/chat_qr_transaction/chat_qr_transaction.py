
import threading
from threading import Thread
from time import sleep
import websocket
import ssl
from urllib.parse import urlencode
import json
import sys
import requests


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

            try:
                block = json.loads(block)

                if("x" in block and "hash" in block["x"]):
                    transaction = self.db.getTransaction(block["x"]["hash"])

                    if transaction is not None:

                        inline_keyboard = [[{
                            "text": "View",
                            "url": self.conf["url_tx"] + "/" + block["x"]["hash"]
                        }]]

                        message = {
                            "chat_id": transaction["chat_id"], 
                            "text": "Confirmed!",
                            "reply_markup": json.dumps({ "inline_keyboard": inline_keyboard })
                        }

                        transaction["block"] = block

                        self.db.uploadDocuments(transaction)

                        self.chatqr.sendMessage(message)

            except Exception as e:
                print("on_block_message", file=sys.stderr)
                print(e, file=sys.stderr)
            

        def on_block_error(ws, error):
            print("on_block_error", file=sys.stderr)
            print(error, file=sys.stderr)
            print("Starting socket again...")
            self.wsBlocks()

        def on_block_close(ws):
            print("### on_block_close ###")
            print("Starting socket again...")
            self.wsBlocks()

        def on_block_open(ws):
            ws.send(json.dumps({"op":"blocks_sub"}))
        
        ws = websocket.WebSocketApp(self.conf["ws"],
                                  on_message = on_block_message,
                                  on_error = on_block_error,
                                  on_close = on_block_close)
        ws.on_open = on_block_open
        ws.run_forever(sslopt={"cert_reqs": ssl.CERT_NONE})

    def wsWallets(self):

        def wsWallet(wallet):
            
            def on_wallet_message(ws, transaction):

                transaction = json.loads(transaction)

                trans = {
                    "chat_id": wallet["chat_id"], 
                    "transaction": transaction,
                    "type": "transaction"
                }
                
                self.db.uploadDocuments(trans)

                inline_keyboard = [[{
                    "text": "View",
                    "url": self.conf["url_tx"] + "/" + transaction["x"]["hash"]
                }]]

                message = {
                    "chat_id": wallet["chat_id"], 
                    "text": "New transaction",
                    "reply_markup": json.dumps({ "inline_keyboard": inline_keyboard })
                }

                self.chatqr.sendMessage(message)

            def on_wallet_error(ws, error):
                print("on_wallet_error", file=sys.stderr)
                print(error, file=sys.stderr)

            def on_wallet_close(ws):
                print("### on_wallet_close ###")
                print("Starting wallet socket again!")
                self.wsWallet(wallet)

            def on_wallet_open(ws):
                print("Wallet sub:", wallet["wallet"]["address"])
                ws.send(json.dumps({"op":"addr_sub", "addr": wallet["wallet"]["address"]}))
            
            ws = websocket.WebSocketApp(self.conf["ws"],
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
                wallet_threads.append(thread_wallet)

                thread_wallet.start()
                
        for th in wallet_threads:
            th.join()

    def verifyTransactions(self):

        def verifyAll():

            while(True):
                transactions_hash = self.db.getUnconfirmedTransactions()
                for h in transactions_hash:
                    print(h)
                    try:
                        uri = self.conf["url_tx_verify"] + "/" + h
                        tr = {}
                        try:    
                            r = requests.get(uri)
                            tr = r.json()
                        except Exception as e:
                            print(" ".join(["verifyTransactions hash not found:", h]), file=sys.stderr)
                            print(e, file=sys.stderr)

                        if "block_index" in tr:
                            try:

                                block_url = self.conf["url_block"] + "/" + str(tr["block_index"]) + "?format=json"
                                r = requests.get(block_url)
                                block = r.json()
                                
                                transaction_doc = self.db.getTransaction(h)

                                if transaction_doc is not None:

                                    inline_keyboard = [[{
                                        "text": "View",
                                        "url": self.conf["url_tx"] + "/" + h
                                    }]]

                                    message = {
                                        "chat_id": transaction_doc["chat_id"], 
                                        "text": "Confirmed!",
                                        "reply_markup": json.dumps({ "inline_keyboard": inline_keyboard })
                                    }

                                    transaction_doc["block"] = block
                                    transaction_doc["block"]["tx"] = [{"hash": t["hash"]} for t in transaction_doc["block"]["tx"]]
                                    
                                    self.db.uploadDocuments(transaction_doc)

                                    self.chatqr.sendMessage(message)

                            except Exception as e:
                                print("on_block_message", file=sys.stderr)
                                print(e, file=sys.stderr)

                    except Exception as e:
                        print("verifyTransactions", file=sys.stderr)
                        print(e, file=sys.stderr)

                if("tx_verify_interval" in self.conf):
                    sleep(self.conf["tx_verify_interval"])
                else:
                    sleep(60)
                
        thread_transaction = Thread(target = verifyAll)
        thread_transaction.start()
        return thread_transaction
    
    def run(self):
        
        # thwsBlocks = Thread(target = self.wsBlocks)
        # thwsBlocks.start()
        thread_transaction = self.verifyTransactions()
        self.wsWallets()

        thread_transaction.join()

        # thwsBlocks.join()
        
        