import time
from pyngrok import ngrok

# Set pyngrok logger to see internal logs
import logging
logging.basicConfig(level=logging.INFO)

try:
    # Open a HTTP tunnel on the specified port
    public_url = ngrok.connect(5000).public_url
    print(f"\n\n*** SUCCESS! YOUR PUBLIC NGROK URL IS: {public_url} ***\n\n")
    
    # Keep it open
    while True:
        time.sleep(10)
except KeyboardInterrupt:
    print("Closing tunnel")
    ngrok.kill()
