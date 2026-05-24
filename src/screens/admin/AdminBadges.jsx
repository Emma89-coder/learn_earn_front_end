import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import API_URL from '../../config';

const AdminBadges = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [badges, setBadges] = useState([]);
  const [learners, setLearners] = useState([]);
  const [selectedBadge, setSelectedBadge] = useState(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    icon_url: '',
    criteria: '',
    is_active: true,
    assign_user_id: ''
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
    setForm({
      name: '',
      description: '',
      icon_url: '',
      criteria: '',
      is_active: true,
      assign_user_id: ''
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
      assign_user_id: ''
    });
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

  const handleAssign = async () => {
    if (!selectedBadge || !form.assign_user_id) {
      toast.error('Select a learner to assign this badge.');
      return;
    }

    try {
      await axios.post(`${API_URL}/api/admin/badges/assign`, {
        user_id: form.assign_user_id,
        badge_id: selectedBadge.id
      });
      toast.success('Badge assigned successfully.');
      setForm((prev) => ({ ...prev, assign_user_id: '' }));
    } catch (error) {
      console.error('Assign badge error:', error);
      toast.error(error.response?.data?.error || 'Failed to assign badge.');
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.name.trim()) {
      toast.error('Badge name is required.');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        icon_url: form.icon_url.trim(),
        criteria: form.criteria.trim(),
        is_active: Boolean(form.is_active)
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="bg-slate-900/95 border-b border-slate-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black tracking-tight">Admin Badge System</h1>
            <p className="text-sm text-slate-400">Create badges, manage badge metadata, and assign badges to learners.</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/admin-dashboard')} className="px-4 py-2 rounded-2xl bg-slate-800 border border-slate-700 text-slate-100 hover:bg-slate-700 transition">
              Back to Dashboard
            </button>
            <button onClick={logout} className="px-4 py-2 rounded-2xl bg-amber-500/95 text-slate-950 font-bold hover:bg-amber-400 transition">
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
          <section className="bg-slate-900/90 border border-slate-700 rounded-3xl p-6 shadow-lg">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold">Badge Catalog</h2>
                <p className="text-sm text-slate-400">Review and manage all badge templates.</p>
              </div>
              <span className="text-xs uppercase tracking-wider text-slate-500">{badges.length} badges</span>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="h-24 rounded-3xl bg-slate-800/60 animate-pulse" />
                ))}
              </div>
            ) : badges.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-700 p-8 text-center text-slate-400">
                No badges created yet. Use the panel to add your first badge.
              </div>
            ) : (
              <div className="space-y-4">
                {badges.map((badge) => (
                  <div key={badge.id} className="rounded-3xl border border-slate-700 p-4 bg-slate-950/80">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center h-14 w-14 rounded-2xl bg-[#00B0FF]/10 text-[#00B0FF] text-2xl">
                          {badge.icon_url ? <img src={badge.icon_url} alt={badge.name} className="h-12 w-12 object-contain" /> : '🏅'}
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{badge.name}</h3>
                          <p className="text-sm text-slate-400">{badge.criteria || 'General recognition badge.'}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs uppercase tracking-wider text-slate-500">
                        <span className={`rounded-2xl px-3 py-1 ${badge.is_active ? 'bg-emerald-500/15 text-emerald-200' : 'bg-rose-500/15 text-rose-200'}`}>
                          {badge.is_active ? 'Active' : 'Inactive'}
                        </span>
                        <button onClick={() => handleEdit(badge)} className="rounded-2xl bg-slate-700 px-4 py-2 hover:bg-slate-600 transition">
                          Edit
                        </button>
                        <button onClick={() => handleDelete(badge.id)} className="rounded-2xl bg-rose-500/15 px-4 py-2 text-rose-200 hover:bg-rose-500/20 transition">
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="bg-slate-900/90 border border-slate-700 rounded-3xl p-6 shadow-lg">
            <div className="mb-5">
              <h2 className="text-2xl font-bold">Create / Update Badge</h2>
              <p className="text-sm text-slate-400">Define a new badge and optionally assign it directly to a learner.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-200 mb-2">Badge Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => fromInput('name', e.target.value)}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950/90 px-4 py-3 text-slate-100 outline-none focus:border-[#00B0FF]"
                  placeholder="e.g. Quiz Champion"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-200 mb-2">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => fromInput('description', e.target.value)}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950/90 px-4 py-3 text-slate-100 outline-none focus:border-[#00B0FF]"
                  rows={3}
                  placeholder="Short text explaining why learners earn this badge"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-200 mb-2">Icon URL</label>
                <input
                  type="url"
                  value={form.icon_url}
                  onChange={(e) => fromInput('icon_url', e.target.value)}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950/90 px-4 py-3 text-slate-100 outline-none focus:border-[#00B0FF]"
                  placeholder="https://example.com/badge-icon.png"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-200 mb-2">Award Criteria</label>
                <input
                  type="text"
                  value={form.criteria}
                  onChange={(e) => fromInput('criteria', e.target.value)}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950/90 px-4 py-3 text-slate-100 outline-none focus:border-[#00B0FF]"
                  placeholder="e.g. Complete 5 quizzes with 90% accuracy"
                />
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm text-slate-200">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => fromInput('is_active', e.target.checked)}
                    className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-[#00B0FF] focus:ring-[#00B0FF]"
                  />
                  Active badge
                </label>
              </div>

              <div className="rounded-3xl border border-slate-700 bg-slate-950/90 p-4">
                <h3 className="text-sm font-semibold text-slate-200 mb-3">Assign Badge Now</h3>
                <div className="space-y-3">
                  <select
                    value={form.assign_user_id}
                    onChange={(e) => fromInput('assign_user_id', e.target.value)}
                    className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 outline-none focus:border-[#00B0FF]"
                  >
                    <option value="">Select learner to assign</option>
                    {learners.map((learner) => (
                      <option key={learner.id} value={learner.id}>
                        {learner.full_name || learner.username} ({learner.class_level || 'no class'})
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    disabled={!selectedBadge || !form.assign_user_id}
                    onClick={handleAssign}
                    className="w-full rounded-2xl bg-[#00B0FF] px-4 py-3 text-sm font-bold text-slate-950 hover:bg-[#0094e0] transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Assign Selected Badge
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-2xl bg-[#00B0FF] px-5 py-3 text-sm font-bold text-slate-950 hover:bg-[#0094e0] transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {selectedBadge ? 'Update Badge' : 'Create Badge'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={saving}
                  className="rounded-2xl border border-slate-700 px-5 py-3 text-sm text-slate-300 hover:border-slate-500 transition"
                >
                  Reset
                </button>
              </div>
            </form>
          </section>
        </div>
      </main>
    </div>
  );
};

export default AdminBadges;
