import React, { useState, useEffect, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import API_URL from '../../config';

// List of subjects with updated colors (removed gradients)
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

// Question layout options
const QUESTION_LAYOUTS = [
  { id: 'text-first', name: 'Text → Image', icon: '📝', desc: 'Question first, then picture' },
  { id: 'image-first', name: 'Image → Text', icon: '🖼️', desc: 'Picture first, then question' }
];

// Helper function to convert text with markdown to HTML
const renderFormattedText = (text) => {
  if (!text) return '';
  
  let formatted = text
    .replace(/__(.*?)__/g, '<u class="underline decoration-2 decoration-teal-500">$1</u>')
    .replace(/<u>(.*?)<\/u>/g, '<u class="underline decoration-2 decoration-teal-500">$1</u>')
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');
  
  return formatted;
};

const getEmptyQuestion = () => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
  question: '',
  questionImage: '',
  options: ['', '', '', ''],
  correctAnswer: '',
  layout: 'text-first'
});

// Quiz Preview Modal Component
const QuizPreviewModal = ({ isOpen, onClose, quizData, questions, onPublish }) => {
  const [previewQuestionIndex, setPreviewQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showAnswers, setShowAnswers] = useState(false);

  if (!isOpen) return null;

  const currentQuestion = questions[previewQuestionIndex];
  const totalQuestions = questions.length;

  const handleNext = () => {
    if (previewQuestionIndex + 1 < totalQuestions) {
      setPreviewQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (previewQuestionIndex > 0) {
      setPreviewQuestionIndex(prev => prev - 1);
    }
  };

  const handleSelectAnswer = (questionId, answer) => {
    setSelectedAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const getCorrectCount = () => {
    let correct = 0;
    questions.forEach(q => {
      if (selectedAnswers[q.id] === q.correctAnswer) {
        correct++;
      }
    });
    return correct;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-900 bg-opacity-75" onClick={onClose}></div>

        <div className="inline-block w-full max-w-4xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white rounded-2xl shadow-xl">
          {/* Modal Header */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Quiz Preview</h3>
                <p className="text-xs text-gray-500 mt-1">Review your quiz before publishing</p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Modal Content */}
          <div className="px-6 py-6 max-h-[70vh] overflow-y-auto">
            {/* Quiz Info Banner */}
            <div className="mb-6 p-4 rounded-xl bg-teal-50 border border-teal-200">
              <div className="flex items-center gap-4 flex-wrap">
                {quizData.quizImage && (
                  <img src={quizData.quizImage} alt="Quiz" className="w-16 h-16 rounded-lg object-cover" />
                )}
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-800">{quizData.title || 'Untitled Quiz'}</h2>
                  <p className="text-sm text-gray-600 mt-1">{quizData.description || 'No description provided'}</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-1 rounded-full bg-teal-100 text-teal-700">
                      {quizData.topic || 'No subject'}
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-700">
                      {quizData.difficulty || 'intermediate'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">{totalQuestions} questions</p>
                </div>
              </div>
            </div>

            {/* Question Navigation */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Question {previewQuestionIndex + 1} of {totalQuestions}
                </span>
                <button
                  onClick={() => setShowAnswers(!showAnswers)}
                  className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600 hover:bg-gray-200 transition"
                >
                  {showAnswers ? 'Hide Answers' : 'Show Answers'}
                </button>
              </div>
              <div className="flex gap-1">
                {questions.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setPreviewQuestionIndex(idx)}
                    className={`flex-1 h-2 rounded-full transition-all ${
                      idx === previewQuestionIndex
                        ? 'bg-teal-500'
                        : selectedAnswers[questions[idx].id]
                        ? 'bg-green-300'
                        : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Current Question */}
            <div className="mb-6">
              <div className="bg-gray-50 rounded-xl p-6">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {previewQuestionIndex + 1}
                  </div>
                  <div className="flex-1">
                    <div 
                      className="text-gray-800 font-medium mb-4 prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ 
                        __html: renderFormattedText(currentQuestion.question) 
                      }}
                    />
                    
                    {currentQuestion.questionImage && (
                      <div className="mt-3 mb-4">
                        <img 
                          src={currentQuestion.questionImage} 
                          alt="Question" 
                          className="max-h-40 rounded-lg object-contain"
                        />
                      </div>
                    )}

                    <div className="space-y-3 mt-4">
                      {currentQuestion.options.map((option, optIdx) => {
                        const isSelected = selectedAnswers[currentQuestion.id] === option;
                        const isCorrect = showAnswers && option === currentQuestion.correctAnswer;
                        
                        return (
                          <button
                            key={optIdx}
                            onClick={() => handleSelectAnswer(currentQuestion.id, option)}
                            className={`w-full p-3 rounded-xl text-left transition-all border ${
                              isSelected
                                ? 'bg-teal-600 border-teal-600 text-white shadow-md'
                                : isCorrect
                                ? 'bg-green-100 border-green-300 text-green-800'
                                : 'border-gray-200 hover:border-teal-300 hover:bg-teal-50'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                                isSelected
                                  ? 'bg-white text-teal-600'
                                  : isCorrect
                                  ? 'bg-green-500 text-white'
                                  : 'bg-gray-100 text-gray-600'
                              }`}>
                                {String.fromCharCode(65 + optIdx)}
                              </div>
                              <span className="flex-1">{option}</span>
                              {isCorrect && showAnswers && (
                                <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">✓ Correct</span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between gap-3">
              <button
                onClick={handlePrevious}
                disabled={previewQuestionIndex === 0}
                className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                ← Previous
              </button>
              <div className="flex gap-2">
                {showAnswers && (
                  <div className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm font-medium">
                    Score: {getCorrectCount()}/{totalQuestions} ({Math.round((getCorrectCount()/totalQuestions)*100)}%)
                  </div>
                )}
                <button
                  onClick={handleNext}
                  disabled={previewQuestionIndex === totalQuestions - 1}
                  className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Next →
                </button>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-between">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-100 transition"
            >
              Close Preview
            </button>
            <button
              onClick={onPublish}
              className="px-6 py-2 rounded-lg text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 transition shadow-md"
            >
              Publish Quiz
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Class Assignment Modal Component
const ClassAssignmentModal = ({ isOpen, onClose, onAssign, quizzes }) => {
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [selectedClasses, setSelectedClasses] = useState([]);

  if (!isOpen) return null;

  const handleAssign = () => {
    if (selectedQuiz && selectedClasses.length > 0) {
      onAssign(selectedQuiz, selectedClasses);
      onClose();
    }
  };

  const toggleClass = (classId) => {
    setSelectedClasses(prev =>
      prev.includes(classId)
        ? prev.filter(c => c !== classId)
        : [...prev, classId]
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-900 bg-opacity-75" onClick={onClose}></div>

        <div className="inline-block w-full max-w-md my-8 overflow-hidden text-left align-middle transition-all transform bg-white rounded-2xl shadow-xl">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900">Assign to Classes</h3>
            <p className="text-xs text-gray-500 mt-1">Select classes that can access this quiz</p>
          </div>

          <div className="px-6 py-4">
            {/* Quiz Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Quiz</label>
              <select
                value={selectedQuiz?.id || ''}
                onChange={(e) => setSelectedQuiz(quizzes.find(q => q.id === parseInt(e.target.value)))}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-teal-500"
              >
                <option value="">Choose a quiz...</option>
                {quizzes.map(quiz => (
                  <option key={quiz.id} value={quiz.id}>{quiz.title}</option>
                ))}
              </select>
            </div>

            {/* Class Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Classes</label>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {CLASS_LEVELS.map(classLevel => (
                  <label key={classLevel.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedClasses.includes(classLevel.id)}
                      onChange={() => toggleClass(classLevel.id)}
                      className="w-4 h-4 text-teal-500 rounded border-gray-300 focus:ring-teal-500"
                    />
                    <span className="text-2xl">{classLevel.icon}</span>
                    <span className="flex-1 text-sm font-medium text-gray-700">{classLevel.name}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-100 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleAssign}
              disabled={!selectedQuiz || selectedClasses.length === 0}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Assign to Classes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

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
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    setLocalQuestion(question.question);
  }, [question.question]);

  const handleQuestionChange = (e) => {
    const newValue = e.target.value;
    setLocalQuestion(newValue);
    onQuestionChange(index, newValue);
  };

  const applyFormatting = (formatType) => {
    const textarea = document.getElementById(`question-text-${question.id}`);
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = localQuestion.substring(start, end);
    
    let formattedText = '';
    
    switch(formatType) {
      case 'underline':
        formattedText = `__${selectedText}__`;
        break;
      case 'bold':
        formattedText = `**${selectedText}**`;
        break;
      case 'italic':
        formattedText = `*${selectedText}*`;
        break;
      default:
        return;
    }
    
    const newText = localQuestion.substring(0, start) + formattedText + localQuestion.substring(end);
    setLocalQuestion(newText);
    onQuestionChange(index, newText);
    
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + formattedText.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 10);
  };
  
  const insertSpecialTemplate = (templateType) => {
    let template = '';
    switch(templateType) {
      case 'correct-answer':
        template = ' __[correct answer]__ ';
        break;
      case 'keyword':
        template = ' __[keyword]__ ';
        break;
      case 'important':
        template = ' **__[IMPORTANT]__** ';
        break;
      default:
        return;
    }
    
    const newText = localQuestion + template;
    setLocalQuestion(newText);
    onQuestionChange(index, newText);
  };

  const RichTextToolbar = () => (
    <div className="flex flex-wrap gap-1 mb-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
      <button
        type="button"
        onClick={() => applyFormatting('underline')}
        className="p-1.5 rounded hover:bg-gray-200 transition-colors"
        title="Underline text (__text__)"
      >
        <u className="text-sm">U</u>
      </button>
      <button
        type="button"
        onClick={() => applyFormatting('bold')}
        className="p-1.5 rounded hover:bg-gray-200 transition-colors"
        title="Bold text (**text**)"
      >
        <strong>B</strong>
      </button>
      <button
        type="button"
        onClick={() => applyFormatting('italic')}
        className="p-1.5 rounded hover:bg-gray-200 transition-colors"
        title="Italic text (*text*)"
      >
        <em>I</em>
      </button>
      <div className="w-px h-6 bg-gray-300 mx-1"></div>
      <button
        type="button"
        onClick={() => insertSpecialTemplate('correct-answer')}
        className="px-2 py-1 rounded text-xs bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
      >
        ✓ Correct Answer
      </button>
      <button
        type="button"
        onClick={() => insertSpecialTemplate('keyword')}
        className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
      >
        🔑 Keyword
      </button>
      <button
        type="button"
        onClick={() => insertSpecialTemplate('important')}
        className="px-2 py-1 rounded text-xs bg-orange-100 text-orange-700 hover:bg-orange-200 transition-colors"
      >
        ⚠ Important
      </button>
    </div>
  );

  return (
    <div className="question-card bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-200">
      <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#00B0FF] flex items-center justify-center text-white text-xs font-bold shadow-sm">
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
            onClick={() => setShowPreview(!showPreview)}
            className="p-1.5 rounded-lg hover:bg-purple-50 transition text-gray-400 hover:text-purple-600"
            title={showPreview ? 'Edit mode' : 'Preview mode'}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>
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
              <span className="text-gray-400 text-[10px] font-normal ml-2">
                (Use __text__ to underline, **text** for bold, *text* for italic)
              </span>
            </label>
            
            <RichTextToolbar />
            
            {!showPreview ? (
              <textarea
                id={`question-text-${question.id}`}
                value={localQuestion}
                onChange={handleQuestionChange}
                placeholder="Enter your question here... Use __text__ to underline important words"
                rows={3}
                className="w-full text-sm px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-[#00B0FF] focus:ring-2 focus:ring-[#00B0FF]/20 transition-all resize-none font-mono"
                required
              />
            ) : (
              <div className="w-full min-h-[100px] p-4 rounded-lg border border-gray-200 bg-gray-50">
                <div 
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ 
                    __html: renderFormattedText(localQuestion) || '<span class="text-gray-400">Preview will appear here...</span>' 
                  }}
                />
              </div>
            )}
            
            <div className="mt-2 text-[10px] text-gray-400 flex gap-3">
              <span>📝 <u>Underline</u>: <code className="bg-gray-100 px-1 rounded">__text__</code></span>
              <span>🔲 <strong>Bold</strong>: <code className="bg-gray-100 px-1 rounded">**text**</code></span>
              <span>📖 <em>Italic</em>: <code className="bg-gray-100 px-1 rounded">*text*</code></span>
            </div>
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
  const [importedQuestions, setImportedQuestions] = useState([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState('');
  
  // Preview and Assignment Modal States
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [previewData, setPreviewData] = useState({ title: '', description: '', quizImage: '', topic: '', difficulty: '' });
  const [previewQuestions, setPreviewQuestions] = useState([]);
  const [pendingQuizData, setPendingQuizData] = useState(null);
  
  // Save to Question Bank option
  const [saveToBank, setSaveToBank] = useState(false);
  const [selectedClassLevel, setSelectedClassLevel] = useState('standard-5');
  
  // Random Question Selection State
  const [randomSelection, setRandomSelection] = useState(false);
  const [questionsPerAttempt, setQuestionsPerAttempt] = useState(20);
  
  // Quiz Class Level State - CRITICAL FOR LEVEL FILTERING
  const [quizClassLevel, setQuizClassLevel] = useState('');

  const [form, setForm] = useState({
    title: '',
    topic: '',
    description: '',
    startDate: '',
    endDate: '',
    isActive: true,
    quizImage: '',
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
      difficulty: 'intermediate'
    });
    setQuestions([getEmptyQuestion()]);
    setSaveToBank(false);
    setSelectedClassLevel('standard-5');
    setRandomSelection(false);
    setQuestionsPerAttempt(20);
    setQuizClassLevel('');
    setImportedQuestions([]);
    setImportError('');
  };

  const changeForm = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
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

  const saveQuestionsToBank = async (questionsToSave) => {
    let savedCount = 0;
    let failedCount = 0;
    const failedQuestions = [];
    
    for (let i = 0; i < questionsToSave.length; i++) {
      const q = questionsToSave[i];
      try {
        const token = localStorage.getItem('token');
        
        const questionData = {
          subject_id: form.topic,
          difficulty_level: form.difficulty,
          class_level: selectedClassLevel,
          question: q.question,
          question_image: q.questionImage || null,
          options: q.options,
          correct_answer: q.correctAnswer,
          explanation: '',
          points: DIFFICULTY_LEVELS.find(d => d.id === form.difficulty)?.points || 2,
          time_limit: DIFFICULTY_LEVELS.find(d => d.id === form.difficulty)?.timeLimit || 30,
          tags: []
        };
        
        const response = await axios.post(`${API_URL}/api/admin/question-bank`, questionData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data.success) {
          savedCount++;
        } else {
          failedCount++;
          failedQuestions.push(i + 1);
        }
      } catch (error) {
        console.error(`Error saving question ${i + 1} to bank:`, error);
        failedCount++;
        failedQuestions.push(i + 1);
      }
    }
    
    return { savedCount, failedCount, failedQuestions };
  };

  const handlePreviewQuiz = () => {
    if (!form.title.trim()) {
      toast.error('Please enter a quiz title before previewing');
      return;
    }
    
    const validQuestions = questions.filter(q => q.question.trim() && q.options.some(opt => opt.trim()));
    if (validQuestions.length === 0) {
      toast.error('Please add at least one valid question before previewing');
      return;
    }
    
    setPreviewData({
      title: form.title,
      description: form.description,
      quizImage: form.quizImage,
      topic: SUBJECTS.find(s => s.id === form.topic)?.name || form.topic || 'No subject',
      difficulty: DIFFICULTY_LEVELS.find(d => d.id === form.difficulty)?.name || form.difficulty
    });
    setPreviewQuestions(questions);
    setShowPreviewModal(true);
  };

  const handlePublishFromPreview = () => {
    setShowPreviewModal(false);
    saveQuizDirect();
  };

  const saveQuizDirect = async () => {
    const cleanTitle = form.title.trim();
    if (!cleanTitle) {
      toast.error('Please enter a quiz title');
      return;
    }

    const cleanTopic = form.topic.trim();
    const isValidTopic = SUBJECTS.some(sub => sub.id === cleanTopic);
    if (!isValidTopic) {
      toast.error('Please select a valid subject');
      return;
    }

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

      const payload = {
        title: cleanTitle,
        topic: cleanTopic,
        description: form.description.trim() || '',
        questions: goodQuestions,
        start_time: form.startDate ? new Date(form.startDate).toISOString() : null,
        end_time: form.endDate ? new Date(form.endDate).toISOString() : null,
        is_active: Boolean(form.isActive),
        image_url: form.quizImage.trim() || null,
        difficulty: form.difficulty,
        random_selection: randomSelection,
        questions_per_attempt: questionsPerAttempt,
        class_level: quizClassLevel || null
      };

      let quizResponse;
      if (selectedQuiz) {
        await axios.put(`${API_URL}/api/admin/quizzes/${selectedQuiz.id}`, payload, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        toast.success('Quiz updated successfully!');
        quizResponse = { data: { quiz: selectedQuiz } };
      } else {
        quizResponse = await axios.post(`${API_URL}/api/admin/quizzes`, payload, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        toast.success('Quiz created successfully!');
        
        setPendingQuizData(quizResponse.data.quiz);
        setShowAssignmentModal(true);
      }

      if (saveToBank && goodQuestions.length > 0) {
        toast.loading(`Saving ${goodQuestions.length} question(s) to Question Bank...`, { id: 'bank-save' });
        
        const { savedCount, failedCount, failedQuestions } = await saveQuestionsToBank(goodQuestions);
        
        if (savedCount > 0) {
          toast.success(`✅ ${savedCount} question${savedCount > 1 ? 's' : ''} saved to Question Bank!`, { id: 'bank-save' });
          if (failedCount > 0) {
            toast.error(`⚠️ ${failedCount} question${failedCount > 1 ? 's' : ''} failed to save (Questions: ${failedQuestions.join(', ')})`);
          }
        } else if (failedCount > 0 && savedCount === 0) {
          toast.error(`❌ Failed to save all ${failedCount} question${failedCount > 1 ? 's' : ''} to Question Bank`, { id: 'bank-save' });
        } else {
          toast.dismiss('bank-save');
        }
      }

      clearForm();
      await loadQuizzes();
      setActiveTab('manage');
      
    } catch (error) {
      console.error('Save quiz error:', error);
      
      if (error.response) {
        if (error.response.status === 401) {
          toast.error('Session expired. Please login again.');
          logout();
        } else if (error.response.status === 400) {
          const message = error.response.data?.message || error.response.data?.error || 'Invalid data provided';
          toast.error(`Validation error: ${message}`);
        } else {
          toast.error(error.response.data?.message || 'Failed to save quiz. Please try again.');
        }
      } else if (error.request) {
        toast.error('Network error. Please check your connection and server status.');
      } else {
        toast.error(`Error: ${error.message}`);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleAssignToClasses = async (quiz, selectedClasses) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/api/admin/assign-quiz`, {
        quizId: quiz.id,
        classIds: selectedClasses
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`Quiz assigned to ${selectedClasses.length} class(es) successfully!`);
    } catch (error) {
      console.error('Assignment error:', error);
      toast.error('Failed to assign quiz to classes');
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const isPDF = file.type === 'application/pdf';
    const isCSV = file.type === 'text/csv' || file.name.endsWith('.csv');

    if (!isPDF && !isCSV) {
      toast.error('Please upload a PDF or CSV file');
      setImportError('Invalid file type. Please upload a PDF or CSV file.');
      return;
    }

    setIsImporting(true);
    setImportError('');
    const formData = new FormData();
    formData.append(isPDF ? 'pdf' : 'file', file);

    try {
      const token = localStorage.getItem('token');
      const endpoint = isPDF ? '/api/admin/extract-questions' : '/api/admin/import-questions';
      
      const response = await axios.post(`${API_URL}${endpoint}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        },
        timeout: 60000
      });

      if (response.data.success && response.data.questions && response.data.questions.length > 0) {
        const questionsData = response.data.questions.map((q, index) => ({
          id: `${Date.now()}-${index}-${Math.random().toString(36).slice(2, 9)}`,
          question: q.question || q.text || '',
          questionImage: q.questionImage || q.image_url || '',
          options: q.options || ['', '', '', ''],
          correctAnswer: q.correctAnswer || q.correct_answer || '',
          layout: q.layout || 'text-first'
        }));
        
        setImportedQuestions(questionsData);
        
        const fileName = file.name.replace(/\.(pdf|csv)$/i, '');
        if (!form.title) {
          changeForm('title', fileName.replace(/[-_]/g, ' '));
        }
        
        toast.success(`✅ Successfully imported ${questionsData.length} questions! Review and publish.`);
      } else {
        const errorMsg = response.data.message || response.data.error || 'No questions found in the file';
        setImportError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (error) {
      console.error('Import error details:', error);
      
      let errorMsg = 'Failed to import questions. ';
      
      if (error.code === 'ECONNABORTED') {
        errorMsg = 'Import timed out. The PDF file might be too large or complex.';
      } else if (error.response) {
        if (error.response.status === 401) {
          errorMsg = 'Authentication failed. Please log in again.';
          logout();
        } else if (error.response.status === 413) {
          errorMsg = 'File too large. Please upload a file smaller than 10MB.';
        } else {
          errorMsg += error.response.data?.message || 'Unknown server error.';
        }
      } else if (error.request) {
        errorMsg = 'Network error. Unable to reach the server.';
      } else {
        errorMsg += error.message;
      }
      
      setImportError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsImporting(false);
      e.target.value = '';
    }
  };

  const addImportedQuestionsToQuiz = () => {
    if (importedQuestions.length === 0) {
      toast.error('No questions to add');
      return;
    }
    
    setQuestions(prev => [...prev, ...importedQuestions]);
    setImportedQuestions([]);
    setImportError('');
    toast.success(`✅ Added ${importedQuestions.length} questions to your quiz!`);
    setActiveTab('create');
  };

  const clearImportedQuestions = () => {
    setImportedQuestions([]);
    setImportError('');
    toast.info('Import cleared');
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
    setSaveToBank(false);
    setRandomSelection(quiz.random_selection || false);
    setQuestionsPerAttempt(quiz.questions_per_attempt || 20);
    setQuizClassLevel(quiz.class_level || '');
    setImportedQuestions([]);
    setImportError('');
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

  const getLevelDisplayName = (level) => {
    if (!level) return null;
    const found = CLASS_LEVELS.find(l => l.id === level);
    return found ? found.name : level.split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
  };

  const filteredQuizzes = quizzes.filter(quiz => {
    const matchesSearch = quiz.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = !filterSubject || quiz.topic === filterSubject;
    const matchesDifficulty = !filterDifficulty || quiz.difficulty === filterDifficulty;
    const matchesStatus = !filterStatus || (filterStatus === 'active' ? quiz.is_active : !quiz.is_active);
    return matchesSearch && matchesSubject && matchesDifficulty && matchesStatus;
  });

  // QuizCard Component with class level badge
  const QuizCard = ({ quiz }) => {
    const difficulty = getDifficultyInfo(quiz.difficulty);
    const [isExpanded, setIsExpanded] = useState(false);
    const totalQuestions = quiz.questions?.length || 0;
    const isRandom = quiz.random_selection && totalQuestions > (quiz.questions_per_attempt || 20);
    const displayQuestions = isRandom ? `${quiz.questions_per_attempt || 20}/${totalQuestions}` : totalQuestions;

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
                    <span className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-full bg-[#008080]/10 text-[#008080]">
                      {difficulty.icon} {difficulty.name}
                    </span>
                    {quiz.class_level && (
                      <span className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-full bg-purple-100 text-purple-700">
                        📚 {getLevelDisplayName(quiz.class_level)}
                      </span>
                    )}
                    {isRandom && (
                      <span className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                        🎲 Random {quiz.questions_per_attempt || 20}
                      </span>
                    )}
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
                  {displayQuestions} questions
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
                  {quiz.class_level && (
                    <p className="text-xs text-purple-600 mt-2">
                      📚 This quiz is exclusively for {getLevelDisplayName(quiz.class_level)} learners.
                    </p>
                  )}
                  {isRandom && (
                    <p className="text-xs text-blue-600 mt-2">
                      🎲 This quiz randomly selects {quiz.questions_per_attempt || 20} questions from {totalQuestions} total questions each attempt.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Modals */}
      <QuizPreviewModal 
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        quizData={previewData}
        questions={previewQuestions}
        onPublish={handlePublishFromPreview}
      />
      
      <ClassAssignmentModal 
        isOpen={showAssignmentModal}
        onClose={() => setShowAssignmentModal(false)}
        onAssign={handleAssignToClasses}
        quizzes={quizzes}
      />

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-[#00B0FF] rounded-xl blur opacity-20"></div>
                <div className="relative w-10 h-10 bg-[#008080] rounded-xl flex items-center justify-center shadow-lg">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </div>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">Quiz Manager</h1>
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
                  <div className="w-7 h-7 rounded-full bg-[#008080] flex items-center justify-center">
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
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00B0FF] rounded-full"></div>
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
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00B0FF] rounded-full"></div>
                )}
              </button>
              <button
                onClick={() => setActiveTab('import')}
                className={`px-1 py-3 text-sm font-medium transition-all relative ${
                  activeTab === 'import'
                    ? 'text-[#00B0FF]'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                  </svg>
                  Bulk Import
                </div>
                {activeTab === 'import' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00B0FF] rounded-full"></div>
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
                  <div className="p-5 border-b border-gray-100 bg-gray-50">
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
                        <div className="border-2 border-dashed rounded-lg p-6 text-center border-gray-200 hover:border-[#00B0FF] transition-all bg-gray-50">
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

                    {/* CRITICAL: Class Level for Quiz */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-2">
                        Target Class Level <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={quizClassLevel}
                        onChange={(e) => setQuizClassLevel(e.target.value)}
                        className="w-full text-sm px-4 py-2.5 rounded-lg border border-gray-200 bg-white focus:outline-none focus:border-[#00B0FF] focus:ring-2 focus:ring-[#00B0FF]/20 transition-all cursor-pointer"
                        required
                      >
                        <option value="">Select a class level</option>
                        {CLASS_LEVELS.map(level => (
                          <option key={level.id} value={level.id}>
                            {level.icon} {level.name}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-purple-600 mt-1 font-medium">
                        ⚠️ Only learners at this exact class level will see this quiz.
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Example: If you select "Standard 8", only Standard 8 learners can view and take this quiz.
                      </p>
                    </div>

                    {/* Random Question Selection Section */}
                    <div className="border-t border-gray-200 pt-4">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 border border-blue-200">
                        <div>
                          <div className="text-sm font-semibold text-gray-800">🎲 Random Question Selection</div>
                          <div className="text-xs text-gray-500">Select random questions from the question bank</div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={randomSelection}
                            onChange={(e) => setRandomSelection(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-10 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                      
                      {randomSelection && (
                        <div className="mt-3">
                          <label className="block text-xs font-semibold text-gray-700 mb-1">
                            Questions Per Attempt
                          </label>
                          <input
                            type="number"
                            min="1"
                            max={questions.length}
                            value={questionsPerAttempt}
                            onChange={(e) => setQuestionsPerAttempt(Math.min(parseInt(e.target.value) || 1, questions.length))}
                            className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                          />
                          <p className="text-[10px] text-gray-400 mt-1">
                            {questions.length} questions available. Each attempt will randomly select {questionsPerAttempt} questions.
                          </p>
                        </div>
                      )}
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
                    <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 border border-gray-100">
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

                    {/* Save to Question Bank Section */}
                    <div className="border-t border-gray-200 pt-4 mt-2">
                      <div className="flex items-center justify-between p-4 rounded-lg bg-purple-50 border border-purple-200">
                        <div>
                          <div className="text-sm font-semibold text-gray-800">📚 Save to Question Bank</div>
                          <div className="text-xs text-gray-500">Add these questions to the question bank for future use</div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={saveToBank}
                            onChange={(e) => setSaveToBank(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-10 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-500"></div>
                        </label>
                      </div>
                      
                      {saveToBank && (
                        <div className="mt-3">
                          <label className="block text-xs font-semibold text-gray-700 mb-2">
                            Class Level for Question Bank
                          </label>
                          <select
                            value={selectedClassLevel}
                            onChange={(e) => setSelectedClassLevel(e.target.value)}
                            className="w-full text-sm px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-[#00B0FF] focus:ring-2 focus:ring-[#00B0FF]/20 transition-all"
                          >
                            {CLASS_LEVELS.map(level => (
                              <option key={level.id} value={level.id}>{level.icon} {level.name}</option>
                            ))}
                          </select>
                          <p className="text-xs text-gray-400 mt-2">
                            💡 Questions will be saved with {DIFFICULTY_LEVELS.find(d => d.id === form.difficulty)?.points} points and {DIFFICULTY_LEVELS.find(d => d.id === form.difficulty)?.timeLimit}s time limit
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Questions Section */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="px-5 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
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
                    <div className="px-3 py-1.5 rounded-lg bg-[#00B0FF]/10">
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
                      onClick={handlePreviewQuiz}
                      className="flex-1 py-3 rounded-lg text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 transition-all"
                    >
                      👁️ Preview Quiz
                    </button>
                    <button
                      type="button"
                      onClick={saveQuizDirect}
                      disabled={saving}
                      className="flex-1 py-3 rounded-lg text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
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
                    className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 transition-all flex items-center gap-2"
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
                      className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 transition"
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

        {/* Bulk Import Tab - Simple Upload Only (No Instructions) */}
        {activeTab === 'import' && (
          <div className="space-y-6">
            {/* Simple Upload Area */}
            <div className="bg-white rounded-xl border-2 border-dashed border-gray-300 p-12 text-center hover:border-teal-500 transition-all">
              <input
                type="file"
                id="bulkImportFile"
                accept=".pdf,.csv"
                onChange={handleFileUpload}
                className="hidden"
                disabled={isImporting}
              />
              <label
                htmlFor="bulkImportFile"
                className="cursor-pointer flex flex-col items-center gap-4"
              >
                <div className="w-24 h-24 rounded-full bg-teal-100 flex items-center justify-center">
                  <svg className="w-12 h-12 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                  </svg>
                </div>
                <div>
                  <p className="text-lg font-medium text-gray-700">
                    {isImporting ? 'Processing file...' : 'Click to upload PDF or CSV file'}
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    Upload a file to import questions
                  </p>
                </div>
              </label>
            </div>

            {/* Import Error */}
            {importError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-center gap-2">
                  <span className="text-red-500 text-lg">⚠️</span>
                  <p className="text-sm text-red-700">{importError}</p>
                </div>
              </div>
            )}

            {/* Import Success - Show imported questions preview */}
            {importedQuestions.length > 0 && !importError && (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="px-5 py-4 border-b border-gray-100 bg-green-50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">✅</span>
                    <div>
                      <h3 className="font-semibold text-green-800">Import Successful!</h3>
                      <p className="text-xs text-green-600 mt-0.5">{importedQuestions.length} questions extracted from file</p>
                    </div>
                  </div>
                  <button
                    onClick={clearImportedQuestions}
                    className="text-gray-400 hover:text-red-500 transition"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="p-4 max-h-96 overflow-y-auto">
                  <div className="space-y-3">
                    {importedQuestions.map((q, idx) => (
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
                </div>
                
                <div className="px-5 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                  <button
                    onClick={clearImportedQuestions}
                    className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-100 transition"
                  >
                    Clear All
                  </button>
                  <button
                    onClick={addImportedQuestionsToQuiz}
                    className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 transition flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add {importedQuestions.length} Questions to Quiz
                  </button>
                </div>
              </div>
            )}

            {/* Processing Indicator */}
            {isImporting && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-xl p-8 text-center">
                  <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-700 font-medium">Processing your file...</p>
                  <p className="text-xs text-gray-400 mt-1">This may take a few moments</p>
                </div>
              </div>
            )}
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
        
        .prose u {
          text-decoration: underline;
          text-decoration-thickness: 2px;
          text-decoration-color: #14b8a6;
        }
        
        .prose strong {
          font-weight: 700;
        }
        
        .prose em {
          font-style: italic;
        }
      `}</style>
    </div>
  );
};

export default AdminQuizzes;