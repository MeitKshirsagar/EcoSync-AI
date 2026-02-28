"""Tests for authentication and JWT secret configuration."""

import os
import pytest
from auth import create_access_token, SECRET_KEY
from config import Config


def test_jwt_secret_default_configuration():
    cfg = Config()
    assert cfg.JWT_SECRET_KEY is not None
    assert isinstance(cfg.JWT_SECRET_KEY, str)


def test_jwt_token_creation():
    token = create_access_token({"sub": "test@ecosync.ai"})
    assert isinstance(token, str)
    assert len(token) > 0
