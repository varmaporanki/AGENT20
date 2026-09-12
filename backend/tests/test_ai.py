"""
Unit tests for Groq AI research insight and score explanation endpoints.
Strictly mocks external Groq API calls to ensure deterministic, quota-free execution.
"""

import json
import pytest
from unittest.mock import MagicMock
from fastapi.testclient import TestClient

from app.routers import ai as ai_router_mod
from app.services.groq_service import (
    GroqService,
    GroqServiceUnavailableError,
    GroqBadResponseError,
)
from app.services.analytics_service import AnalyticsService
from tests.conftest import MockAnalyticsRepository


@pytest.fixture(scope="module")
def ai_client():
    """TestClient configured with mock analytics repository and test-controlled Groq service."""
    from app.main import app
    import app.db as db_mod

    # Use mock analytics repository containing benchmark faculty (EMP0002, EMP0003, EMP0007, EMP0014)
    mock_analytics_repo = MockAnalyticsRepository()
    mock_analytics_service = AnalyticsService(repository=mock_analytics_repo)
    ai_router_mod._analytics_service = mock_analytics_service

    # Prevent socket timeout on DB pool initialization during unit testing
    orig_init = db_mod.init_db_pool
    db_mod.init_db_pool = lambda: None

    with TestClient(app) as test_client:
        yield test_client

    db_mod.init_db_pool = orig_init


def test_01_ai_endpoint_missing_groq_api_key(ai_client: TestClient):
    """Verify AI endpoint returns controlled HTTP 503 when GROQ_API_KEY is not configured."""
    orig_key = ai_router_mod._groq_service.settings.GROQ_API_KEY
    orig_client = ai_router_mod._groq_service._client

    ai_router_mod._groq_service.settings.GROQ_API_KEY = None
    ai_router_mod._groq_service._client = None

    try:
        response = ai_client.post("/api/v1/ai/faculty/EMP0014/insight")
        assert response.status_code == 503
        data = response.json()
        assert "detail" in data
        assert "not configured" in data["detail"].lower()
    finally:
        ai_router_mod._groq_service.settings.GROQ_API_KEY = orig_key
        ai_router_mod._groq_service._client = orig_client


def test_02_ai_faculty_not_found(ai_client: TestClient):
    """Verify 404 when requesting AI insight for a nonexistent faculty member."""
    response = ai_client.post("/api/v1/ai/faculty/EMP9999/insight")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


def test_03_ai_invalid_employee_no_format(ai_client: TestClient):
    """Verify 400 Bad Request when employee_no contains invalid format."""
    response = ai_client.post("/api/v1/ai/faculty/E!/insight")
    assert response.status_code == 400
    assert "invalid employee number" in response.json()["detail"].lower()


def test_04_successful_ai_faculty_insight(ai_client: TestClient):
    """Verify successful faculty insight response with mocked Groq client."""
    mock_groq_response = {
        "summary": "Dr. Sneha Patel demonstrates exceptional research velocity in Biotechnology.",
        "strengths": [
            "100% placement of publications in Q1 and Q2 indexed venues (9 total papers).",
            "Competitive national funding through DBT sanctioned grant of 55.0 Lakhs INR.",
        ],
        "areas_for_improvement": [
            "Currently no active patent disclosures or filed intellectual property."
        ],
        "recommendations": [
            "Translate bioprocess research outputs into provisional patent disclosures.",
            "Expand doctoral student intake to build PhD supervision portfolio.",
        ],
        "evidence": [
            {
                "metric": "Final Score",
                "value": 78.0,
                "interpretation": "High overall deterministic research productivity score.",
            },
            {
                "metric": "Q1 Publications",
                "value": 4,
                "interpretation": "Top-tier publication quality in international peer-reviewed journals.",
            },
        ],
    }

    mock_client = MagicMock()
    mock_choice = MagicMock()
    mock_choice.message.content = json.dumps(mock_groq_response)
    mock_response = MagicMock()
    mock_response.choices = [mock_choice]
    mock_client.chat.completions.create.return_value = mock_response

    # Inject mock client into service
    ai_router_mod._groq_service = GroqService(client=mock_client)

    response = ai_client.post("/api/v1/ai/faculty/EMP0014/insight")
    assert response.status_code == 200
    data = response.json()

    assert data["employee_no"] == "EMP0014"
    assert data["evaluation_date"] == "2024-12-31"
    assert "Dr. Sneha Patel" in data["summary"]
    assert len(data["strengths"]) == 2
    assert len(data["areas_for_improvement"]) == 1
    assert len(data["recommendations"]) == 2
    assert len(data["evidence"]) == 2
    assert data["evidence"][0]["metric"] == "Final Score"
    assert data["evidence"][0]["value"] == 78.0
    assert "disclaimer" in data
    assert "AI-generated" in data["disclaimer"]


