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
	parser = argparse.ArgumentParser(description='Start the chat qr app', formatter_class=argparse.ArgumentDefaultsHelpFormatter)
	parser.add_argument('--conf', type=str, help='Configuration to run the app', default='conf.json')
	
	args = parser.parse_args()

	with open(args.conf, 'r') as jsonfile:
		conf = json.loads(jsonfile.read())

	chqrdb = chat_qr_db.ChatQrDb()
	chqrdb.setConfiguration(conf["chat_qr_db"])

	chqr = chat_qr.ChatQr()
	chqr.setDb(chqrdb)
	chqr.setConfiguration(conf["chat_qr"])

	chqrtrans = chat_qr_transaction.ChatQrTransaction()
	chqrtrans.setDb(chqrdb)
	chqrtrans.setChatQr(chqr)

	chqrtrans.start()
	chqr.start()

	chqr.join()	
	chqrtrans.join()


if __name__ == '__main__':
    main()