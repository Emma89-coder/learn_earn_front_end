import React, { useState, useEffect, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import API_URL from '../../config';

// List of subjects with updated colors
const SUBJECTS = [
  { id: 'social-studies', name: 'Social Studies', icon: '🌍', color: 'from-[#1A237E] to-[#00B0FF]', bgLight: 'bg-[#1A237E]/10', textLight: 'text-[#1A237E]' },
  { id: 'bible-knowledge', name: 'Bible Knowledge', icon: '📖', color: 'from-[#00B0FF] to-[#008080]', bgLight: 'bg-[#00B0FF]/10', textLight: 'text-[#00B0FF]' },
  { id: 'english', name: 'English', icon: '📚', color: 'from-[#008080] to-[#1A237E]', bgLight: 'bg-[#008080]/10', textLight: 'text-[#008080]' },
  { id: 'primary-science', name: 'Primary Science', icon: '🔬', color: 'from-[#00B0FF] to-[#1A237E]', bgLight: 'bg-[#00B0FF]/10', textLight: 'text-[#00B0FF]' },
  { id: 'arts-life-skills', name: 'Arts & Life Skills', icon: '🎨', color: 'from-[#008080] to-[#00B0FF]', bgLight: 'bg-[#008080]/10', textLight: 'text-[#008080]' },
  { id: 'mathematics', name: 'Mathematics', icon: '🔢', color: 'from-[#1A237E] to-[#008080]', bgLight: 'bg-[#1A237E]/10', textLight: 'text-[#1A237E]' },
  { id: 'chichewa', name: 'Chichewa', icon: '🇲🇼', color: 'from-[#00B0FF] to-[#008080]', bgLight: 'bg-[#00B0FF]/10', textLight: 'text-[#00B0FF]' }
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

// Question layout options
const QUESTION_LAYOUTS = [
  { id: 'text-first', name: 'Text → Image', icon: '📝', desc: 'Question first, then picture' },
  { id: 'image-first', name: 'Image → Text', icon: '🖼️', desc: 'Picture first, then question' }
];

const getEmptyQuestion = () => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
  question: '',
  questionImage: '',
  options: ['', '', '', ''],
  correctAnswer: '',
  layout: 'text-first'
});