def test_05_successful_ai_score_explanation(ai_client: TestClient):
    """
    Verify explain-score endpoint combines authoritative PostgreSQL numerical fields
    with validated Groq narrative explanations.
    """
    mock_explanation_response = {
        "score_band_summary": "High-velocity research performance band with strong publication rigor.",
        "strongest_pillars": [
            "Publication quality (100.0/100) and external funding mobilization (100.0/100)."
        ],
        "weakest_pillars": [
            "Patent disclosures (0.0/100) and doctoral scholar guidance (0.0/100)."
        ],
        "workload_and_context_impact": "Career-stage startup equity multiplier of 1.20x applied for Assistant Professor with 3.0 years experience.",
        "peer_comparison": "Ranks 2nd of 6 within Biotechnology and 6th of 24 across the entire institution.",
        "recommendations": [
            "Initiate patent filings on novel biotechnology protocols."
        ],
    }

    mock_client = MagicMock()
    mock_choice = MagicMock()
    mock_choice.message.content = json.dumps(mock_explanation_response)
    mock_response = MagicMock()
    mock_response.choices = [mock_choice]
    mock_client.chat.completions.create.return_value = mock_response

    ai_router_mod._groq_service = GroqService(client=mock_client)

    response = ai_client.post("/api/v1/ai/faculty/EMP0014/explain-score")
    assert response.status_code == 200
    data = response.json()

    # Authoritative deterministic fields from database (EMP0014)
    assert data["employee_no"] == "EMP0014"
    assert data["department_code"] == "BIO"
    assert data["final_score"] == 78.0
    assert data["base_score"] == 61.9
    assert data["department_rank"] == 2
    assert data["institution_rank"] == 6
    assert data["publication_score"] == 100.0
    assert data["citation_score"] == 47.5
    assert data["patent_score"] == 0.0
    assert data["funding_score"] == 100.0
    assert data["phd_score"] == 0.0
    assert data["career_stage_multiplier"] == 1.20
    assert data["workload_multiplier"] == 1.05
    assert data["combined_adjustment"] == 1.26

    # Validated narrative fields from Groq
    assert "High-velocity" in data["score_band_summary"]
    assert len(data["strongest_pillars"]) == 1
    assert "Career-stage" in data["workload_and_context_impact"]
    assert "disclaimer" in data


def test_06_ai_malformed_groq_json_returns_502(ai_client: TestClient):
    """Verify malformed JSON from Groq returns a controlled HTTP 502 Bad Gateway."""
    mock_client = MagicMock()
    mock_choice = MagicMock()
    mock_choice.message.content = "NOT_A_VALID_JSON_STRING {{{[[["
    mock_response = MagicMock()
    mock_response.choices = [mock_choice]
    mock_client.chat.completions.create.return_value = mock_response

    ai_router_mod._groq_service = GroqService(client=mock_client)

    response = ai_client.post("/api/v1/ai/faculty/EMP0003/insight")
    assert response.status_code == 502
    assert "invalid insight structure" in response.json()["detail"].lower()


