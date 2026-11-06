import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Calendar, User, Search, Tag, ArrowRight, Sparkles, Filter } from 'lucide-react';
import { marketingApi } from '../../../services/api';

const CATEGORIES = [
  'ALL',
  'Academics',
  'STEM & Innovation',
  'Campus Life',
  'Parenting & Counseling',
  'Sports & Arts',
  'Admissions',
];

export const BlogListPage: React.FC = () => {
  const [articles, setArticles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchArticles = async () => {
    setIsLoading(true);
    try {
      const res = await marketingApi.listPublicBlogs({
        category: selectedCategory,
        search: searchTerm.trim() || undefined,
        page,
        limit: 9,
      });
      setArticles(res?.data || []);
      setTotalPages(res?.meta?.totalPages || 1);
    } catch (err) {
      console.error('Failed to load blog articles', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, [selectedCategory, page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchArticles();
  };

  return (
    <div className="min-h-screen bg-slate-50/60 pb-20">
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white pt-16 pb-20 px-4 sm:px-6 lg:px-8 border-b border-indigo-900/30">
        <div className="max-w-5xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-400/20 text-indigo-300 text-xs font-semibold tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>EduNexa Knowledge Hub & Blog</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
            Insights, Academic Guides & Campus Stories
          </h1>
          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto font-normal">
            Stay informed with expert academic analysis, modern pedagogy insights, student achievements, and parenting guidance from our esteemed faculty.
          </p>

          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="max-w-xl mx-auto pt-4">
            <div className="relative flex items-center">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 pointer-events-none" />
              <input
                type="text"
                placeholder="Search articles on STEM, board exams, admissions, robotics..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-28 py-3.5 text-sm bg-white/10 backdrop-blur-md text-white placeholder-slate-400 border border-white/20 rounded-2xl focus:bg-white focus:text-slate-900 focus:placeholder-slate-400 outline-none transition"
              />
              <button
                type="submit"
                className="absolute right-2 px-5 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-500 transition shadow"
              >
                Search
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
        {/* Category Pills */}
        <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200/80 mb-10 overflow-x-auto flex items-center gap-2 scrollbar-none">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 pl-3 pr-2 flex items-center gap-1.5 shrink-0">
            <Filter className="w-3.5 h-3.5 text-slate-400" /> Categories:
          </span>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat);
                setPage(1);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {cat === 'ALL' ? 'All Articles' : cat}
            </button>
          ))}
        </div>

        {/* Article Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm animate-pulse space-y-4">
                <div className="h-48 bg-slate-200 rounded-xl" />
                <div className="h-4 bg-slate-200 rounded w-1/3" />
                <div className="h-6 bg-slate-200 rounded w-4/5" />
                <div className="h-4 bg-slate-200 rounded w-full" />
              </div>
            ))}
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200/80 shadow-sm">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-800">No Articles Found</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1">
              There are currently no published articles matching your selected criteria. Check back soon for fresh publications!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {articles.map((post) => (
              <article
                key={post.id}
                className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group"
              >
                {/* Cover Image */}
                <Link to={`/blog/${post.slug}`} className="relative h-52 overflow-hidden bg-slate-100 block">
                  <img
                    src={
                      post.coverImageUrl ||
                      'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=800&q=80'
                    }
                    alt={post.imageAltText || post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="px-3 py-1 bg-slate-900/80 backdrop-blur-md text-white text-xs font-semibold rounded-lg shadow-sm">
                      {post.category}
                    </span>
                  </div>
                </Link>

                {/* Content */}
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mb-2.5">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent'}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        {post.authorName || 'Faculty Editorial'}
                      </span>
                    </div>

                    <Link to={`/blog/${post.slug}`}>
                      <h2 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-snug">
                        {post.title}
                      </h2>
                    </Link>

                    {post.summary && (
                      <p className="text-sm text-slate-600 mt-2 line-clamp-3 leading-relaxed">
                        {post.summary}
                      </p>
                    )}
                  </div>

                  {/* Tags & Read Link */}
                  <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 overflow-hidden">
                      {Array.isArray(post.tags) && post.tags.slice(0, 2).map((t: string) => (
                        <span key={t} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[11px] font-medium rounded">
                          #{t}
                        </span>
                      ))}
                    </div>

                    <Link
                      to={`/blog/${post.slug}`}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 shrink-0 group-hover:translate-x-0.5 transition"
                    >
                      Read Article <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-12 flex items-center justify-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-xs font-semibold text-slate-600 px-3">
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

