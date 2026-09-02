from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os, logging, uuid, json, re
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY", "")

app = FastAPI()
api_router = APIRouter(prefix="/api")


# ============ Models ============
class Anamnesis(BaseModel):
    age: int
    gender: str
    height_cm: int
    weight_kg: float
    goal: str  # emagrecer, hipertrofia, recomposicao, performance
    activity_level: str  # sedentario, leve, moderado, intenso
    restrictions: str
    allergies: str
    medical_notes: Optional[str] = None
    photo_front: Optional[str] = None
    photo_side: Optional[str] = None
    photo_back: Optional[str] = None


class UserProfile(BaseModel):
    id: str
    nickname: str
    email: str
    avatar_url: Optional[str] = None
    height_cm: Optional[int] = None
    weight_kg: Optional[float] = None
    waist_cm: Optional[float] = None
    right_arm_cm: Optional[float] = None
    left_arm_cm: Optional[float] = None
    right_leg_cm: Optional[float] = None
    left_leg_cm: Optional[float] = None
    anamnesis: Optional[Anamnesis] = None
    anamnesis_done: bool = False
    water_ml: int = 2500  # meta diária
    creatine_g: float = 5.0
    creatine_times: List[str] = []  # ["08:00", "20:00"]
    logged_in: bool = False


# ============ Seed / helpers ============
PLANS_SEED = [
    {"id": "reset12", "slug": "reset12", "name": "Projeto Reset 12", "tag": "Mais solicitado",
     "description": "12 semanas de recomposição total com acompanhamento premium.", "accent": "#D8B46A",
     "prices_brl": {"month": 297.0, "quarter": 797.0, "year": 2497.0},
     "prices_usd": {"month": 59.0, "quarter": 159.0, "year": 499.0},
     "perks": ["Treinos e dieta 100% personalizados", "Form Checker IA ilimitado", "Suporte 1:1 no chat", "Radar semanal do coach"]},
    {"id": "shape", "slug": "shape", "name": "Shape", "tag": None,
     "description": "Definição, estética e mobilidade — protocolo Shape.", "accent": "#D96E92",
     "prices_brl": {"month": 147.0, "quarter": 397.0, "year": 1197.0},
     "prices_usd": {"month": 29.0, "quarter": 79.0, "year": 239.0},
     "perks": ["Treino em periodização Shape", "Dieta com macro-calculadora", "Galeria de evolução"]},
    {"id": "forge", "slug": "forge", "name": "Forge", "tag": None,
     "description": "Hipertrofia e força bruta — protocolo Forge.", "accent": "#6D9BFF",
     "prices_brl": {"month": 167.0, "quarter": 447.0, "year": 1347.0},
     "prices_usd": {"month": 33.0, "quarter": 89.0, "year": 269.0},
     "perks": ["Foco em progressive overload", "Intensificadores e Assistente IA", "Suporte prioritário"]},
]

