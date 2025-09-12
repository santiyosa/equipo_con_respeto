#!/usr/bin/env python3
"""
Versión simplificada del servidor FastAPI
Solo para pruebas básicas
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

app = FastAPI(
    title="Equipo Fútbol API - Simple",
    description="API simplificada para gestión del equipo de fútbol",
    version="1.0.0",
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "API Simple del Equipo de Fútbol funcionando!"}

@app.get("/health")
async def health_check():
    return {"status": "OK", "version": "simple"}

if __name__ == "__main__":
    uvicorn.run(
        "main_simple:app",
        host="0.0.0.0",
        port=8006,  # Puerto diferente para no conflicto
        reload=True
    )
