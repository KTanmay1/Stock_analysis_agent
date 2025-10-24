# 📊 Indian Stock Market Analysis Tool

An AI-powered stock market analysis tool that provides real-time stock data, technical indicators, news sentiment analysis, and AI-generated insights for informed trading decisions. The tool integrates FastAPI (backend), **React TypeScript (modern frontend)**, Streamlit (legacy frontend), Groq AI API, and Docker for seamless deployment and operation.

## ✅ Table of Contents
1. [Overview](#overview)
2. [Features](#features)
3. [Architecture](#architecture)
4. [Setup Instructions](#setup-instructions)
5. [Environment Variables](#environment-variables)
6. [Available Endpoints](#available-endpoints)
7. [Frontend Interfaces](#frontend-interfaces)
8. [Deployment](#deployment)
9. [Troubleshooting](#troubleshooting)
10. [Future Improvements](#future-improvements)

## 📚 1. Overview

This project uses:
- **FastAPI** for backend stock analysis APIs
- **React + TypeScript + Vite** for modern, responsive frontend (NEW!)
- **Streamlit** for legacy interactive frontend
- **yfinance** for stock data
- **Groq AI** for AI-driven financial insights
- **Docker Compose** for container orchestration

## 🌟 2. Features
- 📈 **Real-Time Stock Data**: Fetch current price, day high/low, and trading volume
- 📊 **Technical Indicators**: Calculate SMA (Simple Moving Average) and RSI (Relative Strength Index)
- 🔥 **Trending Stocks**: View top movers and most active stocks in Indian market
- 📰 **News Sentiment Analysis**: Fetch the latest financial news from reliable sources
- 🤖 **AI Analysis**: Get AI-generated insights and recommendations with target prices
- 🎨 **Dark Mode**: Toggle between light and dark themes
- 📱 **Responsive Design**: Beautiful UI that works on all devices
- ⚡ **Fast Performance**: Optimized builds with code splitting and lazy loading
- ⚙️ **Dockerized Deployment**: Easy to deploy and scale with Docker

## 🛠️ 3. Architecture

```
stock-market-analysis-ai/
├── backend/
│   ├── main.py              # FastAPI entry point
│   ├── stock_agents.py      # Stock data and AI analysis logic
│   ├── utils.py             # Utility functions
│   ├── requirements.txt     # Backend dependencies
│   └── Dockerfile           # Backend Docker configuration
│
├── frontend-react/          # 🆕 Modern React TypeScript Frontend
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── services/        # API service layer
│   │   ├── types/           # TypeScript definitions
│   │   ├── context/         # React Context providers
│   │   └── utils/           # Utility functions
│   ├── public/
│   ├── package.json
│   ├── Dockerfile           # Frontend Docker configuration
│   ├── nginx.conf           # Nginx configuration
│   └── README.md            # Frontend documentation
│
├── frontend/                # Legacy Streamlit Frontend
│   ├── app_ui.py
│   ├── requirements.txt
│   └── Dockerfile
│
├── docker-compose.yml       # Docker Compose file
├── .env                     # Environment variables
└── README.md                # Documentation
```

## 📝 4. Setup Instructions

### 🔑 Prerequisites:
- Docker & Docker Compose installed
- Node.js 20.19+ (for React frontend development)
- Python 3.10+
- Valid Groq API Key

### 🔧 Steps to Run Locally:

#### Option 1: Using Docker Compose (Recommended)

1. **Clone the Repository:**
```bash
git clone https://github.com/yourusername/stock-market-analysis-ai.git
cd stock-market-analysis-ai/stock-market-analysis-ai
```

2. **Set Environment Variables:**
Create a `.env` file in the root folder:
```env
GROQ_API_KEY=your_groq_api_key
```

3. **Start All Services:**
```bash
docker-compose up --build
```

4. **Access the Applications:**
- Backend (FastAPI): http://localhost:8000
- **React Frontend**: http://localhost:3000 (Modern UI)
- Streamlit Frontend: http://localhost:8501 (Legacy UI)

#### Option 2: Run React Frontend in Development Mode

1. **Start Backend:**
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

2. **Start React Frontend:**
```bash
cd frontend-react
npm install
npm run dev
```

3. **Access:**
- Backend: http://localhost:8000
- React Frontend: http://localhost:5173

## 🔑 5. Environment Variables

### Backend (.env)
```env
GROQ_API_KEY=your_groq_api_key
```

### React Frontend (.env)
```env
VITE_BACKEND_URL=http://localhost:8000
```

For production:
```env
VITE_BACKEND_URL=https://stock-analysis-agent.onrender.com
```

## 🌐 6. Available Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Root endpoint |
| `/health` | GET | API health check |
| `/analyze/{symbol}` | GET | Analyze a stock symbol |
| `/trending` | GET | Get trending stocks and sector performance |
| `/test_ai` | GET | Test AI analysis directly |

## 💻 7. Frontend Interfaces

### 🆕 React TypeScript Frontend (Recommended)

**Tech Stack:**
- React 18 + TypeScript
- Vite for fast builds
- Tailwind CSS for styling
- Framer Motion for animations
- TanStack Query for data fetching
- Recharts for charts
- Lucide React for icons

**Features:**
1. **Trending Stocks Page:**
   - View top movers (5-day performance)
   - Most active stocks by volume
   - Interactive sector performance chart
   - Quick analyze buttons

2. **Stock Analysis Page:**
   - Search any stock symbol
   - Four-tab layout:
     - Stock Data (price, volume, PE ratio, etc.)
     - Technical Analysis (SMA, RSI, trends)
     - Recent News (expandable cards)
     - AI Analysis (with target price & stop loss)
   - Deep linking support
   - Real-time data fetching

3. **UI/UX:**
   - Dark mode toggle
   - Responsive design (mobile-first)
   - Smooth animations
   - Loading states
   - Error handling with retry

**Access:** http://localhost:3000 (Docker) or http://localhost:5173 (Dev mode)

### Legacy Streamlit Frontend

**Access:** http://localhost:8501

Simple interface with:
- Stock symbol input
- Tabbed analysis view
- Basic data visualization

## 🚀 8. Deployment

### 🔹 Deploy on Render (Recommended):

1. **Backend Deployment:**
   - Connect your GitHub repository to Render
   - Add Environment Variable: `GROQ_API_KEY`
   - Deploy as Web Service

2. **React Frontend Deployment:**
   - Build the React app: `npm run build`
   - Deploy dist folder to Render Static Site or use Docker

### 🔹 Manual Docker Deployment:

```bash
docker-compose down
docker-compose up --build -d
```

### 🔹 Production Build (React Frontend):

```bash
cd frontend-react
npm run build
# Serve the dist/ folder with nginx or any static server
```

## 🛡️ 9. Troubleshooting

### 🔄 Common Issues:

1. **Backend Not Reachable from Frontend:**
   - Update `VITE_BACKEND_URL` in `.env`
   - Check CORS settings in FastAPI backend

2. **Groq API Not Responding:**
   - Verify `GROQ_API_KEY` in `.env`
   - Check API rate limits

3. **React Build Errors:**
   - Ensure Node.js version is 20.19+ or 22.12+
   - Clear node_modules: `rm -rf node_modules && npm install`
   - Check Tailwind CSS configuration

4. **Check Docker Logs:**
```bash
docker-compose logs backend
docker-compose logs frontend-react
docker-compose logs frontend
```

## 🚀 10. Future Improvements
- 📉 Add more technical indicators (MACD, Bollinger Bands)
- 💬 Implement a chatbot interface for queries
- 📊 Enhanced AI analysis with portfolio recommendations
- 🌍 Support for international stock exchanges
- 🔔 Real-time price alerts and notifications
- 📈 Historical chart visualization with interactive candlesticks
- 🤖 Advanced sentiment analysis from social media
- 📱 Progressive Web App (PWA) support

## 🤝 11. Contributing

Contributions are welcome! To contribute:
1. Fork the repository
2. Create a feature branch: `git checkout -b feature-xyz`
3. Commit your changes: `git commit -m "Add new feature"`
4. Push to the branch: `git push origin feature-xyz`
5. Open a pull request

## 📜 12. License

This project is licensed under the MIT License.

## 📬 13. Contact
- **Author:** Tanmay Khandelwal
- **Email:** tanmaytushar21@gmail.com
- **GitHub:** https://github.com/yourusername

---

🚀 Built with love for AI, Finance, and Innovation. 💼📈🤖

If you found this tool useful, don't forget to ⭐ star the repo! 🌟
