import uuid

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

from app.db.connection import get_db_connection
from app.utils.graph import WeightedGraph, graph
from app.utils.logger import logger
