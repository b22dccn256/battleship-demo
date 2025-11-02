from fastapi import FastAPI, APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Set
import uuid
from datetime import datetime, timezone, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
import json
import asyncio

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security
SECRET_KEY = os.environ.get('SECRET_KEY', 'battleship-secret-key-change-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 1 week

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

app = FastAPI()
api_router = APIRouter(prefix="/api")

# Models
class UserRegister(BaseModel):
    username: str
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class UserProfile(BaseModel):
    username: str
    wins: int = 0
    losses: int = 0
    games_played: int = 0
    created_at: str

class LeaderboardEntry(BaseModel):
    username: str
    wins: int
    losses: int
    games_played: int
    win_rate: float

class GameHistory(BaseModel):
    id: str
    player1: str
    player2: str
    winner: str
    loser: str
    duration_seconds: int
    finished_at: str

class RoomCreate(BaseModel):
    room_code: Optional[str] = None

class RoomJoin(BaseModel):
    room_code: str

# WebSocket Connection Manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.user_to_room: Dict[str, str] = {}
        self.rooms: Dict[str, Dict] = {}

    async def connect(self, websocket: WebSocket, username: str):
        await websocket.accept()
        self.active_connections[username] = websocket

    def disconnect(self, username: str):
        if username in self.active_connections:
            del self.active_connections[username]
        if username in self.user_to_room:
            room_code = self.user_to_room[username]
            if room_code in self.rooms:
                room = self.rooms[room_code]
                if username in room.get('players', []):
                    room['players'].remove(username)
                if len(room['players']) == 0:
                    del self.rooms[room_code]
            del self.user_to_room[username]

    async def send_personal_message(self, message: dict, username: str):
        if username in self.active_connections:
            await self.active_connections[username].send_text(json.dumps(message))

    async def broadcast_to_room(self, message: dict, room_code: str):
        if room_code in self.rooms:
            for player in self.rooms[room_code].get('players', []):
                if player in self.active_connections:
                    await self.active_connections[player].send_text(json.dumps(message))

manager = ConnectionManager()

# Helper functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = await db.users.find_one({"username": username})
    if user is None:
        raise credentials_exception
    return user

# Auth Routes
@api_router.get("/")
async def root():
    return {"message": "BattleShip API is running"}

@api_router.post("/auth/register", response_model=Token)
async def register(user: UserRegister):
    existing_user = await db.users.find_one({"username": user.username})
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    hashed_password = get_password_hash(user.password)
    user_doc = {
        "username": user.username,
        "password": hashed_password,
        "wins": 0,
        "losses": 0,
        "games_played": 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_doc)
    
    access_token = create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}

@api_router.post("/auth/login", response_model=Token)
async def login(user: UserLogin):
    db_user = await db.users.find_one({"username": user.username})
    if not db_user or not verify_password(user.password, db_user["password"]):
        raise HTTPException(status_code=400, detail="Invalid credentials")
    
    access_token = create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}

@api_router.get("/auth/me", response_model=UserProfile)
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserProfile(
        username=current_user["username"],
        wins=current_user.get("wins", 0),
        losses=current_user.get("losses", 0),
        games_played=current_user.get("games_played", 0),
        created_at=current_user["created_at"]
    )

# Game Routes
@api_router.get("/leaderboard", response_model=List[LeaderboardEntry])
async def get_leaderboard():
    users = await db.users.find({}, {"_id": 0, "password": 0}).to_list(100)
    leaderboard = []
    for user in users:
        win_rate = user["wins"] / user["games_played"] * 100 if user["games_played"] > 0 else 0
        leaderboard.append(LeaderboardEntry(
            username=user["username"],
            wins=user["wins"],
            losses=user["losses"],
            games_played=user["games_played"],
            win_rate=round(win_rate, 2)
        ))
    leaderboard.sort(key=lambda x: (x.wins, x.win_rate), reverse=True)
    return leaderboard[:10]

@api_router.get("/history", response_model=List[GameHistory])
async def get_game_history(current_user: dict = Depends(get_current_user)):
    username = current_user["username"]
    games = await db.games.find(
        {"$or": [{"player1": username}, {"player2": username}]},
        {"_id": 0}
    ).sort("finished_at", -1).limit(20).to_list(20)
    return games

