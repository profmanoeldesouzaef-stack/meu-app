from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os, logging, uuid
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")


# ============ Models ============
class Plan(BaseModel):
    id: str
    slug: str  # reset12 | shape | forge
    name: str
    tag: Optional[str] = None
    description: str
    accent: str
    prices_brl: Dict[str, float]  # month/quarter/year
    prices_usd: Dict[str, float]
    perks: List[str]

class Exercise(BaseModel):
    id: str
    name: str
    sets: int
    reps: str
    rest: str
    muscle: str
    image: Optional[str] = None

class Workout(BaseModel):
    id: str
    day_label: str
    title: str
    focus: str
    duration_min: int
    intensity: str
    hero_image: str
    exercises: List[Exercise]

class Food(BaseModel):
    id: str
    name: str
    grams: int
    kcal: int
    p: int
    c: int
    f: int
    meal: str

class DietPlan(BaseModel):
    id: str
    kcal: int
    protein_pct: int
    carbs_pct: int
    fats_pct: int
    foods: List[Food]

class ProgressEntry(BaseModel):
    id: str
    date: str
    weight_kg: float
    waist_cm: Optional[float] = None
    arms_cm: Optional[float] = None
    note: Optional[str] = None

class Challenge(BaseModel):
    id: str
    author: str
    title: str
    weeks: int
    before_image: str
    after_image: str
    likes: int
    tag: str

class ChatMessage(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    author: str
    persona: str
    text: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ChatMessageIn(BaseModel):
    author: str
    persona: str
    text: str

class CouponCheck(BaseModel):
    code: str
    subtotal: float

class KPI(BaseModel):
    label_pt: str
    label_en: str
    value: str
    delta: str

class RadarAlert(BaseModel):
    id: str
    student: str
    status: str
    days: int
    severity: str  # info | warn | crit


# ============ Seed helpers ============
PLANS_SEED = [
    {
        "id": "reset12", "slug": "reset12",
        "name": "Projeto Reset 12",
        "tag": "Mais solicitado",
        "description": "12 semanas de recomposição total com acompanhamento premium.",
        "accent": "#D8B46A",
        "prices_brl": {"month": 297.0, "quarter": 797.0, "year": 2497.0},
        "prices_usd": {"month": 59.0, "quarter": 159.0, "year": 499.0},
        "perks": ["Treinos e dieta 100% personalizados", "Form Checker IA ilimitado", "Suporte 1:1 no chat", "Radar semanal do coach"],
    },
    {
        "id": "shape", "slug": "shape",
        "name": "Shape",
        "tag": None,
        "description": "Definição, estética e mobilidade — protocolo Shape.",
        "accent": "#D96E92",
        "prices_brl": {"month": 147.0, "quarter": 397.0, "year": 1197.0},
        "prices_usd": {"month": 29.0, "quarter": 79.0, "year": 239.0},
        "perks": ["Treino em periodização Shape", "Dieta com macro-calculadora", "Galeria de evolução"],
    },
    {
        "id": "forge", "slug": "forge",
        "name": "Forge",
        "tag": None,
        "description": "Hipertrofia e força bruta — protocolo Forge.",
        "accent": "#6D9BFF",
        "prices_brl": {"month": 167.0, "quarter": 447.0, "year": 1347.0},
        "prices_usd": {"month": 33.0, "quarter": 89.0, "year": 269.0},
        "perks": ["Foco em progressive overload", "Intensificadores e Assistente IA", "Suporte prioritário"],
    },
]

WORKOUT_SEED = {
    "id": "wk-today",
    "day_label": "Dia 3 · Push",
    "title": "Peito, Ombro & Tríceps",
    "focus": "Push · Força",
    "duration_min": 58,
    "intensity": "Alta",
    "hero_image": "https://images.pexels.com/photos/29667299/pexels-photo-29667299.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    "exercises": [
        {"id": "e1", "name": "Supino reto barra", "sets": 4, "reps": "8-10", "rest": "90s", "muscle": "Peito"},
        {"id": "e2", "name": "Supino inclinado halter", "sets": 3, "reps": "10-12", "rest": "75s", "muscle": "Peito"},
        {"id": "e3", "name": "Desenvolvimento militar", "sets": 4, "reps": "8", "rest": "90s", "muscle": "Ombro"},
        {"id": "e4", "name": "Elevação lateral", "sets": 4, "reps": "12", "rest": "45s", "muscle": "Ombro"},
        {"id": "e5", "name": "Tríceps corda", "sets": 3, "reps": "12-15", "rest": "45s", "muscle": "Tríceps"},
        {"id": "e6", "name": "Tríceps francês", "sets": 3, "reps": "10", "rest": "60s", "muscle": "Tríceps"},
    ],
}