WORKOUT_SEED = {
    "id": "wk-today",
    "day_label": "Dia 3 · Push",
    "title": "Peito, Ombro & Tríceps",
    "focus": "Push · Força",
    "duration_min": 58,
    "intensity": "Alta",
    "coach_note": "Foco no controle excêntrico. Se sentir dor na articulação, reduza carga 20% e me avise no chat.",
    "hero_image": "https://images.pexels.com/photos/29667299/pexels-photo-29667299.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    "exercises": [
        {"id": "e1", "name": "Supino reto barra", "sets": 4, "reps": "8-10", "rest": "90s", "muscle": "Peito",
         "video_url": "https://www.youtube.com/watch?v=rT7DgCr-3pg", "coach_tip": "Mantenha escápulas retraídas durante toda a execução."},
        {"id": "e2", "name": "Supino inclinado halter", "sets": 3, "reps": "10-12", "rest": "75s", "muscle": "Peito",
         "video_url": "https://www.youtube.com/watch?v=8iPEnn-ltC8", "coach_tip": "Inclinação de 30-45°. Trajetória em arco."},
        {"id": "e3", "name": "Desenvolvimento militar", "sets": 4, "reps": "8", "rest": "90s", "muscle": "Ombro",
         "video_url": "https://www.youtube.com/watch?v=qEwKCR5JCog", "coach_tip": "Core contraído, não arqueie a lombar."},
        {"id": "e4", "name": "Elevação lateral", "sets": 4, "reps": "12", "rest": "45s", "muscle": "Ombro",
         "video_url": "https://www.youtube.com/watch?v=3VcKaXpzqRo", "coach_tip": "Cotovelos ligeiramente flexionados, sem impulso."},
        {"id": "e5", "name": "Tríceps corda", "sets": 3, "reps": "12-15", "rest": "45s", "muscle": "Tríceps",
         "video_url": "https://www.youtube.com/watch?v=vB5OHsJ3EME", "coach_tip": "Cotovelos colados ao tronco, extensão completa."},
        {"id": "e6", "name": "Tríceps francês", "sets": 3, "reps": "10", "rest": "60s", "muscle": "Tríceps",
         "video_url": "https://www.youtube.com/watch?v=YbX7Wd8jQ-Q", "coach_tip": "Cotovelos apontando pro teto, sem abrir."},
    ],
}

DIET_SEED = {
    "id": "diet-default", "kcal": 2450, "protein_pct": 35, "carbs_pct": 40, "fats_pct": 25,
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
     "likes": 214, "tag": "reset12", "status": "active", "votes": 214, "vote_url": "https://vote.vyra.club/c1"},
    {"id": "c2", "author": "Camila S.", "title": "Shape · Verão 2026", "weeks": 16,
     "before_image": "https://images.unsplash.com/photo-1594381898411-846e7d193883?auto=format&fit=crop&w=600&q=80",
     "after_image": "https://images.unsplash.com/photo-1594381898411-846e7d193883?auto=format&fit=crop&w=600&q=80",
     "likes": 187, "tag": "shape", "status": "active", "votes": 187, "vote_url": "https://vote.vyra.club/c2"},
    {"id": "c3", "author": "Diego P.", "title": "Forge Bulk", "weeks": 20,
     "before_image": "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=600&q=80",
     "after_image": "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=600&q=80",
     "likes": 302, "tag": "forge", "status": "active", "votes": 302, "vote_url": "https://vote.vyra.club/c3"},
]

HALL_SEED = [
    {"id": "h1", "champion": "Marina R.", "title": "Reset · Q4 2025", "date": "Dez / 2025",
     "photo": "https://images.unsplash.com/photo-1550345332-09e3ac987658?auto=format&fit=crop&w=600&q=80", "votes": 1420},
    {"id": "h2", "champion": "Lucas O.", "title": "Forge Summer", "date": "Set / 2025",
     "photo": "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=600&q=80", "votes": 1180},
    {"id": "h3", "champion": "Bianca N.", "title": "Shape Winter", "date": "Jun / 2025",
     "photo": "https://images.unsplash.com/photo-1594381898411-846e7d193883?auto=format&fit=crop&w=600&q=80", "votes": 980},
]

