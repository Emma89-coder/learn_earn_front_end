// src/screens/learners/LearnerBadges.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import API_URL from '../../config';

const LearnerBadges = () => {
  const navigate = useNavigate();
  const { settings: theme, getPageStyles } = useTheme();
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('portal-theme');
    return savedTheme ? savedTheme === 'dark' : false;
  });

  useEffect(() => {
    localStorage.setItem('portal-theme', isDarkMode ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  useEffect(() => {
    const fetchBadges = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        if (!token) {
          toast.error('Please login to view your badges');
          navigate('/learner-login');
          return;
        }

        const { data } = await axios.get(`${API_URL}/api/learner/badges`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (data.success) {
          setBadges(data.badges || []);
        } else {
          toast.error(data.message || 'Failed to load badges');
        }
      } catch (error) {
        console.error('Fetch learner badges error:', error);
        if (error.response?.status === 401) {
          toast.error('Session expired. Please login again.');
          navigate('/learner-login');
        } else if (error.response?.status === 404) {
          toast.error('Badges endpoint not found. Please contact support.');
        } else {
          toast.error('Failed to load badges');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchBadges();
  }, [navigate]);

  // Get badge color based on type - Teal palette
  const getBadgeColor = (badge) => {
    const colors = {
      'quiz': 'from-teal-400 to-teal-600',
      'hangman': 'from-cyan-400 to-cyan-600',
      'spelling': 'from-emerald-400 to-emerald-600',
      'points': 'from-amber-400 to-amber-600',
      'streak': 'from-rose-400 to-rose-600',
      'default': 'from-teal-500 to-emerald-500'
    };
    return colors[badge?.type] || colors.default;
  };

  // Get badge icon based on type
  const getBadgeIcon = (badge) => {
    const icons = {
      'quiz': '📝',
      'hangman': '🎯',
      'spelling': '🔤',
      'points': '💎',
      'streak': '🔥',
      'default': '🏅'
    };
    return icons[badge?.type] || icons.default;
  };

  // Get badge background color
  const getBadgeBg = (badge) => {
    const bgColors = {
      'quiz': 'bg-teal-50 dark:bg-teal-900/20',
      'hangman': 'bg-cyan-50 dark:bg-cyan-900/20',
      'spelling': 'bg-emerald-50 dark:bg-emerald-900/20',
      'points': 'bg-amber-50 dark:bg-amber-900/20',
      'streak': 'bg-rose-50 dark:bg-rose-900/20',
      'default': 'bg-teal-50 dark:bg-teal-900/20'
    };
    return bgColors[badge?.type] || bgColors.default;
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return '';
    }
  };

  // Navigate to dashboard
  const goToDashboard = () => {
    navigate('/learner-dashboard');
  };

  return (
    <div className="learner-themed w-full min-h-screen transition-all duration-500"
      style={{
        ...getPageStyles('badges'),
        backgroundColor: isDarkMode ? undefined : getPageStyles('badges').backgroundColor,
        color: isDarkMode ? undefined : getPageStyles('badges').color,
      }}
    >
      {isDarkMode && <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 -z-10" />}
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header Card */}
        <div className={`rounded-2xl border-2 overflow-hidden mb-5 ${
          isDarkMode 
            ? 'bg-slate-800/50 border-teal-400' 
            : 'bg-white shadow-sm border-teal-500'
        }`}>
          <div className={`p-4 border-b ${
            isDarkMode 
              ? 'border-teal-400/20 bg-emerald-900/20' 
              : 'border-teal-500/20 bg-gradient-to-r from-emerald-50 to-green-50'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-md ${
                  isDarkMode ? 'bg-teal-500/20' : 'bg-teal-500'
                }`}>
                  <span className="text-2xl">🏅</span>
                </div>
                <div>
                  <h2 className="text-base font-bold uppercase tracking-wider text-[#19475B] dark:text-emerald-300">
                    MY BADGES
                  </h2>
                  <p className={`text-[11px] mt-0.5 ${isDarkMode ? 'text-emerald-300/70' : 'text-[#19475B]/70'}`}>
                    Achievements you've earned
                  </p>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-[10px] font-semibold ${
                isDarkMode 
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30' 
                  : 'bg-emerald-100 text-[#19475B] border border-emerald-200'
              }`}>
                {badges.length} Badges
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className={`rounded-2xl border-2 overflow-hidden ${
            isDarkMode 
              ? 'bg-slate-800/50 border-teal-400' 
              : 'bg-white shadow-sm border-teal-500'
          }`}>
            <div className="p-6 space-y-3">
              {[1, 2, 3].map((item) => (
                <div key={item} className={`h-24 rounded-xl animate-pulse ${
                  isDarkMode ? 'bg-slate-700/50' : 'bg-teal-50'
                }`} />
              ))}
            </div>
          </div>
        ) : badges.length === 0 ? (
          /* Empty State - Without duplicate button */
          <div className={`rounded-2xl border-2 overflow-hidden ${
            isDarkMode 
              ? 'bg-slate-800/50 border-teal-400' 
              : 'bg-white shadow-sm border-teal-500'
          }`}>
            <div className="p-8 text-center">
              <div className="text-6xl mb-4">🎯</div>
              <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-[#19475B]'}`}>
                No Badges Yet
              </h3>
              <p className={`text-sm mt-2 ${isDarkMode ? 'text-slate-400' : 'text-[#19475B]/70'}`}>
                Complete activities and challenges to earn badges!
              </p>
              <div className="mt-6 grid grid-cols-2 gap-3 max-w-sm mx-auto">
                <div className={`p-3 rounded-lg ${
                  isDarkMode ? 'bg-slate-700/30' : 'bg-teal-50'
                }`}>
                  <span className="text-2xl block mb-1">📝</span>
                  <span className={`text-xs ${isDarkMode ? 'text-teal-300' : 'text-teal-700'}`}>
                    Complete quizzes
                  </span>
                </div>
                <div className={`p-3 rounded-lg ${
                  isDarkMode ? 'bg-slate-700/30' : 'bg-teal-50'
                }`}>
                  <span className="text-2xl block mb-1">🎯</span>
                  <span className={`text-xs ${isDarkMode ? 'text-teal-300' : 'text-teal-700'}`}>
                    Play Hangman
                  </span>
                </div>
                <div className={`p-3 rounded-lg ${
                  isDarkMode ? 'bg-slate-700/30' : 'bg-teal-50'
                }`}>
                  <span className="text-2xl block mb-1">🔤</span>
                  <span className={`text-xs ${isDarkMode ? 'text-teal-300' : 'text-teal-700'}`}>
                    Spelling Bee
                  </span>
                </div>
                <div className={`p-3 rounded-lg ${
                  isDarkMode ? 'bg-slate-700/30' : 'bg-teal-50'
                }`}>
                  <span className="text-2xl block mb-1">💎</span>
                  <span className={`text-xs ${isDarkMode ? 'text-teal-300' : 'text-teal-700'}`}>
                    Earn points
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Badges Grid - Enhanced Display */
          <div className={`rounded-2xl border-2 overflow-hidden ${
            isDarkMode 
              ? 'bg-slate-800/50 border-teal-400' 
              : 'bg-white shadow-sm border-teal-500'
          }`}>
            <div className={`p-3 border-b ${
              isDarkMode 
                ? 'border-teal-400/20 bg-emerald-900/20' 
                : 'border-teal-500/20 bg-gradient-to-r from-emerald-50 to-green-50'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#19475B] dark:text-emerald-300">
                    BADGE COLLECTION
                  </h3>
                  <p className={`text-[10px] mt-0.5 ${isDarkMode ? 'text-emerald-300/70' : 'text-[#19475B]/70'}`}>
                    Achievements you've earned
                  </p>
                </div>
                <div className={`px-2.5 py-0.5 rounded-full text-[8px] font-semibold ${
                  isDarkMode 
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30' 
                    : 'bg-emerald-100 text-[#19475B] border border-emerald-200'
                }`}>
                  {badges.length} earned
                </div>
              </div>
            </div>

            <div className="p-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {badges.map((badge) => (
                  <div 
                    key={badge.id}
                    className={`group relative p-4 rounded-xl border-2 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                      isDarkMode 
                        ? 'bg-slate-700/50 border-teal-400/30 hover:border-teal-400' 
                        : 'bg-white border-teal-200/50 hover:border-teal-500'
                    }`}
                  >
                    {/* Badge Icon with Gradient */}
                    <div className="flex flex-col items-center text-center">
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl shadow-lg bg-gradient-to-br ${getBadgeColor(badge)} text-white mb-2 transform group-hover:scale-110 transition-transform duration-300`}>
                        {badge.icon_url ? (
                          <img src={badge.icon_url} alt={badge.name} className="w-10 h-10 object-contain" />
                        ) : (
                          getBadgeIcon(badge)
                        )}
                      </div>
                      
                      {/* Badge Name */}
                      <h4 className={`font-bold text-xs uppercase tracking-wide ${isDarkMode ? 'text-white' : 'text-[#19475B]'} mb-0.5`}>
                        {badge.name}
                      </h4>
                      
                      {/* Badge Criteria */}
                      {badge.criteria && (
                        <p className={`text-[8px] font-medium ${isDarkMode ? 'text-teal-400' : 'text-teal-600'} mb-0.5`}>
                          {badge.criteria}
                        </p>
                      )}
                      
                      {/* Badge Description */}
                      {badge.description && (
                        <p className={`text-[9px] mt-0.5 line-clamp-2 ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>
                          {badge.description}
                        </p>
                      )}
                      
                      {/* Awarded Date */}
                      {badge.awarded_at && (
                        <div className={`mt-2 pt-1.5 border-t w-full ${
                          isDarkMode ? 'border-teal-400/20' : 'border-gray-200'
                        }`}>
                          <p className={`text-[7px] flex items-center justify-center gap-1 ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
                            <span>🏆</span>
                            Earned: {formatDate(badge.awarded_at)}
                          </p>
                        </div>
                      )}
                      
                      {/* Badge Type Badge */}
                      {badge.type && (
                        <div className={`mt-1.5 px-2 py-0.5 rounded-full text-[7px] font-semibold uppercase tracking-wider ${
                          isDarkMode 
                            ? 'bg-teal-500/20 text-teal-300 border border-teal-400/30' 
                            : 'bg-teal-100 text-teal-700 border border-teal-200'
                        }`}>
                          {badge.type}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer Stats */}
            <div className={`p-3 border-t ${
              isDarkMode 
                ? 'border-teal-400/20 bg-slate-900/30' 
                : 'border-teal-200 bg-teal-50'
            }`}>
              <div className="flex justify-between items-center text-[10px] flex-wrap gap-2">
                <div className={`flex items-center gap-3 ${isDarkMode ? 'text-slate-400' : 'text-[#19475B]/70'}`}>
                  <span className="flex items-center gap-1">
                    <span className="text-sm">🏅</span>
                    {badges.length} badges
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="text-sm">📅</span>
                    {badges.filter(b => b.awarded_at && new Date(b.awarded_at).getMonth() === new Date().getMonth()).length} this month
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="text-sm">🏆</span>
                    {badges.filter(b => b.type).length} types
                  </span>
                </div>
                <div className={`text-[8px] ${isDarkMode ? 'text-slate-500' : 'text-teal-400'}`}>
                  Keep learning! 🚀
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Dashboard Button - Single instance at bottom */}
        <div className="mt-6 text-center">
          <button
            onClick={goToDashboard}
            className={`px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition shadow-md ${
              isDarkMode 
                ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white hover:from-teal-400 hover:to-emerald-400' 
                : 'bg-gradient-to-r from-teal-600 to-teal-700 text-white hover:from-teal-500 hover:to-teal-600'
            }`}
          >
            Go to Dashboard
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out forwards;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { 
          background: ${isDarkMode ? '#334155' : '#cbd5e1'};
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: ${isDarkMode ? '#475569' : '#94a3b8'};
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default LearnerBadges;