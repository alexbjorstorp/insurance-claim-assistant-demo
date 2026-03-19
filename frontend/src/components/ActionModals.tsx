import React, { useState } from 'react';

interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: any, notes?: string) => Promise<void>;
  signalTitle: string;
  signalDescription?: string;
}

// Send Response Modal
export const SendResponseModal: React.FC<BaseModalProps> = ({ isOpen, onClose, onConfirm, signalTitle, signalDescription }) => {
  const [recipient, setRecipient] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    setIsProcessing(true);
    try {
      await onConfirm({ recipient, subject, message, sent: true }, `Verzonden naar: ${recipient}`);
      onClose();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Antwoord Versturen</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{signalTitle}</p>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Ontvanger
            </label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="Belangenbehartiger / BBH"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Onderwerp
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Re: Stand van zaken"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Bericht
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={8}
              placeholder="Typ uw bericht hier..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Annuleren
          </button>
          <button
            onClick={handleSubmit}
            disabled={!recipient || !subject || !message || isProcessing}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"
          >
            {isProcessing ? 'Verzenden...' : 'Versturen'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Draft Letter Modal
export const DraftLetterModal: React.FC<BaseModalProps> = ({ isOpen, onClose, onConfirm, signalTitle, signalDescription }) => {
  const [letterType, setLetterType] = useState('response');
  const [recipient, setRecipient] = useState('');
  const [content, setContent] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    setIsProcessing(true);
    try {
      await onConfirm({ letterType, recipient, content, drafted: true }, `Brief opgesteld: ${letterType}`);
      onClose();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Brief Opstellen</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{signalTitle}</p>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Type Brief
            </label>
            <select
              value={letterType}
              onChange={(e) => setLetterType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="response">Reactie / Standpunt</option>
              <option value="proposal">Voorstel / Aanbod</option>
              <option value="rejection">Afwijzing</option>
              <option value="acceptance">Akkoord</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Geadresseerde
            </label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="Belangenbehartiger / Advocaat"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Inhoud Brief
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={10}
              placeholder="Inhoud van de brief..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Annuleren
          </button>
          <button
            onClick={handleSubmit}
            disabled={!recipient || !content || isProcessing}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50"
          >
            {isProcessing ? 'Opslaan...' : 'Brief Opstellen'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Approve Payment Modal
export const ApprovePaymentModal: React.FC<BaseModalProps> = ({ isOpen, onClose, onConfirm, signalTitle, signalDescription }) => {
  const [amount, setAmount] = useState('');
  const [paymentType, setPaymentType] = useState('behandelkosten');
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    setIsProcessing(true);
    try {
      await onConfirm({ amount: parseFloat(amount), paymentType, approved: true }, `Betaling goedgekeurd: €${amount}`);
      onClose();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full mx-4">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Betaling Goedkeuren</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{signalTitle}</p>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Type Betaling
            </label>
            <select
              value={paymentType}
              onChange={(e) => setPaymentType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="behandelkosten">Behandelkosten</option>
              <option value="voorschot">Voorschot</option>
              <option value="smartengeld">Smartengeld</option>
              <option value="reiskosten">Reiskosten</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Bedrag (€)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Notitie
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Optionele opmerking..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Annuleren
          </button>
          <button
            onClick={handleSubmit}
            disabled={!amount || isProcessing}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50"
          >
            {isProcessing ? 'Goedkeuren...' : 'Goedkeuren'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Adjust Reserve Modal
export const AdjustReserveModal: React.FC<BaseModalProps> = ({ isOpen, onClose, onConfirm, signalTitle, signalDescription }) => {
  const [newReserve, setNewReserve] = useState('');
  const [reason, setReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    setIsProcessing(true);
    try {
      await onConfirm({ newReserve: parseFloat(newReserve), reason, adjusted: true }, `Reserve aangepast naar €${newReserve}`);
      onClose();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full mx-4">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Reserve Aanpassen</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{signalTitle}</p>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nieuwe Reserve (€)
            </label>
            <input
              type="number"
              value={newReserve}
              onChange={(e) => setNewReserve(e.target.value)}
              placeholder="285000.00"
              step="1000"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Reden voor Aanpassing
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              placeholder="VSO-onderhandelingen, nieuwe medische informatie, etc."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Annuleren
          </button>
          <button
            onClick={handleSubmit}
            disabled={!newReserve || !reason || isProcessing}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg disabled:opacity-50"
          >
            {isProcessing ? 'Aanpassen...' : 'Reserve Aanpassen'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Adjust Amount Modal
export const AdjustAmountModal: React.FC<BaseModalProps> = ({ isOpen, onClose, onConfirm, signalTitle, signalDescription }) => {
  const [amountType, setAmountType] = useState('smartengeld');
  const [newAmount, setNewAmount] = useState('');
  const [justification, setJustification] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    setIsProcessing(true);
    try {
      await onConfirm({ amountType, newAmount: parseFloat(newAmount), justification, adjusted: true }, `${amountType} aangepast naar €${newAmount}`);
      onClose();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full mx-4">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Bedrag Aanpassen</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{signalTitle}</p>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Type Bedrag
            </label>
            <select
              value={amountType}
              onChange={(e) => setAmountType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="smartengeld">Smartengeld</option>
              <option value="bgk">BGK (Buitengerechtelijke Kosten)</option>
              <option value="inkomensschade">Inkomensschade</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nieuw Bedrag (€)
            </label>
            <input
              type="number"
              value={newAmount}
              onChange={(e) => setNewAmount(e.target.value)}
              placeholder="14000.00"
              step="100"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Onderbouwing
            </label>
            <textarea
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              rows={4}
              placeholder="Conform Smartengeldgids / BGK-tabel..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Annuleren
          </button>
          <button
            onClick={handleSubmit}
            disabled={!newAmount || !justification || isProcessing}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg disabled:opacity-50"
          >
            {isProcessing ? 'Aanpassen...' : 'Bedrag Aanpassen'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Complete Task Modal
export const CompleteTaskModal: React.FC<BaseModalProps> = ({ isOpen, onClose, onConfirm, signalTitle, signalDescription }) => {
  const [result, setResult] = useState('');
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    setIsProcessing(true);
    try {
      await onConfirm({ result, completed: true }, `Taak voltooid: ${result}`);
      onClose();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full mx-4">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Taak Voltooien</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{signalTitle}</p>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Resultaat / Uitkomst
            </label>
            <input
              type="text"
              value={result}
              onChange={(e) => setResult(e.target.value)}
              placeholder="Whiplash categorie 3-6 maanden, €4,500"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Notities
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="Aanvullende details..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Annuleren
          </button>
          <button
            onClick={handleSubmit}
            disabled={!result || isProcessing}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50"
          >
            {isProcessing ? 'Voltooien...' : 'Taak Voltooien'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Update Field Modal
export const UpdateFieldModal: React.FC<BaseModalProps> = ({ isOpen, onClose, onConfirm, signalTitle, signalDescription }) => {
  const [fieldName, setFieldName] = useState('');
  const [fieldValue, setFieldValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    setIsProcessing(true);
    try {
      await onConfirm({ fieldName, fieldValue, updated: true }, `${fieldName} bijgewerkt`);
      onClose();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full mx-4">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Veld Bijwerken</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{signalTitle}</p>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Veld
            </label>
            <select
              value={fieldName}
              onChange={(e) => setFieldName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Selecteer veld...</option>
              <option value="Letselsoort">Letselsoort</option>
              <option value="Behandelaar">Behandelaar</option>
              <option value="Diagnose">Diagnose</option>
              <option value="Arbeidsongeschiktheid">Arbeidsongeschiktheid %</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Waarde
            </label>
            <input
              type="text"
              value={fieldValue}
              onChange={(e) => setFieldValue(e.target.value)}
              placeholder="Nieuwe waarde..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Annuleren
          </button>
          <button
            onClick={handleSubmit}
            disabled={!fieldName || !fieldValue || isProcessing}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50"
          >
            {isProcessing ? 'Bijwerken...' : 'Veld Bijwerken'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Link BBH Modal
export const LinkBBHModal: React.FC<BaseModalProps> = ({ isOpen, onClose, onConfirm, signalTitle, signalDescription }) => {
  const [bbhName, setBbhName] = useState('');
  const [bbhOrganization, setBbhOrganization] = useState('');
  const [bbhEmail, setBbhEmail] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    setIsProcessing(true);
    try {
      await onConfirm({ bbhName, bbhOrganization, bbhEmail, linked: true }, `BBH gekoppeld: ${bbhName}`);
      onClose();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full mx-4">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Belangenbehartiger Koppelen</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{signalTitle}</p>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Naam BBH
            </label>
            <input
              type="text"
              value={bbhName}
              onChange={(e) => setBbhName(e.target.value)}
              placeholder="Advocaat / Letselschadebureau"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Organisatie
            </label>
            <input
              type="text"
              value={bbhOrganization}
              onChange={(e) => setBbhOrganization(e.target.value)}
              placeholder="Advocatenkantoor / Letselschadebureau"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              E-mail
            </label>
            <input
              type="email"
              value={bbhEmail}
              onChange={(e) => setBbhEmail(e.target.value)}
              placeholder="bbh@advocaten.nl"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Annuleren
          </button>
          <button
            onClick={handleSubmit}
            disabled={!bbhName || !bbhEmail || isProcessing}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50"
          >
            {isProcessing ? 'Koppelen...' : 'BBH Koppelen'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Link Communications Modal
export const LinkCommunicationsModal: React.FC<BaseModalProps> = ({ isOpen, onClose, onConfirm, signalTitle, signalDescription }) => {
  const [emailCount, setEmailCount] = useState('5');
  const [dateRange, setDateRange] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    setIsProcessing(true);
    try {
      await onConfirm({ emailCount: parseInt(emailCount), dateRange, linked: true }, `${emailCount} emails gekoppeld`);
      onClose();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full mx-4">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Communicaties Koppelen</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{signalTitle}</p>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Aantal E-mails
            </label>
            <input
              type="number"
              value={emailCount}
              onChange={(e) => setEmailCount(e.target.value)}
              min="1"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Periode
            </label>
            <input
              type="text"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              placeholder="Laatste 7 dagen / December 2025"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Annuleren
          </button>
          <button
            onClick={handleSubmit}
            disabled={!emailCount || isProcessing}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50"
          >
            {isProcessing ? 'Koppelen...' : 'Communicaties Koppelen'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Assign Handler Modal
export const AssignHandlerModal: React.FC<BaseModalProps> = ({ isOpen, onClose, onConfirm, signalTitle, signalDescription }) => {
  const [handler, setHandler] = useState('');
  const [reason, setReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    setIsProcessing(true);
    try {
      await onConfirm({ handler, reason, assigned: true }, `Toegewezen aan: ${handler}`);
      onClose();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full mx-4">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Behandelaar Toewijzen</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{signalTitle}</p>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Senior Behandelaar
            </label>
            <select
              value={handler}
              onChange={(e) => setHandler(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Selecteer behandelaar...</option>
              <option value="VSO Specialist - Jan de Vries">VSO Specialist - Jan de Vries</option>
              <option value="VSO Specialist - Maria Jansen">VSO Specialist - Maria Jansen</option>
              <option value="Senior Schadebehandelaar - Peter Smit">Senior Schadebehandelaar - Peter Smit</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Reden voor Overdracht
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="VSO-onderhandelingen, complexiteit, expertise vereist..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Annuleren
          </button>
          <button
            onClick={handleSubmit}
            disabled={!handler || !reason || isProcessing}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg disabled:opacity-50"
          >
            {isProcessing ? 'Toewijzen...' : 'Toewijzen'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Add Activity Modal
export const AddActivityModal: React.FC<BaseModalProps> = ({ isOpen, onClose, onConfirm, signalTitle, signalDescription }) => {
  const [activityType, setActivityType] = useState('');
  const [description, setDescription] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    setIsProcessing(true);
    try {
      await onConfirm({ activityType, description, scheduledDate, added: true }, `Activiteit toegevoegd: ${activityType}`);
      onClose();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full mx-4">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Activiteit Toevoegen</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{signalTitle}</p>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Type Activiteit
            </label>
            <select
              value={activityType}
              onChange={(e) => setActivityType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Selecteer activiteit...</option>
              <option value="Medisch Onderzoek">Medisch Onderzoek</option>
              <option value="Arbeidsdeskundig Onderzoek">Arbeidsdeskundig Onderzoek</option>
              <option value="Telefoongesprek">Telefoongesprek</option>
              <option value="Bespreking">Bespreking</option>
              <option value="Second Opinion">Second Opinion</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Geplande Datum
            </label>
            <input
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Omschrijving
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Details over de activiteit..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Annuleren
          </button>
          <button
            onClick={handleSubmit}
            disabled={!activityType || !scheduledDate || isProcessing}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg disabled:opacity-50"
          >
            {isProcessing ? 'Toevoegen...' : 'Activiteit Toevoegen'}
          </button>
        </div>
      </div>
    </div>
  );
};
