import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

/**
 * Wrap any learner page content with this to apply the admin-configured theme.
 * It sets font, colour, and background from the saved settings.
 * 
 * Usage:
 *   <ThemedLayout>
 *     <YourLearnerPage />
 *   </ThemedLayout>
 * 
 * Or use the useTheme() hook directly for more control.
 */
const ThemedLayout = ({ children, className = '' }) => {
  const { settings } = useTheme();

  return (
    <div
      className={`min-h-screen w-full transition-colors duration-300 ${className}`}
      style={{
        fontFamily: `'${settings.fontFamily}', sans-serif`,
        fontSize: settings.fontSize + 'px',
        color: settings.bodyColor,
        backgroundColor: settings.bgColor,
      }}
    >
      {children}
    </div>
  );
};

export default ThemedLayout;
