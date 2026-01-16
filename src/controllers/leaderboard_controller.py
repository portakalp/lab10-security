from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from src.database import get_db
from src.models.user import User
import random

router = APIRouter(tags=["Leaderboard"])

@router.get("/leaderboard")
def get_leaderboard(db: Session = Depends(get_db)):
    users = db.query(User).all()
    
    leaderboard_data = []
    
    # Calculate scores and build list
    for user in users:
        # Demo Hack: Random score between 1000 and 10000
        # In a real app, this would be user.score or a sum of solved challenges
        score = random.randint(1000, 10000)
        
        leaderboard_data.append({
            "username": user.username,
            "score": score,
            "role": "Admin" if "admin" in user.username.lower() else "User" # Simple role logic based on name or column if exists
        })
    
    # Sort by Score (Descending)
    leaderboard_data.sort(key=lambda x: x["score"], reverse=True)
    
    # Assign Rank
    ranked_leaderboard = []
    for index, entry in enumerate(leaderboard_data):
        entry["rank"] = index + 1
        ranked_leaderboard.append(entry)
        
    return ranked_leaderboard
