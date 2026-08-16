import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import API_URL from '../../config';

const RewardsStore = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [rewards, setRewards] = useState([]);
  const [points, setPoints] = useState({ current: 0, lifetime: 0 });
  const [loading, setLoading] = useState(true);
  const [redeemingId, setRedeemingId] = useState(null);
  const [selectedReward, setSelectedReward] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('portal-theme');
    return savedTheme ? savedTheme === 'dark' : true;
  });

  useEffect(() => {
    localStorage.setItem('portal-theme', isDarkMode ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const pointsRes = await axios.get(`${API_URL}/api/learner/balance`, { headers });
      const rewardsRes = await axios.get(`${API_URL}/api/learner/rewards`, { headers });

      setPoints({
        current: pointsRes.data.current_points || 0,
        lifetime: pointsRes.data.lifetime_points || 0
      });
      
      const activeRewards = (rewardsRes.data.rewards || []).filter(r => r.is_active !== false);
      setRewards(activeRewards);
    } catch (error) {
      console.error('Error fetching data:', error);
      const errorMessage = error.response?.data?.error || 'Could not load rewards. Please try again.';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRedeemItem = async (reward) => {
    if (points.current < reward.points_required) {
      toast.error('You do not have enough points for this reward!');
      return;
    }
    if (reward.stock_quantity !== undefined && reward.stock_quantity <= 0) {
      toast.error('Sorry, this reward is out of stock!');
      return;
    }

    try {
      setRedeemingId(reward.id);
      const token = localStorage.getItem('token');
      
      const response = await axios.post(
        `${API_URL}/api/learner/redeem-reward`,
        { rewardId: reward.id },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (response.data.success) {
        toast.success(`Successfully claimed ${reward.name}! 🎉`);
        
        setPoints(prev => ({ 
          ...prev, 
          current: prev.current - reward.points_required 
        }));
        
        setRewards(prev => 
          prev.map(item => {
            if (item.id === reward.id && item.stock_quantity !== undefined) {
              return { ...item, stock_quantity: item.stock_quantity - 1 };
            }
            return item;
          })
        );
        
        setShowDialog(false);
        setSelectedReward(null);
      } else {
        toast.error(response.data.message || 'Could not claim reward.');
      }

    } catch (error) {
      console.error('Claim error:', error);
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          'Could not claim reward. Please try again.';
      toast.error(errorMessage);
    } finally {
      setRedeemingId(null);
    }
  };

  const openRewardDialog = (reward) => {
    setSelectedReward(reward);
    setShowDialog(true);
  };

  const closeDialog = () => {
    setShowDialog(false);
    setSelectedReward(null);
  };

  const filteredRewards = rewards.filter(reward => {
    if (searchTerm && !reward.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return reward.is_active !== false;
  });

  const getStockStatus = (stock) => {
    if (stock === undefined || stock === null) return { label: 'Unlimited', color: 'text-teal-500', icon: '∞' };
    if (stock === 0) return { label: 'Out of Stock', color: 'text-red-500', icon: '❌' };
    if (stock < 10) return { label: 'Low Stock', color: 'text-amber-500', icon: '⚠️' };
    return { label: 'In Stock', color: 'text-teal-500', icon: '✓' };
  };

  // Helper function to render reward image with scale
  const renderRewardImage = (reward, className = 'w-full h-full object-cover', containerClassName = '') => {
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

  return (
    <div className={`min-h-screen transition-all duration-500 ${
      isDarkMode 
        ? 'bg-slate-900' 
        : 'bg-slate-50'
    }`}>
      
      {/* Header - Teal Background */}
      <header className="sticky top-0 z-50 w-full bg-gradient-to-r from-teal-600 to-teal-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo Section */}
            <div className="flex items-center gap-4 cursor-pointer group" onClick={() => navigate('/learner-dashboard')}>
              <div className="relative">
                <div className="relative w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg group-hover:bg-white/30 transition-all">
                  <span className="text-2xl">🎁</span>
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-white">
                  Reward <span className="text-teal-200">Store</span>
                </h1>
                <p className="text-xs text-teal-100/80">
                  Redeem your hard-earned points
                </p>
              </div>
            </div>
            
            {/* Right Section */}
            <div className="flex items-center gap-4">
              {/* Points Display */}
              <div className="flex items-center gap-2">
                <span className="text-2xl">💎</span>
                <span className="text-2xl font-bold text-white">{points.current}</span>
              </div>

              {/* Theme Toggle */}
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-2 rounded-xl transition-all duration-300 hover:bg-white/10 text-white/80 hover:text-white text-xl"
              >
                {isDarkMode ? '☀️' : '🌙'}
              </button>
              
              {/* Dashboard Button */}
              <button
                onClick={() => navigate('/learner-dashboard')}
                className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 hover:bg-white/10 text-white/80 hover:text-white"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Dashboard
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 lg:pb-8">
        
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Search rewards..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full rounded-xl border px-4 py-3 pl-10 text-sm outline-none transition-all duration-300 ${
                isDarkMode 
                  ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-400 focus:ring-2 focus:ring-teal-500 focus:border-transparent' 
                  : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-teal-500 focus:border-transparent'
              }`}
            />
            <svg className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Rewards Grid */}
        {loading ? (
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
              <div key={item} className={`rounded-xl overflow-hidden animate-pulse aspect-square ${
                isDarkMode ? 'bg-slate-800' : 'bg-slate-100'
              }`}>
                <div className="w-full h-full flex items-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-slate-700/50"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredRewards.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🎁</div>
            <p className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
              No rewards found
            </p>
            <p className={`text-sm mt-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              {searchTerm ? 'Try searching for something else' : 'Check back later for exciting rewards!'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-4">
            {filteredRewards.map((reward) => {
              const stockStatus = getStockStatus(reward.stock_quantity);
              const isOutOfStock = reward.stock_quantity !== undefined && reward.stock_quantity <= 0;
              const scale = reward.image_scale || 1;
              const isScaled = scale !== 1;
              
              return (
                <div
                  key={reward.id}
                  onClick={() => !isOutOfStock && openRewardDialog(reward)}
                  className={`group rounded-xl overflow-hidden transition-all duration-300 cursor-pointer aspect-square ${
                    isDarkMode 
                      ? 'bg-slate-800 border border-slate-700 hover:border-teal-500/50 hover:shadow-lg hover:shadow-teal-500/10 hover:scale-105' 
                      : 'bg-white border border-slate-200 hover:shadow-xl hover:border-teal-300 hover:shadow-teal-500/10 hover:scale-105'
                  } ${isOutOfStock ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="w-full h-full flex flex-col items-center justify-center p-3 relative">
                    {/* Scale indicator */}
                    {isScaled && (
                      <div className="absolute top-1 right-1 bg-teal-500/80 text-white text-[8px] px-1.5 py-0.5 rounded-md">
                        {Math.round(scale * 100)}%
                      </div>
                    )}
                    
                    {/* Reward Icon/Image */}
                    <div className={`w-16 h-16 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center mb-2 shadow-md transition-all duration-300 ${
                      isDarkMode 
                        ? 'bg-teal-500/20 group-hover:bg-teal-500/30' 
                        : 'bg-teal-50 group-hover:bg-teal-100'
                    }`}>
                      {renderRewardImage(reward)}
                    </div>
                    
                    {/* Reward Name */}
                    <p className={`text-xs font-semibold text-center truncate w-full ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                      {reward.name}
                    </p>
                    
                    {/* Points */}
                    <p className={`text-[10px] flex items-center gap-1 mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      <span className="text-xs">💰</span> {reward.points_required}
                    </p>
                    
                    {/* Stock Status */}
                    {reward.stock_quantity !== undefined && (
                      <div className={`text-[10px] font-medium mt-0.5 ${stockStatus.color}`}>
                        {stockStatus.icon} {stockStatus.label}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Stats Summary */}
        {!loading && filteredRewards.length > 0 && (
          <div className={`mt-6 p-3 rounded-xl text-center ${
            isDarkMode 
              ? 'bg-teal-500/10 border border-teal-500/20' 
              : 'bg-teal-50 border border-teal-200/50'
          }`}>
            <p className={`text-xs ${isDarkMode ? 'text-teal-400' : 'text-teal-600'}`}>
              {filteredRewards.length} rewards available
            </p>
          </div>
        )}
      </main>

      {/* Reward Detail Dialog */}
      {showDialog && selectedReward && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={closeDialog}>
          <div 
            className={`relative max-w-sm w-full rounded-2xl overflow-hidden shadow-2xl transform transition-all ${
              isDarkMode 
                ? 'bg-slate-900 border border-teal-500/30' 
                : 'bg-white border border-teal-200/50'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={closeDialog}
              className={`absolute top-2 right-2 z-10 w-7 h-7 rounded-full flex items-center justify-center transition text-sm ${
                isDarkMode 
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white' 
                  : 'bg-white/90 hover:bg-teal-50 text-slate-600 hover:text-teal-600 shadow-md hover:shadow-lg'
              }`}
            >
              ✕
            </button>

            {/* Reward Image with Scale */}
            <div className="w-full h-48 overflow-hidden bg-gradient-to-br from-teal-500/30 to-teal-600/30 relative">
              {selectedReward.image_url ? (
                <div className="w-full h-full flex items-center justify-center overflow-hidden">
                  <img 
                    src={selectedReward.image_url} 
                    alt={selectedReward.name}
                    className="w-full h-full object-cover"
                    style={{
                      transform: `scale(${selectedReward.image_scale || 1})`,
                      transformOrigin: 'center center',
                    }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      const parent = e.target.parentElement;
                      if (parent) {
                        parent.innerHTML = '<div class="w-full h-full flex items-center justify-center"><span class="text-6xl">🎁</span></div>';
                      }
                    }}
                  />
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-6xl">🎁</span>
                </div>
              )}
              
              {/* Scale badge on dialog */}
              {selectedReward.image_scale && selectedReward.image_scale !== 1 && (
                <div className="absolute top-3 right-12 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full">
                  {Math.round(selectedReward.image_scale * 100)}%
                </div>
              )}
              
              {/* Stock Badge */}
              {selectedReward.stock_quantity !== undefined && (
                <div className={`absolute top-3 left-3 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  selectedReward.stock_quantity <= 0
                    ? 'bg-red-500 text-white'
                    : selectedReward.stock_quantity < 10
                    ? 'bg-amber-500 text-white'
                    : 'bg-teal-500 text-white'
                }`}>
                  {selectedReward.stock_quantity <= 0 
                    ? '❌ Out of Stock' 
                    : selectedReward.stock_quantity < 10 
                    ? `⚠️ ${selectedReward.stock_quantity} left` 
                    : `✓ ${selectedReward.stock_quantity} available`}
                </div>
              )}
            </div>

            {/* Reward Details */}
            <div className="p-4">
              <h2 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                {selectedReward.name}
              </h2>
              
              <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                {selectedReward.description || 'Redeem your points for this amazing reward!'}
              </p>
              
              {/* Scale info */}
              {selectedReward.image_scale && selectedReward.image_scale !== 1 && (
                <div className="mt-2 text-center">
                  <span className={`text-[10px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    🔍 Image scaled to {Math.round(selectedReward.image_scale * 100)}%
                  </span>
                </div>
              )}
              
              {/* Points Required */}
              <div className={`mt-3 p-3 rounded-xl ${
                isDarkMode ? 'bg-teal-500/10 border border-teal-500/20' : 'bg-teal-50 border border-teal-200/50'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">💰</span>
                    <div>
                      <p className={`text-[10px] ${isDarkMode ? 'text-teal-400' : 'text-teal-600'}`}>
                        Points Required
                      </p>
                      <p className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                        {selectedReward.points_required}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className={`text-[10px] ${isDarkMode ? 'text-teal-400' : 'text-teal-600'}`}>
                      Your Balance
                    </p>
                    <p className={`text-xl font-bold ${points.current >= selectedReward.points_required ? 'text-teal-500' : 'text-red-500'}`}>
                      {points.current}
                    </p>
                  </div>
                </div>
              </div>

              {/* Stock Progress */}
              {selectedReward.stock_quantity !== undefined && selectedReward.stock_quantity > 0 && (
                <div className="mt-3">
                  <div className="flex justify-between text-xs mb-0.5">
                    <span className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>Stock Remaining</span>
                    <span className={`font-semibold text-xs ${
                      selectedReward.stock_quantity < 10 ? 'text-amber-500' : 'text-teal-500'
                    }`}>
                      {selectedReward.stock_quantity} left
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${
                        selectedReward.stock_quantity < 10 ? 'bg-amber-500' : 'bg-teal-500'
                      }`}
                      style={{ width: `${Math.min(100, (selectedReward.stock_quantity / 50) * 100)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Redeem Button */}
              <button
                disabled={
                  selectedReward.stock_quantity !== undefined && selectedReward.stock_quantity <= 0 ||
                  points.current < selectedReward.points_required ||
                  redeemingId === selectedReward.id
                }
                onClick={() => handleRedeemItem(selectedReward)}
                className={`w-full mt-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 ${
                  selectedReward.stock_quantity !== undefined && selectedReward.stock_quantity <= 0
                    ? 'bg-slate-400 text-white cursor-not-allowed'
                    : points.current < selectedReward.points_required
                    ? 'bg-amber-500 text-white cursor-not-allowed'
                    : 'bg-gradient-to-r from-teal-500 to-teal-600 text-white hover:shadow-lg hover:shadow-teal-500/30 transform hover:scale-105'
                }`}
              >
                {redeemingId === selectedReward.id ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm">Processing...</span>
                  </div>
                ) : selectedReward.stock_quantity !== undefined && selectedReward.stock_quantity <= 0 ? (
                  'Out of Stock'
                ) : points.current < selectedReward.points_required ? (
                  `Need ${selectedReward.points_required - points.current} more points`
                ) : (
                  '🎉 Redeem Reward'
                )}
              </button>

              {/* Cancel Button */}
              <button
                onClick={closeDialog}
                className={`w-full mt-2 py-1.5 rounded-xl text-xs font-medium transition ${
                  isDarkMode 
                    ? 'text-slate-400 hover:bg-slate-800 hover:text-white' 
                    : 'text-slate-500 hover:bg-teal-50 hover:text-teal-600'
                }`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      <div className={`fixed bottom-0 inset-x-0 z-50 lg:hidden px-4 pb-4 pt-2 border-t backdrop-blur-lg transition-all duration-300 ${
        isDarkMode 
          ? 'bg-slate-900/95 border-teal-500/20' 
          : 'bg-white/95 border-teal-200/50'
      }`}>
        <div className="flex justify-around items-center">
          <button onClick={() => navigate('/learner-dashboard')} className={`flex flex-col items-center gap-1 transition ${
            isDarkMode ? 'text-slate-400 hover:text-teal-400' : 'text-slate-400 hover:text-teal-600'
          }`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-[10px] font-medium">Home</span>
          </button>
          <button onClick={() => navigate('/quizzes')} className={`flex flex-col items-center gap-1 transition ${
            isDarkMode ? 'text-slate-400 hover:text-teal-400' : 'text-slate-400 hover:text-teal-600'
          }`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <span className="text-[10px] font-medium">Quizzes</span>
          </button>
          <button onClick={() => navigate('/rewards')} className="flex flex-col items-center gap-1 text-teal-500 transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5a2 2 0 10-2 2h2zm0 0h4m-4 0H8m12 3v8a2 2 0 01-2 2H6a2 2 0 01-2-2v-8m16 0H4" />
            </svg>
            <span className="text-[10px] font-medium">Store</span>
          </button>
          <button onClick={() => setIsDarkMode(!isDarkMode)} className={`flex flex-col items-center gap-1 transition ${
            isDarkMode ? 'text-amber-400 hover:text-teal-400' : 'text-slate-400 hover:text-teal-600'
          }`}>
            {isDarkMode ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M14 12a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
            <span className="text-[10px] font-medium">Theme</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default RewardsStore;