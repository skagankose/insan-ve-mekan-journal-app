// YÖKSİS ID validation (5-8 digits)
export const validateYoksisId = (id: string): boolean => {
    const yoksisPattern = /^\d{5,8}$/;
    return yoksisPattern.test(id);
};

// Format YÖKSİS ID (just ensure it's numeric and limit to 8 digits)
export const formatYoksisId = (id: string): string => {
    const digits = id.replace(/[^\d]/g, '');
    return digits.slice(0, 8); // Limit to 8 digits
};

// ORCID ID validation (0000-0000-0000-0000 format)
export const validateOrcidId = (id: string): boolean => {
    const orcidPattern = /^\d{4}-\d{4}-\d{4}-\d{4}$/;
    return orcidPattern.test(id);
};

// Format ORCID ID (add hyphens automatically)
export const formatOrcidId = (id: string): string => {
    // Remove all non-digits
    const digits = id.replace(/[^\d]/g, '');
    
    // If we have less than 16 digits, just return what we have
    if (digits.length < 16) {
        // Add hyphens to what we have if we have enough digits
        return digits.match(/.{1,4}/g)?.join('-') || digits;
    }
    
    // Take only first 16 digits and format them
    return digits.slice(0, 16).match(/.{4}/g)?.join('-') || digits;
};

// Phone number validation (basic validation for international format)
export const validatePhoneNumber = (countryCode: string, phoneNumber: string): boolean => {
    // Clean the inputs
    const trimmedCountryCode = countryCode?.trim() || '';
    const trimmedPhoneNumber = phoneNumber?.trim() || '';
    
    // If both are empty, it's valid (optional field)
    if (!trimmedCountryCode && !trimmedPhoneNumber) {
        return true;
    }
    
    // If one is provided, both must be provided
    if (!trimmedCountryCode || !trimmedPhoneNumber) {
        return false;
    }
    
    // Country code should start with + and have 1-4 digits
    const countryCodePattern = /^\+\d{1,4}$/;
    if (!countryCodePattern.test(trimmedCountryCode)) {
        return false;
    }
    
    // Phone number should have at least 7 digits (removing spaces and other non-digit characters)
    const digitsOnly = trimmedPhoneNumber.replace(/\D/g, '');
    
    // Must have between 7 and 15 digits
    if (digitsOnly.length < 7 || digitsOnly.length > 15) {
        return false;
    }
    
    // The formatted input should only contain digits and spaces
    const phonePattern = /^[\d\s]+$/;
    if (!phonePattern.test(trimmedPhoneNumber)) {
        return false;
    }
    
    return true;
}; 