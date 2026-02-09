import React, { createContext, useContext, useState, useEffect } from 'react';

interface ViewModeContextType {
  compactMode: boolean;
  toggleCompactMode: () => void;
}

const ViewModeContext = createContext<ViewModeContextType | undefined>(undefined);

export const ViewModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [compactMode, setCompactMode] = useState(() => 
    localStorage.getItem('global-compact-mode') === 'true'
  );

  const toggleCompactMode = () => {
    const newMode = !compactMode;
    setCompactMode(newMode);
    localStorage.setItem('global-compact-mode', newMode.toString());
  };

  const value = {
    compactMode,
    toggleCompactMode
  };

  return (
    <ViewModeContext.Provider value={value}>
      {children}
    </ViewModeContext.Provider>
  );
};

export const useViewMode = () => {
  const context = useContext(ViewModeContext);
  if (context === undefined) {
    throw new Error('useViewMode must be used within a ViewModeProvider');
  }
  return context;
};