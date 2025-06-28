import React from 'react';
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
    maxLength?: number;
    title?: string;
}

const LocationInput: React.FC<LocationInputProps> = ({
    value,
    onChange,
    disabled = false,
    required = false,
    id,
    name,
    className = 'form-input',
    maxLength,
    title
}) => {
    const { t } = useLanguage();

    const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(e.target.value);
    };

    return (
        <div className="location-input">
            <input
                type="text"
                value={value}
                onChange={handleLocationChange}
                placeholder={t('enterLocation') || 'Enter your location (city, country)'}
                disabled={disabled}
                required={required}
                id={id}
                name={name}
                className={`${className} location-text-input`}
                maxLength={maxLength}
                title={title}
            />
        </div>
    );
};

export default LocationInput; 