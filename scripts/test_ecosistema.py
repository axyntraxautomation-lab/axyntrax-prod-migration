"""
AXYNTRAX INTEGRATION TEST SUITE (test_ecosistema.py)
Valida la integridad de la base de datos, el correcto arranque de los endpoints
de la API Unificada y la resiliencia del Webhook de Cecilia.
"""
import unittest
import sqlite3
import os
import sys

# Asegurar que el path raíz está configurado para las importaciones
ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, ROOT_DIR)

from db_master.connection import get_db
from db_master.models import get_kpi_summary, init_db
from axia_api_unificada import app as api_app
from axia_webhook_v2 import app as webhook_app

class TestEcosistemaIntegration(unittest.TestCase):
    
    def setUp(self):
        # Asegurar integridad de base de datos antes de las pruebas
        init_db()
        self.api_client = api_app.test_client()
        self.webhook_client = webhook_app.test_client()

    def test_database_connection(self):
        """Verifica que la conexión robusta con SQLite funcione y responda SELECT 1."""
        try:
            conn = get_db()
            cursor = conn.cursor()
            cursor.execute("SELECT 1;")
            res = cursor.fetchone()
            self.assertEqual(res[0], 1)
            conn.close()
        except Exception as e:
            self.fail(f"La conexión a la base de datos SQLite falló: {e}")

    def test_kpi_summary_retrieval(self):
        """Verifica que el resumen de KPIs funcione de forma segura."""
        summary = get_kpi_summary()
        self.assertIsInstance(summary, dict)
        self.assertIn("ingresos", summary)
        self.assertIn("pendientes", summary)
        self.assertIn("prospectos", summary)
        self.assertIn("licencias", summary)

    def test_api_health_endpoint(self):
        """Prueba el endpoint de salud /api/health usando el Flask test client."""
        response = self.api_client.get('/api/health')
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertEqual(data["status"], "operational")
        self.assertIn("whatsapp", data)
        self.assertIn("gemini_present", data)

    def test_api_jarvis_resumen_endpoint(self):
        """Prueba el endpoint de resumen del orquestador JARVIS."""
        response = self.api_client.get('/api/jarvis/resumen')
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertEqual(data["status"], "online")
        self.assertEqual(data["orquestador"], "JARVIS v3.2")
        self.assertIn("agentes_activos", data)

    def test_webhook_get_verify_token(self):
        """Prueba la verificación del webhook de Meta (GET /webhook)."""
        response = self.webhook_client.get('/webhook?hub.mode=subscribe&hub.verify_token=axyntrax_diamante_2026&hub.challenge=test_challenge')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_data(as_text=True), "test_challenge")

if __name__ == "__main__":
    unittest.main()
