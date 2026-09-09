'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

function SearchBar({ onSearch }) {
  const [query, setQuery] = useState('');
  const router = useRouter();

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
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
        placeholder="Buscar sitios, eventos, categorías..."
      />
      <button type="submit">🔍</button>
    </form>
  );
}

export default SearchBar;