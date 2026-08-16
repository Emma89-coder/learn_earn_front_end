// src/screens/learners/LearnerDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme, getContrastTextColor } from '../../contexts/ThemeContext';
import toast from 'react-hot-toast';
import API_URL from '../../config';
import { 
  X, Search, Gift, Sparkles, CheckCircle, Clock, Tag, Copy, Check, 
  Award, Star, AlertCircle, RefreshCw, Trash2, Loader2, ShoppingBag,
  Wallet, History, ArrowRight, Eye, EyeOff, Menu, Home, Trophy, 
  Medal, BookOpen, Zap, User, LogOut, Moon, Sun, Grid, List, 
  ChevronRight, ChevronLeft
} from 'lucide-react';

// Import images
import mapImage from '../../assets/images/map.png';
import learnerImage from '../../assets/images/learner.png';
import scienceImage from '../../assets/images/science.png';
import basketImage from '../../assets/images/basket.png';
import mathsImage from '../../assets/images/maths.png';
import chichewaImage from '../../assets/images/chichewa.png';
import spellImage from '../../assets/images/spell.png';
import hangmanImage from '../../assets/images/hangman.png'; 
import quizImage from '../../assets/images/quiz.png';
import map2Image from '../../assets/images/map2.png';
import quizImage2 from '../../assets/images/quiz2.png';

// Primary School Levels (Standards 5-8)
const PRIMARY_LEVELS = [
  { id: 'standard-5', name: 'Standard 5' },
  { id: 'standard-6', name: 'Standard 6' },
  { id: 'standard-7', name: 'Standard 7' },
  { id: 'standard-8', name: 'Standard 8' }
];

// Secondary School Levels (Form 1-4)
const SECONDARY_LEVELS = [
  { id: 'form-1', name: 'Form 1' },
  { id: 'form-2', name: 'Form 2' },
  { id: 'form-3', name: 'Form 3' },
  { id: 'form-4', name: 'Form 4' }
];

// Get all levels combined
const ALL_LEVELS = [...PRIMARY_LEVELS, ...SECONDARY_LEVELS];

// Sidebar navigation items
const SIDEBAR_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: '🏠', path: '/dashboard' },
  { id: 'rewards', label: 'Rewards', icon: '🎁', path: '/rewards' },
  { id: 'badges', label: 'Badges', icon: '🏅', path: '/badges' },
  { id: 'history', label: 'History', icon: '📊', path: '/quiz-history' },
  { id: 'leaderboard', label: 'Leaderboard', icon: '🏆', path: '/leaderboard' },
];