// Question Card Component
const QuestionCard = memo(({ 
  question, 
  index, 
  onQuestionChange, 
  onAnswerChange, 
  onOptionChange,
  onLayoutChange,
  onRemove, 
  onDuplicate,
  onImageUpload,
  onImageRemove,
  isUploading,
  isCurrentUploading 
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [localQuestion, setLocalQuestion] = useState(question.question);

  useEffect(() => {
    setLocalQuestion(question.question);
  }, [question.question]);

  const handleQuestionChange = (e) => {
    const newValue = e.target.value;
    setLocalQuestion(newValue);
    onQuestionChange(index, newValue);
  };

  return (
    <div className="question-card bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-200">
      <div className="px-5 py-3 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-[#00B0FF] to-[#008080] flex items-center justify-center text-white text-xs font-bold shadow-sm">
            {index + 1}
          </div>
          <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
            {QUESTION_LAYOUTS.map((layout) => (
              <button
                key={layout.id}
                type="button"
                onClick={() => onLayoutChange(index, layout.id)}
                className={`px-3 py-1 rounded-md text-xs transition-all flex items-center gap-1 ${
                  question.layout === layout.id
                    ? 'bg-white shadow-sm text-gray-800 font-medium'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <span>{layout.icon}</span>
                <span className="hidden sm:inline">{layout.name}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onDuplicate(index)}
            className="p-1.5 rounded-lg hover:bg-blue-50 transition text-gray-400 hover:text-blue-600"
            title="Duplicate question"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition"
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            <svg className={`w-4 h-4 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="p-1.5 rounded-lg hover:bg-red-50 transition"
            title="Remove question"
          >
            <svg className="w-4 h-4 text-gray-400 hover:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">
              Question Text <span className="text-red-500">*</span>
            </label>
            <textarea
              value={localQuestion}
              onChange={handleQuestionChange}
              placeholder="Enter your question here..."
              rows={2}
              className="w-full text-sm px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-[#00B0FF] focus:ring-2 focus:ring-[#00B0FF]/20 transition-all resize-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">
              Question Image <span className="text-gray-400 text-[10px] font-normal">(Optional)</span>
            </label>
            {!question.questionImage ? (
              <div className="border-2 border-dashed rounded-lg p-4 text-center border-gray-200 hover:border-[#00B0FF] transition-colors bg-gray-50/30">
                <input
                  type="file"
                  id={`q-img-${question.id}`}
                  accept="image/*"
                  onChange={(e) => onImageUpload(e, index)}
                  className="hidden"
                />
                <label htmlFor={`q-img-${question.id}`} className="cursor-pointer flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <span className="text-xs text-gray-500">
                    {isUploading && isCurrentUploading === index ? 'Uploading...' : 'Click to upload image'}
                  </span>
                  <span className="text-[10px] text-gray-400">PNG, JPG, GIF up to 5MB</span>
                </label>
              </div>
            ) : (
              <div className="relative inline-block rounded-lg overflow-hidden bg-gray-50 border p-2">
                <img src={question.questionImage} alt="Question" className="h-24 object-contain" />
                <button
                  type="button"
                  onClick={() => onImageRemove(index)}
                  className="absolute top-1 right-1 p-1 rounded-full bg-red-500 text-white hover:bg-red-600 transition shadow-sm"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">
              Answer Options <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 gap-3">
              {question.options.map((opt, optIdx) => (
                <div key={optIdx} className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => onAnswerChange(index, opt)}
                    disabled={!opt.trim()}
                    className={`w-8 h-8 flex-shrink-0 text-sm font-bold rounded-lg border flex items-center justify-center transition-all ${
                      question.correctAnswer === opt && opt.trim()
                        ? 'bg-[#008080] border-[#008080] text-white shadow-sm'
                        : 'border-gray-200 hover:border-[#00B0FF] bg-gray-50 text-gray-600 hover:bg-[#00B0FF]/5'
                    }`}
                  >
                    {String.fromCharCode(65 + optIdx)}
                  </button>
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => onOptionChange(index, optIdx, e.target.value)}
                    placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                    className="flex-1 text-sm px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-[#00B0FF] focus:ring-2 focus:ring-[#00B0FF]/20 transition-all"
                    required
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

QuestionCard.displayName = 'QuestionCard';

const AdminQuizzes = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingQuestionImage, setUploadingQuestionImage] = useState(false);
  const [quizzes, setQuizzes] = useState([]);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [selectedQuizId, setSelectedQuizId] = useState(null);
  const [currentUploadingQuestion, setCurrentUploadingQuestion] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [activeTab, setActiveTab] = useState('create');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

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
    setSelectedQuizId(null);
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

  const changeQuestionLayout = useCallback((index, layout) => {
    setQuestions((prev) => {
      const newQuestions = [...prev];
      newQuestions[index] = { ...newQuestions[index], layout: layout };
      return newQuestions;
    });
  }, []);

  const changeQuestion = useCallback((index, value) => {
    setQuestions((prev) => {
      const newQuestions = [...prev];
      newQuestions[index] = { ...newQuestions[index], question: value };
      return newQuestions;
    });
  }, []);

  const changeAnswer = useCallback((index, value) => {
    setQuestions((prev) => {
      const newQuestions = [...prev];
      newQuestions[index] = { ...newQuestions[index], correctAnswer: value };
      return newQuestions;
    });
  }, []);

  const changeOption = useCallback((qIndex, optIndex, value) => {
    setQuestions((prev) => {
      const newQuestions = [...prev];
      const newOptions = [...newQuestions[qIndex].options];
      newOptions[optIndex] = value;
      newQuestions[qIndex] = { ...newQuestions[qIndex], options: newOptions };
      return newQuestions;
    });
  }, []);

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

  const duplicateQuestion = (index) => {
    const questionToDuplicate = questions[index];
    const duplicatedQuestion = {
      ...questionToDuplicate,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      question: `${questionToDuplicate.question} (Copy)`
    };
    setQuestions((prev) => {
      const newQuestions = [...prev];
      newQuestions.splice(index + 1, 0, duplicatedQuestion);
      return newQuestions;
    });
    toast.success('Question duplicated!');
  };

  const editQuiz = (quiz) => {
    setSelectedQuiz(quiz);
    setSelectedQuizId(quiz.id);
    setActiveTab('create');
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
  };

  const deleteQuiz = async (quizId) => {
    if (!window.confirm('Are you sure you want to delete this quiz? This action cannot be undone.')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/api/admin/quizzes/${quizId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Quiz deleted successfully.');
      setQuizzes((prev) => prev.filter((q) => q.id !== quizId));
      if (selectedQuizId === quizId) clearForm();
    } catch (error) {
      console.error(error);
      toast.error('Could not delete quiz.');
    }
  };

  const saveQuiz = async (event) => {
    event.preventDefault();

    // Validate title
    const cleanTitle = form.title.trim();
    if (!cleanTitle) {
      toast.error('Please enter a quiz title');
      return;
    }

    // Validate topic/subject
    const cleanTopic = form.topic.trim();
    const isValidTopic = SUBJECTS.some(sub => sub.id === cleanTopic);
    if (!isValidTopic) {
      toast.error('Please select a valid subject');
      return;
    }

    // Validate assigned classes
    if (form.assignedClasses.length === 0) {
      toast.error('Please assign this quiz to at least one class level');
      return;
    }

    // Validate all questions
    let hasError = false;
    const goodQuestions = [];

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const questionText = q.question.trim();
      
      if (!questionText) {
        toast.error(`Question ${i + 1}: Please enter question text`);
        hasError = true;
        break;
      }

      const options = q.options.map(opt => opt.trim());
      const hasEmptyOption = options.some(opt => !opt);
      if (hasEmptyOption) {
        toast.error(`Question ${i + 1}: Please fill in all options`);
        hasError = true;
        break;
      }

      const correctAnswer = q.correctAnswer.trim();
      if (!correctAnswer) {
        toast.error(`Question ${i + 1}: Please select a correct answer`);
        hasError = true;
        break;
      }

      if (!options.includes(correctAnswer)) {
        toast.error(`Question ${i + 1}: Correct answer must match one of the options`);
        hasError = true;
        break;
      }

      goodQuestions.push({
        question: questionText,
        questionImage: q.questionImage || null,
        options: options,
        correctAnswer: correctAnswer,
        layout: q.layout
      });
    }

    if (hasError || goodQuestions.length === 0) {
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast.error('Authentication token not found. Please login again.');
        return;
      }

      // Prepare payload
      const payload = {
        title: cleanTitle,
        topic: cleanTopic,
        description: form.description.trim() || '',
        questions: goodQuestions,
        start_time: form.startDate ? new Date(form.startDate).toISOString() : null,
        end_time: form.endDate ? new Date(form.endDate).toISOString() : null,
        is_active: Boolean(form.isActive),
        image_url: form.quizImage.trim() || null,
        assigned_classes: form.assignedClasses,
        difficulty: form.difficulty
      };

      console.log('Sending payload:', JSON.stringify(payload, null, 2));

      let response;
      if (selectedQuiz) {
        response = await axios.put(`${API_URL}/api/admin/quizzes/${selectedQuiz.id}`, payload, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        toast.success('Quiz updated successfully!');
      } else {
        response = await axios.post(`${API_URL}/api/admin/quizzes`, payload, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        toast.success('Quiz created successfully!');
      }

      console.log('Response:', response.data);

      // Clear form and refresh
      clearForm();
      await loadQuizzes();
      setActiveTab('manage');
      
    } catch (error) {
      console.error('Save quiz error:', error);
      
      // Detailed error handling
      if (error.response) {
        console.error('Error response data:', error.response.data);
        console.error('Error status:', error.response.status);
        
        if (error.response.status === 401) {
          toast.error('Session expired. Please login again.');
          logout();
        } else if (error.response.status === 400) {
          const message = error.response.data?.message || error.response.data?.error || 'Invalid data provided';
          toast.error(`Validation error: ${message}`);
        } else if (error.response.status === 500) {
          toast.error('Server error. Please check if the server is running.');
        } else {
          toast.error(error.response.data?.message || 'Failed to save quiz. Please try again.');
        }
      } else if (error.request) {
        console.error('No response received:', error.request);
        toast.error('Network error. Please check your connection and server status.');
      } else {
        console.error('Error:', error.message);
        toast.error(`Error: ${error.message}`);
      }
    } finally {
      setSaving(false);
    }
  };

  const getSubjectColor = (topicId) => {
    const subject = SUBJECTS.find(s => s.id === topicId);
    return subject ? subject.color : 'from-[#1A237E] to-[#008080]';
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
              <div className={`w-20 h-20 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br ${getSubjectColor(quiz.topic)} shadow-sm`}>
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
                    <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-full bg-gradient-to-r ${getSubjectColor(quiz.topic)} text-white shadow-sm`}>
                      {SUBJECTS.find(s => s.id === quiz.topic)?.icon} {getSubjectName(quiz.topic)}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-full bg-[#008080]/10 text-[#008080]">
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
                <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); editQuiz(quiz); }}
                    className="p-1.5 rounded-lg hover:bg-blue-50 transition text-gray-500 hover:text-blue-600"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); deleteQuiz(quiz.id); }}
                    className="p-1.5 rounded-lg hover:bg-red-50 transition text-gray-500 hover:text-red-600"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {quiz.questions?.length || 0} questions
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-[#F0F4F8] to-[#E8F4F8]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-[#00B0FF] to-[#008080] rounded-xl blur opacity-60"></div>
                <div className="relative w-10 h-10 bg-gradient-to-br from-[#00B0FF] to-[#008080] rounded-xl flex items-center justify-center shadow-lg">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </div>
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-[#1A237E] to-[#00B0FF] bg-clip-text text-transparent">
                  Quiz Manager
                </h1>
                <p className="text-xs text-gray-500">Create and manage engaging quizzes</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate('/admin-dashboard')}
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Dashboard
              </button>
              
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all bg-white border border-gray-200 hover:bg-gray-50 shadow-sm"
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#00B0FF] to-[#008080] flex items-center justify-center">
                    <span className="text-sm text-white font-medium">AD</span>
                  </div>
                  <span className="hidden sm:inline text-sm font-medium text-gray-700">Admin</span>
                  <svg className={`w-4 h-4 transition-transform ${showUserMenu ? 'rotate-180' : ''} text-gray-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                        onClick={logout}
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
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex gap-6">
              <button
                onClick={() => setActiveTab('create')}
                className={`px-1 py-3 text-sm font-medium transition-all relative ${
                  activeTab === 'create'
                    ? 'text-[#00B0FF]'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create Quiz
                </div>
                {activeTab === 'create' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#00B0FF] to-[#008080] rounded-full"></div>
                )}
              </button>
              <button
                onClick={() => setActiveTab('manage')}
                className={`px-1 py-3 text-sm font-medium transition-all relative ${
                  activeTab === 'manage'
                    ? 'text-[#00B0FF]'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  Manage Quizzes
                </div>
                <span className="ml-2 px-1.5 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">
                  {quizzes.length}
                </span>
                {activeTab === 'manage' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#00B0FF] to-[#008080] rounded-full"></div>
                )}
              </button>
            </nav>
          </div>
        </div>

        {/* Create Quiz Form */}
        {activeTab === 'create' && (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Quiz Settings Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-4">
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                  <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-[#00B0FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <h2 className="text-base font-semibold text-gray-800">
                        {selectedQuiz ? 'Edit Quiz' : 'Quiz Configuration'}
                      </h2>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 ml-7">
                      Configure basic quiz settings
                    </p>
                  </div>

                  <div className="p-5 space-y-5">
                    {/* Cover Image Upload */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-2">
                        Cover Image
                      </label>
                      {!form.quizImage ? (
                        <div className="border-2 border-dashed rounded-lg p-6 text-center border-gray-200 hover:border-[#00B0FF] transition-all bg-gray-50/30">
                          <input type="file" id="quizImageUpload" accept="image/*" onChange={handleQuizImageSelect} className="hidden" />
                          <label htmlFor="quizImageUpload" className="cursor-pointer flex flex-col items-center gap-2">
                            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
                              <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <span className="text-sm text-gray-500">{uploadingImage ? 'Uploading...' : 'Click to upload'}</span>
                            <span className="text-[10px] text-gray-400">PNG, JPG up to 5MB</span>
                          </label>
                        </div>
                      ) : (
                        <div className="relative rounded-lg overflow-hidden shadow-sm">
                          <img src={form.quizImage} alt="Cover" className="w-full h-36 object-cover" />
                          <button
                            type="button"
                            onClick={removeQuizImage}
                            className="absolute top-2 right-2 p-1.5 rounded-full bg-red-500 text-white hover:bg-red-600 transition shadow-sm"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Quiz Title */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Quiz Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={form.title}
                        onChange={(e) => changeForm('title', e.target.value)}
                        placeholder="e.g., Mathematics Challenge 2024"
                        className="w-full text-sm px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-[#00B0FF] focus:ring-2 focus:ring-[#00B0FF]/20 transition-all"
                        required
                      />
                    </div>

                    {/* Subject */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Subject <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={form.topic}
                        onChange={(e) => changeForm('topic', e.target.value)}
                        className="w-full text-sm px-4 py-2.5 rounded-lg border border-gray-200 bg-white focus:outline-none focus:border-[#00B0FF] focus:ring-2 focus:ring-[#00B0FF]/20 transition-all cursor-pointer"
                        required
                      >
                        <option value="">Select a subject</option>
                        {SUBJECTS.map(s => (
                          <option key={s.id} value={s.id}>{s.icon} {s.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        value={form.description}
                        onChange={(e) => changeForm('description', e.target.value)}
                        placeholder="Describe what students will learn in this quiz..."
                        rows={3}
                        className="w-full text-sm px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-[#00B0FF] focus:ring-2 focus:ring-[#00B0FF]/20 transition-all resize-none"
                      />
                    </div>

                    {/* Difficulty Level */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-2">
                        Difficulty Level
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {DIFFICULTY_LEVELS.map((level) => (
                          <button
                            type="button"
                            key={level.id}
                            onClick={() => changeForm('difficulty', level.id)}
                            className={`p-3 rounded-lg border transition-all text-left ${
                              form.difficulty === level.id
                                ? 'border-[#00B0FF] bg-[#00B0FF]/5 shadow-sm'
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-lg">{level.icon}</span>
                              <span className="text-sm font-medium text-gray-800">{level.name}</span>
                            </div>
                            <div className="text-[10px] text-gray-400">{level.timeLimit}s • {level.points}XP</div>
                            <div className="text-[10px] text-gray-400 mt-1">{level.description}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Target Classes */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-semibold text-gray-700">
                          Target Classes <span className="text-red-500">*</span>
                        </label>
                        <button
                          type="button"
                          onClick={toggleAllClasses}
                          className="text-[10px] font-medium text-[#00B0FF] hover:underline"
                        >
                          {form.assignedClasses.length === CLASS_LEVELS.length ? 'Deselect All' : 'Select All'}
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {CLASS_LEVELS.map((cls) => {
                          const isSelected = form.assignedClasses.includes(cls.id);
                          return (
                            <button
                              type="button"
                              key={cls.id}
                              onClick={() => toggleClassAssignment(cls.id)}
                              className={`flex items-center gap-2 p-2.5 rounded-lg border transition-all ${
                                isSelected
                                  ? 'border-[#008080] bg-[#008080]/5 shadow-sm'
                                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              <span className="text-base">{cls.icon}</span>
                              <span className={`text-sm ${isSelected ? 'font-medium text-gray-800' : 'text-gray-600'}`}>
                                {cls.name}
                              </span>
                              {isSelected && (
                                <svg className="w-3.5 h-3.5 ml-auto text-[#008080]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Schedule */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-2">
                        Schedule (Optional)
                      </label>
                      <div className="space-y-2">
                        <div className="relative">
                          <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <input
                            type="datetime-local"
                            value={form.startDate}
                            onChange={(e) => changeForm('startDate', e.target.value)}
                            className="w-full text-sm pl-10 pr-3 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-[#00B0FF] focus:ring-2 focus:ring-[#00B0FF]/20"
                          />
                        </div>
                        <div className="relative">
                          <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <input
                            type="datetime-local"
                            value={form.endDate}
                            onChange={(e) => changeForm('endDate', e.target.value)}
                            className="w-full text-sm pl-10 pr-3 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-[#00B0FF] focus:ring-2 focus:ring-[#00B0FF]/20"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Active Status Toggle */}
                    <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-gray-50 to-white border border-gray-100">
                      <div>
                        <div className="text-sm font-semibold text-gray-800">Publish Immediately</div>
                        <div className="text-xs text-gray-500">Make quiz available to students right away</div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.isActive}
                          onChange={(e) => changeForm('isActive', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-10 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#008080]"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Questions Section */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-[#00B0FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <h2 className="text-base font-semibold text-gray-800">Questions</h2>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 ml-7">Add and manage quiz questions</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#00B0FF]/10 to-[#008080]/10">
                      <span className="text-sm font-semibold text-[#008080]">{questions.length}</span>
                      <span className="text-xs text-gray-500 ml-1">questions</span>
                    </div>
                  </div>
                </div>

                <div className="p-5 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto custom-scrollbar">
                  {questions.map((question, idx) => (
                    <QuestionCard
                      key={question.id}
                      question={question}
                      index={idx}
                      onQuestionChange={changeQuestion}
                      onAnswerChange={changeAnswer}
                      onOptionChange={changeOption}
                      onLayoutChange={changeQuestionLayout}
                      onRemove={removeQuestion}
                      onDuplicate={duplicateQuestion}
                      onImageUpload={handleQuestionImageSelect}
                      onImageRemove={removeQuestionImage}
                      isUploading={uploadingQuestionImage}
                      isCurrentUploading={currentUploadingQuestion}
                    />
                  ))}

                  {/* Add Question Button */}
                  <button
                    type="button"
                    onClick={addQuestion}
                    className="w-full py-4 rounded-xl border-2 border-dashed border-[#00B0FF]/40 text-[#00B0FF] hover:bg-[#00B0FF]/5 text-sm font-semibold transition-all flex items-center justify-center gap-2 group"
                  >
                    <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add New Question
                  </button>

                  {/* Form Actions */}
                  <div className="flex gap-3 pt-6 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={clearForm}
                      className="flex-1 py-3 rounded-lg text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={saveQuiz}
                      disabled={saving}
                      className="flex-1 py-3 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-[#00B0FF] to-[#008080] hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {saving ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>{selectedQuiz ? 'Updating...' : 'Creating...'}</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>{selectedQuiz ? 'Update Quiz' : 'Publish Quiz'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Manage Quizzes */}
        {activeTab === 'manage' && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-[#00B0FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <h2 className="text-base font-semibold text-gray-800">All Quizzes</h2>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 ml-7">Manage, edit, and delete existing quizzes</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveTab('create')}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-[#00B0FF] to-[#008080] hover:shadow-lg transition-all flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Create New Quiz
                  </button>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
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
                    className="w-full pl-10 pr-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:border-[#00B0FF] focus:ring-2 focus:ring-[#00B0FF]/20"
                  />
                </div>
                <select
                  value={filterSubject}
                  onChange={(e) => setFilterSubject(e.target.value)}
                  className="px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:border-[#00B0FF] bg-white"
                >
                  <option value="">All Subjects</option>
                  {SUBJECTS.map(s => (
                    <option key={s.id} value={s.id}>{s.icon} {s.name}</option>
                  ))}
                </select>
                <select
                  value={filterDifficulty}
                  onChange={(e) => setFilterDifficulty(e.target.value)}
                  className="px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:border-[#00B0FF] bg-white"
                >
                  <option value="">All Difficulties</option>
                  {DIFFICULTY_LEVELS.map(d => (
                    <option key={d.id} value={d.id}>{d.icon} {d.name}</option>
                  ))}
                </select>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:border-[#00B0FF] bg-white"
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
                  {(searchTerm || filterSubject || filterDifficulty || filterStatus) ? (
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        setFilterSubject('');
                        setFilterDifficulty('');
                        setFilterStatus('');
                      }}
                      className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition"
                    >
                      Clear Filters
                    </button>
                  ) : (
                    <button
                      onClick={() => setActiveTab('create')}
                      className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-[#00B0FF] to-[#008080] hover:shadow-lg transition"
                    >
                      Create Quiz
                    </button>
                  )}
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
        )}
      </main>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
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
      `}</style>
    </div>
  );
};

export default AdminQuizzes;