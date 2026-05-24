import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import API_URL from '../../config';

const Card = ({ title, description, icon, onClick, backIcon, backText, path }) => {
  const [flipped, setFlipped] = useState(false);
  
  const handleFlip = (e) => {
    e.stopPropagation();
    setFlipped(!flipped);
    setTimeout(() => {
      setFlipped(false);
    }, 1500);
  };

  return (
    <div 
      className="group relative w-64 h-72 transition-all duration-500 hover:-translate-y-2 cursor-pointer"
      onClick={handleFlip}
    >
      {/* Front Side */}
      <div className={`absolute inset-0 transition-all duration-500 backface-hidden ${
        flipped ? 'opacity-0 rotate-y-180' : 'opacity-100 rotate-y-0'
      }`}>
        <div className="absolute inset-0 rounded-2xl shadow-xl group-hover:shadow-2xl border-2 bg-gradient-to-br from-teal-600 to-teal-800 border-teal-400/30" />
        <div className="relative z-10 flex flex-col items-center justify-center h-full p-6 text-white text-center">
          <div className="text-5xl mb-3">{icon}</div>
          <h2 className="text-xl font-bold tracking-wide">{title}</h2>
          <p className="text-xs font-light mt-1 text-teal-100">{description}</p>
          <div className="mt-4 text-[10px] uppercase tracking-widest font-bold opacity-80 border-t border-white/20 pt-2">
            Tap to flip →
          </div>
        </div>
      </div>

      {/* Back Side */}
      <div className={`absolute inset-0 transition-all duration-500 backface-hidden ${
        flipped ? 'opacity-100 rotate-y-0' : 'opacity-0 rotate-y-180'
      }`}>
        <div className="absolute inset-0 rounded-2xl shadow-xl border-2 bg-gradient-to-br from-teal-700 to-teal-900 border-teal-400/30" />
        <div className="relative z-10 flex flex-col items-center justify-center h-full p-6 text-white text-center">
          <div className="text-5xl mb-3">{backIcon || '🎯'}</div>
          <h2 className="text-xl font-bold tracking-wide">{title}</h2>
          <p className="text-xs font-light mt-1 text-teal-100">{backText || 'Click to start!'}</p>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              if (onClick) onClick();
            }}
            className="mt-3 px-4 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-white font-semibold transition transform hover:scale-105 text-sm"
          >
            Go Now →
          </button>
        </div>
      </div>
    </div>
  );
};

const LearnerDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [points, setPoints] = useState({ current: 0, lifetime: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [dailyRewardClaimed, setDailyRewardClaimed] = useState(false);
  const [streak, setStreak] = useState(0);

  const avatars = [
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Felix',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Luna',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Max',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Bella',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Charlie',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Daisy'
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

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    localStorage.setItem('portal-theme', !isDarkMode ? 'dark' : 'light');
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

  const handleCardClick = (path) => {
    navigate(path);
  };

  const cards = [
    { id: 'quiz', title: 'Play Quiz', description: 'Test your knowledge', icon: '📚', path: '/quizzes', backIcon: '🎯', backText: 'Start Learning!' },
    { id: 'leaderboard', title: 'Leaderboard', description: 'View Rankings', icon: '🏆', path: '/leaderboard', backIcon: '📊', backText: 'View Rankings!' },
    { id: 'rewards', title: 'Reward Store', description: 'Redeem Points', icon: '🎁', path: '/rewards', backIcon: '🛒', backText: 'Shop Now!' },
    { id: 'badges', title: 'My Badges', description: 'Achievements', icon: '🏅', path: '/badges', backIcon: '✨', backText: 'Show Off!' },
    { id: 'community', title: 'Community', description: 'Engage & Learn', icon: '👥', path: '/community', backIcon: '🤝', backText: 'Join Now!' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading your adventure...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-all duration-300 ${
      isDarkMode ? 'bg-slate-900' : 'bg-slate-50'
    }`}>
      
      {/* Header */}
      <header className={`sticky top-0 z-50 backdrop-blur-md ${
        isDarkMode ? 'bg-slate-900/80 border-b border-slate-700' : 'bg-white/80 border-b border-slate-200'
      }`}>
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="bg-teal-600 text-white p-2 rounded-xl shadow-lg">
                <span className="text-xl">🎮</span>
              </div>
              <h1 className="text-xl font-bold tracking-tight">Quiz Arena</h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-lg transition ${
                  isDarkMode 
                    ? 'bg-slate-800 hover:bg-slate-700 text-yellow-400' 
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                {isDarkMode ? '☀️' : '🌙'}
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-white border border-slate-200 hover:bg-red-50 text-slate-600 hover:text-red-600 rounded-lg transition-colors font-medium text-sm shadow-sm"
              >
                Exit
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        
        {/* Profile Summary Card */}
        <div className={`rounded-2xl p-5 mb-6 ${
          isDarkMode 
            ? 'bg-slate-800/50 backdrop-blur-md border border-slate-700' 
            : 'bg-white shadow-lg border border-slate-100'
        }`}>
          <div className="flex flex-col md:flex-row items-center gap-5">
            {/* Avatar */}
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-teal-500 p-1 cursor-pointer hover:scale-105 transition-transform" onClick={() => setShowAvatarModal(true)}>
                <img 
                  src={selectedAvatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user?.username || 'player'}`} 
                  alt="Avatar"
                  className="w-full h-full rounded-full object-cover bg-slate-800"
                />
              </div>
              <button 
                onClick={() => setShowAvatarModal(true)}
                className={`absolute bottom-0 right-0 rounded-full p-1 shadow-lg ${
                  isDarkMode ? 'bg-slate-700' : 'bg-white'
                }`}
              >
                <span className="text-xs">✏️</span>
              </button>
            </div>

            {/* User Info */}
            <div className="flex-1 text-center md:text-left">
              <h2 className={`text-xl font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                {user?.fullName || user?.username || 'Player'}
              </h2>
              <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                <span className={`px-3 py-1 rounded-full text-xs ${
                  isDarkMode 
                    ? 'bg-slate-700 text-slate-300' 
                    : 'bg-slate-100 text-slate-600'
                }`}>
                  📚 {user?.classLevel || 'Adventurer'}
                </span>
                <span className="px-3 py-1 rounded-full bg-teal-100 text-teal-700 text-xs">
                  🏆 {getRankTitle()}
                </span>
              </div>
            </div>

            {/* Points */}
            <div className="flex gap-3">
              <div className="text-center px-4 py-2 bg-teal-500 rounded-xl">
                <div className="text-white text-[10px]">Available</div>
                <div className="text-white font-bold text-xl">{points.current}</div>
              </div>
              <div className={`text-center px-4 py-2 rounded-xl ${
                isDarkMode ? 'bg-slate-700' : 'bg-slate-100'
              }`}>
                <div className={`text-[10px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Lifetime</div>
                <div className={`font-bold text-xl ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{points.lifetime}</div>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className={`flex justify-between text-xs mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              <span>📈 Progress to Next Rank</span>
              <span>{Math.round(getProgressPercent())}%</span>
            </div>
            <div className={`w-full h-2 rounded-full overflow-hidden ${isDarkMode ? 'bg-slate-700' : 'bg-slate-100'}`}>
              <div 
                className="h-full bg-teal-500 rounded-full transition-all duration-700"
                style={{ width: `${getProgressPercent()}%` }}
              />
            </div>
          </div>
        </div>

        {/* Daily Reward */}
        <div 
          onClick={claimDailyReward}
          className={`mb-8 rounded-xl p-3 transition-all cursor-pointer ${
            dailyRewardClaimed 
              ? isDarkMode ? 'bg-slate-800/50' : 'bg-slate-100'
              : 'bg-teal-500 animate-pulse'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-2xl">🎁</div>
              <div>
                <h3 className="text-white font-semibold text-sm">Daily Reward</h3>
                <p className="text-white/80 text-xs">
                  {dailyRewardClaimed ? "Come back tomorrow!" : "Tap to claim your bonus!"}
                </p>
              </div>
            </div>
            {streak > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 bg-teal-500 rounded-full">
                <span className="text-xs">🔥</span>
                <span className="text-white font-bold text-xs">{streak}</span>
              </div>
            )}
          </div>
        </div>

        {/* Square Grid Layout - 3x2 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 justify-items-center">
          {cards.map((card) => (
            <Card 
              key={card.id}
              title={card.title}
              description={card.description}
              icon={card.icon}
              onClick={() => handleCardClick(card.path)}
              backIcon={card.backIcon}
              backText={card.backText}
              path={card.path}
            />
          ))}
        </div>

        {/* Footer Quote */}
        <div className="mt-10 text-center">
          <div className={`inline-block px-4 py-2 rounded-full text-xs ${
            isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'
          }`}>
            💡 "Knowledge is power! Keep learning every day!"
          </div>
        </div>
      </main>

      {/* Avatar Modal */}
      {showAvatarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setShowAvatarModal(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-teal-500/30" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-slate-800 font-bold text-xl">Choose Your Avatar</h3>
              <button onClick={() => setShowAvatarModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {avatars.map((avatar, idx) => (
                <button
                  key={idx}
                  onClick={() => updateAvatar(avatar)}
                  className={`p-1 rounded-xl transition-all hover:scale-105 ${
                    selectedAvatar === avatar ? 'ring-2 ring-teal-500 bg-teal-50' : 'hover:bg-slate-50'
                  }`}
                >
                  <img src={avatar} alt={`Avatar ${idx + 1}`} className="w-full rounded-lg" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Mobile Nav */}
      <div className={`fixed bottom-0 inset-x-0 lg:hidden backdrop-blur-md border-t ${
        isDarkMode 
          ? 'bg-slate-900/80 border-slate-700' 
          : 'bg-white/80 border-slate-200'
      }`}>
        <div className="flex justify-around items-center py-2">
          <button onClick={() => navigate('/quizzes')} className="flex flex-col items-center p-2">
            <span className="text-xl">📚</span>
            <span className="text-[10px]">Quiz</span>
          </button>
          <button onClick={() => navigate('/rewards')} className="flex flex-col items-center p-2">
            <span className="text-xl">🎁</span>
            <span className="text-[10px]">Store</span>
          </button>
          <button onClick={() => navigate('/leaderboard')} className="flex flex-col items-center p-2">
            <span className="text-xl">🏆</span>
            <span className="text-[10px]">Rank</span>
          </button>
          <button onClick={() => navigate('/badges')} className="flex flex-col items-center p-2">
            <span className="text-xl">🏅</span>
            <span className="text-[10px]">Badges</span>
          </button>
        </div>
      </div>

      <div className="h-16 lg:h-0"></div>

      <style jsx>{`
        .backface-hidden {
          backface-visibility: hidden;
        }
        
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
        
        .rotate-y-0 {
          transform: rotateY(0deg);
        }
      `}</style>
    </div>
  );
};

export default LearnerDashboard;