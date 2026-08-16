import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import API_URL from '../../config';

// UPDATED: Match subject IDs with Quiz Manager
const SUBJECTS = [
  { id: 'mathematics', name: 'Mathematics', icon: '📁', color: 'blue', bgColor: 'bg-blue-50', borderColor: 'border-blue-200', textColor: 'text-blue-700', folderColor: '#14B8A6' }, // Changed to teal
  { id: 'english', name: 'English', icon: '📁', color: 'green', bgColor: 'bg-green-50', borderColor: 'border-green-200', textColor: 'text-green-700', folderColor: '#14B8A6' }, // Changed to teal
  { id: 'primary-science', name: 'Primary Science', icon: '📁', color: 'purple', bgColor: 'bg-purple-50', borderColor: 'border-purple-200', textColor: 'text-purple-700', folderColor: '#14B8A6' }, // Changed to teal
  { id: 'social-studies', name: 'Social Studies', icon: '📁', color: 'orange', bgColor: 'bg-orange-50', borderColor: 'border-orange-200', textColor: 'text-orange-700', folderColor: '#14B8A6' }, // Changed to teal
  { id: 'bible-knowledge', name: 'Bible Knowledge', icon: '📁', color: 'yellow', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200', textColor: 'text-yellow-700', folderColor: '#14B8A6' }, // Changed to teal
  { id: 'arts-life-skills', name: 'Arts & Life Skills', icon: '📁', color: 'pink', bgColor: 'bg-pink-50', borderColor: 'border-pink-200', textColor: 'text-pink-700', folderColor: '#14B8A6' }, // Changed to teal
  { id: 'chichewa', name: 'Chichewa', icon: '📁', color: 'red', bgColor: 'bg-red-50', borderColor: 'border-red-200', textColor: 'text-red-700', folderColor: '#14B8A6' } // Changed to teal
];

const DIFFICULTIES = [
  { id: 'beginner', name: 'Beginner', icon: '🌱', color: 'bg-green-500', textColor: 'text-green-700', bgLight: 'bg-green-50' },
  { id: 'intermediate', name: 'Intermediate', icon: '📘', color: 'bg-blue-500', textColor: 'text-blue-700', bgLight: 'bg-blue-50' },
  { id: 'advanced', name: 'Advanced', icon: '📚', color: 'bg-yellow-500', textColor: 'text-yellow-700', bgLight: 'bg-yellow-50' },
  { id: 'expert', name: 'Expert', icon: '🏆', color: 'bg-red-500', textColor: 'text-red-700', bgLight: 'bg-red-50' }
];

const CLASS_LEVELS = [
  'standard-1', 'standard-2', 'standard-3', 'standard-4',
  'standard-5', 'standard-6', 'standard-7', 'standard-8'
];

const QuestionBank = () => {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [currentPath, setCurrentPath] = useState([]);
  const [currentFolder, setCurrentFolder] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [stats, setStats] = useState({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [selectedQuizQuestions, setSelectedQuizQuestions] = useState([]);
  const [selectedQuizTitle, setSelectedQuizTitle] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [form, setForm] = useState({
    subject_id: 'mathematics',
    difficulty_level: 'intermediate',
    class_level: 'standard-5',
    question: '',
    options: ['', '', '', ''],
    correct_answer: '',
    explanation: '',
    points: 2,
    time_limit: 30,
    tags: []
  });

  useEffect(() => {
    loadQuestions();
    loadQuizzes();
    loadStats();
  }, [selectedSubject, selectedDifficulty, selectedClass]);

  const loadQuestions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/admin/question-bank`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          subject_id: selectedSubject,
          difficulty_level: selectedDifficulty,
          class_level: selectedClass
        }
      });
      setQuestions(response.data.questions);
    } catch (error) {
      console.error('Error loading questions:', error);
    }
  };

  const loadQuizzes = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/admin/quizzes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setQuizzes(response.data.quizzes || []);
    } catch (error) {
      console.error('Error loading quizzes:', error);
      toast.error('Failed to load quizzes');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/admin/question-bank/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data.stats);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleSaveQuestion = async () => {
    if (!form.question.trim()) {
      toast.error('Please enter a question');
      return;
    }

    if (form.options.some(opt => !opt.trim())) {
      toast.error('Please fill in all options');
      return;
    }

    if (!form.correct_answer) {
      toast.error('Please select a correct answer');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (editingQuestion) {
        await axios.put(`${API_URL}/api/admin/question-bank/${editingQuestion.id}`, form, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Question updated successfully!');
      } else {
        await axios.post(`${API_URL}/api/admin/question-bank`, form, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Question added to bank!');
      }
      setShowAddModal(false);
      setEditingQuestion(null);
      resetForm();
      loadQuestions();
      loadStats();
    } catch (error) {
      console.error('Error saving question:', error);
      toast.error('Failed to save question');
    }
  };

  const handleDeleteQuestion = async (id) => {
    if (!window.confirm('Are you sure you want to delete this question?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/api/admin/question-bank/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Question deleted successfully!');
      loadQuestions();
      loadStats();
    } catch (error) {
      console.error('Error deleting question:', error);
      toast.error('Failed to delete question');
    }
  };

  const resetForm = () => {
    setForm({
      subject_id: selectedSubject || 'mathematics',
      difficulty_level: 'intermediate',
      class_level: 'standard-5',
      question: '',
      options: ['', '', '', ''],
      correct_answer: '',
      explanation: '',
      points: 2,
      time_limit: 30,
      tags: []
    });
  };

  const handleViewQuizQuestions = (quiz) => {
    let quizQuestions = [];
    if (quiz.questions && Array.isArray(quiz.questions)) {
      quizQuestions = quiz.questions;
    } else if (typeof quiz.questions === 'string') {
      try {
        quizQuestions = JSON.parse(quiz.questions);
      } catch (e) {
        quizQuestions = [];
      }
    }
    setSelectedQuizQuestions(quizQuestions);
    setSelectedQuizTitle(quiz.title);
    setShowQuizModal(true);
  };

  const groupQuizzesBySubject = () => {
    const grouped = {};
    SUBJECTS.forEach(subject => {
      grouped[subject.id] = [];
    });
    grouped['other'] = [];
    
    quizzes.forEach(quiz => {
      const subjectTopic = quiz.topic || 'other';
      const subjectExists = SUBJECTS.some(s => s.id === subjectTopic);
      if (subjectExists) {
        grouped[subjectTopic].push(quiz);
      } else {
        grouped['other'].push(quiz);
      }
    });
    
    return grouped;
  };

  const groupedQuizzes = groupQuizzesBySubject();

  const getSubjectQuizCount = (subjectId) => {
    return groupedQuizzes[subjectId]?.length || 0;
  };

  const openFolder = (subjectId, subjectName) => {
    setCurrentPath([...currentPath, { id: subjectId, name: subjectName }]);
    setCurrentFolder(subjectId);
  };

  const navigateToPath = (index) => {
    if (index === -1) {
      setCurrentPath([]);
      setCurrentFolder(null);
    } else {
      const newPath = currentPath.slice(0, index + 1);
      setCurrentPath(newPath);
      setCurrentFolder(newPath[newPath.length - 1]?.id || null);
    }
  };

  const goBack = () => {
    if (currentPath.length > 0) {
      const newPath = currentPath.slice(0, -1);
      setCurrentPath(newPath);
      setCurrentFolder(newPath[newPath.length - 1]?.id || null);
    }
  };

  // Computer-style File Icon Component
  const FileIcon = ({ type, size = 'md' }) => {
    const icons = {
      word: '📄',
      excel: '📊',
      pdf: '📑',
      image: '🖼️',
      quiz: '📋',
      default: '📄'
    };
    const sizeClasses = {
      sm: 'text-3xl',
      md: 'text-4xl',
      lg: 'text-5xl'
    };
    return <div className={sizeClasses[size]}>{icons[type] || icons.quiz}</div>;
  };

  // Computer-style File Item with metadata
  const FileItem = ({ quiz, onViewQuestions }) => {
    const [isHovered, setIsHovered] = useState(false);
    const difficultyInfo = DIFFICULTIES.find(d => d.id === quiz.difficulty) || DIFFICULTIES[1];
    const questionCount = quiz.questions ? (Array.isArray(quiz.questions) ? quiz.questions.length : 
      (typeof quiz.questions === 'string' ? JSON.parse(quiz.questions).length : 0)) : 0;
    
    const fileSize = `${Math.floor(Math.random() * 50) + 10} KB`;
    const dateModified = new Date(quiz.updated_at || quiz.created_at).toLocaleDateString();
    const fileType = quiz.is_active ? 'Active Quiz' : 'Inactive Quiz';
    
    return (
      <div 
        className={`flex items-center gap-4 p-3 rounded-lg border transition-all cursor-pointer ${
          isHovered ? 'bg-blue-50 border-blue-300 shadow-sm' : 'bg-white border-gray-200'
        }`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => onViewQuestions(quiz)}
      >
        <div className="flex-shrink-0">
          <FileIcon type="quiz" size="lg" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`font-medium text-gray-800 ${isHovered ? 'text-blue-600' : ''}`}>
              {quiz.title}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${difficultyInfo.bgLight} ${difficultyInfo.textColor}`}>
              {difficultyInfo.icon} {difficultyInfo.name}
            </span>
          </div>
          <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
            <span>📊 {questionCount} questions</span>
            <span>📅 Modified: {dateModified}</span>
            <span>💾 Size: {fileSize}</span>
            <span className={`px-2 py-0.5 rounded-full ${quiz.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
              {quiz.is_active ? '● Active' : '○ Inactive'}
            </span>
          </div>
          {quiz.description && (
            <p className="text-xs text-gray-400 mt-1 truncate">{quiz.description}</p>
          )}
        </div>
        
        <div className="flex-shrink-0 text-right">
          <div className="text-xs text-gray-400">{fileType}</div>
          <div className="text-xs text-gray-400 mt-1">📁 {quiz.topic || 'General'}</div>
        </div>
      </div>
    );
  };

  // Grid view file item
  const GridFileItem = ({ quiz, onViewQuestions }) => {
    const [isHovered, setIsHovered] = useState(false);
    const difficultyInfo = DIFFICULTIES.find(d => d.id === quiz.difficulty) || DIFFICULTIES[1];
    const questionCount = quiz.questions ? (Array.isArray(quiz.questions) ? quiz.questions.length : 
      (typeof quiz.questions === 'string' ? JSON.parse(quiz.questions).length : 0)) : 0;
    
    return (
      <div 
        className={`flex flex-col items-center p-4 rounded-lg border transition-all cursor-pointer ${
          isHovered ? 'bg-blue-50 border-blue-300 shadow-md transform scale-105' : 'bg-white border-gray-200'
        }`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => onViewQuestions(quiz)}
      >
        <FileIcon type="quiz" size="lg" />
        <div className="text-center mt-2">
          <div className={`text-sm font-medium ${isHovered ? 'text-blue-600' : 'text-gray-800'} truncate max-w-[120px]`}>
            {quiz.title}
          </div>
          <div className="flex items-center justify-center gap-1 mt-1">
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${difficultyInfo.bgLight} ${difficultyInfo.textColor}`}>
              {difficultyInfo.icon}
            </span>
            <span className="text-xs text-gray-400">{questionCount} Qs</span>
          </div>
        </div>
      </div>
    );
  };

  const FolderItem = ({ subject }) => {
    const subjectInfo = SUBJECTS.find(s => s.id === subject.id);
    const quizCount = getSubjectQuizCount(subject.id);
    const folderColor = subjectInfo ? subjectInfo.folderColor : '#14B8A6'; // Default to teal
    const [isHovered, setIsHovered] = useState(false);
    
    return (
      <div
        onClick={() => openFolder(subject.id, subjectInfo.name)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="group cursor-pointer"
      >
        <div className={`flex flex-col items-center p-4 rounded-xl border transition-all ${
          isHovered ? 'bg-gray-50 border-teal-300 shadow-md transform scale-105' : 'bg-white border-gray-200'
        }`}>
          <div className="text-5xl mb-2" style={{ color: folderColor }}>
            📁
          </div>
          <div className="text-center">
            <div className={`text-sm font-medium ${isHovered ? 'text-teal-600' : 'text-gray-700'}`}>
              {subjectInfo.name}
            </div>
            <div className="text-xs text-gray-400 mt-1">{quizCount} items</div>
          </div>
        </div>
      </div>
    );
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
    toast.success('Logged out successfully');
  };

  const currentFolderQuizzes = currentFolder ? (groupedQuizzes[currentFolder] || []) : [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/admin-dashboard')}>
                <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-lg">📚</span>
                </div>
                <span className="font-bold text-gray-800">Learn & Earn</span>
              </div>
              
              <div className="hidden md:flex items-center gap-1">
                <button onClick={() => navigate('/admin-dashboard')} className="px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition">📊 Dashboard</button>
                <button onClick={() => navigate('/admin-quizzes')} className="px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition">📝 Quizzes</button>
                <button onClick={() => navigate('/admin/question-bank')} className="px-3 py-2 rounded-lg text-sm font-medium text-white bg-teal-500 transition">📚 Question Bank</button>
                <button onClick={() => navigate('/admin-badges')} className="px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition">🏅 Badges</button>
                <button onClick={() => navigate('/admin-rewards')} className="px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition">🎁 Rewards</button>
                <button onClick={() => navigate('/admin-learners')} className="px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition">👥 Learners</button>
              </div>
            </div>
            
            <div className="relative">
              <button onClick={() => setShowUserMenu(!showUserMenu)} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center">
                  <span className="text-sm text-white font-medium">AD</span>
                </div>
                <span className="text-sm font-medium text-gray-700 hidden sm:inline">Admin</span>
                <svg className={`w-4 h-4 text-gray-500 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {showUserMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)}></div>
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden">
                    <button onClick={() => { setShowUserMenu(false); navigate('/admin-dashboard'); }} className="w-full px-4 py-2 text-left text-sm text-gray-600 hover:bg-gray-50 transition">👤 Profile</button>
                    <button onClick={() => { setShowUserMenu(false); navigate('/admin-settings'); }} className="w-full px-4 py-2 text-left text-sm text-gray-600 hover:bg-gray-50 transition">⚙️ Settings</button>
                    <hr className="border-gray-100" />
                    <button onClick={() => { setShowUserMenu(false); handleLogout(); }} className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition">🚪 Sign Out</button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Question Bank</h1>
            <p className="text-sm text-gray-500">Browse quizzes like a file explorer</p>
          </div>
          <div className="flex gap-3">
            {/* View Toggle */}
            <div className="flex rounded-lg border border-gray-200 overflow-hidden">
              <button onClick={() => setViewMode('grid')} className={`px-3 py-1.5 text-sm transition ${viewMode === 'grid' ? 'bg-teal-500 text-white' : 'bg-white text-gray-600'}`}>📱 Grid</button>
              <button onClick={() => setViewMode('list')} className={`px-3 py-1.5 text-sm transition ${viewMode === 'list' ? 'bg-teal-500 text-white' : 'bg-white text-gray-600'}`}>📋 List</button>
            </div>
            <button onClick={() => { setEditingQuestion(null); resetForm(); setShowAddModal(true); }} className="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition flex items-center gap-2">
              <span>+</span> Add Question
            </button>
          </div>
        </div>

        {/* Computer-Style Explorer */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-teal-500 border-t-transparent mx-auto"></div>
            <p className="mt-2 text-sm text-gray-500">Loading...</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {/* Toolbar */}
            <div className="bg-gray-100 px-3 py-2 border-b border-gray-200 flex items-center gap-4">
              <div className="flex items-center gap-1">
                <button onClick={goBack} disabled={currentPath.length === 0} className={`p-1.5 rounded transition ${currentPath.length > 0 ? 'hover:bg-gray-200' : 'opacity-50 cursor-not-allowed'}`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <button onClick={() => { setCurrentPath([]); setCurrentFolder(null); }} className="p-1.5 hover:bg-gray-200 rounded transition">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                </button>
              </div>
              
              {/* Breadcrumb Navigation */}
              <div className="flex-1">
                <div className="flex items-center gap-1 text-sm">
                  <button onClick={() => navigateToPath(-1)} className={`px-2 py-1 rounded hover:bg-gray-200 transition ${currentPath.length === 0 ? 'font-semibold text-gray-800' : 'text-gray-600'}`}>
                    📁 Question Bank
                  </button>
                  {currentPath.map((folder, index) => (
                    <React.Fragment key={folder.id}>
                      <span className="text-gray-400">›</span>
                      <button onClick={() => navigateToPath(index)} className={`px-2 py-1 rounded hover:bg-gray-200 transition ${index === currentPath.length - 1 ? 'font-semibold text-gray-800' : 'text-gray-600'}`}>
                        {folder.name}
                      </button>
                    </React.Fragment>
                  ))}
                </div>
              </div>
              
              {/* View Mode Indicator */}
              <div className="text-xs text-gray-400">
                {viewMode === 'grid' ? 'Grid view' : 'List view'}
              </div>
            </div>
            
            {/* Content Area */}
            <div className="p-6">
              {currentFolder === null ? (
                // Root level - Show all subject folders
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
                  {SUBJECTS.map(subject => {
                    if (selectedSubject && selectedSubject !== subject.id) return null;
                    return <FolderItem key={subject.id} subject={subject} />;
                  })}
                </div>
              ) : (
                // Folder content - Show quizzes as files
                <div>
                  {/* Folder Header */}
                  <div className="mb-4 pb-3 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl" style={{ color: SUBJECTS.find(s => s.id === currentFolder)?.folderColor || '#14B8A6' }}>📂</span>
                      <div>
                        <h2 className="text-lg font-semibold text-gray-800">{SUBJECTS.find(s => s.id === currentFolder)?.name}</h2>
                        <p className="text-xs text-gray-500">{currentFolderQuizzes.length} items</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Quizzes List - Computer style with metadata */}
                  {currentFolderQuizzes.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">📭</div>
                      <p className="text-gray-400 text-sm">This folder is empty</p>
                      <button onClick={() => navigate('/admin-quizzes')} className="mt-3 text-sm text-teal-500 hover:text-teal-600 font-medium">
                        Create a quiz →
                      </button>
                    </div>
                  ) : viewMode === 'list' ? (
                    <div className="space-y-2">
                      {/* Column Headers */}
                      <div className="flex items-center gap-4 px-3 py-2 bg-gray-50 rounded-lg text-xs font-medium text-gray-500 border border-gray-200">
                        <div className="flex-shrink-0 w-12"></div>
                        <div className="flex-1">Name</div>
                        <div className="w-32">Type</div>
                        <div className="w-24">Size</div>
                        <div className="w-32">Date Modified</div>
                      </div>
                      {/* File List */}
                      {currentFolderQuizzes.map(quiz => (
                        <FileItem key={quiz.id} quiz={quiz} onViewQuestions={handleViewQuizQuestions} />
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      {currentFolderQuizzes.map(quiz => (
                        <GridFileItem key={quiz.id} quiz={quiz} onViewQuestions={handleViewQuizQuestions} />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Quiz Questions Modal */}
      <QuizQuestionsModal isOpen={showQuizModal} onClose={() => setShowQuizModal(false)} title={selectedQuizTitle} questions={selectedQuizQuestions} />

      {/* Add/Edit Question Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-5">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold">{editingQuestion ? 'Edit Question' : 'Add New Question'}</h2>
                <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <select value={form.subject_id} onChange={(e) => setForm({ ...form, subject_id: e.target.value })} className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm">
                    {SUBJECTS.map(s => (<option key={s.id} value={s.id}>{s.name}</option>))}
                  </select>
                  <select value={form.difficulty_level} onChange={(e) => setForm({ ...form, difficulty_level: e.target.value })} className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm">
                    {DIFFICULTIES.map(d => (<option key={d.id} value={d.id}>{d.name}</option>))}
                  </select>
                </div>
                <select value={form.class_level} onChange={(e) => setForm({ ...form, class_level: e.target.value })} className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-sm">
                  {CLASS_LEVELS.map(c => (<option key={c} value={c}>{c.replace('-', ' ').toUpperCase()}</option>))}
                </select>
                <textarea value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} placeholder="Enter your question..." rows={3} className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-sm" />
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-gray-700">Answer Options</label>
                  {form.options.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <button type="button" onClick={() => setForm({ ...form, correct_answer: opt })} className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${form.correct_answer === opt ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
                        {String.fromCharCode(65 + idx)}
                      </button>
                      <input type="text" value={opt} onChange={(e) => { const newOptions = [...form.options]; newOptions[idx] = e.target.value; setForm({ ...form, options: newOptions }); }} placeholder={`Option ${String.fromCharCode(65 + idx)}`} className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 text-sm" />
                    </div>
                  ))}
                </div>
                <textarea value={form.explanation} onChange={(e) => setForm({ ...form, explanation: e.target.value })} placeholder="Explanation (optional)" rows={2} className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-sm" />
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-xs font-medium text-gray-700 mb-1">Points</label><input type="number" value={form.points} onChange={(e) => setForm({ ...form, points: parseInt(e.target.value) })} min="1" max="10" className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-sm" /></div>
                  <div><label className="block text-xs font-medium text-gray-700 mb-1">Time Limit</label><input type="number" value={form.time_limit} onChange={(e) => setForm({ ...form, time_limit: parseInt(e.target.value) })} min="10" max="120" className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-sm" /></div>
                </div>
                <div className="flex gap-3 pt-3">
                  <button onClick={() => setShowAddModal(false)} className="flex-1 py-1.5 rounded-lg border border-gray-200 text-gray-600 text-sm">Cancel</button>
                  <button onClick={handleSaveQuestion} className="flex-1 py-1.5 rounded-lg bg-teal-500 text-white text-sm">{editingQuestion ? 'Update' : 'Save'}</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Quiz Questions Modal Component
const QuizQuestionsModal = ({ isOpen, onClose, title, questions }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📄</span>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
              <p className="text-xs text-gray-500">{questions.length} questions</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
        </div>
        <div className="p-4 overflow-y-auto flex-1">
          {questions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400">No questions in this quiz</p>
            </div>
          ) : (
            <div className="space-y-3">
              {questions.map((q, idx) => (
                <div key={idx} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-teal-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800 mb-2">{q.question}</p>
                      <div className="space-y-1">
                        {q.options && q.options.map((opt, optIdx) => (
                          <div key={optIdx} className="flex items-center gap-2 text-xs">
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                              opt === q.correctAnswer ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
                            }`}>
                              {String.fromCharCode(65 + optIdx)}
                            </span>
                            <span className={`flex-1 ${opt === q.correctAnswer ? 'font-medium text-green-700' : 'text-gray-600'}`}>
                              {opt}
                            </span>
                            {opt === q.correctAnswer && (
                              <span className="text-xs text-green-600">✓</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="p-3 border-t border-gray-200 bg-gray-50 flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition">Close</button>
          <button onClick={() => { onClose(); }} className="px-3 py-1.5 rounded-lg text-sm bg-teal-500 text-white hover:bg-teal-600 transition">Manage Quiz</button>
        </div>
      </div>
    </div>
  );
};

export default QuestionBank;