DIET_SEED = {
    "id": "diet-default",
    "kcal": 2450,
    "protein_pct": 35,
    "carbs_pct": 40,
    "fats_pct": 25,
    "foods": [
        {"id": "f1", "name": "Omelete com aveia", "grams": 250, "kcal": 480, "p": 35, "c": 42, "f": 18, "meal": "breakfast"},
        {"id": "f2", "name": "Frango grelhado com arroz", "grams": 350, "kcal": 620, "p": 55, "c": 65, "f": 12, "meal": "lunch"},
        {"id": "f3", "name": "Whey isolado + banana", "grams": 300, "kcal": 320, "p": 30, "c": 40, "f": 4, "meal": "snack"},
        {"id": "f4", "name": "Salmão com batata doce", "grams": 320, "kcal": 580, "p": 42, "c": 48, "f": 22, "meal": "dinner"},
        {"id": "f5", "name": "Iogurte grego + castanhas", "grams": 200, "kcal": 340, "p": 22, "c": 18, "f": 20, "meal": "supper"},
    ],
}

PROGRESS_SEED = [
    {"id": "p1", "date": "2026-03-01", "weight_kg": 84.2, "waist_cm": 88, "arms_cm": 38, "note": "Início do ciclo"},
    {"id": "p2", "date": "2026-03-15", "weight_kg": 83.4, "waist_cm": 87, "arms_cm": 38.5, "note": None},
    {"id": "p3", "date": "2026-04-01", "weight_kg": 82.6, "waist_cm": 86, "arms_cm": 39, "note": "Deficit ajustado"},
    {"id": "p4", "date": "2026-04-15", "weight_kg": 81.8, "waist_cm": 85, "arms_cm": 39.2, "note": None},
    {"id": "p5", "date": "2026-05-01", "weight_kg": 81.1, "waist_cm": 84, "arms_cm": 39.5, "note": "Foco em push"},
]

CHALLENGES_SEED = [
    {"id": "c1", "author": "Rafael M.", "title": "12 semanas em Reset", "weeks": 12,
     "before_image": "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=600&q=80",
     "after_image": "https://images.unsplash.com/photo-1550345332-09e3ac987658?auto=format&fit=crop&w=600&q=80",
     "likes": 214, "tag": "reset12"},
    {"id": "c2", "author": "Camila S.", "title": "Shape · Verão 2026", "weeks": 16,
     "before_image": "https://images.unsplash.com/photo-1594381898411-846e7d193883?auto=format&fit=crop&w=600&q=80",
     "after_image": "https://images.unsplash.com/photo-1594381898411-846e7d193883?auto=format&fit=crop&w=600&q=80",
     "likes": 187, "tag": "shape"},
    {"id": "c3", "author": "Diego P.", "title": "Forge Bulk", "weeks": 20,
     "before_image": "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=600&q=80",
     "after_image": "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=600&q=80",
     "likes": 302, "tag": "forge"},
    {"id": "c4", "author": "Laura V.", "title": "Recomposição 6M", "weeks": 24,
     "before_image": "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=600&q=80",
     "after_image": "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=600&q=80",
     "likes": 156, "tag": "reset12"},
]

CHAT_SEED = [
    {"id": str(uuid.uuid4()), "author": "Mari — Coach", "persona": "coach", "text": "Bom dia, clube! Semana com foco em progressive overload 🔥", "timestamp": datetime.now(timezone.utc)},
    {"id": str(uuid.uuid4()), "author": "Rafael M.", "persona": "student", "text": "Fechei o supino com 92kg hoje, animal!", "timestamp": datetime.now(timezone.utc)},
    {"id": str(uuid.uuid4()), "author": "Camila S.", "persona": "student", "text": "Alguém tem substituto pro salmão hoje?", "timestamp": datetime.now(timezone.utc)},
]

KPIS_SEED = [
    {"label_pt": "Alunos ativos", "label_en": "Active students", "value": "248", "delta": "+12"},
    {"label_pt": "Adesão semanal", "label_en": "Weekly adherence", "value": "87%", "delta": "+3%"},
    {"label_pt": "Receita mensal", "label_en": "Monthly revenue", "value": "R$ 74.2k", "delta": "+8%"},
    {"label_pt": "Novos cadastros", "label_en": "New signups", "value": "36", "delta": "+5"},
]

RADAR_SEED = [
    {"id": "r1", "student": "João P.", "status": "Inativo há 8 dias", "days": 8, "severity": "warn"},
    {"id": "r2", "student": "Fernanda L.", "status": "Peso estagnado 3 semanas", "days": 21, "severity": "info"},
    {"id": "r3", "student": "Bruno T.", "status": "Sem check-in há 14 dias", "days": 14, "severity": "crit"},
    {"id": "r4", "student": "Aline R.", "status": "Dieta abaixo de 60% adesão", "days": 7, "severity": "warn"},
]


