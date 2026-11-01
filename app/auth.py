import base64
import hashlib
import hmac
import json
import os
import time

from fastapi import HTTPException

# Prototype-only accounts. Change these before demonstrating.
DEMO_USERS = {
    "admin": {
        "password": "demo123",
        "role": "ADMIN",
    },
    "rb_officer": {
        "password": "demo123",
        "role": "RB",
    },
    "pgrc_officer": {
        "password": "demo123",
        "role": "PGRC",
    },
    "other_officer": {
        "password": "demo123",
        "role": "OTHER_BUREAU",
    },
    "regional": {
        "password": "demo123",
        "role": "REGIONAL",
    },
    "management": {
        "password": "demo123",
        "role": "MANAGEMENT",
    },
}

SECRET_KEY = os.getenv(
    "AICTE_DEMO_SECRET",
    "replace-this-demo-secret-before-deployment",
)


def encode_token(payload):
    raw = json.dumps(payload, separators=(",", ":")).encode()
    return base64.urlsafe_b64encode(raw).decode().rstrip("=")


def decode_token_part(value):
    padding = "=" * (-len(value) % 4)
    return base64.urlsafe_b64decode(value + padding)


def create_access_token(username, role):
    payload = {
        "sub": username,
        "role": role,
        "exp": int(time.time()) + 8 * 60 * 60,
    }

    encoded_payload = encode_token(payload)

    signature = hmac.new(
        SECRET_KEY.encode(),
        encoded_payload.encode(),
        hashlib.sha256,
    ).digest()

    encoded_signature = (
        base64.urlsafe_b64encode(signature).decode().rstrip("=")
    )

    return f"{encoded_payload}.{encoded_signature}"


def authenticate_user(username, password):
    user = DEMO_USERS.get(username)

    if not user or not hmac.compare_digest(
        user["password"], password
    ):
        return None

    return {
        "username": username,
        "role": user["role"],
    }


def get_user_from_token(token):
    try:
        encoded_payload, encoded_signature = token.split(".")

        expected_signature = hmac.new(
            SECRET_KEY.encode(),
            encoded_payload.encode(),
            hashlib.sha256,
        ).digest()

        supplied_signature = decode_token_part(encoded_signature)

        if not hmac.compare_digest(
            expected_signature, supplied_signature
        ):
            raise ValueError("Invalid signature")

        payload = json.loads(decode_token_part(encoded_payload))

        if payload["exp"] < int(time.time()):
            raise ValueError("Token expired")

        if payload["role"] not in {
            "RB", "PGRC", "OTHER_BUREAU",
            "REGIONAL", "MANAGEMENT", "ADMIN",
        }:
            raise ValueError("Invalid role")

        return payload

    except Exception:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired access token",
        )