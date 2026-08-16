import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import API_URL from '../../config';
import MALAWI_DISTRICTS from '../../constants/districts';

const DISTRICT_CATEGORIES = [
  { id: 'capitals-major-towns', label: 'Capitals and Major Towns' },
  { id: 'borders-neighbors', label: 'Borders and Neighbors' },
  { id: 'physical-features', label: 'Physical Features' },
  { id: 'parks-wildlife', label: 'National Parks and Wildlife' },
  { id: 'economic-activities', label: 'Economic Activities' },
  { id: 'transport-border-posts', label: 'Transport and Border Posts' },
  { id: 'history-culture', label: 'History and Cultural Landmarks' },
  { id: 'region-classification', label: 'Region Classification' },
];

const DEFAULT_CATEGORY = DISTRICT_CATEGORIES[0].id;

const getCategoryLabel = (categoryId) => {
  const category = DISTRICT_CATEGORIES.find(c => c.id === categoryId);
  return category ? category.label : 'Uncategorized';
};

const AdminDistricts = () => {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ question: '', correct_answer: '', category: DEFAULT_CATEGORY });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => { fetchQuestions(); }, []);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/api/admin/district-questions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) setQuestions(res.data.questions || []);
    } catch (err) {
      toast.error('Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.question.trim() || !form.correct_answer) {
      toast.error('Question and correct answer are required');
      return;
    }
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('question', form.question);
      formData.append('correct_answer', form.correct_answer);
      formData.append('category', form.category);
      if (imageFile) {
        formData.append('image', imageFile);
      }

      if (editingId) {
        await axios.put(`${API_URL}/api/admin/district-questions/${editingId}`, formData, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Question updated');
      } else {
        await axios.post(`${API_URL}/api/admin/district-questions`, formData, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Question added');
      }
      setForm({ question: '', correct_answer: '', category: DEFAULT_CATEGORY });
      setImageFile(null);
      setImagePreview(null);
      setShowAddForm(false);
      setEditingId(null);
      fetchQuestions();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (q) => {
    setForm({
      question: q.question,
      correct_answer: q.correct_answer,
      category: q.category || DEFAULT_CATEGORY,
    });
    setEditingId(q.id);
    setImageFile(null);
    setImagePreview(q.image_url || null);
    setShowAddForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this question?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/api/admin/district-questions/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Question deleted');
      fetchQuestions();
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  const handleToggleActive = async (q) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/api/admin/district-questions/${q.id}`, {
        is_active: !q.is_active
      }, { headers: { Authorization: `Bearer ${token}` } });
      fetchQuestions();
    } catch (err) {
      toast.error('Failed to update');
    }
  };

  const filtered = questions.filter(q =>
    (q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.correct_answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (q.category || '').toLowerCase().includes(searchTerm.toLowerCase())) &&
    (categoryFilter === 'all' || q.category === categoryFilter)
  );

  const activeCount = questions.filter(q => q.is_active).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/admin-dashboard')}
              className="p-2 hover:bg-gray-100 rounded-xl transition text-gray-500">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-800">Malawi Districts Questions</h1>
              <p className="text-xs text-gray-500">{activeCount} active questions — learners answer with district names</p>
            </div>
          </div>
          <button
            onClick={() => { setShowAddForm(true); setEditingId(null); setForm({ question: '', correct_answer: '', category: DEFAULT_CATEGORY }); setImageFile(null); setImagePreview(null); }}
            className="px-4 py-2 text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-sm transition"
          >
            + Add Question
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-6 space-y-5">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center shadow-sm">
            <p className="text-2xl font-black text-teal-700">{questions.length}</p>
            <p className="text-xs text-gray-500">Total Questions</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center shadow-sm">
            <p className="text-2xl font-black text-green-600">{activeCount}</p>
            <p className="text-xs text-gray-500">Active</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center shadow-sm">
            <p className="text-2xl font-black text-gray-400">{questions.length - activeCount}</p>
            <p className="text-xs text-gray-500">Disabled</p>
          </div>
        </div>

        {/* Add/Edit Form */}
        {showAddForm && (
          <div className="bg-white rounded-2xl border border-teal-200 p-5 shadow-sm">
            <h3 className="font-bold text-gray-800 mb-3">{editingId ? 'Edit Question' : 'Add New Question'}</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Question</label>
                <input
                  type="text"
                  value={form.question}
                  onChange={e => setForm({ ...form, question: e.target.value })}
                  placeholder="e.g. Which district is home to Lake Malawi's cape?"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-teal-400 focus:ring-2 focus:ring-teal-100 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Category</label>
                <select
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-teal-400 focus:ring-2 focus:ring-teal-100 outline-none bg-white"
                >
                  {DISTRICT_CATEGORIES.map(c => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Correct Answer (district)</label>
                <select
                  value={form.correct_answer}
                  onChange={e => setForm({ ...form, correct_answer: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-teal-400 focus:ring-2 focus:ring-teal-100 outline-none bg-white"
                >
                  <option value="">Select a district...</option>
                  {MALAWI_DISTRICTS.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Image (optional)</label>
                {imagePreview && (
                  <div className="relative mb-2 inline-block">
                    <img src={imagePreview} alt="Preview" className="w-32 h-32 object-contain rounded-xl border border-gray-200" />
                    <button
                      type="button"
                      onClick={() => { setImageFile(null); setImagePreview(null); }}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs font-bold flex items-center justify-center hover:bg-red-600"
                    >
                      ✕
                    </button>
                  </div>
                )}
                <div className="border-2 border-solid border-gray-200 rounded-xl p-4 text-center hover:border-teal-400 transition cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => {
                      const file = e.target.files[0];
                      if (file) {
                        if (file.size > 5 * 1024 * 1024) {
                          toast.error('Image must be less than 5MB');
                          return;
                        }
                        setImageFile(file);
                        const reader = new FileReader();
                        reader.onloadend = () => setImagePreview(reader.result);
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="text-sm file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-teal-500 file:text-white hover:file:bg-teal-600 file:cursor-pointer"
                  />
                  <p className="text-xs text-gray-400 mt-2">Upload a map, landmark photo, or illustration (max 5MB)</p>
                </div>
              </div>

              {/* Live Preview — shows what the learner will see */}
              {(form.question || imagePreview) && (
                <div className="border border-teal-200 rounded-xl overflow-hidden bg-teal-50/30">
                  <div className="px-3 py-2 bg-teal-100 border-b border-teal-200">
                    <p className="text-xs font-bold text-teal-700 uppercase tracking-wider">Preview (learner view)</p>
                  </div>
                  <div className="p-4">
                    {imagePreview ? (
                      <div className="flex flex-col md:flex-row gap-4">
                        {/* Image */}
                        <div className="md:w-1/3">
                          <div className="bg-white rounded-xl p-2 border border-gray-200 shadow-sm">
                            <img src={imagePreview} alt="Question" className="w-full h-40 object-contain rounded-lg" />
                          </div>
                        </div>
                        {/* Question + Options */}
                        <div className="md:w-2/3">
                          <p className="text-sm font-bold text-gray-800 mb-3">
                            {form.question || 'Your question will appear here...'}
                          </p>
                          <div className="space-y-2">
                            {(() => {
                              const correct = form.correct_answer || 'Correct District';
                              const wrong = MALAWI_DISTRICTS.filter(d => d !== correct).slice(0, 3);
                              const options = [correct, ...wrong].sort(() => Math.random() - 0.5);
                              return options.map((opt, i) => (
                                <div key={i} className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition ${
                                  opt === correct
                                    ? 'bg-teal-500 text-white border-teal-500'
                                    : 'bg-white text-gray-700 border-gray-200'
                                }`}>
                                  {String.fromCharCode(65 + i)}. {opt}
                                  {opt === correct && <span className="ml-2 text-xs">✓</span>}
                                </div>
                              ));
                            })()}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm font-bold text-gray-800 mb-3">
                          {form.question || 'Your question will appear here...'}
                        </p>
                        <div className="space-y-2">
                          {(() => {
                            const correct = form.correct_answer || 'Correct District';
                            const wrong = MALAWI_DISTRICTS.filter(d => d !== correct).slice(0, 3);
                            const options = [correct, ...wrong].sort(() => Math.random() - 0.5);
                            return options.map((opt, i) => (
                              <div key={i} className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition ${
                                opt === correct
                                  ? 'bg-teal-500 text-white border-teal-500'
                                  : 'bg-white text-gray-700 border-gray-200'
                              }`}>
                                {String.fromCharCode(65 + i)}. {opt}
                                {opt === correct && <span className="ml-2 text-xs">✓</span>}
                              </div>
                            ));
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button onClick={handleSubmit} disabled={saving}
                  className={`px-5 py-2 rounded-xl text-sm font-bold text-white transition ${saving ? 'bg-gray-400' : 'bg-teal-600 hover:bg-teal-700'}`}>
                  {saving ? 'Saving...' : editingId ? 'Update' : 'Add Question'}
                </button>
                <button onClick={() => { setShowAddForm(false); setEditingId(null); setForm({ question: '', correct_answer: '', category: DEFAULT_CATEGORY }); setImageFile(null); setImagePreview(null); }}
                  className="px-5 py-2 rounded-xl text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search questions..."
            className="md:col-span-2 w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:border-teal-400 focus:ring-2 focus:ring-teal-100 outline-none"
          />
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:border-teal-400 focus:ring-2 focus:ring-teal-100 outline-none"
          >
            <option value="all">All Categories</option>
            {DISTRICT_CATEGORIES.map(c => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </div>

        {/* Questions list */}
        {loading ? (
          <div className="text-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-3 border-teal-500 border-t-transparent mx-auto mb-2" />
            <p className="text-sm text-gray-500">Loading questions...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-2xl border border-gray-200">
            <p className="text-3xl mb-2">🗺️</p>
            <p className="text-gray-500 font-medium">No questions found</p>
            <p className="text-sm text-gray-400 mt-1">Add your first district question above</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((q, idx) => (
              <div key={q.id}
                className={`bg-white rounded-xl border p-4 flex items-start gap-4 transition hover:shadow-sm ${
                  q.is_active ? 'border-gray-200' : 'border-gray-100 opacity-50'
                }`}
              >
                {/* Number */}
                <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-teal-700">{idx + 1}</span>
                </div>

                {/* Image thumbnail */}
                {q.image_url && (
                  <div className="w-16 h-16 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0">
                    <img src={q.image_url} alt="" className="w-full h-full object-cover" />
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800">{q.question}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-xs font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                      {getCategoryLabel(q.category)}
                    </span>
                    <span className="text-xs font-bold bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full">
                      {q.correct_answer}
                    </span>
                    {q.image_url && (
                      <span className="text-xs text-blue-500 font-medium">📷 Has image</span>
                    )}
                    {!q.is_active && (
                      <span className="text-xs text-red-500 font-medium">Disabled</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => handleToggleActive(q)}
                    className={`px-2 py-1 rounded-lg text-xs font-semibold transition ${
                      q.is_active ? 'bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600' : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}>
                    {q.is_active ? 'Disable' : 'Enable'}
                  </button>
                  <button onClick={() => handleEdit(q)}
                    className="px-2 py-1 rounded-lg text-xs font-semibold bg-teal-50 text-teal-600 hover:bg-teal-100 transition">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(q.id)}
                    className="px-2 py-1 rounded-lg text-xs font-semibold bg-red-50 text-red-600 hover:bg-red-100 transition">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDistricts;
