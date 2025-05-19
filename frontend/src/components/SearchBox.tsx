import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchAll, SearchResults } from '../services/apiService';
import '../styles/SearchBox.css';

const SearchBox: React.FC = () => {
  const [query, setQuery] = useState<string>('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showResults, setShowResults] = useState<boolean>(false);
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Add keyboard shortcut (/) to focus the search box
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if we're not in an input or textarea element
      const tagName = document.activeElement?.tagName.toLowerCase();
      if (
        event.key === '/' && 
        tagName !== 'input' && 
        tagName !== 'textarea' &&
        inputRef.current
      ) {
        event.preventDefault();
        inputRef.current.focus();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);
  
  // Handle search
  useEffect(() => {
    const handleSearch = async () => {
      if (query.length >= 2) {
        setIsLoading(true);
        try {
          const searchResults = await searchAll(query);
          setResults(searchResults);
          setShowResults(true);
        } catch (error) {
          console.error('Search failed:', error);
        } finally {
          setIsLoading(false);
        }
      } else {
        setResults(null);
        setShowResults(false);
      }
    };
    
    const timeoutId = setTimeout(handleSearch, 300);
    return () => clearTimeout(timeoutId);
  }, [query]);
  
  // Handle navigation when a result is clicked
  const handleResultClick = (type: 'user' | 'journal' | 'entry', id: number) => {
    setShowResults(false);
    setQuery(''); // Clear the search input after navigation
    
    switch(type) {
      case 'user':
        navigate(`/admin/users/profile/${id}`);
        break;
      case 'journal':
        navigate(`/journals/${id}`);
        break;
      case 'entry':
        navigate(`/entries/${id}`);
        break;
    }
  };
  
  return (
    <div className="search-box" ref={searchRef}>
      <div className="search-input-container">
        <input
          ref={inputRef}
          type="text"
          className="search-input"
          placeholder="Search..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            setIsFocused(true);
            if (query.length >= 2) setShowResults(true);
          }}
          onBlur={() => setIsFocused(false)}
        />
        {isLoading && <div className="search-spinner"></div>}
        {!isFocused && !isLoading && <span className="search-shortcut-hint">/</span>}
      </div>
      
      {showResults && results && (
        <div className="search-results">
          {/* Users section */}
          {results.users.length > 0 && (
            <div className="search-section">
              <h3 className="search-section-title">Users</h3>
              <ul className="search-result-list">
                {results.users.map((user) => (
                  <li 
                    key={`user-${user.id}`} 
                    className="search-result-item"
                    onClick={() => handleResultClick('user', user.id)}
                  >
                    <span className="result-icon">👤</span>
                    <span className="result-text">{user.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Journals section */}
          {results.journals.length > 0 && (
            <div className="search-section">
              <h3 className="search-section-title">Journals</h3>
              <ul className="search-result-list">
                {results.journals.map((journal) => (
                  <li 
                    key={`journal-${journal.id}`} 
                    className="search-result-item"
                    onClick={() => handleResultClick('journal', journal.id)}
                  >
                    <span className="result-icon">📚</span>
                    <span className="result-text">{journal.title}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Journal entries section */}
          {results.entries.length > 0 && (
            <div className="search-section">
              <h3 className="search-section-title">Papers</h3>
              <ul className="search-result-list">
                {results.entries.map((entry) => (
                  <li 
                    key={`entry-${entry.id}`} 
                    className="search-result-item"
                    onClick={() => handleResultClick('entry', entry.id)}
                  >
                    <span className="result-icon">📄</span>
                    <span className="result-text">{entry.title}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* No results message */}
          {results.users.length === 0 && results.journals.length === 0 && results.entries.length === 0 && (
            <div className="no-results">No results found</div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBox; 