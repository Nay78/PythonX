
import time
import requests

req1 = "http://192.168.1.200:2999/create_label?file=CARNE_MECHADA.odt"
req1 = "http://192.168.1.200:2999/print_label?qty=1"

for _ in range(109):
    t = time.time()
    r1 = requests.get(req1)
    print(time.time() - t)
    time.sleep(.5)
