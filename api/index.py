import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import psycopg2
from psycopg2.extras import RealDictCursor
import requests

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

DATABASE_URL = os.environ.get('POSTGRES_URL')

def get_db_connection():
    return psycopg2.connect(DATABASE_URL, sslmode='require')

@app.get("/api/health")
def health_check():
    return {"status": "online"}

@app.get("/api/stocks/{tickers}")
def get_stock_data(tickers: str):
    # Proteção: não pesquisa tickers vazios ou curtos demais
    if not tickers or len(tickers) < 2:
        return {"results": []}

    url = f"https://brapi.dev/api/quote/{tickers}"
    params = {"range": "1d", "interval": "1m"} 
    
    try:
        response = requests.get(url, params=params, timeout=10)
        # Se a Brapi retornar erro (ex: muitas requisições), devolvemos uma lista vazia em vez de dar erro 500
        if response.status_code != 200:
            return {"results": [], "status": "api_limit"}
        return response.json()
    except Exception:
        return {"results": []}

@app.get("/api/favoritos")
def list_favoritos():
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("SELECT * FROM favoritos ORDER BY ticker ASC")
        rows = cur.fetchall()
        cur.close()
        conn.close()
        return rows
    except Exception as e:
        return {"error": str(e)}

@app.post("/api/favoritos")
def add_favorito(payload: dict):
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO favoritos (ticker, nome) VALUES (%s, %s) ON CONFLICT DO NOTHING",
            (payload['ticker'], payload['nome'])
        )
        conn.commit()
        cur.close()
        conn.close()
        return {"message": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))