const LearnerDashboard = () => {
  const { user, logout } = useAuth();
  const { settings: theme, getPageStyles } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  
  // ─── Theme Colors ───
  const accentColor = theme?.accentColor || '#0f766e';
  const borderRadius = theme?.borderRadius || '12';
  const fontFamily = theme?.fontFamily || 'Inter';
  const fontSize = theme?.fontSize || '16';
  const headingSize = theme?.headingSize || '24';

  // ─── State Management ───
  const [points, setPoints] = useState({ current: 0, lifetime: 0 });
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [dailyRewardClaimed, setDailyRewardClaimed] = useState(false);
  const [streak, setStreak] = useState(0);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [leaderboard, setLeaderboard] = useState([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const [showLevelModal, setShowLevelModal] = useState(false);
  const [learnerProgress, setLearnerProgress] = useState(null);
  const [hangmanStats, setHangmanStats] = useState(null);
  const [badges, setBadges] = useState([]);
  const [loadingBadges, setLoadingBadges] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('portal-theme');
    if (savedTheme) return savedTheme === 'dark';
    return true;
  });
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hoveredCardId, setHoveredCardId] = useState(null);
  const [userLevel, setUserLevel] = useState('standard-5');
  const [isSecondaryStudent, setIsSecondaryStudent] = useState(false);
  const [showBalance, setShowBalance] = useState(true);

  const iceWhite = '#f7fbff';
  const darkTeal = '#075351';
  const mutedDarkTeal = '#2f6b64';
  const headingColor = theme?.headingColor || (isDarkMode ? iceWhite : darkTeal);
  const bodyColor = theme?.bodyColor || (isDarkMode ? iceWhite : mutedDarkTeal);
  const sidebarTextColor = theme?.sidebarTextColor || (isDarkMode ? iceWhite : darkTeal);
  const cardTextColor = theme?.cardTextColor || bodyColor;
  const bgColor = theme?.bgColor || '#075351';
  const cardBg = '#075351';
  const headerBg = '#075351';
  const pageBackgroundColor = '#ccf5eb';
  const pageTextColor = isDarkMode ? iceWhite : darkTeal;
  const sidebarSurface = 'rgba(204, 245, 235, 0.95)';

  // ─── Rewards Store State ───
  const [rewards, setRewards] = useState([]);
  const [loadingRewards, setLoadingRewards] = useState(true);
  const [redeemingId, setRedeemingId] = useState(null);
  const [selectedReward, setSelectedReward] = useState(null);
  const [showRewardDialog, setShowRewardDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [activeStoreTab, setActiveStoreTab] = useState('store');
  const [redemptions, setRedemptions] = useState([]);
  const [loadingRedemptions, setLoadingRedemptions] = useState(false);
  const [copiedVoucher, setCopiedVoucher] = useState(null);
  const [refundingId, setRefundingId] = useState(null);
  const [showRefundConfirm, setShowRefundConfirm] = useState(false);
  const [refundTarget, setRefundTarget] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [showRewardsSection, setShowRewardsSection] = useState(true);

  const avatars = [
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Felix',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Luna',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Max',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Bella',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Charlie',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Daisy'
  ];

  // All quiz games
  const quizGames = [
    { 
      id: 'categories', 
      title: 'Select Quiz', 
      subtitle: 'Browse topics', 
      path: '/quizzes', 
      params: { view: 'categories' },
      color: 'from-teal-500 to-cyan-500',
      image: quizImage
    },
    { 
      id: 'malawi', 
      title: 'Malawi Districts', 
      subtitle: 'Geography challenge', 
      path: '/quiz/malawi-districts', 
      params: {},
      color: 'from-emerald-500 to-teal-500',
      image: map2Image
    },
    { 
      id: 'hangman', 
      title: 'Hangman', 
      subtitle: 'Vocabulary builder', 
      path: '/hangman', 
      params: {},
      color: 'from-cyan-500 to-teal-500',
      image: hangmanImage
    },
    { 
      id: 'spelling-bee', 
      title: 'Spelling Bee', 
      subtitle: 'Listen and spell', 
      path: '/spelling-bee', 
      params: {},
      color: 'from-teal-500 to-emerald-500',
      image: spellImage
    }
  ];

  // ─── Effects ───
  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    if (userData && userData.class_level) {
      const level = userData.class_level.toLowerCase();
      setUserLevel(level);
      const isSecondary = level.startsWith('form');
      setIsSecondaryStudent(isSecondary);
    }
  }, []);

  // Override stale localStorage level with fresh server data once loaded
  useEffect(() => {
    if (learnerProgress?.class_level) {
      const level = learnerProgress.class_level.toLowerCase();
      setUserLevel(level);
      setIsSecondaryStudent(level.startsWith('form'));
    }
  }, [learnerProgress]);

  useEffect(() => {
    const currentPath = location.pathname;
    const activeItem = SIDEBAR_ITEMS.find(item => currentPath === item.path);
    if (activeItem) {
      setActiveTab(activeItem.id);
    }
  }, [location.pathname]);

  useEffect(() => {
    localStorage.setItem('portal-theme', isDarkMode ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  useEffect(() => {
    fetchData();
    checkDailyReward();
    loadStreak();
    fetchLearnerProgress();
    fetchHangmanStats();
    fetchBadges();
    fetchRewardsData();
    fetchRedemptions();
    fetchLeaderboard();
    
    const clockInterval = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    return () => clearInterval(clockInterval);
  }, []);

  // ─── Data Fetching ───
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

  const fetchLeaderboard = async () => {
    try {
      setLoadingLeaderboard(true);
      const res = await axios.get(`${API_URL}/api/leaderboard`);
      setLeaderboard(res.data.leaderboard || []);
    } catch (err) {
      console.error('Leaderboard fetch failed:', err);
    } finally {
      setLoadingLeaderboard(false);
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

  const fetchBadges = async () => {
    try {
      setLoadingBadges(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/learner/badges`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setBadges(response.data.badges || []);
      }
    } catch (error) {
      console.error('Error fetching badges:', error);
    } finally {
      setLoadingBadges(false);
    }
  };

  // ─── Rewards Functions ───
  const fetchRewardsData = async () => {
    try {
      setLoadingRewards(true);
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const rewardsRes = await axios.get(`${API_URL}/api/learner/rewards`, { headers });
      
      const activeRewards = (rewardsRes.data.rewards || []).filter(r => r.is_active !== false);
      setRewards(activeRewards);
    } catch (error) {
      console.error('Error fetching rewards:', error);
      toast.error('Could not load rewards');
    } finally {
      setLoadingRewards(false);
    }
  };

  const fetchRedemptions = async () => {
    try {
      setLoadingRedemptions(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        setRedemptions([]);
        return;
      }
      
      const res = await axios.get(`${API_URL}/api/learner/redemptions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data.success) {
        const redemptionsData = (res.data.redemptions || []).filter(r => {
          const status = (r.status || '').toLowerCase();
          return status !== 'refunded' && status !== 'deleted' && status !== 'refund';
        });
        setRedemptions(redemptionsData);
      } else {
        setRedemptions([]);
      }
    } catch (error) {
      console.error('Error fetching redemptions:', error);
      setRedemptions([]);
    } finally {
      setLoadingRedemptions(false);
    }
  };

  const handleRedeemItem = async (reward) => {
    if (!reward) return;
    
    try {
      setRedeemingId(reward.id);
      const token = localStorage.getItem('token');
      
      const response = await axios.post(
        `${API_URL}/api/learner/redeem-reward`,
        { rewardId: reward.id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        toast.success(response.data.message || 'Reward redeemed successfully! 🎉', { duration: 4000 });
        
        if (response.data.points_remaining !== undefined) {
          setPoints(prev => ({ ...prev, current: response.data.points_remaining }));
        }

        await fetchRedemptions();
        await fetchRewardsData();
        
        setShowRewardDialog(false);
        setSelectedReward(null);
      } else {
        toast.error(response.data.error || 'Failed to redeem reward');
      }
    } catch (error) {
      console.error('Redeem error:', error);
      toast.error('Failed to redeem reward. Please try again.');
    } finally {
      setRedeemingId(null);
    }
  };

  const requestRefund = async (redemption) => {
    setRefundTarget(redemption);
    setShowRefundConfirm(true);
  };

  const confirmRefundRequest = async () => {
    if (!refundTarget) return;
    
    try {
      setRefundingId(refundTarget.id);
      const token = localStorage.getItem('token');
      
      const response = await axios.post(
        `${API_URL}/api/learner/request-refund`,
        { redemptionId: refundTarget.id },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (response.data.success) {
        toast.success('Refund request submitted! Waiting for admin approval.', { duration: 4000 });
        setTimeout(() => fetchRedemptions(), 500);
        setShowRefundConfirm(false);
        setRefundTarget(null);
      } else {
        toast.error(response.data.message || 'Failed to request refund');
      }
    } catch (error) {
      console.error('Refund request error:', error);
      toast.error('Could not request refund. Please try again.');
    } finally {
      setRefundingId(null);
    }
  };

  const copyVoucherToClipboard = (voucherNumber) => {
    if (!voucherNumber) return;
    navigator.clipboard.writeText(voucherNumber).then(() => {
      setCopiedVoucher(voucherNumber);
      toast.success('Voucher copied to clipboard!');
      setTimeout(() => setCopiedVoucher(null), 2000);
    }).catch(() => {
      toast.error('Failed to copy voucher');
    });
  };

  const openRewardDialog = (reward) => {
    setSelectedReward(reward);
    setShowRewardDialog(true);
  };

  const closeRewardDialog = () => {
    setShowRewardDialog(false);
    setSelectedReward(null);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchTerm(searchInput.trim().toLowerCase());
  };

  const clearSearch = () => {
    setSearchInput('');
    setSearchTerm('');
  };

  const filteredRewards = rewards.filter(reward => {
    if (searchTerm && !reward.name.toLowerCase().includes(searchTerm)) return false;
    return reward.is_active !== false;
  });

  const getStockStatus = (stock) => {
    if (stock === undefined || stock === null) return { label: 'Unlimited', color: '#5eead4', icon: '∞' };
    if (stock === 0) return { label: 'Out of Stock', color: '#f87171', icon: '❌' };
    if (stock < 10) return { label: 'Low Stock', color: '#fbbf24', icon: '⚠️' };
    return { label: 'In Stock', color: '#5eead4', icon: '✓' };
  };

  const renderRewardImage = (reward, className = 'w-full h-full object-contain', containerClassName = '') => {
    if (!reward.image_url) {
      return <span className="text-3xl">🎁</span>;
    }

    const scale = reward.image_scale || 1;
    
    return (
      <div className={`w-full h-full flex items-center justify-center overflow-hidden ${containerClassName}`}>
        <img 
          src={reward.image_url} 
          alt={reward.name}
          className={className}
          style={{
            transform: `scale(${scale})`,
            transformOrigin: 'center center',
          }}
          onError={(e) => {
            e.target.style.display = 'none';
            const parent = e.target.parentElement;
            if (parent) {
              parent.innerHTML = '<span class="text-3xl">🎁</span>';
            }
          }}
        />
      </div>
    );
  };

  // ─── Helper Functions ───
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
    if (points.lifetime < 100) return 'Seedling';
    if (points.lifetime < 500) return 'Explorer';
    if (points.lifetime < 1000) return 'Scholar';
    if (points.lifetime < 5000) return 'Master';
    return 'Legend';
  };

  const getLevelDisplayName = (level) => {
    if (!level) return 'Not Assigned';
    const found = ALL_LEVELS.find(l => l.id === level);
    return found ? found.name : level.split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
  };

  const handleCardClick = (path, params = {}) => {
    if (path) {
      if (path === '/quizzes' && isSecondaryStudent) {
        navigate('/secondary-quiz');
        return;
      }
      const queryString = new URLSearchParams(params).toString();
      const fullPath = queryString ? `${path}?${queryString}` : path;
      navigate(fullPath);
    }
  };

  const handleSidebarClick = (id, path) => {
    setActiveTab(id);
    setMobileMenuOpen(false);
    if (id === 'quizzes' || id === 'hangman' || id === 'spelling-bee') {
      navigate(path);
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getBadgeColor = (badge) => {
    const colors = {
      'quiz': 'bg-teal-500',
      'hangman': 'bg-cyan-500',
      'spelling': 'bg-emerald-500',
      'points': 'bg-teal-600',
      'streak': 'bg-teal-400',
      'default': 'bg-teal-500'
    };
    return colors[badge?.type] || colors.default;
  };

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

  const formatPoints = (num) => num?.toLocaleString() || '0';

  // ─── Components ───
  const VoucherCard = ({ redemption }) => {
    const isCollected = redemption.collected;
    const voucherNumber = redemption.voucher_number || '—';
    const isCopied = copiedVoucher === voucherNumber;
    const learnerName = user?.full_name || user?.username || 'Learner';
    const isRefunding = refundingId === redemption.id;
    const status = (redemption.status || '').toLowerCase();
    const isPendingRefund = status === 'pending_refund';

    const topBarBg = isCollected
      ? (isDarkMode ? '#0f766e' : '#115e59')
      : isPendingRefund
      ? (isDarkMode ? '#134e4a' : '#0f3f3a')
      : (isDarkMode ? '#0f766e' : '#0f4f4b');

    const statusPillBg = isCollected
      ? (isDarkMode ? '#115e59' : '#134e4a')
      : isPendingRefund
      ? (isDarkMode ? '#0f3f3a' : '#0b3531')
      : (isDarkMode ? '#134e4a' : '#0f3f3a');

    if (status === 'refunded' || status === 'deleted' || status === 'refund') {
      return null;
    }

    return (
      <div 
        className={`relative overflow-hidden rounded-2xl border-2 transition-all duration-300 hover:shadow-xl
          ${isCollected ? 'border-green-500/50' : 'border-teal-500/50'}`}
        style={{
          backgroundColor: isDarkMode ? 'rgb(30 41 59)' : '#ffffff',
          borderColor: isCollected ? '#22c55e' : (isDarkMode ? 'rgb(45 212 191)' : accentColor),
          borderRadius: `${borderRadius}px`
        }}
      >
        <div className="px-4 py-2.5 flex items-center justify-between" style={{ backgroundColor: topBarBg }}>
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-white" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">Voucher</span>
          </div>
          <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full text-white" style={{ backgroundColor: statusPillBg }}>
            {isCollected ? 'Collected' : status === 'pending_refund' ? 'Refund Requested' : 'Active'}
          </span>
        </div>

        <div className="p-4 space-y-4">
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-widest text-center" style={{ color: isDarkMode ? '#94a3b8' : bodyColor }}>
              Voucher Number
            </p>
            <div
              className="flex items-center justify-between gap-2 rounded-xl px-3 py-2 border"
              style={{
                backgroundColor: isDarkMode ? 'rgb(15 23 42)' : '#f0fdfa',
                borderColor: isDarkMode ? 'rgb(51 65 85)' : '#99f6e4'
              }}
            >
              <span className="font-mono font-bold text-base tracking-[0.08em] truncate" style={{ color: isDarkMode ? '#e2e8f0' : headingColor }}>
                {voucherNumber}
              </span>
              <button
                onClick={() => copyVoucherToClipboard(voucherNumber)}
                className="p-1.5 rounded-lg transition border"
                style={{ 
                  backgroundColor: isDarkMode ? 'rgb(30 41 59)' : '#e8faf6', 
                  borderColor: isDarkMode ? 'rgb(51 65 85)' : '#99f6e4' 
                }}
              >
                {isCopied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" style={{ color: isDarkMode ? '#94a3b8' : accentColor }} />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div
              className="rounded-lg p-2.5 border"
              style={{
                backgroundColor: isDarkMode ? 'rgb(15 23 42)' : '#f8fffd',
                borderColor: isDarkMode ? 'rgb(51 65 85)' : '#ccfbf1'
              }}
            >
              <p style={{ color: isDarkMode ? '#94a3b8' : cardTextColor }}>Winner</p>
              <p className="mt-0.5 font-semibold truncate" style={{ color: isDarkMode ? '#e2e8f0' : headingColor }}>
                {learnerName}
              </p>
            </div>
            <div
              className="rounded-lg p-2.5 border"
              style={{
                backgroundColor: isDarkMode ? 'rgb(15 23 42)' : '#f8fffd',
                borderColor: isDarkMode ? 'rgb(51 65 85)' : '#ccfbf1'
              }}
            >
              <p style={{ color: isDarkMode ? '#94a3b8' : cardTextColor }}>Points Used</p>
              <p className="mt-0.5 font-semibold" style={{ color: isDarkMode ? '#5eead4' : accentColor }}>
                {redemption.points_spent}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-lg p-2.5 border" style={{
            backgroundColor: isDarkMode ? 'rgb(15 23 42)' : '#f8fffd',
            borderColor: isDarkMode ? 'rgb(51 65 85)' : '#ccfbf1'
          }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border" style={{ 
              backgroundColor: isDarkMode ? 'rgb(30 41 59)' : '#e8faf6', 
              borderColor: isDarkMode ? 'rgb(51 65 85)' : '#99f6e4' 
            }}>
              <Gift className="w-4 h-4" style={{ color: isDarkMode ? '#94a3b8' : accentColor }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate" style={{ color: isDarkMode ? '#e2e8f0' : headingColor }}>
                {redemption.reward_name || 'Gift'}
              </p>
              <p className="text-[10px]" style={{ color: isDarkMode ? '#94a3b8' : bodyColor }}>
                Redeemed {new Date(redemption.redeemed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          </div>

          {!isCollected && status !== 'pending_refund' && (
            <button
              onClick={() => requestRefund(redemption)}
              disabled={isRefunding}
              className="w-full py-2 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1 border"
              style={{ 
                borderColor: isDarkMode ? 'rgb(239 68 68)' : '#f87171', 
                color: isDarkMode ? 'rgb(248 113 113)' : '#b91c1c',
                backgroundColor: isDarkMode ? 'rgb(127 29 29 / 0.1)' : '#fef2f2'
              }}
            >
              {isRefunding ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <RefreshCw className="w-3 h-3" />
              )}
              Request Refund
            </button>
          )}
        </div>
      </div>
    );
  };

  const RefundConfirmDialog = () => {
    if (!showRefundConfirm || !refundTarget) return null;
    
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="max-w-md w-full rounded-2xl p-6 shadow-2xl border-2" style={{
          backgroundColor: isDarkMode ? 'rgb(30 41 59)' : cardBg,
          borderColor: isDarkMode ? 'rgb(45 212 191)' : accentColor
        }}>
          <h3 className="text-lg font-bold mb-2" style={{ color: isDarkMode ? '#f1f5f9' : headingColor }}>
            Request Refund
          </h3>
          <p className="text-sm mb-4" style={{ color: isDarkMode ? '#94a3b8' : bodyColor }}>
            Are you sure you want to request a refund for "<strong>{refundTarget.reward_name}</strong>"?
          </p>
          <div className="p-3 rounded-lg mb-4 border" style={{ 
            backgroundColor: isDarkMode ? 'rgb(251 191 36 / 0.1)' : `${accentColor}20`, 
            borderColor: isDarkMode ? 'rgb(251 191 36 / 0.3)' : `${accentColor}40` 
          }}>
            <p className="text-xs" style={{ color: isDarkMode ? '#fcd34d' : '#fbbf24' }}>
              ⚠️ This will return <strong>{refundTarget.points_spent}</strong> points to your balance.
              The voucher will be cancelled. An admin must approve this request.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => { setShowRefundConfirm(false); setRefundTarget(null); }}
              className="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition border-2" style={{
                borderColor: isDarkMode ? 'rgb(51 65 85)' : `${accentColor}40`,
                color: isDarkMode ? '#94a3b8' : bodyColor
              }}
            >
              Cancel
            </button>
            <button
              onClick={confirmRefundRequest}
              disabled={refundingId === refundTarget.id}
              className="flex-1 px-4 py-2 rounded-lg text-sm font-bold text-white transition shadow-md"
              style={{ backgroundColor: '#f59e0b' }}
            >
              {refundingId === refundTarget.id ? (
                <Loader2 className="w-4 h-4 animate-spin mx-auto" />
              ) : (
                'Request Refund'
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const RewardDialog = () => {
    if (!showRewardDialog || !selectedReward) return null;
    const reward = selectedReward;
    const stockStatus = getStockStatus(reward.stock_quantity);
    const isOutOfStock = reward.stock_quantity !== undefined && reward.stock_quantity <= 0;
    const canRedeem = !isOutOfStock && points.current >= reward.points_required;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={closeRewardDialog}>
        <div 
          className="relative max-w-md w-full rounded-lg overflow-hidden shadow-2xl border-2"
          style={{
            backgroundColor: isDarkMode ? 'rgb(30 41 59)' : cardBg,
            borderColor: isDarkMode ? 'rgb(51 65 85)' : `${accentColor}40`,
            borderRadius: `${borderRadius}px`
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-5 border-b" style={{
            backgroundColor: isDarkMode ? 'rgb(15 23 42)' : `${accentColor}20`,
            borderColor: isDarkMode ? 'rgb(51 65 85)' : `${accentColor}40`
          }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{
                  backgroundColor: isDarkMode ? 'rgb(45 212 191)' : accentColor
                }}>
                  <Gift className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold" style={{ color: isDarkMode ? '#f1f5f9' : headingColor }}>
                    {reward.name}
                  </h3>
                  <p className="text-xs" style={{ color: isDarkMode ? '#94a3b8' : bodyColor }}>
                    {reward.description || 'Redeem your points for this reward!'}
                  </p>
                </div>
              </div>
              <button
                onClick={closeRewardDialog}
                className="p-1.5 rounded-lg transition border" style={{
                  borderColor: isDarkMode ? 'rgb(51 65 85)' : `${accentColor}40`
                }}
              >
                <X size={18} style={{ color: isDarkMode ? '#94a3b8' : bodyColor }} />
              </button>
            </div>
          </div>

          <div className="p-5 space-y-4">
            <div className="w-full h-44 rounded-lg overflow-hidden flex items-center justify-center border relative" style={{
              backgroundColor: isDarkMode ? 'rgb(15 23 42)' : `${accentColor}20`,
              borderColor: isDarkMode ? 'rgb(51 65 85)' : `${accentColor}40`
            }}>
              {renderRewardImage(reward, 'w-full h-full object-contain p-4')}
              {reward.stock_quantity !== undefined && (
                <div className={`absolute top-3 left-3 px-2 py-0.5 rounded text-[10px] font-semibold text-white ${isOutOfStock ? 'bg-red-600' : reward.stock_quantity < 10 ? 'bg-amber-600' : 'bg-teal-600'}`} style={!isDarkMode && !isOutOfStock && reward.stock_quantity >= 10 ? { backgroundColor: accentColor } : {}}>
                  {isOutOfStock ? '❌ Out of Stock' : reward.stock_quantity < 10 ? `⚠️ ${reward.stock_quantity} left` : `✓ ${reward.stock_quantity} available`}
                </div>
              )}
            </div>

            <div className="p-4 rounded-lg border" style={{
              backgroundColor: isDarkMode ? 'rgb(15 23 42)' : `${accentColor}20`,
              borderColor: isDarkMode ? 'rgb(51 65 85)' : `${accentColor}40`
            }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center border" style={{
                    borderColor: isDarkMode ? 'rgb(51 65 85)' : `${accentColor}40`,
                    backgroundColor: isDarkMode ? 'rgb(30 41 59)' : `${accentColor}20`
                  }}>
                    <span className="text-lg">💰</span>
                  </div>
                  <div>
                    <p className="text-xs" style={{ color: isDarkMode ? '#94a3b8' : bodyColor }}>Points Required</p>
                    <p className="font-bold" style={{ color: isDarkMode ? '#f1f5f9' : headingColor }}>{reward.points_required}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs" style={{ color: isDarkMode ? '#94a3b8' : bodyColor }}>Your Balance</p>
                  <p className={`font-bold ${points.current >= reward.points_required ? 'text-teal-600' : 'text-red-600'}`} style={{ color: points.current >= reward.points_required ? (isDarkMode ? '#5eead4' : accentColor) : '#f87171' }}>
                    {points.current}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={closeRewardDialog}
                className="flex-1 px-4 py-2.5 rounded-lg font-medium text-sm transition border-2" style={{
                  borderColor: isDarkMode ? 'rgb(51 65 85)' : `${accentColor}40`,
                  color: isDarkMode ? '#94a3b8' : bodyColor
                }}
              >
                Cancel
              </button>
              <button
                disabled={!canRedeem || redeemingId === reward.id}
                onClick={() => handleRedeemItem(reward)}
                className={`flex-1 px-4 py-2.5 rounded-lg font-bold text-sm transition border-2 text-white ${!canRedeem ? 'opacity-50 cursor-not-allowed' : ''}`}
                style={canRedeem ? { backgroundColor: accentColor, borderColor: accentColor } : { backgroundColor: 'rgb(107 114 128)', borderColor: 'rgb(107 114 128)' }}
              >
                {redeemingId === reward.id ? (
                  <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                ) : isOutOfStock ? (
                  'Out of Stock'
                ) : points.current < reward.points_required ? (
                  `Need ${reward.points_required - points.current} more`
                ) : (
                  '🎉 Redeem'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ─── Render Functions ───
  const renderContent = () => {
    switch(activeTab) {
      case 'dashboard':
        return renderDashboardContent();
      case 'rewards':
        return renderRewardsContent();
      case 'badges':
        return renderBadgesContent();
      case 'history':
        return renderHistoryContent();
      case 'leaderboard':
        return renderLeaderboardContent();
      default:
        return renderDashboardContent();
    }
  };

  const renderDashboardContent = () => (
    <div style={{ 
      fontFamily: `${fontFamily}, sans-serif`,
      color: bodyColor,
      fontSize: `${fontSize}px`,
    }}>
      {/* School Level Indicator */}
      <div className="mb-4 flex justify-center">
        <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border ${
          isSecondaryStudent
            ? 'bg-purple-100 dark:bg-purple-900/30 border-purple-300 dark:border-purple-600'
            : 'bg-teal-100 dark:bg-teal-900/30 border-teal-300 dark:border-teal-600'
        }`} style={!isDarkMode ? { backgroundColor: `${accentColor}20`, borderColor: accentColor } : {}}>
          <span className="text-xs sm:text-sm font-semibold" style={!isDarkMode ? { color: headingColor } : {}}>
            {isSecondaryStudent ? '🎓 Secondary School' : '📚 Primary School'}
          </span>
          <span className="text-[10px] sm:text-xs font-medium px-2 py-0.5 rounded-full bg-white/50 dark:bg-white/10" style={!isDarkMode ? { color: darkTeal } : {}}>
            {getLevelDisplayName(userLevel)}
          </span>
        </div>
      </div>

      {/* Daily Reward Banner */}
      {!dailyRewardClaimed && (
        <div className={`mb-6 rounded-2xl p-4 border ${
          isDarkMode 
            ? 'bg-teal-900/30 backdrop-blur-sm border-teal-400/30' 
            : 'bg-gradient-to-r from-teal-50 to-cyan-50 border-teal-300/40 shadow-sm'
        }`} style={!isDarkMode ? { backgroundColor: cardBg, borderColor: `${accentColor}60`, borderRadius: `${borderRadius}px` } : {}}>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                isDarkMode ? 'bg-teal-500/20' : 'bg-teal-100'
              }`} style={!isDarkMode ? { backgroundColor: `${accentColor}30` } : {}}>
                <span className="text-xl sm:text-2xl">🎁</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className={`font-bold text-sm sm:text-base ${isDarkMode ? 'text-teal-300' : 'text-teal-800'}`} style={!isDarkMode ? { color: headingColor } : {}}>
                  Daily Bonus Waiting!
                </h3>
                <p className={`text-xs ${isDarkMode ? 'text-teal-300/70' : 'text-teal-700/70'}`} style={!isDarkMode ? { color: bodyColor } : {}}>
                  Keep your streak alive and grab <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-teal-700'}`} style={!isDarkMode ? { color: accentColor } : {}}>
                    {50 + Math.floor(streak / 5) * 10} points
                  </span> now.
                </p>
              </div>
            </div>
            <button
              onClick={claimDailyReward}
              className={`w-full sm:w-auto px-5 py-2 rounded-xl text-xs font-black tracking-wider uppercase transition-all shadow-sm ${
                isDarkMode 
                  ? 'bg-gradient-to-r from-teal-400 to-cyan-400 text-teal-900 hover:shadow-md hover:scale-105'
                  : 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white hover:shadow-md hover:scale-105'
              }`}
              style={!isDarkMode ? { backgroundColor: accentColor, backgroundImage: 'none' } : {}}
            >
              Claim Reward
            </button>
          </div>
        </div>
      )}

      {/* Select a Game Message */}
      <div className="text-center mb-6">
        <h2 
          className={`font-bold text-lg sm:text-xl ${isDarkMode ? 'text-white' : 'text-[#19475B]'}`}
          style={{ fontSize: !isDarkMode ? `${Math.min(headingSize, 24)}px` : '18px', color: !isDarkMode ? headingColor : undefined }}
        >
          Select a Game
        </h2>
        <p 
          className={`mt-1 text-sm ${isDarkMode ? 'text-slate-400' : 'text-[#19475B]/70'}`}
          style={{ fontSize: '13px', color: !isDarkMode ? accentColor : undefined }}
        >
          Choose a game to start learning and earning points!
        </p>
        {isSecondaryStudent && (
          <p className="text-xs text-purple-600 dark:text-purple-400 mt-1" style={!isDarkMode ? { color: accentColor } : {}}>
            🎓 You're a secondary student - quizzes will open in secondary mode
          </p>
        )}
      </div>

      {/* Quiz Cards Grid - Mobile Responsive */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-4xl mx-auto">
        {quizGames.map((game) => {
          const isHovered = hoveredCardId === game.id;
          
          return (
            <div
              key={game.id}
              className="relative cursor-pointer transition-all duration-300"
              style={{ height: '170px', minHeight: '150px' }}
              onMouseEnter={() => setHoveredCardId(game.id)}
              onMouseLeave={() => setHoveredCardId(null)}
              onClick={() => handleCardClick(game.path, game.params)}
            >
              <div 
                className={`w-full h-full rounded-2xl p-4 flex flex-col border-2 shadow-lg overflow-hidden transition-all duration-300 ${
                  isHovered 
                    ? 'shadow-xl scale-105' 
                    : 'shadow-lg'
                }`}
                style={{
                  backgroundColor: isHovered ? '#0a4f4b' : '#075351',
                  borderColor: isHovered ? '#0f6b66' : '#0a4f4b',
                  borderRadius: `${borderRadius}px`,
                }}
              >
                <div className="flex-1 flex items-center justify-center min-h-0 py-0">
                  <img 
                    src={game.image}
                    alt={game.title}
                    className={`w-auto h-full max-h-[100px] sm:max-h-[120px] object-contain transition-all duration-300 ${
                      isHovered ? 'scale-110' : 'hover:scale-105'
                    } drop-shadow-lg`}
                  />
                </div>
                <div className={`flex flex-wrap justify-between items-center mt-0 flex-shrink-0 transition-all duration-300 gap-1 ${
                  isHovered ? 'opacity-100' : ''
                }`}>
                  <div className={`rounded-full px-2 py-0.5 inline-block transition-all duration-300 ${
                    isHovered ? 'bg-white/30' : 'bg-white/20'
                  }`}>
                    <span className={`text-white text-[8px] sm:text-[10px] font-semibold transition-all duration-300 ${
                      isHovered ? 'text-white' : ''
                    }`}>
                      {isSecondaryStudent ? 'Browse Secondary' : 'Play Now'}
                    </span>
                  </div>
                  <div className={`text-white font-black text-xs sm:text-sm tracking-wider transition-all duration-300 ${
                    isHovered ? 'text-white' : ''
                  }`}>
                    {game.title}
                  </div>
                  <div className={`text-yellow-300 font-bold text-xs transition-all duration-300 ${
                    isHovered ? 'text-yellow-200' : ''
                  }`}>
                    +50 pts
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderRewardsContent = () => (
    <div style={{ fontFamily: `${fontFamily}, "Segoe UI", Calibri, "Trebuchet MS", sans-serif`, color: bodyColor }}>
      {/* Quick Stats - Mobile Responsive */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-4">
        <div className="rounded-lg p-2 sm:p-3 text-center border" style={!isDarkMode ? { backgroundColor: '#0f5f5a', borderColor: '#0a4a45', borderRadius: `${borderRadius}px` } : { backgroundColor: 'rgb(30 41 59)', borderColor: 'rgb(51 65 85)' }}>
          <p className="text-[8px] sm:text-[10px] font-medium uppercase tracking-wider" style={!isDarkMode ? { color: '#bcefe6' } : { color: '#94a3b8' }}>Points</p>
          <p className="text-base sm:text-lg font-bold" style={!isDarkMode ? { color: '#f7fffd' } : { color: '#f1f5f9' }}>{formatPoints(points.current)}</p>
        </div>
        <div className="rounded-lg p-2 sm:p-3 text-center border" style={!isDarkMode ? { backgroundColor: '#0d5652', borderColor: '#0a4a45', borderRadius: `${borderRadius}px` } : { backgroundColor: 'rgb(30 41 59)', borderColor: 'rgb(51 65 85)' }}>
          <p className="text-[8px] sm:text-[10px] font-medium uppercase tracking-wider" style={!isDarkMode ? { color: '#bcefe6' } : { color: '#94a3b8' }}>Available</p>
          <p className="text-base sm:text-lg font-bold" style={!isDarkMode ? { color: '#f7fffd' } : { color: '#f1f5f9' }}>{rewards.filter(r => r.stock_quantity === undefined || r.stock_quantity > 0).length}</p>
        </div>
        <div className="rounded-lg p-2 sm:p-3 text-center border" style={!isDarkMode ? { backgroundColor: '#0b4f4c', borderColor: '#093f3b', borderRadius: `${borderRadius}px` } : { backgroundColor: 'rgb(30 41 59)', borderColor: 'rgb(51 65 85)' }}>
          <p className="text-[8px] sm:text-[10px] font-medium uppercase tracking-wider" style={!isDarkMode ? { color: '#bcefe6' } : { color: '#94a3b8' }}>Total Rewards</p>
          <p className="text-base sm:text-lg font-bold" style={!isDarkMode ? { color: '#f7fffd' } : { color: '#f1f5f9' }}>{rewards.length}</p>
        </div>
        <div className="rounded-lg p-2 sm:p-3 text-center border" style={!isDarkMode ? { backgroundColor: '#094845', borderColor: '#073a37', borderRadius: `${borderRadius}px` } : { backgroundColor: 'rgb(30 41 59)', borderColor: 'rgb(51 65 85)' }}>
          <p className="text-[8px] sm:text-[10px] font-medium uppercase tracking-wider" style={!isDarkMode ? { color: '#bcefe6' } : { color: '#94a3b8' }}>Vouchers</p>
          <p className="text-base sm:text-lg font-bold" style={!isDarkMode ? { color: '#f7fffd' } : { color: '#f1f5f9' }}>{redemptions.length}</p>
        </div>
      </div>

      {/* Tabs - Mobile Responsive */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveStoreTab('store')}
          className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all duration-200 flex items-center gap-1 sm:gap-2 border-2 whitespace-nowrap ${
            activeStoreTab === 'store'
              ? 'text-white'
              : isDarkMode 
                ? 'bg-[#113b39] text-[#b7ece4] border-[#1f6d68] hover:bg-[#17504d] hover:text-[#e6fffb]' 
                : 'bg-[#e6f7f4] text-[#0d5b57] border-[#8ad7cb] hover:bg-[#d3f1eb]'
          }`}
          style={activeStoreTab === 'store' ? {
            backgroundColor: isDarkMode ? '#0f766e' : '#0b5f5a',
            borderColor: isDarkMode ? '#14b8a6' : '#0b5f5a',
            color: '#f7fbff',
            boxShadow: '0 8px 18px -12px rgba(11,95,90,0.75)'
          } : {}}
        >
          <Gift className="w-3 h-3 sm:w-4 sm:h-4" />
          Store
          <span
            className="text-[8px] sm:text-[10px] px-1.5 py-0.5 rounded-full"
            style={activeStoreTab === 'store'
              ? { backgroundColor: 'rgba(255,255,255,0.2)', color: '#ffffff' }
              : isDarkMode
                ? { backgroundColor: '#0b2f2d', color: '#8ee9dc' }
                : { backgroundColor: '#cceee7', color: '#0f4f4b' }}
          >
            {filteredRewards.length}
          </span>
        </button>
        <button
          onClick={() => { setActiveStoreTab('vouchers'); fetchRedemptions(); }}
          className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all duration-200 flex items-center gap-1 sm:gap-2 border-2 whitespace-nowrap ${
            activeStoreTab === 'vouchers'
              ? 'text-white'
              : isDarkMode 
                ? 'bg-[#113b39] text-[#b7ece4] border-[#1f6d68] hover:bg-[#17504d] hover:text-[#e6fffb]' 
                : 'bg-[#e6f7f4] text-[#0d5b57] border-[#8ad7cb] hover:bg-[#d3f1eb]'
          }`}
          style={activeStoreTab === 'vouchers' ? {
            backgroundColor: isDarkMode ? '#0f766e' : '#0b5f5a',
            borderColor: isDarkMode ? '#14b8a6' : '#0b5f5a',
            color: '#f7fbff',
            boxShadow: '0 8px 18px -12px rgba(11,95,90,0.75)'
          } : {}}
        >
          <Tag className="w-3 h-3 sm:w-4 sm:h-4" />
          My Vouchers
          {redemptions.length > 0 && (
            <span
              className="text-[8px] sm:text-[10px] px-1.5 py-0.5 rounded-full"
              style={activeStoreTab === 'vouchers'
                ? { backgroundColor: 'rgba(255,255,255,0.2)', color: '#ffffff' }
                : isDarkMode
                  ? { backgroundColor: '#0b2f2d', color: '#8ee9dc' }
                  : { backgroundColor: '#cceee7', color: '#0f4f4b' }}
            >
              {redemptions.length}
            </span>
          )}
        </button>
      </div>

      {/* Vouchers Tab */}
      {activeStoreTab === 'vouchers' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 rounded-lg border" style={!isDarkMode ? { backgroundColor: `${cardBg}60`, borderColor: `${accentColor}30`, borderRadius: `${borderRadius}px` } : { backgroundColor: 'rgb(30 41 59)', borderColor: 'rgb(51 65 85)' }}>
            <div>
              <h2 className="font-bold flex items-center gap-2 text-sm sm:text-base" style={!isDarkMode ? { color: headingColor } : { color: '#f1f5f9' }}>
                <Award className="w-4 h-4 sm:w-5 sm:h-5" style={!isDarkMode ? { color: accentColor } : {}} />
                My Vouchers
              </h2>
              <p className="text-xs" style={!isDarkMode ? { color: bodyColor } : { color: '#94a3b8' }}>
                Show your voucher to collect your gift
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="px-2 py-0.5 rounded-full border" style={!isDarkMode ? { backgroundColor: '#e8f7f5', color: '#0f4f4b', borderColor: '#7dd3c7' } : { backgroundColor: 'rgb(15 118 110 / 0.2)', color: '#99f6e4', borderColor: '#0f766e' }}>
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500 mr-1" />
                {redemptions.filter(r => !r.collected && r.status !== 'pending_refund').length} pending
              </span>
              <span className="px-2 py-0.5 rounded-full border" style={!isDarkMode ? { backgroundColor: '#dff4f1', color: '#0b3d3a', borderColor: '#5eead4' } : { backgroundColor: 'rgb(15 118 110 / 0.25)', color: '#ccfbf1', borderColor: '#14b8a6' }}>
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 mr-1" />
                {redemptions.filter(r => r.collected).length} collected
              </span>
            </div>
          </div>

          {loadingRedemptions ? (
            <div className="p-12 text-center rounded-lg border" style={!isDarkMode ? { backgroundColor: `${cardBg}40`, borderColor: `${accentColor}30`, borderRadius: `${borderRadius}px` } : { backgroundColor: 'rgb(30 41 59)', borderColor: 'rgb(51 65 85)' }}>
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" style={!isDarkMode ? { color: accentColor } : { color: '#5eead4' }} />
              <p className="text-sm" style={!isDarkMode ? { color: bodyColor } : { color: '#94a3b8' }}>Loading vouchers...</p>
            </div>
          ) : redemptions.length === 0 ? (
            <div className="text-center py-16 rounded-lg border" style={!isDarkMode ? { backgroundColor: `${cardBg}40`, borderColor: `${accentColor}30`, borderRadius: `${borderRadius}px` } : { backgroundColor: 'rgb(30 41 59)', borderColor: 'rgb(51 65 85)' }}>
              <div className="inline-block p-4 rounded-lg mb-4 border" style={!isDarkMode ? { backgroundColor: `${accentColor}20`, borderColor: accentColor } : { backgroundColor: 'rgb(45 212 191 / 0.1)', borderColor: 'rgb(45 212 191)' }}>
                <Tag className="w-10 h-10" style={!isDarkMode ? { color: accentColor } : { color: '#5eead4' }} />
              </div>
              <p className="text-lg font-semibold" style={!isDarkMode ? { color: headingColor } : { color: '#f1f5f9' }}>No vouchers yet</p>
              <p className="text-sm mt-1" style={!isDarkMode ? { color: bodyColor } : { color: '#94a3b8' }}>
                Visit the Store and redeem your points!
              </p>
              <button
                onClick={() => setActiveStoreTab('store')}
                className="mt-4 px-6 py-2 rounded-lg text-white font-medium transition border-2"
                style={{ backgroundColor: accentColor, borderColor: accentColor }}
              >
                <Gift className="w-4 h-4 inline mr-2" />
                Browse Store
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {redemptions.map((r) => (
                <VoucherCard key={r.id} redemption={r} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Store Tab */}
      {activeStoreTab === 'store' && (
        <>
          {/* Search - Mobile Responsive */}
          <div className="mb-4">
            <form onSubmit={handleSearch} className="flex gap-2 max-w-md">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full px-3 py-2 pl-8 sm:pl-9 pr-7 sm:pr-8 rounded-lg text-sm focus:outline-none focus:ring-2 transition border-2"
                  style={!isDarkMode ? { 
                    backgroundColor: `${cardBg}60`, 
                    borderColor: `${accentColor}40`, 
                    color: bodyColor,
                    borderRadius: `${borderRadius}px`
                  } : { 
                    backgroundColor: 'rgb(30 41 59)', 
                    borderColor: 'rgb(51 65 85)', 
                    color: '#e2e8f0' 
                  }}
                  placeholder="Search rewards..."
                />
                <Search className="absolute left-2 sm:left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4" style={!isDarkMode ? { color: bodyColor } : { color: '#64748b' }} />
                {searchInput && (
                  <button
                    type="button"
                    onClick={() => { setSearchInput(''); setSearchTerm(''); }}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs transition-colors"
                    style={!isDarkMode ? { color: bodyColor } : { color: '#64748b' }}
                  >
                    ✕
                  </button>
                )}
              </div>
              <button
                type="submit"
                className="px-4 sm:px-5 py-2 rounded-lg text-xs sm:text-sm font-medium text-white transition border-2"
                style={{ backgroundColor: accentColor, borderColor: accentColor }}
              >
                Search
              </button>
            </form>
            {searchTerm && (
              <p className="text-xs mt-1" style={!isDarkMode ? { color: accentColor } : { color: '#5eead4' }}>
                Showing results for: <span className="font-semibold">"{searchTerm}"</span> ({filteredRewards.length} found)
              </p>
            )}
          </div>

          {/* Rewards Grid - Mobile Responsive */}
          <div
            className="rounded-[26px] border-2 overflow-hidden border-slate-200 dark:border-slate-700 bg-white/40 dark:bg-slate-800 shadow-[0_20px_45px_-28px_rgba(15,23,42,0.45)]"
            style={!isDarkMode ? { backgroundColor: 'rgba(255,255,255,0.72)', borderColor: `${accentColor}30` } : { backgroundColor: 'rgb(30 41 59 / 0.92)' }}
          >
            {/* Header Section - Mobile Responsive */}
            <div
              className="p-3 sm:p-4 border-b-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
              style={!isDarkMode ? { backgroundColor: `${accentColor}18`, borderColor: `${accentColor}30` } : { backgroundColor: 'rgb(15 23 42 / 0.9)' }}
            >
              <div>
                <h2
                  className="font-bold flex items-center gap-2 text-sm sm:text-base"
                  style={{ color: isDarkMode ? '#f1f5f9' : headingColor }}
                >
                  <Gift className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: isDarkMode ? '#5eead4' : accentColor }} />
                  Reward Collection
                </h2>
                <p
                  className="text-[10px] sm:text-xs"
                  style={{ color: isDarkMode ? '#99f6e4' : '#0f4f4b' }}
                >
                  Browse, compare, and redeem your rewards
                </p>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                  className="p-2 rounded-lg transition border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                  style={!isDarkMode ? { borderColor: `${accentColor}40` } : {}}
                >
                  {viewMode === 'grid' ? '📋' : '📐'}
                </button>

                <span
                  className="px-2 sm:px-3 py-1 rounded-full text-[8px] sm:text-[10px] font-semibold border-2"
                  style={{
                    backgroundColor: isDarkMode ? 'rgba(45,212,191,0.1)' : `${accentColor}20`,
                    color: isDarkMode ? '#e2e8f0' : headingColor,
                    borderColor: isDarkMode ? 'rgba(45,212,191,0.3)' : accentColor,
                  }}
                >
                  {filteredRewards.length} items
                </span>
              </div>
            </div>

            {/* Main Content Body */}
            <div className="p-3 sm:p-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
              {loadingRewards ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                  {[...Array(8)].map((_, i) => (
                    <div
                      key={i}
                      className="rounded-2xl overflow-hidden animate-pulse aspect-[4/5] bg-slate-200 dark:bg-slate-700"
                      style={!isDarkMode ? { backgroundColor: `${accentColor}20` } : {}}
                    >
                      <div className="w-full h-full flex items-center justify-center">
                        <div
                          className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-slate-300 dark:bg-slate-600"
                          style={!isDarkMode && bodyColor ? { backgroundColor: bodyColor } : {}}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredRewards.length === 0 ? (
                <div className="text-center py-12 sm:py-16">
                  <div className="text-4xl sm:text-5xl mb-4">🎁</div>
                  <p
                    className="text-base sm:text-lg font-semibold"
                    style={{ color: isDarkMode ? '#f1f5f9' : headingColor }}
                  >
                    {searchTerm ? 'No rewards found' : 'No rewards available'}
                  </p>
                  <p
                    className="text-xs sm:text-sm mt-2"
                    style={{ color: isDarkMode ? '#94a3b8' : bodyColor }}
                  >
                    {searchTerm ? 'Try searching for something else' : 'Check back later for exciting rewards!'}
                  </p>
                </div>
              ) : (
                <div className={`grid ${viewMode === 'grid' ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4' : 'grid-cols-1'} gap-3 sm:gap-4`}>
                  {filteredRewards.map((reward) => {
                    const stockStatus = getStockStatus(reward.stock_quantity);
                    const isOutOfStock = reward.stock_quantity !== undefined && reward.stock_quantity <= 0;

                    return (
                      <div
                        key={reward.id}
                        onClick={() => !isOutOfStock && openRewardDialog(reward)}
                        className={`group rounded-2xl overflow-hidden transition-all duration-300 border bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 ${
                          isOutOfStock ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-lg hover:-translate-y-1'
                        }`}
                        style={!isDarkMode ? { 
                          backgroundColor: 'rgba(255,255,255,0.94)', 
                          borderColor: `${accentColor}40`,
                        } : {}}
                      >
                        <div className="p-3 sm:p-3.5 flex flex-col h-full">
                          <div
                            className="w-full aspect-square rounded-xl overflow-hidden flex items-center justify-center mb-2 sm:mb-3 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                            style={!isDarkMode ? { backgroundColor: `${accentColor}16`, borderColor: `${accentColor}30` } : {}}
                          >
                            {renderRewardImage(reward, 'w-full h-full object-contain p-2')}
                          </div>

                          <p
                            className="text-xs sm:text-sm font-bold text-center leading-tight min-h-[32px] sm:min-h-[36px]"
                            style={{ color: isDarkMode ? '#e2e8f0' : '#0f172a' }}
                          >
                            {reward.name}
                          </p>

                          <div
                            className="mt-2 inline-flex items-center justify-center gap-1 self-center rounded-full px-2 sm:px-3 py-1 text-[10px] sm:text-xs font-semibold"
                            style={{
                              backgroundColor: isDarkMode ? 'rgb(45 212 191 / 0.16)' : `${accentColor}18`,
                              color: isDarkMode ? '#5eead4' : '#0f766e'
                            }}
                          >
                            {reward.points_required} points
                          </div>

                          {reward.stock_quantity !== undefined && (
                            <div className="text-[10px] sm:text-[11px] font-medium mt-2 text-center" style={{ color: stockStatus.color }}>
                              {stockStatus.label}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Dialogs */}
      <RewardDialog />
      <RefundConfirmDialog />
    </div>
  );

  const renderBadgesContent = () => (
    <div className={`rounded-2xl p-4 sm:p-8 border ${
      isDarkMode 
        ? 'bg-slate-800/50 backdrop-blur-sm border-teal-400/30' 
        : 'bg-white shadow-sm border-teal-300/40'
    }`} style={!isDarkMode ? { backgroundColor: cardBg, borderColor: `${accentColor}40`, borderRadius: `${borderRadius}px`, color: bodyColor, fontFamily: `${fontFamily}, sans-serif` } : {}}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-2">
        <div>
          <h2 className={`text-xl sm:text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-[#19475B]'}`} style={!isDarkMode ? { color: headingColor } : {}}>My Badges</h2>
          <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-[#19475B]/70'}`} style={!isDarkMode ? { color: bodyColor } : {}}>
            {badges.length} badges earned
          </p>
        </div>
        <span className="text-3xl sm:text-4xl">🏅</span>
      </div>
      
      {loadingBadges ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" style={!isDarkMode ? { borderColor: accentColor, borderTopColor: 'transparent' } : {}}></div>
        </div>
      ) : badges.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🎯</div>
          <p className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-[#19475B]'}`} style={!isDarkMode ? { color: headingColor } : {}}>
            No Badges Yet
          </p>
          <p className={`text-sm mt-2 ${isDarkMode ? 'text-slate-400' : 'text-[#19475B]/70'}`} style={!isDarkMode ? { color: bodyColor } : {}}>
            Complete activities and challenges to earn badges!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
          {badges.map((badge) => (
            <div 
              key={badge.id}
              className={`p-3 sm:p-4 rounded-xl border text-center transition-all hover:shadow-md ${
                isDarkMode 
                  ? 'bg-slate-700/50 border-teal-400/20 hover:border-teal-400/50' 
                  : 'bg-white border-teal-200/50 hover:border-teal-400/60'
              }`}
              style={!isDarkMode ? { backgroundColor: cardBg, borderColor: `${accentColor}40` } : {}}
            >
              <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-2xl sm:text-3xl mx-auto mb-2 ${
                getBadgeColor(badge)
              } text-white shadow-md`}>
                {getBadgeIcon(badge)}
              </div>
              <h4 className={`font-bold text-xs sm:text-sm ${isDarkMode ? 'text-white' : 'text-[#19475B]'}`} style={!isDarkMode ? { color: headingColor } : {}}>
                {badge.name}
              </h4>
              {badge.description && (
                <p className={`text-[8px] sm:text-[10px] mt-1 ${isDarkMode ? 'text-slate-400' : 'text-[#19475B]/70'}`} style={!isDarkMode ? { color: bodyColor } : {}}>
                  {badge.description}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderHistoryContent = () => (
    <div className={`rounded-2xl p-4 sm:p-8 border text-center ${
      isDarkMode 
        ? 'bg-slate-800/50 backdrop-blur-sm border-teal-400/30' 
        : 'bg-white shadow-sm border-teal-300/40'
    }`} style={!isDarkMode ? { backgroundColor: cardBg, borderColor: `${accentColor}40`, borderRadius: `${borderRadius}px`, color: bodyColor, fontFamily: `${fontFamily}, sans-serif` } : {}}>
      <div className="text-5xl sm:text-6xl mb-4">📊</div>
      <h2 className={`text-xl sm:text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-[#19475B]'}`} style={!isDarkMode ? { color: headingColor } : {}}>Quiz History</h2>
      <p className={`text-sm mb-6 ${isDarkMode ? 'text-slate-400' : 'text-[#19475B]/70'}`} style={!isDarkMode ? { color: bodyColor } : {}}>
        View your past quiz performances and track your progress
      </p>
      <button
        onClick={() => navigate('/quiz-history')}
        className="px-5 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-xl font-bold hover:shadow-lg transition-all text-sm sm:text-base"
        style={!isDarkMode ? { backgroundColor: accentColor, backgroundImage: 'none' } : {}}
      >
        View History
      </button>
    </div>
  );

  const renderLeaderboardContent = () => (
    <div className={`rounded-2xl border overflow-hidden ${
      isDarkMode 
        ? 'bg-slate-800/50 backdrop-blur-sm border-teal-400/30' 
        : 'bg-white shadow-sm border-teal-300/40'
    }`} style={!isDarkMode ? { backgroundColor: cardBg, borderColor: `${accentColor}40`, borderRadius: `${borderRadius}px`, color: bodyColor, fontFamily: `${fontFamily}, sans-serif` } : {}}>
      <div className={`p-4 sm:p-5 border-b ${isDarkMode ? 'border-teal-400/20' : 'border-teal-200/50'}`} style={!isDarkMode ? { borderColor: `${accentColor}40` } : {}}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <h2 className={`text-lg sm:text-xl font-bold ${isDarkMode ? 'text-white' : 'text-[#19475B]'}`} style={!isDarkMode ? { color: headingColor } : {}}>🏆 Leaderboard</h2>
            <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-[#19475B]/70'}`} style={!isDarkMode ? { color: bodyColor } : {}}>
              Top performers ranked by lifetime points
            </p>
          </div>
          <button onClick={fetchLeaderboard}
            className={`p-2 rounded-lg transition ${isDarkMode ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-gray-100 text-gray-500'}`}
            style={!isDarkMode ? { color: bodyColor } : {}}>
            🔄
          </button>
        </div>
      </div>

      {loadingLeaderboard ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" style={!isDarkMode ? { borderColor: accentColor, borderTopColor: 'transparent' } : {}}></div>
        </div>
      ) : leaderboard.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-5xl mb-3">🏆</div>
          <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-700'}`} style={!isDarkMode ? { color: headingColor } : {}}>No rankings yet</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {leaderboard.slice(0, 20).map((learner, idx) => {
            const isMe = learner.id === user?.id || learner.username === user?.username;
            const rankEmoji = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : null;
            return (
              <div key={learner.id || idx}
                className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-3 transition ${
                  isMe 
                    ? isDarkMode ? 'bg-teal-900/30' : 'bg-teal-50' 
                    : isDarkMode ? 'hover:bg-slate-700/30' : 'hover:bg-gray-50'
                }`}
                style={!isDarkMode ? { backgroundColor: isMe ? `${accentColor}20` : undefined } : {}}
              >
                <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-xs sm:text-sm ${
                  idx < 3 
                    ? 'bg-amber-100 text-amber-700' 
                    : isDarkMode ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-gray-600'
                }`}>
                  {rankEmoji || learner.rank || idx + 1}
                </div>

                <div className="flex-1 min-w-0">
                  <p className={`text-xs sm:text-sm font-semibold truncate ${isMe ? 'text-teal-600' : isDarkMode ? 'text-white' : 'text-gray-800'}`} style={!isDarkMode ? { color: isMe ? accentColor : bodyColor } : {}}>
                    {learner.full_name || learner.username}
                    {isMe && <span className="ml-1.5 text-[10px] sm:text-xs text-teal-500" style={!isDarkMode ? { color: accentColor } : {}}>(You)</span>}
                  </p>
                  <p className={`text-[10px] sm:text-xs ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`} style={!isDarkMode ? { color: bodyColor } : {}}>
                    {learner.class_level || 'No class'}
                    {learner.district && ` • ${learner.district}`}
                  </p>
                </div>

                <div className="text-right flex-shrink-0">
                  <p className={`text-xs sm:text-sm font-black ${isDarkMode ? 'text-teal-400' : 'text-teal-600'}`} style={!isDarkMode ? { color: accentColor } : {}}>
                    {(learner.lifetime_points || 0).toLocaleString()}
                  </p>
                  <p className={`text-[8px] sm:text-[10px] ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`} style={!isDarkMode ? { color: bodyColor } : {}}>points</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  // ─── Main Render ───
  return (
    <div
      className="min-h-screen w-full max-w-full flex transition-all duration-500"
      style={{
        ...getPageStyles('dashboard'),
        backgroundColor: pageBackgroundColor,
        color: pageTextColor,
        fontFamily: `${fontFamily || 'Inter'}, sans-serif`,
      }}
    >
      {isDarkMode && <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 -z-10" />}

      {/* Mobile Menu Toggle */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className={`lg:hidden fixed top-3 left-3 z-50 p-2 rounded-xl ${
          isDarkMode 
            ? 'bg-slate-800 border border-teal-400/30 text-white' 
            : 'bg-white border border-teal-300/40 text-[#19475B]'
        } shadow-lg`}
        style={!isDarkMode ? { backgroundColor: cardBg, borderColor: `${accentColor}40`, color: headingColor } : {}}
      >
        <span className="text-xl">{mobileMenuOpen ? '✕' : '☰'}</span>
      </button>

      {/* Sidebar - Mobile Responsive */}
      <aside className={`
        fixed lg:sticky top-0 h-screen
        w-64 sm:w-56 lg:w-60
        transition-all duration-300 transform z-40
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        border-r border-teal-200/60
        flex flex-col shadow-xl overflow-hidden
      `} style={!isDarkMode ? { background: `linear-gradient(135deg, ${sidebarSurface}, rgba(214, 242, 221, 0.95))`, borderColor: `${accentColor}60` } : {}}>
        <div className="px-3 py-3 border-b flex-shrink-0" style={{ backgroundColor: headerBg || '#003B46', borderColor: `${accentColor}60` }}>
          <div className="flex items-center gap-2.5">
            <img 
              src="/logo.png" 
              alt="Logo" 
              className="w-8 h-8 object-contain brightness-0 invert"
              onError={(e) => {
                e.target.src = 'https://via.placeholder.com/32x32?text=LE';
              }}
            />
            <div>
              <h1 className="text-base font-black tracking-tighter leading-tight text-white">
                LearnEarn
              </h1>
              <p className="text-[8px] font-semibold uppercase tracking-wider leading-tight" style={{ color: '#ccfbf1' }}>
                Learning Platform
              </p>
            </div>
          </div>
        </div>

        <div className="px-3 py-2.5 border-b flex-shrink-0 bg-white/50 backdrop-blur-sm" style={!isDarkMode ? { backgroundColor: `${cardBg}80`, borderColor: `${accentColor}60` } : {}}>
          <div className="flex items-center gap-2.5">
            <img 
              src={selectedAvatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user?.username || 'player'}`} 
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border-2 object-cover flex-shrink-0"
              alt="Avatar"
              style={!isDarkMode ? { borderColor: accentColor } : {}}
            />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate" style={!isDarkMode ? { color: sidebarTextColor } : {}}>
                {user?.fullName?.split(' ')[0] || 'Learner'}
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] truncate" style={!isDarkMode ? { color: sidebarTextColor } : {}}>
                  {getRankTitle()}
                </span>
                <span className="text-[10px] font-bold" style={!isDarkMode ? { color: accentColor } : {}}>
                  {points.current} pts
                </span>
              </div>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-2 space-y-0.5 bg-white/30 backdrop-blur-sm" style={!isDarkMode ? { backgroundColor: `${cardBg}30` } : {}}>
          {SIDEBAR_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            const navTextColor = isDarkMode ? '#f7fbff' : (isActive ? '#f7fbff' : '#075351');

            return (
              <button
                key={item.id}
                onClick={() => handleSidebarClick(item.id, item.path)}
                className={`
                  w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-200 text-sm border border-transparent
                  ${isActive
                    ? 'text-white shadow-md shadow-teal-700/20'
                    : 'hover:border-[#0f766e]/30 hover:translate-x-0.5'
                  }
                `}
                style={
                  isActive
                    ? { backgroundColor: accentColor, color: '#f7fbff', borderColor: `${accentColor}60` }
                    : !isDarkMode
                      ? { fontFamily: `${fontFamily}, sans-serif`, color: navTextColor }
                      : { color: navTextColor }
                }
              >
                <span
                  className="text-lg flex-shrink-0 transition-colors duration-200"
                  style={{ color: navTextColor }}
                >
                  {item.icon}
                </span>
                <span
                  className="font-medium text-xs transition-colors duration-200"
                  style={{ fontFamily: `${fontFamily}, sans-serif`, color: navTextColor }}
                >
                  {item.label}
                </span>
                {isActive && (
                  <div className="ml-auto w-1 h-6 rounded-full bg-white shadow-lg shadow-white/50 flex-shrink-0"></div>
                )}
              </button>
            );
          })}
        </nav>

        <div className="px-3 py-2.5 border-t flex-shrink-0 bg-white/50 backdrop-blur-sm" style={!isDarkMode ? { backgroundColor: `${cardBg}80`, borderColor: `${accentColor}60` } : {}}>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-1.5 rounded-lg transition-all flex-shrink-0 border"
              style={!isDarkMode ? { backgroundColor: `${accentColor}20`, color: accentColor, borderColor: `${accentColor}40` } : {}}
            >
              <span className="text-sm">{isDarkMode ? '☀️' : '🌙'}</span>
            </button>
            <button
              onClick={handleLogout}
              className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all border"
              style={!isDarkMode ? { backgroundColor: 'rgba(135, 206, 235, 0.12)', color: '#cbd5e1', borderColor: '#87CEEB' } : {}}
            >
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <main
        className="flex-1 min-w-0 overflow-x-hidden"
        style={!isDarkMode ? {
          fontFamily: `${fontFamily}, sans-serif`,
          background: '#ccf5eb'
        } : {}}
      >
        {/* Header - Mobile Responsive */}
        <div className="sticky top-0 z-20 border-b-4 border-black/20 shadow-lg"
          style={{ backgroundColor: headerBg }}
        >
          <div className="px-3 sm:px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <div className="min-w-0 flex-1">
                <h2 className="font-bold text-sm sm:text-lg truncate" style={{ color: iceWhite }}>
                  {getGreeting()}, {user?.fullName?.split(' ')[0] || 'Learner'}! 👋
                </h2>
                <p className="text-[10px] sm:text-xs truncate" style={{ color: iceWhite }}>
                  {formatDate(currentDateTime)} • {formatTime(currentDateTime)}
                </p>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                <div className="hidden xs:flex items-center gap-1 px-2 sm:px-3 py-1 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20">
                  <span className="text-[10px] sm:text-xs" style={{ color: iceWhite }}>⭐</span>
                  <span className="font-bold text-xs sm:text-sm" style={{ color: iceWhite }}>
                    {points.current} pts
                  </span>
                </div>
                <button
                  onClick={() => setShowAvatarModal(true)}
                  className="flex items-center gap-2 flex-shrink-0"
                >
                  <img 
                    src={selectedAvatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user?.username || 'player'}`} 
                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border-2 border-white/50 object-cover"
                    alt="Avatar"
                  />
                </button>
              </div>
            </div>

            {/* Stats Grid - Mobile Responsive */}
            <div className="grid grid-cols-4 gap-1 sm:gap-2">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl px-2 sm:px-3 py-1.5 sm:py-2 text-center border border-white/10">
                <p className="text-[8px] sm:text-[10px] font-medium uppercase tracking-wider" style={{ color: iceWhite }}>Lifetime</p>
                <p className="font-bold text-xs sm:text-base" style={{ color: iceWhite }}>{points.lifetime}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl px-2 sm:px-3 py-1.5 sm:py-2 text-center border border-white/10">
                <p className="text-[8px] sm:text-[10px] font-medium uppercase tracking-wider" style={{ color: iceWhite }}>Streak</p>
                <p className="font-bold text-xs sm:text-base" style={{ color: iceWhite }}>{streak} 🔥</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl px-2 sm:px-3 py-1.5 sm:py-2 text-center border border-white/10">
                <p className="text-[8px] sm:text-[10px] font-medium uppercase tracking-wider" style={{ color: iceWhite }}>Rank</p>
                <p className="font-bold text-xs sm:text-base" style={{ color: iceWhite }}>{getRankTitle()}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl px-2 sm:px-3 py-1.5 sm:py-2 text-center border border-white/10">
                <p className="text-[8px] sm:text-[10px] font-medium uppercase tracking-wider" style={{ color: iceWhite }}>Badges</p>
                <p className="font-bold text-xs sm:text-base" style={{ color: iceWhite }}>{badges.length}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-3 sm:p-4 lg:p-6">
          {renderContent()}
        </div>
      </main>

      {/* Modals */}
      {showLevelModal && learnerProgress && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowLevelModal(false)}>
          <div className={`rounded-2xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-xl border m-4 ${
            isDarkMode 
              ? 'bg-slate-800 border-teal-400/30' 
              : 'bg-white border-teal-300/40'
          }`} style={!isDarkMode ? { backgroundColor: cardBg, borderColor: `${accentColor}40`, borderRadius: `${borderRadius}px` } : {}} onClick={(e) => e.stopPropagation()}>
            <div className={`p-4 border-b flex justify-between items-center rounded-t-2xl ${
              isDarkMode 
                ? 'border-teal-400/20 bg-teal-900/20' 
                : 'border-teal-300/30 bg-gradient-to-r from-teal-50 to-cyan-50'
            }`} style={!isDarkMode ? { backgroundColor: `${accentColor}20`, borderColor: `${accentColor}40` } : {}}>
              <h2 className={`text-xs font-black uppercase tracking-wider ${isDarkMode ? 'text-teal-300' : 'text-[#19475B]'}`} style={!isDarkMode ? { color: headingColor } : {}}>
                Level Progression
              </h2>
              <button onClick={() => setShowLevelModal(false)} className={`p-1 rounded-full transition-colors ${
                isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-100'
              }`}>
                <span className={`text-xl ${isDarkMode ? 'text-slate-400' : 'text-[#19475B]/50'}`}>×</span>
              </button>
            </div>
            
            <div className="p-4 sm:p-5 overflow-y-auto flex-1">
              <div className={`mb-6 text-center p-4 sm:p-5 rounded-xl border ${
                isDarkMode 
                  ? 'border-teal-400/20 bg-teal-500/10' 
                  : 'border-teal-300/30 bg-teal-50'
              }`} style={!isDarkMode ? { backgroundColor: `${accentColor}20`, borderColor: `${accentColor}40` } : {}}>
                <p className={`text-[10px] mb-1 font-bold uppercase tracking-wide ${isDarkMode ? 'text-slate-400' : 'text-[#19475B]/70'}`} style={!isDarkMode ? { color: bodyColor } : {}}>
                  Current Status
                </p>
                <p className={`text-xl sm:text-2xl font-black ${isDarkMode ? 'text-teal-300' : 'text-[#19475B]'}`} style={!isDarkMode ? { color: headingColor } : {}}>
                  {getLevelDisplayName(learnerProgress.current_level)}
                </p>
                <div className={`inline-flex items-center gap-1.5 mt-2 px-2 py-0.5 rounded-full border text-[10px] font-medium ${
                  isDarkMode 
                    ? 'border-teal-400/20 bg-slate-700 text-slate-300' 
                    : 'border-[#19475B]/20 bg-white text-[#19475B]'
                }`} style={!isDarkMode ? { borderColor: `${accentColor}40`, backgroundColor: cardBg, color: headingColor } : {}}>
                  Unlocked {learnerProgress.unlocked_levels?.length || 1} of 8 Levels
                </div>
              </div>

              <div className="space-y-2">
                {ALL_LEVELS.map((level) => {
                  const isCurrent = learnerProgress.current_level === level.id;
                  const isCompleted = learnerProgress.completed_levels?.some(l => l.level === level.id);
                  const isUnlocked = learnerProgress.unlocked_levels?.includes(level.id);
                  const isSecondary = level.id.startsWith('form');

                  return (
                    <div 
                      key={level.id} 
                      className={`p-3 rounded-xl border transition-all flex justify-between items-center ${
                        isCurrent 
                          ? isDarkMode 
                            ? 'border-teal-400/50 bg-teal-500/20 shadow-sm' 
                            : 'border-teal-400/60 bg-teal-50 shadow-sm'
                          : isCompleted 
                            ? isDarkMode 
                              ? 'border-emerald-400/30 bg-emerald-500/10' 
                              : 'border-emerald-300/50 bg-emerald-50'
                            : isDarkMode 
                              ? 'border-slate-700/50 bg-slate-700/30 opacity-75' 
                              : 'border-gray-200/50 bg-gray-50 opacity-75'
                      }`}
                      style={!isDarkMode ? { 
                        borderColor: isCurrent ? accentColor : undefined,
                        backgroundColor: isCurrent ? `${accentColor}20` : undefined,
                        borderRadius: `${borderRadius}px`
                      } : {}}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold flex-shrink-0 ${
                          isCompleted 
                            ? isDarkMode ? 'bg-emerald-500 text-white' : 'bg-emerald-500 text-white'
                            : isCurrent 
                              ? isDarkMode ? 'bg-teal-500 text-white' : 'bg-teal-500 text-white'
                              : isDarkMode ? 'bg-slate-600 text-slate-400' : 'bg-gray-200 text-gray-400'
                        }`} style={!isDarkMode && isCurrent ? { backgroundColor: accentColor } : {}}>
                          {isCompleted ? '✓' : !isUnlocked ? '🔒' : '•'}
                        </div>
                        <div className="min-w-0">
                          <p className={`text-xs sm:text-sm font-bold truncate ${
                            !isUnlocked && !isDarkMode ? 'text-[#19475B]/50' : 
                            isDarkMode ? 'text-white' : 'text-[#19475B]'
                          }`} style={!isDarkMode ? { color: isUnlocked ? bodyColor : undefined } : {}}>
                            {level.name}
                            {isSecondary && <span className="text-[8px] sm:text-[10px] ml-1 text-purple-500">(Secondary)</span>}
                          </p>
                          {isCurrent && (
                            <p className={`text-[8px] sm:text-[9px] font-semibold ${isDarkMode ? 'text-teal-300' : 'text-[#19475B]'}`} style={!isDarkMode ? { color: accentColor } : {}}>
                              In Progress
                            </p>
                          )}
                          {isCompleted && (
                            <p className={`text-[8px] sm:text-[9px] font-medium ${isDarkMode ? 'text-emerald-300' : 'text-emerald-600'}`}>
                              Completed
                            </p>
                          )}
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

      {showAvatarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowAvatarModal(false)}>
          <div className={`rounded-2xl max-w-md w-full p-4 sm:p-6 shadow-xl border m-4 ${
            isDarkMode 
              ? 'bg-slate-800 border-teal-400/30' 
              : 'bg-white border-teal-300/40'
          }`} style={!isDarkMode ? { backgroundColor: cardBg, borderColor: `${accentColor}40`, borderRadius: `${borderRadius}px` } : {}} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-base sm:text-lg font-bold ${isDarkMode ? 'text-white' : 'text-[#19475B]'}`} style={!isDarkMode ? { color: headingColor } : {}}>
                Choose Your Avatar
              </h3>
              <button 
                onClick={() => setShowAvatarModal(false)} 
                className={`p-1 rounded-full transition-colors ${
                  isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-100'
                }`}
              >
                <span className={`text-xl ${isDarkMode ? 'text-slate-400' : 'text-[#19475B]/50'}`}>×</span>
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              {avatars.map((avatarUrl, idx) => (
                <button
                  key={idx}
                  onClick={() => updateAvatar(avatarUrl)}
                  className={`p-2 rounded-xl border transition-all ${
                    selectedAvatar === avatarUrl
                      ? isDarkMode 
                        ? 'border-teal-400/50 bg-teal-500/20' 
                        : 'border-teal-400/60 bg-teal-50'
                      : isDarkMode 
                        ? 'border-slate-700/50 hover:border-teal-400/50 hover:bg-slate-700/50' 
                        : 'border-teal-200/50 hover:border-teal-400/60 hover:bg-teal-50'
                  }`}
                  style={!isDarkMode ? { 
                    borderColor: selectedAvatar === avatarUrl ? accentColor : undefined,
                    backgroundColor: selectedAvatar === avatarUrl ? `${accentColor}20` : undefined,
                  } : {}}
                >
                  <img src={avatarUrl} alt={`Avatar option ${idx + 1}`} className="w-16 h-16 sm:w-20 sm:h-20 mx-auto" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <style>{`
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
          background: ${isDarkMode ? '#475569' : 'rgba(255,255,255,0.2)'};
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: ${isDarkMode ? '#64748b' : 'rgba(255,255,255,0.3)'};
        }

        /* Custom breakpoint for extra small screens */
        @media (min-width: 480px) {
          .xs\\:flex {
            display: flex;
          }
        }
        @media (max-width: 479px) {
          .xs\\:flex {
            display: none;
          }
        }

        /* Ensure touch targets are large enough on mobile */
        @media (max-width: 640px) {
          button, 
          .cursor-pointer {
            min-height: 44px;
            min-width: 44px;
          }
          .sidebar-item {
            min-height: 48px;
          }
        }
      `}</style>
    </div>
  );
};

export default LearnerDashboard;