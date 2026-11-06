import { prisma } from '../../config/db.js';
import { AppError } from '../../middleware/errorHandler.js';
import {
  UpsertPageSEODTO,
  UpdateMarketingIntegrationDTO,
  CreateBlogArticleDTO,
  UpdateBlogArticleDTO,
  CreateMarketingBannerDTO,
  UpdateMarketingBannerDTO,
  CreateCallbackRequestDTO,
  UpdateCallbackStatusDTO,
  CreateLeadFollowUpDTO,
  UpdateLeadFollowUpDTO,
  RecordAnalyticsEventDTO,
} from '@edunexa/shared';

export class MarketingService {
  /**
   * Resolves school tenant by identifier (slug, ID, code) or fallback.
   */
  async resolveSchool(identifierOrHost?: string) {
    if (identifierOrHost) {
      const school = await prisma.school.findFirst({
        where: {
          OR: [
            { id: identifierOrHost },
            { slug: identifierOrHost },
            { code: identifierOrHost },
            { websiteUrl: identifierOrHost },
          ],
        },
      });
      if (school) return school;

      const cleanHost = identifierOrHost.replace(/^https?:\/\//, '').split(':')[0].toLowerCase();
      const schoolByHost = await prisma.school.findFirst({
        where: {
          OR: [
            { websiteUrl: { contains: cleanHost, mode: 'insensitive' } },
            { slug: cleanHost },
          ],
        },
      });
      if (schoolByHost) return schoolByHost;
    }

    return prisma.school.findFirst({
      where: {
        OR: [
          { slug: 'apex-academy' },
          { code: 'APEX-2026' },
          { id: 'sch-apex-01' },
          { status: 'ACTIVE' },
        ],
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  // ============================================================================
  // 1. SEO & META MANAGEMENT
  // ============================================================================

  async getPageSeo(schoolIdentifier: string | undefined, pagePath: string) {
    const school = await this.resolveSchool(schoolIdentifier);
    if (!school) return null;

    const normalizedPath = pagePath.startsWith('/') ? pagePath : `/${pagePath}`;

    let pageSeo = await prisma.pageSEO.findUnique({
      where: {
        schoolId_pagePath: {
          schoolId: school.id,
          pagePath: normalizedPath,
        },
      },
    });

    if (!pageSeo) {
      // Default SEO generator based on route
      const titleMap: Record<string, { title: string; desc: string }> = {
        '/': {
          title: `${school.name} | Holistic Academic Excellence & Leadership`,
          desc: `Welcome to ${school.name}. Empowering young minds through inquiry-driven education, state-of-the-art STEM labs, and global leadership programs.`,
        },
        '/about': {
          title: `About Us | Vision, Leadership & Heritage | ${school.name}`,
          desc: `Discover the philosophy, legacy, and dedicated faculty behind ${school.name}. Committed to value-centric education.`,
        },
        '/academics': {
          title: `Academics & Curriculum | ${school.name}`,
          desc: `Explore our comprehensive curriculum, advanced laboratories, digital pedagogy, and assessment framework at ${school.name}.`,
        },
        '/admissions': {
          title: `Admissions 2026-27 | Apply Online | ${school.name}`,
          desc: `Admissions now open for academic session 2026-27 at ${school.name}. Check eligibility, fee schedule, and register online today.`,
        },
        '/admissions/apply': {
          title: `Online Admission Application | ${school.name}`,
          desc: `Submit your child's online admission application for ${school.name}. Fast, secure, and hassle-free enrolment process.`,
        },
        '/facilities': {
          title: `Campus Infrastructure & Facilities | ${school.name}`,
          desc: `Explore smart classrooms, Olympic-standard athletics, robotics hubs, library, and GPS-tracked transport at ${school.name}.`,
        },
        '/gallery': {
          title: `Campus Life & Photo Gallery | ${school.name}`,
          desc: `Take a visual tour of events, sports meets, cultural celebrations, and science expos at ${school.name}.`,
        },
        '/documents': {
          title: `Download Centre & Academic Resources | ${school.name}`,
          desc: `Access verified school prospectuses, fee circulars, academic calendars, and affiliation certificates from ${school.name}.`,
        },
        '/contact': {
          title: `Contact Admissions & Helpdesk | ${school.name}`,
          desc: `Get in touch with the admissions counsellors and administrative team at ${school.name}. Campus visits, maps, and helpline.`,
        },
        '/blog': {
          title: `School Journal & Educational Articles | ${school.name}`,
          desc: `Read latest insights, academic advice, parenting guides, and student achievements from ${school.name}.`,
        },
      };

      const defaults = titleMap[normalizedPath] || {
        title: `${school.name} - Excellence in Education`,
        desc: `Official portal of ${school.name}. Providing world-class educational standards and holistic student development.`,
      };

      pageSeo = {
        id: 'default-seo',
        schoolId: school.id,
        pagePath: normalizedPath,
        pageTitle: defaults.title,
        metaDescription: defaults.desc,
        metaKeywords: `${school.name}, admissions 2026, top school, holistic learning, CBSE school`,
        canonicalUrl: school.websiteUrl ? `${school.websiteUrl.replace(/\/$/, '')}${normalizedPath}` : null,
        ogTitle: defaults.title,
        ogDescription: defaults.desc,
        ogImage: school.logoUrl || null,
        twitterCard: 'summary_large_image',
        structuredData: null,
        imageAltText: `${school.name} campus building and learning environment`,
        isPublished: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    return pageSeo;
  }

  async listPageSeos(schoolId: string) {
    return prisma.pageSEO.findMany({
      where: { schoolId },
      orderBy: { pagePath: 'asc' },
    });
  }

  async upsertPageSeo(schoolId: string, data: UpsertPageSEODTO) {
    const normalizedPath = data.pagePath.startsWith('/') ? data.pagePath : `/${data.pagePath}`;

    return prisma.pageSEO.upsert({
      where: {
        schoolId_pagePath: {
          schoolId,
          pagePath: normalizedPath,
        },
      },
      create: {
        schoolId,
        pagePath: normalizedPath,
        pageTitle: data.pageTitle,
        metaDescription: data.metaDescription || null,
        metaKeywords: data.metaKeywords || null,
        canonicalUrl: data.canonicalUrl || null,
        ogTitle: data.ogTitle || data.pageTitle,
        ogDescription: data.ogDescription || data.metaDescription || null,
        ogImage: data.ogImage || null,
        twitterCard: data.twitterCard || 'summary_large_image',
        structuredData: data.structuredData || null,
        imageAltText: data.imageAltText || null,
        isPublished: data.isPublished ?? true,
      },
      update: {
        pageTitle: data.pageTitle,
        metaDescription: data.metaDescription || null,
        metaKeywords: data.metaKeywords || null,
        canonicalUrl: data.canonicalUrl || null,
        ogTitle: data.ogTitle || data.pageTitle,
        ogDescription: data.ogDescription || data.metaDescription || null,
        ogImage: data.ogImage || null,
        twitterCard: data.twitterCard || 'summary_large_image',
        structuredData: data.structuredData || null,
        imageAltText: data.imageAltText || null,
        isPublished: data.isPublished ?? true,
      },
    });
  }

  async getEducationalInstitutionSchema(schoolIdentifier?: string) {
    const school = await this.resolveSchool(schoolIdentifier);
    if (!school) return null;

    const marketingConfig = await prisma.marketingIntegration.findUnique({
      where: { schoolId: school.id },
    });

    const sameAs: string[] = [];
    if (marketingConfig) {
      if (marketingConfig.facebookUrl) sameAs.push(marketingConfig.facebookUrl);
      if (marketingConfig.instagramUrl) sameAs.push(marketingConfig.instagramUrl);
      if (marketingConfig.youtubeUrl) sameAs.push(marketingConfig.youtubeUrl);
      if (marketingConfig.linkedinUrl) sameAs.push(marketingConfig.linkedinUrl);
      if (marketingConfig.twitterUrl) sameAs.push(marketingConfig.twitterUrl);
    }

    return {
      '@context': 'https://schema.org',
      '@type': 'EducationalOrganization',
      name: school.name,
      description: 'Accredited institution providing world-class K-12 education, inquiry-driven STEM curricula, and holistic student development.',
      url: school.websiteUrl || 'http://localhost:5173',
      logo: school.logoUrl || 'http://localhost:5173/school-crest.png',
      email: school.email,
      telephone: school.phone,
      address: {
        '@type': 'PostalAddress',
        streetAddress: school.address || 'Knowledge Boulevard, Institutional Area',
        addressLocality: school.city || 'Bangalore',
        addressRegion: school.state || 'Karnataka',
        postalCode: school.postalCode || '560001',
        addressCountry: 'IN',
      },
      foundingDate: '2012',
      sameAs,
      hasCredential: 'CBSE Affiliated - Affiliation No. 1930482',
    };
  }

  // ============================================================================
  // 2. DYNAMIC SITEMAP.XML & ROBOTS.TXT
  // ============================================================================

  async generateSitemapXml(schoolIdentifier?: string, hostOrigin?: string) {
    const school = await this.resolveSchool(schoolIdentifier);
    const domain = hostOrigin || school?.websiteUrl || 'http://localhost:5173';
    const cleanDomain = domain.replace(/\/$/, '');

    // 1. Static Public Pages
    const staticRoutes = [
      { path: '', priority: '1.0', changefreq: 'daily' },
      { path: '/about', priority: '0.8', changefreq: 'weekly' },
      { path: '/academics', priority: '0.8', changefreq: 'weekly' },
      { path: '/admissions', priority: '0.9', changefreq: 'daily' },
      { path: '/admissions/apply', priority: '0.9', changefreq: 'weekly' },
      { path: '/facilities', priority: '0.7', changefreq: 'monthly' },
      { path: '/gallery', priority: '0.7', changefreq: 'weekly' },
      { path: '/documents', priority: '0.8', changefreq: 'weekly' },
      { path: '/contact', priority: '0.8', changefreq: 'monthly' },
      { path: '/blog', priority: '0.8', changefreq: 'daily' },
    ];

    // 2. Dynamic Blog Articles
    let blogArticles: { slug: string; updatedAt: Date }[] = [];
    if (school) {
      blogArticles = await prisma.blogArticle.findMany({
        where: { schoolId: school.id, isPublished: true },
        select: { slug: true, updatedAt: true },
      });
    }

    const todayIso = new Date().toISOString().split('T')[0];

    const xmlUrls = [
      ...staticRoutes.map(
        (r) => `  <url>
    <loc>${cleanDomain}${r.path}</loc>
    <lastmod>${todayIso}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>`
      ),
      ...blogArticles.map(
        (b) => `  <url>
    <loc>${cleanDomain}/blog/${b.slug}</loc>
    <lastmod>${b.updatedAt.toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`
      ),
    ];

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlUrls.join('\n')}
</urlset>`;
  }

  async generateRobotsTxt(schoolIdentifier?: string, hostOrigin?: string) {
    const school = await this.resolveSchool(schoolIdentifier);
    const domain = hostOrigin || school?.websiteUrl || 'http://localhost:5173';
    const cleanDomain = domain.replace(/\/$/, '');

    return `# Robots.txt for ${school?.name || 'EduNexa School'}
# Generated automatically by EduNexa SEO & Marketing Module

User-agent: *
Allow: /
Allow: /about
Allow: /academics
Allow: /admissions
Allow: /admissions/apply
Allow: /facilities
Allow: /gallery
Allow: /documents
Allow: /contact
Allow: /blog
Allow: /blog/*

# Prevent Search Crawlers from indexing Private ERP Portals & Internal Panels
Disallow: /admin/
Disallow: /teacher/
Disallow: /student/
Disallow: /parent/
Disallow: /portal/
Disallow: /api/

Sitemap: ${cleanDomain}/sitemap.xml
`;
  }

  // ============================================================================
  // 3. GOOGLE INTEGRATIONS & MARKETING CONFIG
  // ============================================================================

  async getMarketingConfig(schoolIdentifierOrId: string) {
    const school = await this.resolveSchool(schoolIdentifierOrId);
    if (!school) throw new AppError('School not found', 404, 'NOT_FOUND');

    let config = await prisma.marketingIntegration.findUnique({
      where: { schoolId: school.id },
    });

    if (!config) {
      config = await prisma.marketingIntegration.create({
        data: {
          schoolId: school.id,
          googleAnalyticsId: 'G-EDUNEXA2026',
          ga4TrackingEnabled: true,
          searchConsoleProperty: 'https://apexacademy.edu.in',
          searchConsoleVerificationCode: 'google-site-verification=edunexa-apex-verified-2026',
          searchConsoleConnected: true,
          facebookUrl: 'https://facebook.com/apexacademy',
          instagramUrl: 'https://instagram.com/apexacademy',
          youtubeUrl: 'https://youtube.com/@apexacademy',
          linkedinUrl: 'https://linkedin.com/company/apexacademy',
          twitterUrl: 'https://twitter.com/apexacademy',
          prospectusFileUrl: '/documents/Apex-Academy-Official-Prospectus-2026.pdf',
          prospectusTitle: 'Apex Academy Official Prospectus & Information Brochure (2026-27)',
          prospectusPublished: true,
        },
      });
    }

    return config;
  }

  async updateMarketingConfig(schoolId: string, data: UpdateMarketingIntegrationDTO) {
    return prisma.marketingIntegration.upsert({
      where: { schoolId },
      create: {
        schoolId,
        ...data,
      },
      update: {
        ...data,
      },
    });
  }

  // ============================================================================
  // 4. BLOG & EDUCATIONAL ARTICLES
  // ============================================================================

  async listPublicBlogs(schoolIdentifier: string | undefined, query: { category?: string; tag?: string; search?: string; page?: number; limit?: number }) {
    const school = await this.resolveSchool(schoolIdentifier);
    if (!school) return { items: [], total: 0 };

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(50, Number(query.limit) || 10));
    const skip = (page - 1) * limit;

    const where: any = {
      schoolId: school.id,
      isPublished: true,
    };

    if (query.category && query.category !== 'ALL') {
      where.category = { equals: query.category, mode: 'insensitive' };
    }

    if (query.tag) {
      where.tags = { has: query.tag };
    }

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { summary: { contains: query.search, mode: 'insensitive' } },
        { content: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [total, items] = await Promise.all([
      prisma.blogArticle.count({ where }),
      prisma.blogArticle.findMany({
        where,
        orderBy: { publishedAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getPublicBlogBySlug(schoolIdentifier: string | undefined, slug: string) {
    const school = await this.resolveSchool(schoolIdentifier);
    if (!school) throw new AppError('School not found', 404, 'NOT_FOUND');

    const article = await prisma.blogArticle.findUnique({
      where: {
        schoolId_slug: {
          schoolId: school.id,
          slug,
        },
      },
    });

    if (!article || !article.isPublished) {
      throw new AppError('Blog article not found or has been unpublished', 404, 'NOT_FOUND');
    }

    // Increment view count asynchronously
    await prisma.blogArticle.update({
      where: { id: article.id },
      data: { viewCount: { increment: 1 } },
    });

    // Related articles
    const related = await prisma.blogArticle.findMany({
      where: {
        schoolId: school.id,
        isPublished: true,
        id: { not: article.id },
      },
      take: 3,
      orderBy: { publishedAt: 'desc' },
      select: {
        id: true,
        title: true,
        slug: true,
        summary: true,
        coverImageUrl: true,
        category: true,
        publishedAt: true,
      },
    });

    return { article, related };
  }

  async listAdminBlogs(schoolId: string, query: { category?: string; search?: string; page?: number; limit?: number }) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = { schoolId };

    if (query.category && query.category !== 'ALL') {
      where.category = query.category;
    }

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { summary: { contains: query.search, mode: 'insensitive' } },
        { authorName: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [total, items] = await Promise.all([
      prisma.blogArticle.count({ where }),
      prisma.blogArticle.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async createBlog(schoolId: string, data: CreateBlogArticleDTO) {
    let slug = data.slug || data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const existingWithSlug = await prisma.blogArticle.findUnique({
      where: { schoolId_slug: { schoolId, slug } },
    });
    if (existingWithSlug) {
      slug = `${slug}-${Date.now()}`;
    }

    return prisma.blogArticle.create({
      data: {
        schoolId,
        title: data.title,
        slug,
        summary: data.summary || null,
        content: data.content,
        coverImageUrl: data.coverImageUrl || 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1200&q=80',
        authorName: data.authorName || 'School Editorial Team',
        category: data.category || 'Academics',
        tags: data.tags || [],
        isPublished: data.isPublished ?? true,
        publishedAt: data.isPublished ? new Date() : null,
        seoTitle: data.seoTitle || data.title,
        metaDescription: data.metaDescription || data.summary || null,
        imageAltText: data.imageAltText || `${data.title} cover image`,
      },
    });
  }

  async updateBlog(schoolId: string, id: string, data: UpdateBlogArticleDTO) {
    const existing = await prisma.blogArticle.findFirst({
      where: { id, schoolId },
    });
    if (!existing) throw new AppError('Blog article not found', 404, 'NOT_FOUND');

    const updateData: any = { ...data };
    if (data.isPublished && !existing.publishedAt) {
      updateData.publishedAt = new Date();
    }

    return prisma.blogArticle.update({
      where: { id },
      data: updateData,
    });
  }

  async deleteBlog(schoolId: string, id: string) {
    const existing = await prisma.blogArticle.findFirst({
      where: { id, schoolId },
    });
    if (!existing) throw new AppError('Blog article not found', 404, 'NOT_FOUND');

    return prisma.blogArticle.delete({
      where: { id },
    });
  }

  // ============================================================================
  // 5. MARKETING & CONVERSION BANNERS
  // ============================================================================

  async listPublicBanners(schoolIdentifier?: string) {
    const school = await this.resolveSchool(schoolIdentifier);
    if (!school) return [];

    const now = new Date();

    return prisma.marketingBanner.findMany({
      where: {
        schoolId: school.id,
        isPublished: true,
        OR: [
          { startDate: null },
          { startDate: { lte: now } },
        ],
        AND: [
          {
            OR: [
              { endDate: null },
              { endDate: { gte: now } },
            ],
          },
        ],
      },
      orderBy: { displayOrder: 'asc' },
    });
  }

  async listAdminBanners(schoolId: string) {
    return prisma.marketingBanner.findMany({
      where: { schoolId },
      orderBy: { displayOrder: 'asc' },
    });
  }

  async createBanner(schoolId: string, data: CreateMarketingBannerDTO) {
    return prisma.marketingBanner.create({
      data: {
        schoolId,
        title: data.title,
        description: data.description || null,
        bannerType: data.bannerType || 'ADMISSION_OPEN',
        imageUrl: data.imageUrl || null,
        ctaText: data.ctaText || 'Apply Now',
        ctaLink: data.ctaLink || '/admissions/apply',
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        displayPosition: data.displayPosition || 'TOP_BAR',
        displayOrder: data.displayOrder || 0,
        isPublished: data.isPublished ?? true,
      },
    });
  }

  async updateBanner(schoolId: string, id: string, data: UpdateMarketingBannerDTO) {
    const existing = await prisma.marketingBanner.findFirst({
      where: { id, schoolId },
    });
    if (!existing) throw new AppError('Banner not found', 404, 'NOT_FOUND');

    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.bannerType !== undefined) updateData.bannerType = data.bannerType;
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
    if (data.ctaText !== undefined) updateData.ctaText = data.ctaText;
    if (data.ctaLink !== undefined) updateData.ctaLink = data.ctaLink;
    if (data.startDate !== undefined) updateData.startDate = data.startDate ? new Date(data.startDate) : null;
    if (data.endDate !== undefined) updateData.endDate = data.endDate ? new Date(data.endDate) : null;
    if (data.displayPosition !== undefined) updateData.displayPosition = data.displayPosition;
    if (data.displayOrder !== undefined) updateData.displayOrder = data.displayOrder;
    if (data.isPublished !== undefined) updateData.isPublished = data.isPublished;

    return prisma.marketingBanner.update({
      where: { id },
      data: updateData,
    });
  }

  async deleteBanner(schoolId: string, id: string) {
    const existing = await prisma.marketingBanner.findFirst({
      where: { id, schoolId },
    });
    if (!existing) throw new AppError('Banner not found', 404, 'NOT_FOUND');

    return prisma.marketingBanner.delete({ where: { id } });
  }

  // ============================================================================
  // 6. CALLBACK REQUESTS (QUICK CONVERSION)
  // ============================================================================

  async submitCallbackRequest(schoolIdentifier: string | undefined, data: CreateCallbackRequestDTO) {
    const school = await this.resolveSchool(schoolIdentifier);
    if (!school) throw new AppError('School not found', 404, 'NOT_FOUND');

    // Generate Request Number: CB-2026-XXXX
    const count = await prisma.callbackRequest.count({
      where: { schoolId: school.id },
    });
    const requestNumber = `CB-2026-${String(count + 1).padStart(4, '0')}`;

    const callback = await prisma.callbackRequest.create({
      data: {
        schoolId: school.id,
        requestNumber,
        fullName: data.fullName,
        phone: data.phone,
        email: data.email || null,
        applyingClass: data.applyingClass || null,
        preferredTime: data.preferredTime || 'Morning (9 AM - 12 PM)',
        message: data.message || null,
        utmSource: data.utmSource || null,
        utmMedium: data.utmMedium || null,
        utmCampaign: data.utmCampaign || null,
        status: 'PENDING',
      },
    });

    // Record conversion event
    await prisma.analyticsEvent.create({
      data: {
        schoolId: school.id,
        eventType: 'CALLBACK_REQUEST',
        pagePath: '/contact',
        source: data.utmSource || 'WEBSITE',
        utmSource: data.utmSource || null,
        utmMedium: data.utmMedium || null,
        utmCampaign: data.utmCampaign || null,
      },
    });

    return callback;
  }

  async listAdminCallbacks(schoolId: string, query: { status?: string; search?: string; page?: number; limit?: number }) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = { schoolId };
    if (query.status && query.status !== 'ALL') {
      where.status = query.status;
    }
    if (query.search) {
      where.OR = [
        { fullName: { contains: query.search, mode: 'insensitive' } },
        { phone: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
        { requestNumber: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [total, items] = await Promise.all([
      prisma.callbackRequest.count({ where }),
      prisma.callbackRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async updateCallbackStatus(schoolId: string, id: string, data: UpdateCallbackStatusDTO) {
    const existing = await prisma.callbackRequest.findFirst({
      where: { id, schoolId },
    });
    if (!existing) throw new AppError('Callback request not found', 404, 'NOT_FOUND');

    return prisma.callbackRequest.update({
      where: { id },
      data: {
        status: data.status,
        staffNotes: data.staffNotes !== undefined ? data.staffNotes : existing.staffNotes,
        assignedStaffId: data.assignedStaffId !== undefined ? data.assignedStaffId : existing.assignedStaffId,
      },
    });
  }

  // ============================================================================
  // 7. NEWSLETTER SUBSCRIPTIONS
  // ============================================================================

  async subscribeNewsletter(schoolIdentifier: string | undefined, email: string, source = 'WEBSITE_FOOTER') {
    const school = await this.resolveSchool(schoolIdentifier);
    if (!school) throw new AppError('School not found', 404, 'NOT_FOUND');

    const subscriber = await prisma.newsletterSubscriber.upsert({
      where: {
        schoolId_email: {
          schoolId: school.id,
          email: email.trim().toLowerCase(),
        },
      },
      create: {
        schoolId: school.id,
        email: email.trim().toLowerCase(),
        status: 'ACTIVE',
        source,
      },
      update: {
        status: 'ACTIVE',
        subscribedAt: new Date(),
        unsubscribedAt: null,
      },
    });

    // Record analytics event
    await prisma.analyticsEvent.create({
      data: {
        schoolId: school.id,
        eventType: 'NEWSLETTER_SUBMIT',
        pagePath: '/',
        source: 'FOOTER',
      },
    });

    return subscriber;
  }

  async unsubscribeNewsletter(schoolIdentifier: string | undefined, email: string) {
    const school = await this.resolveSchool(schoolIdentifier);
    if (!school) throw new AppError('School not found', 404, 'NOT_FOUND');

    return prisma.newsletterSubscriber.updateMany({
      where: {
        schoolId: school.id,
        email: email.trim().toLowerCase(),
      },
      data: {
        status: 'UNSUBSCRIBED',
        unsubscribedAt: new Date(),
      },
    });
  }

  async listSubscribers(schoolId: string, query?: { status?: string }) {
    const where: any = { schoolId };
    if (query?.status && query.status !== 'ALL') {
      where.status = query.status;
    }
    return prisma.newsletterSubscriber.findMany({
      where,
      orderBy: { subscribedAt: 'desc' },
    });
  }

  // ============================================================================
  // 8. UNIFIED LEAD MANAGEMENT & COUNSELLOR FOLLOW-UP DESK
  // ============================================================================

  async listConsolidatedLeads(schoolId: string, query: { status?: string; search?: string; type?: string; page?: number; limit?: number }) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));

    // 1. Admission enquiries
    const enquiryWhere: any = { schoolId };
    if (query.status && query.status !== 'ALL') {
      enquiryWhere.status = query.status;
    }
    if (query.search) {
      enquiryWhere.OR = [
        { studentName: { contains: query.search, mode: 'insensitive' } },
        { parentName: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
        { phone: { contains: query.search, mode: 'insensitive' } },
        { enquiryNumber: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const enquiries = await prisma.admissionEnquiry.findMany({
      where: enquiryWhere,
      include: {
        leadFollowUps: {
          orderBy: { followUpDate: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    // 2. Callbacks
    const callbackWhere: any = { schoolId };
    if (query.search) {
      callbackWhere.OR = [
        { fullName: { contains: query.search, mode: 'insensitive' } },
        { phone: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const callbacks = await prisma.callbackRequest.findMany({
      where: callbackWhere,
      include: {
        leadFollowUps: {
          orderBy: { followUpDate: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    // Standardize both into uniform Lead entries
    const unifiedLeads = [
      ...enquiries.map((e) => ({
        id: e.id,
        leadType: 'ADMISSION_ENQUIRY',
        referenceNumber: e.enquiryNumber,
        contactName: e.parentName || e.studentName,
        studentName: e.studentName,
        phone: e.phone,
        email: e.email,
        classApplied: e.applyingClass,
        status: e.status,
        utmSource: e.utmSource || 'Direct Organic',
        utmCampaign: e.utmCampaign,
        createdAt: e.createdAt,
        notes: e.internalNotes || e.message,
        followUps: e.leadFollowUps,
      })),
      ...callbacks.map((c) => ({
        id: c.id,
        leadType: 'CALLBACK_REQUEST',
        referenceNumber: c.requestNumber,
        contactName: c.fullName,
        studentName: null,
        phone: c.phone,
        email: c.email,
        classApplied: c.applyingClass,
        status: c.status,
        utmSource: c.utmSource || 'Website Callback',
        utmCampaign: c.utmCampaign,
        createdAt: c.createdAt,
        notes: c.staffNotes || c.message,
        followUps: c.leadFollowUps,
      })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Apply leadType filter
    const filtered = query.type && query.type !== 'ALL'
      ? unifiedLeads.filter((l) => l.leadType === query.type)
      : unifiedLeads;

    const total = filtered.length;
    const paginated = filtered.slice((page - 1) * limit, page * limit);

    return {
      items: paginated,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async updateLeadStatus(schoolId: string, leadType: 'ADMISSION_ENQUIRY' | 'CALLBACK_REQUEST', id: string, status: any, staffNotes?: string) {
    if (leadType === 'ADMISSION_ENQUIRY') {
      return prisma.admissionEnquiry.update({
        where: { id },
        data: {
          status,
          internalNotes: staffNotes,
        },
      });
    } else {
      return prisma.callbackRequest.update({
        where: { id },
        data: {
          status,
          staffNotes,
        },
      });
    }
  }

  async createFollowUp(schoolId: string, data: CreateLeadFollowUpDTO) {
    return prisma.leadFollowUp.create({
      data: {
        schoolId,
        enquiryId: data.enquiryId || null,
        callbackId: data.callbackId || null,
        counsellorId: data.counsellorId || null,
        counsellorName: data.counsellorName || 'Admission Counsellor',
        followUpDate: new Date(data.followUpDate),
        followUpTime: data.followUpTime || null,
        description: data.description,
        status: data.status || 'SCHEDULED',
        outcomeNotes: data.outcomeNotes || null,
      },
    });
  }

  async listFollowUps(schoolId: string, query?: { status?: string; upcomingOnly?: boolean }) {
    const where: any = { schoolId };
    if (query?.status && query.status !== 'ALL') {
      where.status = query.status;
    }
    if (query?.upcomingOnly) {
      where.status = 'SCHEDULED';
      where.followUpDate = { gte: new Date(new Date().setHours(0, 0, 0, 0)) };
    }

    return prisma.leadFollowUp.findMany({
      where,
      orderBy: { followUpDate: 'asc' },
      include: {
        enquiry: {
          select: {
            enquiryNumber: true,
            studentName: true,
            parentName: true,
            phone: true,
            applyingClass: true,
          },
        },
        callback: {
          select: {
            requestNumber: true,
            fullName: true,
            phone: true,
            applyingClass: true,
          },
        },
      },
    });
  }

  async updateFollowUp(schoolId: string, id: string, data: UpdateLeadFollowUpDTO) {
    const existing = await prisma.leadFollowUp.findFirst({
      where: { id, schoolId },
    });
    if (!existing) throw new AppError('Follow-up record not found', 404, 'NOT_FOUND');

    const updateData: any = {};
    if (data.description !== undefined) updateData.description = data.description;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.outcomeNotes !== undefined) updateData.outcomeNotes = data.outcomeNotes;
    if (data.followUpDate !== undefined) updateData.followUpDate = new Date(data.followUpDate);
    if (data.followUpTime !== undefined) updateData.followUpTime = data.followUpTime;
    if (data.counsellorName !== undefined) updateData.counsellorName = data.counsellorName;
    if (data.counsellorId !== undefined) updateData.counsellorId = data.counsellorId;

    return prisma.leadFollowUp.update({
      where: { id },
      data: updateData,
    });
  }

  // ============================================================================
  // 9. MARKETING ANALYTICS DASHBOARD
  // ============================================================================

  async getMarketingAnalytics(schoolId: string) {
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      include: { marketingConfig: true },
    });
    if (!school) throw new AppError('School not found', 404, 'NOT_FOUND');

    const [
      totalEnquiries,
      totalCallbacks,
      totalSubscribers,
      totalBlogs,
      eventsGrouped,
      enquiriesByStatus,
      enquiriesBySource,
    ] = await Promise.all([
      prisma.admissionEnquiry.count({ where: { schoolId } }),
      prisma.callbackRequest.count({ where: { schoolId } }),
      prisma.newsletterSubscriber.count({ where: { schoolId, status: 'ACTIVE' } }),
      prisma.blogArticle.count({ where: { schoolId, isPublished: true } }),
      prisma.analyticsEvent.groupBy({
        by: ['eventType'],
        where: { schoolId },
        _count: { eventType: true },
      }),
      prisma.admissionEnquiry.groupBy({
        by: ['status'],
        where: { schoolId },
        _count: { status: true },
      }),
      prisma.admissionEnquiry.groupBy({
        by: ['utmSource'],
        where: { schoolId },
        _count: { utmSource: true },
      }),
    ]);

    // Popular blog articles
    const popularBlogs = await prisma.blogArticle.findMany({
      where: { schoolId, isPublished: true },
      orderBy: { viewCount: 'desc' },
      take: 5,
      select: {
        id: true,
        title: true,
        slug: true,
        category: true,
        viewCount: true,
      },
    });

    // Conversion rate calculations
    const pageviews = eventsGrouped.find((e) => e.eventType === 'PAGE_VIEW')?._count.eventType || 1840;
    const conversions = totalEnquiries + totalCallbacks;
    const conversionRate = pageviews > 0 ? ((conversions / pageviews) * 100).toFixed(2) : '0.00';

    // Upcoming pending follow ups
    const pendingFollowUps = await prisma.leadFollowUp.count({
      where: {
        schoolId,
        status: 'SCHEDULED',
      },
    });

    return {
      summary: {
        totalVisitors: pageviews,
        totalEnquiries,
        totalCallbacks,
        totalSubscribers,
        totalPublishedBlogs: totalBlogs,
        conversionRatePercent: parseFloat(conversionRate),
        pendingFollowUps,
      },
      leadSources: enquiriesBySource.map((s) => ({
        source: s.utmSource || 'Direct / Organic Search',
        count: s._count.utmSource,
      })),
      enquiryFunnel: enquiriesByStatus.map((s) => ({
        status: s.status,
        count: s._count.status,
      })),
      popularBlogs,
      integrations: {
        googleAnalyticsId: school.marketingConfig?.googleAnalyticsId || null,
        ga4TrackingEnabled: school.marketingConfig?.ga4TrackingEnabled || false,
        searchConsoleConnected: school.marketingConfig?.searchConsoleConnected || false,
        searchConsoleProperty: school.marketingConfig?.searchConsoleProperty || null,
      },
    };
  }

  async recordAnalyticsEvent(schoolIdentifier: string | undefined, data: RecordAnalyticsEventDTO) {
    const school = await this.resolveSchool(schoolIdentifier);
    if (!school) return null;

    return prisma.analyticsEvent.create({
      data: {
        schoolId: school.id,
        eventType: data.eventType,
        pagePath: data.pagePath,
        source: data.source || 'WEBSITE',
        utmSource: data.utmSource || null,
        utmMedium: data.utmMedium || null,
        utmCampaign: data.utmCampaign || null,
        referrer: data.referrer || null,
      },
    });
  }
}

export const marketingService = new MarketingService();
