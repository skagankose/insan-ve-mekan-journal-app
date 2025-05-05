import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Journal } from '../services/apiService';

interface ActiveJournalContextType {
  activeJournal: Journal | null;
  setActiveJournal: (journal: Journal | null) => void;
  clearActiveJournal: () => void;
}

const ActiveJournalContext = createContext<ActiveJournalContextType | undefined>(undefined);

export const ActiveJournalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeJournal, setActiveJournalState] = useState<Journal | null>(null);

  // Load active journal from localStorage on component mount
  useEffect(() => {
    const storedJournal = localStorage.getItem('activeJournal');
    if (storedJournal) {
      try {
        setActiveJournalState(JSON.parse(storedJournal));
      } catch (e) {
        console.error('Failed to parse active journal from localStorage', e);
        localStorage.removeItem('activeJournal');
      }
    }
  }, []);

  // Save active journal to localStorage whenever it changes
  const setActiveJournal = (journal: Journal | null) => {
    setActiveJournalState(journal);
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

  return (
    <ActiveJournalContext.Provider value={{ activeJournal, setActiveJournal, clearActiveJournal }}>
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