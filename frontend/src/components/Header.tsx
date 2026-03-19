import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { casesAPI, systemAPI } from '../services/api';
import { Case } from '../types';

interface HeaderProps {
  onSearch?: (query: string) => void;
  searchQuery?: string;
}

export const Header: React.FC<HeaderProps> = ({ onSearch, searchQuery = '' }) => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [searchResults, setSearchResults] = useState<Case[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (localSearch.trim().length >= 2) {
        setIsSearching(true);
        try {
          const response = await casesAPI.search(localSearch, 10);
          setSearchResults(response.data);
          setShowDropdown(true);
        } catch (error) {
          console.error('Search error:', error);
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
        setShowDropdown(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [localSearch]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleResetDemo = async () => {
    if (!confirm('Are you sure you want to reset the demo? This will clear all signal actions and return to the initial state.')) {
      return;
    }
    
    setIsResetting(true);
    try {
      await systemAPI.resetDemo();
      alert('Demo reset successfully! Refreshing page...');
      window.location.reload();
    } catch (error) {
      console.error('Error resetting demo:', error);
      alert('Error resetting demo. Please try again.');
    } finally {
      setIsResetting(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalSearch(value);
    onSearch?.(value);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setLocalSearch('');
      onSearch?.('');
      setShowDropdown(false);
    }
  };

  const handleCaseClick = (caseId: number) => {
    navigate(`/cases/${caseId}`);
    setLocalSearch('');
    setShowDropdown(false);
    onSearch?.('');
  };

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return '—';
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      'new': 'Nieuw',
      'in_progress': 'In behandeling',
      'pending_review': 'Wordt beoordeeld',
      'approved': 'Goedgekeurd',
      'rejected': 'Afgewezen',
      'closed': 'Gesloten'
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'pending_review':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'closed':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 transition-colors">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center space-x-2">
              <img src="/Logo/ElLogo.png" alt="Logo" className="h-8" />
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                EYE on Claims
              </h1>
            </Link>
            <nav className="flex space-x-6">
              <Link
                to="/"
                className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 font-medium transition-colors"
              >
                Dossiers
              </Link>
            </nav>
          </div>
          
          {/* Global Search Bar */}
          <div className="flex-1 max-w-md mx-8" ref={searchRef}>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Zoek dossiers op nummer, naam, beschrijving..."
                value={localSearch}
                onChange={handleSearchChange}
                onKeyDown={handleSearchKeyDown}
                onFocus={() => localSearch.length >= 2 && setShowDropdown(true)}
                className="block w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 
                         placeholder-gray-500 dark:placeholder-gray-400
                         focus:ring-2 focus:ring-primary-500 focus:border-primary-500 
                         dark:focus:ring-primary-400 dark:focus:border-primary-400
                         transition-colors text-sm"
              />
              {localSearch && (
                <button
                  onClick={() => { setLocalSearch(''); onSearch?.(''); setShowDropdown(false); }}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
              
              {/* Search Results Dropdown */}
              {showDropdown && (
                <div className="absolute z-50 mt-2 w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-h-96 overflow-y-auto">
                  {isSearching ? (
                    <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center">
                      Zoeken...
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className="py-2">
                      {searchResults.map((caseItem) => (
                        <button
                          key={caseItem.id}
                          onClick={() => handleCaseClick(caseItem.id)}
                          className="w-full px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left border-b border-gray-100 dark:border-gray-700 last:border-0"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-gray-900 dark:text-white">
                                  {caseItem.case_number}
                                </span>
                                <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusColor(caseItem.status)}`}>
                                  {getStatusLabel(caseItem.status)}
                                </span>
                                {caseItem.is_uitgelicht === true && (
                                  <span className="px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                                    Uitgelicht
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                                {caseItem.claimant_name}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                {caseItem.category} • {caseItem.schade_oorzaak}
                              </div>
                            </div>
                            <div className="text-right ml-4">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {formatCurrency(caseItem.claim_amount || null)}
                              </div>
                              {(caseItem.signal_count ?? 0) > 0 && (
                                <div className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                                  {caseItem.signal_count} signalen
                                </div>
                              )}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : localSearch.length >= 2 ? (
                    <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center">
                      Geen resultaten gevonden voor "{localSearch}"
                    </div>
                  ) : (
                    <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center">
                      Typ minimaal 2 karakters om te zoeken
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {user && (
              <>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {user.full_name || user.username}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user.role}</div>
                </div>
                
                {/* Dark Mode Toggle */}
                <button
                  onClick={toggleTheme}
                  className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                >
                  {isDark ? (
                    <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                    </svg>
                  )}
                </button>
                
                {/* Reset Demo Button */}
                <button
                  onClick={handleResetDemo}
                  disabled={isResetting}
                  className="px-3 py-2 text-sm font-medium rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Reset demo to initial state"
                >
                  {isResetting ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Resetting...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Reset Demo
                    </span>
                  )}
                </button>
                
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  Uitloggen
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
