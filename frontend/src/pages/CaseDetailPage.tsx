import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { SignalCard } from '../components/SignalCard';
import { Case, Signal, TimelineEntry, Behandelplan, Reserve, ComparableCase } from '../types';
import {
  casesAPI,
  signalsAPI,
  timelineAPI,
  behandelplanAPI,
  reservesAPI,
  comparableCasesAPI,
} from '../services/api';

export const CaseDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<'signals' | 'behandelplan' | 'reserves' | 'comparable'>('signals');
  const [timelineFilter, setTimelineFilter] = useState<'overview' | 'communicatie' | 'medisch' | 'financieel' | 'taken' | 'overdracht'>('overview');
  const [showHistoricSignals, setShowHistoricSignals] = useState(false);
  const [behandelplanTab, setBehandelplanTab] = useState<'dossierverloop' | 'medisch' | 'arbeid' | 'sociaal' | 'strategie'>('dossierverloop');
  const [case_, setCase] = useState<Case | null>(null);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [behandelplan, setBehandelplan] = useState<Behandelplan | null>(null);
  const [reserves, setReserves] = useState<Reserve[]>([]);
  const [comparables, setComparables] = useState<ComparableCase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [showHtmlModal, setShowHtmlModal] = useState(false);
  const [htmlContent, setHtmlContent] = useState('');
  
  // Reserve form state
  const [selectedType, setSelectedType] = useState<string>('');
  const [reserveChanged, setReserveChanged] = useState<boolean | null>(null);
  const [changesImplemented, setChangesImplemented] = useState<boolean | null>(null);

  useEffect(() => {
    if (id) {
      fetchCaseData(parseInt(id));
    }
  }, [id]);

  const fetchCaseData = async (caseId: number) => {
    try {
      setIsLoading(true);
      const [caseRes, signalsRes, timelineRes] = await Promise.all([
        casesAPI.get(caseId),
        signalsAPI.list({ case_id: caseId }),
        timelineAPI.list(caseId),
      ]);
      
      setCase(caseRes.data);
      setSignals(signalsRes.data);
      setTimeline(timelineRes.data);

      // Fetch optional data
      try {
        const behandelplanRes = await behandelplanAPI.get(caseId);
        setBehandelplan(behandelplanRes.data);
      } catch (e) {
        // Behandelplan might not exist
      }

      const [reservesRes, comparablesRes] = await Promise.all([
        reservesAPI.list(caseId),
        comparableCasesAPI.list(caseId),
      ]);
      
      setReserves(reservesRes.data);
      setComparables(comparablesRes.data);
    } catch (error) {
      console.error('Failed to fetch case data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateSummaries = async () => {
    if (!id) return;
    
    setIsGeneratingSummary(true);
    try {
      await behandelplanAPI.generateSummaries(parseInt(id));
      // Refresh behandelplan data to get the new summaries
      const response = await behandelplanAPI.get(parseInt(id));
      setBehandelplan(response.data);
      alert('Samenvattingen succesvol gegenereerd!');
    } catch (error) {
      console.error('Failed to generate summaries:', error);
      alert('Fout bij het genereren van samenvattingen. Zorg ervoor dat de OPENAI_API_KEY is ingesteld.');
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleExportPdf = async () => {
    if (!id) return;
    
    try {
      // Detect dark mode from document
      const isDarkMode = document.documentElement.classList.contains('dark');
      const response = await behandelplanAPI.exportHtml(parseInt(id), isDarkMode);
      setHtmlContent(response.data);
      setShowHtmlModal(true);
    } catch (error: any) {
      console.error('Failed to generate HTML:', error);
      alert('Fout bij het genereren van het overzicht.');
    }
  };

  if (isLoading || !case_) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 transition-colors">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-600 dark:text-gray-400">Laden...</div>
        </div>
      </div>
    );
  }

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

  const getPriorityLabel = (priority: string) => {
    const labels: Record<string, string> = {
      low: 'Laag',
      medium: 'Normaal',
      high: 'Hoog',
      critical: 'Kritiek',
    };
    return labels[priority] || priority;
  };

  const getSLARiskLabel = (risk: string) => {
    const labels: Record<string, string> = {
      none: 'Geen',
      low: 'Laag',
      medium: 'Normaal',
      high: 'Hoog',
    };
    return labels[risk] || risk;
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

  const getFilteredTimeline = () => {
    // Sort timeline by date descending
    const sorted = [...timeline].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    
    if (timelineFilter === 'overview') {
      // Show all timeline entries (most recent first)
      return sorted;
    }
    
    // Filter by category
    const filterMap: Record<string, string[]> = {
      communicatie: ['Communicatie'],
      medisch: ['Medisch advies', 'Arbeidsdeskundig rapport', 'Schaderegelaar rapport'],
      financieel: ['Betaling', 'Reservering'],
      taken: ['Taak'],
      overdracht: ['Dossier overdracht'],
    };
    
    const allowedTitles = filterMap[timelineFilter] || [];
    return sorted.filter(entry => allowedTitles.includes(entry.title));
  };

  const getTimelineColor = (title: string) => {
    const colors: Record<string, string> = {
      'Communicatie': 'bg-blue-400',
      'Medisch advies': 'bg-purple-400',
      'Arbeidsdeskundig rapport': 'bg-purple-400',
      'Schaderegelaar rapport': 'bg-purple-400',
      'Reservering': 'bg-emerald-400',
      'Betaling': 'bg-emerald-400',
      'Taak': 'bg-amber-400',
      'Dossier overdracht': 'bg-rose-400',
    };
    return colors[title] || 'bg-gray-400';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('nl-NL', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      communicatie: 'Communicatie',
      taken: 'Taken',
      datakwaliteit: 'Datakwaliteit',
      financieel: 'Financieel',
      proces: 'Proces',
    };
    return labels[category] || category;
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900 transition-colors overflow-hidden">
      <Header />
      
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Case Summary */}
        <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-6 overflow-y-auto transition-colors">
          <Link to="/" className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 mb-4 inline-block">
            ← Terug naar Dossiers
          </Link>
          
          <h2 className="text-lg font-semibold text-gray-500 dark:text-gray-400 mb-2">Dossier Informatie</h2>
          
          <div className="space-y-4">
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Dossiernummer</div>
              <div className="text-xl font-bold text-gray-900 dark:text-white">{case_.case_number}</div>
            </div>

            {case_.claimant_name && (
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Slachtoffer naam</div>
                <div className="text-base font-medium text-gray-900 dark:text-white">{case_.claimant_name}</div>
              </div>
            )}

            {case_.category && (
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Dossiersoort</div>
                <div className="text-base font-medium text-gray-900 dark:text-white">{case_.category}</div>
              </div>
            )}

            {case_.schade_oorzaak && (
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Schade oorzaak</div>
                <div className="text-base font-medium text-gray-900 dark:text-white">{case_.schade_oorzaak}</div>
              </div>
            )}

            {case_.product && (
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Product</div>
                <div className="text-base font-medium text-gray-900 dark:text-white">{case_.product}</div>
              </div>
            )}

            {case_.description && (
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Dossier beschrijving</div>
                <div className="text-sm text-gray-900 dark:text-white">{case_.description}</div>
              </div>
            )}

            {case_.claim_amount && (
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Schadelast</div>
                <div className="text-base font-medium text-gray-900 dark:text-white">
                  {new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(case_.claim_amount)}
                </div>
              </div>
            )}

            {case_.estimated_reserve && (
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Openstaande reserve</div>
                <div className="text-base font-medium text-gray-900 dark:text-white">
                  {new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(case_.estimated_reserve)}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Content: Tabs */}
        <div className="flex-1 flex flex-col">
          {/* Tab Navigation */}
          <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 transition-colors">
            <div className="flex space-x-8 px-6">
              {[
                { id: 'signals', label: 'Signalen', count: signals.filter(s => !s.is_resolved).length },
                { id: 'behandelplan', label: 'Behandelplan' },
                { id: 'reserves', label: 'Reserve', count: reserves.length },
                { id: 'comparable', label: 'Vergelijkbare Dossiers', count: comparables.length },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400'
                      : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <span className="font-medium">{tab.label}</span>
                  {tab.count !== undefined && (
                    <span className="ml-2 px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-full text-xs">
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-hidden p-6">
            {activeTab === 'signals' && (
              <div className="h-full flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {showHistoricSignals ? 'Alle Signalen' : 'Actieve Signalen'}
                  </h3>
                  <div className="flex items-center space-x-3">
                    <span className="text-sm text-gray-700 dark:text-gray-300">Toon afgehandelde signalen</span>
                    <button
                      onClick={() => setShowHistoricSignals(!showHistoricSignals)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 ${
                        showHistoricSignals ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          showHistoricSignals ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
                {signals.filter(s => showHistoricSignals || !s.is_resolved).length === 0 ? (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    {showHistoricSignals ? 'Geen signalen' : 'Geen actieve signalen'}
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto pr-2">
                    <div className="space-y-3">
                    {signals
                      .filter(s => showHistoricSignals || !s.is_resolved)
                      .sort((a, b) => {
                        // Helper function to check if signal is urgent
                        const isUrgent = (signal: Signal) => {
                          // Check severity
                          if (signal.severity === 'critical' || signal.severity === 'urgent') {
                            return true;
                          }
                          
                          // Check deadline
                          if (signal.deadline) {
                            const deadline = new Date(signal.deadline);
                            if (deadline < new Date()) {
                              return true;
                            }
                          }
                          
                          // Check medical keywords
                          const medicalKeywords = [
                            'medisch rapport',
                            'medische rapportage',
                            'behandeling',
                            'revalidatie',
                            'letselschade',
                            'verwondingen',
                          ];
                          
                          const content = `${signal.title} ${signal.description}`.toLowerCase();
                          if (medicalKeywords.some(keyword => content.includes(keyword))) {
                            return true;
                          }
                          
                          return false;
                        };
                        
                        const aUrgent = isUrgent(a);
                        const bUrgent = isUrgent(b);
                        
                        // Sort urgent signals first
                        if (aUrgent && !bUrgent) return -1;
                        if (!aUrgent && bUrgent) return 1;
                        
                        // For signals with same urgency, maintain original order
                        return 0;
                      })
                      .map((signal) => (
                        <SignalCard 
                          key={signal.id} 
                          signal={signal} 
                          onSignalUpdated={() => fetchCaseData(parseInt(id!))}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'behandelplan' && (
              <div className="flex gap-6 h-full overflow-hidden">
                {/* Main Content - 70% */}
                <div className="w-[70%] flex flex-col overflow-hidden">
                  
                  {/* Tab Navigation */}
                  <div className="flex gap-2 mb-4 flex-shrink-0">
                    {[
                      { id: 'dossierverloop', label: 'Dossierverloop' },
                      { id: 'medisch', label: 'Medische Informatie' },
                      { id: 'arbeid', label: 'Arbeidsongeschiktheid & Werk' },
                      { id: 'sociaal', label: 'Privésituatie & Sociale Omstandigheden' },
                      { id: 'strategie', label: 'Strategie & Scenario' },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setBehandelplanTab(tab.id as any)}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                          behandelplanTab === tab.id
                            ? 'bg-blue-600 text-white'
                            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Form Content */}
                  <div className="flex-1 overflow-y-auto pr-2">
                    
                    {/* Dossierverloop Form */}
                    {behandelplanTab === 'dossierverloop' && (
                      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 transition-colors">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Dossierverloop</h3>
                        
                        <form className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Toedracht
                            </label>
                            <textarea
                              rows={4}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Beschrijf de toedracht..."
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Causaliteitsvraag
                            </label>
                            <textarea
                              rows={3}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Beschrijf de causaliteitsvraag..."
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Dekking
                              </label>
                              <div className="flex gap-2">
                                <button type="button" className="flex-1 px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-500 focus:ring-2 focus:ring-blue-500 transition-colors font-medium">
                                  Nee
                                </button>
                                <button type="button" className="flex-1 px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-500 focus:ring-2 focus:ring-blue-500 transition-colors font-medium">
                                  Ja
                                </button>
                              </div>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Percentage aansprakelijkheid
                              </label>
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  placeholder="0"
                                />
                                <span className="text-gray-600 dark:text-gray-400">%</span>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Datum aansprakelijkheid overeengekomen
                              </label>
                              <input
                                type="date"
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Percentage eigen schuld
                              </label>
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  placeholder="0"
                                />
                                <span className="text-gray-600 dark:text-gray-400">%</span>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Regres mogelijk
                              </label>
                              <div className="flex gap-2">
                                <button type="button" className="flex-1 px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-500 focus:ring-2 focus:ring-blue-500 transition-colors font-medium">
                                  Nee
                                </button>
                                <button type="button" className="flex-1 px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-500 focus:ring-2 focus:ring-blue-500 transition-colors font-medium">
                                  Ja
                                </button>
                              </div>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Alle-of-niets dossier?
                              </label>
                              <div className="flex gap-2">
                                <button type="button" className="flex-1 px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-500 focus:ring-2 focus:ring-blue-500 transition-colors font-medium">
                                  Nee
                                </button>
                                <button type="button" className="flex-1 px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-500 focus:ring-2 focus:ring-blue-500 transition-colors font-medium">
                                  Ja
                                </button>
                              </div>
                            </div>
                          </div>

                          <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
                            <button
                              type="submit"
                              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                            >
                              Opslaan
                            </button>
                          </div>
                        </form>
                      </div>
                    )}

                    {/* Medische Informatie Form */}
                    {behandelplanTab === 'medisch' && (
                      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 transition-colors">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Medische Informatie</h3>
                        
                        <form className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Letselsoort
                              </label>
                              <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                <option value="">Selecteer letselsoort</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Letselspecificatie
                              </label>
                              <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                <option value="">Selecteer specificatie</option>
                              </select>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Letsel zijde
                              </label>
                              <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                <option value="">Selecteer zijde</option>
                                <option value="links">Links</option>
                                <option value="rechts">Rechts</option>
                                <option value="beide">Beide</option>
                                <option value="nvt">N.v.t.</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Dominante zijde beïnvloedt
                              </label>
                              <div className="flex gap-2">
                                <button type="button" className="flex-1 px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-500 focus:ring-2 focus:ring-blue-500 transition-colors font-medium">
                                  Nee
                                </button>
                                <button type="button" className="flex-1 px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-500 focus:ring-2 focus:ring-blue-500 transition-colors font-medium">
                                  Ja
                                </button>
                              </div>
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Beperkingen
                            </label>
                            <textarea
                              rows={3}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Beschrijf de beperkingen..."
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Bijzonderheden (pre-existente/-dispositie)
                              </label>
                              <div className="flex gap-2">
                                <button type="button" className="flex-1 px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-500 focus:ring-2 focus:ring-blue-500 transition-colors font-medium">
                                  Nee
                                </button>
                                <button type="button" className="flex-1 px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-500 focus:ring-2 focus:ring-blue-500 transition-colors font-medium">
                                  Ja
                                </button>
                              </div>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Hersteld
                              </label>
                              <div className="flex gap-2">
                                <button type="button" className="flex-1 px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-500 focus:ring-2 focus:ring-blue-500 transition-colors font-medium">
                                  Nee
                                </button>
                                <button type="button" className="flex-1 px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-500 focus:ring-2 focus:ring-blue-500 transition-colors font-medium">
                                  Ja
                                </button>
                              </div>
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Datum eindsituatie bereikt
                            </label>
                            <input
                              type="date"
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Medisch advies
                            </label>
                            <textarea
                              rows={4}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Voer medisch advies in..."
                            />
                          </div>

                          <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
                            <button
                              type="submit"
                              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                            >
                              Opslaan
                            </button>
                          </div>
                        </form>
                      </div>
                    )}

                    {/* Arbeidsongeschiktheid & Werk Form */}
                    {behandelplanTab === 'arbeid' && (
                      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 transition-colors">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Arbeidsongeschiktheid & Werk</h3>
                        
                        <form className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Beroep
                            </label>
                            <input
                              type="text"
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Voer beroep in..."
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Dienstverband
                              </label>
                              <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                <option value="">Selecteer dienstverband</option>
                                <option value="vast">Vast</option>
                                <option value="tijdelijk">Tijdelijk</option>
                                <option value="zzp">ZZP</option>
                                <option value="nvt">N.v.t.</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Omvang dienstverband (uren/week)
                              </label>
                              <input
                                type="number"
                                min="0"
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="40"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Netto inkomen (€ per maand)
                            </label>
                            <div className="flex items-center gap-2">
                              <span className="text-gray-600 dark:text-gray-400">€</span>
                              <input
                                type="number"
                                step="0.01"
                                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="0.00"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Nu arbeidsongeschikt
                              </label>
                              <div className="flex gap-2">
                                <button type="button" className="flex-1 px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-500 focus:ring-2 focus:ring-blue-500 transition-colors font-medium">
                                  Nee
                                </button>
                                <button type="button" className="flex-1 px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-500 focus:ring-2 focus:ring-blue-500 transition-colors font-medium">
                                  Ja
                                </button>
                              </div>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Percentage arbeidsongeschikt
                              </label>
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  placeholder="0"
                                />
                                <span className="text-gray-600 dark:text-gray-400">%</span>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Startdatum
                              </label>
                              <input
                                type="date"
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Einddatum
                              </label>
                              <input
                                type="date"
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Interventies
                            </label>
                            <textarea
                              rows={3}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Beschrijf interventies..."
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Prognose
                            </label>
                            <textarea
                              rows={3}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Beschrijf prognose..."
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Overweging
                            </label>
                            <textarea
                              rows={3}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Voer overweging in..."
                            />
                          </div>

                          <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
                            <button
                              type="submit"
                              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                            >
                              Opslaan
                            </button>
                          </div>
                        </form>
                      </div>
                    )}

                    {/* Privésituatie & Sociale Omstandigheden Form */}
                    {behandelplanTab === 'sociaal' && (
                      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 transition-colors">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Privésituatie & Sociale Omstandigheden</h3>
                        
                        <form className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Samenstelling huishouden
                              </label>
                              <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                <option value="">Selecteer samenstelling</option>
                                <option value="alleenstaand">Alleenstaand</option>
                                <option value="samenwonend">Samenwonend</option>
                                <option value="gezin_kinderen">Gezin met kinderen</option>
                                <option value="anders">Anders</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Woonsituatie
                              </label>
                              <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                <option value="">Selecteer woonsituatie</option>
                                <option value="huur">Huur</option>
                                <option value="koop">Koop</option>
                                <option value="anders">Anders</option>
                              </select>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Soort woning
                              </label>
                              <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                <option value="">Selecteer soort woning</option>
                                <option value="appartement">Appartement</option>
                                <option value="eengezinswoning">Eengezinswoning</option>
                                <option value="anders">Anders</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Tuin?
                              </label>
                              <div className="flex gap-2">
                                <button type="button" className="flex-1 px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-500 focus:ring-2 focus:ring-blue-500 transition-colors font-medium">
                                  Nee
                                </button>
                                <button type="button" className="flex-1 px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-500 focus:ring-2 focus:ring-blue-500 transition-colors font-medium">
                                  Ja
                                </button>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Uren huishoudelijke hulp
                              </label>
                              <input
                                type="number"
                                min="0"
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="0"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Aandeel zelfwerkzaamheid (%)
                              </label>
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  placeholder="0"
                                />
                                <span className="text-gray-600 dark:text-gray-400">%</span>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Nu beperkt?
                              </label>
                              <div className="flex gap-2">
                                <button type="button" className="flex-1 px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-500 focus:ring-2 focus:ring-blue-500 transition-colors font-medium">
                                  Nee
                                </button>
                                <button type="button" className="flex-1 px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-500 focus:ring-2 focus:ring-blue-500 transition-colors font-medium">
                                  Ja
                                </button>
                              </div>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Startdatum
                              </label>
                              <input
                                type="date"
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Overweging
                            </label>
                            <textarea
                              rows={4}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Voer overweging in..."
                            />
                          </div>

                          <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
                            <button
                              type="submit"
                              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                            >
                              Opslaan
                            </button>
                          </div>
                        </form>
                      </div>
                    )}

                    {/* Strategie & Scenario Form */}
                    {behandelplanTab === 'strategie' && (
                      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 transition-colors">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Strategie & Scenario</h3>
                        
                        <form className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Reden lopend dossier
                            </label>
                            <textarea
                              rows={3}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Beschrijf reden lopend dossier..."
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Oplossingsrichting
                            </label>
                            <textarea
                              rows={3}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Beschrijf oplossingsrichting..."
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Scenarios
                            </label>
                            <textarea
                              rows={4}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Beschrijf mogelijke scenarios..."
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Vervolgstappen
                            </label>
                            <textarea
                              rows={3}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Beschrijf vervolgstappen..."
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Motivering
                            </label>
                            <textarea
                              rows={4}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Voer motivering in..."
                            />
                          </div>

                          <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
                            <button
                              type="submit"
                              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                            >
                              Opslaan
                            </button>
                          </div>
                        </form>
                      </div>
                    )}

                  </div>
                </div>

                {/* Right Sidebar - 30% */}
                <div className="w-[30%] flex flex-col overflow-hidden">
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 transition-colors overflow-y-auto">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Samenvatting</h3>
                    
                    {/* AI Overall Summary */}
                    {behandelplan?.ai_summary_overall && (
                      <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">AI Samenvatting</div>
                        <div className="text-sm text-gray-700 dark:text-gray-300">
                          {behandelplan.ai_summary_overall.substring(0, 150)}...
                        </div>
                      </div>
                    )}

                    {/* Section Summaries */}
                    {behandelplanTab === 'dossierverloop' && behandelplan?.ai_summary_dossierverloop && (
                      <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                        <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Sectie Samenvatting</div>
                        <div className="text-sm text-gray-700 dark:text-gray-300">
                          {behandelplan.ai_summary_dossierverloop.substring(0, 150)}...
                        </div>
                      </div>
                    )}
                    {behandelplanTab === 'medisch' && behandelplan?.ai_summary_medisch && (
                      <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                        <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Sectie Samenvatting</div>
                        <div className="text-sm text-gray-700 dark:text-gray-300">
                          {behandelplan.ai_summary_medisch.substring(0, 150)}...
                        </div>
                      </div>
                    )}
                    {behandelplanTab === 'arbeid' && behandelplan?.ai_summary_arbeid && (
                      <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                        <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Sectie Samenvatting</div>
                        <div className="text-sm text-gray-700 dark:text-gray-300">
                          {behandelplan.ai_summary_arbeid.substring(0, 150)}...
                        </div>
                      </div>
                    )}
                    {behandelplanTab === 'sociaal' && behandelplan?.ai_summary_sociaal && (
                      <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                        <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Sectie Samenvatting</div>
                        <div className="text-sm text-gray-700 dark:text-gray-300">
                          {behandelplan.ai_summary_sociaal.substring(0, 150)}...
                        </div>
                      </div>
                    )}
                    {behandelplanTab === 'strategie' && behandelplan?.ai_summary_strategie && (
                      <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                        <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Sectie Samenvatting</div>
                        <div className="text-sm text-gray-700 dark:text-gray-300">
                          {behandelplan.ai_summary_strategie.substring(0, 150)}...
                        </div>
                      </div>
                    )}
                    
                    <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Zaaknummer</div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {case_?.case_number}
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Schadelast</div>
                        <div className="text-lg font-bold text-gray-900 dark:text-white">
                          €{case_?.claim_amount?.toLocaleString('nl-NL') || 'N/A'}
                        </div>
                      </div>
                      
                      <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
                        <button 
                          onClick={handleGenerateSummaries}
                          disabled={isGeneratingSummary}
                          className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
                        >
                          {isGeneratingSummary ? 'Genereren...' : 'Genereer Samenvatting'}
                        </button>
                        <button 
                          onClick={handleExportPdf}
                          className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                          Toon Overzicht
                        </button>
                        <button className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg transition-colors">
                          Afdrukken
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'reserves' && (
              <div className="flex gap-6 h-full overflow-hidden">
                {/* Reserve Assessment Form - 60% */}
                <div className="w-[60%] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 transition-colors overflow-y-auto">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Reserve Herbeoordeling</h3>
                  
                  <form className="space-y-4">
                    {/* Type beoordeling */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Type beoordeling
                      </label>
                      <div className="flex gap-2">
                        {['ZB', 'VOP', 'KC', 'HRD'].map((type) => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => setSelectedType(type)}
                            className={`flex-1 px-4 py-2 border-2 rounded-lg font-medium transition-colors focus:ring-2 focus:ring-blue-500 ${
                              selectedType === type
                                ? 'bg-blue-600 border-blue-600 text-white'
                                : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-500'
                            }`}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Datum */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Datum
                      </label>
                      <input
                        type="date"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    {/* Deelnemers */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Deelnemers
                      </label>
                      <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        <option value="">Selecteer deelnemer</option>
                        <option value="HaasT">T. de Haas</option>
                        <option value="JongM">M. de Jong</option>
                      </select>
                    </div>

                    {/* Reserve gewijzigd */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Reserve gewijzigd
                      </label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setReserveChanged(false)}
                          className={`flex-1 px-4 py-2 border-2 rounded-lg font-medium transition-colors focus:ring-2 focus:ring-blue-500 ${
                            reserveChanged === false
                              ? 'bg-blue-600 border-blue-600 text-white'
                              : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-500'
                          }`}
                        >
                          Nee
                        </button>
                        <button
                          type="button"
                          onClick={() => setReserveChanged(true)}
                          className={`flex-1 px-4 py-2 border-2 rounded-lg font-medium transition-colors focus:ring-2 focus:ring-blue-500 ${
                            reserveChanged === true
                              ? 'bg-blue-600 border-blue-600 text-white'
                              : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-500'
                          }`}
                        >
                          Ja
                        </button>
                      </div>
                    </div>

                    {/* Drijvers reservemutatie */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Drijvers reservemutatie
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { value: 'ontwikkeling_ao', label: 'Ontwikkeling AO' },
                          { value: 'wijziging_uwv', label: 'Wijziging UWV-percentage' },
                          { value: 'omvang_hh', label: 'Af-/toename omvang HH' },
                          { value: 'medische_toestand', label: 'Wijziging medische toestand' },
                          { value: 'bevindingen_ad', label: 'Bevindingen AD' },
                          { value: 'aanpassingen_huis', label: 'Aanpassingen in huis/mobiliteit' },
                          { value: 'medisch_advies', label: 'Medisch advies' },
                          { value: 'causaliteit', label: 'Visie op causaliteit' },
                          { value: 'nieuwe_claim', label: 'Nieuwe claim ZKV' },
                          { value: 'rapport_sr', label: 'Rapport SR' },
                          { value: 'standaardreserve', label: 'Van standaardreserve af' },
                          { value: 'rente_wijziging', label: 'Rente wijziging' },
                          { value: 'prive_schade', label: 'Privé schade geregeld' },
                          { value: 'normbedragen', label: 'Wijziging normbedragen' },
                        ].map((option) => (
                          <label key={option.value} className="flex items-center">
                            <input
                              type="checkbox"
                              name="drijvers"
                              value={option.value}
                              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                            />
                            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{option.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Nieuwe schadelast */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Nieuwe schadelast
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600 dark:text-gray-400">€</span>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    {/* Overweging */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Overweging
                      </label>
                      <textarea
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Voer uw overwegingen in..."
                      />
                    </div>

                    {/* Wijzigingen doorgevoerd */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Wijzigingen doorgevoerd
                      </label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setChangesImplemented(false)}
                          className={`flex-1 px-4 py-2 border-2 rounded-lg font-medium transition-colors focus:ring-2 focus:ring-blue-500 ${
                            changesImplemented === false
                              ? 'bg-blue-600 border-blue-600 text-white'
                              : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-500'
                          }`}
                        >
                          Nee
                        </button>
                        <button
                          type="button"
                          onClick={() => setChangesImplemented(true)}
                          className={`flex-1 px-4 py-2 border-2 rounded-lg font-medium transition-colors focus:ring-2 focus:ring-blue-500 ${
                            changesImplemented === true
                              ? 'bg-blue-600 border-blue-600 text-white'
                              : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-500'
                          }`}
                        >
                          Ja
                        </button>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
                      <button
                        type="submit"
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      >
                        Indienen
                      </button>
                    </div>
                  </form>
                </div>

                {/* Reserve History - 40% */}
                <div className="w-[40%] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 transition-colors flex flex-col overflow-hidden">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Geschiedenis</h3>
                  {reserves.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                      Geen reserve vermeldingen
                    </div>
                  ) : (
                    <div className="space-y-3 flex-1 overflow-y-auto pr-2">
                      {[...reserves]
                        .sort((a, b) => new Date(b.effective_date).getTime() - new Date(a.effective_date).getTime())
                        .map((reserve) => (
                        <div key={reserve.id} className="bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg p-4 transition-colors">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                                € {Number(reserve.amount).toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {new Date(reserve.effective_date).toLocaleDateString('nl-NL')}
                              </div>
                            </div>
                          </div>
                          {reserve.reason && (
                            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">{reserve.reason}</div>
                          )}
                          {reserve.created_by_name && (
                            <div className="text-xs text-gray-500 dark:text-gray-500">
                              Door: {reserve.created_by_name}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'comparable' && (
              <div className="h-full overflow-y-auto pr-2">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Vergelijkbare Dossiers</h3>
                {comparables.length === 0 ? (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    Geen vergelijkbare dossiers gevonden
                  </div>
                ) : (
                  <div className="space-y-3">
                    {comparables.map((comparable, index) => {
                      // Parse summary to extract individual fields
                      const summaryLines = comparable.summary?.split('\n') || [];
                      const dossierInfo = summaryLines[0]?.replace('Dossier: ', '') || '';
                      const claimLine = summaryLines[1] || '';
                      const claimInfo = claimLine.split(', Reserve:')[0]?.replace('Claim: ', '') || '';
                      const behandelaarInfo = summaryLines[2]?.replace('Behandelaar: ', '') || '';
                      const afgeslotenInfo = summaryLines[3]?.replace('Afgesloten: ', '') || '';
                      
                      return (
                        <div 
                          key={comparable.id} 
                          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                        >
                          {/* Card Header */}
                          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-semibold text-gray-900 dark:text-white text-lg">
                                {comparable.reference_case_number}
                              </h4>
                              {comparable.similarity_score && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                  {comparable.similarity_score.toFixed(0)}% match
                                </span>
                              )}
                              {comparable.outcome && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                  {comparable.outcome}
                                </span>
                              )}
                            </div>
                            {comparable.similarity_factors && (
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {comparable.similarity_factors}
                              </p>
                            )}
                          </div>

                          {/* Card Content */}
                          <div className="px-4 pb-4 pt-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Left Column */}
                              <div className="space-y-3">
                                <div>
                                  <h5 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                                    Dossier Informatie
                                  </h5>
                                  <p className="text-sm text-gray-900 dark:text-white">
                                    {dossierInfo}
                                  </p>
                                </div>
                                
                                <div>
                                  <h5 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                                    Schadelast
                                  </h5>
                                  <p className="text-sm text-gray-900 dark:text-white">
                                    {claimInfo}
                                  </p>
                                </div>
                              </div>

                              {/* Right Column */}
                              <div className="space-y-3">
                                <div>
                                  <h5 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                                    Behandelaar
                                  </h5>
                                  <p className="text-sm text-gray-900 dark:text-white">
                                    {behandelaarInfo}
                                  </p>
                                </div>
                                
                                <div>
                                  <h5 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                                    Afgesloten Datum
                                  </h5>
                                  <p className="text-sm text-gray-900 dark:text-white">
                                    {afgeslotenInfo}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    
                    {/* Show More Button */}
                    <div className="pt-2 text-center">
                      <button
                        className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors py-2 px-4 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                        disabled
                      >
                        Meer weergeven
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar: Timeline */}
        <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden transition-colors">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Tijdlijn</h3>
            
            {/* Timeline Filter */}
            <div className="flex flex-wrap gap-1">
              <button
                onClick={() => setTimelineFilter('overview')}
                className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                  timelineFilter === 'overview'
                    ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Overzicht
              </button>
              {[
                { id: 'communicatie', label: 'Communicatie' },
                { id: 'medisch', label: 'Medisch' },
                { id: 'financieel', label: 'Financieel' },
                { id: 'taken', label: 'Taken' },
                { id: 'overdracht', label: 'Overdracht' },
              ].map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setTimelineFilter(filter.id as any)}
                  className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                    timelineFilter === filter.id
                      ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {/* Timeline Items - Scrollable Container */}
          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            <div className="relative">
              {/* Timeline vertical line */}
              <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700"></div>
              
              <div className="space-y-4">
                {/* Timeline entries */}
                {getFilteredTimeline().map((entry) => (
                  <div key={entry.id} className="relative pl-8">
                    {/* Timeline dot with category color */}
                    <div className={`absolute left-0 w-4 h-4 rounded-full border-2 border-white dark:border-gray-800 ${getTimelineColor(entry.title)}`}></div>
                    
                    <div className="rounded-lg p-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600">
                      <div className="flex items-start justify-between mb-1">
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                          {entry.title}
                        </span>
                      </div>
                      {entry.description && (
                        <div className="text-sm text-gray-900 dark:text-white mb-1">
                          {entry.description}
                        </div>
                      )}
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(entry.created_at)}
                      </div>
                    </div>
                  </div>
                ))}
                
                {getFilteredTimeline().length === 0 && (
                  <div className="text-center py-8 text-sm text-gray-500 dark:text-gray-400">
                    Geen acties in deze categorie
                  </div>
                )}
                
                {/* Case created entry */}
                {timelineFilter === 'overview' && (
                  <div className="relative pl-8">
                    <div className="absolute left-0 w-4 h-4 rounded-full border-2 border-white dark:border-gray-800 bg-gray-400"></div>
                    <div className="rounded-lg p-3 bg-gray-50 dark:bg-gray-700/30">
                      <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                        Dossier aangemaakt
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(case_.created_at)}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* HTML Preview Modal */}
      {showHtmlModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-8 overflow-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full flex flex-col max-h-full my-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Behandelplan Overzicht</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const printWindow = window.open('', '_blank');
                    if (printWindow) {
                      printWindow.document.write(htmlContent);
                      printWindow.document.close();
                      printWindow.print();
                    }
                  }}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Print
                </button>
                <button
                  onClick={() => setShowHtmlModal(false)}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Sluiten
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4 bg-gray-50 dark:bg-gray-900">
              <div 
                className="bg-white rounded-lg shadow-sm"
                dangerouslySetInnerHTML={{ __html: htmlContent }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
