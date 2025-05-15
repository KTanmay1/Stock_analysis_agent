"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaChartLine, FaSearch, FaHome, FaChartPie, FaChartBar, FaNewspaper } from "react-icons/fa";
import { BsCurrencyDollar } from "react-icons/bs";

const Sidebar = () => {
  const pathname = usePathname();

  const navItems = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: <FaHome className="h-5 w-5" />,
    },
    {
      label: "Stocks",
      href: "/stocks",
      icon: <BsCurrencyDollar className="h-5 w-5" />,
    },
    {
      label: "Search",
      href: "/search",
      icon: <FaSearch className="h-5 w-5" />,
    },
    {
      label: "Technical Analysis",
      href: "/analysis",
      icon: <FaChartPie className="h-5 w-5" />,
    },
    {
      label: "Market Movers",
      href: "/movers",
      icon: <FaChartBar className="h-5 w-5" />,
    },
    {
      label: "News",
      href: "/news",
      icon: <FaNewspaper className="h-5 w-5" />,
    },
  ];

  return (
    <div className="hidden md:flex flex-col w-64 h-screen fixed border-r border-gray-200 dark:border-gray-800">
      <div className="px-6 py-6">
        <Link href="/" className="flex items-center gap-2">
          <FaChartLine className="h-6 w-6 text-blue-600" />
          <span className="text-xl font-bold text-gray-900 dark:text-white">StockAI</span>
        </Link>
      </div>

      <div className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg ${
              pathname === item.href
                ? "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400"
                : "text-gray-700 hover:text-blue-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-blue-400 dark:hover:bg-gray-800"
            }`}
          >
            <div className="mr-3">{item.icon}</div>
            <span>{item.label}</span>
          </Link>
        ))}
      </div>

      <div className="p-4 border-t border-gray-200 dark:border-gray-800">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
              AI
            </div>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-900 dark:text-white">StockAI Assistant</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">AI-Powered Analysis</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar; 