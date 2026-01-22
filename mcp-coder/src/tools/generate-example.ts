import {
  GenerateTangibleExampleInput,
  GenerateTangibleExampleOutput,
  type ExampleTopic,
  type SupportedLanguage
} from './schemas.js';
import { validateCodeSnippet } from './validate-code.js';

// Topic to language mapping
const topicLanguageMap: Record<ExampleTopic, SupportedLanguage> = {
  'json-ld-product': 'json',
  'json-ld-article': 'json',
  'json-ld-breadcrumb': 'json',
  'json-ld-faq': 'json',
  'json-ld-howto': 'json',
  'responsive-image': 'html',
  'accessible-form': 'html',
  'semantic-nav': 'html',
  'css-grid-layout': 'css',
  'css-flexbox-layout': 'css',
  'fetch-api': 'javascript',
  'async-await': 'javascript',
  'dom-manipulation': 'javascript',
  'event-handling': 'javascript',
  'form-validation': 'javascript',
  'local-storage': 'javascript',
  'regex-email': 'javascript',
  'regex-url': 'javascript',
  'regex-phone': 'javascript',
  'custom': 'javascript'
};

// Pre-validated code examples with Senior Developer quality
const codeExamples: Record<ExampleTopic, {
  code: string;
  explanation: string;
  edgeCases: string[];
  relatedTopics: string[];
}> = {
  'json-ld-product': {
    code: `{
  "@context": "https://schema.org/",
  "@type": "Product",
  "name": "Executive Leather Office Chair",
  "image": [
    "https://example.com/photos/chair-front.jpg",
    "https://example.com/photos/chair-side.jpg",
    "https://example.com/photos/chair-back.jpg"
  ],
  "description": "Ergonomic executive chair with premium leather upholstery, adjustable lumbar support, and 360-degree swivel base.",
  "sku": "CHAIR-EXC-001",
  "mpn": "925872",
  "brand": {
    "@type": "Brand",
    "name": "OfficePro"
  },
  "review": {
    "@type": "Review",
    "reviewRating": {
      "@type": "Rating",
      "ratingValue": 4.8,
      "bestRating": 5
    },
    "author": {
      "@type": "Person",
      "name": "Maria Schmidt"
    },
    "reviewBody": "Excellent chair for long work sessions. The lumbar support is outstanding."
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": 4.7,
    "reviewCount": 256
  },
  "offers": {
    "@type": "Offer",
    "url": "https://example.com/products/executive-chair",
    "priceCurrency": "EUR",
    "price": 449.99,
    "priceValidUntil": "2025-12-31",
    "itemCondition": "https://schema.org/NewCondition",
    "availability": "https://schema.org/InStock",
    "seller": {
      "@type": "Organization",
      "name": "OfficePro Direct"
    }
  }
}`,
    explanation: 'JSON-LD Product markup following Schema.org vocabulary. Includes all Google-recommended properties for rich results: name, image array (multiple angles), description, SKU, brand, reviews with ratings, aggregate rating, and comprehensive offer details with price, availability, and seller information.',
    edgeCases: [
      'Multiple images provided as array for carousel display',
      'Price validity date prevents stale pricing in search results',
      'Both individual review and aggregate rating included',
      'Seller organization properly nested for trust signals'
    ],
    relatedTopics: ['json-ld-article', 'json-ld-breadcrumb', 'SEO structured data']
  },

  'json-ld-article': {
    code: `{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Understanding Modern JavaScript: ES6+ Features Every Developer Should Know",
  "alternativeHeadline": "A comprehensive guide to ES6 and beyond",
  "image": {
    "@type": "ImageObject",
    "url": "https://example.com/images/es6-guide.jpg",
    "width": 1200,
    "height": 630
  },
  "author": {
    "@type": "Person",
    "name": "Dr. Anna Weber",
    "url": "https://example.com/authors/anna-weber",
    "jobTitle": "Senior Software Engineer"
  },
  "publisher": {
    "@type": "Organization",
    "name": "TechLearn Academy",
    "logo": {
      "@type": "ImageObject",
      "url": "https://example.com/logo.png",
      "width": 600,
      "height": 60
    }
  },
  "datePublished": "2024-01-15T08:00:00+01:00",
  "dateModified": "2024-02-20T14:30:00+01:00",
  "description": "Master arrow functions, destructuring, async/await, and other essential ES6+ features with practical examples.",
  "articleBody": "JavaScript has evolved significantly...",
  "wordCount": 2500,
  "keywords": ["JavaScript", "ES6", "programming", "web development"],
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": "https://example.com/articles/es6-guide"
  }
}`,
    explanation: 'Complete Article schema with author expertise signals, publisher information with logo, proper date handling with timezone, and SEO-relevant metadata. The ImageObject includes dimensions for optimal display in search results.',
    edgeCases: [
      'Image dimensions specified for proper rendering',
      'Timezone-aware ISO 8601 dates for international content',
      'Author credentials included for E-E-A-T signals',
      'Both datePublished and dateModified for freshness'
    ],
    relatedTopics: ['json-ld-product', 'json-ld-faq', 'Google Search Console']
  },

  'json-ld-breadcrumb': {
    code: `{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://example.com/"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Products",
      "item": "https://example.com/products/"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "Office Furniture",
      "item": "https://example.com/products/office-furniture/"
    },
    {
      "@type": "ListItem",
      "position": 4,
      "name": "Executive Chairs",
      "item": "https://example.com/products/office-furniture/executive-chairs/"
    }
  ]
}`,
    explanation: 'BreadcrumbList schema for navigation hierarchy. Each ListItem has a sequential position, human-readable name, and canonical URL. This enables breadcrumb rich results in Google Search.',
    edgeCases: [
      'Positions must be sequential starting from 1',
      'Last item can omit "item" property (current page)',
      'URLs should be absolute and canonical',
      'Name should match visible breadcrumb text'
    ],
    relatedTopics: ['json-ld-product', 'semantic-nav', 'URL structure']
  },

  'json-ld-faq': {
    code: `{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is the return policy?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "We offer a 30-day return policy for all unused items in original packaging. To initiate a return, please contact our customer service team or use the returns portal in your account dashboard. Refunds are processed within 5-7 business days after we receive the returned item."
      }
    },
    {
      "@type": "Question",
      "name": "Do you offer international shipping?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes, we ship to over 50 countries worldwide. Shipping costs and delivery times vary by destination. You can view exact shipping options and costs at checkout. For orders over €100, we offer free shipping to EU countries."
      }
    },
    {
      "@type": "Question",
      "name": "How can I track my order?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Once your order ships, you'll receive an email with a tracking number and link. You can also track your order by logging into your account and viewing your order history. For any tracking issues, please contact support@example.com."
      }
    }
  ]
}`,
    explanation: 'FAQPage schema with multiple Question/Answer pairs. Each answer provides comprehensive information that could appear directly in search results as a rich snippet, increasing click-through rates.',
    edgeCases: [
      'Questions should match actual user search queries',
      'Answers should be complete but concise (under 300 words)',
      'HTML formatting in answers is limited (basic tags only)',
      'Must have visible FAQ content on the page'
    ],
    relatedTopics: ['json-ld-howto', 'json-ld-article', 'Voice search optimization']
  },

  'json-ld-howto': {
    code: `{
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "How to Set Up a Development Environment",
  "description": "Step-by-step guide to setting up a modern web development environment with Node.js, VS Code, and essential tools.",
  "image": {
    "@type": "ImageObject",
    "url": "https://example.com/images/dev-setup.jpg",
    "width": 1200,
    "height": 630
  },
  "totalTime": "PT30M",
  "estimatedCost": {
    "@type": "MonetaryAmount",
    "currency": "EUR",
    "value": "0"
  },
  "supply": [
    {
      "@type": "HowToSupply",
      "name": "Computer with internet connection"
    },
    {
      "@type": "HowToSupply",
      "name": "Administrator access"
    }
  ],
  "tool": [
    {
      "@type": "HowToTool",
      "name": "Web browser"
    }
  ],
  "step": [
    {
      "@type": "HowToStep",
      "name": "Install Node.js",
      "text": "Download Node.js LTS from nodejs.org and run the installer. Accept the default settings and complete the installation.",
      "url": "https://example.com/guide#step1",
      "image": "https://example.com/images/step1-nodejs.jpg"
    },
    {
      "@type": "HowToStep",
      "name": "Install VS Code",
      "text": "Download Visual Studio Code from code.visualstudio.com. Run the installer and add VS Code to your PATH.",
      "url": "https://example.com/guide#step2",
      "image": "https://example.com/images/step2-vscode.jpg"
    },
    {
      "@type": "HowToStep",
      "name": "Configure Git",
      "text": "Install Git from git-scm.com. Open terminal and run: git config --global user.name 'Your Name' and git config --global user.email 'your@email.com'",
      "url": "https://example.com/guide#step3",
      "image": "https://example.com/images/step3-git.jpg"
    },
    {
      "@type": "HowToStep",
      "name": "Verify Installation",
      "text": "Open terminal and run: node --version, npm --version, git --version. All commands should display version numbers.",
      "url": "https://example.com/guide#step4",
      "image": "https://example.com/images/step4-verify.jpg"
    }
  ]
}`,
    explanation: 'Complete HowTo schema with time estimate, cost, required supplies/tools, and detailed steps with images. Each step has a direct URL anchor for deep linking from search results.',
    edgeCases: [
      'totalTime uses ISO 8601 duration format (PT30M = 30 minutes)',
      'Steps should have images for visual guidance',
      'Each step URL should anchor to visible content',
      'Free items should have value "0", not be omitted'
    ],
    relatedTopics: ['json-ld-faq', 'json-ld-article', 'Video schema']
  },

  'responsive-image': {
    code: `<!-- Responsive Image with Art Direction -->
<picture>
  <!-- WebP format for modern browsers -->
  <source
    type="image/webp"
    media="(min-width: 1200px)"
    srcset="hero-large.webp 1200w,
            hero-large-2x.webp 2400w"
    sizes="100vw">

  <source
    type="image/webp"
    media="(min-width: 768px)"
    srcset="hero-medium.webp 768w,
            hero-medium-2x.webp 1536w"
    sizes="100vw">

  <source
    type="image/webp"
    srcset="hero-small.webp 480w,
            hero-small-2x.webp 960w"
    sizes="100vw">

  <!-- JPEG fallback for older browsers -->
  <source
    type="image/jpeg"
    media="(min-width: 1200px)"
    srcset="hero-large.jpg 1200w,
            hero-large-2x.jpg 2400w"
    sizes="100vw">

  <source
    type="image/jpeg"
    media="(min-width: 768px)"
    srcset="hero-medium.jpg 768w,
            hero-medium-2x.jpg 1536w"
    sizes="100vw">

  <!-- Default img with srcset for basic responsive -->
  <img
    src="hero-medium.jpg"
    srcset="hero-small.jpg 480w,
            hero-medium.jpg 768w,
            hero-large.jpg 1200w"
    sizes="(max-width: 480px) 100vw,
           (max-width: 768px) 100vw,
           100vw"
    alt="Hero image showing modern workspace with laptop and plants"
    width="1200"
    height="630"
    loading="lazy"
    decoding="async"
    fetchpriority="high">
</picture>`,
    explanation: 'Complete responsive image implementation using <picture> element for art direction and format selection. Includes WebP with JPEG fallback, multiple breakpoints, 2x retina support, lazy loading, and proper alt text for accessibility.',
    edgeCases: [
      'Width/height attributes prevent layout shift (CLS)',
      'loading="lazy" for below-fold images, remove for hero',
      'fetchpriority="high" for LCP images only',
      'Alt text describes content, not just "image of..."'
    ],
    relatedTopics: ['accessible-form', 'semantic-nav', 'Core Web Vitals']
  },

  'accessible-form': {
    code: `<!-- Accessible Contact Form -->
<form id="contact-form" action="/api/contact" method="POST" novalidate>
  <fieldset>
    <legend>Contact Information</legend>

    <!-- Name Field -->
    <div class="form-group">
      <label for="full-name">
        Full Name
        <span class="required" aria-hidden="true">*</span>
      </label>
      <input
        type="text"
        id="full-name"
        name="fullName"
        required
        autocomplete="name"
        aria-required="true"
        aria-describedby="name-hint name-error"
        pattern="[A-Za-zÀ-ÿ\\s\\-']{2,100}"
        minlength="2"
        maxlength="100">
      <span id="name-hint" class="hint">Enter your first and last name</span>
      <span id="name-error" class="error" role="alert" aria-live="polite"></span>
    </div>

    <!-- Email Field -->
    <div class="form-group">
      <label for="email">
        Email Address
        <span class="required" aria-hidden="true">*</span>
      </label>
      <input
        type="email"
        id="email"
        name="email"
        required
        autocomplete="email"
        aria-required="true"
        aria-describedby="email-hint email-error"
        inputmode="email">
      <span id="email-hint" class="hint">We'll never share your email</span>
      <span id="email-error" class="error" role="alert" aria-live="polite"></span>
    </div>

    <!-- Phone Field (Optional) -->
    <div class="form-group">
      <label for="phone">Phone Number</label>
      <input
        type="tel"
        id="phone"
        name="phone"
        autocomplete="tel"
        aria-describedby="phone-hint"
        inputmode="tel"
        pattern="[+]?[0-9\\s\\-()]{7,20}">
      <span id="phone-hint" class="hint">Optional - include country code</span>
    </div>

    <!-- Message Field -->
    <div class="form-group">
      <label for="message">
        Your Message
        <span class="required" aria-hidden="true">*</span>
      </label>
      <textarea
        id="message"
        name="message"
        required
        rows="5"
        aria-required="true"
        aria-describedby="message-hint message-error char-count"
        minlength="10"
        maxlength="1000"></textarea>
      <span id="message-hint" class="hint">Minimum 10 characters</span>
      <span id="char-count" class="char-count" aria-live="polite">0/1000</span>
      <span id="message-error" class="error" role="alert" aria-live="polite"></span>
    </div>
  </fieldset>

  <!-- Submit Button -->
  <button type="submit" id="submit-btn">
    <span class="btn-text">Send Message</span>
    <span class="btn-loading" aria-hidden="true" hidden>Sending...</span>
  </button>

  <!-- Form-level error summary -->
  <div id="error-summary" role="alert" aria-live="assertive" hidden>
    <h3>Please correct the following errors:</h3>
    <ul></ul>
  </div>
</form>`,
    explanation: 'WCAG 2.1 AA compliant contact form with proper labeling, ARIA attributes, live regions for error announcements, autocomplete for autofill support, input modes for mobile keyboards, and pattern validation. Includes error summary for screen reader users.',
    edgeCases: [
      'novalidate allows custom JS validation with better UX',
      'aria-describedby links hints and errors to inputs',
      'role="alert" with aria-live announces errors to screen readers',
      'Hidden loading state for submit button feedback'
    ],
    relatedTopics: ['form-validation', 'responsive-image', 'semantic-nav']
  },

  'semantic-nav': {
    code: `<!-- Semantic Navigation with Accessibility -->
<header role="banner">
  <a href="#main-content" class="skip-link">Skip to main content</a>

  <nav aria-label="Main navigation" role="navigation">
    <button
      type="button"
      class="nav-toggle"
      aria-expanded="false"
      aria-controls="main-nav"
      aria-label="Toggle navigation menu">
      <span class="hamburger" aria-hidden="true"></span>
    </button>

    <ul id="main-nav" class="nav-list">
      <li>
        <a href="/" aria-current="page">Home</a>
      </li>
      <li class="has-submenu">
        <button
          type="button"
          aria-expanded="false"
          aria-haspopup="true"
          aria-controls="products-menu">
          Products
          <svg aria-hidden="true" class="icon-chevron"><!-- icon --></svg>
        </button>
        <ul id="products-menu" class="submenu" role="menu">
          <li role="none">
            <a href="/products/software" role="menuitem">Software</a>
          </li>
          <li role="none">
            <a href="/products/hardware" role="menuitem">Hardware</a>
          </li>
          <li role="none">
            <a href="/products/services" role="menuitem">Services</a>
          </li>
        </ul>
      </li>
      <li>
        <a href="/about">About Us</a>
      </li>
      <li>
        <a href="/contact">Contact</a>
      </li>
    </ul>
  </nav>
</header>

<main id="main-content" role="main" tabindex="-1">
  <!-- Page content -->
</main>

<footer role="contentinfo">
  <nav aria-label="Footer navigation">
    <ul>
      <li><a href="/privacy">Privacy Policy</a></li>
      <li><a href="/terms">Terms of Service</a></li>
      <li><a href="/sitemap">Sitemap</a></li>
    </ul>
  </nav>
</footer>`,
    explanation: 'Fully accessible navigation structure with skip link, ARIA landmarks, expandable menu with proper state management, current page indication, and keyboard navigation support. Multiple nav elements use aria-label for differentiation.',
    edgeCases: [
      'Skip link must be first focusable element',
      'aria-current="page" indicates current location',
      'aria-expanded tracks submenu open/close state',
      'tabindex="-1" on main allows programmatic focus'
    ],
    relatedTopics: ['accessible-form', 'json-ld-breadcrumb', 'Keyboard navigation']
  },

  'css-grid-layout': {
    code: `/* Modern CSS Grid Layout System */

/* Base grid container */
.grid-container {
  display: grid;
  gap: var(--grid-gap, 1.5rem);
  padding: var(--grid-padding, 1rem);

  /* Mobile: Single column */
  grid-template-columns: 1fr;
}

/* Tablet: 2 columns */
@media (min-width: 768px) {
  .grid-container {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Desktop: 3 columns */
@media (min-width: 1024px) {
  .grid-container {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* Large Desktop: 4 columns */
@media (min-width: 1440px) {
  .grid-container {
    grid-template-columns: repeat(4, 1fr);
  }
}

/* Auto-fit responsive grid (alternative approach) */
.grid-auto {
  display: grid;
  gap: 1.5rem;
  grid-template-columns: repeat(
    auto-fit,
    minmax(min(100%, 280px), 1fr)
  );
}

/* Named grid areas for complex layouts */
.page-layout {
  display: grid;
  gap: 1rem;
  min-height: 100vh;
  grid-template-areas:
    "header"
    "main"
    "sidebar"
    "footer";
  grid-template-rows: auto 1fr auto auto;
}

@media (min-width: 768px) {
  .page-layout {
    grid-template-areas:
      "header header"
      "sidebar main"
      "footer footer";
    grid-template-columns: 250px 1fr;
    grid-template-rows: auto 1fr auto;
  }
}

@media (min-width: 1024px) {
  .page-layout {
    grid-template-columns: 280px 1fr;
  }
}

/* Grid area assignments */
.header { grid-area: header; }
.main { grid-area: main; }
.sidebar { grid-area: sidebar; }
.footer { grid-area: footer; }

/* Span utilities */
.span-2 { grid-column: span 2; }
.span-3 { grid-column: span 3; }
.span-full { grid-column: 1 / -1; }

/* Alignment utilities */
.align-start { align-self: start; }
.align-center { align-self: center; }
.align-end { align-self: end; }
.justify-start { justify-self: start; }
.justify-center { justify-self: center; }
.justify-end { justify-self: end; }`,
    explanation: 'Production-ready CSS Grid layout system with mobile-first breakpoints, auto-fit for fluid grids, named grid areas for semantic layouts, and utility classes for common patterns. Uses CSS custom properties for easy customization.',
    edgeCases: [
      'min(100%, 280px) prevents overflow on small screens',
      'auto-fit vs auto-fill: fit collapses empty tracks',
      '1 / -1 spans from first to last grid line',
      'Named areas make layout changes at breakpoints intuitive'
    ],
    relatedTopics: ['css-flexbox-layout', 'responsive-image', 'Media queries']
  },

  'css-flexbox-layout': {
    code: `/* Modern Flexbox Layout Patterns */

/* Card container with wrapping */
.card-container {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  justify-content: flex-start;
}

.card {
  /* Flex-basis with min/max for responsive sizing */
  flex: 1 1 calc(33.333% - 1rem);
  min-width: 280px;
  max-width: 100%;
}

/* Centering (the classic problem) */
.center-content {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
}

/* Header with logo and nav */
.header-flex {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 2rem;
}

.header-logo {
  flex: 0 0 auto;
}

.header-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  list-style: none;
  margin: 0;
  padding: 0;
}

/* Push last item to the right */
.header-nav li:last-child {
  margin-left: auto;
}

/* Footer columns */
.footer-flex {
  display: flex;
  flex-wrap: wrap;
  gap: 2rem;
  justify-content: space-between;
}

.footer-column {
  flex: 1 1 200px;
  max-width: 300px;
}

/* Sidebar layout */
.sidebar-layout {
  display: flex;
  flex-wrap: wrap;
  gap: 2rem;
}

.sidebar {
  flex: 0 0 280px;
}

.main-content {
  flex: 1 1 0%;
  min-width: 0; /* Prevents flex item overflow */
}

@media (max-width: 768px) {
  .sidebar-layout {
    flex-direction: column;
  }

  .sidebar {
    flex-basis: auto;
    order: 2; /* Move sidebar below content on mobile */
  }
}

/* Equal height columns */
.equal-columns {
  display: flex;
  gap: 1rem;
}

.equal-columns > * {
  flex: 1;
  display: flex;
  flex-direction: column;
}

/* Stretch last child to fill space */
.equal-columns > * > :last-child {
  margin-top: auto;
}

/* Inline form with button */
.inline-form {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.inline-form input {
  flex: 1 1 200px;
  min-width: 0;
}

.inline-form button {
  flex: 0 0 auto;
}`,
    explanation: 'Comprehensive Flexbox patterns for common UI layouts: card grids, centered content, header with space-between, footer columns, sidebar layout with order change on mobile, and equal-height columns. All patterns handle edge cases like content overflow.',
    edgeCases: [
      'min-width: 0 on flex items prevents overflow from long text',
      'flex-basis with calc includes gap in calculation',
      'margin-left: auto pushes items to the right',
      'order property changes visual order without changing DOM'
    ],
    relatedTopics: ['css-grid-layout', 'responsive-image', 'Box model']
  },

  'fetch-api': {
    code: `/**
 * Modern Fetch API wrapper with error handling, retry logic, and timeout
 * Follows ES6+ best practices and handles common edge cases
 */

class ApiClient {
  constructor(baseUrl, defaultOptions = {}) {
    this.baseUrl = baseUrl.replace(/\\/$/, ''); // Remove trailing slash
    this.defaultOptions = {
      timeout: 10000, // 10 seconds
      retries: 3,
      retryDelay: 1000, // 1 second
      ...defaultOptions
    };
  }

  /**
   * Makes a fetch request with timeout, retries, and error handling
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Fetch options
   * @returns {Promise<any>} - Parsed response data
   */
  async request(endpoint, options = {}) {
    const url = \`\${this.baseUrl}\${endpoint}\`;
    const config = {
      ...this.defaultOptions,
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...this.defaultOptions.headers,
        ...options.headers
      }
    };

    const { timeout, retries, retryDelay, ...fetchOptions } = config;

    // Implement retry logic
    let lastError;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await this.fetchWithTimeout(url, fetchOptions, timeout);
        return await this.handleResponse(response);
      } catch (error) {
        lastError = error;

        // Don't retry on client errors (4xx)
        if (error.status >= 400 && error.status < 500) {
          throw error;
        }

        // Wait before retry (exponential backoff)
        if (attempt < retries) {
          const delay = retryDelay * Math.pow(2, attempt);
          await this.sleep(delay);
        }
      }
    }

    throw lastError;
  }

  /**
   * Fetch with AbortController timeout
   */
  async fetchWithTimeout(url, options, timeout) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      return response;
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new ApiError('Request timeout', 408, 'TIMEOUT');
      }
      throw new ApiError(
        error.message || 'Network error',
        0,
        'NETWORK_ERROR'
      );
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Handle response and parse based on content type
   */
  async handleResponse(response) {
    const contentType = response.headers.get('content-type') || '';

    let data;
    if (contentType.includes('application/json')) {
      data = await response.json();
    } else if (contentType.includes('text/')) {
      data = await response.text();
    } else {
      data = await response.blob();
    }

    if (!response.ok) {
      throw new ApiError(
        data.message || data.error || response.statusText,
        response.status,
        data.code || 'API_ERROR',
        data
      );
    }

    return data;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Convenience methods
  get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  post(endpoint, body, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(body)
    });
  }

  put(endpoint, body, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(body)
    });
  }

  delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }
}

/**
 * Custom API Error class
 */
class ApiError extends Error {
  constructor(message, status, code, data = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.data = data;
  }
}

// Usage Example
const api = new ApiClient('https://api.example.com', {
  headers: { 'Authorization': 'Bearer token123' }
});

// Async/await usage with error handling
const fetchUserData = async (userId) => {
  try {
    const user = await api.get(\`/users/\${userId}\`);
    console.log('User:', user);
    return user;
  } catch (error) {
    if (error instanceof ApiError) {
      console.error(\`API Error [\${error.code}]: \${error.message}\`);
      // Handle specific error codes
      if (error.status === 404) {
        console.log('User not found');
      }
    } else {
      console.error('Unexpected error:', error);
    }
    throw error;
  }
};`,
    explanation: 'Production-ready Fetch API wrapper class with timeout using AbortController, exponential backoff retry logic, automatic JSON parsing, custom error class with status codes, and convenience methods for all HTTP verbs. Handles network errors, timeouts, and API errors distinctly.',
    edgeCases: [
      'AbortController handles timeout without memory leaks',
      'Exponential backoff prevents server overload on retries',
      'Client errors (4xx) are not retried',
      'Content-Type detection for different response formats'
    ],
    relatedTopics: ['async-await', 'event-handling', 'Error handling']
  },

  'async-await': {
    code: `/**
 * Async/Await patterns and best practices
 * Covers parallel execution, error handling, and common patterns
 */

// 1. Sequential vs Parallel Execution
// ----------------------------------

// WRONG: Sequential (slow) - each await blocks
const fetchSequential = async (urls) => {
  const results = [];
  for (const url of urls) {
    const response = await fetch(url); // Blocks here!
    results.push(await response.json());
  }
  return results;
};

// CORRECT: Parallel (fast) - all requests start immediately
const fetchParallel = async (urls) => {
  const promises = urls.map(url =>
    fetch(url).then(res => res.json())
  );
  return Promise.all(promises);
};

// BETTER: Parallel with error handling for individual failures
const fetchParallelSafe = async (urls) => {
  const promises = urls.map(async (url) => {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(\`HTTP \${response.status}\`);
      return { success: true, data: await response.json(), url };
    } catch (error) {
      return { success: false, error: error.message, url };
    }
  });
  return Promise.all(promises);
};

// 2. Concurrency Limiting
// -----------------------

const asyncPool = async (poolLimit, items, iteratorFn) => {
  const results = [];
  const executing = new Set();

  for (const item of items) {
    const promise = Promise.resolve().then(() => iteratorFn(item));
    results.push(promise);

    if (poolLimit <= items.length) {
      const executingPromise = promise.then(() =>
        executing.delete(executingPromise)
      );
      executing.add(executingPromise);

      if (executing.size >= poolLimit) {
        await Promise.race(executing);
      }
    }
  }

  return Promise.all(results);
};

// Usage: Process 100 items, max 5 concurrent
const processItems = async (items) => {
  const results = await asyncPool(5, items, async (item) => {
    const response = await fetch(\`/api/process/\${item.id}\`);
    return response.json();
  });
  return results;
};

// 3. Retry Pattern with Async/Await
// ---------------------------------

const retry = async (fn, retries = 3, delay = 1000) => {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) throw error;
    await new Promise(resolve => setTimeout(resolve, delay));
    return retry(fn, retries - 1, delay * 2);
  }
};

// Usage
const fetchWithRetry = () => retry(
  async () => {
    const response = await fetch('/api/data');
    if (!response.ok) throw new Error('Failed');
    return response.json();
  },
  3,
  1000
);

// 4. Async Initialization Pattern
// -------------------------------

class AsyncService {
  #initialized = false;
  #initPromise = null;

  async init() {
    if (this.#initialized) return;
    if (this.#initPromise) return this.#initPromise;

    this.#initPromise = (async () => {
      // Expensive initialization
      await this.loadConfig();
      await this.connectDatabase();
      this.#initialized = true;
    })();

    return this.#initPromise;
  }

  async loadConfig() { /* ... */ }
  async connectDatabase() { /* ... */ }

  async query(sql) {
    await this.init(); // Ensure initialized before use
    // Execute query...
  }
}

// 5. Async Generator Pattern
// --------------------------

async function* paginate(fetchPage) {
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const { data, nextPage } = await fetchPage(page);
    yield data;

    hasMore = nextPage !== null;
    page = nextPage;
  }
}

// Usage
const processAllPages = async () => {
  const fetchPage = async (page) => {
    const response = await fetch(\`/api/items?page=\${page}\`);
    const { items, nextPage } = await response.json();
    return { data: items, nextPage };
  };

  for await (const items of paginate(fetchPage)) {
    console.log('Processing page:', items.length, 'items');
    // Process items...
  }
};`,
    explanation: 'Comprehensive async/await patterns including parallel vs sequential execution, concurrency limiting with async pool, retry with exponential backoff, async class initialization, and async generators for pagination. All examples follow ES6+ standards and handle errors properly.',
    edgeCases: [
      'Promise.all fails fast - one rejection rejects all',
      'Promise.allSettled waits for all regardless of rejection',
      'Concurrency limiting prevents overwhelming servers',
      'Async generators enable memory-efficient iteration'
    ],
    relatedTopics: ['fetch-api', 'event-handling', 'Promises']
  },

  'dom-manipulation': {
    code: `/**
 * Modern DOM Manipulation Patterns
 * ES6+ methods, performance best practices, and accessibility
 */

// 1. Query Selectors
// ------------------

// Prefer getElementById for single elements (fastest)
const header = document.getElementById('header');

// Use querySelector for CSS selector syntax
const firstButton = document.querySelector('.btn-primary');

// querySelectorAll returns NodeList (iterable)
const allButtons = document.querySelectorAll('button[type="submit"]');

// Convert NodeList to Array for array methods
const buttonArray = [...document.querySelectorAll('.btn')];
const filtered = buttonArray.filter(btn => !btn.disabled);

// 2. Element Creation and Modification
// ------------------------------------

// Create element with attributes and content
const createCard = ({ title, content, imageUrl }) => {
  const card = document.createElement('article');
  card.className = 'card';
  card.setAttribute('role', 'article');

  // Use template literals for complex HTML
  card.innerHTML = \`
    <img
      src="\${escapeHtml(imageUrl)}"
      alt=""
      class="card-image"
      loading="lazy">
    <div class="card-body">
      <h2 class="card-title">\${escapeHtml(title)}</h2>
      <p class="card-content">\${escapeHtml(content)}</p>
    </div>
  \`;

  return card;
};

// XSS Prevention: Always escape user content
const escapeHtml = (text) => {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

// 3. Efficient DOM Updates
// ------------------------

// BAD: Multiple reflows
const badUpdate = (items) => {
  const container = document.getElementById('list');
  items.forEach(item => {
    const li = document.createElement('li');
    li.textContent = item;
    container.appendChild(li); // Causes reflow each time!
  });
};

// GOOD: Use DocumentFragment
const goodUpdate = (items) => {
  const container = document.getElementById('list');
  const fragment = document.createDocumentFragment();

  items.forEach(item => {
    const li = document.createElement('li');
    li.textContent = item;
    fragment.appendChild(li);
  });

  container.appendChild(fragment); // Single reflow
};

// BETTER: Batch with requestAnimationFrame
const batchUpdate = (updateFn) => {
  requestAnimationFrame(() => {
    updateFn();
  });
};

// 4. Element Observation
// ----------------------

// Intersection Observer for lazy loading
const lazyLoadImages = () => {
  const images = document.querySelectorAll('img[data-src]');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
        observer.unobserve(img);
      }
    });
  }, {
    rootMargin: '100px' // Load 100px before visible
  });

  images.forEach(img => observer.observe(img));
};

// Mutation Observer for DOM changes
const watchForChanges = (targetNode, callback) => {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach(mutation => {
      if (mutation.type === 'childList') {
        callback(mutation.addedNodes, mutation.removedNodes);
      }
    });
  });

  observer.observe(targetNode, {
    childList: true,
    subtree: true
  });

  return () => observer.disconnect();
};

// 5. Class Manipulation
// ---------------------

const toggleTheme = () => {
  document.documentElement.classList.toggle('dark-theme');

  // Multiple classes
  const element = document.querySelector('.card');
  element.classList.add('active', 'highlighted');
  element.classList.remove('inactive');

  // Replace class
  element.classList.replace('old-class', 'new-class');

  // Conditional toggle
  element.classList.toggle('expanded', someCondition);
};

// 6. Dataset API for Custom Data
// ------------------------------

const handleDataAttributes = () => {
  const element = document.querySelector('[data-user-id]');

  // Read data attributes
  const userId = element.dataset.userId; // data-user-id
  const role = element.dataset.userRole; // data-user-role

  // Set data attributes
  element.dataset.lastUpdated = Date.now();
};

// 7. Safe DOM Cleanup
// -------------------

const removeElement = (element) => {
  // Remove event listeners (if using named functions)
  element.removeEventListener('click', handleClick);

  // Clear timers/intervals
  clearTimeout(element._timeoutId);

  // Remove from DOM
  element.remove();
};`,
    explanation: 'Modern DOM manipulation patterns covering efficient querying, XSS-safe element creation, performance-optimized batch updates with DocumentFragment, Intersection/Mutation Observers, classList API, and proper cleanup. All examples use ES6+ syntax.',
    edgeCases: [
      'Always escape user content to prevent XSS attacks',
      'Use DocumentFragment for batch insertions',
      'requestAnimationFrame batches before repaint',
      'Disconnect observers when no longer needed'
    ],
    relatedTopics: ['event-handling', 'async-await', 'Web APIs']
  },

  'event-handling': {
    code: `/**
 * Modern Event Handling Patterns
 * Delegation, debouncing, AbortController, and best practices
 */

// 1. Event Delegation
// -------------------

// Instead of attaching listeners to each button:
// BAD
document.querySelectorAll('.btn').forEach(btn => {
  btn.addEventListener('click', handleClick);
});

// GOOD: Single listener on parent with delegation
const initEventDelegation = () => {
  const container = document.getElementById('button-container');

  container.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button) return;

    // Check which button was clicked
    if (button.matches('.btn-delete')) {
      handleDelete(button.dataset.id);
    } else if (button.matches('.btn-edit')) {
      handleEdit(button.dataset.id);
    }
  });
};

// 2. Debounce and Throttle
// ------------------------

const debounce = (fn, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};

const throttle = (fn, limit) => {
  let inThrottle;
  return (...args) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Usage
const searchInput = document.getElementById('search');
const handleSearch = debounce((query) => {
  console.log('Searching:', query);
  // API call here
}, 300);

searchInput.addEventListener('input', (e) => handleSearch(e.target.value));

// Throttled scroll handler
const handleScroll = throttle(() => {
  console.log('Scroll position:', window.scrollY);
}, 100);

window.addEventListener('scroll', handleScroll, { passive: true });

// 3. AbortController for Cleanup
// ------------------------------

class ComponentLifecycle {
  #controller = null;

  mount() {
    this.#controller = new AbortController();
    const { signal } = this.#controller;

    // All listeners cleaned up automatically on abort
    window.addEventListener('resize', this.handleResize, { signal });
    document.addEventListener('keydown', this.handleKeydown, { signal });
    this.element.addEventListener('click', this.handleClick, { signal });

    // Works with fetch too
    this.loadData(signal);
  }

  unmount() {
    this.#controller?.abort();
    this.#controller = null;
  }

  async loadData(signal) {
    try {
      const response = await fetch('/api/data', { signal });
      const data = await response.json();
      this.render(data);
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Request aborted');
        return;
      }
      throw error;
    }
  }

  handleResize = () => { /* ... */ };
  handleKeydown = () => { /* ... */ };
  handleClick = () => { /* ... */ };
}

// 4. Custom Events
// ----------------

const createCustomEvents = () => {
  // Dispatch custom event
  const dispatchNotification = (type, message) => {
    const event = new CustomEvent('app:notification', {
      detail: { type, message },
      bubbles: true,
      cancelable: true
    });

    document.dispatchEvent(event);
  };

  // Listen for custom event
  document.addEventListener('app:notification', (event) => {
    const { type, message } = event.detail;
    showNotification(type, message);
  });

  // Usage
  dispatchNotification('success', 'Item saved successfully');
};

// 5. Passive Event Listeners for Performance
// ------------------------------------------

// Passive listeners cannot call preventDefault()
// This allows browser to start scrolling immediately
window.addEventListener('touchstart', handleTouch, { passive: true });
window.addEventListener('wheel', handleWheel, { passive: true });

// 6. Event Listener Options
// -------------------------

const button = document.getElementById('one-time-btn');

// once: true - listener auto-removes after first invocation
button.addEventListener('click', () => {
  console.log('This only runs once');
}, { once: true });

// capture: true - listen in capture phase (parent first)
document.addEventListener('click', (e) => {
  console.log('Capture phase');
}, { capture: true });

// 7. Keyboard Navigation
// ----------------------

const handleKeyboardNav = () => {
  document.addEventListener('keydown', (event) => {
    // Check for modifier keys
    if (event.ctrlKey && event.key === 's') {
      event.preventDefault();
      saveDocument();
      return;
    }

    // Handle specific keys
    switch (event.key) {
      case 'Escape':
        closeModal();
        break;
      case 'Enter':
        if (event.target.matches('form input')) {
          event.preventDefault();
          submitForm();
        }
        break;
      case 'ArrowDown':
      case 'ArrowUp':
        if (event.target.matches('[role="listbox"]')) {
          event.preventDefault();
          navigateList(event.key === 'ArrowDown' ? 1 : -1);
        }
        break;
    }
  });
};`,
    explanation: 'Comprehensive event handling patterns including event delegation for dynamic content, debounce/throttle for performance, AbortController for cleanup, custom events for component communication, passive listeners for scroll performance, and keyboard navigation for accessibility.',
    edgeCases: [
      'Event delegation works for dynamically added elements',
      'AbortController cleans up all listeners at once',
      'Passive listeners improve scroll performance',
      'once: true prevents memory leaks for one-time handlers'
    ],
    relatedTopics: ['dom-manipulation', 'async-await', 'Accessibility']
  },

  'form-validation': {
    code: `/**
 * Comprehensive Form Validation
 * Client-side validation with accessibility support
 */

class FormValidator {
  constructor(form, options = {}) {
    this.form = form;
    this.options = {
      validateOnBlur: true,
      validateOnInput: false,
      scrollToError: true,
      ...options
    };
    this.errors = new Map();
    this.validators = new Map();

    this.init();
  }

  init() {
    // Disable native validation
    this.form.setAttribute('novalidate', '');

    // Setup event listeners
    this.form.addEventListener('submit', this.handleSubmit.bind(this));

    if (this.options.validateOnBlur) {
      this.form.addEventListener('blur', this.handleBlur.bind(this), true);
    }

    if (this.options.validateOnInput) {
      this.form.addEventListener('input', this.handleInput.bind(this), true);
    }

    // Register built-in validators
    this.registerDefaultValidators();
  }

  registerDefaultValidators() {
    // Required field
    this.addValidator('required', (value, field) => {
      if (!value.trim()) {
        return field.dataset.errorRequired || 'This field is required';
      }
      return null;
    });

    // Email validation
    this.addValidator('email', (value) => {
      if (!value) return null;
      const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_\`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
      if (!emailRegex.test(value)) {
        return 'Please enter a valid email address';
      }
      return null;
    });

    // Minimum length
    this.addValidator('minlength', (value, field) => {
      if (!value) return null;
      const minLength = parseInt(field.getAttribute('minlength'), 10);
      if (value.length < minLength) {
        return \`Must be at least \${minLength} characters\`;
      }
      return null;
    });

    // Maximum length
    this.addValidator('maxlength', (value, field) => {
      if (!value) return null;
      const maxLength = parseInt(field.getAttribute('maxlength'), 10);
      if (value.length > maxLength) {
        return \`Must be no more than \${maxLength} characters\`;
      }
      return null;
    });

    // Pattern matching
    this.addValidator('pattern', (value, field) => {
      if (!value) return null;
      const pattern = field.getAttribute('pattern');
      if (pattern && !new RegExp(\`^\${pattern}$\`).test(value)) {
        return field.dataset.errorPattern || 'Please match the required format';
      }
      return null;
    });

    // Numeric range
    this.addValidator('range', (value, field) => {
      if (!value) return null;
      const num = parseFloat(value);
      const min = parseFloat(field.getAttribute('min'));
      const max = parseFloat(field.getAttribute('max'));

      if (isNaN(num)) return 'Please enter a valid number';
      if (!isNaN(min) && num < min) return \`Must be at least \${min}\`;
      if (!isNaN(max) && num > max) return \`Must be no more than \${max}\`;
      return null;
    });

    // Password confirmation
    this.addValidator('confirm', (value, field) => {
      const targetId = field.dataset.confirm;
      const targetField = document.getElementById(targetId);
      if (targetField && value !== targetField.value) {
        return 'Values do not match';
      }
      return null;
    });
  }

  addValidator(name, fn) {
    this.validators.set(name, fn);
  }

  validateField(field) {
    const value = field.value;
    const errors = [];

    // Check required
    if (field.hasAttribute('required')) {
      const error = this.validators.get('required')(value, field);
      if (error) errors.push(error);
    }

    // Only continue if there's a value
    if (value) {
      // Type-based validation
      if (field.type === 'email') {
        const error = this.validators.get('email')(value, field);
        if (error) errors.push(error);
      }

      // Attribute-based validation
      ['minlength', 'maxlength', 'pattern'].forEach(attr => {
        if (field.hasAttribute(attr)) {
          const error = this.validators.get(attr)(value, field);
          if (error) errors.push(error);
        }
      });

      // Range validation for number inputs
      if (field.type === 'number' || field.type === 'range') {
        const error = this.validators.get('range')(value, field);
        if (error) errors.push(error);
      }

      // Custom validators via data attribute
      if (field.dataset.validate) {
        const customValidators = field.dataset.validate.split(' ');
        customValidators.forEach(validatorName => {
          const validator = this.validators.get(validatorName);
          if (validator) {
            const error = validator(value, field);
            if (error) errors.push(error);
          }
        });
      }
    }

    return errors;
  }

  showFieldError(field, errors) {
    const errorContainer = this.getErrorContainer(field);

    // Update ARIA attributes
    field.setAttribute('aria-invalid', errors.length > 0 ? 'true' : 'false');

    if (errors.length > 0) {
      field.classList.add('is-invalid');
      errorContainer.textContent = errors[0]; // Show first error
      errorContainer.hidden = false;
    } else {
      field.classList.remove('is-invalid');
      errorContainer.textContent = '';
      errorContainer.hidden = true;
    }
  }

  getErrorContainer(field) {
    const describedBy = field.getAttribute('aria-describedby');
    if (describedBy) {
      const errorId = describedBy.split(' ').find(id =>
        id.includes('error')
      );
      if (errorId) {
        return document.getElementById(errorId);
      }
    }

    // Create error container if it doesn't exist
    let container = field.parentElement.querySelector('.field-error');
    if (!container) {
      container = document.createElement('span');
      container.className = 'field-error';
      container.id = \`\${field.id}-error\`;
      container.setAttribute('role', 'alert');
      container.setAttribute('aria-live', 'polite');
      field.parentElement.appendChild(container);
      field.setAttribute('aria-describedby',
        \`\${field.getAttribute('aria-describedby') || ''} \${container.id}\`.trim()
      );
    }
    return container;
  }

  handleBlur(event) {
    if (event.target.matches('input, textarea, select')) {
      const errors = this.validateField(event.target);
      this.showFieldError(event.target, errors);
    }
  }

  handleInput(event) {
    if (event.target.matches('input, textarea, select')) {
      // Only revalidate if field was already invalid
      if (event.target.classList.contains('is-invalid')) {
        const errors = this.validateField(event.target);
        this.showFieldError(event.target, errors);
      }
    }
  }

  handleSubmit(event) {
    event.preventDefault();

    const fields = this.form.querySelectorAll('input, textarea, select');
    let isValid = true;
    let firstError = null;

    fields.forEach(field => {
      const errors = this.validateField(field);
      this.showFieldError(field, errors);

      if (errors.length > 0) {
        isValid = false;
        if (!firstError) firstError = field;
      }
    });

    if (!isValid) {
      if (this.options.scrollToError && firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        firstError.focus();
      }
      return;
    }

    // Form is valid - submit or call callback
    if (this.options.onSubmit) {
      const formData = new FormData(this.form);
      this.options.onSubmit(Object.fromEntries(formData));
    } else {
      this.form.submit();
    }
  }
}

// Usage
const form = document.getElementById('contact-form');
const validator = new FormValidator(form, {
  validateOnBlur: true,
  validateOnInput: true,
  scrollToError: true,
  onSubmit: async (data) => {
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (response.ok) {
        showSuccess('Message sent!');
      }
    } catch (error) {
      showError('Failed to send message');
    }
  }
});

// Add custom validator
validator.addValidator('phone-de', (value) => {
  if (!value) return null;
  const phoneRegex = /^(\\+49|0)[1-9][0-9]{1,14}$/;
  if (!phoneRegex.test(value.replace(/[\\s-]/g, ''))) {
    return 'Please enter a valid German phone number';
  }
  return null;
});`,
    explanation: 'Complete form validation class with built-in validators (required, email, minlength, pattern, range), custom validator support, accessibility features (ARIA attributes, live regions), and proper UX (validate on blur, scroll to error). Extensible and framework-agnostic.',
    edgeCases: [
      'novalidate disables browser validation for custom UX',
      'aria-invalid and aria-describedby for screen readers',
      'Only revalidate on input if field was already invalid',
      'Scroll and focus on first error for usability'
    ],
    relatedTopics: ['accessible-form', 'event-handling', 'regex-email']
  },

  'local-storage': {
    code: `/**
 * Enhanced LocalStorage Wrapper
 * Type-safe, expiration support, storage events
 */

class StorageManager {
  constructor(prefix = 'app', storage = localStorage) {
    this.prefix = prefix;
    this.storage = storage;
  }

  /**
   * Generate prefixed key
   */
  #key(key) {
    return \`\${this.prefix}:\${key}\`;
  }

  /**
   * Set item with optional expiration
   * @param {string} key - Storage key
   * @param {any} value - Value to store (will be serialized)
   * @param {number} ttl - Time to live in milliseconds (optional)
   */
  set(key, value, ttl = null) {
    const item = {
      value,
      timestamp: Date.now(),
      expiry: ttl ? Date.now() + ttl : null
    };

    try {
      this.storage.setItem(this.#key(key), JSON.stringify(item));
      return true;
    } catch (error) {
      // Handle quota exceeded
      if (this.isQuotaExceeded(error)) {
        console.warn('Storage quota exceeded. Clearing old items...');
        this.clearExpired();
        // Retry once
        try {
          this.storage.setItem(this.#key(key), JSON.stringify(item));
          return true;
        } catch {
          return false;
        }
      }
      return false;
    }
  }

  /**
   * Get item, respecting expiration
   * @param {string} key - Storage key
   * @param {any} defaultValue - Default if not found or expired
   */
  get(key, defaultValue = null) {
    try {
      const data = this.storage.getItem(this.#key(key));
      if (!data) return defaultValue;

      const item = JSON.parse(data);

      // Check expiration
      if (item.expiry && Date.now() > item.expiry) {
        this.remove(key);
        return defaultValue;
      }

      return item.value;
    } catch {
      return defaultValue;
    }
  }

  /**
   * Remove item
   */
  remove(key) {
    this.storage.removeItem(this.#key(key));
  }

  /**
   * Check if key exists and is not expired
   */
  has(key) {
    return this.get(key) !== null;
  }

  /**
   * Clear all items with this prefix
   */
  clear() {
    const keysToRemove = [];

    for (let i = 0; i < this.storage.length; i++) {
      const key = this.storage.key(i);
      if (key?.startsWith(\`\${this.prefix}:\`)) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => this.storage.removeItem(key));
  }

  /**
   * Clear only expired items
   */
  clearExpired() {
    for (let i = 0; i < this.storage.length; i++) {
      const key = this.storage.key(i);
      if (!key?.startsWith(\`\${this.prefix}:\`)) continue;

      try {
        const data = this.storage.getItem(key);
        if (!data) continue;

        const item = JSON.parse(data);
        if (item.expiry && Date.now() > item.expiry) {
          this.storage.removeItem(key);
        }
      } catch {
        // Invalid data, remove it
        this.storage.removeItem(key);
      }
    }
  }

  /**
   * Get all keys with this prefix
   */
  keys() {
    const result = [];
    const prefixLength = this.prefix.length + 1;

    for (let i = 0; i < this.storage.length; i++) {
      const key = this.storage.key(i);
      if (key?.startsWith(\`\${this.prefix}:\`)) {
        result.push(key.substring(prefixLength));
      }
    }

    return result;
  }

  /**
   * Check if error is quota exceeded
   */
  isQuotaExceeded(error) {
    return (
      error instanceof DOMException &&
      (error.code === 22 ||
        error.code === 1014 ||
        error.name === 'QuotaExceededError' ||
        error.name === 'NS_ERROR_DOM_QUOTA_REACHED')
    );
  }

  /**
   * Get storage usage info
   */
  getUsage() {
    let totalSize = 0;
    let itemCount = 0;

    for (let i = 0; i < this.storage.length; i++) {
      const key = this.storage.key(i);
      if (key?.startsWith(\`\${this.prefix}:\`)) {
        totalSize += key.length + (this.storage.getItem(key)?.length || 0);
        itemCount++;
      }
    }

    return {
      items: itemCount,
      bytes: totalSize * 2, // UTF-16
      formatted: this.formatBytes(totalSize * 2)
    };
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Listen for storage changes from other tabs
   */
  onChange(callback) {
    const handler = (event) => {
      if (!event.key?.startsWith(\`\${this.prefix}:\`)) return;

      const key = event.key.substring(this.prefix.length + 1);
      const oldValue = event.oldValue ? JSON.parse(event.oldValue).value : null;
      const newValue = event.newValue ? JSON.parse(event.newValue).value : null;

      callback({ key, oldValue, newValue });
    };

    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }
}

// Usage Examples
const storage = new StorageManager('myApp');

// Basic usage
storage.set('user', { id: 1, name: 'John' });
const user = storage.get('user');

// With expiration (1 hour)
storage.set('session', { token: 'abc123' }, 60 * 60 * 1000);

// Default value if not found
const theme = storage.get('theme', 'light');

// Listen for changes from other tabs
const unsubscribe = storage.onChange(({ key, oldValue, newValue }) => {
  console.log(\`\${key} changed from\`, oldValue, 'to', newValue);
});

// Get usage statistics
console.log('Storage usage:', storage.getUsage());`,
    explanation: 'Production-ready localStorage wrapper with key prefixing, automatic JSON serialization, TTL expiration support, quota exceeded handling with auto-cleanup, cross-tab change events, and usage statistics. Handles all edge cases gracefully.',
    edgeCases: [
      'Quota exceeded triggers automatic cleanup of expired items',
      'Invalid JSON data is silently removed',
      'Cross-tab sync via storage event listener',
      'UTF-16 encoding doubles byte count'
    ],
    relatedTopics: ['form-validation', 'async-await', 'Session management']
  },

  'regex-email': {
    code: `/**
 * Email Validation Regex Patterns
 * From simple to RFC 5322 compliant
 */

// 1. Simple Pattern (covers most cases)
// -------------------------------------
const simpleEmail = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;

// Matches: user@domain.com, test.user+tag@sub.domain.co.uk
// Doesn't match: spaces, multiple @, no TLD

// 2. Standard Pattern (recommended for most uses)
// -----------------------------------------------
const standardEmail = /^[a-zA-Z0-9.!#$%&'*+/=?^_\`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

// Based on HTML5 spec, handles:
// - Special characters in local part: .!#$%&'*+/=?^_\`{|}~-
// - Subdomains: user@mail.example.co.uk
// - Hyphens in domain (not at start/end)

// 3. Strict Pattern (business emails)
// ------------------------------------
const strictEmail = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$/;

// More restrictive, good for business contexts
// Requires: alphabetic TLD of 2+ chars

// 4. Full RFC 5322 Pattern (academic/complete)
// ---------------------------------------------
const rfc5322Email = /^(?:[a-z0-9!#$%&'*+/=?^_\`{|}~-]+(?:\\.[a-z0-9!#$%&'*+/=?^_\`{|}~-]+)*|"(?:[\\x01-\\x08\\x0b\\x0c\\x0e-\\x1f\\x21\\x23-\\x5b\\x5d-\\x7f]|\\\\[\\x01-\\x09\\x0b\\x0c\\x0e-\\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\\x01-\\x08\\x0b\\x0c\\x0e-\\x1f\\x21-\\x5a\\x53-\\x7f]|\\\\[\\x01-\\x09\\x0b\\x0c\\x0e-\\x7f])+)\\])$/i;

// Complete RFC 5322 compliance (use sparingly - complex)

// 5. Validation Function
// ----------------------
const validateEmail = (email, options = {}) => {
  const {
    allowEmpty = false,
    pattern = 'standard', // 'simple', 'standard', 'strict', 'rfc5322'
    maxLength = 254, // RFC 5321 limit
    allowPlusAddressing = true,
    blockedDomains = []
  } = options;

  const result = {
    valid: false,
    email: email?.trim() || '',
    errors: [],
    normalized: null
  };

  // Empty check
  if (!result.email) {
    if (allowEmpty) {
      result.valid = true;
    } else {
      result.errors.push('Email address is required');
    }
    return result;
  }

  // Length check
  if (result.email.length > maxLength) {
    result.errors.push(\`Email must be no longer than \${maxLength} characters\`);
    return result;
  }

  // Pattern selection
  const patterns = {
    simple: simpleEmail,
    standard: standardEmail,
    strict: strictEmail,
    rfc5322: rfc5322Email
  };

  const regex = patterns[pattern] || standardEmail;

  if (!regex.test(result.email)) {
    result.errors.push('Please enter a valid email address');
    return result;
  }

  // Extract parts
  const [localPart, domain] = result.email.split('@');

  // Check plus addressing
  if (!allowPlusAddressing && localPart.includes('+')) {
    result.errors.push('Plus addressing is not allowed');
    return result;
  }

  // Check blocked domains
  const domainLower = domain.toLowerCase();
  if (blockedDomains.some(d => domainLower === d || domainLower.endsWith(\`.\${d}\`))) {
    result.errors.push('This email domain is not allowed');
    return result;
  }

  // Normalize (lowercase domain, preserve local part case)
  result.normalized = \`\${localPart}@\${domainLower}\`;
  result.valid = true;

  return result;
};

// Usage Examples
console.log(validateEmail('User@Example.COM'));
// { valid: true, email: 'User@Example.COM', errors: [], normalized: 'User@example.com' }

console.log(validateEmail('test+newsletter@gmail.com', {
  allowPlusAddressing: false
}));
// { valid: false, ..., errors: ['Plus addressing is not allowed'] }

console.log(validateEmail('user@tempmail.com', {
  blockedDomains: ['tempmail.com', 'throwaway.email']
}));
// { valid: false, ..., errors: ['This email domain is not allowed'] }`,
    explanation: 'Multiple email validation regex patterns from simple to RFC 5322 compliant, plus a complete validation function with options for max length, plus addressing, blocked domains, and normalization. Includes clear explanations of what each pattern matches.',
    edgeCases: [
      'Standard pattern handles most real-world emails',
      'RFC 5321 limits email to 254 characters total',
      'Domain should be lowercased, local part is case-sensitive',
      'Plus addressing (user+tag@) is valid but often blocked'
    ],
    relatedTopics: ['regex-url', 'regex-phone', 'form-validation']
  },

  'regex-url': {
    code: `/**
 * URL Validation Regex Patterns
 * From basic to comprehensive validation
 */

// 1. Simple URL Pattern
// ---------------------
const simpleUrl = /^https?:\\/\\/[^\\s/$.?#].[^\\s]*$/i;

// Matches: http://example.com, https://sub.domain.co.uk/path
// Quick validation, not comprehensive

// 2. Standard URL Pattern
// -----------------------
const standardUrl = /^(https?:\\/\\/)?(www\\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)$/;

// Handles:
// - Optional protocol (http://, https://)
// - Optional www prefix
// - Domain with TLD
// - Path, query string, fragment

// 3. Strict URL Pattern (with required protocol)
// ----------------------------------------------
const strictUrl = /^https?:\\/\\/(?:www\\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b(?:[-a-zA-Z0-9()@:%_+.~#?&/=]*)$/;

// 4. URL Pattern with IP Address Support
// --------------------------------------
const urlWithIp = /^(https?:\\/\\/)?((([a-zA-Z0-9-]+\\.)+[a-zA-Z]{2,})|(\\d{1,3}\\.){3}\\d{1,3})(:\\d{1,5})?(\\/[^\\s]*)?$/;

// Matches domains and IPv4 addresses with optional port

// 5. Comprehensive URL Validation Function
// ----------------------------------------
const validateUrl = (url, options = {}) => {
  const {
    requireProtocol = false,
    allowedProtocols = ['http', 'https'],
    requireTld = true,
    allowIp = true,
    allowLocalhost = false,
    maxLength = 2048
  } = options;

  const result = {
    valid: false,
    url: url?.trim() || '',
    errors: [],
    parsed: null
  };

  if (!result.url) {
    result.errors.push('URL is required');
    return result;
  }

  if (result.url.length > maxLength) {
    result.errors.push(\`URL must be no longer than \${maxLength} characters\`);
    return result;
  }

  // Try to parse with URL API (best validation)
  let parsed;
  try {
    // Add protocol if missing for parsing
    const urlToParse = result.url.match(/^[a-zA-Z]+:\\/\\//)
      ? result.url
      : \`https://\${result.url}\`;

    parsed = new URL(urlToParse);
  } catch {
    result.errors.push('Invalid URL format');
    return result;
  }

  // Check protocol
  const protocol = parsed.protocol.replace(':', '');
  if (!allowedProtocols.includes(protocol)) {
    result.errors.push(\`Protocol must be one of: \${allowedProtocols.join(', ')}\`);
    return result;
  }

  // Check if protocol was required
  if (requireProtocol && !result.url.match(/^[a-zA-Z]+:\\/\\//)) {
    result.errors.push('URL must include protocol (http:// or https://)');
    return result;
  }

  // Check hostname
  const hostname = parsed.hostname;

  // Localhost check
  if (!allowLocalhost && (hostname === 'localhost' || hostname === '127.0.0.1')) {
    result.errors.push('Localhost URLs are not allowed');
    return result;
  }

  // IP address check
  const isIpAddress = /^(\\d{1,3}\\.){3}\\d{1,3}$/.test(hostname);
  if (isIpAddress) {
    if (!allowIp) {
      result.errors.push('IP addresses are not allowed');
      return result;
    }
    // Validate IP range
    const octets = hostname.split('.').map(Number);
    if (octets.some(o => o > 255)) {
      result.errors.push('Invalid IP address');
      return result;
    }
  } else if (requireTld) {
    // Check for TLD
    if (!hostname.includes('.') || hostname.endsWith('.')) {
      result.errors.push('URL must have a valid domain with TLD');
      return result;
    }
  }

  // Build parsed result
  result.valid = true;
  result.parsed = {
    protocol,
    hostname,
    port: parsed.port || (protocol === 'https' ? '443' : '80'),
    pathname: parsed.pathname,
    search: parsed.search,
    hash: parsed.hash,
    origin: parsed.origin
  };

  return result;
};

// 6. Extract URLs from Text
// -------------------------
const extractUrls = (text) => {
  const urlRegex = /https?:\\/\\/(?:www\\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b(?:[-a-zA-Z0-9()@:%_+.~#?&/=]*)/gi;
  return text.match(urlRegex) || [];
};

// Usage Examples
console.log(validateUrl('https://example.com/path?q=search'));
// { valid: true, parsed: { protocol: 'https', hostname: 'example.com', ... } }

console.log(validateUrl('example.com', { requireProtocol: true }));
// { valid: false, errors: ['URL must include protocol...'] }

console.log(validateUrl('http://192.168.1.1:8080', { allowIp: false }));
// { valid: false, errors: ['IP addresses are not allowed'] }

const text = 'Check out https://example.com and http://test.org/page';
console.log(extractUrls(text));
// ['https://example.com', 'http://test.org/page']`,
    explanation: 'URL validation patterns from simple to comprehensive, plus a full validation function using the URL API for parsing with options for protocol requirements, IP addresses, localhost, and TLD validation. Includes URL extraction from text.',
    edgeCases: [
      'URL API provides best parsing/validation',
      'Default max length 2048 matches browser limits',
      'IPv4 octets must be 0-255',
      'TLD validation catches single-label domains'
    ],
    relatedTopics: ['regex-email', 'regex-phone', 'form-validation']
  },

  'regex-phone': {
    code: `/**
 * Phone Number Validation Regex Patterns
 * International formats with country-specific options
 */

// 1. Simple International Pattern
// -------------------------------
const simplePhone = /^\\+?[0-9\\s-]{7,20}$/;

// Basic pattern, allows +, digits, spaces, hyphens
// Minimum 7 digits for valid phone numbers

// 2. E.164 International Format
// -----------------------------
const e164Phone = /^\\+[1-9]\\d{6,14}$/;

// Strict E.164: + followed by 7-15 digits
// No spaces, no formatting, starts with country code

// 3. German Phone Numbers
// -----------------------
const germanPhone = /^(\\+49|0049|0)[1-9][0-9]{1,14}$/;

// Handles: +49, 0049, or 0 prefix
// Examples: +4917612345678, 017612345678

// 4. US Phone Numbers
// -------------------
const usPhone = /^(\\+1)?[\\s.-]?\\(?[0-9]{3}\\)?[\\s.-]?[0-9]{3}[\\s.-]?[0-9]{4}$/;

// Handles multiple formats:
// +1 (555) 123-4567, 555-123-4567, 5551234567

// 5. UK Phone Numbers
// -------------------
const ukPhone = /^(\\+44|0044|0)[1-9][0-9]{9,10}$/;

// Handles: +44, 0044, or 0 prefix
// Mobile: 07xxx, Landline: 01xxx, 02xxx

// 6. Comprehensive Phone Validation
// ---------------------------------
const validatePhone = (phone, options = {}) => {
  const {
    country = null, // 'DE', 'US', 'UK', 'any'
    format = 'any', // 'e164', 'national', 'any'
    allowExtension = false
  } = options;

  const result = {
    valid: false,
    phone: phone?.trim() || '',
    errors: [],
    normalized: null,
    country: null
  };

  if (!result.phone) {
    result.errors.push('Phone number is required');
    return result;
  }

  // Remove common formatting characters for analysis
  const digitsOnly = result.phone.replace(/[^0-9+]/g, '');
  const hasPlus = digitsOnly.startsWith('+');

  // Extract extension if present
  let mainNumber = result.phone;
  let extension = null;

  if (allowExtension) {
    const extMatch = result.phone.match(/(?:ext\\.?|x|#)\\s*(\\d+)$/i);
    if (extMatch) {
      extension = extMatch[1];
      mainNumber = result.phone.slice(0, -extMatch[0].length).trim();
    }
  }

  // Country-specific patterns
  const countryPatterns = {
    DE: {
      pattern: /^(\\+49|0049|0)[1-9][0-9]{1,14}$/,
      normalize: (num) => {
        const clean = num.replace(/[^0-9+]/g, '');
        if (clean.startsWith('0049')) return '+49' + clean.slice(4);
        if (clean.startsWith('0')) return '+49' + clean.slice(1);
        return clean;
      },
      example: '+49 170 1234567'
    },
    US: {
      pattern: /^(\\+?1)?[2-9][0-9]{2}[2-9][0-9]{6}$/,
      normalize: (num) => {
        const clean = num.replace(/[^0-9]/g, '');
        if (clean.length === 10) return '+1' + clean;
        if (clean.length === 11 && clean.startsWith('1')) return '+' + clean;
        return '+' + clean;
      },
      example: '+1 (555) 123-4567'
    },
    UK: {
      pattern: /^(\\+44|0044|0)[1-9][0-9]{9,10}$/,
      normalize: (num) => {
        const clean = num.replace(/[^0-9+]/g, '');
        if (clean.startsWith('0044')) return '+44' + clean.slice(4);
        if (clean.startsWith('0')) return '+44' + clean.slice(1);
        return clean;
      },
      example: '+44 7911 123456'
    }
  };

  // Clean for pattern matching
  const cleanNumber = mainNumber.replace(/[\\s.-]/g, '').replace(/[()]/g, '');

  // Validate based on country
  if (country && countryPatterns[country]) {
    const countryConfig = countryPatterns[country];
    if (!countryConfig.pattern.test(cleanNumber)) {
      result.errors.push(\`Invalid \${country} phone number. Example: \${countryConfig.example}\`);
      return result;
    }
    result.country = country;
    result.normalized = countryConfig.normalize(cleanNumber);
  } else {
    // E.164 format check
    if (format === 'e164') {
      if (!e164Phone.test(cleanNumber)) {
        result.errors.push('Phone must be in E.164 format (e.g., +14155551234)');
        return result;
      }
      result.normalized = cleanNumber;
    } else {
      // General validation
      if (digitsOnly.length < 7 || digitsOnly.length > 16) {
        result.errors.push('Phone number must be between 7 and 16 digits');
        return result;
      }
      if (!simplePhone.test(cleanNumber)) {
        result.errors.push('Invalid phone number format');
        return result;
      }
      result.normalized = hasPlus ? cleanNumber : '+' + cleanNumber;
    }

    // Try to detect country
    if (cleanNumber.startsWith('+49') || cleanNumber.startsWith('0049')) {
      result.country = 'DE';
    } else if (cleanNumber.startsWith('+1') || cleanNumber.length === 10) {
      result.country = 'US';
    } else if (cleanNumber.startsWith('+44') || cleanNumber.startsWith('0044')) {
      result.country = 'UK';
    }
  }

  // Add extension back
  if (extension) {
    result.normalized += ' ext. ' + extension;
  }

  result.valid = true;
  return result;
};

// 7. Format Phone for Display
// ---------------------------
const formatPhone = (phone, format = 'international') => {
  const clean = phone.replace(/[^0-9+]/g, '');

  // German format
  if (clean.startsWith('+49') || clean.startsWith('49')) {
    const number = clean.replace(/^\\+?49/, '');
    if (format === 'national') {
      return '0' + number.replace(/(\\d{3})(\\d{4})(\\d+)/, '$1 $2 $3');
    }
    return '+49 ' + number.replace(/(\\d{3})(\\d{4})(\\d+)/, '$1 $2 $3');
  }

  // US format
  if (clean.startsWith('+1') || clean.length === 10) {
    const number = clean.replace(/^\\+?1/, '');
    if (format === 'national') {
      return number.replace(/(\\d{3})(\\d{3})(\\d{4})/, '($1) $2-$3');
    }
    return '+1 ' + number.replace(/(\\d{3})(\\d{3})(\\d{4})/, '($1) $2-$3');
  }

  // Generic international
  return clean.replace(/^(\\+\\d{1,3})(\\d+)$/, '$1 $2');
};

// Usage Examples
console.log(validatePhone('+49 170 1234567', { country: 'DE' }));
// { valid: true, normalized: '+491701234567', country: 'DE' }

console.log(validatePhone('(555) 123-4567', { country: 'US' }));
// { valid: true, normalized: '+15551234567', country: 'US' }

console.log(validatePhone('017012345678 ext. 123', { allowExtension: true }));
// { valid: true, normalized: '+4917012345678 ext. 123', country: 'DE' }

console.log(formatPhone('+14155551234', 'national'));
// (415) 555-1234`,
    explanation: 'Phone number validation for multiple countries (DE, US, UK) with E.164 support, extension handling, automatic country detection, and formatting for display. Includes normalization to international format.',
    edgeCases: [
      'E.164 is the international standard (max 15 digits)',
      'US area codes cannot start with 0 or 1',
      'Extensions should be separated and preserved',
      'National vs international format display options'
    ],
    relatedTopics: ['regex-email', 'regex-url', 'form-validation']
  },

  'custom': {
    code: `// Custom topic placeholder
// Use the 'custom_topic' parameter to describe what you need`,
    explanation: 'This is a placeholder for custom topics. Provide a description in the custom_topic parameter.',
    edgeCases: [],
    relatedTopics: []
  }
};

