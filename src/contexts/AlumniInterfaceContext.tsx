'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AlumniInterfaceContext as IAlumniInterfaceContext, AlumniFilters, InterfacePreferences, User, AlumniProfile } from '@/types';

interface AlumniInterfaceContextType {
  // Core interface state
  viewMode: 'institute' | 'global';
  setViewMode: (mode: 'institute' | 'global') => void;
  
  // Data filtering
  filters: AlumniFilters;
  setFilters: (filters: Partial<AlumniFilters>) => void;
  resetFilters: () => void;
  
  // User preferences
  preferences: InterfacePreferences;
  updatePreferences: (prefs: Partial<InterfacePreferences>) => void;
  
  // Interface state
  isTransitioning: boolean;
  showViewSwitcher: boolean;
  setShowViewSwitcher: (show: boolean) => void;
  
  // Data management
  instituteAlumni: AlumniProfile[];
  globalAlumni: AlumniProfile[];
  filteredAlumni: AlumniProfile[];
  loading: boolean;
  
  // Analytics
  trackViewSwitch: (from: string, to: string) => void;
  trackInteraction: (action: string, context: any) => void;
  
  // Smart features
  getRecommendedConnections: () => Promise<AlumniProfile[]>;
  getNetworkInsights: () => Promise<any>;
}

const AlumniInterfaceContext = createContext<AlumniInterfaceContextType | null>(null);

const defaultFilters: AlumniFilters = {
  graduationYear: [],
  department: [],
  location: [],
  company: [],
  skills: [],
  industry: [],
  isMentor: undefined,
  availability: undefined
};

const defaultPreferences: InterfacePreferences = {
  defaultView: 'institute',
  notifications: {
    newConnections: true,
    events: true,
    jobs: true,
    messages: true
  },
  privacy: {
    showInGlobalDirectory: true,
    allowCrossInstitutionMessages: true
  }
};

