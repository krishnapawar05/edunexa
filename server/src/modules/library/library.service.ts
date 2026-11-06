import { prisma } from '../../config/db.js';
import { AppError } from '../../middleware/errorHandler.js';
import {
  CreateLibraryBookDTO,
  UpdateLibraryBookDTO,
  IssueBookDTO,
  ReturnBookDTO,
  UpdateFineStatusDTO,
  UpdateLibrarySettingDTO,
} from '@edunexa/shared';

export interface LibraryDashboardStats {
  totalBooks: number;
  totalCopies: number;
  availableCopies: number;
  issuedCopies: number;
  overdueCount: number;
  membersCount: number;
  issuedToday: number;
  returnedToday: number;
  pendingFines: number;
  collectedFines: number;
  recentIssues: any[];
  recentReturns: any[];
  overdueIssues: any[];
  popularBooks: any[];
}

export class LibraryService {
  /**
   * Get or initialize library settings for a school tenant
   */
  async getSettings(schoolId: string) {
    let settings = await prisma.librarySetting.findUnique({
      where: { schoolId },
    });

    if (!settings) {
      settings = await prisma.librarySetting.create({
        data: {
          schoolId,
          finePerDay: 2.0,
          gracePeriodDays: 1,
          maxFineAmount: 200.0,
          maxBooksPerStudent: 3,
          loanDurationDays: 14,
        },
      });
    }

    return settings;
  }

  /**
   * Update tenant library settings
   */
  async updateSettings(schoolId: string, data: UpdateLibrarySettingDTO) {
    await this.getSettings(schoolId); // Ensure exists

    return prisma.librarySetting.update({
      where: { schoolId },
      data: {
        ...(data.finePerDay !== undefined && { finePerDay: data.finePerDay }),
        ...(data.gracePeriodDays !== undefined && { gracePeriodDays: data.gracePeriodDays }),
        ...(data.maxFineAmount !== undefined && { maxFineAmount: data.maxFineAmount }),
        ...(data.maxBooksPerStudent !== undefined && { maxBooksPerStudent: data.maxBooksPerStudent }),
        ...(data.loanDurationDays !== undefined && { loanDurationDays: data.loanDurationDays }),
      },
    });
  }

  /**
   * Dynamically calculate real-time dashboard telemetry
   */
  async getDashboardStats(schoolId: string): Promise<LibraryDashboardStats> {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const now = new Date();

    const [
      booksCount,
      copiesAggregate,
      activeIssuesCount,
      overdueCount,
      membersCount,
      issuedTodayCount,
      returnedTodayCount,
      finesAggregate,
      collectedFinesAggregate,
      recentIssues,
      recentReturns,
      overdueIssues,
      popularBooksRaw,
    ] = await Promise.all([
      prisma.libraryBook.count({ where: { schoolId } }),
      prisma.libraryBook.aggregate({
        where: { schoolId },
        _sum: { totalCopies: true, availableCopies: true },
      }),
      prisma.bookIssue.count({
        where: { schoolId, status: 'ISSUED' },
      }),
      prisma.bookIssue.count({
        where: { schoolId, status: 'ISSUED', dueDate: { lt: now } },
      }),
      prisma.studentProfile.count({
        where: { membership: { schoolId }, status: 'ACTIVE' },
      }),
      prisma.bookIssue.count({
        where: { schoolId, issueDate: { gte: todayStart } },
      }),
      prisma.bookIssue.count({
        where: { schoolId, status: 'RETURNED', returnDate: { gte: todayStart } },
      }),
      prisma.bookIssue.aggregate({
        where: { schoolId, fineStatus: 'PENDING' },
        _sum: { fineAmount: true },
      }),
      prisma.bookIssue.aggregate({
        where: { schoolId, OR: [{ fineStatus: 'PAID' }, { finePaid: true }] },
        _sum: { fineAmount: true },
      }),
      prisma.bookIssue.findMany({
        where: { schoolId, status: 'ISSUED' },
        include: {
          book: true,
          student: { include: { membership: { include: { user: true } } } },
        },
        orderBy: { issueDate: 'desc' },
        take: 5,
      }),
      prisma.bookIssue.findMany({
        where: { schoolId, status: 'RETURNED' },
        include: {
          book: true,
          student: { include: { membership: { include: { user: true } } } },
        },
        orderBy: { returnDate: 'desc' },
        take: 5,
      }),
      prisma.bookIssue.findMany({
        where: { schoolId, status: 'ISSUED', dueDate: { lt: now } },
        include: {
          book: true,
          student: { include: { membership: { include: { user: true } } } },
        },
        orderBy: { dueDate: 'asc' },
        take: 5,
      }),
      prisma.bookIssue.groupBy({
        by: ['bookId'],
        where: { schoolId },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 5,
      }),
    ]);

    const popularBookIds = popularBooksRaw.map((b) => b.bookId);
    const popularBooksData = await prisma.libraryBook.findMany({
      where: { id: { in: popularBookIds } },
    });

    const popularBooks = popularBooksRaw.map((item) => {
      const book = popularBooksData.find((b) => b.id === item.bookId);
      return {
        ...book,
        borrowCount: item._count.id,
      };
    });

    const totalCopies = copiesAggregate._sum.totalCopies || 0;
    const availableCopies = copiesAggregate._sum.availableCopies || 0;

    return {
      totalBooks: booksCount,
      totalCopies,
      availableCopies,
      issuedCopies: activeIssuesCount,
      overdueCount,
      membersCount,
      issuedToday: issuedTodayCount,
      returnedToday: returnedTodayCount,
      pendingFines: finesAggregate._sum.fineAmount || 0,
      collectedFines: collectedFinesAggregate._sum.fineAmount || 0,
      recentIssues,
      recentReturns,
      overdueIssues,
      popularBooks,
    };
  }

