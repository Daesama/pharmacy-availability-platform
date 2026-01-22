from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import sqlite3
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

class TurnRequest(BaseModel):
    pharmacy_id: int
    user_id: str
    user_name: str
    user_document: str

class Turn(BaseModel):
    id: int
    turn_number: int
    user_name: str
    status: str
    requested_at: str
    called_at: Optional[str] = None
    attended_at: Optional[str] = None
    request_type: str

# Base de datos SQLite
def init_db():
    conn = sqlite3.connect('farmacia.db')
    cursor = conn.cursor()
    
    # Crear tablas si no existen
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS pharmacies (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            address TEXT,
            phone TEXT,
            daily_digital_turn_limit INTEGER DEFAULT 100
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS medications (
            code TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS inventory (
            id INTEGER PRIMARY KEY,
            pharmacy_id INTEGER,
            medication_code TEXT,
            current_stock INTEGER DEFAULT 0,
            min_threshold INTEGER DEFAULT 10,
            last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (pharmacy_id) REFERENCES pharmacies(id),
            FOREIGN KEY (medication_code) REFERENCES medications(code),
            UNIQUE(pharmacy_id, medication_code)
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS turns (
            id INTEGER PRIMARY KEY,
            pharmacy_id INTEGER,
            user_id TEXT,
            user_name TEXT NOT NULL,
            user_document TEXT NOT NULL,
            turn_number INTEGER NOT NULL,
            status TEXT DEFAULT 'pending',
            request_type TEXT DEFAULT 'digital',
            requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            called_at TIMESTAMP NULL,
            attended_at TIMESTAMP NULL
        )
    ''')
    
    # Insertar datos de ejemplo
    cursor.execute("SELECT COUNT(*) FROM pharmacies")
    if cursor.fetchone()[0] == 0:
        cursor.execute('''
            INSERT INTO pharmacies (id, name, address, phone, daily_digital_turn_limit)
            VALUES 
            (1, 'Farmacia Central EPS', 'Calle 50 #45-67, Bogotá', '+57 1 2345678', 100),
            (2, 'Farmacia IMSS Unidad 1', 'Av. Principal #123, Ciudad de México', '+52 55 87654321', 150)
        ''')
        
        cursor.execute('''
            INSERT INTO medications (code, name, description)
            VALUES 
            ('MED001', 'Ibuprofeno 400mg', 'Analgésico y antiinflamatorio'),
            ('MED002', 'Paracetamol 500mg', 'Analgésico y antipirético'),
            ('MED003', 'Amoxicilina 500mg', 'Antibiótico de amplio espectro')
        ''')
        
        cursor.execute('''
            INSERT INTO inventory (pharmacy_id, medication_code, current_stock, min_threshold)
            VALUES 
            (1, 'MED001', 150, 20),
            (1, 'MED002', 200, 30),
            (1, 'MED003', 80, 15),
            (2, 'MED001', 200, 25),
            (2, 'MED002', 180, 28)
        ''')
    
    conn.commit()
    conn.close()

# Inicializar base de datos al iniciar
init_db()

# API Endpoints

@app.get("/")
async def root():
    return {"message": "FarmaciaConnect API funcionando"}

@app.get("/api/pharmacy/{pharmacy_id}/inventory", response_model=List[Medication])
async def get_inventory(pharmacy_id: int):
    conn = sqlite3.connect('farmacia.db')
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT 
            m.code,
            m.name,
            i.current_stock,
            i.min_threshold,
            CASE 
                WHEN i.current_stock = 0 THEN 'out_of_stock'
                WHEN i.current_stock <= i.min_threshold THEN 'low_stock'
                ELSE 'available'
            END as status,
            0.0 as demand_score,
            i.last_updated
        FROM inventory i
        JOIN medications m ON i.medication_code = m.code
        WHERE i.pharmacy_id = ?
        ORDER BY m.name
    ''', (pharmacy_id,))
    
    results = cursor.fetchall()
    conn.close()
    
    medications = []
    for row in results:
        medications.append(Medication(
            code=row[0],
            name=row[1],
            current_stock=row[2],
            min_threshold=row[3],
            status=row[4],
            demand_score=row[5],
            last_updated=row[6]
        ))
    
    return medications

@app.post("/api/inventory/update")
async def update_inventory(pharmacy_id: int, medication_code: str, quantity_dispensed: int):
    conn = sqlite3.connect('farmacia.db')
    cursor = conn.cursor()
    
    # Actualizar inventario
    cursor.execute('''
        UPDATE inventory 
        SET current_stock = current_stock - ?,
            last_updated = CURRENT_TIMESTAMP
        WHERE pharmacy_id = ? AND medication_code = ? AND current_stock >= ?
    ''', (quantity_dispensed, pharmacy_id, medication_code, quantity_dispensed))
    
    if cursor.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=400, detail="No hay suficiente stock o medicamento no encontrado")
    
    conn.commit()
    conn.close()
    
    return {"success": True, "message": "Inventario actualizado"}

@app.post("/api/turns/request")
async def request_turn(request: TurnRequest):
    conn = sqlite3.connect('farmacia.db')
    cursor = conn.cursor()
    
    # Verificar límite diario de turnos digitales
    cursor.execute('''
        SELECT COUNT(*) as count
        FROM turns 
        WHERE pharmacy_id = ? 
        AND request_type = 'digital' 
        AND DATE(requested_at) = DATE('now')
    ''', (request.pharmacy_id,))
    
    digital_count = cursor.fetchone()[0]
    
    cursor.execute('''
        SELECT daily_digital_turn_limit FROM pharmacies WHERE id = ?
    ''', (request.pharmacy_id,))
    
    limit_result = cursor.fetchone()
    if not limit_result:
        conn.close()
        raise HTTPException(status_code=404, detail="Farmacia no encontrada")
    
    daily_limit = limit_result[0]
    
    if digital_count >= daily_limit:
        conn.close()
        raise HTTPException(status_code=400, detail="Límite diario de turnos digitales alcanzado")
    
    # Generar número de turno
    cursor.execute('''
        SELECT MAX(turn_number) as last_number 
        FROM turns 
        WHERE pharmacy_id = ? AND DATE(requested_at) = DATE('now')
    ''', (request.pharmacy_id,))
    
    last_turn = cursor.fetchone()
    turn_number = (last_turn[0] or 0) + 1
    
    # Crear turno
    cursor.execute('''
        INSERT INTO turns (pharmacy_id, user_id, user_name, user_document, turn_number, request_type)
        VALUES (?, ?, ?, ?, ?, 'digital')
    ''', (request.pharmacy_id, request.user_id, request.user_name, request.user_document, turn_number))
    
    turn_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    return {
        "success": True,
        "turn_id": turn_id,
        "turn_number": turn_number
    }

@app.get("/api/pharmacy/{pharmacy_id}/turns", response_model=List[Turn])
async def get_turns(pharmacy_id: int):
    conn = sqlite3.connect('farmacia.db')
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT 
            id,
            turn_number,
            user_name,
            status,
            requested_at,
            called_at,
            attended_at,
            request_type
        FROM turns 
        WHERE pharmacy_id = ? AND DATE(requested_at) = DATE('now')
        ORDER BY 
            CASE WHEN status = 'pending' THEN turn_number END ASC,
            CASE WHEN status IN ('called', 'attended', 'cancelled') THEN called_at END DESC
    ''', (pharmacy_id,))
    
    results = cursor.fetchall()
    conn.close()
    
    turns = []
    for row in results:
        turns.append(Turn(
            id=row[0],
            turn_number=row[1],
            user_name=row[2],
            status=row[3],
            requested_at=row[4],
            called_at=row[5],
            attended_at=row[6],
            request_type=row[7]
        ))
    
    return turns

@app.put("/api/turns/{turn_id}/status")
async def update_turn_status(turn_id: int, status: str):
    if status not in ['pending', 'called', 'attended', 'cancelled']:
        raise HTTPException(status_code=400, detail="Estado no válido")
    
    conn = sqlite3.connect('farmacia.db')
    cursor = conn.cursor()
    
    update_fields = [status]
    update_sql = "UPDATE turns SET status = ?"
    
    if status == 'called':
        update_sql += ", called_at = CURRENT_TIMESTAMP"
    elif status == 'attended':
        update_sql += ", attended_at = CURRENT_TIMESTAMP"
    
    update_sql += " WHERE id = ?"
    update_fields.append(turn_id)
    
    cursor.execute(update_sql, update_fields)
    
    if cursor.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="Turno no encontrado")
    
    conn.commit()
    conn.close()
    
    return {"success": True}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