export function AlumniInterfaceProvider({ 
  children, 
  user 
}: { 
  children: ReactNode;
  user: User | null;
}) {
  // Core state
  const [viewMode, setViewModeState] = useState<'institute' | 'global'>('institute');
  const [filters, setFiltersState] = useState<AlumniFilters>(defaultFilters);
  const [preferences, setPreferences] = useState<InterfacePreferences>(defaultPreferences);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showViewSwitcher, setShowViewSwitcher] = useState(true);
  
  // Data state
  const [instituteAlumni, setInstituteAlumni] = useState<AlumniProfile[]>([]);
  const [globalAlumni, setGlobalAlumni] = useState<AlumniProfile[]>([]);
  const [loading, setLoading] = useState(false);

  // Initialize with user preferences
  useEffect(() => {
    if (user) {
      loadUserPreferences(user.id);
      setViewModeState(preferences.defaultView);
    }
  }, [user]);

  // Smart view switching with animation
  const setViewMode = async (mode: 'institute' | 'global') => {
    if (viewMode === mode) return;
    
    setIsTransitioning(true);
    trackViewSwitch(viewMode, mode);
    
    // Add smooth transition delay
    setTimeout(() => {
      setViewModeState(mode);
      setIsTransitioning(false);
    }, 300);
    
    // Load relevant data for the new view
    await loadAlumniForView(mode);
  };

  // Advanced filtering with AI enhancement
  const setFilters = (newFilters: Partial<AlumniFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFiltersState(updatedFilters);
    
    // Track filter usage for AI recommendations
    trackInteraction('apply_filter', {
      filters: newFilters,
      viewMode,
      timestamp: new Date().toISOString()
    });
  };

  const resetFilters = () => {
    setFiltersState(defaultFilters);
    trackInteraction('reset_filters', { viewMode });
  };

  // User preferences management
  const updatePreferences = async (prefs: Partial<InterfacePreferences>) => {
    const updated = { ...preferences, ...prefs };
    setPreferences(updated);
    
    if (user) {
      await saveUserPreferences(user.id, updated);
    }
  };

  // Data loading with caching
  const loadAlumniForView = async (mode: 'institute' | 'global') => {
    if (!user) return;
    
    setLoading(true);
    
    try {
      if (mode === 'institute') {
        if (instituteAlumni.length === 0) {
          const data = await fetchInstituteAlumni(user.institution?.id);
          setInstituteAlumni(data);
        }
      } else {
        if (globalAlumni.length === 0) {
          const data = await fetchGlobalAlumni();
          setGlobalAlumni(data);
        }
      }
    } catch (error) {
      console.error('Error loading alumni:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get filtered alumni based on current view and filters
  const filteredAlumni = React.useMemo(() => {
    const sourceAlumni = viewMode === 'institute' ? instituteAlumni : globalAlumni;
    
    return sourceAlumni.filter(alumni => {
      // Graduation year filter
      if (filters.graduationYear && filters.graduationYear.length > 0) {
        if (!filters.graduationYear.includes(alumni.graduationYear)) return false;
      }
      
      // Department filter
      if (filters.department && filters.department.length > 0) {
        if (!filters.department.includes(alumni.department)) return false;
      }
      
      // Location filter
      if (filters.location && filters.location.length > 0) {
        const alumniLocation = alumni.workLocation || alumni.user.institution?.location || '';
        if (!filters.location.some(loc => alumniLocation.toLowerCase().includes(loc.toLowerCase()))) {
          return false;
        }
      }
      
      // Company filter
      if (filters.company && filters.company.length > 0) {
        if (!alumni.currentCompany || !filters.company.includes(alumni.currentCompany)) return false;
      }
      
      // Skills filter
      if (filters.skills && filters.skills.length > 0) {
        const alumniSkills = alumni.skills.map(s => s.name.toLowerCase());
        if (!filters.skills.some(skill => alumniSkills.includes(skill.toLowerCase()))) {
          return false;
        }
      }
      
      // Industry filter
      if (filters.industry && filters.industry.length > 0) {
        if (!alumni.industry || !filters.industry.includes(alumni.industry)) return false;
      }
      
      // Mentor filter
      if (filters.isMentor !== undefined && alumni.isMentor !== filters.isMentor) {
        return false;
      }
      
      // Availability filter (would need real-time presence data)
      if (filters.availability) {
        // This would integrate with real-time presence system
        // For now, we'll use lastActive as a proxy
        const lastActive = new Date(alumni.lastActive);
        const hoursSinceActive = (Date.now() - lastActive.getTime()) / (1000 * 60 * 60);
        
        switch (filters.availability) {
          case 'available':
            if (hoursSinceActive > 1) return false;
            break;
          case 'busy':
            if (hoursSinceActive < 1 || hoursSinceActive > 24) return false;
            break;
          case 'offline':
            if (hoursSinceActive < 24) return false;
            break;
        }
      }
      
      return true;
    });
  }, [viewMode, instituteAlumni, globalAlumni, filters]);

  // AI-powered recommendations
  const getRecommendedConnections = async (): Promise<AlumniProfile[]> => {
    if (!user) return [];
    
    try {
      const response = await fetch('/api/ai/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          viewMode,
          context: 'networking'
        })
      });
      
      const data = await response.json();
      return data.recommendations || [];
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      return [];
    }
  };

  // Network insights and analytics
  const getNetworkInsights = async () => {
    if (!user) return null;
    
    try {
      const response = await fetch(`/api/analytics/network/${user.id}?view=${viewMode}`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching network insights:', error);
      return null;
    }
  };

  // Analytics tracking
  const trackViewSwitch = (from: string, to: string) => {
    // Send analytics event
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'view_switch', {
        from_view: from,
        to_view: to,
        user_id: user?.id,
        institution_id: user?.institution?.id,
        timestamp: new Date().toISOString()
      });
    }
    
    // Also send to our internal analytics
    fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'view_switch',
        userId: user?.id,
        properties: { from, to, viewMode }
      })
    }).catch(console.error);
  };

  const trackInteraction = (action: string, context: any) => {
    fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: action,
        userId: user?.id,
        properties: { ...context, viewMode }
      })
    }).catch(console.error);
  };

  // Data fetching functions
  const fetchInstituteAlumni = async (institutionId?: string): Promise<AlumniProfile[]> => {
    if (!institutionId) return [];
    
    const response = await fetch(`/api/alumni?institution=${institutionId}&limit=1000`);
    const data = await response.json();
    return data.alumni || [];
  };

  const fetchGlobalAlumni = async (): Promise<AlumniProfile[]> => {
    const response = await fetch('/api/alumni?global=true&limit=1000');
    const data = await response.json();
    return data.alumni || [];
  };

  const loadUserPreferences = async (userId: string) => {
    try {
      const response = await fetch(`/api/users/${userId}/preferences`);
      const data = await response.json();
      if (data.preferences) {
        setPreferences({ ...defaultPreferences, ...data.preferences });
      }
    } catch (error) {
      console.error('Error loading user preferences:', error);
    }
  };

  const saveUserPreferences = async (userId: string, prefs: InterfacePreferences) => {
    try {
      await fetch(`/api/users/${userId}/preferences`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences: prefs })
      });
    } catch (error) {
      console.error('Error saving user preferences:', error);
    }
  };

  // Initialize data loading
  useEffect(() => {
    if (user) {
      loadAlumniForView(viewMode);
    }
  }, [user, viewMode]);

  const contextValue: AlumniInterfaceContextType = {
    viewMode,
    setViewMode,
    filters,
    setFilters,
    resetFilters,
    preferences,
    updatePreferences,
    isTransitioning,
    showViewSwitcher,
    setShowViewSwitcher,
    instituteAlumni,
    globalAlumni,
    filteredAlumni,
    loading,
    trackViewSwitch,
    trackInteraction,
    getRecommendedConnections,
    getNetworkInsights
  };

  return (
    <AlumniInterfaceContext.Provider value={contextValue}>
      {children}
    </AlumniInterfaceContext.Provider>
  );
}

export function useAlumniInterface() {
  const context = useContext(AlumniInterfaceContext);
  if (!context) {
    throw new Error('useAlumniInterface must be used within AlumniInterfaceProvider');
  }
  return context;
}

// Hook for smart interface suggestions
export function useSmartInterfaceSuggestions() {
  const { viewMode, filters, trackInteraction } = useAlumniInterface();
  
  const getSuggestions = React.useCallback(async () => {
    const suggestions = [];
    
    // Suggest switching views based on activity
    if (viewMode === 'institute' && filters.industry && filters.industry.length > 0) {
      suggestions.push({
        type: 'view_switch',
        title: 'Explore Global Network',
        description: `Find more professionals in ${filters.industry.join(', ')} globally`,
        action: () => trackInteraction('suggestion_clicked', { type: 'global_switch' })
      });
    }
    
    if (viewMode === 'global' && Object.values(filters).every(f => !f || (Array.isArray(f) && f.length === 0))) {
      suggestions.push({
        type: 'filter_suggestion',
        title: 'Narrow Your Search',
        description: 'Apply filters to find more relevant connections',
        action: () => trackInteraction('suggestion_clicked', { type: 'apply_filters' })
      });
    }
    
    return suggestions;
  }, [viewMode, filters, trackInteraction]);
  
  return { getSuggestions };
}