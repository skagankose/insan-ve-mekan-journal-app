declare module 'react-phone-input-2' {
    import * as React from 'react';

    export interface PhoneInputProps {
        country?: string;
        value?: string;
        onChange?: (phone: string, country: any) => void;
        inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
        containerClass?: string;
        inputClass?: string;
        buttonClass?: string;
        disabled?: boolean;
        enableSearch?: boolean;
        searchPlaceholder?: string;
        searchNotFound?: string;
        preferredCountries?: string[];
    }

    const PhoneInput: React.FC<PhoneInputProps>;
    export default PhoneInput;
} 