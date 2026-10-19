import React from 'react';
import { Cpu, Atom, Calculator, Globe, Palette, Dumbbell } from 'lucide-react';
import { useSchoolBranding } from '../../../context/SchoolBrandingContext.js';

export const DepartmentsPage: React.FC = () => {
  const { branding } = useSchoolBranding();

  const departments = [
    {
      name: 'Department of Physical Sciences',
      head: 'Dr. Julian Thorne, Ph.D.',
      icon: Atom,
      color: 'var(--primary-600)',
      description: 'Covers classical kinematics, electromagnetism, wave optics, modern physics, and chemical thermodynamics with integrated experimental laboratories.',
      courses: ['Physics Core (Grade 9–10)', 'Advanced Physics (Grade 11–12)', 'Chemistry Lab & Theory'],
    },
    {
      name: 'Department of Mathematical Sciences',
      head: 'Mrs. Rebecca Vance, M.Sc.',
      icon: Calculator,
      color: 'var(--teal-accent)',
      description: 'Rigorous curriculum across algebra, trigonometry, differential calculus, vector algebra, and analytical geometry with problem-solving Olympiad circles.',
      courses: ['Secondary Mathematics', 'Senior Secondary Calculus', 'Applied Financial Statistics'],
    },
    {
      name: 'Department of Computer Science & AI',
      head: 'Ms. Sunita Rao, M.Tech.',
      icon: Cpu,
      color: 'var(--brand-blue)',
      description: 'Focuses on Python algorithms, database architecture with SQL, embedded robotics with Raspberry Pi, and safe ethical artificial intelligence principles.',
      courses: ['Introductory ICT', 'Python Core & Data Structures', 'Informatics Practices'],
    },
    {
      name: 'Department of Humanities & Social Sciences',
      head: 'Mr. Devendra Joshi, M.A.',
      icon: Globe,
      color: 'var(--warning-solid)',
      description: 'Engaging curriculum covering contemporary global history, Indian constitutional civics, economic geography, and philosophical ethics dialogues.',
      courses: ['History & Civics', 'Economic Development', 'Social Inquiry Seminars'],
    },
    {
      name: 'Department of Languages & Literature',
      head: 'Mrs. Nandita Sen, M.A. M.Phil.',
      icon: Palette,
      color: 'var(--primary-700)',
      description: 'Literary analysis, creative writing, rhetoric, elocution, theater arts, and comprehensive linguistic communication in English and Hindi.',
      courses: ['English Language & Literature', 'Communicative Rhetoric', 'Creative Writing Club'],
    },
    {
      name: 'Department of Athletics & Physical Wellbeing',
      head: 'Coach R. K. Nair',
      icon: Dumbbell,
      color: 'var(--success-solid)',
      description: 'Holistic physical conditioning, competitive track and field, basketball, badminton, cricket coaching, and sports nutrition workshops.',
      courses: ['Physical Education', 'Athletics & Team Sports', 'Yoga & Posture Wellness'],
    },
  ];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: 'var(--space-8) var(--space-6)' }}>
      {/* Title */}
      <div style={{ marginBottom: 'var(--space-8)', textAlign: 'center' }}>
        <span className="ed-badge ed-badge-info" style={{ marginBottom: '8px' }}>ACADEMIC DIVISIONS</span>
        <h1>Instructional Departments & Research Labs</h1>
        <p style={{ color: 'var(--text-muted)', maxWidth: '720px', margin: '8px auto 0', fontSize: '1rem', lineHeight: 1.6 }}>
          Each department is led by experienced faculty members holding advanced postgraduate and doctoral credentials.
        </p>
      </div>

      {/* Grid */}
      <div className="ed-grid-2">
        {departments.map((dept, idx) => {
          const Icon = dept.icon;
          return (
            <div key={idx} className="ed-card ed-card-body" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: 'var(--space-2)' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: dept.color }}>
                    <Icon size={20} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', margin: 0 }}>{dept.name}</h3>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Head: {dept.head}</div>
                  </div>
                </div>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginTop: '8px' }}>
                  {dept.description}
                </p>
              </div>

              <div style={{ marginTop: 'var(--space-4)', borderTop: '1px solid var(--border-default)', paddingTop: 'var(--space-3)' }}>
                <div style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>KEY COURSES OFFERED:</div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {dept.courses.map((course, cIdx) => (
                    <span key={cIdx} className="ed-badge ed-badge-neutral" style={{ fontSize: '0.74rem' }}>
                      {course}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
