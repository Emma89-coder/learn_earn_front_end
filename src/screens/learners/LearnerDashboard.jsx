import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import API_URL from '../../config';
import { 
  Trophy, BookOpen, Flag, Gift, WifiOff, LayoutGrid, Map, User, 
  Award, Crown, TrendingUp, Medal, Home, 
  Compass, ShoppingBag, BarChart3, Brain, Target,
  Zap, Sparkles, Activity, LogOut, Lock, Unlock, Calendar, Star, ChevronRight, X, Check
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
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [showLevelModal, setShowLevelModal] = useState(false);
  
  const [learnerProgress, setLearnerProgress] = useState(null);
  const [isLoadingProgress, setIsLoadingProgress] = useState(true);

  const avatars = [
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Felix',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Luna',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Max',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Bella',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Charlie',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Daisy'
  ];

  const navItems = [
    { id: 'home', label: 'Home', icon: <Home size={18} />, path: '/dashboard' },
    { id: 'quiz', label: 'Quiz', icon: <Compass size={18} />, path: '/quizzes' },
    { id: 'store', label: 'Store', icon: <ShoppingBag size={18} />, path: '/rewards' },
    { id: 'stats', label: 'Stats', icon: <BarChart3 size={18} />, path: '/leaderboard' },
    { id: 'profile', label: 'Profile', icon: <User size={18} />, path: '/profile' }
  ];

  useEffect(() => {
    fetchData();
    checkDailyReward();
    loadStreak();
    fetchLearnerProgress();
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

  const fetchLearnerProgress = async () => {
    try {
      setIsLoadingProgress(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/learner/progress`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setLearnerProgress(response.data.progress);
      }
    } catch (error) {
      console.error('Error fetching progress:', error);
    } finally {
      setIsLoadingProgress(false);
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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getRankTitle = () => {
    if (points.lifetime < 100) return 'Seedling';
    if (points.lifetime < 500) return 'Explorer';
    if (points.lifetime < 1000) return 'Scholar';
    if (points.lifetime < 5000) return 'Master';
    return 'Legend';
  };

  const getRankIcon = () => {
    if (points.lifetime < 100) return '🌱';
    if (points.lifetime < 500) return '🌊';
    if (points.lifetime < 1000) return '📘';
    if (points.lifetime < 5000) return '🎓';
    return '🏆';
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

  const getLevelDisplayName = (level) => {
    if (!level) return 'Not Assigned';
    return level.split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
  };

  const getLevelIcon = (level) => {
    if (!level) return '📚';
    const levelNum = parseInt(level.split('-')[1]);
    if (levelNum <= 2) return '🌱';
    if (levelNum <= 4) return '📘';
    if (levelNum <= 6) return '🎓';
    return '🏆';
  };

  const handleCardClick = (path, params = {}) => {
    if (path) {
      const queryString = new URLSearchParams(params).toString();
      const fullPath = queryString ? `${path}?${queryString}` : path;
      navigate(fullPath);
    }
  };

  const handleNavClick = (id, path) => {
    setActiveTab(id);
    navigate(path);
  };

  // Games - 4 games in 2x2 grid
  const games = [
    { id: 'categories', icon: <LayoutGrid size={24} />, title: 'Categories', path: '/quizzes', params: { view: 'categories' } },
    { id: 'malawi', icon: <Map size={24} />, title: 'District of Malawi', path: '/quizzes', params: { category: 'malawi-districts' } },
    { id: 'hangman', icon: <Brain size={24} />, title: 'Hangman', path: '/hangman' },
    { id: 'offline', icon: <WifiOff size={24} />, title: 'Offline Quiz', path: '/offline-quiz' }
  ];

  // Statistics for header
  const statItems = [
    { label: 'Points', value: points.current, icon: '💎' },
    { label: 'Lifetime', value: points.lifetime, icon: '🏆' },
    { label: 'Streak', value: streak, icon: '🔥' },
    { label: 'Rank', value: getRankTitle(), icon: getRankIcon() }
  ];

  // Calculate level progress percentage
  const getLevelProgressPercent = () => {
    if (!learnerProgress) return 0;
    const unlockedCount = learnerProgress.unlocked_levels?.length || 1;
    return (unlockedCount / 8) * 100;
  };

  if (loading || isLoadingProgress) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-500 text-sm">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header with fused statistics */}
      <header className="sticky top-0 z-50 bg-teal-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Top bar with logo and user */}
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-white rounded-xl blur opacity-20"></div>
                <div className="relative w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white text-xl">💰</span>
                </div>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Learn<span className="text-teal-200">Earn</span></h1>
                <p className="text-xs text-teal-100">Learner Portal</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Level Indicator on Navbar */}
              <button
                onClick={() => setShowLevelModal(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all border border-white/20"
              >
                <span className="text-lg">{getLevelIcon(learnerProgress?.current_level)}</span>
                <div className="text-left">
                  <p className="text-xs text-white/80">Current Level</p>
                  <p className="text-sm font-semibold text-white">{getLevelDisplayName(learnerProgress?.current_level)}</p>
                </div>
                <ChevronRight size={14} className="text-white/60" />
              </button>

              <div className="hidden md:block text-right">
                <p className="text-sm font-medium text-white">{getGreeting()}, {user?.fullName?.split(' ')[0] || 'Player'}</p>
                <p className="text-xs text-teal-100">{getRankTitle()}</p>
              </div>
              
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all bg-white/10 backdrop-blur-sm hover:bg-white/20 border border-white/20"
                >
                  <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                    <img 
                      src={selectedAvatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user?.username || 'player'}`} 
                      alt="Profile" 
                      className="w-full h-full rounded-full object-cover"
                    />
                  </div>
                  <svg className={`w-4 h-4 transition-transform ${showUserMenu ? 'rotate-180' : ''} text-white`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showUserMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)}></div>
                    <div className="absolute right-0 mt-2 w-48 rounded-lg shadow-lg overflow-hidden z-50 bg-white border border-gray-200">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-xs text-gray-500">Signed in as</p>
                        <p className="text-sm font-medium text-gray-800">{user?.fullName || user?.username || 'Player'}</p>
                      </div>
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          setShowAvatarModal(true);
                        }}
                        className="w-full px-4 py-2 text-left text-sm transition-colors text-gray-600 hover:bg-gray-50 flex items-center gap-2"
                      >
                        <User size={14} />
                        Change Avatar
                      </button>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full px-4 py-2 text-left text-sm transition-colors text-red-600 hover:bg-red-50 flex items-center gap-2"
                      >
                        <LogOut size={14} />
                        Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Statistics row */}
          <div className="grid grid-cols-4 gap-4 py-4">
            {statItems.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <span className="text-white/70 text-sm">{stat.icon}</span>
                  <p className="text-xs font-medium text-white/80 uppercase tracking-wider">{stat.label}</p>
                </div>
                <p className="text-2xl font-bold text-white">
                  {loading ? <span className="inline-block w-12 h-7 bg-white/20 rounded animate-pulse"></span> : stat.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* Navigation Bar - Matching leaderboard colors (teal/cyan) */}
      <div className="sticky top-[120px] z-40 bg-gradient-to-r from-teal-50 to-cyan-50 border-b border-teal-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-1 overflow-x-auto">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id, item.path)}
                className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-all duration-200 border-b-2 ${
                  activeTab === item.id
                    ? 'text-teal-700 border-teal-600'
                    : 'text-teal-600 border-transparent hover:text-teal-700 hover:border-teal-300'
                }`}
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content - Cards in pairs (2 columns) */}
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Daily Bonus Banner - Full width */}
        {!dailyRewardClaimed && (
          <div className="mb-6 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl p-5 text-white shadow-lg w-full">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Gift size={28} className="text-white" />
                <div>
                  <p className="text-base font-semibold">Daily Bonus Available!</p>
                  <p className="text-xs text-white/80">Claim your {50 + Math.floor(streak / 5) * 10} bonus points</p>
                </div>
              </div>
              <button
                onClick={claimDailyReward}
                className="px-5 py-2 bg-white text-orange-600 rounded-lg text-sm font-semibold hover:bg-gray-100 transition"
              >
                Claim Now
              </button>
            </div>
          </div>
        )}

        {/* Games Section - 2x2 Grid (pairs) */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={20} className="text-teal-500" />
            <h3 className="text-lg font-semibold text-gray-800">Games & Quizzes</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {games.map((game) => (
              <div
                key={game.id}
                onClick={() => handleCardClick(game.path, game.params || {})}
                className="bg-white border border-gray-200 hover:border-teal-300 text-gray-700 p-5 rounded-xl shadow-sm hover:shadow-md flex items-center gap-4 cursor-pointer transition-all duration-300 hover:-translate-y-0.5 w-full"
              >
                <div className="text-teal-500">{game.icon}</div>
                <span className="text-base font-medium">{game.title}</span>
                <ChevronRight size={18} className="ml-auto text-gray-300" />
              </div>
            ))}
          </div>
        </div>

        {/* Achievement & Leaderboard Row - 2 columns (pairs) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Badges Earned */}
          <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl p-6 border border-teal-100 shadow-sm w-full">
            <div className="flex items-center gap-3 mb-3">
              <Medal size={20} className="text-teal-600" />
              <p className="text-xs font-semibold text-teal-700 uppercase tracking-wide">Badges Earned</p>
            </div>
            <p className="text-3xl font-bold text-gray-800">{Math.floor(points.lifetime / 100)}</p>
            <p className="text-xs text-gray-500 mt-2">Keep playing to earn more!</p>
          </div>
          
          {/* Leaderboard Card */}
          <div 
            onClick={() => navigate('/leaderboard')}
            className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl p-6 border border-teal-100 cursor-pointer hover:shadow-md transition-all group w-full"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <Trophy size={20} className="text-teal-600" />
                  <p className="text-xs font-semibold text-teal-700 uppercase tracking-wide">Leaderboard</p>
                </div>
                <p className="text-sm font-medium text-teal-600 group-hover:underline">View Rankings →</p>
              </div>
              <TrendingUp size={24} className="text-teal-300 group-hover:text-teal-500 transition-colors" />
            </div>
          </div>
        </div>
      </main>

      {/* Footer - Medium grey, sticks to bottom */}
      <footer className="bg-gray-400 py-3 text-center">
        <p className="text-xs text-white">© 2026 LearnEarn. Learn, Play, Earn Rewards!</p>
      </footer>

      {/* Level Progress Modal */}
      {showLevelModal && learnerProgress && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowLevelModal(false)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto animate-fadeIn shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Trophy size={20} className="text-teal-600" />
                <h2 className="text-lg font-bold text-gray-800">Level Progress</h2>
              </div>
              <button
                onClick={() => setShowLevelModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Circular Progress Section */}
              <div className="flex flex-col items-center mb-8">
                <div className="relative">
                  <svg className="w-40 h-40 transform -rotate-90">
                    {/* Background circle */}
                    <circle
                      cx="80"
                      cy="80"
                      r="72"
                      fill="none"
                      stroke="#e5e7eb"
                      strokeWidth="10"
                    />
                    {/* Progress circle */}
                    <circle
                      cx="80"
                      cy="80"
                      r="72"
                      fill="none"
                      stroke="url(#levelGradient)"
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 72}`}
                      strokeDashoffset={`${2 * Math.PI * 72 * (1 - getLevelProgressPercent() / 100)}`}
                      className="transition-all duration-700 ease-out"
                    />
                    <defs>
                      <linearGradient id="levelGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#14b8a6" />
                        <stop offset="100%" stopColor="#0d9488" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-bold text-gray-800">{learnerProgress.unlocked_levels?.length || 1}</span>
                    <span className="text-xs text-gray-500">of 8 Levels</span>
                  </div>
                </div>
                
                <div className="text-center mt-4">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <span className="text-3xl">{getLevelIcon(learnerProgress.current_level)}</span>
                    <h3 className="text-xl font-bold text-gray-800">Level {getLevelDisplayName(learnerProgress.current_level)}</h3>
                  </div>
                  <p className="text-sm text-gray-600">
                    You've completed {learnerProgress.completed_levels?.length || 0} levels
                  </p>
                </div>
              </div>

              {/* Level List */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Unlock size={14} className="text-teal-600" />
                  Level Progression
                </h4>
                <div className="space-y-2">
                  {CLASS_LEVELS.map((level, index) => {
                    const isUnlocked = learnerProgress.unlocked_levels?.includes(level.id);
                    const isCompleted = learnerProgress.completed_levels?.some(l => l.level === level.id);
                    const isCurrent = learnerProgress.current_level === level.id;
                    
                    return (
                      <div
                        key={level.id}
                        className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                          isCurrent ? 'bg-teal-50 border border-teal-200' : 'bg-gray-50'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          isCompleted ? 'bg-green-500' : isUnlocked ? 'bg-teal-500' : 'bg-gray-300'
                        }`}>
                          {isCompleted ? (
                            <Check size={14} className="text-white" />
                          ) : (
                            <span className="text-white text-xs font-bold">{index + 1}</span>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{level.icon}</span>
                            <p className={`font-medium ${isCurrent ? 'text-teal-700' : 'text-gray-700'}`}>
                              {level.name}
                            </p>
                            {isCurrent && (
                              <span className="text-xs px-2 py-0.5 bg-teal-100 text-teal-700 rounded-full">Current</span>
                            )}
                            {isCompleted && (
                              <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">Completed</span>
                            )}
                          </div>
                          {isCurrent && learnerProgress.locked_levels?.length > 0 && (
                            <p className="text-xs text-gray-500 mt-1">
                              Complete this level to unlock {getLevelDisplayName(learnerProgress.locked_levels[0])}
                            </p>
                          )}
                        </div>
                        {isUnlocked && !isCompleted && !isCurrent && (
                          <Lock size={12} className="text-teal-400" />
                        )}
                        {!isUnlocked && (
                          <Lock size={12} className="text-gray-400" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Completed Levels Summary */}
              {learnerProgress.completed_levels && learnerProgress.completed_levels.length > 0 && (
                <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Crown size={16} className="text-purple-600" />
                    <p className="text-sm font-semibold text-purple-800">Completed Levels</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {learnerProgress.completed_levels.map(l => (
                      <span key={l.level} className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
                        {getLevelDisplayName(l.level)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4">
              <button
                onClick={() => setShowLevelModal(false)}
                className="w-full px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-semibold hover:bg-teal-700 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Avatar Modal */}
      {showAvatarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowAvatarModal(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6 animate-fadeIn shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-gray-800 font-bold text-lg">Choose Your Avatar</h3>
              <button onClick={() => setShowAvatarModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {avatars.map((avatar, idx) => (
                <button
                  key={idx}
                  onClick={() => updateAvatar(avatar)}
                  className={`p-2 rounded-xl transition-all hover:scale-105 ${
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
      `}</style>
    </div>
  );
};

// Class Levels data for the modal
const CLASS_LEVELS = [
  { id: 'standard-1', name: 'Standard 1', icon: '🌟' },
  { id: 'standard-2', name: 'Standard 2', icon: '⭐' },
  { id: 'standard-3', name: 'Standard 3', icon: '📘' },
  { id: 'standard-4', name: 'Standard 4', icon: '📚' },
  { id: 'standard-5', name: 'Standard 5', icon: '🎓' },
  { id: 'standard-6', name: 'Standard 6', icon: '🏆' },
  { id: 'standard-7', name: 'Standard 7', icon: '🎯' },
  { id: 'standard-8', name: 'Standard 8', icon: '⚡' }
];

export default LearnerDashboard;