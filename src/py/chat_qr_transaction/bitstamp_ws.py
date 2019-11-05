import websocket
try:
    import thread
except ImportError:
    import _thread as thread
import time
import ssl
from urllib.parse import urlencode
import json
import sys

def on_bitstamp_message(ws, message):

    try:
       print(message)
    except Exception as e:
        print("on_bitstamp_message", file=sys.stderr)
        print(e, file=sys.stderr)
    

def on_bitstamp_error(ws, error):
    print("on_bitstamp_error", file=sys.stderr)
    print(error, file=sys.stderr)

def on_bitstamp_close(ws):
    print("### on_bitstamp_close ###")

def on_bitstamp_open(ws):
    subscribe = {
        "event": "bts:subscribe",
        "data": {
            "channel": "live_trades_btcusd"
        }
    }
    ws.send(json.dumps(subscribe))

ws = websocket.WebSocketApp('wss://ws.bitstamp.net',
    on_open = on_bitstamp_open,
    on_message = on_bitstamp_message,
    on_error = on_bitstamp_error,
    on_close = on_bitstamp_close)

# ws.on_open = on_block_open
ws.run_forever(sslopt={"cert_reqs": ssl.CERT_NONE})