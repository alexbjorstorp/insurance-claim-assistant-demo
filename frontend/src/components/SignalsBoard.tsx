import React, { useState } from 'react';
import { Signal } from '../types';

interface SignalsBoardProps {
  signals: Signal[];
  onSelectSignal?: (signal: Signal) => void;
}

export const SignalsBoard: React.FC<SignalsBoardProps> = ({ signals, onSelectSignal }) => {
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'deadline'>('newest');

  const categories = [
    { 
      id: 'communicatie', 
      label: 'Communicatie', 
      color: 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700',
      iconColor: 'text-blue-600 dark:text-blue-400',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      )
    },
    { 
      id: 'taken', 
      label: 'Taken', 
      color: 'bg-purple-100 dark:bg-purple-900/30 border-purple-300 dark:border-purple-700',
      iconColor: 'text-purple-600 dark:text-purple-400',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      )
    },
    { 
      id: 'datakwaliteit', 
      label: 'Datakwaliteit', 
      color: 'bg-amber-100 dark:bg-amber-900/30 border-amber-300 dark:border-amber-700',
      iconColor: 'text-amber-600 dark:text-amber-400',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    { 
      id: 'financieel', 
      label: 'Financieel', 
      color: 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-300 dark:border-emerald-700',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    { 
      id: 'proces', 
      label: 'Proces', 
      color: 'bg-rose-100 dark:bg-rose-900/30 border-rose-300 dark:border-rose-700',
      iconColor: 'text-rose-600 dark:text-rose-400',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      )
    },
  ];

  const [activeCategory, setActiveCategory] = useState('communicatie');

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      communicatie: 'border-l-blue-400',
      taken: 'border-l-purple-400',
      datakwaliteit: 'border-l-amber-400',
      financieel: 'border-l-emerald-400',
      proces: 'border-l-rose-400',
    };
    return colors[category] || 'border-l-gray-300 dark:border-l-gray-600';
  };

  const getCategoryBackgroundColor = (category: string) => {
    const colors: Record<string, string> = {
      communicatie: 'bg-blue-50 dark:bg-blue-950/30',
      taken: 'bg-purple-50 dark:bg-purple-950/30',
      datakwaliteit: 'bg-amber-50 dark:bg-amber-950/30',
      financieel: 'bg-emerald-50 dark:bg-emerald-950/30',
      proces: 'bg-rose-50 dark:bg-rose-950/30',
    };
    return colors[category] || 'bg-gray-50 dark:bg-gray-800';
  };

  const getSignalBorderColor = (signal: Signal) => {
    // Urgent signals get red border, others get category color
    if (signal.severity === 'critical') {
      return 'border-l-red-500';
    }
    return getCategoryColor(signal.category);
  };

  const getFilteredSignals = () => {
    const activeSignals = signals.filter(s => !s.is_resolved);
    const categoryFiltered = activeSignals.filter(s => s.category === activeCategory);
    
    // Sort signals based on selected option
    return categoryFiltered.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      
      if (sortBy === 'newest') {
        return dateB - dateA; // Newest first
      } else if (sortBy === 'oldest') {
        return dateA - dateB; // Oldest first
      } else if (sortBy === 'deadline') {
        // Sort by deadline: signals with deadlines first, then by closest deadline
        const deadlineA = a.deadline ? new Date(a.deadline).getTime() : Infinity;
        const deadlineB = b.deadline ? new Date(b.deadline).getTime() : Infinity;
        return deadlineA - deadlineB;
      }
      return 0;
    });
  };

  const filteredSignals = getFilteredSignals();

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 transition-colors">
      <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Signalen</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {signals.filter(s => !s.is_resolved).length} actieve signalen
            </p>
          </div>
          
          {/* Sort Dropdown */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500 dark:text-gray-400">Sorteren:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'deadline')}
              className="text-sm px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="newest">Nieuwste</option>
              <option value="oldest">Oudste</option>
              <option value="deadline">Deadline</option>
            </select>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex-shrink-0 p-3 bg-gray-50 dark:bg-gray-800/50">
        <div className="flex gap-2">
          {categories.map((category) => {
            const count = signals.filter(s => s.category === category.id && !s.is_resolved).length;
            
            return (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg border-2 transition-colors ${
                  activeCategory === category.id
                    ? `${category.color} border-opacity-100`
                    : 'border-gray-200 bg-white text-gray-600 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-600/50'
                }`}
              >
                <div className="flex flex-col items-center gap-1">
                  <span className={category.iconColor}>
                    {category.icon}
                  </span>
                  <span className="whitespace-nowrap">{category.label}</span>
                  <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-200">
                    {count}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
      
      {/* Signals List */}
      <div className="flex-1 overflow-y-auto p-3">
        {filteredSignals.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            Geen actieve signalen in deze categorie
          </div>
        ) : (
          <div className="space-y-2">
            {filteredSignals.map((signal) => (
              <div
                key={signal.id}
                onClick={() => onSelectSignal?.(signal)}
                className={`px-4 py-3 cursor-pointer hover:opacity-90 border-l-4 rounded-lg transition-all ${getSignalBorderColor(signal)} ${getCategoryBackgroundColor(signal.category)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {signal.severity === 'critical' && (
                        <span className="px-2 py-0.5 rounded text-xs font-medium uppercase bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300">
                          SPOED
                        </span>
                      )}
                      <span className={`hidden ${
                        signal.severity === 'critical' ? 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300' :
                        signal.severity === 'error' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300' :
                        signal.severity === 'warning' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300' :
                        'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
                      }`}>
                        {signal.severity}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                        {signal.category.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {signal.title}
                    </div>
                    {signal.description && (
                      <div className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                        {signal.description}
                      </div>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
                      <span title="Aangemaakt op">
                        📅 {new Date(signal.created_at).toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                      </span>
                      {signal.deadline && (
                        <span 
                          title="Deadline"
                          className={`font-medium ${
                            new Date(signal.deadline) < new Date() 
                              ? 'text-red-600 dark:text-red-400' 
                              : 'text-amber-600 dark:text-amber-400'
                          }`}
                        >
                          ⏰ {new Date(signal.deadline).toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
