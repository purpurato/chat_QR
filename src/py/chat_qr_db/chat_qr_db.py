import os,sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../couch_provider')))
import couch_provider

class ChatQrDb(couch_provider.CouchProvider):
    def __init__(self):
        pass

    def getWallet(self, chat_id):
        v = '_design/business/_view/getWallets';
        if chat_id:
            key = {
                "key": chat_id
            }
            v += '?' + self.getUrlParams(key)
            chat_ids = [w["value"] for w in self.getView(v)]
            if(len(chat_ids) > 0):
                return chat_ids[0]
            return None
        return [w["value"] for w in self.getView(v)]

    def getWallets(self):
        v = '_design/business/_view/getWallets?include_docs=true';
        return [w["doc"] for w in self.getView(v)]

    def getTransactions(self, chat_id):
        v = '_design/business/_view/getTransactions';
        if chat_id:
            key = {
                "key": chat_id
            }
            v += '?' + self.getUrlParams(key)
        return [w["value"] for w in self.getView(v)]

    def getUnconfirmedTransactions(self, chat_id = None):
        v = '_design/business/_view/getUnconfirmedTransactions';
        if chat_id:
            key = {
                "key": chat_id
            }
            v += '?' + self.getUrlParams(key)
        return [w["value"] for w in self.getView(v)]

    def getTransaction(self, transaction_hash):
        if transaction_hash:
            v = '_design/transactions/_view/getChatId';
            key = {
                "key": transaction_hash,
                "include_docs": True
            }
            v += '?' + self.getUrlParams(key)
            transactions = [w["doc"] for w in self.getView(v)]

            if len(transactions) > 0:
                return transactions[0]
        return None

    def getChatId(self, transaction_hash):
        v = '_design/transactions/_view/getChatId';
        
        if transaction_hash:
            key = {
                "key": transaction_hash
            }
            v += '?' + self.getUrlParams(key)
            chat_ids = [w["value"] for w in self.getView(v)]
            if len(chat_ids) > 0:
                return chat_ids[0]
            return None
        return [w["value"] for w in self.getView(v)]
    