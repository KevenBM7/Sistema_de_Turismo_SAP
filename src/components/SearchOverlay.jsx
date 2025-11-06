import React from 'react';
import SearchBar from './SearchBar';

function SearchOverlay({ isActive, onClose }) {
  if (!isActive) {
    return null;
  }

  return (
    <div className="search-overlay active" onClick={onClose}>
      <div className="search-overlay-content" onClick={(e) => e.stopPropagation()}>
        <button className="close-search-overlay" onClick={onClose}>×</button>
        <h2>Buscar un sitio</h2>
        <p>Encuentra lugares turísticos por su nombre.</p>
        <SearchBar onSearch={onClose} />
      </div>
    </div>
  );
}

export default SearchOverlay;