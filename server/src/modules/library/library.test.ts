import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../../app.js';
import { prisma } from '../../config/db.js';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { PlatformRole } from '@edunexa/shared';

describe('SECTION 11: LIBRARY MANAGEMENT SYSTEM TEST SUITE', () => {
  let schoolId: string;
  let otherSchoolId: string;
  let adminUserId: string;
  let librarianUserId: string;
  let studentUserId: string;
  let secondStudentUserId: string;
  let parentUserId: string;
  let unrelatedParentUserId: string;

  let studentProfileId: string;
  let secondStudentProfileId: string;
  let inactiveStudentProfileId: string;

  let adminToken: string;
  let librarianToken: string;
  let studentToken: string;
  let otherSchoolAdminToken: string;
  let parentToken: string;
  let unrelatedParentToken: string;

  let createdBookId: string;
  let activeIssueId: string;
  let overdueIssueId: string;

  const generateToken = (payload: any) =>
    jwt.sign(payload, env.jwtAccessSecret, { expiresIn: '1h' });

  beforeAll(async () => {
    // 1. Primary school
    let school = await prisma.school.findFirst({ where: { slug: 'apex-academy' } });
    if (!school) {
      school = await prisma.school.create({
        data: {
          slug: 'apex-academy',
          name: 'Apex Academy of Sciences & Arts',
          code: 'APEX-2026',
          email: 'admin@apexacademy.edu',
          phone: '+91 11 2659 1000',
          address: 'Plot 42, Institutional Area',
          city: 'New Delhi',
          state: 'Delhi',
          postalCode: '110001',
        },
      });
    }
    schoolId = school.id;

    // 2. Secondary school for multi-tenant isolation tests
    let otherSchool = await prisma.school.findFirst({ where: { slug: 'greenwood-high' } });
    if (!otherSchool) {
      otherSchool = await prisma.school.create({
        data: {
          slug: 'greenwood-high',
          name: 'Greenwood High International',
          code: 'GWD-2026',
          email: 'admin@greenwood.edu',
          phone: '+91 80 2843 0000',
          address: 'Sarjapur Road',
          city: 'Bangalore',
          state: 'Karnataka',
          postalCode: '560087',
        },
      });
    }
    otherSchoolId = otherSchool.id;

    // Helper to get or create users with role
    const getOrCreateUser = async (email: string, firstName: string, lastName: string, role: any, targetSchoolId = schoolId) => {
      let user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        user = await prisma.user.create({
          data: {
            email,
            firstName,
            lastName,
            passwordHash: '$2b$10$hashedtestpassword',
          },
        });
      }

      let membership = await prisma.userMembership.findFirst({
        where: { userId: user.id, schoolId: targetSchoolId },
      });
      if (!membership) {
        membership = await prisma.userMembership.create({
          data: {
            userId: user.id,
            schoolId: targetSchoolId,
            role,
            isPrimary: true,
            isActive: true,
          },
        });
      }
      return { user, membership };
    };

    // Admin
    const admin = await getOrCreateUser('library.admin@apexacademy.edu', 'Priya', 'Sundaram', PlatformRole.SCHOOL_ADMIN);
    adminUserId = admin.user.id;
    adminToken = generateToken({
      id: adminUserId,
      userId: adminUserId,
      email: admin.user.email,
      role: PlatformRole.SCHOOL_ADMIN,
      schoolId,
      membershipId: admin.membership.id,
    });

    // Librarian
    const librarian = await getOrCreateUser('head.librarian@apexacademy.edu', 'Geeta', 'Krishnan', PlatformRole.LIBRARIAN);
    librarianUserId = librarian.user.id;
    librarianToken = generateToken({
      id: librarianUserId,
      userId: librarianUserId,
      email: librarian.user.email,
      role: PlatformRole.LIBRARIAN,
      schoolId,
      membershipId: librarian.membership.id,
    });

    // Other School Admin
    const otherAdmin = await getOrCreateUser('admin@greenwood.edu', 'Robert', 'Langdon', PlatformRole.SCHOOL_ADMIN, otherSchoolId);
    otherSchoolAdminToken = generateToken({
      id: otherAdmin.user.id,
      userId: otherAdmin.user.id,
      email: otherAdmin.user.email,
      role: PlatformRole.SCHOOL_ADMIN,
      schoolId: otherSchoolId,
      membershipId: otherAdmin.membership.id,
    });

    // Student 1 (Active)
    const stu1 = await getOrCreateUser('lib.student1@apexacademy.edu', 'Kabir', 'Sen', PlatformRole.STUDENT);
    studentUserId = stu1.user.id;
    let sProfile1 = await prisma.studentProfile.findFirst({ where: { membershipId: stu1.membership.id } });
    if (!sProfile1) {
      sProfile1 = await prisma.studentProfile.create({
        data: {
          membershipId: stu1.membership.id,
          admissionNumber: 'LIB-STU-001',
          dateOfBirth: new Date('2009-08-15'),
          gender: 'MALE',
          emergencyPhone: '+919876543210',
          status: 'ACTIVE',
        },
      });
    }
    studentProfileId = sProfile1.id;
    studentToken = generateToken({
      id: studentUserId,
      userId: studentUserId,
      email: stu1.user.email,
      role: PlatformRole.STUDENT,
      schoolId,
      membershipId: stu1.membership.id,
    });

    // Student 2 (Active)
    const stu2 = await getOrCreateUser('lib.student2@apexacademy.edu', 'Ananya', 'Deshmukh', PlatformRole.STUDENT);
    secondStudentUserId = stu2.user.id;
    let sProfile2 = await prisma.studentProfile.findFirst({ where: { membershipId: stu2.membership.id } });
    if (!sProfile2) {
      sProfile2 = await prisma.studentProfile.create({
        data: {
          membershipId: stu2.membership.id,
          admissionNumber: 'LIB-STU-002',
          dateOfBirth: new Date('2009-11-20'),
          gender: 'FEMALE',
          emergencyPhone: '+919876543211',
          status: 'ACTIVE',
        },
      });
    }
    secondStudentProfileId = sProfile2.id;

    // Student 3 (Inactive / Suspended)
    const stu3 = await getOrCreateUser('lib.student3@apexacademy.edu', 'Vikram', 'Rathore', PlatformRole.STUDENT);
    let sProfile3 = await prisma.studentProfile.findFirst({ where: { membershipId: stu3.membership.id } });
    if (!sProfile3) {
      sProfile3 = await prisma.studentProfile.create({
        data: {
          membershipId: stu3.membership.id,
          admissionNumber: 'LIB-STU-003',
          dateOfBirth: new Date('2008-04-10'),
          gender: 'MALE',
          emergencyPhone: '+919876543212',
          status: 'INACTIVE',
        },
      });
    } else {
      await prisma.studentProfile.update({
        where: { id: sProfile3.id },
        data: { status: 'INACTIVE' },
      });
    }
    inactiveStudentProfileId = sProfile3.id;

    // Parent linked to Student 1
    const par1 = await getOrCreateUser('parent.kabir@apexacademy.edu', 'Sunil', 'Sen', PlatformRole.PARENT);
    parentUserId = par1.user.id;
    parentToken = generateToken({
      id: parentUserId,
      userId: parentUserId,
      email: par1.user.email,
      role: PlatformRole.PARENT,
      schoolId,
      membershipId: par1.membership.id,
    });

    await prisma.parentStudentLink.upsert({
      where: {
        parentMembershipId_studentProfileId: {
          parentMembershipId: par1.membership.id,
          studentProfileId,
        },
      },
      update: {},
      create: {
        parentMembershipId: par1.membership.id,
        studentProfileId,
        relationship: 'FATHER',
        isPrimaryContact: true,
      },
    });

    // Unrelated Parent
    const par2 = await getOrCreateUser('unrelated.parent@apexacademy.edu', 'Kiran', 'Bose', PlatformRole.PARENT);
    unrelatedParentUserId = par2.user.id;
    unrelatedParentToken = generateToken({
      id: unrelatedParentUserId,
      userId: unrelatedParentUserId,
      email: par2.user.email,
      role: PlatformRole.PARENT,
      schoolId,
      membershipId: par2.membership.id,
    });

    // Clean up any test books from previous runs
    await prisma.bookIssue.deleteMany({
      where: {
        schoolId,
        book: {
          isbn: { in: ['978-0471199571', '978-93-89845-00-1', '978-93-89845-00-2'] },
        },
      },
    });
    await prisma.libraryBook.deleteMany({
      where: {
        schoolId,
        isbn: { in: ['978-0471199571', '978-93-89845-00-1', '978-93-89845-00-2'] },
      },
    });
  });

  // ==========================================================================
  // 1. BOOK INVENTORY MANAGEMENT
  // ==========================================================================
  describe('1. Book Inventory Management', () => {
    it('1.1 Admin or Librarian creates a book with complete metadata and stock', async () => {
      const res = await request(app)
        .post('/api/v1/library/books')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Advanced Inorganic Chemistry',
          author: 'F.A. Cotton & G. Wilkinson',
          isbn: '978-0471199571',
          category: 'Science',
          publisher: 'Wiley Interscience',
          edition: '6th Edition',
          publicationYear: 2023,
          language: 'English',
          description: 'Definitive structural and mechanistic treatise on transition metals and organometallics.',
          totalCopies: 5,
          shelfLocation: 'Science Wing - Shelf S-109',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.title).toBe('Advanced Inorganic Chemistry');
      expect(res.body.data.totalCopies).toBe(5);
      expect(res.body.data.availableCopies).toBe(5);
      expect(res.body.data.status).toBe('AVAILABLE');

      createdBookId = res.body.data.id;
    });

    it('1.2 Rejects creating a duplicate book with the same ISBN in the same school', async () => {
      const res = await request(app)
        .post('/api/v1/library/books')
        .set('Authorization', `Bearer ${librarianToken}`)
        .send({
          title: 'Inorganic Chemistry Duplicate',
          author: 'Cotton',
          isbn: '978-0471199571',
          totalCopies: 2,
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it('1.3 Lists books with search query and category filtering', async () => {
      const res = await request(app)
        .get('/api/v1/library/books?search=Inorganic&category=Science')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.books.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.books[0].title).toContain('Inorganic');
    });

    it('1.4 Updates book metadata, edition and expands total stock', async () => {
      const res = await request(app)
        .patch(`/api/v1/library/books/${createdBookId}`)
        .set('Authorization', `Bearer ${librarianToken}`)
        .send({
          totalCopies: 7,
          edition: '6th Comprehensive Golden Jubilee Edition',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalCopies).toBe(7);
      expect(res.body.data.availableCopies).toBe(7);
      expect(res.body.data.edition).toBe('6th Comprehensive Golden Jubilee Edition');
    });

    it('1.5 Student role cannot create or modify books (403)', async () => {
      const res = await request(app)
        .post('/api/v1/library/books')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          title: 'Unauthorized Student Book',
          author: 'Hacker',
        });

      expect(res.status).toBe(403);
    });
  });

  // ==========================================================================
  // 2. BOOK ISSUE CIRCULATION WORKFLOW
  // ==========================================================================
  describe('2. Book Issue Circulation Workflow', () => {
    it('2.1 Successfully issues an available book to an active student, decrementing stock', async () => {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 14);

      const res = await request(app)
        .post('/api/v1/library/issues')
        .set('Authorization', `Bearer ${librarianToken}`)
        .send({
          bookId: createdBookId,
          studentProfileId,
          dueDate: dueDate.toISOString(),
          notes: 'Standard secondary chemistry coursework lending.',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('ISSUED');
      expect(res.body.data.fineAmount).toBe(0);
      expect(res.body.data.bookId).toBe(createdBookId);

      activeIssueId = res.body.data.id;

      // Verify stock decreased from 7 to 6
      const book = await prisma.libraryBook.findUnique({ where: { id: createdBookId } });
      expect(book?.availableCopies).toBe(6);
      expect(book?.totalCopies).toBe(7);
    });

    it('2.2 Prevents issuing the same book to the same student while active issue exists', async () => {
      const res = await request(app)
        .post('/api/v1/library/issues')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          bookId: createdBookId,
          studentProfileId,
          dueDate: new Date().toISOString(),
        });

      expect(res.status).toBe(400);
      expect(res.body.error?.message || res.body.message).toContain('already currently issued to this student');
    });

    it('2.3 Rejects issuing books to suspended or inactive students', async () => {
      const res = await request(app)
        .post('/api/v1/library/issues')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          bookId: createdBookId,
          studentProfileId: inactiveStudentProfileId,
          dueDate: new Date().toISOString(),
        });

      expect(res.status).toBe(400);
      expect(res.body.error?.message || res.body.message).toContain('active students');
    });

    it('2.4 Rejects issuing book when stock is 0 (out of stock)', async () => {
      // Create a single-copy book
      const singleBook = await prisma.libraryBook.create({
        data: {
          schoolId,
          title: 'Rare Antique Manuscript',
          author: 'Archivist',
          totalCopies: 1,
          availableCopies: 0,
          status: 'OUT_OF_STOCK',
        },
      });

      const res = await request(app)
        .post('/api/v1/library/issues')
        .set('Authorization', `Bearer ${librarianToken}`)
        .send({
          bookId: singleBook.id,
          studentProfileId: secondStudentProfileId,
          dueDate: new Date().toISOString(),
        });

      expect(res.status).toBe(400);
      expect(res.body.error?.message || res.body.message).toContain('out of stock');
    });

    it('2.5 Enforces student borrowing quota (maxBooksPerStudent)', async () => {
      // Set limit to 1
      await prisma.librarySetting.upsert({
        where: { schoolId },
        update: { maxBooksPerStudent: 1 },
        create: { schoolId, maxBooksPerStudent: 1 },
      });

      // Second book creation
      const secondBook = await prisma.libraryBook.create({
        data: {
          schoolId,
          title: 'Second Test Book',
          author: 'Author B',
          totalCopies: 5,
          availableCopies: 5,
        },
      });

      // Student 1 already has 1 active book
      const res = await request(app)
        .post('/api/v1/library/issues')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          bookId: secondBook.id,
          studentProfileId,
          dueDate: new Date().toISOString(),
        });

      expect(res.status).toBe(400);
      expect(res.body.error?.message || res.body.message).toContain('borrowing limit');

      // Reset limit back to 3
      await prisma.librarySetting.update({
        where: { schoolId },
        data: { maxBooksPerStudent: 3 },
      });
    });
  });

  // ==========================================================================
  // 3. BOOK RETURN & FINE CALCULATION WORKFLOW
  // ==========================================================================
  describe('3. Book Return & Fine Calculation Workflow', () => {
    it('3.1 Successfully returns book on time, restoring available stock', async () => {
      const res = await request(app)
        .post(`/api/v1/library/issues/${activeIssueId}/return`)
        .set('Authorization', `Bearer ${librarianToken}`)
        .send({
          returnCondition: 'GOOD',
          notes: 'Returned in good condition before due date.',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('RETURNED');
      expect(res.body.data.fineAmount).toBe(0);
      expect(res.body.data.fineStatus).toBe('NONE');

      // Verify stock restored from 6 back to 7
      const book = await prisma.libraryBook.findUnique({ where: { id: createdBookId } });
      expect(book?.availableCopies).toBe(7);
    });

    it('3.2 Prevents returning an already returned book record', async () => {
      const res = await request(app)
        .post(`/api/v1/library/issues/${activeIssueId}/return`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ returnCondition: 'GOOD' });

      expect(res.status).toBe(400);
      expect(res.body.error?.message || res.body.message).toContain('already been returned');
    });

    it('3.3 Calculates overdue fines automatically when book is returned past due date', async () => {
      // Configure fine settings: ₹5 per day, 1 day grace
      await prisma.librarySetting.update({
        where: { schoolId },
        data: { finePerDay: 5.0, gracePeriodDays: 1, maxFineAmount: 100.0 },
      });

      // Issue book with past due date (5 days ago)
      const pastDue = new Date();
      pastDue.setDate(pastDue.getDate() - 5);

      const issue = await prisma.bookIssue.create({
        data: {
          schoolId,
          bookId: createdBookId,
          studentProfileId: secondStudentProfileId,
          issueDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
          dueDate: pastDue,
          status: 'ISSUED',
        },
      });

      overdueIssueId = issue.id;

      const res = await request(app)
        .post(`/api/v1/library/issues/${overdueIssueId}/return`)
        .set('Authorization', `Bearer ${librarianToken}`)
        .send({
          returnCondition: 'GOOD',
          notes: 'Returned 5 days overdue.',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('RETURNED');
      // 5 overdue days - 1 grace = 4 chargeable days * ₹5 = ₹20
      expect(res.body.data.fineAmount).toBe(20);
      expect(res.body.data.fineStatus).toBe('PENDING');
      expect(res.body.data.finePaid).toBe(false);
    });

    it('3.4 Admin or Librarian records fine payment (PAID)', async () => {
      const res = await request(app)
        .patch(`/api/v1/library/issues/${overdueIssueId}/fine`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          fineStatus: 'PAID',
          notes: 'Fine payment of ₹20 received at library desk.',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.fineStatus).toBe('PAID');
      expect(res.body.data.finePaid).toBe(true);
    });

    it('3.5 Admin can waive a fine (WAIVED)', async () => {
      // Issue another overdue book
      const pastDue = new Date();
      pastDue.setDate(pastDue.getDate() - 3);

      const issue = await prisma.bookIssue.create({
        data: {
          schoolId,
          bookId: createdBookId,
          studentProfileId,
          issueDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
          dueDate: pastDue,
          status: 'ISSUED',
        },
      });

      const res = await request(app)
        .post(`/api/v1/library/issues/${issue.id}/return`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          returnCondition: 'GOOD',
          waiveFine: true,
          notes: 'Medical exemption granted by Principal.',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.fineStatus).toBe('WAIVED');
      expect(res.body.data.finePaid).toBe(false);
    });

    it('3.6 Returning a book as LOST updates status to LOST without incrementing stock', async () => {
      const issue = await prisma.bookIssue.create({
        data: {
          schoolId,
          bookId: createdBookId,
          studentProfileId: secondStudentProfileId,
          issueDate: new Date(),
          dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
          status: 'ISSUED',
        },
      });

      // Initial available stock
      const bookBefore = await prisma.libraryBook.findUnique({ where: { id: createdBookId } });
      const initialAvailable = bookBefore?.availableCopies || 0;

      const res = await request(app)
        .post(`/api/v1/library/issues/${issue.id}/return`)
        .set('Authorization', `Bearer ${librarianToken}`)
        .send({
          returnCondition: 'LOST',
          notes: 'Candidate reported book lost during commute.',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('LOST');

      // Stock should NOT increase because book is lost
      const bookAfter = await prisma.libraryBook.findUnique({ where: { id: createdBookId } });
      expect(bookAfter?.availableCopies).toBe(initialAvailable);
    });
  });

  // ==========================================================================
  // 4. STUDENT & PARENT LIBRARY SELF-SERVICE
  // ==========================================================================
  describe('4. Student & Parent Library Self-Service', () => {
    it('4.1 Authenticated student views only their own library borrowing ledger', async () => {
      const res = await request(app)
        .get('/api/v1/library/my-history')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.student.id).toBe(studentProfileId);
      expect(res.body.data.summary).toBeDefined();
      expect(Array.isArray(res.body.data.currentlyIssued)).toBe(true);
      expect(Array.isArray(res.body.data.pastReturns)).toBe(true);
    });

    it('4.2 Student is forbidden from accessing another student library records (403)', async () => {
      const res = await request(app)
        .get(`/api/v1/library/students/${secondStudentProfileId}/history`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
    });

    it('4.3 Linked parent can retrieve their ward library borrowing history', async () => {
      const res = await request(app)
        .get(`/api/v1/library/students/${studentProfileId}/history`)
        .set('Authorization', `Bearer ${parentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.student.id).toBe(studentProfileId);
    });

    it('4.4 Unrelated parent is forbidden from accessing non-linked student records (403)', async () => {
      const res = await request(app)
        .get(`/api/v1/library/students/${studentProfileId}/history`)
        .set('Authorization', `Bearer ${unrelatedParentToken}`);

      expect(res.status).toBe(403);
    });
  });

  // ==========================================================================
  // 5. DASHBOARD TELEMETRY, OVERDUE & DYNAMIC REPORTS
  // ==========================================================================
  describe('5. Dashboard Telemetry, Overdue & Dynamic Reports', () => {
    it('5.1 Computes real-time dynamic dashboard telemetry from PostgreSQL', async () => {
      const res = await request(app)
        .get('/api/v1/library/dashboard/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalBooks).toBeGreaterThanOrEqual(1);
      expect(res.body.data.totalCopies).toBeGreaterThanOrEqual(1);
      expect(res.body.data.availableCopies).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(res.body.data.recentReturns)).toBe(true);
    });

    it('5.2 Generates comprehensive INVENTORY report', async () => {
      const res = await request(app)
        .get('/api/v1/library/reports?reportType=INVENTORY')
        .set('Authorization', `Bearer ${librarianToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.reportType).toBe('INVENTORY');
      expect(res.body.data.summary.totalBooks).toBeGreaterThanOrEqual(1);
      expect(Array.isArray(res.body.data.rows)).toBe(true);
    });

    it('5.3 Generates FINES collection report', async () => {
      const res = await request(app)
        .get('/api/v1/library/reports?reportType=FINES')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.reportType).toBe('FINES');
      expect(res.body.data.summary).toBeDefined();
      expect(res.body.data.summary.paidFine).toBeGreaterThanOrEqual(20);
    });

    it('5.4 Generates CATEGORY_WISE book distribution report', async () => {
      const res = await request(app)
        .get('/api/v1/library/reports?reportType=CATEGORY_WISE')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.reportType).toBe('CATEGORY_WISE');
      expect(Array.isArray(res.body.data.rows)).toBe(true);
      const categories = res.body.data.rows.map((r: any) => r.category);
      expect(categories).toContain('Science');
    });
  });

  // ==========================================================================
  // 6. MULTI-TENANT ISOLATION
  // ==========================================================================
  describe('6. Multi-Tenant School Isolation', () => {
    it('6.1 Admin from Greenwood High cannot access or view Apex Academy books', async () => {
      const res = await request(app)
        .get(`/api/v1/library/books/${createdBookId}`)
        .set('Authorization', `Bearer ${otherSchoolAdminToken}`);

      expect(res.status).toBe(404);
    });

    it('6.2 Other school admin cannot issue books from Apex Academy catalog', async () => {
      const res = await request(app)
        .post('/api/v1/library/issues')
        .set('Authorization', `Bearer ${otherSchoolAdminToken}`)
        .send({
          bookId: createdBookId,
          studentProfileId,
          dueDate: new Date().toISOString(),
        });

      expect(res.status).toBe(404);
    });
  });

  // ==========================================================================
  // 7. SAMPLE DATA SEEDING (30 BOOKS ACROSS 8 CATEGORIES)
  // ==========================================================================
  describe('7. Sample Data Seeding', () => {
    it('7.1 Seeds 30 realistic sample books across all 8 Section 11 categories with demo transactions', async () => {
      const res = await request(app)
        .post('/api/v1/library/seed-sample-books')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.seededBooksCount).toBeGreaterThanOrEqual(30);
      expect(res.body.data.categoriesCount).toBe(8);

      // Verify books exist in database across all 8 categories
      const categoriesInDb = await prisma.libraryBook.findMany({
        where: { schoolId },
        select: { category: true },
        distinct: ['category'],
      });

      const catNames = categoriesInDb.map((c) => c.category);
      expect(catNames).toContain('Science');
      expect(catNames).toContain('Mathematics');
      expect(catNames).toContain('English');
      expect(catNames).toContain('Hindi');
      expect(catNames).toContain('Computers');
      expect(catNames).toContain('History');
      expect(catNames).toContain('Geography');
      expect(catNames).toContain('General Knowledge');
    });
  });
});
