import React from 'react';
import { useSchoolBranding } from '../../../context/SchoolBrandingContext.js';

interface AuthCrestProps {
  size?: number;
  className?: string;
  showMonogram?: boolean;
}

export const AuthCrest: React.FC<AuthCrestProps> = ({ size = 76, className = '', showMonogram = false }) => {
  const { branding } = useSchoolBranding();

  if (branding.logoUrl) {
    return (
      <div
        className={className}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: '50%',
          padding: '4px',
          background: 'linear-gradient(135deg, #c4a46b 0%, #244c3a 100%)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 8px 20px rgba(36, 76, 58, 0.16)',
        }}
      >
        <img
          src={branding.logoUrl}
          alt={branding.schoolName}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            borderRadius: '50%',
            backgroundColor: '#ffffff',
          }}
        />
      </div>
    );
  }

  // Institutional Laurel Wreath Emblem with Graduation Cap and Open Book
  return (
    <div
      className={className}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
      }}
      aria-label={`${branding.schoolName} Crest`}
    >
      <svg
        viewBox="0 0 120 120"
        width={size}
        height={size}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ filter: 'drop-shadow(0 4px 12px rgba(36, 76, 58, 0.18))' }}
      >
        {/* Left Laurel Wreath Leaves (Muted Gold) */}
        <g fill="#c4a46b">
          {/* Stem left */}
          <path
            d="M52 102 C 34 98 18 80 18 56 C 18 42 24 30 32 20"
            stroke="#c4a46b"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />
          {/* Leaf pairs left */}
          <path d="M22 28 C 17 26 15 19 18 14 C 23 15 27 21 26 27 Z" />
          <path d="M30 22 C 28 16 31 10 36 9 C 39 14 38 21 33 24 Z" />
          <path d="M16 42 C 10 40 8 33 12 28 C 17 29 21 35 19 41 Z" />
          <path d="M22 36 C 21 30 25 24 31 24 C 33 30 31 36 25 38 Z" />
          <path d="M14 58 C 8 57 7 50 11 45 C 16 46 19 53 17 58 Z" />
          <path d="M20 52 C 19 46 25 41 31 42 C 32 48 29 53 23 54 Z" />
          <path d="M16 74 C 11 74 9 67 14 62 C 19 63 21 70 19 75 Z" />
          <path d="M22 68 C 22 62 28 58 34 60 C 34 66 30 71 24 71 Z" />
          <path d="M22 88 C 17 89 15 83 20 78 C 25 79 27 86 24 90 Z" />
          <path d="M29 82 C 30 76 36 73 41 76 C 40 82 35 86 30 84 Z" />
          <path d="M34 100 C 29 102 27 96 32 91 C 37 92 39 98 36 102 Z" />
          <path d="M42 94 C 43 88 50 86 54 90 C 53 96 47 99 42 96 Z" />
        </g>

        {/* Right Laurel Wreath Leaves (Muted Gold) */}
        <g fill="#c4a46b">
          {/* Stem right */}
          <path
            d="M68 102 C 86 98 102 80 102 56 C 102 42 96 30 88 20"
            stroke="#c4a46b"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />
          {/* Leaf pairs right */}
          <path d="M98 28 C 103 26 105 19 102 14 C 97 15 93 21 94 27 Z" />
          <path d="M90 22 C 92 16 89 10 84 9 C 81 14 82 21 87 24 Z" />
          <path d="M104 42 C 110 40 112 33 108 28 C 103 29 99 35 101 41 Z" />
          <path d="M98 36 C 99 30 95 24 89 24 C 87 30 89 36 95 38 Z" />
          <path d="M106 58 C 112 57 113 50 109 45 C 104 46 101 53 103 58 Z" />
          <path d="M100 52 C 101 46 95 41 89 42 C 88 48 91 53 97 54 Z" />
          <path d="M104 74 C 109 74 111 67 106 62 C 101 63 99 70 101 75 Z" />
          <path d="M98 68 C 98 62 92 58 86 60 C 86 66 90 71 96 71 Z" />
          <path d="M98 88 C 103 89 105 83 100 78 C 95 79 93 86 96 90 Z" />
          <path d="M91 82 C 90 76 84 73 79 76 C 80 82 85 86 90 84 Z" />
          <path d="M86 100 C 91 102 93 96 88 91 C 83 92 81 98 84 102 Z" />
          <path d="M78 94 C 77 88 70 86 66 90 C 67 96 73 99 78 96 Z" />
        </g>

        {/* Bottom Ribbon / Tie Knot */}
        <path
          d="M52 102 C 57 100 63 100 68 102 C 67 107 60 110 52 102 Z"
          fill="#c4a46b"
        />
        <path
          d="M52 104 C 47 110 42 114 38 116 C 42 110 46 106 50 104 Z"
          fill="#c4a46b"
        />
        <path
          d="M68 104 C 73 110 78 114 82 116 C 78 110 74 106 70 104 Z"
          fill="#c4a46b"
        />

        {/* Center Institutional Circle (Forest Green) */}
        <circle cx="60" cy="56" r="32" fill="#244c3a" stroke="#c4a46b" strokeWidth="2.5" />

        {showMonogram ? (
          /* Central School Monogram */
          <text
            x="60"
            y="65"
            textAnchor="middle"
            fill="#ffffff"
            fontSize="26"
            fontWeight="800"
            fontFamily="serif"
            style={{ letterSpacing: '0.02em' }}
          >
            {branding.monogram || 'A'}
          </text>
        ) : (
          /* Central Academic Iconography: Graduation Cap & Open Book */
          <g transform="translate(60, 56) scale(0.9) translate(-60, -56)">
            {/* Graduation Cap Top */}
            <path
              d="M60 36 L40 44 L60 52 L80 44 Z"
              fill="#c4a46b"
              stroke="#ffffff"
              strokeWidth="1.2"
              strokeLinejoin="round"
            />
            {/* Graduation Cap Base */}
            <path
              d="M48 48.5 L48 55 C 48 58 53 61 60 61 C 67 61 72 58 72 55 L72 48.5"
              fill="#1d3d2f"
              stroke="#ffffff"
              strokeWidth="1.2"
              strokeLinejoin="round"
            />
            {/* Tassel */}
            <path
              d="M74 46.5 L78 52 L78 58"
              stroke="#ffffff"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <circle cx="78" cy="59" r="1.5" fill="#c4a46b" />

            {/* Open Book */}
            <g transform="translate(0, 7)">
              {/* Left Page */}
              <path
                d="M60 63 C 54 60 46 60 41 62 L41 74 C 46 72 54 72 60 75 Z"
                fill="#ffffff"
                stroke="#c4a46b"
                strokeWidth="1"
              />
              {/* Right Page */}
              <path
                d="M60 63 C 66 60 74 60 79 62 L79 74 C 74 72 66 72 60 75 Z"
                fill="#ffffff"
                stroke="#c4a46b"
                strokeWidth="1"
              />
              {/* Center Spine */}
              <line x1="60" y1="63" x2="60" y2="75" stroke="#244c3a" strokeWidth="1.5" />
            </g>
          </g>
        )}
      </svg>
    </div>
  );
};
