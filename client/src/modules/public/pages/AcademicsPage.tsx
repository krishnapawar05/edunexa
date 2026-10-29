import React from 'react';
import { BookOpen, Award, CheckCircle2, Layers, Cpu, Compass } from 'lucide-react';
import { useSchoolBranding } from '../../../context/SchoolBrandingContext.js';

export const AcademicsPage: React.FC = () => {
  const { branding } = useSchoolBranding();

  return (
    <div className="ed-public-container" style={{ padding: 'var(--space-8) 0' }}>
      {/* Title */}
      <div style={{ marginBottom: 'var(--space-8)', textAlign: 'center' }}>
        <span className="ed-badge ed-badge-info" style={{ marginBottom: '8px' }}>CURRICULUM & STANDARDS</span>
        <h1>Academic Programs & Syllabus Framework</h1>
        <p style={{ color: 'var(--text-muted)', maxWidth: '720px', margin: '8px auto 0', fontSize: '1rem', lineHeight: 1.6 }}>
          Structured learning pathways affiliated with CBSE, emphasizing experiential discovery, laboratory practice, and analytical mastery.
        </p>
      </div>

      {/* Program Wings */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', marginBottom: 'var(--space-10)' }}>
        {/* Primary Wing */}
        <div className="ed-card ed-card-body">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-3)' }}>
            <div>
              <span className="ed-badge ed-badge-info" style={{ marginBottom: '6px' }}>FOUNDATION TIER</span>
              <h3>Primary Wing (Grades 1 through 5)</h3>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>Foundational literacy, numeracy, bilingual communication, and natural sciences</p>
            </div>
            <span className="ed-badge ed-badge-neutral">Age Group: 6–10 Years</span>
          </div>

          <div className="ed-grid-3">
            <div style={{ padding: '12px', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontWeight: 600, fontSize: '0.88rem', marginBottom: '4px' }}>Linguistic Mastery</div>
              <p style={{ fontSize: '0.80rem', color: 'var(--text-secondary)' }}>English language phonics, expressive writing, comprehension, and regional language proficiency.</p>
            </div>
            <div style={{ padding: '12px', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontWeight: 600, fontSize: '0.88rem', marginBottom: '4px' }}>Concrete Mathematics</div>
              <p style={{ fontSize: '0.80rem', color: 'var(--text-secondary)' }}>Spatial geometry, arithmetic operations, visual patterns, and mental math calculation games.</p>
            </div>
            <div style={{ padding: '12px', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontWeight: 600, fontSize: '0.88rem', marginBottom: '4px' }}>Environmental Studies</div>
              <p style={{ fontSize: '0.80rem', color: 'var(--text-secondary)' }}>Botany observation, eco-systems, community civic structures, and sensory nature exploration.</p>
            </div>
          </div>
        </div>

        {/* Middle Wing */}
        <div className="ed-card ed-card-body">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-3)' }}>
            <div>
              <span className="ed-badge ed-badge-success" style={{ marginBottom: '6px' }}>DISCOVERY TIER</span>
              <h3>Middle Wing (Grades 6 through 8)</h3>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>Experimental inquiry, pre-algebra, robotics, and social sciences</p>
            </div>
            <span className="ed-badge ed-badge-neutral">Age Group: 11–13 Years</span>
          </div>

          <div className="ed-grid-3">
            <div style={{ padding: '12px', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontWeight: 600, fontSize: '0.88rem', marginBottom: '4px' }}>Integrated Sciences</div>
              <p style={{ fontSize: '0.80rem', color: 'var(--text-secondary)' }}>Mechanics, biological cell structure, chemical reactions, and laboratory observation journals.</p>
            </div>
            <div style={{ padding: '12px', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontWeight: 600, fontSize: '0.88rem', marginBottom: '4px' }}>Pre-Algebra & Geometry</div>
              <p style={{ fontSize: '0.80rem', color: 'var(--text-secondary)' }}>Equations, coordinate planes, theorem proofs, statistics, and graphical interpretations.</p>
            </div>
            <div style={{ padding: '12px', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontWeight: 600, fontSize: '0.88rem', marginBottom: '4px' }}>Computer Science & Robotics</div>
              <p style={{ fontSize: '0.80rem', color: 'var(--text-secondary)' }}>Block programming, Python fundamentals, logic gates, and sensor-driven hardware kits.</p>
            </div>
          </div>
        </div>

        {/* Senior Secondary Wing */}
        <div className="ed-card ed-card-body">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-3)' }}>
            <div>
              <span className="ed-badge ed-badge-warning" style={{ marginBottom: '6px' }}>HONORS & BOARD PREPARATION</span>
              <h3>Secondary & Senior Secondary (Grades 9 through 12)</h3>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>Specialized streams in Pure Sciences and Commerce with board examination mastery</p>
            </div>
            <span className="ed-badge ed-badge-neutral">Age Group: 14–18 Years</span>
          </div>

          <div className="ed-grid-2">
            <div style={{ padding: '16px', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--primary-800)', marginBottom: '6px' }}>
                Track 1: Physical & Natural Sciences (PCMB / PCMC)
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Advanced Physics (Electromagnetism, Mechanics, Optics), Organic & Physical Chemistry, Pure Mathematics (Calculus, Linear Algebra), and Computer Science with Python or Biology. Prepares students for IIT-JEE, NEET, and research scholarships.
              </p>
            </div>

            <div style={{ padding: '16px', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--teal-accent)', marginBottom: '6px' }}>
                Track 2: Commerce & Financial Economics
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Accountancy, Business Studies, Micro & Macro Economics, Applied Mathematics, and Informatics Practices. Includes simulated stock market investment projects and auditing workshops.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
