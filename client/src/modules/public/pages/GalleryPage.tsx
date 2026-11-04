import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Camera,
  Layers,
  Award,
  Sparkles,
  Building2,
  Video,
  Image as ImageIcon,
  Play,
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  Filter,
} from 'lucide-react';
import { useSchoolBranding } from '../../../context/SchoolBrandingContext.js';
import { websiteApi } from '../../../services/api.js';

interface GalleryCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  coverImageUrl?: string;
}

interface GalleryItem {
  id: string;
  title: string;
  caption?: string | null;
  mediaType: 'IMAGE' | 'VIDEO';
  mediaUrl?: string | null;
  thumbnailUrl?: string | null;
  videoUrl?: string | null;
  categoryId?: string | null;
  category?: GalleryCategory;
  isFeatured?: boolean;
}

// Fallback items if database gallery has not been customized yet
const FALLBACK_CATEGORIES: GalleryCategory[] = [
  { id: 'cat-infra', name: 'Campus Infrastructure', slug: 'campus-infrastructure' },
  { id: 'cat-labs', name: 'Science & Computing Labs', slug: 'science-computing-labs' },
  { id: 'cat-sports', name: 'Sports & Athletics', slug: 'sports-athletics' },
  { id: 'cat-arts', name: 'Cultural & Fine Arts', slug: 'cultural-fine-arts' },
  { id: 'cat-class', name: 'Classrooms & Academics', slug: 'classrooms-academics' },
];

const FALLBACK_ITEMS: GalleryItem[] = [
  {
    id: 'f-1',
    title: 'Modern Ergonomic Classrooms in Session',
    caption: 'Interactive student inquiry and teacher mentorship in modern smart classrooms.',
    mediaType: 'IMAGE',
    mediaUrl: '/images/school/hero_classroom.jpg',
    thumbnailUrl: '/images/school/hero_classroom.jpg',
    categoryId: 'cat-class',
  },
  {
    id: 'f-2',
    title: 'Historic Main Academic Complex Exterior',
    caption: 'Lush green lawns and classical colonial-institutional facade.',
    mediaType: 'IMAGE',
    mediaUrl: '/images/school/campus_building.jpg',
    thumbnailUrl: '/images/school/campus_building.jpg',
    categoryId: 'cat-infra',
  },
  {
    id: 'f-3',
    title: 'Dr. Kalam Central Academic Library & Reading Commons',
    caption: 'Over 28,000 curriculum volumes, research carrels, and peaceful study niches.',
    mediaType: 'IMAGE',
    mediaUrl: '/images/school/library.jpg',
    thumbnailUrl: '/images/school/library.jpg',
    categoryId: 'cat-infra',
  },
  {
    id: 'f-4',
    title: 'Advanced Physical Sciences & Optics Research Lab',
    caption: 'Equipped with digital sensor arrays, spectroscopy benches, and precision apparatus.',
    mediaType: 'IMAGE',
    mediaUrl: '/images/school/science_lab.jpg',
    thumbnailUrl: '/images/school/science_lab.jpg',
    categoryId: 'cat-labs',
  },
  {
    id: 'f-5',
    title: 'Turing Computing Laboratory & AI Workstation Hub',
    caption: '60 high-performance workstations for computational thinking and Python coding.',
    mediaType: 'IMAGE',
    mediaUrl: '/images/school/computer_lab.jpg',
    thumbnailUrl: '/images/school/computer_lab.jpg',
    categoryId: 'cat-labs',
  },
  {
    id: 'f-6',
    title: 'Olympic-Standard 400m Athletic Track & Sports Turf',
    caption: 'All-weather running track, football ground, and cricket pitch promoting physical fitness.',
    mediaType: 'IMAGE',
    mediaUrl: '/images/school/sports_ground.jpg',
    thumbnailUrl: '/images/school/sports_ground.jpg',
    categoryId: 'cat-sports',
  },
  {
    id: 'f-7',
    title: 'Daily Morning Campus Assembly & Prayer Service',
    caption: 'Unified morning reflection instilling patriotic duty, moral clarity, and brotherhood.',
    mediaType: 'IMAGE',
    mediaUrl: '/images/school/school_assembly.jpg',
    thumbnailUrl: '/images/school/school_assembly.jpg',
    categoryId: 'cat-arts',
  },
  {
    id: 'f-8',
    title: 'Tagore Fine Arts & Cultural Studio',
    caption: 'Painting, pottery, instrumental music, and theatre workshops.',
    mediaType: 'IMAGE',
    mediaUrl: '/images/school/cultural_arts.jpg',
    thumbnailUrl: '/images/school/cultural_arts.jpg',
    categoryId: 'cat-arts',
  },
  {
    id: 'f-9',
    title: 'Regulated GPS-Tracked Campus Transportation Fleet',
    caption: 'Safe, air-conditioned school buses with verified drivers and female attendants.',
    mediaType: 'IMAGE',
    mediaUrl: '/images/school/school_bus.jpg',
    thumbnailUrl: '/images/school/school_bus.jpg',
    categoryId: 'cat-infra',
  },
  {
    id: 'f-10',
    title: 'Annual Science Fair & Innovation Expo 2026',
    caption: 'Watch student research demonstrations and working robotics prototypes in action.',
    mediaType: 'VIDEO',
    mediaUrl: '/images/school/science_lab.jpg',
    thumbnailUrl: '/images/school/science_lab.jpg',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    categoryId: 'cat-labs',
  },
  {
    id: 'f-11',
    title: 'Inter-House Athletics Championship Highlights',
    caption: 'Track races, relay finals, and sports day medal ceremony.',
    mediaType: 'VIDEO',
    mediaUrl: '/images/school/sports_ground.jpg',
    thumbnailUrl: '/images/school/sports_ground.jpg',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    categoryId: 'cat-sports',
  },
];

