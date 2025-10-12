# Quick Start Guide

Get up and running with the Stock Analysis Tool in 5 minutes!

## Prerequisites

- Docker & Docker Compose
- Node.js 20.19+ (for local React development)
- Groq API Key ([Get one here](https://console.groq.com))

## Fast Track: Using Docker

### 1. Clone and Setup

```bash
git clone <your-repo-url>
cd stock-market-analysis-ai/stock-market-analysis-ai
```

### 2. Create Environment File

Create `.env` file in the root directory:

```env
GROQ_API_KEY=your_actual_groq_api_key_here
```

### 3. Start Everything

```bash
docker-compose up --build
```

### 4. Access Applications

- **React Frontend (Modern):** http://localhost:3000
- **Backend API:** http://localhost:8000
- **Streamlit (Legacy):** http://localhost:8501
- **API Docs:** http://localhost:8000/docs

## Development Mode (React Frontend)

For faster development with hot-reload:

### 1. Start Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

Backend will run on http://localhost:8000

### 2. Start React Frontend

In a new terminal:

```bash
cd frontend-react

# Create .env file
echo "VITE_BACKEND_URL=http://localhost:8000" > .env

# Install dependencies
npm install

# Start dev server
npm run dev
```

Frontend will run on http://localhost:5173

## First Steps

### Try the React Frontend

1. Open http://localhost:3000 (or :5173 in dev mode)
2. You'll see the **Trending Stocks** page with:
   - Top movers in the last 5 days
   - Most active stocks
   - Sector performance chart
3. Click **"Analyze"** on any stock card
4. Or navigate to **Stock Analysis** page and enter a symbol like:
   - `RELIANCE`
   - `TCS`
   - `INFY`
   - `HDFCBANK`

### API Testing

Test the backend directly:

```bash
# Health check
curl http://localhost:8000/health

# Get trending stocks
curl http://localhost:8000/trending

# Analyze a stock
curl http://localhost:8000/analyze/RELIANCE
```

## Common Stock Symbols to Try

### Top Indian Stocks
- `RELIANCE` - Reliance Industries
- `TCS` - Tata Consultancy Services
- `INFY` - Infosys
- `HDFCBANK` - HDFC Bank
- `ICICIBANK` - ICICI Bank
- `HINDUNILVR` - Hindustan Unilever
- `ITC` - ITC Limited
- `SBIN` - State Bank of India
- `BHARTIARTL` - Bharti Airtel
- `KOTAKBANK` - Kotak Mahindra Bank

## Features to Explore

### 1. Trending Stocks Page
- View real-time top movers
- See most active stocks by volume
- Interactive sector performance chart
- One-click navigation to detailed analysis

### 2. Stock Analysis Page
- **Stock Data Tab:** Current price, volume, market cap, PE ratio, 52-week high/low
- **Technical Analysis Tab:** SMA20, SMA50, RSI, trend indicators
- **News Tab:** Latest news with expandable details
- **AI Analysis Tab:** AI-generated insights with target price and stop loss

### 3. Dark Mode
- Click the sun/moon icon in the top-right corner
- Dark mode persists during your session

### 4. Mobile Experience
- Fully responsive design
- Touch-friendly buttons
- Collapsible sidebar
- Optimized layout for all screen sizes

## Troubleshooting

### Backend Issues

**Error: "GROQ_API_KEY not found"**
```bash
# Make sure .env file exists in the root directory
ls -la .env

# Check the content
cat .env

# Should show: GROQ_API_KEY=your_key
```

**Port 8000 already in use:**
```bash
# Find and kill the process
lsof -ti:8000 | xargs kill -9
```

### Frontend Issues

**React build errors:**
```bash
cd frontend-react
rm -rf node_modules dist
npm install
npm run build
```

**CORS errors:**
- Make sure backend is running
- Check `VITE_BACKEND_URL` in `.env`

### Docker Issues

**Containers not starting:**
```bash
# Stop all containers
docker-compose down

# Remove old volumes
docker-compose down -v

# Rebuild
docker-compose up --build
```

**Check logs:**
```bash
docker-compose logs backend
docker-compose logs frontend-react
```

## Next Steps

1. **Customize the UI:** Edit components in `frontend-react/src/components/`
2. **Add more features:** Extend the backend API in `backend/main.py`
3. **Deploy to production:** Follow deployment guide in main README
4. **Configure environment:** Update `.env` for your environment

## Getting Help

- Check the main README.md for detailed documentation
- Review the frontend-react/README.md for React-specific info
- Open an issue on GitHub
- Check API documentation at http://localhost:8000/docs

## Tips

- Use the browser's DevTools to inspect network requests
- Check browser console for frontend errors
- Use `docker-compose logs -f` to watch logs in real-time
- Press `Ctrl+C` to stop the development servers

---

Happy analyzing! 📊🚀

