import Link from "next/link";
import { redirect } from "next/navigation";
import Image from "next/image";
import { FaChartLine, FaRobot, FaChartPie, FaSearch, FaArrowRight } from "react-icons/fa";

export default function Home() {
  // Add a redirect for users who need to get straight to the dashboard
  // Comment this out to show the landing page instead
  // redirect("/dashboard");
  
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Navigation */}
      <header className="px-4 lg:px-8 h-16 flex items-center justify-between fixed w-full bg-white/90 dark:bg-gray-950/90 backdrop-blur-md z-10 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <FaChartLine className="h-6 w-6 text-blue-600" />
          <span className="text-xl font-bold text-gray-900 dark:text-white">StockAI</span>
        </div>
        <nav className="hidden md:flex items-center space-x-6">
          <Link href="/dashboard" className="text-sm font-medium text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400">
            Dashboard
          </Link>
          <Link href="/stocks" className="text-sm font-medium text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400">
            Stocks
          </Link>
          <Link href="/search" className="text-sm font-medium text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400">
            Search
          </Link>
          <Link href="/analysis" className="text-sm font-medium text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400">
            Analysis
          </Link>
        </nav>
        <div>
          <Link 
            href="/dashboard" 
            className="rounded-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 text-sm"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-24 md:pt-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center space-y-8 pb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white">
            AI-Powered <span className="text-blue-600">Stock Analysis</span> Made Simple
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Get real-time insights, technical analysis, and market trends powered by advanced AI to make better investment decisions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link
              href="/dashboard"
              className="rounded-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 text-base flex items-center justify-center gap-2"
            >
              Explore Dashboard <FaArrowRight />
            </Link>
            <Link
              href="/search"
              className="rounded-full border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-900 dark:text-white font-medium py-3 px-6 text-base flex items-center justify-center gap-2"
            >
              Search Stocks <FaSearch />
            </Link>
          </div>
        </div>

        {/* Mock dashboard preview */}
        <div className="relative w-full h-[400px] md:h-[600px] rounded-lg shadow-2xl overflow-hidden bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-black/40 z-10"></div>
          <div className="relative z-20 text-center p-8">
            <FaChartLine className="h-16 w-16 text-blue-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">StockAI Dashboard</h2>
            <p className="text-blue-100 max-w-lg mx-auto">
              Real-time data, AI-powered insights, and intuitive charts to help you make informed investment decisions.
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white">
          Powerful Features for Smart Investing
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-md">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
              <FaChartLine className="text-blue-600 dark:text-blue-400 w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Real-time Market Data</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Get up-to-the-minute stock prices, market trends, and key financial metrics for informed decision making.
            </p>
          </div>
          <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-md">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
              <FaChartPie className="text-blue-600 dark:text-blue-400 w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Advanced Technical Analysis</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Comprehensive technical indicators and chart patterns to help identify potential entry and exit points.
            </p>
          </div>
          <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-md">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
              <FaRobot className="text-blue-600 dark:text-blue-400 w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">AI-Powered Insights</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Our AI analyzes market conditions, news sentiment, and technical signals to provide actionable recommendations.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="bg-blue-600 rounded-2xl p-8 md:p-12 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Transform Your Investment Strategy?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
            Join thousands of investors who are leveraging the power of AI to make smarter investment decisions.
          </p>
          <Link
            href="/dashboard"
            className="inline-block rounded-full bg-white hover:bg-gray-100 text-blue-600 font-medium py-3 px-8 text-lg"
          >
            Get Started Now
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 sm:px-6 lg:px-8 border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center gap-2 mb-4 md:mb-0">
            <FaChartLine className="h-5 w-5 text-blue-600" />
            <span className="text-lg font-bold text-gray-900 dark:text-white">StockAI</span>
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            © {new Date().getFullYear()} StockAI. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
