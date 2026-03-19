import React, { useState } from 'react';
import { Signal } from '../types';
import { signalsAPI } from '../services/api';
import {
  SendResponseModal,
  DraftLetterModal,
  ApprovePaymentModal,
  AdjustReserveModal,
  AdjustAmountModal,
  CompleteTaskModal,
  UpdateFieldModal,
  LinkBBHModal,
  LinkCommunicationsModal,
  AssignHandlerModal,
  AddActivityModal
} from './ActionModals';

interface SignalCardProps {
  signal: Signal;
  onSignalUpdated: () => void;
}

export const SignalCard: React.FC<SignalCardProps> = ({ signal, onSignalUpdated }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionNotes, setActionNotes] = useState('');
  const [activeModal, setActiveModal] = useState<string | null>(null);

  // Debug: log signal data when expanded
  React.useEffect(() => {
    if (isExpanded) {
      console.log('Signal data:', {
        id: signal.id,
        title: signal.title,
        action_type: signal.action_type,
        action_taken_at: signal.action_taken_at,
        is_resolved: signal.is_resolved
      });
    }
  }, [isExpanded, signal]);

  const isUrgent = () => {
    // Check severity
    if (signal.severity === 'critical' || signal.severity === 'urgent') {
      return true;
    }
    
    // Check if past deadline
    if (signal.deadline && new Date(signal.deadline) < new Date()) {
      return true;
    }
    
    // Check for medical report keywords
    const signalText = `${signal.title} ${signal.description || ''}`.toLowerCase();
    const medicalKeywords = ['medisch rapport', 'medisch advies', 'letselrapport', 
                           'medische beoordeling', 'medische rapportage'];
    if (medicalKeywords.some(keyword => signalText.includes(keyword))) {
      return true;
    }
    
    return false;
  };

  const getSeverityColor = (severity: string) => {
    const colors = {
      info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      error: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
      critical: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
      urgent: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    };
    return colors[severity as keyof typeof colors] || colors.info;
  };

  const getCategoryBorderColor = (category: string) => {
    switch (category) {
      case 'communicatie':
        return '#60a5fa'; // blue-400
      case 'taken':
        return '#c084fc'; // purple-400
      case 'datakwaliteit':
        return '#fbbf24'; // amber-400
      case 'financieel':
        return '#34d399'; // emerald-400
      case 'proces':
        return '#fb7185'; // rose-400
      default:
        return '#d1d5db'; // gray-300
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'communicatie':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        );
      case 'taken':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        );
      case 'datakwaliteit':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'financieel':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'proces':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const performAction = async (actionType: string, actionData: any, notes?: string) => {
    setIsProcessing(true);
    try {
      await signalsAPI.performAction(signal.id, {
        action_type: actionType,
        action_data: actionData,
        action_notes: notes || actionNotes || undefined
      });
      onSignalUpdated();
      setActionNotes('');
      setActiveModal(null);
    } catch (error) {
      console.error('Error performing action:', error);
      alert('Error performing action. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const resolveSignal = async () => {
    setIsProcessing(true);
    try {
      await signalsAPI.resolve(signal.id, actionNotes || undefined);
      onSignalUpdated();
      setActionNotes('');
    } catch (error) {
      console.error('Error resolving signal:', error);
      alert('Error resolving signal. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const getActionButtons = () => {
    const buttons: JSX.Element[] = [];

    switch (signal.category) {
      case 'communicatie':
        buttons.push(
          <button
            key="send"
            onClick={() => setActiveModal('send_response')}
            disabled={isProcessing}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            Antwoord Versturen
          </button>
        );
        buttons.push(
          <button
            key="draft"
            onClick={() => setActiveModal('draft_letter')}
            disabled={isProcessing}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            Brief Opstellen
          </button>
        );
        buttons.push(
          <button
            key="archive"
            onClick={() => performAction('archive', { archived: true }, 'Gearchiveerd')}
            disabled={isProcessing}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            Archiveren
          </button>
        );
        break;

      case 'taken':
        buttons.push(
          <button
            key="complete"
            onClick={() => setActiveModal('complete_task')}
            disabled={isProcessing}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            Taak Voltooien
          </button>
        );
        buttons.push(
          <button
            key="change_deadline"
            onClick={() => performAction('change_deadline', { new_deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() }, 'Deadline gewijzigd naar +7 dagen')}
            disabled={isProcessing}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            Deadline Wijzigen
          </button>
        );
        break;

      case 'datakwaliteit':
        buttons.push(
          <button
            key="link_bbh"
            onClick={() => setActiveModal('link_bbh')}
            disabled={isProcessing}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            BBH Koppelen
          </button>
        );
        buttons.push(
          <button
            key="link_comms"
            onClick={() => setActiveModal('link_communications')}
            disabled={isProcessing}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            Communicaties Koppelen
          </button>
        );
        buttons.push(
          <button
            key="update_field"
            onClick={() => setActiveModal('update_field')}
            disabled={isProcessing}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            Veld Bijwerken
          </button>
        );
        break;

      case 'financieel':
        buttons.push(
          <button
            key="adjust_reserve"
            onClick={() => setActiveModal('adjust_reserve')}
            disabled={isProcessing}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            Reserve Aanpassen
          </button>
        );
        buttons.push(
          <button
            key="adjust_amount"
            onClick={() => setActiveModal('adjust_amount')}
            disabled={isProcessing}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            Bedrag Aanpassen
          </button>
        );
        buttons.push(
          <button
            key="approve"
            onClick={() => setActiveModal('approve_payment')}
            disabled={isProcessing}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            Goedkeuren
          </button>
        );
        break;

      case 'proces':
        buttons.push(
          <button
            key="add_activity"
            onClick={() => setActiveModal('add_activity')}
            disabled={isProcessing}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            Activiteit Toevoegen
          </button>
        );
        buttons.push(
          <button
            key="assign"
            onClick={() => setActiveModal('assign_handler')}
            disabled={isProcessing}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            Behandelaar Toewijzen
          </button>
        );
        buttons.push(
          <button
            key="close"
            onClick={() => performAction('close_case', { closed: true }, 'Dossier afgesloten')}
            disabled={isProcessing}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            Dossier Afsluiten
          </button>
        );
        break;
    }

    // Always add a generic "Mark as Resolved" button
    buttons.push(
      <button
        key="resolve"
        onClick={resolveSignal}
        disabled={isProcessing}
        className="px-4 py-2 border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
      >
        Markeer als Opgelost
      </button>
    );

    return buttons;
  };

  return (
    <div 
      className={`border-l-4 border-t border-r border-b ${signal.is_resolved ? 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50' : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'} rounded-lg overflow-hidden transition-all`}
      style={{ borderLeftColor: getCategoryBorderColor(signal.category) }}
    >
      <div
        className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className={`mt-0.5 ${signal.is_resolved ? 'text-gray-400 dark:text-gray-600' : 'text-gray-600 dark:text-gray-400'}`}>
              {getCategoryIcon(signal.category)}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                {signal.severity !== 'info' && (
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${getSeverityColor(signal.severity)}`}>
                    {signal.severity.toUpperCase()}
                  </span>
                )}
                <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">{signal.category}</span>
                {!signal.is_resolved && isUrgent() && (
                  <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 px-2 py-1 rounded-full font-semibold animate-pulse">
                    URGENT
                  </span>
                )}
                {signal.is_resolved && (
                  <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-2 py-1 rounded-full">
                    ✓ Opgelost
                  </span>
                )}
              </div>
              <div className={`font-medium ${signal.is_resolved ? 'text-gray-500 dark:text-gray-500' : 'text-gray-900 dark:text-white'}`}>
                {signal.title}
              </div>
              {!isExpanded && signal.description && (
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-1">
                  {signal.description}
                </div>
              )}
            </div>
          </div>
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-200 dark:border-gray-700 pt-4">
          {signal.description && (
            <div className="text-sm text-gray-700 dark:text-gray-300 mb-4">
              {signal.description}
            </div>
          )}

          {!signal.is_resolved && !signal.action_taken_at && (
            <>
              <div className="flex flex-wrap gap-2 mb-4">
                {getActionButtons()}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Notities (optioneel)
                </label>
                <textarea
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  placeholder="Voeg notities toe over de actie..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={2}
                />
              </div>
            </>
          )}

          {signal.action_taken_at && signal.action_type && (
            <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <div>
                  <div className="text-sm font-medium text-green-900 dark:text-green-100">
                    Actie Uitgevoerd: {signal.action_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </div>
                  {signal.action_notes && (
                    <div className="text-sm text-green-700 dark:text-green-300 mt-1">
                      {signal.action_notes}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
            Created: {new Date(signal.created_at).toLocaleString('nl-NL')}
            {signal.action_taken_at && (
              <> • Action taken: {new Date(signal.action_taken_at).toLocaleString('nl-NL')}</>
            )}
          </div>
        </div>
      )}

      {/* Action Modals */}
      <SendResponseModal
        isOpen={activeModal === 'send_response'}
        onClose={() => setActiveModal(null)}
        onConfirm={(data, notes) => performAction('send_response', data, notes)}
        signalTitle={signal.title}
        signalDescription={signal.description}
      />
      
      <DraftLetterModal
        isOpen={activeModal === 'draft_letter'}
        onClose={() => setActiveModal(null)}
        onConfirm={(data, notes) => performAction('draft_letter', data, notes)}
        signalTitle={signal.title}
        signalDescription={signal.description}
      />
      
      <ApprovePaymentModal
        isOpen={activeModal === 'approve_payment'}
        onClose={() => setActiveModal(null)}
        onConfirm={(data, notes) => performAction('approve_payment', data, notes)}
        signalTitle={signal.title}
        signalDescription={signal.description}
      />
      
      <AdjustReserveModal
        isOpen={activeModal === 'adjust_reserve'}
        onClose={() => setActiveModal(null)}
        onConfirm={(data, notes) => performAction('adjust_reserve', data, notes)}
        signalTitle={signal.title}
        signalDescription={signal.description}
      />
      
      <AdjustAmountModal
        isOpen={activeModal === 'adjust_amount'}
        onClose={() => setActiveModal(null)}
        onConfirm={(data, notes) => performAction('adjust_amount', data, notes)}
        signalTitle={signal.title}
        signalDescription={signal.description}
      />
      
      <CompleteTaskModal
        isOpen={activeModal === 'complete_task'}
        onClose={() => setActiveModal(null)}
        onConfirm={(data, notes) => performAction('complete_task', data, notes)}
        signalTitle={signal.title}
        signalDescription={signal.description}
      />
      
      <UpdateFieldModal
        isOpen={activeModal === 'update_field'}
        onClose={() => setActiveModal(null)}
        onConfirm={(data, notes) => performAction('update_field', data, notes)}
        signalTitle={signal.title}
        signalDescription={signal.description}
      />
      
      <LinkBBHModal
        isOpen={activeModal === 'link_bbh'}
        onClose={() => setActiveModal(null)}
        onConfirm={(data, notes) => performAction('link_bbh', data, notes)}
        signalTitle={signal.title}
        signalDescription={signal.description}
      />
      
      <LinkCommunicationsModal
        isOpen={activeModal === 'link_communications'}
        onClose={() => setActiveModal(null)}
        onConfirm={(data, notes) => performAction('link_communications', data, notes)}
        signalTitle={signal.title}
        signalDescription={signal.description}
      />
      
      <AssignHandlerModal
        isOpen={activeModal === 'assign_handler'}
        onClose={() => setActiveModal(null)}
        onConfirm={(data, notes) => performAction('assign_handler', data, notes)}
        signalTitle={signal.title}
        signalDescription={signal.description}
      />
      
      <AddActivityModal
        isOpen={activeModal === 'add_activity'}
        onClose={() => setActiveModal(null)}
        onConfirm={(data, notes) => performAction('add_activity', data, notes)}
        signalTitle={signal.title}
        signalDescription={signal.description}
      />
    </div>
  );
};
