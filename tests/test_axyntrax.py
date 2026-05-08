import pytest
import sqlite3
from db_master.connection import get_db
from db_master.models import get_kpi_summary
from axia_api import app

def test_database_connection():
    """Verifica que la conexion robusta con SQLite funcione y responda SELECT 1."""
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT 1;")
        res = cursor.fetchone()
        assert res[0] == 1
        conn.close()
    except Exception as e:
        pytest.fail(f"La conexion a la base de datos fallo: {e}")

def test_kpi_summary_retrieval():
    """Verifica que el resumen de KPIs funcione de forma segura."""
    summary = get_kpi_summary()
    assert isinstance(summary, dict)
    assert "ingresos" in summary
    assert "pendientes" in summary
    assert "prospectos" in summary
    assert "licencias" in summary

def test_api_health_endpoint():
    """Prueba el endpoint de salud /api/health usando el Flask test client."""
    with app.test_client() as client:
        response = client.get('/api/health')
        assert response.status_code == 200
        data = response.get_json()
        assert data["status"] == "operational"
        assert "gemini" in data
        assert "whatsapp" in data
