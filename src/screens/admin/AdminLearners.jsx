import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import API_URL from '../../config';

// Class Levels
const CLASS_LEVELS = [
  { id: 'standard-1', name: 'Standard 1', grade: 1 },
  { id: 'standard-2', name: 'Standard 2', grade: 2 },
  { id: 'standard-3', name: 'Standard 3', grade: 3 },
  { id: 'standard-4', name: 'Standard 4', grade: 4 },
  { id: 'standard-5', name: 'Standard 5', grade: 5 },
  { id: 'standard-6', name: 'Standard 6', grade: 6 },
  { id: 'standard-7', name: 'Standard 7', grade: 7 },
  { id: 'standard-8', name: 'Standard 8', grade: 8 }
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
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState('');
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

  // Filter learners based on search and class filter
  const filteredLearners = learners.filter(learner => {
    const matchesSearch = learner.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          learner.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          learner.registration_number?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = !filterClass || learner.class_level === filterClass;
    return matchesSearch && matchesClass;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6 md:p-10">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-gray-200 pb-6 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800">
              Learner Management
            </h1>
            <p className="text-gray-500 mt-1">Manage, add, and monitor your student roster.</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => navigate('/admin-dashboard')} 
              className="px-5 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-300 shadow-sm"
            >
              Back
            </button>
            <button 
              onClick={logout} 
              className="px-5 py-2.5 bg-teal-600 rounded-lg text-white font-semibold hover:bg-teal-700 transition-all duration-300 shadow-md"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Stats Cards - No Icons */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-5 mb-8">
          <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-all duration-300 shadow-sm">
            <p className="text-gray-500 text-sm">Total Learners</p>
            <p className="text-3xl font-bold text-gray-800">{learners.length}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-all duration-300 shadow-sm">
            <p className="text-gray-500 text-sm">Total Points</p>
            <p className="text-3xl font-bold text-teal-600">{totalPoints}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-all duration-300 shadow-sm">
            <p className="text-gray-500 text-sm">Active Classes</p>
            <p className="text-3xl font-bold text-gray-800">{new Set(learners.map(l => l.class_level).filter(Boolean)).size}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-all duration-300 shadow-sm">
            <p className="text-gray-500 text-sm">With Levels</p>
            <p className="text-3xl font-bold text-teal-600">{learnersWithLevels}</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr_380px] gap-8">
          
          {/* Table Section */}
          <section>
            <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold text-gray-800">Registered Learners</h2>
                <span className="px-2.5 py-0.5 bg-teal-100 rounded-full text-xs text-teal-600">{filteredLearners.length}</span>
              </div>
              
              {/* Search and Filter */}
              <div className="flex gap-2 flex-wrap">
                <input
                  type="text"
                  placeholder="Search learners..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all w-40 md:w-48"
                />
                <select
                  value={filterClass}
                  onChange={(e) => setFilterClass(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"
                >
                  <option value="">All Classes</option>
                  {CLASS_LEVELS.map(level => (
                    <option key={level.id} value={level.id}>
                      {level.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Table */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">#</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Student</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Username</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Reg Number</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Class</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Level</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Points</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {loading ? (
                      <tr>
                        <td colSpan="8" className="px-4 py-8 text-center text-gray-500">
                          <div className="flex justify-center items-center gap-2">
                            <div className="w-5 h-5 border-2 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
                            Loading learners...
                          </div>
                        </td>
                      </tr>
                    ) : filteredLearners.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="px-4 py-8 text-center text-gray-500">
                          {searchTerm || filterClass ? 'No learners match your filters' : 'No learners registered yet'}
                        </td>
                      </tr>
                    ) : (
                      filteredLearners.map((learner, idx) => (
                        <tr key={learner.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 text-xs text-gray-400">{idx + 1}</td>
                          <td className="px-4 py-3">
                            <div className="font-medium text-gray-800">{learner.full_name}</div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs text-gray-500">@{learner.username}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs font-mono text-gray-600">{learner.registration_number}</span>
                          </td>
                          <td className="px-4 py-3">
                            {learner.class_level ? (
                              <span className="text-xs px-2 py-1 rounded-full bg-teal-100 text-teal-700">
                                {getLevelDisplayName(learner.class_level)}
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400">Not Set</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {learner.current_level ? (
                              <span className={`text-xs px-2 py-1 rounded-full ${getLevelColor(learner.current_level)}`}>
                                {getLevelDisplayName(learner.current_level)}
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400">Not Set</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-teal-600">
                            {learner.current_points || 0}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => {
                                  setSelectedLearner(learner);
                                  setShowLevelModal(true);
                                }}
                                className="text-xs text-teal-600 hover:text-teal-800 transition px-2 py-1 hover:bg-teal-50 rounded"
                              >
                                Edit Level
                              </button>
                              <button
                                onClick={() => fetchLevelHistory(learner.id)}
                                className="text-xs text-blue-600 hover:text-blue-800 transition px-2 py-1 hover:bg-blue-50 rounded"
                              >
                                History
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* Form Section */}
          <aside>
            <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-2xl p-6 sticky top-6 shadow-md">
              <h3 className="font-bold text-lg text-gray-800 mb-1">New Learner</h3>
              <p className="text-xs text-gray-500 mb-5">Register a student account</p>
              
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
                      className="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-all duration-300 shadow-sm"
                    >
                      New
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Format: LE-26-XXX (Alphanumeric)</p>
                </div>

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
                        {level.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-400 mt-1">
                    This will set the learner's starting level for progression.
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
                    'Register Learner'
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
              Warning: Current level cannot exceed class level ({getLevelDisplayName(selectedLearner.class_level)})
            </p>
            <select
              value={selectedLearner.current_level || ''}
              onChange={(e) => setSelectedLearner({...selectedLearner, current_level: e.target.value})}
              className="w-full bg-white border border-gray-300 rounded-lg p-3 text-sm text-gray-700 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all mb-4"
            >
              <option value="">Select Level</option>
              {getAvailableLevelsForLearner(selectedLearner.class_level).map(level => (
                <option key={level.id} value={level.id}>
                  {level.name}
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
                      <div className="mt-1 text-xs text-amber-600">Admin override</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
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