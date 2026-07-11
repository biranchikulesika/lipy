/**
 * Search-engine / AI-crawler structured data.
 *
 * Each helper returns a <script type="application/ld+json"> block that can
 * be rendered inside any server component layout or page.
 */

const baseUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/* ───── Root-level: Organization + WebSite ───── */

export function RootJsonLd() {
  const json = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${baseUrl}/#organization`,
        name: "LiPy",
        url: baseUrl,
        logo: `${baseUrl}/og-ocr.png`,
        description:
          "An open academic project for Odia handwritten character recognition, OCR, dataset creation, and machine learning research.",
        foundingDate: "2025",
        knowsAbout: [
          "Odia Handwritten Character Recognition",
          "Optical Character Recognition (OCR)",
          "Deep Learning",
          "Computer Vision",
          "EfficientNetB0",
        ],
      },
      {
        "@type": "WebSite",
        "@id": `${baseUrl}/#website`,
        url: baseUrl,
        name: "LiPy",
        description:
          "Odia handwritten character recognition — OCR, dataset contribution, and machine learning.",
        publisher: { "@id": `${baseUrl}/#organization` },
        inLanguage: "en",
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }}
    />
  );
}

/* ───── Home page (OCR Workspace) ───── */

export function HomeJsonLd() {
  const json = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "@id": `${baseUrl}/#webapp`,
    url: baseUrl,
    name: "LiPy Odia Handwriting Recognition",
    description:
      "Draw, upload, or capture a handwritten Odia character and get instant recognition results from a deep learning model.",
    applicationCategory: "Multimedia",
    operatingSystem: "Any",
    browserRequirements: "Requires JavaScript",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    author: { "@id": `${baseUrl}/#organization` },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }}
    />
  );
}

/* ───── About page (Project description) ───── */

export function AboutJsonLd() {
  const json = {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${baseUrl}/about#article`,
    headline: "About LiPy — Odia Handwritten Character Recognition",
    description:
      "Learn about the LiPy project: its system architecture, OCR pipeline, EfficientNetB0 model training, crowdsourced dataset, and deployment on Vercel and Azure.",
    author: { "@id": `${baseUrl}/#organization` },
    publisher: { "@id": `${baseUrl}/#organization` },
    about: {
      "@type": "Thing",
      name: "Odia Handwritten Character Recognition",
      description:
        "Deep learning (EfficientNetB0) model trained on 2,002+ handwritten Odia samples across 41 character classes.",
    },
    mainEntityOfPage: `${baseUrl}/about`,
    datePublished: "2025-01-01",
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }}
    />
  );
}

/* ───── Team page ───── */

export function TeamJsonLd() {
  const team = [
    {
      "@type": "Person",
      name: "Gundala Anushka",
      jobTitle: "Project Lead",
      description: "Co-ordinated project activities, mentor communication, and presentations.",
      sameAs: [
        "https://github.com/Gundala-Anushka",
        "https://www.linkedin.com/in/gundala-anushka-3b9995367",
      ],
    },
    {
      "@type": "Person",
      name: "Biranchi Kulesika",
      jobTitle: "Technical Lead",
      description:
        "Developed the LiPyD platform, trained the EfficientNetB0 model, built the OCR app, and managed deployment.",
      sameAs: [
        "https://github.com/biranchikulesika",
        "https://linkedin.com/in/biranchikulesika",
        "https://kulesika.in/",
      ],
    },
    {
      "@type": "Person",
      name: "Baibhab Sahu",
      jobTitle: "Dataset & Documentation",
      description: "Contributed to dataset verification, sample review, and documentation.",
      sameAs: "https://github.com/baibhab911",
    },
    {
      "@type": "Person",
      name: "Soumyasmita Mohapatra",
      jobTitle: "Dataset & Documentation",
      description: "Contributed to documentation, dataset validation, and quality checking.",
      sameAs: "https://github.com/soumyasmitamohapatra2005",
    },
    {
      "@type": "Person",
      name: "Prajna Dash",
      jobTitle: "Dataset & Documentation",
      description: "Contributed to dataset review, sample verification, and documentation support.",
      sameAs: "https://github.com/prajnadash73-netizen",
    },
  ].map((person, idx) => ({ ...person, position: idx + 1 }));

  const json = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": `${baseUrl}/team#list`,
    name: "LiPy Project Team",
    description:
      "The five-member student team behind LiPy, from Utkal University and NIELIT Bhubaneswar.",
    itemListElement: team,
    mainEntityOfPage: `${baseUrl}/team`,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }}
    />
  );
}

/* ───── LiPyD dataset page ───── */

export function LipydJsonLd() {
  const json = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "@id": `${baseUrl}/lipyd#webapp`,
    url: `${baseUrl}/lipyd`,
    name: "LiPyD — Odia Handwriting Dataset Contributor",
    description:
      "Contribute handwritten Odia characters to an open dataset for machine learning and OCR research.",
    applicationCategory: "DataApplication",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    author: { "@id": `${baseUrl}/#organization` },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }}
    />
  );
}
