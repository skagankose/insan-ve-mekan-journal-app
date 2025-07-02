import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Journal } from '../services/apiService';
import * as apiService from '../services/apiService';

interface ActiveJournalContextType {
  activeJournal: Journal | null;
  setActiveJournal: (journal: Journal | null) => void;
  clearActiveJournal: () => void;
  refreshActiveJournal: () => Promise<void>;
}

const ActiveJournalContext = createContext<ActiveJournalContextType | undefined>(undefined);

export const ActiveJournalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeJournal, setActiveJournalState] = useState<Journal | null>(null);

  // Load active journal from backend settings (global setting)
  const fetchActiveJournalFromBackend = async () => {
    try {
      // Get settings from the backend to identify the global active journal
      const settings = await apiService.getSettings();
      
      if (settings && settings.active_journal_id) {
        try {
          // Fetch the active journal from the backend
          const journals = await apiService.getJournals();
          const foundJournal = journals.find(journal => journal.id === settings.active_journal_id);
          
          if (foundJournal) {
            setActiveJournalState(foundJournal);
            console.log('Active journal set from backend settings:', foundJournal.title);
            return foundJournal;
          }
        } catch (err) {
          console.error('Error fetching active journal from backend:', err);
        }
      }
      
      // If no active journal in settings or journal not found, clear state
      setActiveJournalState(null);
      return null;
      
    } catch (err) {
      console.error('Failed to fetch settings from backend:', err);
      // Only use localStorage as absolute fallback if backend is completely unavailable
      const storedJournal = localStorage.getItem('activeJournal');
      if (storedJournal) {
        try {
          const journal = JSON.parse(storedJournal);
          setActiveJournalState(journal);
          console.log('Active journal loaded from localStorage (fallback)');
          return journal;
        } catch (e) {
          console.error('Failed to parse active journal from localStorage', e);
          localStorage.removeItem('activeJournal');
        }
      }
      return null;
    }
  };

  useEffect(() => {
    fetchActiveJournalFromBackend();
  }, []);

  // Update the active journal - this should NOT update backend, only local state
  // Backend updates should be done explicitly via API calls in UI components
  const setActiveJournal = (journal: Journal | null) => {
    setActiveJournalState(journal);
    
    // Keep localStorage in sync for fallback purposes only
    if (journal) {
      localStorage.setItem('activeJournal', JSON.stringify(journal));
    } else {
      localStorage.removeItem('activeJournal');
    }
  };

  const clearActiveJournal = () => {
    setActiveJournalState(null);
    localStorage.removeItem('activeJournal');
  };

  // Function to refresh active journal from backend (useful after backend updates)
  const refreshActiveJournal = async () => {
    await fetchActiveJournalFromBackend();
  };

  return (
    <ActiveJournalContext.Provider value={{ 
      activeJournal, 
      setActiveJournal, 
      clearActiveJournal,
      refreshActiveJournal 
    }}>
      {children}
    </ActiveJournalContext.Provider>
  );
};

export const useActiveJournal = (): ActiveJournalContextType => {
  const context = useContext(ActiveJournalContext);
  if (context === undefined) {
    throw new Error('useActiveJournal must be used within an ActiveJournalProvider');
  }
  return context;
}; 