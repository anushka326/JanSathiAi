import json
import logging
import math
from pathlib import Path
from typing import Any
import google.generativeai as genai

from config import get_settings
from services.scheme_repository import get_scheme_repository

logger = logging.getLogger("jansathi.rag")


class RAGService:
    def __init__(self) -> None:
        self.repository = get_scheme_repository()
        settings = get_settings()
        self.api_key = settings.gemini_api_key
        self.cache_path = settings.chroma_persist_dir / "embeddings_cache.json"
        
        # Ensure directories exist
        settings.chroma_persist_dir.mkdir(parents=True, exist_ok=True)
        
        if self.api_key:
            try:
                genai.configure(api_key=self.api_key)
                logger.info("RAG Service initialized with Gemini embeddings")
            except Exception as e:
                logger.error("Failed to configure generative AI: %s", str(e))
                self.api_key = None
        
        self.embeddings_cache: dict[str, list[float]] = {}
        self._load_cache()
        self._initialize_index()

    def _load_cache(self) -> None:
        if self.cache_path.exists():
            try:
                with self.cache_path.open("r", encoding="utf-8") as f:
                    self.embeddings_cache = json.load(f)
                logger.info("Loaded %d embeddings from cache", len(self.embeddings_cache))
            except Exception as e:
                logger.error("Failed to load embeddings cache: %s", str(e))

    def _save_cache(self) -> None:
        try:
            with self.cache_path.open("w", encoding="utf-8") as f:
                json.dump(self.embeddings_cache, f, indent=2, ensure_ascii=False)
            logger.info("Saved %d embeddings to cache", len(self.embeddings_cache))
        except Exception as e:
            logger.error("Failed to save embeddings cache: %s", str(e))

    def _build_chunk(self, scheme: Any) -> str:
        """Constructs a rich text block representing the scheme for embedding."""
        return (
            f"Scheme Name: {scheme.scheme_name}\n"
            f"Category: {scheme.category}\n"
            f"State: {scheme.state}\n"
            f"Summary: {scheme.summary}\n"
            f"Benefits: {scheme.benefit}\n"
            f"Eligibility: {', '.join(scheme.eligibility)}\n"
            f"Required Documents: {', '.join(scheme.documents)}\n"
            f"Application Process: {scheme.application_process}\n"
            f"Keywords: {', '.join(scheme.keywords)}"
        )

    def _initialize_index(self) -> None:
        """Embeds all schemes on startup if they are not already in cache and key is present."""
        if not self.api_key:
            return

        schemes = self.repository.list_schemes()
        dirty = False
        
        for scheme in schemes:
            if scheme.scheme_name not in self.embeddings_cache:
                chunk = self._build_chunk(scheme)
                try:
                    logger.info("Computing embedding for scheme: %s", scheme.scheme_name)
                    result = genai.embed_content(
                        model="models/text-embedding-004",
                        content=chunk,
                        task_type="retrieval_document"
                    )
                    self.embeddings_cache[scheme.scheme_name] = result["embedding"]
                    dirty = True
                except Exception as e:
                    logger.error("Failed embedding scheme %s: %s", scheme.scheme_name, str(e))
                    
        if dirty:
            self._save_cache()

    def _cosine_similarity(self, vec1: list[float], vec2: list[float]) -> float:
        dot_product = sum(a * b for a, b in zip(vec1, vec2))
        norm_a = math.sqrt(sum(a * a for a in vec1))
        norm_b = math.sqrt(sum(b * b for b in vec2))
        if norm_a == 0 or norm_b == 0:
            return 0.0
        return dot_product / (norm_a * norm_b)

    def search(self, query: str, top_k: int = 3) -> list[dict[str, Any]]:
        """
        Retrieves top_k schemes matching the search query.
        Uses Gemini embeddings if API key is active, falls back to token matching.
        """
        normalized_query = query.lower().strip()
        schemes = self.repository.list_schemes()
        
        if not normalized_query:
            # Return defaults
            return [self._format_scheme(s) for s in schemes[:top_k]]

        # Try to use semantic search with Gemini
        if self.api_key and len(self.embeddings_cache) > 0:
            try:
                res = genai.embed_content(
                    model="models/text-embedding-004",
                    content=query,
                    task_type="retrieval_query"
                )
                query_vec = res["embedding"]
                
                scores = []
                for s in schemes:
                    if s.scheme_name in self.embeddings_cache:
                        sim = self._cosine_similarity(query_vec, self.embeddings_cache[s.scheme_name])
                        
                        # Add a small lexical boost if query matches words in name directly
                        if normalized_query in s.scheme_name.lower():
                            sim += 0.15
                        scores.append((sim, s))
                    else:
                        # Backup keyword score
                        scores.append((self._keyword_score(normalized_query, s) / 100.0, s))
                
                scores.sort(key=lambda x: x[0], reverse=True)
                return [self._format_scheme(item[1]) for item in scores[:top_k]]
                
            except Exception as e:
                logger.error("Semantic search failed; falling back to lexical search: %s", str(e))

        # Fallback Lexical Search (TF-IDF token match approximation)
        scores = []
        for s in schemes:
            score = self._keyword_score(normalized_query, s)
            if score > 0:
                scores.append((score, s))
                
        scores.sort(key=lambda x: x[0], reverse=True)
        
        # Fallback to first few if no keyword matches at all
        if not scores:
            return [self._format_scheme(s) for s in schemes[:top_k]]
            
        return [self._format_scheme(item[1]) for item in scores[:top_k]]

    def _keyword_score(self, query: str, scheme: Any) -> float:
        score = 0.0
        # Boost for direct matches
        if query in scheme.scheme_name.lower():
            score += 50.0
        if query in scheme.summary.lower():
            score += 20.0
            
        # Token matching
        query_tokens = set(query.split())
        scheme_text = (
            scheme.scheme_name + " " +
            scheme.summary + " " +
            scheme.benefit + " " +
            " ".join(scheme.eligibility) + " " +
            " ".join(scheme.keywords)
        ).lower()
        
        matches = sum(1.0 for token in query_tokens if token in scheme_text and len(token) > 2)
        score += matches * 10.0
        return score

    def _format_scheme(self, s: Any) -> dict[str, Any]:
        return {
            "scheme_name": s.scheme_name,
            "summary": s.summary,
            "benefit": s.benefit,
            "eligibility": ", ".join(s.eligibility),
            "documents": ", ".join(s.documents),
            "application_process": s.application_process,
            "official_website": str(s.official_website),
        }
