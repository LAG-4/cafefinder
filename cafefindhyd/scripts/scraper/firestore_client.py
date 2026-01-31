from __future__ import annotations

import os
from typing import Optional

import firebase_admin
from firebase_admin import credentials, firestore


def get_firestore_client(credentials_path: Optional[str] = None) -> firestore.Client:
    if not firebase_admin._apps:
        credential_path = credentials_path or os.getenv(
            "FIREBASE_ADMIN_CREDENTIALS",
            os.getenv("GOOGLE_APPLICATION_CREDENTIALS"),
        )
        if credential_path:
            firebase_admin.initialize_app(credentials.Certificate(credential_path))
        else:
            firebase_admin.initialize_app()

    return firestore.client()


def server_timestamp() -> firestore.SERVER_TIMESTAMP:
    return firestore.SERVER_TIMESTAMP
