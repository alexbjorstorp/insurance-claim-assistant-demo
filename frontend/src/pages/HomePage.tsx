import React, { useEffect, useState, useMemo } from 'react';
import { Header } from '../components/Header';
import { CaseList } from '../components/CaseList';
import { SignalsBoard } from '../components/SignalsBoard';
import { Case, Signal } from '../types';
import { casesAPI, signalsAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';

export const HomePage: React.FC = () => {
  const [cases, setCases] = useState<Case[]>([]);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<number | undefined>();
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [casesRes, signalsRes] = await Promise.all([
        casesAPI.list({ uitgelicht_only: true }),
        signalsAPI.list({ my_cases_only: true }),
      ]);
      setCases(casesRes.data);
      setSignals(signalsRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Don't filter cases on home page - always show all uitgelichte cases
  const filteredCases = useMemo(() => {
    return cases;
  }, [cases]);

  // Show all signals for the user
  const filteredSignals = useMemo(() => {
    return signals;
  }, [signals]);

  const handleSelectCase = (caseId: number) => {
    setSelectedCaseId(caseId);
    navigate(`/cases/${caseId}`);
  };

  const handleSelectSignal = (signal: Signal) => {
    // Navigate to the case detail page and focus on the signal
    navigate(`/cases/${signal.case_id}`);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  if (isLoading) {
    return (
      <div className="h-screen flex flex-col bg-gray-100 dark:bg-gray-900 transition-colors overflow-hidden">
        <Header onSearch={handleSearch} searchQuery={searchQuery} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-600 dark:text-gray-400">Laden...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100 dark:bg-gray-900 transition-colors overflow-hidden">
      <Header onSearch={handleSearch} searchQuery={searchQuery} />
      
      <div className="flex-1 grid grid-cols-2 gap-4 p-4 min-h-0">
        {/* Left Pane: Cases */}
        <div className="flex flex-col min-w-0 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <CaseList
            cases={filteredCases}
            selectedCaseId={selectedCaseId}
            onSelectCase={handleSelectCase}
          />
        </div>

        {/* Right Pane: Signals */}
        <div className="flex flex-col min-w-0 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <SignalsBoard
            signals={filteredSignals}
            onSelectSignal={handleSelectSignal}
          />
        </div>
      </div>
    </div>
  );
};
