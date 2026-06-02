import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import API_URL from '../../config';

// Badge trigger types for automation
const BADGE_TRIGGERS = [
  { id: 'quiz_completed', name: 'Quiz Completed', icon: '📚', color: 'azure', description: 'When a learner completes any quiz', thresholdHint: 'Number of quizzes' },
  { id: 'quiz_perfect_score', name: 'Perfect Score', icon: '⭐', color: 'azure', description: 'When a learner gets 100% on a quiz', thresholdHint: 'Times achieved' },
  { id: 'quiz_streak', name: 'Quiz Streak', icon: '🔥', color: 'teal', description: 'When a learner completes quizzes on consecutive days', thresholdHint: 'Days in a row' },
  { id: 'points_milestone', name: 'Points Milestone', icon: '🏆', color: 'darkblue', description: 'When a learner reaches a points threshold', thresholdHint: 'Total points' },
  { id: 'daily_login_streak', name: 'Login Streak', icon: '📅', color: 'teal', description: 'When a learner logs in consecutively', thresholdHint: 'Days in a row' },
  { id: 'questions_correct', name: 'Questions Correct', icon: '✅', color: 'azure', description: 'When a learner answers questions correctly', thresholdHint: 'Total correct answers' },
  { id: 'speed_demon', name: 'Speed Demon', icon: '⚡', color: 'darkblue', description: 'Quick completion with high score', thresholdHint: 'Time in seconds' },
  { id: 'subject_expert', name: 'Subject Expert', icon: '🎓', color: 'teal', description: 'When a learner masters a subject', thresholdHint: 'Subjects mastered' }
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

const SparklesIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-3-3h4M7 7l10 10M7 17L17 7" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const AdminBadges = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [badges, setBadges] = useState([]);
  const [learners, setLearners] = useState([]);
  const [selectedBadge, setSelectedBadge] = useState(null);
  const [showAutomation, setShowAutomation] = useState(false);
  const [dragActive, setDragActive] = useState(false);
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

  const fetchData = async () => {
    try {
      setLoading(true);
      const [badgesRes, learnersRes] = await Promise.all([
        axios.get(`${API_URL}/api/admin/badges`),
        axios.get(`${API_URL}/api/admin/learners`)
      ]);
      setBadges(badgesRes.data.badges || []);
      setLearners(learnersRes.data.learners || []);
    } catch (error) {
      console.error('Fetch badge data error:', error);
      toast.error('Could not load badges or learners.');
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

  const fromInput = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleEdit = (badge) => {
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
    if (!window.confirm('Delete this badge?')) return;

    try {
      await axios.delete(`${API_URL}/api/admin/badges/${badgeId}`);
      toast.success('Badge deleted.');
      setBadges((prev) => prev.filter((badge) => badge.id !== badgeId));
      if (selectedBadge?.id === badgeId) resetForm();
    } catch (error) {
      console.error('Delete badge error:', error);
      toast.error(error.response?.data?.error || 'Could not delete badge.');
    }
  };

  const uploadImage = async (file) => {
    if (!file) return null;
    
    const formData = new FormData();
    formData.append('image', file);

    try {
      setUploading(true);
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/api/admin/upload-image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.success) {
        return response.data.imageUrl;
      }
      return null;
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be less than 2MB');
      return;
    }

    const imageUrl = await uploadImage(file);
    if (imageUrl) {
      fromInput('icon_url', imageUrl);
      toast.success('Icon uploaded successfully!');
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const file = e.dataTransfer.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      toast.error('Please drop an image file');
      return;
    }
    
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be less than 2MB');
      return;
    }

    const imageUrl = await uploadImage(file);
    if (imageUrl) {
      fromInput('icon_url', imageUrl);
      toast.success('Icon uploaded successfully!');
    }
  };

  const removeIcon = () => {
    fromInput('icon_url', '');
    toast.success('Icon removed');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.name.trim()) {
      toast.error('Badge name is required.');
      return;
    }

    if (form.automation_enabled) {
      if (!form.automation_trigger) {
        toast.error('Please select a trigger event for automation.');
        return;
      }
      if (!form.automation_threshold || isNaN(form.automation_threshold)) {
        toast.error('Please enter a valid threshold value for automation.');
        return;
      }
    }

    try {
      setSaving(true);
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        icon_url: form.icon_url.trim(),
        criteria: form.criteria.trim(),
        is_active: Boolean(form.is_active),
        automation_enabled: form.automation_enabled,
        automation_trigger: form.automation_trigger,
        automation_condition: form.automation_condition,
        automation_threshold: parseInt(form.automation_threshold),
        automation_points_reward: parseInt(form.automation_points_reward) || 0
      };

      if (selectedBadge) {
        await axios.put(`${API_URL}/api/admin/badges/${selectedBadge.id}`, payload);
        toast.success('Badge updated successfully.');
      } else {
        await axios.post(`${API_URL}/api/admin/badges`, payload);
        toast.success('Badge created successfully.');
      }

      resetForm();
      fetchData();
    } catch (error) {
      console.error('Save badge error:', error);
      toast.error(error.response?.data?.error || 'Could not save badge.');
    } finally {
      setSaving(false);
    }
  };

  const getTriggerColor = (triggerId) => {
    const trigger = BADGE_TRIGGERS.find(t => t.id === triggerId);
    const colors = {
      azure: 'bg-[#00B0FF]/10 text-[#00B0FF]',
      teal: 'bg-[#008080]/10 text-[#008080]',
      darkblue: 'bg-[#1A237E]/10 text-[#1A237E]'
    };
    return colors[trigger?.color] || 'bg-slate-100 text-slate-700';
  };

  const getOperatorSymbol = (operatorId) => {
    const operator = CONDITION_OPERATORS.find(o => o.id === operatorId);
    return operator ? operator.symbol : '≥';
  };

  const BadgeCard = ({ badge }) => {
    const [isHovered, setIsHovered] = useState(false);
    
    return (
      <div 
        className="group relative bg-white rounded-2xl border border-[#00B0FF]/20 overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className={`absolute inset-0 bg-gradient-to-br from-[#00B0FF]/0 to-[#00B0FF]/0 transition-all duration-300 ${isHovered ? 'from-[#00B0FF]/5 to-[#00B0FF]/10' : ''}`} />
        
        <div className="relative p-5">
          <div className="flex items-start justify-between mb-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#00B0FF]/10 to-[#008080]/10 flex items-center justify-center overflow-hidden shadow-sm">
                {badge.icon_url ? (
                  <img src={badge.icon_url} alt={badge.name} className="w-full h-full object-cover" />
                ) : (
                  <AwardIcon />
                )}
              </div>
              {badge.automation_enabled && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#008080] rounded-full flex items-center justify-center shadow-md">
                  <ZapIcon />
                </div>
              )}
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
              <button 
                onClick={() => handleEdit(badge)} 
                className="p-2 hover:bg-[#00B0FF]/10 text-[#00B0FF] rounded-xl transition-all"
              >
                <EditIcon />
              </button>
              <button 
                onClick={() => handleDelete(badge.id)} 
                className="p-2 hover:bg-red-50 text-red-500 rounded-xl transition-all"
              >
                <TrashIcon />
              </button>
            </div>
          </div>
          
          <h3 className="font-bold text-[#1A237E] text-lg mb-1">{badge.name}</h3>
          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{badge.description || 'No description provided'}</p>
          
          <div className="mt-4 flex items-center gap-2 flex-wrap">
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${badge.is_active ? 'bg-[#008080]/10 text-[#008080]' : 'bg-slate-100 text-slate-500'}`}>
              {badge.is_active ? 'Active' : 'Inactive'}
            </span>
            {badge.automation_enabled && badge.automation_trigger && (
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${getTriggerColor(badge.automation_trigger)}`}>
                🤖 Auto
              </span>
            )}
          </div>
          
          {badge.automation_enabled && badge.automation_trigger && (
            <div className="mt-3 pt-3 border-t border-[#00B0FF]/20">
              <div className="flex items-center gap-1 text-xs text-slate-500">
                <TargetIcon />
                <span>{BADGE_TRIGGERS.find(t => t.id === badge.automation_trigger)?.name}</span>
                <span className="font-medium text-[#00B0FF]">{getOperatorSymbol(badge.automation_condition)} {badge.automation_threshold}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const EmptyState = () => (
    <div className="text-center py-16 bg-white rounded-2xl border border-[#00B0FF]/20">
      <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-[#00B0FF]/10 to-[#008080]/10 rounded-full flex items-center justify-center">
        <AwardIcon />
      </div>
      <h3 className="text-lg font-semibold text-[#1A237E] mb-1">No badges yet</h3>
      <p className="text-sm text-slate-500 mb-4">Create your first badge to start rewarding learners</p>
      <button 
        onClick={resetForm}
        className="inline-flex items-center gap-2 px-4 py-2 bg-[#00B0FF] text-white rounded-xl hover:bg-[#008080] transition-all"
      >
        <PlusIcon />
        Create Badge
      </button>
    </div>
  );

  const LoadingSkeleton = () => (
    <div className="grid sm:grid-cols-2 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-white rounded-2xl border border-[#00B0FF]/20 p-5 animate-pulse">
          <div className="flex items-start justify-between mb-4">
            <div className="w-16 h-16 rounded-xl bg-slate-200" />
            <div className="flex gap-1">
              <div className="w-8 h-8 rounded-lg bg-slate-200" />
              <div className="w-8 h-8 rounded-lg bg-slate-200" />
            </div>
          </div>
          <div className="h-5 bg-slate-200 rounded-lg w-3/4 mb-2" />
          <div className="h-3 bg-slate-200 rounded-lg w-full mb-1" />
          <div className="h-3 bg-slate-200 rounded-lg w-2/3" />
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F0F4F8] via-[#E8F4F8] to-[#F0F8FF]">
      
      {/* Header */}
      <header className="bg-white border-b border-[#00B0FF]/20 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-[#00B0FF] to-[#008080] rounded-xl flex items-center justify-center shadow-md">
                <AwardIcon />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[#1A237E]">Badge Studio</h1>
                <p className="text-sm text-slate-500">Design, automate, and manage achievement badges</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => navigate('/admin-dashboard')} 
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-[#00B0FF]/10 rounded-xl transition-all"
              >
                Dashboard
              </button>
              <button 
                onClick={logout} 
                className="px-4 py-2 text-sm font-medium bg-[#1A237E] text-white rounded-xl hover:bg-[#00B0FF] transition-all shadow-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-[1fr_420px] gap-8">
          
          {/* Badge Catalog Section */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-[#1A237E] flex items-center gap-2">
                  <TrophyIcon />
                  Badge Catalog
                  <span className="ml-2 px-2 py-0.5 bg-[#00B0FF]/10 text-[#00B0FF] text-xs rounded-full">{badges.length} badges</span>
                </h2>
                <p className="text-sm text-slate-500 mt-1">Review and manage all badge templates</p>
              </div>
            </div>

            {loading ? (
              <LoadingSkeleton />
            ) : badges.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="grid sm:grid-cols-2 gap-5">
                {badges.map((badge) => (
                  <BadgeCard key={badge.id} badge={badge} />
                ))}
              </div>
            )}
          </section>

          {/* Create/Edit Badge Form */}
          <aside>
            <div className="bg-white rounded-2xl border border-[#00B0FF]/20 shadow-sm sticky top-24 overflow-hidden">
              <div className="p-5 border-b border-[#00B0FF]/20 bg-gradient-to-r from-slate-50 to-white">
                <h3 className="font-semibold text-[#1A237E] flex items-center gap-2">
                  <SparklesIcon />
                  {selectedBadge ? 'Edit Badge' : 'Create New Badge'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {selectedBadge ? 'Modify badge details and automation rules' : 'Design a new achievement badge'}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="p-5 space-y-5">
                {/* Badge Name */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Badge Name <span className="text-red-500">*</span>
                  </label>
                  <input 
                    className="w-full px-4 py-2.5 rounded-xl border border-[#00B0FF]/30 focus:ring-2 focus:ring-[#00B0FF]/20 focus:border-[#00B0FF] outline-none transition-all"
                    placeholder="e.g., Quiz Champion"
                    value={form.name}
                    onChange={(e) => fromInput('name', e.target.value)}
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Description
                  </label>
                  <textarea 
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#00B0FF]/30 focus:ring-2 focus:ring-[#00B0FF]/20 focus:border-[#00B0FF] outline-none transition-all resize-none"
                    placeholder="Describe what learners need to do to earn this badge..."
                    value={form.description}
                    onChange={(e) => fromInput('description', e.target.value)}
                  />
                </div>

                {/* Icon Upload */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Badge Icon
                  </label>
                  
                  {!form.icon_url ? (
                    <div
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                      className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
                        dragActive 
                          ? 'border-[#00B0FF] bg-[#00B0FF]/5' 
                          : 'border-[#00B0FF]/30 hover:border-[#00B0FF] hover:bg-[#00B0FF]/5'
                      }`}
                      onClick={() => document.getElementById('icon-upload').click()}
                    >
                      <input
                        id="icon-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      {uploading ? (
                        <div className="flex flex-col items-center gap-2">
                          <LoaderIcon />
                          <p className="text-sm text-slate-600">Uploading...</p>
                        </div>
                      ) : (
                        <>
                          <UploadIcon />
                          <p className="text-sm text-slate-600 mt-2">Click or drag to upload</p>
                          <p className="text-xs text-slate-400 mt-1">PNG, JPG up to 2MB</p>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="relative inline-block">
                      <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-[#00B0FF]/10 to-[#008080]/10 overflow-hidden border-2 border-[#00B0FF]/30 shadow-sm">
                        <img src={form.icon_url} alt="Badge Icon" className="w-full h-full object-cover" />
                      </div>
                      <button
                        type="button"
                        onClick={removeIcon}
                        className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-all shadow-md"
                      >
                        <XIcon />
                      </button>
                      <button
                        type="button"
                        onClick={() => document.getElementById('icon-upload').click()}
                        className="absolute -bottom-2 -right-2 w-6 h-6 rounded-full bg-[#00B0FF] text-white flex items-center justify-center hover:bg-[#008080] transition-all shadow-md"
                      >
                        <RefreshIcon />
                      </button>
                    </div>
                  )}
                </div>

                {/* Automation Toggle */}
                <div className="bg-gradient-to-r from-[#00B0FF]/10 to-[#008080]/10 rounded-xl p-4 border border-[#00B0FF]/20">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#00B0FF]/20 rounded-xl flex items-center justify-center">
                        <ZapIcon />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-[#1A237E]">Automated Awarding</h4>
                        <p className="text-xs text-slate-500">Auto-assign badge when conditions are met</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={form.automation_enabled}
                      onChange={(e) => {
                        fromInput('automation_enabled', e.target.checked);
                        setShowAutomation(e.target.checked);
                      }}
                      className="w-5 h-5 rounded border-[#00B0FF]/30 text-[#00B0FF] focus:ring-[#00B0FF] focus:ring-offset-0 accent-[#00B0FF]"
                    />
                  </label>
                </div>

                {/* Automation Settings */}
                {showAutomation && (
                  <div className="space-y-4 bg-slate-50 rounded-xl p-4 border border-[#00B0FF]/20">
                    <div className="flex items-center gap-2 pb-2 border-b border-[#00B0FF]/20">
                      <SettingsIcon />
                      <span className="text-xs font-semibold text-[#00B0FF] uppercase tracking-wide">Automation Rules</span>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Trigger Event
                      </label>
                      <select
                        value={form.automation_trigger}
                        onChange={(e) => fromInput('automation_trigger', e.target.value)}
                        className="w-full rounded-xl border border-[#00B0FF]/30 bg-white px-4 py-2.5 text-slate-800 outline-none focus:ring-2 focus:ring-[#00B0FF]/20 focus:border-[#00B0FF] transition-all"
                      >
                        <option value="">Select a trigger event</option>
                        {BADGE_TRIGGERS.map((trigger) => (
                          <option key={trigger.id} value={trigger.id}>
                            {trigger.icon} {trigger.name} - {trigger.description}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Condition
                        </label>
                        <select
                          value={form.automation_condition}
                          onChange={(e) => fromInput('automation_condition', e.target.value)}
                          className="w-full rounded-xl border border-[#00B0FF]/30 bg-white px-4 py-2.5 text-slate-800 outline-none focus:ring-2 focus:ring-[#00B0FF]/20 focus:border-[#00B0FF] transition-all"
                        >
                          {CONDITION_OPERATORS.map((op) => (
                            <option key={op.id} value={op.id}>
                              {op.symbol} {op.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Threshold
                        </label>
                        <input
                          type="number"
                          value={form.automation_threshold}
                          onChange={(e) => fromInput('automation_threshold', e.target.value)}
                          className="w-full rounded-xl border border-[#00B0FF]/30 bg-white px-4 py-2.5 text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-[#00B0FF]/20 focus:border-[#00B0FF] transition-all"
                          placeholder="e.g., 10, 100, 500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Points Reward <span className="text-xs text-slate-400">(Optional)</span>
                      </label>
                      <input
                        type="number"
                        value={form.automation_points_reward}
                        onChange={(e) => fromInput('automation_points_reward', e.target.value)}
                        className="w-full rounded-xl border border-[#00B0FF]/30 bg-white px-4 py-2.5 text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-[#00B0FF]/20 focus:border-[#00B0FF] transition-all"
                        placeholder="Points to award (e.g., 50)"
                      />
                    </div>

                    {/* Preview */}
                    {form.automation_trigger && form.automation_threshold && (
                      <div className="mt-2 p-3 bg-[#00B0FF]/10 rounded-xl border border-[#00B0FF]/20">
                        <div className="flex items-center gap-2 mb-2">
                          <EyeIcon />
                          <span className="text-xs font-medium text-[#00B0FF]">Automation Preview</span>
                        </div>
                        <p className="text-xs text-slate-600">
                          When a learner's <span className="font-semibold text-[#1A237E]">
                            {BADGE_TRIGGERS.find(t => t.id === form.automation_trigger)?.name}
                          </span> is 
                          <span className="font-semibold text-[#00B0FF]"> {getOperatorSymbol(form.automation_condition)} {form.automation_threshold}</span>,
                          they will automatically receive the badge
                          {form.automation_points_reward > 0 && ` and earn ${form.automation_points_reward} points`}.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Active Toggle */}
                <div className="flex items-center justify-between py-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <div className="w-8 h-8 bg-[#008080]/10 rounded-lg flex items-center justify-center">
                      <CheckIcon />
                    </div>
                    <div>
                      <span className="text-sm font-medium text-slate-700">Active Badge</span>
                      <p className="text-xs text-slate-500">Visible and earnable by learners</p>
                    </div>
                  </label>
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => fromInput('is_active', e.target.checked)}
                    className="w-5 h-5 rounded border-[#00B0FF]/30 text-[#008080] focus:ring-[#008080] focus:ring-offset-0 accent-[#008080]"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <button 
                    type="submit" 
                    disabled={saving || uploading}
                    className="flex-1 bg-[#00B0FF] text-white py-3 rounded-xl font-medium hover:bg-[#008080] transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {saving ? <LoaderIcon /> : <SaveIcon />}
                    {selectedBadge ? 'Update Badge' : 'Create Badge'}
                  </button>
                  <button 
                    type="button" 
                    onClick={resetForm}
                    className="px-5 py-3 border border-[#00B0FF]/30 rounded-xl hover:bg-[#00B0FF]/10 transition-all text-slate-600"
                  >
                    <RefreshIcon />
                  </button>
                </div>
              </form>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default AdminBadges;