  /**
   * List books with search, categorization, pagination and status filters
   */
  async listBooks(
    schoolId: string,
    query: {
      search?: string;
      category?: string;
      status?: string;
      language?: string;
      page?: number;
      limit?: number;
    }
  ) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.max(1, Math.min(100, query.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = { schoolId };

    if (query.search && query.search.trim()) {
      const q = query.search.trim();
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { author: { contains: q, mode: 'insensitive' } },
        { isbn: { contains: q, mode: 'insensitive' } },
        { publisher: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ];
    }

    if (query.category && query.category !== 'ALL') {
      where.category = { equals: query.category, mode: 'insensitive' };
    }

    if (query.status && query.status !== 'ALL') {
      where.status = query.status;
    }

    if (query.language && query.language !== 'ALL') {
      where.language = { equals: query.language, mode: 'insensitive' };
    }

    const [books, total, categoriesRaw] = await Promise.all([
      prisma.libraryBook.findMany({
        where,
        orderBy: [{ category: 'asc' }, { title: 'asc' }],
        skip,
        take: limit,
      }),
      prisma.libraryBook.count({ where }),
      prisma.libraryBook.findMany({
        where: { schoolId },
        select: { category: true },
        distinct: ['category'],
      }),
    ]);

    const categories = categoriesRaw
      .map((c) => c.category)
      .filter((c): c is string => !!c);

    return {
      books,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      categories,
    };
  }

  /**
   * Retrieve single book with issue history
   */
  async getBookById(schoolId: string, bookId: string) {
    const book = await prisma.libraryBook.findFirst({
      where: { id: bookId, schoolId },
      include: {
        issues: {
          include: {
            student: {
              include: {
                membership: { include: { user: true } },
                enrollments: { include: { class: true, section: true }, take: 1 },
              },
            },
          },
          orderBy: { issueDate: 'desc' },
          take: 20,
        },
      },
    });

    if (!book) {
      throw new AppError('Book not found in this school library.', 404);
    }

    const activeIssues = book.issues.filter((i) => i.status === 'ISSUED');

    return {
      ...book,
      activeIssues,
    };
  }

  /**
   * Create new book inventory entry
   */
  async createBook(schoolId: string, data: CreateLibraryBookDTO) {
    if (data.isbn) {
      const existing = await prisma.libraryBook.findFirst({
        where: { schoolId, isbn: data.isbn },
      });
      if (existing) {
        throw new AppError(`A book with ISBN ${data.isbn} already exists in the inventory.`, 409);
      }
    }

    const totalCopies = data.totalCopies || 1;
    const availableCopies =
      data.availableCopies !== undefined ? Math.min(data.availableCopies, totalCopies) : totalCopies;

    const status = availableCopies <= 0 ? 'OUT_OF_STOCK' : data.status || 'AVAILABLE';

    return prisma.libraryBook.create({
      data: {
        schoolId,
        title: data.title.trim(),
        author: data.author.trim(),
        isbn: data.isbn?.trim() || null,
        category: data.category?.trim() || 'General Knowledge',
        publisher: data.publisher?.trim() || null,
        edition: data.edition?.trim() || null,
        publicationYear: data.publicationYear || null,
        language: data.language || 'English',
        description: data.description?.trim() || null,
        coverUrl: data.coverUrl || null,
        totalCopies,
        availableCopies,
        shelfLocation: data.shelfLocation?.trim() || 'General Stacks',
        status,
      },
    });
  }

  /**
   * Update existing book information
   */
  async updateBook(schoolId: string, bookId: string, data: UpdateLibraryBookDTO) {
    const book = await prisma.libraryBook.findFirst({
      where: { id: bookId, schoolId },
      include: {
        issues: { where: { status: 'ISSUED' } },
      },
    });

    if (!book) {
      throw new AppError('Book record not found.', 404);
    }

    if (data.isbn && data.isbn !== book.isbn) {
      const duplicate = await prisma.libraryBook.findFirst({
        where: { schoolId, isbn: data.isbn, id: { not: bookId } },
      });
      if (duplicate) {
        throw new AppError(`ISBN ${data.isbn} is already registered to another book.`, 409);
      }
    }

    const currentlyIssued = book.issues.length;

    let newTotal = book.totalCopies;
    if (data.totalCopies !== undefined) {
      if (data.totalCopies < currentlyIssued) {
        throw new AppError(
          `Cannot reduce total copies to ${data.totalCopies}. There are currently ${currentlyIssued} copies issued to students.`,
          400
        );
      }
      newTotal = data.totalCopies;
    }

    let newAvailable = book.availableCopies;
    if (data.availableCopies !== undefined) {
      newAvailable = Math.max(0, Math.min(data.availableCopies, newTotal));
    } else if (data.totalCopies !== undefined) {
      newAvailable = Math.max(0, newTotal - currentlyIssued);
    }

    let status = data.status || book.status;
    if (newAvailable <= 0 && status === 'AVAILABLE') {
      status = 'OUT_OF_STOCK';
    } else if (newAvailable > 0 && status === 'OUT_OF_STOCK') {
      status = 'AVAILABLE';
    }

    return prisma.libraryBook.update({
      where: { id: bookId },
      data: {
        ...(data.title && { title: data.title.trim() }),
        ...(data.author && { author: data.author.trim() }),
        ...(data.isbn !== undefined && { isbn: data.isbn ? data.isbn.trim() : null }),
        ...(data.category && { category: data.category.trim() }),
        ...(data.publisher !== undefined && { publisher: data.publisher ? data.publisher.trim() : null }),
        ...(data.edition !== undefined && { edition: data.edition ? data.edition.trim() : null }),
        ...(data.publicationYear !== undefined && { publicationYear: data.publicationYear }),
        ...(data.language !== undefined && { language: data.language }),
        ...(data.description !== undefined && { description: data.description ? data.description.trim() : null }),
        ...(data.coverUrl !== undefined && { coverUrl: data.coverUrl }),
        ...(data.shelfLocation !== undefined && { shelfLocation: data.shelfLocation ? data.shelfLocation.trim() : null }),
        totalCopies: newTotal,
        availableCopies: newAvailable,
        status,
      },
    });
  }

  /**
   * Delete or archive book
   */
  async deleteBook(schoolId: string, bookId: string) {
    const book = await prisma.libraryBook.findFirst({
      where: { id: bookId, schoolId },
      include: {
        issues: { where: { status: 'ISSUED' } },
      },
    });

    if (!book) {
      throw new AppError('Book not found.', 404);
    }

    if (book.issues.length > 0) {
      throw new AppError(
        `Cannot delete book. There are ${book.issues.length} active issue records. Please return or recall copies first, or archive the book.`,
        400
      );
    }

    await prisma.bookIssue.deleteMany({ where: { bookId } });
    return prisma.libraryBook.delete({ where: { id: bookId } });
  }

  /**
   * Issue a book to a student with atomic stock decrement and limit enforcement
   */
  async issueBook(schoolId: string, issuedById: string | undefined, data: IssueBookDTO) {
    // 1. Validate student
    const student = await prisma.studentProfile.findFirst({
      where: { id: data.studentProfileId, membership: { schoolId } },
      include: {
        membership: { include: { user: true } },
        enrollments: { include: { class: true, section: true }, take: 1 },
      },
    });

    if (!student) {
      throw new AppError('Student profile not found in this school tenant.', 404);
    }

    if (student.status !== 'ACTIVE') {
      throw new AppError(`Cannot issue book: Student status is ${student.status}. Only active students may borrow books.`, 400);
    }

    // 2. Validate library settings & student issue limit
    const settings = await this.getSettings(schoolId);
    const activeIssuesCount = await prisma.bookIssue.count({
      where: { studentProfileId: student.id, status: 'ISSUED' },
    });

    if (activeIssuesCount >= settings.maxBooksPerStudent) {
      throw new AppError(
        `Student has reached the maximum borrowing limit (${settings.maxBooksPerStudent} books). Please return existing books first.`,
        400
      );
    }

    // 3. Check if student already has a copy of this book
    const alreadyIssued = await prisma.bookIssue.findFirst({
      where: {
        bookId: data.bookId,
        studentProfileId: student.id,
        status: 'ISSUED',
      },
    });

    if (alreadyIssued) {
      throw new AppError('This book is already currently issued to this student.', 400);
    }

    // 4. Validate book availability
    const book = await prisma.libraryBook.findFirst({
      where: { id: data.bookId, schoolId },
    });

    if (!book) {
      throw new AppError('Book not found in library inventory.', 404);
    }

    if (book.availableCopies <= 0 || book.status === 'OUT_OF_STOCK' || book.status === 'ARCHIVED') {
      throw new AppError(`Book '${book.title}' is currently out of stock (0 copies available).`, 400);
    }

    // 5. Calculate dates
    const issueDate = data.issueDate ? new Date(data.issueDate) : new Date();
    let dueDate: Date;
    if (data.dueDate) {
      dueDate = new Date(data.dueDate);
    } else {
      dueDate = new Date(issueDate);
      dueDate.setDate(dueDate.getDate() + settings.loanDurationDays);
    }

    // 6. Execute atomic transaction
    const [issue] = await prisma.$transaction([
      prisma.bookIssue.create({
        data: {
          schoolId,
          bookId: data.bookId,
          studentProfileId: student.id,
          issuedById: issuedById || null,
          issueDate,
          dueDate,
          status: 'ISSUED',
          fineStatus: 'NONE',
          fineAmount: 0,
          notes: data.notes || null,
        },
        include: {
          book: true,
          student: {
            include: {
              membership: { include: { user: true } },
              enrollments: { include: { class: true, section: true }, take: 1 },
            },
          },
        },
      }),
      prisma.libraryBook.update({
        where: { id: data.bookId },
        data: {
          availableCopies: { decrement: 1 },
          ...(book.availableCopies - 1 <= 0 ? { status: 'OUT_OF_STOCK' } : {}),
        },
      }),
    ]);

    return issue;
  }

  /**
   * Return a book with atomic stock increment and fine calculation
   */
  async returnBook(schoolId: string, issueId: string, data: ReturnBookDTO) {
    const issue = await prisma.bookIssue.findFirst({
      where: { id: issueId, schoolId },
      include: {
        book: true,
        student: { include: { membership: { include: { user: true } } } },
      },
    });

    if (!issue) {
      throw new AppError('Book issue record not found.', 404);
    }

    if (issue.status === 'RETURNED') {
      throw new AppError('This book has already been returned.', 400);
    }

    const settings = await this.getSettings(schoolId);
    const returnDate = data.returnDate ? new Date(data.returnDate) : new Date();

    // Calculate overdue days
    const dueTime = new Date(issue.dueDate).setHours(23, 59, 59, 999);
    const returnTime = returnDate.getTime();
    let fineAmount = 0;
    let fineStatus: 'NONE' | 'PENDING' | 'PAID' | 'WAIVED' = 'NONE';

    if (returnTime > dueTime) {
      const diffMs = returnTime - dueTime;
      const overdueDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      const chargeableDays = Math.max(0, overdueDays - settings.gracePeriodDays);

      if (chargeableDays > 0) {
        fineAmount = Math.min(chargeableDays * settings.finePerDay, settings.maxFineAmount);
        fineStatus = data.waiveFine ? 'WAIVED' : 'PENDING';
      }
    }

    const isBookLost = data.returnCondition === 'LOST';

    const [updatedIssue] = await prisma.$transaction([
      prisma.bookIssue.update({
        where: { id: issueId },
        data: {
          status: isBookLost ? 'LOST' : 'RETURNED',
          returnDate,
          returnCondition: data.returnCondition || 'GOOD',
          fineAmount,
          finePaid: (fineStatus as string) === 'PAID',
          fineStatus,
          notes: data.notes || issue.notes,
        },
        include: {
          book: true,
          student: { include: { membership: { include: { user: true } } } },
        },
      }),
      // If book is returned (not lost), increment stock
      ...(isBookLost
        ? []
        : [
            prisma.libraryBook.update({
              where: { id: issue.bookId },
              data: {
                availableCopies: { increment: 1 },
                status: 'AVAILABLE',
              },
            }),
          ]),
    ]);

    return updatedIssue;
  }

  /**
   * List all book issues / return transactions with rich filters
   */
  async listIssues(
    schoolId: string,
    query: {
      status?: string;
      studentProfileId?: string;
      bookId?: string;
      search?: string;
      overdueOnly?: boolean;
      page?: number;
      limit?: number;
    }
  ) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.max(1, Math.min(100, query.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = { schoolId };

    if (query.status && query.status !== 'ALL') {
      where.status = query.status;
    }

    if (query.studentProfileId) {
      where.studentProfileId = query.studentProfileId;
    }

    if (query.bookId) {
      where.bookId = query.bookId;
    }

    if (query.overdueOnly) {
      where.status = 'ISSUED';
      where.dueDate = { lt: new Date() };
    }

    if (query.search && query.search.trim()) {
      const q = query.search.trim();
      where.OR = [
        { book: { title: { contains: q, mode: 'insensitive' } } },
        { book: { isbn: { contains: q, mode: 'insensitive' } } },
        { student: { admissionNumber: { contains: q, mode: 'insensitive' } } },
        { student: { membership: { user: { firstName: { contains: q, mode: 'insensitive' } } } } },
        { student: { membership: { user: { lastName: { contains: q, mode: 'insensitive' } } } } },
      ];
    }

    const [issues, total] = await Promise.all([
      prisma.bookIssue.findMany({
        where,
        include: {
          book: true,
          student: {
            include: {
              membership: { include: { user: true } },
              enrollments: { include: { class: true, section: true }, take: 1 },
            },
          },
        },
        orderBy: [{ status: 'asc' }, { dueDate: 'asc' }],
        skip,
        take: limit,
      }),
      prisma.bookIssue.count({ where }),
    ]);

    // Compute live status and accrued fine dynamically
    const settings = await this.getSettings(schoolId);
    const now = new Date();

    const formatted = issues.map((i) => {
      let liveStatus = i.status;
      let calculatedFine = i.fineAmount;

      if (i.status === 'ISSUED') {
        const dueTime = new Date(i.dueDate).getTime();
        const nowTime = now.getTime();

        if (nowTime > dueTime) {
          liveStatus = 'OVERDUE';
          const overdueDays = Math.ceil((nowTime - dueTime) / (1000 * 60 * 60 * 24));
          const chargeableDays = Math.max(0, overdueDays - settings.gracePeriodDays);
          calculatedFine = Math.min(chargeableDays * settings.finePerDay, settings.maxFineAmount);
        } else if (dueTime - nowTime <= 3 * 24 * 60 * 60 * 1000) {
          liveStatus = 'DUE_SOON';
        }
      }

      return {
        ...i,
        liveStatus,
        calculatedFine,
      };
    });

    return {
      issues: formatted,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * List overdue books with current accrued fines
   */
  async getOverdueBooks(schoolId: string, search?: string) {
    return this.listIssues(schoolId, {
      overdueOnly: true,
      search,
      limit: 100,
    });
  }

  /**
   * Update fine status (record payment or waive)
   */
  async updateFineStatus(schoolId: string, issueId: string, data: UpdateFineStatusDTO) {
    const issue = await prisma.bookIssue.findFirst({
      where: { id: issueId, schoolId },
    });

    if (!issue) {
      throw new AppError('Issue record not found.', 404);
    }

    const finePaid = data.fineStatus === 'PAID';

    return prisma.bookIssue.update({
      where: { id: issueId },
      data: {
        fineStatus: data.fineStatus,
        finePaid,
        ...(data.notes && { notes: data.notes }),
      },
    });
  }

  /**
   * Student-wise complete library ledger & borrowing history
   */
  async getStudentHistory(schoolId: string, studentProfileId: string) {
    const student = await prisma.studentProfile.findFirst({
      where: { id: studentProfileId, membership: { schoolId } },
      include: {
        membership: { include: { user: true } },
        enrollments: { include: { class: true, section: true }, take: 1 },
      },
    });

    if (!student) {
      throw new AppError('Student profile not found.', 404);
    }

    const issues = await prisma.bookIssue.findMany({
      where: { schoolId, studentProfileId },
      include: { book: true },
      orderBy: { issueDate: 'desc' },
    });

    const settings = await this.getSettings(schoolId);
    const now = new Date();

    const currentlyIssued: any[] = [];
    const pastReturns: any[] = [];
    let totalPendingFine = 0;
    let totalPaidFine = 0;

    for (const i of issues) {
      let liveStatus = i.status;
      let fine = i.fineAmount;

      if (i.status === 'ISSUED') {
        const dueTime = new Date(i.dueDate).getTime();
        const nowTime = now.getTime();
        if (nowTime > dueTime) {
          liveStatus = 'OVERDUE';
          const overdueDays = Math.ceil((nowTime - dueTime) / (1000 * 60 * 60 * 24));
          const chargeableDays = Math.max(0, overdueDays - settings.gracePeriodDays);
          fine = Math.min(chargeableDays * settings.finePerDay, settings.maxFineAmount);
        } else if (dueTime - nowTime <= 3 * 24 * 60 * 60 * 1000) {
          liveStatus = 'DUE_SOON';
        }
        currentlyIssued.push({ ...i, liveStatus, calculatedFine: fine });
        if (i.fineStatus === 'PENDING') totalPendingFine += fine;
      } else {
        pastReturns.push(i);
        if (i.fineStatus === 'PAID' || i.finePaid) totalPaidFine += i.fineAmount;
        if (i.fineStatus === 'PENDING') totalPendingFine += i.fineAmount;
      }
    }

    return {
      student: {
        id: student.id,
        admissionNumber: student.admissionNumber,
        fullName: `${student.membership.user.firstName} ${student.membership.user.lastName}`,
        email: student.membership.user.email,
        phone: student.emergencyPhone,
        className: student.enrollments[0]?.class?.name || 'Unassigned',
        sectionName: student.enrollments[0]?.section?.name || 'Unassigned',
      },
      currentlyIssued,
      pastReturns,
      summary: {
        totalIssuedEver: issues.length,
        currentActiveCount: currentlyIssued.length,
        overdueCount: currentlyIssued.filter((c) => c.liveStatus === 'OVERDUE').length,
        totalPendingFine,
        totalPaidFine,
        maxBorrowLimit: settings.maxBooksPerStudent,
      },
    };
  }

  /**
   * Comprehensive database-driven library reports
   */
  async generateReport(
    schoolId: string,
    reportType: string,
    filters: {
      category?: string;
      startDate?: string;
      endDate?: string;
      status?: string;
    } = {}
  ) {
    switch (reportType.toUpperCase()) {
      case 'INVENTORY':
      case 'AVAILABLE_STOCK': {
        const where: any = { schoolId };
        if (filters.category && filters.category !== 'ALL') {
          where.category = filters.category;
        }
        if (reportType.toUpperCase() === 'AVAILABLE_STOCK') {
          where.availableCopies = { gt: 0 };
        }

        const books = await prisma.libraryBook.findMany({
          where,
          include: {
            _count: { select: { issues: { where: { status: 'ISSUED' } } } },
          },
          orderBy: [{ category: 'asc' }, { title: 'asc' }],
        });

        const rows = books.map((b) => ({
          id: b.id,
          title: b.title,
          author: b.author,
          isbn: b.isbn || '—',
          category: b.category,
          shelfLocation: b.shelfLocation || '—',
          totalCopies: b.totalCopies,
          availableCopies: b.availableCopies,
          currentlyIssued: b._count.issues,
          status: b.status,
        }));

        return {
          reportType,
          generatedAt: new Date().toISOString(),
          totalRecords: rows.length,
          summary: {
            totalBooks: rows.length,
            totalCopies: rows.reduce((acc, r) => acc + r.totalCopies, 0),
            availableCopies: rows.reduce((acc, r) => acc + r.availableCopies, 0),
            issuedCopies: rows.reduce((acc, r) => acc + r.currentlyIssued, 0),
          },
          rows,
        };
      }

      case 'ISSUED_BOOKS':
      case 'RETURNED_BOOKS':
      case 'OVERDUE_BOOKS':
      case 'TRANSACTIONS': {
        const where: any = { schoolId };
        if (reportType.toUpperCase() === 'ISSUED_BOOKS') {
          where.status = 'ISSUED';
        } else if (reportType.toUpperCase() === 'RETURNED_BOOKS') {
          where.status = 'RETURNED';
        } else if (reportType.toUpperCase() === 'OVERDUE_BOOKS') {
          where.status = 'ISSUED';
          where.dueDate = { lt: new Date() };
        }

        if (filters.startDate || filters.endDate) {
          where.issueDate = {};
          if (filters.startDate) where.issueDate.gte = new Date(filters.startDate);
          if (filters.endDate) where.issueDate.lte = new Date(filters.endDate);
        }

        const issues = await prisma.bookIssue.findMany({
          where,
          include: {
            book: true,
            student: {
              include: {
                membership: { include: { user: true } },
                enrollments: { include: { class: true, section: true }, take: 1 },
              },
            },
          },
          orderBy: { issueDate: 'desc' },
        });

        const rows = issues.map((i) => ({
          issueId: i.id,
          bookTitle: i.book.title,
          isbn: i.book.isbn || '—',
          category: i.book.category,
          studentName: `${i.student.membership.user.firstName} ${i.student.membership.user.lastName}`,
          admissionNumber: i.student.admissionNumber,
          className: i.student.enrollments[0]?.class?.name || '—',
          section: i.student.enrollments[0]?.section?.name || '—',
          issueDate: i.issueDate.toISOString().split('T')[0],
          dueDate: i.dueDate.toISOString().split('T')[0],
          returnDate: i.returnDate ? i.returnDate.toISOString().split('T')[0] : '—',
          status: i.status,
          fineAmount: i.fineAmount,
          fineStatus: i.fineStatus,
          returnCondition: i.returnCondition || '—',
        }));

        return {
          reportType,
          generatedAt: new Date().toISOString(),
          totalRecords: rows.length,
          summary: {
            totalTransactions: rows.length,
            totalFinesAccrued: rows.reduce((acc, r) => acc + (r.fineAmount || 0), 0),
          },
          rows,
        };
      }

      case 'FINES': {
        const issues = await prisma.bookIssue.findMany({
          where: {
            schoolId,
            fineAmount: { gt: 0 },
            ...(filters.status && filters.status !== 'ALL' ? { fineStatus: filters.status } : {}),
          },
          include: {
            book: true,
            student: {
              include: {
                membership: { include: { user: true } },
                enrollments: { include: { class: true, section: true }, take: 1 },
              },
            },
          },
          orderBy: { updatedAt: 'desc' },
        });

        const rows = issues.map((i) => ({
          issueId: i.id,
          studentName: `${i.student.membership.user.firstName} ${i.student.membership.user.lastName}`,
          admissionNumber: i.student.admissionNumber,
          className: i.student.enrollments[0]?.class?.name || '—',
          bookTitle: i.book.title,
          fineAmount: i.fineAmount,
          fineStatus: i.fineStatus,
          finePaid: i.finePaid,
          dueDate: i.dueDate.toISOString().split('T')[0],
          returnDate: i.returnDate ? i.returnDate.toISOString().split('T')[0] : 'Not Returned',
        }));

        const totalFine = rows.reduce((acc, r) => acc + r.fineAmount, 0);
        const paidFine = rows
          .filter((r) => r.fineStatus === 'PAID' || r.finePaid)
          .reduce((acc, r) => acc + r.fineAmount, 0);
        const pendingFine = rows
          .filter((r) => r.fineStatus === 'PENDING')
          .reduce((acc, r) => acc + r.fineAmount, 0);
        const waivedFine = rows
          .filter((r) => r.fineStatus === 'WAIVED')
          .reduce((acc, r) => acc + r.fineAmount, 0);

        return {
          reportType: 'FINES',
          generatedAt: new Date().toISOString(),
          totalRecords: rows.length,
          summary: {
            totalFine,
            paidFine,
            pendingFine,
            waivedFine,
          },
          rows,
        };
      }

      case 'CATEGORY_WISE': {
        const books = await prisma.libraryBook.findMany({
          where: { schoolId },
          include: {
            issues: { where: { status: 'ISSUED' } },
          },
        });

        const categoryMap: Record<
          string,
          { titlesCount: number; totalCopies: number; availableCopies: number; issuedCopies: number }
        > = {};

        for (const b of books) {
          const cat = b.category || 'General Knowledge';
          if (!categoryMap[cat]) {
            categoryMap[cat] = { titlesCount: 0, totalCopies: 0, availableCopies: 0, issuedCopies: 0 };
          }
          categoryMap[cat].titlesCount += 1;
          categoryMap[cat].totalCopies += b.totalCopies;
          categoryMap[cat].availableCopies += b.availableCopies;
          categoryMap[cat].issuedCopies += b.issues.length;
        }

        const rows = Object.entries(categoryMap).map(([category, stats]) => ({
          category,
          ...stats,
        }));

        return {
          reportType: 'CATEGORY_WISE',
          generatedAt: new Date().toISOString(),
          totalRecords: rows.length,
          rows,
        };
      }

      default:
        throw new AppError(`Unsupported report type: ${reportType}`, 400);
    }
  }

  /**
   * Seed realistic 30 sample books covering all 8 Section 11 categories + realistic sample transactions
   */
  async seedSampleBooks(schoolId: string) {
    const sampleBooksDataset = [
      // 1. Science (4 books)
      {
        title: 'Concepts of Physics (Vol 1)',
        author: 'Dr. H.C. Verma',
        publisher: 'Bharati Bhawan',
        isbn: '978-8177091878',
        category: 'Science',
        edition: '2025 Revised Edition',
        publicationYear: 2024,
        language: 'English',
        description: 'Comprehensive classical mechanics, thermodynamics, and wave theory with rigorous mathematical treatments for senior secondary students.',
        coverUrl: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=600&q=80',
        totalCopies: 10,
        availableCopies: 10,
        shelfLocation: 'Science Wing - Shelf S-101',
      },
      {
        title: 'Pradeep’s Fundamental Physics (Class XI)',
        author: 'K.L. Gomber & K.L. Gogia',
        publisher: 'Pradeep Publications',
        isbn: '978-9386008123',
        category: 'Science',
        edition: '34th Edition',
        publicationYear: 2023,
        language: 'English',
        description: 'In-depth secondary school physics textbook featuring conceptual problems, NCERT exemplar solutions, and experimental physics guides.',
        coverUrl: 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?auto=format&fit=crop&w=600&q=80',
        totalCopies: 6,
        availableCopies: 6,
        shelfLocation: 'Science Wing - Shelf S-102',
      },
      {
        title: 'NCERT Chemistry: Comprehensive Textbook',
        author: 'Department of Education in Science & Mathematics',
        publisher: 'NCERT',
        isbn: '978-8174505323',
        category: 'Science',
        edition: 'Reprint 2025',
        publicationYear: 2024,
        language: 'English',
        description: 'Official national curriculum text exploring atomic structure, chemical bonding, organic chemistry mechanisms, and equilibrium.',
        coverUrl: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=600&q=80',
        totalCopies: 8,
        availableCopies: 8,
        shelfLocation: 'Science Wing - Shelf S-103',
      },
      {
        title: 'Modern ABC of Biology (Class XII)',
        author: 'Dr. B.B. Arora & A.K. Sabharwal',
        publisher: 'Modern Publishers',
        isbn: '978-9351842019',
        category: 'Science',
        edition: '21st Edition',
        publicationYear: 2023,
        language: 'English',
        description: 'Illustrated guide covering genetics, cellular biology, biotechnology applications, ecology, and human physiology.',
        coverUrl: 'https://images.unsplash.com/photo-1530210124550-912dc1381cb8?auto=format&fit=crop&w=600&q=80',
        totalCopies: 5,
        availableCopies: 5,
        shelfLocation: 'Science Wing - Shelf S-104',
      },

      // 2. Mathematics (4 books)
      {
        title: 'Mathematics for Class 10',
        author: 'Dr. R.D. Sharma',
        publisher: 'Dhanpat Rai Publications',
        isbn: '978-9383182145',
        category: 'Mathematics',
        edition: '2025 Edition',
        publicationYear: 2025,
        language: 'English',
        description: 'The standard secondary curriculum reference covering real numbers, polynomials, trigonometry, quadratic equations, and coordinate geometry.',
        coverUrl: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=600&q=80',
        totalCopies: 12,
        availableCopies: 12,
        shelfLocation: 'Math Annex - Shelf M-201',
      },
      {
        title: 'Higher Engineering Mathematics',
        author: 'Dr. B.S. Grewal',
        publisher: 'Khanna Publishers',
        isbn: '978-8174091955',
        category: 'Mathematics',
        edition: '44th Edition',
        publicationYear: 2022,
        language: 'English',
        description: 'Advanced reference encompassing calculus, differential equations, linear algebra, complex variables, and vector calculus.',
        coverUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=600&q=80',
        totalCopies: 4,
        availableCopies: 4,
        shelfLocation: 'Math Annex - Shelf M-202',
      },
      {
        title: 'Plane Trigonometry (Part 1)',
        author: 'S.L. Loney',
        publisher: 'Cambridge University Press / Arihant',
        isbn: '978-9351762560',
        category: 'Mathematics',
        edition: 'Classic Reissue',
        publicationYear: 2021,
        language: 'English',
        description: 'The revered classical foundation on trigonometric identities, angles of triangles, heights and distances, and circular functions.',
        coverUrl: 'https://images.unsplash.com/photo-1596495578065-6e0763fa1178?auto=format&fit=crop&w=600&q=80',
        totalCopies: 5,
        availableCopies: 5,
        shelfLocation: 'Math Annex - Shelf M-203',
      },
      {
        title: 'Quantitative Aptitude for Competitive Examinations',
        author: 'Dr. R.S. Aggarwal',
        publisher: 'S. Chand Publishing',
        isbn: '978-9352534029',
        category: 'Mathematics',
        edition: 'Revised Golden Jubilee',
        publicationYear: 2024,
        language: 'English',
        description: 'Essential problem-solving companion covering arithmetic, algebra, number systems, permutations, and data interpretation.',
        coverUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=600&q=80',
        totalCopies: 8,
        availableCopies: 8,
        shelfLocation: 'Math Annex - Shelf M-204',
      },

      // 3. English (4 books)
      {
        title: 'High School English Grammar & Composition',
        author: 'P.C. Wren & H. Martin',
        publisher: 'S. Chand Publishing',
        isbn: '978-9352836260',
        category: 'English',
        edition: 'Revised Century Edition',
        publicationYear: 2023,
        language: 'English',
        description: 'The definitive handbook of English syntactic rules, sentence transformations, vocabulary, idioms, and essay composition.',
        coverUrl: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=600&q=80',
        totalCopies: 15,
        availableCopies: 15,
        shelfLocation: 'Languages Bay - Shelf E-301',
      },
      {
        title: 'Word Power Made Easy',
        author: 'Norman Lewis',
        publisher: 'Penguin Random House',
        isbn: '978-0143424680',
        category: 'English',
        edition: 'Pocket Master Edition',
        publicationYear: 2021,
        language: 'English',
        description: 'Etymology-based vocabulary builder providing step-by-step master lessons for expressive verbal comprehension and fluency.',
        coverUrl: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=600&q=80',
        totalCopies: 10,
        availableCopies: 10,
        shelfLocation: 'Languages Bay - Shelf E-302',
      },
      {
        title: 'The Oxford Guide to English Usage',
        author: 'E.S.C. Weiner & Andrew Delahunty',
        publisher: 'Oxford University Press',
        isbn: '978-0198606048',
        category: 'English',
        edition: '2nd International Edition',
        publicationYear: 2022,
        language: 'English',
        description: 'Authoritative guidance on modern punctuation, syntax pitfalls, spelling conventions, and standard linguistic style.',
        coverUrl: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=600&q=80',
        totalCopies: 6,
        availableCopies: 6,
        shelfLocation: 'Languages Bay - Shelf E-303',
      },
      {
        title: 'Anthology of English Literature & Poetry',
        author: 'Prof. David Green',
        publisher: 'Macmillan Publishers',
        isbn: '978-0333903124',
        category: 'English',
        edition: '4th Edition',
        publicationYear: 2023,
        language: 'English',
        description: 'Curated selection of classic Elizabethan drama, Romantic poetry, Victorian prose, and twentieth-century world literature.',
        coverUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
        totalCopies: 7,
        availableCopies: 7,
        shelfLocation: 'Languages Bay - Shelf E-304',
      },

      // 4. Hindi (3 books)
      {
        title: 'Godan (गोदान)',
        author: 'Munshi Premchand',
        publisher: 'Rajkamal Prakashan',
        isbn: '978-8126719129',
        category: 'Hindi',
        edition: 'Classic Sahitya Edition',
        publicationYear: 2022,
        language: 'Hindi',
        description: 'The monumental classic of Hindi literature depicting the socio-economic struggles of Indian rural peasantry with profound empathy.',
        coverUrl: 'https://images.unsplash.com/photo-1476275466078-4007374efbbe?auto=format&fit=crop&w=600&q=80',
        totalCopies: 8,
        availableCopies: 8,
        shelfLocation: 'Hindi Sahitya - Shelf H-401',
      },
      {
        title: 'Madhushala (मधुशाला)',
        author: 'Harivansh Rai Bachchan',
        publisher: 'Rajpal & Sons',
        isbn: '978-8170281238',
        category: 'Hindi',
        edition: 'Commemorative Edition',
        publicationYear: 2021,
        language: 'Hindi',
        description: 'Celebrated collection of 135 philosophical quatrains exploring human destiny, companionship, and poetic introspection.',
        coverUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=600&q=80',
        totalCopies: 6,
        availableCopies: 6,
        shelfLocation: 'Hindi Sahitya - Shelf H-402',
      },
      {
        title: 'Manak Hindi Vyakaran Evam Rachna (मानक हिंदी व्याकरण)',
        author: 'Dr. Kamal Satyarthi',
        publisher: 'Saraswati House',
        isbn: '978-9352721894',
        category: 'Hindi',
        edition: 'Revised Edition',
        publicationYear: 2024,
        language: 'Hindi',
        description: 'Comprehensive grammatical treatise covering Sandhi, Samas, Ras, Chhand, Alankar, and formal Hindi correspondence.',
        coverUrl: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=600&q=80',
        totalCopies: 10,
        availableCopies: 10,
        shelfLocation: 'Hindi Sahitya - Shelf H-403',
      },

      // 5. Computers (4 books)
      {
        title: 'Introduction to Algorithms (CLRS)',
        author: 'T. Cormen, C. Leiserson, R. Rivest, C. Stein',
        publisher: 'MIT Press / PHI',
        isbn: '978-0262046305',
        category: 'Computers',
        edition: '4th International Edition',
        publicationYear: 2022,
        language: 'English',
        description: 'The authoritative cornerstone of computer science covering algorithmic paradigms, graph theory, sorting, and dynamic programming.',
        coverUrl: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=600&q=80',
        totalCopies: 5,
        availableCopies: 5,
        shelfLocation: 'Computer Lab Annex - Shelf CS-501',
      },
      {
        title: 'Python Crash Course: Hands-On Project Guide',
        author: 'Eric Matthes',
        publisher: 'No Starch Press',
        isbn: '978-1718502703',
        category: 'Computers',
        edition: '3rd Edition',
        publicationYear: 2023,
        language: 'English',
        description: 'Practical, fast-paced guide to programming fundamentals, data visualizations, interactive web applications, and game development.',
        coverUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=600&q=80',
        totalCopies: 7,
        availableCopies: 7,
        shelfLocation: 'Computer Lab Annex - Shelf CS-502',
      },
      {
        title: 'Operating System Concepts',
        author: 'A. Silberschatz, P.B. Galvin, G. Gagne',
        publisher: 'Wiley Publishing',
        isbn: '978-1119800361',
        category: 'Computers',
        edition: '10th Dinosaur Edition',
        publicationYear: 2021,
        language: 'English',
        description: 'Comprehensive exploration of process synchronization, virtual memory architecture, storage management, and OS security models.',
        coverUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=600&q=80',
        totalCopies: 4,
        availableCopies: 4,
        shelfLocation: 'Computer Lab Annex - Shelf CS-503',
      },
      {
        title: 'Computer Networks: Principles and Protocols',
        author: 'Andrew S. Tanenbaum & David J. Wetherall',
        publisher: 'Pearson India',
        isbn: '978-9332518742',
        category: 'Computers',
        edition: '6th Global Edition',
        publicationYear: 2022,
        language: 'English',
        description: 'Essential textbook describing the OSI reference model, TCP/IP networking, wireless transmission, routing algorithms, and network security.',
        coverUrl: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=600&q=80',
        totalCopies: 5,
        availableCopies: 5,
        shelfLocation: 'Computer Lab Annex - Shelf CS-504',
      },

      // 6. History (3 books)
      {
        title: 'India’s Struggle for Independence (1857–1947)',
        author: 'Bipan Chandra, Mridula Mukherjee, Aditya Mukherjee',
        publisher: 'Penguin India',
        isbn: '978-0140107814',
        category: 'History',
        edition: 'Modern History Classic',
        publicationYear: 2021,
        language: 'English',
        description: 'Definitive historical analysis of the Indian freedom movement, nationalist political thought, mass mobilization, and constitutional evolution.',
        coverUrl: 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?auto=format&fit=crop&w=600&q=80',
        totalCopies: 6,
        availableCopies: 6,
        shelfLocation: 'Social Sciences - Shelf HIST-601',
      },
      {
        title: 'The Discovery of India',
        author: 'Jawaharlal Nehru',
        publisher: 'Oxford University Press',
        isbn: '978-0195623598',
        category: 'History',
        edition: 'Centenary Edition',
        publicationYear: 2020,
        language: 'English',
        description: 'Written during imprisonment in Ahmednagar Fort, tracing five millennia of Indian cultural, intellectual, spiritual, and artistic heritage.',
        coverUrl: 'https://images.unsplash.com/photo-1447069387593-a5de0862481e?auto=format&fit=crop&w=600&q=80',
        totalCopies: 5,
        availableCopies: 5,
        shelfLocation: 'Social Sciences - Shelf HIST-602',
      },
      {
        title: 'Ancient India: History & Civilization',
        author: 'R.C. Majumdar',
        publisher: 'Motilal Banarsidass',
        isbn: '978-8120804364',
        category: 'History',
        edition: '9th Reissue',
        publicationYear: 2022,
        language: 'English',
        description: 'In-depth documentation of Indus Valley civilization, Vedic traditions, Mauryan Empire, Gupta Renaissance, and ancient trade routes.',
        coverUrl: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=600&q=80',
        totalCopies: 4,
        availableCopies: 4,
        shelfLocation: 'Social Sciences - Shelf HIST-603',
      },

      // 7. Geography (3 books)
      {
        title: 'Certificate Physical and Human Geography',
        author: 'Goh Cheng Leong',
        publisher: 'Oxford University Press',
        isbn: '978-0195628166',
        category: 'Geography',
        edition: 'New International Edition',
        publicationYear: 2023,
        language: 'English',
        description: 'The premier reference on geomorphology, atmospheric circulation, global climatic zones, oceanic currents, and natural vegetation.',
        coverUrl: 'https://images.unsplash.com/photo-1521295121783-8a321d551ad2?auto=format&fit=crop&w=600&q=80',
        totalCopies: 9,
        availableCopies: 9,
        shelfLocation: 'Earth & Space - Shelf GEO-701',
      },
      {
        title: 'Oxford Student Atlas for India',
        author: 'Oxford University Press Cartographic Unit',
        publisher: 'Oxford University Press',
        isbn: '978-0190123567',
        category: 'Geography',
        edition: '36th Cartographic Edition',
        publicationYear: 2024,
        language: 'English',
        description: 'Precision physical, demographic, geopolitical, and resource maps of Indian states and world continents with thematic analysis.',
        coverUrl: 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=600&q=80',
        totalCopies: 12,
        availableCopies: 12,
        shelfLocation: 'Earth & Space - Shelf GEO-702',
      },
      {
        title: 'Physical Geography: Hydrosphere & Lithosphere',
        author: 'Dr. Savindra Singh',
        publisher: 'Praveen Publications',
        isbn: '978-8186539293',
        category: 'Geography',
        edition: 'Revised Edition',
        publicationYear: 2022,
        language: 'English',
        description: 'Comprehensive study of tectonic forces, volcanic landforms, fluvial cycles, glaciology, and environmental oceanography.',
        coverUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80',
        totalCopies: 5,
        availableCopies: 5,
        shelfLocation: 'Earth & Space - Shelf GEO-703',
      },

      // 8. General Knowledge (5 books)
      {
        title: 'Lucent’s General Knowledge (2026 Edition)',
        author: 'Dr. Binay Karna & Manwendra Mukul',
        publisher: 'Lucent Publications',
        isbn: '978-9384761456',
        category: 'General Knowledge',
        edition: 'Latest 2026 Edition',
        publicationYear: 2026,
        language: 'English',
        description: 'Exhaustive encyclopedic compendium covering Indian polity, economy, scientific discoveries, world geography, and national awards.',
        coverUrl: 'https://images.unsplash.com/photo-1491841573634-28140fc7ced7?auto=format&fit=crop&w=600&q=80',
        totalCopies: 15,
        availableCopies: 15,
        shelfLocation: 'Reference Stacks - Shelf GK-801',
      },
      {
        title: 'Manorama Yearbook 2026',
        author: 'Mammen Mathew',
        publisher: 'Malayala Manorama',
        isbn: '978-9389278120',
        category: 'General Knowledge',
        edition: '61st Annual Issue',
        publicationYear: 2026,
        language: 'English',
        description: 'Premier yearbook of international diplomacy, space missions, science advancements, global economics, and demographic trends.',
        coverUrl: 'https://images.unsplash.com/photo-1507842229458-57753e19a4b3?auto=format&fit=crop&w=600&q=80',
        totalCopies: 10,
        availableCopies: 10,
        shelfLocation: 'Reference Stacks - Shelf GK-802',
      },
      {
        title: 'India Year Book 2026: Official Reference',
        author: 'Publications Division, Ministry of Information & Broadcasting',
        publisher: 'Government of India',
        isbn: '978-8123034122',
        category: 'General Knowledge',
        edition: 'Official Annual Edition',
        publicationYear: 2026,
        language: 'English',
        description: 'The authoritative source on national infrastructure, agricultural data, energy initiatives, scientific development, and national defense.',
        coverUrl: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=600&q=80',
        totalCopies: 7,
        availableCopies: 7,
        shelfLocation: 'Reference Stacks - Shelf GK-803',
      },
      {
        title: 'General Knowledge Manual for Students',
        author: 'Mukesh Gautam & Team Arihant',
        publisher: 'Arihant Publications',
        isbn: '978-9325298124',
        category: 'General Knowledge',
        edition: 'Student Edition',
        publicationYear: 2025,
        language: 'English',
        description: 'Engaging, illustrated compendium of world history landmarks, global capitals, space exploration, and sports records.',
        coverUrl: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=600&q=80',
        totalCopies: 8,
        availableCopies: 8,
        shelfLocation: 'Reference Stacks - Shelf GK-804',
      },
      {
        title: 'The Concise Science & Technology Encyclopedia',
        author: 'Dr. C.P. Rao & Academic Advisory Board',
        publisher: 'Pearson Education',
        isbn: '978-9332578913',
        category: 'General Knowledge',
        edition: '3rd Illustrated Edition',
        publicationYear: 2024,
        language: 'English',
        description: 'Cross-disciplinary compendium of modern artificial intelligence, quantum computing, renewable energy, and biological genetics.',
        coverUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80',
        totalCopies: 6,
        availableCopies: 6,
        shelfLocation: 'Reference Stacks - Shelf GK-805',
      },
    ];

    // 1. Ensure tenant settings exist
    await this.getSettings(schoolId);

    // 2. Upsert each book idempotently
    const createdBooks: any[] = [];
    for (const b of sampleBooksDataset) {
      let book = await prisma.libraryBook.findFirst({
        where: { schoolId, isbn: b.isbn },
      });

      if (!book) {
        book = await prisma.libraryBook.create({
          data: {
            schoolId,
            title: b.title,
            author: b.author,
            isbn: b.isbn,
            category: b.category,
            publisher: b.publisher,
            edition: b.edition,
            publicationYear: b.publicationYear,
            language: b.language,
            description: b.description,
            coverUrl: b.coverUrl,
            totalCopies: b.totalCopies,
            availableCopies: b.availableCopies,
            shelfLocation: b.shelfLocation,
            status: 'AVAILABLE',
          },
        });
      } else {
        book = await prisma.libraryBook.update({
          where: { id: book.id },
          data: {
            title: b.title,
            author: b.author,
            category: b.category,
            publisher: b.publisher,
            edition: b.edition,
            publicationYear: b.publicationYear,
            description: b.description,
            coverUrl: b.coverUrl,
            shelfLocation: b.shelfLocation,
          },
        });
      }
      createdBooks.push(book);
    }

    // 3. Find active students in the school to create realistic sample transactions
    const students = await prisma.studentProfile.findMany({
      where: { membership: { schoolId }, status: 'ACTIVE' },
      include: { membership: { include: { user: true } } },
      take: 6,
    });

    let transactionsCreated = 0;

    if (students.length > 0 && createdBooks.length >= 6) {
      const existingIssuesCount = await prisma.bookIssue.count({ where: { schoolId } });

      if (existingIssuesCount < 5) {
        const now = new Date();

        // Sample 1: Active, Due in 7 days
        const s1 = students[0];
        const b1 = createdBooks[0];
        const due1 = new Date(now);
        due1.setDate(due1.getDate() + 7);
        await prisma.bookIssue.create({
          data: {
            schoolId,
            bookId: b1.id,
            studentProfileId: s1.id,
            issueDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
            dueDate: due1,
            status: 'ISSUED',
            fineAmount: 0,
            fineStatus: 'NONE',
            notes: 'Issued for physics term exam prep.',
          },
        });
        await prisma.libraryBook.update({
          where: { id: b1.id },
          data: { availableCopies: { decrement: 1 } },
        });
        transactionsCreated++;

        // Sample 2: Due Soon (due in 2 days)
        const s2 = students[1 % students.length];
        const b2 = createdBooks[4]; // Mathematics
        const due2 = new Date(now);
        due2.setDate(due2.getDate() + 2);
        await prisma.bookIssue.create({
          data: {
            schoolId,
            bookId: b2.id,
            studentProfileId: s2.id,
            issueDate: new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000),
            dueDate: due2,
            status: 'ISSUED',
            fineAmount: 0,
            fineStatus: 'NONE',
            notes: 'Secondary board trigonometry practice.',
          },
        });
        await prisma.libraryBook.update({
          where: { id: b2.id },
          data: { availableCopies: { decrement: 1 } },
        });
        transactionsCreated++;

        // Sample 3: Overdue by 6 days (accrued fine)
        const s3 = students[2 % students.length];
        const b3 = createdBooks[8]; // English Wren & Martin
        const due3 = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);
        await prisma.bookIssue.create({
          data: {
            schoolId,
            bookId: b3.id,
            studentProfileId: s3.id,
            issueDate: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000),
            dueDate: due3,
            status: 'ISSUED',
            fineAmount: 10.0, // (6 - 1 grace) * 2 = 10
            fineStatus: 'PENDING',
            notes: 'Grammar review; reminder notice dispatched.',
          },
        });
        await prisma.libraryBook.update({
          where: { id: b3.id },
          data: { availableCopies: { decrement: 1 } },
        });
        transactionsCreated++;

        // Sample 4: Returned on time
        const s4 = students[3 % students.length];
        const b4 = createdBooks[12]; // Hindi Godan
        await prisma.bookIssue.create({
          data: {
            schoolId,
            bookId: b4.id,
            studentProfileId: s4.id,
            issueDate: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000),
            dueDate: new Date(now.getTime() - 11 * 24 * 60 * 60 * 1000),
            returnDate: new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000),
            status: 'RETURNED',
            fineAmount: 0,
            fineStatus: 'NONE',
            finePaid: false,
            returnCondition: 'GOOD',
            notes: 'Returned in pristine condition.',
          },
        });
        transactionsCreated++;

        // Sample 5: Returned with fine paid
        const s5 = students[4 % students.length];
        const b5 = createdBooks[16]; // Python Crash Course
        await prisma.bookIssue.create({
          data: {
            schoolId,
            bookId: b5.id,
            studentProfileId: s5.id,
            issueDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
            dueDate: new Date(now.getTime() - 16 * 24 * 60 * 60 * 1000),
            returnDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
            status: 'RETURNED',
            fineAmount: 10.0,
            fineStatus: 'PAID',
            finePaid: true,
            returnCondition: 'GOOD',
            notes: 'Overdue fine of ₹10 received at circulation counter.',
          },
        });
        transactionsCreated++;
      }
    }

    return {
      success: true,
      seededBooksCount: createdBooks.length,
      sampleTransactionsCreated: transactionsCreated,
      categoriesCount: 8,
    };
  }
}

export const libraryService = new LibraryService();
