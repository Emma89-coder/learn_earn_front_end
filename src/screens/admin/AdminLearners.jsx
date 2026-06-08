import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import API_URL from '../../config';

// Class Levels
const CLASS_LEVELS = [
  { id: 'standard-1', name: 'Standard 1', grade: 1, icon: '🌟' },
  { id: 'standard-2', name: 'Standard 2', grade: 2, icon: '⭐' },
  { id: 'standard-3', name: 'Standard 3', grade: 3, icon: '📘' },
  { id: 'standard-4', name: 'Standard 4', grade: 4, icon: '📚' },
  { id: 'standard-5', name: 'Standard 5', grade: 5, icon: '🎓' },
  { id: 'standard-6', name: 'Standard 6', grade: 6, icon: '🏆' },
  { id: 'standard-7', name: 'Standard 7', grade: 7, icon: '🎯' },
  { id: 'standard-8', name: 'Standard 8', grade: 8, icon: '⚡' }
];

// Helper function to get level index
const getLevelIndex = (level) => {
  return CLASS_LEVELS.findIndex(l => l.id === level);
};

// Helper function to check if level is within class boundary
const isLevelWithinClass = (level, classLevel) => {
  const levelIndex = getLevelIndex(level);
  const classIndex = getLevelIndex(classLevel);
  return levelIndex <= classIndex;
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
  const [form, setForm] = useState({ 
    username: '', 
    full_name: '', 
    registration_number: '', 
    class_level: '' 
  });

  useEffect(() => { 
    fetchLearners();
    generateRegistrationNumber();
  }, []);

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

  // Generate random alphanumeric string
  const generateAlphaNumeric = (length) => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  };

  // Generate registration number in format LE-26-XXX
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
    if (!form.username.trim() || !form.full_name.trim() || !form.registration_number.trim()) {
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
        class_level: '' 
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
      toast.success('Class level updated successfully! Current level has been synced.');
      fetchLearners();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update class level');
    } finally {
      setUpdatingClass(null);
    }
  };

  const handleUpdateCurrentLevel = async (learnerId, newLevel) => {
    // Find the learner
    const learner = learners.find(l => l.id === learnerId);
    if (!learner) {
      toast.error('Learner not found');
      return;
    }
    
    // Check if new level is within class boundary
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
    const found = CLASS_LEVELS.find(l => l.id === level);
    return found ? found.name : level.split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
  };

  const getLevelIcon = (level) => {
    if (!level) return '📚';
    const found = CLASS_LEVELS.find(l => l.id === level);
    return found ? found.icon : '📚';
  };

  const getLevelColor = (level) => {
    if (!level) return 'bg-gray-100 text-gray-600';
    const levelNum = parseInt(level.split('-')[1]);
    if (levelNum <= 2) return 'bg-green-100 text-green-700';
    if (levelNum <= 4) return 'bg-blue-100 text-blue-700';
    if (levelNum <= 6) return 'bg-purple-100 text-purple-700';
    return 'bg-orange-100 text-orange-700';
  };

  const getAvailableLevelsForLearner = (classLevel) => {
    if (!classLevel) return CLASS_LEVELS;
    const classIndex = getLevelIndex(classLevel);
    return CLASS_LEVELS.slice(0, classIndex + 1);
  };

  const totalPoints = learners.reduce((sum, l) => sum + (l.current_points || 0), 0);
  const learnersWithLevels = learners.filter(l => l.current_level).length;

  // SVG Icons
  const UsersIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );

  const AwardIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
  );

  const BookIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  );

  const RefreshIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  );

  const ArrowLeftIcon = () => (
    <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
  );

  const LogoutIcon = () => (
    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  );

  const UserPlusIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
    </svg>
  );

  const HistoryIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  const WarningIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );

  const getClassIcon = (classLevel) => {
    const found = CLASS_LEVELS.find(c => c.id === classLevel);
    return found ? found.icon : '📚';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6 md:p-10">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-gray-200 pb-6 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-teal-500 rounded-xl flex items-center justify-center shadow-md text-white">
                <UsersIcon />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-800">
                Learner Management
              </h1>
            </div>
            <p className="text-gray-500 ml-1">Manage, add, and monitor your student roster.</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => navigate('/admin-dashboard')} 
              className="group flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-300 shadow-sm"
            >
              <ArrowLeftIcon />
              <span>Back</span>
            </button>
            <button 
              onClick={logout} 
              className="group flex items-center gap-2 px-5 py-2.5 bg-teal-600 rounded-xl text-white font-semibold hover:bg-teal-700 transition-all duration-300 shadow-md"
            >
              <LogoutIcon />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-5 mb-8">
          <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-all duration-300 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Learners</p>
                <p className="text-3xl font-bold text-gray-800">{learners.length}</p>
              </div>
              <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center text-teal-600">
                <UsersIcon />
              </div>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-all duration-300 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Points</p>
                <p className="text-3xl font-bold text-teal-600">{totalPoints}</p>
              </div>
              <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center text-teal-600">
                <AwardIcon />
              </div>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-all duration-300 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Active Classes</p>
                <p className="text-3xl font-bold text-gray-800">{new Set(learners.map(l => l.class_level).filter(Boolean)).size}</p>
              </div>
              <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center text-teal-600">
                <BookIcon />
              </div>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-all duration-300 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">With Levels</p>
                <p className="text-3xl font-bold text-teal-600">{learnersWithLevels}</p>
              </div>
              <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center text-teal-600">
                <AwardIcon />
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr_380px] gap-8">
          
          {/* List Section */}
          <section>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center text-teal-600">
                <UsersIcon />
              </div>
              <h2 className="text-xl font-semibold text-gray-800">Registered Learners</h2>
              <span className="px-2.5 py-0.5 bg-teal-100 rounded-full text-xs text-teal-600 ml-2">{learners.length}</span>
            </div>
            
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-white border border-gray-200 p-4 rounded-xl animate-pulse">
                      <div className="h-5 bg-gray-200 rounded w-1/3 mb-2"></div>
                      <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : learners.length === 0 ? (
                <div className="bg-white border-2 border-dashed border-gray-300 rounded-xl p-12 text-center">
                  <div className="w-12 h-12 mx-auto mb-3 text-gray-400">
                    <UsersIcon />
                  </div>
                  <p className="text-gray-500">No learners registered yet</p>
                  <p className="text-sm text-gray-400 mt-1">Use the form to add your first learner</p>
                </div>
              ) : (
                learners.map((learner, idx) => {
                  const availableLevels = getAvailableLevelsForLearner(learner.class_level);
                  const isLevelWarning = learner.current_level && learner.class_level && 
                    getLevelIndex(learner.current_level) < getLevelIndex(learner.class_level);
                  
                  return (
                    <div 
                      key={learner.id} 
                      className="group bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md hover:border-gray-300 transition-all duration-300"
                    >
                      <div className="flex justify-between items-start flex-wrap gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-mono text-gray-400">#{idx + 1}</span>
                            <h3 className="font-semibold text-gray-800 group-hover:text-teal-600 transition-colors">
                              {learner.full_name}
                            </h3>
                            {/* Class Level Badge */}
                            {learner.class_level && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-teal-100 text-teal-700">
                                📚 {getLevelDisplayName(learner.class_level)}
                              </span>
                            )}
                            {/* Current Level Badge */}
                            {learner.current_level && (
                              <span className={`text-xs px-2 py-0.5 rounded-full ${getLevelColor(learner.current_level)}`}>
                                {getLevelIcon(learner.current_level)} {getLevelDisplayName(learner.current_level)}
                              </span>
                            )}
                            {isLevelWarning && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 flex items-center gap-1">
                                <WarningIcon /> Behind Class
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            @{learner.username} • <span className="font-mono font-semibold text-gray-600">{learner.registration_number}</span>
                          </p>
                        </div>
                        
                        {/* Class Level Dropdown */}
                        <div className="flex flex-col items-end gap-2">
                          <div className="flex items-center gap-2">
                            <select
                              value={learner.class_level || ''}
                              onChange={(e) => handleUpdateClassLevel(learner.id, e.target.value)}
                              disabled={updatingClass === learner.id}
                              className="text-sm px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-gray-700 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <option value="">Select Class</option>
                              {CLASS_LEVELS.map(level => (
                                <option key={level.id} value={level.id}>
                                  {level.icon} {level.name}
                                </option>
                              ))}
                            </select>
                            {updatingClass === learner.id && (
                              <div className="w-4 h-4 border-2 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
                            )}
                          </div>
                          
                          {/* Current Level Display with Edit Button */}
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-gray-400">Current Level:</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${getLevelColor(learner.current_level)}`}>
                                {getLevelIcon(learner.current_level)} {getLevelDisplayName(learner.current_level) || 'Not Set'}
                              </span>
                            </div>
                            <button
                              onClick={() => {
                                setSelectedLearner(learner);
                                setShowLevelModal(true);
                              }}
                              className="text-xs text-teal-500 hover:text-teal-600 transition"
                              title="Edit current level"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => fetchLevelHistory(learner.id)}
                              className="text-xs text-blue-500 hover:text-blue-600 transition"
                              title="View level history"
                            >
                              <HistoryIcon />
                            </button>
                          </div>
                          
                          <p className="text-lg font-bold text-teal-600">{learner.current_points || 0}</p>
                          <p className="text-xs text-gray-400">points</p>
                        </div>
                      </div>
                      
                      {/* Progress to Next Level */}
                      {learner.current_level && learner.class_level && (
                        <div className="mt-3 pt-2 border-t border-gray-100">
                          <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>Progress to {getLevelDisplayName(learner.current_level)} completion</span>
                            {getLevelIndex(learner.current_level) < getLevelIndex(learner.class_level) && (
                              <span className="text-teal-600">Next: {getLevelDisplayName(CLASS_LEVELS[getLevelIndex(learner.current_level) + 1]?.id)}</span>
                            )}
                            {getLevelIndex(learner.current_level) === getLevelIndex(learner.class_level) && (
                              <span className="text-green-600">✓ At class level</span>
                            )}
                          </div>
                          <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-teal-500 rounded-full transition-all duration-500"
                              style={{ width: `${Math.min(100, (learner.current_points % 500) / 5)}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </section>

          {/* Form Section */}
          <aside>
            <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-2xl p-6 sticky top-6 shadow-md">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-teal-500 rounded-xl flex items-center justify-center shadow-md text-white">
                  <UserPlusIcon />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-800">New Learner</h3>
                  <p className="text-xs text-gray-500">Register a student account</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <input
                  placeholder="Username"
                  value={form.username}
                  onChange={(e) => setForm({...form, username: e.target.value})}
                  className="w-full bg-white border border-gray-300 rounded-lg p-3 text-sm text-gray-700 placeholder-gray-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"
                  required
                />
                <input
                  placeholder="Full Name"
                  value={form.full_name}
                  onChange={(e) => setForm({...form, full_name: e.target.value})}
                  className="w-full bg-white border border-gray-300 rounded-lg p-3 text-sm text-gray-700 placeholder-gray-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"
                  required
                />
                
                {/* Auto-generated Registration Number Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Registration Number <span className="text-teal-600">(Auto-generated)</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={form.registration_number}
                      readOnly
                      className="flex-1 bg-gray-50 border border-gray-300 rounded-lg p-3 text-sm text-gray-700 font-mono font-semibold placeholder-gray-400 cursor-not-allowed"
                    />
                    <button
                      type="button"
                      onClick={handleRegenerateNumber}
                      className="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-all duration-300 flex items-center gap-1 shadow-sm"
                      title="Generate new registration number"
                    >
                      <RefreshIcon />
                      <span className="text-xs">New</span>
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Format: LE-26-XXX (Alphanumeric)</p>
                </div>

                {/* Class Level Dropdown in Form */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Initial Class Level <span className="text-teal-600">(Required)</span>
                  </label>
                  <select
                    value={form.class_level}
                    onChange={(e) => setForm({...form, class_level: e.target.value})}
                    className="w-full bg-white border border-gray-300 rounded-lg p-3 text-sm text-gray-700 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"
                    required
                  >
                    <option value="">Select a class</option>
                    {CLASS_LEVELS.map(level => (
                      <option key={level.id} value={level.id}>
                        {level.icon} {level.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-400 mt-1">
                    This will set the learner's starting level for progression. Current level will be synced with this class.
                  </p>
                </div>
                
                <button 
                  disabled={saving} 
                  className="w-full bg-teal-600 text-white py-3 rounded-lg font-bold hover:bg-teal-700 transform hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2 mt-4 shadow-md"
                >
                  {saving ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Processing...
                    </>
                  ) : (
                    <>
                      <UserPlusIcon />
                      Register Learner
                    </>
                  )}
                </button>
              </div>
            </form>
          </aside>
        </div>
      </div>

      {/* Level Edit Modal */}
      {showLevelModal && selectedLearner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowLevelModal(false)}>
          <div className="bg-white rounded-xl max-w-md w-full p-6 animate-fadeIn shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-gray-800 font-bold text-lg">Update Current Level</h3>
              <button onClick={() => setShowLevelModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <p className="text-sm text-gray-600 mb-2">
              Update the current level for <span className="font-semibold">{selectedLearner.full_name}</span>
            </p>
            <p className="text-xs text-amber-600 mb-4 bg-amber-50 p-2 rounded-lg">
              ⚠️ Current level cannot exceed class level ({getLevelDisplayName(selectedLearner.class_level)})
            </p>
            <select
              value={selectedLearner.current_level || ''}
              onChange={(e) => setSelectedLearner({...selectedLearner, current_level: e.target.value})}
              className="w-full bg-white border border-gray-300 rounded-lg p-3 text-sm text-gray-700 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all mb-4"
            >
              <option value="">Select Level</option>
              {getAvailableLevelsForLearner(selectedLearner.class_level).map(level => (
                <option key={level.id} value={level.id}>
                  {level.icon} {level.name}
                  {level.id === selectedLearner.class_level && " (Class Level)"}
                </option>
              ))}
            </select>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLevelModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleUpdateCurrentLevel(selectedLearner.id, selectedLearner.current_level)}
                disabled={updatingLevel === selectedLearner.id || !selectedLearner.current_level}
                className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updatingLevel === selectedLearner.id ? 'Updating...' : 'Update Level'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Level History Modal */}
      {showLevelHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowLevelHistoryModal(false)}>
          <div className="bg-white rounded-xl max-w-md w-full p-6 animate-fadeIn shadow-2xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-gray-800 font-bold text-lg">Level Completion History</h3>
              <button onClick={() => setShowLevelHistoryModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            {levelHistory.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No level history available</p>
            ) : (
              <div className="space-y-3">
                {levelHistory.map((item, idx) => (
                  <div key={idx} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold text-teal-600">{getLevelDisplayName(item.level)}</span>
                      <span className="text-xs text-gray-500">{new Date(item.completed_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Score: {item.score_percentage}%</span>
                      <span>Passed: {item.quizzes_passed}/{item.total_quizzes}</span>
                    </div>
                    {item.admin_override && (
                      <div className="mt-1 text-xs text-amber-600">⚠️ Admin override</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #a8a8a8;
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};

export default AdminLearners;