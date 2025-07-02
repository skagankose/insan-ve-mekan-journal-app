declare module 'react-select-country-list' {
    interface CountryData {
        label: string;
        value: string;
    }

    function countryList(): {
        getData: () => CountryData[];
        getValue: (label: string) => string;
        getLabel: (value: string) => string;
        getLabels: () => string[];
        getValues: () => string[];
    };

    export = countryList;
} 