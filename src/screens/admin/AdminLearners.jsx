import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import API_URL from '../../config';
import {
  Users, Plus, Search, Filter, Edit, History,
  Trophy, BookOpen, GraduationCap, User, UserPlus,
  RefreshCw, ChevronDown, ChevronRight, X,
  Sparkles, Award, TrendingUp, Clock, Star, Eye, EyeOff, RotateCcw
} from 'lucide-react';

// Primary School Levels (Standards 1-8)
const PRIMARY_LEVELS = [
  { id: 'standard-1', name: 'Standard 1', grade: 1, type: 'primary' },
  { id: 'standard-2', name: 'Standard 2', grade: 2, type: 'primary' },
  { id: 'standard-3', name: 'Standard 3', grade: 3, type: 'primary' },
  { id: 'standard-4', name: 'Standard 4', grade: 4, type: 'primary' },
  { id: 'standard-5', name: 'Standard 5', grade: 5, type: 'primary' },
  { id: 'standard-6', name: 'Standard 6', grade: 6, type: 'primary' },
  { id: 'standard-7', name: 'Standard 7', grade: 7, type: 'primary' },
  { id: 'standard-8', name: 'Standard 8', grade: 8, type: 'primary' }
];

// Secondary School Levels (Form 1-4)
const SECONDARY_LEVELS = [
  { id: 'form-1', name: 'Form 1', grade: 9, type: 'secondary' },
  { id: 'form-2', name: 'Form 2', grade: 10, type: 'secondary' },
  { id: 'form-3', name: 'Form 3', grade: 11, type: 'secondary' },
  { id: 'form-4', name: 'Form 4', grade: 12, type: 'secondary' }
];

// All levels combined
const ALL_LEVELS = [...PRIMARY_LEVELS, ...SECONDARY_LEVELS];

// Helper to get level index (for boundary checking)
const getLevelIndex = (level) => ALL_LEVELS.findIndex(l => l.id === level);

// Helper to check if level is within class boundary
const isLevelWithinClass = (level, classLevel) => {
  const levelIndex = getLevelIndex(level);
  const classIndex = getLevelIndex(classLevel);
  return levelIndex <= classIndex;
};

// Helper to check if level is secondary
const isSecondaryLevel = (level) => {
  return level && level.startsWith('form');
};

// Helper to get level type label
const getLevelTypeLabel = (level) => {
  if (!level) return '';
  return isSecondaryLevel(level) ? 'Secondary' : 'Primary';
};

