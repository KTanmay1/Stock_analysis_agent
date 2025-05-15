"use client";

import React, { useState, useEffect } from 'react';
import { Card, Title, Text, Button } from "@tremor/react";
import Link from 'next/link';
import stockService from '../services/api';
import { NewsItem } from '../types/stock';

interface MarketNewsProps {
  symbol?: string;
  limit?: number;
}

// Define a more flexible news item type to handle different API responses
interface NormalizedNewsItem {
  title: string;
  snippet?: string;
  description?: string;
  source?: string;
  url?: string;
  published_at?: string;
  published?: string;
  image_url?: string;
  [key: string]: any; // Allow any other properties
}

const MarketNews: React.FC<MarketNewsProps> = ({ symbol, limit = 5 }) => {
  const [news, setNews] = useState<NormalizedNewsItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        const response = await stockService.getNews(symbol, limit);
        
        // Safely handle different data structures
        let newsItems: any[] = [];
        if (response.news && Array.isArray(response.news)) {
          newsItems = response.news;
        } else if (response.articles && Array.isArray(response.articles)) {
          newsItems = response.articles;
        } else if (Array.isArray(response)) {
          newsItems = response;
        }
        
        // Normalize the data structure
        const normalizedNews = newsItems.map(normalizeNewsItem);
        setNews(normalizedNews);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch news:', err);
        setError('Failed to load news data');
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, [symbol, limit]);

  // Helper function to normalize news data
  const normalizeNewsItem = (item: any): NormalizedNewsItem => {
    return {
      title: item.title || 'No Title Available',
      snippet: item.snippet || item.description || item.summary || 'No description available',
      description: item.description || item.snippet || item.summary || '',
      source: item.source || item.source_name || 'Unknown Source',
      url: item.url || item.link || '#',
      published_at: item.published_at || item.published || item.date || new Date().toISOString(),
      image_url: item.image_url || item.imageUrl || null,
    };
  };

  // Format the published date
  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return 'Unknown date';
    
    try {
      const date = new Date(dateString);
      // Check if date is valid
      if (isNaN(date.getTime())) return 'Unknown date';
      
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch (e) {
      return 'Unknown date';
    }
  };

  if (loading) {
    return (
      <Card>
        <Title>Market News</Title>
        <div className="flex justify-center items-center h-40">
          <p className="text-gray-500">Loading news...</p>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <Title>Market News</Title>
        <div className="flex justify-center items-center h-40">
          <p className="text-red-500">{error}</p>
        </div>
      </Card>
    );
  }

  if (news.length === 0) {
    return (
      <Card>
        <Title>Market News</Title>
        <div className="flex justify-center items-center h-40">
          <p className="text-gray-500">No news available</p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <Title>
        {symbol ? `${symbol} News` : 'Market News'}
      </Title>
      <div className="mt-4 space-y-4">
        {news.map((item, index) => (
          <div key={index} className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-0">
            <div className="flex justify-between items-start mb-1">
              <h3 className="font-medium text-gray-900 dark:text-white">
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
            <div className="flex justify-between items-center text-xs text-gray-500 mb-2">
              <span>{item.source || 'News Source'}</span>
              <span>{formatDate(item.published_at || item.published)}</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {item.snippet || item.description}
            </p>
          </div>
        ))}
      </div>
      {news.length > 0 && (
        <div className="mt-4 text-center">
          <Link href="/news" className="text-blue-600 text-sm hover:underline">
            View More News
          </Link>
        </div>
      )}
    </Card>
  );
};

export default MarketNews; 