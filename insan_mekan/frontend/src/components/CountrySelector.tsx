import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '../contexts/LanguageContext';
import '../styles/CountrySelector.css';

interface Country {
    code: string;
    name: string;
    flag: string;
}

interface CountrySelectorProps {
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
    required?: boolean;
    id?: string;
    name?: string;
}

// Popular countries list with flags
const countries: Country[] = [
    { code: 'TR', name: 'Turkey', flag: '🇹🇷' },
    { code: 'US', name: 'United States', flag: '🇺🇸' },
    { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
    { code: 'DE', name: 'Germany', flag: '🇩🇪' },
    { code: 'FR', name: 'France', flag: '🇫🇷' },
    { code: 'IT', name: 'Italy', flag: '🇮🇹' },
    { code: 'ES', name: 'Spain', flag: '🇪🇸' },
    { code: 'NL', name: 'Netherlands', flag: '🇳🇱' },
    { code: 'BE', name: 'Belgium', flag: '🇧🇪' },
    { code: 'CH', name: 'Switzerland', flag: '🇨🇭' },
    { code: 'AT', name: 'Austria', flag: '🇦🇹' },
    { code: 'SE', name: 'Sweden', flag: '🇸🇪' },
    { code: 'NO', name: 'Norway', flag: '🇳🇴' },
    { code: 'DK', name: 'Denmark', flag: '🇩🇰' },
    { code: 'FI', name: 'Finland', flag: '🇫🇮' },
    { code: 'PL', name: 'Poland', flag: '🇵🇱' },
    { code: 'CZ', name: 'Czech Republic', flag: '🇨🇿' },
    { code: 'HU', name: 'Hungary', flag: '🇭🇺' },
    { code: 'GR', name: 'Greece', flag: '🇬🇷' },
    { code: 'PT', name: 'Portugal', flag: '🇵🇹' },
    { code: 'IE', name: 'Ireland', flag: '🇮🇪' },
    { code: 'RU', name: 'Russia', flag: '🇷🇺' },
    { code: 'UA', name: 'Ukraine', flag: '🇺🇦' },
    { code: 'JP', name: 'Japan', flag: '🇯🇵' },
    { code: 'KR', name: 'South Korea', flag: '🇰🇷' },
    { code: 'CN', name: 'China', flag: '🇨🇳' },
    { code: 'IN', name: 'India', flag: '🇮🇳' },
    { code: 'AU', name: 'Australia', flag: '🇦🇺' },
    { code: 'CA', name: 'Canada', flag: '🇨🇦' },
    { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
    { code: 'MX', name: 'Mexico', flag: '🇲🇽' },
    { code: 'AR', name: 'Argentina', flag: '🇦🇷' },
    { code: 'CL', name: 'Chile', flag: '🇨🇱' },
    { code: 'ZA', name: 'South Africa', flag: '🇿🇦' },
    { code: 'EG', name: 'Egypt', flag: '🇪🇬' },
    { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦' },
    { code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪' },
    { code: 'IL', name: 'Israel', flag: '🇮🇱' },
    { code: 'SG', name: 'Singapore', flag: '🇸🇬' },
    { code: 'MY', name: 'Malaysia', flag: '🇲🇾' },
    { code: 'TH', name: 'Thailand', flag: '🇹🇭' },
    { code: 'ID', name: 'Indonesia', flag: '🇮🇩' },
    { code: 'PH', name: 'Philippines', flag: '🇵🇭' },
    { code: 'VN', name: 'Vietnam', flag: '🇻🇳' },
    { code: 'NZ', name: 'New Zealand', flag: '🇳🇿' },
];

const CountrySelector: React.FC<CountrySelectorProps> = ({
    value,
    onChange,
    disabled = false,
    required = false,
    id,
    name
}) => {
    const { t } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredCountries, setFilteredCountries] = useState(countries);
    const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0, width: 0 });

    const controlRef = useRef<HTMLDivElement>(null); // Ref for the control element
    const menuRef = useRef<HTMLDivElement>(null); // Ref for the menu element (portal)
    const searchInputRef = useRef<HTMLInputElement>(null);

    const selectedCountry = countries.find(country => country.name === value);

    useEffect(() => {
        const filtered = countries.filter(country =>
            country.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredCountries(filtered);
    }, [searchTerm]);

    // Click outside handler
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            // Check if click is outside the control and outside the menu (if menu exists)
            if (controlRef.current && !controlRef.current.contains(event.target as Node) &&
                menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setSearchTerm('');
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    // Position menu and focus search input when opened
    useEffect(() => {
        const calculatePosition = () => {
            if (controlRef.current) {
                const rect = controlRef.current.getBoundingClientRect();
                setMenuPosition({
                    top: rect.bottom + window.scrollY + 2, // Add a small gap
                    left: rect.left + window.scrollX,
                    width: rect.width,
                });
            }
        };

        if (isOpen) {
            calculatePosition();
            setTimeout(() => searchInputRef.current?.focus(), 100);
            window.addEventListener('resize', calculatePosition);
            window.addEventListener('scroll', calculatePosition, true); // Use capture for scroll
        }

        return () => {
            window.removeEventListener('resize', calculatePosition);
            window.removeEventListener('scroll', calculatePosition, true);
        };
    }, [isOpen]);

    const handleToggle = () => {
        if (!disabled) {
            setIsOpen(!isOpen);
            if (isOpen) { // If it was open and is now closing
                setSearchTerm('');
            }
        }
    };

    const handleSelect = (country: Country) => {
        onChange(country.name);
        setIsOpen(false);
        setSearchTerm('');
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange('');
        setIsOpen(false);
        setSearchTerm('');
    };

    const MenuContent = (
        <div 
            ref={menuRef}
            className="country-selector__menu country-selector__menu--portal"
            style={{
                position: 'fixed',
                top: `${menuPosition.top}px`,
                left: `${menuPosition.left}px`,
                width: `${menuPosition.width}px`,
            }}
        >
            <div className="country-selector__search">
                <input
                    ref={searchInputRef}
                    type="text"
                    placeholder={t('searchCountries') || 'Search countries...'}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="country-selector__search-input"
                />
            </div>
            <div className="country-selector__menu-list">
                {filteredCountries.length > 0 ? (
                    filteredCountries.map((country) => (
                        <div
                            key={country.code}
                            className={`country-selector__option ${selectedCountry?.code === country.code ? 'country-selector__option--is-selected' : ''}`}
                            onClick={() => handleSelect(country)}
                        >
                            <span className="country-flag">{country.flag}</span>
                            <span className="country-name">{country.name}</span>
                        </div>
                    ))
                ) : (
                    <div className="country-selector__no-options">
                        {t('noCountriesFound') || 'No countries found'}
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="country-selector" ref={controlRef}>
            <div 
                className={`country-selector__control ${isOpen ? 'country-selector__control--is-focused' : ''} ${disabled ? 'country-selector__control--is-disabled' : ''}`}
                onClick={handleToggle}
            >
                <div className="country-selector__value-container">
                    {selectedCountry ? (
                        <div className="country-selector__single-value">
                            <span className="country-flag">{selectedCountry.flag}</span>
                            <span className="country-name">{selectedCountry.name}</span>
                        </div>
                    ) : (
                        <div className="country-selector__placeholder">
                            {t('selectCountry') || 'Select country'}
                        </div>
                    )}
                </div>
                
                <div className="country-selector__indicators">
                    {selectedCountry && !disabled && (
                        <button
                            type="button"
                            className="country-selector__clear-indicator"
                            onClick={handleClear}
                            aria-label="Clear selection"
                        >
                            ×
                        </button>
                    )}
                    <div className={`country-selector__dropdown-indicator ${isOpen ? 'country-selector__dropdown-indicator--rotated' : ''}`}>
                        ▼
                    </div>
                </div>
            </div>

            {isOpen && typeof document !== 'undefined' && createPortal(MenuContent, document.body)}

            <input
                type="hidden"
                id={id}
                name={name}
                value={value}
                required={required}
            />
        </div>
    );
};

export default CountrySelector; 