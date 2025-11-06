import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db } from '../services/firebase';
import CategoryCard from './CategoryCard';
import { Link } from 'react-router-dom';

function CategoryList({ categoryLimit }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const constraints = [orderBy('name')];
    if (categoryLimit) {
      constraints.push(limit(categoryLimit));
    }
    const q = query(collection(db, 'categories'), ...constraints);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const cats = snapshot.docs.map(doc => doc.data().name);
      setCategories(cats);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [categoryLimit]);

  if (loading) {
    return <p>Cargando categorías...</p>;
  }

  if (categories.length === 0) {
    return <p>No hay categorías para mostrar.</p>;
  }

  return (
    <div className="category-list-container">
      <div className="category-list">
        {categories.map(category => (
          <CategoryCard key={category} categoryName={category} />
        ))}
      </div>
    </div>
  );
}

export default CategoryList;