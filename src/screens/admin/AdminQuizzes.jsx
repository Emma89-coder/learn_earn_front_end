import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import API_URL from '../../config';

// List of subjects
const SUBJECTS = [
  { id: 'social-studies', name: 'Social Studies', icon: '🌍', color: 'from-blue-600 to-blue-800', bgLight: 'bg-blue-50', textLight: 'text-blue-700' },
  { id: 'bible-knowledge', name: 'Bible Knowledge', icon: '📖', color: 'from-azure to-blue-600', bgLight: 'bg-cyan-50', textLight: 'text-cyan-700' },
  { id: 'english', name: 'English', icon: '📚', color: 'from-pink-600 to-rose-700', bgLight: 'bg-pink-50', textLight: 'text-pink-700' },
  { id: 'primary-science', name: 'Primary Science', icon: '🔬', color: 'from-teal-500 to-teal-700', bgLight: 'bg-teal-50', textLight: 'text-teal-700' },
  { id: 'arts-life-skills', name: 'Arts & Life Skills', icon: '🎨', color: 'from-amber-600 to-orange-700', bgLight: 'bg-amber-50', textLight: 'text-amber-700' },
  { id: 'mathematics', name: 'Mathematics', icon: '🔢', color: 'from-red-600 to-rose-700', bgLight: 'bg-red-50', textLight: 'text-red-700' },
  { id: 'chichewa', name: 'Chichewa', icon: '🇲🇼', color: 'from-green-600 to-emerald-700', bgLight: 'bg-green-50', textLight: 'text-green-700' }
];

// Class Levels
const CLASS_LEVELS = [
  { id: 'standard-1', name: 'Standard 1', grade: 1, icon: '🌟', color: 'from-green-500 to-emerald-600' },
  { id: 'standard-2', name: 'Standard 2', grade: 2, icon: '⭐', color: 'from-blue-500 to-cyan-600' },
  { id: 'standard-3', name: 'Standard 3', grade: 3, icon: '📘', color: 'from-indigo-500 to-blue-600' },
  { id: 'standard-4', name: 'Standard 4', grade: 4, icon: '📚', color: 'from-purple-500 to-indigo-600' },
  { id: 'standard-5', name: 'Standard 5', grade: 5, icon: '🎓', color: 'from-pink-500 to-rose-600' },
  { id: 'standard-6', name: 'Standard 6', grade: 6, icon: '🏆', color: 'from-orange-500 to-red-600' },
  { id: 'standard-7', name: 'Standard 7', grade: 7, icon: '🎯', color: 'from-teal-500 to-green-600' },
  { id: 'standard-8', name: 'Standard 8', grade: 8, icon: '⚡', color: 'from-cyan-500 to-blue-600' }
];

// Difficulty levels
const DIFFICULTY_LEVELS = [
  { id: 'beginner', name: 'Beginner', icon: '🌱', timeLimit: 45, points: 1, color: 'green', gradient: 'from-green-500 to-emerald-500' },
  { id: 'intermediate', name: 'Intermediate', icon: '📘', timeLimit: 30, points: 2, color: 'blue', gradient: 'from-blue-500 to-cyan-500' },
  { id: 'advanced', name: 'Advanced', icon: '🎓', timeLimit: 20, points: 3, color: 'purple', gradient: 'from-purple-500 to-indigo-500' },
  { id: 'expert', name: 'Expert', icon: '🏆', timeLimit: 15, points: 5, color: 'red', gradient: 'from-red-500 to-orange-500' }
];

// Question layout options
const QUESTION_LAYOUTS = [
  { id: 'text-first', name: 'Text → Image', desc: 'Question first, then picture' },
  { id: 'image-first', name: 'Image → Text', desc: 'Picture first, then question' }
];

const getEmptyQuestion = () => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
  question: '',
  questionImage: '',
  options: ['', '', '', ''],
  correctAnswer: '',
  layout: 'text-first'
});

