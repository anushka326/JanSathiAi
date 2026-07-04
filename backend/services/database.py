import logging
from datetime import UTC, datetime
from typing import Any

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from config import get_settings

logger = logging.getLogger("jansathi.database")


class MongoManager:
    def __init__(self) -> None:
        self._client: AsyncIOMotorClient | None = None
        self._db: AsyncIOMotorDatabase | None = None
        # Local in-memory fallbacks for offline demo mode
        self._demo_eligibility_history: list[dict[str, Any]] = []
        self._demo_saved_schemes: dict[str, list[str]] = {}
        self._demo_feedback: list[dict[str, Any]] = []

    @property
    def is_connected(self) -> bool:
        return self._db is not None

    @property
    def db(self) -> AsyncIOMotorDatabase:
        if self._db is None:
            raise RuntimeError("MongoDB is not configured")
        return self._db

    async def connect(self) -> None:
        settings = get_settings()
        if not settings.mongodb_uri:
            logger.warning("MONGODB_URI is not set; persistence is disabled for local demo mode")
            return

        self._client = AsyncIOMotorClient(settings.mongodb_uri, serverSelectionTimeoutMS=5000)
        try:
            await self._client.admin.command("ping")
            self._db = self._client[settings.mongodb_db]
            await self.ensure_indexes()
            logger.info("Connected to MongoDB database '%s'", settings.mongodb_db)
        except Exception as exc:
            logger.warning("MongoDB ping failed: %s. Continuing in offline mode.", str(exc))
            self._db = None

    async def close(self) -> None:
        if self._client:
            self._client.close()
        self._client = None
        self._db = None

    async def ensure_indexes(self) -> None:
        if self._db is None:
            return
        await self._db.users.create_index("email", unique=True)
        await self._db.users.create_index("mobile_hash", unique=True, sparse=True)
        await self._db.schemes.create_index("scheme_name", unique=True)
        await self._db.eligibility_history.create_index("created_at")
        await self._db.feedback.create_index("created_at")
        await self._db.audit_logs.create_index("created_at")

    async def save_eligibility_history(self, payload: dict[str, Any]) -> str:
        document = {
            **payload,
            "created_at": datetime.now(UTC),
        }
        if self._db is not None:
            result = await self._db.eligibility_history.insert_one(document)
            return str(result.inserted_id)
        
        # In-memory fallback
        import secrets
        doc_id = secrets.token_hex(12)
        document["_id"] = doc_id
        self._demo_eligibility_history.append(document)
        return doc_id

    # Backward compatibility stub
    async def save_eligibility_result(self, payload: dict[str, Any]) -> str:
        return await self.save_eligibility_history(payload)

    async def get_eligibility_history(self, user_id: str | None = None) -> list[dict[str, Any]]:
        if self._db is not None:
            query = {"user_id": user_id} if user_id else {}
            cursor = self._db.eligibility_history.find(query).sort("created_at", -1)
            results = []
            async for doc in cursor:
                doc["_id"] = str(doc["_id"])
                # Handle datetime serialization
                if "created_at" in doc and isinstance(doc["created_at"], datetime):
                    doc["created_at"] = doc["created_at"].isoformat()
                results.append(doc)
            return results

        # In-memory fallback
        results = []
        for doc in reversed(self._demo_eligibility_history):
            if user_id is None or doc.get("user_id") == user_id:
                formatted = dict(doc)
                if "created_at" in formatted and isinstance(formatted["created_at"], datetime):
                    formatted["created_at"] = formatted["created_at"].isoformat()
                results.append(formatted)
        return results

    async def save_feedback(self, payload: dict[str, Any]) -> str:
        document = {
            **payload,
            "created_at": datetime.now(UTC),
        }
        if self._db is not None:
            result = await self._db.feedback.insert_one(document)
            return str(result.inserted_id)

        # In-memory fallback
        import secrets
        doc_id = secrets.token_hex(12)
        document["_id"] = doc_id
        self._demo_feedback.append(document)
        return doc_id

    async def get_feedback(self) -> list[dict[str, Any]]:
        if self._db is not None:
            cursor = self._db.feedback.find({}).sort("created_at", -1)
            results = []
            async for doc in cursor:
                doc["_id"] = str(doc["_id"])
                if "created_at" in doc and isinstance(doc["created_at"], datetime):
                    doc["created_at"] = doc["created_at"].isoformat()
                results.append(doc)
            return results

        # In-memory fallback
        results = []
        for doc in reversed(self._demo_feedback):
            formatted = dict(doc)
            if "created_at" in formatted and isinstance(formatted["created_at"], datetime):
                formatted["created_at"] = formatted["created_at"].isoformat()
            results.append(formatted)
        return results

    async def save_scheme(self, user_id: str, scheme_name: str) -> bool:
        if self._db is not None:
            await self._db.saved_schemes.update_one(
                {"user_id": user_id},
                {"$addToSet": {"schemes": scheme_name}},
                upsert=True
            )
            return True

        # In-memory fallback
        if user_id not in self._demo_saved_schemes:
            self._demo_saved_schemes[user_id] = []
        if scheme_name not in self._demo_saved_schemes[user_id]:
            self._demo_saved_schemes[user_id].append(scheme_name)
        return True

    async def unsave_scheme(self, user_id: str, scheme_name: str) -> bool:
        if self._db is not None:
            await self._db.saved_schemes.update_one(
                {"user_id": user_id},
                {"$pull": {"schemes": scheme_name}}
            )
            return True

        # In-memory fallback
        if user_id in self._demo_saved_schemes and scheme_name in self._demo_saved_schemes[user_id]:
            self._demo_saved_schemes[user_id].remove(scheme_name)
        return True

    async def get_saved_schemes(self, user_id: str) -> list[str]:
        if self._db is not None:
            doc = await self._db.saved_schemes.find_one({"user_id": user_id})
            return doc.get("schemes", []) if doc else []

        # In-memory fallback
        return self._demo_saved_schemes.get(user_id, [])

    async def save_user_profile(self, user_id: str, profile: dict[str, Any]) -> bool:
        if self._db is not None:
            await self._db.users.update_one(
                {"_id": user_id},
                {"$set": {"profile": profile}},
                upsert=True,
            )
            return True

        if not hasattr(self, "_demo_user_profiles"):
            self._demo_user_profiles: dict[str, dict[str, Any]] = {}
        self._demo_user_profiles[user_id] = profile
        return True

    async def save_audit_log(self, user_id: str | None, action: str, details: dict[str, Any] | None = None) -> str:
        document = {
            "user_id": user_id,
            "action": action,
            "details": details or {},
            "created_at": datetime.now(UTC),
        }
        if self._db is not None:
            result = await self._db.audit_logs.insert_one(document)
            return str(result.inserted_id)
        
        # In-memory fallback
        import secrets
        doc_id = secrets.token_hex(12)
        document["_id"] = doc_id
        if not hasattr(self, "_demo_audit_logs"):
            self._demo_audit_logs = []
        self._demo_audit_logs.append(document)
        return doc_id

    async def get_audit_logs(self) -> list[dict[str, Any]]:
        if self._db is not None:
            cursor = self._db.audit_logs.find({}).sort("created_at", -1)
            results = []
            async for doc in cursor:
                doc["_id"] = str(doc["_id"])
                if "created_at" in doc and isinstance(doc["created_at"], datetime):
                    doc["created_at"] = doc["created_at"].isoformat()
                results.append(doc)
            return results

        # In-memory fallback
        if not hasattr(self, "_demo_audit_logs"):
            self._demo_audit_logs = []
        results = []
        for doc in reversed(self._demo_audit_logs):
            formatted = dict(doc)
            if "created_at" in formatted and isinstance(formatted["created_at"], datetime):
                formatted["created_at"] = formatted["created_at"].isoformat()
            results.append(formatted)
        return results


mongo_manager = MongoManager()

