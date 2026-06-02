import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import API_URL from '../../config';
import { 
  Trophy, BookOpen, Flag, Gift, WifiOff, LayoutGrid, Map, User, 
  ChevronRight, Award, Crown, TrendingUp, Medal, Home, 
  Compass, ShoppingBag, BarChart3, Shield, Brain, Target,
  Zap, Star, Sparkles, Sun, Moon, Activity, LogOut
} from 'lucide-react';

const LearnerDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [points, setPoints] = useState({ current: 0, lifetime: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [dailyRewardClaimed, setDailyRewardClaimed] = useState(false);
  const [streak, setStreak] = useState(0);
  const [activeTab, setActiveTab] = useState('home');

  const avatars = [
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Felix',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Luna',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Max',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Bella',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Charlie',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Daisy'
  ];

  const navItems = [
    { id: 'home', label: 'Home', icon: <Home size={22} />, path: '/dashboard', color: 'text-teal-600' },
    { id: 'quiz', label: 'Quiz', icon: <Compass size={22} />, path: '/quizzes', color: 'text-teal-600' },
    { id: 'store', label: 'Store', icon: <ShoppingBag size={22} />, path: '/rewards', color: 'text-teal-600' },
    { id: 'stats', label: 'Stats', icon: <BarChart3 size={22} />, path: '/leaderboard', color: 'text-teal-600' },
    { id: 'profile', label: 'Profile', icon: <User size={22} />, path: '/profile', color: 'text-teal-600' }
  ];

  useEffect(() => {
    fetchData();
    checkDailyReward();
    loadStreak();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${API_URL}/api/learner/balance`);
      setPoints({ 
        current: data.current_points || 0, 
        lifetime: data.lifetime_points || 0 
      });
      const savedAvatar = localStorage.getItem('userAvatar');
      if (savedAvatar) setSelectedAvatar(savedAvatar);
    } catch (err) {
      console.error("Failed to load data");
      toast.error('Could not load your dashboard');
    } finally {
      setLoading(false);
    }
  };

  const checkDailyReward = () => {
    const lastClaimed = localStorage.getItem('dailyRewardClaimed');
    const today = new Date().toDateString();
    setDailyRewardClaimed(lastClaimed === today);
  };

  const loadStreak = () => {
    const savedStreak = localStorage.getItem('quizStreak');
    if (savedStreak) setStreak(parseInt(savedStreak));
  };

  const claimDailyReward = () => {
    if (!dailyRewardClaimed) {
      const rewardPoints = 50 + Math.floor(streak / 5) * 10;
      setPoints(prev => ({ ...prev, current: prev.current + rewardPoints }));
      localStorage.setItem('dailyRewardClaimed', new Date().toDateString());
      setDailyRewardClaimed(true);
      toast.success(`🎉 You earned ${rewardPoints} bonus points! 🎉`);
    }
  };

  const updateAvatar = (avatarUrl) => {
    setSelectedAvatar(avatarUrl);
    localStorage.setItem('userAvatar', avatarUrl);
    setShowAvatarModal(false);
    toast.success('Avatar updated! 🎨');
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
    toast.success('Logged out successfully');
  };

  const getRankTitle = () => {
    if (points.lifetime < 100) return '🌱 Seedling';
    if (points.lifetime < 500) return '🌊 Explorer';
    if (points.lifetime < 1000) return '📘 Scholar';
    if (points.lifetime < 5000) return '🎓 Master';
    return '🏆 Legend';
  };

  const getNextRankPoints = () => {
    if (points.lifetime < 100) return 100 - points.lifetime;
    if (points.lifetime < 500) return 500 - points.lifetime;
    if (points.lifetime < 1000) return 1000 - points.lifetime;
    if (points.lifetime < 5000) return 5000 - points.lifetime;
    return 0;
  };

  const getProgressPercent = () => {
    if (points.lifetime < 100) return (points.lifetime / 100) * 100;
    if (points.lifetime < 500) return ((points.lifetime - 100) / 400) * 100;
    if (points.lifetime < 1000) return ((points.lifetime - 500) / 500) * 100;
    if (points.lifetime < 5000) return ((points.lifetime - 1000) / 4000) * 100;
    return 100;
  };

  const handleCardClick = (path, params = {}) => {
    if (path) {
      // If there are query parameters, pass them
      const queryString = new URLSearchParams(params).toString();
      const fullPath = queryString ? `${path}?${queryString}` : path;
      navigate(fullPath);
    }
  };

  const handleNavClick = (id, path) => {
    setActiveTab(id);
    navigate(path);
  };

  const mainActions = [
    { id: 'daily-quiz', icon: <BookOpen size={24} />, title: 'Daily Quiz', color: 'bg-gradient-to-r from-teal-500 to-teal-600', path: '/quizzes', params: { type: 'daily' } },
    { id: 'flags-quiz', icon: <Flag size={24} />, title: 'Flags Quiz', color: 'bg-gradient-to-r from-teal-600 to-teal-700', path: '/quizzes', params: { type: 'flags' } }
  ];

  const secondaryActions = [
    { id: 'offline', icon: <WifiOff size={20} />, title: 'Offline Quiz', path: '/offline-quiz' },
    { id: 'categories', icon: <LayoutGrid size={20} />, title: 'Categories', path: '/quizzes', params: { view: 'categories' } },
    { id: 'malawi', icon: <Map size={20} />, title: 'District of Malawi', path: '/quizzes', params: { category: 'malawi-districts' } },
    { id: 'hangman', icon: <Brain size={20} />, title: 'Hangman', path: '/hangman' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 font-sans flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 font-sans pb-20">
      {/* Beautiful Header with Gradient and Pattern */}
      <header className="relative overflow-hidden bg-gradient-to-r from-teal-600 via-teal-500 to-cyan-600 text-white sticky top-0 z-40 shadow-xl">
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 -left-4 w-72 h-72 bg-white rounded-full mix-blend-overlay animate-pulse"></div>
          <div className="absolute bottom-0 -right-4 w-96 h-96 bg-white rounded-full mix-blend-overlay animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-cyan-300 rounded-full mix-blend-overlay animate-pulse delay-700"></div>
        </div>

        {/* Decorative Grid Pattern */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '30px 30px'
        }}></div>

        <div className="relative max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* User Info Section with Enhanced Design */}
            <div className="flex items-center gap-4">
              <div 
                className="relative cursor-pointer group"
                onClick={() => setShowAvatarModal(true)}
              >
                <div className="absolute inset-0 bg-white rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                <img 
                  src={selectedAvatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user?.username || 'player'}`} 
                  alt="Profile" 
                  className="w-12 h-12 rounded-full border-3 border-white shadow-lg object-cover transition-transform group-hover:scale-105"
                />
                <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full p-1 shadow-md">
                  <span className="text-xs">✏️</span>
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <Sun size={14} className="text-yellow-300" />
                  <p className="text-xs font-medium opacity-90">Welcome Back</p>
                </div>
                <h2 className="text-lg font-bold mt-0.5">{user?.fullName || user?.username || 'Player'}</h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <Activity size={12} className="text-teal-200" />
                  <p className="text-xs opacity-90">{getRankTitle()}</p>
                </div>
              </div>
            </div>

            {/* Stats Section with Glass Effect */}
            <div className="flex items-center gap-8">
              <div className="text-center bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2">
                <p className="text-2xl font-bold text-yellow-300">{points.current}</p>
                <p className="text-[10px] uppercase tracking-wider opacity-90">Points</p>
              </div>
              <div className="text-center bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2">
                <p className="text-2xl font-bold text-cyan-300">{points.lifetime}</p>
                <p className="text-[10px] uppercase tracking-wider opacity-90">Lifetime</p>
              </div>
              {streak > 0 && (
                <div className="flex items-center gap-2 bg-orange-500/30 backdrop-blur-sm px-3 py-2 rounded-full">
                  <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center animate-pulse">
                    <span className="text-sm">🔥</span>
                  </div>
                  <span className="font-bold text-sm">{streak}</span>
                  <span className="text-[10px] uppercase">Day Streak</span>
                </div>
              )}
            </div>

            {/* Action Buttons with Enhanced Design */}
            <div className="flex items-center gap-3">
              <button 
                onClick={claimDailyReward}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center gap-2 shadow-lg ${
                  dailyRewardClaimed 
                    ? 'bg-white/20 backdrop-blur-sm cursor-default'
                    : 'bg-gradient-to-r from-yellow-400 to-orange-500 hover:shadow-yellow-500/50 text-white hover:scale-105'
                }`}
              >
                <Gift size={16} />
                {!dailyRewardClaimed && 'Claim Reward'}
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-white/10 backdrop-blur-sm hover:bg-white/20 rounded-xl text-sm font-medium transition-all duration-300 flex items-center gap-2"
              >
                <LogOut size={16} />
                Exit
              </button>
            </div>
          </div>

          {/* Enhanced Progress Bar Section */}
          <div className="mt-4">
            <div className="flex justify-between text-xs mb-2 text-white/90">
              <div className="flex items-center gap-2">
                <Trophy size={14} className="text-yellow-300" />
                <span>Progress to Next Rank</span>
              </div>
              <span className="font-bold">{Math.round(getProgressPercent())}%</span>
            </div>
            <div className="relative">
              <div className="w-full h-2 rounded-full overflow-hidden bg-white/20 backdrop-blur-sm">
                <div 
                  className="h-full bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full transition-all duration-700 relative"
                  style={{ width: `${getProgressPercent()}%` }}
                >
                  <div className="absolute inset-0 bg-white opacity-30 animate-pulse"></div>
                </div>
              </div>
              {getNextRankPoints() > 0 && (
                <p className="text-xs text-white/80 mt-2 flex items-center gap-1">
                  <Zap size={12} />
                  {getNextRankPoints()} points needed for next rank
                </p>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-6">
        {/* Main Actions Grid */}
        <div className="grid grid-cols-2 gap-5 mb-6">
          {mainActions.map((action) => (
            <div
              key={action.id}
              onClick={() => handleCardClick(action.path, action.params)}
              className={`${action.color} text-white p-5 rounded-xl h-32 flex flex-col justify-end shadow-lg cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-xl relative overflow-hidden group`}
            >
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
              <div className="mb-2 relative z-10">{action.icon}</div>
              <h3 className="text-lg font-bold relative z-10">{action.title}</h3>
            </div>
          ))}
        </div>

        {/* More Games Section - Outline style */}
        <div>
          <h3 className="text-lg font-bold text-teal-800 mb-3 flex items-center gap-2">
            <Sparkles size={20} className="text-teal-500" />
            More Games
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {secondaryActions.map((action) => (
              <div
                key={action.id}
                onClick={() => handleCardClick(action.path, action.params || {})}
                className="bg-white border-2 border-teal-100 hover:border-teal-400 text-gray-700 p-3 rounded-lg shadow-sm flex items-center gap-3 cursor-pointer transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"
              >
                <div className="text-teal-500">{action.icon}</div>
                <span className="text-sm font-medium">{action.title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-3 gap-3 mt-6">
          <div className="bg-gradient-to-br from-teal-500 to-teal-600 text-white p-3 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
            <TrendingUp size={16} className="mb-1 opacity-80" />
            <p className="text-xs opacity-90">Global Rank</p>
            <p className="text-sm font-bold">#{points.lifetime > 1000 ? '124' : '1,247'}</p>
          </div>
          <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 text-white p-3 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
            <Medal size={16} className="mb-1 opacity-80" />
            <p className="text-xs opacity-90">Badges Earned</p>
            <p className="text-sm font-bold">{Math.floor(points.lifetime / 100)}</p>
          </div>
          <div 
            onClick={() => navigate('/leaderboard')}
            className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-3 rounded-lg shadow-lg cursor-pointer hover:shadow-xl transition-all hover:scale-105"
          >
            <Trophy size={16} className="mb-1 opacity-80" />
            <p className="text-xs opacity-90">Leaderboard</p>
            <p className="text-sm font-bold">View →</p>
          </div>
        </div>

        {/* Achievement Banner */}
        <div className="mt-6 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-lg p-4 border border-teal-200 shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-full flex items-center justify-center shadow-md">
                <Zap size={20} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-teal-800">Weekly Challenge</p>
                <p className="text-xs text-gray-600">Complete 5 quizzes this week for bonus points!</p>
              </div>
            </div>
            <Target size={20} className="text-teal-500" />
          </div>
        </div>

        {/* Footer Quote */}
        <div className="mt-6 text-center">
          <div className="inline-block px-6 py-2 rounded-full text-xs bg-white text-gray-600 shadow-md border border-teal-100">
            💡 "Knowledge is power! Keep learning every day!"
          </div>
        </div>
      </main>

      {/* Redesigned Bottom Navigation Bar */}
      <div className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-teal-100 shadow-lg">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-around items-center py-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id, item.path)}
                className={`flex flex-col items-center p-2 rounded-lg transition-all duration-300 group relative ${
                  activeTab === item.id 
                    ? 'transform -translate-y-1' 
                    : 'hover:transform hover:-translate-y-0.5'
                }`}
              >
                {/* Active Indicator */}
                {activeTab === item.id && (
                  <div className="absolute -top-2 w-8 h-1 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full"></div>
                )}
                
                {/* Icon Container */}
                <div className={`
                  relative transition-all duration-300
                  ${activeTab === item.id 
                    ? 'text-teal-600 scale-110' 
                    : 'text-gray-400 group-hover:text-teal-500'
                  }
                `}>
                  {item.icon}
                </div>
                
                {/* Label */}
                <span className={`
                  text-[10px] mt-1 font-medium transition-all duration-300
                  ${activeTab === item.id 
                    ? 'text-teal-600' 
                    : 'text-gray-500 group-hover:text-teal-500'
                  }
                `}>
                  {item.label}
                </span>

                {/* Ripple Effect on Click */}
                <div className="absolute inset-0 rounded-lg bg-teal-500 opacity-0 group-active:opacity-20 transition-opacity duration-300"></div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Avatar Modal */}
      {showAvatarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setShowAvatarModal(false)}>
          <div className="bg-white rounded-xl max-w-md w-full p-6 animate-fadeIn shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-gray-800 font-bold text-lg">Choose Your Avatar</h3>
              <button onClick={() => setShowAvatarModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {avatars.map((avatar, idx) => (
                <button
                  key={idx}
                  onClick={() => updateAvatar(avatar)}
                  className={`p-1.5 rounded-lg transition-all hover:scale-105 ${
                    selectedAvatar === avatar ? 'ring-2 ring-teal-500 bg-teal-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <img src={avatar} alt={`Avatar ${idx + 1}`} className="w-full rounded-lg" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 0.3;
            transform: scale(1);
          }
          50% {
            opacity: 0.6;
            transform: scale(1.05);
          }
        }
        
        .animate-pulse {
          animation: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        
        .delay-1000 {
          animation-delay: 1s;
        }
        
        .delay-700 {
          animation-delay: 0.7s;
        }
      `}</style>
    </div>
  );
};

export default LearnerDashboard;