import React, { useState, useEffect } from 'react';
import { Search, Filter, X, Sliders, Tag, RefreshCw, CheckCircle, Calendar, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { Navbar } from './Navbar';
import type { Item } from '../types/database';
import { ItemCard } from './ItemCard';

const CATEGORIES = [
  { value: 'clothing', label: 'Clothing' },
  { value: 'electronics', label: 'Electronics' },
  { value: 'accessories', label: 'Accessories' },
  { value: 'books', label: 'Books & Supplies' },
  { value: 'other', label: 'Other' }
];

interface FilterState {
  searchQuery: string;
  selectedTags: string[];
  selectedCategory: string;
  claimStatus: 'all' | 'unclaimed' | 'claimed';
  dateRange: {
    from: string;
    to: string;
  };
}

const DEFAULT_FILTER_STATE: FilterState = {
  searchQuery: '',
  selectedTags: [],
  selectedCategory: '',
  claimStatus: 'all',
  dateRange: {
    from: '',
    to: ''
  }
};

// Declare gtag on the window object for TypeScript if not declared globally
// You might have already done this if you followed previous advice for AnalyticsTracker.tsx
declare global {
  interface Window {
    gtag?: (...args: any[]) => void; // Make gtag optional in case it's blocked or not loaded
  }
}

export function HomePage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilterCount, setActiveFilterCount] = useState(0);
  const { user } = useAuth();  // Add this line
  
  const [filters, setFilters] = useState<FilterState>(() => {
    const savedFilters = localStorage.getItem('lostAndFoundFilters');
    return savedFilters ? JSON.parse(savedFilters) : DEFAULT_FILTER_STATE;
  });

  useEffect(() => {
    localStorage.setItem('lostAndFoundFilters', JSON.stringify(filters));
    
    let count = 0;
    if (filters.searchQuery) count++;
    if (filters.selectedTags.length > 0) count++;
    if (filters.selectedCategory) count++;
    if (filters.dateRange.from || filters.dateRange.to) count++;
    if (filters.claimStatus !== 'all') count++;
    
    setActiveFilterCount(count);
  }, [filters]);

  useEffect(() => {
const fetchAndSetItems = async () => {
  try {
    setLoading(true);
    setError(null);
    let query = supabase
      .from('items')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters.searchQuery) {
      query = query.or(`name.ilike.%${filters.searchQuery}%,description.ilike.%${filters.searchQuery}%`);
    }

    if (filters.selectedTags.length > 0) {
      query = query.contains('tags', filters.selectedTags);
    }

    if (filters.selectedCategory) {
      query = query.contains('tags', [filters.selectedCategory]);
    }

    if (filters.claimStatus !== 'all') {
      query = query.eq('is_claimed', filters.claimStatus === 'claimed');
    }

    if (filters.dateRange.from) {
      query = query.gte('created_at', filters.dateRange.from);
    }
    
    if (filters.dateRange.to) {
      const toDate = new Date(filters.dateRange.to);
      toDate.setDate(toDate.getDate() + 1);
      query = query.lt('created_at', toDate.toISOString());
    }

    const { data, error: fetchError } = await query;

    if (fetchError) throw fetchError;
    setItems(data || []);
  } catch (error: any) {
    console.error('Error fetching items:', error);
    setError('Failed to load items. Please try again.');
  } finally {
    setLoading(false);
  }
};

fetchAndSetItems();
    fetchTags();
  }, []);

  useEffect(() => {
    // Send a pageview event to Google Analytics when the HomePage mounts
    if (window.gtag) {
      window.gtag('config', 'G-0F8BZBLBHF', {
        page_path: '/', // Assuming '/' is your homepage path
        page_title: 'Homepage' // Optional: you can set a specific title
      });
      console.log("GA Pageview (gtag.js): Homepage"); // Optional: for debugging
    } else {
      console.warn("gtag not found on window. Analytics for homepage might not be sent.");
    }

    const fetchItems = async () => {
      try {
        setLoading(true);
        setError(null);
        let query = supabase
          .from('items')
          .select('*')
          .order('created_at', { ascending: false });

        if (filters.searchQuery) {
          query = query.or(`name.ilike.%${filters.searchQuery}%,description.ilike.%${filters.searchQuery}%`);
        }

        if (filters.selectedTags.length > 0) {
          query = query.contains('tags', filters.selectedTags);
        }

        if (filters.selectedCategory) {
          query = query.contains('tags', [filters.selectedCategory]);
        }

        if (filters.claimStatus !== 'all') {
          query = query.eq('is_claimed', filters.claimStatus === 'claimed');
        }

        if (filters.dateRange.from) {
          query = query.gte('created_at', filters.dateRange.from);
        }
        
        if (filters.dateRange.to) {
          const toDate = new Date(filters.dateRange.to);
          toDate.setDate(toDate.getDate() + 1);
          query = query.lt('created_at', toDate.toISOString());
        }

        const { data, error: fetchError } = await query;

        if (fetchError) throw fetchError;
        setItems(data || []);
      } catch (error: any) {
        console.error('Error fetching items:', error);
        setError('Failed to load items. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, []); // Empty dependency array ensures this runs only once when the component mounts

  const fetchTags = async () => {
    try {
      setError(null);
      const { data, error: fetchError } = await supabase
        .from('items')
        .select('tags');

      if (fetchError) throw fetchError;
      
      if (!data) {
        setAvailableTags([]);
        return;
      }

      const allTags = data.flatMap(item => item.tags || []);
      const categoryValues = CATEGORIES.map(cat => cat.value);
      const uniqueTags = [...new Set(allTags.filter(tag => !categoryValues.includes(tag)))];
      setAvailableTags(uniqueTags);
    } catch (error: any) {
      console.error('Error fetching tags:', error);
      setError('Failed to load tags. Please try again.');
      setAvailableTags([]);
    }
  };

  const toggleTag = (tag: string) => {
    setFilters(prev => ({
      ...prev,
      selectedTags: prev.selectedTags.includes(tag)
        ? prev.selectedTags.filter(t => t !== tag)
        : [...prev.selectedTags, tag]
    }));
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters(prev => ({
      ...prev,
      selectedCategory: e.target.value
    }));
  };

  const handleClaimStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters(prev => ({
      ...prev,
      claimStatus: e.target.value as FilterState['claimStatus']
    }));
  };

  const handleDateChange = (field: 'from' | 'to', value: string) => {
    setFilters(prev => ({
      ...prev,
      dateRange: {
        ...prev.dateRange,
        [field]: value
      }
    }));
  };

  const clearAllFilters = () => {
    setFilters(DEFAULT_FILTER_STATE);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <div className="flex flex-col gap-3">
            <div className="flex gap-2">
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search items..."
                  value={filters.searchQuery}
                  onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
              </div>
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors relative"
              >
                <Sliders className="h-5 w-5 text-gray-700" />
                <span className="ml-2 hidden sm:inline">Filters</span>
                {activeFilterCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-yellow-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </button>
              {activeFilterCount > 0 && (
                <button
                  onClick={clearAllFilters}
                  className="flex items-center px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <RefreshCw className="h-5 w-5 text-gray-700" />
                  <span className="ml-2 hidden sm:inline">Clear</span>
                </button>
              )}
            </div>
            
            {showFilters && (
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                      <Tag className="h-4 w-4 mr-1" />
                      Category
                    </label>
                    <select
                      id="category"
                      value={filters.selectedCategory}
                      onChange={handleCategoryChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500"
                    >
                      <option value="">All Categories</option>
                      {CATEGORIES.map(category => (
                        <option key={category.value} value={category.value}>
                          {category.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="claimStatus" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Status
                    </label>
                    <select
                      id="claimStatus"
                      value={filters.claimStatus}
                      onChange={handleClaimStatusChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500"
                    >
                      <option value="all">All Items</option>
                      <option value="unclaimed">Unclaimed Only</option>
                      <option value="claimed">Claimed Only</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      Date Range
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="date"
                        value={filters.dateRange.from}
                        onChange={(e) => handleDateChange('from', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500"
                        placeholder="From"
                      />
                      <input
                        type="date"
                        value={filters.dateRange.to}
                        onChange={(e) => handleDateChange('to', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500"
                        placeholder="To"
                      />
                    </div>
                  </div>
                </div>
                
                {availableTags.length > 0 && (
                  <div className="mt-4">
                    <div className="flex items-center mb-2">
                      <Filter className="h-4 w-4 text-gray-400 mr-1" />
                      <span className="text-sm font-medium text-gray-700">Filter by tags</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {availableTags.map((tag) => (
                        <button
                          key={tag}
                          onClick={() => toggleTag(tag)}
                          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                            filters.selectedTags.includes(tag)
                              ? 'bg-yellow-500 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {tag}
                          {filters.selectedTags.includes(tag) && (
                            <X className="h-4 w-4 ml-1" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4 flex items-center">
            <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
            <span className="text-red-700">{error}</span>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
          </div>
        ) : items.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {items.map((item) => (
              <ItemCard 
                key={item.id} 
                item={item}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900">No items found</h3>
            <p className="mt-1 text-gray-500">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </main>
    </div>
  );
}