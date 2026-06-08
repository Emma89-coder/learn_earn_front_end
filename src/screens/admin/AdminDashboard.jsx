import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import API_URL from '../../config';

// Subjects configuration
const SUBJECTS = [
  { id: 'social-studies', name: 'Social Studies', icon: '🌍', color: '#1A237E', bgLight: '#1A237E/10', textLight: '#1A237E' },
  { id: 'bible-knowledge', name: 'Bible Knowledge', icon: '📖', color: '#00B0FF', bgLight: '#00B0FF/10', textLight: '#00B0FF' },
  { id: 'english', name: 'English', icon: '📚', color: '#008080', bgLight: '#008080/10', textLight: '#008080' },
  { id: 'primary-science', name: 'Primary Science', icon: '🔬', color: '#00B0FF', bgLight: '#00B0FF/10', textLight: '#00B0FF' },
  { id: 'arts-life-skills', name: 'Arts & Life Skills', icon: '🎨', color: '#008080', bgLight: '#008080/10', textLight: '#008080' },
  { id: 'mathematics', name: 'Mathematics', icon: '🔢', color: '#1A237E', bgLight: '#1A237E/10', textLight: '#1A237E' },
  { id: 'chichewa', name: 'Chichewa', icon: '🇲🇼', color: '#00B0FF', bgLight: '#00B0FF/10', textLight: '#00B0FF' }
];

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

