from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response: Response = await call_next(request)
        
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        # Basic CSP: Allow self, allow inline scripts/styles (often needed for React/Next.js dev), 
        # but in a stricter prod env, inline should be avoided or used with nonces.
        # Allowing 'unsafe-inline' for style/script to ensure Next.js dev mode works smoothly without complex nonce setup for this lab.
        response.headers["Content-Security-Policy"] = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data:;"
        response.headers["Referrer-Policy"] = "no-referrer"
        
        # HSTS - Apply if the request is HTTPS or if we assume production runs behind an HTTPS proxy.
        # For local development on HTTP, this is usually ignored by browsers, but good to have.
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        
        return response
