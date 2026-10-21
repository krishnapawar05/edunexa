import { PrismaClient, PlatformRole, TenantStatus, StudentStatus, EmploymentStatus, CardStatus, ApplicationStatus, FeePaymentStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding EduNexa database with complete institutional records...');

  const passwordHash = await bcrypt.hash('Password@123', 10);

  // 1. Create / Verify Tenant School
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

  console.log(`✓ School created/verified: ${school.name} (${school.id})`);

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
      email: 'dr.thorne@apexacademy.edu',
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
      email: 'aarav.sharma@student.apex.edu',
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
      email: 'ananya.d@student.apex.edu',
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
    {
      email: 'sunil.sharma@parent.apex.edu',
      firstName: 'Sunil',
      lastName: 'Sharma',
      role: PlatformRole.PARENT,
    },
    {
      email: 'priya.d@parent.apex.edu',
      firstName: 'Priya',
      lastName: 'Deshmukh',
      role: PlatformRole.PARENT,
    },
    {
      email: 'principal@apexacademy.edu',
      firstName: 'Dr. Alistair',
      lastName: 'Vance',
      role: PlatformRole.PRINCIPAL,
    },
    {
      email: 'hr@apexacademy.edu',
      firstName: 'Elena',
      lastName: 'Rostova',
      role: PlatformRole.HR_STAFF,
    },
    {
      email: 'rebecca.vance@apexacademy.edu',
      firstName: 'Rebecca',
      lastName: 'Vance',
      role: PlatformRole.TEACHER,
    },
    {
      email: 'rohan.verma@apexacademy.edu',
      firstName: 'Rohan',
      lastName: 'Verma',
      role: PlatformRole.STUDENT,
    },
    {
      email: 'meera.iyer@apexacademy.edu',
      firstName: 'Meera',
      lastName: 'Iyer',
      role: PlatformRole.STUDENT,
    },
    {
      email: 'kabir.sen@apexacademy.edu',
      firstName: 'Kabir',
      lastName: 'Sen',
      role: PlatformRole.STUDENT,
    },
    {
      email: 'rajesh.verma@parent.apex.edu',
      firstName: 'Rajesh',
      lastName: 'Verma',
      role: PlatformRole.PARENT,
    },
    {
      email: 'sunita.iyer@parent.apex.edu',
      firstName: 'Sunita',
      lastName: 'Iyer',
      role: PlatformRole.PARENT,
    },
    {
      email: 'exam.coordinator@apexacademy.edu',
      firstName: 'Dr. Marcus',
      lastName: 'Brody',
      role: PlatformRole.EXAM_COORDINATOR,
    },
    {
      email: 'superadmin@edunexa.org',
      firstName: 'System',
      lastName: 'SuperAdmin',
      role: PlatformRole.SUPER_ADMIN,
    },
  ];

  const userMap: Record<string, { user: any; membership: any }> = {};

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

    const membership = await prisma.userMembership.upsert({
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

    userMap[u.email] = { user, membership };
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

  // 4. Create Departments
  const deptData = [
    { name: 'Administration & Governance', description: 'Institutional leadership, academic coordination, and human resources' },
    { name: 'Science & Physics', description: 'Physics, Chemistry, Biology' },
    { name: 'Mathematics', description: 'Pure & Applied Mathematics' },
    { name: 'Humanities & Social Sciences', description: 'History, Civics, Geography' },
    { name: 'Computer Science & AI', description: 'ICT, Python, Machine Learning' },
  ];

  const deptMap: Record<string, any> = {};
  for (const d of deptData) {
    const dept = await prisma.department.upsert({
      where: { schoolId_name: { schoolId: school.id, name: d.name } },
      update: {},
      create: {
        schoolId: school.id,
        name: d.name,
        description: d.description,
      },
    });
    deptMap[d.name] = dept;
  }

  console.log(`✓ Departments seeded.`);

  // 5. Create Classes & Sections & Subjects
  const grades = [
    { name: 'Grade 9', code: 'G9' },
    { name: 'Grade 10', code: 'G10' },
    { name: 'Grade 11', code: 'G11' },
    { name: 'Grade 12', code: 'G12' },
  ];

  const sectionMap: Record<string, any> = {};
  const subjectMap: Record<string, any> = {};

  for (const g of grades) {
    const cls = await prisma.class.upsert({
      where: { schoolId_code: { schoolId: school.id, code: g.code } },
      update: {},
      create: {
        schoolId: school.id,
        name: g.name,
        code: g.code,
        stage: 'Secondary',
      },
    });

    const secA = await prisma.section.upsert({
      where: { classId_name: { classId: cls.id, name: 'A' } },
      update: {},
      create: {
        classId: cls.id,
        name: 'A',
        capacity: 40,
      },
    });
    sectionMap[`${g.name}-A`] = secA;

    // Add subjects for Grade 10
    if (g.code === 'G10') {
      const g10Subjects = [
        { code: 'PHY-10', name: 'Physics' },
        { code: 'MATH-10', name: 'Mathematics' },
        { code: 'CHEM-10', name: 'Chemistry' },
        { code: 'ENG-10', name: 'English Literature' },
      ];
      for (const sub of g10Subjects) {
        const s = await prisma.subject.upsert({
          where: { classId_code: { classId: cls.id, code: sub.code } },
          update: {},
          create: {
            classId: cls.id,
            name: sub.name,
            code: sub.code,
          },
        });
        subjectMap[sub.code] = s;
      }
    }
  }

  console.log(`✓ Classes, Sections, and Subjects seeded.`);

  // Helper functions for idempotent Virtual ID Card upsert
  async function upsertStaffCard(staffProfileId: string, cardNumber: string, verificationToken: string) {
    const existing = await prisma.virtualIdCard.findFirst({
      where: {
        OR: [{ staffProfileId }, { cardNumber }, { verificationToken }],
      },
    });
    if (existing) {
      return prisma.virtualIdCard.update({
        where: { id: existing.id },
        data: {
          staffProfileId,
          cardNumber,
          verificationToken,
          status: CardStatus.ACTIVE,
          expiresAt: new Date('2028-06-30'),
        },
      });
    }
    return prisma.virtualIdCard.create({
      data: {
        staffProfileId,
        cardNumber,
        verificationToken,
        status: CardStatus.ACTIVE,
        expiresAt: new Date('2028-06-30'),
      },
    });
  }

  async function upsertStudentCard(studentProfileId: string, cardNumber: string, verificationToken: string) {
    const existing = await prisma.virtualIdCard.findFirst({
      where: {
        OR: [{ studentProfileId }, { cardNumber }, { verificationToken }],
      },
    });
    if (existing) {
      return prisma.virtualIdCard.update({
        where: { id: existing.id },
        data: {
          studentProfileId,
          cardNumber,
          verificationToken,
          status: CardStatus.ACTIVE,
          expiresAt: new Date('2027-03-31'),
        },
      });
    }
    return prisma.virtualIdCard.create({
      data: {
        studentProfileId,
        cardNumber,
        verificationToken,
        status: CardStatus.ACTIVE,
        expiresAt: new Date('2027-03-31'),
      },
    });
  }

  // 6. Create Staff Profiles
  const teacherMembership = userMap['julian.thorne@apexacademy.edu']?.membership;
  let teacherStaffProfile: any = null;
  if (teacherMembership) {
    teacherStaffProfile = await prisma.staffProfile.upsert({
      where: { employeeId: 'EMP-2026-0012' },
      update: {},
      create: {
        membershipId: teacherMembership.id,
        employeeId: 'EMP-2026-0012',
        designation: 'Senior Faculty & Dept Head',
        departmentId: deptMap['Science & Physics']?.id,
        joiningDate: new Date('2023-08-01'),
        employmentStatus: EmploymentStatus.ACTIVE,
      },
    });

    // Assign to Grade 10 Physics
    if (subjectMap['PHY-10']) {
      await prisma.teacherAssignment.upsert({
        where: {
          staffProfileId_subjectId: {
            staffProfileId: teacherStaffProfile.id,
            subjectId: subjectMap['PHY-10'].id,
          },
        },
        update: {},
        create: {
          staffProfileId: teacherStaffProfile.id,
          subjectId: subjectMap['PHY-10'].id,
          isLeadTeacher: true,
        },
      });
    }

    // ID Card for Julian Thorne
    await upsertStaffCard(teacherStaffProfile.id, 'CR80-2026-0012', 'v-tok-7a1b-3c4d-5e6f-9912');
  }

  // Principal Staff Profile
  const principalMembership = userMap['principal@apexacademy.edu']?.membership;
  if (principalMembership) {
    const principalProfile = await prisma.staffProfile.upsert({
      where: { employeeId: 'EMP-2026-0001' },
      update: {},
      create: {
        membershipId: principalMembership.id,
        employeeId: 'EMP-2026-0001',
        designation: 'Principal & Head of School',
        departmentId: deptMap['Administration & Governance']?.id,
        joiningDate: new Date('2020-04-01'),
        employmentStatus: EmploymentStatus.ACTIVE,
      },
    });

    await upsertStaffCard(principalProfile.id, 'CR80-2026-0001', 'v-tok-1a2b-3c4d-5e6f-0001');
  }

  // HR Staff Profile
  const hrMembership = userMap['hr@apexacademy.edu']?.membership;
  if (hrMembership) {
    const hrProfile = await prisma.staffProfile.upsert({
      where: { employeeId: 'EMP-2026-0005' },
      update: {},
      create: {
        membershipId: hrMembership.id,
        employeeId: 'EMP-2026-0005',
        designation: 'HR Director & Staff Admin',
        departmentId: deptMap['Administration & Governance']?.id,
        joiningDate: new Date('2022-01-15'),
        employmentStatus: EmploymentStatus.ACTIVE,
      },
    });

    await upsertStaffCard(hrProfile.id, 'CR80-2026-0005', 'v-tok-5a6b-7c8d-9e0f-0005');
  }

  // Accounts Staff Profile
  const accountsMembership = userMap['accounts@apexacademy.edu']?.membership;
  if (accountsMembership) {
    const accountsProfile = await prisma.staffProfile.upsert({
      where: { employeeId: 'EMP-2026-0008' },
      update: {},
      create: {
        membershipId: accountsMembership.id,
        employeeId: 'EMP-2026-0008',
        designation: 'Bursar & Finance Officer',
        departmentId: deptMap['Administration & Governance']?.id,
        joiningDate: new Date('2021-06-01'),
        employmentStatus: EmploymentStatus.ACTIVE,
      },
    });

    await upsertStaffCard(accountsProfile.id, 'CR80-2026-0008', 'v-tok-8a9b-0c1d-2e3f-0008');
  }

  // Exam Coordinator Staff Profile
  const examCoordMembership = userMap['exam.coordinator@apexacademy.edu']?.membership;
  if (examCoordMembership) {
    const examCoordProfile = await prisma.staffProfile.upsert({
      where: { employeeId: 'EMP-2026-0009' },
      update: {
        departmentId: deptMap['Administration & Governance']?.id,
      },
      create: {
        membershipId: examCoordMembership.id,
        employeeId: 'EMP-2026-0009',
        designation: 'Examination Coordinator',
        departmentId: deptMap['Administration & Governance']?.id,
        joiningDate: new Date('2021-09-01'),
        employmentStatus: EmploymentStatus.ACTIVE,
      },
    });

    await upsertStaffCard(examCoordProfile.id, 'CR80-2026-0009', 'v-tok-9a0b-1c2d-3e4f-0009');
  }

  // 7. Create Student Profiles (Aarav & Ananya)
  const aaravMembership = userMap['aarav.sharma@apexacademy.edu']?.membership;
  let aaravProfile: any = null;
  let ananyaProfile: any = null;
  if (aaravMembership) {
    aaravProfile = await prisma.studentProfile.upsert({
      where: { admissionNumber: 'ADM-2026-0042' },
      update: {},
      create: {
        membershipId: aaravMembership.id,
        admissionNumber: 'ADM-2026-0042',
        gender: 'Male',
        dateOfBirth: new Date('2010-04-12'),
        bloodGroup: 'O+',
        address: 'Sector 14, Institutional Area, New Delhi',
        emergencyPhone: '+91 98100 23456',
        status: StudentStatus.ACTIVE,
      },
    });

    // Enroll in Grade 10-A
    const grade10SecA = sectionMap['Grade 10-A'];
    if (grade10SecA) {
      await prisma.studentEnrollment.upsert({
        where: {
          studentProfileId_academicSessionId: {
            studentProfileId: aaravProfile.id,
            academicSessionId: session.id,
          },
        },
        update: {},
        create: {
          studentProfileId: aaravProfile.id,
          academicSessionId: session.id,
          classId: grade10SecA.classId,
          sectionId: grade10SecA.id,
          rollNumber: 1,
        },
      });
    }

    // ID Card for Aarav
    await upsertStudentCard(aaravProfile.id, 'CR80-2026-0042', 'v-tok-8f2c-49a1-9b7e-e214');

    // Parent link: Vikram Sharma -> Aarav
    const parentMembership = userMap['vikram.sharma@gmail.com']?.membership;
    if (parentMembership) {
      await prisma.parentStudentLink.upsert({
        where: {
          parentMembershipId_studentProfileId: {
            parentMembershipId: parentMembership.id,
            studentProfileId: aaravProfile.id,
          },
        },
        update: {},
        create: {
          parentMembershipId: parentMembership.id,
          studentProfileId: aaravProfile.id,
          relationship: 'Father',
          isPrimaryContact: true,
        },
      });
    }
  }

  const ananyaMembership = userMap['ananya.deshmukh@apexacademy.edu']?.membership;
  if (ananyaMembership) {
    ananyaProfile = await prisma.studentProfile.upsert({
      where: { admissionNumber: 'ADM-2026-0089' },
      update: {},
      create: {
        membershipId: ananyaMembership.id,
        admissionNumber: 'ADM-2026-0089',
        gender: 'Female',
        dateOfBirth: new Date('2010-09-21'),
        bloodGroup: 'B+',
        address: 'Vasant Vihar, New Delhi',
        emergencyPhone: '+91 98200 45678',
        status: StudentStatus.ACTIVE,
      },
    });

    const grade10SecA = sectionMap['Grade 10-A'];
    if (grade10SecA) {
      await prisma.studentEnrollment.upsert({
        where: {
          studentProfileId_academicSessionId: {
            studentProfileId: ananyaProfile.id,
            academicSessionId: session.id,
          },
        },
        update: {},
        create: {
          studentProfileId: ananyaProfile.id,
          academicSessionId: session.id,
          classId: grade10SecA.classId,
          sectionId: grade10SecA.id,
          rollNumber: 2,
        },
      });
    }

    // Parent links
    const sunilMembership = userMap['sunil.sharma@parent.apex.edu']?.membership;
    if (sunilMembership && aaravProfile) {
      await prisma.parentStudentLink.upsert({
        where: {
          parentMembershipId_studentProfileId: {
            parentMembershipId: sunilMembership.id,
            studentProfileId: aaravProfile.id,
          },
        },
        update: {},
        create: {
          parentMembershipId: sunilMembership.id,
          studentProfileId: aaravProfile.id,
          relationship: 'Father',
          isPrimaryContact: true,
        },
      });
    }

    const priyaMembership = userMap['priya.d@parent.apex.edu']?.membership;
    if (priyaMembership && ananyaProfile) {
      await prisma.parentStudentLink.upsert({
        where: {
          parentMembershipId_studentProfileId: {
            parentMembershipId: priyaMembership.id,
            studentProfileId: ananyaProfile.id,
          },
        },
        update: {},
        create: {
          parentMembershipId: priyaMembership.id,
          studentProfileId: ananyaProfile.id,
          relationship: 'Mother',
          isPrimaryContact: true,
        },
      });
    }
  }

  // Rebecca Vance Staff Profile
  const rebeccaMembership = userMap['rebecca.vance@apexacademy.edu']?.membership;
  if (rebeccaMembership) {
    const rebeccaProfile = await prisma.staffProfile.upsert({
      where: { employeeId: 'EMP-2026-0014' },
      update: {},
      create: {
        membershipId: rebeccaMembership.id,
        employeeId: 'EMP-2026-0014',
        designation: 'Faculty - Mathematics',
        departmentId: deptMap['Mathematics']?.id,
        joiningDate: new Date('2023-09-01'),
        employmentStatus: EmploymentStatus.ACTIVE,
      },
    });
    if (subjectMap['MATH-10']) {
      await prisma.teacherAssignment.upsert({
        where: {
          staffProfileId_subjectId: {
            staffProfileId: rebeccaProfile.id,
            subjectId: subjectMap['MATH-10'].id,
          },
        },
        update: {},
        create: {
          staffProfileId: rebeccaProfile.id,
          subjectId: subjectMap['MATH-10'].id,
          isLeadTeacher: true,
        },
      });
    }
    await upsertStaffCard(rebeccaProfile.id, 'CR80-2026-0014', 'v-tok-2c3d-4e5f-6a7b-0014');
  }

  // Rohan Verma (Grade 10-A)
  const rohanMembership = userMap['rohan.verma@apexacademy.edu']?.membership;
  let rohanProfile: any = null;
  if (rohanMembership) {
    rohanProfile = await prisma.studentProfile.upsert({
      where: { admissionNumber: 'ADM-2026-0104' },
      update: {},
      create: {
        membershipId: rohanMembership.id,
        admissionNumber: 'ADM-2026-0104',
        gender: 'Male',
        dateOfBirth: new Date('2010-07-14'),
        bloodGroup: 'A+',
        address: 'Sector 22, Institutional Area, New Delhi',
        emergencyPhone: '+91 98300 12345',
        status: StudentStatus.ACTIVE,
      },
    });
    const grade10SecA = sectionMap['Grade 10-A'];
    if (grade10SecA) {
      await prisma.studentEnrollment.upsert({
        where: {
          studentProfileId_academicSessionId: {
            studentProfileId: rohanProfile.id,
            academicSessionId: session.id,
          },
        },
        update: {},
        create: {
          studentProfileId: rohanProfile.id,
          academicSessionId: session.id,
          classId: grade10SecA.classId,
          sectionId: grade10SecA.id,
          rollNumber: 3,
        },
      });
    }
    await upsertStudentCard(rohanProfile.id, 'CR80-2026-0104', 'v-tok-3d4e-5f6a-7b8c-0104');

    const rajeshMembership = userMap['rajesh.verma@parent.apex.edu']?.membership;
    if (rajeshMembership) {
      await prisma.parentStudentLink.upsert({
        where: {
          parentMembershipId_studentProfileId: {
            parentMembershipId: rajeshMembership.id,
            studentProfileId: rohanProfile.id,
          },
        },
        update: {},
        create: {
          parentMembershipId: rajeshMembership.id,
          studentProfileId: rohanProfile.id,
          relationship: 'Father',
          isPrimaryContact: true,
        },
      });
    }
  }

  // Meera Iyer (Grade 9-A)
  const meeraMembership = userMap['meera.iyer@apexacademy.edu']?.membership;
  let meeraProfile: any = null;
  if (meeraMembership) {
    meeraProfile = await prisma.studentProfile.upsert({
      where: { admissionNumber: 'ADM-2026-0155' },
      update: {},
      create: {
        membershipId: meeraMembership.id,
        admissionNumber: 'ADM-2026-0155',
        gender: 'Female',
        dateOfBirth: new Date('2011-03-29'),
        bloodGroup: 'AB+',
        address: 'Safdarjung Enclave, New Delhi',
        emergencyPhone: '+91 98400 67890',
        status: StudentStatus.ACTIVE,
      },
    });
    const grade9SecA = sectionMap['Grade 9-A'];
    if (grade9SecA) {
      await prisma.studentEnrollment.upsert({
        where: {
          studentProfileId_academicSessionId: {
            studentProfileId: meeraProfile.id,
            academicSessionId: session.id,
          },
        },
        update: {},
        create: {
          studentProfileId: meeraProfile.id,
          academicSessionId: session.id,
          classId: grade9SecA.classId,
          sectionId: grade9SecA.id,
          rollNumber: 1,
        },
      });
    }
    await upsertStudentCard(meeraProfile.id, 'CR80-2026-0155', 'v-tok-4e5f-6a7b-8c9d-0155');

    const sunitaMembership = userMap['sunita.iyer@parent.apex.edu']?.membership;
    if (sunitaMembership) {
      await prisma.parentStudentLink.upsert({
        where: {
          parentMembershipId_studentProfileId: {
            parentMembershipId: sunitaMembership.id,
            studentProfileId: meeraProfile.id,
          },
        },
        update: {},
        create: {
          parentMembershipId: sunitaMembership.id,
          studentProfileId: meeraProfile.id,
          relationship: 'Mother',
          isPrimaryContact: true,
        },
      });
    }
  }

  // Kabir Sen (Grade 11-A)
  const kabirMembership = userMap['kabir.sen@apexacademy.edu']?.membership;
  let kabirProfile: any = null;
  if (kabirMembership) {
    kabirProfile = await prisma.studentProfile.upsert({
      where: { admissionNumber: 'ADM-2026-0210' },
      update: {},
      create: {
        membershipId: kabirMembership.id,
        admissionNumber: 'ADM-2026-0210',
        gender: 'Male',
        dateOfBirth: new Date('2009-11-08'),
        bloodGroup: 'O-',
        address: 'Anand Lok, New Delhi',
        emergencyPhone: '+91 98500 11223',
        status: StudentStatus.ACTIVE,
      },
    });
    const grade11SecA = sectionMap['Grade 11-A'];
    if (grade11SecA) {
      await prisma.studentEnrollment.upsert({
        where: {
          studentProfileId_academicSessionId: {
            studentProfileId: kabirProfile.id,
            academicSessionId: session.id,
          },
        },
        update: {},
        create: {
          studentProfileId: kabirProfile.id,
          academicSessionId: session.id,
          classId: grade11SecA.classId,
          sectionId: grade11SecA.id,
          rollNumber: 1,
        },
      });
    }
    await upsertStudentCard(kabirProfile.id, 'CR80-2026-0210', 'v-tok-5f6a-7b8c-9d0e-0210');
  }

  console.log(`✓ 5 Canonical Staff & 5 Canonical Student Profiles with ID Cards & Enrollments seeded.`);

  // 8. Create Admission Application
  await prisma.admissionApplication.upsert({
    where: { applicationNumber: 'APP-2026-0091' },
    update: {},
    create: {
      schoolId: school.id,
      applicationNumber: 'APP-2026-0091',
      studentFirstName: 'Meera',
      studentLastName: 'Nambiar',
      dateOfBirth: new Date('2011-05-18'),
      gender: 'Female',
      applyingClass: 'Grade 9',
      guardianName: 'Ramesh Nambiar',
      guardianRelationship: 'Father',
      guardianEmail: 'r.nambiar@example.com',
      guardianPhone: '+91 98450 12345',
      residentialAddress: 'Plot 18, Defence Colony, New Delhi',
      status: ApplicationStatus.SUBMITTED,
    },
  });

  // 9. Create Attendance Records
  const grade10SecA = sectionMap['Grade 10-A'];
  if (aaravProfile && grade10SecA) {
    const aaravAttendance = [
      { date: '2026-10-14', status: 'PRESENT' },
      { date: '2026-10-15', status: 'PRESENT' },
      { date: '2026-10-16', status: 'LATE', remarks: 'Bus breakdown on Route 4' },
      { date: '2026-10-17', status: 'PRESENT' },
      { date: '2026-10-18', status: 'APPROVED_LEAVE', remarks: 'Inter-school science olympiad' },
    ];
    for (const a of aaravAttendance) {
      await prisma.attendanceRecord.upsert({
        where: { studentProfileId_date: { studentProfileId: aaravProfile.id, date: new Date(a.date) } },
        update: {},
        create: {
          studentProfileId: aaravProfile.id,
          sectionId: grade10SecA.id,
          date: new Date(a.date),
          status: a.status as any,
          remarks: a.remarks,
          markedByUserId: teacherMembership?.userId || 'usr-thorne-01',
        },
      });
    }
  }

  if (ananyaProfile && grade10SecA) {
    const ananyaAttendance = [
      { date: '2026-10-14', status: 'PRESENT' },
      { date: '2026-10-15', status: 'PRESENT' },
      { date: '2026-10-16', status: 'ABSENT', remarks: 'Uninformed absence' },
    ];
    for (const a of ananyaAttendance) {
      await prisma.attendanceRecord.upsert({
        where: { studentProfileId_date: { studentProfileId: ananyaProfile.id, date: new Date(a.date) } },
        update: {},
        create: {
          studentProfileId: ananyaProfile.id,
          sectionId: grade10SecA.id,
          date: new Date(a.date),
          status: a.status as any,
          remarks: a.remarks,
          markedByUserId: teacherMembership?.userId || 'usr-thorne-01',
        },
      });
    }
  }

  // 10. Staff Attendance
  if (teacherStaffProfile) {
    await prisma.staffAttendance.upsert({
      where: { staffProfileId_date: { staffProfileId: teacherStaffProfile.id, date: new Date('2026-10-18') } },
      update: {},
      create: {
        staffProfileId: teacherStaffProfile.id,
        date: new Date('2026-10-18'),
        status: 'PRESENT',
        checkInTime: new Date('2026-10-18T07:45:00.000Z'),
        checkOutTime: new Date('2026-10-18T16:15:00.000Z'),
        remarks: 'Biometric verified at Gate A',
      },
    });
  }

  // 11. Quizzes
  if (subjectMap['PHY-10']) {
    const existingQ1 = await prisma.quiz.findFirst({ where: { id: 'quiz-phy-01' } });
    if (!existingQ1) {
      await prisma.quiz.create({
        data: {
          id: 'quiz-phy-01',
          schoolId: school.id,
          subjectId: subjectMap['PHY-10'].id,
          sectionId: grade10SecA?.id,
          title: 'Physics Chapter 4: Electromagnetism & Induction',
          instructions: 'Timed assessment. Negative marking of 0.25 marks applies to incorrect MCQs.',
          durationMinutes: 30,
          totalMarks: 20,
          passingMarks: 8,
          status: 'PUBLISHED',
          opensAt: new Date(Date.now() - 24 * 3600 * 1000),
          closesAt: new Date(Date.now() + 7 * 24 * 3600 * 1000),
          maxAttempts: 1,
          randomizeQuestions: true,
          negativeMarking: 0.25,
          releaseGradesImmediately: true,
          createdByUserId: teacherMembership?.userId || 'usr-thorne-01',
          questions: {
            create: [
              {
                id: 'q-phy-1',
                questionText: 'What is the SI unit of magnetic flux density?',
                questionType: 'MULTIPLE_CHOICE',
                marks: 5,
                negativeMarks: 1.25,
                explanation: 'Tesla (T) is the SI unit of magnetic flux density (B). Weber (Wb) is magnetic flux.',
                orderIndex: 0,
                choices: {
                  create: [
                    { id: 'c-1a', choiceText: 'Tesla (T)', isCorrect: true, orderIndex: 0 },
                    { id: 'c-1b', choiceText: 'Weber (Wb)', isCorrect: false, orderIndex: 1 },
                    { id: 'c-1c', choiceText: 'Henry (H)', isCorrect: false, orderIndex: 2 },
                    { id: 'c-1d', choiceText: 'Gauss (G)', isCorrect: false, orderIndex: 3 },
                  ],
                },
              },
              {
                id: 'q-phy-2',
                questionText: 'According to Faraday\'s law of induction, induced EMF is directly proportional to the rate of change of magnetic flux.',
                questionType: 'TRUE_FALSE',
                marks: 5,
                negativeMarks: 1.25,
                explanation: 'Faraday stated that induced EMF = -d(Phi)/dt.',
                orderIndex: 1,
                choices: {
                  create: [
                    { id: 'c-2a', choiceText: 'True', isCorrect: true, orderIndex: 0 },
                    { id: 'c-2b', choiceText: 'False', isCorrect: false, orderIndex: 1 },
                  ],
                },
              },
            ],
          },
        },
      });
    }

    const existingClosedQ = await prisma.quiz.findFirst({ where: { id: 'quiz-math-closed' } });
    if (!existingClosedQ && subjectMap['MATH-10']) {
      await prisma.quiz.create({
        data: {
          id: 'quiz-math-closed',
          schoolId: school.id,
          subjectId: subjectMap['MATH-10'].id,
          title: 'Mathematics Unit Test 1: Quadratic Equations',
          instructions: 'Past test, submissions closed.',
          durationMinutes: 45,
          totalMarks: 25,
          passingMarks: 10,
          status: 'PUBLISHED',
          opensAt: new Date('2026-09-01T09:00:00.000Z'),
          closesAt: new Date('2026-09-05T17:00:00.000Z'),
          maxAttempts: 1,
          createdByUserId: teacherMembership?.userId || 'usr-thorne-01',
        },
      });
    }

    const existingChemQ = await prisma.quiz.findFirst({ where: { id: 'quiz-chem-01' } });
    if (!existingChemQ && subjectMap['CHEM-10']) {
      await prisma.quiz.create({
        data: {
          id: 'quiz-chem-01',
          schoolId: school.id,
          subjectId: subjectMap['CHEM-10'].id,
          sectionId: grade10SecA?.id,
          title: 'Chemistry Chapter 2: Periodic Classification & Chemical Bonds',
          instructions: 'Objective review with electrovalent and covalent bonding questions.',
          durationMinutes: 30,
          totalMarks: 20,
          passingMarks: 8,
          status: 'PUBLISHED',
          opensAt: new Date(Date.now() - 12 * 3600 * 1000),
          closesAt: new Date(Date.now() + 5 * 24 * 3600 * 1000),
          maxAttempts: 1,
          randomizeQuestions: true,
          negativeMarking: 0.0,
          releaseGradesImmediately: true,
          createdByUserId: teacherMembership?.userId || 'usr-thorne-01',
        },
      });
    }

    const existingCsQ = await prisma.quiz.findFirst({ where: { id: 'quiz-cs-01' } });
    if (!existingCsQ && subjectMap['PHY-10']) {
      await prisma.quiz.create({
        data: {
          id: 'quiz-cs-01',
          schoolId: school.id,
          subjectId: subjectMap['PHY-10'].id,
          sectionId: grade10SecA?.id,
          title: 'Computer Science & AI: Data Structures & Python Algorithms',
          instructions: 'Assessment on lists, dictionaries, time complexity, and search routines.',
          durationMinutes: 40,
          totalMarks: 25,
          passingMarks: 10,
          status: 'PUBLISHED',
          opensAt: new Date(Date.now() - 6 * 3600 * 1000),
          closesAt: new Date(Date.now() + 10 * 24 * 3600 * 1000),
          maxAttempts: 1,
          randomizeQuestions: true,
          negativeMarking: 0.25,
          releaseGradesImmediately: true,
          createdByUserId: teacherMembership?.userId || 'usr-thorne-01',
        },
      });
    }

    const existingTrainingQ = await prisma.quiz.findFirst({ where: { id: 'quiz-training-01' } });
    if (!existingTrainingQ) {
      await prisma.quiz.create({
        data: {
          id: 'quiz-training-01',
          schoolId: school.id,
          subjectId: subjectMap['PHY-10'].id,
          title: 'Mandatory Institutional Child Protection & Safety Protocols (2026–2027)',
          instructions: 'Annual compliance assessment for all faculty and administrative personnel.',
          durationMinutes: 30,
          totalMarks: 100,
          passingMarks: 75,
          status: 'PUBLISHED',
          isStaffTraining: true,
          opensAt: new Date(Date.now() - 30 * 24 * 3600 * 1000),
          closesAt: new Date(Date.now() + 365 * 24 * 3600 * 1000),
          maxAttempts: 3,
          createdByUserId: teacherMembership?.userId || 'usr-thorne-01',
          questions: {
            create: [
              {
                id: 'q-train-1',
                questionText: 'What is the immediate protocol upon observing an unauthorized individual on school premises?',
                questionType: 'MULTIPLE_CHOICE',
                marks: 100,
                explanation: 'Security and admin desk must be notified immediately.',
                orderIndex: 0,
                choices: {
                  create: [
                    { id: 'c-tr-1a', choiceText: 'Immediately notify security dispatch and escort students to secure rooms', isCorrect: true, orderIndex: 0 },
                    { id: 'c-tr-1b', choiceText: 'Ignore unless individual approaches a classroom', isCorrect: false, orderIndex: 1 },
                  ],
                },
              },
            ],
          },
        },
      });
    }
  }

  // 12. Exam Schedules & Marks
  if (subjectMap['PHY-10'] && session) {
    const examMidPhy = await prisma.examSchedule.upsert({
      where: { id: 'exam-mid-phy-10' },
      update: {},
      create: {
        id: 'exam-mid-phy-10',
        academicSessionId: session.id,
        subjectId: subjectMap['PHY-10'].id,
        name: 'Mid-Term Examination 2026: Physics',
        examType: 'MID_TERM',
        examDate: new Date('2026-09-20'),
        startTime: '09:30 AM',
        durationMinutes: 180,
        maxMarks: 100,
        passMarks: 35,
        weightagePercent: 30,
        status: 'PUBLISHED',
      },
    });

    if (aaravProfile) {
      await prisma.examMark.upsert({
        where: { examScheduleId_studentProfileId: { examScheduleId: examMidPhy.id, studentProfileId: aaravProfile.id } },
        update: {},
        create: {
          id: 'mark-aarav-phy-mid',
          examScheduleId: examMidPhy.id,
          studentProfileId: aaravProfile.id,
          marksObtained: 92,
          grade: 'A1',
          teacherRemarks: 'Exceptional analytical clarity in electromagnetic theory.',
          enteredByUserId: teacherMembership?.userId || 'usr-thorne-01',
        },
      });
    }

    if (ananyaProfile) {
      await prisma.examMark.upsert({
        where: { examScheduleId_studentProfileId: { examScheduleId: examMidPhy.id, studentProfileId: ananyaProfile.id } },
        update: {},
        create: {
          id: 'mark-ananya-phy-mid',
          examScheduleId: examMidPhy.id,
          studentProfileId: ananyaProfile.id,
          marksObtained: 84,
          grade: 'A2',
          teacherRemarks: 'Good conceptual foundation.',
          enteredByUserId: teacherMembership?.userId || 'usr-thorne-01',
        },
      });
    }
  }

  if (subjectMap['MATH-10'] && session && aaravProfile) {
    const examMidMath = await prisma.examSchedule.upsert({
      where: { id: 'exam-mid-math-10' },
      update: {},
      create: {
        id: 'exam-mid-math-10',
        academicSessionId: session.id,
        subjectId: subjectMap['MATH-10'].id,
        name: 'Mid-Term Examination 2026: Mathematics',
        examType: 'MID_TERM',
        examDate: new Date('2026-09-22'),
        startTime: '09:30 AM',
        durationMinutes: 180,
        maxMarks: 100,
        passMarks: 35,
        weightagePercent: 30,
        status: 'PUBLISHED',
      },
    });

    await prisma.examMark.upsert({
      where: { examScheduleId_studentProfileId: { examScheduleId: examMidMath.id, studentProfileId: aaravProfile.id } },
      update: {},
      create: {
        id: 'mark-aarav-math-mid',
        examScheduleId: examMidMath.id,
        studentProfileId: aaravProfile.id,
        marksObtained: 88,
        grade: 'A2',
        teacherRemarks: 'Strong grasp of trigonometry and geometric proofs.',
        enteredByUserId: teacherMembership?.userId || 'usr-thorne-01',
      },
    });

    if (rohanProfile) {
      await prisma.examMark.upsert({
        where: { examScheduleId_studentProfileId: { examScheduleId: examMidMath.id, studentProfileId: rohanProfile.id } },
        update: {},
        create: {
          id: 'mark-rohan-math-mid',
          examScheduleId: examMidMath.id,
          studentProfileId: rohanProfile.id,
          marksObtained: 79,
          grade: 'B1',
          teacherRemarks: 'Consistent effort in algebraic simplifications.',
          enteredByUserId: teacherMembership?.userId || 'usr-thorne-01',
        },
      });
    }
  }

  if (subjectMap['CHEM-10'] && session && aaravProfile) {
    const examMidChem = await prisma.examSchedule.upsert({
      where: { id: 'exam-mid-chem-10' },
      update: {},
      create: {
        id: 'exam-mid-chem-10',
        academicSessionId: session.id,
        subjectId: subjectMap['CHEM-10'].id,
        name: 'Mid-Term Examination 2026: Chemistry',
        examType: 'MID_TERM',
        examDate: new Date('2026-09-24'),
        startTime: '09:30 AM',
        durationMinutes: 180,
        maxMarks: 100,
        passMarks: 35,
        weightagePercent: 30,
        status: 'PUBLISHED',
      },
    });

    await prisma.examMark.upsert({
      where: { examScheduleId_studentProfileId: { examScheduleId: examMidChem.id, studentProfileId: aaravProfile.id } },
      update: {},
      create: {
        id: 'mark-aarav-chem-mid',
        examScheduleId: examMidChem.id,
        studentProfileId: aaravProfile.id,
        marksObtained: 90,
        grade: 'A2',
        teacherRemarks: 'Excellent mastery of stoichiometry and chemical equations.',
        enteredByUserId: teacherMembership?.userId || 'usr-thorne-01',
      },
    });
  }

  if (subjectMap['ENG-10'] && session && aaravProfile) {
    const examMidEng = await prisma.examSchedule.upsert({
      where: { id: 'exam-mid-eng-10' },
      update: {},
      create: {
        id: 'exam-mid-eng-10',
        academicSessionId: session.id,
        subjectId: subjectMap['ENG-10'].id,
        name: 'Mid-Term Examination 2026: English Literature',
        examType: 'MID_TERM',
        examDate: new Date('2026-09-26'),
        startTime: '09:30 AM',
        durationMinutes: 180,
        maxMarks: 100,
        passMarks: 35,
        weightagePercent: 30,
        status: 'PUBLISHED',
      },
    });

    await prisma.examMark.upsert({
      where: { examScheduleId_studentProfileId: { examScheduleId: examMidEng.id, studentProfileId: aaravProfile.id } },
      update: {},
      create: {
        id: 'mark-aarav-eng-mid',
        examScheduleId: examMidEng.id,
        studentProfileId: aaravProfile.id,
        marksObtained: 86,
        grade: 'A2',
        teacherRemarks: 'Insightful essay composition and literary analysis.',
        enteredByUserId: teacherMembership?.userId || 'usr-thorne-01',
      },
    });
  }

  // 13. Timetables
  if (grade10SecA) {
    await prisma.timetableSlot.upsert({
      where: { id: 'tt-01' },
      update: {},
      create: {
        id: 'tt-01',
        sectionId: grade10SecA.id,
        dayOfWeek: 1,
        startTime: '08:30',
        endTime: '09:20',
        subjectName: 'Physics Core',
        roomNumber: 'Room 204',
        teacherName: 'Dr. Julian Thorne',
      },
    });

    await prisma.timetableSlot.upsert({
      where: { id: 'tt-02' },
      update: {},
      create: {
        id: 'tt-02',
        sectionId: grade10SecA.id,
        dayOfWeek: 1,
        startTime: '09:25',
        endTime: '10:15',
        subjectName: 'Mathematics (Advanced)',
        roomNumber: 'Room 204',
        teacherName: 'Mrs. Rebecca Vance',
      },
    });
  }

  // 14. Assignments
  if (grade10SecA && subjectMap['PHY-10']) {
    const asg = await prisma.assignment.upsert({
      where: { id: 'asg-phy-01' },
      update: {},
      create: {
        id: 'asg-phy-01',
        sectionId: grade10SecA.id,
        subjectId: subjectMap['PHY-10'].id,
        title: 'Electromagnetic Field Mapping & Solenoid Calculation',
        description: 'Calculate the magnetic flux density B within a 500-turn solenoid and submit your step-by-step PDF solutions.',
        dueDate: new Date(Date.now() + 5 * 24 * 3600 * 1000),
        maxMarks: 20,
      },
    });

    if (aaravProfile) {
      await prisma.assignmentSubmission.upsert({
        where: { assignmentId_studentProfileId: { assignmentId: asg.id, studentProfileId: aaravProfile.id } },
        update: {},
        create: {
          id: 'sub-aarav-01',
          assignmentId: asg.id,
          studentProfileId: aaravProfile.id,
          submissionText: 'Completed all 5 numerical problems with SI derivation diagrams.',
          fileUrl: 'https://edunexa.blob.core/submissions/aarav_solenoid_hw.pdf',
          fileName: 'aarav_solenoid_hw.pdf',
          fileSizeBytes: 1450000,
          fileType: 'application/pdf',
          marksAwarded: 19,
          feedback: 'Exemplary circuit derivation and accurate magnetic constant units.',
          isLate: false,
        },
      });
    }
  }

  // 15. Learning Resources
  if (subjectMap['PHY-10']) {
    await prisma.learningResource.upsert({
      where: { id: 'res-phy-01' },
      update: {},
      create: {
        id: 'res-phy-01',
        subjectId: subjectMap['PHY-10'].id,
        title: 'NCERT & Exemplar Solutions: Magnetic Effects of Electric Current',
        description: 'Comprehensive chapter guide with annotated illustrations and practice MCQs.',
        topic: 'Electromagnetism',
        fileUrl: 'https://edunexa.blob.core/resources/ncert_phy_ch4_notes.pdf',
        fileType: 'PDF',
        fileSizeBytes: 4200000,
      },
    });
  }

  // 16. Notices
  await prisma.notice.upsert({
    where: { id: 'not-01' },
    update: {},
    create: {
      id: 'not-01',
      schoolId: school.id,
      title: 'CBSE Secondary Board Registration & Fee Circular',
      content: 'All Grade 10 students and guardians are requested to verify their board enrollment forms and clear pending term fees by October 25, 2026.',
      audience: 'ALL',
      isUrgent: true,
      createdByUserId: userMap['admin@apexacademy.edu']?.user.id,
    },
  });

  await prisma.notice.upsert({
    where: { id: 'not-02' },
    update: {},
    create: {
      id: 'not-02',
      schoolId: school.id,
      title: 'Internal Teacher Moderation & Pedagogy Workshop',
      content: 'Faculty meeting scheduled in Seminar Hall 1 for secondary question bank standardization.',
      audience: 'STAFF_ONLY',
      isUrgent: false,
      createdByUserId: userMap['admin@apexacademy.edu']?.user.id,
    },
  });

  await prisma.notice.upsert({
    where: { id: 'not-03' },
    update: {},
    create: {
      id: 'not-03',
      schoolId: school.id,
      title: 'Grade 10 Science Practical Lab Schedule',
      content: 'Grade 10-A and 10-B optics lab sessions commence this Wednesday at 10:30 AM.',
      audience: 'STUDENTS_ONLY',
      targetClass: 'Grade 10',
      isUrgent: false,
      createdByUserId: userMap['dr.thorne@apexacademy.edu']?.user.id,
    },
  });

  await prisma.notice.upsert({
    where: { id: 'not-04' },
    update: {},
    create: {
      id: 'not-04',
      schoolId: school.id,
      title: 'Parent-Teacher Academic Progress Conference (Term 2)',
      content: 'Individual consultations with class counselors and subject heads scheduled for November 5, 2026 in the Central Hall.',
      audience: 'PARENTS_ONLY',
      isUrgent: false,
      createdByUserId: userMap['admin@apexacademy.edu']?.user.id,
    },
  });

  await prisma.notice.upsert({
    where: { id: 'not-05' },
    update: {},
    create: {
      id: 'not-05',
      schoolId: school.id,
      title: 'Campus Sports Complex & Swimming Pool Annual Maintenance',
      content: 'Indoor aquatic complex will undergo water purification maintenance from October 28 to October 30. Physical education classes will relocate to the outdoor turf.',
      audience: 'ALL',
      isUrgent: false,
      createdByUserId: userMap['admin@apexacademy.edu']?.user.id,
    },
  });

  // 17. School Events (4 Canonical Records)
  await prisma.schoolEvent.upsert({
    where: { id: 'evt-01' },
    update: {},
    create: {
      id: 'evt-01',
      schoolId: school.id,
      title: 'Annual Inter-School STEM & Robotics Exposition 2026',
      description: 'Showcasing AI prototypes, renewable energy projects, and mathematical modeling.',
      venue: 'Main Auditorium & Exhibition Grounds',
      startDate: new Date('2026-11-14T09:00:00.000Z'),
      endDate: new Date('2026-11-15T18:00:00.000Z'),
      audience: 'ALL',
      isPublic: true,
    },
  });

  await prisma.schoolEvent.upsert({
    where: { id: 'evt-02' },
    update: {},
    create: {
      id: 'evt-02',
      schoolId: school.id,
      title: 'Winter Cultural Festival & Performing Arts Gala 2026',
      description: 'Classical orchestra, dramatic arts, dance ensembles, and contemporary fine arts exhibition.',
      venue: 'Open Air Amphitheatre',
      startDate: new Date('2026-12-18T16:00:00.000Z'),
      endDate: new Date('2026-12-19T21:30:00.000Z'),
      audience: 'ALL',
      isPublic: true,
    },
  });

  await prisma.schoolEvent.upsert({
    where: { id: 'evt-03' },
    update: {},
    create: {
      id: 'evt-03',
      schoolId: school.id,
      title: 'All-India Mathematics Olympiad Preliminary Round',
      description: 'Proctored problem-solving competition for grades 9 through 12.',
      venue: 'Ramanujan Examination Hall',
      startDate: new Date('2026-11-28T09:30:00.000Z'),
      endDate: new Date('2026-11-28T12:30:00.000Z'),
      audience: 'STUDENTS_ONLY',
      isPublic: false,
    },
  });

  await prisma.schoolEvent.upsert({
    where: { id: 'evt-04' },
    update: {},
    create: {
      id: 'evt-04',
      schoolId: school.id,
      title: 'National Science Day Science Exhibition & AI Hackathon',
      description: '24-hour student hackathon solving real-world challenges using edge AI and robotics.',
      venue: 'Innovation & Robotics Lab 3',
      startDate: new Date('2027-02-28T08:00:00.000Z'),
      endDate: new Date('2027-03-01T14:00:00.000Z'),
      audience: 'ALL',
      isPublic: true,
    },
  });

  // 18. Fee Structures, Invoices, and Payments (5 Canonical Invoices)
  const grade10Cls = await prisma.class.findFirst({ where: { schoolId: school.id, code: 'G10' } });
  if (grade10Cls) {
    const fsTuition = await prisma.feeStructure.upsert({
      where: { id: 'fs-g10-tui' },
      update: {},
      create: {
        id: 'fs-g10-tui',
        schoolId: school.id,
        classId: grade10Cls.id,
        feeHead: 'Secondary Tuition & Academic Development',
        amount: 35000,
        frequency: 'TERM',
      },
    });

    await prisma.feeStructure.upsert({
      where: { id: 'fs-g10-lab' },
      update: {},
      create: {
        id: 'fs-g10-lab',
        schoolId: school.id,
        classId: grade10Cls.id,
        feeHead: 'Science & Robotics Laboratory Facility',
        amount: 10000,
        frequency: 'TERM',
      },
    });

    if (aaravProfile) {
      const invAarav = await prisma.feeInvoice.upsert({
        where: { invoiceNumber: 'INV-2026-0412' },
        update: {},
        create: {
          id: 'inv-aarav-01',
          feeStructureId: fsTuition.id,
          studentProfileId: aaravProfile.id,
          invoiceNumber: 'INV-2026-0412',
          amountDue: 45000,
          amountPaid: 45000,
          dueDate: new Date('2026-10-15'),
          status: FeePaymentStatus.PAID,
        },
      });

      await prisma.feePayment.upsert({
        where: { receiptNumber: 'REC-2026-4011' },
        update: {},
        create: {
          id: 'pay-01',
          feeInvoiceId: invAarav.id,
          receiptNumber: 'REC-2026-4011',
          amountPaid: 45000,
          paymentMethod: 'UPI',
          transactionRef: 'UPI-SIM-98214-OKAXIS',
          isSimulated: true,
          collectedBy: userMap['accounts@apexacademy.edu']?.user.id,
          paidAt: new Date('2026-10-15T10:45:00.000Z'),
        },
      });
    }

    if (ananyaProfile) {
      const invAnanya = await prisma.feeInvoice.upsert({
        where: { invoiceNumber: 'INV-2026-0413' },
        update: {},
        create: {
          id: 'inv-ananya-02',
          feeStructureId: fsTuition.id,
          studentProfileId: ananyaProfile.id,
          invoiceNumber: 'INV-2026-0413',
          amountDue: 45000,
          amountPaid: 20000,
          dueDate: new Date('2026-10-15'),
          status: FeePaymentStatus.PARTIALLY_PAID,
        },
      });

      await prisma.feePayment.upsert({
        where: { receiptNumber: 'REC-2026-4012' },
        update: {},
        create: {
          id: 'pay-02',
          feeInvoiceId: invAnanya.id,
          receiptNumber: 'REC-2026-4012',
          amountPaid: 20000,
          paymentMethod: 'NET_BANKING',
          transactionRef: 'NB-HDFC-88123-SIM',
          isSimulated: true,
          collectedBy: userMap['accounts@apexacademy.edu']?.user.id,
          paidAt: new Date('2026-10-16T14:30:00.000Z'),
        },
      });
    }

    if (rohanProfile) {
      const invRohan = await prisma.feeInvoice.upsert({
        where: { invoiceNumber: 'INV-2026-0414' },
        update: {},
        create: {
          id: 'inv-rohan-03',
          feeStructureId: fsTuition.id,
          studentProfileId: rohanProfile.id,
          invoiceNumber: 'INV-2026-0414',
          amountDue: 45000,
          amountPaid: 45000,
          dueDate: new Date('2026-10-15'),
          status: FeePaymentStatus.PAID,
        },
      });

      await prisma.feePayment.upsert({
        where: { receiptNumber: 'REC-2026-4013' },
        update: {},
        create: {
          id: 'pay-03',
          feeInvoiceId: invRohan.id,
          receiptNumber: 'REC-2026-4013',
          amountPaid: 45000,
          paymentMethod: 'CREDIT_CARD',
          transactionRef: 'CC-ICICI-49120-SIM',
          isSimulated: true,
          collectedBy: userMap['accounts@apexacademy.edu']?.user.id,
          paidAt: new Date('2026-10-14T11:20:00.000Z'),
        },
      });
    }

    if (meeraProfile) {
      await prisma.feeInvoice.upsert({
        where: { invoiceNumber: 'INV-2026-0415' },
        update: {},
        create: {
          id: 'inv-meera-04',
          feeStructureId: fsTuition.id,
          studentProfileId: meeraProfile.id,
          invoiceNumber: 'INV-2026-0415',
          amountDue: 35000,
          amountPaid: 0,
          dueDate: new Date('2026-10-31'),
          status: FeePaymentStatus.UNPAID,
        },
      });
    }

    if (kabirProfile) {
      const invKabir = await prisma.feeInvoice.upsert({
        where: { invoiceNumber: 'INV-2026-0416' },
        update: {},
        create: {
          id: 'inv-kabir-05',
          feeStructureId: fsTuition.id,
          studentProfileId: kabirProfile.id,
          invoiceNumber: 'INV-2026-0416',
          amountDue: 45000,
          amountPaid: 45000,
          dueDate: new Date('2026-10-15'),
          status: FeePaymentStatus.PAID,
        },
      });

      await prisma.feePayment.upsert({
        where: { receiptNumber: 'REC-2026-4014' },
        update: {},
        create: {
          id: 'pay-04',
          feeInvoiceId: invKabir.id,
          receiptNumber: 'REC-2026-4014',
          amountPaid: 45000,
          paymentMethod: 'UPI',
          transactionRef: 'UPI-SIM-44019-OKSBI',
          isSimulated: true,
          collectedBy: userMap['accounts@apexacademy.edu']?.user.id,
          paidAt: new Date('2026-10-15T09:15:00.000Z'),
        },
      });
    }
  }

  // 19. HR Staff Leave Requests (4 Canonical Records)
  if (teacherStaffProfile) {
    await prisma.staffLeaveRequest.upsert({
      where: { id: 'leave-01' },
      update: {},
      create: {
        id: 'leave-01',
        staffProfileId: teacherStaffProfile.id,
        leaveType: 'SICK_LEAVE',
        startDate: new Date('2026-10-05'),
        endDate: new Date('2026-10-06'),
        reason: 'Viral respiratory infection and doctor-advised rest.',
        status: 'APPROVED',
        approvedBy: userMap['principal@apexacademy.edu']?.user.id,
        approvedAt: new Date('2026-10-05T09:00:00.000Z'),
      },
    });
  }

  const hrStaff = await prisma.staffProfile.findFirst({ where: { employeeId: 'EMP-2026-0005' } });
  if (hrStaff) {
    await prisma.staffLeaveRequest.upsert({
      where: { id: 'leave-02' },
      update: {},
      create: {
        id: 'leave-02',
        staffProfileId: hrStaff.id,
        leaveType: 'CASUAL_LEAVE',
        startDate: new Date('2026-10-12'),
        endDate: new Date('2026-10-12'),
        reason: 'Family urgent matter.',
        status: 'APPROVED',
        approvedBy: userMap['principal@apexacademy.edu']?.user.id,
        approvedAt: new Date('2026-10-11T16:00:00.000Z'),
      },
    });
  }

  const examCoordStaff = await prisma.staffProfile.findFirst({ where: { employeeId: 'EMP-2026-0009' } });
  if (examCoordStaff) {
    await prisma.staffLeaveRequest.upsert({
      where: { id: 'leave-03' },
      update: {},
      create: {
        id: 'leave-03',
        staffProfileId: examCoordStaff.id,
        leaveType: 'DUTY_LEAVE',
        startDate: new Date('2026-10-25'),
        endDate: new Date('2026-10-26'),
        reason: 'CBSE External Center Superintendent inspection committee.',
        status: 'PENDING',
      },
    });
  }

  const accountsStaff = await prisma.staffProfile.findFirst({ where: { employeeId: 'EMP-2026-0008' } });
  if (accountsStaff) {
    await prisma.staffLeaveRequest.upsert({
      where: { id: 'leave-04' },
      update: {},
      create: {
        id: 'leave-04',
        staffProfileId: accountsStaff.id,
        leaveType: 'VACATION_LEAVE',
        startDate: new Date('2026-11-01'),
        endDate: new Date('2026-11-03'),
        reason: 'Out of station personal travel during month-end audit.',
        status: 'REJECTED',
        approvedBy: userMap['principal@apexacademy.edu']?.user.id,
        approvedAt: new Date('2026-10-20T11:00:00.000Z'),
      },
    });
  }

  // 19. In-app Notifications
  const aaravUser = userMap['aarav.sharma@apexacademy.edu']?.user || userMap['aarav.sharma@student.apex.edu']?.user;
  if (aaravUser) {
    await prisma.notification.upsert({
      where: { id: 'notif-01' },
      update: {},
      create: {
        id: 'notif-01',
        schoolId: school.id,
        userId: aaravUser.id,
        title: 'Assignment Evaluated',
        message: 'Dr. Thorne has graded your Electromagnetism Solenoid submission: 19/20.',
        type: 'ACADEMIC',
        link: '/student/assignments',
        isRead: false,
      },
    });
  }

  const parentUser = userMap['sunil.sharma@parent.apex.edu']?.user;
  if (parentUser) {
    await prisma.notification.upsert({
      where: { id: 'notif-02' },
      update: {},
      create: {
        id: 'notif-02',
        schoolId: school.id,
        userId: parentUser.id,
        title: 'Term 2 Fee Receipt Generated',
        message: 'Official receipt REC-2026-4011 generated for Aarav Sharma (₹ 45,000).',
        type: 'FEE',
        link: '/parent/fees',
        isRead: false,
      },
    });
  }

  console.log('🎉 Complete institutional database seeding finished successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
