import os,sys
import json
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../couch_provider')))
import couch_provider
from urllib.parse import urlencode

class ChatQrDb(couch_provider.CouchProvider):
    def __init__(self):
        pass

    def getWallet(self, chat_id):
        v = '_design/business/_view/getWallets';
        if chat_id:
            key = {
                "key": chat_id
            }
            v += '?' + urlencode(key)
        return [w["value"] for w in self.getView(v)][0]

    def getWallets(self):
        v = '_design/business/_view/getWallets?include_docs=true';
        return [w["doc"] for w in self.getView(v)]

    def getTransactions(self, chat_id):
        v = '_design/business/_view/getTransactions';
        if chat_id:
            key = {
                "key": chat_id
            }
            v += '?' + urlencode(key)
            transactions = [w["value"] for w in self.getView(v)]
            if len(transactions) > 0:
                return transactions[0]
            return None
        return [w["value"] for w in self.getView(v)]

    def getChatId(self, transaction_hash):
        v = '_design/transactions/_view/getChatId';
        
        if transaction_hash:
            key = {
                "key": transaction_hash,
                "include_docs": True
            }
            v += '?' + urlencode(key)
            return [w["doc"] for w in self.getView(v)][0]
        return [w["value"] for w in self.getView(v)]