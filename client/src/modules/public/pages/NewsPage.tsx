import React from 'react';
import { Bell, Award, CheckCircle2, Calendar, FileText, ArrowRight } from 'lucide-react';
import { useSchoolBranding } from '../../../context/SchoolBrandingContext.js';

export const NewsPage: React.FC = () => {
  const { branding } = useSchoolBranding();

  const newsItems = [
    {
      title: 'Apex Academy Achieves 100% Distinction in CBSE Senior Board Results',
      date: 'Oct 12, 2026',
      badge: 'Board Results',
      summary: 'Grade 12 scholars recorded historic scores in Pure Sciences and Mathematics, with 18 students securing full 100/100 scores in Physics and Calculus components.',
    },
    {
      title: 'EduNexa Verifiable QR Student ID Cards Officially Deployed Campus-Wide',
      date: 'Oct 08, 2026',
      badge: 'Institutional Tech',
      summary: 'All enrolled students and instructional staff have been transitioned to ISO CR80 standard digital cards with tamper-proof cryptographic verification tokens.',
    },
    {
      title: 'Senior Secondary Robotics Team Wins National Innovation Laurels',
      date: 'Sep 29, 2026',
      badge: 'Achievement',
      summary: 'Our 4-member student team designed an autonomous agricultural drone with localized soil hydration sensors, securing first place at the All-India STEM Showcase.',
    },
    {
      title: 'Parent-Teacher Consultative Conferences Scheduled for Mid-Term Review',
      date: 'Sep 20, 2026',
      badge: 'Academic Notice',
      summary: 'Individualized 1-on-1 parent consultative meetings will be hosted via the EduNexa portal to review published term marks, attendance percentages, and olympiad tracks.',
    },
  ];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: 'var(--space-8) var(--space-6)' }}>
      {/* Title */}
      <div style={{ marginBottom: 'var(--space-8)', textAlign: 'center' }}>
        <span className="ed-badge ed-badge-info" style={{ marginBottom: '8px' }}>PRESS & NOTICES</span>
        <h1>Institutional News & Announcements</h1>
        <p style={{ color: 'var(--text-muted)', maxWidth: '720px', margin: '8px auto 0', fontSize: '1rem', lineHeight: 1.6 }}>
          Official press releases, student accolades, academic milestones, and board circulars from {branding.schoolName}.
        </p>
      </div>

      <div className="ed-grid-2">
        {newsItems.map((item, idx) => (
          <div key={idx} className="ed-card ed-card-body" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span className="ed-badge ed-badge-neutral">{item.badge}</span>
                <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Calendar size={12} /> {item.date}
                </span>
              </div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '8px' }}>{item.title}</h3>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {item.summary}
              </p>
            </div>
            <div style={{ marginTop: 'var(--space-4)', borderTop: '1px solid var(--border-default)', paddingTop: 'var(--space-3)' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--primary-700)', fontWeight: 600 }}>
                Official Bureau Release • Apex Academy of Sciences
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
