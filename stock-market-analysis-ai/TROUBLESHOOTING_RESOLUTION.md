# Troubleshooting Resolution - Docker Networking & CORS Issues

## 🔍 Root Causes Identified

After thorough investigation, **TWO critical issues** were found:

### Issue #1: Docker Networking Mismatch
**Problem:** The React app was built with `VITE_BACKEND_URL=http://backend:8000`
- `backend` is a Docker internal hostname that only works **inside** the Docker network
- When accessing the React app from a browser on the host machine (`http://localhost:3000`), the browser tries to call `http://backend:8000`
- The browser can't resolve "backend" → **timeout error**

**Why This Happens:**
```
Docker Network:    backend ✅ → resolves to backend container
Host Machine:      backend ❌ → hostname doesn't exist
```

**Solution:** Build the React app with `http://localhost:8000` for browser access

### Issue #2: Missing CORS Configuration
**Problem:** FastAPI backend had no CORS middleware configured
- Browsers enforce Same-Origin Policy
- Requests from `http://localhost:3000` (React) to `http://localhost:8000` (Backend) are cross-origin
- Without CORS headers, browser blocks the requests

**Solution:** Added CORS middleware to FastAPI backend

---

## ✅ Fixes Applied

### Fix #1: Updated docker-compose.yml

**File:** `/docker-compose.yml`

**Changed:**
```yaml
frontend-react:
  build:
    context: ./frontend-react
    args:
      VITE_BACKEND_URL: http://localhost:8000  # ✅ Changed from http://backend:8000
```

**Why:** Vite embeds environment variables at **build time**. The React app needs to use `localhost:8000` because:
1. It's accessed from the host browser
2. The browser runs on the host machine
3. Port 8000 is exposed to localhost via Docker port mapping

### Fix #2: Added CORS Middleware

**File:** `/backend/main.py`

**Added:**
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**Why:** This allows the React app to make cross-origin requests to the API

---

## 🧪 Verification Steps

### 1. Check Embedded URL
```bash
docker exec stock-analysis-frontend-react sh -c "cat /usr/share/nginx/html/assets/index-*.js | grep -o 'localhost:8000' | head -1"
# Output: localhost:8000 ✅
```

### 2. Test Backend Health
```bash
curl http://localhost:8000/health
# Output: {"status":"API is running fine."} ✅
```

### 3. Test Trending Endpoint
```bash
curl http://localhost:8000/trending
# Should return JSON with stock data ✅
```

### 4. Check All Containers
```bash
docker-compose ps
# All should be "Up" ✅
```

---

## 🎯 How to Test the Fix

1. **Open Browser** → Navigate to `http://localhost:3000`

2. **Clear Browser Cache** (Important!)
   - **Chrome/Edge:** Press `Ctrl+Shift+Delete` (Win) or `Cmd+Shift+Delete` (Mac)
   - Or **Hard Refresh:** `Ctrl+Shift+R` (Win) or `Cmd+Shift+R` (Mac)

3. **You Should See:**
   - ✅ Trending Stocks page loads
   - ✅ Top movers with stock data
   - ✅ Sector performance chart
   - ✅ No timeout errors

4. **Test Stock Analysis:**
   - Click "Analyze" on any stock card
   - Or navigate to `/analyze` and search for a stock (e.g., "RELIANCE")
   - Should show complete analysis in tabs

---

## 📊 Understanding the Architecture

### Docker Network Communication

```
┌─────────────────────────────────────────────────────────────┐
│                    Docker Network                            │
│                                                              │
│  ┌──────────────┐                    ┌──────────────┐       │
│  │   Backend    │◄───internal────────│   Frontend   │       │
│  │   :8000      │    (http://backend:8000)  (nginx)  │       │
│  └──────┬───────┘                    └──────────────┘       │
│         │                                                    │
└─────────┼────────────────────────────────────────────────────┘
          │ Port mapping
          │ 8000:8000
          ▼
┌─────────────────────────────────────────────────────────────┐
│                    Host Machine                              │
│                                                              │
│  ┌──────────────┐         Browser makes API calls          │
│  │   Browser    │────────────────────────────────►          │
│  │ localhost:3000  http://localhost:8000                    │
│  └──────────────┘                                           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Key Points:

1. **Inside Docker Network:**
   - Containers can communicate using container names
   - `backend` resolves to the backend container IP
   - Used by Streamlit frontend (runs inside Docker)

2. **From Host Browser:**
   - Must use `localhost` or `127.0.0.1`
   - Docker port mapping exposes 8000 → localhost:8000
   - Used by React frontend (JavaScript runs in browser)

3. **Why Two Different URLs?**
   - Streamlit (container-to-container): `http://backend:8000`
   - React (browser-to-host): `http://localhost:8000`

---

## 🚀 Production Deployment Considerations

For production, you should:

### 1. **Use Environment-Specific URLs**

Create `.env.production`:
```env
VITE_BACKEND_URL=https://your-api-domain.com
```

### 2. **Restrict CORS Origins**

Update `backend/main.py`:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://your-frontend-domain.com",
        "http://localhost:3000",  # For development
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 3. **Use Same Domain (Best Practice)**

Deploy both frontend and backend under the same domain:
```
Frontend: https://yourdomain.com
Backend:  https://yourdomain.com/api
```

Use nginx reverse proxy to route `/api/*` to backend.

---

## 🔧 Common Issues & Solutions

### Issue: "Still getting timeout errors"

**Solution:**
1. Hard refresh browser (Cmd+Shift+R / Ctrl+Shift+R)
2. Clear browser cache completely
3. Check browser console for actual error
4. Verify backend is running: `curl http://localhost:8000/health`

### Issue: "CORS errors in console"

**Solution:**
1. Verify backend has CORS middleware
2. Restart backend: `docker-compose restart backend`
3. Check `allow_origins` includes your frontend URL

### Issue: "Network error / Failed to fetch"

**Solution:**
1. Check backend is accessible: `curl http://localhost:8000/health`
2. Check backend logs: `docker-compose logs backend`
3. Verify port 8000 is not used by another process

### Issue: "React app shows blank page"

**Solution:**
1. Check browser console for JavaScript errors
2. Verify all assets loaded: Check Network tab in DevTools
3. Rebuild frontend: `docker-compose up --build frontend-react`

---

## 📝 Lessons Learned

1. **Vite Environment Variables:**
   - Embedded at **build time**, not runtime
   - Must rebuild container to change backend URL
   - Use build args in Docker for flexibility

2. **Docker Networking:**
   - Container names work inside Docker network only
   - Use localhost for browser access from host
   - Different URLs for internal vs external access

3. **CORS Configuration:**
   - Always required for browser-based frontends
   - FastAPI doesn't include CORS by default
   - Use `CORSMiddleware` from `fastapi.middleware.cors`

4. **Browser Caching:**
   - JavaScript bundles are aggressively cached
   - Always hard refresh after rebuilding
   - Use cache-busting techniques in production

---

## ✅ Final Checklist

- [x] React app built with `http://localhost:8000`
- [x] CORS middleware added to FastAPI
- [x] All containers running
- [x] Backend accessible from host
- [x] Frontend serving correctly
- [x] Hard refresh browser to clear cache

---

## 🎉 Result

The React TypeScript frontend should now:
- ✅ Load without timeout errors
- ✅ Fetch trending stocks successfully
- ✅ Display stock analysis correctly
- ✅ Handle all API calls properly
- ✅ Work seamlessly with the backend

**Test it:** http://localhost:3000

---

**Last Updated:** October 12, 2025
**Status:** ✅ Resolved