# WebSocket endpoint  
@app.websocket("/api/ws/{token}")
async def websocket_endpoint(websocket: WebSocket, token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if not username:
            await websocket.close(code=1008)
            return
    except JWTError:
        await websocket.close(code=1008)
        return

    await manager.connect(websocket, username)
    
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            msg_type = message.get("type")

            if msg_type == "create_room":
                room_code = str(uuid.uuid4())[:6].upper()
                manager.rooms[room_code] = {
                    "code": room_code,
                    "players": [username],
                    "host": username,
                    "game_state": None,
                    "status": "waiting"
                }
                manager.user_to_room[username] = room_code
                await manager.send_personal_message({
                    "type": "room_created",
                    "room_code": room_code
                }, username)

            elif msg_type == "join_room":
                room_code = message.get("room_code")
                if room_code not in manager.rooms:
                    await manager.send_personal_message({
                        "type": "error",
                        "message": "Room not found"
                    }, username)
                    continue
                
                room = manager.rooms[room_code]
                if len(room["players"]) >= 2:
                    await manager.send_personal_message({
                        "type": "error",
                        "message": "Room is full"
                    }, username)
                    continue
                
                room["players"].append(username)
                manager.user_to_room[username] = room_code
                room["status"] = "placement"
                room["game_state"] = {
                    "boards": {username: {}, room["host"]: {}},
                    "ready": {username: False, room["host"]: False},
                    "current_turn": room["host"],
                    "hits": {username: [], room["host"]: []},
                    "started_at": datetime.now(timezone.utc).isoformat()
                }
                
                await manager.broadcast_to_room({
                    "type": "player_joined",
                    "players": room["players"],
                    "status": "placement"
                }, room_code)

            elif msg_type == "place_ships":
                room_code = manager.user_to_room.get(username)
                if not room_code:
                    continue
                
                room = manager.rooms[room_code]
                ships = message.get("ships")
                room["game_state"]["boards"][username] = ships
                room["game_state"]["ready"][username] = True
                
                all_ready = all(room["game_state"]["ready"].values())
                if all_ready:
                    room["status"] = "playing"
                    await manager.broadcast_to_room({
                        "type": "game_start",
                        "current_turn": room["game_state"]["current_turn"]
                    }, room_code)
                else:
                    await manager.broadcast_to_room({
                        "type": "player_ready",
                        "player": username
                    }, room_code)

            elif msg_type == "attack":
                room_code = manager.user_to_room.get(username)
                if not room_code:
                    continue
                
                room = manager.rooms[room_code]
                if room["game_state"]["current_turn"] != username:
                    continue
                
                x, y = message.get("x"), message.get("y")
                opponent = [p for p in room["players"] if p != username][0]
                opponent_board = room["game_state"]["boards"][opponent]
                
                hit = False
                sunk_ship = None
                for ship_name, ship_data in opponent_board.items():
                    for coord in ship_data["coords"]:
                        if coord["x"] == x and coord["y"] == y:
                            hit = True
                            coord["hit"] = True
                            if all(c.get("hit", False) for c in ship_data["coords"]):
                                sunk_ship = ship_name
                            break
                
                room["game_state"]["hits"][username].append({"x": x, "y": y, "hit": hit})
                
                # Check win condition
                all_sunk = all(
                    all(c.get("hit", False) for c in ship["coords"])
                    for ship in opponent_board.values()
                )
                
                if all_sunk:
                    # Game over
                    duration = (datetime.now(timezone.utc) - datetime.fromisoformat(room["game_state"]["started_at"])).seconds
                    game_doc = {
                        "id": str(uuid.uuid4()),
                        "player1": room["players"][0],
                        "player2": room["players"][1],
                        "winner": username,
                        "loser": opponent,
                        "duration_seconds": duration,
                        "finished_at": datetime.now(timezone.utc).isoformat()
                    }
                    await db.games.insert_one(game_doc)
                    
                    # Update stats
                    await db.users.update_one(
                        {"username": username},
                        {"$inc": {"wins": 1, "games_played": 1}}
                    )
                    await db.users.update_one(
                        {"username": opponent},
                        {"$inc": {"losses": 1, "games_played": 1}}
                    )
                    
                    await manager.broadcast_to_room({
                        "type": "game_over",
                        "winner": username,
                        "loser": opponent
                    }, room_code)
                    
                    del manager.rooms[room_code]
                else:
                    # Switch turn
                    room["game_state"]["current_turn"] = opponent
                    
                    await manager.broadcast_to_room({
                        "type": "attack_result",
                        "attacker": username,
                        "x": x,
                        "y": y,
                        "hit": hit,
                        "sunk_ship": sunk_ship,
                        "current_turn": opponent
                    }, room_code)

            elif msg_type == "chat":
                room_code = manager.user_to_room.get(username)
                if room_code:
                    await manager.broadcast_to_room({
                        "type": "chat",
                        "username": username,
                        "message": message.get("message"),
                        "timestamp": datetime.now(timezone.utc).isoformat()
                    }, room_code)

    except WebSocketDisconnect:
        manager.disconnect(username)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(username)

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()