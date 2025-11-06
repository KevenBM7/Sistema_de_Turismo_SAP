import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function SearchBar({ onSearch }) {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      if (onSearch) {
        onSearch(); // Cierra el menú si la función es proporcionada
      }
      setQuery('');
    }
  };

  return (
    <form onSubmit={handleSearch} className="search-bar">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar sitios por nombre..."
      />
      <button type="submit">🔍</button>
    </form>
  );
}

export default SearchBar;