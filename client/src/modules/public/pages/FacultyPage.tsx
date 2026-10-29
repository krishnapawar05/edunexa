import React from 'react';
import { Award, Mail, Phone, BookOpen, GraduationCap, ShieldCheck } from 'lucide-react';
import { useSchoolBranding } from '../../../context/SchoolBrandingContext.js';

export const FacultyPage: React.FC = () => {
  const { branding } = useSchoolBranding();

  const facultyMembers = [
    {
      name: 'Dr. Alistair Thorne',
      degrees: 'Ph.D. in Applied Physics (IISc)',
      role: 'Principal & Senior Physics Faculty',
      department: 'Department of Physical Sciences',
      specialty: 'Electromagnetism, Quantum Mechanics & Educational Philosophy',
      experience: '24 Years Teaching & Research',
      email: 'a.thorne@apexacademy.edu',
    },
    {
      name: 'Mrs. Rebecca Vance',
      degrees: 'M.Sc. Mathematics (Delhi University), B.Ed.',
      role: 'Head of Mathematics Department',
      department: 'Department of Mathematical Sciences',
      specialty: 'Calculus, Trigonometry & Competitive Olympiad Coaching',
      experience: '18 Years Teaching Experience',
      email: 'r.vance@apexacademy.edu',
    },
    {
      name: 'Ms. Sunita Rao',
      degrees: 'M.Tech. Computer Science & AI (IIT Madras)',
      role: 'ICT Coordinator & AI Lead',
      department: 'Department of Computer Science & AI',
      specialty: 'Data Structures, Python Algorithmic Logic & Robotics Lab',
      experience: '11 Years Industry & Academic Experience',
      email: 's.rao@apexacademy.edu',
    },
    {
      name: 'Mr. Devendra Joshi',
      degrees: 'M.A. History & Political Sciences (JNU)',
      role: 'Senior Humanities Lecturer',
      department: 'Department of Humanities & Social Sciences',
      specialty: 'Modern Constitutional History, Geopolitics & Ethics',
      experience: '16 Years Teaching Experience',
      email: 'd.joshi@apexacademy.edu',
    },
    {
      name: 'Dr. Meera Kulkarni',
      degrees: 'Ph.D. Organic Chemistry, Postdoc (CSIR)',
      role: 'Senior Chemistry Faculty',
      department: 'Department of Physical Sciences',
      specialty: 'Organic Synthesis, Spectroscopy & Laboratory Safety Protocols',
      experience: '14 Years Research & Teaching',
      email: 'm.kulkarni@apexacademy.edu',
    },
    {
      name: 'Mrs. Nandita Sen',
      degrees: 'M.A. English Literature, M.Phil.',
      role: 'Head of Language Studies',
      department: 'Department of Languages & Literature',
      specialty: 'Rhetoric, Post-Colonial Literature, Theater & Debate Guild',
      experience: '19 Years Teaching Experience',
      email: 'n.sen@apexacademy.edu',
    },
  ];

  return (
    <div className="ed-public-container" style={{ padding: 'var(--space-8) 0' }}>
      {/* Title */}
      <div style={{ marginBottom: 'var(--space-8)', textAlign: 'center' }}>
        <span className="ed-badge ed-badge-info" style={{ marginBottom: '8px' }}>ACADEMIC LEADERSHIP</span>
        <h1>Distinguished Faculty & Research Educators</h1>
        <p style={{ color: 'var(--text-muted)', maxWidth: '720px', margin: '8px auto 0', fontSize: '1rem', lineHeight: 1.6 }}>
          Our instructional faculty combines prestigious postgraduate credentials with deep commitment to individualized mentorship and student inquiry.
        </p>
      </div>

      <div className="ed-grid-3">
        {facultyMembers.map((fac, idx) => (
          <div key={idx} className="ed-card ed-card-body" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: 'var(--space-3)' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: 'var(--primary-100)', color: 'var(--primary-800)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.05rem' }}>
                  {fac.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.98rem' }}>{fac.name}</h4>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{fac.degrees}</div>
                </div>
              </div>

              <div style={{ fontSize: '0.78rem', color: 'var(--primary-700)', fontWeight: 600, marginBottom: '6px' }}>
                {fac.role}
              </div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                {fac.department}
              </div>

              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {fac.specialty}
              </p>
            </div>

            <div style={{ marginTop: 'var(--space-4)', borderTop: '1px solid var(--border-default)', paddingTop: 'var(--space-2)', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              <div>Experience: <strong>{fac.experience}</strong></div>
              <div>Contact: <a href={`mailto:${fac.email}`} style={{ color: 'var(--primary-700)', textDecoration: 'none' }}>{fac.email}</a></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
