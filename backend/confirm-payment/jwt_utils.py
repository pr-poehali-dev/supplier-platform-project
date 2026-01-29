"""JWT token utilities."""
import os
import jwt


JWT_SECRET = os.environ.get('JWT_SECRET')
JWT_ALGORITHM = 'HS256'


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


def get_user_id(auth_header: str) -> int:
    """
    Extract user_id from JWT token.
    
    Args:
        auth_header: Authorization header value
    
    Returns:
        user_id as integer
    
    Raises:
        ValueError: If token is invalid or user_id cannot be extracted
    """
    payload = decode_access_token(auth_header)
    user_id = payload.get('sub')
    if not user_id:
        raise ValueError('Missing user_id in token')
    return int(user_id)
