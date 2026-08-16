import React, { createContext, useContext } from 'react';

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const settings = {
    bgColor: '#0f172a',
    bodyColor: '#f8fafc',
    navbarBg: '#19475F',
    sidebarTextColor: '#f8fafc',
    fontFamily: 'Poppins',
    fontSize: 16,
  };

  const getPageStyles = () => ({
    backgroundColor: '#0f172a',
    color: '#f8fafc',
  });

  return (
    <ThemeContext.Provider value={{ settings, getPageStyles }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);

  if (context) {
    return context;
  }

  return {
    settings: {},
    getPageStyles: () => ({ backgroundColor: '#0f172a', color: '#f8fafc' }),
  };
};

export const getContrastTextColor = () => '#f8fafc';

export default ThemeContext;