CHAT_SEED = [
    {"id": str(uuid.uuid4()), "author": "Mari — Coach", "persona": "coach", "text": "Bom dia, clube! Semana com foco em progressive overload 🔥", "timestamp": datetime.now(timezone.utc), "likes": 12, "image": None},
    {"id": str(uuid.uuid4()), "author": "Rafael M.", "persona": "student", "text": "Fechei o supino com 92kg hoje, animal!", "timestamp": datetime.now(timezone.utc), "likes": 5, "image": None},
    {"id": str(uuid.uuid4()), "author": "Camila S.", "persona": "student", "text": "Alguém tem substituto pro salmão hoje?", "timestamp": datetime.now(timezone.utc), "likes": 2, "image": None},
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

COUPONS_SEED = [
    {"id": "cp1", "code": "VYRA10", "pct": 10, "active": True},
    {"id": "cp2", "code": "RESET25", "pct": 25, "active": True},
]

PARTNERS_SEED = [
    {"id": "pt1", "email": "parceiro@empresa.com", "active": True},
]

COACHES_SEED = [
    {"id": "co1", "email": "mari@vyra.club", "active": True},
]

COACH_BROADCAST_SEED = [
    {"id": "b1", "text": "Hidratação hoje: 3 litros mínimo, especialmente treino de pernas!", "date": "2026-05-06", "author": "Mari"},
]


@app.on_event("startup")
async def seed_db():
    if await db.plans.count_documents({}) == 0:
        await db.plans.insert_many([{**p} for p in PLANS_SEED])
    if await db.workouts.count_documents({}) == 0:
        await db.workouts.insert_one({**WORKOUT_SEED})
    else:
        # ensure coach_note + video fields exist on existing docs
        await db.workouts.update_one({"id": "wk-today"}, {"$set": {"coach_note": WORKOUT_SEED["coach_note"], "exercises": WORKOUT_SEED["exercises"]}})
    if await db.diet.count_documents({}) == 0:
        await db.diet.insert_one({**DIET_SEED})
    if await db.progress.count_documents({}) == 0:
        await db.progress.insert_many([{**p} for p in PROGRESS_SEED])
    if await db.challenges.count_documents({}) == 0:
        await db.challenges.insert_many([{**c} for c in CHALLENGES_SEED])
    if await db.hall.count_documents({}) == 0:
        await db.hall.insert_many([{**h} for h in HALL_SEED])
    if await db.chat.count_documents({}) == 0:
        await db.chat.insert_many([{**m} for m in CHAT_SEED])
    if await db.kpis.count_documents({}) == 0:
        await db.kpis.insert_many([{**k} for k in KPIS_SEED])
    if await db.radar.count_documents({}) == 0:
        await db.radar.insert_many([{**r} for r in RADAR_SEED])
    if await db.coupons.count_documents({}) == 0:
        await db.coupons.insert_many([{**c} for c in COUPONS_SEED])
    if await db.partners.count_documents({}) == 0:
        await db.partners.insert_many([{**p} for p in PARTNERS_SEED])
    if await db.coaches.count_documents({}) == 0:
        await db.coaches.insert_many([{**c} for c in COACHES_SEED])
    if await db.broadcasts.count_documents({}) == 0:
        await db.broadcasts.insert_many([{**b} for b in COACH_BROADCAST_SEED])


# ============ Routes ============
@api_router.get("/")
async def root():
    return {"app": "Vyra Training & Performance", "status": "ok"}

@api_router.get("/plans")
async def get_plans():
    return await db.plans.find({}, {"_id": 0}).to_list(100)

@api_router.get("/workout/today")
async def get_today_workout():
    doc = await db.workouts.find_one({"id": "wk-today"}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "not found")
    return doc

class WorkoutUpdate(BaseModel):
    title: Optional[str] = None
    focus: Optional[str] = None
    duration_min: Optional[int] = None
    coach_note: Optional[str] = None
    exercises: Optional[List[Dict[str, Any]]] = None

@api_router.put("/workout/today")
async def update_workout(payload: WorkoutUpdate):
    fields = {k: v for k, v in payload.dict().items() if v is not None}
    await db.workouts.update_one({"id": "wk-today"}, {"$set": fields})
    return await db.workouts.find_one({"id": "wk-today"}, {"_id": 0})

@api_router.get("/diet")
async def get_diet():
    return await db.diet.find_one({"id": "diet-default"}, {"_id": 0})

class DietUpdate(BaseModel):
    kcal: Optional[int] = None
    protein_pct: Optional[int] = None
    carbs_pct: Optional[int] = None
    fats_pct: Optional[int] = None
    foods: Optional[List[Dict[str, Any]]] = None

@api_router.put("/diet")
async def update_diet(payload: DietUpdate):
    fields = {k: v for k, v in payload.dict().items() if v is not None}
    await db.diet.update_one({"id": "diet-default"}, {"$set": fields})
    return await db.diet.find_one({"id": "diet-default"}, {"_id": 0})

@api_router.get("/progress")
async def get_progress():
    return await db.progress.find({}, {"_id": 0}).sort("date", 1).to_list(100)

class ProgressIn(BaseModel):
    weight_kg: float
    waist_cm: Optional[float] = None
    arms_cm: Optional[float] = None
    note: Optional[str] = None

@api_router.post("/progress")
async def add_progress(payload: ProgressIn):
    entry = {"id": str(uuid.uuid4()), "date": datetime.now(timezone.utc).strftime("%Y-%m-%d"), **payload.dict()}
    await db.progress.insert_one({**entry})
    return entry

@api_router.get("/challenges")
async def get_challenges(tag: Optional[str] = None):
    q = {"status": "active"}
    if tag and tag != "all":
        q["tag"] = tag
    return await db.challenges.find(q, {"_id": 0}).to_list(200)

class ChallengeCreate(BaseModel):
    title: str
    author: str
    tag: str
    weeks: int
    before_image: Optional[str] = None
    after_image: Optional[str] = None
    vote_url: Optional[str] = None

@api_router.post("/challenges")
async def create_challenge(payload: ChallengeCreate):
    cid = f"c{str(uuid.uuid4())[:8]}"
    doc = {
        "id": cid, **payload.dict(), "likes": 0, "votes": 0, "status": "active",
        "before_image": payload.before_image or "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=600&q=80",
        "after_image": payload.after_image or "https://images.unsplash.com/photo-1550345332-09e3ac987658?auto=format&fit=crop&w=600&q=80",
        "vote_url": payload.vote_url or f"https://vote.vyra.club/{cid}",
    }
    await db.challenges.insert_one({**doc})
    return doc

@api_router.post("/challenges/{cid}/like")
async def like_challenge(cid: str):
    await db.challenges.update_one({"id": cid}, {"$inc": {"likes": 1}})
    return await db.challenges.find_one({"id": cid}, {"_id": 0})

@api_router.post("/challenges/{cid}/close")
async def close_challenge(cid: str):
    """Move para hall da fama e desativa."""
    doc = await db.challenges.find_one({"id": cid}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "not found")
    hall_entry = {
        "id": f"h{str(uuid.uuid4())[:8]}",
        "champion": doc["author"], "title": doc["title"],
        "date": datetime.now(timezone.utc).strftime("%b / %Y"),
        "photo": doc["after_image"], "votes": doc.get("votes", 0),
    }
    await db.hall.insert_one({**hall_entry})
    await db.challenges.update_one({"id": cid}, {"$set": {"status": "closed"}})
    return {"ok": True, "hall_entry": hall_entry}

@api_router.get("/hall")
async def hall():
    return await db.hall.find({}, {"_id": 0}).sort("votes", -1).to_list(50)

@api_router.get("/chat")
async def get_chat():
    return await db.chat.find({}, {"_id": 0}).sort("timestamp", 1).to_list(200)

class ChatMessageIn(BaseModel):
    author: str
    persona: str
    text: str
    image: Optional[str] = None

@api_router.post("/chat")
async def post_chat(payload: ChatMessageIn):
    if len(payload.text) > 200:
        raise HTTPException(400, "text too long — max 200 chars")
    msg = {
        "id": str(uuid.uuid4()), "author": payload.author, "persona": payload.persona,
        "text": payload.text, "image": payload.image, "likes": 0,
        "timestamp": datetime.now(timezone.utc),
    }
    await db.chat.insert_one({**msg})
    return msg

@api_router.post("/chat/{mid}/like")
async def like_chat(mid: str):
    await db.chat.update_one({"id": mid}, {"$inc": {"likes": 1}})
    return await db.chat.find_one({"id": mid}, {"_id": 0})

@api_router.get("/coupons")
async def list_coupons():
    return await db.coupons.find({}, {"_id": 0}).to_list(100)

class CouponIn(BaseModel):
    code: str
    pct: int

@api_router.post("/coupons")
async def create_coupon(payload: CouponIn):
    doc = {"id": str(uuid.uuid4()), "code": payload.code.upper(), "pct": payload.pct, "active": True}
    await db.coupons.insert_one({**doc})
    return doc

@api_router.post("/coupons/{cid}/toggle")
async def toggle_coupon(cid: str):
    doc = await db.coupons.find_one({"id": cid}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "not found")
    await db.coupons.update_one({"id": cid}, {"$set": {"active": not doc["active"]}})
    return await db.coupons.find_one({"id": cid}, {"_id": 0})

class CouponCheck(BaseModel):
    code: str
    subtotal: float

@api_router.post("/coupon/check")
async def check_coupon(payload: CouponCheck):
    doc = await db.coupons.find_one({"code": payload.code.upper(), "active": True}, {"_id": 0})
    if not doc:
        return {"valid": False, "discount": 0, "total": payload.subtotal, "percent": 0}
    discount = round(payload.subtotal * doc["pct"] / 100, 2)
    return {"valid": True, "discount": discount, "total": round(payload.subtotal - discount, 2), "percent": doc["pct"]}

@api_router.get("/partners")
async def list_partners():
    return await db.partners.find({}, {"_id": 0}).to_list(100)

class PartnerIn(BaseModel):
    email: str

@api_router.post("/partners")
async def create_partner(payload: PartnerIn):
    doc = {"id": str(uuid.uuid4()), "email": payload.email, "active": True}
    await db.partners.insert_one({**doc})
    return doc

@api_router.post("/partners/{pid}/toggle")
async def toggle_partner(pid: str):
    doc = await db.partners.find_one({"id": pid}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "not found")
    await db.partners.update_one({"id": pid}, {"$set": {"active": not doc["active"]}})
    return await db.partners.find_one({"id": pid}, {"_id": 0})

@api_router.get("/coaches")
async def list_coaches():
    return await db.coaches.find({}, {"_id": 0}).to_list(100)

@api_router.post("/coaches")
async def add_coach(payload: PartnerIn):
    doc = {"id": str(uuid.uuid4()), "email": payload.email, "active": True}
    await db.coaches.insert_one({**doc})
    return doc

@api_router.post("/coaches/{cid}/toggle")
async def toggle_coach(cid: str):
    doc = await db.coaches.find_one({"id": cid}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "not found")
    await db.coaches.update_one({"id": cid}, {"$set": {"active": not doc["active"]}})
    return await db.coaches.find_one({"id": cid}, {"_id": 0})

@api_router.get("/kpis")
async def kpis():
    return await db.kpis.find({}, {"_id": 0}).to_list(100)

@api_router.get("/radar")
async def radar():
    return await db.radar.find({}, {"_id": 0}).to_list(100)


# ============ Profile & Anamnese ============
@api_router.get("/profile")
async def get_profile():
    doc = await db.profile.find_one({"id": "me"}, {"_id": 0})
    if not doc:
        default = {
            "id": "me", "nickname": "Rafael", "email": "rafael@vyra.club",
            "avatar_url": "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=200&q=80",
            "height_cm": 178, "weight_kg": 81.1, "waist_cm": 84, "right_arm_cm": 39.5,
            "left_arm_cm": 39.2, "right_leg_cm": 58, "left_leg_cm": 57.5,
            "anamnesis": None, "anamnesis_done": False, "water_ml": 2500,
            "creatine_g": 5.0, "creatine_times": ["08:00", "20:00"], "logged_in": False,
        }
        await db.profile.insert_one({**default})
        doc = default
    return doc

class ProfileUpdate(BaseModel):
    nickname: Optional[str] = None
    email: Optional[str] = None
    avatar_url: Optional[str] = None
    height_cm: Optional[int] = None
    weight_kg: Optional[float] = None
    waist_cm: Optional[float] = None
    right_arm_cm: Optional[float] = None
    left_arm_cm: Optional[float] = None
    right_leg_cm: Optional[float] = None
    left_leg_cm: Optional[float] = None
    water_ml: Optional[int] = None
    creatine_g: Optional[float] = None
    creatine_times: Optional[List[str]] = None
    logged_in: Optional[bool] = None

@api_router.put("/profile")
async def update_profile(payload: ProfileUpdate):
    fields = {k: v for k, v in payload.dict().items() if v is not None}
    await db.profile.update_one({"id": "me"}, {"$set": fields}, upsert=True)
    return await db.profile.find_one({"id": "me"}, {"_id": 0})

@api_router.post("/anamnesis")
async def save_anamnesis(payload: Anamnesis):
    await db.profile.update_one(
        {"id": "me"},
        {"$set": {"anamnesis": payload.dict(), "anamnesis_done": True}},
        upsert=True,
    )
    return {"ok": True}


# ============ Broadcasts (coach → all) ============
@api_router.get("/broadcasts")
async def list_broadcasts():
    return await db.broadcasts.find({}, {"_id": 0}).sort("date", -1).to_list(20)

class BroadcastIn(BaseModel):
    text: str
    author: str

@api_router.post("/broadcasts")
async def add_broadcast(payload: BroadcastIn):
    doc = {"id": str(uuid.uuid4()), "text": payload.text, "author": payload.author,
           "date": datetime.now(timezone.utc).strftime("%Y-%m-%d")}
    await db.broadcasts.insert_one({**doc})
    return doc


# ============ AI (Claude Sonnet 5 via Emergent LLM) ============
def _extract_json(text: str) -> Dict[str, Any]:
    """Try to extract the first JSON object from a possibly noisy text."""
    text = text.strip()
    # strip code fences
    text = re.sub(r"^```(?:json)?\s*", "", text)
    text = re.sub(r"\s*```$", "", text)
    try:
        return json.loads(text)
    except Exception:
        pass
    match = re.search(r"\{[\s\S]*\}", text)
    if match:
        try:
            return json.loads(match.group(0))
        except Exception:
            pass
    return {}

async def _run_claude(system: str, user_text: str, image_b64: Optional[str] = None) -> str:
    if not EMERGENT_LLM_KEY:
        return "{}"
    from emergentintegrations.llm.chat import LlmChat, UserMessage, TextDelta, StreamDone, ImageContent
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"vyra-{uuid.uuid4()}",
        system_message=system,
    ).with_model("anthropic", "claude-sonnet-5")

    file_contents = [ImageContent(image_base64=image_b64)] if image_b64 else None
    msg = UserMessage(text=user_text, file_contents=file_contents) if file_contents else UserMessage(text=user_text)

    out = ""
    async for ev in chat.stream_message(msg):
        if isinstance(ev, TextDelta):
            out += ev.content
        elif isinstance(ev, StreamDone):
            break
    return out


