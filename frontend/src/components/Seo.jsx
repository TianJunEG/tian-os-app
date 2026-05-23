import React from 'react';
import { Helmet } from 'react-helmet-async';
import { GROUP_NAME } from '../config/brand';

// Per-page document title + meta/Open Graph tags.
export default function Seo({ title, description, path }) {
  const fullTitle = title ? `${title} | ${GROUP_NAME}` : GROUP_NAME;
  const url =
    path && typeof window !== 'undefined' ? `${window.location.origin}${path}` : undefined;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      {description && <meta name="description" content={description} />}

      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={GROUP_NAME} />
      <meta property="og:title" content={fullTitle} />
      {description && <meta property="og:description" content={description} />}
      {url && <meta property="og:url" content={url} />}

      <meta name="twitter:card" content="summary" />
      <meta name="twitter:title" content={fullTitle} />
      {description && <meta name="twitter:description" content={description} />}
    </Helmet>
  );
}
