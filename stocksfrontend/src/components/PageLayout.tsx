"use client";

import React from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

interface PageLayoutProps {
  children: React.ReactNode;
}

const PageLayout: React.FC<PageLayoutProps> = ({ children }) => {
  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Sidebar for larger screens */}
      <Sidebar />
      
      {/* Main content area */}
      <div className="flex-1 md:ml-64">
        {/* Top navigation */}
        <Navbar />
        
        {/* Page content with proper padding for navbar */}
        <main className="px-4 pt-20 pb-8 md:px-8 md:pt-20">
          {children}
        </main>
      </div>
    </div>
  );
};

export default PageLayout; 