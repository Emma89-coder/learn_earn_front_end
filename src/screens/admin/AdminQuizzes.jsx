import React, { useState, useEffect, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import API_URL from '../../config';

// Constants (keep existing)
const SUBJECTS = [
  { id: 'social-studies', name: 'Social Studies', icon: '🌍', color: '#1A237E' },
  { id: 'bible-knowledge', name: 'Bible Knowledge', icon: '📖', color: '#00B0FF' },
  { id: 'english', name: 'English', icon: '📚', color: '#008080' },
  { id: 'primary-science', name: 'Primary Science', icon: '🔬', color: '#00B0FF' },
  { id: 'arts-life-skills', name: 'Arts & Life Skills', icon: '🎨', color: '#008080' },
  { id: 'mathematics', name: 'Mathematics', icon: '🔢', color: '#1A237E' },
  { id: 'chichewa', name: 'Chichewa', icon: '🇲🇼', color: '#00B0FF' }
];

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

const DIFFICULTY_LEVELS = [
  { id: 'beginner', name: 'Beginner', icon: '🌱', timeLimit: 45, points: 1 },
  { id: 'intermediate', name: 'Intermediate', icon: '📘', timeLimit: 30, points: 2 },
  { id: 'advanced', name: 'Advanced', icon: '🎓', timeLimit: 20, points: 3 },
  { id: 'expert', name: 'Expert', icon: '🏆', timeLimit: 15, points: 5 }
];

const QUESTION_LAYOUTS = [
  { id: 'text-first', name: 'Text First', icon: '📝' },
  { id: 'image-first', name: 'Image First', icon: '🖼️' }
];

const renderFormattedText = (text) => {
  if (!text) return '';
  return text
    .replace(/__(.*?)__/g, '<u class="underline decoration-teal-500">$1</u>')
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');
};

const getEmptyQuestion = () => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
  question: '',
  questionImage: '',
  options: ['', '', '', ''],
  correctAnswer: '',
  layout: 'text-first'
});

// ============ AI AGENTS ============

// 1. AI Question Generator Agent
const AIQuestionGenerator = {
  generateQuestions: async (topic, subject, difficulty, count = 5) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/api/ai/generate-questions`, {
        topic,
        subject,
        difficulty,
        count
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data.questions;
    } catch (error) {
      console.error('AI generation error:', error);
      return null;
    }
  },
  
  generateFromText: async (text, count = 10) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/api/ai/extract-from-text`, {
        text,
        count
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data.questions;
    } catch (error) {
      console.error('AI text extraction error:', error);
      return null;
    }
  }
};

// 2. AI Question Improver Agent
const AIQuestionImprover = {
  improveQuestion: async (question, options, correctAnswer) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/api/ai/improve-question`, {
        question,
        options,
        correctAnswer
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('AI improvement error:', error);
      return null;
    }
  },
  
  generateDistractors: async (question, correctAnswer, count = 3) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/api/ai/generate-distractors`, {
        question,
        correctAnswer,
        count
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data.distractors;
    } catch (error) {
      console.error('AI distractor generation error:', error);
      return null;
    }
  },
  
  addHint: async (question, correctAnswer) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/api/ai/add-hint`, {
        question,
        correctAnswer
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data.hint;
    } catch (error) {
      console.error('AI hint generation error:', error);
      return null;
    }
  }
};

// 3. AI Question Validator Agent
const AIQuestionValidator = {
  validateQuestion: async (question, options, correctAnswer) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/api/ai/validate-question`, {
        question,
        options,
        correctAnswer
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('AI validation error:', error);
      return { isValid: true, issues: [], score: 100 };
    }
  },
  
  checkPlagiarism: async (question) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/api/ai/check-plagiarism`, {
        question
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('AI plagiarism check error:', error);
      return { similarity: 0, matches: [] };
    }
  }
};

// 4. AI Difficulty Estimator Agent
const AIDifficultyEstimator = {
  estimateDifficulty: async (question, options, subject) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/api/ai/estimate-difficulty`, {
        question,
        options,
        subject
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('AI difficulty estimation error:', error);
      return { difficulty: 'intermediate', confidence: 0.5 };
    }
  }
};

// 5. AI Smart Reformat Agent
const AISmartReformatAgent = {
  reformatOptions: async (options) => {
    if (!options || !Array.isArray(options)) return options;
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/api/ai/reformat-options`, {
        options
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data.reformatted;
    } catch (error) {
      // Fallback to local reformatting
      return OptionReformatterAgent.reformatOptions(options);
    }
  },
  
  extractQuestionFromText: async (text) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/api/ai/extract-question`, {
        text
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      return null;
    }
  }
};

// Local Option Reformatter (fallback)
const OptionReformatterAgent = {
  parseInlineOptions: (text) => {
    const pattern = /([A-D])(?:\.|\s)?\s*([^A-D]*?)(?=\s*[A-D]|$)/gi;
    const matches = [...text.matchAll(pattern)];
    
    if (matches.length >= 2) {
      const options = [];
      for (const match of matches) {
        const letter = match[1];
        let optionText = match[2].trim();
        if (optionText) {
          optionText = optionText.replace(/^\.\s*/, '').trim();
          options.push({
            letter: letter.toUpperCase(),
            text: optionText,
            original: match[0]
          });
        }
      }
      
      if (options.length >= 2) {
        const expectedOrder = ['A', 'B', 'C', 'D'];
        const sorted = [...options].sort((a, b) => 
          expectedOrder.indexOf(a.letter) - expectedOrder.indexOf(b.letter)
        );
        return sorted.map(opt => `${opt.letter}. ${opt.text}`);
      }
    }
    return null;
  },

  extractQuestionFromInlineLine: (line) => {
    const firstOptionMatch = line.match(/[A-D](?:\.|\s)/);
    if (firstOptionMatch && firstOptionMatch.index > 0) {
      const questionText = line.substring(0, firstOptionMatch.index).trim();
      const optionsText = line.substring(firstOptionMatch.index);
      const parsedOptions = OptionReformatterAgent.parseInlineOptions(optionsText);
      if (parsedOptions && parsedOptions.length >= 2) {
        return { questionText, options: parsedOptions };
      }
    }
    return null;
  },

  reformatOptions: (options) => {
    if (!options || !Array.isArray(options) || options.length === 0) return options;
    
    if (options.length === 1 && typeof options[0] === 'string') {
      const parsed = OptionReformatterAgent.parseInlineOptions(options[0]);
      if (parsed && parsed.length >= 2) {
        options = parsed;
      }
    }
    
    const parsedOptions = [];
    for (let i = 0; i < options.length; i++) {
      let opt = options[i];
      if (!opt || typeof opt !== 'string') {
        parsedOptions.push(null);
        continue;
      }
      
      let match = opt.match(/^([A-Da-d])[\.\)\-\s]+\s*(.+)/);
      if (!match) {
        match = opt.match(/^([A-Da-d])\s+(.+)/);
      }
      if (!match) {
        parsedOptions.push({
          letter: String.fromCharCode(65 + i),
          text: opt.trim(),
          original: opt,
          needsLetter: true
        });
        continue;
      }
      
      parsedOptions.push({
        letter: match[1].toUpperCase(),
        text: match[2].trim(),
        original: opt,
        index: i
      });
    }
    
    const validOptions = parsedOptions.filter(p => p !== null);
    if (validOptions.length < 2) return options;
    
    const expectedOrder = ['A', 'B', 'C', 'D'];
    const currentOrder = validOptions.map(p => p.letter);
    const isOutOfOrder = validOptions.length >= 2 && 
      !currentOrder.every((letter, idx) => letter === expectedOrder[idx]);
    const needsLetters = validOptions.some(p => p.needsLetter);
    
    if (isOutOfOrder || needsLetters || validOptions.length !== 4) {
      const completeOptions = [];
      const sorted = [...validOptions].sort((a, b) => 
        expectedOrder.indexOf(a.letter) - expectedOrder.indexOf(b.letter)
      );
      
      for (let i = 0; i < 4; i++) {
        const expectedLetter = expectedOrder[i];
        const existing = sorted.find(s => s.letter === expectedLetter);
        
        if (existing) {
          completeOptions.push(`${expectedLetter}. ${existing.text}`);
        } else {
          completeOptions.push(`${expectedLetter}. `);
        }
      }
      return completeOptions;
    }
    
    return options.map(opt => {
      if (opt.match(/^[A-D]\s/)) {
        return opt.replace(/^([A-D])\s/, '$1. ');
      }
      return opt;
    });
  },
  
  completeMissingOptions: (options) => {
    const result = [...options];
    while (result.length < 4) {
      const nextLetter = String.fromCharCode(65 + result.length);
      result.push(`${nextLetter}. `);
    }
    return result;
  },
  
  hasIncompleteOptions: (options) => {
    return options.length < 4 || options.some(opt => !opt || opt.trim() === '' || opt.match(/^[A-D]\.\s*$/));
  },
  
  needsReformatting: (options) => {
    if (!options || options.length < 2) return false;
    
    const letters = [];
    for (const opt of options) {
      const match = opt.match(/^([A-D])/i);
      if (match) {
        letters.push(match[1].toUpperCase());
      }
    }
    
    if (letters.length !== 4 && letters.length !== options.length) return true;
    
    const expectedOrder = ['A', 'B', 'C', 'D'];
    const isOutOfOrder = letters.length === 4 && 
      !letters.every((letter, idx) => letter === expectedOrder[idx]);
    
    const hasMissingDelimiters = options.some(opt => opt.match(/^[A-D]\s/));
    
    return isOutOfOrder || hasMissingDelimiters;
  },
  
  reformatAllQuestions: (questions) => {
    let reformattedCount = 0;
    let incompleteCount = 0;
    
    const reformatted = questions.map(q => {
      let changed = false;
      let newOptions = [...q.options];
      
      if (newOptions.length === 1 && typeof newOptions[0] === 'string') {
        const parsed = OptionReformatterAgent.parseInlineOptions(newOptions[0]);
        if (parsed && parsed.length >= 2) {
          newOptions = parsed;
          changed = true;
        }
      }
      
      const reformattedOpts = OptionReformatterAgent.reformatOptions(newOptions);
      if (JSON.stringify(reformattedOpts) !== JSON.stringify(newOptions)) {
        newOptions = reformattedOpts;
        changed = true;
        reformattedCount++;
      }
      
      if (OptionReformatterAgent.hasIncompleteOptions(newOptions)) {
        newOptions = OptionReformatterAgent.completeMissingOptions(newOptions);
        changed = true;
        incompleteCount++;
      }
      
      let newCorrectAnswer = q.correctAnswer;
      if (newCorrectAnswer && !newOptions.includes(newCorrectAnswer)) {
        const cleanCorrect = newCorrectAnswer.replace(/^[A-D][\.\)\-\s]*/, '').trim();
        const matchingOption = newOptions.find(opt => 
          opt.replace(/^[A-D][\.\)\-\s]*/, '').trim() === cleanCorrect
        );
        if (matchingOption) {
          newCorrectAnswer = matchingOption;
          changed = true;
        }
      }
      
      return changed ? { ...q, options: newOptions, correctAnswer: newCorrectAnswer } : q;
    });
    
    return { questions: reformatted, reformattedCount, incompleteCount };
  }
};