@app.on_event("startup")
async def seed_db():
    if await db.plans.count_documents({}) == 0:
        await db.plans.insert_many([{**p} for p in PLANS_SEED])
    if await db.workouts.count_documents({}) == 0:
        await db.workouts.insert_one({**WORKOUT_SEED})
    if await db.diet.count_documents({}) == 0:
        await db.diet.insert_one({**DIET_SEED})
    if await db.progress.count_documents({}) == 0:
        await db.progress.insert_many([{**p} for p in PROGRESS_SEED])
    if await db.challenges.count_documents({}) == 0:
        await db.challenges.insert_many([{**c} for c in CHALLENGES_SEED])
    if await db.chat.count_documents({}) == 0:
        await db.chat.insert_many([{**m} for m in CHAT_SEED])
    if await db.kpis.count_documents({}) == 0:
        await db.kpis.insert_many([{**k} for k in KPIS_SEED])
    if await db.radar.count_documents({}) == 0:
        await db.radar.insert_many([{**r} for r in RADAR_SEED])


def clean(d: Dict[str, Any]) -> Dict[str, Any]:
    d.pop("_id", None)
    return d


# ============ Routes ============
@api_router.get("/")
async def root():
    return {"app": "Vyra Training & Performance", "status": "ok"}

@api_router.get("/plans", response_model=List[Plan])
async def get_plans():
    docs = await db.plans.find({}, {"_id": 0}).to_list(100)
    return docs

@api_router.get("/workout/today", response_model=Workout)
async def get_today_workout():
    doc = await db.workouts.find_one({"id": "wk-today"}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "not found")
    return doc

@api_router.get("/diet", response_model=DietPlan)
async def get_diet():
    doc = await db.diet.find_one({"id": "diet-default"}, {"_id": 0})
    return doc

class DietUpdate(BaseModel):
    kcal: int
    protein_pct: int
    carbs_pct: int
    fats_pct: int

@api_router.put("/diet", response_model=DietPlan)
async def update_diet(payload: DietUpdate):
    await db.diet.update_one({"id": "diet-default"}, {"$set": payload.dict()})
    return await db.diet.find_one({"id": "diet-default"}, {"_id": 0})

@api_router.get("/progress", response_model=List[ProgressEntry])
async def get_progress():
    docs = await db.progress.find({}, {"_id": 0}).sort("date", 1).to_list(100)
    return docs

class ProgressIn(BaseModel):
    weight_kg: float
    waist_cm: Optional[float] = None
    arms_cm: Optional[float] = None
    note: Optional[str] = None

@api_router.post("/progress", response_model=ProgressEntry)
async def add_progress(payload: ProgressIn):
    entry = {
        "id": str(uuid.uuid4()),
        "date": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        **payload.dict(),
    }
    await db.progress.insert_one({**entry})
    return entry

@api_router.get("/challenges", response_model=List[Challenge])
async def get_challenges(tag: Optional[str] = None):
    q = {"tag": tag} if tag and tag != "all" else {}
    docs = await db.challenges.find(q, {"_id": 0}).to_list(200)
    return docs

@api_router.post("/challenges/{cid}/like")
async def like_challenge(cid: str):
    await db.challenges.update_one({"id": cid}, {"$inc": {"likes": 1}})
    doc = await db.challenges.find_one({"id": cid}, {"_id": 0})
    return doc

@api_router.get("/chat", response_model=List[ChatMessage])
async def get_chat():
    docs = await db.chat.find({}, {"_id": 0}).sort("timestamp", 1).to_list(200)
    return docs

@api_router.post("/chat", response_model=ChatMessage)
async def post_chat(payload: ChatMessageIn):
    msg = ChatMessage(**payload.dict())
    await db.chat.insert_one(msg.dict())
    return msg

@api_router.post("/coupon/check")
async def check_coupon(payload: CouponCheck):
    if payload.code.upper() == "VYRA10":
        discount = round(payload.subtotal * 0.10, 2)
        return {"valid": True, "discount": discount, "total": round(payload.subtotal - discount, 2), "percent": 10}
    if payload.code.upper() == "RESET25":
        discount = round(payload.subtotal * 0.25, 2)
        return {"valid": True, "discount": discount, "total": round(payload.subtotal - discount, 2), "percent": 25}
    return {"valid": False, "discount": 0, "total": payload.subtotal, "percent": 0}

@api_router.get("/kpis", response_model=List[KPI])
async def kpis():
    return await db.kpis.find({}, {"_id": 0}).to_list(100)

@api_router.get("/radar", response_model=List[RadarAlert])
async def radar():
    return await db.radar.find({}, {"_id": 0}).to_list(100)

@api_router.get("/form-checker/mock")
async def form_checker_mock():
    return {
        "score": 82,
        "verdict_pt": "Boa execução — pequenos ajustes elevam ainda mais o resultado.",
        "verdict_en": "Solid form — small tweaks will push results further.",
        "tips_pt": [
            "Mantenha as escápulas retraídas durante toda a descida.",
            "Controle a fase excêntrica em 2 segundos.",
            "Não trave o cotovelo no topo.",
        ],
        "tips_en": [
            "Keep scapulae retracted through the entire descent.",
            "Control the eccentric phase for 2 seconds.",
            "Avoid locking your elbows at the top.",
        ],
    }


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
