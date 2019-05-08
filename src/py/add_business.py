import argparse
import logging
import os
import sys
import threading
import json

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), 'chat_qr')))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), 'chat_qr_db')))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), 'chat_qr_transaction')))

import chat_qr
import chat_qr_db
import chat_qr_transaction


def main():
	parser = argparse.ArgumentParser(description='Add test data to chat qr app', formatter_class=argparse.ArgumentDefaultsHelpFormatter)
	parser.add_argument('--conf', type=str, help='Configuration to run the app', default='conf.my.test.json')
	parser.add_argument('--data', type=str, help='Test data', default='test_data.json')
	
	args = parser.parse_args()

	with open(args.data, 'r') as jsonfile:
		business_data = json.loads(jsonfile.read())

	with open(args.conf, 'r') as jsonfile:
		conf = json.loads(jsonfile.read())

	chqrdb = chat_qr_db.ChatQrDb()
	chqrdb.setConfiguration(conf["chat_qr_db"])

	print("test chat_id does not exists")
	w = chqrdb.getWallet(12344)
	print(w)

	print("get all wallets")
	w = chqrdb.getWallets()
	print(w)

	for business in business_data:
		w = chqrdb.getWallet(business["chat_id"])
		if(w is None):
			chqrdb.uploadDocuments(business)

	print("get all wallets")
	w = chqrdb.getWallets()
	print(w)

if __name__ == '__main__':
    main()