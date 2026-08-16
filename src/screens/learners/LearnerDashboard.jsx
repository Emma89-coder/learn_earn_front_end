// src/screens/learners/LearnerDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import API_URL from '../../config';
import { 
  Trophy, Compass, ShoppingBag, BarChart3, User, Home, 
  Map, Brain, LayoutGrid, Lock, Unlock, 
  Sparkles, Zap, Target, Award, Star,
  Gift, LogOut, X, Check, Rocket, Activity, ArrowRight, Headphones
} from 'lucide-react';

const CLASS_LEVELS = [
  { id: 'standard-5', name: 'Standard 5' },
  { id: 'standard-6', name: 'Standard 6' },
  { id: 'standard-7', name: 'Standard 7' },
  { id: 'standard-8', name: 'Standard 8' }
];

const LearnerDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  // State Management
  const [points, setPoints] = useState({ current: 0, lifetime: 0 });
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [dailyRewardClaimed, setDailyRewardClaimed] = useState(false);
  const [streak, setStreak] = useState(0);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [showLevelModal, setShowLevelModal] = useState(false);
  const [learnerProgress, setLearnerProgress] = useState(null);
  const [hangmanStats, setHangmanStats] = useState(null);

  const avatars = [
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Felix',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Luna',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Max',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Bella',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Charlie',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Daisy'
  ];

  const navItems = [
    { id: 'home', label: 'Home', icon: <Home size={16} />, path: '/dashboard' },
    { id: 'quiz', label: 'Quizzes', icon: <Compass size={16} />, path: '/quizzes' },
    { id: 'store', label: 'Store', icon: <ShoppingBag size={16} />, path: '/rewards' },
    { id: 'stats', label: 'Leaderboard', icon: <BarChart3 size={16} />, path: '/leaderboard' }
  ];

  const games = [
    { 
      id: 'categories', 
      title: 'Select Quiz', 
      subtitle: 'Browse topics', 
      icon: <LayoutGrid size={22} />, 
      path: '/quizzes', 
      params: { view: 'categories' }, 
      iconColor: 'text-teal-600 bg-teal-50' 
    },
    { 
      id: 'malawi', 
      title: 'Malawi Districts', 
      subtitle: 'Geography challenge', 
      icon: <Map size={22} />, 
      path: '/quizzes', 
      params: { category: 'malawi-districts' }, 
      iconColor: 'text-teal-600 bg-teal-50' 
    },
    { 
      id: 'hangman', 
      title: 'Hangman', 
      subtitle: 'Vocabulary builder', 
      icon: <Brain size={22} />, 
      path: '/hangman', 
      params: {}, 
      iconColor: 'text-teal-600 bg-teal-50' 
    },
    { 
      id: 'spelling-bee', 
      title: 'Spelling Bee', 
      subtitle: 'Listen and spell', 
      icon: <Headphones size={22} />, 
      path: '/spelling-bee', 
      params: {}, 
      iconColor: 'text-purple-600 bg-purple-50' 
    }
  ];

  useEffect(() => {
    fetchData();
    checkDailyReward();
    loadStreak();
    fetchLearnerProgress();
    fetchHangmanStats();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get(`${API_URL}/api/learner/balance`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPoints({ 
        current: data.current_points || 0, 
        lifetime: data.lifetime_points || 0 
      });
      const savedAvatar = localStorage.getItem('userAvatar');
      if (savedAvatar) setSelectedAvatar(savedAvatar);
    } catch (err) {
      console.error("Failed to load data", err);
      toast.error('Could not load your dashboard');
    }
  };

  const fetchLearnerProgress = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/learner/progress`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setLearnerProgress(response.data.progress);
      }
    } catch (error) {
      console.error('Error fetching progress:', error);
    }
  };

  const fetchHangmanStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/hangman/user-stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setHangmanStats(response.data.stats);
      }
    } catch (error) {
      console.error('Error fetching hangman stats:', error);
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
      toast.success(`You earned ${rewardPoints} bonus points!`);
    }
  };

  const updateAvatar = (avatarUrl) => {
    setSelectedAvatar(avatarUrl);
    localStorage.setItem('userAvatar', avatarUrl);
    setShowAvatarModal(false);
    toast.success('Avatar updated successfully');
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
    if (points.lifetime < 100) return 'Seedling 🌱';
    if (points.lifetime < 500) return 'Explorer 🧭';
    if (points.lifetime < 1000) return 'Scholar 📚';
    if (points.lifetime < 5000) return 'Master 🎓';
    return 'Legend 👑';
  };

  const getLevelDisplayName = (level) => {
    if (!level) return 'Not Assigned';
    return level.split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
  };

  const handleCardClick = (path, params = {}) => {
    if (path) {
      const queryString = new URLSearchParams(params).toString();
      const fullPath = queryString ? `${path}?${queryString}` : path;
      console.log(`Navigating to: ${fullPath}`);
      navigate(fullPath);
    }
  };

  const handleNavClick = (id, path) => {
    setActiveTab(id);
    navigate(path);
  };

  return (
    <div className="min-h-screen bg-teal-50 text-gray-900 font-['Inter',system-ui,sans-serif] flex flex-col">
      
      {/* Header */}
      <header className="bg-gradient-to-r from-teal-800 via-teal-700 to-teal-600 shadow-2xl border-b-2 border-teal-400/50 sticky top-0 z-50">
        <div className="max-w-full mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <img 
                src="/logo.png" 
                alt="Logo" 
                className="w-16 h-16 object-contain drop-shadow-lg"
                loading="eager"
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/64x64?text=LE';
                }}
              />
              <div>
                <h1 className="text-2xl font-black tracking-tighter text-white" style={{ fontFamily: "'Poppins', system-ui, sans-serif" }}>
                  LearnEarn
                </h1>
                <p className="text-[10px] text-teal-200 font-semibold uppercase tracking-wider">Learning Platform</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/15 rounded-full backdrop-blur-md border border-white/30 shadow-lg">
              <Star size={16} className="text-yellow-300" />
              <span className="text-white text-sm font-semibold tracking-wide">
                {getGreeting()}, {user?.fullName?.split(' ')[0] || 'Learner'}!
              </span>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowLevelModal(true)}
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-all backdrop-blur-md border border-white/20"
              >
                <Activity size={14} className="text-teal-200" />
                <div className="text-left">
                  <p className="text-[8px] text-teal-200 uppercase tracking-wider font-bold">Level</p>
                  <p className="text-xs font-bold text-white leading-tight">{getLevelDisplayName(learnerProgress?.current_level)}</p>
                </div>
              </button>

              <button onClick={() => setShowUserMenu(!showUserMenu)} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 transition-all rounded-full p-1 pr-4 border border-white/30 backdrop-blur-md">
                <img 
                  src={selectedAvatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user?.username || 'player'}`} 
                  className="w-8 h-8 rounded-full bg-teal-500 border-2 border-white object-cover"
                  alt="Avatar"
                />
                <span className="text-white text-sm font-semibold hidden sm:inline">{user?.fullName?.split(' ')[0] || 'Learner'}</span>
              </button>
            </div>
          </div>
        </div>

        <nav className="max-w-full mx-auto px-6">
          <ul className="flex gap-0">
            {navItems.map((item) => (
              <li key={item.id}>
                <button 
                  onClick={() => handleNavClick(item.id, item.path)}
                  className={`px-5 py-3 text-sm font-bold transition-all flex items-center gap-2 relative ${
                    activeTab === item.id 
                      ? 'text-white' 
                      : 'text-teal-200 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {item.icon}
                  <span className="uppercase tracking-wide">{item.label}</span>
                  {activeTab === item.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-400 rounded-full"></div>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {!dailyRewardClaimed && (
            <div className="relative overflow-hidden bg-gradient-to-r from-teal-900 via-teal-800 to-teal-900 text-white rounded-2xl p-6 shadow-xl border border-teal-400/30 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-teal-400/10 rounded-full blur-3xl pointer-events-none"></div>
              <div className="flex items-center gap-4 z-10">
                <div className="p-3.5 bg-gradient-to-br from-teal-400 to-teal-500 rounded-xl shadow-lg shadow-teal-400/20 text-teal-950 animate-pulse">
                  <Gift size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-lg tracking-wide flex items-center gap-2">
                    Daily Bonus Waiting <Sparkles size={16} className="text-teal-300" />
                  </h3>
                  <p className="text-teal-200 text-xs mt-0.5">Keep your streak alive and grab <span className="text-teal-300 font-bold">{50 + Math.floor(streak / 5) * 10} points</span> now.</p>
                </div>
              </div>
              <button
                onClick={claimDailyReward}
                className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-teal-400 to-teal-500 text-teal-950 rounded-xl text-xs font-black tracking-wider uppercase hover:opacity-90 transition-all shadow-lg hover:shadow-teal-400/20"
              >
                Claim Reward
              </button>
            </div>
          )}

          {/* Activity Hub Grid */}
          <section>
            <div className="flex flex-col sm:flex-row justify-between sm:items-end mb-4 gap-2">
              <div>
                <h2 className="text-xl font-black text-teal-800 tracking-tight uppercase flex items-center gap-2">
                  <Rocket size={20} className="text-teal-600" /> Primary Learning Hub
                </h2>
                <p className="text-sm text-teal-600">Pick an interactive station to begin accumulating reward assets</p>
              </div>
              <span className="text-[11px] self-start sm:self-auto px-3 py-1 bg-teal-200 text-teal-700 rounded-md font-bold uppercase tracking-wider">
                {games.length} Platforms Available
              </span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {games.map((game) => (
                <div
                  key={game.id}
                  onClick={() => handleCardClick(game.path, game.params)}
                  className="group bg-white rounded-2xl p-5 border border-teal-200/80 shadow-sm hover:shadow-xl hover:border-teal-400 cursor-pointer transition-all duration-200 relative overflow-hidden flex items-center gap-4"
                >
                  <div className={`p-4 rounded-xl ${game.iconColor} group-hover:scale-105 transition-transform duration-200`}>
                    {game.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-teal-800 text-base group-hover:text-teal-600 transition-colors truncate">{game.title}</h3>
                    <p className="text-xs text-teal-400 mt-0.5 truncate">{game.subtitle}</p>
                    
                    {game.id === 'hangman' && hangmanStats && (
                      <div className="flex gap-2 mt-1">
                        <span className="text-[10px] bg-teal-50 text-teal-700 px-1.5 py-0.5 rounded font-medium">
                          🎯 {hangmanStats.successRate || 0}%
                        </span>
                        <span className="text-[10px] bg-teal-100/50 text-teal-800 px-1.5 py-0.5 rounded font-medium">
                          🏆 {hangmanStats.totalAttempts || 0}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-1.5 rounded-lg bg-teal-50 group-hover:bg-teal-100 text-teal-400 group-hover:text-teal-600 transition-colors">
                    <ArrowRight size={14} />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Curriculum Roadmap Track */}
          <section className="bg-white rounded-2xl p-5 border border-teal-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Target size={20} className="text-teal-600" />
                <h3 className="font-bold text-teal-800 text-base">Curriculum Roadmap</h3>
              </div>
              <span className="text-[11px] text-teal-700 bg-teal-100 px-3 py-1 rounded-full font-medium">
                Standard Progress
              </span>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {CLASS_LEVELS.map((level, idx) => {
                const isCurrent = learnerProgress?.current_level === level.id;
                const isCompleted = learnerProgress?.completed_levels?.some(l => l.level === level.id);
                const isUnlocked = learnerProgress?.unlocked_levels?.includes(level.id);

                return (
                  <div 
                    key={level.id}
                    className={`p-3 rounded-xl border text-center relative ${
                      isCurrent ? 'bg-teal-50 border-teal-400' :
                      isCompleted ? 'bg-teal-50/20 border-teal-200' : 'bg-teal-50/50 border-teal-100 opacity-60'
                    }`}
                  >
                    <div className="mx-auto w-7 h-7 rounded-full flex items-center justify-center text-sm mb-1.5 font-bold">
                      {isCompleted ? <Check size={14} className="text-teal-600" /> : 
                       !isUnlocked ? <Lock size={12} className="text-teal-400" /> : 
                       <span className={isCurrent ? 'text-teal-600' : 'text-teal-500'}>{idx + 5}</span>}
                    </div>
                    <p className="text-sm font-bold text-teal-700 truncate">{level.name}</p>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-5 border border-teal-200/80 shadow-sm space-y-4">
            <h3 className="text-xs font-black text-teal-400 tracking-wider uppercase">Asset Allocation</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-teal-50 rounded-xl p-3 border border-teal-100">
                <div className="flex items-center gap-1.5 text-teal-500 text-xs">
                  <Sparkles size={14} className="text-teal-600" /> Balance
                </div>
                <p className="text-xl font-black text-teal-800 mt-1">{points.current}</p>
              </div>
              <div className="bg-teal-50 rounded-xl p-3 border border-teal-100">
                <div className="flex items-center gap-1.5 text-teal-500 text-xs">
                  <Trophy size={14} className="text-teal-600" /> Cumulative
                </div>
                <p className="text-xl font-black text-teal-800 mt-1">{points.lifetime}</p>
              </div>
              <div className="bg-teal-50 rounded-xl p-3 border border-teal-100">
                <div className="flex items-center gap-1.5 text-teal-500 text-xs">
                  <Zap size={14} className="text-teal-600" /> Streak
                </div>
                <p className="text-xl font-black text-teal-800 mt-1">{streak} Days</p>
              </div>
              <div className="bg-teal-50 rounded-xl p-3 border border-teal-100">
                <div className="flex items-center gap-1.5 text-teal-500 text-xs">
                  <Activity size={14} className="text-teal-600" /> Rank Title
                </div>
                <p className="text-sm font-black text-teal-800 mt-2 truncate">{getRankTitle()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-teal-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-black text-teal-400 tracking-wider uppercase">Next Tier Milestone</h3>
              <Award size={16} className="text-teal-600" />
            </div>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between items-center text-sm mb-1.5">
                  <span className="font-bold text-teal-700">Master Level 🎓</span>
                  <span className="text-teal-500 font-medium">{points.lifetime} / 1000 pts</span>
                </div>
                <div className="w-full bg-teal-100 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-teal-500 to-teal-600 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min((points.lifetime / 1000) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
              <div className="pt-2 border-t border-teal-100 grid grid-cols-2 gap-2 text-center text-sm">
                <div className="p-2 bg-teal-50/50 rounded-lg">
                  <p className="text-teal-400 text-[10px]">Badges Secured</p>
                  <p className="font-bold text-teal-800 mt-0.5">{Math.floor(points.lifetime / 100)}</p>
                </div>
                <div className="p-2 bg-teal-50/50 rounded-lg">
                  <p className="text-teal-400 text-[10px]">Modules Closed</p>
                  <p className="font-bold text-teal-800 mt-0.5">{learnerProgress?.completed_levels?.length || 0}</p>
                </div>
              </div>
            </div>
          </div>

          {hangmanStats && (
            <div className="bg-white rounded-2xl p-5 border border-teal-200 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Brain size={18} className="text-teal-700" />
                <h3 className="text-xs font-black text-teal-800 tracking-wider uppercase">Hangman Progress</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-teal-50/50 rounded-xl p-3 text-center border border-teal-100">
                  <p className="text-2xl font-black text-teal-800">{hangmanStats.totalAttempts || 0}</p>
                  <p className="text-[10px] text-teal-500 font-medium">Total Attempts</p>
                </div>
                <div className="bg-teal-50/50 rounded-xl p-3 text-center border border-teal-100">
                  <p className="text-2xl font-black text-teal-700">{hangmanStats.successRate || 0}%</p>
                  <p className="text-[10px] text-teal-500 font-medium">Success Rate</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-teal-200 py-6 text-center mt-auto">
        <div className="max-w-full mx-auto px-6 flex flex-col sm:flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
            <span className="text-sm font-bold text-teal-700">LearnEarn</span>
          </div>
          <p className="text-xs text-teal-500 mt-2 sm:mt-0">© 2026 LearnEarn. All rights reserved.</p>
        </div>
      </footer>

      {/* User Menu Dropdown */}
      {showUserMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)}></div>
          <div className="absolute right-6 top-16 mt-3 w-56 bg-white border border-teal-100 rounded-xl shadow-xl z-50 overflow-hidden py-2">
            <div className="px-4 py-2 mb-2 border-b border-teal-50 bg-teal-50">
              <p className="text-sm font-bold text-teal-800">{user?.fullName}</p>
              <p className="text-xs text-teal-600">{user?.email}</p>
            </div>
            <button
              onClick={() => { setShowUserMenu(false); setShowAvatarModal(true); }}
              className="w-full px-4 py-2 text-left text-sm text-teal-700 hover:bg-teal-50 transition-colors flex items-center gap-2"
            >
              <User size={14} className="text-teal-500" /> Change Avatar
            </button>
            <button
              onClick={handleLogout}
              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
            >
              <LogOut size={14} className="text-red-400" /> Sign Out
            </button>
          </div>
        </>
      )}

      {/* Level Progress Modal */}
      {showLevelModal && learnerProgress && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-teal-900/60 backdrop-blur-sm" onClick={() => setShowLevelModal(false)}>
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-teal-100 flex justify-between items-center bg-teal-50 rounded-t-2xl sticky top-0">
              <div className="flex items-center gap-2">
                <Target size={18} className="text-teal-600" />
                <h2 className="text-lg font-bold text-teal-800">Level Progression</h2>
              </div>
              <button onClick={() => setShowLevelModal(false)} className="p-1 text-teal-400 hover:text-teal-900 hover:bg-teal-100 rounded-full transition-colors">
                <X size={18} />
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto flex-1">
              <div className="mb-6 text-center bg-teal-50 p-5 rounded-xl border border-teal-100">
                <p className="text-[10px] text-teal-600 mb-1 font-bold uppercase tracking-wide">Current Status</p>
                <p className="text-2xl font-black text-teal-800">{getLevelDisplayName(learnerProgress.current_level)}</p>
                <div className="inline-flex items-center gap-1.5 mt-2 px-2 py-0.5 bg-white rounded-full border border-teal-200 text-[10px] font-medium text-teal-700">
                  <Unlock size={10} className="text-teal-500" />
                  Unlocked {learnerProgress.unlocked_levels?.length || 1} of 4 Levels
                </div>
              </div>

              <div className="space-y-2">
                {CLASS_LEVELS.map((level) => {
                  const isCurrent = learnerProgress.current_level === level.id;
                  const isCompleted = learnerProgress.completed_levels?.some(l => l.level === level.id);
                  const isUnlocked = learnerProgress.unlocked_levels?.includes(level.id);

                  return (
                    <div 
                      key={level.id} 
                      className={`p-3 rounded-xl border transition-all flex justify-between items-center ${
                        isCurrent ? 'border-teal-400 bg-teal-50 shadow-md' : 
                        isCompleted ? 'border-teal-200 bg-white' : 'border-teal-100 bg-teal-50/50 opacity-75'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          isCompleted ? 'bg-teal-500 text-white' : 
                          isCurrent ? 'bg-teal-600 text-white shadow-md' : 'bg-teal-200 text-teal-400'
                        }`}>
                          {isCompleted ? <Check size={14} /> : 
                           !isUnlocked ? <Lock size={12} /> : 
                           <Target size={14} />}
                        </div>
                        <div>
                          <p className={`text-sm font-bold ${!isUnlocked ? 'text-teal-400' : 'text-teal-800'}`}>{level.name}</p>
                          {isCurrent && <p className="text-[9px] font-semibold text-teal-600 mt-0.5">In Progress</p>}
                          {isCompleted && <p className="text-[9px] font-medium text-teal-600 mt-0.5">✓ Completed</p>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Avatar Selection Modal */}
      {showAvatarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-teal-900/60 backdrop-blur-sm" onClick={() => setShowAvatarModal(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={() => setShowAvatarModal(false)} 
              className="absolute right-4 top-4 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={18} />
            </button>
            <h3 className="text-lg font-bold text-teal-800 mb-4">Choose Your Avatar</h3>
            <div className="grid grid-cols-3 gap-4">
              {avatars.map((avatarUrl, idx) => (
                <button
                  key={idx}
                  onClick={() => updateAvatar(avatarUrl)}
                  className={`p-2 rounded-xl border-2 hover:border-teal-500 hover:bg-teal-50/50 transition-all ${
                    selectedAvatar === avatarUrl ? 'border-teal-500 bg-teal-50' : 'border-gray-200'
                  }`}
                >
                  <img src={avatarUrl} alt={`Avatar option ${idx + 1}`} className="w-20 h-20 mx-auto" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default LearnerDashboard;