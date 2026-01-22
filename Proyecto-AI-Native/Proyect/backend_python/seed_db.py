import os
import random
import sqlite3
from datetime import datetime, timedelta


DB_PATH = os.path.join(os.path.dirname(__file__), "farmacia.db")


def init_schema(conn: sqlite3.Connection) -> None:
    cursor = conn.cursor()

    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS pharmacies (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            address TEXT,
            phone TEXT,
            daily_digital_turn_limit INTEGER DEFAULT 100
        )
        """
    )

    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS medications (
            code TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT
        )
        """
    )

    cursor.execute(
        """
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
        """
    )

    cursor.execute(
        """
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
        """
    )

    conn.commit()


def reset_data(conn: sqlite3.Connection) -> None:
    cursor = conn.cursor()
    cursor.execute("DELETE FROM turns")
    cursor.execute("DELETE FROM inventory")
    cursor.execute("DELETE FROM medications")
    cursor.execute("DELETE FROM pharmacies")
    conn.commit()


def seed_pharmacies(conn: sqlite3.Connection) -> list[int]:
    pharmacies = [
        (1, "Farmacia Central EPS", "Calle 50 #45-67, Bogotá", "+57 1 2345678", 100),
        (2, "Farmacia IMSS Unidad 1", "Av. Principal #123, Ciudad de México", "+52 55 87654321", 150),
        (3, "Farmacia Hospital Regional", "Cra 10 #20-30, Medellín", "+57 4 5550199", 120),
        (4, "Farmacia Comunitaria Norte", "Av. Reforma #400, Guadalajara", "+52 33 33221100", 130),
        (5, "Farmacia Pública Sur", "Calle 8 #12-34, Cali", "+57 2 4411223", 110),
    ]

    cursor = conn.cursor()
    cursor.executemany(
        "INSERT INTO pharmacies (id, name, address, phone, daily_digital_turn_limit) VALUES (?, ?, ?, ?, ?)",
        pharmacies,
    )
    conn.commit()
    return [p[0] for p in pharmacies]


def seed_medications(conn: sqlite3.Connection, n: int = 220) -> list[str]:
    forms = ["tabletas", "capsulas", "jarabe", "suspension", "crema", "ampollas", "inhalador"]
    actives = [
        "Paracetamol",
        "Ibuprofeno",
        "Amoxicilina",
        "Azitromicina",
        "Loratadina",
        "Cetirizina",
        "Omeprazol",
        "Metformina",
        "Losartan",
        "Enalapril",
        "Atorvastatina",
        "Salbutamol",
        "Prednisona",
        "Diclofenaco",
        "Naproxeno",
        "Clotrimazol",
        "Aciclovir",
        "Insulina NPH",
        "Insulina Regular",
        "Sertralina",
        "Fluoxetina",
        "Aspirina",
        "Furosemida",
        "Hidroclorotiazida",
        "Levotiroxina",
        "Warfarina",
        "Clopidogrel",
        "Tramadol",
        "Ketorolaco",
        "Ciprofloxacino",
        "Doxiciclina",
        "Ranitidina",
        "Vitamina C",
        "Vitamina D",
        "Hierro",
        "Calcio",
    ]
    strengths = ["100mg", "200mg", "250mg", "300mg", "400mg", "500mg", "800mg", "10mg", "20mg", "40mg"]

    random.shuffle(actives)

    meds = []
    codes = []
    for i in range(1, n + 1):
        code = f"MED{i:04d}"
        active = actives[i % len(actives)]
        strength = strengths[i % len(strengths)]
        form = forms[i % len(forms)]
        name = f"{active} {strength} ({form})"
        description = f"Medicamento de prueba: {active} {strength} en forma {form}."
        meds.append((code, name, description))
        codes.append(code)

    cursor = conn.cursor()
    cursor.executemany("INSERT INTO medications (code, name, description) VALUES (?, ?, ?)", meds)
    conn.commit()

    return codes


def seed_inventory(conn: sqlite3.Connection, pharmacy_ids: list[int], med_codes: list[str], per_pharmacy: int = 160) -> None:
    cursor = conn.cursor()

    now = datetime.utcnow()

    for pid in pharmacy_ids:
        chosen = random.sample(med_codes, k=min(per_pharmacy, len(med_codes)))

        for code in chosen:
            roll = random.random()
            if roll < 0.10:
                current_stock = 0
            elif roll < 0.30:
                current_stock = random.randint(1, 12)
            else:
                current_stock = random.randint(20, 450)

            min_threshold = random.randint(8, 35)
            last_updated = (now - timedelta(days=random.randint(0, 20), hours=random.randint(0, 23))).strftime(
                "%Y-%m-%d %H:%M:%S"
            )

            cursor.execute(
                """
                INSERT INTO inventory (pharmacy_id, medication_code, current_stock, min_threshold, last_updated)
                VALUES (?, ?, ?, ?, ?)
                """,
                (pid, code, current_stock, min_threshold, last_updated),
            )

    conn.commit()


def seed_turns(conn: sqlite3.Connection, pharmacy_ids: list[int], per_pharmacy: int = 35) -> None:
    cursor = conn.cursor()

    first_names = [
        "Juan",
        "María",
        "Luis",
        "Ana",
        "Carlos",
        "Sofía",
        "Pedro",
        "Valentina",
        "Jorge",
        "Camila",
        "Miguel",
        "Laura",
    ]
    last_names = ["Gómez", "Rodríguez", "Pérez", "López", "Martínez", "Sánchez", "Ramírez", "Torres"]

    now = datetime.utcnow()

    for pid in pharmacy_ids:
        for turn_number in range(1, per_pharmacy + 1):
            user_name = f"{random.choice(first_names)} {random.choice(last_names)}"
            user_id = f"U-{pid}-{turn_number:03d}"
            user_document = f"DOC{random.randint(100000, 999999)}"

            status_roll = random.random()
            if status_roll < 0.65:
                status = "pending"
            elif status_roll < 0.80:
                status = "called"
            elif status_roll < 0.95:
                status = "attended"
            else:
                status = "cancelled"

            requested_at = (now - timedelta(minutes=random.randint(0, 240))).strftime("%Y-%m-%d %H:%M:%S")
            called_at = None
            attended_at = None

            if status in {"called", "attended"}:
                called_at = (now - timedelta(minutes=random.randint(0, 120))).strftime("%Y-%m-%d %H:%M:%S")
            if status == "attended":
                attended_at = (now - timedelta(minutes=random.randint(0, 60))).strftime("%Y-%m-%d %H:%M:%S")

            cursor.execute(
                """
                INSERT INTO turns (
                    pharmacy_id, user_id, user_name, user_document, turn_number, status, request_type,
                    requested_at, called_at, attended_at
                )
                VALUES (?, ?, ?, ?, ?, ?, 'digital', ?, ?, ?)
                """,
                (pid, user_id, user_name, user_document, turn_number, status, requested_at, called_at, attended_at),
            )

    conn.commit()


def seed_all(reset: bool = True) -> None:
    random.seed(20260122)

    conn = sqlite3.connect(DB_PATH)
    try:
        init_schema(conn)
        if reset:
            reset_data(conn)

        pharmacy_ids = seed_pharmacies(conn)
        med_codes = seed_medications(conn, n=220)
        seed_inventory(conn, pharmacy_ids, med_codes, per_pharmacy=160)
        seed_turns(conn, pharmacy_ids, per_pharmacy=35)
    finally:
        conn.close()


if __name__ == "__main__":
    seed_all(reset=True)
    print(f"Seed completado. DB: {DB_PATH}")