def test_07_ai_groq_timeout_returns_503(ai_client: TestClient):
    """Verify network/timeout errors from Groq return controlled HTTP 503."""
    mock_client = MagicMock()
    mock_client.chat.completions.create.side_effect = TimeoutError("Connection to Groq timed out")

    ai_router_mod._groq_service = GroqService(client=mock_client)

    response = ai_client.post("/api/v1/ai/faculty/EMP0003/insight")
    assert response.status_code == 503
    assert "timed out" in response.json()["detail"].lower()


def test_08_ai_prompt_uses_deterministic_data(ai_client: TestClient):
    """Verify Groq prompt receives authoritative deterministic metrics from analytics service."""
    mock_client = MagicMock()
    mock_choice = MagicMock()
    mock_choice.message.content = json.dumps({
        "summary": "Dr. Ananya Sharma shows high research quality.",
        "strengths": ["All 4 publications in Q1 journals."],
        "areas_for_improvement": ["No patents."],
        "recommendations": ["Explore patent filings."],
        "evidence": [
            {"metric": "Final Score", "value": 57.1, "interpretation": "Strong early-career score."}
        ],
    })
    mock_response = MagicMock()
    mock_response.choices = [mock_choice]
    mock_client.chat.completions.create.return_value = mock_response

    ai_router_mod._groq_service = GroqService(client=mock_client)

    response = ai_client.post("/api/v1/ai/faculty/EMP0003/insight")
    assert response.status_code == 200

    # Inspect the messages that were sent to Groq
    called_args = mock_client.chat.completions.create.call_args
    messages = called_args.kwargs["messages"]
    user_prompt = next(m["content"] for m in messages if m["role"] == "user")

    # Verify that authoritative PostgreSQL data for EMP0003 was passed to Groq
    assert "EMP0003" in user_prompt
    assert "57.1" in user_prompt  # Authoritative final score
    assert "45.3" in user_prompt  # Authoritative base score
    assert "CSE" in user_prompt
    assert "1.2" in user_prompt   # Career stage multiplier


def test_09_client_cannot_override_final_score(ai_client: TestClient):
    """Verify that client cannot supply, alter, or override the final score."""
    mock_client = MagicMock()
    mock_choice = MagicMock()
    mock_choice.message.content = json.dumps({
        "summary": "Summary text",
        "strengths": ["Strength 1"],
        "areas_for_improvement": ["Improvement 1"],
        "recommendations": ["Recommendation 1"],
        "evidence": [{"metric": "Score", "value": 16.3, "interpretation": "Low volume"}],
    })
    mock_response = MagicMock()
    mock_response.choices = [mock_choice]
    mock_client.chat.completions.create.return_value = mock_response

    ai_router_mod._groq_service = GroqService(client=mock_client)

    # Attempt to send client-injected numerical score via JSON body
    tampered_payload = {"final_score": 99.9, "department_rank": 1}
    response = ai_client.post("/api/v1/ai/faculty/EMP0002/insight", json=tampered_payload)
    assert response.status_code == 200

    # Verify prompt sent to Groq used the authoritative database score (16.3), ignoring client input
    messages = mock_client.chat.completions.create.call_args.kwargs["messages"]
    user_prompt = next(m["content"] for m in messages if m["role"] == "user")
    assert "16.3" in user_prompt
    assert "99.9" not in user_prompt


def test_10_api_key_never_exposed_in_response(ai_client: TestClient):
    """Verify secret API keys are never leaked in responses or error payloads."""
    secret_key = "gsk_SecretTestKeyNotForOutput12345"
    orig_key = ai_router_mod._groq_service.settings.GROQ_API_KEY
    ai_router_mod._groq_service.settings.GROQ_API_KEY = secret_key

    try:
        mock_client = MagicMock()
        mock_client.chat.completions.create.side_effect = Exception(f"Failed with key {secret_key}")
        ai_router_mod._groq_service = GroqService(client=mock_client)

        response = ai_client.post("/api/v1/ai/faculty/EMP0014/insight")
        # Response content must NOT contain the secret API key
        assert secret_key not in response.text
    finally:
        ai_router_mod._groq_service.settings.GROQ_API_KEY = orig_key
