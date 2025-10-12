# Stock Analysis Frontend

A modern, responsive React TypeScript frontend for the Indian Stock Market Analysis Tool.

## Tech Stack

- **React 18** with TypeScript
- **Vite** for fast builds and HMR
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **TanStack Query** (React Query) for data fetching
- **React Router** for navigation
- **Recharts** for data visualization
- **Lucide React** for icons
- **Axios** for API calls

## Features

- 📊 **Trending Stocks** - View top movers and most active stocks
- 📈 **Stock Analysis** - Deep dive into individual stock performance
- 🎨 **Dark Mode** - Toggle between light and dark themes
- 📱 **Responsive Design** - Mobile-first approach with beautiful UI
- ⚡ **Fast Performance** - Optimized builds with code splitting
- 🎭 **Smooth Animations** - Delightful user experience with Framer Motion

## Getting Started

### Prerequisites

- Node.js 20.19+ or 22.12+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Create environment file (optional)
# Copy .env.example to .env and update VITE_BACKEND_URL if needed
```

### Environment Variables

Create a `.env` file in the root directory:

```env
VITE_BACKEND_URL=http://localhost:8000
```

For production:

```env
VITE_BACKEND_URL=https://stock-analysis-agent.onrender.com
```

### Development

```bash
# Start development server
npm run dev

# Server will start at http://localhost:5173
```

### Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## Docker

### Build Docker Image

```bash
docker build -t stock-frontend .
```

### Run Docker Container

```bash
docker run -p 80:80 stock-frontend
```

## Project Structure

```
src/
├── components/
│   ├── layout/          # Layout components (Navbar, Sidebar, Layout)
│   ├── trending/        # Trending page components
│   ├── analysis/        # Analysis page components
│   └── ui/              # Reusable UI components
├── pages/               # Page components
├── context/             # React Context providers
├── hooks/               # Custom React hooks
├── services/            # API service layer
├── types/               # TypeScript type definitions
├── utils/               # Utility functions
├── App.tsx              # Main App component
└── main.tsx             # Entry point
```

## API Integration

The frontend communicates with the FastAPI backend through the following endpoints:

- `GET /trending` - Fetch trending stocks
- `GET /analyze/{symbol}` - Analyze specific stock

## Contributing

1. Follow the existing code structure
2. Use TypeScript strictly (no `any` types)
3. Follow mobile-first responsive design principles
4. Add animations using Framer Motion
5. Ensure accessibility (ARIA labels, keyboard navigation)

## License

MIT
