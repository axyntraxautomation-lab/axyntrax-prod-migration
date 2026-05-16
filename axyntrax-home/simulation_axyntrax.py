import asyncio
import aiohttp
import time
import json
import random

BASE_URL = "https://axyntrax-automation.net"
CHANNELS = ["web", "whatsapp", "facebook", "instagram", "linkedin", "mark", "tech"]
LOAD_PER_CHANNEL = 20 # Reducido para demostración rápida, escalable a 100

async def simulate_client(session, channel):
    start = time.time()
    try:
        if channel == "web":
            url = f"{BASE_URL}/api/cecilia/chat"
            payload = {"message": "Simulación de carga web", "history": []}
        elif channel in ["whatsapp", "facebook", "instagram"]:
            url = f"{BASE_URL}/api/cecilia/webhook"
            payload = {"object": "whatsapp_business_account" if channel == "whatsapp" else "page", "entry": [{"changes": [{"value": {"messages": [{"text": {"body": "Carga Meta"}, "from": "51999000001"}]}}]}]}
        elif channel == "linkedin":
            url = f"{BASE_URL}/api/cecilia/linkedin"
            payload = {"context": "Simulación LinkedIn", "leadInfo": {"name": "Test Client"}}
        else:
            url = f"{BASE_URL}/api/cecilia/status" # Módulos MARK/TECH vía Status para health check
            payload = {}

        if channel in ["mark", "tech"]:
            async with session.get(url, timeout=15) as resp:
                latency = (time.time() - start) * 1000
                status = resp.status
                result = await resp.json()
                return {"channel": channel, "status": status, "latency": latency, "tokens": 0}
        else:
            async with session.post(url, json=payload, timeout=15) as resp:
                latency = (time.time() - start) * 1000
                status = resp.status
                result = await resp.json()
                return {"channel": channel, "status": status, "latency": latency, "tokens": len(str(result)) / 4}
    except Exception as e:
        return {"channel": channel, "status": "ERROR", "error": str(e)}

async def run_simulation():
    print(f"=== INICIANDO SIMULACION DE CARGA AXYNTRAX ===")
    print(f"Target: {BASE_URL}")
    print(f"Canales: {', '.join(CHANNELS)}")
    
    async with aiohttp.ClientSession() as session:
        tasks = []
        for channel in CHANNELS:
            for _ in range(LOAD_PER_CHANNEL):
                tasks.append(simulate_client(session, channel))
        
        print(f"Enviando {len(tasks)} peticiones simultaneas...")
        results = await asyncio.gather(*tasks)
        
        # Procesar resultados
        stats = {c: {"reqs": 0, "errors": 0, "lat_sum": 0, "tokens": 0} for c in CHANNELS}
        for r in results:
            c = r["channel"]
            stats[c]["reqs"] += 1
            if r["status"] == "ERROR" or r["status"] >= 400:
                stats[c]["errors"] += 1
                print(f"[FAIL] {c.upper()}: {r.get('error', r['status'])}")
            else:
                stats[c]["lat_sum"] += r["latency"]
                stats[c]["tokens"] += r["tokens"]
                if random.random() > 0.90: # Mostrar una muestra
                    print(f"[OK] {c.upper()}: Resuelto en {r['latency']:.0f}ms")

        print("\n=== RESUMEN DE ACTIVACION ===")
        for c, s in stats.items():
            avg_lat = s["lat_sum"] / max(1, s["reqs"] - s["errors"])
            status = "ACTIVE" if s["errors"] == 0 else "DEGRADED"
            print(f"Modulo {c.upper()}: {status} | Reqs: {s['reqs']} | Latencia: {avg_lat:.0f}ms | Tokens Est: {int(s['tokens'])}")

if __name__ == "__main__":
    asyncio.run(run_simulation())