// Difficulty levels
const DIFFICULTY_LEVELS = [
  { id: 'beginner', name: 'Beginner', icon: '🌱', timeLimit: 45, points: 1, description: 'Perfect for introduction' },
  { id: 'intermediate', name: 'Intermediate', icon: '📘', timeLimit: 30, points: 2, description: 'Regular challenge' },
  { id: 'advanced', name: 'Advanced', icon: '🎓', timeLimit: 20, points: 3, description: 'For skilled learners' },
  { id: 'expert', name: 'Expert', icon: '🏆', timeLimit: 15, points: 5, description: 'Ultimate challenge' }
];

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState({ 
    totalLearners: 0, 
    totalQuizzes: 0, 
    totalQuestions: 0, 
    totalSubmissions: 0, 
    averageScore: 0 
  });
  const [loading, setLoading] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [activeMainTab, setActiveMainTab] = useState('overview');

  // Quiz Manager State
  const [quizzes, setQuizzes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Learners State
  const [learners, setLearners] = useState([]);
  const [saving, setSaving] = useState(false);
  const [updatingClass, setUpdatingClass] = useState(null);
  const [updatingLevel, setUpdatingLevel] = useState(null);
  const [generatedRegNumber, setGeneratedRegNumber] = useState('');
  const [selectedLearner, setSelectedLearner] = useState(null);
  const [showLevelModal, setShowLevelModal] = useState(false);
  const [showLevelHistoryModal, setShowLevelHistoryModal] = useState(false);
  const [levelHistory, setLevelHistory] = useState([]);
  const [learnerForm, setLearnerForm] = useState({ 
    username: '', 
    full_name: '', 
    registration_number: '', 
    class_level: '' 
  });

  // Rewards State
  const [rewards, setRewards] = useState([]);
  const [rewardForm, setRewardForm] = useState({
    name: '',
    description: '',
    points_required: 100,
    icon: '🎁',
    stock: 10
  });
  const [editingRewardId, setEditingRewardId] = useState(null);

  // Badges State
  const [badges, setBadges] = useState([]);
  const [badgeForm, setBadgeForm] = useState({
    name: '',
    description: '',
    icon: '🏅',
    criteria_type: 'quiz_score',
    criteria_value: 80
  });
  const [editingBadgeId, setEditingBadgeId] = useState(null);

  // Question Bank State
  const [questionBank, setQuestionBank] = useState([]);
  const [currentPath, setCurrentPath] = useState([]);
  const [currentFolder, setCurrentFolder] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [selectedQuizQuestions, setSelectedQuizQuestions] = useState([]);
  const [selectedQuizTitle, setSelectedQuizTitle] = useState('');
  const [bankQuestion, setBankQuestion] = useState({
    subject_id: 'mathematics',
    difficulty_level: 'intermediate',
    class_level: 'standard-5',
    question: '',
    options: ['', '', '', ''],
    correct_answer: '',
    explanation: '',
    points: 2,
    time_limit: 30
  });
  const [editingBankId, setEditingBankId] = useState(null);

  useEffect(() => {
    fetchStats();
    fetchQuizzes();
    fetchLearners();
    fetchRewards();
    fetchBadges();
    fetchQuestionBank();
    generateRegistrationNumber();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/admin/dashboard-stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setStats({
          totalLearners: response.data.stats.total_learners || 0,
          totalQuizzes: response.data.stats.total_quizzes || 0,
          totalQuestions: response.data.stats.total_questions || 0,
          totalSubmissions: response.data.stats.total_submissions || 0,
          averageScore: response.data.stats.average_quiz_score || 0
        });
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuizzes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/admin/quizzes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setQuizzes(response.data.quizzes || []);
      }
    } catch (error) {
      console.error('Failed to fetch quizzes:', error);
    }
  };

  const fetchLearners = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/admin/learners`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setLearners(response.data.learners || []);
      }
    } catch (error) {
      console.error('Failed to fetch learners:', error);
    }
  };

  const fetchRewards = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/admin/rewards`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setRewards(response.data.rewards);
      }
    } catch (error) {
      console.error('Failed to fetch rewards:', error);
    }
  };

  const fetchBadges = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/admin/badges`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setBadges(response.data.badges);
      }
    } catch (error) {
      console.error('Failed to fetch badges:', error);
    }
  };

  const fetchQuestionBank = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/admin/question-bank`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setQuestionBank(response.data.questions);
      }
    } catch (error) {
      console.error('Failed to fetch question bank:', error);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
    toast.success('Logged out successfully');
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // Helper functions for Learners
  const getLevelIndex = (level) => {
    return CLASS_LEVELS.findIndex(l => l.id === level);
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
    setLearnerForm(prev => ({ ...prev, registration_number: regNumber }));
  };

  const handleRegenerateNumber = () => {
    generateRegistrationNumber();
    toast.success('New registration number generated!');
  };

  const handleLearnerSubmit = async (e) => {
    e.preventDefault();
    if (!learnerForm.username.trim() || !learnerForm.full_name.trim() || !learnerForm.registration_number.trim()) {
      return toast.error('Required fields are missing.');
    }
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/api/admin/learners`, learnerForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Learner registered successfully!');
      setLearnerForm({ 
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
      toast.success('Class level updated successfully!');
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

  const isLevelWithinClass = (level, classLevel) => {
    const levelIndex = getLevelIndex(level);
    const classIndex = getLevelIndex(classLevel);
    return levelIndex <= classIndex;
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

  // Rewards Handlers
  const handleRewardFormChange = (e) => {
    setRewardForm({ ...rewardForm, [e.target.name]: e.target.value });
  };

  const addOrUpdateReward = async () => {
    if (!rewardForm.name.trim()) {
      toast.error('Please enter a reward name');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const url = editingRewardId 
        ? `${API_URL}/api/admin/update-reward/${editingRewardId}`
        : `${API_URL}/api/admin/create-reward`;
      
      const response = await axios.post(url, rewardForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        toast.success(editingRewardId ? 'Reward updated!' : 'Reward created!');
        setRewardForm({ name: '', description: '', points_required: 100, icon: '🎁', stock: 10 });
        setEditingRewardId(null);
        fetchRewards();
      }
    } catch (error) {
      console.error('Error saving reward:', error);
      toast.error('Failed to save reward');
    }
  };

  const editReward = (reward) => {
    setEditingRewardId(reward.id);
    setRewardForm(reward);
  };

  const deleteReward = async (rewardId) => {
    if (window.confirm('Are you sure you want to delete this reward?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`${API_URL}/api/admin/delete-reward/${rewardId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Reward deleted successfully');
        fetchRewards();
      } catch (error) {
        console.error('Error deleting reward:', error);
        toast.error('Failed to delete reward');
      }
    }
  };

  // Badges Handlers
  const handleBadgeFormChange = (e) => {
    setBadgeForm({ ...badgeForm, [e.target.name]: e.target.value });
  };

  const addOrUpdateBadge = async () => {
    if (!badgeForm.name.trim()) {
      toast.error('Please enter a badge name');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const url = editingBadgeId 
        ? `${API_URL}/api/admin/update-badge/${editingBadgeId}`
        : `${API_URL}/api/admin/create-badge`;
      
      const response = await axios.post(url, badgeForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        toast.success(editingBadgeId ? 'Badge updated!' : 'Badge created!');
        setBadgeForm({ name: '', description: '', icon: '🏅', criteria_type: 'quiz_score', criteria_value: 80 });
        setEditingBadgeId(null);
        fetchBadges();
      }
    } catch (error) {
      console.error('Error saving badge:', error);
      toast.error('Failed to save badge');
    }
  };

  const editBadge = (badge) => {
    setEditingBadgeId(badge.id);
    setBadgeForm(badge);
  };

  const deleteBadge = async (badgeId) => {
    if (window.confirm('Are you sure you want to delete this badge?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`${API_URL}/api/admin/delete-badge/${badgeId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Badge deleted successfully');
        fetchBadges();
      } catch (error) {
        console.error('Error deleting badge:', error);
        toast.error('Failed to delete badge');
      }
    }
  };

  // Question Bank Helper Functions
  const handleSaveBankQuestion = async () => {
    if (!bankQuestion.question.trim()) {
      toast.error('Please enter a question');
      return;
    }
    if (bankQuestion.options.some(opt => !opt.trim())) {
      toast.error('Please fill in all options');
      return;
    }
    if (!bankQuestion.correct_answer) {
      toast.error('Please select a correct answer');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (editingBankId) {
        await axios.put(`${API_URL}/api/admin/question-bank/${editingBankId}`, bankQuestion, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Question updated successfully!');
      } else {
        await axios.post(`${API_URL}/api/admin/question-bank`, bankQuestion, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Question added to bank!');
      }
      setShowAddModal(false);
      setEditingBankId(null);
      resetBankForm();
      fetchQuestionBank();
    } catch (error) {
      console.error('Error saving question:', error);
      toast.error('Failed to save question');
    }
  };

  const resetBankForm = () => {
    setBankQuestion({
      subject_id: 'mathematics',
      difficulty_level: 'intermediate',
      class_level: 'standard-5',
      question: '',
      options: ['', '', '', ''],
      correct_answer: '',
      explanation: '',
      points: 2,
      time_limit: 30
    });
  };

  const handleBankOptionChange = (index, value) => {
    const newOptions = [...bankQuestion.options];
    newOptions[index] = value;
    setBankQuestion({ ...bankQuestion, options: newOptions });
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
  const getSubjectQuizCount = (subjectId) => groupedQuizzes[subjectId]?.length || 0;

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

  const FileItem = ({ quiz, onViewQuestions }) => {
    const [isHovered, setIsHovered] = useState(false);
    const difficultyInfo = DIFFICULTY_LEVELS.find(d => d.id === quiz.difficulty) || DIFFICULTY_LEVELS[1];
    const questionCount = quiz.questions ? (Array.isArray(quiz.questions) ? quiz.questions.length : 
      (typeof quiz.questions === 'string' ? JSON.parse(quiz.questions).length : 0)) : 0;
    
    const dateModified = new Date(quiz.updated_at || quiz.created_at).toLocaleDateString();
    
    return (
      <div 
        className={`flex items-center gap-4 p-3 rounded-lg border transition-all cursor-pointer ${
          isHovered ? 'bg-teal-50 border-teal-300 shadow-sm' : 'bg-white border-gray-200'
        }`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => onViewQuestions(quiz)}
      >
        <div className="flex-shrink-0 text-3xl">📄</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`font-medium text-gray-800 ${isHovered ? 'text-teal-600' : ''}`}>
              {quiz.title}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full bg-${difficultyInfo.id === 'beginner' ? 'green' : difficultyInfo.id === 'intermediate' ? 'blue' : difficultyInfo.id === 'advanced' ? 'yellow' : 'red'}-100 text-${difficultyInfo.id === 'beginner' ? 'green' : difficultyInfo.id === 'intermediate' ? 'blue' : difficultyInfo.id === 'advanced' ? 'yellow' : 'red'}-700`}>
              {difficultyInfo.icon} {difficultyInfo.name}
            </span>
          </div>
          <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
            <span>📊 {questionCount} questions</span>
            <span>📅 Modified: {dateModified}</span>
          </div>
        </div>
      </div>
    );
  };

  const GridFileItem = ({ quiz, onViewQuestions }) => {
    const [isHovered, setIsHovered] = useState(false);
    const difficultyInfo = DIFFICULTY_LEVELS.find(d => d.id === quiz.difficulty) || DIFFICULTY_LEVELS[1];
    const questionCount = quiz.questions ? (Array.isArray(quiz.questions) ? quiz.questions.length : 
      (typeof quiz.questions === 'string' ? JSON.parse(quiz.questions).length : 0)) : 0;
    
    return (
      <div 
        className={`flex flex-col items-center p-4 rounded-lg border transition-all cursor-pointer ${
          isHovered ? 'bg-teal-50 border-teal-300 shadow-md transform scale-105' : 'bg-white border-gray-200'
        }`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => onViewQuestions(quiz)}
      >
        <div className="text-4xl">📄</div>
        <div className="text-center mt-2">
          <div className={`text-sm font-medium ${isHovered ? 'text-teal-600' : 'text-gray-800'} truncate max-w-[120px]`}>
            {quiz.title}
          </div>
          <div className="flex items-center justify-center gap-1 mt-1">
            <span className="text-xs text-gray-400">{questionCount} Qs</span>
          </div>
        </div>
      </div>
    );
  };

  const FolderItem = ({ subject }) => {
    const subjectInfo = SUBJECTS.find(s => s.id === subject.id);
    const quizCount = getSubjectQuizCount(subject.id);
    const [isHovered, setIsHovered] = useState(false);
    
    return (
      <div
        onClick={() => openFolder(subject.id, subjectInfo?.name)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="group cursor-pointer"
      >
        <div className={`flex flex-col items-center p-4 rounded-xl border transition-all ${
          isHovered ? 'bg-gray-50 border-teal-300 shadow-md transform scale-105' : 'bg-white border-gray-200'
        }`}>
          <div className="text-5xl mb-2">📁</div>
          <div className="text-center">
            <div className={`text-sm font-medium ${isHovered ? 'text-teal-600' : 'text-gray-700'}`}>
              {subjectInfo?.name || subject.id}
            </div>
            <div className="text-xs text-gray-400 mt-1">{quizCount} items</div>
          </div>
        </div>
      </div>
    );
  };

  const currentFolderQuizzes = currentFolder ? (groupedQuizzes[currentFolder] || []) : [];

  const getSubjectColor = (topicId) => {
    const subject = SUBJECTS.find(s => s.id === topicId);
    return subject ? subject.color : '#1A237E';
  };

  const getSubjectName = (topicId) => {
    const subject = SUBJECTS.find(s => s.id === topicId);
    return subject ? subject.name : topicId;
  };

  const getDifficultyInfo = (difficultyId) => {
    return DIFFICULTY_LEVELS.find(d => d.id === difficultyId) || DIFFICULTY_LEVELS[1];
  };

  const filteredQuizzes = quizzes.filter(quiz => {
    const matchesSearch = quiz.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = !filterSubject || quiz.topic === filterSubject;
    const matchesDifficulty = !filterDifficulty || quiz.difficulty === filterDifficulty;
    const matchesStatus = !filterStatus || (filterStatus === 'active' ? quiz.is_active : !quiz.is_active);
    return matchesSearch && matchesSubject && matchesDifficulty && matchesStatus;
  });

  const QuizCard = ({ quiz }) => {
    const difficulty = getDifficultyInfo(quiz.difficulty);
    const [isExpanded, setIsExpanded] = useState(false);
    const totalQuestions = quiz.questions?.length || 0;

    return (
      <div
        className="bg-white rounded-xl border border-gray-200 transition-all hover:shadow-md cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="p-4">
          <div className="flex gap-4">
            {quiz.image_url ? (
              <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                <img src={quiz.image_url} alt={quiz.title} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className={`w-20 h-20 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm`} style={{ backgroundColor: getSubjectColor(quiz.topic) }}>
                <span className="text-3xl">
                  {SUBJECTS.find(s => s.id === quiz.topic)?.icon || '📚'}
                </span>
              </div>
            )}
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800 truncate pr-4">{quiz.title}</h3>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-full text-white shadow-sm`} style={{ backgroundColor: getSubjectColor(quiz.topic) }}>
                      {SUBJECTS.find(s => s.id === quiz.topic)?.icon} {getSubjectName(quiz.topic)}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-full bg-teal-100 text-teal-700">
                      {difficulty.icon} {difficulty.name}
                    </span>
                    <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-full ${
                      quiz.is_active 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${quiz.is_active ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                      {quiz.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {totalQuestions} questions
                </span>
                <span className="flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {difficulty.timeLimit}s
                </span>
              </div>
              
              {isExpanded && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-600">
                    {quiz.description || 'No description provided'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render Overview Dashboard
  const renderOverview = () => {
    const recentQuizzes = quizzes.slice(0, 5);

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-800">Recent Quizzes</h3>
              <p className="text-xs text-gray-500 mt-0.5">Recently created or updated quizzes</p>
            </div>
            <button
              onClick={() => setActiveMainTab('manage-quizzes')}
              className="text-sm text-teal-600 hover:text-teal-700 font-medium"
            >
              View All →
            </button>
          </div>
          <div className="divide-y divide-gray-100">
            {recentQuizzes.length > 0 ? (
              recentQuizzes.map(quiz => (
                <div key={quiz.id} className="p-4 hover:bg-gray-50 transition">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center text-lg">
                        {SUBJECTS.find(s => s.id === quiz.topic)?.icon || '📚'}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-800">{quiz.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500">{quiz.questions?.length || 0} questions</span>
                          <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                            quiz.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                          }`}>
                            {quiz.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveMainTab('manage-quizzes')}
                      className="text-gray-400 hover:text-teal-600 transition"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center">
                <div className="text-5xl mb-3">📭</div>
                <p className="text-gray-500">No quizzes created yet</p>
                <button
                  onClick={() => navigate('/admin-quizzes')}
                  className="mt-3 text-sm text-teal-600 hover:text-teal-700 font-medium"
                >
                  Create your first quiz →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Render Manage Quizzes Tab
  const renderManageQuizzes = () => (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
      <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <h2 className="text-base font-semibold text-gray-800">All Quizzes</h2>
            </div>
            <p className="text-xs text-gray-500 mt-1 ml-7">Manage, edit, and view existing quizzes</p>
          </div>
          <button
            onClick={() => navigate('/admin-quizzes')}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 transition-all flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create New Quiz
          </button>
        </div>
      </div>

      <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search quizzes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
            />
          </div>
          <select
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
            className="px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:border-teal-500 bg-white"
          >
            <option value="">All Subjects</option>
            {SUBJECTS.map(s => (
              <option key={s.id} value={s.id}>{s.icon} {s.name}</option>
            ))}
          </select>
          <select
            value={filterDifficulty}
            onChange={(e) => setFilterDifficulty(e.target.value)}
            className="px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:border-teal-500 bg-white"
          >
            <option value="">All Difficulties</option>
            {DIFFICULTY_LEVELS.map(d => (
              <option key={d.id} value={d.id}>{d.icon} {d.name}</option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:border-teal-500 bg-white"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      <div className="p-5 max-h-[calc(100vh-300px)] overflow-y-auto">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((item) => (
              <div key={item} className="h-28 rounded-xl animate-pulse bg-gray-100" />
            ))}
          </div>
        ) : filteredQuizzes.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-7xl mb-4">📭</div>
            <p className="text-base text-gray-500 mb-2">No quizzes found</p>
            <p className="text-sm text-gray-400 mb-6">
              {searchTerm || filterSubject || filterDifficulty || filterStatus
                ? "Try adjusting your filters"
                : "Create your first quiz to get started"}
            </p>
            <button
              onClick={() => navigate('/admin-quizzes')}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 transition"
            >
              Create Quiz
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredQuizzes.map((quiz) => (
              <QuizCard key={quiz.id} quiz={quiz} />
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // Render Question Bank Tab
  const renderQuestionBank = () => {
    const currentFolderQuizzes = currentFolder ? (groupedQuizzes[currentFolder] || []) : [];
    
    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <h2 className="text-base font-semibold text-gray-800">Question Bank</h2>
            </div>
            <p className="text-xs text-gray-500 mt-1 ml-7">Browse quizzes like a file explorer</p>
          </div>
          <div className="flex gap-3">
            <div className="flex rounded-lg border border-gray-200 overflow-hidden">
              <button onClick={() => setViewMode('grid')} className={`px-3 py-1.5 text-sm transition ${viewMode === 'grid' ? 'bg-teal-500 text-white' : 'bg-white text-gray-600'}`}>📱 Grid</button>
              <button onClick={() => setViewMode('list')} className={`px-3 py-1.5 text-sm transition ${viewMode === 'list' ? 'bg-teal-500 text-white' : 'bg-white text-gray-600'}`}>📋 List</button>
            </div>
            <button onClick={() => { setEditingBankId(null); resetBankForm(); setShowAddModal(true); }} className="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition flex items-center gap-2 text-sm">
              <span>+</span> Add Question
            </button>
          </div>
        </div>

        <div className="border-b border-gray-200 bg-gray-50 px-3 py-2 flex items-center gap-4">
          <div className="flex items-center gap-1">
            <button onClick={goBack} disabled={currentPath.length === 0} className={`p-1.5 rounded transition ${currentPath.length > 0 ? 'hover:bg-gray-200' : 'opacity-50 cursor-not-allowed'}`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <button onClick={() => { setCurrentPath([]); setCurrentFolder(null); }} className="p-1.5 hover:bg-gray-200 rounded transition">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            </button>
          </div>
          
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
        </div>
        
        <div className="p-6">
          {currentFolder === null ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
              {SUBJECTS.map(subject => (
                <FolderItem key={subject.id} subject={subject} />
              ))}
            </div>
          ) : (
            <div>
              <div className="mb-4 pb-3 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">📂</span>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-800">{SUBJECTS.find(s => s.id === currentFolder)?.name}</h2>
                    <p className="text-xs text-gray-500">{currentFolderQuizzes.length} items</p>
                  </div>
                </div>
              </div>
              
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
                  <div className="flex items-center gap-4 px-3 py-2 bg-gray-50 rounded-lg text-xs font-medium text-gray-500 border border-gray-200">
                    <div className="flex-shrink-0 w-12"></div>
                    <div className="flex-1">Name</div>
                    <div className="w-24">Type</div>
                    <div className="w-32">Date Modified</div>
                  </div>
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

        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-5">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-bold">{editingBankId ? 'Edit Question' : 'Add New Question'}</h2>
                  <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
                </div>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <select value={bankQuestion.subject_id} onChange={(e) => setBankQuestion({ ...bankQuestion, subject_id: e.target.value })} className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm">
                      {SUBJECTS.map(s => (<option key={s.id} value={s.id}>{s.name}</option>))}
                    </select>
                    <select value={bankQuestion.difficulty_level} onChange={(e) => setBankQuestion({ ...bankQuestion, difficulty_level: e.target.value })} className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm">
                      {DIFFICULTY_LEVELS.map(d => (<option key={d.id} value={d.id}>{d.name}</option>))}
                    </select>
                  </div>
                  <select value={bankQuestion.class_level} onChange={(e) => setBankQuestion({ ...bankQuestion, class_level: e.target.value })} className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-sm">
                    {CLASS_LEVELS.map(c => (<option key={c.id} value={c.id}>{c.icon} {c.name}</option>))}
                  </select>
                  <textarea value={bankQuestion.question} onChange={(e) => setBankQuestion({ ...bankQuestion, question: e.target.value })} placeholder="Enter your question..." rows={3} className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-sm" />
                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-gray-700">Answer Options</label>
                    {bankQuestion.options.map((opt, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <button type="button" onClick={() => setBankQuestion({ ...bankQuestion, correct_answer: opt })} className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${bankQuestion.correct_answer === opt ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
                          {String.fromCharCode(65 + idx)}
                        </button>
                        <input type="text" value={opt} onChange={(e) => handleBankOptionChange(idx, e.target.value)} placeholder={`Option ${String.fromCharCode(65 + idx)}`} className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 text-sm" />
                      </div>
                    ))}
                  </div>
                  <textarea value={bankQuestion.explanation} onChange={(e) => setBankQuestion({ ...bankQuestion, explanation: e.target.value })} placeholder="Explanation (optional)" rows={2} className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-sm" />
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="block text-xs font-medium text-gray-700 mb-1">Points</label><input type="number" value={bankQuestion.points} onChange={(e) => setBankQuestion({ ...bankQuestion, points: parseInt(e.target.value) })} min="1" max="10" className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-sm" /></div>
                    <div><label className="block text-xs font-medium text-gray-700 mb-1">Time Limit (sec)</label><input type="number" value={bankQuestion.time_limit} onChange={(e) => setBankQuestion({ ...bankQuestion, time_limit: parseInt(e.target.value) })} min="10" max="120" className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-sm" /></div>
                  </div>
                  <div className="flex gap-3 pt-3">
                    <button onClick={() => setShowAddModal(false)} className="flex-1 py-1.5 rounded-lg border border-gray-200 text-gray-600 text-sm">Cancel</button>
                    <button onClick={handleSaveBankQuestion} className="flex-1 py-1.5 rounded-lg bg-teal-500 text-white text-sm">{editingBankId ? 'Update' : 'Save'}</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {showQuizModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
              <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📄</span>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-800">{selectedQuizTitle}</h2>
                    <p className="text-xs text-gray-500">{selectedQuizQuestions.length} questions</p>
                  </div>
                </div>
                <button onClick={() => setShowQuizModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
              </div>
              <div className="p-4 overflow-y-auto flex-1">
                {selectedQuizQuestions.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-400">No questions in this quiz</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedQuizQuestions.map((q, idx) => (
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
                <button onClick={() => setShowQuizModal(false)} className="px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition">Close</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render Manage Learners Tab
  const renderManageLearners = () => {
    const totalPoints = learners.reduce((sum, l) => sum + (l.current_points || 0), 0);
    const learnersWithLevels = learners.filter(l => l.current_level).length;

    return (
      <div className="space-y-6">
        <div className="grid lg:grid-cols-[1fr_380px] gap-6">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center gap-2">
                <span className="text-lg">👥</span>
                <h2 className="font-semibold text-gray-800">Registered Learners</h2>
                <span className="px-2 py-0.5 bg-teal-100 rounded-full text-xs text-teal-600 ml-2">{learners.length}</span>
              </div>
            </div>
            <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto">
              {learners.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-5xl mb-3">📭</div>
                  <p className="text-gray-500">No learners registered yet</p>
                </div>
              ) : (
                learners.map((learner, idx) => (
                  <div key={learner.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-gray-800">{learner.full_name}</span>
                        {learner.class_level && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-teal-100 text-teal-700">
                            📚 {getLevelDisplayName(learner.class_level)}
                          </span>
                        )}
                        {learner.current_level && (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${getLevelColor(learner.current_level)}`}>
                            {getLevelIcon(learner.current_level)} {getLevelDisplayName(learner.current_level)}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">@{learner.username}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-teal-600">{learner.current_points || 0}</p>
                      <p className="text-xs text-gray-400">points</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-teal-500 rounded-xl flex items-center justify-center text-white">➕</div>
              <div>
                <h3 className="font-semibold text-gray-800">New Learner</h3>
                <p className="text-xs text-gray-500">Register a student account</p>
              </div>
            </div>
            
            <form onSubmit={handleLearnerSubmit} className="space-y-4">
              <input
                placeholder="Username"
                value={learnerForm.username}
                onChange={(e) => setLearnerForm({...learnerForm, username: e.target.value})}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none"
                required
              />
              <input
                placeholder="Full Name"
                value={learnerForm.full_name}
                onChange={(e) => setLearnerForm({...learnerForm, full_name: e.target.value})}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none"
                required
              />
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Registration Number</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={learnerForm.registration_number}
                    readOnly
                    className="flex-1 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200 text-sm font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleRegenerateNumber}
                    className="px-3 py-2 bg-teal-500 text-white rounded-lg text-sm hover:bg-teal-600 transition"
                  >
                    New
                  </button>
                </div>
              </div>

              <select
                value={learnerForm.class_level}
                onChange={(e) => setLearnerForm({...learnerForm, class_level: e.target.value})}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none"
                required
              >
                <option value="">Select Class Level</option>
                {CLASS_LEVELS.map(level => (
                  <option key={level.id} value={level.id}>{level.icon} {level.name}</option>
                ))}
              </select>
              
              <button 
                disabled={saving} 
                className="w-full bg-teal-600 text-white py-2 rounded-lg font-medium hover:bg-teal-700 transition disabled:opacity-50"
              >
                {saving ? 'Registering...' : 'Register Learner'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  };

  // Render Rewards Tab
  const renderRewards = () => (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
      <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center gap-2">
          <span className="text-lg">🎁</span>
          <h2 className="font-semibold text-gray-800">Rewards Catalog</h2>
        </div>
        <p className="text-xs text-gray-500 mt-1">Manage redeemable rewards for learners</p>
      </div>

      <div className="p-5">
        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <h3 className="font-medium text-gray-800 mb-3">{editingRewardId ? 'Edit Reward' : 'Add New Reward'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input type="text" name="name" value={rewardForm.name} onChange={handleRewardFormChange} placeholder="Reward Name" className="px-3 py-2 rounded-lg border border-gray-200 text-sm" />
            <input type="text" name="icon" value={rewardForm.icon} onChange={handleRewardFormChange} placeholder="Icon (e.g., 🎁)" className="px-3 py-2 rounded-lg border border-gray-200 text-sm" />
            <input type="number" name="points_required" value={rewardForm.points_required} onChange={handleRewardFormChange} placeholder="Points Required" className="px-3 py-2 rounded-lg border border-gray-200 text-sm" />
            <input type="number" name="stock" value={rewardForm.stock} onChange={handleRewardFormChange} placeholder="Stock" className="px-3 py-2 rounded-lg border border-gray-200 text-sm" />
            <textarea name="description" value={rewardForm.description} onChange={handleRewardFormChange} placeholder="Description" rows={2} className="md:col-span-2 px-3 py-2 rounded-lg border border-gray-200 text-sm" />
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={addOrUpdateReward} className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm hover:bg-teal-700 transition">
              {editingRewardId ? 'Update Reward' : 'Add Reward'}
            </button>
            {editingRewardId && (
              <button onClick={() => { setEditingRewardId(null); setRewardForm({ name: '', description: '', points_required: 100, icon: '🎁', stock: 10 }); }} className="px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50 transition">
                Cancel
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rewards.map((reward) => (
            <div key={reward.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition">
              <div className="text-center mb-2">
                <span className="text-3xl">{reward.icon}</span>
                <h4 className="font-semibold text-gray-800 mt-1">{reward.name}</h4>
              </div>
              <p className="text-xs text-gray-500 text-center mb-2">{reward.description}</p>
              <div className="flex justify-between text-sm mb-3">
                <span className="text-teal-600 font-bold">{reward.points_required} pts</span>
                <span className="text-gray-500">Stock: {reward.stock}</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => editReward(reward)} className="flex-1 px-3 py-1 text-blue-600 hover:bg-blue-50 rounded text-sm">Edit</button>
                <button onClick={() => deleteReward(reward.id)} className="flex-1 px-3 py-1 text-red-600 hover:bg-red-50 rounded text-sm">Delete</button>
              </div>
            </div>
          ))}
          {rewards.length === 0 && (
            <div className="col-span-full text-center py-8 text-gray-400">No rewards created yet</div>
          )}
        </div>
      </div>
    </div>
  );

  // Render Badges Tab
  const renderBadges = () => (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
      <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center gap-2">
          <span className="text-lg">🏅</span>
          <h2 className="font-semibold text-gray-800">Achievement Badges</h2>
        </div>
        <p className="text-xs text-gray-500 mt-1">Create and manage achievement badges</p>
      </div>

      <div className="p-5">
        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <h3 className="font-medium text-gray-800 mb-3">{editingBadgeId ? 'Edit Badge' : 'Create New Badge'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input type="text" name="name" value={badgeForm.name} onChange={handleBadgeFormChange} placeholder="Badge Name" className="px-3 py-2 rounded-lg border border-gray-200 text-sm" />
            <input type="text" name="icon" value={badgeForm.icon} onChange={handleBadgeFormChange} placeholder="Icon (e.g., 🏅)" className="px-3 py-2 rounded-lg border border-gray-200 text-sm" />
            <select name="criteria_type" value={badgeForm.criteria_type} onChange={handleBadgeFormChange} className="px-3 py-2 rounded-lg border border-gray-200 text-sm">
              <option value="quiz_score">Quiz Score</option>
              <option value="quizzes_completed">Quizzes Completed</option>
              <option value="points_earned">Points Earned</option>
            </select>
            <input type="number" name="criteria_value" value={badgeForm.criteria_value} onChange={handleBadgeFormChange} placeholder="Criteria Value" className="px-3 py-2 rounded-lg border border-gray-200 text-sm" />
            <textarea name="description" value={badgeForm.description} onChange={handleBadgeFormChange} placeholder="Description" rows={2} className="md:col-span-2 px-3 py-2 rounded-lg border border-gray-200 text-sm" />
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={addOrUpdateBadge} className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm hover:bg-teal-700 transition">
              {editingBadgeId ? 'Update Badge' : 'Create Badge'}
            </button>
            {editingBadgeId && (
              <button onClick={() => { setEditingBadgeId(null); setBadgeForm({ name: '', description: '', icon: '🏅', criteria_type: 'quiz_score', criteria_value: 80 }); }} className="px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50 transition">
                Cancel
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {badges.map((badge) => (
            <div key={badge.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition">
              <div className="text-center mb-2">
                <span className="text-3xl">{badge.icon}</span>
                <h4 className="font-semibold text-gray-800 mt-1">{badge.name}</h4>
              </div>
              <p className="text-xs text-gray-500 text-center mb-2">{badge.description}</p>
              <div className="text-center text-sm mb-3">
                <span className="text-teal-600 font-bold">{badge.criteria_type?.replace('_', ' ')}: {badge.criteria_value}{badge.criteria_type === 'quiz_score' && '%'}</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => editBadge(badge)} className="flex-1 px-3 py-1 text-blue-600 hover:bg-blue-50 rounded text-sm">Edit</button>
                <button onClick={() => deleteBadge(badge.id)} className="flex-1 px-3 py-1 text-red-600 hover:bg-red-50 rounded text-sm">Delete</button>
              </div>
            </div>
          ))}
          {badges.length === 0 && (
            <div className="col-span-full text-center py-8 text-gray-400">No badges created yet</div>
          )}
        </div>
      </div>
    </div>
  );

  // Navigation tabs
  const mainNavItems = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'manage-quizzes', label: 'Quizzes', icon: '📝' },
    { id: 'question-bank', label: 'Question Bank', icon: '📚' },
    { id: 'manage-learners', label: 'Learners', icon: '👥' },
    { id: 'rewards', label: 'Rewards', icon: '🎁' },
    { id: 'badges', label: 'Badges', icon: '🏅' }
  ];

  const renderMainContent = () => {
    switch(activeMainTab) {
      case 'overview': return renderOverview();
      case 'manage-quizzes': return renderManageQuizzes();
      case 'question-bank': return renderQuestionBank();
      case 'manage-learners': return renderManageLearners();
      case 'rewards': return renderRewards();
      case 'badges': return renderBadges();
      default: return renderOverview();
    }
  };

  const statItems = [
    { label: 'Learners', value: stats.totalLearners, icon: '👥' },
    { label: 'Quizzes', value: stats.totalQuizzes, icon: '📝' },
    { label: 'Questions', value: stats.totalQuestions, icon: '📚' },
    { label: 'Submissions', value: stats.totalSubmissions, icon: '📊' },
    { label: 'Avg Score', value: `${stats.averageScore}%`, icon: '🎯' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-50 bg-teal-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-white rounded-xl blur opacity-20"></div>
                <div className="relative w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white text-xl">📚</span>
                </div>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Admin<span className="text-teal-200">Portal</span></h1>
                <p className="text-xs text-teal-100">Dashboard</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="hidden md:block text-right">
                <p className="text-sm font-medium text-white">{getGreeting()}, {user?.fullName?.split(' ')[0] || 'Admin'}</p>
                <p className="text-xs text-teal-100">Administrator</p>
              </div>
              
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all bg-white/10 backdrop-blur-sm hover:bg-white/20 border border-white/20"
                >
                  <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                    <span className="text-sm text-white font-medium">AD</span>
                  </div>
                  <svg className={`w-4 h-4 transition-transform ${showUserMenu ? 'rotate-180' : ''} text-white`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showUserMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)}></div>
                    <div className="absolute right-0 mt-2 w-48 rounded-lg shadow-lg overflow-hidden z-50 bg-white border border-gray-200">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-xs text-gray-500">Signed in as</p>
                        <p className="text-sm font-medium text-gray-800">Administrator</p>
                      </div>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full px-4 py-2 text-left text-sm transition-colors text-red-600 hover:bg-red-50 flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="border-t border-white/20 mt-2"></div>

          <div className="grid grid-cols-5 gap-4 py-4">
            {statItems.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <span className="text-white/70 text-sm">{stat.icon}</span>
                  <p className="text-xs font-medium text-white/80 uppercase tracking-wider">{stat.label}</p>
                </div>
                <p className="text-2xl font-bold text-white">
                  {loading ? <span className="inline-block w-12 h-7 bg-white/20 rounded animate-pulse"></span> : stat.value}
                </p>
              </div>
            ))}
          </div>

          <div className="border-t border-white/20"></div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 border-b border-gray-200 bg-white rounded-t-xl px-4">
          <nav className="flex gap-1 overflow-x-auto">
            {mainNavItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveMainTab(item.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all border-b-2 ${
                  activeMainTab === item.id
                    ? 'text-teal-600 border-teal-600'
                    : 'text-gray-500 border-transparent hover:text-teal-600 hover:border-teal-300'
                }`}
              >
                <span>{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        {renderMainContent()}
      </main>
    </div>
  );
};

export default AdminDashboard;