import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import API_URL from '../../config';

const AdminLearners = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [learners, setLearners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generatedRegNumber, setGeneratedRegNumber] = useState('');
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
      const { data } = await axios.get(`${API_URL}/api/admin/learners`);
      setLearners(data.learners || []);
    } catch (error) {
      toast.error('Unable to load learners.');
    } finally {
      setLoading(false);
    }
  };

  // Generate random alphanumeric string of specified length
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
      await axios.post(`${API_URL}/api/admin/learners`, form);
      toast.success('Learner registered successfully!');
      // Reset form but generate new registration number
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

  const totalPoints = learners.reduce((sum, l) => sum + (l.current_points || 0), 0);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F0F4F8] via-[#E8F4F8] to-[#F0F8FF]">
      {/* Subtle Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#00B0FF]/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-[#008080]/5 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-[#1A237E]/3 to-[#00B0FF]/3 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-7xl mx-auto p-6 md:p-10">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-[#00B0FF]/20 pb-6 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-gradient-to-br from-[#00B0FF] to-[#008080] rounded-xl flex items-center justify-center shadow-lg">
                <UsersIcon />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-[#1A237E] to-[#008080] bg-clip-text text-transparent">
                Learner Management
              </h1>
            </div>
            <p className="text-slate-600 ml-1">Manage, add, and monitor your student roster.</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => navigate('/admin-dashboard')} 
              className="group flex items-center gap-2 px-5 py-2.5 bg-white border border-[#00B0FF]/30 rounded-xl text-slate-700 hover:bg-[#00B0FF]/10 hover:border-[#00B0FF] transition-all duration-300 shadow-sm"
            >
              <ArrowLeftIcon />
              <span>Back</span>
            </button>
            <button 
              onClick={logout} 
              className="group flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#008080] to-[#00B0FF] rounded-xl text-white font-semibold hover:shadow-lg hover:shadow-[#00B0FF]/30 transition-all duration-300"
            >
              <LogoutIcon />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
          <div className="bg-white/80 backdrop-blur-sm border border-[#00B0FF]/20 rounded-xl p-5 hover:shadow-lg hover:border-[#00B0FF]/40 transition-all duration-300 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm">Total Learners</p>
                <p className="text-3xl font-bold text-[#1A237E]">{learners.length}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-[#00B0FF]/10 to-[#008080]/10 rounded-xl flex items-center justify-center text-[#00B0FF]">
                <UsersIcon />
              </div>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm border border-[#00B0FF]/20 rounded-xl p-5 hover:shadow-lg hover:border-[#00B0FF]/40 transition-all duration-300 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm">Total Points</p>
                <p className="text-3xl font-bold text-[#008080]">{totalPoints}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-[#00B0FF]/10 to-[#008080]/10 rounded-xl flex items-center justify-center text-[#008080]">
                <AwardIcon />
              </div>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm border border-[#00B0FF]/20 rounded-xl p-5 hover:shadow-lg hover:border-[#00B0FF]/40 transition-all duration-300 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm">Active Classes</p>
                <p className="text-3xl font-bold text-[#1A237E]">{new Set(learners.map(l => l.class_level).filter(Boolean)).size}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-[#00B0FF]/10 to-[#008080]/10 rounded-xl flex items-center justify-center text-[#1A237E]">
                <BookIcon />
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr_380px] gap-8">
          
          {/* List Section */}
          <section>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 bg-gradient-to-br from-[#00B0FF]/20 to-[#008080]/20 rounded-lg flex items-center justify-center text-[#00B0FF]">
                <UsersIcon />
              </div>
              <h2 className="text-xl font-semibold text-[#1A237E]">Registered Learners</h2>
              <span className="px-2.5 py-0.5 bg-[#00B0FF]/10 rounded-full text-xs text-[#00B0FF] ml-2">{learners.length}</span>
            </div>
            
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-white border border-[#00B0FF]/20 p-4 rounded-xl animate-pulse">
                      <div className="h-5 bg-[#00B0FF]/10 rounded w-1/3 mb-2"></div>
                      <div className="h-3 bg-[#00B0FF]/5 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : learners.length === 0 ? (
                <div className="bg-white/80 border-2 border-dashed border-[#00B0FF]/30 rounded-xl p-12 text-center">
                  <div className="w-12 h-12 mx-auto mb-3 text-[#00B0FF]/40">
                    <UsersIcon />
                  </div>
                  <p className="text-slate-500">No learners registered yet</p>
                  <p className="text-sm text-slate-400 mt-1">Use the form to add your first learner</p>
                </div>
              ) : (
                learners.map((learner, idx) => (
                  <div 
                    key={learner.id} 
                    className="group bg-white border border-[#00B0FF]/20 rounded-xl p-4 hover:shadow-md hover:border-[#00B0FF]/40 transition-all duration-300"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-mono text-[#00B0FF]/60">#{idx + 1}</span>
                          <h3 className="font-semibold text-[#1A237E] group-hover:text-[#00B0FF] transition-colors">
                            {learner.full_name}
                          </h3>
                          <span className="text-xs px-2 py-0.5 bg-[#008080]/10 rounded-full text-[#008080]">
                            {learner.class_level || 'No Level'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          @{learner.username} • <span className="font-mono font-semibold text-[#1A237E]">{learner.registration_number}</span>
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-[#00B0FF]">{learner.current_points || 0}</p>
                        <p className="text-xs text-slate-400">points</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Form Section */}
          <aside>
            <form onSubmit={handleSubmit} className="bg-white/90 backdrop-blur-sm border border-[#00B0FF]/20 rounded-2xl p-6 sticky top-6 shadow-xl">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-gradient-to-br from-[#00B0FF] to-[#008080] rounded-xl flex items-center justify-center shadow-lg text-white">
                  <UserPlusIcon />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-[#1A237E]">New Learner</h3>
                  <p className="text-xs text-slate-500">Register a student account</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <input
                  placeholder="Username"
                  value={form.username}
                  onChange={(e) => setForm({...form, username: e.target.value})}
                  className="w-full bg-white border border-[#00B0FF]/30 rounded-lg p-3 text-sm text-slate-700 placeholder-slate-400 focus:border-[#00B0FF] focus:ring-2 focus:ring-[#00B0FF]/20 outline-none transition-all"
                  required
                />
                <input
                  placeholder="Full Name"
                  value={form.full_name}
                  onChange={(e) => setForm({...form, full_name: e.target.value})}
                  className="w-full bg-white border border-[#00B0FF]/30 rounded-lg p-3 text-sm text-slate-700 placeholder-slate-400 focus:border-[#00B0FF] focus:ring-2 focus:ring-[#00B0FF]/20 outline-none transition-all"
                  required
                />
                
                {/* Auto-generated Registration Number Field */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Registration Number <span className="text-[#008080]">(Auto-generated)</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={form.registration_number}
                      readOnly
                      className="flex-1 bg-slate-50 border border-[#00B0FF]/30 rounded-lg p-3 text-sm text-[#1A237E] font-mono font-semibold placeholder-slate-400 cursor-not-allowed"
                    />
                    <button
                      type="button"
                      onClick={handleRegenerateNumber}
                      className="px-4 py-2 bg-gradient-to-r from-[#00B0FF] to-[#008080] text-white rounded-lg hover:shadow-md transition-all duration-300 flex items-center gap-1"
                      title="Generate new registration number"
                    >
                      <RefreshIcon />
                      <span className="text-xs">New</span>
                    </button>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Format: LE-26-XXX (Alphanumeric)</p>
                </div>

                <input
                  placeholder="Class Level (e.g., Grade 10)"
                  value={form.class_level}
                  onChange={(e) => setForm({...form, class_level: e.target.value})}
                  className="w-full bg-white border border-[#00B0FF]/30 rounded-lg p-3 text-sm text-slate-700 placeholder-slate-400 focus:border-[#00B0FF] focus:ring-2 focus:ring-[#00B0FF]/20 outline-none transition-all"
                />
                
                <button 
                  disabled={saving} 
                  className="w-full bg-gradient-to-r from-[#00B0FF] to-[#008080] text-white py-3 rounded-lg font-bold hover:shadow-lg hover:shadow-[#00B0FF]/30 transform hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2 mt-4"
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

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 176, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0, 176, 255, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 176, 255, 0.5);
        }
      `}</style>
    </div>
  );
};

export default AdminLearners;