import React from 'react';
import fallbackImage from '../assets/projects/project-fallback.svg';

// Vite converts these source assets into fingerprinted production URLs.
// Do not construct /src/assets/... URLs: that directory isn't publicly served after build.
const projectAssets = import.meta.glob('../assets/*.{png,jpg,jpeg,webp,avif}', {
  eager: true,
  query: '?url',
  import: 'default',
});

export function resolveProjectImage(filename) {
  if (typeof filename !== 'string' || filename.length === 0) return fallbackImage;
  return projectAssets[`../assets/${filename}`] || fallbackImage;
}

export default function ProjectImage({ filename, alt, loading = 'lazy', ...props }) {
  return (
    <img
      key={filename || 'portfolio-fallback'}
      {...props}
      src={resolveProjectImage(filename)}
      alt={alt || 'Kandy Ads portfolio project'}
      loading={loading}
      decoding="async"
      onError={(event) => {
        const image = event.currentTarget;
        if (image.dataset.fallbackApplied === 'true') return;
        image.dataset.fallbackApplied = 'true';
        image.src = fallbackImage;
      }}
    />
  );
}
