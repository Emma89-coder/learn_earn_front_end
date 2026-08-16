// src/screens/admin/AdminBadges.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import API_URL from '../../config';

// Badge trigger types for automation
const BADGE_TRIGGERS = [
  { id: 'quiz_completed', name: 'Quiz Completed', color: 'teal', description: 'When a learner completes any quiz', thresholdHint: 'Number of quizzes' },
  { id: 'quiz_perfect_score', name: 'Perfect Score', color: 'emerald', description: 'When a learner gets 100% on a quiz', thresholdHint: 'Times achieved' },
  { id: 'quiz_streak', name: 'Quiz Streak', color: 'blue', description: 'When a learner completes quizzes on consecutive days', thresholdHint: 'Days in a row' },
  { id: 'points_milestone', name: 'Points Milestone', color: 'purple', description: 'When a learner reaches a points threshold', thresholdHint: 'Total points' },
  { id: 'daily_login_streak', name: 'Login Streak', color: 'orange', description: 'When a learner logs in consecutively', thresholdHint: 'Days in a row' },
  { id: 'questions_correct', name: 'Questions Correct', color: 'rose', description: 'When a learner answers questions correctly', thresholdHint: 'Total correct answers' },
  { id: 'speed_demon', name: 'Speed Demon', color: 'red', description: 'Quick completion with high score', thresholdHint: 'Time in seconds' },
  { id: 'subject_expert', name: 'Subject Expert', color: 'indigo', description: 'When a learner masters a subject', thresholdHint: 'Subjects mastered' }
];

const CONDITION_OPERATORS = [
  { id: 'greater_equal', label: 'Greater than or equal (≥)', symbol: '≥' },
  { id: 'greater_than', label: 'Greater than (>)', symbol: '>' },
  { id: 'less_equal', label: 'Less than or equal (≤)', symbol: '≤' },
  { id: 'equal', label: 'Equal to (=)', symbol: '=' }
];

// SVG Icons
const AwardIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
  </svg>
);

const EditIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const PlusIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const SaveIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const RefreshIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const UploadIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const XIcon = () => (
  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const ZapIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const SettingsIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const EyeIcon = () => (
  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const LoaderIcon = () => (
  <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

const TargetIcon = () => (
  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const TrophyIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-3-3h6m6-10v4m-3-3h4m-10 5a6 6 0 1012 0 6 6 0 00-12 0z" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const UserPlusIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
  </svg>
);

const UserIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const MedalIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
  </svg>
);

const BadgeIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const AdminBadges = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [badges, setBadges] = useState([]);
  const [learners, setLearners] = useState([]);
  const [selectedBadge, setSelectedBadge] = useState(null);
  const [showAutomation, setShowAutomation] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignBadgeId, setAssignBadgeId] = useState(null);
  const [assignLearnerId, setAssignLearnerId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredLearners, setFilteredLearners] = useState([]);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('portal-theme');
    return savedTheme ? savedTheme === 'dark' : false;
  });
  
  const [form, setForm] = useState({
    name: '',
    description: '',
    icon_url: '',
    criteria: '',
    is_active: true,
    automation_enabled: false,
    automation_trigger: '',
    automation_condition: 'greater_equal',
    automation_threshold: '',
    automation_points_reward: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    localStorage.setItem('portal-theme', isDarkMode ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  useEffect(() => {
    if (searchTerm.trim()) {
      const filtered = learners.filter(learner =>
        learner.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        learner.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        learner.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredLearners(filtered);
    } else {
      setFilteredLearners(learners);
    }
  }, [searchTerm, learners]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast.error('Please login to continue');
        navigate('/login');
        return;
      }
      
      const [badgesRes, learnersRes] = await Promise.all([
        axios.get(`${API_URL}/api/admin/badges`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/api/admin/learners`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      
      if (badgesRes.data?.success) {
        setBadges(badgesRes.data.badges || []);
      }
      
      if (learnersRes.data?.success) {
        setLearners(learnersRes.data.learners || []);
        setFilteredLearners(learnersRes.data.learners || []);
      }
    } catch (error) {
      console.error('Fetch data error:', error);
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again');
        logout();
        navigate('/');
      } else {
        toast.error('Could not load badges data');
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedBadge(null);
    setShowAutomation(false);
    setForm({
      name: '',
      description: '',
      icon_url: '',
      criteria: '',
      is_active: true,
      automation_enabled: false,
      automation_trigger: '',
      automation_condition: 'greater_equal',
      automation_threshold: '',
      automation_points_reward: 0
    });
  };

  const updateForm = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleEdit = (badge) => {
    if (!badge) return;
    setSelectedBadge(badge);
    setForm({
      name: badge.name || '',
      description: badge.description || '',
      icon_url: badge.icon_url || '',
      criteria: badge.criteria || '',
      is_active: badge.is_active ?? true,
      automation_enabled: badge.automation_enabled || false,
      automation_trigger: badge.automation_trigger || '',
      automation_condition: badge.automation_condition || 'greater_equal',
      automation_threshold: badge.automation_threshold || '',
      automation_points_reward: badge.automation_points_reward || 0
    });
    setShowAutomation(badge.automation_enabled || false);
  };

  const handleDelete = async (badgeId) => {
    if (!badgeId || !window.confirm('Are you sure you want to delete this badge? This action cannot be undone.')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/api/admin/badges/${badgeId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Badge deleted successfully');
      setBadges(prev => prev.filter(b => b.id !== badgeId));
      if (selectedBadge?.id === badgeId) resetForm();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete badge');
    }
  };

  const uploadImage = async (file) => {
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be less than 2MB');
      return;
    }
    
    const formData = new FormData();
    formData.append('image', file);
    
    setUploading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/api/admin/upload-image`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data' 
        }
      });
      
      if (response.data.success) {
        updateForm('icon_url', response.data.imageUrl);
        toast.success('Image uploaded successfully');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleImageUpload = (e) => {
    uploadImage(e.target.files[0]);
  };

  const removeIcon = () => {
    updateForm('icon_url', '');
    toast.success('Icon removed');
  };

  const saveBadge = async () => {
    if (!form.name.trim()) {
      toast.error('Badge name is required');
      return;
    }
    
    if (form.automation_enabled) {
      if (!form.automation_trigger) {
        toast.error('Please select a trigger event for automation');
        return;
      }
      if (!form.automation_threshold || isNaN(form.automation_threshold) || parseInt(form.automation_threshold) < 0) {
        toast.error('Please enter a valid threshold value for automation');
        return;
      }
    }
    
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || 'No description provided',
        icon_url: form.icon_url.trim() || '',
        criteria: form.criteria.trim() || 'Complete the required actions to earn this badge',
        is_active: Boolean(form.is_active),
        automation_enabled: Boolean(form.automation_enabled),
        automation_trigger: form.automation_trigger || '',
        automation_condition: form.automation_condition || 'greater_equal',
        automation_threshold: parseInt(form.automation_threshold) || 0,
        automation_points_reward: parseInt(form.automation_points_reward) || 0
      };
      
      if (selectedBadge) {
        await axios.put(`${API_URL}/api/admin/badges/${selectedBadge.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Badge updated successfully');
      } else {
        await axios.post(`${API_URL}/api/admin/badges`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Badge created successfully');
      }
      
      resetForm();
      await fetchData();
      
    } catch (error) {
      console.error('Save badge error:', error);
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again');
        logout();
      } else {
        toast.error(error.response?.data?.message || 'Failed to save badge');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleAssignBadge = async () => {
    if (!assignBadgeId || !assignLearnerId) {
      toast.error('Please select a student first');
      return;
    }
    
    try {
      setAssigning(true);
      const token = localStorage.getItem('token');
      
      console.log('Assigning badge:', { badgeId: assignBadgeId, learnerId: assignLearnerId });
      
      const response = await axios.post(`${API_URL}/api/admin/badges/assign`, {
        badgeId: assignBadgeId,
        learnerId: assignLearnerId
      }, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.success) {
        toast.success(response.data.message || 'Badge assigned successfully!');
        setShowAssignModal(false);
        setAssignBadgeId(null);
        setAssignLearnerId('');
        setSearchTerm('');
        fetchData();
      } else {
        toast.error(response.data.message || 'Failed to assign badge');
      }
    } catch (error) {
      console.error('Assign error:', error);
      
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again');
        logout();
        navigate('/');
      } else if (error.response?.status === 400) {
        toast.error(error.response.data?.message || 'Invalid request');
      } else if (error.response?.status === 404) {
        toast.error('Badge or learner not found');
      } else {
        toast.error(error.response?.data?.message || 'Failed to assign badge');
      }
    } finally {
      setAssigning(false);
    }
  };

  const getTriggerColor = (triggerId) => {
    const trigger = BADGE_TRIGGERS.find(t => t.id === triggerId);
    const colors = {
      teal: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
      emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
      blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
      orange: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
      rose: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
      red: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      indigo: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
    };
    return colors[trigger?.color] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
  };

  const getOperatorSymbol = (operatorId) => {
    const operator = CONDITION_OPERATORS.find(o => o.id === operatorId);
    return operator ? operator.symbol : '≥';
  };

  // Filter badges
  const filteredBadges = badges.filter(badge => {
    const matchSearch = badge.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
    return matchSearch;
  });

  // Stats
  const totalBadges = badges.length;
  const activeBadges = badges.filter(b => b.is_active !== false).length;
  const autoBadges = badges.filter(b => b.automation_enabled).length;

  // Assignment Modal
  const AssignModal = () => {
    const selectedBadge = badges.find(b => b.id === assignBadgeId);
    if (!selectedBadge) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className={`rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl border-2 ${
          isDarkMode ? 'bg-slate-800/95 border-teal-400' : 'bg-white border-teal-500'
        }`}>
          <div className={`p-6 border-b ${
            isDarkMode ? 'border-teal-400/30 bg-teal-900/20' : 'border-teal-500/30 bg-gradient-to-r from-teal-50 to-emerald-50'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center border-2 ${
                  isDarkMode ? 'border-teal-400/30 bg-teal-500/20' : 'border-teal-500/30 bg-teal-100'
                }`}>
                  <MedalIcon />
                </div>
                <div>
                  <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-[#19475B]'}`}>
                    Assign Badge
                  </h3>
                  <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    Award <span className={`font-semibold ${isDarkMode ? 'text-teal-400' : 'text-teal-600'}`}>
                      {selectedBadge.name}
                    </span> to a student
                  </p>
                </div>
              </div>
              <button 
                onClick={() => { setShowAssignModal(false); setSearchTerm(''); setAssignLearnerId(''); }} 
                className={`text-2xl transition-colors ${isDarkMode ? 'text-slate-400 hover:text-slate-300' : 'text-gray-400 hover:text-gray-600'}`}
              >
                ×
              </button>
            </div>
          </div>
          
          <div className={`p-6 space-y-4 ${isDarkMode ? 'text-slate-200' : ''}`}>
            <div className="relative">
              <div className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-slate-400' : 'text-slate-400'}`}>
                <UserIcon />
              </div>
              <input
                type="text"
                placeholder="Search students by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl outline-none transition-all ${
                  isDarkMode 
                    ? 'bg-slate-900 border-teal-400/30 focus:border-teal-400 text-white placeholder-slate-500' 
                    : 'bg-white border-teal-500/30 focus:border-teal-500 text-[#19475B] placeholder-slate-400'
                }`}
              />
            </div>
            
            <div className={`border-2 rounded-xl max-h-60 overflow-y-auto divide-y ${
              isDarkMode ? 'border-teal-400/30 divide-teal-400/20' : 'border-teal-500/30 divide-teal-500/20'
            }`}>
              {filteredLearners.length === 0 ? (
                <div className={`p-8 text-center ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  <UserIcon />
                  <p className="mt-2 text-sm">No students found</p>
                </div>
              ) : (
                filteredLearners.map(learner => (
                  <button
                    key={learner.id}
                    onClick={() => setAssignLearnerId(learner.id)}
                    className={`w-full px-4 py-3 flex items-center justify-between transition-all ${
                      isDarkMode 
                        ? `hover:bg-teal-400/10 ${assignLearnerId === learner.id ? 'bg-teal-400/20 border-l-4 border-teal-400' : ''}`
                        : `hover:bg-teal-50 ${assignLearnerId === learner.id ? 'bg-teal-50 border-l-4 border-teal-500' : ''}`
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                        isDarkMode ? 'bg-teal-500/20 text-teal-400' : 'bg-teal-100 text-teal-700'
                      }`}>
                        {learner.full_name?.charAt(0).toUpperCase() || 'S'}
                      </div>
                      <div className="text-left">
                        <p className={`font-medium text-sm ${isDarkMode ? 'text-white' : 'text-[#19475B]'}`}>
                          {learner.full_name || learner.username || 'Unnamed'}
                        </p>
                        <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                          {learner.email || 'No email'}
                        </p>
                      </div>
                    </div>
                    {assignLearnerId === learner.id && (
                      <div className="w-6 h-6 rounded-full bg-teal-600 flex items-center justify-center">
                        <CheckIcon />
                      </div>
                    )}
                  </button>
                ))
              )}
            </div>
            
            {assignLearnerId && (
              <div className={`rounded-xl p-4 border ${
                isDarkMode ? 'bg-teal-900/20 border-teal-400/30' : 'bg-teal-50 border-teal-500/30'
              }`}>
                <div className="flex items-center gap-3">
                  <TrophyIcon />
                  <span className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                    This student will receive the <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-[#19475B]'}`}>
                      {selectedBadge.name}
                    </span> badge
                  </span>
                </div>
              </div>
            )}
            
            <button
              onClick={handleAssignBadge}
              disabled={!assignLearnerId || assigning}
              className={`w-full py-3 text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                isDarkMode 
                  ? 'bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400'
                  : 'bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500'
              }`}
            >
              {assigning ? <LoaderIcon /> : <UserPlusIcon />}
              Confirm Assignment
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Badge Card Component
  const BadgeCard = ({ badge }) => {
    if (!badge) return null;
    
    return (
      <div className={`group rounded-xl p-4 transition-all cursor-pointer border ${
        isDarkMode 
          ? 'bg-slate-900/50 border-slate-700 hover:border-teal-500/30 hover:shadow-lg hover:bg-slate-800/50' 
          : 'bg-white border-gray-200 hover:shadow-md hover:border-teal-300'
      }`}>
        <div className="flex gap-4">
          <div className="w-16 h-16 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0 bg-gray-100 dark:bg-slate-800 border-2 border-teal-500/30">
            {badge.icon_url ? (
              <img src={badge.icon_url} alt={badge.name} className="w-full h-full object-cover" />
            ) : (
              <BadgeIcon />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className={`font-semibold truncate ${isDarkMode ? 'text-slate-200' : 'text-gray-800'}`}>
                  {badge.name}
                </h3>
                <p className={`text-sm truncate ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                  {badge.description || 'No description'}
                </p>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                    badge.is_active !== false 
                      ? isDarkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700'
                      : isDarkMode ? 'bg-slate-700 text-slate-400' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {badge.is_active !== false ? 'Active' : 'Inactive'}
                  </span>
                  {badge.automation_enabled && badge.automation_trigger && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${getTriggerColor(badge.automation_trigger)}`}>
                      Auto
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                <button 
                  onClick={(e) => { e.stopPropagation(); handleEdit(badge); }} 
                  className={`p-1.5 rounded-lg transition-colors ${
                    isDarkMode ? 'hover:bg-blue-900/30 text-blue-400' : 'hover:bg-blue-50 text-blue-600'
                  }`}
                  title="Edit"
                >
                  <EditIcon />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleDelete(badge.id); }} 
                  className={`p-1.5 rounded-lg transition-colors ${
                    isDarkMode ? 'hover:bg-red-900/30 text-red-400' : 'hover:bg-red-50 text-red-500'
                  }`}
                  title="Delete"
                >
                  <TrashIcon />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); setAssignBadgeId(badge.id); setShowAssignModal(true); }} 
                  className={`p-1.5 rounded-lg transition-colors ${
                    isDarkMode ? 'hover:bg-teal-900/30 text-teal-400' : 'hover:bg-teal-50 text-teal-600'
                  }`}
                  title="Assign to student"
                >
                  <UserPlusIcon />
                </button>
              </div>
            </div>
            {badge.automation_enabled && badge.automation_trigger && (
              <div className={`mt-2 flex items-center gap-1 text-xs ${
                isDarkMode ? 'text-slate-400' : 'text-gray-500'
              }`}>
                <TargetIcon />
                <span>{BADGE_TRIGGERS.find(t => t.id === badge.automation_trigger)?.name || badge.automation_trigger}</span>
                <span className={`font-medium ${isDarkMode ? 'text-teal-400' : 'text-teal-600'}`}>
                  {getOperatorSymbol(badge.automation_condition)} {badge.automation_threshold}
                </span>
              </div>
            )}
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
      
      {/* Assign Modal */}
      {showAssignModal && <AssignModal />}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Back Button */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/admin-dashboard')}
            className={`flex items-center gap-2 text-sm font-medium transition-all hover:scale-105 ${
              isDarkMode 
                ? 'text-slate-400 hover:text-slate-200' 
                : 'text-[#19475B] hover:text-teal-600'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </button>
        </div>

        {/* Tabs */}
        <div className={`flex gap-6 border-b mb-6 ${
          isDarkMode ? 'border-slate-700' : 'border-gray-200'
        }`}>
          <button
            onClick={() => {
              resetForm();
            }}
            className={`pb-2 text-sm font-medium capitalize transition-all ${
              selectedBadge 
                ? 'text-teal-500 dark:text-teal-400 border-b-2 border-teal-500 dark:border-teal-400' 
                : isDarkMode ? 'text-slate-400 hover:text-slate-300' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {selectedBadge ? 'Edit Badge' : 'Create Badge'}
          </button>
          <button
            onClick={() => { resetForm(); setSelectedBadge(null); }}
            className={`pb-2 text-sm font-medium capitalize transition-all ${
              !selectedBadge && badges.length > 0
                ? 'text-teal-500 dark:text-teal-400 border-b-2 border-teal-500 dark:border-teal-400' 
                : isDarkMode ? 'text-slate-400 hover:text-slate-300' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            All Badges ({badges.length})
          </button>
        </div>

        {/* Create/Edit Tab */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Sidebar - Badge Settings */}
          <div className="lg:col-span-1 space-y-4">
            <div className={`rounded-xl border-2 shadow-sm p-5 sticky top-24 ${
              isDarkMode 
                ? 'bg-slate-900/50 border-teal-400' 
                : 'bg-white border-teal-500'
            }`}>
              <h3 className={`font-semibold mb-4 flex items-center gap-2 ${
                isDarkMode ? 'text-slate-200' : 'text-[#19475B]'
              }`}>
                <svg className="w-5 h-5 text-teal-500 dark:text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Badge Settings
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className={`text-xs font-medium block mb-1 ${isDarkMode ? 'text-slate-300' : 'text-[#19475B]'}`}>
                    Badge Icon
                  </label>
                  {!form.icon_url ? (
                    <label className={`block border-2 border-solid rounded-lg p-4 text-center cursor-pointer hover:border-teal-400 transition ${
                      isDarkMode ? 'bg-slate-900/50 border-slate-700' : 'bg-gray-50 border-gray-300'
                    }`}>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleImageUpload} 
                        className="hidden" 
                        disabled={uploading}
                      />
                      <div className="flex flex-col items-center gap-1">
                        <UploadIcon />
                        <span className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                          {uploading ? 'Uploading...' : 'Click to upload icon'}
                        </span>
                        <span className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
                          PNG, JPG up to 2MB
                        </span>
                      </div>
                    </label>
                  ) : (
                    <div className="relative inline-block">
                      <img src={form.icon_url} alt="Badge Icon" className="w-20 h-20 rounded-lg object-cover border-2 border-teal-500/30 shadow-sm" />
                      <button 
                        onClick={removeIcon} 
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 text-xs flex items-center justify-center hover:bg-red-600 transition-colors shadow-sm"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
                
                <div>
                  <label className={`text-xs font-medium block mb-1 ${isDarkMode ? 'text-slate-300' : 'text-[#19475B]'}`}>
                    Badge Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => updateForm('name', e.target.value)}
                    placeholder="e.g., Quiz Champion"
                    className={`w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all ${
                      isDarkMode 
                        ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500' 
                        : 'bg-white border-gray-300 text-[#19475B]'
                    } border`}
                  />
                </div>
                
                <div>
                  <label className={`text-xs font-medium block mb-1 ${isDarkMode ? 'text-slate-300' : 'text-[#19475B]'}`}>
                    Description
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) => updateForm('description', e.target.value)}
                    rows={3}
                    placeholder="Describe what learners need to do to earn this badge..."
                    className={`w-full px-3 py-2 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                      isDarkMode 
                        ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500' 
                        : 'bg-white border-gray-300 text-[#19475B]'
                    } border`}
                  />
                </div>
                
                <div>
                  <label className={`text-xs font-medium block mb-1 ${isDarkMode ? 'text-slate-300' : 'text-[#19475B]'}`}>
                    Criteria
                  </label>
                  <textarea
                    value={form.criteria}
                    onChange={(e) => updateForm('criteria', e.target.value)}
                    rows={2}
                    placeholder="What specific actions earn this badge?"
                    className={`w-full px-3 py-2 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                      isDarkMode 
                        ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500' 
                        : 'bg-white border-gray-300 text-[#19475B]'
                    } border`}
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Main Form - Automation Settings */}
          <div className="lg:col-span-2">
            <div className={`rounded-xl border-2 shadow-sm overflow-hidden ${
              isDarkMode 
                ? 'bg-slate-900/50 border-teal-400' 
                : 'bg-white border-teal-500'
            }`}>
              <div className={`p-5 border-b ${
                isDarkMode 
                  ? 'border-teal-400/30 bg-teal-900/20' 
                  : 'border-teal-500/30 bg-gradient-to-r from-teal-50 to-emerald-50'
              }`}>
                <div className="flex items-center gap-3">
                  <ZapIcon />
                  <div>
                    <h3 className={`font-semibold ${isDarkMode ? 'text-teal-300' : 'text-[#19475B]'}`}>
                      Automation Settings
                    </h3>
                    <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                      Configure automatic badge awarding
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="p-5 space-y-6">
                {/* Automation Toggle */}
                <div className={`rounded-xl p-4 border-2 ${
                  isDarkMode 
                    ? 'border-teal-400/30 bg-teal-900/20' 
                    : 'border-teal-500/30 bg-gradient-to-r from-teal-50 to-emerald-50'
                }`}>
                  <label className="flex items-center justify-between cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        isDarkMode ? 'bg-teal-500/20' : 'bg-teal-100'
                      }`}>
                        <ZapIcon />
                      </div>
                      <div>
                        <h4 className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-[#19475B]'}`}>
                          Automated Awarding
                        </h4>
                        <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                          Auto-assign badge when conditions are met
                        </p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={form.automation_enabled}
                      onChange={(e) => updateForm('automation_enabled', e.target.checked)}
                      className="w-5 h-5 rounded border-teal-500/30 text-teal-600 focus:ring-teal-500 focus:ring-offset-0 accent-teal-600"
                    />
                  </label>
                </div>

                {/* Automation Settings - Only show when enabled */}
                {form.automation_enabled && (
                  <div className={`space-y-4 rounded-xl p-4 border-2 ${
                    isDarkMode 
                      ? 'border-teal-400/30 bg-slate-800/50' 
                      : 'border-teal-500/30 bg-slate-50'
                  }`}>
                    <div className={`flex items-center gap-2 pb-2 border-b ${
                      isDarkMode ? 'border-teal-400/20' : 'border-teal-500/20'
                    }`}>
                      <SettingsIcon />
                      <span className={`text-xs font-semibold uppercase tracking-wide ${
                        isDarkMode ? 'text-teal-400' : 'text-teal-600'
                      }`}>
                        Automation Rules
                      </span>
                    </div>
                    
                    <div>
                      <label className={`block text-xs font-medium mb-1 ${
                        isDarkMode ? 'text-slate-300' : 'text-slate-700'
                      }`}>
                        Trigger Event <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={form.automation_trigger}
                        onChange={(e) => updateForm('automation_trigger', e.target.value)}
                        className={`w-full rounded-lg border-2 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-500 transition-all ${
                          isDarkMode 
                            ? 'bg-slate-900 border-teal-400/30 text-white focus:border-teal-400' 
                            : 'bg-white border-teal-500/30 text-[#19475B] focus:border-teal-500'
                        }`}
                      >
                        <option value="">Select a trigger event</option>
                        {BADGE_TRIGGERS.map((trigger) => (
                          <option key={trigger.id} value={trigger.id}>
                            {trigger.name} - {trigger.description}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={`block text-xs font-medium mb-1 ${
                          isDarkMode ? 'text-slate-300' : 'text-slate-700'
                        }`}>
                          Condition <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={form.automation_condition}
                          onChange={(e) => updateForm('automation_condition', e.target.value)}
                          className={`w-full rounded-lg border-2 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-500 transition-all ${
                            isDarkMode 
                              ? 'bg-slate-900 border-teal-400/30 text-white focus:border-teal-400' 
                              : 'bg-white border-teal-500/30 text-[#19475B] focus:border-teal-500'
                          }`}
                        >
                          {CONDITION_OPERATORS.map((op) => (
                            <option key={op.id} value={op.id}>
                              {op.symbol} {op.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className={`block text-xs font-medium mb-1 ${
                          isDarkMode ? 'text-slate-300' : 'text-slate-700'
                        }`}>
                          Threshold <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          value={form.automation_threshold}
                          onChange={(e) => updateForm('automation_threshold', e.target.value)}
                          className={`w-full rounded-lg border-2 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-500 transition-all ${
                            isDarkMode 
                              ? 'bg-slate-900 border-teal-400/30 text-white placeholder-slate-500 focus:border-teal-400' 
                              : 'bg-white border-teal-500/30 text-[#19475B] placeholder-slate-400 focus:border-teal-500'
                          }`}
                          placeholder="e.g., 10, 100, 500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className={`block text-xs font-medium mb-1 ${
                        isDarkMode ? 'text-slate-300' : 'text-slate-700'
                      }`}>
                        Points Reward <span className="text-xs text-slate-400">(Optional)</span>
                      </label>
                      <input
                        type="number"
                        value={form.automation_points_reward}
                        onChange={(e) => updateForm('automation_points_reward', e.target.value)}
                        className={`w-full rounded-lg border-2 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-500 transition-all ${
                          isDarkMode 
                            ? 'bg-slate-900 border-teal-400/30 text-white placeholder-slate-500 focus:border-teal-400' 
                            : 'bg-white border-teal-500/30 text-[#19475B] placeholder-slate-400 focus:border-teal-500'
                        }`}
                        placeholder="Points to award (e.g., 50)"
                      />
                    </div>

                    {/* Preview */}
                    {form.automation_trigger && form.automation_threshold && (
                      <div className={`mt-2 p-3 rounded-lg border-2 ${
                        isDarkMode 
                          ? 'border-teal-400/30 bg-teal-900/20' 
                          : 'border-teal-500/30 bg-teal-50'
                      }`}>
                        <div className={`flex items-center gap-2 mb-2 ${
                          isDarkMode ? 'text-teal-400' : 'text-teal-600'
                        }`}>
                          <EyeIcon />
                          <span className="text-xs font-medium">Automation Preview</span>
                        </div>
                        <p className={`text-xs ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                          When a learner's <span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-[#19475B]'}`}>
                            {BADGE_TRIGGERS.find(t => t.id === form.automation_trigger)?.name}
                          </span> is 
                          <span className={`font-semibold ${isDarkMode ? 'text-teal-400' : 'text-teal-600'}`}>
                            {getOperatorSymbol(form.automation_condition)} {form.automation_threshold}
                          </span>,
                          they will automatically receive the badge
                          {form.automation_points_reward > 0 && ` and earn ${form.automation_points_reward} points`}.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Active Toggle */}
                <div className={`flex items-center justify-between py-2 px-3 rounded-lg border-2 ${
                  isDarkMode ? 'border-teal-400/30' : 'border-teal-500/30'
                }`}>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      isDarkMode ? 'bg-emerald-500/20' : 'bg-emerald-100'
                    }`}>
                      <CheckIcon />
                    </div>
                    <div>
                      <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-[#19475B]'}`}>
                        Active Badge
                      </span>
                      <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        Visible and earnable by learners
                      </p>
                    </div>
                  </label>
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => updateForm('is_active', e.target.checked)}
                    className="w-5 h-5 rounded border-teal-500/30 text-emerald-600 focus:ring-emerald-500 focus:ring-offset-0 accent-emerald-600"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <button 
                    onClick={() => { resetForm(); }} 
                    className={`flex-1 py-2.5 rounded-lg font-medium transition-all ${
                      isDarkMode 
                        ? 'border-slate-700 text-slate-300 hover:bg-slate-700' 
                        : 'border-gray-300 text-gray-600 hover:bg-gray-100'
                    } border`}
                  >
                    Reset
                  </button>
                  <button 
                    onClick={saveBadge} 
                    disabled={saving || uploading} 
                    className="flex-1 py-2.5 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-lg hover:from-teal-600 hover:to-teal-700 transition-all font-medium shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {saving ? <LoaderIcon /> : <SaveIcon />}
                    {selectedBadge ? 'Update Badge' : 'Create Badge'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* All Badges List */}
        {!selectedBadge && badges.length > 0 && (
          <div className="mt-6">
            <div className={`rounded-xl border-2 shadow-sm overflow-hidden ${
              isDarkMode 
                ? 'bg-slate-900/50 border-teal-400' 
                : 'bg-white border-teal-500'
            }`}>
              <div className={`p-4 border-b ${
                isDarkMode 
                  ? 'border-teal-400/30 bg-teal-900/20' 
                  : 'border-teal-500/30 bg-gradient-to-r from-teal-50 to-emerald-50'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className={`font-semibold ${isDarkMode ? 'text-teal-300' : 'text-[#19475B]'}`}>
                      All Badges
                    </h3>
                    <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                      Manage your badge collection
                    </p>
                  </div>
                  <div className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                    isDarkMode 
                      ? 'bg-teal-500/20 text-teal-300' 
                      : 'bg-teal-100 text-[#19475B]'
                  }`}>
                    {badges.length} badges
                  </div>
                </div>
              </div>
              
              <div className="p-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((item) => (
                      <div key={item} className={`h-24 rounded-xl animate-pulse ${isDarkMode ? 'bg-slate-700/50' : 'bg-slate-100'}`} />
                    ))}
                  </div>
                ) : badges.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🏅</div>
                    <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-[#19475B]/70'}`}>
                      No badges created yet
                    </p>
                    <button
                      onClick={() => { resetForm(); }}
                      className={`mt-3 px-4 py-2 text-white rounded-lg font-medium transition shadow-md text-sm ${
                        isDarkMode 
                          ? 'bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400' 
                          : 'bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500'
                      }`}
                    >
                      Create Your First Badge
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {badges.map((badge) => (
                      <BadgeCard key={badge.id} badge={badge} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
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
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: ${isDarkMode ? '#475569' : '#94a3b8'};
        }
      `}</style>
    </div>
  );
};

export default AdminBadges;