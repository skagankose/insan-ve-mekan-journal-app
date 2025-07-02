import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Journal } from '../services/apiService';
import * as apiService from '../services/apiService';

interface ActiveJournalContextType {
  activeJournal: Journal | null;
  setActiveJournal: (journal: Journal | null) => void;
  clearActiveJournal: () => void;
}

const ActiveJournalContext = createContext<ActiveJournalContextType | undefined>(undefined);

export const ActiveJournalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeJournal, setActiveJournalState] = useState<Journal | null>(null);

  // Load active journal from backend or localStorage on component mount
  useEffect(() => {
    const fetchActiveJournal = async () => {
      try {
        // First try to get settings from the backend to identify the active journal
        const settings = await apiService.getSettings();
        
        if (settings && settings.active_journal_id) {
          try {
            // Fetch the active journal from the backend
            const journals = await apiService.getJournals();
            const foundJournal = journals.find(journal => journal.id === settings.active_journal_id);
            
            if (foundJournal) {
              setActiveJournalState(foundJournal);
              // Update localStorage with the current active journal
              localStorage.setItem('activeJournal', JSON.stringify(foundJournal));
              // console.log('Active journal set from backend settings:', foundJournal.title);
              return;
            }
          } catch (err) {
            console.error('Error fetching active journal from backend:', err);
            // Continue to fallback to localStorage if backend fails
          }
        }
        
        // Fallback to localStorage if backend settings don't have an active journal
        const storedJournal = localStorage.getItem('activeJournal');
        if (storedJournal) {
          try {
            setActiveJournalState(JSON.parse(storedJournal));
            // console.log('Active journal loaded from localStorage');
          } catch (e) {
            console.error('Failed to parse active journal from localStorage', e);
            localStorage.removeItem('activeJournal');
          }
        }
      } catch (err) {
        console.error('Failed to fetch settings from backend:', err);
        
        // Fallback to localStorage if settings fetch fails
        const storedJournal = localStorage.getItem('activeJournal');
        if (storedJournal) {
          try {
            setActiveJournalState(JSON.parse(storedJournal));
          } catch (e) {
            console.error('Failed to parse active journal from localStorage', e);
            localStorage.removeItem('activeJournal');
          }
        }
      }
    };

    fetchActiveJournal();
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