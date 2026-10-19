import { PrismaClient, PlatformRole, TenantStatus } from '@prisma/client';
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
      address: 'Plot 42, Institutional Area, Knowledge Park III',
      city: 'New Delhi',
      state: 'Delhi',
      country: 'India',
      postalCode: '110001',
      phone: '+91 11 2659 1000',
      email: 'admin@apexacademy.edu',
      websiteUrl: 'https://apexacademy.edunexa.com',
    },
  });

  console.log(`✓ School created/verified: ${school.name}`);

  // 2. Create Users & Memberships
  const usersData = [
    {
      email: 'admin@apexacademy.edu',
      firstName: 'Alistair',
      lastName: 'Vance',
      role: PlatformRole.SCHOOL_ADMIN,
    },
    {
      email: 'julian.thorne@apexacademy.edu',
      firstName: 'Julian',
      lastName: 'Thorne',
      role: PlatformRole.TEACHER,
    },
    {
      email: 'accounts@apexacademy.edu',
      firstName: 'Priya',
      lastName: 'Nambiar',
      role: PlatformRole.ACCOUNTS,
    },
    {
      email: 'aarav.sharma@apexacademy.edu',
      firstName: 'Aarav',
      lastName: 'Sharma',
      role: PlatformRole.STUDENT,
    },
    {
      email: 'ananya.deshmukh@apexacademy.edu',
      firstName: 'Ananya',
      lastName: 'Deshmukh',
      role: PlatformRole.STUDENT,
    },
    {
      email: 'vikram.sharma@gmail.com',
      firstName: 'Vikram',
      lastName: 'Sharma',
      role: PlatformRole.PARENT,
    },
  ];

  for (const u of usersData) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        email: u.email,
        passwordHash,
        firstName: u.firstName,
        lastName: u.lastName,
      },
    });

    await prisma.userMembership.upsert({
      where: {
        userId_schoolId_role: {
          userId: user.id,
          schoolId: school.id,
          role: u.role,
        },
      },
      update: {},
      create: {
        userId: user.id,
        schoolId: school.id,
        role: u.role,
        isPrimary: true,
        isActive: true,
      },
    });
  }

  console.log(`✓ ${usersData.length} Users & Memberships seeded.`);

  // 3. Create Academic Session
  const session = await prisma.academicSession.upsert({
    where: { schoolId_name: { schoolId: school.id, name: 'Academic Year 2026–2027' } },
    update: {},
    create: {
      schoolId: school.id,
      name: 'Academic Year 2026–2027',
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
    const code = `G${9 + i}`;
    const cls = await prisma.class.upsert({
      where: { schoolId_code: { schoolId: school.id, code } },
      update: {},
      create: {
        schoolId: school.id,
        name: gradeName,
        code,
        stage: 'Secondary',
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
