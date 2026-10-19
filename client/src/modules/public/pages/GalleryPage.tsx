import React from 'react';
import { Camera, Layers, Award, Sparkles, Building2 } from 'lucide-react';
import { useSchoolBranding } from '../../../context/SchoolBrandingContext.js';

export const GalleryPage: React.FC = () => {
  const { branding } = useSchoolBranding();

  const facilities = [
    {
      title: 'Advanced Physical Sciences & Optics Laboratory',
      category: 'Research Facilities',
      tag: 'Secondary & Senior Wing',
      description: 'Equipped with digital sensor arrays, spectroscopy benches, and electromagnetic test circuits.',
    },
    {
      title: 'Turing Robotics & Computational AI Studio',
      category: 'Technology Center',
      tag: 'STEM Innovation',
      description: '60 high-performance workstations with micro-controller benches, 3D prototyping, and Python environments.',
    },
    {
      title: 'Dr. Kalam Central Academic Library',
      category: 'Learning Commons',
      tag: '28,000 Volumes',
      description: 'Quiet research carrels, digital repository access, and peer-reviewed scientific subscriptions.',
    },
    {
      title: 'Olympic-Standard Synthetic Athletic Track & Sports Field',
      category: 'Sports & Wellbeing',
      tag: 'Outdoor Athletics',
      description: '400m 8-lane all-weather running track, FIFA-standard turf football field, and basketball courts.',
    },
    {
      title: 'Tagore Performing Arts Auditorium & Amphitheater',
      category: 'Cultural Center',
      tag: '800 Seats',
      description: 'Acoustically treated auditorium with digital stage lighting for theater, model UN, and musical performances.',
    },
    {
      title: 'Smart Interactive Classrooms & Discussion Hubs',
      category: 'Instructional Spaces',
      tag: 'Hybrid Learning',
      description: 'Ergonomic modular seating, interactive multi-touch displays, and high-speed institutional Wi-Fi.',
    },
  ];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: 'var(--space-8) var(--space-6)' }}>
      {/* Title */}
      <div style={{ marginBottom: 'var(--space-8)', textAlign: 'center' }}>
        <span className="ed-badge ed-badge-info" style={{ marginBottom: '8px' }}>CAMPUS LIFE</span>
        <h1>Campus Infrastructure & Learning Spaces</h1>
        <p style={{ color: 'var(--text-muted)', maxWidth: '720px', margin: '8px auto 0', fontSize: '1rem', lineHeight: 1.6 }}>
          Explore world-class academic laboratories, sports facilities, digital libraries, and cultural venues at {branding.schoolName}.
        </p>
      </div>

      <div className="ed-grid-3">
        {facilities.map((fac, idx) => (
          <div key={idx} className="ed-card" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div
              style={{
                height: '160px',
                backgroundColor: 'var(--bg-subtle)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                borderBottom: '1px solid var(--border-default)',
                color: 'var(--primary-700)',
                position: 'relative',
              }}
            >
              <Building2 size={40} style={{ opacity: 0.6, marginBottom: '6px' }} />
              <span className="ed-badge ed-badge-neutral" style={{ fontSize: '0.72rem' }}>{fac.category}</span>
            </div>

            <div className="ed-card-body" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <span className="ed-badge ed-badge-info" style={{ fontSize: '0.68rem', marginBottom: '6px' }}>{fac.tag}</span>
                <h4 style={{ fontSize: '1rem', marginBottom: '6px' }}>{fac.title}</h4>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {fac.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
