import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../../app.js';
import { generateAccessToken } from '../../utils/crypto.js';
import { PlatformRole } from '@edunexa/shared';
import { prisma, checkDatabaseConnection } from '../../config/db.js';

describe('DYNAMIC SCHOOL WEBSITE CMS & GALLERY API TEST SUITE', () => {
  let schoolAdminToken: string;
  let teacherToken: string;
  let targetSchoolId: string;

  beforeAll(async () => {
    const dbStatus = await checkDatabaseConnection();
    expect(dbStatus.connected).toBe(true);

    const school = await prisma.school.findFirst({
      where: { slug: 'apex-academy' },
    }) || await prisma.school.findFirst();

    expect(school).toBeDefined();
    targetSchoolId = school!.id;

    schoolAdminToken = generateAccessToken({
      userId: 'usr-schooladmin-01',
      email: 'admin@apexacademy.edu',
      schoolId: targetSchoolId,
      role: PlatformRole.SCHOOL_ADMIN,
    });

    teacherToken = generateAccessToken({
      userId: 'usr-teacher-01',
      email: 'dr.thorne@apexacademy.edu',
      schoolId: targetSchoolId,
      staffProfileId: 'staff-thorne-01',
      role: PlatformRole.TEACHER,
    });
  });

  // --------------------------------------------------------------------------
  // 1. Public Website Data Retrieval
  // --------------------------------------------------------------------------
  it('1. GET /api/v1/website/public returns full dynamic school dataset for public visitors', async () => {
    const res = await request(app).get('/api/v1/website/public');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();

    const { school, content, highlights, facilities, academicPrograms, faculty, achievements, testimonials, galleryPreview, downloadableDocs } =
      res.body.data;

    expect(school).toBeDefined();
    expect(school.name).toBeDefined();
    expect(content).toBeDefined();
    expect(content.heroTitle).toBeDefined();
    expect(Array.isArray(highlights)).toBe(true);
    expect(Array.isArray(facilities)).toBe(true);
    expect(Array.isArray(academicPrograms)).toBe(true);
    expect(Array.isArray(faculty)).toBe(true);
    expect(Array.isArray(achievements)).toBe(true);
    expect(Array.isArray(testimonials)).toBe(true);
    expect(galleryPreview).toBeDefined();
    expect(Array.isArray(galleryPreview.photos)).toBe(true);
    expect(Array.isArray(downloadableDocs)).toBe(true);
  });

  // --------------------------------------------------------------------------
  // 2. Public Gallery Endpoints & Filtering
  // --------------------------------------------------------------------------
  it('2. GET /api/v1/website/gallery/categories and items return albums and media', async () => {
    const catRes = await request(app).get('/api/v1/website/gallery/categories');
    expect(catRes.status).toBe(200);
    expect(catRes.body.success).toBe(true);
    expect(Array.isArray(catRes.body.data)).toBe(true);
    expect(catRes.body.data.length).toBeGreaterThan(0);

    const itemsRes = await request(app).get('/api/v1/website/gallery/items?limit=20');
    expect(itemsRes.status).toBe(200);
    expect(itemsRes.body.success).toBe(true);
    expect(itemsRes.body.data.items).toBeDefined();
    expect(Array.isArray(itemsRes.body.data.items)).toBe(true);

    // Filter by IMAGE mediaType
    const photosRes = await request(app).get('/api/v1/website/gallery/items?mediaType=IMAGE');
    expect(photosRes.status).toBe(200);
    for (const item of photosRes.body.data.items) {
      expect(item.mediaType).toBe('IMAGE');
    }
  });

  // --------------------------------------------------------------------------
  // 3. Security: RBAC Enforcement on School Admin CMS
  // --------------------------------------------------------------------------
  it('3. GET /api/v1/website/admin blocks unauthorized visitors and non-admins', async () => {
    // Unauthenticated request
    const anonRes = await request(app).get('/api/v1/website/admin');
    expect(anonRes.status).toBe(401);

    // Teacher cannot access School Admin website CMS
    const teacherRes = await request(app)
      .get('/api/v1/website/admin')
      .set('Authorization', `Bearer ${teacherToken}`);
    expect(teacherRes.status).toBe(403);

    // School Admin can access
    const adminRes = await request(app)
      .get('/api/v1/website/admin')
      .set('Authorization', `Bearer ${schoolAdminToken}`);
    expect(adminRes.status).toBe(200);
    expect(adminRes.body.success).toBe(true);
    expect(adminRes.body.data.content).toBeDefined();
    expect(adminRes.body.data.school).toBeDefined();
  });

  // --------------------------------------------------------------------------
  // 4. Update Website Content (Hero, About, Principal, STEM, Admissions)
  // --------------------------------------------------------------------------
  it('4. PUT /api/v1/website/admin/content persists content updates to PostgreSQL', async () => {
    const updatedHeroTitle = 'Empowering Scholars for a Transformative Future';
    const updatedAboutStory = 'Apex Academy was founded with a profound moral purpose to unite scientific discipline with civic empathy.';

    const putRes = await request(app)
      .put('/api/v1/website/admin/content')
      .set('Authorization', `Bearer ${schoolAdminToken}`)
      .send({
        heroTitle: updatedHeroTitle,
        aboutStory: updatedAboutStory,
        admissionNoticeOpen: true,
        admissionSession: '2026–2027',
      });

    expect(putRes.status).toBe(200);
    expect(putRes.body.success).toBe(true);
    expect(putRes.body.data.heroTitle).toBe(updatedHeroTitle);
    expect(putRes.body.data.aboutStory).toBe(updatedAboutStory);

    // Verify it reflects in public API
    const publicRes = await request(app).get('/api/v1/website/public');
    expect(publicRes.body.data.content.heroTitle).toBe(updatedHeroTitle);
  });

  // --------------------------------------------------------------------------
  // 5. Update School Institutional Branding
  // --------------------------------------------------------------------------
  it('5. PUT /api/v1/website/admin/branding updates tenant branding details', async () => {
    const updatedMotto = 'Veritas, Virtus et Scientia (Truth, Virtue and Science)';

    const putRes = await request(app)
      .put('/api/v1/website/admin/branding')
      .set('Authorization', `Bearer ${schoolAdminToken}`)
      .send({
        motto: updatedMotto,
        brandingConfig: {
          affiliation: 'CBSE & Cambridge International Assessment',
          establishedYear: 1998,
          primaryAccent: '#244C3A',
        },
      });

    expect(putRes.status).toBe(200);
    expect(putRes.body.success).toBe(true);
    expect(putRes.body.data.motto).toBe(updatedMotto);
  });

  // --------------------------------------------------------------------------
  // 6. Highlights CRUD (Why Choose Us)
  // --------------------------------------------------------------------------
  let createdHighlightId: string;
  it('6. Highlights CRUD creates, updates, and deletes why choose us pillars', async () => {
    // Create
    const createRes = await request(app)
      .post('/api/v1/website/admin/highlights')
      .set('Authorization', `Bearer ${schoolAdminToken}`)
      .send({
        title: 'Verifiable Anti-Tamper Digital Credentials',
        description: 'Every student receives an anti-tamper cryptographically verifiable ID card.',
        iconName: 'ShieldCheck',
        displayOrder: 99,
        isPublished: true,
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.success).toBe(true);
    createdHighlightId = createRes.body.data.id;
    expect(createdHighlightId).toBeDefined();

    // Update
    const updateRes = await request(app)
      .put(`/api/v1/website/admin/highlights/${createdHighlightId}`)
      .set('Authorization', `Bearer ${schoolAdminToken}`)
      .send({
        title: 'Verifiable Digital Credentials & Student Safety',
        isPublished: true,
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.title).toBe('Verifiable Digital Credentials & Student Safety');

    // Delete
    const delRes = await request(app)
      .delete(`/api/v1/website/admin/highlights/${createdHighlightId}`)
      .set('Authorization', `Bearer ${schoolAdminToken}`);

    expect(delRes.status).toBe(200);
    expect(delRes.body.success).toBe(true);
  });

  // --------------------------------------------------------------------------
  // 7. Facilities CRUD
  // --------------------------------------------------------------------------
  let createdFacilityId: string;
  it('7. Facilities CRUD manages campus infrastructure spaces', async () => {
    // Create
    const createRes = await request(app)
      .post('/api/v1/website/admin/facilities')
      .set('Authorization', `Bearer ${schoolAdminToken}`)
      .send({
        name: 'Aerospace & Weather Observation Station',
        category: 'Applied Sciences',
        description: 'Rooftop meteorological instruments and satellite receivers for atmospheric study.',
        imageUrl: '/images/school/science_lab.jpg',
        displayOrder: 15,
        isPublished: true,
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.success).toBe(true);
    createdFacilityId = createRes.body.data.id;

    // Delete
    const delRes = await request(app)
      .delete(`/api/v1/website/admin/facilities/${createdFacilityId}`)
      .set('Authorization', `Bearer ${schoolAdminToken}`);

    expect(delRes.status).toBe(200);
    expect(delRes.body.success).toBe(true);
  });

  // --------------------------------------------------------------------------
  // 8. Gallery Categories & Media Items CRUD
  // --------------------------------------------------------------------------
  let createdCatId: string;
  let createdItemId: string;
  it('8. Gallery Categories and Items CRUD creates and manages media albums', async () => {
    const uniqueSuffix = Date.now().toString().slice(-6);
    // Create Album Category
    const catRes = await request(app)
      .post('/api/v1/website/admin/gallery/categories')
      .set('Authorization', `Bearer ${schoolAdminToken}`)
      .send({
        name: `Robotics League ${uniqueSuffix}`,
        slug: `robotics-league-${uniqueSuffix}`,
        description: 'Visual highlights from the National Interschool Robotics League.',
        coverImageUrl: '/images/school/computer_lab.jpg',
        displayOrder: 10,
      });

    expect(catRes.status).toBe(201);
    createdCatId = catRes.body.data.id;
    expect(createdCatId).toBeDefined();

    // Create Gallery Item inside the new category
    const itemRes = await request(app)
      .post('/api/v1/website/admin/gallery/items')
      .set('Authorization', `Bearer ${schoolAdminToken}`)
      .send({
        categoryId: createdCatId,
        mediaType: 'VIDEO',
        title: 'Autonomous Rover Demonstration Finals',
        caption: 'Senior secondary scholars testing vision-guided navigation rover.',
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        thumbnailUrl: '/images/school/computer_lab.jpg',
        displayOrder: 1,
        isFeatured: true,
        isPublished: true,
      });

    expect(itemRes.status).toBe(201);
    createdItemId = itemRes.body.data.id;
    expect(createdItemId).toBeDefined();

    // Verify it appears in public gallery items
    const pubRes = await request(app).get(`/api/v1/website/gallery/items?categoryId=${createdCatId}`);
    expect(pubRes.status).toBe(200);
    expect(pubRes.body.data.items.length).toBe(1);
    expect(pubRes.body.data.items[0].title).toBe('Autonomous Rover Demonstration Finals');

    // Clean up: delete item then category
    await request(app)
      .delete(`/api/v1/website/admin/gallery/items/${createdItemId}`)
      .set('Authorization', `Bearer ${schoolAdminToken}`);

    await request(app)
      .delete(`/api/v1/website/admin/gallery/categories/${createdCatId}`)
      .set('Authorization', `Bearer ${schoolAdminToken}`);
  });

  // --------------------------------------------------------------------------
  // 9. Downloadable Documents CRUD
  // --------------------------------------------------------------------------
  let createdDocId: string;
  it('9. Downloadable Documents CRUD publishes PDF admission forms and circulars', async () => {
    const docRes = await request(app)
      .post('/api/v1/website/admin/documents')
      .set('Authorization', `Bearer ${schoolAdminToken}`)
      .send({
        title: 'Admissions Information & Fee Schedule 2026-2027',
        category: 'ADMISSION_FORM',
        fileUrl: '/documents/fee_schedule_2026.pdf',
        fileSize: '1.2 MB',
        fileType: 'PDF',
        displayOrder: 1,
        isPublished: true,
      });

    expect(docRes.status).toBe(201);
    createdDocId = docRes.body.data.id;
    expect(createdDocId).toBeDefined();

    // Verify in public documents
    const pubDocRes = await request(app).get('/api/v1/website/documents');
    expect(pubDocRes.status).toBe(200);
    const found = pubDocRes.body.data.find((d: any) => d.id === createdDocId);
    expect(found).toBeDefined();

    // Clean up
    const delRes = await request(app)
      .delete(`/api/v1/website/admin/documents/${createdDocId}`)
      .set('Authorization', `Bearer ${schoolAdminToken}`);
    expect(delRes.status).toBe(200);
  });
});
