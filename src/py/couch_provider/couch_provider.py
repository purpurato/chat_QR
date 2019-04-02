
import requests
import sys
import json
from urllib.parse import urlencode


class CouchProvider():
	def __init__(self):
		self.conf = {}

	def setConfiguration(self, conf):
		self.conf = conf

	def createDB(self):
		url = self.getCouchDBServer()
		r = request.put(url)
		resp = r.json()

		print(resp)


	def getConfiguration(self):
	 	return self.conf
		
	def getCouchDBServer(self):
	 	url = self.conf["hostname"] + "/" + self.conf["database"]
	 	return url

	def uploadDocuments(self, docs):

	 	alldocs = {}

	 	try:
	 		if isinstance(docs, list):
	 			alldocs["docs"] = docs
	 		elif isinstance(docs, dict):
	 			alldocs["docs"] = [docs]

	 		uri =  self.getCouchDBServer() + "/_bulk_docs"
	 		r = requests.post(uri, json=alldocs)

	 		resp = r.json()
	 	except Exception as e:
	 		print("uploadDocuments", file=sys.stderr)
	 		print(e, file=sys.stderr)


	def getDocument(self, id):
		try:
			uri = self.getCouchDBServer() + "/" + id
				
			r = request.get(uri)

			return r.json()

		except Exception as e:
			print("getDocument", file=sys.stderr)
			print(e, file=sys.stderr)

	def deleteDocument(self, doc):
		try:
			uri = self.getCouchDBServer() + "/" + doc["_id"] + "?rev=" + doc["_rev"]
			r = requests.delete(uri)
			resp = r.json()
			return resp
		except Exception as e:
			print("deleteDocument", file=sys.stderr)
			print(e, file=sys.stderr)

	def getView(self, view):
		try:
			uri = self.getCouchDBServer() + "/" + view
			r = requests.get(uri)
			return r.json()["rows"]
		except Exception as e:
			print("getView", file=sys.stderr)
			print(e, file=sys.stderr)

	def getUrlParams(self, params):
		return urlencode({p: json.dumps(params[p]) for p in params})