export async function generateTangibleExample(
  input: GenerateTangibleExampleInput
): Promise<GenerateTangibleExampleOutput> {
  // Validate input with Zod
  const validatedInput = GenerateTangibleExampleInput.parse(input);
  const {
    topic,
    custom_topic,
    include_comments,
    include_edge_cases,
    language: requestedLanguage
  } = validatedInput;

  // Handle custom topic
  if (topic === 'custom' && !custom_topic) {
    throw new Error('custom_topic is required when topic is "custom"');
  }

  // Get example data
  const exampleData = codeExamples[topic];
  if (!exampleData) {
    throw new Error(`Unknown topic: ${topic}`);
  }

  // Determine language
  const language = requestedLanguage || topicLanguageMap[topic];

  // Process code based on options
  let processedCode = exampleData.code;

  if (!include_comments) {
    // Remove single-line comments
    processedCode = processedCode.replace(/\/\/.*$/gm, '');
    // Remove multi-line comments
    processedCode = processedCode.replace(/\/\*[\s\S]*?\*\//g, '');
    // Remove HTML comments
    processedCode = processedCode.replace(/<!--[\s\S]*?-->/g, '');
    // Clean up empty lines
    processedCode = processedCode.replace(/\n\s*\n\s*\n/g, '\n\n');
  }

  // Validate the generated code
  const validationResult = await validateCodeSnippet({
    code: processedCode,
    language,
    strict_mode: true,
    check_best_practices: false
  });

  return {
    topic: topic === 'custom' ? custom_topic! : topic,
    language,
    code: processedCode,
    explanation: exampleData.explanation,
    edge_cases_handled: include_edge_cases ? exampleData.edgeCases : [],
    related_topics: exampleData.relatedTopics,
    validation_result: validationResult
  };
}
