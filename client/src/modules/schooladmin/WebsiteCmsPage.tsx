import React, { useState, useEffect, useCallback } from 'react';
import {
  Globe,
  Layout,
  Star,
  Building,
  Image as ImageIcon,
  Video,
  Award,
  MessageSquare,
  FileText,
  Save,
  Plus,
  Trash2,
  Edit,
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  Upload,
  Check,
  ChevronRight,
  ShieldCheck,
  Info,
} from 'lucide-react';
import { Modal } from '../../components/ui/Modal.js';
import { Button } from '../../components/ui/Button.js';
import { Badge } from '../../components/ui/Badge.js';
import { websiteApi } from '../../services/api.js';
import { useSchoolBranding } from '../../context/SchoolBrandingContext.js';

// Pre-packaged high-resolution local school photography
const SCHOOL_IMAGE_PRESETS = [
  { label: 'Hero Classroom in Session', url: '/images/school/hero_classroom.jpg' },
  { label: 'Campus Building Exterior', url: '/images/school/campus_building.jpg' },
  { label: 'Central Academic Library', url: '/images/school/library.jpg' },
  { label: 'Advanced Science Laboratory', url: '/images/school/science_lab.jpg' },
  { label: 'Computer Workstation Lab', url: '/images/school/computer_lab.jpg' },
  { label: 'Olympic Sports Ground & Turf', url: '/images/school/sports_ground.jpg' },
  { label: 'Morning Campus Assembly', url: '/images/school/school_assembly.jpg' },
  { label: 'Cultural & Fine Arts Studio', url: '/images/school/cultural_arts.jpg' },
  { label: 'School Transport Bus Fleet', url: '/images/school/school_bus.jpg' },
];

