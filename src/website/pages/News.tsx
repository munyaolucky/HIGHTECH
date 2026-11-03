import React, { useState } from "react";
import { NEWS_AND_EVENTS } from "../../data/college";
import { NewsArticle } from "../../types";
import {
  Calendar,
  Clock,
  User,
  ArrowRight,
  Sparkles,
  Share2,
  X,
  AlertCircle,
} from "lucide-react";

export default function News() {
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [activeArticle, setActiveArticle] = useState<NewsArticle | null>(null);

  const categories = ["ALL", "Academics", "Admissions", "Events", "Research"];

  const filteredNews = NEWS_AND_EVENTS.filter((article) => {
    return selectedCategory === "ALL" || article.category === selectedCategory;
  });

  return (
    <div className="space-y-12 pb-16">
      {/* Header Banner */}
      <div className="bg-[#0f274a] text-white py-12 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 bg-red-600/30 text-red-200 border border-red-500/40 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            <span>Official Communications</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            News, Announcements & Events
          </h1>
          <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
            Stay up to date with the latest academic circulars, admission deadlines, graduation updates, and tech community highlights.
          </p>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-wrap items-center gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                selectedCategory === cat
                  ? "bg-[#153b70] text-white shadow-sm"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              {cat === "ALL" ? "All Updates" : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Articles Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNews.map((article) => (
            <div
              key={article.id}
              className="bg-white rounded-2xl border border-slate-200 hover:border-blue-400 hover:shadow-lg transition p-6 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                    {article.category}
                  </span>
                  <span className="text-slate-400 flex items-center gap-1 text-[11px]">
                    <Clock className="w-3 h-3" />
                    {article.readTime}
                  </span>
                </div>

                <h3
                  onClick={() => setActiveArticle(article)}
                  className="font-bold text-slate-900 text-base hover:text-[#153b70] transition cursor-pointer leading-snug"
                >
                  {article.title}
                </h3>

                <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                  {article.summary}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400 font-mono text-[11px] flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {article.publishedDate}
                </span>

                <button
                  onClick={() => setActiveArticle(article)}
                  className="text-xs font-bold text-[#153b70] hover:text-[#0f274a] flex items-center gap-1"
                >
                  <span>Read More</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Article Modal Dialog */}
      {activeArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden flex flex-col max-h-[85vh]">
            <div className="bg-[#0f274a] text-white p-5 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-200 bg-blue-900/60 px-2.5 py-0.5 rounded">
                  {activeArticle.category}
                </span>
                <div className="text-xs text-slate-300 mt-1">
                  Published: {activeArticle.publishedDate} by {activeArticle.author}
                </div>
              </div>
              <button
                onClick={() => setActiveArticle(null)}
                className="text-slate-300 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 sm:p-8 overflow-y-auto space-y-4">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">
                {activeArticle.title}
              </h2>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs font-medium text-blue-900">
                {activeArticle.summary}
              </div>

              <div className="text-xs sm:text-sm text-slate-700 leading-relaxed space-y-3">
                <p>{activeArticle.content}</p>
                <p>
                  For further clarification regarding this circular or upcoming deadlines, please contact the Academic Registrar's office at <code>info@hitech.ac.ke</code> or visit your respective department on campus.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setActiveArticle(null)}
                className="bg-[#153b70] text-white px-5 py-2 rounded-lg text-xs font-bold"
              >
                Close Notice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
