import React, { useState, useEffect } from 'react';
import { validateYoksisId, formatYoksisId, validateOrcidId, formatOrcidId } from '../utils/validation';

interface FormattedIdInputProps {
    type: 'yoksis' | 'orcid';
    value: string;
    onChange: (value: string) => void;
    onValidityChange?: (isValid: boolean) => void;
    disabled?: boolean;
    required?: boolean;
    id?: string;
    name?: string;
    className?: string;
}

const FormattedIdInput: React.FC<FormattedIdInputProps> = ({
    type,
    value,
    onChange,
    onValidityChange,
    disabled = false,
    required = false,
    id,
    name,
    className = 'form-input'
}) => {
    const [isValid, setIsValid] = useState(true);
    const [isFocused, setIsFocused] = useState(false);

    // Determine validation and formatting functions based on type
    const validateId = type === 'yoksis' ? validateYoksisId : validateOrcidId;
    const formatId = type === 'yoksis' ? formatYoksisId : formatOrcidId;

    // Get placeholder based on type
    const getPlaceholder = () => {
        return type === 'yoksis' ? '12345678' : '0000-0000-0000-0000';
    };

    // Handle input change
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = formatId(e.target.value);
        onChange(newValue);
    };

    // Validate on blur
    const handleBlur = () => {
        setIsFocused(false);
        const valid = validateId(value);
        setIsValid(valid);
        onValidityChange?.(valid);
    };

    // Handle focus
    const handleFocus = () => {
        setIsFocused(true);
    };

    // Effect to check validity when value changes
    useEffect(() => {
        if (!isFocused && value) {
            const valid = validateId(value);
            setIsValid(valid);
            onValidityChange?.(valid);
        }
    }, [value, isFocused, onValidityChange]);

    return (
        <div className="formatted-id-input">
            <input
                type="text"
                value={value}
                onChange={handleChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
                placeholder={getPlaceholder()}
                disabled={disabled}
                required={required}
                id={id}
                name={name}
                className={`${className} ${!isValid && !isFocused ? 'invalid' : ''}`}
            />
            {!isValid && !isFocused && (
                <div className="error-message">
                    {type === 'yoksis' 
                        ? 'YÖKSİS ID must be 5-8 digits'
                        : 'ORCID must be in 0000-0000-0000-0000 format'}
                </div>
            )}
            {type === 'orcid' && value && (
                <div className="help-text">
                    <a 
                        href={`https://orcid.org/${value}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="orcid-link"
                    >
                        View ORCID Profile
                    </a>
                </div>
            )}
        </div>
    );
};

export default FormattedIdInput; 