import { prisma } from '../../config/db.js';
import { AppError } from '../../middleware/errorHandler.js';
import {
  UpdateWebsiteContentDTO,
  CreateHighlightDTO,
  CreateFacilityDTO,
  CreateAchievementDTO,
  CreateTestimonialDTO,
  CreateDocumentDTO,
  CreateGalleryCategoryDTO,
  CreateGalleryItemDTO,
  PublicWebsiteData,
  PlatformRole,
} from '@edunexa/shared';

export class WebsiteService {
  /**
   * Resolves school tenant by identifier (slug, ID, code) or domain host.
   */
  async resolveSchool(identifierOrHost?: string) {
    if (identifierOrHost) {
      // 1. Check direct ID, slug, or code
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

      // 2. Clean host header if port or protocol included (e.g. apex.edu:5173 -> apex.edu)
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

    // Default fallback: return primary school or first active school
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

  /**
   * Ensures default CMS content and gallery albums exist for the school.
   */
  async ensureInitialContent(schoolId: string) {
    // 1. Ensure WebsiteContent record
    let content = await prisma.websiteContent.findUnique({
      where: { schoolId },
    });

    if (!content) {
      content = await prisma.websiteContent.create({
        data: {
          schoolId,
          heroTitle: 'Empowering Future Innovators & Ethical Leaders',
          heroSubtitle: 'CBSE & Cambridge Affiliated Center of Excellence',
          heroDescription:
            'Nurturing critical inquiry, scientific discovery, and global consciousness through holistic pedagogy and world-class campus facilities.',
          heroCtaText: 'Apply for Admissions',
          heroCtaLink: '/admissions',
          heroSecondaryCtaText: 'Explore Campus Life',
          heroSecondaryCtaLink: '/gallery',
          heroImageUrl: '/images/school/hero_classroom.jpg',
          aboutTitle: 'About Our Institution',
          aboutSubtitle: 'A Legacy of Academic Rigor & Ethical Foundation',
          aboutDescription:
            'Founded on the pillars of intellectual integrity, scientific innovation, and community stewardship, our institution provides comprehensive K-12 education combining CBSE standards with global inquiry.',
          aboutPhilosophy:
            'We foster a student-centered ecosystem where analytical inquiry meets empathetic action. Every student is guided to achieve holistic personal excellence.',
          aboutHistory:
            'Established in 1998, the school has evolved from a pioneering regional academy to a nationally celebrated center for secondary education, STEM research, and athletic achievement.',
          aboutImageUrl: '/images/school/campus_building.jpg',
          principalName: 'Dr. Alistair Thorne',
          principalDesignation: 'Principal & Academic Director',
          principalMessage:
            'Welcome to an environment where curiosity is celebrated and character is forged. In an era of rapid technological acceleration, we anchor students in foundational scientific literacy, creative expression, and enduring ethical values.',
          principalPhotoUrl: '/images/school/school_assembly.jpg',
          visionTitle: 'Our Vision',
          visionDescription:
            'To be a benchmarked citadel of holistic learning, producing visionary thinkers, ethical innovators, and compassionate global changemakers.',
          missionTitle: 'Our Mission',
          missionDescription:
            'Cultivating intellect through inquiry-driven pedagogy, state-of-the-art laboratory infrastructure, and values-centered mentoring.',
          smartClassroomsHeading: 'Smart Classrooms & STEM Labs',
          smartClassroomsDescription:
            'Interactive digital display boards, AI workstations, and robotics prototyping kits empowering experiential discovery.',
          smartClassroomsImageUrl: '/images/school/computer_lab.jpg',
          sportsActivitiesHeading: 'Athletics, Performing Arts & Culture',
          sportsActivitiesDescription:
            'All-weather synthetic running tracks, Olympic-standard courts, and multi-disciplinary music and theatre amphitheatres.',
          sportsActivitiesImageUrl: '/images/school/sports_ground.jpg',
          admissionHeading: 'Admissions Open 2026–2027',
          admissionDescription:
            'Accepting applications for Pre-Primary through Grade 11. Limited seats available per section to ensure personalized faculty attention.',
          admissionImageUrl: '/images/school/science_lab.jpg',
          admissionFormTitle: 'Official Admission Application Form 2026-27',
          admissionFormDescription:
            'Download the official PDF admission form. Complete and submit at the admissions desk along with required academic records.',
          admissionFormUrl: '/forms/edunexa_admission_form_2026.pdf',
          officeTimings: 'Monday - Saturday: 8:00 AM - 4:00 PM',
          mapEmbedUrl: 'https://maps.google.com/maps?q=New%20Delhi%20Institutional%20Area&t=&z=13&ie=UTF8&iwloc=&output=embed',
          sectionVisibility: {
            hero: true,
            about: true,
            principal: true,
            whyChooseUs: true,
            academics: true,
            facilities: true,
            smartClassrooms: true,
            sportsActivities: true,
            faculty: true,
            achievements: true,
            news: true,
            events: true,
            testimonials: true,
            gallery: true,
            admissionOpen: true,
            downloadForm: true,
            contactLocation: true,
          },
        },
      });
    }

    // 2. Ensure Highlights (Why Choose Us)
    const highlightCount = await prisma.schoolHighlight.count({ where: { schoolId } });
    if (highlightCount === 0) {
      await prisma.schoolHighlight.createMany({
        data: [
          {
            schoolId,
            title: 'Exemplary Academic Rigor',
            description: '100% board clearance rate with over 42% distinctions and state rank placements across CBSE examinations.',
            iconName: 'Award',
            displayOrder: 1,
            isPublished: true,
          },
          {
            schoolId,
            title: 'Distinguished Faculty Mentors',
            description: 'Over 85 certified educators with post-graduate subject mastery and continuous international pedagogic development.',
            iconName: 'GraduationCap',
            displayOrder: 2,
            isPublished: true,
          },
          {
            schoolId,
            title: 'Advanced STEM & AI Facilities',
            description: 'Modern robotics, computational science, and digital design laboratories with one-to-one workstation access.',
            iconName: 'Laptop',
            displayOrder: 3,
            isPublished: true,
          },
          {
            schoolId,
            title: 'Holistic Sports & Performing Arts',
            description: 'Olympic-dimension running track, synthetic basketball courts, and professional vocal, theatrical, and instrumental studios.',
            iconName: 'Trophy',
            displayOrder: 4,
            isPublished: true,
          },
        ],
      });
    }

    // 3. Ensure Facilities
    const facilityCount = await prisma.schoolFacility.count({ where: { schoolId } });
    if (facilityCount === 0) {
      await prisma.schoolFacility.createMany({
        data: [
          {
            schoolId,
            name: 'Dr. Kalam Central Academic Library',
            description: 'Over 28,000 reference volumes, dedicated research carrels, and international scientific journal subscriptions.',
            category: 'Learning Commons',
            imageUrl: '/images/school/library.jpg',
            displayOrder: 1,
            isPublished: true,
          },
          {
            schoolId,
            name: 'Physical & Natural Sciences Laboratories',
            description: 'Precision optical benches, spectrophotometers, and comprehensive apparatus for physics, chemistry, and biology.',
            category: 'Scientific Research',
            imageUrl: '/images/school/science_lab.jpg',
            displayOrder: 2,
            isPublished: true,
          },
          {
            schoolId,
            name: 'Turing Robotics & AI Studio',
            description: '60 high-performance workstations with micro-controller benches, 3D prototyping, and dedicated Python environments.',
            category: 'Technology',
            imageUrl: '/images/school/computer_lab.jpg',
            displayOrder: 3,
            isPublished: true,
          },
          {
            schoolId,
            name: 'Synthetic Athletic Track & Multi-Sports Field',
            description: '400m 8-lane all-weather running track, FIFA-standard turf football pitch, and indoor badminton arena.',
            category: 'Sports & Wellbeing',
            imageUrl: '/images/school/sports_ground.jpg',
            displayOrder: 4,
            isPublished: true,
          },
          {
            schoolId,
            name: 'Tagore Performing Arts Amphitheatre',
            description: '800-seat multi-tier auditorium featuring acoustic diffusion, motorized stage lighting, and orchestral orchestra pit.',
            category: 'Cultural Center',
            imageUrl: '/images/school/cultural_arts.jpg',
            displayOrder: 5,
            isPublished: true,
          },
          {
            schoolId,
            name: 'GPS-Tracked Safe School Fleet',
            description: 'Dedicated air-conditioned transport coaches equipped with speed governors, CCTV cameras, and mobile attendant tracking.',
            category: 'Transportation',
            imageUrl: '/images/school/school_bus.jpg',
            displayOrder: 6,
            isPublished: true,
          },
        ],
      });
    }

    // 4. Ensure Student Achievements
    const achievementCount = await prisma.studentAchievement.count({ where: { schoolId } });
    if (achievementCount === 0) {
      await prisma.studentAchievement.createMany({
        data: [
          {
            schoolId,
            studentName: 'Aarav Sharma & Team',
            title: 'National Gold Medal - Robotics Olympiad',
            description: 'Secured 1st Place nationally in Autonomous Robotic Maze Navigation using AI computer vision algorithms.',
            competition: 'National Science & STEM Innovation Expo',
            academicYear: '2026-2027',
            photoUrl: '/images/school/computer_lab.jpg',
            displayOrder: 1,
            isPublished: true,
          },
          {
            schoolId,
            studentName: 'Ananya Deshmukh',
            title: 'State Mathematics Rank 1',
            description: 'Achieved 100/100 score in the State Level Advanced Calculus & Combinatorics Olympiad.',
            competition: 'State Mathematical Society Championship',
            academicYear: '2026-2027',
            photoUrl: '/images/school/hero_classroom.jpg',
            displayOrder: 2,
            isPublished: true,
          },
          {
            schoolId,
            studentName: 'Rohan Mehta',
            title: 'Junior Athletic Sprint Champion',
            description: 'Record-setting performance in the 400m Senior Boys Inter-District Athletic Championship.',
            competition: 'Inter-District CBSE Athletic Meet',
            academicYear: '2026-2027',
            photoUrl: '/images/school/sports_ground.jpg',
            displayOrder: 3,
            isPublished: true,
          },
        ],
      });
    }

    // 5. Ensure Testimonials
    const testimonialCount = await prisma.parentTestimonial.count({ where: { schoolId } });
    if (testimonialCount === 0) {
      await prisma.parentTestimonial.createMany({
        data: [
          {
            schoolId,
            parentName: 'Mrs. Sunita & Rajesh Verma',
            parentRole: 'Parents of Aarav (Grade 10)',
            content:
              'The transition to EduNexa and Apex Academy has been extraordinary. The blend of rigorous academics, AI-equipped labs, and genuine pastoral care gives us complete confidence in our child’s future.',
            avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200',
            rating: 5,
            displayOrder: 1,
            isPublished: true,
          },
          {
            schoolId,
            parentName: 'Dr. Vivek Ramanathan',
            parentRole: 'Parent of Maya (Grade 8)',
            content:
              'The balance of scientific inquiry and performing arts is unmatched. The teachers truly know each child personally and nurture their unique curiosity with patience and professional skill.',
            avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
            rating: 5,
            displayOrder: 2,
            isPublished: true,
          },
          {
            schoolId,
            parentName: 'Meera & Sanjay Kulkarni',
            parentRole: 'Parents of Rohan (Grade 11)',
            content:
              'The transparent parent communication, instant report cards, and digital fee management make being an involved parent effortless. Highest recommendation to any prospective family.',
            avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
            rating: 5,
            displayOrder: 3,
            isPublished: true,
          },
        ],
      });
    }

    // 6. Ensure Gallery Categories & Items
    const categoryCount = await prisma.galleryCategory.count({ where: { schoolId } });
    if (categoryCount === 0) {
      const catInfra = await prisma.galleryCategory.create({
        data: {
          schoolId,
          slug: 'infrastructure',
          name: 'Campus Infrastructure & Architecture',
          description: 'Explore our expansive academic wings, library, and grounds.',
          coverImageUrl: '/images/school/campus_building.jpg',
          displayOrder: 1,
          isPublished: true,
        },
      });

      const catLabs = await prisma.galleryCategory.create({
        data: {
          schoolId,
          slug: 'science-stem-labs',
          name: 'Science & STEM Laboratories',
          description: 'Hands-on practical investigation in physics, robotics, and biology.',
          coverImageUrl: '/images/school/science_lab.jpg',
          displayOrder: 2,
          isPublished: true,
        },
      });

      const catSports = await prisma.galleryCategory.create({
        data: {
          schoolId,
          slug: 'sports-athletics',
          name: 'Sports & Athletic Championships',
          description: 'All-weather track, team tournaments, and physical fitness.',
          coverImageUrl: '/images/school/sports_ground.jpg',
          displayOrder: 3,
          isPublished: true,
        },
      });

      const catCulture = await prisma.galleryCategory.create({
        data: {
          schoolId,
          slug: 'cultural-performing-arts',
          name: 'Cultural Celebrations & Annual Day',
          description: 'Theatrical productions, instrumental concerts, and annual day galas.',
          coverImageUrl: '/images/school/cultural_arts.jpg',
          displayOrder: 4,
          isPublished: true,
        },
      });

      const catClassroom = await prisma.galleryCategory.create({
        data: {
          schoolId,
          slug: 'classroom-activities',
          name: 'Classroom Activities & Assemblies',
          description: 'Daily student life, morning assemblies, and interactive discussions.',
          coverImageUrl: '/images/school/hero_classroom.jpg',
          displayOrder: 5,
          isPublished: true,
        },
      });

      // Populate Initial Gallery Photos
      await prisma.galleryItem.createMany({
        data: [
          {
            schoolId,
            categoryId: catInfra.id,
            mediaType: 'PHOTO',
            title: 'Central Campus Quadrangle & Academic Wing',
            caption: 'Modern environmentally designed school architecture with abundant natural daylight.',
            mediaUrl: '/images/school/campus_building.jpg',
            thumbnailUrl: '/images/school/campus_building.jpg',
            displayOrder: 1,
            isPublished: true,
          },
          {
            schoolId,
            categoryId: catInfra.id,
            mediaType: 'PHOTO',
            title: 'Dr. Kalam Central Academic Library',
            caption: 'Multi-tier reference repository and dedicated silent study carrels.',
            mediaUrl: '/images/school/library.jpg',
            thumbnailUrl: '/images/school/library.jpg',
            displayOrder: 2,
            isPublished: true,
          },
          {
            schoolId,
            categoryId: catLabs.id,
            mediaType: 'PHOTO',
            title: 'Optics & Mechanics Physical Sciences Lab',
            caption: 'Students conducting advanced spectroscopy and laser dispersion experiments.',
            mediaUrl: '/images/school/science_lab.jpg',
            thumbnailUrl: '/images/school/science_lab.jpg',
            displayOrder: 1,
            isPublished: true,
          },
          {
            schoolId,
            categoryId: catLabs.id,
            mediaType: 'PHOTO',
            title: 'Computational Science & AI Lab',
            caption: 'High-speed fiber connectivity, AI training modules, and Python coding workstations.',
            mediaUrl: '/images/school/computer_lab.jpg',
            thumbnailUrl: '/images/school/computer_lab.jpg',
            displayOrder: 2,
            isPublished: true,
          },
          {
            schoolId,
            categoryId: catSports.id,
            mediaType: 'PHOTO',
            title: 'Synthetic 400m Athletics Track & Turf',
            caption: 'Annual Inter-House Sports Championship 400m sprint heats.',
            mediaUrl: '/images/school/sports_ground.jpg',
            thumbnailUrl: '/images/school/sports_ground.jpg',
            displayOrder: 1,
            isPublished: true,
          },
          {
            schoolId,
            categoryId: catCulture.id,
            mediaType: 'PHOTO',
            title: 'Tagore Annual Cultural Gala & Dance Recital',
            caption: 'Classical Indian dance and dramatic stage performances by Senior Wing students.',
            mediaUrl: '/images/school/cultural_arts.jpg',
            thumbnailUrl: '/images/school/cultural_arts.jpg',
            displayOrder: 1,
            isPublished: true,
          },
          {
            schoolId,
            categoryId: catClassroom.id,
            mediaType: 'PHOTO',
            title: 'Morning Assembly & Value Oath',
            caption: 'Whole-school assembly cultivating mindfulness, community unity, and civic awareness.',
            mediaUrl: '/images/school/school_assembly.jpg',
            thumbnailUrl: '/images/school/school_assembly.jpg',
            displayOrder: 1,
            isPublished: true,
          },
          {
            schoolId,
            categoryId: catClassroom.id,
            mediaType: 'PHOTO',
            title: 'Interactive Collaborative Learning Class',
            caption: 'Peer learning and group problem solving in modern air-conditioned classrooms.',
            mediaUrl: '/images/school/hero_classroom.jpg',
            thumbnailUrl: '/images/school/hero_classroom.jpg',
            displayOrder: 2,
            isPublished: true,
          },
          // Sample Video Records
          {
            schoolId,
            categoryId: catCulture.id,
            mediaType: 'VIDEO',
            title: 'Annual Day 2026: Highlights & Performances',
            caption: 'A comprehensive walkthrough of student performances and academic felicitation.',
            mediaUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&q=80&w=800',
            thumbnailUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&q=80&w=800',
            videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            displayOrder: 1,
            isPublished: true,
          },
          {
            schoolId,
            categoryId: catLabs.id,
            mediaType: 'VIDEO',
            title: 'STEM Innovation & Robotics Showcase',
            caption: 'Student demonstrations of automated robotics and green energy prototypes.',
            mediaUrl: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&q=80&w=800',
            thumbnailUrl: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&q=80&w=800',
            videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            displayOrder: 2,
            isPublished: true,
          },
        ],
      });
    }

    // 7. Ensure Downloadable Documents
    const docCount = await prisma.downloadableDocument.count({ where: { schoolId } });
    if (docCount === 0) {
      await prisma.downloadableDocument.createMany({
        data: [
          {
            schoolId,
            title: 'Official Admission Application Form 2026–2027',
            description: 'Printable application form for Pre-Primary through Grade 11.',
            category: 'ADMISSION_FORM',
            fileUrl: '/forms/edunexa_admission_form_2026.pdf',
            fileSize: '1.2 MB',
            fileType: 'PDF',
            displayOrder: 1,
            isPublished: true,
          },
          {
            schoolId,
            title: 'Comprehensive School Prospectus & Academic Curriculum Guide',
            description: 'Overview of Cambridge and CBSE academic streams, faculty, and campus policy.',
            category: 'PROSPECTUS',
            fileUrl: '/forms/edunexa_admission_form_2026.pdf',
            fileSize: '3.8 MB',
            fileType: 'PDF',
            displayOrder: 2,
            isPublished: true,
          },
          {
            schoolId,
            title: 'Annual Academic Calendar & Term Examination Schedule 2026',
            description: 'Detailed calendar including holiday schedules, term exams, and parent-teacher meets.',
            category: 'CALENDAR',
            fileUrl: '/forms/edunexa_admission_form_2026.pdf',
            fileSize: '850 KB',
            fileType: 'PDF',
            displayOrder: 3,
            isPublished: true,
          },
        ],
      });
    }
  }

  /**
   * Fetch complete public website data for visitors.
   */
  async getPublicWebsiteData(identifierOrHost?: string): Promise<PublicWebsiteData> {
    const school = await this.resolveSchool(identifierOrHost);
    if (!school) {
      throw new AppError('School not found for requested domain or identifier.', 404, 'SCHOOL_NOT_FOUND');
    }

    // Ensure content exists
    await this.ensureInitialContent(school.id);

    // Concurrently fetch all published sections
    const [
      content,
      highlights,
      facilities,
      classes,
      teachers,
      events,
      notices,
      achievements,
      testimonials,
      galleryPhotos,
      galleryVideos,
      documents,
    ] = await Promise.all([
      prisma.websiteContent.findUnique({ where: { schoolId: school.id } }),
      prisma.schoolHighlight.findMany({
        where: { schoolId: school.id, isPublished: true },
        orderBy: { displayOrder: 'asc' },
      }),
      prisma.schoolFacility.findMany({
        where: { schoolId: school.id, isPublished: true },
        orderBy: { displayOrder: 'asc' },
      }),
      prisma.class.findMany({
        where: { schoolId: school.id },
        include: { sections: true },
        orderBy: { name: 'asc' },
      }),
      prisma.userMembership.findMany({
        where: { schoolId: school.id, role: PlatformRole.TEACHER },
        include: { user: true },
        take: 8,
      }),
      prisma.schoolEvent.findMany({
        where: { schoolId: school.id, startDate: { gte: new Date(Date.now() - 7 * 24 * 3600 * 1000) } },
        orderBy: { startDate: 'asc' },
        take: 4,
      }),
      prisma.notice.findMany({
        where: { schoolId: school.id, audience: 'ALL' },
        orderBy: { publishedAt: 'desc' },
        take: 6,
      }),
      prisma.studentAchievement.findMany({
        where: { schoolId: school.id, isPublished: true },
        orderBy: { displayOrder: 'asc' },
      }),
      prisma.parentTestimonial.findMany({
        where: { schoolId: school.id, isPublished: true },
        orderBy: { displayOrder: 'asc' },
      }),
      prisma.galleryItem.findMany({
        where: { schoolId: school.id, mediaType: 'PHOTO', isPublished: true },
        include: { category: true },
        orderBy: { displayOrder: 'asc' },
        take: 8,
      }),
      prisma.galleryItem.findMany({
        where: { schoolId: school.id, mediaType: 'VIDEO', isPublished: true },
        include: { category: true },
        orderBy: { displayOrder: 'asc' },
        take: 4,
      }),
      prisma.downloadableDocument.findMany({
        where: { schoolId: school.id, isPublished: true },
        orderBy: { displayOrder: 'asc' },
      }),
    ]);

    // Format public academic programs
    const academicPrograms = classes.map((c) => ({
      id: c.id,
      name: c.name,
      code: c.code,
      stage: c.stage || 'General Academic',
      sectionCount: c.sections.length,
    }));

    // Format public faculty profiles
    const faculty = teachers.map((m) => ({
      id: m.id,
      name: `${m.user.firstName} ${m.user.lastName}`.trim(),
      email: m.user.email,
      designation: 'Senior Faculty Educator',
      department: 'Academic Faculty',
      qualification: 'M.Sc., B.Ed., National Teaching Fellow',
      bio: 'Dedicated educator passionate about inquiry-based learning, cognitive development, and student mentoring.',
      photoUrl: m.user.avatarUrl || '/images/school/hero_classroom.jpg',
    }));

    // Format events
    const formattedEvents = events.map((e) => ({
      id: e.id,
      title: e.title,
      description: e.description,
      startDate: e.startDate.toISOString(),
      endDate: e.endDate.toISOString(),
      location: e.venue || 'Campus Auditorium',
      category: e.audience,
      bannerUrl: '/images/school/cultural_arts.jpg',
    }));

    // Format notices
    const formattedNotices = notices.map((n) => ({
      id: n.id,
      title: n.title,
      content: n.content,
      priority: n.isUrgent ? 'URGENT' : 'NORMAL',
      category: n.audience,
      publishedAt: n.publishedAt.toISOString().split('T')[0],
    }));

    return {
      school: {
        id: school.id,
        slug: school.slug,
        name: school.name,
        code: school.code,
        logoUrl: school.logoUrl,
        motto: school.motto,
        email: school.email,
        phone: school.phone,
        address: school.address,
        city: school.city,
        state: school.state,
        postalCode: school.postalCode,
        country: school.country,
        websiteUrl: school.websiteUrl,
        brandingConfig: school.brandingConfig,
        establishedYear: school.establishedYear,
      },
      content: content || {},
      highlights,
      facilities,
      academicPrograms,
      faculty,
      upcomingEvents: formattedEvents,
      latestNotices: formattedNotices,
      achievements,
      testimonials,
      galleryPreview: {
        photos: galleryPhotos,
        videos: galleryVideos,
      },
      downloadableDocs: documents,
    };
  }

  /**
   * Retrieve full CMS dataset for School Admin.
   */
  async getAdminWebsiteData(schoolId: string) {
    await this.ensureInitialContent(schoolId);

    const [
      school,
      content,
      highlights,
      facilities,
      achievements,
      testimonials,
      documents,
      categories,
      items,
    ] = await Promise.all([
      prisma.school.findUnique({ where: { id: schoolId } }),
      prisma.websiteContent.findUnique({ where: { schoolId } }),
      prisma.schoolHighlight.findMany({ where: { schoolId }, orderBy: { displayOrder: 'asc' } }),
      prisma.schoolFacility.findMany({ where: { schoolId }, orderBy: { displayOrder: 'asc' } }),
      prisma.studentAchievement.findMany({ where: { schoolId }, orderBy: { displayOrder: 'asc' } }),
      prisma.parentTestimonial.findMany({ where: { schoolId }, orderBy: { displayOrder: 'asc' } }),
      prisma.downloadableDocument.findMany({ where: { schoolId }, orderBy: { displayOrder: 'asc' } }),
      prisma.galleryCategory.findMany({
        where: { schoolId },
        include: { _count: { select: { items: true } } },
        orderBy: { displayOrder: 'asc' },
      }),
      prisma.galleryItem.findMany({
        where: { schoolId },
        include: { category: true },
        orderBy: { displayOrder: 'asc' },
      }),
    ]);

    return {
      school,
      content,
      highlights,
      facilities,
      achievements,
      testimonials,
      documents,
      categories,
      items,
    };
  }

  /**
   * Update WebsiteContent sections.
   */
  async updateWebsiteContent(schoolId: string, data: any) {
    const payload = { ...data };
    if (payload.aboutStory && !payload.aboutDescription) {
      payload.aboutDescription = payload.aboutStory;
    }
    delete payload.aboutStory;
    delete payload.admissionNoticeOpen;
    delete payload.admissionSession;

    const updated = await prisma.websiteContent.upsert({
      where: { schoolId },
      update: payload,
      create: {
        schoolId,
        ...payload,
      },
    });

    return {
      ...updated,
      aboutStory: updated.aboutDescription,
    };
  }

  /**
   * Update School Branding (Name, Logo, Colors, Contact Info).
   */
  async updateSchoolBranding(schoolId: string, data: any) {
    const updateData: any = {};
    if (data.name) updateData.name = data.name;
    if (data.motto !== undefined) updateData.motto = data.motto;
    if (data.email) updateData.email = data.email;
    if (data.phone) updateData.phone = data.phone;
    if (data.address) updateData.address = data.address;
    if (data.logoUrl !== undefined) updateData.logoUrl = data.logoUrl;
    if (data.websiteUrl !== undefined) updateData.websiteUrl = data.websiteUrl;
    if (data.brandingConfig !== undefined) updateData.brandingConfig = data.brandingConfig;

    return prisma.school.update({
      where: { id: schoolId },
      data: updateData,
    });
  }

  // ==========================================================================
  // HIGHLIGHTS (Why Choose Us)
  // ==========================================================================

  async createHighlight(schoolId: string, data: CreateHighlightDTO) {
    return prisma.schoolHighlight.create({
      data: {
        schoolId,
        ...data,
      },
    });
  }

  async updateHighlight(schoolId: string, id: string, data: Partial<CreateHighlightDTO>) {
    const item = await prisma.schoolHighlight.findFirst({ where: { id, schoolId } });
    if (!item) throw new AppError('Highlight not found.', 404, 'NOT_FOUND');
    return prisma.schoolHighlight.update({ where: { id }, data });
  }

  async deleteHighlight(schoolId: string, id: string) {
    const item = await prisma.schoolHighlight.findFirst({ where: { id, schoolId } });
    if (!item) throw new AppError('Highlight not found.', 404, 'NOT_FOUND');
    return prisma.schoolHighlight.delete({ where: { id } });
  }

  // ==========================================================================
  // FACILITIES (Campus & Infrastructure)
  // ==========================================================================

  async createFacility(schoolId: string, data: CreateFacilityDTO) {
    return prisma.schoolFacility.create({
      data: {
        schoolId,
        ...data,
      },
    });
  }

  async updateFacility(schoolId: string, id: string, data: Partial<CreateFacilityDTO>) {
    const item = await prisma.schoolFacility.findFirst({ where: { id, schoolId } });
    if (!item) throw new AppError('Facility not found.', 404, 'NOT_FOUND');
    return prisma.schoolFacility.update({ where: { id }, data });
  }

  async deleteFacility(schoolId: string, id: string) {
    const item = await prisma.schoolFacility.findFirst({ where: { id, schoolId } });
    if (!item) throw new AppError('Facility not found.', 404, 'NOT_FOUND');
    return prisma.schoolFacility.delete({ where: { id } });
  }

  // ==========================================================================
  // STUDENT ACHIEVEMENTS
  // ==========================================================================

  async createAchievement(schoolId: string, data: CreateAchievementDTO) {
    return prisma.studentAchievement.create({
      data: {
        schoolId,
        ...data,
      },
    });
  }

  async updateAchievement(schoolId: string, id: string, data: Partial<CreateAchievementDTO>) {
    const item = await prisma.studentAchievement.findFirst({ where: { id, schoolId } });
    if (!item) throw new AppError('Achievement not found.', 404, 'NOT_FOUND');
    return prisma.studentAchievement.update({ where: { id }, data });
  }

  async deleteAchievement(schoolId: string, id: string) {
    const item = await prisma.studentAchievement.findFirst({ where: { id, schoolId } });
    if (!item) throw new AppError('Achievement not found.', 404, 'NOT_FOUND');
    return prisma.studentAchievement.delete({ where: { id } });
  }

  // ==========================================================================
  // PARENT TESTIMONIALS
  // ==========================================================================

  async createTestimonial(schoolId: string, data: CreateTestimonialDTO) {
    return prisma.parentTestimonial.create({
      data: {
        schoolId,
        ...data,
      },
    });
  }

  async updateTestimonial(schoolId: string, id: string, data: Partial<CreateTestimonialDTO>) {
    const item = await prisma.parentTestimonial.findFirst({ where: { id, schoolId } });
    if (!item) throw new AppError('Testimonial not found.', 404, 'NOT_FOUND');
    return prisma.parentTestimonial.update({ where: { id }, data });
  }

  async deleteTestimonial(schoolId: string, id: string) {
    const item = await prisma.parentTestimonial.findFirst({ where: { id, schoolId } });
    if (!item) throw new AppError('Testimonial not found.', 404, 'NOT_FOUND');
    return prisma.parentTestimonial.delete({ where: { id } });
  }

  // ==========================================================================
  // DOWNLOADABLE DOCUMENTS
  // ==========================================================================

  async createDocument(schoolId: string, data: CreateDocumentDTO) {
    return prisma.downloadableDocument.create({
      data: {
        schoolId,
        ...data,
      },
    });
  }

  async updateDocument(schoolId: string, id: string, data: Partial<CreateDocumentDTO>) {
    const item = await prisma.downloadableDocument.findFirst({ where: { id, schoolId } });
    if (!item) throw new AppError('Document not found.', 404, 'NOT_FOUND');
    return prisma.downloadableDocument.update({ where: { id }, data });
  }

  async deleteDocument(schoolId: string, id: string) {
    const item = await prisma.downloadableDocument.findFirst({ where: { id, schoolId } });
    if (!item) throw new AppError('Document not found.', 404, 'NOT_FOUND');
    return prisma.downloadableDocument.delete({ where: { id } });
  }

  // ==========================================================================
  // GALLERY CATEGORIES & ITEMS
  // ==========================================================================

  async getGalleryCategories(schoolId: string, publicOnly = true) {
    return prisma.galleryCategory.findMany({
      where: {
        schoolId,
        ...(publicOnly ? { isPublished: true } : {}),
      },
      include: {
        _count: {
          select: {
            items: publicOnly ? { where: { isPublished: true } } : true,
          },
        },
      },
      orderBy: { displayOrder: 'asc' },
    });
  }

  async getGalleryItems(
    schoolId: string,
    params: {
      categorySlug?: string;
      categoryId?: string;
      mediaType?: string;
      page?: number;
      limit?: number;
      publicOnly?: boolean;
    } = {}
  ) {
    const { categorySlug, mediaType, page = 1, limit = 20, publicOnly = true } = params;

    let categoryId: string | undefined = params.categoryId;
    if (!categoryId && categorySlug && categorySlug !== 'all') {
      const cat = await prisma.galleryCategory.findFirst({
        where: {
          schoolId,
          OR: [{ slug: categorySlug }, { id: categorySlug }],
        },
      });
      if (cat) categoryId = cat.id;
    }

    const where: any = {
      schoolId,
      ...(publicOnly ? { isPublished: true } : {}),
      ...(categoryId ? { categoryId } : {}),
      ...(mediaType && mediaType !== 'ALL' ? { mediaType } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.galleryItem.findMany({
        where,
        include: { category: true },
        orderBy: { displayOrder: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.galleryItem.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async createGalleryCategory(schoolId: string, data: CreateGalleryCategoryDTO) {
    // Check slug uniqueness within school
    const existing = await prisma.galleryCategory.findUnique({
      where: { schoolId_slug: { schoolId, slug: data.slug } },
    });
    if (existing) {
      throw new AppError(`Category slug '${data.slug}' already exists for this school.`, 409, 'SLUG_CONFLICT');
    }

    return prisma.galleryCategory.create({
      data: {
        schoolId,
        ...data,
      },
    });
  }

  async updateGalleryCategory(schoolId: string, id: string, data: Partial<CreateGalleryCategoryDTO>) {
    const cat = await prisma.galleryCategory.findFirst({ where: { id, schoolId } });
    if (!cat) throw new AppError('Gallery category not found.', 404, 'NOT_FOUND');
    return prisma.galleryCategory.update({ where: { id }, data: data as any });
  }

  async deleteGalleryCategory(schoolId: string, id: string) {
    const cat = await prisma.galleryCategory.findFirst({ where: { id, schoolId } });
    if (!cat) throw new AppError('Gallery category not found.', 404, 'NOT_FOUND');
    return prisma.galleryCategory.delete({ where: { id } });
  }

  async createGalleryItem(schoolId: string, data: CreateGalleryItemDTO) {
    const cat = await prisma.galleryCategory.findFirst({
      where: { id: data.categoryId, schoolId },
    });
    if (!cat) throw new AppError('Selected category does not exist in this school tenant.', 404, 'CATEGORY_NOT_FOUND');

    const mediaUrl = data.mediaUrl || data.videoUrl || data.thumbnailUrl || '/images/school/hero_classroom.jpg';
    const mediaType = data.mediaType === 'IMAGE' ? 'PHOTO' : data.mediaType;

    return prisma.galleryItem.create({
      data: {
        schoolId,
        ...data,
        mediaUrl,
        mediaType,
      },
    });
  }

  async updateGalleryItem(schoolId: string, id: string, data: Partial<CreateGalleryItemDTO>) {
    const item = await prisma.galleryItem.findFirst({ where: { id, schoolId } });
    if (!item) throw new AppError('Gallery item not found.', 404, 'NOT_FOUND');
    return prisma.galleryItem.update({ where: { id }, data: data as any });
  }

  async deleteGalleryItem(schoolId: string, id: string) {
    const item = await prisma.galleryItem.findFirst({ where: { id, schoolId } });
    if (!item) throw new AppError('Gallery item not found.', 404, 'NOT_FOUND');
    return prisma.galleryItem.delete({ where: { id } });
  }
}

export const websiteService = new WebsiteService();
