import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Calendar,
  User,
  Eye,
  ArrowLeft,
  Share2,
  Check,
  MessageCircle,
  Tag,
  BookOpen,
  Globe,
  ExternalLink,
} from 'lucide-react';
import { marketingApi } from '../../../services/api';
import { trackGa4Event } from '../../../utils/utmTracker';

export const BlogDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [data, setData] = useState<{ article: any; related: any[] } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setIsLoading(true);
    marketingApi
      .getPublicBlog(slug)
      .then((res) => {
        setData(res?.data || null);
        if (res?.data?.article) {
          // Update page title dynamically
          document.title = `${res.data.article.seoTitle || res.data.article.title} | EduNexa Blog`;
          trackGa4Event('page_view', {
            page_title: res.data.article.title,
            page_location: window.location.href,
            page_path: `/blog/${slug}`,
          });
        }
      })
      .catch((err) => {
        console.error('Failed to fetch blog article', err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [slug]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const shareUrl = encodeURIComponent(window.location.href);
  const shareTitle = encodeURIComponent(data?.article?.title || 'EduNexa School Article');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-500">Loading educational article...</p>
        </div>
      </div>
    );
  }

  if (!data?.article) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
        <div className="text-center space-y-4 max-w-md bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
          <h2 className="text-xl font-bold text-slate-800">Article Not Found</h2>
          <p className="text-sm text-slate-500">
            The article you are looking for has either been moved or is no longer published.
          </p>
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition"
          >
            <ArrowLeft className="w-4 h-4" /> Return to Articles Hub
          </Link>
        </div>
      </div>
    );
  }

  const { article, related } = data;

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Top Breadcrumb Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link
            to="/blog"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-indigo-600 transition"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Knowledge Hub
          </Link>

          {/* Social Share Controls */}
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-400 mr-1 hidden sm:inline">Share:</span>
            <a
              href={`https://wa.me/?text=${shareTitle}%20${shareUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
              title="Share on WhatsApp"
            >
              <MessageCircle className="w-4 h-4" />
            </a>
            <button
              onClick={handleCopyLink}
              className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition flex items-center gap-1 text-xs font-medium"
              title="Copy URL"
            >
              {isCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      <article className="max-w-4xl mx-auto px-4 sm:px-6 pt-10">
        {/* Article Meta Header */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold rounded-lg uppercase tracking-wider">
              {article.category}
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {article.publishedAt ? new Date(article.publishedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Recently Published'}
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" />
              {article.viewCount || 1} views
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 leading-tight">
            {article.title}
          </h1>

          {article.summary && (
            <p className="text-lg text-slate-600 font-normal leading-relaxed border-l-4 border-indigo-500 pl-4 py-1 italic bg-indigo-50/30 rounded-r-xl">
              {article.summary}
            </p>
          )}

          {/* Author Badge */}
          <div className="flex items-center gap-3 pt-2">
            <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
              {article.authorName?.[0] || 'E'}
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">{article.authorName || 'School Editorial Team'}</p>
              <p className="text-xs text-slate-500">Academic & Educational Contributor</p>
            </div>
          </div>
        </div>

        {/* Cover Image */}
        {article.coverImageUrl && (
          <div className="mt-8 rounded-3xl overflow-hidden shadow-md border border-slate-200/80 max-h-[460px]">
            <img
              src={article.coverImageUrl}
              alt={article.imageAltText || article.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Content Body */}
        <div className="mt-10 bg-white p-8 sm:p-12 rounded-3xl shadow-sm border border-slate-200/80">
          <div className="prose prose-slate lg:prose-lg max-w-none space-y-6 text-slate-700 leading-relaxed font-normal whitespace-pre-line text-base sm:text-lg">
            {article.content}
          </div>

          {/* Tags */}
          {Array.isArray(article.tags) && article.tags.length > 0 && (
            <div className="mt-10 pt-6 border-t border-slate-200 flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-400 flex items-center gap-1 mr-1">
                <Tag className="w-3.5 h-3.5" /> Topic Tags:
              </span>
              {article.tags.map((tag: string) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-200 transition"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Related Articles Carousel / Grid */}
        {related && related.length > 0 && (
          <div className="mt-16 space-y-6">
            <h3 className="text-xl font-black text-slate-900">Recommended Reading</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {related.map((rel: any) => (
                <Link
                  key={rel.id}
                  to={`/blog/${rel.slug}`}
                  className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-lg transition group block"
                >
                  <div className="h-32 rounded-xl overflow-hidden bg-slate-100 mb-3">
                    <img
                      src={rel.coverImageUrl || 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=400&q=80'}
                      alt={rel.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition"
                    />
                  </div>
                  <span className="text-[11px] font-bold text-indigo-600 uppercase">{rel.category}</span>
                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition line-clamp-2 mt-1">
                    {rel.title}
                  </h4>
                </Link>
              ))}
            </div>
          </div>
        )}
      </article>
    </div>
  );
};
