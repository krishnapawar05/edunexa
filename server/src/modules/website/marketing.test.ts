import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../../app.js';
import { generateAccessToken } from '../../utils/crypto.js';
import { PlatformRole } from '@edunexa/shared';
import { prisma, checkDatabaseConnection } from '../../config/db.js';

describe('SECTION 14: SEO, DIGITAL MARKETING & WEBSITE CONVERSION TEST SUITE', () => {
  let schoolAdminToken: string;
  let targetSchoolId: string;
  let sampleBlogId: string;
  let sampleBannerId: string;
  let sampleCallbackId: string;
  let sampleFollowUpId: string;

  beforeAll(async () => {
    const dbStatus = await checkDatabaseConnection();
    expect(dbStatus.connected).toBe(true);

    const school = (await prisma.school.findFirst({
      where: { slug: 'apex-academy' },
    })) || (await prisma.school.findFirst());

    expect(school).toBeDefined();
    targetSchoolId = school!.id;

    schoolAdminToken = generateAccessToken({
      userId: 'usr-schooladmin-marketing',
      email: 'admin@apexacademy.edu',
      schoolId: targetSchoolId,
      role: PlatformRole.SCHOOL_ADMIN,
    });
  });

  // ============================================================================
  // 1. PUBLIC SEO & SCHEMA MARKUP
  // ============================================================================

  it('1. GET /api/v1/website/seo returns SEO metadata for a requested path', async () => {
    const res = await request(app).get('/api/v1/website/seo?path=/admissions');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.pageTitle).toContain('Admissions');
    expect(res.body.data.canonicalUrl).toBeDefined();
  });

  it('2. GET /api/v1/website/schema-markup returns Schema.org EducationalOrganization JSON-LD', async () => {
    const res = await request(app).get('/api/v1/website/schema-markup');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data['@context']).toBe('https://schema.org');
    expect(res.body.data['@type']).toBe('EducationalOrganization');
    expect(res.body.data.name).toBeDefined();
    expect(res.body.data.address).toBeDefined();
  });

  it('3. GET /sitemap.xml returns XML sitemap with public URLs and change frequencies', async () => {
    const res = await request(app).get('/sitemap.xml');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('xml');
    expect(res.text).toContain('<urlset');
    expect(res.text).toContain('/admissions');
    expect(res.text).toContain('/academics');
    // Ensure admin and private ERP panels are strictly excluded
    expect(res.text).not.toContain('/admin/');
    expect(res.text).not.toContain('/teacher/');
  });

  it('4. GET /robots.txt returns compliant robots configuration disallowing ERP routes', async () => {
    const res = await request(app).get('/robots.txt');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/plain');
    expect(res.text).toContain('Disallow: /admin/');
    expect(res.text).toContain('Disallow: /teacher/');
    expect(res.text).toContain('Disallow: /student/');
    expect(res.text).toContain('Sitemap:');
  });

  // ============================================================================
  // 2. PUBLIC BLOGS & ARTICLES
  // ============================================================================

  it('5. POST /api/v1/website/admin/blogs creates a new educational blog article', async () => {
    const res = await request(app)
      .post('/api/v1/website/admin/blogs')
      .set('Authorization', `Bearer ${schoolAdminToken}`)
      .send({
        title: 'Fostering STEM Curiosity in Middle Schoolers',
        summary: 'How modern robotics labs cultivate analytical thinking and problem-solving skills.',
        content:
          'Hands-on experimental STEM initiatives bridge theoretical textbooks and real-world engineering challenges. In our newly inaugurated laboratory, students explore 3D printing and coding.',
        category: 'Academics',
        tags: ['STEM', 'Robotics', 'Innovation'],
        isPublished: true,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBeDefined();
    expect(res.body.data.slug).toBeDefined();
    sampleBlogId = res.body.data.id;
  });

  it('6. GET /api/v1/website/blogs lists published blog articles for visitors', async () => {
    const res = await request(app).get('/api/v1/website/blogs');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('7. GET /api/v1/website/blogs/:slug returns article details and related posts', async () => {
    const blog = await prisma.blogArticle.findFirst({
      where: { schoolId: targetSchoolId, isPublished: true },
    });
    expect(blog).toBeDefined();

    const res = await request(app).get(`/api/v1/website/blogs/${blog!.slug}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.article.title).toBe(blog!.title);
    expect(res.body.data.related).toBeDefined();
  });

  // ============================================================================
  // 3. CONVERSION FEATURES: BANNERS, CALLBACKS, NEWSLETTER, ANALYTICS
  // ============================================================================

  it('8. POST /api/v1/website/admin/banners creates an Admission Open promotional banner', async () => {
    const res = await request(app)
      .post('/api/v1/website/admin/banners')
      .set('Authorization', `Bearer ${schoolAdminToken}`)
      .send({
        title: 'Admissions Open for Session 2026-27 — Early Enrolment Benefits',
        description: 'Secure your childs future with world-class faculty and international curricula.',
        bannerType: 'ADMISSION_OPEN',
        ctaText: 'Apply Now',
        ctaLink: '/admissions/apply',
        displayPosition: 'TOP_BAR',
        displayOrder: 1,
        isPublished: true,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBeDefined();
    sampleBannerId = res.body.data.id;
  });

  it('9. GET /api/v1/website/banners returns active banners for public display', async () => {
    const res = await request(app).get('/api/v1/website/banners');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('10. POST /api/v1/website/callback-requests submits quick conversion lead with UTM tags', async () => {
    const res = await request(app).post('/api/v1/website/callback-requests').send({
      fullName: 'Vikram Malhotra',
      phone: '+91 98765 43210',
      email: 'vikram.malhotra@example.com',
      applyingClass: 'Grade 7',
      preferredTime: 'Morning (10 AM - 12 PM)',
      message: 'Interested in STEM curriculum and bus route near Indiranagar.',
      utmSource: 'google_ads',
      utmMedium: 'cpc',
      utmCampaign: 'admissions_spring_2026',
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.requestNumber).toMatch(/^CB-2026-\d{4}$/);
    sampleCallbackId = res.body.data.id;
  });

  it('11. POST /api/v1/website/newsletter/subscribe registers a subscriber', async () => {
    const res = await request(app).post('/api/v1/website/newsletter/subscribe').send({
      email: 'parent.newsletter@example.com',
      source: 'WEBSITE_FOOTER',
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe('parent.newsletter@example.com');
  });

  it('12. POST /api/v1/website/analytics/event records conversion event', async () => {
    const res = await request(app).post('/api/v1/website/analytics/event').send({
      eventType: 'PROSPECTUS_DOWNLOAD',
      pagePath: '/documents',
      source: 'WEBSITE',
      utmSource: 'facebook',
      utmCampaign: 'prospectus_campaign',
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.eventType).toBe('PROSPECTUS_DOWNLOAD');
  });

  // ============================================================================
  // 4. ADMIN SEO, MARKETING CONFIG & UNIFIED LEADS
  // ============================================================================

  it('13. PUT /api/v1/website/admin/seo updates custom SEO meta for a specific page', async () => {
    const res = await request(app)
      .put('/api/v1/website/admin/seo')
      .set('Authorization', `Bearer ${schoolAdminToken}`)
      .send({
        pagePath: '/admissions',
        pageTitle: 'Admissions 2026 | Top CBSE School | Apex Academy',
        metaDescription: 'Admissions open for Grades Nursery to 12. State-of-the-art campus and scholarships.',
        canonicalUrl: 'https://apexacademy.edu.in/admissions',
        ogTitle: 'Admissions 2026 | Apex Academy',
        isPublished: true,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.pageTitle).toBe('Admissions 2026 | Top CBSE School | Apex Academy');
  });

  it('14. PUT /api/v1/website/admin/marketing/config updates GA4 and Search Console settings', async () => {
    const res = await request(app)
      .put('/api/v1/website/admin/marketing/config')
      .set('Authorization', `Bearer ${schoolAdminToken}`)
      .send({
        googleAnalyticsId: 'G-APEX2026XYZ',
        ga4TrackingEnabled: true,
        searchConsoleProperty: 'https://apexacademy.edu.in',
        searchConsoleConnected: true,
        prospectusTitle: 'Apex Academy Official Prospectus 2026-27',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.googleAnalyticsId).toBe('G-APEX2026XYZ');
  });

  it('15. GET /api/v1/website/admin/leads aggregates admission enquiries and callbacks into unified lead desk', async () => {
    const res = await request(app)
      .get('/api/v1/website/admin/leads')
      .set('Authorization', `Bearer ${schoolAdminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    const hasCallback = res.body.data.some((l: any) => l.leadType === 'CALLBACK_REQUEST');
    expect(hasCallback).toBe(true);
  });

  it('16. POST /api/v1/website/admin/follow-ups schedules an admission counsellor reminder', async () => {
    const res = await request(app)
      .post('/api/v1/website/admin/follow-ups')
      .set('Authorization', `Bearer ${schoolAdminToken}`)
      .send({
        callbackId: sampleCallbackId,
        counsellorName: 'Anita Sharma (Head Counsellor)',
        followUpDate: '2026-11-10',
        followUpTime: '11:00 AM',
        description: 'Provide campus tour slot details and share Class 7 curriculum handbook via email.',
        status: 'SCHEDULED',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBeDefined();
    sampleFollowUpId = res.body.data.id;
  });

  it('17. GET /api/v1/website/admin/marketing/analytics computes real conversion and lead metrics', async () => {
    const res = await request(app)
      .get('/api/v1/website/admin/marketing/analytics')
      .set('Authorization', `Bearer ${schoolAdminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.summary).toBeDefined();
    expect(res.body.data.summary.totalEnquiries).toBeGreaterThanOrEqual(0);
    expect(res.body.data.summary.totalCallbacks).toBeGreaterThanOrEqual(1);
    expect(res.body.data.integrations).toBeDefined();
  });
});