export const WebsiteCmsPage: React.FC = () => {
  const { branding, refreshWebsiteData } = useSchoolBranding();

  const [activeTab, setActiveTab] = useState<
    'branding' | 'highlights' | 'facilities' | 'gallery' | 'achievements' | 'documents'
  >('branding');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Dynamic Data State
  const [content, setContent] = useState<any>({});
  const [schoolData, setSchoolData] = useState<any>({});
  const [highlights, setHighlights] = useState<any[]>([]);
  const [facilities, setFacilities] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [galleryItems, setGalleryItems] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);

  // Modals
  const [modalType, setModalType] = useState<
    'highlight' | 'facility' | 'category' | 'galleryItem' | 'achievement' | 'testimonial' | 'document' | null
  >(null);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [modalForm, setModalForm] = useState<any>({});

  // Gallery Filters
  const [galleryCategoryFilter, setGalleryCategoryFilter] = useState<string>('ALL');
  const [galleryTypeFilter, setGalleryTypeFilter] = useState<'ALL' | 'IMAGE' | 'VIDEO'>('ALL');

  // Load all admin data
  const loadAdminData = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await websiteApi.getAdminData();
      if (res && res.success && res.data) {
        setContent(res.data.content || {});
        setSchoolData(res.data.school || {});
        setHighlights(res.data.highlights || []);
        setFacilities(res.data.facilities || []);
        setCategories(res.data.galleryCategories || []);
        setGalleryItems(res.data.galleryItems || []);
        setAchievements(res.data.achievements || []);
        setTestimonials(res.data.testimonials || []);
        setDocuments(res.data.documents || []);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load website content from database.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAdminData();
  }, [loadAdminData]);

  // Flash message helper
  const showToast = (msg: string, isError = false) => {
    if (isError) {
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(null), 5000);
    } else {
      setSuccessMsg(msg);
      setTimeout(() => setSuccessMsg(null), 4000);
    }
  };

  // --------------------------------------------------------------------------
  // Save Tab 1: Homepage & Branding
  // --------------------------------------------------------------------------
  const handleSaveHomepage = async () => {
    try {
      setSaving(true);
      setErrorMsg(null);

      // 1. Update School branding
      await websiteApi.updateBranding({
        name: schoolData.name,
        motto: schoolData.motto,
        email: schoolData.email,
        phone: schoolData.phone,
        address: schoolData.address,
        city: schoolData.city,
        state: schoolData.state,
        postalCode: schoolData.postalCode,
        logoUrl: schoolData.logoUrl,
        establishedYear: schoolData.establishedYear ? Number(schoolData.establishedYear) : undefined,
        brandingConfig: schoolData.brandingConfig || {},
      });

      // 2. Update Website content
      await websiteApi.updateContent(content);

      await refreshWebsiteData();
      showToast('Website content and institutional branding saved successfully to PostgreSQL database!');
    } catch (err: any) {
      showToast(err.message || 'Failed to save changes.', true);
    } finally {
      setSaving(false);
    }
  };

  // --------------------------------------------------------------------------
  // Highlights CRUD
  // --------------------------------------------------------------------------
  const openHighlightModal = (item?: any) => {
    setEditingItem(item || null);
    setModalForm(
      item
        ? { ...item }
        : {
            title: '',
            description: '',
            iconName: 'CheckCircle',
            displayOrder: highlights.length + 1,
            isPublished: true,
          }
    );
    setModalType('highlight');
  };

  const handleSaveHighlight = async () => {
    try {
      if (!modalForm.title?.trim()) {
        showToast('Please provide a highlight title.', true);
        return;
      }
      if (editingItem) {
        await websiteApi.updateHighlight(editingItem.id, modalForm);
        showToast('Highlight updated successfully.');
      } else {
        await websiteApi.createHighlight(modalForm);
        showToast('New highlight added successfully.');
      }
      setModalType(null);
      await loadAdminData();
      await refreshWebsiteData();
    } catch (err: any) {
      showToast(err.message || 'Failed to save highlight.', true);
    }
  };

  const handleDeleteHighlight = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this highlight?')) return;
    try {
      await websiteApi.deleteHighlight(id);
      showToast('Highlight deleted.');
      await loadAdminData();
      await refreshWebsiteData();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete highlight.', true);
    }
  };

  const handleToggleHighlightPublish = async (item: any) => {
    try {
      await websiteApi.updateHighlight(item.id, { isPublished: !item.isPublished });
      await loadAdminData();
      await refreshWebsiteData();
    } catch (err: any) {
      showToast(err.message || 'Failed to update status.', true);
    }
  };

  // --------------------------------------------------------------------------
  // Facilities CRUD
  // --------------------------------------------------------------------------
  const openFacilityModal = (item?: any) => {
    setEditingItem(item || null);
    setModalForm(
      item
        ? { ...item }
        : {
            name: '',
            description: '',
            category: 'Campus Infrastructure',
            imageUrl: '/images/school/hero_classroom.jpg',
            displayOrder: facilities.length + 1,
            isPublished: true,
          }
    );
    setModalType('facility');
  };

  const handleSaveFacility = async () => {
    try {
      if (!modalForm.name?.trim()) {
        showToast('Please provide a facility name.', true);
        return;
      }
      if (editingItem) {
        await websiteApi.updateFacility(editingItem.id, modalForm);
        showToast('Facility updated successfully.');
      } else {
        await websiteApi.createFacility(modalForm);
        showToast('New facility added successfully.');
      }
      setModalType(null);
      await loadAdminData();
      await refreshWebsiteData();
    } catch (err: any) {
      showToast(err.message || 'Failed to save facility.', true);
    }
  };

  const handleDeleteFacility = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this facility?')) return;
    try {
      await websiteApi.deleteFacility(id);
      showToast('Facility deleted.');
      await loadAdminData();
      await refreshWebsiteData();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete facility.', true);
    }
  };

  const handleToggleFacilityPublish = async (item: any) => {
    try {
      await websiteApi.updateFacility(item.id, { isPublished: !item.isPublished });
      await loadAdminData();
      await refreshWebsiteData();
    } catch (err: any) {
      showToast(err.message || 'Failed to update status.', true);
    }
  };

  // --------------------------------------------------------------------------
  // Gallery Categories CRUD
  // --------------------------------------------------------------------------
  const openCategoryModal = (cat?: any) => {
    setEditingItem(cat || null);
    setModalForm(
      cat
        ? { ...cat }
        : {
            name: '',
            slug: '',
            description: '',
            coverImageUrl: '/images/school/campus_building.jpg',
            displayOrder: categories.length + 1,
          }
    );
    setModalType('category');
  };

  const handleSaveCategory = async () => {
    try {
      if (!modalForm.name?.trim()) {
        showToast('Please provide an album name.', true);
        return;
      }
      const slug =
        modalForm.slug?.trim() ||
        modalForm.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');
      const payload = { ...modalForm, slug };

      if (editingItem) {
        await websiteApi.updateGalleryCategory(editingItem.id, payload);
        showToast('Album category updated successfully.');
      } else {
        await websiteApi.createGalleryCategory(payload);
        showToast('New album category created.');
      }
      setModalType(null);
      await loadAdminData();
      await refreshWebsiteData();
    } catch (err: any) {
      showToast(err.message || 'Failed to save category.', true);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this gallery category and its items?')) return;
    try {
      await websiteApi.deleteGalleryCategory(id);
      showToast('Album deleted.');
      await loadAdminData();
      await refreshWebsiteData();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete category.', true);
    }
  };

  // --------------------------------------------------------------------------
  // Gallery Items CRUD
  // --------------------------------------------------------------------------
  const openGalleryItemModal = (item?: any) => {
    setEditingItem(item || null);
    setModalForm(
      item
        ? { ...item }
        : {
            title: '',
            caption: '',
            mediaType: 'IMAGE',
            mediaUrl: '/images/school/hero_classroom.jpg',
            thumbnailUrl: '/images/school/hero_classroom.jpg',
            videoUrl: '',
            categoryId: categories[0]?.id || '',
            displayOrder: galleryItems.length + 1,
            isFeatured: false,
            isPublished: true,
          }
    );
    setModalType('galleryItem');
  };

  const handleSaveGalleryItem = async () => {
    try {
      if (!modalForm.title?.trim()) {
        showToast('Please provide a title for the media item.', true);
        return;
      }
      if (!modalForm.categoryId) {
        showToast('Please assign this item to an album category.', true);
        return;
      }
      if (modalForm.mediaType === 'VIDEO' && !modalForm.videoUrl?.trim()) {
        showToast('Please provide the YouTube video URL.', true);
        return;
      }

      // If YouTube video, auto extract thumbnail if not set
      let thumb = modalForm.thumbnailUrl;
      if (modalForm.mediaType === 'VIDEO' && modalForm.videoUrl) {
        const match = modalForm.videoUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
        if (match && match[1]) {
          thumb = `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`;
        }
      }

      const payload = {
        ...modalForm,
        thumbnailUrl: thumb || modalForm.mediaUrl || '/images/school/hero_classroom.jpg',
      };

      if (editingItem) {
        await websiteApi.updateGalleryItem(editingItem.id, payload);
        showToast('Gallery media updated.');
      } else {
        await websiteApi.createGalleryItem(payload);
        showToast('New gallery media added.');
      }
      setModalType(null);
      await loadAdminData();
      await refreshWebsiteData();
    } catch (err: any) {
      showToast(err.message || 'Failed to save gallery item.', true);
    }
  };

  const handleDeleteGalleryItem = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this media item?')) return;
    try {
      await websiteApi.deleteGalleryItem(id);
      showToast('Media item deleted.');
      await loadAdminData();
      await refreshWebsiteData();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete gallery item.', true);
    }
  };

  const handleToggleGalleryItemPublish = async (item: any) => {
    try {
      await websiteApi.updateGalleryItem(item.id, { isPublished: !item.isPublished });
      await loadAdminData();
      await refreshWebsiteData();
    } catch (err: any) {
      showToast(err.message || 'Failed to update publish status.', true);
    }
  };

  // --------------------------------------------------------------------------
  // Student Achievements CRUD
  // --------------------------------------------------------------------------
  const openAchievementModal = (item?: any) => {
    setEditingItem(item || null);
    setModalForm(
      item
        ? { ...item }
        : {
            title: '',
            studentName: '',
            competition: '',
            academicYear: '2025-2026',
            description: '',
            photoUrl: '/images/school/hero_classroom.jpg',
            displayOrder: achievements.length + 1,
            isPublished: true,
          }
    );
    setModalType('achievement');
  };

  const handleSaveAchievement = async () => {
    try {
      if (!modalForm.title?.trim() || !modalForm.studentName?.trim()) {
        showToast('Please provide both the achievement title and student name.', true);
        return;
      }
      if (editingItem) {
        await websiteApi.updateAchievement(editingItem.id, modalForm);
        showToast('Achievement updated.');
      } else {
        await websiteApi.createAchievement(modalForm);
        showToast('New achievement added.');
      }
      setModalType(null);
      await loadAdminData();
      await refreshWebsiteData();
    } catch (err: any) {
      showToast(err.message || 'Failed to save achievement.', true);
    }
  };

  const handleDeleteAchievement = async (id: string) => {
    if (!window.confirm('Delete this achievement?')) return;
    try {
      await websiteApi.deleteAchievement(id);
      showToast('Achievement deleted.');
      await loadAdminData();
      await refreshWebsiteData();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete achievement.', true);
    }
  };

  // --------------------------------------------------------------------------
  // Parent Testimonials CRUD
  // --------------------------------------------------------------------------
  const openTestimonialModal = (item?: any) => {
    setEditingItem(item || null);
    setModalForm(
      item
        ? { ...item }
        : {
            parentName: '',
            studentRelation: 'Parent of Grade 9 Scholar',
            content: '',
            rating: 5,
            avatarUrl: '',
            displayOrder: testimonials.length + 1,
            isPublished: true,
          }
    );
    setModalType('testimonial');
  };

  const handleSaveTestimonial = async () => {
    try {
      if (!modalForm.parentName?.trim() || !modalForm.content?.trim()) {
        showToast('Please provide both parent name and testimonial quote.', true);
        return;
      }
      if (editingItem) {
        await websiteApi.updateTestimonial(editingItem.id, modalForm);
        showToast('Testimonial updated.');
      } else {
        await websiteApi.createTestimonial(modalForm);
        showToast('New testimonial added.');
      }
      setModalType(null);
      await loadAdminData();
      await refreshWebsiteData();
    } catch (err: any) {
      showToast(err.message || 'Failed to save testimonial.', true);
    }
  };

  const handleDeleteTestimonial = async (id: string) => {
    if (!window.confirm('Delete this testimonial?')) return;
    try {
      await websiteApi.deleteTestimonial(id);
      showToast('Testimonial deleted.');
      await loadAdminData();
      await refreshWebsiteData();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete testimonial.', true);
    }
  };

  // --------------------------------------------------------------------------
  // Downloadable Documents CRUD
  // --------------------------------------------------------------------------
  const openDocumentModal = (item?: any) => {
    setEditingItem(item || null);
    setModalForm(
      item
        ? { ...item }
        : {
            title: '',
            description: '',
            fileUrl: '/documents/admission_form_2026_2027.pdf',
            category: 'ADMISSION_FORM',
            fileSize: '1.4 MB',
            fileType: 'PDF',
            displayOrder: documents.length + 1,
            isPublished: true,
          }
    );
    setModalType('document');
  };

  const handleSaveDocument = async () => {
    try {
      if (!modalForm.title?.trim() || !modalForm.fileUrl?.trim()) {
        showToast('Please provide document title and file URL.', true);
        return;
      }
      if (editingItem) {
        await websiteApi.updateDocument(editingItem.id, modalForm);
        showToast('Document updated.');
      } else {
        await websiteApi.createDocument(modalForm);
        showToast('New document added.');
      }
      setModalType(null);
      await loadAdminData();
      await refreshWebsiteData();
    } catch (err: any) {
      showToast(err.message || 'Failed to save document.', true);
    }
  };

  const handleDeleteDocument = async (id: string) => {
    if (!window.confirm('Delete this document?')) return;
    try {
      await websiteApi.deleteDocument(id);
      showToast('Document deleted.');
      await loadAdminData();
      await refreshWebsiteData();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete document.', true);
    }
  };

  // Filtered gallery items
  const filteredGalleryItems = galleryItems.filter((item) => {
    if (galleryCategoryFilter !== 'ALL' && item.categoryId !== galleryCategoryFilter) return false;
    if (galleryTypeFilter !== 'ALL' && item.mediaType !== galleryTypeFilter) return false;
    return true;
  });

  return (
    <div className="ed-page-container">
      {/* Page Header */}
      <div className="ed-page-header" style={{ marginBottom: 'var(--space-6)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span className="ed-badge ed-badge-info" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Globe size={13} />
                WEBSITE CMS & PORTAL MANAGEMENT
              </span>
              <Badge variant="success">PostgreSQL Database-Backed</Badge>
            </div>
            <h1 style={{ margin: 0, fontSize: '1.75rem', fontFamily: 'var(--font-crest)' }}>
              Dynamic School Website CMS
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: '4px 0 0' }}>
              Control all 17 public homepage sections, photo & video albums, branding, and admissions directly from this panel.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <Button
              variant="outline"
              size="sm"
              onClick={loadAdminData}
              disabled={loading}
              title="Reload content from database"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </Button>

            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="ed-btn-academic-forest"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                fontSize: '0.86rem',
                textDecoration: 'none',
              }}
            >
              <ExternalLink size={15} />
              <span>Preview Live Website</span>
            </a>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div
          style={{
            padding: '12px 16px',
            marginBottom: 'var(--space-4)',
            backgroundColor: '#ecfdf5',
            color: '#065f46',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid #a7f3d0',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <CheckCircle2 size={18} />
          <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div
          style={{
            padding: '12px 16px',
            marginBottom: 'var(--space-4)',
            backgroundColor: '#fef2f2',
            color: '#991b1b',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid #fecaca',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <AlertCircle size={18} />
          <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{errorMsg}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '4px',
          borderBottom: '2px solid var(--border-default)',
          marginBottom: 'var(--space-6)',
          overflowX: 'auto',
          paddingBottom: '2px',
        }}
      >
        <button
          onClick={() => setActiveTab('branding')}
          style={{
            padding: '10px 18px',
            fontWeight: activeTab === 'branding' ? 700 : 500,
            color: activeTab === 'branding' ? 'var(--color-primary)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'branding' ? '3px solid var(--color-primary)' : '3px solid transparent',
            background: 'none',
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.92rem',
            whiteSpace: 'nowrap',
          }}
        >
          <Layout size={16} />
          <span>Homepage & Branding</span>
        </button>

        <button
          onClick={() => setActiveTab('highlights')}
          style={{
            padding: '10px 18px',
            fontWeight: activeTab === 'highlights' ? 700 : 500,
            color: activeTab === 'highlights' ? 'var(--color-primary)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'highlights' ? '3px solid var(--color-primary)' : '3px solid transparent',
            background: 'none',
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.92rem',
            whiteSpace: 'nowrap',
          }}
        >
          <Star size={16} />
          <span>Why Choose Us ({highlights.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('facilities')}
          style={{
            padding: '10px 18px',
            fontWeight: activeTab === 'facilities' ? 700 : 500,
            color: activeTab === 'facilities' ? 'var(--color-primary)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'facilities' ? '3px solid var(--color-primary)' : '3px solid transparent',
            background: 'none',
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.92rem',
            whiteSpace: 'nowrap',
          }}
        >
          <Building size={16} />
          <span>Facilities & Campus ({facilities.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('gallery')}
          style={{
            padding: '10px 18px',
            fontWeight: activeTab === 'gallery' ? 700 : 500,
            color: activeTab === 'gallery' ? 'var(--color-primary)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'gallery' ? '3px solid var(--color-primary)' : '3px solid transparent',
            background: 'none',
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.92rem',
            whiteSpace: 'nowrap',
          }}
        >
          <ImageIcon size={16} />
          <span>Photo & Video Gallery ({galleryItems.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('achievements')}
          style={{
            padding: '10px 18px',
            fontWeight: activeTab === 'achievements' ? 700 : 500,
            color: activeTab === 'achievements' ? 'var(--color-primary)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'achievements' ? '3px solid var(--color-primary)' : '3px solid transparent',
            background: 'none',
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.92rem',
            whiteSpace: 'nowrap',
          }}
        >
          <Award size={16} />
          <span>Achievements & Reviews</span>
        </button>

        <button
          onClick={() => setActiveTab('documents')}
          style={{
            padding: '10px 18px',
            fontWeight: activeTab === 'documents' ? 700 : 500,
            color: activeTab === 'documents' ? 'var(--color-primary)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'documents' ? '3px solid var(--color-primary)' : '3px solid transparent',
            background: 'none',
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.92rem',
            whiteSpace: 'nowrap',
          }}
        >
          <FileText size={16} />
          <span>Admissions & Forms ({documents.length})</span>
        </button>
      </div>

      {/* ---------------------------------------------------------------------- */}
      {/* TAB 1: HOMEPAGE & BRANDING                                             */}
      {/* ---------------------------------------------------------------------- */}
      {activeTab === 'branding' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {/* Institutional Identity Card */}
          <div className="ed-card ed-card-body">
            <h3 style={{ fontSize: '1.18rem', marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={20} style={{ color: 'var(--color-primary)' }} />
              <span>School Institutional Identity & Contact</span>
            </h3>

            <div className="ed-grid-2" style={{ gap: '1rem' }}>
              <div className="ed-form-group">
                <label className="ed-label">Official School Name *</label>
                <input
                  type="text"
                  className="ed-input"
                  value={schoolData.name || ''}
                  onChange={(e) => setSchoolData({ ...schoolData, name: e.target.value })}
                  placeholder="e.g. Apex Academy of Sciences & Arts"
                />
              </div>

              <div className="ed-form-group">
                <label className="ed-label">Institutional Motto / Tagline</label>
                <input
                  type="text"
                  className="ed-input"
                  value={schoolData.motto || ''}
                  onChange={(e) => setSchoolData({ ...schoolData, motto: e.target.value })}
                  placeholder="e.g. Fostering Academic Excellence & Moral Purpose"
                />
              </div>

              <div className="ed-form-group">
                <label className="ed-label">Affiliation Charter / Board</label>
                <input
                  type="text"
                  className="ed-input"
                  value={schoolData.brandingConfig?.affiliation || 'CBSE & Cambridge Assessment'}
                  onChange={(e) =>
                    setSchoolData({
                      ...schoolData,
                      brandingConfig: { ...schoolData.brandingConfig, affiliation: e.target.value },
                    })
                  }
                  placeholder="e.g. CBSE & Cambridge Assessment"
                />
              </div>

              <div className="ed-form-group">
                <label className="ed-label">Established Year</label>
                <input
                  type="number"
                  className="ed-input"
                  value={schoolData.establishedYear || 1998}
                  onChange={(e) => setSchoolData({ ...schoolData, establishedYear: e.target.value })}
                />
              </div>

              <div className="ed-form-group">
                <label className="ed-label">Admissions Contact Email *</label>
                <input
                  type="email"
                  className="ed-input"
                  value={schoolData.email || ''}
                  onChange={(e) => setSchoolData({ ...schoolData, email: e.target.value })}
                />
              </div>

              <div className="ed-form-group">
                <label className="ed-label">Official Telephone Number *</label>
                <input
                  type="text"
                  className="ed-input"
                  value={schoolData.phone || ''}
                  onChange={(e) => setSchoolData({ ...schoolData, phone: e.target.value })}
                />
              </div>

              <div className="ed-form-group" style={{ gridColumn: 'span 2' }}>
                <label className="ed-label">Campus Physical Address *</label>
                <input
                  type="text"
                  className="ed-input"
                  value={schoolData.address || ''}
                  onChange={(e) => setSchoolData({ ...schoolData, address: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Hero Banner Section */}
          <div className="ed-card ed-card-body">
            <h3 style={{ fontSize: '1.18rem', marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layout size={20} style={{ color: 'var(--color-primary)' }} />
              <span>Section 1: Hero Banner & Primary CTAs</span>
            </h3>

            <div className="ed-grid-2" style={{ gap: '1rem' }}>
              <div className="ed-form-group" style={{ gridColumn: 'span 2' }}>
                <label className="ed-label">Hero Main Headline</label>
                <input
                  type="text"
                  className="ed-input"
                  value={content.heroTitle || ''}
                  onChange={(e) => setContent({ ...content, heroTitle: e.target.value })}
                  placeholder="Where Learning Inspires Every Possibility"
                />
              </div>

              <div className="ed-form-group" style={{ gridColumn: 'span 2' }}>
                <label className="ed-label">Hero Subtitle & Accreditation Notice</label>
                <textarea
                  className="ed-input"
                  rows={3}
                  value={content.heroSubtitle || ''}
                  onChange={(e) => setContent({ ...content, heroSubtitle: e.target.value })}
                />
              </div>

              <div className="ed-form-group">
                <label className="ed-label">Eyebrow Badge Text</label>
                <input
                  type="text"
                  className="ed-input"
                  value={content.heroEyebrowBadge || ''}
                  onChange={(e) => setContent({ ...content, heroEyebrowBadge: e.target.value })}
                  placeholder="Welcome to Apex Academy"
                />
              </div>

              <div className="ed-form-group">
                <label className="ed-label">Primary CTA Button Text</label>
                <input
                  type="text"
                  className="ed-input"
                  value={content.heroCtaText || ''}
                  onChange={(e) => setContent({ ...content, heroCtaText: e.target.value })}
                  placeholder="Admissions Open 2026-2027"
                />
              </div>

              <div className="ed-form-group">
                <label className="ed-label">Primary CTA Link Target</label>
                <input
                  type="text"
                  className="ed-input"
                  value={content.heroCtaLink || '/admissions'}
                  onChange={(e) => setContent({ ...content, heroCtaLink: e.target.value })}
                />
              </div>

              <div className="ed-form-group">
                <label className="ed-label">Secondary CTA Button Text</label>
                <input
                  type="text"
                  className="ed-input"
                  value={content.heroSecondaryCtaText || 'Explore Our School'}
                  onChange={(e) => setContent({ ...content, heroSecondaryCtaText: e.target.value })}
                />
              </div>

              {/* Hero Image Selection */}
              <div className="ed-form-group" style={{ gridColumn: 'span 2' }}>
                <label className="ed-label">Hero Background Image</label>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <input
                    type="text"
                    className="ed-input"
                    value={content.heroImageUrl || ''}
                    onChange={(e) => setContent({ ...content, heroImageUrl: e.target.value })}
                  />
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  Quick select from verified high-resolution campus photography:
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '8px' }}>
                  {SCHOOL_IMAGE_PRESETS.slice(0, 5).map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setContent({ ...content, heroImageUrl: p.url })}
                      style={{
                        padding: '4px',
                        border: content.heroImageUrl === p.url ? '2px solid var(--color-primary)' : '1px solid var(--border-default)',
                        borderRadius: '4px',
                        background: 'var(--bg-subtle)',
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      <img src={p.url} alt={p.label} style={{ width: '100%', height: '56px', objectFit: 'cover', borderRadius: '2px' }} />
                      <div style={{ fontSize: '0.68rem', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.label}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: About Our School */}
          <div className="ed-card ed-card-body">
            <h3 style={{ fontSize: '1.18rem', marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Building size={20} style={{ color: 'var(--color-primary)' }} />
              <span>Section 2: About Our School ("Our Story")</span>
            </h3>

            <div className="ed-grid-2" style={{ gap: '1rem' }}>
              <div className="ed-form-group">
                <label className="ed-label">About Section Title</label>
                <input
                  type="text"
                  className="ed-input"
                  value={content.aboutTitle || ''}
                  onChange={(e) => setContent({ ...content, aboutTitle: e.target.value })}
                />
              </div>

              <div className="ed-form-group">
                <label className="ed-label">About Subtitle</label>
                <input
                  type="text"
                  className="ed-input"
                  value={content.aboutSubtitle || ''}
                  onChange={(e) => setContent({ ...content, aboutSubtitle: e.target.value })}
                />
              </div>

              <div className="ed-form-group" style={{ gridColumn: 'span 2' }}>
                <label className="ed-label">About Story Narrative (Paragraphs)</label>
                <textarea
                  className="ed-input"
                  rows={5}
                  value={content.aboutStory || ''}
                  onChange={(e) => setContent({ ...content, aboutStory: e.target.value })}
                />
              </div>

              <div className="ed-form-group" style={{ gridColumn: 'span 2' }}>
                <label className="ed-label">About Section Featured Photo</label>
                <input
                  type="text"
                  className="ed-input"
                  value={content.aboutImageUrl || ''}
                  onChange={(e) => setContent({ ...content, aboutImageUrl: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Section 3: Principal's Desk */}
          <div className="ed-card ed-card-body">
            <h3 style={{ fontSize: '1.18rem', marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Award size={20} style={{ color: 'var(--color-primary)' }} />
              <span>Section 3: Principal's Desk & Message</span>
            </h3>

            <div className="ed-grid-2" style={{ gap: '1rem' }}>
              <div className="ed-form-group">
                <label className="ed-label">Principal Full Name</label>
                <input
                  type="text"
                  className="ed-input"
                  value={content.principalName || ''}
                  onChange={(e) => setContent({ ...content, principalName: e.target.value })}
                />
              </div>

              <div className="ed-form-group">
                <label className="ed-label">Principal Title / Designation</label>
                <input
                  type="text"
                  className="ed-input"
                  value={content.principalTitle || ''}
                  onChange={(e) => setContent({ ...content, principalTitle: e.target.value })}
                />
              </div>

              <div className="ed-form-group" style={{ gridColumn: 'span 2' }}>
                <label className="ed-label">Academic Credentials & Qualifications</label>
                <input
                  type="text"
                  className="ed-input"
                  value={content.principalQualification || ''}
                  onChange={(e) => setContent({ ...content, principalQualification: e.target.value })}
                />
              </div>

              <div className="ed-form-group" style={{ gridColumn: 'span 2' }}>
                <label className="ed-label">Principal's Excerpt Quote (Displayed on Homepage)</label>
                <textarea
                  className="ed-input"
                  rows={3}
                  value={content.principalMessageExcerpt || ''}
                  onChange={(e) => setContent({ ...content, principalMessageExcerpt: e.target.value })}
                />
              </div>

              <div className="ed-form-group" style={{ gridColumn: 'span 2' }}>
                <label className="ed-label">Principal's Full Official Message (Displayed on /principal-message)</label>
                <textarea
                  className="ed-input"
                  rows={6}
                  value={content.principalMessageFull || ''}
                  onChange={(e) => setContent({ ...content, principalMessageFull: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Mission & Vision */}
          <div className="ed-card ed-card-body">
            <h3 style={{ fontSize: '1.18rem', marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={20} style={{ color: 'var(--color-primary)' }} />
              <span>Institutional Vision & Mission Statements</span>
            </h3>

            <div className="ed-grid-2" style={{ gap: '1rem' }}>
              <div className="ed-form-group">
                <label className="ed-label">Institutional Vision</label>
                <textarea
                  className="ed-input"
                  rows={4}
                  value={content.vision || ''}
                  onChange={(e) => setContent({ ...content, vision: e.target.value })}
                />
              </div>

              <div className="ed-form-group">
                <label className="ed-label">Institutional Mission</label>
                <textarea
                  className="ed-input"
                  rows={4}
                  value={content.mission || ''}
                  onChange={(e) => setContent({ ...content, mission: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Admissions Open Banner */}
          <div className="ed-card ed-card-body">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
              <h3 style={{ fontSize: '1.18rem', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={20} style={{ color: 'var(--color-primary)' }} />
                <span>Section 15: Admissions Callout Banner</span>
              </h3>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={content.admissionNoticeOpen ?? true}
                  onChange={(e) => setContent({ ...content, admissionNoticeOpen: e.target.checked })}
                />
                <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>Admissions Currently Active</span>
              </label>
            </div>

            <div className="ed-grid-2" style={{ gap: '1rem' }}>
              <div className="ed-form-group">
                <label className="ed-label">Admissions Banner Headline</label>
                <input
                  type="text"
                  className="ed-input"
                  value={content.admissionNoticeTitle || ''}
                  onChange={(e) => setContent({ ...content, admissionNoticeTitle: e.target.value })}
                />
              </div>

              <div className="ed-form-group">
                <label className="ed-label">Academic Session Target</label>
                <input
                  type="text"
                  className="ed-input"
                  value={content.admissionSession || '2026–2027'}
                  onChange={(e) => setContent({ ...content, admissionSession: e.target.value })}
                />
              </div>

              <div className="ed-form-group" style={{ gridColumn: 'span 2' }}>
                <label className="ed-label">Admissions Description</label>
                <textarea
                  className="ed-input"
                  rows={3}
                  value={content.admissionNoticeDesc || ''}
                  onChange={(e) => setContent({ ...content, admissionNoticeDesc: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Floating / Sticky Save Bar */}
          <div
            style={{
              position: 'sticky',
              bottom: '1rem',
              backgroundColor: 'var(--bg-surface)',
              border: '2px solid var(--color-primary)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem 1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
              zIndex: 10,
            }}
          >
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.94rem' }}>Ready to persist changes?</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                All updates are saved directly to PostgreSQL and take effect immediately across public visitors.
              </div>
            </div>

            <Button variant="primary" onClick={handleSaveHomepage} disabled={saving}>
              <Save size={16} />
              <span>{saving ? 'Saving Changes...' : 'Save All Changes'}</span>
            </Button>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* TAB 2: WHY CHOOSE US (HIGHLIGHTS)                                      */}
      {/* ---------------------------------------------------------------------- */}
      {activeTab === 'highlights' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontFamily: 'var(--font-crest)' }}>
                Why Choose Our School Highlights (Pillars)
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', margin: '2px 0 0' }}>
                Institutional strength cards featured on Section 4 of the public homepage.
              </p>
            </div>
            <Button variant="primary" size="sm" onClick={() => openHighlightModal()}>
              <Plus size={15} />
              <span>Add New Highlight</span>
            </Button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
            {highlights.map((h) => (
              <div key={h.id} className="ed-card ed-card-body" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span className="ed-badge ed-badge-info" style={{ fontSize: '0.72rem' }}>
                      Order #{h.displayOrder}
                    </span>
                    <button
                      onClick={() => handleToggleHighlightPublish(h)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                      title={h.isPublished ? 'Click to unpublish' : 'Click to publish'}
                    >
                      <Badge variant={h.isPublished ? 'success' : 'neutral'}>
                        {h.isPublished ? 'Published' : 'Hidden'}
                      </Badge>
                    </button>
                  </div>

                  <h4 style={{ fontSize: '1.02rem', margin: '0 0 6px', color: 'var(--text-primary)' }}>{h.title}</h4>
                  <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                    {h.description}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '12px', borderTop: '1px solid var(--border-default)', paddingTop: '10px' }}>
                  <Button variant="outline" size="sm" onClick={() => openHighlightModal(h)}>
                    <Edit size={14} />
                    <span>Edit</span>
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDeleteHighlight(h.id)} style={{ color: '#dc2626' }}>
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* TAB 3: FACILITIES & CAMPUS INFRASTRUCTURE                              */}
      {/* ---------------------------------------------------------------------- */}
      {activeTab === 'facilities' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontFamily: 'var(--font-crest)' }}>
                Campus Facilities & Learning Spaces
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', margin: '2px 0 0' }}>
                Image-led facility cards on Section 6 of the homepage with photographs and descriptions.
              </p>
            </div>
            <Button variant="primary" size="sm" onClick={() => openFacilityModal()}>
              <Plus size={15} />
              <span>Add Facility</span>
            </Button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {facilities.map((fac) => (
              <div key={fac.id} className="ed-card" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={{ height: '160px', position: 'relative', overflow: 'hidden' }}>
                  <img
                    src={fac.imageUrl || '/images/school/hero_classroom.jpg'}
                    alt={fac.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <span
                    style={{
                      position: 'absolute',
                      top: '10px',
                      left: '10px',
                      backgroundColor: 'rgba(0,0,0,0.65)',
                      color: '#ffffff',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '4px',
                    }}
                  >
                    {fac.category}
                  </span>
                  <div style={{ position: 'absolute', top: '10px', right: '10px' }}>
                    <button
                      onClick={() => handleToggleFacilityPublish(fac)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                    >
                      <Badge variant={fac.isPublished ? 'success' : 'neutral'}>
                        {fac.isPublished ? 'Live' : 'Hidden'}
                      </Badge>
                    </button>
                  </div>
                </div>

                <div className="ed-card-body" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <h4 style={{ fontSize: '1.05rem', margin: '0 0 6px' }}>{fac.name}</h4>
                    <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                      {fac.description}
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '12px', borderTop: '1px solid var(--border-default)', paddingTop: '10px' }}>
                    <Button variant="outline" size="sm" onClick={() => openFacilityModal(fac)}>
                      <Edit size={14} />
                      <span>Edit</span>
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDeleteFacility(fac.id)} style={{ color: '#dc2626' }}>
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* TAB 4: PHOTO & VIDEO GALLERY                                           */}
      {/* ---------------------------------------------------------------------- */}
      {activeTab === 'gallery' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {/* Category Albums Sub-Section */}
          <div className="ed-card ed-card-body">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ImageIcon size={18} style={{ color: 'var(--color-primary)' }} />
                  <span>Album Categories ({categories.length})</span>
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: '2px 0 0' }}>
                  Manage photo and video album collections.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => openCategoryModal()}>
                <Plus size={14} />
                <span>Create Album</span>
              </Button>
            </div>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '6px',
                    backgroundColor: 'var(--bg-subtle)',
                    border: '1px solid var(--border-default)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                >
                  <img
                    src={cat.coverImageUrl || '/images/school/hero_classroom.jpg'}
                    alt={cat.name}
                    style={{ width: '28px', height: '28px', borderRadius: '4px', objectFit: 'cover' }}
                  />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.86rem' }}>{cat.name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      slug: {cat.slug} • {cat._count?.items ?? 0} media items
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '4px', marginLeft: '6px' }}>
                    <button
                      onClick={() => openCategoryModal(cat)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)', padding: '2px' }}
                      title="Edit Album"
                    >
                      <Edit size={13} />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(cat.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', padding: '2px' }}
                      title="Delete Album"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Media Items Toolbar & Filters */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <select
                className="ed-input"
                style={{ width: 'auto', padding: '6px 12px', fontSize: '0.86rem' }}
                value={galleryCategoryFilter}
                onChange={(e) => setGalleryCategoryFilter(e.target.value)}
              >
                <option value="ALL">All Albums ({galleryItems.length})</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              <select
                className="ed-input"
                style={{ width: 'auto', padding: '6px 12px', fontSize: '0.86rem' }}
                value={galleryTypeFilter}
                onChange={(e) => setGalleryTypeFilter(e.target.value as any)}
              >
                <option value="ALL">All Media</option>
                <option value="IMAGE">Photos Only</option>
                <option value="VIDEO">Videos Only</option>
              </select>
            </div>

            <Button variant="primary" size="sm" onClick={() => openGalleryItemModal()}>
              <Plus size={15} />
              <span>Add Media (Photo / Video)</span>
            </Button>
          </div>

          {/* Gallery Media Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
            {filteredGalleryItems.map((item) => (
              <div key={item.id} className="ed-card" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={{ height: '150px', position: 'relative', overflow: 'hidden', backgroundColor: '#000000' }}>
                  <img
                    src={item.thumbnailUrl || item.mediaUrl || '/images/school/hero_classroom.jpg'}
                    alt={item.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      top: '8px',
                      left: '8px',
                      display: 'flex',
                      gap: '4px',
                    }}
                  >
                    <span
                      style={{
                        backgroundColor: item.mediaType === 'VIDEO' ? '#dc2626' : 'rgba(0,0,0,0.7)',
                        color: '#ffffff',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        padding: '2px 7px',
                        borderRadius: '3px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      {item.mediaType === 'VIDEO' ? <Video size={11} /> : <ImageIcon size={11} />}
                      <span>{item.mediaType}</span>
                    </span>
                    {item.isFeatured && (
                      <span
                        style={{
                          backgroundColor: 'var(--academic-gold-500)',
                          color: '#000000',
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: '3px',
                        }}
                      >
                        Featured
                      </span>
                    )}
                  </div>

                  <div style={{ position: 'absolute', top: '8px', right: '8px' }}>
                    <button
                      onClick={() => handleToggleGalleryItemPublish(item)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                    >
                      <Badge variant={item.isPublished ? 'success' : 'neutral'}>
                        {item.isPublished ? 'Live' : 'Hidden'}
                      </Badge>
                    </button>
                  </div>
                </div>

                <div className="ed-card-body" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <h4 style={{ fontSize: '0.96rem', margin: '0 0 4px' }}>{item.title}</h4>
                    {item.caption && (
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.45, margin: 0 }}>
                        {item.caption}
                      </p>
                    )}
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                      Album: {item.category?.name || 'Uncategorized'}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '10px', borderTop: '1px solid var(--border-default)', paddingTop: '8px' }}>
                    <Button variant="outline" size="sm" onClick={() => openGalleryItemModal(item)}>
                      <Edit size={13} />
                      <span>Edit</span>
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDeleteGalleryItem(item.id)} style={{ color: '#dc2626' }}>
                      <Trash2 size={13} />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* TAB 5: ACHIEVEMENTS & TESTIMONIALS                                     */}
      {/* ---------------------------------------------------------------------- */}
      {activeTab === 'achievements' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
          {/* Student Achievements */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontFamily: 'var(--font-crest)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Award size={20} style={{ color: 'var(--color-primary)' }} />
                  <span>Student Honors & Achievements ({achievements.length})</span>
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', margin: '2px 0 0' }}>
                  National Olympiad, science fair, and athletic award winners shown on Section 10 of the homepage.
                </p>
              </div>
              <Button variant="primary" size="sm" onClick={() => openAchievementModal()}>
                <Plus size={15} />
                <span>Add Achievement</span>
              </Button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
              {achievements.map((a) => (
                <div key={a.id} className="ed-card ed-card-body" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span className="ed-badge ed-badge-info" style={{ fontSize: '0.7rem' }}>
                        {a.academicYear}
                      </span>
                      <Badge variant={a.isPublished ? 'success' : 'neutral'}>
                        {a.isPublished ? 'Published' : 'Hidden'}
                      </Badge>
                    </div>
                    <h4 style={{ fontSize: '1rem', margin: '0 0 4px' }}>{a.title}</h4>
                    <div style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--color-primary)', marginBottom: '4px' }}>
                      {a.studentName} {a.competition ? `• ${a.competition}` : ''}
                    </div>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                      {a.description}
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '12px', borderTop: '1px solid var(--border-default)', paddingTop: '10px' }}>
                    <Button variant="outline" size="sm" onClick={() => openAchievementModal(a)}>
                      <Edit size={14} />
                      <span>Edit</span>
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDeleteAchievement(a.id)} style={{ color: '#dc2626' }}>
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Parent Testimonials */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontFamily: 'var(--font-crest)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MessageSquare size={20} style={{ color: 'var(--color-primary)' }} />
                  <span>Parent Testimonials & Endorsements ({testimonials.length})</span>
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', margin: '2px 0 0' }}>
                  Parent reviews and satisfaction testimonials displayed on Section 13 of the homepage.
                </p>
              </div>
              <Button variant="primary" size="sm" onClick={() => openTestimonialModal()}>
                <Plus size={15} />
                <span>Add Testimonial</span>
              </Button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
              {testimonials.map((t) => (
                <div key={t.id} className="ed-card ed-card-body" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', color: 'var(--academic-gold-500)', fontSize: '0.9rem' }}>
                        {'★'.repeat(t.rating || 5)}
                      </div>
                      <Badge variant={t.isPublished ? 'success' : 'neutral'}>
                        {t.isPublished ? 'Published' : 'Hidden'}
                      </Badge>
                    </div>
                    <p style={{ fontStyle: 'italic', fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 10px' }}>
                      "{t.content}"
                    </p>
                    <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>{t.parentName}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{t.studentRelation}</div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '12px', borderTop: '1px solid var(--border-default)', paddingTop: '10px' }}>
                    <Button variant="outline" size="sm" onClick={() => openTestimonialModal(t)}>
                      <Edit size={14} />
                      <span>Edit</span>
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDeleteTestimonial(t.id)} style={{ color: '#dc2626' }}>
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* TAB 6: ADMISSIONS & DOWNLOADABLE FORMS                                 */}
      {/* ---------------------------------------------------------------------- */}
      {activeTab === 'documents' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontFamily: 'var(--font-crest)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={20} style={{ color: 'var(--color-primary)' }} />
                <span>Downloadable Admission Forms & Circulars ({documents.length})</span>
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', margin: '2px 0 0' }}>
                PDF application forms, prospectus, syllabus, and official circulars for parents to download.
              </p>
            </div>
            <Button variant="primary" size="sm" onClick={() => openDocumentModal()}>
              <Plus size={15} />
              <span>Add Document</span>
            </Button>
          </div>

          <div className="ed-card" style={{ overflow: 'hidden' }}>
            <table className="ed-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Document Title</th>
                  <th>File Format & Size</th>
                  <th>File URL / Path</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr key={doc.id}>
                    <td>
                      <span className="ed-badge ed-badge-info" style={{ fontSize: '0.74rem' }}>
                        {doc.category}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{doc.title}</div>
                      {doc.description && <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{doc.description}</div>}
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, fontSize: '0.84rem' }}>{doc.fileType}</span>{' '}
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>({doc.fileSize})</span>
                    </td>
                    <td>
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{ fontSize: '0.82rem', color: 'var(--color-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <ExternalLink size={12} />
                        <span style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {doc.fileUrl}
                        </span>
                      </a>
                    </td>
                    <td>
                      <Badge variant={doc.isPublished ? 'success' : 'neutral'}>
                        {doc.isPublished ? 'Published' : 'Hidden'}
                      </Badge>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <Button variant="outline" size="sm" onClick={() => openDocumentModal(doc)}>
                          <Edit size={13} />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDeleteDocument(doc.id)} style={{ color: '#dc2626' }}>
                          <Trash2 size={13} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* MODALS                                                                 */}
      {/* ---------------------------------------------------------------------- */}

      {/* 1. Highlight Modal */}
      {modalType === 'highlight' && (
        <Modal
          isOpen={true}
          onClose={() => setModalType(null)}
          title={editingItem ? 'Edit Highlight' : 'Add Why Choose Us Highlight'}
          footer={
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <Button variant="outline" onClick={() => setModalType(null)}>Cancel</Button>
              <Button variant="primary" onClick={handleSaveHighlight}>Save Highlight</Button>
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="ed-form-group">
              <label className="ed-label">Title *</label>
              <input
                type="text"
                className="ed-input"
                value={modalForm.title || ''}
                onChange={(e) => setModalForm({ ...modalForm, title: e.target.value })}
                placeholder="e.g. Dedicated & Qualified Faculty"
              />
            </div>
            <div className="ed-form-group">
              <label className="ed-label">Description *</label>
              <textarea
                className="ed-input"
                rows={3}
                value={modalForm.description || ''}
                onChange={(e) => setModalForm({ ...modalForm, description: e.target.value })}
              />
            </div>
            <div className="ed-grid-2" style={{ gap: '1rem' }}>
              <div className="ed-form-group">
                <label className="ed-label">Display Order</label>
                <input
                  type="number"
                  className="ed-input"
                  value={modalForm.displayOrder ?? 1}
                  onChange={(e) => setModalForm({ ...modalForm, displayOrder: Number(e.target.value) })}
                />
              </div>
              <div className="ed-form-group" style={{ display: 'flex', alignItems: 'center', marginTop: '24px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={modalForm.isPublished ?? true}
                    onChange={(e) => setModalForm({ ...modalForm, isPublished: e.target.checked })}
                  />
                  <span>Published on Website</span>
                </label>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* 2. Facility Modal */}
      {modalType === 'facility' && (
        <Modal
          isOpen={true}
          onClose={() => setModalType(null)}
          title={editingItem ? 'Edit Campus Facility' : 'Add Campus Facility'}
          maxWidth="640px"
          footer={
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <Button variant="outline" onClick={() => setModalType(null)}>Cancel</Button>
              <Button variant="primary" onClick={handleSaveFacility}>Save Facility</Button>
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="ed-form-group">
              <label className="ed-label">Facility Name *</label>
              <input
                type="text"
                className="ed-input"
                value={modalForm.name || ''}
                onChange={(e) => setModalForm({ ...modalForm, name: e.target.value })}
                placeholder="e.g. Advanced Science Laboratories"
              />
            </div>
            <div className="ed-grid-2" style={{ gap: '1rem' }}>
              <div className="ed-form-group">
                <label className="ed-label">Category / Badge</label>
                <input
                  type="text"
                  className="ed-input"
                  value={modalForm.category || ''}
                  onChange={(e) => setModalForm({ ...modalForm, category: e.target.value })}
                  placeholder="e.g. Practical Inquiry"
                />
              </div>
              <div className="ed-form-group">
                <label className="ed-label">Display Order</label>
                <input
                  type="number"
                  className="ed-input"
                  value={modalForm.displayOrder ?? 1}
                  onChange={(e) => setModalForm({ ...modalForm, displayOrder: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="ed-form-group">
              <label className="ed-label">Facility Description</label>
              <textarea
                className="ed-input"
                rows={3}
                value={modalForm.description || ''}
                onChange={(e) => setModalForm({ ...modalForm, description: e.target.value })}
              />
            </div>
            <div className="ed-form-group">
              <label className="ed-label">Facility Image URL</label>
              <input
                type="text"
                className="ed-input"
                value={modalForm.imageUrl || ''}
                onChange={(e) => setModalForm({ ...modalForm, imageUrl: e.target.value })}
              />
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Preset school photography presets:
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '6px', marginTop: '6px' }}>
                {SCHOOL_IMAGE_PRESETS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setModalForm({ ...modalForm, imageUrl: p.url })}
                    style={{
                      padding: '3px',
                      border: modalForm.imageUrl === p.url ? '2px solid var(--color-primary)' : '1px solid var(--border-default)',
                      borderRadius: '4px',
                      background: 'var(--bg-subtle)',
                      cursor: 'pointer',
                    }}
                  >
                    <img src={p.url} alt={p.label} style={{ width: '100%', height: '42px', objectFit: 'cover' }} />
                    <div style={{ fontSize: '0.62rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.label}</div>
                  </button>
                ))}
              </div>
            </div>
            <div className="ed-form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={modalForm.isPublished ?? true}
                  onChange={(e) => setModalForm({ ...modalForm, isPublished: e.target.checked })}
                />
                <span>Published on Website</span>
              </label>
            </div>
          </div>
        </Modal>
      )}

      {/* 3. Category Modal */}
      {modalType === 'category' && (
        <Modal
          isOpen={true}
          onClose={() => setModalType(null)}
          title={editingItem ? 'Edit Album Category' : 'Create Gallery Album'}
          footer={
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <Button variant="outline" onClick={() => setModalType(null)}>Cancel</Button>
              <Button variant="primary" onClick={handleSaveCategory}>Save Album</Button>
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="ed-form-group">
              <label className="ed-label">Album Name *</label>
              <input
                type="text"
                className="ed-input"
                value={modalForm.name || ''}
                onChange={(e) => setModalForm({ ...modalForm, name: e.target.value })}
                placeholder="e.g. Campus Infrastructure"
              />
            </div>
            <div className="ed-form-group">
              <label className="ed-label">Slug Identifier (optional, auto-generated)</label>
              <input
                type="text"
                className="ed-input"
                value={modalForm.slug || ''}
                onChange={(e) => setModalForm({ ...modalForm, slug: e.target.value })}
                placeholder="campus-infrastructure"
              />
            </div>
            <div className="ed-form-group">
              <label className="ed-label">Description</label>
              <textarea
                className="ed-input"
                rows={2}
                value={modalForm.description || ''}
                onChange={(e) => setModalForm({ ...modalForm, description: e.target.value })}
              />
            </div>
            <div className="ed-form-group">
              <label className="ed-label">Cover Image URL</label>
              <input
                type="text"
                className="ed-input"
                value={modalForm.coverImageUrl || ''}
                onChange={(e) => setModalForm({ ...modalForm, coverImageUrl: e.target.value })}
              />
            </div>
          </div>
        </Modal>
      )}

      {/* 4. Gallery Item Modal */}
      {modalType === 'galleryItem' && (
        <Modal
          isOpen={true}
          onClose={() => setModalType(null)}
          title={editingItem ? 'Edit Media Item' : 'Add Photo / Video to Gallery'}
          maxWidth="640px"
          footer={
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <Button variant="outline" onClick={() => setModalType(null)}>Cancel</Button>
              <Button variant="primary" onClick={handleSaveGalleryItem}>Save Media</Button>
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="ed-grid-2" style={{ gap: '1rem' }}>
              <div className="ed-form-group">
                <label className="ed-label">Media Type</label>
                <select
                  className="ed-input"
                  value={modalForm.mediaType || 'IMAGE'}
                  onChange={(e) => setModalForm({ ...modalForm, mediaType: e.target.value })}
                >
                  <option value="IMAGE">Photo / High-Res Image</option>
                  <option value="VIDEO">Video (YouTube Embed)</option>
                </select>
              </div>

              <div className="ed-form-group">
                <label className="ed-label">Album Category *</label>
                <select
                  className="ed-input"
                  value={modalForm.categoryId || ''}
                  onChange={(e) => setModalForm({ ...modalForm, categoryId: e.target.value })}
                >
                  <option value="">Select Album Category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="ed-form-group">
              <label className="ed-label">Title *</label>
              <input
                type="text"
                className="ed-input"
                value={modalForm.title || ''}
                onChange={(e) => setModalForm({ ...modalForm, title: e.target.value })}
                placeholder="e.g. Senior Secondary Physics Practical"
              />
            </div>

            <div className="ed-form-group">
              <label className="ed-label">Caption / Description</label>
              <textarea
                className="ed-input"
                rows={2}
                value={modalForm.caption || ''}
                onChange={(e) => setModalForm({ ...modalForm, caption: e.target.value })}
              />
            </div>

            {modalForm.mediaType === 'VIDEO' ? (
              <div className="ed-form-group">
                <label className="ed-label">YouTube Video URL *</label>
                <input
                  type="text"
                  className="ed-input"
                  value={modalForm.videoUrl || ''}
                  onChange={(e) => setModalForm({ ...modalForm, videoUrl: e.target.value })}
                  placeholder="https://www.youtube.com/watch?v=3bj_KM9bnW8"
                />
              </div>
            ) : (
              <div className="ed-form-group">
                <label className="ed-label">Photo Image URL *</label>
                <input
                  type="text"
                  className="ed-input"
                  value={modalForm.mediaUrl || ''}
                  onChange={(e) => setModalForm({ ...modalForm, mediaUrl: e.target.value, thumbnailUrl: e.target.value })}
                />
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Preset school photography:
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '6px', marginTop: '6px' }}>
                  {SCHOOL_IMAGE_PRESETS.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setModalForm({ ...modalForm, mediaUrl: p.url, thumbnailUrl: p.url })}
                      style={{
                        padding: '3px',
                        border: modalForm.mediaUrl === p.url ? '2px solid var(--color-primary)' : '1px solid var(--border-default)',
                        borderRadius: '4px',
                        background: 'var(--bg-subtle)',
                        cursor: 'pointer',
                      }}
                    >
                      <img src={p.url} alt={p.label} style={{ width: '100%', height: '42px', objectFit: 'cover' }} />
                      <div style={{ fontSize: '0.62rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.label}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="ed-grid-2" style={{ gap: '1rem' }}>
              <div className="ed-form-group">
                <label className="ed-label">Display Order</label>
                <input
                  type="number"
                  className="ed-input"
                  value={modalForm.displayOrder ?? 1}
                  onChange={(e) => setModalForm({ ...modalForm, displayOrder: Number(e.target.value) })}
                />
              </div>

              <div className="ed-form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '20px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={modalForm.isFeatured ?? false}
                    onChange={(e) => setModalForm({ ...modalForm, isFeatured: e.target.checked })}
                  />
                  <span>Featured on Homepage</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={modalForm.isPublished ?? true}
                    onChange={(e) => setModalForm({ ...modalForm, isPublished: e.target.checked })}
                  />
                  <span>Published Live</span>
                </label>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* 5. Achievement Modal */}
      {modalType === 'achievement' && (
        <Modal
          isOpen={true}
          onClose={() => setModalType(null)}
          title={editingItem ? 'Edit Achievement' : 'Add Student Achievement'}
          footer={
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <Button variant="outline" onClick={() => setModalType(null)}>Cancel</Button>
              <Button variant="primary" onClick={handleSaveAchievement}>Save</Button>
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="ed-form-group">
              <label className="ed-label">Award Title *</label>
              <input
                type="text"
                className="ed-input"
                value={modalForm.title || ''}
                onChange={(e) => setModalForm({ ...modalForm, title: e.target.value })}
                placeholder="e.g. National Cyber Olympiad Gold Medal"
              />
            </div>
            <div className="ed-grid-2" style={{ gap: '1rem' }}>
              <div className="ed-form-group">
                <label className="ed-label">Student Name *</label>
                <input
                  type="text"
                  className="ed-input"
                  value={modalForm.studentName || ''}
                  onChange={(e) => setModalForm({ ...modalForm, studentName: e.target.value })}
                  placeholder="e.g. Aryan Sharma (Grade 10)"
                />
              </div>
              <div className="ed-form-group">
                <label className="ed-label">Competition / Event</label>
                <input
                  type="text"
                  className="ed-input"
                  value={modalForm.competition || ''}
                  onChange={(e) => setModalForm({ ...modalForm, competition: e.target.value })}
                  placeholder="e.g. SOF Olympiad Foundation"
                />
              </div>
            </div>
            <div className="ed-form-group">
              <label className="ed-label">Description</label>
              <textarea
                className="ed-input"
                rows={3}
                value={modalForm.description || ''}
                onChange={(e) => setModalForm({ ...modalForm, description: e.target.value })}
              />
            </div>
            <div className="ed-grid-2" style={{ gap: '1rem' }}>
              <div className="ed-form-group">
                <label className="ed-label">Academic Year</label>
                <input
                  type="text"
                  className="ed-input"
                  value={modalForm.academicYear || '2025-2026'}
                  onChange={(e) => setModalForm({ ...modalForm, academicYear: e.target.value })}
                />
              </div>
              <div className="ed-form-group" style={{ display: 'flex', alignItems: 'center', marginTop: '24px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={modalForm.isPublished ?? true}
                    onChange={(e) => setModalForm({ ...modalForm, isPublished: e.target.checked })}
                  />
                  <span>Published on Website</span>
                </label>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* 6. Testimonial Modal */}
      {modalType === 'testimonial' && (
        <Modal
          isOpen={true}
          onClose={() => setModalType(null)}
          title={editingItem ? 'Edit Testimonial' : 'Add Parent Testimonial'}
          footer={
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <Button variant="outline" onClick={() => setModalType(null)}>Cancel</Button>
              <Button variant="primary" onClick={handleSaveTestimonial}>Save</Button>
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="ed-grid-2" style={{ gap: '1rem' }}>
              <div className="ed-form-group">
                <label className="ed-label">Parent Name *</label>
                <input
                  type="text"
                  className="ed-input"
                  value={modalForm.parentName || ''}
                  onChange={(e) => setModalForm({ ...modalForm, parentName: e.target.value })}
                  placeholder="e.g. Dr. Sunita Mehra"
                />
              </div>
              <div className="ed-form-group">
                <label className="ed-label">Student Relation / Grade</label>
                <input
                  type="text"
                  className="ed-input"
                  value={modalForm.studentRelation || ''}
                  onChange={(e) => setModalForm({ ...modalForm, studentRelation: e.target.value })}
                  placeholder="e.g. Parent of Grade 9 Scholar"
                />
              </div>
            </div>
            <div className="ed-form-group">
              <label className="ed-label">Testimonial Quote *</label>
              <textarea
                className="ed-input"
                rows={4}
                value={modalForm.content || ''}
                onChange={(e) => setModalForm({ ...modalForm, content: e.target.value })}
                placeholder="Write parent feedback..."
              />
            </div>
            <div className="ed-grid-2" style={{ gap: '1rem' }}>
              <div className="ed-form-group">
                <label className="ed-label">Star Rating (1 to 5)</label>
                <select
                  className="ed-input"
                  value={modalForm.rating ?? 5}
                  onChange={(e) => setModalForm({ ...modalForm, rating: Number(e.target.value) })}
                >
                  <option value={5}>5 Stars (Exceptional)</option>
                  <option value={4}>4 Stars (Very Good)</option>
                  <option value={3}>3 Stars (Satisfactory)</option>
                </select>
              </div>
              <div className="ed-form-group" style={{ display: 'flex', alignItems: 'center', marginTop: '24px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={modalForm.isPublished ?? true}
                    onChange={(e) => setModalForm({ ...modalForm, isPublished: e.target.checked })}
                  />
                  <span>Published on Website</span>
                </label>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* 7. Document Modal */}
      {modalType === 'document' && (
        <Modal
          isOpen={true}
          onClose={() => setModalType(null)}
          title={editingItem ? 'Edit Document' : 'Add Downloadable Document'}
          footer={
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <Button variant="outline" onClick={() => setModalType(null)}>Cancel</Button>
              <Button variant="primary" onClick={handleSaveDocument}>Save Document</Button>
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="ed-form-group">
              <label className="ed-label">Document Title *</label>
              <input
                type="text"
                className="ed-input"
                value={modalForm.title || ''}
                onChange={(e) => setModalForm({ ...modalForm, title: e.target.value })}
                placeholder="e.g. Official Admission Form 2026-2027"
              />
            </div>
            <div className="ed-grid-2" style={{ gap: '1rem' }}>
              <div className="ed-form-group">
                <label className="ed-label">Category</label>
                <select
                  className="ed-input"
                  value={modalForm.category || 'ADMISSION_FORM'}
                  onChange={(e) => setModalForm({ ...modalForm, category: e.target.value })}
                >
                  <option value="ADMISSION_FORM">Admission Form</option>
                  <option value="PROSPECTUS">School Prospectus</option>
                  <option value="SYLLABUS">Academic Syllabus</option>
                  <option value="FEE_STRUCTURE">Fee Structure</option>
                  <option value="CIRCULAR">Administrative Circular</option>
                </select>
              </div>
              <div className="ed-form-group">
                <label className="ed-label">File Type</label>
                <input
                  type="text"
                  className="ed-input"
                  value={modalForm.fileType || 'PDF'}
                  onChange={(e) => setModalForm({ ...modalForm, fileType: e.target.value })}
                />
              </div>
            </div>
            <div className="ed-grid-2" style={{ gap: '1rem' }}>
              <div className="ed-form-group">
                <label className="ed-label">File URL or Path *</label>
                <input
                  type="text"
                  className="ed-input"
                  value={modalForm.fileUrl || ''}
                  onChange={(e) => setModalForm({ ...modalForm, fileUrl: e.target.value })}
                  placeholder="/documents/admission_form.pdf"
                />
              </div>
              <div className="ed-form-group">
                <label className="ed-label">File Size (e.g. 1.2 MB)</label>
                <input
                  type="text"
                  className="ed-input"
                  value={modalForm.fileSize || '1.2 MB'}
                  onChange={(e) => setModalForm({ ...modalForm, fileSize: e.target.value })}
                />
              </div>
            </div>
            <div className="ed-form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={modalForm.isPublished ?? true}
                  onChange={(e) => setModalForm({ ...modalForm, isPublished: e.target.checked })}
                />
                <span>Published on Website</span>
              </label>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

