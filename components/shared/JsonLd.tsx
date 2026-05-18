/**
 * Renders a JSON-LD structured data <script> tag.
 * Use for any schema.org markup needed for SEO.
 */
export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  return (
    <script
      type="application/ld+json"
      // suppressHydrationWarning is safe here — JSON.stringify is deterministic
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

// Common builders

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://siraa.lk';

export function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Siraa.lk',
    url: SITE_URL,
    logo: `${SITE_URL}/icon.png`,
    description: "Sri Lanka's vehicle marketplace.",
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'hello@siraa.lk',
      contactType: 'customer service',
      areaServed: 'LK',
      availableLanguage: ['en', 'si'],
    },
    sameAs: [],
  };
}

export function websiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Siraa.lk',
    url: SITE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

interface VehicleSchemaParams {
  url: string;
  name: string;
  description: string;
  images: string[];
  brand: string;
  model: string;
  year: number;
  mileageKm?: number | null;
  fuelType?: string | null;
  transmission?: string | null;
  bodyType?: string | null;
  color?: string | null;
  price: number;
  city: string | null;
  district: string;
  sellerName: string;
  available: boolean;
  datePosted: string;
}

export function vehicleListingSchema(v: VehicleSchemaParams) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Vehicle',
    '@id': v.url,
    url: v.url,
    name: v.name,
    description: v.description,
    image: v.images,
    brand: { '@type': 'Brand', name: v.brand },
    model: v.model,
    vehicleModelDate: String(v.year),
    productionDate: String(v.year),
    ...(v.mileageKm != null && {
      mileageFromOdometer: {
        '@type': 'QuantitativeValue',
        value: v.mileageKm,
        unitCode: 'KMT',
      },
    }),
    ...(v.fuelType && { fuelType: v.fuelType }),
    ...(v.transmission && { vehicleTransmission: v.transmission }),
    ...(v.bodyType && { bodyType: v.bodyType }),
    ...(v.color && { color: v.color }),
    offers: {
      '@type': 'Offer',
      url: v.url,
      priceCurrency: 'LKR',
      price: v.price,
      availability: v.available
        ? 'https://schema.org/InStock'
        : 'https://schema.org/SoldOut',
      itemCondition: 'https://schema.org/UsedCondition',
      validFrom: v.datePosted,
      seller: { '@type': 'Person', name: v.sellerName },
      areaServed: {
        '@type': 'Country',
        name: 'Sri Lanka',
      },
    },
  };
}

export function breadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
