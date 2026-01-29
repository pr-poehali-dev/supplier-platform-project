"""JWT token utilities for user authentication."""
import os
import jwt
from datetime import datetime, timedelta


JWT_SECRET = os.environ.get('JWT_SECRET')
JWT_ALGORITHM = 'HS256'


def create_access_token(user_id: int, email: str) -> str:
    """
    Create JWT access token for user authentication.
    
    Args:
        user_id: User ID
        email: User email
    
    Returns:
        Encoded JWT access token (valid for 1 hour)
    """
    payload = {
        'sub': str(user_id),  # JWT spec requires sub to be a string
        'email': email,
        'type': 'access',
        'exp': datetime.utcnow() + timedelta(hours=1),
        'iat': datetime.utcnow()
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def create_refresh_token(user_id: int, email: str) -> str:
    """
    Create JWT refresh token for token renewal.
    
    Args:
        user_id: User ID
        email: User email
    
    Returns:
        Encoded JWT refresh token (valid for 30 days)
    """
    payload = {
        'sub': str(user_id),  # JWT spec requires sub to be a string
        'email': email,
        'type': 'refresh',
        'exp': datetime.utcnow() + timedelta(days=30),
        'iat': datetime.utcnow()
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_access_token(auth_header: str) -> dict:
    """
    Decode JWT access token from Authorization header.
    
    Args:
        auth_header: Authorization header value (e.g. "Bearer eyJ...")
    
    Returns:
        Decoded token payload with 'sub' (user_id), 'email', 'type'
    
    Raises:
        ValueError: If token is invalid or expired
    """
    if not auth_header or not auth_header.startswith('Bearer '):
        raise ValueError('Missing or invalid Authorization header')
    
    token = auth_header[7:]  # Remove "Bearer " prefix
    
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get('type') != 'access':
            raise ValueError('Invalid token type')
        return payload
    except jwt.ExpiredSignatureError:
        raise ValueError('Token expired')
    except jwt.InvalidTokenError:
        raise ValueError('Invalid token')


def decode_refresh_token(token: str) -> dict:
    """
    Decode JWT refresh token.
    
    Args:
        token: Refresh token string
    
    Returns:
        Decoded token payload
    
    Raises:
        ValueError: If token is invalid or expired
    """
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get('type') != 'refresh':
            raise ValueError('Invalid token type')
        return payload
    except jwt.ExpiredSignatureError:
        raise ValueError('Refresh token expired')
    except jwt.InvalidTokenError:
        raise ValueError('Invalid refresh token')