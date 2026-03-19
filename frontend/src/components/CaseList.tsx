import React from 'react';
import { Case } from '../types';

interface CaseListProps {
  cases: Case[];
  selectedCaseId?: number;
  onSelectCase: (caseId: number) => void;
  searchQuery?: string;
}

export const CaseList: React.FC<CaseListProps> = ({ cases, selectedCaseId, onSelectCase, searchQuery }) => {
  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      new: 'Nieuw',
      in_progress: 'In behandeling',
      pending_review: 'Wacht op beoordeling',
      approved: 'Goedgekeurd',
      rejected: 'Afgewezen',
      closed: 'Gesloten',
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      new: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
      in_progress: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
      pending_review: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
      approved: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
      rejected: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
      closed: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  };

  const getPriorityLabel = (priority: string) => {
    const labels: Record<string, string> = {
      low: 'Laag',
      medium: 'Normaal',
      high: 'Hoog',
      critical: 'Kritiek',
    };
    return labels[priority] || priority;
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: 'text-gray-600 dark:text-gray-400',
      medium: 'text-blue-600 dark:text-blue-400',
      high: 'text-orange-600 dark:text-orange-400',
      critical: 'text-red-600 dark:text-red-400',
    };
    return colors[priority] || 'text-gray-600 dark:text-gray-400';
  };

  const getSLARiskColor = (risk: string) => {
    const colors: Record<string, string> = {
      none: 'bg-gray-100 dark:bg-gray-700',
      low: 'bg-green-100 dark:bg-green-900/50',
      medium: 'bg-yellow-100 dark:bg-yellow-900/50',
      high: 'bg-red-100 dark:bg-red-900/50',
    };
    return colors[risk] || 'bg-gray-100 dark:bg-gray-700';
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 transition-colors">
      <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Uitgelichte Dossiers</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {cases.length} {searchQuery ? 'gevonden' : 'uitgelichte'} dossiers
        </p>
      </div>
      <div className="flex-1 overflow-y-auto divide-y divide-gray-200 dark:divide-gray-700">
        {cases.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            <p>{searchQuery ? 'Geen uitgelichte dossiers gevonden' : 'Geen uitgelichte dossiers beschikbaar'}</p>
          </div>
        ) : (
          cases.map((case_) => (
            <div
              key={case_.id}
              onClick={() => onSelectCase(case_.id)}
              className={`p-4 cursor-pointer transition-colors ${
                selectedCaseId === case_.id
                  ? 'bg-primary-50 dark:bg-primary-900/30 border-l-4 border-primary-600'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-white">{case_.case_number}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{case_.claimant_name}</div>
                </div>
                <div className={`w-3 h-3 rounded-full ${getSLARiskColor(case_.sla_risk)}`}></div>
              </div>
              
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(case_.status)}`}>
                  {getStatusLabel(case_.status)}
                </span>
                {case_.signal_count !== undefined && case_.signal_count > 0 && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                    {case_.signal_count} signalen
                  </span>
                )}
                {case_.urgent_signal_count !== undefined && case_.urgent_signal_count > 0 && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300">
                    {case_.urgent_signal_count} urgent
                  </span>
                )}
              </div>
              
              {case_.uitgelicht_reason && (
                <div className="text-xs text-orange-600 dark:text-orange-400 font-medium mb-2">
                  ⚠️ {case_.uitgelicht_reason}
                </div>
              )}
              
              {case_.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{case_.description}</p>
              )}
              
              {case_.claim_amount && (
                <div className="text-sm text-gray-900 dark:text-white font-medium mt-2">
                  {new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(case_.claim_amount)}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
