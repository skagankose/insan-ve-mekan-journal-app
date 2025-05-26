import React from 'react';
import Select, { SingleValue } from 'react-select';
import countryList from 'react-select-country-list';
import { useLanguage } from '../contexts/LanguageContext';
import '../styles/LocationInput.css';

interface LocationInputProps {
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
    required?: boolean;
    id?: string;
    name?: string;
    className?: string;
}

interface CountryOption {
    label: string;
    value: string;
}

const LocationInput: React.FC<LocationInputProps> = ({
    value,
    onChange,
    disabled = false,
    required = false,
    id,
    name,
    className = 'form-input'
}) => {
    const { t } = useLanguage();
    const countries = React.useMemo(() => countryList().getData(), []);

    // Split the current value into location and country parts
    const [selectedCountry, setSelectedCountry] = React.useState<CountryOption | null>(null);
    const [locationWithinCountry, setLocationWithinCountry] = React.useState('');

    // Initialize the component with the current value
    React.useEffect(() => {
        if (value) {
            const parts = value.split(' | ');
            if (parts.length === 2) {
                const country = countries.find((c: CountryOption) => c.label === parts[1]);
                if (country) {
                    setSelectedCountry(country);
                    setLocationWithinCountry(parts[0]);
                }
            }
        }
    }, [value, countries]);

    // Handle country selection
    const handleCountryChange = (option: SingleValue<CountryOption>) => {
        setSelectedCountry(option);
        updateCombinedValue(locationWithinCountry, option);
    };

    // Handle location text change
    const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newLocation = e.target.value;
        setLocationWithinCountry(newLocation);
        updateCombinedValue(newLocation, selectedCountry);
    };

    // Combine location and country into a single value
    const updateCombinedValue = (location: string, country: CountryOption | null) => {
        if (country && location.trim()) {
            onChange(`${location.trim()} | ${country.label}`);
        } else {
            onChange('');
        }
    };

    return (
        <div className="location-input">
            <div className="location-input-section">
                <label className="location-label">{t('selectCountry') || 'Select Country'} {required && '*'}</label>
                <Select<CountryOption>
                    value={selectedCountry}
                    onChange={handleCountryChange}
                    options={countries}
                    isDisabled={disabled}
                    className="country-select"
                    classNamePrefix="country-select"
                    placeholder={t('selectCountry') || 'Select country'}
                    isClearable
                    required={required}
                />
            </div>
            
            <div className="location-input-section">
                <label className="location-label">
                    {t('locationInCountry') || 'Location in Country'} {required && '*'}
                </label>
                <input
                    type="text"
                    value={locationWithinCountry}
                    onChange={handleLocationChange}
                    placeholder={t('enterLocationInCountry') || 'Enter city, region, or area'}
                    disabled={disabled || !selectedCountry}
                    required={required}
                    id={id}
                    name={name}
                    className={`${className} location-text-input`}
                />
            </div>
            
            <small className="help-text">
                {t('locationFormatHelp') || 'First select a country, then specify your location within that country'}
            </small>
        </div>
    );
};

export default LocationInput; 