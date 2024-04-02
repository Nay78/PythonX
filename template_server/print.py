
import time
import requests

req1 = "http://192.168.1.200:2999/create_label?file=CARNE_MECHADA.odt"
req1 =       "http://192.168.1.200:2999/print_label?qty=1"
status_url = "http://192.168.1.200:2999/status"

def chkprint(timeout=7):
    t = time.time()
    was_printing = False
    while True:
        r = requests.get(status_url)
        print(r.text)
        if r.text == "READY" and was_printing:
            return "READY"
        if r.text == "PRINTING":
            print("PRINTING")
            was_printing = True
        if time.time() - t > timeout:
            if was_printing:
                raise Exception(f"DID NOT FINISH PRINTING: {r.text}")
            else:
                # raise Exception()
                print(f"COULD NOT CHECK PRINTING: {r.text}")

        if was_printing:
            time.sleep(1)
        else:
            time.sleep(.5)
    

for _ in range(118):
    t = time.time()
    r1 = requests.get(req1)
    chk = chkprint()
    if chk:
        print("Printed in", time.time() - t)
    else:
        raise Exception("Printer not ready or did not print")
