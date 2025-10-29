#!/usr/bin/env python3
"""
Railway startup script that properly handles PORT environment variable
"""
import os
import sys
import subprocess

# Get PORT from environment, default to 8000
port = os.getenv('PORT', '8000')

try:
    port_int = int(port)
except ValueError:
    print(f"ERROR: Invalid PORT value: {port}", file=sys.stderr)
    sys.exit(1)

# Start uvicorn with proper port
cmd = [
    'uvicorn',
    'main:app',
    '--host', '0.0.0.0',
    '--port', str(port_int),
    '--workers', '1'
]

print(f"Starting server on port {port_int}...")
os.execvp('uvicorn', cmd)