const AdminQuizzes = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingQuestionImage, setUploadingQuestionImage] = useState(false);
  const [quizzes, setQuizzes] = useState([]);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [showDetails, setShowDetails] = useState(null);
  const [currentUploadingQuestion, setCurrentUploadingQuestion] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('portal-theme');
    return saved ? saved === 'dark' : false;
  });

  const [form, setForm] = useState({
    title: '',
    topic: '',
    description: '',
    startDate: '',
    endDate: '',
    isActive: true,
    quizImage: '',
    assignedClasses: [],
    difficulty: 'intermediate'
  });
  
  const [questions, setQuestions] = useState([getEmptyQuestion()]);

  useEffect(() => {
    loadQuizzes();
  }, []);

  useEffect(() => {
    localStorage.setItem('portal-theme', isDarkMode ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  const loadQuizzes = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/admin/quizzes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setQuizzes(response.data.quizzes || []);
    } catch (error) {
      console.error(error);
      toast.error('Could not load quizzes.');
    } finally {
      setLoading(false);
    }
  };

  const clearForm = () => {
    setSelectedQuiz(null);
    setShowDetails(null);
    setForm({
      title: '',
      topic: '',
      description: '',
      startDate: '',
      endDate: '',
      isActive: true,
      quizImage: '',
      assignedClasses: [],
      difficulty: 'intermediate'
    });
    setQuestions([getEmptyQuestion()]);
  };

  const changeForm = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const toggleClassAssignment = (classId) => {
    setForm(prev => ({
      ...prev,
      assignedClasses: prev.assignedClasses.includes(classId)
        ? prev.assignedClasses.filter(id => id !== classId)
        : [...prev.assignedClasses, classId]
    }));
  };

  const toggleAllClasses = () => {
    if (form.assignedClasses.length === CLASS_LEVELS.length) {
      setForm(prev => ({ ...prev, assignedClasses: [] }));
    } else {
      setForm(prev => ({ ...prev, assignedClasses: CLASS_LEVELS.map(c => c.id) }));
    }
  };

  const changeQuestionLayout = (index, layout) => {
    setQuestions((prev) =>
      prev.map((q, idx) => (idx === index ? { ...q, layout: layout } : q))
    );
  };

  const uploadQuizImage = async (file) => {
    setUploadingImage(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/api/admin/upload-image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.success) {
        changeForm('quizImage', response.data.imageUrl);
        toast.success('Image uploaded!');
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const uploadQuestionImage = async (file, questionIndex) => {
    setUploadingQuestionImage(true);
    setCurrentUploadingQuestion(questionIndex);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/api/admin/upload-image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setQuestions(prev => prev.map((q, idx) => 
          idx === questionIndex ? { ...q, questionImage: response.data.imageUrl } : q
        ));
        toast.success('Image uploaded!');
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to upload image');
    } finally {
      setUploadingQuestionImage(false);
      setCurrentUploadingQuestion(null);
    }
  };

  const handleQuizImageSelect = (e) => {
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
    uploadQuizImage(file);
  };

  const handleQuestionImageSelect = (e, questionIndex) => {
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
    uploadQuestionImage(file, questionIndex);
  };

  const removeQuizImage = () => {
    changeForm('quizImage', '');
    toast.success('Image removed');
  };

  const removeQuestionImage = (questionIndex) => {
    setQuestions(prev => prev.map((q, idx) => 
      idx === questionIndex ? { ...q, questionImage: '' } : q
    ));
    toast.success('Image removed');
  };

  const changeQuestion = (index, value) => {
    setQuestions((prev) =>
      prev.map((q, idx) => (idx === index ? { ...q, question: value } : q))
    );
  };

  const changeAnswer = (index, value) => {
    setQuestions((prev) =>
      prev.map((q, idx) => (idx === index ? { ...q, correctAnswer: value } : q))
    );
  };

  const changeOption = (qIndex, optIndex, value) => {
    setQuestions((prev) =>
      prev.map((q, idx) => {
        if (idx !== qIndex) return q;
        const newOptions = [...q.options];
        newOptions[optIndex] = value;
        return { ...q, options: newOptions };
      })
    );
  };

  const addQuestion = () => {
    setQuestions((prev) => [...prev, getEmptyQuestion()]);
  };

  const removeQuestion = (index) => {
    if (questions.length === 1) {
      toast.error('You need at least one question.');
      return;
    }
    setQuestions((prev) => prev.filter((_, idx) => idx !== index));
  };

  const editQuiz = (quiz) => {
    setSelectedQuiz(quiz);
    const normalizedTopic = SUBJECTS.find(s => s.id === quiz.topic || s.name === quiz.topic)?.id || quiz.topic || '';

    setForm({
      title: quiz.title || '',
      topic: normalizedTopic,
      description: quiz.description || '',
      startDate: quiz.start_time ? new Date(quiz.start_time).toISOString().slice(0, 16) : '',
      endDate: quiz.end_time ? new Date(quiz.end_time).toISOString().slice(0, 16) : '',
      isActive: quiz.is_active ?? true,
      quizImage: quiz.image_url || '',
      assignedClasses: quiz.assigned_classes || [],
      difficulty: quiz.difficulty || 'intermediate'
    });

    setQuestions(
      (quiz.questions || []).map((q) => ({
        id: q.id || `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        question: q.question || '',
        questionImage: q.questionImage || '',
        options: q.options || ['', '', '', ''],
        correctAnswer: q.correctAnswer || '',
        layout: q.layout || 'text-first'
      }))
    );
    setShowDetails(quiz.id);
  };

  const deleteQuiz = async (quizId) => {
    if (!window.confirm('Delete this quiz?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/api/admin/quizzes/${quizId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Quiz deleted.');
      setQuizzes((prev) => prev.filter((q) => q.id !== quizId));
      if (selectedQuiz?.id === quizId) clearForm();
    } catch (error) {
      console.error(error);
      toast.error('Could not delete quiz.');
    }
  };

  const saveQuiz = async (event) => {
    event.preventDefault();

    const cleanTitle = form.title.trim();
    const cleanTopic = form.topic.trim();
    
    const isValidTopic = SUBJECTS.some(sub => sub.id === cleanTopic);
    if (!isValidTopic) {
      toast.error(`Subject must be: ${SUBJECTS.map(s => s.name).join(', ')}`);
      return;
    }
    
    if (form.assignedClasses.length === 0) {
      toast.error('Please assign this quiz to at least one class level');
      return;
    }
    
    const goodQuestions = questions
      .map((q) => ({
        question: q.question.trim(),
        questionImage: q.questionImage || null,
        options: q.options.map((opt) => opt.trim()),
        correctAnswer: q.correctAnswer.trim(),
        layout: q.layout
      }))
      .filter((q) => q.question && q.options.every((opt) => opt) && q.correctAnswer);

    if (!cleanTitle || !cleanTopic || goodQuestions.length !== questions.length) {
      toast.error('Please fill in all fields.');
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      const payload = {
        title: cleanTitle,
        topic: cleanTopic,
        description: form.description.trim(),
        questions: goodQuestions,
        start_time: form.startDate ? new Date(form.startDate).toISOString() : null,
        end_time: form.endDate ? new Date(form.endDate).toISOString() : null,
        is_active: Boolean(form.isActive),
        image_url: form.quizImage.trim() || null,
        assigned_classes: form.assignedClasses,
        difficulty: form.difficulty
      };

      if (selectedQuiz) {
        await axios.put(`${API_URL}/api/admin/quizzes/${selectedQuiz.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Quiz updated successfully!');
      } else {
        await axios.post(`${API_URL}/api/admin/quizzes`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Quiz created successfully!');
      }

      clearForm();
      loadQuizzes();
    } catch (error) {
      console.error(error);
      toast.error('Failed to save quiz.');
    } finally {
      setSaving(false);
    }
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  // FIX: Added missing toggleDetails function
  const toggleDetails = (quizId) => {
    setShowDetails(showDetails === quizId ? null : quizId);
  };

  const getSubjectColor = (topicId) => {
    const subject = SUBJECTS.find(s => s.id === topicId);
    return subject ? subject.color : 'from-gray-600 to-gray-800';
  };

  const getSubjectName = (topicId) => {
    const subject = SUBJECTS.find(s => s.id === topicId);
    return subject ? subject.name : topicId;
  };

  const getDifficultyInfo = (difficultyId) => {
    return DIFFICULTY_LEVELS.find(d => d.id === difficultyId) || DIFFICULTY_LEVELS[1];
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const QuestionPreview = ({ question, layout }) => {
    const hasImage = question.questionImage;
    const hasText = question.question;
    const validOptions = question.options.filter(opt => opt.trim());
    
    return (
      <div className={`mt-3 p-3 rounded-xl transition-all ${
        isDarkMode ? 'bg-white/[0.02] border border-white/[0.05]' : 'bg-slate-50 border border-slate-100'
      }`}>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-5 h-5 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
            <span className="text-[8px] text-white">👁</span>
          </div>
          <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Live Preview</span>
          <span className="text-[9px] text-slate-400">{layout === 'image-first' ? '📷 → 📝' : '📝 → 📷'}</span>
        </div>
        
        <div className="space-y-2">
          {layout === 'image-first' ? (
            <>
              {hasImage && (
                <div className="rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800">
                  <img src={question.questionImage} alt="Preview" className="w-full h-24 object-contain" />
                </div>
              )}
              <p className={`text-sm font-medium ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                {hasText || 'Question preview'}
              </p>
            </>
          ) : (
            <>
              <p className={`text-sm font-medium ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                {hasText || 'Question preview'}
              </p>
              {hasImage && (
                <div className="rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800">
                  <img src={question.questionImage} alt="Preview" className="w-full h-24 object-contain" />
                </div>
              )}
            </>
          )}
          
          <div className="grid grid-cols-2 gap-1">
            {validOptions.slice(0, 4).map((opt, idx) => (
              <div key={idx} className={`flex items-center gap-1 p-1 rounded text-[10px] ${
                isDarkMode ? 'bg-white/[0.04]' : 'bg-white'
              }`}>
                <div className="w-2 h-2 rounded-full border border-slate-300"></div>
                <span className="truncate">{opt}</span>
              </div>
            ))}
          </div>
          
          <div className="pt-1 border-t border-slate-200 dark:border-white/[0.05]">
            <div className="flex items-center justify-between text-[9px]">
              <span className="text-slate-400">✓ Correct answer:</span>
              <span className="font-medium text-green-600 dark:text-green-400">
                {question.correctAnswer || 'Not selected'}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode ? 'bg-[#0A0E1A]' : 'bg-gradient-to-br from-slate-50 to-slate-100'
    }`}>
      
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl"></div>
      </div>

      {/* Header */}
      <header className={`sticky top-0 z-50 w-full border-b backdrop-blur-xl transition-all duration-300 ${
        isDarkMode 
          ? 'bg-[#0A0E1A]/90 border-white/[0.08]' 
          : 'bg-white/80 border-slate-200'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl blur opacity-50"></div>
                <div className="relative w-9 h-9 bg-gradient-to-br from-navy to-azure rounded-xl flex items-center justify-center">
                  <span className="text-lg">📚</span>
                </div>
              </div>
              <div>
                <h1 className={`text-lg font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                  Quiz <span className="text-[#00B0FF]">Manager</span>
                </h1>
                <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Assign quizzes to specific class levels
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-xl transition-all duration-300 ${
                  isDarkMode 
                    ? 'bg-white/[0.04] border border-white/[0.08] text-amber-400 hover:bg-white/[0.08]' 
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {isDarkMode ? '☀️' : '🌙'}
              </button>
              
              <button
                onClick={() => navigate('/admin-dashboard')}
                className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${
                  isDarkMode 
                    ? 'bg-white/[0.04] border border-white/[0.08] text-slate-300 hover:bg-white/[0.08]' 
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                📊 Dashboard
              </button>
              
              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all duration-300 ${
                    isDarkMode 
                      ? 'bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08]' 
                      : 'bg-white border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                    <span className="text-sm text-white font-medium">A</span>
                  </div>
                  <span className="hidden sm:inline text-sm font-medium">Admin</span>
                  <svg className={`w-4 h-4 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showUserMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)}></div>
                    <div className={`absolute right-0 mt-2 w-44 rounded-xl shadow-lg overflow-hidden z-50 border ${
                      isDarkMode 
                        ? 'bg-[#0A0E1A] border-white/[0.08]' 
                        : 'bg-white border-slate-200'
                    }`}>
                      <button
                        onClick={logout}
                        className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                          isDarkMode 
                            ? 'text-red-400 hover:bg-red-500/10' 
                            : 'text-red-600 hover:bg-red-50'
                        }`}
                      >
                        🚪 Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Subjects Quick Filter */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <div className="flex flex-wrap gap-2">
          {SUBJECTS.map((subject) => (
            <span
              key={subject.id}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                isDarkMode 
                  ? 'bg-white/[0.04] text-slate-300 border border-white/[0.05]' 
                  : 'bg-white text-slate-600 border border-slate-200 shadow-sm'
              }`}
            >
              <span>{subject.icon}</span>
              <span className="hidden sm:inline">{subject.name}</span>
            </span>
          ))}
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid gap-6 lg:grid-cols-2">
          
          {/* Left Side - Quiz List */}
          <div className={`rounded-2xl transition-all duration-300 overflow-hidden ${
            isDarkMode ? 'bg-white/[0.02] border border-white/[0.08]' : 'bg-white shadow-sm'
          }`}>
            <div className="p-5 border-b border-slate-200 dark:border-white/[0.08]">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className={`text-base font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                    Quiz Library
                  </h2>
                  <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    Manage and organize your quizzes
                  </p>
                </div>
                <div className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                  isDarkMode ? 'bg-white/[0.04] text-slate-400' : 'bg-slate-100 text-slate-500'
                }`}>
                  {quizzes.length} total
                </div>
              </div>
            </div>

            <div className="p-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((item) => (
                    <div key={item} className={`h-24 rounded-xl animate-pulse ${isDarkMode ? 'bg-white/[0.04]' : 'bg-slate-100'}`} />
                  ))}
                </div>
              ) : quizzes.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-5xl mb-3">📭</div>
                  <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    No quizzes yet. Create your first quiz!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {quizzes.map((quiz) => {
                    const difficulty = getDifficultyInfo(quiz.difficulty);
                    return (
                      <div
                        key={quiz.id}
                        className={`group rounded-xl p-4 transition-all cursor-pointer ${
                          showDetails === quiz.id
                            ? isDarkMode 
                              ? 'bg-white/[0.06] border border-[#00B0FF]/30 shadow-lg' 
                              : 'bg-blue-50/50 border border-[#00B0FF]/30 shadow-md'
                            : isDarkMode 
                              ? 'bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04]' 
                              : 'bg-white border border-slate-100 hover:shadow-md'
                        }`}
                        onClick={() => toggleDetails(quiz.id)}
                      >
                        <div className="flex gap-3">
                          {quiz.image_url ? (
                            <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-slate-100">
                              <img src={quiz.image_url} alt={quiz.title} className="w-full h-full object-cover" />
                            </div>
                          ) : (
                            <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br ${getSubjectColor(quiz.topic)}`}>
                              <span className="text-2xl">
                                {SUBJECTS.find(s => s.id === quiz.topic)?.icon || '📚'}
                              </span>
                            </div>
                          )}
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <h3 className={`font-semibold text-sm truncate ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                                  {quiz.title}
                                </h3>
                                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                  <span className={`inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full bg-gradient-to-r ${getSubjectColor(quiz.topic)} text-white`}>
                                    {SUBJECTS.find(s => s.id === quiz.topic)?.icon} {getSubjectName(quiz.topic)}
                                  </span>
                                  <span className={`inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full bg-${difficulty.color}-500/10 text-${difficulty.color}-600`}>
                                    {difficulty.icon} {difficulty.name}
                                  </span>
                                  <span className={`inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full ${
                                    quiz.is_active 
                                      ? 'bg-emerald-500/10 text-emerald-600' 
                                      : 'bg-red-500/10 text-red-600'
                                  }`}>
                                    {quiz.is_active ? '● Active' : '○ Inactive'}
                                  </span>
                                </div>
                              </div>
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={(e) => { e.stopPropagation(); editQuiz(quiz); }}
                                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.08] transition"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); deleteQuiz(quiz.id); }}
                                  className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition"
                                >
                                  <svg className="w-3.5 h-3.5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                            
                            {showDetails === quiz.id && (
                              <div className="mt-3 pt-3 border-t border-slate-200 dark:border-white/[0.05] space-y-2">
                                <p className={`text-xs line-clamp-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                  {quiz.description || 'No description provided'}
                                </p>
                                <div className="flex items-center gap-3 text-xs">
                                  <span className="text-slate-400">📝 {quiz.questions?.length || 0} questions</span>
                                  <span className="text-slate-400">⏱️ {DIFFICULTY_LEVELS.find(d => d.id === quiz.difficulty)?.timeLimit}s</span>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  <span className="text-[10px] text-slate-400">🎯 Assigned:</span>
                                  {(quiz.assigned_classes || []).slice(0, 4).map(classId => {
                                    const classInfo = CLASS_LEVELS.find(c => c.id === classId);
                                    return classInfo ? (
                                      <span key={classId} className="text-[9px] px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-white/[0.06]">
                                        {classInfo.icon} {classInfo.name}
                                      </span>
                                    ) : null;
                                  })}
                                  {(quiz.assigned_classes || []).length > 4 && (
                                    <span className="text-[9px] text-slate-400">+{(quiz.assigned_classes || []).length - 4}</span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Side - Quiz Form */}
          <div className={`rounded-2xl transition-all duration-300 ${
            isDarkMode ? 'bg-white/[0.02] border border-white/[0.08]' : 'bg-white shadow-sm'
          }`}>
            <div className="p-5 border-b border-slate-200 dark:border-white/[0.08]">
              <h2 className={`text-base font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                {selectedQuiz ? '✏️ Edit Quiz' : '✨ Create New Quiz'}
              </h2>
              <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Fill in the details below to {selectedQuiz ? 'update' : 'create'} a quiz
              </p>
            </div>

            <form onSubmit={saveQuiz} className="p-5 space-y-5 max-h-[70vh] overflow-y-auto custom-scrollbar">
              {/* Cover Image */}
              <div>
                <label className={`block text-xs font-semibold mb-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  Cover Image
                </label>
                {!form.quizImage ? (
                  <div className={`border-2 border-dashed rounded-xl p-4 text-center transition-colors ${
                    isDarkMode 
                      ? 'border-white/[0.08] hover:border-white/[0.15]' 
                      : 'border-slate-200 hover:border-slate-300'
                  }`}>
                    <input type="file" id="quizImageUpload" accept="image/*" onChange={handleQuizImageSelect} className="hidden" />
                    <label htmlFor="quizImageUpload" className="cursor-pointer flex flex-col items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/[0.04] flex items-center justify-center">
                        <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <span className="text-xs text-slate-400">{uploadingImage ? 'Uploading...' : 'Click to upload'}</span>
                    </label>
                  </div>
                ) : (
                  <div className="relative rounded-xl overflow-hidden">
                    <img src={form.quizImage} alt="Cover" className="w-full h-28 object-cover" />
                    <button
                      type="button"
                      onClick={removeQuizImage}
                      className="absolute top-2 right-2 p-1 rounded-full bg-red-500 text-white hover:bg-red-600 transition"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>

              {/* Title */}
              <div>
                <label className={`block text-xs font-semibold mb-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  Quiz Title *
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => changeForm('title', e.target.value)}
                  placeholder="e.g., Mathematics Final Exam"
                  className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#00B0FF] transition-all ${
                    isDarkMode 
                      ? 'bg-white/[0.04] border-white/[0.08] text-white focus:border-transparent' 
                      : 'bg-white border-slate-200 text-slate-800 focus:border-transparent'
                  }`}
                />
              </div>

              {/* Subject & Difficulty Row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-semibold mb-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    Subject *
                  </label>
                  <select
                    value={form.topic}
                    onChange={(e) => changeForm('topic', e.target.value)}
                    className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#00B0FF] ${
                      isDarkMode 
                        ? 'bg-white/[0.04] border-white/[0.08] text-white' 
                        : 'bg-white border-slate-200 text-slate-800'
                    }`}
                  >
                    <option value="">Select subject</option>
                    {SUBJECTS.map((subject) => (
                      <option key={subject.id} value={subject.id}>{subject.icon} {subject.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={`block text-xs font-semibold mb-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    Difficulty *
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {DIFFICULTY_LEVELS.map((difficulty) => (
                      <button
                        key={difficulty.id}
                        type="button"
                        onClick={() => changeForm('difficulty', difficulty.id)}
                        className={`p-2 rounded-lg text-left transition-all ${
                          form.difficulty === difficulty.id
                            ? `bg-gradient-to-r ${difficulty.gradient} text-white shadow-md`
                            : isDarkMode 
                              ? 'bg-white/[0.04] border border-white/[0.08] text-slate-300 hover:bg-white/[0.08]'
                              : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <span>{difficulty.icon}</span>
                          <div>
                            <p className="text-[11px] font-medium">{difficulty.name}</p>
                            <p className="text-[9px] opacity-70">{difficulty.timeLimit}s • {difficulty.points} pts</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Class Assignment */}
              <div>
                <label className={`block text-xs font-semibold mb-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  Assign to Classes * ({form.assignedClasses.length} selected)
                </label>
                <div className={`rounded-xl border p-3 ${isDarkMode ? 'border-white/[0.08]' : 'border-slate-200'}`}>
                  <div className="flex justify-between items-center mb-2 pb-2 border-b">
                    <span className="text-[10px] font-medium">Select target classes</span>
                    <button
                      type="button"
                      onClick={toggleAllClasses}
                      className="text-[10px] text-[#00B0FF] hover:underline"
                    >
                      {form.assignedClasses.length === CLASS_LEVELS.length ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 max-h-32 overflow-y-auto">
                    {CLASS_LEVELS.map((classLevel) => (
                      <label
                        key={classLevel.id}
                        className={`flex items-center gap-2 p-1.5 rounded cursor-pointer transition ${
                          form.assignedClasses.includes(classLevel.id)
                            ? 'bg-blue-50 dark:bg-white/[0.08]'
                            : 'hover:bg-slate-50 dark:hover:bg-white/[0.04]'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={form.assignedClasses.includes(classLevel.id)}
                          onChange={() => toggleClassAssignment(classLevel.id)}
                          className="w-3.5 h-3.5 rounded"
                        />
                        <span className="text-xs">{classLevel.icon} {classLevel.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
                {form.assignedClasses.length === 0 && (
                  <p className="text-[10px] text-red-500 mt-1">Please assign at least one class</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className={`block text-xs font-semibold mb-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => changeForm('description', e.target.value)}
                  rows={2}
                  placeholder="Brief description of the quiz..."
                  className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#00B0FF] resize-none ${
                    isDarkMode 
                      ? 'bg-white/[0.04] border-white/[0.08] text-white' 
                      : 'bg-white border-slate-200 text-slate-800'
                  }`}
                />
              </div>

              {/* Schedule Row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-semibold mb-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    Start Date
                  </label>
                  <input
                    type="datetime-local"
                    value={form.startDate}
                    onChange={(e) => changeForm('startDate', e.target.value)}
                    className={`w-full rounded-xl border px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-[#00B0FF] ${
                      isDarkMode 
                        ? 'bg-white/[0.04] border-white/[0.08] text-white' 
                        : 'bg-white border-slate-200 text-slate-800'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-xs font-semibold mb-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    End Date
                  </label>
                  <input
                    type="datetime-local"
                    value={form.endDate}
                    onChange={(e) => changeForm('endDate', e.target.value)}
                    className={`w-full rounded-xl border px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-[#00B0FF] ${
                      isDarkMode 
                        ? 'bg-white/[0.04] border-white/[0.08] text-white' 
                        : 'bg-white border-slate-200 text-slate-800'
                    }`}
                  />
                </div>
              </div>

              {/* Active Status */}
              <div className="flex items-center justify-between py-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => changeForm('isActive', e.target.checked)}
                    className="w-4 h-4 rounded"
                  />
                  <span className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    Make this quiz visible to students
                  </span>
                </label>
                {selectedQuiz && (
                  <button type="button" onClick={clearForm} className="text-xs text-slate-400 hover:text-slate-600">
                    Clear form
                  </button>
                )}
              </div>

              {/* Questions Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className={`text-xs font-semibold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    Questions ({questions.length})
                  </label>
                  <button
                    type="button"
                    onClick={addQuestion}
                    className="px-3 py-1 rounded-lg text-xs font-medium bg-[#00B0FF]/10 text-[#00B0FF] hover:bg-[#00B0FF]/20 transition"
                  >
                    + Add Question
                  </button>
                </div>

                <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-1 custom-scrollbar">
                  {questions.map((question, qIdx) => (
                    <div
                      key={question.id}
                      className={`rounded-xl p-4 transition-all ${
                        isDarkMode ? 'bg-white/[0.02] border border-white/[0.05]' : 'bg-slate-50 border border-slate-100'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                            <span className="text-[10px] font-bold text-white">{qIdx + 1}</span>
                          </div>
                          <span className="text-xs font-medium">Question</span>
                        </div>
                        {questions.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeQuestion(qIdx)}
                            className="text-[10px] text-red-500 hover:text-red-600"
                          >
                            Remove
                          </button>
                        )}
                      </div>

                      {/* Layout Selector */}
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        {QUESTION_LAYOUTS.map((layout) => (
                          <button
                            key={layout.id}
                            type="button"
                            onClick={() => changeQuestionLayout(qIdx, layout.id)}
                            className={`text-[10px] py-1.5 rounded-lg border transition ${
                              question.layout === layout.id
                                ? 'border-[#00B0FF] bg-[#00B0FF]/10 text-[#00B0FF]'
                                : isDarkMode ? 'border-white/[0.08] text-slate-400' : 'border-slate-200 text-slate-500'
                            }`}
                          >
                            {layout.name}
                          </button>
                        ))}
                      </div>

                      {/* Question Image */}
                      <div className="mb-3">
                        {!question.questionImage ? (
                          <div className={`border border-dashed rounded-lg p-2 text-center transition-colors ${
                            isDarkMode ? 'border-white/[0.08]' : 'border-slate-200'
                          }`}>
                            <input type="file" id={`qImg_${qIdx}`} accept="image/*" onChange={(e) => handleQuestionImageSelect(e, qIdx)} className="hidden" />
                            <label htmlFor={`qImg_${qIdx}`} className="cursor-pointer flex items-center justify-center gap-1 text-[10px] text-slate-400">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {uploadingQuestionImage && currentUploadingQuestion === qIdx ? 'Uploading...' : 'Add image'}
                            </label>
                          </div>
                        ) : (
                          <div className="relative">
                            <img src={question.questionImage} alt="Question" className="w-full h-20 object-cover rounded-lg" />
                            <button
                              type="button"
                              onClick={() => removeQuestionImage(qIdx)}
                              className="absolute top-1 right-1 p-0.5 rounded-full bg-red-500 text-white"
                            >
                              <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Question Text */}
                      <input
                        type="text"
                        value={question.question}
                        onChange={(e) => changeQuestion(qIdx, e.target.value)}
                        placeholder="Enter your question here..."
                        className={`w-full rounded-lg border px-3 py-2 text-sm mb-3 outline-none focus:ring-1 focus:ring-[#00B0FF] ${
                          isDarkMode 
                            ? 'bg-white/[0.04] border-white/[0.08] text-white' 
                            : 'bg-white border-slate-200 text-slate-800'
                        }`}
                      />

                      {/* Options Grid */}
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        {question.options.map((option, optIdx) => (
                          <input
                            key={optIdx}
                            type="text"
                            value={option}
                            onChange={(e) => changeOption(qIdx, optIdx, e.target.value)}
                            placeholder={`Option ${optIdx + 1}`}
                            className={`rounded-lg border px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-[#00B0FF] ${
                              isDarkMode 
                                ? 'bg-white/[0.04] border-white/[0.08] text-white' 
                                : 'bg-white border-slate-200 text-slate-800'
                            }`}
                          />
                        ))}
                      </div>

                      {/* Correct Answer Select */}
                      <select
                        value={question.correctAnswer}
                        onChange={(e) => changeAnswer(qIdx, e.target.value)}
                        className={`w-full rounded-lg border px-3 py-1.5 text-xs mb-3 outline-none focus:ring-1 focus:ring-[#00B0FF] ${
                          isDarkMode 
                            ? 'bg-white/[0.04] border-white/[0.08] text-white' 
                            : 'bg-white border-slate-200 text-slate-800'
                        }`}
                      >
                        <option value="">Select correct answer</option>
                        {question.options.map((option, optIdx) => (
                          <option key={optIdx} value={option}>
                            {option || `Option ${optIdx + 1}`}
                          </option>
                        ))}
                      </select>

                      {/* Question Preview */}
                      <QuestionPreview question={question} layout={question.layout} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-white/[0.08]">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-[#1A237E] to-[#00B0FF] text-white hover:opacity-90 transition disabled:opacity-50"
                >
                  {saving ? 'Saving...' : (selectedQuiz ? 'Update Quiz' : 'Create Quiz')}
                </button>
                <button
                  type="button"
                  onClick={clearForm}
                  className="px-6 py-2.5 rounded-xl text-sm font-medium border border-slate-200 dark:border-white/[0.08] hover:bg-slate-50 dark:hover:bg-white/[0.04] transition"
                >
                  Clear
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { 
          background: ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'};
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: ${isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'};
        }
      `}</style>
    </div>
  );
};

export default AdminQuizzes;