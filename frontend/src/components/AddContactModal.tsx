import React, { useState, useEffect } from 'react';
import { contactService } from '../services/contacts';
import { User } from '../types';

interface AddContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContactAdded: () => void;
  currentUser: User | null;
}

const AddContactModal: React.FC<AddContactModalProps> = ({ isOpen, onClose, onContactAdded, currentUser }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [inviteCodeInput, setInviteCodeInput] = useState('');

  useEffect(() => {
    if (searchTerm.length >= 2) {
      const search = async () => {
        setIsLoading(true);
        try {
          const results = await contactService.searchUsers(searchTerm);
          setSearchResults(results);
        } catch (err) {
          console.error(err);
        } finally {
          setIsLoading(false);
        }
      };
      const debounce = setTimeout(search, 300);
      return () => clearTimeout(debounce);
    } else {
      setSearchResults([]);
    }
  }, [searchTerm]);

  const handleAddContact = async (username: string) => {
    setIsLoading(true);
    setError('');
    setSuccess('');
    try {
      await contactService.addContact(username);
      setSuccess(`Added ${username} to your contacts!`);
      onContactAdded();
      setSearchTerm('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add contact');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinByCode = async () => {
    if (!inviteCodeInput.trim()) return;
    setIsLoading(true);
    setError('');
    setSuccess('');
    try {
      const result = await contactService.acceptInvite(inviteCodeInput.trim());
      setSuccess(`Established link with ${result.user.username}!`);
      onContactAdded();
      setInviteCodeInput('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid invite code');
    } finally {
      setIsLoading(false);
    }
  };

  const inviteLink = `http://localhost:3000/invite/${currentUser?.inviteCode}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity" 
        onClick={onClose}
      />
      
      <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="bg-indigo-600 p-8 text-white">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-2xl font-black italic tracking-tight uppercase">Add New Contact</h2>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-indigo-100/80 text-sm font-medium">Search for friends or share your link</p>
        </div>

        <div className="p-8 space-y-8">
          {/* Invite Link Section */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Your Invite Link</h3>
            <div className="flex gap-2">
              <div className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-xs font-bold text-slate-600 truncate">
                {inviteLink}
              </div>
              <button 
                onClick={copyToClipboard}
                className={`px-4 rounded-2xl font-bold text-xs transition-all flex items-center gap-2 ${copySuccess ? 'bg-green-500 text-white shadow-lg shadow-green-100' : 'bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-200 uppercase'}`}
              >
                {copySuccess ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                    Copied
                  </>
                ) : 'Copy'}
              </button>
            </div>
          </div>

          <div className="h-px bg-slate-50"></div>

          {/* Join by Code Section */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Join by Invite Code</h3>
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="Paste code (e.g. X883XC4W)..." 
                className="flex-1 px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                value={inviteCodeInput}
                onChange={(e) => setInviteCodeInput(e.target.value.toUpperCase())}
              />
              <button 
                onClick={handleJoinByCode}
                className="px-6 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-indigo-700 hover:shadow-lg shadow-indigo-100 active:scale-95 transition-all"
              >
                Join
              </button>
            </div>
          </div>

          <div className="h-px bg-slate-50"></div>

          {/* Search Section */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Search by Username</h3>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input 
                type="text" 
                placeholder="Enter username (min. 2 characters)..." 
                className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {error && (
              <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-xs font-bold animate-shake">
                {error}
              </div>
            )}

            {success && (
              <div className="p-4 bg-green-50 border border-green-100 rounded-2xl text-green-600 text-xs font-bold">
                {success}
              </div>
            )}

            <div className="max-h-[250px] overflow-y-auto space-y-2 pr-2">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <div className="w-8 h-8 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                </div>
              ) : searchResults.length > 0 ? (
                searchResults.map(user => (
                  <div key={user.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-200 transition-all group">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-sm font-black text-slate-600 uppercase group-hover:bg-indigo-50 group-hover:text-indigo-600 group-hover:border-indigo-100 transition-colors">
                        {user.username.charAt(0)}
                      </div>
                      <span className="font-bold text-slate-900 group-hover:translate-x-1 transition-transform">{user.username}</span>
                    </div>
                    <button 
                      onClick={() => handleAddContact(user.username)}
                      className="px-4 py-2 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-indigo-700 hover:shadow-lg shadow-indigo-100 active:scale-95 transition-all"
                    >
                      Add Contact
                    </button>
                  </div>
                ))
              ) : searchTerm.length >= 2 ? (
                <div className="text-center py-8">
                  <p className="text-sm font-medium text-slate-400 italic">No users found.</p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddContactModal;
