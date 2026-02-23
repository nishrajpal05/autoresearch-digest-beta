import os
import requests

XAI_API_KEY = os.getenv("XAI_API_KEY")
BASE_URL = "https://api.x.ai/v1/chat/completions"


def simplify_abstract(title: str, abstract: str) -> dict:
    if not XAI_API_KEY:
        return {
            "success": False,
            "error": "XAI_API_KEY environment variable not set"
        }

    prompt = f"""You are explaining research to a curious non-technical person.

Paper Title: {title}

Abstract: {abstract}

Provide:
1. Simple Explanation (2-3 sentences, no jargon)
2. Real-World Application (1 example)
3. Key Insight (1 sentence)

Keep it conversational and engaging."""

    headers = {
        "Authorization": f"Bearer {XAI_API_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": "grok-beta",
        "messages": [
            {"role": "system", "content": "You simplify research papers for non-technical audiences."},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.7,
        "max_tokens": 500
    }

    try:
        response = requests.post(BASE_URL, headers=headers, json=payload)
        response.raise_for_status()
        data = response.json()

        return {
            "success": True,
            "simplified": data["choices"][0]["message"]["content"]
        }

    except requests.exceptions.RequestException as e:
        return {
            "success": False,
            "error": str(e)
        }