const AdminLearners = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [learners, setLearners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingClass, setUpdatingClass] = useState(null);
  const [updatingLevel, setUpdatingLevel] = useState(null);
  const [generatedRegNumber, setGeneratedRegNumber] = useState('');
  const [selectedLearner, setSelectedLearner] = useState(null);
  const [showLevelModal, setShowLevelModal] = useState(false);
  const [showLevelHistoryModal, setShowLevelHistoryModal] = useState(false);
  const [levelHistory, setLevelHistory] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterType, setFilterType] = useState(''); // 'primary' or 'secondary'
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('portal-theme');
    return savedTheme ? savedTheme === 'dark' : false;
  });
  const [form, setForm] = useState({ 
    username: '', 
    full_name: '', 
    registration_number: '', 
    class_level: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => { 
    fetchLearners();
    generateRegistrationNumber();
  }, []);

  useEffect(() => {
    localStorage.setItem('portal-theme', isDarkMode ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  const fetchLearners = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const { data } = await axios.get(`${API_URL}/api/admin/learners`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLearners(data.learners || []);
    } catch (error) {
      toast.error('Unable to load learners.');
    } finally {
      setLoading(false);
    }
  };

  const generateAlphaNumeric = (length) => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  };

  const generateRegistrationNumber = () => {
    const alphaNum = generateAlphaNumeric(3);
    const regNumber = `LE-26-${alphaNum}`;
    setGeneratedRegNumber(regNumber);
    setForm(prev => ({ ...prev, registration_number: regNumber }));
  };

  const handleRegenerateNumber = () => {
    generateRegistrationNumber();
    toast.success('New registration number generated!');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username.trim() || !form.full_name.trim() || !form.registration_number.trim() || !form.class_level) {
      return toast.error('Required fields are missing.');
    }
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/api/admin/learners`, form, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Learner registered successfully!');
      setForm({ 
        username: '', 
        full_name: '', 
        class_level: '',
        registration_number: '',
        password: ''
      });
      generateRegistrationNumber();
      fetchLearners();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateClassLevel = async (learnerId, classLevel) => {
    try {
      setUpdatingClass(learnerId);
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/api/admin/learners/${learnerId}/class`, 
        { class_level: classLevel },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Class level updated successfully! Current level synced.');
      fetchLearners();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update class level');
    } finally {
      setUpdatingClass(null);
    }
  };

  const handleUpdateCurrentLevel = async (learnerId, newLevel) => {
    const learner = learners.find(l => l.id === learnerId);
    if (!learner) {
      toast.error('Learner not found');
      return;
    }
    
    if (!isLevelWithinClass(newLevel, learner.class_level)) {
      toast.error(`Cannot set current level above class level (${getLevelDisplayName(learner.class_level)})`);
      return;
    }
    
    try {
      setUpdatingLevel(learnerId);
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/api/admin/learners/${learnerId}/current-level`,
        { current_level: newLevel },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Current level updated successfully!');
      fetchLearners();
      setShowLevelModal(false);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update current level');
    } finally {
      setUpdatingLevel(null);
    }
  };

  const handleRefundAllPoints = async (learner) => {
    if (!window.confirm(`Refund all redeemed points to ${learner.full_name}? This will reverse all non-collected redemptions.`)) return;
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.post(`${API_URL}/api/admin/redemptions/refund-all`,
        { userId: learner.id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(data.message || 'Points refunded successfully!');
      fetchLearners();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to refund points.');
    }
  };

  const fetchLevelHistory = async (learnerId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/admin/learners/${learnerId}/level-history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLevelHistory(response.data.history || []);
      setShowLevelHistoryModal(true);
    } catch (error) {
      toast.error('Failed to load level history');
    }
  };

  const getLevelDisplayName = (level) => {
    if (!level) return 'Not Set';
    const found = ALL_LEVELS.find(l => l.id === level);
    return found ? found.name : level.split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
  };

  const getLevelColor = (level) => {
    if (!level) return 'bg-gray-100 text-gray-600';
    
    if (isSecondaryLevel(level)) {
      // Secondary levels: purple shades
      if (level === 'form-1') return 'bg-purple-100 text-purple-700';
      if (level === 'form-2') return 'bg-purple-200 text-purple-800';
      if (level === 'form-3') return 'bg-purple-300 text-purple-900';
      return 'bg-purple-400 text-white';
    }
    
    // Primary levels: original colors
    const levelNum = parseInt(level.split('-')[1]);
    if (isNaN(levelNum)) return 'bg-gray-100 text-gray-600';
    if (levelNum <= 2) return 'bg-green-100 text-green-700';
    if (levelNum <= 4) return 'bg-blue-100 text-blue-700';
    if (levelNum <= 6) return 'bg-purple-100 text-purple-700';
    return 'bg-orange-100 text-orange-700';
  };

  const getAvailableLevelsForLearner = (classLevel) => {
    if (!classLevel) return ALL_LEVELS;
    const classIndex = getLevelIndex(classLevel);
    return classIndex === -1 ? ALL_LEVELS : ALL_LEVELS.slice(0, classIndex + 1);
  };

  const getLevelTypeIcon = (level) => {
    if (!level) return '📚';
    return isSecondaryLevel(level) ? '🎓' : '📚';
  };

  const totalPoints = learners.reduce((sum, l) => sum + (l.current_points || 0), 0);
  const learnersWithLevels = learners.filter(l => l.current_level).length;
  const secondaryStudents = learners.filter(l => l.class_level && isSecondaryLevel(l.class_level)).length;
  const primaryStudents = learners.filter(l => l.class_level && !isSecondaryLevel(l.class_level)).length;

  const filteredLearners = learners.filter(learner => {
    const matchesSearch = learner.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          learner.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          learner.registration_number?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = !filterClass || learner.class_level === filterClass;
    const matchesType = !filterType || 
      (filterType === 'primary' && learner.class_level && !isSecondaryLevel(learner.class_level)) ||
      (filterType === 'secondary' && learner.class_level && isSecondaryLevel(learner.class_level));
    return matchesSearch && matchesClass && matchesType;
  });

  return (
    <div className={`min-h-screen w-full max-w-full transition-all duration-500 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' 
        : 'bg-gradient-to-br from-slate-50 via-white to-slate-50'
    }`}>
      
      <main className="w-full px-0 sm:px-0 lg:px-0 py-4 max-w-full">
        {/* Stat Cards */}
        <div className="grid grid-cols-5 gap-2 mb-5 w-full">
          {/* Total Learners Card */}
          <div className={`rounded-lg px-3 py-2 transition-all duration-300 border-2 ${
            isDarkMode 
              ? 'bg-blue-900/30 backdrop-blur-sm border-teal-400' 
              : 'bg-blue-50 border-teal-500 shadow-md'
          }`}>
            <p className={`text-[9px] uppercase tracking-wider ${
              isDarkMode ? 'text-blue-300' : 'text-[#19475B]'
            }`}>
              Total Learners
            </p>
            <p className={`text-lg font-bold ${
              isDarkMode ? 'text-blue-200' : 'text-[#19475B]'
            }`}>
              {learners.length}
            </p>
          </div>

          {/* Total Points Card */}
          <div className={`rounded-lg px-3 py-2 transition-all duration-300 border-2 ${
            isDarkMode 
              ? 'bg-emerald-900/30 backdrop-blur-sm border-teal-400' 
              : 'bg-emerald-50 border-teal-500 shadow-md'
          }`}>
            <p className={`text-[9px] uppercase tracking-wider ${
              isDarkMode ? 'text-emerald-300' : 'text-[#19475B]'
            }`}>
              Total Points
            </p>
            <p className={`text-lg font-bold ${
              isDarkMode ? 'text-emerald-200' : 'text-[#19475B]'
            }`}>
              {totalPoints.toLocaleString()}
            </p>
          </div>

          {/* Primary Students Card */}
          <div className={`rounded-lg px-3 py-2 transition-all duration-300 border-2 ${
            isDarkMode 
              ? 'bg-green-900/30 backdrop-blur-sm border-teal-400' 
              : 'bg-green-50 border-teal-500 shadow-md'
          }`}>
            <p className={`text-[9px] uppercase tracking-wider ${
              isDarkMode ? 'text-green-300' : 'text-[#19475B]'
            }`}>
              Primary Students
            </p>
            <p className={`text-lg font-bold ${
              isDarkMode ? 'text-green-200' : 'text-[#19475B]'
            }`}>
              {primaryStudents}
            </p>
          </div>

          {/* Secondary Students Card */}
          <div className={`rounded-lg px-3 py-2 transition-all duration-300 border-2 ${
            isDarkMode 
              ? 'bg-purple-900/30 backdrop-blur-sm border-teal-400' 
              : 'bg-purple-50 border-teal-500 shadow-md'
          }`}>
            <p className={`text-[9px] uppercase tracking-wider ${
              isDarkMode ? 'text-purple-300' : 'text-[#19475B]'
            }`}>
              Secondary Students
            </p>
            <p className={`text-lg font-bold ${
              isDarkMode ? 'text-purple-200' : 'text-[#19475B]'
            }`}>
              {secondaryStudents}
            </p>
          </div>

          {/* With Levels Card */}
          <div className={`rounded-lg px-3 py-2 transition-all duration-300 border-2 ${
            isDarkMode 
              ? 'bg-orange-900/30 backdrop-blur-sm border-teal-400' 
              : 'bg-orange-50 border-teal-500 shadow-md'
          }`}>
            <p className={`text-[9px] uppercase tracking-wider ${
              isDarkMode ? 'text-orange-300' : 'text-[#19475B]'
            }`}>
              With Levels
            </p>
            <p className={`text-lg font-bold ${
              isDarkMode ? 'text-orange-200' : 'text-[#19475B]'
            }`}>
              {learnersWithLevels}
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2 w-full">
          
          {/* Registration Column */}
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
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-md ${
                  isDarkMode ? 'bg-emerald-500/30' : 'bg-emerald-500'
                }`}>
                  <UserPlus size={16} className={isDarkMode ? 'text-emerald-300' : 'text-white'} />
                </div>
                <div>
                  <h3 className={`font-bold text-sm ${
                    isDarkMode ? 'text-emerald-300' : 'text-[#19475B]'
                  }`}>
                    New Learner
                  </h3>
                  <p className={`text-[11px] ${
                    isDarkMode ? 'text-emerald-300/70' : 'text-[#19475B]/70'
                  }`}>
                    Register a student account
                  </p>
                </div>
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="p-4 space-y-3.5">
              <div>
                <label className={`block text-xs font-semibold mb-1 ${
                  isDarkMode ? 'text-slate-300' : 'text-[#19475B]'
                }`}>
                  Username <span className="text-red-500 text-xs">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter username"
                  value={form.username}
                  onChange={(e) => setForm({...form, username: e.target.value})}
                  className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-500 transition-all ${
                    isDarkMode 
                      ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500 focus:border-transparent' 
                      : 'bg-white border-slate-200 text-[#19475B] placeholder-slate-400 focus:border-transparent'
                  }`}
                  required
                />
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1 ${
                  isDarkMode ? 'text-slate-300' : 'text-[#19475B]'
                }`}>
                  Full Name <span className="text-red-500 text-xs">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter full name"
                  value={form.full_name}
                  onChange={(e) => setForm({...form, full_name: e.target.value})}
                  className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-500 transition-all ${
                    isDarkMode 
                      ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500 focus:border-transparent' 
                      : 'bg-white border-slate-200 text-[#19475B] placeholder-slate-400 focus:border-transparent'
                  }`}
                  required
                />
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1 ${
                  isDarkMode ? 'text-slate-300' : 'text-[#19475B]'
                }`}>
                  Registration Number <span className="text-teal-500 text-[10px]">(Auto-generated)</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={form.registration_number}
                    readOnly
                    className={`flex-1 rounded-lg border px-3 py-2 text-sm font-mono font-semibold cursor-not-allowed ${
                      isDarkMode 
                        ? 'bg-slate-900/50 border-slate-700 text-teal-400' 
                        : 'bg-gray-50 border-slate-200 text-[#19475B]'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={handleRegenerateNumber}
                    className="px-3 py-2 rounded-lg bg-teal-500 text-white text-sm font-medium hover:bg-teal-600 transition shadow-md whitespace-nowrap"
                  >
                    New
                  </button>
                </div>
                <p className={`text-[10px] mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-400'}`}>
                  Format: LE-26-XXX
                </p>
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1 ${
                  isDarkMode ? 'text-slate-300' : 'text-[#19475B]'
                }`}>
                  Initial Class Level <span className="text-red-500 text-xs">*</span>
                </label>
                <select
                  value={form.class_level}
                  onChange={(e) => setForm({...form, class_level: e.target.value})}
                  className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-500 transition-all ${
                    isDarkMode 
                      ? 'bg-slate-900 border-slate-700 text-white focus:border-transparent' 
                      : 'bg-white border-slate-200 text-[#19475B] focus:border-transparent'
                  }`}
                  required
                >
                  <option value="">Select a class</option>
                  <optgroup label="📚 Primary School">
                    {PRIMARY_LEVELS.map(level => (
                      <option key={level.id} value={level.id}>
                        {level.name}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="🎓 Secondary School">
                    {SECONDARY_LEVELS.map(level => (
                      <option key={level.id} value={level.id}>
                        {level.name}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1 ${
                  isDarkMode ? 'text-slate-300' : 'text-[#19475B]'
                }`}>
                  Password <span className={`text-[10px] font-normal ${isDarkMode ? 'text-slate-400' : 'text-slate-400'}`}>(leave blank to use reg. number)</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter password or leave blank"
                    value={form.password}
                    onChange={(e) => setForm({...form, password: e.target.value})}
                    className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-500 transition-all pr-10 ${
                      isDarkMode 
                        ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500 focus:border-transparent' 
                        : 'bg-white border-slate-200 text-[#19475B] placeholder-slate-400 focus:border-transparent'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <button 
                disabled={saving} 
                className={`w-full py-2.5 rounded-lg text-sm font-bold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md ${
                  isDarkMode 
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:shadow-lg hover:scale-105' 
                    : 'bg-gradient-to-r from-teal-500 to-teal-600 text-white hover:shadow-lg hover:scale-105'
                }`}
              >
                {saving ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    Register Learner
                  </>
                )}
              </button>

              <div className={`text-[10px] text-center pt-1 border-t ${
                isDarkMode ? 'border-slate-700 text-slate-400' : 'border-slate-200 text-slate-400'
              }`}>
                <span className="text-red-500">*</span> Required fields
              </div>
            </form>
          </div>

          {/* Roster / Table Management Column */}
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
                    Learner Roster
                  </h2>
                  <p className={`text-[11px] mt-0.5 ${
                    isDarkMode ? 'text-emerald-300/70' : 'text-[#19475B]/70'
                  }`}>
                    Manage and monitor student accounts
                  </p>
                </div>
                <div className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                  isDarkMode 
                    ? 'bg-emerald-500/20 text-emerald-300' 
                    : 'bg-emerald-100 text-[#19475B]'
                }`}>
                  {learners.length} students
                </div>
              </div>
            </div>

            {/* Filtering Tools Panel */}
            <div className="p-3 border-b border-slate-200 dark:border-slate-700">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex-1 relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by name, username, or registration..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`w-full pl-9 pr-3 py-1.5 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-teal-500 transition-all ${
                      isDarkMode 
                        ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500 focus:border-transparent' 
                        : 'bg-white border-slate-200 text-[#19475B] placeholder-slate-400 focus:border-transparent'
                    }`}
                  />
                </div>
                <div className="sm:w-36">
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className={`w-full px-3 py-1.5 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-teal-500 transition-all ${
                      isDarkMode 
                        ? 'bg-slate-900 border-slate-700 text-white focus:border-transparent' 
                        : 'bg-white border-slate-200 text-[#19475B] focus:border-transparent'
                    }`}
                  >
                    <option value="">All Types</option>
                    <option value="primary">📚 Primary</option>
                    <option value="secondary">🎓 Secondary</option>
                  </select>
                </div>
                <div className="sm:w-40">
                  <select
                    value={filterClass}
                    onChange={(e) => setFilterClass(e.target.value)}
                    className={`w-full px-3 py-1.5 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-teal-500 transition-all ${
                      isDarkMode 
                        ? 'bg-slate-900 border-slate-700 text-white focus:border-transparent' 
                        : 'bg-white border-slate-200 text-[#19475B] focus:border-transparent'
                    }`}
                  >
                    <option value="">All Classes</option>
                    <optgroup label="📚 Primary School">
                      {PRIMARY_LEVELS.map(level => (
                        <option key={level.id} value={level.id}>
                          {level.name}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="🎓 Secondary School">
                      {SECONDARY_LEVELS.map(level => (
                        <option key={level.id} value={level.id}>
                          {level.name}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>
                {(searchTerm || filterClass || filterType) && (
                  <button
                    onClick={() => { setSearchTerm(''); setFilterClass(''); setFilterType(''); }}
                    className={`px-3 py-1.5 text-sm rounded-lg border transition ${
                      isDarkMode 
                        ? 'border-slate-700 text-slate-300 hover:bg-slate-700' 
                        : 'border-slate-200 text-[#19475B] hover:bg-slate-100'
                    }`}
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </div>

            <div className="p-3 max-h-[60vh] overflow-y-auto custom-scrollbar">
              {loading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((item) => (
                    <div key={item} className={`h-16 rounded-xl animate-pulse ${isDarkMode ? 'bg-slate-700/50' : 'bg-slate-100'}`} />
                  ))}
                </div>
              ) : filteredLearners.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-5xl mb-3">👨‍🎓</div>
                  <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-[#19475B]/70'}`}>
                    {searchTerm || filterClass || filterType ? 'No learners match your filtered settings' : 'No learners registered yet'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredLearners.map((learner, idx) => {
                    const isSecondary = learner.class_level && isSecondaryLevel(learner.class_level);
                    return (
                      <div
                        key={learner.id}
                        className={`group rounded-xl p-3 transition-all duration-300 border ${
                          isDarkMode
                            ? (isSecondary
                              ? 'bg-slate-900/50 border-slate-700 hover:border-purple-500/30 hover:shadow-lg'
                              : 'bg-slate-900/50 border-slate-700 hover:border-emerald-500/30 hover:shadow-lg')
                            : (isSecondary
                              ? 'bg-white border-slate-200 hover:border-purple-500 hover:shadow-lg'
                              : 'bg-white border-slate-200 hover:border-teal-500 hover:shadow-lg')
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                            isDarkMode 
                              ? isSecondary ? 'bg-purple-500/20 text-purple-400' : 'bg-emerald-500/20 text-emerald-400'
                              : isSecondary ? 'bg-purple-100 text-purple-600' : 'bg-emerald-100 text-emerald-600'
                          }`}>
                            {idx + 1}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <h3 className={`font-bold text-sm ${
                                  isDarkMode ? 'text-white' : 'text-[#19475B]'
                                }`}>
                                  {learner.full_name}
                                  {isSecondary && (
                                    <span className="ml-1.5 text-[10px] font-medium text-purple-500 dark:text-purple-400">
                                      🎓
                                    </span>
                                  )}
                                </h3>
                                <p className={`text-[11px] ${isDarkMode ? 'text-slate-400' : 'text-[#19475B]/70'}`}>
                                  @{learner.username}
                                </p>
                              </div>
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => {
                                    setSelectedLearner(learner);
                                    setShowLevelModal(true);
                                  }}
                                  className={`p-1 rounded-lg transition ${isSecondary ? 'hover:bg-purple-500/10' : 'hover:bg-teal-500/10'}`}
                                >
                                  <Edit size={14} className={isSecondary ? 'text-purple-500' : 'text-teal-500'} />
                                </button>
                                <button
                                  onClick={() => fetchLevelHistory(learner.id)}
                                  className="p-1 rounded-lg hover:bg-blue-500/10 transition"
                                  title="Level History"
                                >
                                  <History size={14} className="text-blue-500" />
                                </button>
                                <button
                                  onClick={() => handleRefundAllPoints(learner)}
                                  className="p-1 rounded-lg hover:bg-amber-500/10 transition"
                                  title="Refund all points"
                                >
                                  <RotateCcw size={14} className="text-amber-500" />
                                </button>
                              </div>
                            </div>
                            
                            <div className="flex flex-wrap gap-1.5 mt-1.5">
                              <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full ${
                                isDarkMode 
                                  ? isSecondary ? 'bg-purple-500/20 text-purple-400' : 'bg-teal-500/20 text-teal-400'
                                  : isSecondary ? 'bg-purple-100 text-purple-700' : 'bg-teal-100 text-[#19475B]'
                              }`}>
                                {learner.registration_number}
                              </span>
                              <select
                                value={learner.class_level || ''}
                                disabled={updatingClass === learner.id}
                                onChange={(e) => handleUpdateClassLevel(learner.id, e.target.value)}
                                className={`text-[10px] rounded-md py-0.5 px-1.5 border disabled:opacity-50 ${
                                  isSecondary
                                    ? 'focus:outline-none focus:ring-2 focus:ring-purple-500/20'
                                    : 'focus:outline-none focus:ring-2 focus:ring-teal-500/20'
                                } ${
                                  isDarkMode 
                                    ? isSecondary ? 'bg-purple-900/30 border-purple-600 text-purple-400' : 'bg-slate-800 border-slate-600 text-teal-400'
                                    : isSecondary ? 'bg-purple-50 border-purple-200 text-purple-700' : 'bg-teal-50 border-teal-200 text-[#19475B]'
                                }`}
                              >
                                <option value="">Not Set</option>
                                <optgroup label="📚 Primary">
                                  {PRIMARY_LEVELS.map(cl => (
                                    <option key={cl.id} value={cl.id}>{cl.name}</option>
                                  ))}
                                </optgroup>
                                <optgroup label="🎓 Secondary">
                                  {SECONDARY_LEVELS.map(cl => (
                                    <option key={cl.id} value={cl.id}>{cl.name}</option>
                                  ))}
                                </optgroup>
                              </select>
                              {learner.current_level ? (
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${getLevelColor(learner.current_level)}`}>
                                  {getLevelTypeLabel(learner.current_level)} {getLevelDisplayName(learner.current_level)}
                                </span>
                              ) : (
                                <span className={`text-[10px] italic ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                                  Not Set
                                </span>
                              )}
                              <span className={`text-[10px] font-bold ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                                {learner.current_points || 0} pts
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

            {/* Bottom Summary Tool */}
            <div className={`p-3 border-t ${
              isDarkMode 
                ? 'border-slate-700 bg-slate-900/50' 
                : 'border-slate-200 bg-gray-50'
            }`}>
              <div className="flex justify-between items-center text-[11px]">
                <span className={isDarkMode ? 'text-slate-400' : 'text-[#19475B]/70'}>
                  Totaling {learners.length} active entries • {primaryStudents} Primary • {secondaryStudents} Secondary
                </span>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded-md font-medium flex items-center gap-1 ${
                    isDarkMode 
                      ? 'bg-emerald-500/20 text-emerald-300' 
                      : 'bg-teal-100 text-[#19475B]'
                  }`}>
                    <Sparkles size={10} /> {learnersWithLevels} milestones
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Level Edit Modal */}
      {showLevelModal && selectedLearner && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${
          isDarkMode ? 'bg-black/80' : 'bg-black/40'
        } backdrop-blur-sm`} onClick={() => setShowLevelModal(false)}>
          <div className={`rounded-2xl max-w-md w-full shadow-2xl border ${
            isDarkMode 
              ? 'bg-slate-800 border-teal-400/30' 
              : 'bg-white border-teal-500'
          }`} onClick={(e) => e.stopPropagation()}>
            <div className={`p-4 border-b ${
              isDarkMode 
                ? 'border-teal-400/30 bg-emerald-900/20' 
                : 'border-teal-500/30 bg-gradient-to-r from-emerald-50 to-green-50'
            } flex justify-between items-center`}>
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-md ${
                  isDarkMode ? 'bg-teal-500/30' : 'bg-teal-500'
                }`}>
                  <Edit size={16} className="text-white" />
                </div>
                <div>
                  <h3 className={`text-sm font-bold ${isDarkMode ? 'text-emerald-300' : 'text-[#19475B]'}`}>
                    Update Progression Level
                  </h3>
                  <p className={`text-[11px] ${isDarkMode ? 'text-emerald-300/70' : 'text-[#19475B]/70'}`}>
                    {selectedLearner.full_name}
                    {selectedLearner.class_level && isSecondaryLevel(selectedLearner.class_level) && (
                      <span className="ml-1 text-purple-500">🎓</span>
                    )}
                  </p>
                </div>
              </div>
              <button onClick={() => setShowLevelModal(false)} className={`p-1 rounded-lg transition ${
                isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-100'
              }`}>
                <X size={18} className={isDarkMode ? 'text-slate-400' : 'text-gray-400'} />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <div className={`p-3 rounded-lg border ${
                isDarkMode 
                  ? 'bg-amber-500/10 border-amber-500/30' 
                  : 'bg-amber-50 border-amber-200'
              }`}>
                <p className={`text-xs flex items-start gap-1.5 leading-relaxed ${
                  isDarkMode ? 'text-amber-400' : 'text-amber-800'
                }`}>
                  <span>⚠️</span>
                  <span><strong>Boundary Warning:</strong> Progress cannot exceed the student's class level boundary ({getLevelDisplayName(selectedLearner.class_level)}).</span>
                </p>
              </div>
              <div className="space-y-1">
                <label className={`text-xs font-semibold ${isDarkMode ? 'text-slate-300' : 'text-[#19475B]'}`}>
                  Select Milestone Level
                </label>
                <select
                  value={selectedLearner.current_level || ''}
                  onChange={(e) => setSelectedLearner({...selectedLearner, current_level: e.target.value})}
                  className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-500 transition-all ${
                    isDarkMode 
                      ? 'bg-slate-900 border-slate-700 text-white focus:border-transparent' 
                      : 'bg-white border-slate-200 text-[#19475B] focus:border-transparent'
                  }`}
                >
                  <option value="">Select Level</option>
                  <optgroup label="📚 Primary School">
                    {getAvailableLevelsForLearner(selectedLearner.class_level)
                      .filter(l => !isSecondaryLevel(l.id))
                      .map(level => (
                        <option key={level.id} value={level.id}>
                          {level.name} {level.id === selectedLearner.class_level ? " (Class Boundary)" : ""}
                        </option>
                      ))}
                  </optgroup>
                  <optgroup label="🎓 Secondary School">
                    {getAvailableLevelsForLearner(selectedLearner.class_level)
                      .filter(l => isSecondaryLevel(l.id))
                      .map(level => (
                        <option key={level.id} value={level.id}>
                          {level.name} {level.id === selectedLearner.class_level ? " (Class Boundary)" : ""}
                        </option>
                      ))}
                  </optgroup>
                </select>
                {selectedLearner.current_level && isSecondaryLevel(selectedLearner.current_level) && (
                  <p className="text-[10px] text-purple-500 dark:text-purple-400 mt-1">
                    🎓 Secondary school level selected
                  </p>
                )}
              </div>
            </div>
            <div className={`p-3 border-t rounded-b-2xl flex justify-end gap-2 ${
              isDarkMode 
                ? 'border-slate-700 bg-slate-900/50' 
                : 'border-slate-200 bg-gray-50'
            }`}>
              <button
                onClick={() => setShowLevelModal(false)}
                className={`px-3 py-1.5 rounded-lg transition text-xs font-medium ${
                  isDarkMode 
                    ? 'text-slate-300 hover:bg-slate-700' 
                    : 'text-gray-600 hover:bg-gray-200'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={() => handleUpdateCurrentLevel(selectedLearner.id, selectedLearner.current_level)}
                disabled={updatingLevel === selectedLearner.id || !selectedLearner.current_level}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed ${
                  isDarkMode 
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:shadow-lg' 
                    : 'bg-gradient-to-r from-teal-500 to-teal-600 text-white hover:shadow-lg'
                }`}
              >
                {updatingLevel === selectedLearner.id ? (
                  <>
                    <svg className="w-3 h-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Saving...
                  </>
                ) : (
                  <span>Update Level</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Level History Modal */}
      {showLevelHistoryModal && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${
          isDarkMode ? 'bg-black/80' : 'bg-black/40'
        } backdrop-blur-sm`} onClick={() => setShowLevelHistoryModal(false)}>
          <div className={`rounded-2xl max-w-md w-full max-h-[80vh] shadow-2xl flex flex-col overflow-hidden border ${
            isDarkMode 
              ? 'bg-slate-800 border-teal-400/30' 
              : 'bg-white border-teal-500'
          }`} onClick={(e) => e.stopPropagation()}>
            <div className={`p-4 border-b ${
              isDarkMode 
                ? 'border-teal-400/30 bg-blue-900/20' 
                : 'border-teal-500/30 bg-gradient-to-r from-blue-50 to-indigo-50'
            } flex justify-between items-center`}>
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-md ${
                  isDarkMode ? 'bg-blue-500/30' : 'bg-blue-500'
                }`}>
                  <History size={16} className="text-white" />
                </div>
                <div>
                  <h3 className={`text-sm font-bold ${isDarkMode ? 'text-blue-300' : 'text-[#19475B]'}`}>
                    Historical Tracking Logs
                  </h3>
                  <p className={`text-[11px] ${isDarkMode ? 'text-blue-300/70' : 'text-[#19475B]/70'}`}>
                    System performance logs
                  </p>
                </div>
              </div>
              <button onClick={() => setShowLevelHistoryModal(false)} className={`p-1 rounded-lg transition ${
                isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-100'
              }`}>
                <X size={18} className={isDarkMode ? 'text-slate-400' : 'text-gray-400'} />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto flex-1">
              {levelHistory.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">📋</div>
                  <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-[#19475B]/70'}`}>
                    No logged performance or historical trajectory details exist yet.
                  </p>
                </div>
              ) : (
                <div className="relative border-l-2 border-teal-500 ml-2 pl-4 space-y-3">
                  {levelHistory.map((item, idx) => {
                    const isSecondary = item.level_id && isSecondaryLevel(item.level_id);
                    return (
                      <div key={idx} className="relative group">
                        <div className={`absolute -left-[21px] top-1 w-3 h-3 rounded-full ring-4 ${
                          isSecondary ? 'bg-purple-500' : 'bg-teal-500'
                        } ${isDarkMode ? 'ring-slate-800' : 'ring-white'} group-hover:scale-125 transition-transform`}></div>
                        <div className={`p-3 rounded-xl border transition-shadow ${
                          isDarkMode 
                            ? 'border-slate-700 bg-slate-900/50 hover:shadow-lg' 
                            : 'border-slate-200 bg-white hover:shadow-md'
                        }`}>
                          <div className="flex items-center justify-between gap-2">
                            <span className={`text-xs font-bold ${isSecondary ? 'text-purple-500' : 'text-teal-500'}`}>
                              {getLevelDisplayName(item.level_id || item.level)}
                              {isSecondary && <span className="ml-1 text-[10px]">🎓</span>}
                            </span>
                            <span className={`text-[10px] font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-400'}`}>
                              {item.changed_at ? new Date(item.changed_at).toLocaleDateString() : 'N/A'}
                            </span>
                          </div>
                          {item.reason && (
                            <p className={`text-[11px] mt-1 italic ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                              Reason: {item.reason}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className={`p-3 border-t ${
              isDarkMode 
                ? 'border-slate-700 bg-slate-900/50' 
                : 'border-slate-200 bg-gray-50'
            } text-right`}>
              <button
                onClick={() => setShowLevelHistoryModal(false)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition border ${
                  isDarkMode 
                    ? 'border-slate-700 text-slate-300 hover:bg-slate-700' 
                    : 'border-slate-200 text-[#19475B] hover:bg-gray-100'
                }`}
              >
                Close Logs
              </button>
            </div>
          </div>
        </div>
      )}

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
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
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

export default AdminLearners;