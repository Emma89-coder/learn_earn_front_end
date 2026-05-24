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
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('portal-theme');
    return savedTheme ? savedTheme === 'dark' : true;
  });

  useEffect(() => {
    localStorage.setItem('portal-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const [pointsRes, rewardsRes] = await Promise.all([
        axios.get(`${API_URL}/api/learner/balance`, { headers }),
        axios.get(`${API_URL}/api/learner/rewards`, { headers })
      ]);

      setPoints({
        current: pointsRes.data.current_points || 0,
        lifetime: pointsRes.data.lifetime_points || 0
      });
      setRewards(rewardsRes.data.rewards || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Could not load rewards. Please try again.');
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
      
      await axios.post(
        `${API_URL}/api/learner/redeem-reward`,
        { rewardId: reward.id },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      toast.success(`Successfully claimed ${reward.name}! 🎉`);
      
      setPoints(prev => ({ ...prev, current: prev.current - reward.points_required }));
      
      setRewards(prev => 
        prev.map(item => {
          if (item.id === reward.id && item.stock_quantity !== undefined) {
            return { ...item, stock_quantity: item.stock_quantity - 1 };
          }
          return item;
        })
      );

    } catch (error) {
      console.error('Claim error:', error);
      toast.error(error.response?.data?.error || 'Could not claim reward.');
    } finally {
      setRedeemingId(null);
    }
  };

  const filteredRewards = rewards.filter(reward => {
    if (selectedCategory !== 'all' && reward.category !== selectedCategory) return false;
    if (searchTerm && !reward.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return reward.is_active !== false;
  });

  const getStockStatus = (stock) => {
    if (stock === 0) return { label: 'Out of Stock', color: 'red', icon: '❌' };
    if (stock < 10) return { label: 'Low Stock', color: 'orange', icon: '⚠️' };
    return { label: 'In Stock', color: 'green', icon: '✓' };
  };

  return (
    <div className={`min-h-screen transition-all duration-500 ${
      isDarkMode 
        ? 'bg-slate-900' 
        : 'bg-slate-50'
    }`}>
      
      {/* Header */}
      <header className={`sticky top-0 z-50 w-full backdrop-blur-xl transition-all duration-500 ${
        isDarkMode 
          ? 'bg-slate-900/90 border-b border-slate-800' 
          : 'bg-white/90 border-b border-slate-200'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/learner-dashboard')}>
              <div className="relative group">
                <div className="relative w-10 h-10 bg-teal-500 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-xl">🎁</span>
                </div>
              </div>
              <div>
                <h1 className={`text-xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                  Reward <span className="text-teal-500">Store</span>
                </h1>
                <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Redeem your hard-earned points
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`p-2 rounded-xl transition-all duration-300 ${
                  isDarkMode 
                    ? 'bg-slate-800 border border-slate-700 text-amber-400 hover:bg-slate-700' 
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {isDarkMode ? '☀️' : '🌙'}
              </button>
              
              <button
                onClick={() => navigate('/learner-dashboard')}
                className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${
                  isDarkMode 
                    ? 'bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700' 
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                ← Dashboard
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Points Cards - Solid Colors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">
          <div className={`rounded-2xl p-6 transition-all duration-300 hover:scale-105 ${
            isDarkMode 
              ? 'bg-teal-500/20 border border-teal-500/30' 
              : 'bg-white shadow-lg border border-teal-100'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-xs uppercase tracking-wider ${isDarkMode ? 'text-slate-300' : 'text-slate-500'}`}>
                  Available Points
                </p>
                <p className={`text-4xl font-bold mt-2 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                  {points.current}
                </p>
              </div>
              <div className="w-14 h-14 rounded-xl bg-teal-500 flex items-center justify-center shadow-lg">
                <span className="text-2xl">💎</span>
              </div>
            </div>
          </div>

          <div className={`rounded-2xl p-6 transition-all duration-300 hover:scale-105 ${
            isDarkMode 
              ? 'bg-purple-500/20 border border-purple-500/30' 
              : 'bg-white shadow-lg border border-purple-100'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-xs uppercase tracking-wider ${isDarkMode ? 'text-slate-300' : 'text-slate-500'}`}>
                  Lifetime Points
                </p>
                <p className={`text-4xl font-bold mt-2 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                  {points.lifetime}
                </p>
              </div>
              <div className="w-14 h-14 rounded-xl bg-purple-500 flex items-center justify-center shadow-lg">
                <span className="text-2xl">🏆</span>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search rewards..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full rounded-xl border px-4 py-3 pl-10 text-sm outline-none focus:ring-2 focus:ring-teal-500 transition-all ${
                    isDarkMode 
                      ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-400' 
                      : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400'
                  }`}
                />
                <svg className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            <div className="flex gap-2">
              {['all', 'popular', 'new'].map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all ${
                    selectedCategory === category
                      ? 'bg-teal-500 text-white shadow-md'
                      : isDarkMode 
                        ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Rewards Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div key={item} className={`rounded-2xl overflow-hidden animate-pulse ${
                isDarkMode ? 'bg-slate-800' : 'bg-slate-100'
              }`}>
                <div className="h-48 bg-slate-700/50"></div>
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-slate-700/50 rounded w-3/4"></div>
                  <div className="h-3 bg-slate-700/50 rounded w-1/2"></div>
                  <div className="h-10 bg-slate-700/50 rounded"></div>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredRewards.map((reward) => {
              const stockStatus = getStockStatus(reward.stock_quantity);
              const isOutOfStock = reward.stock_quantity !== undefined && reward.stock_quantity <= 0;
              const canAfford = points.current >= reward.points_required;
              
              return (
                <div
                  key={reward.id}
                  className={`group rounded-2xl overflow-hidden transition-all duration-300 transform hover:scale-[1.02] hover:shadow-2xl ${
                    isDarkMode 
                      ? 'bg-slate-800 border border-slate-700' 
                      : 'bg-white shadow-lg border border-slate-100'
                  }`}
                >
                  {/* Reward Image */}
                  <div className="relative h-48 overflow-hidden bg-teal-500/10">
                    {reward.image_url ? (
                      <img 
                        src={reward.image_url} 
                        alt={reward.name}
                        className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-6xl">🎁</span>
                      </div>
                    )}
                    
                    {/* Stock Badge */}
                    {reward.stock_quantity !== undefined && (
                      <div className={`absolute top-3 right-3 px-2 py-1 rounded-lg text-xs font-semibold ${
                        stockStatus.color === 'red' 
                          ? 'bg-red-500 text-white'
                          : stockStatus.color === 'orange'
                          ? 'bg-orange-500 text-white'
                          : 'bg-green-500 text-white'
                      }`}>
                        {stockStatus.icon} {stockStatus.label}
                      </div>
                    )}
                    
                    {/* Points Badge */}
                    <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-sm">
                      <span className="text-white font-bold">{reward.points_required} pts</span>
                    </div>
                  </div>
                  
                  {/* Reward Info */}
                  <div className="p-4">
                    <h3 className={`font-bold text-lg mb-1 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                      {reward.name}
                    </h3>
                    <p className={`text-sm line-clamp-2 mb-4 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      {reward.description || 'Redeem your points for this amazing reward!'}
                    </p>
                    
                    {/* Stock Info */}
                    {reward.stock_quantity !== undefined && (
                      <div className="mb-3">
                        <div className="flex justify-between text-xs mb-1">
                          <span className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>
                            Remaining Stock
                          </span>
                          <span className={`font-semibold ${
                            reward.stock_quantity < 10 ? 'text-orange-500' : 'text-green-500'
                          }`}>
                            {reward.stock_quantity} left
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              reward.stock_quantity < 10 ? 'bg-orange-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${Math.min(100, (reward.stock_quantity / 50) * 100)}%` }}
                          />
                        </div>
                      </div>
                    )}
                    
                    {/* Action Button */}
                    <button
                      disabled={isOutOfStock || !canAfford || redeemingId === reward.id}
                      onClick={() => handleRedeemItem(reward)}
                      className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 ${
                        isOutOfStock
                          ? 'bg-slate-400 text-white cursor-not-allowed'
                          : !canAfford
                          ? 'bg-orange-400 text-white cursor-not-allowed'
                          : 'bg-teal-500 text-white hover:bg-teal-600 transform hover:scale-105'
                      }`}
                    >
                      {redeemingId === reward.id ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Processing...
                        </div>
                      ) : isOutOfStock ? (
                        'Out of Stock'
                      ) : !canAfford ? (
                        `Need ${reward.points_required - points.current} more pts`
                      ) : (
                        'Redeem Now →'
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Stats Summary */}
        {!loading && filteredRewards.length > 0 && (
          <div className={`mt-8 p-4 rounded-xl text-center ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
            <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Showing {filteredRewards.length} of {rewards.length} rewards
            </p>
          </div>
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <div className={`fixed bottom-0 inset-x-0 z-50 lg:hidden px-4 pb-4 pt-2 border-t backdrop-blur-lg transition-all duration-300 ${
        isDarkMode 
          ? 'bg-slate-900/95 border-slate-800' 
          : 'bg-white/95 border-slate-200'
      }`}>
        <div className="flex justify-around items-center">
          <button onClick={() => navigate('/learner-dashboard')} className="flex flex-col items-center gap-1 text-slate-400 hover:text-teal-500 transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-[10px] font-medium">Home</span>
          </button>
          <button onClick={() => navigate('/quizzes')} className="flex flex-col items-center gap-1 text-slate-400 hover:text-teal-500 transition">
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
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="flex flex-col items-center gap-1 text-slate-400 hover:text-teal-500 transition">
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

      <style jsx>{`
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

export default RewardsStore;