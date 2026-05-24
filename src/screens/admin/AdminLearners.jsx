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
  const [form, setForm] = useState({
    username: '',
    full_name: '',
    registration_number: '',
    class_level: ''
  });

  useEffect(() => {
    fetchLearners();
  }, []);

  const fetchLearners = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${API_URL}/api/admin/learners`);
      setLearners(data.learners || []);
    } catch (error) {
      console.error('Fetch learners error:', error);
      toast.error('Unable to load learners.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.username.trim() || !form.full_name.trim() || !form.registration_number.trim()) {
      toast.error('Username, full name, and registration number are required.');
      return;
    }

    try {
      setSaving(true);
      await axios.post(`${API_URL}/api/admin/learners`, {
        username: form.username,
        full_name: form.full_name,
        registration_number: form.registration_number,
        class_level: form.class_level
      });
      toast.success('Learner registered successfully.');
      setForm({ username: '', full_name: '', registration_number: '', class_level: '' });
      fetchLearners();
    } catch (error) {
      console.error('Create learner error:', error);
      toast.error(error.response?.data?.error || 'Failed to register learner.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="bg-slate-900/95 border-b border-slate-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black tracking-tight">Register Learners</h1>
            <p className="text-sm text-slate-400">Add new learners and review the learner roster.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/admin-dashboard')}
              className="px-4 py-2 rounded-2xl bg-slate-800 border border-slate-700 text-slate-100 hover:bg-slate-700 transition"
            >
              Back to Dashboard
            </button>
            <button
              onClick={logout}
              className="px-4 py-2 rounded-2xl bg-amber-500/95 text-slate-950 font-bold hover:bg-amber-400 transition"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <section className="bg-slate-900/90 border border-slate-700 rounded-3xl p-6 shadow-lg">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold">Learner Roster</h2>
                <p className="text-sm text-slate-400">Recent learners registered by the admin.</p>
              </div>
              <span className="text-xs uppercase tracking-wider text-slate-500">{learners.length} learners</span>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="h-20 rounded-3xl bg-slate-800/60 animate-pulse" />
                ))}
              </div>
            ) : learners.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-700 p-8 text-center text-slate-400">
                No learners registered yet. Use the form to add your first learner.
              </div>
            ) : (
              <div className="space-y-4">
                {learners.map((learner) => (
                  <div key={learner.id} className="rounded-3xl border border-slate-700 p-4 bg-slate-950/80">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-lg">{learner.full_name}</h3>
                        <p className="text-sm text-slate-400">{learner.username} · {learner.registration_number}</p>
                      </div>
                      <div className="space-y-1 text-sm text-slate-500 text-right">
                        <p>Class: {learner.class_level || 'N/A'}</p>
                        <p>Points: {learner.current_points || 0}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="bg-slate-900/90 border border-slate-700 rounded-3xl p-6 shadow-lg">
            <div className="mb-5">
              <h2 className="text-2xl font-bold">Register New Learner</h2>
              <p className="text-sm text-slate-400">Create a learner account with registration number and class assignment.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-200 mb-2">Username</label>
                <input
                  type="text"
                  value={form.username}
                  onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value }))}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950/90 px-4 py-3 text-slate-100 outline-none focus:border-[#00B0FF]"
                  placeholder="unique learner username"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-200 mb-2">Full Name</label>
                <input
                  type="text"
                  value={form.full_name}
                  onChange={(e) => setForm((prev) => ({ ...prev, full_name: e.target.value }))}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950/90 px-4 py-3 text-slate-100 outline-none focus:border-[#00B0FF]"
                  placeholder="e.g. Maya Hernandez"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-200 mb-2">Registration Number</label>
                <input
                  type="text"
                  value={form.registration_number}
                  onChange={(e) => setForm((prev) => ({ ...prev, registration_number: e.target.value }))}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950/90 px-4 py-3 text-slate-100 outline-none focus:border-[#00B0FF]"
                  placeholder="e.g. REG-2026-034"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-200 mb-2">Class Level</label>
                <input
                  type="text"
                  value={form.class_level}
                  onChange={(e) => setForm((prev) => ({ ...prev, class_level: e.target.value }))}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950/90 px-4 py-3 text-slate-100 outline-none focus:border-[#00B0FF]"
                  placeholder="e.g. Grade 10 / Level 2"
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-2xl bg-[#00B0FF] px-5 py-3 text-sm font-bold text-slate-950 hover:bg-[#0094e0] transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  Register Learner
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ username: '', full_name: '', registration_number: '', class_level: '' })}
                  disabled={saving}
                  className="rounded-2xl border border-slate-700 px-5 py-3 text-sm text-slate-300 hover:border-slate-500 transition"
                >
                  Clear Form
                </button>
              </div>
            </form>
          </section>
        </div>
      </main>
    </div>
  );
};

export default AdminLearners;
