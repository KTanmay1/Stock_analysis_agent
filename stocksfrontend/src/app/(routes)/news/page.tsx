"use client";

import React, { useState, useEffect } from "react";
import { Card, Title, Text, Tab, TabGroup, TabList, TabPanels, TabPanel } from "@tremor/react";
import SearchBar from "@/components/SearchBar";
import Link from "next/link";
import ApiHealthCheck from "@/components/ApiHealthCheck";
import stockService from "@/services/api";
import { NewsItem } from "@/types/stock";

const NewsPage = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        const response = await stockService.getNews();
        setNews(response.news || []);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch news:', err);
        setError('Failed to load news data');
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  const handleSearch = async (query: string) => {
    // If search term is a valid stock symbol, fetch news for that symbol
    if (query && query.trim().length > 0) {
      try {
        setLoading(true);
        setSearchTerm(query);
        const response = await stockService.getNews(query);
        setNews(response.news || []);
        setError(null);
      } catch (err) {
        console.error('Failed to search news:', err);
        setError('Failed to search for news');
      } finally {
        setLoading(false);
      }
    } else {
      // Reset to general market news
      setSearchTerm("");
      try {
        setLoading(true);
        const response = await stockService.getNews();
        setNews(response.news || []);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch news:', err);
        setError('Failed to load news data');
      } finally {
        setLoading(false);
      }
    }
  };

  // Format the published date
  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return 'Unknown date';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">Market News</h1>
        <Text>Latest financial news and market updates</Text>
      </div>

      {/* API Health Check - will only show if there's an issue */}
      <ApiHealthCheck />

      <div className="w-full md:w-2/3">
        <SearchBar 
          onSearch={handleSearch} 
          placeholder="Search news by stock symbol..." 
          defaultValue={searchTerm}
        />
      </div>

      {loading ? (
        <div className="py-12 text-center">
          <Text>Loading news...</Text>
        </div>
      ) : error ? (
        <div className="py-12 text-center">
          <Text className="text-red-500">{error}</Text>
        </div>
      ) : news.length === 0 ? (
        <div className="py-12 text-center">
          <Text>No news found. Try a different search term.</Text>
        </div>
      ) : (
        <div className="space-y-6">
          {searchTerm && (
            <div className="flex justify-between items-center">
              <Title>News for {searchTerm}</Title>
              <button 
                onClick={() => handleSearch("")}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                ← Back to general news
              </button>
            </div>
          )}

          {news.map((item, index) => (
            <Card key={index}>
              <div className="flex flex-col space-y-3">
                <div className="flex justify-between items-start">
                  <h3 className="font-medium text-lg text-gray-900 dark:text-white">
                    {item.url ? (
                      <a 
                        href={item.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="hover:text-blue-600"
                      >
                        {item.title}
                      </a>
                    ) : (
                      item.title
                    )}
                  </h3>
                </div>
                <div className="flex justify-between items-center text-xs text-gray-500">
                  <span>{item.source || 'News Source'}</span>
                  <span>{formatDate(item.published_at)}</span>
                </div>
                <p className="text-gray-600 dark:text-gray-300">
                  {item.snippet}
                </p>
                {item.url && (
                  <div className="pt-2">
                    <a 
                      href={item.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Read more →
                    </a>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default NewsPage;