class FormCheckerIn(BaseModel):
    exercise: str
    checklist: List[str]

@api_router.post("/ai/form-checker")
async def ai_form_checker(payload: FormCheckerIn):
    system = (
        "You are a strength & conditioning coach. Given an exercise name and the checklist items the athlete claims to follow, "
        "return ONLY a JSON with keys: score (0-100 int), verdict_pt (short PT sentence), verdict_en (short EN sentence), "
        "tips_pt (array of 3 short PT tips), tips_en (array of 3 short EN tips). No markdown, JSON only."
    )
    user = f"Exercise: {payload.exercise}\nChecklist done: {payload.checklist}\nReturn JSON only."
    try:
        raw = await _run_claude(system, user)
        data = _extract_json(raw)
        if not data.get("score"):
            raise ValueError("bad response")
        return data
    except Exception as e:
        logging.warning(f"form-checker fallback: {e}")
        return {
            "score": 82,
            "verdict_pt": "Boa execução — pequenos ajustes elevam ainda mais o resultado.",
            "verdict_en": "Solid form — small tweaks will push results further.",
            "tips_pt": ["Mantenha as escápulas retraídas.", "Controle a fase excêntrica em 2 segundos.", "Não trave o cotovelo no topo."],
            "tips_en": ["Keep scapulae retracted.", "Control the eccentric for 2 seconds.", "Avoid locking your elbows at the top."],
        }


