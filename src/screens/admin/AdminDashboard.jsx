import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import API_URL from '../../config';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalLearners: 0,
    totalQuizzes: 0,
    totalRewards: 0,
    totalRedemptions: 0,
    activeQuizzes: 0,
    completedQuizzes: 0,
    averageScore: 0
  });
  const [loading, setLoading] = useState(true);
  const [recentActivities, setRecentActivities] = useState([]);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('portal-theme');
    return savedTheme ? savedTheme === 'dark' : false;
  });
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    fetchStats();
    fetchRecentActivities();
  }, []);

  useEffect(() => {
    localStorage.setItem('portal-theme', isDarkMode ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/admin/statistics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setStats(response.data.statistics);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentActivities = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/admin/recent-activities`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setRecentActivities(response.data.activities);
      }
    } catch (error) {
      console.error('Failed to fetch activities:', error);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
    toast.success('Logged out successfully');
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const menuItems = [
    { 
      id: 'quizzes', 
      title: 'Quiz Manager', 
      icon: '📚', 
      description: 'Create, edit, and organize quiz content',
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-500/10',
      textColor: 'text-blue-600',
      path: '/admin-quizzes'
    },
    { 
      id: 'rewards', 
      title: 'Reward Catalog', 
      icon: '🎁', 
      description: 'Manage redeemable rewards and points system',
      color: 'from-amber-500 to-orange-500',
      bgColor: 'bg-amber-500/10',
      textColor: 'text-amber-600',
      path: '/admin-rewards'
    },
    { 
      id: 'badges', 
      title: 'Badge System', 
      icon: '🏅', 
      description: 'Create and assign achievement badges',
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-500/10',
      textColor: 'text-purple-600',
      path: '/admin-badges'
    },
    { 
      id: 'learners', 
      title: 'Learner Registry', 
      icon: '👥', 
      description: 'Manage student accounts and profiles',
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-500/10',
      textColor: 'text-green-600',
      path: '/admin-learners'
    },
    { 
      id: 'analytics', 
      title: 'Analytics', 
      icon: '📊', 
      description: 'View detailed reports and insights',
      color: 'from-indigo-500 to-purple-500',
      bgColor: 'bg-indigo-500/10',
      textColor: 'text-indigo-600',
      path: '/admin-analytics'
    },
    { 
      id: 'settings', 
      title: 'System Settings', 
      icon: '⚙️', 
      description: 'Configure platform preferences',
      color: 'from-gray-500 to-slate-500',
      bgColor: 'bg-gray-500/10',
      textColor: 'text-gray-600',
      path: '/admin-settings'
    }
  ];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 1) return 'Yesterday';
    return date.toLocaleDateString();
  };

  const StatCard = ({ title, value, icon, trend, trendValue, color }) => (
    <div className={`group rounded-2xl p-5 transition-all duration-300 hover:scale-[1.02] ${
      isDarkMode 
        ? 'bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/[0.08] hover:border-white/[0.15]' 
        : 'bg-white border border-slate-200 shadow-sm hover:shadow-md'
    }`}>
      <div className="flex items-start justify-between">
        <div>
          <p className={`text-xs font-medium uppercase tracking-wider mb-1 ${
            isDarkMode ? 'text-slate-400' : 'text-slate-500'
          }`}>
            {title}
          </p>
          <p className={`text-3xl font-bold tracking-tight ${
            isDarkMode ? 'text-white' : 'text-slate-800'
          }`}>
            {loading ? (
              <span className="inline-block w-16 h-8 bg-slate-200 dark:bg-white/[0.08] rounded animate-pulse"></span>
            ) : (
              value
            )}
          </p>
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <span className={`text-xs font-medium ${trend > 0 ? 'text-green-500' : 'text-red-500'}`}>
                {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
              </span>
              <span className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                vs last month
              </span>
            </div>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color.bg} ${color.text}`}>
          <span className="text-2xl">{icon}</span>
        </div>
      </div>
    </div>
  );

  const ActivityItem = ({ activity }) => (
    <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${activity.bgColor}`}>
        <span className="text-sm">{activity.icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
          {activity.title}
        </p>
        <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          {activity.description}
        </p>
        <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
          {formatDate(activity.timestamp)}
        </p>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode ? 'bg-[#0A0E1A]' : 'bg-gradient-to-br from-slate-50 to-slate-100'
    }`}>
      
      {/* Animated Background Pattern */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/30 to-cyan-400/30 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-400/30 to-pink-400/30 rounded-full blur-3xl"></div>
      </div>

      {/* Header */}
      <header className={`sticky top-0 z-50 w-full border-b backdrop-blur-xl transition-all duration-300 ${
        isDarkMode 
          ? 'bg-[#0A0E1A]/90 border-white/[0.08]' 
          : 'bg-white/80 border-slate-200'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl blur opacity-50"></div>
                <div className="relative w-9 h-9 bg-gradient-to-br from-navy to-azure rounded-xl flex items-center justify-center">
                  <span className="text-lg">👑</span>
                </div>
              </div>
              <div>
                <h1 className={`text-lg font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                  Admin Portal
                </h1>
                <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Platform Management
                </p>
              </div>
            </div>
            
            {/* Right Section */}
            <div className="flex items-center gap-3">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-xl transition-all duration-300 ${
                  isDarkMode 
                    ? 'bg-white/[0.04] border border-white/[0.08] text-amber-400 hover:bg-white/[0.08]' 
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {isDarkMode ? '☀️' : '🌙'}
              </button>
              
              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all duration-300 ${
                    isDarkMode 
                      ? 'bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08]' 
                      : 'bg-white border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                    <span className="text-sm text-white font-medium">
                      {user?.fullName?.charAt(0) || user?.username?.charAt(0) || 'A'}
                    </span>
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className={`text-xs font-medium ${isDarkMode ? 'text-white' : 'text-slate-700'}`}>
                      {user?.fullName || user?.username || 'Admin'}
                    </p>
                    <p className={`text-[10px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      Administrator
                    </p>
                  </div>
                  <svg className={`w-4 h-4 transition-transform ${showUserMenu ? 'rotate-180' : ''} ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {showUserMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)}></div>
                    <div className={`absolute right-0 mt-2 w-48 rounded-xl shadow-lg overflow-hidden z-50 border ${
                      isDarkMode 
                        ? 'bg-[#0A0E1A] border-white/[0.08]' 
                        : 'bg-white border-slate-200'
                    }`}>
                      <button
                        onClick={() => { setShowUserMenu(false); navigate('/admin-profile'); }}
                        className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                          isDarkMode 
                            ? 'text-slate-300 hover:bg-white/[0.04]' 
                            : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        👤 Profile Settings
                      </button>
                      <hr className={`${isDarkMode ? 'border-white/[0.08]' : 'border-slate-100'}`} />
                      <button
                        onClick={handleLogout}
                        className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                          isDarkMode 
                            ? 'text-red-400 hover:bg-red-500/10' 
                            : 'text-red-600 hover:bg-red-50'
                        }`}
                      >
                        🚪 Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Welcome Section */}
        <div className="mb-8">
          <div className={`flex items-center gap-3 p-5 rounded-2xl ${
            isDarkMode 
              ? 'bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20' 
              : 'bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-100'
          }`}>
            <div className="text-3xl">👋</div>
            <div>
              <h2 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                {getGreeting()}, {user?.fullName?.split(' ')[0] || 'Admin'}!
              </h2>
              <p className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                Here's what's happening with your learning platform today.
              </p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-sm font-semibold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Platform Overview
            </h3>
            <button 
              onClick={() => navigate('/admin-analytics')}
              className={`text-xs font-medium ${isDarkMode ? 'text-cyan-400' : 'text-cyan-600'} hover:underline`}
            >
              View detailed analytics →
            </button>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard 
              title="Total Learners"
              value={stats.totalLearners}
              icon="👥"
              trend={12}
              color={{ bg: 'bg-blue-500/10', text: 'text-blue-600' }}
            />
            <StatCard 
              title="Active Quizzes"
              value={stats.activeQuizzes || stats.totalQuizzes}
              icon="📚"
              trend={8}
              color={{ bg: 'bg-purple-500/10', text: 'text-purple-600' }}
            />
            <StatCard 
              title="Points Awarded"
              value={stats.totalRewards?.toLocaleString() || '0'}
              icon="🎁"
              trend={24}
              color={{ bg: 'bg-amber-500/10', text: 'text-amber-600' }}
            />
            <StatCard 
              title="Avg. Score"
              value={`${stats.averageScore || 0}%`}
              icon="📊"
              trend={5}
              color={{ bg: 'bg-green-500/10', text: 'text-green-600' }}
            />
          </div>
        </div>

        {/* Management Tools */}
        <div className="mb-8">
          <h3 className={`text-sm font-semibold uppercase tracking-wider mb-4 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Management Tools
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={`group relative p-5 rounded-2xl text-left transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] ${
                  isDarkMode 
                    ? 'bg-white/[0.02] border border-white/[0.08] hover:border-[#00B0FF]/30 hover:bg-white/[0.04]' 
                    : 'bg-white border border-slate-200 hover:border-[#00B0FF]/40 shadow-sm hover:shadow-md'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl bg-gradient-to-br ${item.color} shadow-lg`}>
                    {item.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-semibold text-base mb-1 transition-colors group-hover:text-[#00B0FF] ${
                      isDarkMode ? 'text-white' : 'text-slate-800'
                    }`}>
                      {item.title}
                    </h3>
                    <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      {item.description}
                    </p>
                  </div>
                  <div className="w-7 h-7 rounded-full bg-[#00B0FF]/10 flex items-center justify-center transform group-hover:translate-x-0.5 transition-transform">
                    <svg className="w-3.5 h-3.5 text-[#00B0FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Activity & Quick Links */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <div className={`lg:col-span-2 rounded-2xl p-5 transition-all duration-300 ${
            isDarkMode ? 'bg-white/[0.02] border border-white/[0.08]' : 'bg-white shadow-sm'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                Recent Activity
              </h3>
              <button className="text-xs text-[#00B0FF] hover:underline">
                View All
              </button>
            </div>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {recentActivities.length > 0 ? (
                recentActivities.map((activity, idx) => (
                  <ActivityItem key={idx} activity={activity} />
                ))
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">📭</div>
                  <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    No recent activities to display
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className={`rounded-2xl p-5 transition-all duration-300 ${
            isDarkMode ? 'bg-white/[0.02] border border-white/[0.08]' : 'bg-white shadow-sm'
          }`}>
            <h3 className={`font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
              Quick Stats
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Completed Quizzes</span>
                <span className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                  {stats.completedQuizzes || 0}
                </span>
              </div>
              <div className="h-2 rounded-full bg-slate-200 dark:bg-white/[0.08] overflow-hidden">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-500"
                  style={{ width: `${Math.min(100, ((stats.completedQuizzes || 0) / (stats.totalQuizzes || 1)) * 100)}%` }}
                ></div>
              </div>
              <div className="pt-3 space-y-3">
                <div className="flex justify-between items-center">
                  <span className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Total Redemptions</span>
                  <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                    {stats.totalRedemptions || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Active Learners</span>
                  <span className={`text-sm font-medium text-green-600`}>
                    {Math.round((stats.totalLearners || 0) * 0.75)}
                  </span>
                </div>
              </div>
            </div>

            {/* Help Section */}
            <div className={`mt-6 pt-4 border-t ${isDarkMode ? 'border-white/[0.08]' : 'border-slate-100'}`}>
              <p className={`text-xs text-center ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Need help? Check out the <button className="text-[#00B0FF] hover:underline">documentation</button>
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className={`mt-8 pt-6 border-t text-center text-xs ${
          isDarkMode ? 'border-white/[0.08] text-slate-500' : 'border-slate-200 text-slate-400'
        }`}>
          <p>© 2026 Admin Portal. All rights reserved.</p>
        </footer>
      </main>
    </div>
  );
};

export default AdminDashboard;