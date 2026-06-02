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
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    fetchStats();
    fetchRecentActivities();
  }, []);

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

  const menuItems = [
    { 
      id: 'quizzes', 
      title: 'Quiz Manager', 
      icon: '📚', 
      description: 'Create, edit, and organize quiz content',
      color: 'from-[#00B0FF] to-[#008080]',
      bgColor: 'bg-[#00B0FF]/10',
      textColor: 'text-[#00B0FF]',
      path: '/admin-quizzes'
    },
    { 
      id: 'rewards', 
      title: 'Reward Catalog', 
      icon: '🎁', 
      description: 'Manage redeemable rewards and points system',
      color: 'from-[#008080] to-[#1A237E]',
      bgColor: 'bg-[#008080]/10',
      textColor: 'text-[#008080]',
      path: '/admin-rewards'
    },
    { 
      id: 'badges', 
      title: 'Badge System', 
      icon: '🏅', 
      description: 'Create and assign achievement badges',
      color: 'from-[#1A237E] to-[#00B0FF]',
      bgColor: 'bg-[#1A237E]/10',
      textColor: 'text-[#1A237E]',
      path: '/admin-badges'
    },
    { 
      id: 'learners', 
      title: 'Learner Registry', 
      icon: '👥', 
      description: 'Manage student accounts and profiles',
      color: 'from-[#00B0FF] to-[#1A237E]',
      bgColor: 'bg-[#00B0FF]/10',
      textColor: 'text-[#00B0FF]',
      path: '/admin-learners'
    },
    { 
      id: 'analytics', 
      title: 'Analytics', 
      icon: '📊', 
      description: 'View detailed reports and insights',
      color: 'from-[#008080] to-[#00B0FF]',
      bgColor: 'bg-[#008080]/10',
      textColor: 'text-[#008080]',
      path: '/admin-analytics'
    },
    { 
      id: 'settings', 
      title: 'System Settings', 
      icon: '⚙️', 
      description: 'Configure platform preferences',
      color: 'from-[#1A237E] to-[#008080]',
      bgColor: 'bg-[#1A237E]/10',
      textColor: 'text-[#1A237E]',
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

  const StatCard = ({ title, value, icon, trend, color }) => (
    <div className="group rounded-2xl p-5 transition-all duration-300 hover:scale-105 bg-white border border-[#00B0FF]/20 shadow-sm hover:shadow-xl cursor-pointer">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider mb-1 text-slate-500">
            {title}
          </p>
          <p className="text-3xl font-bold tracking-tight text-[#1A237E]">
            {loading ? (
              <span className="inline-block w-16 h-8 bg-slate-200 rounded animate-pulse"></span>
            ) : (
              value
            )}
          </p>
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <span className={`text-xs font-medium ${trend > 0 ? 'text-[#008080]' : 'text-red-500'}`}>
                {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
              </span>
              <span className="text-xs text-slate-400">
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
    <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${activity.bgColor}`}>
        <span className="text-sm">{activity.icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-700">
          {activity.title}
        </p>
        <p className="text-xs mt-0.5 text-slate-500">
          {activity.description}
        </p>
        <p className="text-xs mt-1 text-slate-400">
          {formatDate(activity.timestamp)}
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F0F4F8] via-[#E8F4F8] to-[#F0F8FF]">
      
      {/* Animated Background Pattern */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-[#00B0FF]/20 to-[#008080]/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-[#1A237E]/20 to-[#00B0FF]/20 rounded-full blur-3xl"></div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b backdrop-blur-xl bg-white/80 border-[#00B0FF]/20 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-[#00B0FF] to-[#008080] rounded-xl blur opacity-50"></div>
                <div className="relative w-9 h-9 bg-gradient-to-br from-[#00B0FF] to-[#008080] rounded-xl flex items-center justify-center">
                  <span className="text-lg">👑</span>
                </div>
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight text-[#1A237E]">
                  Admin Portal
                </h1>
                <p className="text-xs text-slate-500">
                  Platform Management
                </p>
              </div>
            </div>
            
            {/* Right Section */}
            <div className="flex items-center gap-3">
              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all duration-300 bg-white border border-[#00B0FF]/30 hover:bg-[#00B0FF]/5"
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#00B0FF] to-[#008080] flex items-center justify-center">
                    <span className="text-sm text-white font-medium">
                      {user?.fullName?.charAt(0) || user?.username?.charAt(0) || 'A'}
                    </span>
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-xs font-medium text-slate-700">
                      {user?.fullName || user?.username || 'Admin'}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      Administrator
                    </p>
                  </div>
                  <svg className={`w-4 h-4 transition-transform ${showUserMenu ? 'rotate-180' : ''} text-slate-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {showUserMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)}></div>
                    <div className="absolute right-0 mt-2 w-48 rounded-xl shadow-lg overflow-hidden z-50 border bg-white border-[#00B0FF]/20">
                      <button
                        onClick={() => { setShowUserMenu(false); navigate('/admin-profile'); }}
                        className="w-full px-4 py-2 text-left text-sm transition-colors text-slate-600 hover:bg-slate-50"
                      >
                        👤 Profile Settings
                      </button>
                      <hr className="border-slate-100" />
                      <button
                        onClick={handleLogout}
                        className="w-full px-4 py-2 text-left text-sm transition-colors text-red-600 hover:bg-red-50"
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
          <div className="flex items-center gap-3 p-5 rounded-2xl bg-gradient-to-r from-[#00B0FF]/10 to-[#008080]/10 border border-[#00B0FF]/20 transition-all duration-300 hover:scale-[1.02] cursor-pointer">
            <div className="text-3xl">👋</div>
            <div>
              <h2 className="text-lg font-bold text-[#1A237E]">
                {getGreeting()}, {user?.fullName?.split(' ')[0] || 'Admin'}!
              </h2>
              <p className="text-sm text-slate-600">
                Here's what's happening with your learning platform today.
              </p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
              Platform Overview
            </h3>
            <button 
              onClick={() => navigate('/admin-analytics')}
              className="text-xs font-medium text-[#00B0FF] hover:underline"
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
              color={{ bg: 'bg-[#00B0FF]/10', text: 'text-[#00B0FF]' }}
            />
            <StatCard 
              title="Active Quizzes"
              value={stats.activeQuizzes || stats.totalQuizzes}
              icon="📚"
              trend={8}
              color={{ bg: 'bg-[#008080]/10', text: 'text-[#008080]' }}
            />
            <StatCard 
              title="Points Awarded"
              value={stats.totalRewards?.toLocaleString() || '0'}
              icon="🎁"
              trend={24}
              color={{ bg: 'bg-[#1A237E]/10', text: 'text-[#1A237E]' }}
            />
            <StatCard 
              title="Avg. Score"
              value={`${stats.averageScore || 0}%`}
              icon="📊"
              trend={5}
              color={{ bg: 'bg-[#00B0FF]/10', text: 'text-[#00B0FF]' }}
            />
          </div>
        </div>

        {/* Management Tools */}
        <div className="mb-8">
          <h3 className="text-sm font-semibold uppercase tracking-wider mb-4 text-slate-500">
            Management Tools
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className="group relative p-5 rounded-2xl text-left transition-all duration-300 transform hover:scale-105 active:scale-95 bg-white border border-[#00B0FF]/20 shadow-sm hover:shadow-xl cursor-pointer"
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl bg-gradient-to-br ${item.color} shadow-lg`}>
                    {item.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-base mb-1 transition-colors text-slate-800 group-hover:text-[#00B0FF]">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-500">
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
          <div className="lg:col-span-2 rounded-2xl p-5 transition-all duration-300 bg-white shadow-sm hover:scale-[1.02] cursor-pointer">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-800">
                Recent Activity
              </h3>
              <button className="text-xs text-[#00B0FF] hover:underline">
                View All
              </button>
            </div>
            <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar">
              {recentActivities.length > 0 ? (
                recentActivities.map((activity, idx) => (
                  <ActivityItem key={idx} activity={activity} />
                ))
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">📭</div>
                  <p className="text-sm text-slate-500">
                    No recent activities to display
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="rounded-2xl p-5 transition-all duration-300 bg-white shadow-sm hover:scale-[1.02] cursor-pointer">
            <h3 className="font-semibold mb-4 text-slate-800">
              Quick Stats
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">Completed Quizzes</span>
                <span className="text-lg font-semibold text-slate-800">
                  {stats.completedQuizzes || 0}
                </span>
              </div>
              <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-[#00B0FF] to-[#008080] transition-all duration-500"
                  style={{ width: `${Math.min(100, ((stats.completedQuizzes || 0) / (stats.totalQuizzes || 1)) * 100)}%` }}
                ></div>
              </div>
              <div className="pt-3 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500">Total Redemptions</span>
                  <span className="text-sm font-medium text-slate-800">
                    {stats.totalRedemptions || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500">Active Learners</span>
                  <span className="text-sm font-medium text-[#008080]">
                    {Math.round((stats.totalLearners || 0) * 0.75)}
                  </span>
                </div>
              </div>
            </div>

            {/* Help Section */}
            <div className="mt-6 pt-4 border-t border-slate-100">
              <p className="text-xs text-center text-slate-500">
                Need help? Check out the <button className="text-[#00B0FF] hover:underline">documentation</button>
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-8 pt-6 border-t text-center text-xs border-slate-200 text-slate-400">
          <p>© 2026 Admin Portal. All rights reserved.</p>
        </footer>
      </main>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 176, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0, 176, 255, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 176, 255, 0.5);
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard;