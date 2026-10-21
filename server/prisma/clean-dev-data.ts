import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanDevData() {
  console.log('🧹 Auditing and cleaning ephemeral test data from development database...');

  // 1. Identify and remove transient test schools created during automated test runs
  const testSchools = await prisma.school.findMany({
    where: {
      AND: [
        { slug: { notIn: ['apex-academy', 'greenwood-international', 'st-augustine'] } },
        { id: { notIn: ['sch-apex-01', 'sch-greenwood-02', 'sch-augustine-03'] } },
      ],
    },
    select: { id: true, slug: true, name: true },
  });

  console.log(`Found ${testSchools.length} transient test schools to prune.`);
  if (testSchools.length > 0) {
    const deletedSchools = await prisma.school.deleteMany({
      where: {
        id: { in: testSchools.map((s) => s.id) },
      },
    });
    console.log(`✓ Pruned ${deletedSchools.count} transient test schools and cascaded records.`);
  }

  // 2. Identify orphaned users without active memberships
  const usersWithMemberships = await prisma.userMembership.findMany({
    select: { userId: true },
  });
  const validUserIds = new Set(usersWithMemberships.map((m) => m.userId));

  const deletedUsers = await prisma.user.deleteMany({
    where: {
      AND: [
        { id: { notIn: Array.from(validUserIds) } },
        { email: { notIn: ['superadmin@edunexa.org'] } },
      ],
    },
  });
  console.log(`✓ Pruned ${deletedUsers.count} orphaned users.`);

  // 3. For canonical school Apex Academy, remove test-generated notices with random suffixes
  const apexSchool = await prisma.school.findFirst({
    where: { OR: [{ slug: 'apex-academy' }, { id: 'sch-apex-01' }] },
  });

  if (apexSchool) {
    // Keep only the canonical notices: not-01, not-02, not-03, not-04, not-05
    const deletedNotices = await prisma.notice.deleteMany({
      where: {
        schoolId: apexSchool.id,
        id: { notIn: ['not-01', 'not-02', 'not-03', 'not-04', 'not-05'] },
      },
    });
    console.log(`✓ Cleaned ${deletedNotices.count} excess notices in Apex Academy.`);

    // Keep only the canonical quizzes: quiz-phy-01, quiz-math-closed, quiz-chem-01, quiz-cs-01, quiz-training-01
    const deletedQuizzes = await prisma.quiz.deleteMany({
      where: {
        schoolId: apexSchool.id,
        id: { notIn: ['quiz-phy-01', 'quiz-math-closed', 'quiz-chem-01', 'quiz-cs-01', 'quiz-training-01'] },
      },
    });
    console.log(`✓ Cleaned ${deletedQuizzes.count} excess quizzes in Apex Academy.`);

    // Keep only canonical exam schedules: exam-mid-phy-10, exam-mid-math-10, exam-mid-chem-10, exam-mid-eng-10
    const deletedExams = await prisma.examSchedule.deleteMany({
      where: {
        academicSession: { schoolId: apexSchool.id },
        id: { notIn: ['exam-mid-phy-10', 'exam-mid-math-10', 'exam-mid-chem-10', 'exam-mid-eng-10'] },
      },
    });
    console.log(`✓ Cleaned ${deletedExams.count} excess examination schedules in Apex Academy.`);

    // Clean excess student profiles, keeping only canonical students
    const canonicalAdmissions = ['ADM-2026-0042', 'ADM-2026-0089', 'ADM-2026-0104', 'ADM-2026-0155', 'ADM-2026-0210'];
    const nonCanonicalStudents = await prisma.studentProfile.findMany({
      where: {
        admissionNumber: { notIn: canonicalAdmissions },
      },
      select: { id: true, membershipId: true, membership: { select: { userId: true } } },
    });

    if (nonCanonicalStudents.length > 0) {
      await prisma.studentProfile.deleteMany({
        where: { id: { in: nonCanonicalStudents.map((s) => s.id) } },
      });
      console.log(`✓ Cleaned ${nonCanonicalStudents.length} excess student profiles.`);

      // Also clean associated memberships and user accounts
      const userIds = nonCanonicalStudents.map((s) => s.membership?.userId).filter(Boolean) as string[];
      if (userIds.length > 0) {
        await prisma.user.deleteMany({
          where: { id: { in: userIds } },
        });
      }
    }

    // Clean excess staff profiles, keeping only canonical staff
    const canonicalEmployees = ['EMP-2026-0001', 'EMP-2026-0012', 'EMP-2026-0014', 'EMP-2026-0005', 'EMP-2026-0008', 'EMP-2026-0009'];
    const nonCanonicalStaff = await prisma.staffProfile.findMany({
      where: {
        employeeId: { notIn: canonicalEmployees },
      },
      select: { id: true, membershipId: true, membership: { select: { userId: true } } },
    });

    if (nonCanonicalStaff.length > 0) {
      await prisma.staffProfile.deleteMany({
        where: { id: { in: nonCanonicalStaff.map((s) => s.id) } },
      });
      console.log(`✓ Cleaned ${nonCanonicalStaff.length} excess staff profiles.`);

      const staffUserIds = nonCanonicalStaff.map((s) => s.membership?.userId).filter(Boolean) as string[];
      if (staffUserIds.length > 0) {
        await prisma.user.deleteMany({
          where: { id: { in: staffUserIds } },
        });
      }
    }

    // Clean excess virtual ID cards
    const validCardHolders = await prisma.virtualIdCard.findMany({
      select: { id: true, studentProfileId: true, staffProfileId: true },
    });
    const orphanCards = validCardHolders.filter((c) => !c.studentProfileId && !c.staffProfileId);
    if (orphanCards.length > 0) {
      await prisma.virtualIdCard.deleteMany({
        where: { id: { in: orphanCards.map((c) => c.id) } },
      });
    }

    // Clean duplicate leave requests
    const deletedLeaves = await prisma.staffLeaveRequest.deleteMany({
      where: {
        staff: { membership: { schoolId: apexSchool.id } },
        id: { notIn: ['leave-01', 'leave-02', 'leave-03', 'leave-04'] },
      },
    });
    console.log(`✓ Cleaned ${deletedLeaves.count} excess staff leave requests.`);

    // Clean excess school events
    const deletedEvents = await prisma.schoolEvent.deleteMany({
      where: {
        schoolId: apexSchool.id,
        id: { notIn: ['evt-01', 'evt-02', 'evt-03', 'evt-04'] },
      },
    });
    console.log(`✓ Cleaned ${deletedEvents.count} excess school events.`);

    // Clean excess fee invoices
    const deletedInvoices = await prisma.feeInvoice.deleteMany({
      where: {
        feeStructure: { schoolId: apexSchool.id },
        invoiceNumber: { notIn: ['INV-2026-0412', 'INV-2026-0413', 'INV-2026-0414', 'INV-2026-0415', 'INV-2026-0416'] },
      },
    });
    console.log(`✓ Cleaned ${deletedInvoices.count} excess fee invoices.`);
  }

  console.log('🎉 Development data cleanup completed successfully.');
}

cleanDevData()
  .catch((e) => {
    console.error('Error during data cleanup:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