class DietSuggestIn(BaseModel):
    meal: str  # breakfast | lunch | ...
    current_food: str
    lang: str = "pt"

@api_router.post("/ai/diet-suggest")
async def ai_diet_suggest(payload: DietSuggestIn):
    prof = await db.profile.find_one({"id": "me"}, {"_id": 0}) or {}
    ana = prof.get("anamnesis") or {}
    context = f"Age:{ana.get('age','?')} Gender:{ana.get('gender','?')} Height:{ana.get('height_cm','?')} Weight:{ana.get('weight_kg','?')} Goal:{ana.get('goal','?')} Restrictions:{ana.get('restrictions','')} Allergies:{ana.get('allergies','')}"
    lang = "Portuguese (Brazil)" if payload.lang == "pt" else "English"
    system = (
        f"You are a sports nutritionist. Suggest 3 alternative foods for the meal that respect the athlete anamnesis. "
        f"Respond in {lang}. Return ONLY JSON with key 'suggestions' as array of 3 objects with fields: name, grams (int), kcal (int), p (int), c (int), f (int). No markdown."
    )
    user = f"Anamnesis: {context}\nMeal: {payload.meal}\nCurrent food: {payload.current_food}\nJSON only."
    try:
        raw = await _run_claude(system, user)
        data = _extract_json(raw)
        if not data.get("suggestions"):
            raise ValueError("bad response")
        return data
    except Exception as e:
        logging.warning(f"diet-suggest fallback: {e}")
        return {"suggestions": [
            {"name": "Ovos mexidos + tapioca" if payload.lang == "pt" else "Scrambled eggs + tapioca", "grams": 220, "kcal": 460, "p": 32, "c": 40, "f": 18},
            {"name": "Panqueca de aveia" if payload.lang == "pt" else "Oat pancake", "grams": 250, "kcal": 510, "p": 30, "c": 55, "f": 16},
            {"name": "Iogurte + granola" if payload.lang == "pt" else "Yogurt + granola", "grams": 260, "kcal": 430, "p": 26, "c": 48, "f": 14},
        ]}


class PlateAnalyzeIn(BaseModel):
    image_base64: str
    lang: str = "pt"

@api_router.post("/ai/plate-analyze")
async def ai_plate_analyze(payload: PlateAnalyzeIn):
    lang = "Portuguese (Brazil)" if payload.lang == "pt" else "English"
    system = (
        f"You are a sports nutritionist. Estimate the macros of the meal shown in the image. "
        f"Respond in {lang}. Return ONLY JSON with keys: name (string), kcal (int), p (int), c (int), f (int), grams (int). No markdown."
    )
    user = "Estimate macros of the plate in the image. Return JSON only."
    try:
        raw = await _run_claude(system, user, image_b64=payload.image_base64)
        data = _extract_json(raw)
        if not data.get("kcal"):
            raise ValueError("bad response")
        return data
    except Exception as e:
        logging.warning(f"plate-analyze fallback: {e}")
        return {"name": "Prato estimado" if payload.lang == "pt" else "Estimated plate",
                "kcal": 620, "p": 42, "c": 55, "f": 20, "grams": 320}


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