// AI Generation Modal Component
const AIGenerationModal = ({ isOpen, onClose, onQuestionsGenerated }) => {
  const [topic, setTopic] = useState('');
  const [subject, setSubject] = useState('');
  const [difficulty, setDifficulty] = useState('intermediate');
  const [count, setCount] = useState(5);
  const [generating, setGenerating] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [mode, setMode] = useState('topic'); // 'topic' or 'text'

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      let questions;
      if (mode === 'topic') {
        if (!topic || !subject) {
          toast.error('Please enter a topic and select a subject');
          return;
        }
        questions = await AIQuestionGenerator.generateQuestions(topic, subject, difficulty, count);
      } else {
        if (!textInput) {
          toast.error('Please enter some text to generate questions from');
          return;
        }
        questions = await AIQuestionGenerator.generateFromText(textInput, count);
      }
      
      if (questions && questions.length > 0) {
        onQuestionsGenerated(questions);
        onClose();
        toast.success(`✨ Generated ${questions.length} questions successfully!`);
      } else {
        toast.error('Failed to generate questions. Please try again.');
      }
    } catch (error) {
      toast.error('AI generation failed');
    } finally {
      setGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🤖</span>
            <div>
              <h3 className="text-xl font-bold text-gray-800">AI Question Generator</h3>
              <p className="text-sm text-gray-500">Generate intelligent questions using AI</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">
            ×
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Mode Toggle */}
          <div className="flex gap-2 mb-6 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setMode('topic')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                mode === 'topic' ? 'bg-white shadow-sm text-purple-600' : 'text-gray-600'
              }`}
            >
              📝 Generate from Topic
            </button>
            <button
              onClick={() => setMode('text')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                mode === 'text' ? 'bg-white shadow-sm text-purple-600' : 'text-gray-600'
              }`}
            >
              📄 Generate from Text
            </button>
          </div>
          
          {mode === 'topic' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Topic/Concept</label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., Photosynthesis, Fractions, Shakespeare..."
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-purple-400"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-purple-400"
                >
                  <option value="">Select subject</option>
                  {SUBJECTS.map(s => (
                    <option key={s.id} value={s.id}>{s.icon} {s.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty Level</label>
                <div className="grid grid-cols-4 gap-2">
                  {DIFFICULTY_LEVELS.map(level => (
                    <button
                      key={level.id}
                      onClick={() => setDifficulty(level.id)}
                      className={`p-2 rounded-lg border text-center text-sm transition-all ${
                        difficulty === level.id ? 'border-purple-500 bg-purple-50' : 'border-gray-200'
                      }`}
                    >
                      {level.icon} {level.name}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Number of Questions</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={count}
                  onChange={(e) => setCount(Math.min(20, Math.max(1, parseInt(e.target.value) || 5)))}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-purple-400"
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Source Text</label>
              <textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Paste your content here... AI will generate questions based on this text."
                rows={10}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-purple-400 resize-none"
              />
              <p className="text-xs text-gray-400 mt-2">
                Paste any educational content, and AI will automatically generate multiple-choice questions.
              </p>
            </div>
          )}
        </div>
        
        <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg text-gray-600">
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="px-6 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
          >
            {generating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Generating...
              </>
            ) : (
              <>
                🤖 Generate Questions
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// AI Improvement Modal
const AIImprovementModal = ({ isOpen, onClose, question, onImproved }) => {
  const [improving, setImproving] = useState(false);
  const [suggestions, setSuggestions] = useState(null);

  const handleImprove = async () => {
    setImproving(true);
    try {
      const result = await AIQuestionImprover.improveQuestion(
        question.question,
        question.options,
        question.correctAnswer
      );
      if (result) {
        setSuggestions(result);
      }
    } catch (error) {
      toast.error('Failed to improve question');
    } finally {
      setImproving(false);
    }
  };

  const applySuggestion = (type) => {
    if (!suggestions) return;
    
    const improvedQuestion = {
      ...question,
      question: suggestions.improvedQuestion || question.question,
      options: suggestions.improvedOptions || question.options,
      correctAnswer: suggestions.improvedCorrectAnswer || question.correctAnswer
    };
    onImproved(improvedQuestion);
    onClose();
    toast.success('AI improvement applied!');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-green-50 to-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-3xl">✨</span>
            <div>
              <h3 className="text-xl font-bold text-gray-800">AI Question Improver</h3>
              <p className="text-sm text-gray-500">Get suggestions to improve your question</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">
            ×
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {!suggestions ? (
            <div className="text-center py-8">
              <button
                onClick={handleImprove}
                disabled={improving}
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all shadow-md flex items-center gap-2 mx-auto disabled:opacity-50"
              >
                {improving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Analyzing...
                  </>
                ) : (
                  <>
                    ✨ Analyze & Improve Question
                  </>
                )}
              </button>
              <p className="text-sm text-gray-500 mt-4">
                AI will analyze your question and suggest improvements for clarity, accuracy, and effectiveness.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-purple-50 rounded-lg p-4">
                <h4 className="font-semibold text-purple-800 mb-2">📊 Quality Score: {suggestions.score}/100</h4>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-purple-600 rounded-full h-2" style={{ width: `${suggestions.score}%` }}></div>
                </div>
              </div>
              
              {suggestions.improvedQuestion && (
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 mb-2">📝 Improved Question</h4>
                  <p className="text-gray-700">{suggestions.improvedQuestion}</p>
                  <button
                    onClick={() => applySuggestion('question')}
                    className="mt-2 text-sm text-green-600 hover:text-green-700"
                  >
                    Apply this improvement →
                  </button>
                </div>
              )}
              
              {suggestions.suggestedDistractors && (
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 mb-2">🎯 Suggested Distractors</h4>
                  <div className="space-y-2">
                    {suggestions.suggestedDistractors.map((distractor, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-sm">
                          {String.fromCharCode(66 + idx)}
                        </span>
                        <span>{distractor}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {suggestions.hint && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-800 mb-2">💡 Hint for Students</h4>
                  <p className="text-blue-700">{suggestions.hint}</p>
                </div>
              )}
              
              {suggestions.issues && suggestions.issues.length > 0 && (
                <div className="bg-yellow-50 rounded-lg p-4">
                  <h4 className="font-semibold text-yellow-800 mb-2">⚠️ Issues Detected</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {suggestions.issues.map((issue, idx) => (
                      <li key={idx} className="text-sm text-yellow-700">{issue}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg text-gray-600">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Preview Modal Component (keep existing)
const PreviewModal = ({ isOpen, onClose, quiz, questions, onConfirm }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  if (!isOpen) return null;
  
  const currentQuestion = questions[currentIndex];
  
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-teal-50 to-white flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold text-gray-800">Preview Quiz</h3>
            <p className="text-sm text-gray-500 mt-1">{quiz.title || 'Untitled Quiz'}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl transition-colors">
            ×
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="mb-4 flex gap-2">
            {questions.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`flex-1 h-2 rounded-full transition-all ${
                  idx === currentIndex ? 'bg-teal-500' : 'bg-gray-200 hover:bg-gray-300'
                }`}
              />
            ))}
          </div>
          
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
            <div className="text-sm font-medium text-gray-500 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center text-xs font-bold">
                {currentIndex + 1}
              </span>
              Question {currentIndex + 1} of {questions.length}
            </div>
            <div 
              className="text-gray-800 mb-4 prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: renderFormattedText(currentQuestion?.question || '') }}
            />
            {currentQuestion?.questionImage && (
              <div className="mt-3 mb-4">
                <img src={currentQuestion.questionImage} alt="Question" className="max-h-40 rounded-lg border border-gray-200" />
              </div>
            )}
            <div className="space-y-2 mt-4">
              {currentQuestion?.options.map((opt, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg border bg-white hover:bg-gray-50 transition-colors"
                >
                  <span className="font-semibold mr-3 text-gray-600">{String.fromCharCode(65 + idx)}.</span>
                  {opt}
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 transition-all">
            Cancel
          </button>
          <button onClick={onConfirm} className="px-6 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700 transition-all shadow-md">
            Publish Quiz
          </button>
        </div>
      </div>
    </div>
  );
};

// Bulk Import Modal (simplified - keep existing but add AI reformat)
const BulkImportModal = ({ isOpen, onClose, onImportComplete }) => {
  // ... (keep existing bulk import code)
  // Same as previous but with AI reformat option
  const [file, setFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [extractedQuestions, setExtractedQuestions] = useState([]);
  const [processingStep, setProcessingStep] = useState('upload');
  const [dragActive, setDragActive] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [editForm, setEditForm] = useState({ question: '', options: [], correctAnswer: '' });
  const [showReformatWarning, setShowReformatWarning] = useState(false);
  const [useAIReformat, setUseAIReformat] = useState(false);
  const [organizeOptions, setOrganizeOptions] = useState({
    removeDuplicates: true,
    autoCorrectFormat: true,
    sortByDifficulty: false,
    validateAnswers: true
  });
  const [stats, setStats] = useState({
    totalExtracted: 0,
    duplicatesRemoved: 0,
    invalidRemoved: 0,
    finalCount: 0,
    reformatted: 0,
    incomplete: 0
  });

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      validateAndSetFile(droppedFile);
    }
  };

  const validateAndSetFile = (selectedFile) => {
    const validTypes = ['application/pdf', 'text/csv', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(selectedFile.type) && !selectedFile.name.endsWith('.csv')) {
      toast.error('Please upload a PDF, CSV, or DOCX file');
      return;
    }
    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }
    setFile(selectedFile);
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    validateAndSetFile(selectedFile);
  };

  const extractQuestions = async () => {
    if (!file) {
      toast.error('Please select a file first');
      return;
    }
    
    setImporting(true);
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/api/admin/extract-questions-advanced`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        },
        timeout: 120000
      });
      
      if (response.data.success && response.data.questions) {
        let questions = response.data.questions;
        let reformattedCount = response.data.stats?.reformatted || 0;
        let incompleteCount = response.data.stats?.incomplete || 0;
        
        // Apply frontend reformatting
        const { questions: reformattedQuestions, reformattedCount: frontendReformatted, incompleteCount: frontendIncomplete } = 
          OptionReformatterAgent.reformatAllQuestions(questions);
        
        setExtractedQuestions(reformattedQuestions);
        setStats(prev => ({
          ...prev,
          totalExtracted: reformattedQuestions.length,
          finalCount: reformattedQuestions.length,
          reformatted: reformattedCount + frontendReformatted,
          incomplete: incompleteCount + frontendIncomplete
        }));
        
        if (reformattedCount + frontendReformatted > 0 || incompleteCount + frontendIncomplete > 0) {
          setShowReformatWarning(true);
          toast.success(`✨ Extracted ${reformattedQuestions.length} questions (${reformattedCount + frontendReformatted} reformatted, ${incompleteCount + frontendIncomplete} completed)`);
        } else {
          toast.success(`✨ Successfully extracted ${reformattedQuestions.length} questions`);
        }
        
        setProcessingStep('review');
      } else {
        throw new Error(response.data.message || 'No questions found');
      }
    } catch (error) {
      console.error('Extraction error:', error);
      toast.error(error.response?.data?.message || 'Failed to extract questions');
    } finally {
      setImporting(false);
    }
  };

  const manualReformatAll = () => {
    const { questions, reformattedCount, incompleteCount } = OptionReformatterAgent.reformatAllQuestions(extractedQuestions);
    setExtractedQuestions(questions);
    setStats(prev => ({ 
      ...prev, 
      reformatted: reformattedCount,
      incomplete: incompleteCount,
      finalCount: questions.length 
    }));
    setShowReformatWarning(false);
    toast.success(`✅ Reformatted ${reformattedCount} questions, completed ${incompleteCount} incomplete sets`);
  };

  const startEditing = (question) => {
    setEditingQuestion(question);
    setEditForm({
      question: question.question,
      options: [...question.options],
      correctAnswer: question.correctAnswer
    });
  };

  const saveEdit = () => {
    if (!editForm.question.trim()) {
      toast.error('Question text is required');
      return;
    }
    
    const validOptions = editForm.options.filter(opt => opt.trim());
    if (validOptions.length < 2) {
      toast.error('At least 2 options are required');
      return;
    }
    
    if (!editForm.correctAnswer || !editForm.options.includes(editForm.correctAnswer)) {
      toast.error('Please select a valid correct answer');
      return;
    }
    
    const updatedQuestions = extractedQuestions.map(q => 
      q.id === editingQuestion.id ? { ...q, ...editForm } : q
    );
    setExtractedQuestions(updatedQuestions);
    setEditingQuestion(null);
    toast.success('Question updated successfully');
  };

  const deleteQuestion = (questionId) => {
    if (window.confirm('Are you sure you want to delete this question?')) {
      const updatedQuestions = extractedQuestions.filter(q => q.id !== questionId);
      setExtractedQuestions(updatedQuestions);
      setStats(prev => ({
        ...prev,
        finalCount: updatedQuestions.length
      }));
      toast.success('Question deleted');
    }
  };

  const addNewQuestion = () => {
    const newQuestion = {
      id: `new-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      question: '',
      options: ['', '', '', ''],
      correctAnswer: '',
      layout: 'text-first'
    };
    setExtractedQuestions([...extractedQuestions, newQuestion]);
    startEditing(newQuestion);
  };

  const reorganizeQuestions = () => {
    let organized = [...extractedQuestions];
    let duplicatesRemoved = 0;
    let invalidRemoved = 0;
    
    if (organizeOptions.removeDuplicates) {
      const seen = new Set();
      const unique = [];
      for (const q of organized) {
        const normalizedText = q.question.toLowerCase().trim();
        if (!seen.has(normalizedText)) {
          seen.add(normalizedText);
          unique.push(q);
        } else {
          duplicatesRemoved++;
        }
      }
      organized = unique;
    }
    
    if (organizeOptions.validateAnswers) {
      organized = organized.filter(q => {
        const isValid = q.correctAnswer && 
                       q.options && 
                       q.options.length >= 2 &&
                       q.options.some(opt => opt.trim() === q.correctAnswer);
        if (!isValid) invalidRemoved++;
        return isValid;
      });
    }
    
    if (organizeOptions.autoCorrectFormat) {
      organized = organized.map(q => ({
        ...q,
        options: q.options.length === 4 ? q.options : [...q.options, ...Array(4 - q.options.length).fill('')],
        correctAnswer: q.correctAnswer || q.options[0] || ''
      }));
    }
    
    if (organizeOptions.sortByDifficulty) {
      const difficultyOrder = { beginner: 1, intermediate: 2, advanced: 3, expert: 4 };
      organized.sort((a, b) => (difficultyOrder[a.difficulty] || 2) - (difficultyOrder[b.difficulty] || 2));
    }
    
    setExtractedQuestions(organized);
    setStats(prev => ({
      ...prev,
      duplicatesRemoved,
      invalidRemoved,
      finalCount: organized.length
    }));
    
    toast.success(`🔧 Reorganized: ${organized.length} valid questions ready`);
    setProcessingStep('review');
  };

  const goToPreviousStep = () => {
    if (processingStep === 'organize') {
      setProcessingStep('upload');
    } else if (processingStep === 'review') {
      setProcessingStep('organize');
    }
  };

  const confirmImport = () => {
    const validQuestions = extractedQuestions.filter(q => q.question.trim() && q.correctAnswer && q.options.some(opt => opt.trim()));
    if (validQuestions.length === 0) {
      toast.error('No valid questions to import');
      return;
    }
    
    onImportComplete(validQuestions);
    onClose();
    resetModal();
  };

  const resetModal = () => {
    setFile(null);
    setExtractedQuestions([]);
    setProcessingStep('upload');
    setEditingQuestion(null);
    setShowReformatWarning(false);
    setUseAIReformat(false);
    setStats({
      totalExtracted: 0,
      duplicatesRemoved: 0,
      invalidRemoved: 0,
      finalCount: 0,
      reformatted: 0,
      incomplete: 0
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex-shrink-0 p-6 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-white rounded-t-2xl">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <span className="text-3xl">📥</span> Bulk Import Questions
              </h3>
              <p className="text-sm text-gray-500 mt-1">Extract, edit, organize, and import questions from files</p>
            </div>
            <button 
              onClick={() => { resetModal(); onClose(); }} 
              className="text-gray-400 hover:text-gray-600 text-2xl transition-colors w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center"
            >
              ×
            </button>
          </div>
        </div>
        
        {/* Progress Steps */}
        <div className="flex-shrink-0 px-6 pt-6">
          <div className="flex mb-6">
            {['upload', 'organize', 'review'].map((step, idx) => (
              <div key={step} className="flex-1 relative">
                <div className={`flex items-center justify-center w-10 h-10 mx-auto rounded-full border-2 transition-all ${
                  processingStep === step 
                    ? 'border-teal-500 bg-teal-500 text-white shadow-lg' 
                    : (step === 'upload' && file && processingStep !== 'upload') ||
                      (step === 'organize' && (processingStep === 'review' || (extractedQuestions.length > 0 && processingStep !== 'organize')))
                      ? 'border-green-500 bg-green-500 text-white'
                      : 'border-gray-300 bg-white text-gray-400'
                }`}>
                  {(step === 'upload' && file && processingStep !== 'upload') ||
                   (step === 'organize' && (processingStep === 'review' || (extractedQuestions.length > 0 && processingStep !== 'organize'))) ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span className="text-sm font-bold">{idx + 1}</span>
                  )}
                </div>
                <div className="text-center mt-2 text-xs font-medium text-gray-600 capitalize">{step}</div>
                {idx < 2 && (
                  <div className={`absolute top-5 left-1/2 w-full h-0.5 transition-all ${
                    (step === 'upload' && file && processingStep !== 'upload') ||
                    (step === 'organize' && processingStep === 'review')
                      ? 'bg-green-500' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>
        
        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto px-6 py-4 min-h-[300px] max-h-[calc(90vh-280px)]">
          {/* Upload Step */}
          {processingStep === 'upload' && (
            <div className="space-y-6">
              <div 
                className={`border-2 border-dashed rounded-xl p-10 text-center transition-all cursor-pointer ${
                  dragActive ? 'border-teal-500 bg-teal-50' : 'border-gray-300 hover:border-teal-400 bg-gray-50'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  id="bulkFile"
                  accept=".pdf,.csv,.docx"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <label htmlFor="bulkFile" className="cursor-pointer flex flex-col items-center gap-4">
                  <div className={`w-24 h-24 rounded-full flex items-center justify-center transition-all ${
                    file ? 'bg-green-100' : 'bg-teal-100'
                  }`}>
                    {file ? (
                      <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ) : (
                      <svg className="w-12 h-12 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                      </svg>
                    )}
                  </div>
                  <div className="text-center">
                    <p className="text-gray-700 font-medium text-lg">
                      {file ? file.name : 'Drag & drop or click to upload'}
                    </p>
                    <p className="text-sm text-gray-400 mt-2">
                      Supports PDF, CSV, and DOCX files (Max 10MB)
                    </p>
                  </div>
                </label>
              </div>
              
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-200">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">📋</span>
                  <div>
                    <h4 className="font-semibold text-blue-800 mb-2">File Format Guidelines</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li className="flex items-center gap-2">• Each question should be clearly numbered (1., 2., etc.)</li>
                      <li className="flex items-center gap-2">• Options should be labeled A., B., C., D.</li>
                      <li className="flex items-center gap-2">• Correct answer can be marked with **, ✓, or (correct)</li>
                      <li className="flex items-center gap-2">• CSV format: question, option_a, option_b, option_c, option_d, correct_answer</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Organize Step */}
          {processingStep === 'organize' && !importing && extractedQuestions.length > 0 && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl p-5 border border-amber-200">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">🔧</span>
                  <div className="flex-1">
                    <h4 className="font-semibold text-amber-800 mb-3">Organization Options</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <label className="flex items-center justify-between p-3 bg-white rounded-lg cursor-pointer hover:shadow-md transition">
                        <span className="text-sm text-gray-700">🗑️ Remove duplicate questions</span>
                        <input
                          type="checkbox"
                          checked={organizeOptions.removeDuplicates}
                          onChange={(e) => setOrganizeOptions({...organizeOptions, removeDuplicates: e.target.checked})}
                          className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                        />
                      </label>
                      <label className="flex items-center justify-between p-3 bg-white rounded-lg cursor-pointer hover:shadow-md transition">
                        <span className="text-sm text-gray-700">🔧 Auto-correct format</span>
                        <input
                          type="checkbox"
                          checked={organizeOptions.autoCorrectFormat}
                          onChange={(e) => setOrganizeOptions({...organizeOptions, autoCorrectFormat: e.target.checked})}
                          className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                        />
                      </label>
                      <label className="flex items-center justify-between p-3 bg-white rounded-lg cursor-pointer hover:shadow-md transition">
                        <span className="text-sm text-gray-700">📊 Sort by difficulty</span>
                        <input
                          type="checkbox"
                          checked={organizeOptions.sortByDifficulty}
                          onChange={(e) => setOrganizeOptions({...organizeOptions, sortByDifficulty: e.target.checked})}
                          className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                        />
                      </label>
                      <label className="flex items-center justify-between p-3 bg-white rounded-lg cursor-pointer hover:shadow-md transition">
                        <span className="text-sm text-gray-700">✅ Validate answers</span>
                        <input
                          type="checkbox"
                          checked={organizeOptions.validateAnswers}
                          onChange={(e) => setOrganizeOptions({...organizeOptions, validateAnswers: e.target.checked})}
                          className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* AI Reformat Toggle */}
              <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                <label className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🤖</span>
                    <div>
                      <span className="text-sm font-medium text-purple-800">Use AI Smart Reformat</span>
                      <p className="text-xs text-purple-600">AI will intelligently fix malformed options</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={useAIReformat}
                    onChange={(e) => setUseAIReformat(e.target.checked)}
                    className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                  />
                </label>
              </div>
              
              {/* Preview Section */}
              <div className="border rounded-xl overflow-hidden">
                <div className="bg-gray-50 px-5 py-3 border-b font-semibold text-gray-700 flex items-center justify-between">
                  <span>📖 Preview First 3 Questions</span>
                  <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded-full">
                    {extractedQuestions.length} total
                  </span>
                </div>
                <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
                  {extractedQuestions.slice(0, 3).map((q, idx) => (
                    <div key={idx} className="border-b pb-4 last:border-0">
                      <p className="font-medium text-gray-800 mb-2">{idx + 1}. {q.question}</p>
                      <div className="ml-6 space-y-1">
                        {q.options?.map((opt, optIdx) => (
                          <div key={optIdx} className="text-sm flex items-center gap-2">
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                              q.correctAnswer === opt ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600'
                            }`}>
                              {String.fromCharCode(65 + optIdx)}
                            </span>
                            <span className="flex-1">{opt || '—'}</span>
                            {q.correctAnswer === opt && (
                              <span className="text-xs text-green-600 font-medium">✓ Correct</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  {extractedQuestions.length > 3 && (
                    <div className="text-center text-sm text-gray-500 py-2">
                      + {extractedQuestions.length - 3} more questions
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Review Step - Simplified */}
          {processingStep === 'review' && extractedQuestions.length > 0 && !importing && (
            <div className="space-y-6">
              {/* Reformatter Warning Banner */}
              {showReformatWarning && (stats.reformatted > 0 || stats.incomplete > 0) && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">⚠️</span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-amber-800">
                        {stats.reformatted} question(s) reformatted, {stats.incomplete} incomplete set(s) completed.
                      </p>
                      <p className="text-xs text-amber-700 mt-1">
                        Example: "A 1972 C. 1974 B 1973 D. 1975" → "A. 1972, B. 1973, C. 1974, D. 1975"
                      </p>
                      <button
                        onClick={manualReformatAll}
                        className="mt-2 px-3 py-1 text-xs bg-amber-600 text-white rounded hover:bg-amber-700 transition-all"
                      >
                        🔧 Reformat All Questions
                      </button>
                    </div>
                    <button onClick={() => setShowReformatWarning(false)} className="text-amber-500 hover:text-amber-700">
                      ✕
                    </button>
                  </div>
                </div>
              )}
              
              {/* Statistics Cards */}
              <div className="grid grid-cols-6 gap-3">
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-3 text-center border border-green-200">
                  <div className="text-2xl font-bold text-green-600">{stats.totalExtracted}</div>
                  <div className="text-xs text-green-700">Extracted</div>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-3 text-center border border-purple-200">
                  <div className="text-2xl font-bold text-purple-600">{stats.reformatted}</div>
                  <div className="text-xs text-purple-700">Reformatted</div>
                </div>
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-3 text-center border border-orange-200">
                  <div className="text-2xl font-bold text-orange-600">{stats.incomplete}</div>
                  <div className="text-xs text-orange-700">Completed</div>
                </div>
                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-3 text-center border border-yellow-200">
                  <div className="text-2xl font-bold text-yellow-600">{stats.duplicatesRemoved}</div>
                  <div className="text-xs text-yellow-700">Duplicates</div>
                </div>
                <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-3 text-center border border-red-200">
                  <div className="text-2xl font-bold text-red-600">{stats.invalidRemoved}</div>
                  <div className="text-xs text-red-700">Invalid</div>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-3 text-center border border-blue-200">
                  <div className="text-2xl font-bold text-blue-600">{extractedQuestions.length}</div>
                  <div className="text-xs text-blue-700">Current</div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={addNewQuestion}
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-all flex items-center gap-2 text-sm"
                >
                  <span className="text-lg">+</span> Add New Question
                </button>
                <button
                  onClick={manualReformatAll}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all flex items-center gap-2 text-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Reformat All Options
                </button>
                <button
                  onClick={() => setProcessingStep('organize')}
                  className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-all flex items-center gap-2 text-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Batch Organize
                </button>
              </div>
              
              {/* Questions List - Simplified */}
              <div className="border rounded-xl overflow-hidden">
                <div className="bg-gray-50 px-5 py-3 border-b font-semibold text-gray-700 flex items-center justify-between sticky top-0">
                  <span>📚 All Questions ({extractedQuestions.length})</span>
                  <span className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
                    Click ✏️ to edit each question
                  </span>
                </div>
                <div className="divide-y max-h-96 overflow-y-auto">
                  {extractedQuestions.map((q, idx) => (
                    <div key={q.id} className="p-4 hover:bg-gray-50 transition-colors">
                      {editingQuestion?.id === q.id ? (
                        <div className="space-y-3">
                          <div>
                            <label className="text-xs font-semibold text-gray-700 block mb-1">Question Text</label>
                            <textarea
                              value={editForm.question}
                              onChange={(e) => setEditForm({ ...editForm, question: e.target.value })}
                              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-teal-400"
                              rows="2"
                              placeholder="Enter your question..."
                            />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-gray-700 block mb-1">Options</label>
                            {editForm.options.map((opt, optIdx) => (
                              <div key={optIdx} className="flex items-center gap-2 mb-2">
                                <span className="w-8 text-sm font-bold text-gray-600">{String.fromCharCode(65 + optIdx)}.</span>
                                <input
                                  type="text"
                                  value={opt}
                                  onChange={(e) => {
                                    const newOptions = [...editForm.options];
                                    newOptions[optIdx] = e.target.value;
                                    setEditForm({ ...editForm, options: newOptions });
                                  }}
                                  className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-teal-400"
                                  placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                                />
                                <button
                                  onClick={() => {
                                    const newOptions = [...editForm.options];
                                    newOptions[optIdx] = '';
                                    setEditForm({ ...editForm, options: newOptions });
                                  }}
                                  className="text-gray-400 hover:text-red-500 transition-colors"
                                >
                                  🗑️
                                </button>
                              </div>
                            ))}
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-gray-700 block mb-1">Correct Answer</label>
                            <select
                              value={editForm.correctAnswer}
                              onChange={(e) => setEditForm({ ...editForm, correctAnswer: e.target.value })}
                              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-teal-400"
                            >
                              <option value="">Select correct answer</option>
                              {editForm.options.map((opt, optIdx) => (
                                opt && opt.trim() && <option key={optIdx} value={opt}>{String.fromCharCode(65 + optIdx)}. {opt}</option>
                              ))}
                            </select>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={saveEdit}
                              className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 transition-all"
                            >
                              Save Changes
                            </button>
                            <button
                              onClick={() => setEditingQuestion(null)}
                              className="px-3 py-1.5 bg-gray-500 text-white rounded-lg text-sm hover:bg-gray-600 transition-all"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-sm font-bold flex-shrink-0">
                            {idx + 1}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-800">{q.question || '(No question text)'}</p>
                            <div className="grid grid-cols-2 gap-2 mt-2">
                              {q.options?.map((opt, optIdx) => (
                                <div key={optIdx} className="text-sm flex items-center gap-2">
                                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium ${
                                    q.correctAnswer === opt ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600'
                                  }`}>
                                    {String.fromCharCode(65 + optIdx)}
                                  </span>
                                  <span className="flex-1 truncate">{opt || '—'}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => startEditing(q)}
                              className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors"
                              title="Edit question"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => deleteQuestion(q.id)}
                              className="p-1.5 hover:bg-red-50 rounded-lg text-red-600 transition-colors"
                              title="Delete question"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {/* Extracting Loading State */}
          {importing && (
            <div className="text-center py-16">
              <div className="inline-block w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-6 text-gray-700 font-medium text-lg">Extracting questions from file...</p>
              <p className="text-sm text-gray-400 mt-2">This may take a moment for large files</p>
              <div className="mt-4 w-64 h-2 bg-gray-200 rounded-full overflow-hidden mx-auto">
                <div className="h-full bg-teal-500 rounded-full animate-pulse" style={{ width: '60%' }}></div>
              </div>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="flex-shrink-0 p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          <div className="flex justify-between items-center gap-3">
            <div>
              {processingStep !== 'upload' && !importing && extractedQuestions.length > 0 && (
                <button 
                  onClick={goToPreviousStep} 
                  className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100 transition-all font-medium flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back
                </button>
              )}
            </div>
            <div className="flex gap-3 ml-auto">
              <button 
                onClick={() => { resetModal(); onClose(); }} 
                className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100 transition-all font-medium"
              >
                Cancel
              </button>
              
              {processingStep === 'upload' && file && !importing && (
                <button 
                  onClick={extractQuestions} 
                  className="px-6 py-2.5 bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-lg hover:from-teal-700 hover:to-teal-800 transition-all font-medium shadow-md flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Extract Questions
                </button>
              )}
              
              {processingStep === 'upload' && !file && !importing && (
                <button disabled className="px-6 py-2.5 bg-gray-300 text-gray-500 rounded-lg font-medium cursor-not-allowed">
                  Select a file first
                </button>
              )}
              
              {processingStep === 'organize' && !importing && extractedQuestions.length > 0 && (
                <>
                  <button 
                    onClick={reorganizeQuestions} 
                    className="px-6 py-2.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-all font-medium shadow-md flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Apply Organization
                  </button>
                  <button 
                    onClick={() => setProcessingStep('review')} 
                    className="px-6 py-2.5 bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-lg hover:from-teal-700 hover:to-teal-800 transition-all font-medium shadow-md flex items-center gap-2"
                  >
                    Skip & Continue
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </button>
                </>
              )}
              
              {processingStep === 'review' && !importing && (
                <button 
                  onClick={confirmImport} 
                  disabled={extractedQuestions.filter(q => q.question && q.correctAnswer).length === 0}
                  className="px-6 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all font-medium shadow-md flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Import {extractedQuestions.filter(q => q.question && q.correctAnswer).length} Valid Question{extractedQuestions.filter(q => q.question && q.correctAnswer).length !== 1 ? 's' : ''}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Question Card Component (keep existing - simplified)
const QuestionCard = memo(({ 
  question, index, onUpdate, onRemove, onDuplicate, onImageUpload, onImageRemove, onAIImprove 
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [preview, setPreview] = useState(false);
  const [showAIImprove, setShowAIImprove] = useState(false);

  const handleQuestionChange = (value) => {
    onUpdate(index, { question: value });
  };

  const handleOptionChange = (optIndex, value) => {
    const newOptions = [...question.options];
    newOptions[optIndex] = value;
    onUpdate(index, { options: newOptions });
  };

  const handleCorrectAnswer = (value) => {
    onUpdate(index, { correctAnswer: value });
  };

  const handleLayoutChange = (layout) => {
    onUpdate(index, { layout });
  };

  const handleAIImprove = () => {
    setShowAIImprove(true);
  };

  const handleImprovedQuestion = (improved) => {
    onUpdate(index, improved);
    toast.success('Question improved with AI!');
  };

  return (
    <>
      <AIImprovementModal
        isOpen={showAIImprove}
        onClose={() => setShowAIImprove(false)}
        question={question}
        onImproved={handleImprovedQuestion}
      />
      
      <div className="border border-gray-200 rounded-xl bg-white overflow-hidden hover:shadow-md transition-shadow">
        <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-white border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-teal-500 text-white flex items-center justify-center text-sm font-bold shadow-sm">
              {index + 1}
            </div>
            <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
              {QUESTION_LAYOUTS.map(layout => (
                <button
                  key={layout.id}
                  onClick={() => handleLayoutChange(layout.id)}
                  className={`px-2 py-1 text-xs rounded transition-all flex items-center gap-1 ${
                    question.layout === layout.id 
                      ? 'bg-white shadow-sm text-gray-800' 
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {layout.icon} <span className="hidden sm:inline">{layout.name}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-1">
            <button 
              onClick={handleAIImprove}
              className="p-1.5 hover:bg-purple-50 rounded-lg text-purple-500 transition-colors"
              title="AI Improve"
            >
              🤖
            </button>
            <button 
              onClick={() => setPreview(!preview)} 
              className="p-1.5 hover:bg-gray-200 rounded-lg text-gray-500 transition-colors"
              title={preview ? 'Edit mode' : 'Preview mode'}
            >
              {preview ? '✏️' : '👁️'}
            </button>
            <button onClick={() => onDuplicate(index)} className="p-1.5 hover:bg-gray-200 rounded-lg text-gray-500 transition-colors" title="Duplicate">
              📋
            </button>
            <button 
              onClick={() => setIsExpanded(!isExpanded)} 
              className="p-1.5 hover:bg-gray-200 rounded-lg text-gray-500 transition-colors"
              title={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? '▲' : '▼'}
            </button>
            <button 
              onClick={() => onRemove(index)} 
              className="p-1.5 hover:bg-red-100 rounded-lg text-gray-500 hover:text-red-600 transition-colors"
              title="Remove"
            >
              🗑️
            </button>
          </div>
        </div>
        
        {isExpanded && (
          <div className="p-5 space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-2">
                Question Text <span className="text-red-500">*</span>
                <span className="text-gray-400 text-[10px] font-normal ml-2">
                  (Use __text__ for underline, **text** for bold, *text* for italic)
                </span>
              </label>
              {!preview ? (
                <textarea
                  value={question.question}
                  onChange={(e) => handleQuestionChange(e.target.value)}
                  placeholder="Enter your question..."
                  rows={3}
                  className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition-all font-mono"
                />
              ) : (
                <div 
                  className="p-3 bg-gray-50 rounded-lg text-sm prose prose-sm max-w-none border border-gray-200"
                  dangerouslySetInnerHTML={{ __html: renderFormattedText(question.question) || '<span class="text-gray-400">Preview will appear here...</span>' }}
                />
              )}
            </div>
            
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-2">Image (optional)</label>
              {!question.questionImage ? (
                <label className="block border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-teal-400 transition-all bg-gray-50/30">
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={(e) => onImageUpload(e, index)} 
                    className="hidden" 
                  />
                  <div className="flex flex-col items-center gap-2">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm text-gray-500">Click to upload image</span>
                    <span className="text-[10px] text-gray-400">PNG, JPG, GIF up to 5MB</span>
                  </div>
                </label>
              ) : (
                <div className="relative inline-block">
                  <img src={question.questionImage} alt="Question" className="h-20 rounded-lg object-contain border p-1 bg-gray-50" />
                  <button 
                    onClick={() => onImageRemove(index)} 
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center hover:bg-red-600 transition-colors shadow-sm"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
            
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-2">
                Answer Options <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                {question.options.map((opt, optIdx) => (
                  <div key={optIdx} className="flex items-center gap-2">
                    <button
                      onClick={() => handleCorrectAnswer(opt)}
                      className={`w-8 h-8 rounded-lg text-sm font-bold flex items-center justify-center transition-all ${
                        question.correctAnswer === opt && opt.trim()
                          ? 'bg-green-500 text-white shadow-sm'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                      title="Mark as correct answer"
                    >
                      {String.fromCharCode(65 + optIdx)}
                    </button>
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => handleOptionChange(optIdx, e.target.value)}
                      placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                      className="flex-1 px-3 py-2 text-sm border rounded-lg focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition-all"
                    />
                  </div>
                ))}
              </div>
              {question.correctAnswer && (
                <div className="mt-2 text-xs text-green-600 flex items-center gap-1">
                  <span>✓</span> Correct answer: {question.correctAnswer}
                </div>
              )}
            </div>
            
            <div className="flex gap-2 pt-2">
              <button
                onClick={handleAIImprove}
                className="px-3 py-1.5 text-xs bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-all flex items-center gap-1"
              >
                🤖 AI Improve Question
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
});

QuestionCard.displayName = 'QuestionCard';

// Main AdminQuizzes Component (keep existing but add AI button)
const AdminQuizzes = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [quizzes, setQuizzes] = useState([]);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [activeTab, setActiveTab] = useState('create');
  const [search, setSearch] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [showAIGenerate, setShowAIGenerate] = useState(false);
  
  const [form, setForm] = useState({
    title: '',
    subject: '',
    description: '',
    classLevel: '',
    difficulty: 'intermediate',
    image: '',
    isActive: true
  });
  
  const [questions, setQuestions] = useState([getEmptyQuestion()]);
  const [randomMode, setRandomMode] = useState(false);
  const [questionsPerAttempt, setQuestionsPerAttempt] = useState(20);
  const [saveToBank, setSaveToBank] = useState(false);

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
      console.error('Load quizzes error:', error);
      toast.error('Failed to load quizzes');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedQuiz(null);
    setForm({
      title: '',
      subject: '',
      description: '',
      classLevel: '',
      difficulty: 'intermediate',
      image: '',
      isActive: true
    });
    setQuestions([getEmptyQuestion()]);
    setRandomMode(false);
    setQuestionsPerAttempt(20);
    setSaveToBank(false);
  };

  const updateForm = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const updateQuestion = (index, updates) => {
    setQuestions(prev => prev.map((q, i) => i === index ? { ...q, ...updates } : q));
  };

  const addQuestion = () => {
    setQuestions(prev => [...prev, getEmptyQuestion()]);
  };
  
  const removeQuestion = (index) => {
    if (questions.length === 1) {
      toast.error('You need at least one question');
      return;
    }
    setQuestions(prev => prev.filter((_, i) => i !== index));
  };
  
  const duplicateQuestion = (index) => {
    const newQuestion = { 
      ...questions[index], 
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      question: `${questions[index].question} (Copy)`
    };
    setQuestions(prev => [...prev.slice(0, index + 1), newQuestion, ...prev.slice(index + 1)]);
    toast.success('Question duplicated');
  };

  const handleAIGeneratedQuestions = (generatedQuestions) => {
    setQuestions(prev => [...prev, ...generatedQuestions]);
    toast.success(`🎉 Added ${generatedQuestions.length} AI-generated questions!`);
  };

  const uploadImage = async (file, type, index = null) => {
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }
    
    const formData = new FormData();
    formData.append('image', file);
    
    setUploading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/api/admin/upload-image`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data' 
        }
      });
      
      if (response.data.success) {
        if (type === 'quiz') {
          updateForm('image', response.data.imageUrl);
        } else if (type === 'question' && index !== null) {
          updateQuestion(index, { questionImage: response.data.imageUrl });
        }
        toast.success('Image uploaded');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleQuizImageUpload = (e) => {
    uploadImage(e.target.files[0], 'quiz');
  };

  const handleQuestionImageUpload = (e, index) => {
    uploadImage(e.target.files[0], 'question', index);
  };

  const handleBulkImportComplete = (importedQuestions) => {
    setQuestions(prev => [...prev, ...importedQuestions]);
    toast.success(`✨ Successfully imported ${importedQuestions.length} questions!`);
  };

  const saveQuiz = async () => {
    if (!form.title.trim()) {
      toast.error('Quiz title is required');
      return;
    }
    
    if (!form.subject) {
      toast.error('Please select a subject');
      return;
    }
    
    if (!form.classLevel) {
      toast.error('Please select a class level');
      return;
    }
    
    const validQuestions = questions.filter(q => q.question.trim() && q.correctAnswer.trim());
    if (validQuestions.length === 0) {
      toast.error('Please add at least one valid question');
      return;
    }
    
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const hasEmptyOption = q.options.some(opt => !opt.trim());
      if (hasEmptyOption) {
        toast.error(`Question ${i + 1}: Please fill in all options`);
        return;
      }
      
      if (!q.options.includes(q.correctAnswer)) {
        toast.error(`Question ${i + 1}: Correct answer must match one of the options`);
        return;
      }
    }
    
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const payload = {
        title: form.title.trim(),
        topic: form.subject,
        description: form.description.trim() || '',
        questions: questions.map(q => ({
          question: q.question,
          questionImage: q.questionImage || null,
          options: q.options,
          correctAnswer: q.correctAnswer,
          layout: q.layout
        })),
        class_level: form.classLevel,
        difficulty: form.difficulty,
        image_url: form.image || null,
        is_active: form.isActive,
        random_selection: randomMode,
        questions_per_attempt: randomMode ? questionsPerAttempt : null
      };
      
      if (selectedQuiz) {
        await axios.put(`${API_URL}/api/admin/quizzes/${selectedQuiz.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Quiz updated successfully');
      } else {
        await axios.post(`${API_URL}/api/admin/quizzes`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Quiz created successfully');
      }
      
      resetForm();
      await loadQuizzes();
      setActiveTab('manage');
      
    } catch (error) {
      console.error('Save quiz error:', error);
      
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again');
        logout();
      } else {
        toast.error(error.response?.data?.message || 'Failed to save quiz');
      }
    } finally {
      setSaving(false);
    }
  };

  const deleteQuiz = async (id) => {
    if (!window.confirm('Are you sure you want to delete this quiz? This action cannot be undone.')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/api/admin/quizzes/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setQuizzes(prev => prev.filter(q => q.id !== id));
      toast.success('Quiz deleted successfully');
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete quiz');
    }
  };

  const editQuiz = (quiz) => {
    setSelectedQuiz(quiz);
    setForm({
      title: quiz.title || '',
      subject: quiz.topic || '',
      description: quiz.description || '',
      classLevel: quiz.class_level || '',
      difficulty: quiz.difficulty || 'intermediate',
      image: quiz.image_url || '',
      isActive: quiz.is_active ?? true
    });
    
    setQuestions(quiz.questions?.map(q => ({
      id: q.id || `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      question: q.question || '',
      questionImage: q.questionImage || '',
      options: q.options || ['', '', '', ''],
      correctAnswer: q.correctAnswer || '',
      layout: q.layout || 'text-first'
    })) || [getEmptyQuestion()]);
    
    setRandomMode(quiz.random_selection || false);
    setQuestionsPerAttempt(quiz.questions_per_attempt || 20);
    setActiveTab('create');
  };

  const filteredQuizzes = quizzes.filter(quiz => {
    const matchSearch = quiz.title?.toLowerCase().includes(search.toLowerCase()) || false;
    const matchSubject = !filterSubject || quiz.topic === filterSubject;
    return matchSearch && matchSubject;
  });

  const getSubjectName = (topicId) => {
    const subject = SUBJECTS.find(s => s.id === topicId);
    return subject ? subject.name : topicId;
  };

  const getDifficultyName = (difficultyId) => {
    const difficulty = DIFFICULTY_LEVELS.find(d => d.id === difficultyId);
    return difficulty ? difficulty.name : difficultyId;
  };

  const getLevelName = (levelId) => {
    const level = CLASS_LEVELS.find(l => l.id === levelId);
    return level ? level.name : levelId;
  };

  const QuizCard = ({ quiz }) => (
    <div className="bg-white border rounded-xl p-4 hover:shadow-md transition-all cursor-pointer">
      <div className="flex gap-4">
        {quiz.image_url ? (
          <img src={quiz.image_url} alt={quiz.title} className="w-16 h-16 rounded-lg object-cover" />
        ) : (
          <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-teal-100 to-teal-200 flex items-center justify-center text-3xl">
            {SUBJECTS.find(s => s.id === quiz.topic)?.icon || '📚'}
          </div>
        )}
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-gray-800">{quiz.title}</h3>
              <div className="flex gap-2 mt-1 flex-wrap">
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100">
                  {getSubjectName(quiz.topic)}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                  {getDifficultyName(quiz.difficulty)}
                </span>
                {quiz.class_level && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                    📚 {getLevelName(quiz.class_level)}
                  </span>
                )}
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  quiz.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {quiz.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
            <div className="flex gap-1">
              <button 
                onClick={() => editQuiz(quiz)} 
                className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors"
                title="Edit"
              >
                ✏️
              </button>
              <button 
                onClick={() => deleteQuiz(quiz.id)} 
                className="p-1.5 hover:bg-red-50 rounded-lg text-red-600 transition-colors"
                title="Delete"
              >
                🗑️
              </button>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            {quiz.questions?.length || 0} questions
            {quiz.random_selection && quiz.questions?.length > (quiz.questions_per_attempt || 20) && (
              <span className="ml-2 text-blue-600">
                • Random {quiz.questions_per_attempt || 20}/{quiz.questions?.length}
              </span>
            )}
          </p>
          {quiz.description && (
            <p className="text-xs text-gray-400 mt-1 line-clamp-1">{quiz.description}</p>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <AIGenerationModal
        isOpen={showAIGenerate}
        onClose={() => setShowAIGenerate(false)}
        onQuestionsGenerated={handleAIGeneratedQuestions}
      />
      
      <BulkImportModal
        isOpen={showBulkImport}
        onClose={() => setShowBulkImport(false)}
        onImportComplete={handleBulkImportComplete}
      />
      
      <PreviewModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        quiz={form}
        questions={questions}
        onConfirm={() => {
          setShowPreview(false);
          saveQuiz();
        }}
      />

      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-lg">Q</span>
            </div>
            <div>
              <h1 className="font-bold text-gray-800">Quiz Manager</h1>
              <p className="text-xs text-gray-500">Create & manage assessments with AI</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/admin-dashboard')} 
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Dashboard
            </button>
            <button 
              onClick={logout} 
              className="text-sm text-red-600 hover:text-red-700 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-6 border-b mb-6">
          <button
            onClick={() => {
              setActiveTab('create');
              resetForm();
            }}
            className={`pb-2 text-sm font-medium capitalize transition-all ${
              activeTab === 'create' 
                ? 'text-teal-600 border-b-2 border-teal-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {selectedQuiz ? 'Edit Quiz' : 'Create Quiz'}
          </button>
          <button
            onClick={() => setActiveTab('manage')}
            className={`pb-2 text-sm font-medium capitalize transition-all ${
              activeTab === 'manage' 
                ? 'text-teal-600 border-b-2 border-teal-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            All Quizzes ({quizzes.length})
          </button>
        </div>

        {/* Create/Edit Tab */}
        {activeTab === 'create' && (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Sidebar - Quiz Settings */}
            <div className="lg:col-span-1 space-y-4">
              <div className="bg-white rounded-xl border shadow-sm p-5 sticky top-24">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Quiz Settings
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-gray-700 block mb-1">Cover Image</label>
                    {!form.image ? (
                      <label className="block border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-teal-400 transition bg-gray-50">
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={handleQuizImageUpload} 
                          className="hidden" 
                          disabled={uploading}
                        />
                        <span className="text-sm text-gray-500">
                          {uploading ? 'Uploading...' : '📷 Click to upload image'}
                        </span>
                      </label>
                    ) : (
                      <div className="relative">
                        <img src={form.image} alt="Cover" className="w-full h-32 object-cover rounded-lg shadow-sm" />
                        <button 
                          onClick={() => updateForm('image', '')} 
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 text-xs flex items-center justify-center hover:bg-red-600 transition-colors shadow-sm"
                        >
                          ×
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <label className="text-xs font-medium text-gray-700 block mb-1">
                      Quiz Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.title}
                      onChange={(e) => updateForm('title', e.target.value)}
                      placeholder="e.g., Mathematics Challenge 2024"
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition-all"
                    />
                  </div>
                  
                  <div>
                    <label className="text-xs font-medium text-gray-700 block mb-1">
                      Subject <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={form.subject}
                      onChange={(e) => updateForm('subject', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-teal-400"
                    >
                      <option value="">Select a subject</option>
                      {SUBJECTS.map(s => (
                        <option key={s.id} value={s.id}>{s.icon} {s.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="text-xs font-medium text-gray-700 block mb-1">
                      Class Level <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={form.classLevel}
                      onChange={(e) => updateForm('classLevel', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-teal-400"
                    >
                      <option value="">Select class level</option>
                      {CLASS_LEVELS.map(level => (
                        <option key={level.id} value={level.id}>{level.icon} {level.name}</option>
                      ))}
                    </select>
                    <p className="text-xs text-purple-600 mt-1 font-medium">
                      Only students at this level will see this quiz
                    </p>
                  </div>
                  
                  <div>
                    <label className="text-xs font-medium text-gray-700 block mb-2">Difficulty Level</label>
                    <div className="grid grid-cols-2 gap-2">
                      {DIFFICULTY_LEVELS.map(level => (
                        <button
                          key={level.id}
                          onClick={() => updateForm('difficulty', level.id)}
                          className={`p-2 rounded-lg border text-left text-sm transition-all ${
                            form.difficulty === level.id 
                              ? 'border-teal-500 bg-teal-50 shadow-sm' 
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <div className="font-medium">{level.icon} {level.name}</div>
                          <div className="text-xs text-gray-500">{level.timeLimit}s • {level.points} pts</div>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-xs font-medium text-gray-700 block mb-1">Description</label>
                    <textarea
                      value={form.description}
                      onChange={(e) => updateForm('description', e.target.value)}
                      rows={3}
                      placeholder="Describe what students will learn..."
                      className="w-full px-3 py-2 border rounded-lg text-sm resize-none focus:outline-none focus:border-teal-400"
                    />
                  </div>
                  
                  <div className="border-t pt-4">
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-sm font-medium text-gray-700">🎲 Random Question Selection</span>
                      <input
                        type="checkbox"
                        checked={randomMode}
                        onChange={(e) => setRandomMode(e.target.checked)}
                        className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                      />
                    </label>
                    {randomMode && (
                      <div className="mt-3">
                        <label className="text-xs text-gray-600 block mb-1">Questions per attempt</label>
                        <input
                          type="number"
                          min={1}
                          max={questions.length}
                          value={questionsPerAttempt}
                          onChange={(e) => setQuestionsPerAttempt(Math.min(parseInt(e.target.value) || 1, questions.length))}
                          className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-teal-400"
                        />
                        <p className="text-xs text-gray-400 mt-1">
                          {questions.length} total questions available
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-sm font-medium text-gray-700">📚 Save to Question Bank</span>
                    <input
                      type="checkbox"
                      checked={saveToBank}
                      onChange={(e) => setSaveToBank(e.target.checked)}
                      className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Publish immediately</span>
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(e) => updateForm('isActive', e.target.checked)}
                      className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Questions Section */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl border shadow-sm">
                <div className="p-5 border-b bg-gradient-to-r from-gray-50 to-white flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                      <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Questions
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">{questions.length} question(s)</p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setShowAIGenerate(true)} 
                      className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg text-sm font-medium hover:from-purple-700 hover:to-purple-800 transition-all shadow-md flex items-center gap-2"
                    >
                      🤖 AI Generate
                    </button>
                    <button 
                      onClick={() => setShowBulkImport(true)} 
                      className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg text-sm font-medium hover:from-blue-700 hover:to-blue-800 transition-all shadow-md flex items-center gap-2"
                    >
                      📥 Bulk Import
                    </button>
                    <button 
                      onClick={addQuestion} 
                      className="px-4 py-2 bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-lg text-sm font-medium hover:from-teal-700 hover:to-teal-800 transition-all shadow-md flex items-center gap-2"
                    >
                      <span>+</span> Add Question
                    </button>
                  </div>
                </div>
                
                <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
                  {questions.map((q, idx) => (
                    <QuestionCard
                      key={q.id}
                      question={q}
                      index={idx}
                      onUpdate={updateQuestion}
                      onRemove={removeQuestion}
                      onDuplicate={duplicateQuestion}
                      onImageUpload={handleQuestionImageUpload}
                      onImageRemove={(i) => updateQuestion(i, { questionImage: '' })}
                    />
                  ))}
                </div>
                
                <div className="p-5 border-t bg-gray-50 flex gap-3">
                  <button 
                    onClick={resetForm} 
                    className="flex-1 py-2.5 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100 transition-all font-medium"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => setShowPreview(true)} 
                    className="flex-1 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all font-medium shadow-md"
                  >
                    👁️ Preview
                  </button>
                  <button 
                    onClick={saveQuiz} 
                    disabled={saving} 
                    className="flex-1 py-2.5 bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-lg hover:from-teal-700 hover:to-teal-800 transition-all font-medium shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Saving...' : (selectedQuiz ? 'Update Quiz' : 'Publish Quiz')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Manage Tab */}
        {activeTab === 'manage' && (
          <div className="bg-white rounded-xl border shadow-sm">
            <div className="p-5 border-b bg-gradient-to-r from-gray-50 to-white">
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder="Search quizzes..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full px-3 py-2 pl-10 border rounded-lg text-sm focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition-all"
                  />
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">🔍</span>
                </div>
                <select
                  value={filterSubject}
                  onChange={(e) => setFilterSubject(e.target.value)}
                  className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-teal-400"
                >
                  <option value="">All Subjects</option>
                  {SUBJECTS.map(s => (
                    <option key={s.id} value={s.id}>{s.icon} {s.name}</option>
                  ))}
                </select>
                {(search || filterSubject) && (
                  <button
                    onClick={() => {
                      setSearch('');
                      setFilterSubject('');
                    }}
                    className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
            
            <div className="p-5">
              {loading ? (
                <div className="text-center py-8">
                  <div className="inline-block w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-gray-500 mt-2">Loading quizzes...</p>
                </div>
              ) : filteredQuizzes.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-5xl mb-3">📭</div>
                  <p className="text-gray-500">No quizzes found</p>
                  {(search || filterSubject) ? (
                    <button 
                      onClick={() => {
                        setSearch('');
                        setFilterSubject('');
                      }}
                      className="mt-3 text-teal-600 text-sm hover:underline"
                    >
                      Clear filters
                    </button>
                  ) : (
                    <button 
                      onClick={() => setActiveTab('create')} 
                      className="mt-3 text-teal-600 text-sm hover:underline font-medium"
                    >
                      Create your first quiz →
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredQuizzes.map(quiz => (
                    <QuizCard key={quiz.id} quiz={quiz} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminQuizzes;