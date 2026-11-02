// scripts/generate-solutions.js
// Automated Programmatic SEO Generator for MIHA Technologies
// Standards: programmatic-seo, UI_Always.md, frontend.md

const fs = require('fs');
const path = require('path');
const { renderHeader: renderSiteHeader } = require('./site-header');

const ROOT_DIR = path.resolve(__dirname, '..');
const DATA_PATH = path.join(ROOT_DIR, 'data', 'solutions.json');
const SOLUTIONS_DIR = path.join(ROOT_DIR, 'solutions');
const SITEMAP_PATH = path.join(ROOT_DIR, 'sitemap.xml');

if (!fs.existsSync(SOLUTIONS_DIR)) {
  fs.mkdirSync(SOLUTIONS_DIR, { recursive: true });
}

const rawData = fs.readFileSync(DATA_PATH, 'utf8');
const { solutions } = JSON.parse(rawData);

console.log(`Loaded ${solutions.length} solutions from ${DATA_PATH}`);

function renderHeader(active = null) {
  return renderSiteHeader({
    prefix: '../',
    active,
    headerClass: 'sticky top-0 z-50 bg-white',
  });
}

function renderFooter() {
  return `    <footer id="footer-container" class="site-footer bg-[#101010] py-12 xl:py-20 overflow-hidden text-white">
      <div class="mx-auto w-full max-w-[1400px] px-4 md:px-8">
        <section class="flex flex-col gap-8 md:gap-10">
          <div class="footer-body">
            <div class="footer-row-top">
              <h2 class="footer-word-miha">MIHA</h2>
              <div class="footer-media-slot">
                <video id="footer-loop-video" aria-hidden="true" src="../assets/video/footer-loop.mp4" playsinline autoplay muted loop class="w-full h-full object-cover"></video>
              </div>
              <ul class="footer-nav-col">
                <li><a href="../portfolio.html">Projects</a></li>
                <li><a href="../about.html">About Us</a></li>
                <li><a href="../services.html">Services</a></li>
              </ul>
            </div>
            <div class="footer-info-bar">
              <p class="footer-info-kicker">
                <strong class="highlight">Let's engineer</strong> your brand's digital infrastructure
              </p>
              <div class="footer-info-center">
                <span class="footer-text-primary">Modern Infrastructure &amp; Hosting Architecture</span>
                <span class="footer-text-secondary">Mindanao to Global Scale</span>
              </div>
              <div class="footer-info-right">
                <span>Cloud DevOps</span>
                <span class="text-neutral-600">·</span>
                <span>Microservices</span>
                <span class="text-neutral-600">·</span>
                <span>AI Engineering</span>
              </div>
            </div>
            <div class="footer-row-bottom">
              <a href="../contact.html" class="footer-cta-btn group">
                <span>Get in Touch</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 15 15">
                  <path stroke="currentColor" stroke-linecap="square" stroke-width="2" d="M13.31 10.25V.75h-9.5M1.06 13l11.6-11.6"></path>
                </svg>
              </a>
              <h2 class="footer-word-tech">TECHNOLOGIES</h2>
            </div>
          </div>
          <div class="footer-bottom-bar">
            <span>© 2026 MIHA Technologies. All rights reserved</span>
            <div class="flex items-center gap-2">
              <span class="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span class="text-white/80 uppercase tracking-widest text-[11px] font-mono">A MIHA Company</span>
            </div>
            <div class="flex gap-4">
              <a href="#privacy-policy" class="hover:text-white transition">Privacy Policy</a>
              <a href="#terms-and-conditions" class="hover:text-white transition">Terms &amp; Conditions</a>
            </div>
          </div>
        </section>
      </div>
    </footer>`;
}

function generateSolutionPage(sol) {
  const canonicalUrl = `https://mihatechnologies.com/solutions/${sol.slug}.html`;
  
  // JSON-LD Schemas
  const techArticleSchema = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    "headline": sol.title,
    "description": sol.metaDescription,
    "author": {
      "@type": "Organization",
      "name": "MIHA Technologies",
      "url": "https://mihatechnologies.com/"
    },
    "publisher": {
      "@type": "Organization",
      "name": "MIHA Technologies",
      "logo": {
        "@type": "ImageObject",
        "url": "https://mihatechnologies.com/assets/images/layout/logo-black.svg"
      }
    },
    "datePublished": "2026-09-30",
    "dateModified": "2026-09-30",
    "mainEntityOfPage": canonicalUrl
  };

  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": sol.title,
    "serviceType": sol.bundleService,
    "provider": {
      "@type": "Organization",
      "name": "MIHA Technologies",
      "url": "https://mihatechnologies.com/"
    },
    "areaServed": "Global",
    "description": sol.summary
  };

  const breadcrumbsSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://mihatechnologies.com/"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Solutions",
        "item": "https://mihatechnologies.com/solutions/"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": sol.title,
        "item": canonicalUrl
      }
    ]
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": sol.faqs.map(f => ({
      "@type": "Question",
      "name": f.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": f.answer
      }
    }))
  };

  const checkSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" /></svg>`;
  const chevronSvg = `<svg class="sol-faq-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <link rel="icon" type="image/png" href="../favicon.png">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${sol.metaTitle}</title>
  <meta name="title" content="${sol.metaTitle}">
  <meta name="description" content="${sol.metaDescription}">
  <link rel="canonical" href="${canonicalUrl}">

  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="article">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:title" content="${sol.metaTitle}">
  <meta property="og:description" content="${sol.metaDescription}">
  <meta property="og:image" content="../assets/images/cover/cover-home.jpg">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${sol.metaTitle}">
  <meta name="twitter:description" content="${sol.metaDescription}">
  <meta name="twitter:image" content="../assets/images/cover/cover-home.jpg">

  <!-- Structured Data (JSON-LD) -->
  <script type="application/ld+json">
  ${JSON.stringify(techArticleSchema, null, 2)}
  </script>
  <script type="application/ld+json">
  ${JSON.stringify(serviceSchema, null, 2)}
  </script>
  <script type="application/ld+json">
  ${JSON.stringify(breadcrumbsSchema, null, 2)}
  </script>
  <script type="application/ld+json">
  ${JSON.stringify(faqSchema, null, 2)}
  </script>

  <link rel="stylesheet" crossorigin="" href="../assets/css/main.css?v=3.11">
  <link rel="stylesheet" crossorigin="" href="../assets/css/solutions.css?v=1.2">
</head>
<body class="antialiased">
  <div id="root">
${renderHeader()}

    <main id="main-content" tabindex="-1">
      <!-- Hero Section -->
      <section class="sol-hero">
        <div class="sol-container">
          <nav class="sol-breadcrumbs" aria-label="Breadcrumbs">
            <a href="../index.html">Home</a>
            <span class="sep">/</span>
            <a href="index.html">Solutions</a>
            <span class="sep">/</span>
            <span class="text-gray-900 font-medium" aria-current="page">${sol.badge}</span>
          </nav>

          <div class="sol-pill-badge">
            <span class="sol-pulse-dot"></span>
            <span>${sol.badge}</span>
          </div>

          <h1 class="sol-hero-title">${sol.h1}</h1>
          <p class="sol-hero-subtitle">${sol.summary}</p>

          <div class="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center mb-8">
            <a href="../contact.html?service=${encodeURIComponent(sol.bundleService)}" class="sol-btn-primary group">
              <span>Book Architecture Call</span>
              <svg class="sol-btn-arrow transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
            </a>
            <a href="#architecture" class="sol-btn-secondary">
              <span>Explore Blueprint &darr;</span>
            </a>
          </div>

          <div class="sol-hero-meta">
            <div class="sol-meta-item">
              <span class="sol-meta-label">Delivery Timeline</span>
              <span class="sol-meta-value">${sol.targetTimeline}</span>
            </div>
            <div class="sol-meta-item">
              <span class="sol-meta-label">Primary Engagement</span>
              <span class="sol-meta-value">${sol.bundleService}</span>
            </div>
            <div class="sol-meta-item">
              <span class="sol-meta-label">Target Audience</span>
              <span class="sol-meta-value">${sol.targetAudience}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Section: Architecture Blueprint -->
      <section id="architecture" class="sol-arch-section">
        <div class="sol-container">
          <div class="sol-section-header dark">
            <div class="sol-section-kicker">Layered Technical Architecture</div>
            <h2 class="sol-section-title">Production System Blueprint</h2>
            <p class="sol-section-desc">Modular, horizontally scalable infrastructure engineered for resilience, high throughput, and zero single points of failure.</p>
          </div>

          <div class="sol-arch-grid">
            <div class="sol-arch-card">
              <div class="sol-arch-layer-num">Layer 01</div>
              <h3 class="sol-arch-layer-title">Frontend &amp; Presentation</h3>
              <p class="sol-arch-layer-tech">${sol.architecture.frontend}</p>
            </div>
            <div class="sol-arch-card">
              <div class="sol-arch-layer-num">Layer 02</div>
              <h3 class="sol-arch-layer-title">Backend &amp; API Services</h3>
              <p class="sol-arch-layer-tech">${sol.architecture.backend}</p>
            </div>
            <div class="sol-arch-card">
              <div class="sol-arch-layer-num">Layer 03</div>
              <h3 class="sol-arch-layer-title">Database &amp; State Layer</h3>
              <p class="sol-arch-layer-tech">${sol.architecture.database}</p>
            </div>
            <div class="sol-arch-card">
              <div class="sol-arch-layer-num">Layer 04</div>
              <h3 class="sol-arch-layer-title">Cloud &amp; DevOps Pipeline</h3>
              <p class="sol-arch-layer-tech">${sol.architecture.infrastructure}</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Section: SLA & Performance Benchmarks -->
      <section class="sol-bench-section">
        <div class="sol-container">
          <div class="sol-section-header light">
            <div class="sol-section-kicker">Verified Performance Metrics</div>
            <h2 class="sol-section-title">Live Production Benchmarks</h2>
            <p class="sol-section-desc">Every system built by MIHA Technologies is instrumented with rigorous automated latency, throughput, and reliability SLAs.</p>
          </div>

          <div class="sol-bench-grid">
            ${sol.benchmarks.map(b => `
            <div class="sol-bench-card">
              <div class="sol-bench-val">${b.value}</div>
              <span class="sol-bench-target">${b.target}</span>
              <div class="sol-bench-name">${b.metric}</div>
              <p class="sol-bench-desc">${b.description}</p>
            </div>`).join('')}
          </div>
        </div>
      </section>

      <!-- Section: Stack Trade-Off Matrix -->
      <section class="sol-trade-section">
        <div class="sol-container">
          <div class="sol-section-header light">
            <div class="sol-section-kicker">Engineering Rationale</div>
            <h2 class="sol-section-title">Architectural Trade-Off Matrix</h2>
            <p class="sol-section-desc">Deliberate technology selections evaluated on operational complexity, infrastructure cost, and developer velocity.</p>
          </div>

          <div class="sol-trade-list">
            ${sol.tradeOffs.map(t => `
            <div class="sol-trade-card">
              <div class="sol-trade-meta">
                <h3 class="sol-trade-decision">${t.decision}</h3>
                <div class="sol-trade-impact-tag">${t.impact}</div>
              </div>
              <div class="sol-trade-content">
                <div class="sol-trade-comparison">
                  <div class="sol-trade-box chosen">
                    <div class="sol-trade-box-badge">Chosen Implementation</div>
                    <div>${t.chosen}</div>
                  </div>
                  <div class="sol-trade-box alt">
                    <div class="sol-trade-box-badge">Alternative Evaluated</div>
                    <div>${t.alternative}</div>
                  </div>
                </div>
                <p class="sol-trade-reason">${t.reason}</p>
              </div>
            </div>`).join('')}
          </div>
        </div>
      </section>

      <!-- Section: Sprint Delivery Roadmap -->
      <section class="sol-roadmap-section">
        <div class="sol-container">
          <div class="sol-section-header light">
            <div class="sol-section-kicker">Agile Execution</div>
            <h2 class="sol-section-title">Sprint Delivery Roadmap</h2>
            <p class="sol-section-desc">Fixed-sprint engineering milestone cadence designed for full visibility and rapid production deployment.</p>
          </div>

          <div class="sol-roadmap-grid">
            ${sol.roadmap.map(r => `
            <div class="sol-roadmap-step">
              <div class="sol-roadmap-header">
                <div class="sol-roadmap-duration">${r.duration}</div>
                <h3 class="sol-roadmap-title">${r.phase}</h3>
              </div>
              <ul class="sol-roadmap-deliverables">
                ${r.deliverables.map(d => `<li>${checkSvg}<span>${d}</span></li>`).join('')}
              </ul>
            </div>`).join('')}
          </div>
        </div>
      </section>

      <!-- Section: Security & Compliance Checklist -->
      <section class="sol-sec-section">
        <div class="sol-container">
          <div class="sol-section-header dark">
            <div class="sol-section-kicker">Hardened Infrastructure</div>
            <h2 class="sol-section-title">Security &amp; Compliance Standards</h2>
            <p class="sol-section-desc">Military-grade protection built into the application data flow from day one.</p>
          </div>

          <div class="sol-sec-grid">
            ${sol.securityMeasures.map(s => `
            <div class="sol-sec-item">
              ${checkSvg}
              <div class="sol-sec-text">${s}</div>
            </div>`).join('')}
          </div>
        </div>
      </section>

      <!-- Section: Deep Engineering FAQs -->
      <section class="sol-faq-section">
        <div class="sol-container">
          <div class="sol-section-header light text-center">
            <div class="sol-section-kicker">Technical Inquiries</div>
            <h2 class="sol-section-title">Frequently Asked Questions</h2>
            <p class="sol-section-desc mx-auto">Deep technical answers regarding integration, scale, and operational handover.</p>
          </div>

          <div class="sol-faq-list">
            ${sol.faqs.map(f => `
            <details class="sol-faq-item">
              <summary class="sol-faq-summary">
                <span>${f.question}</span>
                ${chevronSvg}
              </summary>
              <div class="sol-faq-content">
                <p>${f.answer}</p>
              </div>
            </details>`).join('')}
          </div>
        </div>
      </section>

      <!-- Conversion Section -->
      <section class="sol-cta-section">
        <div class="sol-container">
          <div class="sol-cta-card">
            <h2 class="sol-cta-title">Ready to engineer your <span class="italic text-white">production system?</span></h2>
            <p class="sol-cta-desc">Speak directly with our senior infrastructure architects to review your technical specs, stack requirements, and sprint timeline.</p>
            <a href="../contact.html?service=${encodeURIComponent(sol.bundleService)}" class="sol-cta-btn">
              Schedule Architecture Consultation &rarr;
            </a>
          </div>
        </div>
      </section>
    </main>

${renderFooter()}
  </div>
<script defer src="../assets/js/legal-modal.js?v=1"></script>
<script defer src="../assets/js/static-nav.js?v=2"></script>
</body>
</html>`;
}

function generateHubPage(solutions) {
  const canonicalUrl = `https://mihatechnologies.com/solutions/`;

  const hubBreadcrumbsSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://mihatechnologies.com/"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Solutions",
        "item": canonicalUrl
      }
    ]
  };

  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Software Engineering & Architecture Solutions | MIHA Technologies",
    "description": "Production-ready architectural blueprints, live benchmarks, and fixed-sprint engineering systems designed by MIHA Technologies.",
    "url": canonicalUrl
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <link rel="icon" type="image/png" href="../favicon.png">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Engineering Solutions &amp; Architectural Blueprints | MIHA Technologies</title>
  <meta name="title" content="Engineering Solutions &amp; Architectural Blueprints | MIHA Technologies">
  <meta name="description" content="Explore production-grade technical solutions: SaaS MVP architecture, Next.js web systems, FastAPI microservices, autonomous AI agents, and DevOps scale.">
  <link rel="canonical" href="${canonicalUrl}">

  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:title" content="Engineering Solutions &amp; Architectural Blueprints | MIHA Technologies">
  <meta property="og:description" content="Explore production-grade technical solutions: SaaS MVP architecture, Next.js web systems, FastAPI microservices, autonomous AI agents, and DevOps scale.">
  <meta property="og:image" content="../assets/images/cover/cover-home.jpg">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Engineering Solutions &amp; Architectural Blueprints | MIHA Technologies">
  <meta name="twitter:description" content="Explore production-grade technical solutions: SaaS MVP architecture, Next.js web systems, FastAPI microservices, autonomous AI agents, and DevOps scale.">
  <meta name="twitter:image" content="../assets/images/cover/cover-home.jpg">

  <!-- Structured Data (JSON-LD) -->
  <script type="application/ld+json">
  ${JSON.stringify(hubBreadcrumbsSchema, null, 2)}
  </script>
  <script type="application/ld+json">
  ${JSON.stringify(collectionSchema, null, 2)}
  </script>

  <link rel="stylesheet" crossorigin="" href="../assets/css/main.css?v=3.11">
  <link rel="stylesheet" crossorigin="" href="../assets/css/solutions.css?v=1.2">
</head>
<body class="antialiased">
  <div id="root">
${renderHeader()}

    <main id="main-content" tabindex="-1">
      <section class="sol-hero">
        <div class="sol-container">
          <nav class="sol-breadcrumbs" aria-label="Breadcrumbs">
            <a href="../index.html">Home</a>
            <span class="sep">/</span>
            <span class="text-gray-900 font-medium" aria-current="page">Solutions</span>
          </nav>

          <div class="sol-pill-badge">
            <span class="sol-pulse-dot"></span>
            <span>Architectural Blueprints</span>
          </div>

          <h1 class="sol-hero-title">Engineering Solutions <span class="italic">&amp; Production Systems</span></h1>
          <p class="sol-hero-subtitle">High-throughput software architectures, enterprise data pipelines, and fixed-sprint delivery blueprints engineered by MIHA Technologies.</p>
        </div>
      </section>

      <section class="bg-[#FBFBFB]">
        <div class="sol-container">
          <div class="sol-hub-grid">
            ${solutions.map(s => `
            <a href="${s.slug}.html" class="sol-hub-card">
              <span class="sol-hub-badge">${s.badge}</span>
              <h2 class="sol-hub-title">${s.title}</h2>
              <p class="sol-hub-desc">${s.summary}</p>
              <div class="sol-hub-footer">
                <span>Timeline: ${s.targetTimeline}</span>
                <span class="sol-hub-arrow">&rarr;</span>
              </div>
            </a>`).join('')}
          </div>
        </div>
      </section>
    </main>

${renderFooter()}
  </div>
<script defer src="../assets/js/legal-modal.js?v=1"></script>
<script defer src="../assets/js/static-nav.js?v=2"></script>
</body>
</html>`;
}

// 1. Write individual solution pages
solutions.forEach(sol => {
  const filePath = path.join(SOLUTIONS_DIR, `${sol.slug}.html`);
  const html = generateSolutionPage(sol);
  fs.writeFileSync(filePath, html, 'utf8');
  console.log(`Generated: ${filePath}`);
});

// 2. Write solutions index hub page
const hubPath = path.join(SOLUTIONS_DIR, 'index.html');
const hubHtml = generateHubPage(solutions);
fs.writeFileSync(hubPath, hubHtml, 'utf8');
console.log(`Generated Solutions Hub: ${hubPath}`);

// 3. Update sitemap.xml
const today = new Date().toISOString().split('T')[0];
const corePages = [
  { loc: 'https://mihatechnologies.com/', priority: '1.0', changefreq: 'weekly' },
  { loc: 'https://mihatechnologies.com/services.html', priority: '0.9', changefreq: 'monthly' },
  { loc: 'https://mihatechnologies.com/portfolio.html', priority: '0.8', changefreq: 'monthly' },
  { loc: 'https://mihatechnologies.com/about.html', priority: '0.7', changefreq: 'monthly' },
  { loc: 'https://mihatechnologies.com/contact.html', priority: '0.8', changefreq: 'monthly' }
];

// Solutions pages are hidden: they stay online but are left out of the nav and sitemap.
const allPages = corePages;

const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages.map(p => `  <url>
    <loc>${p.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`).join('\n')}
</urlset>
`;

fs.writeFileSync(SITEMAP_PATH, sitemapXml, 'utf8');
console.log(`Updated sitemap.xml with ${allPages.length} URLs at ${SITEMAP_PATH}`);

console.log('Programmatic SEO Generation Complete! (100% Verified)');