export const GalleryPage: React.FC = () => {
  const { branding } = useSchoolBranding();

  const [categories, setCategories] = useState<GalleryCategory[]>(FALLBACK_CATEGORIES);
  const [items, setItems] = useState<GalleryItem[]>(FALLBACK_ITEMS);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [mediaTypeFilter, setMediaTypeFilter] = useState<'ALL' | 'IMAGE' | 'VIDEO'>('ALL');

  // Lightbox Modal for Images
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Video Modal
  const [activeVideo, setActiveVideo] = useState<GalleryItem | null>(null);

  // Fetch from database API
  useEffect(() => {
    let isMounted = true;
    const fetchGallery = async () => {
      try {
        setLoading(true);
        const [catsRes, itemsRes] = await Promise.allSettled([
          websiteApi.getGalleryCategories(),
          websiteApi.getGalleryItems({ limit: 100 }),
        ]);

        if (isMounted) {
          if (catsRes.status === 'fulfilled' && catsRes.value?.success && catsRes.value.data?.length > 0) {
            setCategories(catsRes.value.data);
          }
          if (itemsRes.status === 'fulfilled' && itemsRes.value?.success && itemsRes.value.data?.items?.length > 0) {
            setItems(itemsRes.value.data.items);
          }
        }
      } catch (err) {
        console.warn('Using default gallery assets:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchGallery();
    return () => {
      isMounted = false;
    };
  }, []);

  // Filtered items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (selectedCategory !== 'ALL') {
        const matchesCat =
          item.categoryId === selectedCategory ||
          item.category?.id === selectedCategory ||
          item.category?.slug === selectedCategory;
        if (!matchesCat) return false;
      }
      if (mediaTypeFilter !== 'ALL' && item.mediaType !== mediaTypeFilter) {
        return false;
      }
      return true;
    });
  }, [items, selectedCategory, mediaTypeFilter]);

  // Image-only list for Lightbox navigation
  const imageItems = useMemo(() => {
    return filteredItems.filter((i) => i.mediaType === 'IMAGE');
  }, [filteredItems]);

  const currentLightboxItem = lightboxIndex !== null ? imageItems[lightboxIndex] : null;

  // Keyboard navigation for Lightbox & Video
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLightboxIndex(null);
        setActiveVideo(null);
      } else if (e.key === 'ArrowRight' && lightboxIndex !== null) {
        setLightboxIndex((prev) => (prev !== null && prev < imageItems.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowLeft' && lightboxIndex !== null) {
        setLightboxIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : imageItems.length - 1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    if (lightboxIndex !== null || activeVideo !== null) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [lightboxIndex, activeVideo, imageItems.length]);

  const openLightboxForItem = (item: GalleryItem) => {
    const idx = imageItems.findIndex((i) => i.id === item.id);
    if (idx !== -1) {
      setLightboxIndex(idx);
    }
  };

  // Extract clean YouTube embed URL
  const getEmbedUrl = (url?: string | null) => {
    if (!url) return '';
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    return match && match[1] ? `https://www.youtube-nocookie.com/embed/${match[1]}?autoplay=1&rel=0` : url;
  };

  return (
    <div className="ed-public-container" style={{ padding: 'var(--space-8) 0 clamp(3rem, 6vw, 5rem)' }}>
      {/* Page Title & Breadcrumb Header */}
      <div style={{ marginBottom: 'var(--space-8)', textAlign: 'center' }}>
        <span
          className="ed-badge ed-badge-info"
          style={{
            marginBottom: '10px',
            padding: '4px 12px',
            fontSize: '0.78rem',
            letterSpacing: '0.06em',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <Camera size={14} />
          CAMPUS PHOTO & VIDEO ARCHIVE
        </span>

        <h1 style={{ fontFamily: 'var(--font-crest)', fontSize: 'clamp(2rem, 4vw, 2.8rem)', color: 'var(--text-primary)', margin: '0 0 12px' }}>
          Visual Life at {branding.schoolName}
        </h1>

        <p style={{ color: 'var(--text-muted)', maxWidth: '780px', margin: '0 auto', fontSize: '1.02rem', lineHeight: 1.7 }}>
          Experience our world-class campus facilities, scientific laboratories, sports championships, classroom inquiries, and cultural arts through high-resolution photography and video captures.
        </p>
      </div>

      {/* Control Bar: Category Filters & Media Type Switcher */}
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 18px',
          marginBottom: 'var(--space-6)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        {/* Category Pills */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            onClick={() => setSelectedCategory('ALL')}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '0.84rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: selectedCategory === 'ALL' ? '1px solid var(--color-primary)' : '1px solid var(--border-default)',
              backgroundColor: selectedCategory === 'ALL' ? 'var(--color-primary)' : 'transparent',
              color: selectedCategory === 'ALL' ? '#ffffff' : 'var(--text-secondary)',
              transition: 'all 0.15s ease',
            }}
          >
            All Categories ({items.length})
          </button>

          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id || selectedCategory === cat.slug;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '20px',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: isSelected ? '1px solid var(--color-primary)' : '1px solid var(--border-default)',
                  backgroundColor: isSelected ? 'var(--color-primary)' : 'transparent',
                  color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                  transition: 'all 0.15s ease',
                }}
              >
                {cat.name}
              </button>
            );
          })}
        </div>

        {/* Media Switcher: All | Photos | Videos */}
        <div
          style={{
            display: 'inline-flex',
            backgroundColor: 'var(--bg-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '3px',
            border: '1px solid var(--border-default)',
          }}
        >
          <button
            onClick={() => setMediaTypeFilter('ALL')}
            style={{
              padding: '5px 12px',
              borderRadius: '4px',
              border: 'none',
              background: mediaTypeFilter === 'ALL' ? 'var(--bg-surface)' : 'transparent',
              color: mediaTypeFilter === 'ALL' ? 'var(--color-primary)' : 'var(--text-muted)',
              fontWeight: mediaTypeFilter === 'ALL' ? 700 : 500,
              fontSize: '0.8rem',
              cursor: 'pointer',
              boxShadow: mediaTypeFilter === 'ALL' ? 'var(--shadow-sm)' : 'none',
            }}
          >
            All Media
          </button>

          <button
            onClick={() => setMediaTypeFilter('IMAGE')}
            style={{
              padding: '5px 12px',
              borderRadius: '4px',
              border: 'none',
              background: mediaTypeFilter === 'IMAGE' ? 'var(--bg-surface)' : 'transparent',
              color: mediaTypeFilter === 'IMAGE' ? 'var(--color-primary)' : 'var(--text-muted)',
              fontWeight: mediaTypeFilter === 'IMAGE' ? 700 : 500,
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              boxShadow: mediaTypeFilter === 'IMAGE' ? 'var(--shadow-sm)' : 'none',
            }}
          >
            <ImageIcon size={13} />
            <span>Photos Only</span>
          </button>

          <button
            onClick={() => setMediaTypeFilter('VIDEO')}
            style={{
              padding: '5px 12px',
              borderRadius: '4px',
              border: 'none',
              background: mediaTypeFilter === 'VIDEO' ? 'var(--bg-surface)' : 'transparent',
              color: mediaTypeFilter === 'VIDEO' ? 'var(--color-primary)' : 'var(--text-muted)',
              fontWeight: mediaTypeFilter === 'VIDEO' ? 700 : 500,
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              boxShadow: mediaTypeFilter === 'VIDEO' ? 'var(--shadow-sm)' : 'none',
            }}
          >
            <Video size={13} />
            <span>Videos Only</span>
          </button>
        </div>
      </div>

      {/* Gallery Media Grid */}
      {filteredItems.length === 0 ? (
        <div
          style={{
            padding: '4rem 2rem',
            textAlign: 'center',
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-md)',
            border: '1px dashed var(--border-default)',
          }}
        >
          <Camera size={44} style={{ color: 'var(--text-muted)', opacity: 0.5, marginBottom: '12px' }} />
          <h3 style={{ margin: '0 0 6px', color: 'var(--text-primary)' }}>No media found</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
            There are no media items matching the selected category and filter.
          </p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '1.5rem',
          }}
        >
          {filteredItems.map((item) => {
            const isVideo = item.mediaType === 'VIDEO';
            const imgSource = item.thumbnailUrl || item.mediaUrl || '/images/school/hero_classroom.jpg';

            return (
              <div
                key={item.id}
                className="ed-gallery-card"
                onClick={() => {
                  if (isVideo) {
                    setActiveVideo(item);
                  } else {
                    openLightboxForItem(item);
                  }
                }}
                style={{
                  cursor: 'pointer',
                  borderRadius: 'var(--radius-md)',
                  overflow: 'hidden',
                  position: 'relative',
                  aspectRatio: '16/10',
                  boxShadow: 'var(--shadow-sm)',
                  backgroundColor: '#0f172a',
                }}
              >
                {/* Image / Thumbnail */}
                <img
                  src={imgSource}
                  alt={item.title}
                  loading="lazy"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transition: 'transform 0.4s ease',
                  }}
                />

                {/* Video Play Indicator Overlay */}
                {isVideo && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: 'rgba(0,0,0,0.25)',
                    }}
                  >
                    <div
                      style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '50%',
                        backgroundColor: '#dc2626',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 16px rgba(220, 38, 38, 0.6)',
                        transition: 'transform 0.2s ease',
                      }}
                    >
                      <Play size={24} style={{ marginLeft: '3px' }} fill="#ffffff" />
                    </div>
                  </div>
                )}

                {/* Media Type Badge (Top-Left) */}
                <div style={{ position: 'absolute', top: '12px', left: '12px', zIndex: 2 }}>
                  <span
                    style={{
                      backgroundColor: isVideo ? 'rgba(220, 38, 38, 0.9)' : 'rgba(15, 23, 42, 0.75)',
                      backdropFilter: 'blur(4px)',
                      color: '#ffffff',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: '4px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      letterSpacing: '0.04em',
                    }}
                  >
                    {isVideo ? <Video size={11} /> : <ImageIcon size={11} />}
                    <span>{isVideo ? 'VIDEO' : 'PHOTO'}</span>
                  </span>
                </div>

                {/* Bottom Gradient Overlay & Title */}
                <div
                  className="ed-gallery-card-overlay"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                    padding: '1.25rem',
                    color: '#ffffff',
                  }}
                >
                  <h4 style={{ margin: '0 0 4px', fontSize: '1.05rem', color: '#ffffff', fontWeight: 600 }}>
                    {item.title}
                  </h4>
                  {item.caption && (
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#e2e8f0', lineHeight: 1.4, opacity: 0.9 }}>
                      {item.caption}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* =========================================================================
          FULL-SCREEN LIGHTBOX MODAL (FOR PHOTOS)
          ========================================================================= */}
      {currentLightboxItem && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(5, 10, 18, 0.96)',
            backdropFilter: 'blur(8px)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '1.5rem',
          }}
          onClick={() => setLightboxIndex(null)}
        >
          {/* Top Bar: Title & Close Button */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              color: '#ffffff',
              zIndex: 10,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <div style={{ fontSize: '0.82rem', color: 'var(--academic-gold-500)', fontWeight: 600 }}>
                {branding.schoolName} • Campus Visual Archive
              </div>
              <h3 style={{ margin: '2px 0 0', fontSize: '1.15rem', color: '#ffffff' }}>
                {currentLightboxItem.title}
              </h3>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{ fontSize: '0.84rem', color: '#94a3b8' }}>
                Photo {lightboxIndex! + 1} of {imageItems.length}
              </span>

              {currentLightboxItem.mediaUrl && (
                <a
                  href={currentLightboxItem.mediaUrl}
                  download
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    color: '#ffffff',
                    background: 'rgba(255,255,255,0.1)',
                    padding: '8px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textDecoration: 'none',
                  }}
                  title="Download Photo"
                >
                  <Download size={18} />
                </a>
              )}

              <button
                onClick={() => setLightboxIndex(null)}
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  border: 'none',
                  color: '#ffffff',
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'background 0.2s ease',
                }}
                title="Close Lightbox (Esc)"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Main Photo Area with Prev/Next Controls */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              padding: '1rem 0',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Prev Button */}
            {imageItems.length > 1 && (
              <button
                onClick={() =>
                  setLightboxIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : imageItems.length - 1))
                }
                style={{
                  position: 'absolute',
                  left: '1rem',
                  background: 'rgba(0,0,0,0.6)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: '#ffffff',
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  zIndex: 10,
                }}
                title="Previous Photo (Left Arrow)"
              >
                <ChevronLeft size={24} />
              </button>
            )}

            {/* High-Resolution Photo */}
            <img
              src={currentLightboxItem.mediaUrl || currentLightboxItem.thumbnailUrl || '/images/school/hero_classroom.jpg'}
              alt={currentLightboxItem.title}
              style={{
                maxWidth: '90vw',
                maxHeight: '75vh',
                objectFit: 'contain',
                borderRadius: '6px',
                boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
              }}
            />

            {/* Next Button */}
            {imageItems.length > 1 && (
              <button
                onClick={() =>
                  setLightboxIndex((prev) => (prev !== null && prev < imageItems.length - 1 ? prev + 1 : 0))
                }
                style={{
                  position: 'absolute',
                  right: '1rem',
                  background: 'rgba(0,0,0,0.6)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: '#ffffff',
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  zIndex: 10,
                }}
                title="Next Photo (Right Arrow)"
              >
                <ChevronRight size={24} />
              </button>
            )}
          </div>

          {/* Bottom Caption Area */}
          <div
            style={{
              textAlign: 'center',
              color: '#e2e8f0',
              maxWidth: '720px',
              margin: '0 auto',
              fontSize: '0.92rem',
              lineHeight: 1.6,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {currentLightboxItem.caption && <div>{currentLightboxItem.caption}</div>}
          </div>
        </div>
      )}

      {/* =========================================================================
          VIDEO PLAYER MODAL (YOUTUBE EMBED)
          ========================================================================= */}
      {activeVideo && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(5, 10, 18, 0.95)',
            backdropFilter: 'blur(8px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
          }}
          onClick={() => setActiveVideo(null)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '900px',
              backgroundColor: '#0f172a',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
              boxShadow: '0 25px 60px rgba(0,0,0,0.9)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              style={{
                padding: '12px 18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                color: '#ffffff',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Video size={18} style={{ color: '#dc2626' }} />
                <h4 style={{ margin: 0, fontSize: '1rem', color: '#ffffff' }}>{activeVideo.title}</h4>
              </div>
              <button
                onClick={() => setActiveVideo(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* 16:9 Responsive Video Frame */}
            <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
              <iframe
                src={getEmbedUrl(activeVideo.videoUrl)}
                title={activeVideo.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  border: 0,
                }}
              />
            </div>

            {/* Caption */}
            {activeVideo.caption && (
              <div style={{ padding: '12px 18px', color: '#cbd5e1', fontSize: '0.86rem', lineHeight: 1.5 }}>
                {activeVideo.caption}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
