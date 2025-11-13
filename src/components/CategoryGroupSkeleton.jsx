import React from 'react';
import './CategoryGroupSkeleton.css';


function CategoryGroupSkeleton() {
  return (
    <div className="category-group-skeleton">
      <div className="skeleton-group-title"></div>
      <div className="skeleton-buttons-container">
        <div className="skeleton-cat-button"></div>
        <div className="skeleton-cat-button short"></div>
        <div className="skeleton-cat-button"></div>
      </div>
    </div>
  );
}

export default CategoryGroupSkeleton;