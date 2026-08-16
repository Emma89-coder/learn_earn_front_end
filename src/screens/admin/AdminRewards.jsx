import React, { useState, useEffect, useRef } from 'react';
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
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imageInputMode, setImageInputMode] = useState('upload');
  const [imageUrlInput, setImageUrlInput] = useState('');
  const fileInputRef = useRef(null);
  
  const [imageScale, setImageScale] = useState(1);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeProgress, setResizeProgress] = useState(0);
  const [showResizeControls, setShowResizeControls] = useState(false);
  
  const [form, setForm] = useState({
    name: '',
    description: '',
    points_required: '',
    stock_quantity: '',
    image_url: '',
    image_scale: 1
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
      image_url: '',
      image_scale: 1
    });
    setImagePreview(null);
    setImageFile(null);
    setImageUrlInput('');
    setImageInputMode('upload');
    setImageScale(1);
    setShowResizeControls(false);
  };

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const compressAndResizeImage = (source, scale, maxWidth = 1200, maxHeight = 1200, quality = 0.85) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          let width = Math.round(img.width * scale);
          let height = Math.round(img.height * scale);
          
          if (width > maxWidth) {
            const ratio = maxWidth / width;
            width = maxWidth;
            height = Math.round(height * ratio);
          }
          if (height > maxHeight) {
            const ratio = maxHeight / height;
            height = maxHeight;
            width = Math.round(width * ratio);
          }
          
          canvas.width = width;
          canvas.height = height;
          
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);
          
          const resizedDataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(resizedDataUrl);
        } catch (error) {
          reject(error);
        }
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = source;
    });
  };

  const handleScaleChange = (newScale) => {
    setImageScale(newScale);
    handleChange('image_scale', newScale);
    setShowResizeControls(true);
    toast.success(`Previewing image at ${Math.round(newScale * 100)}%`);
  };

  const saveResizedImage = async () => {
    if (!form.image_url && !imagePreview) {
      toast.error('No image to save');
      return;
    }

    setIsResizing(true);
    setResizeProgress(10);

    try {
      const scale = form.image_scale || imageScale;
      let resizedDataUrl = null;
      let imageSource = null;

      if (imageFile) {
        setResizeProgress(20);
        imageSource = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.onerror = reject;
          reader.readAsDataURL(imageFile);
        });
      } else if (form.image_url && form.image_url.startsWith('data:')) {
        imageSource = form.image_url;
      } else if (imagePreview && imagePreview.startsWith('data:')) {
        imageSource = imagePreview;
      } else if (form.image_url && form.image_url.startsWith('http')) {
        setResizeProgress(20);
        try {
          const response = await fetch(form.image_url, {
            mode: 'cors',
            headers: { 'Accept': 'image/*' }
          });
          if (!response.ok) throw new Error('Failed to fetch image');
          const blob = await response.blob();
          imageSource = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        } catch (fetchError) {
          imageSource = form.image_url;
        }
      }

      if (!imageSource) {
        throw new Error('No image source found');
      }

      setResizeProgress(40);

      const quality = scale <= 1 ? 0.92 : 0.85;
      resizedDataUrl = await compressAndResizeImage(imageSource, scale, 1200, 1200, quality);
      
      setResizeProgress(70);
      
      handleChange('image_url', resizedDataUrl);
      setImagePreview(resizedDataUrl);
      
      const token = localStorage.getItem('token');
      const payload = {
        name: form.name.trim(),
        description: form.description?.trim() || '',
        points_required: Number(form.points_required),
        stock_quantity: Number(form.stock_quantity) || 0,
        image_url: resizedDataUrl,
        image_scale: scale,
        is_active: true
      };

      setResizeProgress(80);

      let response;
      if (selectedReward) {
        response = await axios.post(
          `${API_URL}/api/admin/update-reward/${selectedReward.id}`,
          payload,
          { 
            headers: { 
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            } 
          }
        );
      } else {
        response = await axios.post(
          `${API_URL}/api/admin/create-reward`,
          payload,
          { 
            headers: { 
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            } 
          }
        );
      }

      setResizeProgress(100);
      toast.success(`Image resized and saved successfully! Scale: ${Math.round(scale * 100)}%`);
      
      fetchRewards();
      
      setTimeout(() => {
        setIsResizing(false);
        setResizeProgress(0);
        setShowResizeControls(false);
      }, 1500);
      
    } catch (error) {
      console.error('Error saving resized image:', error);
      
      if (error.response && error.response.status === 403) {
        toast.error('Permission denied. Please check your authentication and try again.');
      } else if (error.response && error.response.status === 413) {
        toast.error('Image is too large. Please try a smaller image or reduce the scale.');
      } else {
        toast.error('Failed to save resized image. Please try again with a smaller image.');
      }
      
      setIsResizing(false);
      setResizeProgress(0);
    }
  };

  const saveResizedImageViaUpload = async () => {
    if (!imageFile) {
      toast.error('Please upload an image file first');
      return;
    }

    setIsResizing(true);
    setResizeProgress(10);

    try {
      const scale = form.image_scale || imageScale;
      
      setResizeProgress(20);
      const resizedDataUrl = await compressAndResizeImage(
        await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.onerror = reject;
          reader.readAsDataURL(imageFile);
        }),
        scale,
        1200,
        1200,
        0.88
      );
      
      setResizeProgress(50);
      
      const response = await fetch(resizedDataUrl);
      const blob = await response.blob();
      const file = new File([blob], 'resized-image.jpg', { type: 'image/jpeg' });
      
      const formData = new FormData();
      formData.append('image', file);
      
      const token = localStorage.getItem('token');
      const uploadResponse = await axios.post(`${API_URL}/api/admin/upload-image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });
      
      if (!uploadResponse.data.success) {
        throw new Error('Failed to upload resized image');
      }
      
      setResizeProgress(70);
      
      const imageUrl = uploadResponse.data.imageUrl;
      handleChange('image_url', imageUrl);
      setImagePreview(imageUrl);
      
      const payload = {
        name: form.name.trim(),
        description: form.description?.trim() || '',
        points_required: Number(form.points_required),
        stock_quantity: Number(form.stock_quantity) || 0,
        image_url: imageUrl,
        image_scale: scale,
        is_active: true
      };

      setResizeProgress(80);

      let saveResponse;
      if (selectedReward) {
        saveResponse = await axios.post(
          `${API_URL}/api/admin/update-reward/${selectedReward.id}`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        saveResponse = await axios.post(
          `${API_URL}/api/admin/create-reward`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      setResizeProgress(100);
      toast.success(`Image resized and saved successfully! Scale: ${Math.round(scale * 100)}%`);
      
      fetchRewards();
      
      setTimeout(() => {
        setIsResizing(false);
        setResizeProgress(0);
        setShowResizeControls(false);
      }, 1500);
      
    } catch (error) {
      console.error('Error saving resized image via upload:', error);
      toast.error('Failed to save resized image. Please try again.');
      setIsResizing(false);
      setResizeProgress(0);
    }
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
        handleChange('image_scale', 1);
        setImageScale(1);
        setImagePreview(response.data.imageUrl);
        toast.success('Image uploaded successfully!');
        setTimeout(() => setUploadProgress(0), 1500);
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image');
      setUploadProgress(0);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleFileSelect = (e) => {
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
    
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target.result);
    };
    reader.readAsDataURL(file);
    
    uploadRewardImage(file);
  };

  const handlePasteImageUrl = () => {
    if (!imageUrlInput.trim()) {
      toast.error('Please enter an image URL');
      return;
    }
    
    try {
      new URL(imageUrlInput);
      handleChange('image_url', imageUrlInput);
      handleChange('image_scale', 1);
      setImageScale(1);
      setImagePreview(imageUrlInput);
      toast.success('Image URL applied successfully!');
      setImageUrlInput('');
    } catch (error) {
      toast.error('Please enter a valid image URL');
    }
  };

  const removeImage = () => {
    handleChange('image_url', '');
    handleChange('image_scale', 1);
    setImagePreview(null);
    setImageFile(null);
    setImageUrlInput('');
    setImageScale(1);
    setShowResizeControls(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    toast.success('Image removed');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

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
        points_required: pointsNum,
        stock_quantity: Number(form.stock_quantity) || 0,
        image_url: form.image_url?.trim() || null,
        image_scale: form.image_scale || 1,
        is_active: true
      };

      let response;
      if (selectedReward) {
        response = await axios.post(
          `${API_URL}/api/admin/update-reward/${selectedReward.id}`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Reward updated successfully!');
      } else {
        response = await axios.post(
          `${API_URL}/api/admin/create-reward`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Reward created successfully!');
      }

      resetForm();
      fetchRewards();
    } catch (error) {
      console.error('Save reward error:', error);
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          'Could not save reward. Please try again.';
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleEditReward = (reward) => {
    setSelectedReward(reward);
    setForm({
      name: reward.name || '',
      description: reward.description || '',
      points_required: reward.points_required?.toString() || '',
      stock_quantity: reward.stock_quantity?.toString() || '',
      image_url: reward.image_url || '',
      image_scale: reward.image_scale || 1
    });
    if (reward.image_url) {
      setImagePreview(reward.image_url);
      setImageScale(reward.image_scale || 1);
    } else {
      setImagePreview(null);
      setImageScale(1);
    }
    setImageFile(null);
    setImageUrlInput('');
  };

  const handleDeleteReward = async (rewardId) => {
    if (!window.confirm('Delete this reward? This action cannot be undone.')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/api/admin/delete-reward/${rewardId}`, {
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
    if (stock === 0) return { label: 'Out of Stock', color: 'bg-red-500/10 text-red-500' };
    if (stock < 10) return { label: 'Low Stock', color: 'bg-amber-500/10 text-amber-500' };
    return { label: 'In Stock', color: 'bg-emerald-500/10 text-emerald-500' };
  };

  const totalPoints = rewards.reduce((sum, r) => sum + (Number(r.points_required) || 0), 0);
  const totalStock = rewards.reduce((sum, r) => sum + (Number(r.stock_quantity) || 0), 0);

  return (
    <div className={`min-h-screen transition-all duration-500 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' 
        : 'bg-gradient-to-br from-slate-50 via-white to-slate-50'
    }`}>
      
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
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                  </svg>
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
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                Dashboard
              </button>
              
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
                        <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Smaller Stat Cards - No Icons */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          <div className={`rounded-lg px-3 py-2 transition-all duration-300 ${
            isDarkMode 
              ? 'bg-slate-800/50 backdrop-blur-sm border border-slate-700' 
              : 'bg-white shadow-md border border-slate-100'
          }`}>
            <p className={`text-[9px] uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Total Rewards
            </p>
            <p className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
              {rewards.length}
            </p>
          </div>

          <div className={`rounded-lg px-3 py-2 transition-all duration-300 ${
            isDarkMode 
              ? 'bg-slate-800/50 backdrop-blur-sm border border-slate-700' 
              : 'bg-white shadow-md border border-slate-100'
          }`}>
            <p className={`text-[9px] uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Total Stock
            </p>
            <p className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
              {totalStock}
            </p>
          </div>

          <div className={`rounded-lg px-3 py-2 transition-all duration-300 ${
            isDarkMode 
              ? 'bg-slate-800/50 backdrop-blur-sm border border-slate-700' 
              : 'bg-white shadow-md border border-slate-100'
          }`}>
            <p className={`text-[9px] uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Total Points
            </p>
            <p className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
              {totalPoints.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          
          <div className={`rounded-2xl transition-all duration-500 overflow-hidden ${
            isDarkMode 
              ? 'bg-slate-800/50 backdrop-blur-sm border border-slate-700' 
              : 'bg-white shadow-xl border border-slate-100'
          }`}>
            <div className="p-4 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className={`text-base font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                    Reward Collection
                  </h2>
                  <p className={`text-[11px] mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    Browse and manage your reward items
                  </p>
                </div>
                <div className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                  isDarkMode ? 'bg-azure-500/20 text-azure-400' : 'bg-azure-100 text-azure-600'
                }`}>
                  {rewards.length} items
                </div>
              </div>
            </div>

            <div className="p-3 max-h-[60vh] overflow-y-auto custom-scrollbar">
              {loading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((item) => (
                    <div key={item} className={`h-28 rounded-xl animate-pulse ${isDarkMode ? 'bg-slate-700/50' : 'bg-slate-100'}`} />
                  ))}
                </div>
              ) : rewards.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                  </svg>
                  <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    No rewards yet. Create your first reward!
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {rewards.map((reward) => {
                    const stockStatus = getStockStatus(reward.stock_quantity || 0);
                    return (
                      <div
                        key={reward.id}
                        className={`group relative rounded-xl p-3 transition-all duration-300 cursor-pointer overflow-hidden ${
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
                          {reward.image_url ? (
                            <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 shadow-md">
                              <img 
                                src={reward.image_url} 
                                alt={reward.name} 
                                className="w-full h-full object-cover"
                                style={{
                                  transform: `scale(${reward.image_scale || 1})`,
                                  transformOrigin: 'center center'
                                }}
                              />
                              {reward.image_scale && reward.image_scale !== 1 && (
                                <div className="absolute top-0 right-0 bg-black/60 text-white text-[7px] px-1 py-0.5 rounded-bl-md">
                                  {Math.round((reward.image_scale || 1) * 100)}%
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md ${
                              isDarkMode ? 'bg-gradient-to-br from-azure-500/30 to-teal-500/30' : 'bg-gradient-to-br from-azure-100 to-teal-100'
                            }`}>
                              <svg className="w-7 h-7 text-azure-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                              </svg>
                            </div>
                          )}
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <h3 className={`font-bold text-sm ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                                  {reward.name}
                                </h3>
                                <p className={`text-[11px] mt-0.5 line-clamp-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                  {reward.description || 'No description provided'}
                                </p>
                              </div>
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleDeleteReward(reward.id); }}
                                  className="p-1 rounded-lg hover:bg-red-500/10 transition"
                                >
                                  <svg className="w-3.5 h-3.5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                            
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-gradient-to-r from-azure-500/10 to-teal-500/10 text-azure-600 dark:text-azure-400`}>
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v1m0 1v1m0 1v1m0 1v1M6 12a6 6 0 1012 0 6 6 0 00-12 0z" />
                                </svg>
                                {reward.points_required} points
                              </span>
                              <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full ${stockStatus.color}`}>
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                                {stockStatus.label} ({reward.stock_quantity || 0})
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

          <div className={`rounded-2xl transition-all duration-500 ${
            isDarkMode 
              ? 'bg-slate-800/50 backdrop-blur-sm border border-slate-700' 
              : 'bg-white shadow-xl border border-slate-100'
          }`}>
            <div className="p-4 border-b border-slate-200 dark:border-slate-700">
              <h2 className={`text-base font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                {selectedReward ? 'Edit Reward' : 'Create New Reward'}
              </h2>
              <p className={`text-[11px] mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                {selectedReward ? 'Update reward details' : 'Add a new reward to the catalog'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className={`block text-xs font-semibold mb-1.5 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  Gift Image
                </label>
                
                {!form.image_url && !imagePreview ? (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setImageInputMode('upload')}
                        className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          imageInputMode === 'upload'
                            ? 'bg-teal-500 text-white'
                            : isDarkMode
                              ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        <svg className="w-3 h-3 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Upload
                      </button>
                      <button
                        type="button"
                        onClick={() => setImageInputMode('paste')}
                        className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          imageInputMode === 'paste'
                            ? 'bg-teal-500 text-white'
                            : isDarkMode
                              ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        <svg className="w-3 h-3 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                        URL
                      </button>
                    </div>

                    {imageInputMode === 'upload' && (
                      <div 
                        className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all duration-300 cursor-pointer hover:border-teal-500 ${
                          isDarkMode 
                            ? 'border-slate-700 bg-slate-900/50 hover:bg-slate-800/50' 
                            : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                        }`}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <input 
                          type="file" 
                          ref={fileInputRef}
                          accept="image/*" 
                          onChange={handleFileSelect} 
                          className="hidden" 
                        />
                        <div className="flex flex-col items-center gap-2">
                          <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 ${
                            isDarkMode ? 'bg-teal-500/20' : 'bg-teal-100'
                          }`}>
                            <svg className="w-7 h-7 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div>
                            <p className={`text-xs font-medium ${isDarkMode ? 'text-teal-400' : 'text-teal-600'}`}>
                              {uploadingImage ? 'Uploading...' : 'Click to upload image'}
                            </p>
                            <p className={`text-[10px] mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-400'}`}>
                              PNG, JPG, GIF up to 5MB
                            </p>
                          </div>
                        </div>
                        
                        {uploadingImage && uploadProgress > 0 && (
                          <div className="mt-3">
                            <div className="flex justify-between text-[10px] mb-0.5">
                              <span className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>
                                Uploading...
                              </span>
                              <span className="text-teal-500 font-semibold">
                                {uploadProgress}%
                              </span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-teal-500 to-azure-500 rounded-full transition-all duration-300 ease-out"
                                style={{ width: `${uploadProgress}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {imageInputMode === 'paste' && (
                      <div className={`p-3 rounded-xl border ${
                        isDarkMode ? 'border-slate-700 bg-slate-900/50' : 'border-slate-200 bg-slate-50'
                      }`}>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={imageUrlInput}
                            onChange={(e) => setImageUrlInput(e.target.value)}
                            placeholder="Paste image URL here..."
                            className={`flex-1 rounded-lg border px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-teal-500 ${
                              isDarkMode 
                                ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500' 
                                : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400'
                            }`}
                          />
                          <button
                            type="button"
                            onClick={handlePasteImageUrl}
                            className="px-3 py-2 rounded-lg bg-teal-500 text-white text-xs font-medium hover:bg-teal-600 transition shadow-md"
                          >
                            Apply
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="relative rounded-xl overflow-hidden group border-2 border-teal-500/30">
                      <div className="relative">
                        <img 
                          src={form.image_url || imagePreview} 
                          alt="Gift preview" 
                          className="reward-image-preview w-full h-48 object-contain bg-slate-100 dark:bg-slate-900 transition-all duration-300"
                          style={{
                            transform: `scale(${imageScale || 1})`,
                            transformOrigin: 'center center'
                          }}
                          onError={(e) => {
                            e.target.style.display = 'none';
                            const parent = e.target.parentElement;
                            if (parent) {
                              parent.innerHTML = '<div class="w-full h-48 flex items-center justify-center text-5xl bg-slate-100 dark:bg-slate-900">🎁</div>';
                            }
                          }}
                        />
                        <div className="absolute top-2 right-2 flex gap-1.5">
                          <span className="px-2 py-0.5 bg-black/70 text-white text-[10px] rounded-full flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                            </svg>
                            {imageScale !== 1 && (
                              <span className="bg-teal-500 px-1 py-0.5 rounded text-[8px]">
                                {Math.round((imageScale || 1) * 100)}%
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                      <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowResizeControls(!showResizeControls);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-blue-500 text-white text-[10px] font-medium hover:bg-blue-600 transition shadow-lg flex items-center gap-1"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
                          </svg>
                          Resize
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeImage();
                          }}
                          className="px-2.5 py-1 rounded-lg bg-red-500 text-white text-[10px] font-medium hover:bg-red-600 transition shadow-lg flex items-center gap-1"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Remove
                        </button>
                      </div>
                    </div>

                    {showResizeControls && (
                      <div className={`p-3 rounded-xl border ${
                        isDarkMode 
                          ? 'border-teal-500/30 bg-teal-500/10' 
                          : 'border-teal-300 bg-teal-50'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className={`text-xs font-semibold ${isDarkMode ? 'text-teal-400' : 'text-teal-700'}`}>
                            Image Size Control
                          </h4>
                          <span className={`text-xs font-bold ${isDarkMode ? 'text-teal-400' : 'text-teal-700'}`}>
                            {Math.round((imageScale || 1) * 100)}%
                          </span>
                        </div>
                        
                        <input
                          type="range"
                          min="0.25"
                          max="3"
                          step="0.05"
                          value={imageScale || 1}
                          onChange={(e) => {
                            const newScale = parseFloat(e.target.value);
                            setImageScale(newScale);
                            handleChange('image_scale', newScale);
                          }}
                          className="w-full h-1.5 bg-teal-200 dark:bg-teal-800 rounded-lg appearance-none cursor-pointer"
                          style={{
                            background: `linear-gradient(to right, #14b8a6 0%, #14b8a6 ${((imageScale - 0.25) / 2.75) * 100}%, #e2e8f0 ${((imageScale - 0.25) / 2.75) * 100}%, #e2e8f0 100%)`
                          }}
                        />
                        
                        <div className="flex justify-between text-[9px] text-slate-400 mt-0.5">
                          <span>25%</span>
                          <span>100%</span>
                          <span>300%</span>
                        </div>

                        <div className="flex gap-1.5 mt-2 flex-wrap">
                          {[0.5, 0.75, 1, 1.25, 1.5, 2].map((scale) => (
                            <button
                              key={scale}
                              type="button"
                              onClick={() => handleScaleChange(scale)}
                              className={`px-1.5 py-0.5 rounded text-[9px] font-medium transition-all ${
                                imageScale === scale
                                  ? 'bg-teal-500 text-white'
                                  : isDarkMode
                                    ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                    : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                              }`}
                            >
                              {Math.round(scale * 100)}%
                            </button>
                          ))}
                        </div>

                        <div className="flex gap-1.5 mt-2">
                          <button
                            type="button"
                            onClick={saveResizedImage}
                            disabled={isResizing}
                            className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
                              isResizing
                                ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                                : 'bg-gradient-to-r from-teal-500 to-azure-500 text-white hover:shadow-lg hover:scale-105'
                            }`}
                          >
                            {isResizing ? (
                              <>
                                <svg className="w-3.5 h-3.5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                {resizeProgress}%
                              </>
                            ) : (
                              <>
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                Save
                              </>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowResizeControls(false);
                              setImageScale(form.image_scale || 1);
                            }}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                          >
                            Close
                          </button>
                        </div>

                        {resizeProgress > 0 && resizeProgress < 100 && (
                          <div className="mt-2">
                            <div className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-teal-500 to-azure-500 rounded-full transition-all duration-300"
                                style={{ width: `${resizeProgress}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  Reward Name <span className="text-red-500 text-xs">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="e.g., Stationery Bundle"
                  className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-500 transition-all ${
                    isDarkMode 
                      ? 'bg-slate-900 border-slate-700 text-white focus:border-transparent' 
                      : 'bg-white border-slate-200 text-slate-800 focus:border-transparent'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  rows={2}
                  placeholder="Describe the gift..."
                  className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-500 resize-none ${
                    isDarkMode 
                      ? 'bg-slate-900 border-slate-700 text-white' 
                      : 'bg-white border-slate-200 text-slate-800'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-semibold mb-1 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    Points <span className="text-red-500 text-xs">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={form.points_required}
                    onChange={(e) => handleChange('points_required', e.target.value)}
                    placeholder="250"
                    className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-500 ${
                      isDarkMode 
                        ? 'bg-slate-900 border-slate-700 text-white' 
                        : 'bg-white border-slate-200 text-slate-800'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-xs font-semibold mb-1 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    Stock
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.stock_quantity}
                    onChange={(e) => handleChange('stock_quantity', e.target.value)}
                    placeholder="10"
                    className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-500 ${
                      isDarkMode 
                        ? 'bg-slate-900 border-slate-700 text-white' 
                        : 'bg-white border-slate-200 text-slate-800'
                    }`}
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-teal-500 to-teal-600 text-white hover:shadow-lg hover:scale-105 transition-all duration-300 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : (selectedReward ? 'Update' : 'Create')}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 rounded-lg text-sm font-medium border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-300"
                >
                  Reset
                </button>
              </div>

              <div className="text-[10px] text-center text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-700">
                <span className="text-red-500">*</span> Required fields
              </div>
            </form>
          </div>
        </div>
      </main>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out forwards;
        }
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
          background: ${isDarkMode ? '#334155' : '#cbd5e1'};
          border-radius: 2px;
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #14b8a6;
          cursor: pointer;
        }
        input[type="range"]::-moz-range-thumb {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #14b8a6;
          cursor: pointer;
          border: none;
        }
      `}</style>
    </div>
  );
};

export default AdminRewards;