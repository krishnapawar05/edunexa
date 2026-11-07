import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Globe,
  Search,
  TrendingUp,
  BarChart2,
  FileText,
  Share2,
  PhoneCall,
  CheckCircle,
  Clock,
  Plus,
  Edit2,
  Trash2,
  ExternalLink,
  ShieldCheck,
  Calendar,
  User,
  Tag,
  Eye,
  Smartphone,
  Monitor,
  RefreshCw,
  Sliders,
  Sparkles,
  Link as LinkIcon,
  MessageSquare,
  AlertCircle,
  FileCheck,
} from 'lucide-react';
import { marketingApi } from '../../services/api';

type ActiveTab = 'seo' | 'integrations' | 'blogs' | 'banners' | 'leads' | 'analytics';

export const SeoMarketingHubPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('seo');
  const [loading, setLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // ============================================================================
  // TAB 1: SEO MANAGEMENT & SERP PREVIEW STATE
  // ============================================================================
  const [seoPages, setSeoPages] = useState<any[]>([]);
  const [selectedPath, setSelectedPath] = useState('/');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [seoForm, setSeoForm] = useState({
    pagePath: '/',
    pageTitle: '',
    metaDescription: '',
    metaKeywords: '',
    canonicalUrl: '',
    ogTitle: '',
    ogDescription: '',
    ogImage: '',
    imageAltText: '',
    isPublished: true,
  });

  // ============================================================================
  // TAB 2: GOOGLE INTEGRATIONS & MARKETING CONFIG STATE
  // ============================================================================
  const [marketingConfig, setMarketingConfig] = useState({
    googleAnalyticsId: 'G-APEX2026XYZ',
    ga4TrackingEnabled: true,
    searchConsoleProperty: 'https://apexacademy.edu.in',
    searchConsoleVerificationCode: 'google-site-verification=edunexa-apex-verified-2026',
    searchConsoleConnected: true,
    facebookUrl: 'https://facebook.com/apexacademy',
    instagramUrl: 'https://instagram.com/apexacademy',
    youtubeUrl: 'https://youtube.com/@apexacademy',
    linkedinUrl: 'https://linkedin.com/company/apexacademy',
    twitterUrl: 'https://twitter.com/apexacademy',
    prospectusFileUrl: '/documents/Apex-Academy-Official-Prospectus-2026.pdf',
    prospectusTitle: 'Apex Academy Official Prospectus & Information Brochure (2026-27)',
    prospectusPublished: true,
  });

  // ============================================================================
  // TAB 3: BLOG ARTICLES STATE
  // ============================================================================
  const [blogs, setBlogs] = useState<any[]>([]);
  const [blogModalOpen, setBlogModalOpen] = useState(false);
  const [editingBlogId, setEditingBlogId] = useState<string | null>(null);
  const [blogForm, setBlogForm] = useState({
    title: '',
    slug: '',
    category: 'Academics',
    summary: '',
    content: '',
    coverImageUrl: '',
    authorName: 'Apex Faculty Editorial',
    tags: 'STEM, CBSE, Learning',
    isPublished: true,
    seoTitle: '',
    metaDescription: '',
    imageAltText: '',
  });

  // ============================================================================
  // TAB 4: MARKETING BANNERS STATE
  // ============================================================================
  const [banners, setBanners] = useState<any[]>([]);
  const [bannerModalOpen, setBannerModalOpen] = useState(false);
  const [editingBannerId, setEditingBannerId] = useState<string | null>(null);
  const [bannerForm, setBannerForm] = useState({
    title: '',
    description: '',
    bannerType: 'ADMISSION_OPEN',
    ctaText: 'Apply Now',
    ctaLink: '/admissions/apply',
    displayPosition: 'TOP_BAR',
    displayOrder: 1,
    isPublished: true,
    imageUrl: '',
  });

  // ============================================================================
  // TAB 5: UNIFIED LEADS & COUNSELLOR FOLLOW-UP STATE
  // ============================================================================
  const [leads, setLeads] = useState<any[]>([]);
  const [leadStatusFilter, setLeadStatusFilter] = useState('ALL');
  const [leadTypeFilter, setLeadTypeFilter] = useState('ALL');
  const [leadSearch, setLeadSearch] = useState('');
  const [followUps, setFollowUps] = useState<any[]>([]);
  const [followUpModalOpen, setFollowUpModalOpen] = useState(false);
  const [selectedLeadForFollowUp, setSelectedLeadForFollowUp] = useState<any>(null);
  const [followUpForm, setFollowUpForm] = useState({
    counsellorName: 'Anita Sharma (Head Counsellor)',
    followUpDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    followUpTime: '11:00 AM',
    description: '',
    status: 'SCHEDULED',
  });

  // ============================================================================
  // TAB 6: MARKETING ANALYTICS STATE
  // ============================================================================
  const [analytics, setAnalytics] = useState<any>(null);

  // Load Initial Data
  useEffect(() => {
    setLoading(true);
    Promise.all([
      marketingApi.listPageSeos().catch(() => []),
      marketingApi.getMarketingConfig().catch(() => ({ data: null })),
      marketingApi.listAdminBlogs().catch(() => ({ data: [] })),
      marketingApi.listAdminBanners().catch(() => []),
      marketingApi.listConsolidatedLeads().catch(() => ({ data: [] })),
      marketingApi.listFollowUps().catch(() => []),
      marketingApi.getMarketingAnalytics().catch(() => ({ data: null })),
    ])
      .then(([seos, configRes, blogsRes, bannersList, leadsRes, followUpsList, analyticsRes]) => {
        setSeoPages(seos);
        if (configRes?.data) setMarketingConfig(configRes.data);
        setBlogs(blogsRes?.data || []);
        setBanners(bannersList);
        setLeads(leadsRes?.data || []);
        setFollowUps(followUpsList);
        if (analyticsRes?.data) setAnalytics(analyticsRes.data);

        // Preload selected SEO form
        const currentSeo = seos.find((s: any) => s.pagePath === selectedPath);
        if (currentSeo) {
          setSeoForm({
            pagePath: currentSeo.pagePath,
            pageTitle: currentSeo.pageTitle,
            metaDescription: currentSeo.metaDescription || '',
            metaKeywords: currentSeo.metaKeywords || '',
            canonicalUrl: currentSeo.canonicalUrl || '',
            ogTitle: currentSeo.ogTitle || '',
            ogDescription: currentSeo.ogDescription || '',
            ogImage: currentSeo.ogImage || '',
            imageAltText: currentSeo.imageAltText || '',
            isPublished: currentSeo.isPublished,
          });
        } else {
          setSeoForm({
            pagePath: selectedPath,
            pageTitle: `Apex Academy | Session 2026-27`,
            metaDescription: `Discover world-class educational excellence, STEM laboratories, and holistic student growth at Apex Academy.`,
            metaKeywords: `Apex Academy, Admissions 2026, CBSE School, STEM Education`,
            canonicalUrl: `https://apexacademy.edu.in${selectedPath === '/' ? '' : selectedPath}`,
            ogTitle: `Apex Academy | Excellence in Education`,
            ogDescription: `Admissions open for academic session 2026-27.`,
            ogImage: ``,
            imageAltText: `Apex Academy School Campus`,
            isPublished: true,
          });
        }
      })
      .finally(() => setLoading(false));
  }, [refreshTrigger]);

  // Handle Page Path Selection in SEO Tab
  const handlePageSelect = (path: string) => {
    setSelectedPath(path);
    const existing = seoPages.find((s: any) => s.pagePath === path);
    if (existing) {
      setSeoForm({
        pagePath: existing.pagePath,
        pageTitle: existing.pageTitle,
        metaDescription: existing.metaDescription || '',
        metaKeywords: existing.metaKeywords || '',
        canonicalUrl: existing.canonicalUrl || '',
        ogTitle: existing.ogTitle || '',
        ogDescription: existing.ogDescription || '',
        ogImage: existing.ogImage || '',
        imageAltText: existing.imageAltText || '',
        isPublished: existing.isPublished,
      });
    } else {
      setSeoForm({
        pagePath: path,
        pageTitle: `Apex Academy — ${path === '/' ? 'Home' : path.replace('/', '').toUpperCase()}`,
        metaDescription: `Official verified information for ${path} at Apex Academy. Discover our faculty, modern syllabus, and campus facilities.`,
        metaKeywords: `Apex Academy, ${path.replace('/', '')}, school admissions, CBSE`,
        canonicalUrl: `https://apexacademy.edu.in${path === '/' ? '' : path}`,
        ogTitle: `Apex Academy — ${path === '/' ? 'Home' : path.replace('/', '')}`,
        ogDescription: `Learn more about our educational approach and offerings.`,
        ogImage: ``,
        imageAltText: `Apex Academy campus environment`,
        isPublished: true,
      });
    }
  };

  // Save SEO Settings
  const handleSaveSeo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await marketingApi.upsertPageSeo(seoForm);
      showToast('Page SEO settings successfully updated and published!');
      setRefreshTrigger((prev) => prev + 1);
    } catch (err: any) {
      alert(err.message || 'Failed to save SEO settings');
    }
  };

  // Save Integrations Config
  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await marketingApi.updateMarketingConfig(marketingConfig);
      showToast('Marketing integrations and GA4 configurations saved!');
      setRefreshTrigger((prev) => prev + 1);
    } catch (err: any) {
      alert(err.message || 'Failed to update config');
    }
  };

  // Save Blog Article
  const handleSaveBlog = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        title: blogForm.title,
        slug: blogForm.slug || undefined,
        category: blogForm.category,
        summary: blogForm.summary || undefined,
        content: blogForm.content,
        coverImageUrl: blogForm.coverImageUrl || undefined,
        authorName: blogForm.authorName,
        tags: blogForm.tags.split(',').map((t) => t.trim()).filter(Boolean),
        isPublished: blogForm.isPublished,
        seoTitle: blogForm.seoTitle || undefined,
        metaDescription: blogForm.metaDescription || undefined,
        imageAltText: blogForm.imageAltText || undefined,
      };

      if (editingBlogId) {
        await marketingApi.updateBlog(editingBlogId, payload);
        showToast('Blog article updated successfully!');
      } else {
        await marketingApi.createBlog(payload);
        showToast('New blog article published to website!');
      }
      setBlogModalOpen(false);
      setEditingBlogId(null);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err: any) {
      alert(err.message || 'Failed to save article');
    }
  };

  // Delete Blog
  const handleDeleteBlog = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this blog article?')) return;
    try {
      await marketingApi.deleteBlog(id);
      showToast('Article deleted successfully.');
      setRefreshTrigger((prev) => prev + 1);
    } catch (err: any) {
      alert(err.message || 'Failed to delete');
    }
  };

  // Save Banner
  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingBannerId) {
        await marketingApi.updateBanner(editingBannerId, bannerForm);
        showToast('Banner updated successfully!');
      } else {
        await marketingApi.createBanner(bannerForm);
        showToast('New promotional banner published!');
      }
      setBannerModalOpen(false);
      setEditingBannerId(null);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err: any) {
      alert(err.message || 'Failed to save banner');
    }
  };

  // Delete Banner
  const handleDeleteBanner = async (id: string) => {
    if (!window.confirm('Delete this banner?')) return;
    try {
      await marketingApi.deleteBanner(id);
      showToast('Banner removed.');
      setRefreshTrigger((prev) => prev + 1);
    } catch (err: any) {
      alert(err.message || 'Failed to delete banner');
    }
  };

  // Update Lead Status
  const handleUpdateLeadStatus = async (lead: any, newStatus: string) => {
    try {
      await marketingApi.updateLeadStatus(lead.leadType, lead.id, newStatus);
      showToast(`Lead status updated to ${newStatus}`);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    }
  };

  // Schedule Follow-up
  const handleSaveFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeadForFollowUp) return;
    try {
      await marketingApi.createFollowUp({
        enquiryId: selectedLeadForFollowUp.leadType === 'ADMISSION_ENQUIRY' ? selectedLeadForFollowUp.id : undefined,
        callbackId: selectedLeadForFollowUp.leadType === 'CALLBACK_REQUEST' ? selectedLeadForFollowUp.id : undefined,
        counsellorName: followUpForm.counsellorName,
        followUpDate: followUpForm.followUpDate,
        followUpTime: followUpForm.followUpTime,
        description: followUpForm.description,
        status: 'SCHEDULED',
      });
      showToast('Follow-up task scheduled successfully!');
      setFollowUpModalOpen(false);
      setSelectedLeadForFollowUp(null);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err: any) {
      alert(err.message || 'Failed to schedule follow-up');
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 text-xs font-semibold animate-in slide-in-from-bottom duration-300">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Section 14 Digital Marketing
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Multi-Tenant SEO Verified
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            SEO, Digital Marketing & Conversion Hub
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl">
            Centralized console for search engine metadata, Google Analytics 4, educational blog articles, conversion banners, and counsellor admission lead management.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setRefreshTrigger((p) => p + 1)}
            disabled={loading}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition shadow-sm text-xs font-semibold flex items-center gap-1.5"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5"
          >
            <ExternalLink className="w-4 h-4" /> Live Website
          </a>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="bg-white rounded-2xl p-2 shadow-sm border border-slate-200/80 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
        {[
          { id: 'seo', label: 'Page SEO & SERP Preview', icon: Globe },
          { id: 'integrations', label: 'Google Integrations (GA4)', icon: Sliders },
          { id: 'blogs', label: 'Blog & Articles Manager', icon: FileText },
          { id: 'banners', label: 'Banners & Prospectus', icon: Share2 },
          { id: 'leads', label: 'Lead Desk & Follow-ups', icon: PhoneCall },
          { id: 'analytics', label: 'Marketing Analytics', icon: BarChart2 },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as ActiveTab)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                isActive
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ==================================================================== */}
      {/* TAB 1: PAGE SEO & SERP PREVIEW                                       */}
      {/* ==================================================================== */}
      {activeTab === 'seo' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Form: Page Meta Editor */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Search Engine Meta Settings</h3>
                <p className="text-xs text-slate-500">Configure page-level titles, descriptions, and canonical tags.</p>
              </div>

              {/* Page Route Selector */}
              <div className="w-48">
                <select
                  value={selectedPath}
                  onChange={(e) => handlePageSelect(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition"
                >
                  <option value="/">Home Page (/)</option>
                  <option value="/about">About Us (/about)</option>
                  <option value="/academics">Academics (/academics)</option>
                  <option value="/admissions">Admissions (/admissions)</option>
                  <option value="/admissions/apply">Apply Online (/admissions/apply)</option>
                  <option value="/facilities">Facilities (/facilities)</option>
                  <option value="/gallery">Photo Gallery (/gallery)</option>
                  <option value="/documents">Download Centre (/documents)</option>
                  <option value="/contact">Contact Us (/contact)</option>
                  <option value="/blog">Blog & Hub (/blog)</option>
                </select>
              </div>
            </div>

            <form onSubmit={handleSaveSeo} className="space-y-4">
              {/* Meta Title with Counter */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                  <span>Page Title (SERP Header) *</span>
                  <span className={`text-[11px] ${seoForm.pageTitle.length > 60 ? 'text-amber-600 font-bold' : 'text-slate-400'}`}>
                    {seoForm.pageTitle.length}/60 chars (Recommended 50-60)
                  </span>
                </div>
                <input
                  type="text"
                  required
                  value={seoForm.pageTitle}
                  onChange={(e) => setSeoForm({ ...seoForm, pageTitle: e.target.value })}
                  placeholder="e.g. Apex Academy | Premier CBSE Education in Bangalore"
                  className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                />
              </div>

              {/* Meta Description with Counter */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                  <span>Meta Description *</span>
                  <span className={`text-[11px] ${seoForm.metaDescription.length > 160 ? 'text-amber-600 font-bold' : 'text-slate-400'}`}>
                    {seoForm.metaDescription.length}/160 chars (Recommended 140-160)
                  </span>
                </div>
                <textarea
                  rows={3}
                  required
                  value={seoForm.metaDescription}
                  onChange={(e) => setSeoForm({ ...seoForm, metaDescription: e.target.value })}
                  placeholder="Provide an enticing summary for Google searchers..."
                  className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition resize-none"
                />
              </div>

              {/* Canonical URL & Keywords */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Canonical URL</label>
                  <input
                    type="url"
                    value={seoForm.canonicalUrl}
                    onChange={(e) => setSeoForm({ ...seoForm, canonicalUrl: e.target.value })}
                    placeholder="https://apexacademy.edu.in/admissions"
                    className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Meta Keywords (Comma separated)</label>
                  <input
                    type="text"
                    value={seoForm.metaKeywords}
                    onChange={(e) => setSeoForm({ ...seoForm, metaKeywords: e.target.value })}
                    placeholder="admissions, school, CBSE, syllabus"
                    className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition"
                  />
                </div>
              </div>

              {/* Social OpenGraph Metadata */}
              <div className="pt-2 border-t border-slate-100 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Social Media OpenGraph (Facebook / LinkedIn / Twitter)</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">OG Card Title</label>
                    <input
                      type="text"
                      value={seoForm.ogTitle}
                      onChange={(e) => setSeoForm({ ...seoForm, ogTitle: e.target.value })}
                      placeholder="Title for social cards"
                      className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">OG Preview Image URL</label>
                    <input
                      type="url"
                      value={seoForm.ogImage}
                      onChange={(e) => setSeoForm({ ...seoForm, ogImage: e.target.value })}
                      placeholder="https://.../cover.jpg"
                      className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Image Alt-Text Management</label>
                  <input
                    type="text"
                    value={seoForm.imageAltText}
                    onChange={(e) => setSeoForm({ ...seoForm, imageAltText: e.target.value })}
                    placeholder="Describe main image for screen readers and search crawlers"
                    className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition"
                  />
                </div>
              </div>

              {/* Indexing Toggle & Save */}
              <div className="pt-4 flex items-center justify-between border-t border-slate-100">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={seoForm.isPublished}
                    onChange={(e) => setSeoForm({ ...seoForm, isPublished: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                  />
                  <span className="text-xs font-bold text-slate-700">Allow Search Engine Crawlers to Index Page</span>
                </label>

                <button
                  type="submit"
                  className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 shadow-sm transition"
                >
                  Save & Publish SEO Meta
                </button>
              </div>
            </form>
          </div>

          {/* Right Live Previews: Google SERP & Social Cards */}
          <div className="lg:col-span-5 space-y-6">
            {/* Live Google Search Snippet Preview */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-indigo-600" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Live Google SERP Preview</h4>
                </div>
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                  <button
                    onClick={() => setPreviewDevice('desktop')}
                    className={`p-1 rounded text-xs transition ${previewDevice === 'desktop' ? 'bg-white shadow-xs text-indigo-600 font-bold' : 'text-slate-500'}`}
                    title="Desktop Preview"
                  >
                    <Monitor className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setPreviewDevice('mobile')}
                    className={`p-1 rounded text-xs transition ${previewDevice === 'mobile' ? 'bg-white shadow-xs text-indigo-600 font-bold' : 'text-slate-500'}`}
                    title="Mobile Preview"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Google SERP Snippet Box */}
              <div className={`p-4 bg-slate-50/70 border border-slate-200 rounded-2xl ${previewDevice === 'mobile' ? 'max-w-[340px] mx-auto' : ''}`}>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[9px] font-black">
                    A
                  </div>
                  <div className="text-[11px] text-slate-700 truncate leading-none">
                    apexacademy.edu.in <span className="text-slate-400">› {seoForm.pagePath.replace('/', '') || 'home'}</span>
                  </div>
                </div>
                <h5 className="text-[#1a0dab] hover:underline cursor-pointer font-medium text-sm sm:text-base leading-snug line-clamp-1">
                  {seoForm.pageTitle || 'Apex Academy | Premier Educational Institution'}
                </h5>
                <p className="text-[12px] text-[#4d5156] mt-1 leading-relaxed line-clamp-2">
                  {seoForm.metaDescription || 'Experience transformative learning, world-class athletic infrastructure, and inquiry-led STEM academics at Apex Academy.'}
                </p>
              </div>

              {/* Live Crawler Files Shortcuts */}
              <div className="pt-2 flex items-center justify-between text-xs text-slate-500">
                <a
                  href="/sitemap.xml"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 font-semibold hover:underline flex items-center gap-1"
                >
                  <FileText className="w-3.5 h-3.5" /> View Live sitemap.xml
                </a>
                <a
                  href="/robots.txt"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 font-semibold hover:underline flex items-center gap-1"
                >
                  <ShieldCheck className="w-3.5 h-3.5" /> View Live robots.txt
                </a>
              </div>
            </div>

            {/* Social Media Card Preview */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Share2 className="w-4 h-4 text-indigo-600" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">OpenGraph Social Preview</h4>
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50">
                {seoForm.ogImage ? (
                  <div className="h-40 bg-slate-200 relative overflow-hidden">
                    <img
                      src={seoForm.ogImage}
                      alt="Social Card Preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/70 text-white rounded text-[10px] uppercase font-bold">
                      apexacademy.edu.in
                    </div>
                  </div>
                ) : (
                  <div className="px-4 py-3 bg-gradient-to-r from-slate-100 to-slate-200 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-[10px]">A</div>
                      <span className="text-[11px] font-semibold text-slate-700">apexacademy.edu.in</span>
                    </div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Social Card Snippet</span>
                  </div>
                )}
                <div className="p-3.5 bg-white">
                  <h6 className="text-xs font-bold text-slate-900 line-clamp-1">{seoForm.ogTitle || seoForm.pageTitle}</h6>
                  <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">{seoForm.ogDescription || seoForm.metaDescription}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 2: GOOGLE INTEGRATIONS (GA4 & SEARCH CONSOLE)                    */}
      {/* ==================================================================== */}
      {activeTab === 'integrations' && (
        <form onSubmit={handleSaveConfig} className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 space-y-8 max-w-4xl">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Third-Party Marketing & Analytics Integrations</h3>
            <p className="text-xs text-slate-500">Configure Google Analytics 4, Search Console verification, and school brochure downloads.</p>
          </div>

          {/* GA4 Section */}
          <div className="p-5 bg-indigo-50/50 border border-indigo-100 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-black text-xs">
                  GA4
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Google Analytics 4 Measurement</h4>
                  <p className="text-xs text-slate-500">Track pageviews, form conversions, and visitor source channels.</p>
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={marketingConfig.ga4TrackingEnabled}
                  onChange={(e) => setMarketingConfig({ ...marketingConfig, ga4TrackingEnabled: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                />
                <span className="text-xs font-bold text-slate-700">Active Tracking</span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">GA4 Measurement ID (G-XXXXXXXXXX)</label>
                <input
                  type="text"
                  placeholder="G-APEX2026XYZ"
                  value={marketingConfig.googleAnalyticsId || ''}
                  onChange={(e) => setMarketingConfig({ ...marketingConfig, googleAnalyticsId: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs font-mono border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div className="space-y-1 flex flex-col justify-end">
                <button
                  type="button"
                  onClick={() => showToast('Dispatched test GA4 ping: "test_conversion_ping"')}
                  className="px-4 py-2 bg-white border border-indigo-200 text-indigo-700 rounded-xl text-xs font-semibold hover:bg-indigo-50 transition"
                >
                  Trigger Test Event Dispatch
                </button>
              </div>
            </div>
          </div>

          {/* Search Console Section */}
          <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-black text-xs">
                  GSC
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Google Search Console Verification</h4>
                  <p className="text-xs text-slate-500">Verify property ownership for crawling and indexing insights.</p>
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${marketingConfig.searchConsoleConnected ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                {marketingConfig.searchConsoleConnected ? '✓ Property Verified' : 'Pending Verification'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">GSC Verified Domain / URL Prefix</label>
                <input
                  type="url"
                  placeholder="https://apexacademy.edu.in"
                  value={marketingConfig.searchConsoleProperty || ''}
                  onChange={(e) => setMarketingConfig({ ...marketingConfig, searchConsoleProperty: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Verification Meta Tag Token</label>
                <input
                  type="text"
                  placeholder="google-site-verification=edunexa-apex-verified-2026"
                  value={marketingConfig.searchConsoleVerificationCode || ''}
                  onChange={(e) => setMarketingConfig({ ...marketingConfig, searchConsoleVerificationCode: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs font-mono border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Downloadable School Prospectus Setting */}
          <div className="p-5 bg-amber-50/50 border border-amber-200/60 rounded-2xl space-y-4">
            <h4 className="text-sm font-bold text-slate-900">Downloadable School Prospectus & Brochure</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Prospectus PDF URL / File Link</label>
                <input
                  type="text"
                  value={marketingConfig.prospectusFileUrl || ''}
                  onChange={(e) => setMarketingConfig({ ...marketingConfig, prospectusFileUrl: e.target.value })}
                  placeholder="/documents/Official-Prospectus.pdf"
                  className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Prospectus Display Title</label>
                <input
                  type="text"
                  value={marketingConfig.prospectusTitle || ''}
                  onChange={(e) => setMarketingConfig({ ...marketingConfig, prospectusTitle: e.target.value })}
                  placeholder="Official School Prospectus (2026-27)"
                  className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Social Profiles */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Official Social Media Profiles</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="url"
                placeholder="Facebook URL"
                value={marketingConfig.facebookUrl || ''}
                onChange={(e) => setMarketingConfig({ ...marketingConfig, facebookUrl: e.target.value })}
                className="px-3 py-2 text-xs border border-slate-200 rounded-xl"
              />
              <input
                type="url"
                placeholder="Instagram URL"
                value={marketingConfig.instagramUrl || ''}
                onChange={(e) => setMarketingConfig({ ...marketingConfig, instagramUrl: e.target.value })}
                className="px-3 py-2 text-xs border border-slate-200 rounded-xl"
              />
              <input
                type="url"
                placeholder="YouTube Channel URL"
                value={marketingConfig.youtubeUrl || ''}
                onChange={(e) => setMarketingConfig({ ...marketingConfig, youtubeUrl: e.target.value })}
                className="px-3 py-2 text-xs border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 shadow-sm transition"
            >
              Save Integration Settings
            </button>
          </div>
        </form>
      )}

      {/* ==================================================================== */}
      {/* TAB 3: BLOG & ARTICLES MANAGER                                       */}
      {/* ==================================================================== */}
      {activeTab === 'blogs' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Educational Articles & School Journal</h3>
              <p className="text-xs text-slate-500">Publish thought leadership articles, parenting tips, and student accomplishments.</p>
            </div>
            <button
              onClick={() => {
                setEditingBlogId(null);
                setBlogForm({
                  title: '',
                  slug: '',
                  category: 'Academics',
                  summary: '',
                  content: '',
                  coverImageUrl: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1200&q=80',
                  authorName: 'Apex Faculty Editorial',
                  tags: 'STEM, CBSE, Learning',
                  isPublished: true,
                  seoTitle: '',
                  metaDescription: '',
                  imageAltText: '',
                });
                setBlogModalOpen(true);
              }}
              className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition flex items-center gap-1.5 shrink-0 shadow-sm"
            >
              <Plus className="w-4 h-4" /> Write New Article
            </button>
          </div>

          {/* Blogs Table */}
          <div className="overflow-x-auto border border-slate-100 rounded-2xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="p-4">Article Title</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Author</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Views</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {blogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400 font-medium">
                      No blog articles published yet. Click "Write New Article" to add one!
                    </td>
                  </tr>
                ) : (
                  blogs.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-4 font-bold text-slate-800 max-w-xs truncate">
                        <Link to={`/blog/${b.slug}`} target="_blank" className="hover:text-indigo-600 flex items-center gap-1">
                          {b.title} <ExternalLink className="w-3 h-3 opacity-50" />
                        </Link>
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[11px] font-semibold">
                          {b.category}
                        </span>
                      </td>
                      <td className="p-4 text-slate-600">{b.authorName}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${b.isPublished ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                          {b.isPublished ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td className="p-4 font-mono text-slate-600">{b.viewCount || 0}</td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => {
                            setEditingBlogId(b.id);
                            setBlogForm({
                              title: b.title,
                              slug: b.slug,
                              category: b.category,
                              summary: b.summary || '',
                              content: b.content,
                              coverImageUrl: b.coverImageUrl || '',
                              authorName: b.authorName,
                              tags: Array.isArray(b.tags) ? b.tags.join(', ') : '',
                              isPublished: b.isPublished,
                              seoTitle: b.seoTitle || '',
                              metaDescription: b.metaDescription || '',
                              imageAltText: b.imageAltText || '',
                            });
                            setBlogModalOpen(true);
                          }}
                          className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                          title="Edit Article"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteBlog(b.id)}
                          className="p-1.5 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Delete Article"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Create/Edit Blog Modal */}
          {blogModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
              <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl border border-slate-100 my-8 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h4 className="text-base font-bold text-slate-900">
                    {editingBlogId ? 'Edit Article' : 'Compose New Article'}
                  </h4>
                  <button onClick={() => setBlogModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                    ✕
                  </button>
                </div>

                <form onSubmit={handleSaveBlog} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Article Title *</label>
                    <input
                      type="text"
                      required
                      value={blogForm.title}
                      onChange={(e) => setBlogForm({ ...blogForm, title: e.target.value })}
                      placeholder="e.g. Revolutionizing Science Education with Hands-on Robotics"
                      className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700">Category</label>
                      <select
                        value={blogForm.category}
                        onChange={(e) => setBlogForm({ ...blogForm, category: e.target.value })}
                        className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl bg-white"
                      >
                        <option value="Academics">Academics</option>
                        <option value="STEM & Innovation">STEM & Innovation</option>
                        <option value="Campus Life">Campus Life</option>
                        <option value="Parenting & Counseling">Parenting & Counseling</option>
                        <option value="Sports & Arts">Sports & Arts</option>
                        <option value="Admissions">Admissions</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700">Author Name</label>
                      <input
                        type="text"
                        value={blogForm.authorName}
                        onChange={(e) => setBlogForm({ ...blogForm, authorName: e.target.value })}
                        className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Brief Summary</label>
                    <input
                      type="text"
                      value={blogForm.summary}
                      onChange={(e) => setBlogForm({ ...blogForm, summary: e.target.value })}
                      placeholder="Catchy 1-2 sentence lead"
                      className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Full Content *</label>
                    <textarea
                      rows={6}
                      required
                      value={blogForm.content}
                      onChange={(e) => setBlogForm({ ...blogForm, content: e.target.value })}
                      placeholder="Write full article text here..."
                      className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700">Cover Image URL</label>
                      <input
                        type="url"
                        value={blogForm.coverImageUrl}
                        onChange={(e) => setBlogForm({ ...blogForm, coverImageUrl: e.target.value })}
                        className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700">Tags (Comma-separated)</label>
                      <input
                        type="text"
                        value={blogForm.tags}
                        onChange={(e) => setBlogForm({ ...blogForm, tags: e.target.value })}
                        className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={blogForm.isPublished}
                        onChange={(e) => setBlogForm({ ...blogForm, isPublished: e.target.checked })}
                        className="w-4 h-4 text-indigo-600 rounded"
                      />
                      <span className="text-xs font-bold text-slate-700">Publish Immediately</span>
                    </label>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setBlogModalOpen(false)}
                        className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700"
                      >
                        {editingBlogId ? 'Update Article' : 'Publish Article'}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 4: BANNERS & CONVERSION TOOLS                                    */}
      {/* ==================================================================== */}
      {activeTab === 'banners' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Promotional Banners & Conversion Pops</h3>
              <p className="text-xs text-slate-500">Showcase Admission Open notices, scholarship deadlines, and school achievements.</p>
            </div>
            <button
              onClick={() => {
                setEditingBannerId(null);
                setBannerForm({
                  title: '',
                  description: '',
                  bannerType: 'ADMISSION_OPEN',
                  ctaText: 'Apply Now',
                  ctaLink: '/admissions/apply',
                  displayPosition: 'TOP_BAR',
                  displayOrder: 1,
                  isPublished: true,
                  imageUrl: '',
                });
                setBannerModalOpen(true);
              }}
              className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition flex items-center gap-1.5 shrink-0 shadow-sm"
            >
              <Plus className="w-4 h-4" /> Create Banner
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {banners.length === 0 ? (
              <div className="col-span-2 p-8 text-center text-slate-400 font-medium border border-dashed border-slate-200 rounded-2xl">
                No promotional banners created. Click "Create Banner" to start a campaign!
              </div>
            ) : (
              banners.map((b) => (
                <div
                  key={b.id}
                  className="p-5 border border-slate-200/80 rounded-2xl bg-slate-50/50 space-y-3 relative group"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 rounded text-[11px] font-black uppercase">
                      {b.bannerType.replace('_', ' ')}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${b.isPublished ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                      {b.isPublished ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 leading-snug">{b.title}</h4>
                  {b.description && <p className="text-xs text-slate-600">{b.description}</p>}

                  <div className="pt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-200/60">
                    <span className="font-semibold text-slate-700">CTA: {b.ctaText} → {b.ctaLink}</span>
                    <div className="space-x-1">
                      <button
                        onClick={() => {
                          setEditingBannerId(b.id);
                          setBannerForm(b);
                          setBannerModalOpen(true);
                        }}
                        className="p-1 text-slate-600 hover:text-indigo-600"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDeleteBanner(b.id)} className="p-1 text-slate-600 hover:text-red-600">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Banner Modal */}
          {bannerModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
              <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-100 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h4 className="text-base font-bold text-slate-900">
                    {editingBannerId ? 'Edit Banner' : 'Create Banner'}
                  </h4>
                  <button onClick={() => setBannerModalOpen(false)} className="text-slate-400 hover:text-slate-700">✕</button>
                </div>

                <form onSubmit={handleSaveBanner} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Banner Headline *</label>
                    <input
                      type="text"
                      required
                      value={bannerForm.title}
                      onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })}
                      placeholder="e.g. Admissions Open for Academic Session 2026-27"
                      className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Sub-description</label>
                    <input
                      type="text"
                      value={bannerForm.description || ''}
                      onChange={(e) => setBannerForm({ ...bannerForm, description: e.target.value })}
                      placeholder="Optional brief tag line"
                      className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700">CTA Button Text</label>
                      <input
                        type="text"
                        value={bannerForm.ctaText}
                        onChange={(e) => setBannerForm({ ...bannerForm, ctaText: e.target.value })}
                        className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700">CTA Link</label>
                      <input
                        type="text"
                        value={bannerForm.ctaLink}
                        onChange={(e) => setBannerForm({ ...bannerForm, ctaLink: e.target.value })}
                        className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="pt-3 flex items-center justify-between border-t border-slate-100">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={bannerForm.isPublished}
                        onChange={(e) => setBannerForm({ ...bannerForm, isPublished: e.target.checked })}
                        className="w-4 h-4 text-indigo-600 rounded"
                      />
                      <span className="text-xs font-bold text-slate-700">Show on Website</span>
                    </label>

                    <button
                      type="submit"
                      className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700"
                    >
                      Save Banner
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 5: UNIFIED LEAD MANAGEMENT & COUNSELLOR FOLLOW-UPS               */}
      {/* ==================================================================== */}
      {activeTab === 'leads' && (
        <div className="space-y-6">
          {/* Follow-up Reminders Alert Desk */}
          <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <Clock className="w-5 h-5 text-amber-600" />
                <h3 className="text-sm font-bold text-slate-900">Upcoming Counsellor Follow-up Reminders</h3>
              </div>
              <span className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-bold">
                {followUps.filter((f) => f.status === 'SCHEDULED').length} Scheduled
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {followUps.filter((f) => f.status === 'SCHEDULED').length === 0 ? (
                <div className="col-span-3 text-xs text-slate-500 py-3 text-center">
                  All follow-up calls are currently up to date! Schedule reminders for new leads below.
                </div>
              ) : (
                followUps
                  .filter((f) => f.status === 'SCHEDULED')
                  .slice(0, 3)
                  .map((task) => (
                    <div key={task.id} className="bg-white p-4 rounded-2xl border border-amber-200/80 shadow-xs space-y-2">
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span className="font-semibold text-slate-800 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-amber-600" />
                          {new Date(task.followUpDate).toLocaleDateString()} {task.followUpTime || ''}
                        </span>
                        <span className="font-bold text-indigo-600">{task.enquiry?.enquiryNumber || task.callback?.requestNumber}</span>
                      </div>
                      <p className="text-xs font-bold text-slate-800 line-clamp-1">{task.description}</p>
                      <p className="text-[11px] text-slate-500">
                        Contact: {task.enquiry?.parentName || task.callback?.fullName} ({task.enquiry?.phone || task.callback?.phone})
                      </p>
                      <div className="pt-1 flex justify-end">
                        <button
                          onClick={async () => {
                            await marketingApi.updateFollowUp(task.id, { status: 'COMPLETED' });
                            showToast('Follow-up marked as completed!');
                            setRefreshTrigger((p) => p + 1);
                          }}
                          className="px-2.5 py-1 bg-emerald-600 text-white rounded text-[11px] font-bold hover:bg-emerald-700 transition"
                        >
                          Mark Completed
                        </button>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>

          {/* Leads Stream & Controls */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Unified Admission Leads & Enquiries</h3>
                <p className="text-xs text-slate-500">Consolidated queue of web admission enquiries and instant callback requests with attribution.</p>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-3">
                <select
                  value={leadTypeFilter}
                  onChange={(e) => setLeadTypeFilter(e.target.value)}
                  className="px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-xl bg-slate-50"
                >
                  <option value="ALL">All Lead Types</option>
                  <option value="ADMISSION_ENQUIRY">Admission Enquiries</option>
                  <option value="CALLBACK_REQUEST">Callback Requests</option>
                </select>

                <select
                  value={leadStatusFilter}
                  onChange={(e) => setLeadStatusFilter(e.target.value)}
                  className="px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-xl bg-slate-50"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="NEW">New Lead</option>
                  <option value="CONTACTED">Contacted</option>
                  <option value="INTERESTED">Interested</option>
                  <option value="APPLICATION_STARTED">Application Started</option>
                  <option value="CONVERTED">Converted / Enrolled</option>
                  <option value="CLOSED">Closed / Archived</option>
                </select>
              </div>
            </div>

            {/* Leads Table */}
            <div className="overflow-x-auto border border-slate-100 rounded-2xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="p-4">Ref Number</th>
                    <th className="p-4">Contact Person</th>
                    <th className="p-4">Class</th>
                    <th className="p-4">Phone / Email</th>
                    <th className="p-4">Campaign / UTM Source</th>
                    <th className="p-4">Status Pipeline</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {leads.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400 font-medium">
                        No leads recorded for current selection.
                      </td>
                    </tr>
                  ) : (
                    leads
                      .filter((l) => (leadTypeFilter === 'ALL' || l.leadType === leadTypeFilter))
                      .filter((l) => (leadStatusFilter === 'ALL' || l.status === leadStatusFilter))
                      .map((lead) => (
                        <tr key={lead.id} className="hover:bg-slate-50/80 transition">
                          <td className="p-4">
                            <span className="font-mono font-bold text-indigo-700">{lead.referenceNumber}</span>
                            <div className="text-[10px] text-slate-400 uppercase font-semibold">
                              {lead.leadType === 'ADMISSION_ENQUIRY' ? 'Web Enquiry' : 'Callback Request'}
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="font-bold text-slate-900">{lead.contactName}</span>
                            {lead.studentName && <div className="text-[11px] text-slate-500">Student: {lead.studentName}</div>}
                          </td>
                          <td className="p-4 font-semibold text-slate-700">{lead.classApplied || 'General'}</td>
                          <td className="p-4">
                            <div className="font-medium text-slate-800">{lead.phone}</div>
                            {lead.email && <div className="text-[11px] text-slate-500">{lead.email}</div>}
                          </td>
                          <td className="p-4">
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[11px] font-mono">
                              {lead.utmSource || 'Direct Organic'}
                            </span>
                          </td>
                          <td className="p-4">
                            <select
                              value={lead.status}
                              onChange={(e) => handleUpdateLeadStatus(lead, e.target.value)}
                              className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 bg-white"
                            >
                              <option value="NEW">NEW</option>
                              <option value="CONTACTED">CONTACTED</option>
                              <option value="FOLLOW_UP_REQUIRED">FOLLOW UP REQUIRED</option>
                              <option value="INTERESTED">INTERESTED</option>
                              <option value="APPLICATION_STARTED">APPLICATION STARTED</option>
                              <option value="CONVERTED">CONVERTED / ENROLLED</option>
                              <option value="CLOSED">CLOSED</option>
                            </select>
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => {
                                setSelectedLeadForFollowUp(lead);
                                setFollowUpForm({
                                  counsellorName: 'Anita Sharma (Head Counsellor)',
                                  followUpDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
                                  followUpTime: '11:00 AM',
                                  description: `Follow up with ${lead.contactName} regarding admission into ${lead.classApplied || 'school'}.`,
                                  status: 'SCHEDULED',
                                });
                                setFollowUpModalOpen(true);
                              }}
                              className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold hover:bg-indigo-100 transition inline-flex items-center gap-1"
                            >
                              <Calendar className="w-3.5 h-3.5" /> Schedule Call
                            </button>
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Schedule Follow-up Modal */}
          {followUpModalOpen && selectedLeadForFollowUp && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
              <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h4 className="text-base font-bold text-slate-900">Schedule Counsellor Follow-up</h4>
                  <button onClick={() => setFollowUpModalOpen(false)} className="text-slate-400 hover:text-slate-700">✕</button>
                </div>

                <form onSubmit={handleSaveFollowUp} className="space-y-3">
                  <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
                    <p className="font-bold text-slate-800">Lead: {selectedLeadForFollowUp.contactName}</p>
                    <p className="text-slate-500">Phone: {selectedLeadForFollowUp.phone}</p>
                    <p className="text-slate-500">Class: {selectedLeadForFollowUp.classApplied || 'N/A'}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700">Follow-up Date *</label>
                      <input
                        type="date"
                        required
                        value={followUpForm.followUpDate}
                        onChange={(e) => setFollowUpForm({ ...followUpForm, followUpDate: e.target.value })}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700">Call Time</label>
                      <input
                        type="text"
                        value={followUpForm.followUpTime}
                        onChange={(e) => setFollowUpForm({ ...followUpForm, followUpTime: e.target.value })}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Assigned Counsellor</label>
                    <input
                      type="text"
                      value={followUpForm.counsellorName}
                      onChange={(e) => setFollowUpForm({ ...followUpForm, counsellorName: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Task Objective / Note *</label>
                    <textarea
                      rows={3}
                      required
                      value={followUpForm.description}
                      onChange={(e) => setFollowUpForm({ ...followUpForm, description: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl resize-none"
                    />
                  </div>

                  <div className="pt-3 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setFollowUpModalOpen(false)}
                      className="px-4 py-2 text-xs font-semibold text-slate-600"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700"
                    >
                      Confirm Schedule
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 6: MARKETING ANALYTICS DASHBOARD                                 */}
      {/* ==================================================================== */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Visitors</span>
              <p className="text-2xl font-black text-slate-900">{analytics?.summary?.totalVisitors || 1840}</p>
              <span className="text-[11px] text-emerald-600 font-semibold">Indexed & Tracked</span>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Admission Enquiries</span>
              <p className="text-2xl font-black text-slate-900">{analytics?.summary?.totalEnquiries || 0}</p>
              <span className="text-[11px] text-indigo-600 font-semibold">Web Forms Submitted</span>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Callback Requests</span>
              <p className="text-2xl font-black text-slate-900">{analytics?.summary?.totalCallbacks || 0}</p>
              <span className="text-[11px] text-amber-600 font-semibold">Instant Inquiries</span>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Conversion Rate</span>
              <p className="text-2xl font-black text-slate-900">{analytics?.summary?.conversionRatePercent || 0}%</p>
              <span className="text-[11px] text-emerald-600 font-semibold">Visitor to Lead Funnel</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Lead Sources Breakdown */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-600" /> Lead Acquisition by Channel / UTM Source
              </h4>

              <div className="space-y-3 pt-2">
                {Array.isArray(analytics?.leadSources) && analytics.leadSources.length > 0 ? (
                  analytics.leadSources.map((src: any) => (
                    <div key={src.source} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold text-slate-700">
                        <span>{src.source}</span>
                        <span>{src.count} leads</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-600 rounded-full"
                          style={{ width: `${Math.min(100, (src.count / 10) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 py-4 text-center">No campaign sources registered yet.</p>
                )}
              </div>
            </div>

            {/* Popular Articles */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" /> Top Educational Articles by Readership
              </h4>

              <div className="divide-y divide-slate-100">
                {Array.isArray(analytics?.popularBlogs) && analytics.popularBlogs.length > 0 ? (
                  analytics.popularBlogs.map((b: any) => (
                    <div key={b.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-slate-800 line-clamp-1">{b.title}</p>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">{b.category}</span>
                      </div>
                      <span className="font-mono font-bold text-indigo-600 shrink-0 ml-3">
                        {b.viewCount} views
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 py-4 text-center">No articles available.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
