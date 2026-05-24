import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import API_URL from '../../config';

const AdminRewards = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [rewards, setRewards] = useState([]);
  const [selectedReward, setSelectedReward] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('portal-theme');
    return savedTheme ? savedTheme === 'dark' : false;
  });
  
  const [form, setForm] = useState({
    name: '',
    description: '',
    points_required: '',  // Changed from points_cost to points_required
    stock_quantity: '',
    image_url: ''
  });

  useEffect(() => {
    fetchRewards();
  }, []);

  useEffect(() => {
    localStorage.setItem('portal-theme', isDarkMode ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  const fetchRewards = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/admin/rewards`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setRewards(response.data.rewards || []);
    } catch (error) {
      console.error('Fetch admin rewards error:', error);
      toast.error('Unable to load reward catalog.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedReward(null);
    setForm({
      name: '',
      description: '',
      points_required: '',
      stock_quantity: '',
      image_url: ''
    });
  };

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const uploadRewardImage = async (file) => {
    setUploadingImage(true);
    setUploadProgress(0);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/api/admin/upload-image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      });

      if (response.data.success) {
        handleChange('image_url', response.data.imageUrl);
        toast.success('Image uploaded successfully!');
        setTimeout(() => setUploadProgress(0), 1500);
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to upload image');
      setUploadProgress(0);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }
    uploadRewardImage(file);
  };

  const removeImage = () => {
    handleChange('image_url', '');
    toast.success('Image removed');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    // Simple validation
    if (!form.name || form.name.trim() === '') {
      toast.error('Reward name is required');
      return;
    }

    if (!form.points_required || form.points_required === '') {
      toast.error('Points required is required');
      return;
    }

    const pointsNum = Number(form.points_required);
    if (isNaN(pointsNum) || pointsNum <= 0) {
      toast.error('Points required must be a valid number greater than 0');
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem('token');

      const payload = {
        name: form.name.trim(),
        description: form.description?.trim() || '',
        points_required: pointsNum,  // Changed from points_cost to points_required
        stock_quantity: Number(form.stock_quantity) || 0,
        image_url: form.image_url?.trim() || null,
        is_active: true
      };

      console.log('Submitting payload:', payload);

      if (selectedReward) {
        await axios.put(`${API_URL}/api/admin/rewards/${selectedReward.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Reward updated successfully!');
      } else {
        await axios.post(`${API_URL}/api/admin/rewards`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Reward created successfully!');
      }

      resetForm();
      fetchRewards();
    } catch (error) {
      console.error('Save reward error:', error);
      toast.error(error.response?.data?.error || 'Could not save reward.');
    } finally {
      setSaving(false);
    }
  };

  const handleEditReward = (reward) => {
    setSelectedReward(reward);
    setForm({
      name: reward.name || '',
      description: reward.description || '',
      points_required: reward.points_required?.toString() || '',  // Changed from points_cost to points_required
      stock_quantity: reward.stock_quantity?.toString() || '',
      image_url: reward.image_url || ''
    });
  };

  const handleDeleteReward = async (rewardId) => {
    if (!window.confirm('Delete this reward? This action cannot be undone.')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/api/admin/rewards/${rewardId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Reward deleted.');
      setRewards((prev) => prev.filter((item) => item.id !== rewardId));
      if (selectedReward?.id === rewardId) resetForm();
    } catch (error) {
      console.error('Delete reward error:', error);
      toast.error(error.response?.data?.error || 'Could not delete reward.');
    }
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const getStockStatus = (stock) => {
    if (stock === 0) return { label: 'Out of Stock', color: 'bg-red-500/10 text-red-500', icon: '❌' };
    if (stock < 10) return { label: 'Low Stock', color: 'bg-amber-500/10 text-amber-500', icon: '⚠️' };
    return { label: 'In Stock', color: 'bg-emerald-500/10 text-emerald-500', icon: '✓' };
  };

  const totalPoints = rewards.reduce((sum, r) => sum + (Number(r.points_required) || 0), 0);  // Changed from points_cost to points_required
  const totalStock = rewards.reduce((sum, r) => sum + (Number(r.stock_quantity) || 0), 0);

  return (
    <div className={`min-h-screen transition-all duration-500 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' 
        : 'bg-gradient-to-br from-slate-50 via-white to-slate-50'
    }`}>
      
      {/* Header */}
      <header className={`sticky top-0 z-50 w-full backdrop-blur-xl transition-all duration-500 ${
        isDarkMode 
          ? 'bg-slate-900/80 border-b border-white/10' 
          : 'bg-white/80 border-b border-slate-200'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="relative group">
                <div className="relative w-10 h-10 bg-gradient-to-br from-darkblue-600 to-azure-500 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-xl">🎁</span>
                </div>
              </div>
              <div>
                <h1 className={`text-xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                  Reward <span className="bg-gradient-to-r from-azure-500 to-teal-500 bg-clip-text text-transparent">Catalog</span>
                </h1>
                <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Manage rewards and point-based incentives
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-xl transition-all duration-300 ${
                  isDarkMode 
                    ? 'bg-slate-800 border border-slate-700 text-amber-400 hover:bg-slate-700' 
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {isDarkMode ? '☀️' : '🌙'}
              </button>
              
              <button
                onClick={() => navigate('/admin-dashboard')}
                className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${
                  isDarkMode 
                    ? 'bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700' 
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                📊 Dashboard
              </button>
              
              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all duration-300 ${
                    isDarkMode 
                      ? 'bg-slate-800 border border-slate-700 hover:bg-slate-700' 
                      : 'bg-white border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-darkblue-600 to-azure-500 flex items-center justify-center">
                    <span className="text-sm text-white font-medium">A</span>
                  </div>
                  <span className="hidden sm:inline text-sm font-medium">Admin</span>
                  <svg className={`w-4 h-4 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showUserMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)}></div>
                    <div className={`absolute right-0 mt-2 w-44 rounded-xl shadow-lg overflow-hidden z-50 border animate-fadeIn ${
                      isDarkMode 
                        ? 'bg-slate-800 border-slate-700' 
                        : 'bg-white border-slate-200'
                    }`}>
                      <button
                        onClick={logout}
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
        
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
          <div className={`group rounded-2xl p-5 transition-all duration-300 hover:scale-105 ${
            isDarkMode 
              ? 'bg-slate-800/50 backdrop-blur-sm border border-slate-700 hover:border-azure-500/50' 
              : 'bg-white shadow-lg hover:shadow-xl border border-slate-100'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-xs uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Total Rewards
                </p>
                <p className={`text-3xl font-bold mt-1 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                  {rewards.length}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-azure-500 to-teal-500 flex items-center justify-center shadow-lg">
                <span className="text-2xl">🎁</span>
              </div>
            </div>
          </div>

          <div className={`group rounded-2xl p-5 transition-all duration-300 hover:scale-105 ${
            isDarkMode 
              ? 'bg-slate-800/50 backdrop-blur-sm border border-slate-700 hover:border-azure-500/50' 
              : 'bg-white shadow-lg hover:shadow-xl border border-slate-100'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-xs uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Total Stock
                </p>
                <p className={`text-3xl font-bold mt-1 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                  {totalStock}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg">
                <span className="text-2xl">📦</span>
              </div>
            </div>
          </div>

          <div className={`group rounded-2xl p-5 transition-all duration-300 hover:scale-105 ${
            isDarkMode 
              ? 'bg-slate-800/50 backdrop-blur-sm border border-slate-700 hover:border-azure-500/50' 
              : 'bg-white shadow-lg hover:shadow-xl border border-slate-100'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-xs uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Total Points
                </p>
                <p className={`text-3xl font-bold mt-1 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                  {totalPoints.toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                <span className="text-2xl">💎</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          
          {/* Left Side - Rewards List */}
          <div className={`rounded-2xl transition-all duration-500 overflow-hidden ${
            isDarkMode 
              ? 'bg-slate-800/50 backdrop-blur-sm border border-slate-700' 
              : 'bg-white shadow-xl border border-slate-100'
          }`}>
            <div className="p-5 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                    ✨ Reward Collection
                  </h2>
                  <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    Browse and manage your reward items
                  </p>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  isDarkMode ? 'bg-azure-500/20 text-azure-400' : 'bg-azure-100 text-azure-600'
                }`}>
                  {rewards.length} items
                </div>
              </div>
            </div>

            <div className="p-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((item) => (
                    <div key={item} className={`h-32 rounded-xl animate-pulse ${isDarkMode ? 'bg-slate-700/50' : 'bg-slate-100'}`} />
                  ))}
                </div>
              ) : rewards.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-6xl mb-4">🎁</div>
                  <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    No rewards yet. Create your first reward!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {rewards.map((reward) => {
                    const stockStatus = getStockStatus(reward.stock_quantity || 0);
                    return (
                      <div
                        key={reward.id}
                        className={`group relative rounded-xl p-4 transition-all duration-300 cursor-pointer overflow-hidden ${
                          selectedReward?.id === reward.id
                            ? isDarkMode 
                              ? 'bg-gradient-to-r from-azure-500/20 to-teal-500/20 border border-azure-500/50 shadow-lg' 
                              : 'bg-gradient-to-r from-azure-50 to-teal-50 border border-azure-500/30 shadow-md'
                            : isDarkMode 
                              ? 'bg-slate-900/50 border border-slate-700 hover:border-azure-500/30 hover:shadow-lg' 
                              : 'bg-white border border-slate-100 hover:shadow-lg'
                        }`}
                        onClick={() => handleEditReward(reward)}
                      >
                        <div className="relative flex gap-3">
                          {/* Reward Image */}
                          {reward.image_url ? (
                            <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 shadow-md">
                              <img src={reward.image_url} alt={reward.name} className="w-full h-full object-cover" />
                            </div>
                          ) : (
                            <div className={`w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md ${
                              isDarkMode ? 'bg-gradient-to-br from-azure-500/30 to-teal-500/30' : 'bg-gradient-to-br from-azure-100 to-teal-100'
                            }`}>
                              <span className="text-2xl">🎁</span>
                            </div>
                          )}
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <h3 className={`font-bold text-sm ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                                  {reward.name}
                                </h3>
                                <p className={`text-xs mt-0.5 line-clamp-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                  {reward.description || 'No description provided'}
                                </p>
                              </div>
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleDeleteReward(reward.id); }}
                                  className="p-1.5 rounded-lg hover:bg-red-500/10 transition"
                                >
                                  <svg className="w-3.5 h-3.5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                            
                            <div className="flex flex-wrap gap-2 mt-3">
                              <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-gradient-to-r from-azure-500/10 to-teal-500/10 text-azure-600 dark:text-azure-400`}>
                                💰 {reward.points_required} points
                              </span>
                              <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${stockStatus.color}`}>
                                {stockStatus.icon} {stockStatus.label} ({reward.stock_quantity || 0})
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Side - Form */}
          <div className={`rounded-2xl transition-all duration-500 ${
            isDarkMode 
              ? 'bg-slate-800/50 backdrop-blur-sm border border-slate-700' 
              : 'bg-white shadow-xl border border-slate-100'
          }`}>
            <div className="p-5 border-b border-slate-200 dark:border-slate-700">
              <h2 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                {selectedReward ? '✏️ Edit Reward' : '✨ Create New Reward'}
              </h2>
              <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                {selectedReward ? 'Update reward details' : 'Add a new reward to the catalog'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-5">
              {/* Reward Image Upload with Progress Bar */}
              <div>
                <label className={`block text-xs font-semibold mb-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  Reward Image
                </label>
                {!form.image_url ? (
                  <div className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all duration-300 hover:border-teal-500 ${
                    isDarkMode 
                      ? 'border-slate-700 bg-slate-900/50' 
                      : 'border-slate-200 bg-slate-50'
                  }`}>
                    <input type="file" id="rewardImageUpload" accept="image/*" onChange={handleImageSelect} className="hidden" />
                    <label htmlFor="rewardImageUpload" className="cursor-pointer flex flex-col items-center gap-3">
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
                        isDarkMode ? 'bg-teal-500/20' : 'bg-teal-100'
                      }`}>
                        <svg className="w-8 h-8 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className={`text-sm font-medium ${isDarkMode ? 'text-teal-400' : 'text-teal-600'}`}>
                          {uploadingImage ? 'Uploading...' : 'Click to upload image'}
                        </p>
                        <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-400'}`}>
                          PNG, JPG, GIF up to 5MB
                        </p>
                      </div>
                    </label>
                    
                    {/* Upload Progress Bar */}
                    {uploadingImage && uploadProgress > 0 && (
                      <div className="mt-4">
                        <div className="flex justify-between text-xs mb-1">
                          <span className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>
                            Uploading...
                          </span>
                          <span className="text-teal-500 font-semibold">
                            {uploadProgress}%
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-teal-500 to-azure-500 rounded-full transition-all duration-300 ease-out"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="relative rounded-xl overflow-hidden group">
                    <img src={form.image_url} alt="Reward preview" className="w-full h-40 object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        type="button"
                        onClick={removeImage}
                        className="px-4 py-2 rounded-lg bg-red-500 text-white font-medium hover:bg-red-600 transition shadow-lg"
                      >
                        Remove Image
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Reward Name - Required */}
              <div>
                <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  Reward Name <span className="text-red-500 text-base">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="e.g., Stationery Bundle, Gift Card, T-Shirt"
                  className={`w-full rounded-xl border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-teal-500 transition-all ${
                    isDarkMode 
                      ? 'bg-slate-900 border-slate-700 text-white focus:border-transparent' 
                      : 'bg-white border-slate-200 text-slate-800 focus:border-transparent'
                  }`}
                />
                <p className="text-[11px] text-slate-400 mt-1">Required field</p>
              </div>

              {/* Description */}
              <div>
                <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  rows={3}
                  placeholder="Describe the reward and how learners can redeem it..."
                  className={`w-full rounded-xl border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-teal-500 resize-none ${
                    isDarkMode 
                      ? 'bg-slate-900 border-slate-700 text-white' 
                      : 'bg-white border-slate-200 text-slate-800'
                  }`}
                />
              </div>

              {/* Points & Stock Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    Points Required <span className="text-red-500 text-base">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={form.points_required}
                    onChange={(e) => handleChange('points_required', e.target.value)}
                    placeholder="250"
                    className={`w-full rounded-xl border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-teal-500 ${
                      isDarkMode 
                        ? 'bg-slate-900 border-slate-700 text-white' 
                        : 'bg-white border-slate-200 text-slate-800'
                    }`}
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Required field (must be greater than 0)</p>
                </div>

                <div>
                  <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    Stock Quantity
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.stock_quantity}
                    onChange={(e) => handleChange('stock_quantity', e.target.value)}
                    placeholder="10"
                    className={`w-full rounded-xl border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-teal-500 ${
                      isDarkMode 
                        ? 'bg-slate-900 border-slate-700 text-white' 
                        : 'bg-white border-slate-200 text-slate-800'
                    }`}
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Optional (defaults to 0)</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-teal-500 to-teal-600 text-white hover:shadow-lg hover:scale-105 transition-all duration-300 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : (selectedReward ? 'Update Reward' : 'Create Reward')}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-3 rounded-xl text-sm font-medium border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-300"
                >
                  Reset
                </button>
              </div>

              {/* Required Fields Note */}
              <div className="text-xs text-center text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-700">
                <span className="text-red-500">*</span> Required fields must be filled
              </div>
            </form>
          </div>
        </div>
      </main>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out forwards;
        }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { 
          background: ${isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,176,255,0.3)'};
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: ${isDarkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,176,255,0.5)'};
        }
      `}</style>
    </div>
  );
};

export default AdminRewards;