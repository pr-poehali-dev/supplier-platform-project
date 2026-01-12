export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "TOURCONNECT",
  "description": "Комплексная платформа для развития туристического бизнеса в России",
  "url": window.location.origin,
  "logo": `${window.location.origin}/logo.png`,
  "sameAs": [
    "https://t.me/tourconnect"
  ],
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "customer support",
    "availableLanguage": ["Russian"]
  }
};

export const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "TOURCONNECT",
  "url": window.location.origin,
  "potentialAction": {
    "@type": "SearchAction",
    "target": `${window.location.origin}/search?q={search_term_string}`,
    "query-input": "required name=search_term_string"
  }
};

export const softwareApplicationSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "TOURCONNECT",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web",
  "offers": [
    {
      "@type": "Offer",
      "name": "Старт",
      "price": "2990",
      "priceCurrency": "RUB",
      "priceValidUntil": "2026-12-31",
      "availability": "https://schema.org/InStock",
      "description": "Базовый тариф для начинающих предпринимателей"
    },
    {
      "@type": "Offer",
      "name": "Про",
      "price": "5990",
      "priceCurrency": "RUB",
      "priceValidUntil": "2026-12-31",
      "availability": "https://schema.org/InStock",
      "description": "Расширенные возможности для растущего бизнеса"
    },
    {
      "@type": "Offer",
      "name": "Бизнес",
      "price": "14990",
      "priceCurrency": "RUB",
      "priceValidUntil": "2026-12-31",
      "availability": "https://schema.org/InStock",
      "description": "Полный набор инструментов для крупного бизнеса"
    }
  ],
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "ratingCount": "47",
    "bestRating": "5",
    "worstRating": "1"
  },
  "description": "Платформа для управления туристическим бизнесом: симулятор расчетов, календарь бронирований, диагностика проектов"
};

export const breadcrumbSchema = (items: Array<{ name: string; url: string }>) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": items.map((item, index) => ({
    "@type": "ListItem",
    "position": index + 1,
    "name": item.name,
    "item": `${window.location.origin}${item.url}`
  }))
});

export const faqSchema = (questions: Array<{ question: string; answer: string }>) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": questions.map(q => ({
    "@type": "Question",
    "name": q.question,
    "acceptedAnswer": {
      "@type": "Answer",
      "text": q.answer
    }
  }))
});

export const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  "serviceType": "Платформа для управления туристическим бизнесом",
  "provider": {
    "@type": "Organization",
    "name": "TOURCONNECT"
  },
  "areaServed": {
    "@type": "Country",
    "name": "Россия"
  },
  "hasOfferCatalog": {
    "@type": "OfferCatalog",
    "name": "Услуги TOURCONNECT",
    "itemListElement": [
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "Симулятор бизнеса",
          "description": "Расчет финансовых показателей туристического объекта"
        }
      },
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "Календарь бронирований",
          "description": "Управление бронированиями и автоматизация через Telegram"
        }
      },
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "Диагностика проекта",
          "description": "Комплексный анализ туристического бизнеса"
        }
      }
    ]
  }
};
