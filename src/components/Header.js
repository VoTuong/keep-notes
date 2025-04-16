import React from 'react';
import './Header.css';

const Header = ({ handleToggleDarkMode }) => {
  return (
    <div className="header">
      <h1>Online Notes</h1>
      <button 
        onClick={() => handleToggleDarkMode((previousDarkMode) => !previousDarkMode)}
        className="toggle-button"
      >
        Toggle Theme
      </button>
    </div>
  );
};

export default Header;
