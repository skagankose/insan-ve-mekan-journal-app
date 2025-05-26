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