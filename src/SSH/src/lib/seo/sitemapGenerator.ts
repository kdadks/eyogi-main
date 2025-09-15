export interface SitemapUrl {
  loc: string
  lastmod?: string
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
  priority?: number
}

export function generateSitemap(): string {
  const baseUrl = 'https://eyogi-gurukul.vercel.app'
  const currentDate = new Date().toISOString().split('T')[0]

  const urls: SitemapUrl[] = [
    // Main Pages - High Priority
    {
      loc: `${baseUrl}/`,
      lastmod: currentDate,
      changefreq: 'weekly',
      priority: 1.0
    },
    {
      loc: `${baseUrl}/courses`,
      lastmod: currentDate,
      changefreq: 'daily',
      priority: 0.9
    },
    {
      loc: `${baseUrl}/gurukuls`,
      lastmod: currentDate,
      changefreq: 'weekly',
      priority: 0.9
    },
    {
      loc: `${baseUrl}/about`,
      lastmod: currentDate,
      changefreq: 'monthly',
      priority: 0.8
    },
    {
      loc: `${baseUrl}/contact`,
      lastmod: currentDate,
      changefreq: 'monthly',
      priority: 0.7
    },

    // Gurukul Pages - High Priority for Hindu Keywords
    {
      loc: `${baseUrl}/gurukuls/hinduism`,
      lastmod: currentDate,
      changefreq: 'weekly',
      priority: 0.9
    },
    {
      loc: `${baseUrl}/gurukuls/philosophy`,
      lastmod: currentDate,
      changefreq: 'weekly',
      priority: 0.8
    },
    {
      loc: `${baseUrl}/gurukuls/sanskrit`,
      lastmod: currentDate,
      changefreq: 'weekly',
      priority: 0.8
    },
    {
      loc: `${baseUrl}/gurukuls/mantra`,
      lastmod: currentDate,
      changefreq: 'weekly',
      priority: 0.8
    },
    {
      loc: `${baseUrl}/gurukuls/yoga-wellness`,
      lastmod: currentDate,
      changefreq: 'weekly',
      priority: 0.8
    },

    // Auth Pages
    {
      loc: `${baseUrl}/auth/signin`,
      lastmod: currentDate,
      changefreq: 'monthly',
      priority: 0.6
    },
    {
      loc: `${baseUrl}/auth/signup`,
      lastmod: currentDate,
      changefreq: 'monthly',
      priority: 0.6
    },

    // Course Filter Pages for SEO
    {
      loc: `${baseUrl}/courses?level=elementary`,
      lastmod: currentDate,
      changefreq: 'weekly',
      priority: 0.7
    },
    {
      loc: `${baseUrl}/courses?level=basic`,
      lastmod: currentDate,
      changefreq: 'weekly',
      priority: 0.7
    },
    {
      loc: `${baseUrl}/courses?level=intermediate`,
      lastmod: currentDate,
      changefreq: 'weekly',
      priority: 0.7
    },
    {
      loc: `${baseUrl}/courses?level=advanced`,
      lastmod: currentDate,
      changefreq: 'weekly',
      priority: 0.7
    }
  ]

  const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `  <url>
    <loc>${url.loc}</loc>
    ${url.lastmod ? `<lastmod>${url.lastmod}</lastmod>` : ''}
    ${url.changefreq ? `<changefreq>${url.changefreq}</changefreq>` : ''}
    ${url.priority ? `<priority>${url.priority}</priority>` : ''}
  </url>`).join('\n')}
</urlset>`

  return xmlContent
}

export function generateRobotsTxt(): string {
  const baseUrl = 'https://eyogi-gurukul.vercel.app'
  
  return `User-agent: *
Allow: /
Disallow: /dashboard/
Disallow: /auth/
Disallow: /api/
Disallow: /_next/
Disallow: /admin/

# Allow specific auth pages for SEO
Allow: /auth/signin
Allow: /auth/signup

# Sitemap
Sitemap: ${baseUrl}/sitemap.xml

# Crawl-delay for respectful crawling
Crawl-delay: 1

# Special instructions for major search engines
User-agent: Googlebot
Allow: /
Crawl-delay: 1

User-agent: Bingbot
Allow: /
Crawl-delay: 2

User-agent: Slurp
Allow: /
Crawl-delay: 2`
}