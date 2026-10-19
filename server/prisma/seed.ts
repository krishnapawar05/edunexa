import { PrismaClient, PlatformRole, TenantStatus, StudentStatus, EmploymentStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding EduNexa database with initial institutional records...');

  const passwordHash = await bcrypt.hash('Password@123', 10);

  // 1. Create Tenant School
  const school = await prisma.school.upsert({
    where: { slug: 'apex-academy' },
    update: {},
    create: {
      name: 'Apex Academy of Sciences & Arts',
      slug: 'apex-academy',
      code: 'APEX-2026',
      status: TenantStatus.ACTIVE,
      subscriptionPlan: 'PRO_ENTERPRISE',
      address: 'Plot 42, Institutional Area, Knowledge Park III',
      city: 'New Delhi',
      state: 'Delhi',
      country: 'India',
      postalCode: '110001',
      phone: '+91 11 2659 1000',
      email: 'admin@apexacademy.edu',
      website: 'https://apexacademy.edunexa.com',
    },
  });

  console.log(`✓ School created/verified: ${school.name}`);

  // 2. Create Users
  const usersData = [
    {
      email: 'admin@apexacademy.edu',
      name: 'Dr. Alistair Vance',
      role: PlatformRole.SCHOOL_ADMIN,
    },
    {
      email: 'julian.thorne@apexacademy.edu',
      name: 'Dr. Julian Thorne',
      role: PlatformRole.TEACHER,
    },
    {
      email: 'accounts@apexacademy.edu',
      name: 'Priya Nambiar',
      role: PlatformRole.ACCOUNTS,
    },
    {
      email: 'aarav.sharma@apexacademy.edu',
      name: 'Aarav Sharma',
      role: PlatformRole.STUDENT,
    },
    {
      email: 'ananya.deshmukh@apexacademy.edu',
      name: 'Ananya Deshmukh',
      role: PlatformRole.STUDENT,
    },
    {
      email: 'vikram.sharma@gmail.com',
      name: 'Vikram Sharma',
      role: PlatformRole.PARENT,
    },
  ];

  for (const u of usersData) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        email: u.email,
        passwordHash,
        name: u.name,
        role: u.role,
        schoolId: school.id,
      },
    });
  }

  console.log(`✓ ${usersData.length} Users seeded.`);

  // 3. Create Academic Session
  const session = await prisma.academicSession.upsert({
    where: { schoolId_code: { schoolId: school.id, code: 'AY-2026-2027' } },
    update: {},
    create: {
      schoolId: school.id,
      name: 'Academic Year 2026–2027',
      code: 'AY-2026-2027',
      startDate: new Date('2026-04-01'),
      endDate: new Date('2027-03-31'),
      isCurrent: true,
    },
  });

  console.log(`✓ Academic Session: ${session.name}`);

  // 4. Create Classes & Sections
  const grades = ['Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];
  for (let i = 0; i < grades.length; i++) {
    const gradeName = grades[i];
    const cls = await prisma.class.upsert({
      where: { schoolId_name: { schoolId: school.id, name: gradeName } },
      update: {},
      create: {
        schoolId: school.id,
        name: gradeName,
        code: `G${9 + i}`,
        orderIndex: i + 1,
      },
    });

    await prisma.section.upsert({
      where: { classId_name: { classId: cls.id, name: 'A' } },
      update: {},
      create: {
        classId: cls.id,
        name: 'A',
        capacity: 40,
      },
    });
  }

  console.log(`✓ Classes & Sections seeded.`);
  console.log('🎉 Seeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
