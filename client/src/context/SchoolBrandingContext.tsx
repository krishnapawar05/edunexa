import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { websiteApi } from '../services/api.js';
import { PublicWebsiteData } from '@edunexa/shared';

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
  logoUrl?: string;
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
  primaryAccent: '#244C3A', // Institutional Forest Green
  monogram: 'A',
  logoUrl: '',
};

interface SchoolBrandingContextType {
  branding: SchoolBranding;
  updateBranding: (updates: Partial<SchoolBranding>) => void;
  resetBranding: () => void;
  isCustomizing: boolean;
  setIsCustomizing: (val: boolean) => void;
  websiteData: PublicWebsiteData | null;
  loadingWebsiteData: boolean;
  refreshWebsiteData: () => Promise<void>;
}

const SchoolBrandingContext = createContext<SchoolBrandingContextType | undefined>(undefined);

const BRANDING_STORAGE_KEY = 'edunexa_school_branding';

export const SchoolBrandingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [branding, setBranding] = useState<SchoolBranding>(() => {
    try {
      const saved = localStorage.getItem(BRANDING_STORAGE_KEY);
      if (saved) return { ...DEFAULT_BRANDING, ...JSON.parse(saved) };
    } catch {
      // fallback
    }
    return DEFAULT_BRANDING;
  });
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [websiteData, setWebsiteData] = useState<PublicWebsiteData | null>(null);
  const [loadingWebsiteData, setLoadingWebsiteData] = useState<boolean>(true);

  const fetchWebsiteData = useCallback(async () => {
    try {
      setLoadingWebsiteData(true);
      const res = await websiteApi.getPublicData();
      if (res && res.success && res.data) {
        setWebsiteData(res.data);
        const sc = res.data.school;
        const config = (sc.brandingConfig as any) || {};

        setBranding((prev) => {
          const updated: SchoolBranding = {
            ...prev,
            schoolName: sc.name || prev.schoolName,
            shortName: config.shortName || sc.name?.split(' ')[0] || prev.shortName,
            code: sc.code || prev.code,
            tagline: sc.motto || config.tagline || prev.tagline,
            affiliation: config.affiliation || prev.affiliation,
            establishedYear: sc.establishedYear || config.establishedYear || prev.establishedYear,
            contactEmail: sc.email || prev.contactEmail,
            contactPhone: sc.phone || prev.contactPhone,
            address: sc.address ? `${sc.address}, ${sc.city || ''} ${sc.postalCode || ''}`.trim() : prev.address,
            primaryAccent: config.primaryAccent || prev.primaryAccent,
            monogram: config.monogram || sc.name?.charAt(0) || prev.monogram,
            logoUrl: sc.logoUrl || prev.logoUrl,
          };
          try {
            localStorage.setItem(BRANDING_STORAGE_KEY, JSON.stringify(updated));
          } catch {
            // ignore
          }
          return updated;
        });
      }
    } catch (err) {
      console.warn('Could not fetch public website data dynamically:', err);
    } finally {
      setLoadingWebsiteData(false);
    }
  }, []);

  useEffect(() => {
    fetchWebsiteData();
  }, [fetchWebsiteData]);

  const updateBranding = (updates: Partial<SchoolBranding>) => {
    setBranding((prev) => {
      const next = { ...prev, ...updates };
      try {
        localStorage.setItem(BRANDING_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const resetBranding = () => {
    setBranding(DEFAULT_BRANDING);
    try {
      localStorage.removeItem(BRANDING_STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  return (
    <SchoolBrandingContext.Provider
      value={{
        branding,
        updateBranding,
        resetBranding,
        isCustomizing,
        setIsCustomizing,
        websiteData,
        loadingWebsiteData,
        refreshWebsiteData: fetchWebsiteData,
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
