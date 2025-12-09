import { Helmet, HelmetProvider } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product';
  noindex?: boolean;
}

const defaultMeta = {
  siteName: 'PhotoPro Marketplace',
  title: 'PhotoPro - Find & Book Professional Photographers',
  description: 'Connect with talented photographers for weddings, portraits, events, and more. Browse portfolios, book sessions, and shop prints.',
  keywords: 'photography, photographers, book photographer, wedding photography, portrait photography, photo prints',
  image: '/og-image.jpg',
  url: typeof window !== 'undefined' ? window.location.origin : '',
};

export function SEO({
  title,
  description = defaultMeta.description,
  keywords = defaultMeta.keywords,
  image = defaultMeta.image,
  url,
  type = 'website',
  noindex = false,
}: SEOProps) {
  const pageTitle = title
    ? `${title} | ${defaultMeta.siteName}`
    : defaultMeta.title;

  const pageUrl = url || (typeof window !== 'undefined' ? window.location.href : defaultMeta.url);
  const imageUrl = image.startsWith('http') ? image : `${defaultMeta.url}${image}`;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{pageTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      <link rel="canonical" href={pageUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={pageUrl} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:site_name" content={defaultMeta.siteName} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={pageUrl} />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />
    </Helmet>
  );
}

export { HelmetProvider };
