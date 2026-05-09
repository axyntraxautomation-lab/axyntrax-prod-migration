import requests
import threading
import time
import random

URL = "http://localhost:5000/api/cecilia/test"
NUM_REQUESTS = 15
CONCURRENT_THREADS = 5

def send_request(req_id):
    prompts = [
        "¿Qué precio tiene el plan diamante?",
        "Hola Cecilia, ¿cómo estás?",
        "Quiero una demo de Axyntrax",
        "Dime los beneficios del bot de ventas",
        "¿Tienen soporte 24/7?"
    ]
    prompt = random.choice(prompts)
    start_time = time.time()
    try:
        r = requests.post(URL, json={"text": prompt}, timeout=10)
        latency = (time.time() - start_time) * 1000
        status = "OK" if r.status_code == 200 else "FAIL"
        print(f"Request {req_id:2d}: {status} | Latencia: {latency:4.0f}ms | Reply: {r.json().get('reply','')[:40]}...")
    except Exception as e:
        print(f"Request {req_id:2d}: FAIL | Error: {e}")

def run_stress_test():
    print(f"Iniciando Prueba de Estres: {NUM_REQUESTS} peticiones...")
    threads = []
    for i in range(NUM_REQUESTS):
        t = threading.Thread(target=send_request, args=(i+1,))
        threads.append(t)
        t.start()
        
        if len(threads) >= CONCURRENT_THREADS:
            for t in threads: t.join()
            threads = []
            
    for t in threads: t.join()
    print("\nPrueba de Estres Finalizada.")

if __name__ == "__main__":
    run_stress_test()
