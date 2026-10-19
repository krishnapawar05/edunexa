import React from 'react';
import { Calendar, Clock, MapPin, Award, Users, ArrowRight } from 'lucide-react';
import { useSchoolBranding } from '../../../context/SchoolBrandingContext.js';

export const EventsPage: React.FC = () => {
  const { branding } = useSchoolBranding();

  const events = [
    {
      title: 'Inter-School STEM & Robotics Symposium 2026',
      date: 'Oct 28, 2026',
      time: '09:00 AM – 04:30 PM',
      venue: 'Turing Technology Center & Main Auditorium',
      category: 'Academic & STEM',
      description: 'Regional competition bringing together 24 secondary schools for autonomous robotics navigation, renewable energy prototyping, and algorithmic problem solving.',
    },
    {
      title: 'Annual Science Fair & Research Poster Exhibition',
      date: 'Nov 14, 2026',
      time: '10:00 AM – 03:00 PM',
      venue: 'Campus Central Quad & Science Atrium',
      category: 'Exhibition',
      description: 'Student-led demonstrations of electromagnetic devices, organic soil chemistry assays, and AI image classification models judged by university faculty.',
    },
    {
      title: 'Senior Secondary Career & Higher Education Conclave',
      date: 'Nov 22, 2026',
      time: '02:00 PM – 06:00 PM',
      venue: 'Conference Hall A & Multi-Purpose Studio',
      category: 'Career Guidance',
      description: 'Interactive workshops with admissions deans from top engineering, medical, liberal arts, and international universities.',
    },
    {
      title: 'Annual Inter-House Athletics & Track Meet',
      date: 'Dec 05, 2026',
      time: '08:00 AM – 02:00 PM',
      venue: 'Apex Academy Olympic Synthetic Track',
      category: 'Sports & Wellbeing',
      description: 'Track and field championships, relay races, long jump, shot put, and inter-house trophy presentation ceremony.',
    },
  ];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: 'var(--space-8) var(--space-6)' }}>
      {/* Title */}
      <div style={{ marginBottom: 'var(--space-8)', textAlign: 'center' }}>
        <span className="ed-badge ed-badge-info" style={{ marginBottom: '8px' }}>CAMPUS CALENDAR</span>
        <h1>Upcoming Institutional Events</h1>
        <p style={{ color: 'var(--text-muted)', maxWidth: '720px', margin: '8px auto 0', fontSize: '1rem', lineHeight: 1.6 }}>
          Explore key academic conferences, science symposiums, cultural celebrations, and athletic tournaments at {branding.schoolName}.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {events.map((ev, idx) => (
          <div key={idx} className="ed-card ed-card-body" style={{ display: 'flex', gap: 'var(--space-6)', alignItems: 'center', flexWrap: 'wrap' }}>
            <div
              style={{
                width: '110px',
                padding: '12px',
                backgroundColor: 'var(--primary-50)',
                borderRadius: 'var(--radius-sm)',
                textAlign: 'center',
                flexShrink: 0,
                border: '1px solid var(--primary-200, #99f6e4)',
              }}
            >
              <Calendar size={20} style={{ color: 'var(--primary-700)', margin: '0 auto 4px' }} />
              <div style={{ fontWeight: 800, fontSize: '0.98rem', color: 'var(--primary-800)' }}>
                {ev.date.split(',')[0]}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>2026</div>
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span className="ed-badge ed-badge-info" style={{ fontSize: '0.70rem' }}>{ev.category}</span>
                <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={12} /> {ev.time}
                </span>
                <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <MapPin size={12} /> {ev.venue}
                </span>
              </div>

              <h3 style={{ fontSize: '1.15rem', marginBottom: '6px' }}>{ev.title}</h3>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                {ev.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
