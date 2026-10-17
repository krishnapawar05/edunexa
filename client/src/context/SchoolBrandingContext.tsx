import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface SchoolBranding {
  schoolName: string;
  shortName: string;
  code: string;
  tagline: string;
  affiliation: string;
  establishedYear: number;
  contactEmail: string;
  contactPhone: string;
  address: string;
  primaryAccent: string; // CSS color
  monogram: string;
}

export const DEFAULT_BRANDING: SchoolBranding = {
  schoolName: 'Apex Academy of Sciences & Arts',
  shortName: 'Apex Academy',
  code: 'APX-01',
  tagline: 'Fostering Academic Excellence, Scientific Rigor & Global Leadership',
  affiliation: 'CBSE & Cambridge Assessment International Education',
  establishedYear: 1998,
  contactEmail: 'admissions@apexacademy.edu',
  contactPhone: '+91 (11) 2840-9100',
  address: 'Sector 14, Institutional Area, New Delhi, India 110025',
  primaryAccent: '#0F766E', // Institutional Teal
  monogram: 'A',
};

interface SchoolBrandingContextType {
  branding: SchoolBranding;
  updateBranding: (updates: Partial<SchoolBranding>) => void;
  resetBranding: () => void;
  isCustomizing: boolean;
  setIsCustomizing: (val: boolean) => void;
}

const SchoolBrandingContext = createContext<SchoolBrandingContextType | undefined>(undefined);

export const SchoolBrandingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [branding, setBranding] = useState<SchoolBranding>(DEFAULT_BRANDING);
  const [isCustomizing, setIsCustomizing] = useState(false);

  const updateBranding = (updates: Partial<SchoolBranding>) => {
    setBranding((prev) => ({ ...prev, ...updates }));
  };

  const resetBranding = () => {
    setBranding(DEFAULT_BRANDING);
  };

  return (
    <SchoolBrandingContext.Provider
      value={{
        branding,
        updateBranding,
        resetBranding,
        isCustomizing,
        setIsCustomizing,
      }}
    >
      {children}
    </SchoolBrandingContext.Provider>
  );
};

export const useSchoolBranding = () => {
  const context = useContext(SchoolBrandingContext);
  if (!context) {
    throw new Error('useSchoolBranding must be used within a SchoolBrandingProvider');
  }
  return context;
};
