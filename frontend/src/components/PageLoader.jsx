import React from 'react';
import { LOGO } from '../site-data';

// Display only during genuine pending module/content loads; never add arbitrary delays.
export default function PageLoader({ message='Preparing your page' }) {
  return (
    <div className="page-loader" role="status" aria-label={message} aria-live="polite" aria-busy="true">
      <div className="page-loader__inner">
        <img className="page-loader__logo" src={LOGO} alt="Kandy Ads" />
        <div className="page-loader__caption">{message}</div>
        <div className="page-loader__line" aria-hidden="true" />
      </div>
    </div>
  );
}
