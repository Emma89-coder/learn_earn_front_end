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
  const [adminTab, setAdminTab] = useState('rewards');
  const [redemptions, setRedemptions] = useState([]);
  const [loadingRedemptions, setLoadingRedemptions] = useState(false);
  const [redemptionFilter, setRedemptionFilter] = useState('all');
  const [redemptionSummary, setRedemptionSummary] = useState({ 
    total_redemptions: 0, 
    total_points_spent: 0, 
    total_refunded: 0, 
    total_collected: 0, 
    total_pending: 0 
  });
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

  // State for refund confirmation dialog
  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const [refundTarget, setRefundTarget] = useState(null);
  const [refundingAll, setRefundingAll] = useState(false);

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

  const fetchRedemptions = async () => {
    try {
      setLoadingRedemptions(true);
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/api/admin/redemptions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('📋 All redemptions from API:', res.data.redemptions);
      
      if (res.data.success) {
        const allRedemptions = res.data.redemptions || [];
        
        // CRITICAL FIX: Filter out ANY redemption with status 'refunded'
        const activeRedemptions = allRedemptions.filter(r => {
          // Check multiple possible status values
          const status = (r.status || '').toLowerCase();
          const isRefunded = status === 'refunded' || status === 'refund';
          
          // Also check if there's a refunded_at timestamp
          const hasRefundedAt = r.refunded_at !== null && r.refunded_at !== undefined && r.refunded_at !== '';
          
          // Keep only non-refunded redemptions
          return !isRefunded && !hasRefundedAt;
        });
        
        console.log('📋 Active redemptions (after filtering):', activeRedemptions.length);
        console.log('📋 Refunded redemptions removed:', allRedemptions.length - activeRedemptions.length);
        
        // Log the IDs of refunded redemptions that were removed
        const refundedIds = allRedemptions
          .filter(r => {
            const status = (r.status || '').toLowerCase();
            return status === 'refunded' || status === 'refund' || (r.refunded_at !== null && r.refunded_at !== undefined && r.refunded_at !== '');
          })
          .map(r => r.id);
        console.log('📋 Refunded IDs removed:', refundedIds);
        
        setRedemptions(activeRedemptions);
        
        // Calculate summary
        const summary = {
          total_redemptions: activeRedemptions.length,
          total_points_spent: activeRedemptions.reduce((sum, r) => sum + (r.points_spent || 0), 0),
          total_refunded: allRedemptions.filter(r => {
            const status = (r.status || '').toLowerCase();
            return status === 'refunded' || status === 'refund' || (r.refunded_at !== null && r.refunded_at !== undefined && r.refunded_at !== '');
          }).length,
          total_collected: activeRedemptions.filter(r => r.collected === true).length,
          total_pending: activeRedemptions.filter(r => r.collected !== true).length,
        };
        setRedemptionSummary(summary);
      }
    } catch (error) {
      console.error('Fetch redemptions error:', error);
      toast.error('Failed to load redemptions');
    } finally {
      setLoadingRedemptions(false);
    }
  };

  const toggleCollected = async (redemptionId, currentStatus) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(`${API_URL}/api/admin/redemptions/${redemptionId}/collected`, {
        collected: !currentStatus
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setRedemptions(prev => prev.map(r =>
          r.id === redemptionId
            ? { ...r, collected: !currentStatus, collected_at: !currentStatus ? new Date().toISOString() : null }
            : r
        ));
        toast.success(!currentStatus ? 'Marked as collected' : 'Marked as not collected');
        // Refresh summary
        fetchRedemptions();
      }
    } catch (error) {
      console.error('Toggle collected error:', error);
      toast.error('Failed to update');
    }
  };

  const handleRefund = async (redemptionId, rewardName, points) => {
    setRefundTarget({ id: redemptionId, name: rewardName, points });
    setShowRefundDialog(true);
  };

  const confirmRefund = async () => {
    if (!refundTarget) return;
    
    const { id, name, points } = refundTarget;
    
    try {
      setLoadingRedemptions(true);
      const token = localStorage.getItem('token');
      const res = await axios.post(
        `${API_URL}/api/admin/redemptions/${id}/refund`, 
        {}, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log('📋 Refund response:', res.data);
      
      if (res.data.success) {
        // CRITICAL FIX: Filter out the refunded redemption from state
        setRedemptions(prevRedemptions => {
          const filtered = prevRedemptions.filter(r => r.id !== id);
          console.log('📋 Removed refunded redemption. Remaining:', filtered.length);
          return filtered;
        });
        
        // Update summary immediately
        setRedemptionSummary(prev => {
          const newSummary = {
            ...prev,
            total_redemptions: Math.max(0, prev.total_redemptions - 1),
            total_refunded: prev.total_refunded + 1,
            total_points_spent: Math.max(0, prev.total_points_spent - (points || 0)),
            total_pending: Math.max(0, prev.total_pending - 1)
          };
          console.log('📋 Updated summary:', newSummary);
          return newSummary;
        });
        
        toast.success(res.data.message || `Refunded ${points} points for "${name}" - Voucher removed from list`);
        
        // Force a complete refresh after a short delay to ensure consistency
        setTimeout(() => {
          console.log('🔄 Forcing refresh after refund...');
          fetchRedemptions();
          fetchRewards();
        }, 300);
        
      } else {
        toast.error(res.data.error || 'Refund failed');
      }
    } catch (error) {
      console.error('Refund error:', error);
      const errorMsg = error.response?.data?.error || 'Failed to process refund';
      toast.error(errorMsg);
    } finally {
      setShowRefundDialog(false);
      setRefundTarget(null);
      setLoadingRedemptions(false);
    }
  };

  const [showRefundAllDialog, setShowRefundAllDialog] = useState(false);
  const [refundAllCount, setRefundAllCount] = useState(0);

  const handleRefundAll = () => {
    // Only refund pending (not collected) redemptions
    const pendingIds = redemptions.filter(r => !r.collected && r.status !== 'refunded').map(r => r.id);
    const pendingCount = pendingIds.length;
    
    if (pendingCount === 0) {
      toast.error('No pending redemptions to refund');
      return;
    }
    
    setRefundAllCount(pendingCount);
    setShowRefundAllDialog(true);
  };

  const confirmRefundAll = async () => {
    setShowRefundAllDialog(false);
    setRefundingAll(true);

    try {
      setLoadingRedemptions(true);
      const token = localStorage.getItem('token');
      const res = await axios.post(
        `${API_URL}/api/admin/redemptions/refund-all`, 
        {}, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log('📋 Refund all response:', res.data);
      
      if (res.data.success) {
        // CRITICAL FIX: Remove ALL pending redemptions from the list, keep only collected ones
        setRedemptions(prev => {
          const remaining = prev.filter(r => r.collected === true);
          console.log('📋 Removed all pending redemptions. Remaining (collected only):', remaining.length);
          return remaining;
        });
        
        // Update summary
        setRedemptionSummary(prev => {
          const remainingCount = prev.total_redemptions - refundAllCount;
          return {
            ...prev,
            total_redemptions: Math.max(0, remainingCount),
            total_refunded: prev.total_refunded + refundAllCount,
            total_pending: 0,
            total_points_spent: prev.total_points_spent - prev.total_points_spent
          };
        });
        
        toast.success(res.data.message || `Successfully refunded ${res.data.refund_count || refundAllCount} redemptions - Vouchers removed from list`);
        
        // Force refresh
        setTimeout(() => {
          console.log('🔄 Forcing refresh after refund all...');
          fetchRedemptions();
          fetchRewards();
        }, 300);
      } else {
        toast.error(res.data.error || 'Refund all failed');
      }
    } catch (error) {
      console.error('Refund all error:', error);
      const errorMsg = error.response?.data?.error || 'Failed to refund all';
      toast.error(errorMsg);
    } finally {
      setRefundingAll(false);
      setLoadingRedemptions(false);
    }
  };

  // Reset form
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

  const getStockStatus = (stock) => {
    if (stock === 0) return { label: 'Out of Stock', color: 'bg-red-500/10 text-red-500' };
    if (stock < 10) return { label: 'Low Stock', color: 'bg-amber-500/10 text-amber-500' };
    return { label: 'In Stock', color: 'bg-emerald-500/10 text-emerald-500' };
  };

  const totalPoints = rewards.reduce((sum, r) => sum + (Number(r.points_required) || 0), 0);
  const totalStock = rewards.reduce((sum, r) => sum + (Number(r.stock_quantity) || 0), 0);

  // Refund Confirmation Dialog
  const RefundDialog = () => {
    if (!showRefundDialog || !refundTarget) return null;
    
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className={`max-w-md w-full rounded-2xl p-6 shadow-2xl border-2 ${
          isDarkMode 
            ? 'bg-slate-800 border-teal-400' 
            : 'bg-white border-teal-500'
        }`}>
          <h3 className={`text-lg font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-[#19475B]'}`}>
            Confirm Refund
          </h3>
          <p className={`text-sm mb-4 ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>
            Are you sure you want to refund <strong>{refundTarget.points}</strong> points for 
            "<strong>{refundTarget.name}</strong>"?
          </p>
          <div className={`p-3 rounded-lg mb-4 ${isDarkMode ? 'bg-amber-500/10' : 'bg-amber-50'} border border-amber-500/30`}>
            <p className={`text-xs ${isDarkMode ? 'text-amber-300' : 'text-amber-700'}`}>
              ⚠️ This will return the points to the learner's balance and <strong>permanently remove</strong> this voucher from both admin and learner views.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setShowRefundDialog(false);
                setRefundTarget(null);
              }}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition border-2 ${
                isDarkMode 
                  ? 'border-slate-600 text-slate-300 hover:bg-slate-700' 
                  : 'border-gray-300 text-gray-600 hover:bg-gray-100'
              }`}
            >
              Cancel
            </button>
            <button
              onClick={confirmRefund}
              className="flex-1 px-4 py-2 rounded-lg text-sm font-bold bg-red-500 text-white hover:bg-red-600 transition shadow-md"
            >
              Yes, Refund & Remove
            </button>
          </div>
        </div>
      </div>
    );
  };

  const RefundAllDialog = () => {
    if (!showRefundAllDialog) return null;
    
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className={`max-w-md w-full rounded-2xl p-6 shadow-2xl border-2 ${
          isDarkMode 
            ? 'bg-slate-800 border-teal-400' 
            : 'bg-white border-teal-500'
        }`}>
          <h3 className={`text-lg font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-[#19475B]'}`}>
            Refund All Pending Redemptions
          </h3>
          <p className={`text-sm mb-4 ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>
            Refund ALL <strong>{refundAllCount}</strong> pending redemptions? This will return all points to the learners and remove the vouchers.
          </p>
          <div className={`p-3 rounded-lg mb-4 ${isDarkMode ? 'bg-red-500/10' : 'bg-red-50'} border border-red-500/30`}>
            <p className={`text-xs ${isDarkMode ? 'text-red-300' : 'text-red-700'}`}>
              ⚠️ This action cannot be undone. All pending vouchers will be permanently revoked and points will be returned to each learner.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowRefundAllDialog(false)}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition border-2 ${
                isDarkMode 
                  ? 'border-slate-600 text-slate-300 hover:bg-slate-700' 
                  : 'border-gray-300 text-gray-600 hover:bg-gray-100'
              }`}
            >
              Cancel
            </button>
            <button
              onClick={confirmRefundAll}
              className="flex-1 px-4 py-2 rounded-lg text-sm font-bold bg-red-500 text-white hover:bg-red-600 transition shadow-md"
            >
              Yes, Refund All ({refundAllCount})
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`min-h-screen w-full max-w-full transition-all duration-500 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' 
        : 'bg-gradient-to-br from-slate-50 via-white to-slate-50'
    }`}>
      
      <main className="w-full px-0 sm:px-0 lg:px-0 py-4 max-w-full">        
        {/* Stat Cards */}
        <div className="grid grid-cols-3 gap-2 mb-5 w-full">
          <div className={`rounded-lg px-3 py-2 transition-all duration-300 border-2 ${
            isDarkMode 
              ? 'bg-blue-900/30 backdrop-blur-sm border-teal-400' 
              : 'bg-blue-50 border-teal-500 shadow-md'
          }`}>
            <p className={`text-[9px] uppercase tracking-wider ${
              isDarkMode ? 'text-blue-300' : 'text-[#19475B]'
            }`}>
              Total Rewards
            </p>
            <p className={`text-lg font-bold ${
              isDarkMode ? 'text-blue-200' : 'text-[#19475B]'
            }`}>
              {rewards.length}
            </p>
          </div>

          <div className={`rounded-lg px-3 py-2 transition-all duration-300 border-2 ${
            isDarkMode 
              ? 'bg-emerald-900/30 backdrop-blur-sm border-teal-400' 
              : 'bg-emerald-50 border-teal-500 shadow-md'
          }`}>
            <p className={`text-[9px] uppercase tracking-wider ${
              isDarkMode ? 'text-emerald-300' : 'text-[#19475B]'
            }`}>
              Total Stock
            </p>
            <p className={`text-lg font-bold ${
              isDarkMode ? 'text-emerald-200' : 'text-[#19475B]'
            }`}>
              {totalStock}
            </p>
          </div>

          <div className={`rounded-lg px-3 py-2 transition-all duration-300 border-2 ${
            isDarkMode 
              ? 'bg-purple-900/30 backdrop-blur-sm border-teal-400' 
              : 'bg-purple-50 border-teal-500 shadow-md'
          }`}>
            <p className={`text-[9px] uppercase tracking-wider ${
              isDarkMode ? 'text-purple-300' : 'text-[#19475B]'
            }`}>
              Total Points
            </p>
            <p className={`text-lg font-bold ${
              isDarkMode ? 'text-purple-200' : 'text-[#19475B]'
            }`}>
              {totalPoints.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-2 mb-5">
          <button
            onClick={() => setAdminTab('rewards')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              adminTab === 'rewards'
                ? 'bg-teal-500 text-white shadow-md'
                : isDarkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            🎁 Manage Rewards
          </button>
          <button
            onClick={() => { setAdminTab('redemptions'); fetchRedemptions(); }}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
              adminTab === 'redemptions'
                ? 'bg-teal-500 text-white shadow-md'
                : isDarkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            🎟️ Active Redemptions
            {redemptions.length > 0 && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                adminTab === 'redemptions' ? 'bg-white/30 text-white' : 'bg-teal-100 text-teal-700'
              }`}>{redemptions.length}</span>
            )}
          </button>
        </div>

        {/* ── REDEMPTIONS TAB ── */}
        {adminTab === 'redemptions' && (
          <div className={`rounded-2xl border-2 overflow-hidden ${isDarkMode ? 'bg-slate-800/50 border-teal-400' : 'bg-white border-teal-500 shadow-xl'}`}>
            <div className={`p-4 border-b ${isDarkMode ? 'border-teal-400/30 bg-slate-900/30' : 'border-teal-100 bg-teal-50'}`}>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h2 className={`text-base font-bold ${isDarkMode ? 'text-teal-300' : 'text-[#19475B]'}`}>
                    Active Redemptions
                  </h2>
                  <p className={`text-[11px] mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                    Refunded vouchers are automatically removed
                  </p>
                </div>
                <div className="flex gap-1.5 items-center flex-wrap">
                  {[
                    { id: 'all', label: 'All' },
                    { id: 'pending', label: '⏳ Pending' },
                    { id: 'collected', label: '✓ Collected' },
                  ].map(f => (
                    <button key={f.id}
                      onClick={() => setRedemptionFilter(f.id)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                        redemptionFilter === f.id
                          ? 'bg-teal-500 text-white'
                          : isDarkMode ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >{f.label}</button>
                  ))}
                  <button
                    onClick={handleRefundAll}
                    disabled={refundingAll || redemptions.filter(r => !r.collected).length === 0}
                    className={`px-3 py-1 rounded-lg text-xs font-bold bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition ml-2 ${
                      refundingAll || redemptions.filter(r => !r.collected).length === 0 ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {refundingAll ? '⏳ Processing...' : `Refund All (${redemptions.filter(r => !r.collected).length})`}
                  </button>
                </div>
              </div>

              {/* Summary stats */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-3">
                <div className={`p-2 rounded-lg text-center ${isDarkMode ? 'bg-slate-800' : 'bg-white border border-gray-100'}`}>
                  <p className={`text-lg font-black ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{redemptionSummary.total_redemptions}</p>
                  <p className={`text-[10px] ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>Active</p>
                </div>
                <div className={`p-2 rounded-lg text-center ${isDarkMode ? 'bg-slate-800' : 'bg-white border border-gray-100'}`}>
                  <p className={`text-lg font-black text-amber-600`}>💎 {redemptionSummary.total_points_spent}</p>
                  <p className={`text-[10px] ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>Points Spent</p>
                </div>
                <div className={`p-2 rounded-lg text-center ${isDarkMode ? 'bg-slate-800' : 'bg-white border border-gray-100'}`}>
                  <p className={`text-lg font-black text-red-500`}>{redemptionSummary.total_refunded}</p>
                  <p className={`text-[10px] ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>Refunded (Removed)</p>
                </div>
                <div className={`p-2 rounded-lg text-center ${isDarkMode ? 'bg-slate-800' : 'bg-white border border-gray-100'}`}>
                  <p className={`text-lg font-black text-green-600`}>{redemptionSummary.total_collected}</p>
                  <p className={`text-[10px] ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>Collected</p>
                </div>
                <div className={`p-2 rounded-lg text-center ${isDarkMode ? 'bg-slate-800' : 'bg-white border border-gray-100'}`}>
                  <p className={`text-lg font-black text-amber-500`}>{redemptionSummary.total_pending}</p>
                  <p className={`text-[10px] ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>Pending</p>
                </div>
              </div>
            </div>

            {loadingRedemptions ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-3 border-teal-500 border-t-transparent mx-auto mb-2" />
                <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>Loading redemptions...</p>
              </div>
            ) : redemptions.length === 0 ? (
              <div className="p-10 text-center">
                <div className="text-4xl mb-3">🎟️</div>
                <p className={`font-semibold ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>No active redemptions</p>
                <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
                  Refunded vouchers are automatically removed from this list
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className={`text-[11px] uppercase tracking-wider ${isDarkMode ? 'bg-slate-900/50 text-slate-400' : 'bg-gray-50 text-gray-500'}`}>
                      <th className="px-4 py-3 font-semibold">Voucher</th>
                      <th className="px-4 py-3 font-semibold">Learner</th>
                      <th className="px-4 py-3 font-semibold">Gift</th>
                      <th className="px-4 py-3 font-semibold">Points</th>
                      <th className="px-4 py-3 font-semibold">Date</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDarkMode ? 'divide-slate-700' : 'divide-gray-100'}`}>
                    {redemptions
                      .filter(r => {
                        if (redemptionFilter === 'pending') return !r.collected;
                        if (redemptionFilter === 'collected') return r.collected;
                        return true;
                      })
                      .map(r => (
                      <tr key={r.id} className={`${isDarkMode ? 'hover:bg-slate-700/30' : 'hover:bg-gray-50'} transition`}>
                        <td className="px-4 py-3">
                          {r.status === 'refunded' ? (
                            <span className="font-mono text-xs font-bold text-red-500 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                              REVOKED
                            </span>
                          ) : (
                            <span className={`font-mono font-bold text-sm ${isDarkMode ? 'text-teal-400' : 'text-teal-600'}`}>
                              {r.voucher_number || '—'}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <p className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                              {r.learner_name || 'Unknown Learner'}
                            </p>
                            {r.learner_class && <p className={`text-[10px] ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>{r.learner_class}</p>}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className={`text-sm font-medium ${isDarkMode ? 'text-slate-200' : 'text-gray-700'}`}>
                            {r.reward_name || '—'}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-sm font-bold ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`}>
                            💎 {r.points_spent}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                            {new Date(r.redeemed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {r.status === 'refunded' ? (
                            <span className="text-[11px] bg-red-100 text-red-700 border border-red-200 px-2 py-0.5 rounded-full font-semibold">
                              ↩ Refunded
                            </span>
                          ) : r.collected ? (
                            <span className="text-[11px] bg-green-100 text-green-700 border border-green-200 px-2 py-0.5 rounded-full font-semibold">
                              ✓ Collected
                            </span>
                          ) : (
                            <span className="text-[11px] bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-semibold">
                              ⏳ Pending
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {r.status === 'refunded' ? (
                            <span className={`text-xs italic ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
                              No actions
                            </span>
                          ) : (
                          <div className="flex items-center justify-center gap-1.5 flex-wrap">
                            <button
                              onClick={() => toggleCollected(r.id, r.collected)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                                r.collected
                                  ? 'bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600 border border-gray-200'
                                  : 'bg-green-500 text-white hover:bg-green-600 shadow-sm'
                              }`}
                            >
                              {r.collected ? 'Undo' : 'Mark Collected'}
                            </button>
                            {!r.collected && (
                              <button
                                onClick={() => handleRefund(r.id, r.reward_name || 'Reward', r.points_spent)}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition"
                              >
                                Refund & Remove
                              </button>
                            )}
                          </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Summary footer */}
            {redemptions.length > 0 && (
              <div className={`p-3 border-t flex items-center justify-between text-xs flex-wrap gap-2 ${isDarkMode ? 'border-slate-700 text-slate-400' : 'border-gray-100 text-gray-500'}`}>
                <span>{redemptions.length} active redemptions</span>
                <span>
                  {redemptions.filter(r => r.collected).length} collected / 
                  {redemptions.filter(r => !r.collected).length} pending / 
                  {redemptionSummary.total_refunded} refunded (removed)
                </span>
              </div>
            )}
          </div>
        )}

        {/* ── REWARDS TAB ── */}
        {adminTab === 'rewards' && (
        <div className="grid gap-6 lg:grid-cols-2 w-full">
          
          {/* Reward Collection Card */}
          <div className={`rounded-2xl transition-all duration-500 overflow-hidden border-2 ${
            isDarkMode 
              ? 'bg-slate-800/50 backdrop-blur-sm border-teal-400' 
              : 'bg-white shadow-xl border-teal-500'
          }`}>
            <div className={`p-4 border-b ${
              isDarkMode 
                ? 'border-teal-400/30 bg-emerald-900/20' 
                : 'border-teal-500/30 bg-gradient-to-r from-emerald-50 to-green-50'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className={`text-base font-bold ${
                    isDarkMode ? 'text-emerald-300' : 'text-[#19475B]'
                  }`}>
                    Reward Collection
                  </h2>
                  <p className={`text-[11px] mt-0.5 ${
                    isDarkMode ? 'text-emerald-300/70' : 'text-[#19475B]/70'
                  }`}>
                    Browse and manage your reward items
                  </p>
                </div>
                <div className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                  isDarkMode 
                    ? 'bg-emerald-500/20 text-emerald-300' 
                    : 'bg-emerald-100 text-[#19475B]'
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
                  <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-[#19475B]/70'}`}>
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
                        className={`group relative rounded-xl p-3 transition-all duration-300 cursor-pointer overflow-hidden border ${
                          selectedReward?.id === reward.id
                            ? isDarkMode 
                              ? 'bg-gradient-to-r from-emerald-500/20 to-green-500/20 border-emerald-500/50 shadow-lg' 
                              : 'bg-gradient-to-r from-emerald-50 to-green-50 border-teal-500 shadow-md'
                            : isDarkMode 
                              ? 'bg-slate-900/50 border-slate-700 hover:border-emerald-500/30 hover:shadow-lg' 
                              : 'bg-white border-slate-200 hover:border-teal-500 hover:shadow-lg'
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
                              isDarkMode ? 'bg-gradient-to-br from-emerald-500/30 to-green-500/30' : 'bg-gradient-to-br from-emerald-100 to-green-100'
                            }`}>
                              <svg className="w-7 h-7 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                              </svg>
                            </div>
                          )}
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <h3 className={`font-bold text-sm ${
                                  isDarkMode ? 'text-white' : 'text-[#19475B]'
                                }`}>
                                  {reward.name}
                                </h3>
                                <p className={`text-[11px] mt-0.5 line-clamp-2 ${
                                  isDarkMode ? 'text-slate-400' : 'text-[#19475B]/70'
                                }`}>
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
                              <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-gradient-to-r from-emerald-500/10 to-green-500/10 ${
                                isDarkMode ? 'text-emerald-400' : 'text-[#19475B]'
                              }`}>
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

          {/* Create/Edit Reward Card */}
          <div className={`rounded-2xl transition-all duration-500 overflow-hidden border-2 ${
            isDarkMode 
              ? 'bg-slate-800/50 backdrop-blur-sm border-teal-400' 
              : 'bg-white shadow-xl border-teal-500'
          }`}>
            <div className={`p-4 border-b ${
              isDarkMode 
                ? 'border-teal-400/30 bg-emerald-900/20' 
                : 'border-teal-500/30 bg-gradient-to-r from-emerald-50 to-green-50'
            }`}>
              <h2 className={`text-base font-bold ${
                isDarkMode ? 'text-emerald-300' : 'text-[#19475B]'
              }`}>
                {selectedReward ? 'Edit Reward' : 'Create New Reward'}
              </h2>
              <p className={`text-[11px] mt-0.5 ${
                isDarkMode ? 'text-emerald-300/70' : 'text-[#19475B]/70'
              }`}>
                {selectedReward ? 'Update reward details' : 'Add a new reward to the catalog'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className={`block text-xs font-semibold mb-1.5 ${
                  isDarkMode ? 'text-slate-300' : 'text-[#19475B]'
                }`}>
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
                              : 'bg-slate-100 text-[#19475B] hover:bg-slate-200'
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
                              : 'bg-slate-100 text-[#19475B] hover:bg-slate-200'
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
                        className={`relative border-2 border-solid rounded-xl p-6 text-center transition-all duration-300 cursor-pointer hover:border-teal-500 ${
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
                                : 'bg-white border-slate-200 text-[#19475B] placeholder-slate-400'
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
                      <div className="relative w-full">
                        <img 
                          src={form.image_url || imagePreview} 
                          alt="Gift preview" 
                          className="reward-image-preview w-full h-auto max-h-96 object-contain bg-slate-100 dark:bg-slate-900 transition-all duration-300"
                          style={{
                            transform: `scale(${imageScale || 1})`,
                            transformOrigin: 'center center',
                            width: '100%',
                            minHeight: '200px'
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
                          <h4 className={`text-xs font-semibold ${isDarkMode ? 'text-teal-400' : 'text-[#19475B]'}`}>
                            Image Size Control
                          </h4>
                          <span className={`text-xs font-bold ${isDarkMode ? 'text-teal-400' : 'text-[#19475B]'}`}>
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
                                    : 'bg-slate-200 text-[#19475B] hover:bg-slate-300'
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
                <label className={`block text-xs font-semibold mb-1 ${
                  isDarkMode ? 'text-slate-300' : 'text-[#19475B]'
                }`}>
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
                      : 'bg-white border-slate-200 text-[#19475B] focus:border-transparent'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1 ${
                  isDarkMode ? 'text-slate-300' : 'text-[#19475B]'
                }`}>
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
                      : 'bg-white border-slate-200 text-[#19475B]'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-semibold mb-1 ${
                    isDarkMode ? 'text-slate-300' : 'text-[#19475B]'
                  }`}>
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
                        : 'bg-white border-slate-200 text-[#19475B]'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-xs font-semibold mb-1 ${
                    isDarkMode ? 'text-slate-300' : 'text-[#19475B]'
                  }`}>
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
                        : 'bg-white border-slate-200 text-[#19475B]'
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
                  className={`px-4 py-2 rounded-lg text-sm font-medium border-2 transition-all duration-300 ${
                    isDarkMode 
                      ? 'border-teal-400 text-teal-400 hover:bg-teal-400/10' 
                      : 'border-teal-500 text-[#19475B] hover:bg-teal-50'
                  }`}
                >
                  Reset
                </button>
              </div>

              <div className="text-[10px] text-center pt-1 border-t ${
                isDarkMode ? 'border-slate-700 text-slate-400' : 'border-slate-200 text-slate-400'
              }">
                <span className="text-red-500">*</span> Required fields
              </div>
            </form>
          </div>
        </div>
        )}
      </main>

      {/* Refund Confirmation Dialog */}
      <RefundDialog />
      <RefundAllDialog />

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
        .reward-image-preview {
          width: 100% !important;
          max-width: 100% !important;
          display: block;
          aspect-ratio: 16/9;
        }
      `}</style>
    </div>
  );
};

export default AdminRewards;