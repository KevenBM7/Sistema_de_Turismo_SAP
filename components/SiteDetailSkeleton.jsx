import React from 'react';
import './SiteDetailSkeleton.css';

function SiteDetailSkeleton() {
  return (
    <div className="site-detail-skeleton">
      <div className="skeleton-category"></div>
      <div className="skeleton-title"></div>
      <div className="skeleton-carousel"></div>
      <div className="skeleton-address"></div>
      <div className="skeleton-actions">
        <div className="skeleton-button"></div>
        <div className="skeleton-button"></div>
      </div>
      <div className="skeleton-description">
        <div className="skeleton-line"></div>
        <div className="skeleton-line"></div>
        <div className="skeleton-line"></div>
        <div className="skeleton-line short"></div>
      </div>
      <div className="skeleton-comments-header"></div>
      <div className="skeleton-comment-form"></div>
      <div className="skeleton-comment"></div>
      <div className="skeleton-comment"></div>
    </div>
  );
}

export default SiteDetailSkeleton;