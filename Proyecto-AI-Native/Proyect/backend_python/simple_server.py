from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import json
from datetime import datetime
import uuid

app = FastAPI(title="FarmaciaConnect API", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Modelos de datos
class Medication(BaseModel):
    code: str
    name: str
    current_stock: int
    min_threshold: int
    status: str
    demand_score: float
    last_updated: str

# Datos de ejemplo
SAMPLE_MEDICATIONS = [
    {
        "code": "MED001",
        "name": "Paracetamol 500mg",
        "current_stock": 150,
        "min_threshold": 50,
        "status": "available",
        "demand_score": 8.5,
        "last_updated": datetime.now().isoformat()
    },
    {
        "code": "MED002",
        "name": "Ibuprofeno 400mg",
        "current_stock": 25,
        "min_threshold": 30,
        "status": "low_stock",
        "demand_score": 9.2,
        "last_updated": datetime.now().isoformat()
    },
    {
        "code": "MED003",
        "name": "Amoxicilina 500mg",
        "current_stock": 0,
        "min_threshold": 20,
        "status": "out_of_stock",
        "demand_score": 7.8,
        "last_updated": datetime.now().isoformat()
    },
    {
        "code": "MED004",
        "name": "Omeprazol 20mg",
        "current_stock": 80,
        "min_threshold": 40,
        "status": "available",
        "demand_score": 6.5,
        "last_updated": datetime.now().isoformat()
    },
    {
        "code": "MED005",
        "name": "Loratadina 10mg",
        "current_stock": 200,
        "min_threshold": 60,
        "status": "available",
        "demand_score": 5.2,
        "last_updated": datetime.now().isoformat()
    }
]

@app.get("/")
async def root():
    return {"message": "FarmaciaConnect API is running"}

@app.get("/api/pharmacy/{pharmacy_id}/inventory")
async def get_inventory(pharmacy_id: int):
    """Obtener el inventario de una farmacia"""
    try:
        # Simulamos diferentes datos para diferentes farmacias
        if pharmacy_id == 1:
            medications = SAMPLE_MEDICATIONS
        elif pharmacy_id == 2:
            medications = SAMPLE_MEDICATIONS[:3]  # Menos medicamentos
        else:
            medications = SAMPLE_MEDICATIONS[2:]  # Diferente combinación
        
        return {
            "pharmacy_id": pharmacy_id,
            "medications": medications,
            "total_count": len(medications),
            "last_updated": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/pharmacy/{pharmacy_id}/turns")
async def get_turns(pharmacy_id: int):
    """Obtener los turnos de una farmacia"""
    try:
        # Datos de ejemplo para turnos
        sample_turns = [
            {
                "id": 1,
                "turn_number": "A001",
                "user_name": "Juan Pérez",
                "user_document": "12345678",
                "status": "pending",
                "request_type": "digital",
                "requested_at": datetime.now().isoformat(),
                "estimated_wait_time": 15
            },
            {
                "id": 2,
                "turn_number": "A002",
                "user_name": "María García",
                "user_document": "87654321",
                "status": "called",
                "request_type": "digital",
                "requested_at": datetime.now().isoformat(),
                "called_at": datetime.now().isoformat()
            }
        ]
        
        return {
            "pharmacy_id": pharmacy_id,
            "turns": sample_turns,
            "total_count": len(sample_turns),
            "last_updated": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/turns/request")
async def request_turn(turn_data: dict):
    """Solicitar un nuevo turno"""
    try:
        new_turn = {
            "id": uuid.uuid4().int,
            "turn_number": f"A{uuid.uuid4().int % 1000:03d}",
            "user_name": turn_data.get("user_name"),
            "user_document": turn_data.get("user_document"),
            "status": "pending",
            "request_type": "digital",
            "requested_at": datetime.now().isoformat(),
            "estimated_wait_time": 20,
            "pharmacy_id": turn_data.get("pharmacy_id")
        }
        
        return {
            "success": True,
            "turn": new_turn,
            "message": "Turno solicitado exitosamente"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/pharmacy/{pharmacy_id}/wait-time")
async def get_wait_time(pharmacy_id: int):
    """Obtener tiempo de espera estimado"""
    try:
        return {
            "pharmacy_id": pharmacy_id,
            "estimated_minutes": 15,
            "people_waiting": 5,
            "last_updated": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
