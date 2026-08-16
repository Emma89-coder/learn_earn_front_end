import React, { useState, useEffect, useCallback, memo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import API_URL from '../../config';

// Constants
const SUBJECTS = [
  { id: 'social-studies', name: 'Social Studies', icon: '', color: '#1A237E' },
  { id: 'bible-knowledge', name: 'Bible Knowledge', icon: '', color: '#00B0FF' },
  { id: 'english', name: 'English', icon: '', color: '#008080' },
  { id: 'primary-science', name: 'Primary Science', icon: '', color: '#00B0FF' },
  { id: 'arts-life-skills', name: 'Arts & Life Skills', icon: '', color: '#008080' },
  { id: 'mathematics', name: 'Mathematics', icon: '', color: '#1A237E' },
  { id: 'chichewa', name: 'Chichewa', icon: '', color: '#00B0FF' }
];

const CLASS_LEVELS = [
  { id: 'standard-1', name: 'Standard 1', grade: 1, icon: 'S1' },
  { id: 'standard-2', name: 'Standard 2', grade: 2, icon: 'S2' },
  { id: 'standard-3', name: 'Standard 3', grade: 3, icon: 'S3' },
  { id: 'standard-4', name: 'Standard 4', grade: 4, icon: 'S4' },
  { id: 'standard-5', name: 'Standard 5', grade: 5, icon: 'S5' },
  { id: 'standard-6', name: 'Standard 6', grade: 6, icon: 'S6' },
  { id: 'standard-7', name: 'Standard 7', grade: 7, icon: 'S7' },
  { id: 'standard-8', name: 'Standard 8', grade: 8, icon: 'S8' }
];

const DIFFICULTY_LEVELS = [
  { id: 'beginner', name: 'Beginner', icon: '', timeLimit: 45, points: 1 },
  { id: 'intermediate', name: 'Intermediate', icon: '', timeLimit: 30, points: 2 },
  { id: 'advanced', name: 'Advanced', icon: '', timeLimit: 20, points: 3 },
  { id: 'expert', name: 'Expert', icon: '', timeLimit: 15, points: 5 }
];

const QUESTION_LAYOUTS = [
  { id: 'text-first', name: 'Text First', icon: 'T' },
  { id: 'image-first', name: 'Image First', icon: 'I' }
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
  },

  generateFromPDF: async (file, count = 5, subject = 'general', difficulty = 'medium', topic = '', pageNumbers = '') => {
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', file);
      formData.append('count', String(count));
      formData.append('subject', String(subject || 'general'));
      formData.append('difficulty', String(difficulty || 'medium'));
      formData.append('topic', String(topic || ''));
      formData.append('pageNumbers', String(pageNumbers || ''));

      const response = await axios.post(`${API_URL}/api/ai/generate-from-pdf`, formData, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        timeout: 120000
      });

      return response.data.questions;
    } catch (error) {
      console.error('AI PDF generation error:', error);
      return null;
    }
  }
};

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
  },

  reformatOptions: async (options) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/api/ai/reformat-options`, {
        options
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data.reformatted;
    } catch (error) {
      console.error('AI option reformat error:', error);
      return null;
    }
  },

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
      console.error('AI question validation error:', error);
      return null;
    }
  }
};

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
const AIGenerationModal = ({ isOpen, onClose, onQuestionsGenerated, isDarkMode }) => {
  const { settings } = useTheme();
  const [topic, setTopic] = useState('');
  const [subject, setSubject] = useState('');
  const [difficulty, setDifficulty] = useState('intermediate');
  const [count, setCount] = useState(5);
  const [generating, setGenerating] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [mode, setMode] = useState('topic');
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfTopic, setPdfTopic] = useState('');
  const [pdfPageNumbers, setPdfPageNumbers] = useState('');
  const pdfInputRef = useRef(null);

  const accentColor = settings?.accentColor || '#14b8a6';
  const headingColor = settings?.headingColor || (isDarkMode ? '#f8fafc' : '#19475B');
  const bodyColor = settings?.bodyColor || (isDarkMode ? '#e2e8f0' : '#374151');
  const borderColor = settings?.containerBorder || (isDarkMode ? '#475569' : '#e5e7eb');
  const accentSoftBg = isDarkMode ? `${accentColor}22` : `${accentColor}14`;
  const accentSoftBorder = isDarkMode ? `${accentColor}44` : `${accentColor}33`;
  const inputTextColor = bodyColor || (isDarkMode ? '#f8fafc' : '#374151');
  const placeholderColor = isDarkMode ? '#94a3b8' : '#6b7280';
  const modalSurface = isDarkMode ? '#0f172acc' : '#ffffff';
  const sectionSurface = isDarkMode ? '#0b1220' : '#f8fafc';
  const tabSurface = isDarkMode ? '#0f172a' : '#e2e8f0';
  const mutedTextColor = isDarkMode ? '#94a3b8' : '#64748b';

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
      } else if (mode === 'text') {
        if (!textInput) {
          toast.error('Please enter some text to generate questions from');
          return;
        }
        questions = await AIQuestionGenerator.generateFromText(textInput, count);
      } else {
        if (!pdfFile) {
          toast.error('Please upload a PDF lesson file');
          return;
        }
        if (!pdfTopic.trim()) {
          toast.error('Please enter a topic for the PDF questions');
          return;
        }
        if (!pdfPageNumbers.trim()) {
          toast.error('Please specify page numbers (e.g. 1-3,5)');
          return;
        }
        questions = await AIQuestionGenerator.generateFromPDF(
          pdfFile,
          count,
          subject,
          difficulty,
          pdfTopic,
          pdfPageNumbers
        );
      }

      if (questions && questions.length > 0) {
        onQuestionsGenerated(questions);
        onClose();
        toast.success(`Generated ${questions.length} questions successfully!`);
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
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        className={`rounded-3xl max-w-2xl w-full max-h-[88vh] overflow-hidden shadow-2xl border ${
          isDarkMode ? 'backdrop-blur-md' : ''
        }`}
        style={{
          borderColor: accentSoftBorder,
          background: modalSurface,
          boxShadow: isDarkMode
            ? '0 24px 70px rgba(2, 6, 23, 0.65)'
            : '0 24px 60px rgba(15, 23, 42, 0.20)'
        }}
      >
        <div
          className="p-6 border-b flex justify-between items-start"
          style={{
            borderColor: accentSoftBorder,
            background: isDarkMode
              ? `linear-gradient(120deg, ${accentColor}22 0%, rgba(15,23,42,0.95) 70%)`
              : `linear-gradient(120deg, ${accentColor}18 0%, #f8fafc 70%)`
          }}
        >
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-lg"
              style={{ background: `linear-gradient(145deg, ${accentColor}, ${accentColor}cc)` }}
            >
              AI
            </div>
            <div>
              <h3 className="text-xl font-extrabold tracking-tight" style={{ color: headingColor }}>
                AI Question Generator
              </h3>
              <p className="text-sm font-medium" style={{ color: mutedTextColor }}>
                Create thoughtful, curriculum-aligned questions using AI
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`w-9 h-9 rounded-xl text-xl transition-all ${
              isDarkMode ? 'text-slate-300 hover:bg-slate-700/80' : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            ×
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[62vh]">
          <div
            className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-6 rounded-2xl p-2 border"
            style={{ background: tabSurface, borderColor: accentSoftBorder }}
          >
            <button
              onClick={() => setMode('topic')}
              className={`py-2.5 px-4 rounded-xl text-sm font-bold transition-all duration-200 ${
                mode === 'topic'
                  ? ''
                  : isDarkMode
                    ? 'text-slate-300 hover:bg-slate-800 hover:text-white hover:-translate-y-[1px] hover:shadow'
                    : 'text-slate-600 hover:bg-white hover:text-slate-900 hover:-translate-y-[1px] hover:shadow'
              }`}
              style={mode === 'topic' ? {
                background: `linear-gradient(135deg, ${accentColor}, ${accentColor}d0)`,
                color: '#ffffff',
                boxShadow: '0 8px 16px rgba(0,0,0,0.18)',
                transform: 'translateY(-1px)'
              } : undefined}
            >
              Topic
            </button>
            <button
              onClick={() => setMode('text')}
              className={`py-2.5 px-4 rounded-xl text-sm font-bold transition-all duration-200 ${
                mode === 'text'
                  ? ''
                  : isDarkMode
                    ? 'text-slate-300 hover:bg-slate-800 hover:text-white hover:-translate-y-[1px] hover:shadow'
                    : 'text-slate-600 hover:bg-white hover:text-slate-900 hover:-translate-y-[1px] hover:shadow'
              }`}
              style={mode === 'text' ? {
                background: `linear-gradient(135deg, ${accentColor}, ${accentColor}d0)`,
                color: '#ffffff',
                boxShadow: '0 8px 16px rgba(0,0,0,0.18)',
                transform: 'translateY(-1px)'
              } : undefined}
            >
              Text
            </button>
            <button
              onClick={() => setMode('pdf')}
              className={`py-2.5 px-4 rounded-xl text-sm font-bold transition-all duration-200 ${
                mode === 'pdf'
                  ? ''
                  : isDarkMode
                    ? 'text-slate-300 hover:bg-slate-800 hover:text-white hover:-translate-y-[1px] hover:shadow'
                    : 'text-slate-600 hover:bg-white hover:text-slate-900 hover:-translate-y-[1px] hover:shadow'
              }`}
              style={mode === 'pdf' ? {
                background: `linear-gradient(135deg, ${accentColor}, ${accentColor}d0)`,
                color: '#ffffff',
                boxShadow: '0 8px 16px rgba(0,0,0,0.18)',
                transform: 'translateY(-1px)'
              } : undefined}
            >
              PDF
            </button>
          </div>

          {mode === 'pdf' ? (
            <div className="space-y-4 rounded-2xl border p-4" style={{ borderColor: accentSoftBorder, background: sectionSurface }}>
              <div className="space-y-1.5">
                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`} style={{ color: bodyColor }}>
                  Upload PDF lesson file
                </label>
                <input
                  ref={pdfInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
                <div
                  className={`w-full px-3 py-2.5 rounded-lg border flex items-center gap-3 ${
                    isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-300'
                  }`}
                  style={{ borderColor: borderColor }}
                >
                  <button
                    type="button"
                    onClick={() => pdfInputRef.current?.click()}
                    className="px-3 py-2 rounded-md bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold transition-colors whitespace-nowrap"
                  >
                    Choose File
                  </button>
                  <span
                    className={`text-sm font-medium truncate ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}
                    title={pdfFile?.name || 'No file chosen'}
                  >
                    {pdfFile?.name || 'No file chosen'}
                  </span>
                </div>
                <p className={`text-xs mt-1.5 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`} style={{ color: mutedTextColor }}>
                  The PDF text will be analyzed and converted into quiz questions.
                </p>
                {pdfFile && (
                  <p className={`text-sm mt-2 font-semibold ${isDarkMode ? 'text-emerald-300' : 'text-emerald-700'}`} style={{ color: accentColor }}>
                    Selected: {pdfFile.name}
                  </p>
                )}
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`} style={{ color: bodyColor }}>
                  Topic
                </label>
                <input
                  type="text"
                  value={pdfTopic}
                  onChange={(e) => setPdfTopic(e.target.value)}
                  placeholder="e.g., Photosynthesis, Fractions"
                  className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 ${
                    isDarkMode ? 'bg-slate-900 border-slate-700 placeholder-slate-500' : 'bg-white border-gray-300'
                  }`}
                  style={{
                    borderColor: isDarkMode ? '#334155' : '#cbd5e1',
                    backgroundColor: isDarkMode ? '#0f172a' : '#ffffff',
                    color: isDarkMode ? '#f8fafc' : '#0f172a'
                  }}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`} style={{ color: bodyColor }}>
                  Page Numbers
                </label>
                <input
                  type="text"
                  value={pdfPageNumbers}
                  onChange={(e) => setPdfPageNumbers(e.target.value)}
                  placeholder="e.g., 1-3,5"
                  className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 ${
                    isDarkMode ? 'bg-slate-900 border-slate-700 placeholder-slate-500' : 'bg-white border-gray-300'
                  }`}
                  style={{
                    borderColor: isDarkMode ? '#334155' : '#cbd5e1',
                    backgroundColor: isDarkMode ? '#0f172a' : '#ffffff',
                    color: isDarkMode ? '#f8fafc' : '#0f172a'
                  }}
                />
                <p className={`text-xs mt-1.5 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`} style={{ color: mutedTextColor }}>
                  Use a single page, a range, or comma-separated values (example: 1-3,5)
                </p>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`} style={{ color: bodyColor }}>
                  Number of Questions
                </label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={count}
                  onChange={(e) => setCount(Math.min(20, Math.max(1, parseInt(e.target.value) || 5)))}
                  className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 ${
                    isDarkMode
                      ? 'bg-slate-900 border-slate-700'
                      : 'bg-white border-gray-300'
                  }`}
                  style={{
                    borderColor: isDarkMode ? '#334155' : '#cbd5e1',
                    backgroundColor: isDarkMode ? '#0f172a' : '#ffffff',
                    color: isDarkMode ? '#f8fafc' : '#0f172a'
                  }}
                />
              </div>
            </div>
          ) : mode === 'topic' ? (
            <div className="space-y-4 rounded-2xl border p-4" style={{ borderColor: accentSoftBorder, background: sectionSurface }}>
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`} style={{ color: bodyColor }}>
                  Topic/Concept
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., Photosynthesis, Fractions, Shakespeare..."
                  className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 ${
                    isDarkMode
                      ? 'bg-slate-900 border-slate-700 placeholder-slate-500'
                      : 'bg-white border-gray-300'
                  }`}
                  style={{ borderColor: borderColor, color: inputTextColor, boxShadow: `0 0 0 2px ${accentSoftBorder}` }}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`} style={{ color: bodyColor }}>
                  Subject
                </label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 ${
                    isDarkMode
                      ? 'bg-slate-900 border-slate-700'
                      : 'bg-white border-gray-300'
                  }`}
                  style={{
                    borderColor: isDarkMode ? '#334155' : '#cbd5e1',
                    backgroundColor: isDarkMode ? '#0f172a' : '#ffffff',
                    color: isDarkMode ? '#f8fafc' : '#0f172a'
                  }}
                >
                  <option value="">Select subject</option>
                  {SUBJECTS.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`} style={{ color: bodyColor }}>
                  Difficulty Level
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {DIFFICULTY_LEVELS.map(level => (
                    <button
                      key={level.id}
                      onClick={() => setDifficulty(level.id)}
                      className={`p-2 rounded-lg border text-center text-sm font-semibold transition-all duration-200 ${
                        difficulty === level.id
                          ? ''
                          : isDarkMode
                            ? 'border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white hover:-translate-y-[1px]'
                            : 'border-gray-200 text-slate-700 hover:bg-white hover:text-slate-900 hover:-translate-y-[1px]'
                      }`}
                      style={difficulty === level.id ? {
                        borderColor: accentColor,
                        background: `linear-gradient(135deg, ${accentColor}, ${accentColor}d0)`,
                        color: '#ffffff',
                        boxShadow: '0 8px 16px rgba(0,0,0,0.18)',
                        transform: 'translateY(-1px)'
                      } : undefined}
                    >
                      {level.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`} style={{ color: bodyColor }}>
                  Number of Questions
                </label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={count}
                  onChange={(e) => setCount(Math.min(20, Math.max(1, parseInt(e.target.value) || 5)))}
                  className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 ${
                    isDarkMode
                      ? 'bg-slate-900 border-slate-700 text-white'
                      : 'bg-white border-gray-300 text-[#19475B]'
                  }`}
                  style={{
                    borderColor: isDarkMode ? '#334155' : '#cbd5e1',
                    backgroundColor: isDarkMode ? '#0f172a' : '#ffffff',
                    color: isDarkMode ? '#f8fafc' : '#0f172a'
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border p-4" style={{ borderColor: accentSoftBorder, background: sectionSurface }}>
              <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`} style={{ color: bodyColor }}>
                Source Text
              </label>
              <textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Paste your content here... AI will generate questions based on this text."
                rows={10}
                className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 resize-none ${
                  isDarkMode
                    ? 'bg-slate-900 border-slate-700 placeholder-slate-500'
                    : 'bg-white border-gray-300'
                }`}
                style={{ borderColor: borderColor, color: inputTextColor, boxShadow: `0 0 0 2px ${accentSoftBorder}` }}
              />
              <p className={`text-xs mt-2 ${isDarkMode ? 'text-slate-400' : 'text-gray-400'}`} style={{ color: mutedTextColor }}>
                Paste any educational content, and AI will automatically generate multiple-choice questions.
              </p>
            </div>
          )}
        </div>

        <div className={`p-6 border-t ${isDarkMode ? 'border-slate-700' : 'border-gray-100'} flex flex-wrap justify-end gap-3`}>
          <button
            onClick={onClose}
            className={`flex-1 min-w-[110px] sm:flex-none sm:min-w-[100px] px-3.5 py-2 min-h-[38px] rounded-xl border text-sm font-semibold text-center ${
              isDarkMode ? 'border-slate-700 hover:bg-slate-700 text-slate-200' : 'border-gray-300 hover:bg-gray-100 text-slate-700'
            }`}
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="flex-1 min-w-[165px] sm:flex-none sm:min-w-[175px] px-4 py-2 min-h-[38px] text-white rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-bold text-center"
            style={{
              background: `linear-gradient(135deg, ${accentColor} 0%, ${accentColor}dd 100%)`,
              boxShadow: '0 10px 24px rgba(20, 184, 166, 0.28)'
            }}
          >
            {generating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Generating...
              </>
            ) : (
              <>
                AI Generate Questions
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// AI Improvement Modal
const AIImprovementModal = ({ isOpen, onClose, question, onImproved, isDarkMode }) => {
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
      <div className={`rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden shadow-2xl border-2 ${
        isDarkMode ? 'bg-slate-800/95 backdrop-blur-sm border-teal-500' : 'bg-white border-teal-500'
      }`}>
        <div className={`p-6 border-b flex justify-between items-center ${
          isDarkMode 
            ? 'border-teal-400/30 bg-teal-900/20' 
            : 'border-teal-500/30 bg-gradient-to-r from-teal-50 to-green-50'
        }`}>
          <div className="flex items-center gap-3">
            <span className={`text-3xl ${isDarkMode ? 'text-teal-400' : 'text-teal-600'}`}>AI</span>
            <div>
              <h3 className={`text-xl font-bold ${isDarkMode ? 'text-teal-300' : 'text-[#19475B]'}`}>
                AI Question Improver
              </h3>
              <p className={`text-sm ${isDarkMode ? 'text-teal-300/70' : 'text-[#19475B]/70'}`}>
                Get suggestions to improve your question
              </p>
            </div>
          </div>
          <button onClick={onClose} className={`text-2xl ${isDarkMode ? 'text-slate-400 hover:text-slate-300' : 'text-gray-400 hover:text-gray-600'}`}>
            ×
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {!suggestions ? (
            <div className="text-center py-8">
              <button
                onClick={handleImprove}
                disabled={improving}
                className="px-6 py-3 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-lg hover:from-teal-600 hover:to-teal-700 transition-all shadow-md flex items-center gap-2 mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {improving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Analyzing...
                  </>
                ) : (
                  <>
                    AI Analyze & Improve Question
                  </>
                )}
              </button>
              <p className={`text-sm mt-4 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                AI will analyze your question and suggest improvements for clarity, accuracy, and effectiveness.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className={`rounded-lg p-4 ${isDarkMode ? 'bg-teal-900/20' : 'bg-teal-50'}`}>
                <h4 className={`font-semibold ${isDarkMode ? 'text-teal-400' : 'text-teal-800'} mb-2`}>
                  Quality Score: {suggestions.score}/100
                </h4>
                <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                  <div className="bg-teal-500 rounded-full h-2" style={{ width: `${suggestions.score}%` }}></div>
                </div>
              </div>
              
              {suggestions.improvedQuestion && (
                <div className={`rounded-lg p-4 border ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
                  <h4 className={`font-semibold ${isDarkMode ? 'text-slate-300' : 'text-gray-800'} mb-2`}>
                    Improved Question
                  </h4>
                  <p className={isDarkMode ? 'text-slate-200' : 'text-gray-700'}>{suggestions.improvedQuestion}</p>
                  <button
                    onClick={() => applySuggestion('question')}
                    className="mt-2 text-sm text-teal-500 hover:text-teal-600 font-medium"
                  >
                    Apply this improvement →
                  </button>
                </div>
              )}
              
              {suggestions.suggestedDistractors && (
                <div className={`rounded-lg p-4 border ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
                  <h4 className={`font-semibold ${isDarkMode ? 'text-slate-300' : 'text-gray-800'} mb-2`}>
                    Suggested Distractors
                  </h4>
                  <div className="space-y-2">
                    {suggestions.suggestedDistractors.map((distractor, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-sm ${
                          isDarkMode ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {String.fromCharCode(66 + idx)}
                        </span>
                        <span className={isDarkMode ? 'text-slate-200' : 'text-gray-700'}>{distractor}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {suggestions.hint && (
                <div className={`rounded-lg p-4 ${isDarkMode ? 'bg-blue-900/20' : 'bg-blue-50'}`}>
                  <h4 className={`font-semibold ${isDarkMode ? 'text-blue-400' : 'text-blue-800'} mb-2`}>
                    Hint for Students
                  </h4>
                  <p className={isDarkMode ? 'text-blue-300' : 'text-blue-700'}>{suggestions.hint}</p>
                </div>
              )}
              
              {suggestions.issues && suggestions.issues.length > 0 && (
                <div className={`rounded-lg p-4 ${isDarkMode ? 'bg-yellow-900/20' : 'bg-yellow-50'}`}>
                  <h4 className={`font-semibold ${isDarkMode ? 'text-yellow-400' : 'text-yellow-800'} mb-2`}>
                    Issues Detected
                  </h4>
                  <ul className="list-disc list-inside space-y-1">
                    {suggestions.issues.map((issue, idx) => (
                      <li key={idx} className={`text-sm ${isDarkMode ? 'text-yellow-300' : 'text-yellow-700'}`}>
                        {issue}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className={`p-6 border-t ${isDarkMode ? 'border-slate-700' : 'border-gray-100'} flex justify-end gap-3`}>
          <button onClick={onClose} className={`px-4 py-2 rounded-lg border ${
            isDarkMode ? 'border-slate-700 text-slate-300 hover:bg-slate-700' : 'border-gray-300 text-gray-600 hover:bg-gray-100'
          }`}>
            Close
          </button>
          {suggestions && (
            <button
              onClick={() => applySuggestion('all')}
              className="px-6 py-2 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-lg hover:from-teal-600 hover:to-teal-700 transition-all shadow-md"
            >
              Apply All Improvements
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Preview Modal Component
const PreviewModal = ({ isOpen, onClose, quiz, questions, onConfirm, isDarkMode }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  if (!isOpen) return null;
  
  const currentQuestion = questions[currentIndex];
  
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className={`rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl border-2 ${
        isDarkMode ? 'bg-slate-800/95 backdrop-blur-sm border-teal-500' : 'bg-white border-teal-500'
      }`}>
        <div className={`p-6 border-b flex justify-between items-center ${
          isDarkMode 
            ? 'border-teal-400/30 bg-teal-900/20' 
            : 'border-teal-500/30 bg-gradient-to-r from-teal-50 to-emerald-50'
        }`}>
          <div>
            <h3 className={`text-xl font-bold ${isDarkMode ? 'text-teal-300' : 'text-[#19475B]'}`}>
              Preview Quiz
            </h3>
            <p className={`text-sm mt-1 ${isDarkMode ? 'text-teal-300/70' : 'text-[#19475B]/70'}`}>
              {quiz.title || 'Untitled Quiz'}
            </p>
          </div>
          <button onClick={onClose} className={`text-2xl ${isDarkMode ? 'text-slate-400 hover:text-slate-300' : 'text-gray-400 hover:text-gray-600'} transition-colors`}>
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
                  idx === currentIndex ? 'bg-teal-500' : isDarkMode ? 'bg-slate-700 hover:bg-slate-600' : 'bg-gray-200 hover:bg-gray-300'
                }`}
              />
            ))}
          </div>
          
          <div className={`rounded-xl p-6 border ${isDarkMode ? 'bg-slate-900/50 border-slate-700' : 'bg-gray-50 border-gray-100'}`}>
            <div className={`text-sm font-medium mb-4 flex items-center gap-2 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                isDarkMode ? 'bg-teal-900/50 text-teal-400' : 'bg-teal-100 text-teal-600'
              }`}>
                {currentIndex + 1}
              </span>
              Question {currentIndex + 1} of {questions.length}
            </div>
            <div 
              className={`mb-4 prose prose-sm max-w-none ${isDarkMode ? 'text-slate-200' : 'text-gray-800'}`}
              dangerouslySetInnerHTML={{ __html: renderFormattedText(currentQuestion?.question || '') }}
            />
            {currentQuestion?.questionImage && (
              <div className="mt-3 mb-4">
                <img src={currentQuestion.questionImage} alt="Question" className="max-h-40 rounded-lg border border-gray-200 dark:border-slate-700" />
              </div>
            )}
            <div className="space-y-2 mt-4">
              {currentQuestion?.options.map((opt, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg border ${
                    isDarkMode 
                      ? 'bg-slate-800 border-slate-700 hover:bg-slate-700' 
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                  } transition-colors`}
                >
                  <span className={`font-semibold mr-3 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                    {String.fromCharCode(65 + idx)}.
                  </span>
                  <span className={isDarkMode ? 'text-slate-200' : 'text-gray-800'}>{opt}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className={`p-6 border-t ${isDarkMode ? 'border-slate-700 bg-slate-900/50' : 'border-gray-100 bg-gray-50'} flex justify-end gap-3`}>
          <button onClick={onClose} className={`px-4 py-2 rounded-lg border ${
            isDarkMode ? 'border-slate-700 text-slate-300 hover:bg-slate-700' : 'border-gray-300 text-gray-600 hover:bg-gray-100'
          } transition-all`}>
            Cancel
          </button>
          <button onClick={onConfirm} className="px-6 py-2 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-lg hover:from-teal-600 hover:to-teal-700 transition-all shadow-md">
            Publish Quiz
          </button>
        </div>
      </div>
    </div>
  );
};

// Bulk Import Modal
const BulkImportModal = ({ isOpen, onClose, onImportComplete, isDarkMode }) => {
  const [file, setFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [extractedQuestions, setExtractedQuestions] = useState([]);
  const [processingStep, setProcessingStep] = useState('upload');
  const [dragActive, setDragActive] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [editForm, setEditForm] = useState({ question: '', options: [], correctAnswer: '' });
  const [showReformatWarning, setShowReformatWarning] = useState(false);
  const [useAISmartReformat, setUseAISmartReformat] = useState(true);
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
          toast.success(`Extracted ${reformattedQuestions.length} questions (${reformattedCount + frontendReformatted} reformatted, ${incompleteCount + frontendIncomplete} completed)`);
        } else {
          toast.success(`Successfully extracted ${reformattedQuestions.length} questions`);
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
    toast.success(`Reformatted ${reformattedCount} questions, completed ${incompleteCount} incomplete sets`);
  };

  const applyAISmartReformat = async (questions) => {
    let aiEnhancedCount = 0;

    const enhanced = await Promise.all(questions.map(async (q) => {
      const next = { ...q, options: Array.isArray(q.options) ? [...q.options] : [] };

      if (next.options.length >= 2) {
        const reformatted = await AIQuestionImprover.reformatOptions(next.options);
        if (Array.isArray(reformatted) && reformatted.length >= 2) {
          if (JSON.stringify(reformatted) !== JSON.stringify(next.options)) {
            aiEnhancedCount += 1;
          }
          next.options = reformatted;

          if (next.correctAnswer && !next.options.includes(next.correctAnswer)) {
            const cleanCorrect = String(next.correctAnswer)
              .replace(/^[A-Da-d][\.\)\-:\s]*/g, '')
              .trim()
              .toLowerCase();
            const matchingOption = next.options.find((opt) => String(opt)
              .replace(/^[A-Da-d][\.\)\-:\s]*/g, '')
              .trim()
              .toLowerCase() === cleanCorrect);
            if (matchingOption) {
              next.correctAnswer = matchingOption;
            }
          }

          if (!next.correctAnswer && next.options[0]) {
            next.correctAnswer = next.options[0];
          }
        }
      }

      const validation = await AIQuestionImprover.validateQuestion(next.question, next.options, next.correctAnswer);
      if (validation?.score >= 0 && validation.score < 40) {
        // Keep question but flag low quality by appending a short marker for review visibility.
        next.question = `${next.question} [Needs Review]`;
      }

      return next;
    }));

    return { enhanced, aiEnhancedCount };
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

  const reorganizeQuestions = async () => {
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

    let aiEnhancedCount = 0;
    if (useAISmartReformat && organized.length > 0) {
      const loadingToast = toast.loading('Applying AI smart reformat...');
      try {
        const { enhanced, aiEnhancedCount: enhancedCount } = await applyAISmartReformat(organized);
        organized = enhanced;
        aiEnhancedCount = enhancedCount;
      } finally {
        toast.dismiss(loadingToast);
      }
    }
    
    setExtractedQuestions(organized);
    setStats(prev => ({
      ...prev,
      duplicatesRemoved,
      invalidRemoved,
      finalCount: organized.length
    }));
    
    if (aiEnhancedCount > 0) {
      toast.success(`Reorganized: ${organized.length} questions ready (${aiEnhancedCount} AI-enhanced)`);
    } else {
      toast.success(`Reorganized: ${organized.length} valid questions ready`);
    }
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
    setUseAISmartReformat(true);
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
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4" onClick={onClose}>
      <div className={`rounded-3xl w-full max-w-4xl h-[82vh] max-h-[82vh] flex flex-col shadow-2xl border ${
        isDarkMode ? 'bg-slate-900/95 border-teal-400/40' : 'bg-white border-teal-200'
      }`} onClick={(e) => e.stopPropagation()}>
        <div className={`flex-shrink-0 p-6 border-b rounded-t-3xl ${
          isDarkMode 
            ? 'border-slate-700 bg-gradient-to-r from-teal-900/20 to-slate-900' 
            : 'border-teal-100 bg-gradient-to-r from-teal-50 via-emerald-50 to-white'
        }`}>
          <div className="flex justify-between items-center">
            <div>
              <h3 className={`text-2xl font-extrabold tracking-tight flex items-center gap-3 ${isDarkMode ? 'text-teal-200' : 'text-[#19475B]'}`}>
                <span className="h-11 w-11 rounded-2xl flex items-center justify-center bg-gradient-to-br from-teal-500 to-emerald-500 text-white text-xl shadow-md">📥</span>
                Bulk Import Questions
              </h3>
              <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-400' : 'text-[#19475B]/70'}`}>
                Upload a file, review extracted content, then import polished questions.
              </p>
            </div>
            <button 
              onClick={() => { resetModal(); onClose(); }} 
              className={`text-2xl transition-colors w-10 h-10 rounded-full flex items-center justify-center ${
                isDarkMode ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800' : 'text-gray-400 hover:text-gray-700 hover:bg-white'
              }`}
            >
              ×
            </button>
          </div>
        </div>
        
        <div className="flex-shrink-0 px-6 pt-6">
          <div className={`flex mb-4 rounded-2xl p-2 ${isDarkMode ? 'bg-slate-800/60' : 'bg-slate-100'}`}>
            {['upload', 'organize', 'review'].map((step, idx) => (
              <div key={step} className="flex-1 relative">
                <div className={`flex items-center justify-center w-10 h-10 mx-auto rounded-full border-2 transition-all ${
                  processingStep === step 
                    ? 'border-teal-500 bg-teal-500 text-white shadow-lg' 
                    : (step === 'upload' && file && processingStep !== 'upload') ||
                      (step === 'organize' && (processingStep === 'review' || (extractedQuestions.length > 0 && processingStep !== 'organize')))
                      ? 'border-green-500 bg-green-500 text-white'
                      : isDarkMode ? 'border-slate-700 bg-slate-900 text-slate-400' : 'border-gray-300 bg-white text-gray-400'
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
                <div className={`text-center mt-2 text-xs font-semibold tracking-wide uppercase ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  {step}
                </div>
                {idx < 2 && (
                  <div className={`absolute top-5 left-1/2 w-full h-0.5 transition-all ${
                    (step === 'upload' && file && processingStep !== 'upload') ||
                    (step === 'organize' && processingStep === 'review')
                      ? 'bg-green-500' : isDarkMode ? 'bg-slate-700' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>
        
        <div className={`flex-1 min-h-0 overflow-y-auto px-6 py-4 ${isDarkMode ? 'bg-slate-900/40' : 'bg-white'}`}>
          {processingStep === 'upload' && (
            <div className="space-y-6">
              <div 
                className={`border-2 border-dashed rounded-3xl p-10 text-center transition-all cursor-pointer ${
                  dragActive 
                    ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20 shadow-md' 
                    : isDarkMode 
                      ? 'border-slate-700 hover:border-teal-400 bg-slate-900/60' 
                      : 'border-slate-200 hover:border-teal-400 bg-gradient-to-b from-white to-slate-50'
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
                <label htmlFor="bulkFile" className="cursor-pointer flex flex-col items-center gap-5">
                  <div className={`w-24 h-24 rounded-full flex items-center justify-center transition-all ${
                    file ? 'bg-green-100 dark:bg-green-900/30' : 'bg-teal-100 dark:bg-teal-900/30'
                  }`}>
                    {file ? (
                      <svg className="w-12 h-12 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ) : (
                      <svg className="w-12 h-12 text-teal-600 dark:text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                      </svg>
                    )}
                  </div>
                  <div className="text-center w-full max-w-md px-2">
                    <p className={`font-semibold text-base sm:text-lg leading-snug break-words whitespace-normal ${isDarkMode ? 'text-slate-100' : 'text-gray-800'}`}>
                      {file ? file.name : 'Drag & drop or click to upload'}
                    </p>
                    <p className={`text-sm mt-2 leading-6 break-words whitespace-normal ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                      Supports PDF, CSV, and DOCX files (Max 10MB)
                    </p>
                  </div>
                </label>
              </div>
              
              <div className={`rounded-2xl p-5 border ${isDarkMode ? 'bg-slate-900/70 border-slate-700' : 'bg-sky-50 border-sky-100'}`}>
                <div className="flex items-start gap-4">
                  <span className="text-2xl">ℹ️</span>
                  <div>
                    <h4 className={`font-semibold mb-2 ${isDarkMode ? 'text-sky-300' : 'text-sky-800'}`}>
                      File Format Guidelines
                    </h4>
                    <ul className={`grid gap-2 text-sm ${isDarkMode ? 'text-sky-200' : 'text-sky-700'}`}>
                      <li>Each question should be clearly numbered, for example 1. or 2.</li>
                      <li>Options should be labeled A., B., C., and D.</li>
                      <li>Correct answers can be marked with **, ✓, or (correct).</li>
                      <li>CSV format: question, option_a, option_b, option_c, option_d, correct_answer.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {processingStep === 'organize' && !importing && extractedQuestions.length > 0 && (
            <div className="space-y-6">
              <div className={`rounded-2xl p-5 border ${
                isDarkMode 
                  ? 'bg-amber-900/20 border-amber-800' 
                  : 'bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200'
              }`}>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">⚙️</span>
                  <div className="flex-1">
                    <h4 className={`font-semibold mb-3 ${isDarkMode ? 'text-amber-400' : 'text-amber-800'}`}>
                      Organization Options
                    </h4>
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      <label className={`flex min-h-[72px] items-start justify-between gap-4 rounded-xl p-3 cursor-pointer hover:shadow-md transition ${
                        isDarkMode ? 'bg-slate-900 hover:bg-slate-800' : 'bg-white hover:shadow-md'
                      }`}>
                        <span className={`text-sm leading-5 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                          Remove duplicate questions
                        </span>
                        <input
                          type="checkbox"
                          checked={organizeOptions.removeDuplicates}
                          onChange={(e) => setOrganizeOptions({...organizeOptions, removeDuplicates: e.target.checked})}
                          className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                        />
                      </label>
                      <label className={`flex min-h-[72px] items-start justify-between gap-4 rounded-xl p-3 cursor-pointer hover:shadow-md transition ${
                        isDarkMode ? 'bg-slate-900 hover:bg-slate-800' : 'bg-white hover:shadow-md'
                      }`}>
                        <span className={`text-sm leading-5 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                          Auto-correct format
                        </span>
                        <input
                          type="checkbox"
                          checked={organizeOptions.autoCorrectFormat}
                          onChange={(e) => setOrganizeOptions({...organizeOptions, autoCorrectFormat: e.target.checked})}
                          className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                        />
                      </label>
                      <label className={`flex min-h-[72px] items-start justify-between gap-4 rounded-xl p-3 cursor-pointer hover:shadow-md transition ${
                        isDarkMode ? 'bg-slate-900 hover:bg-slate-800' : 'bg-white hover:shadow-md'
                      }`}>
                        <span className={`text-sm leading-5 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                          Sort by difficulty
                        </span>
                        <input
                          type="checkbox"
                          checked={organizeOptions.sortByDifficulty}
                          onChange={(e) => setOrganizeOptions({...organizeOptions, sortByDifficulty: e.target.checked})}
                          className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                        />
                      </label>
                      <label className={`flex min-h-[72px] items-start justify-between gap-4 rounded-xl p-3 cursor-pointer hover:shadow-md transition ${
                        isDarkMode ? 'bg-slate-900 hover:bg-slate-800' : 'bg-white hover:shadow-md'
                      }`}>
                        <span className={`text-sm leading-5 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                          Validate answers
                        </span>
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
              
              <div className={`rounded-2xl p-4 border ${isDarkMode ? 'bg-teal-900/20 border-teal-800' : 'bg-teal-50 border-teal-200'}`}>
                <label className="flex items-center justify-between gap-4 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🤖</span>
                    <div>
                      <span className={`text-sm font-medium ${isDarkMode ? 'text-teal-400' : 'text-teal-800'}`}>
                        Use AI Smart Reformat
                      </span>
                      <p className={`text-xs ${isDarkMode ? 'text-teal-400/70' : 'text-teal-600'}`}>
                        AI will intelligently fix malformed options
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={useAISmartReformat}
                    onChange={(e) => setUseAISmartReformat(e.target.checked)}
                    className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                  />
                </label>
              </div>
              
              <div className={`rounded-2xl overflow-hidden border ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
                <div className={`px-5 py-3 border-b font-semibold flex items-center justify-between ${
                  isDarkMode ? 'bg-slate-900/50 border-slate-700 text-slate-300' : 'bg-gray-50 border-gray-200 text-gray-700'
                }`}>
                  <span>Preview First 3 Questions</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${isDarkMode ? 'bg-slate-700 text-slate-400' : 'bg-gray-200 text-gray-500'}`}>
                    {extractedQuestions.length} total
                  </span>
                </div>
                <div className={`p-4 space-y-4 max-h-96 overflow-y-auto ${isDarkMode ? 'bg-slate-900/50' : 'bg-white'}`}>
                  {extractedQuestions.slice(0, 3).map((q, idx) => (
                    <div key={idx} className={`rounded-xl border p-4 last:mb-0 ${isDarkMode ? 'border-slate-700 bg-slate-950/40' : 'border-gray-200 bg-gray-50/60'}`}>
                      <p className={`font-semibold mb-3 leading-6 ${isDarkMode ? 'text-slate-100' : 'text-gray-800'}`}>
                        {idx + 1}. {q.question}
                      </p>
                      <div className="space-y-2">
                        {q.options?.map((opt, optIdx) => (
                          <div key={optIdx} className={`flex items-start gap-3 rounded-lg px-3 py-2 text-sm ${
                            q.correctAnswer === opt
                              ? isDarkMode ? 'bg-emerald-900/20' : 'bg-emerald-50'
                              : isDarkMode ? 'bg-slate-900/70' : 'bg-white'
                          }`}>
                            <span className={`mt-0.5 flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                              q.correctAnswer === opt 
                                ? 'bg-green-500 text-white' 
                                : isDarkMode ? 'bg-slate-700 text-slate-400' : 'bg-gray-100 text-gray-600'
                            }`}>
                              {String.fromCharCode(65 + optIdx)}
                            </span>
                            <span className={`flex-1 leading-6 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                              {opt || '—'}
                            </span>
                            {q.correctAnswer === opt && (
                              <span className="text-xs font-semibold text-green-600 dark:text-green-400">Correct</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  {extractedQuestions.length > 3 && (
                    <div className={`text-center text-sm py-2 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                      + {extractedQuestions.length - 3} more questions
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {processingStep === 'review' && extractedQuestions.length > 0 && !importing && (
            <div className="space-y-6">
              {showReformatWarning && (stats.reformatted > 0 || stats.incomplete > 0) && (
                <div className={`rounded-2xl p-4 border ${isDarkMode ? 'bg-amber-900/20 border-amber-800' : 'bg-amber-50 border-amber-200'}`}>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">⚠️</span>
                    <div className="flex-1">
                      <p className={`text-sm font-semibold ${isDarkMode ? 'text-amber-400' : 'text-amber-800'}`}>
                        {stats.reformatted} question(s) reformatted, {stats.incomplete} incomplete set(s) completed.
                      </p>
                      <p className={`text-xs mt-1 ${isDarkMode ? 'text-amber-400/70' : 'text-amber-700'}`}>
                        Example: "A 1972 C. 1974 B 1973 D. 1975" → "A. 1972, B. 1973, C. 1974, D. 1975"
                      </p>
                      <button
                        onClick={manualReformatAll}
                        className="mt-2 px-3 py-1 text-xs bg-amber-600 text-white rounded hover:bg-amber-700 transition-all"
                      >
                        Reformat All Questions
                      </button>
                    </div>
                    <button onClick={() => setShowReformatWarning(false)} className="text-amber-500 hover:text-amber-700">
                      ✕
                    </button>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
                <div className={`rounded-2xl p-3 text-center border ${
                  isDarkMode ? 'bg-green-900/20 border-green-800' : 'bg-gradient-to-br from-green-50 to-green-100 border-green-200'
                }`}>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.totalExtracted}</div>
                  <div className={`text-xs ${isDarkMode ? 'text-green-400/70' : 'text-green-700'}`}>Extracted</div>
                </div>
                <div className={`rounded-2xl p-3 text-center border ${
                  isDarkMode ? 'bg-purple-900/20 border-purple-800' : 'bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200'
                }`}>
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.reformatted}</div>
                  <div className={`text-xs ${isDarkMode ? 'text-purple-400/70' : 'text-purple-700'}`}>Reformatted</div>
                </div>
                <div className={`rounded-2xl p-3 text-center border ${
                  isDarkMode ? 'bg-orange-900/20 border-orange-800' : 'bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200'
                }`}>
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.incomplete}</div>
                  <div className={`text-xs ${isDarkMode ? 'text-orange-400/70' : 'text-orange-700'}`}>Completed</div>
                </div>
                <div className={`rounded-2xl p-3 text-center border ${
                  isDarkMode ? 'bg-yellow-900/20 border-yellow-800' : 'bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200'
                }`}>
                  <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.duplicatesRemoved}</div>
                  <div className={`text-xs ${isDarkMode ? 'text-yellow-400/70' : 'text-yellow-700'}`}>Duplicates</div>
                </div>
                <div className={`rounded-2xl p-3 text-center border ${
                  isDarkMode ? 'bg-red-900/20 border-red-800' : 'bg-gradient-to-br from-red-50 to-red-100 border-red-200'
                }`}>
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.invalidRemoved}</div>
                  <div className={`text-xs ${isDarkMode ? 'text-red-400/70' : 'text-red-700'}`}>Invalid</div>
                </div>
                <div className={`rounded-2xl p-3 text-center border ${
                  isDarkMode ? 'bg-blue-900/20 border-blue-800' : 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200'
                }`}>
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{extractedQuestions.length}</div>
                  <div className={`text-xs ${isDarkMode ? 'text-blue-400/70' : 'text-blue-700'}`}>Current</div>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={addNewQuestion}
                  className="px-4 py-2 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-xl hover:from-teal-600 hover:to-teal-700 transition-all flex items-center gap-2 text-sm shadow-md"
                >
                  <span className="text-lg">+</span> Add New Question
                </button>
                <button
                  onClick={manualReformatAll}
                  className="px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all flex items-center gap-2 text-sm shadow-md"
                >
                  Reformat All Options
                </button>
                <button
                  onClick={() => setProcessingStep('organize')}
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl hover:from-amber-600 hover:to-amber-700 transition-all flex items-center gap-2 text-sm shadow-md"
                >
                  Batch Organize
                </button>
              </div>
              
              <div className={`rounded-2xl overflow-hidden border ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
                <div className={`px-5 py-3 border-b font-semibold flex items-center justify-between sticky top-0 ${
                  isDarkMode ? 'bg-slate-900/50 border-slate-700 text-slate-300' : 'bg-gray-50 border-gray-200 text-gray-700'
                }`}>
                  <span>All Questions ({extractedQuestions.length})</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${isDarkMode ? 'bg-teal-900/30 text-teal-400' : 'bg-teal-100 text-teal-600'}`}>
                    Click Edit to edit each question
                  </span>
                </div>
                <div className={`divide-y max-h-96 overflow-y-auto ${isDarkMode ? 'bg-slate-900/50 divide-slate-700' : 'bg-white divide-gray-200'}`}>
                  {extractedQuestions.map((q, idx) => (
                    <div key={q.id} className={`p-4 transition-colors ${isDarkMode ? 'hover:bg-slate-800/50' : 'hover:bg-gray-50'}`}>
                      {editingQuestion?.id === q.id ? (
                        <div className="space-y-3">
                          <div>
                            <label className={`text-xs font-semibold block mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                              Question Text
                            </label>
                            <textarea
                              value={editForm.question}
                              onChange={(e) => setEditForm({ ...editForm, question: e.target.value })}
                              className={`w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                                isDarkMode 
                                  ? 'bg-slate-900 border-slate-700 text-white' 
                                  : 'bg-white border-gray-300 text-[#19475B]'
                              } border`}
                              rows="2"
                              placeholder="Enter your question..."
                            />
                          </div>
                          <div>
                            <label className={`text-xs font-semibold block mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                              Options
                            </label>
                            {editForm.options.map((opt, optIdx) => (
                              <div key={optIdx} className="flex items-center gap-2 mb-2">
                                <span className={`w-8 text-sm font-bold ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                                  {String.fromCharCode(65 + optIdx)}.
                                </span>
                                <input
                                  type="text"
                                  value={opt}
                                  onChange={(e) => {
                                    const newOptions = [...editForm.options];
                                    newOptions[optIdx] = e.target.value;
                                    setEditForm({ ...editForm, options: newOptions });
                                  }}
                                  className={`flex-1 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                                    isDarkMode 
                                      ? 'bg-slate-900 border-slate-700 text-white' 
                                      : 'bg-white border-gray-300 text-[#19475B]'
                                  } border`}
                                  placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                                />
                                <button
                                  onClick={() => {
                                    const newOptions = [...editForm.options];
                                    newOptions[optIdx] = '';
                                    setEditForm({ ...editForm, options: newOptions });
                                  }}
                                  className={`transition-colors ${isDarkMode ? 'text-slate-400 hover:text-red-400' : 'text-gray-400 hover:text-red-500'}`}
                                >
                                  Delete
                                </button>
                              </div>
                            ))}
                          </div>
                          <div>
                            <label className={`text-xs font-semibold block mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                              Correct Answer
                            </label>
                            <select
                              value={editForm.correctAnswer}
                              onChange={(e) => setEditForm({ ...editForm, correctAnswer: e.target.value })}
                              className={`w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                                isDarkMode 
                                  ? 'bg-slate-900 border-slate-700 text-white' 
                                  : 'bg-white border-gray-300 text-[#19475B]'
                              } border`}
                            >
                              <option value="">Select correct answer</option>
                              {editForm.options.map((opt, optIdx) => (
                                opt && opt.trim() && <option key={optIdx} value={opt}>
                                  {String.fromCharCode(65 + optIdx)}. {opt}
                                </option>
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
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                            isDarkMode ? 'bg-teal-900/50 text-teal-400' : 'bg-teal-100 text-teal-700'
                          }`}>
                            {idx + 1}
                          </div>
                          <div className="flex-1">
                            <p className={`font-medium ${isDarkMode ? 'text-slate-200' : 'text-gray-800'}`}>
                              {q.question || '(No question text)'}
                            </p>
                            <div className="grid grid-cols-2 gap-2 mt-2">
                              {q.options?.map((opt, optIdx) => (
                                <div key={optIdx} className="text-sm flex items-center gap-2">
                                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium ${
                                    q.correctAnswer === opt 
                                      ? 'bg-green-500 text-white' 
                                      : isDarkMode ? 'bg-slate-700 text-slate-400' : 'bg-gray-100 text-gray-600'
                                  }`}>
                                    {String.fromCharCode(65 + optIdx)}
                                  </span>
                                  <span className={`flex-1 truncate ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                                    {opt || '—'}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => startEditing(q)}
                              className={`p-1.5 rounded-lg transition-colors ${
                                isDarkMode ? 'hover:bg-blue-900/30 text-blue-400' : 'hover:bg-blue-50 text-blue-600'
                              }`}
                              title="Edit question"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => deleteQuestion(q.id)}
                              className={`p-1.5 rounded-lg transition-colors ${
                                isDarkMode ? 'hover:bg-red-900/30 text-red-400' : 'hover:bg-red-50 text-red-600'
                              }`}
                              title="Delete question"
                            >
                              Delete
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
          
          {importing && (
            <div className="text-center py-16">
              <div className="inline-block w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
              <p className={`mt-6 font-medium text-lg ${isDarkMode ? 'text-slate-200' : 'text-gray-700'}`}>
                Extracting questions from file...
              </p>
              <p className={`text-sm mt-2 ${isDarkMode ? 'text-slate-400' : 'text-gray-400'}`}>
                This may take a moment for large files
              </p>
              <div className="mt-4 w-64 h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden mx-auto">
                <div className="h-full bg-teal-500 rounded-full animate-pulse" style={{ width: '60%' }}></div>
              </div>
            </div>
          )}
        </div>
        
        <div className={`flex-shrink-0 p-5 border-t rounded-b-3xl ${
          isDarkMode ? 'border-slate-700 bg-slate-900/70' : 'border-slate-200 bg-slate-50/90'
        }`}>
          <div className="flex justify-between items-center gap-3">
            <div>
              {processingStep !== 'upload' && !importing && extractedQuestions.length > 0 && (
                <button 
                  onClick={goToPreviousStep} 
                  className={`px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-all ${
                    isDarkMode 
                      ? 'border-slate-700 text-slate-300 hover:bg-slate-700' 
                      : 'border-gray-300 text-gray-600 hover:bg-gray-100'
                  } border`}
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
                className={`px-5 py-2.5 rounded-xl font-medium transition-all ${
                  isDarkMode 
                    ? 'border-slate-700 text-slate-300 hover:bg-slate-700' 
                    : 'border-gray-300 text-gray-600 hover:bg-gray-100'
                } border`}
              >
                Cancel
              </button>
              
              {processingStep === 'upload' && file && !importing && (
                <button 
                  onClick={extractQuestions} 
                  className="px-6 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-600 text-white rounded-xl hover:from-teal-600 hover:to-emerald-700 transition-all font-semibold shadow-md flex items-center gap-2"
                >
                  Extract Questions
                </button>
              )}
              
              {processingStep === 'upload' && !file && !importing && (
                <button disabled className="px-6 py-2.5 bg-gray-300 dark:bg-slate-700 text-gray-500 dark:text-slate-400 rounded-lg font-medium cursor-not-allowed">
                  Select a file first
                </button>
              )}
              
              {processingStep === 'organize' && !importing && extractedQuestions.length > 0 && (
                <>
                  <button 
                    onClick={reorganizeQuestions} 
                    className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl hover:from-amber-600 hover:to-orange-700 transition-all font-semibold shadow-md flex items-center gap-2"
                  >
                    Apply Organization
                  </button>
                  <button 
                    onClick={() => setProcessingStep('review')} 
                    className="px-6 py-2.5 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-xl hover:from-teal-600 hover:to-cyan-700 transition-all font-semibold shadow-md flex items-center gap-2"
                  >
                    Skip & Continue
                  </button>
                </>
              )}
              
              {processingStep === 'review' && !importing && (
                <button 
                  onClick={confirmImport} 
                  disabled={extractedQuestions.filter(q => q.question && q.correctAnswer).length === 0}
                  className="px-6 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all font-semibold shadow-md flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
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

// Question Card Component
const QuestionCard = memo(({ 
  question, index, onUpdate, onRemove, onDuplicate, onImageUpload, onImageRemove, isDarkMode 
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
        isDarkMode={isDarkMode}
      />
      
      <div className={`rounded-xl overflow-hidden border transition-shadow ${
        isDarkMode 
          ? 'bg-slate-900/50 border-slate-700 hover:border-teal-500/30' 
          : 'bg-white border-gray-200 hover:shadow-md'
      }`}>
        <div className={`px-4 py-3 border-b flex items-center justify-between ${
          isDarkMode 
            ? 'bg-slate-800/50 border-slate-700' 
            : 'bg-gradient-to-r from-gray-50 to-white border-gray-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-r from-teal-500 to-teal-600 text-white flex items-center justify-center text-sm font-bold shadow-sm">
              {index + 1}
            </div>
            <div className={`flex gap-1 rounded-lg p-0.5 ${isDarkMode ? 'bg-slate-700' : 'bg-gray-100'}`}>
              {QUESTION_LAYOUTS.map(layout => (
                <button
                  key={layout.id}
                  onClick={() => handleLayoutChange(layout.id)}
                  className={`px-2 py-1 text-xs rounded transition-all flex items-center gap-1 ${
                    question.layout === layout.id 
                      ? isDarkMode ? 'bg-teal-600 text-white shadow-sm' : 'bg-white shadow-sm text-gray-800'
                      : isDarkMode ? 'text-slate-400 hover:text-slate-300' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {layout.icon} <span className="hidden sm:inline">{layout.name}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-1">
            <button 
              onClick={() => setShowAIImprove(true)}
              className={`p-1.5 rounded-lg transition-colors ${
                isDarkMode ? 'hover:bg-teal-900/30 text-teal-400' : 'hover:bg-teal-50 text-teal-500'
              }`}
              title="AI Improve"
            >
              AI
            </button>
            <button 
              onClick={() => setPreview(!preview)} 
              className={`p-1.5 rounded-lg transition-colors ${
                isDarkMode ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-gray-200 text-gray-500'
              }`}
              title={preview ? 'Edit mode' : 'Preview mode'}
            >
              {preview ? 'Edit' : 'Preview'}
            </button>
            <button 
              onClick={() => onDuplicate(index)} 
              className={`p-1.5 rounded-lg transition-colors ${
                isDarkMode ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-gray-200 text-gray-500'
              }`}
              title="Duplicate"
            >
              Copy
            </button>
            <button 
              onClick={() => setIsExpanded(!isExpanded)} 
              className={`p-1.5 rounded-lg transition-colors ${
                isDarkMode ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-gray-200 text-gray-500'
              }`}
              title={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? '−' : '+'}
            </button>
            <button 
              onClick={() => onRemove(index)} 
              className={`p-1.5 rounded-lg transition-colors ${
                isDarkMode ? 'hover:bg-red-900/30 text-slate-400 hover:text-red-400' : 'hover:bg-red-100 text-gray-500 hover:text-red-600'
              }`}
              title="Remove"
            >
              ×
            </button>
          </div>
        </div>
        
        {isExpanded && (
          <div className="p-5 space-y-4">
            <div>
              <label className={`text-xs font-semibold block mb-2 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                Question Text <span className="text-red-500">*</span>
                <span className={`text-[10px] font-normal ml-2 ${isDarkMode ? 'text-slate-400' : 'text-gray-400'}`}>
                  (Use __text__ for underline, **text** for bold, *text* for italic)
                </span>
              </label>
              {!preview ? (
                <textarea
                  value={question.question}
                  onChange={(e) => handleQuestionChange(e.target.value)}
                  placeholder="Enter your question..."
                  rows={3}
                  className={`w-full px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all font-mono ${
                    isDarkMode 
                      ? 'bg-slate-900 border-slate-700 text-white' 
                      : 'bg-white border-gray-300 text-[#19475B]'
                  } border`}
                />
              ) : (
                <div 
                  className={`p-3 rounded-lg text-sm prose prose-sm max-w-none border ${
                    isDarkMode ? 'bg-slate-900/50 border-slate-700 text-slate-200' : 'bg-gray-50 border-gray-200'
                  }`}
                  dangerouslySetInnerHTML={{ __html: renderFormattedText(question.question) || '<span class="text-gray-400">Preview will appear here...</span>' }}
                />
              )}
            </div>
            
            <div>
              <label className={`text-xs font-semibold block mb-2 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                Image (optional)
              </label>
              {!question.questionImage ? (
                <label className={`block border-2 border-solid rounded-lg p-4 text-center cursor-pointer hover:border-teal-400 transition-all ${
                  isDarkMode ? 'bg-slate-900/50 border-slate-700' : 'bg-gray-50/30 border-gray-300'
                }`}>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={(e) => onImageUpload(e, index)} 
                    className="hidden" 
                  />
                  <div className="flex flex-col items-center gap-2">
                    <svg className={`w-8 h-8 ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                      Click to upload image
                    </span>
                    <span className={`text-[10px] ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
                      PNG, JPG, GIF up to 5MB
                    </span>
                  </div>
                </label>
              ) : (
                <div className="relative inline-block">
                  <img src={question.questionImage} alt="Question" className="h-20 rounded-lg object-contain border p-1 bg-gray-50 dark:bg-slate-900" />
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
              <label className={`text-xs font-semibold block mb-2 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
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
                          : isDarkMode ? 'bg-slate-700 text-slate-400 hover:bg-slate-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
                      className={`flex-1 px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all ${
                        isDarkMode 
                          ? 'bg-slate-900 border-slate-700 text-white' 
                          : 'bg-white border-gray-300 text-[#19475B]'
                      } border`}
                    />
                  </div>
                ))}
              </div>
              {question.correctAnswer && (
                <div className={`mt-2 text-xs flex items-center gap-1 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                  <span>✓</span> Correct answer: {question.correctAnswer}
                </div>
              )}
            </div>
            
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowAIImprove(true)}
                className={`px-3 py-1.5 text-xs rounded-lg transition-all flex items-center gap-1 ${
                  isDarkMode 
                    ? 'bg-teal-900/30 text-teal-400 hover:bg-teal-900/50' 
                    : 'bg-teal-100 text-teal-700 hover:bg-teal-200'
                }`}
              >
                AI Improve Question
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
});

QuestionCard.displayName = 'QuestionCard';

// Main AdminQuizzes Component
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
  const [filterLevel, setFilterLevel] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [showAIGenerate, setShowAIGenerate] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('portal-theme');
    return savedTheme ? savedTheme === 'dark' : false;
  });
  
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
    toast.success(`Added ${generatedQuestions.length} AI-generated questions!`);
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
    toast.success(`Successfully imported ${importedQuestions.length} questions!`);
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
    const matchLevel = !filterLevel || quiz.class_level === filterLevel;
    const matchDifficulty = !filterDifficulty || quiz.difficulty === filterDifficulty;
    return matchSearch && matchLevel && matchDifficulty;
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

  // Calculate statistics
  const totalQuizzes = quizzes.length;
  const activeQuizzes = quizzes.filter(q => q.is_active).length;
  const totalQuestions = quizzes.reduce((sum, q) => sum + (q.questions?.length || 0), 0);

  const QuizCard = ({ quiz }) => (
    <div className={`group rounded-xl p-4 transition-all cursor-pointer border ${
      isDarkMode 
        ? 'bg-slate-900/50 border-slate-700 hover:border-teal-500/30 hover:shadow-lg hover:bg-slate-800/50' 
        : 'bg-white border-gray-200 hover:shadow-md hover:border-teal-300'
    }`}>
      <div className="flex gap-4">
        {quiz.image_url ? (
          <img src={quiz.image_url} alt={quiz.title} className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
        ) : (
          <div className="w-16 h-16 rounded-lg flex-shrink-0 bg-gradient-to-br from-teal-100 to-teal-200 dark:from-teal-900/50 dark:to-teal-800/50 flex items-center justify-center text-2xl">
            📝
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className={`font-semibold truncate ${isDarkMode ? 'text-slate-200' : 'text-gray-800'}`}>
                {quiz.title}
              </h3>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                  isDarkMode ? 'bg-teal-900/30 text-teal-400' : 'bg-teal-100 text-teal-700'
                }`}>
                  {getDifficultyName(quiz.difficulty)}
                </span>
                {quiz.class_level && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                    isDarkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {getLevelName(quiz.class_level)}
                  </span>
                )}
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                  quiz.is_active 
                    ? isDarkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700'
                    : isDarkMode ? 'bg-slate-700 text-slate-400' : 'bg-gray-100 text-gray-500'
                }`}>
                  {quiz.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
            <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
              <button 
                onClick={(e) => { e.stopPropagation(); editQuiz(quiz); }} 
                className={`p-1.5 rounded-lg transition-colors ${
                  isDarkMode ? 'hover:bg-blue-900/30 text-blue-400' : 'hover:bg-blue-50 text-blue-600'
                }`}
                title="Edit"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); deleteQuiz(quiz.id); }} 
                className={`p-1.5 rounded-lg transition-colors ${
                  isDarkMode ? 'hover:bg-red-900/30 text-red-400' : 'hover:bg-red-50 text-red-600'
                }`}
                title="Delete"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-2">
            <span className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
              {quiz.questions?.length || 0} questions
            </span>
            {quiz.random_selection && quiz.questions?.length > (quiz.questions_per_attempt || 20) && (
              <span className={`text-xs ${isDarkMode ? 'text-teal-400' : 'text-teal-600'}`}>
                • Random {quiz.questions_per_attempt || 20}/{quiz.questions?.length}
              </span>
            )}
            {quiz.description && (
              <span className={`text-xs truncate ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
                • {quiz.description}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen w-full max-w-full transition-all duration-500 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' 
        : 'bg-gradient-to-br from-slate-50 via-white to-slate-50'
    }`}>
      <AIGenerationModal
        isOpen={showAIGenerate}
        onClose={() => setShowAIGenerate(false)}
        onQuestionsGenerated={handleAIGeneratedQuestions}
        isDarkMode={isDarkMode}
      />
      
      <BulkImportModal
        isOpen={showBulkImport}
        onClose={() => setShowBulkImport(false)}
        onImportComplete={handleBulkImportComplete}
        isDarkMode={isDarkMode}
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
        isDarkMode={isDarkMode}
      />

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Back Arrow - Only show on All Quizzes page */}
        {activeTab === 'manage' && (
          <div className="mb-6">
            <button
              onClick={() => navigate('/admin-dashboard')}
              className={`flex items-center gap-2 text-sm font-medium transition-all hover:scale-105 ${
                isDarkMode 
                  ? 'text-slate-400 hover:text-slate-200' 
                  : 'text-[#19475B] hover:text-teal-600'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Dashboard
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className={`flex gap-6 border-b mb-6 ${
          isDarkMode ? 'border-slate-700' : 'border-gray-200'
        }`}>
          <button
            onClick={() => {
              setActiveTab('create');
              resetForm();
            }}
            className={`pb-2 text-sm font-medium capitalize transition-all ${
              activeTab === 'create' 
                ? 'text-teal-500 dark:text-teal-400 border-b-2 border-teal-500 dark:border-teal-400' 
                : isDarkMode ? 'text-slate-400 hover:text-slate-300' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {selectedQuiz ? 'Edit Quiz' : 'Create Quiz'}
          </button>
          <button
            onClick={() => setActiveTab('manage')}
            className={`pb-2 text-sm font-medium capitalize transition-all ${
              activeTab === 'manage' 
                ? 'text-teal-500 dark:text-teal-400 border-b-2 border-teal-500 dark:border-teal-400' 
                : isDarkMode ? 'text-slate-400 hover:text-slate-300' : 'text-gray-500 hover:text-gray-700'
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
              <div className={`rounded-xl border-2 shadow-sm p-5 sticky top-24 ${
                isDarkMode 
                  ? 'bg-slate-900/50 border-teal-400' 
                  : 'bg-white border-teal-500'
              }`}>
                <h3 className={`font-semibold mb-4 flex items-center gap-2 ${
                  isDarkMode ? 'text-slate-200' : 'text-[#19475B]'
                }`}>
                  <svg className="w-5 h-5 text-teal-500 dark:text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Quiz Settings
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className={`text-xs font-medium block mb-1 ${isDarkMode ? 'text-slate-300' : 'text-[#19475B]'}`}>
                      Cover Image
                    </label>
                    {!form.image ? (
                      <label className={`block border-2 border-solid rounded-lg p-4 text-center cursor-pointer hover:border-teal-400 transition ${
                        isDarkMode ? 'bg-slate-900/50 border-slate-700' : 'bg-gray-50 border-gray-300'
                      }`}>
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={handleQuizImageUpload} 
                          className="hidden" 
                          disabled={uploading}
                        />
                        <span className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
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
                    <label className={`text-xs font-medium block mb-1 ${isDarkMode ? 'text-slate-300' : 'text-[#19475B]'}`}>
                      Quiz Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.title}
                      onChange={(e) => updateForm('title', e.target.value)}
                      placeholder="e.g., Mathematics Challenge 2024"
                      className={`w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all ${
                        isDarkMode 
                          ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500' 
                          : 'bg-white border-gray-300 text-[#19475B]'
                      } border`}
                    />
                  </div>
                  
                  <div>
                    <label className={`text-xs font-medium block mb-1 ${isDarkMode ? 'text-slate-300' : 'text-[#19475B]'}`}>
                      Subject <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={form.subject}
                      onChange={(e) => updateForm('subject', e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                        isDarkMode 
                          ? 'bg-slate-900 border-slate-700 text-white' 
                          : 'bg-white border-gray-300 text-[#19475B]'
                      } border`}
                    >
                      <option value="">Select a subject</option>
                      {SUBJECTS.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className={`text-xs font-medium block mb-1 ${isDarkMode ? 'text-slate-300' : 'text-[#19475B]'}`}>
                      Class Level <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={form.classLevel}
                      onChange={(e) => updateForm('classLevel', e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                        isDarkMode 
                          ? 'bg-slate-900 border-slate-700 text-white' 
                          : 'bg-white border-gray-300 text-[#19475B]'
                      } border`}
                    >
                      <option value="">Select class level</option>
                      {CLASS_LEVELS.map(level => (
                        <option key={level.id} value={level.id}>{level.icon} {level.name}</option>
                      ))}
                    </select>
                    <p className={`text-xs mt-1 font-medium ${isDarkMode ? 'text-teal-400' : 'text-purple-600'}`}>
                      Only students at this level will see this quiz
                    </p>
                  </div>
                  
                  <div>
                    <label className={`text-xs font-medium block mb-2 ${isDarkMode ? 'text-slate-300' : 'text-[#19475B]'}`}>
                      Difficulty Level
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {DIFFICULTY_LEVELS.map(level => (
                        <button
                          key={level.id}
                          onClick={() => updateForm('difficulty', level.id)}
                          className={`p-2 rounded-lg border text-left text-sm transition-all ${
                            form.difficulty === level.id 
                              ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/30 shadow-sm' 
                              : isDarkMode ? 'border-slate-700 text-slate-300 hover:border-slate-600' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <div className="font-medium">{level.name}</div>
                          <div className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                            {level.timeLimit}s • {level.points} pts
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className={`text-xs font-medium block mb-1 ${isDarkMode ? 'text-slate-300' : 'text-[#19475B]'}`}>
                      Description
                    </label>
                    <textarea
                      value={form.description}
                      onChange={(e) => updateForm('description', e.target.value)}
                      rows={3}
                      placeholder="Describe what students will learn..."
                      className={`w-full px-3 py-2 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                        isDarkMode 
                          ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500' 
                          : 'bg-white border-gray-300 text-[#19475B]'
                      } border`}
                    />
                  </div>
                  
                  <div className={`pt-4 ${isDarkMode ? 'border-t border-slate-700' : 'border-t border-gray-200'}`}>
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className={`text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-[#19475B]'}`}>
                        Random Question Selection
                      </span>
                      <input
                        type="checkbox"
                        checked={randomMode}
                        onChange={(e) => setRandomMode(e.target.checked)}
                        className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                      />
                    </label>
                    {randomMode && (
                      <div className="mt-3">
                        <label className={`text-xs block mb-1 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                          Questions per attempt
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={questions.length}
                          value={questionsPerAttempt}
                          onChange={(e) => setQuestionsPerAttempt(Math.min(parseInt(e.target.value) || 1, questions.length))}
                          className={`w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                            isDarkMode 
                              ? 'bg-slate-900 border-slate-700 text-white' 
                              : 'bg-white border-gray-300 text-[#19475B]'
                          } border`}
                        />
                        <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-400' : 'text-gray-400'}`}>
                          {questions.length} total questions available
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between pt-2">
                    <span className={`text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-[#19475B]'}`}>
                      Save to Question Bank
                    </span>
                    <input
                      type="checkbox"
                      checked={saveToBank}
                      onChange={(e) => setSaveToBank(e.target.checked)}
                      className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-[#19475B]'}`}>
                      Publish immediately
                    </span>
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
              <div className={`rounded-xl border-2 shadow-sm overflow-hidden ${
                isDarkMode 
                  ? 'bg-slate-900/50 border-teal-400' 
                  : 'bg-white border-teal-500'
              }`}>
                <div className={`p-5 border-b ${
                  isDarkMode 
                    ? 'border-teal-400/30 bg-teal-900/20' 
                    : 'border-teal-500/30 bg-gradient-to-r from-teal-50 to-emerald-50'
                } flex justify-between items-center flex-wrap gap-3`}>
                  <div>
                    <h3 className={`font-semibold flex items-center gap-2 ${
                      isDarkMode ? 'text-teal-300' : 'text-[#19475B]'
                    }`}>
                      <svg className="w-5 h-5 text-teal-500 dark:text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Questions
                    </h3>
                    <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                      {questions.length} question(s)
                    </p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <button 
                      onClick={() => setShowAIGenerate(true)} 
                      className="px-4 py-2 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-lg text-sm font-medium hover:from-teal-600 hover:to-teal-700 transition-all shadow-md flex items-center gap-2"
                    >
                      🤖 AI Generate
                    </button>
                    <button 
                      onClick={() => setShowBulkImport(true)} 
                      className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg text-sm font-medium hover:from-blue-600 hover:to-blue-700 transition-all shadow-md flex items-center gap-2"
                    >
                      📥 Bulk Import
                    </button>
                    <button 
                      onClick={addQuestion} 
                      className="px-4 py-2 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-lg text-sm font-medium hover:from-teal-600 hover:to-teal-700 transition-all shadow-md flex items-center gap-2"
                    >
                      <span>+</span> Add Question
                    </button>
                  </div>
                </div>
                
                <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
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
                      isDarkMode={isDarkMode}
                    />
                  ))}
                </div>
                
                <div className={`p-5 border-t flex gap-3 ${
                  isDarkMode ? 'border-slate-700 bg-slate-800/50' : 'border-gray-200 bg-gray-50'
                }`}>
                  <button 
                    onClick={resetForm} 
                    className={`flex-1 py-2.5 rounded-lg font-medium transition-all ${
                      isDarkMode 
                        ? 'border-slate-700 text-slate-300 hover:bg-slate-700' 
                        : 'border-gray-300 text-gray-600 hover:bg-gray-100'
                    } border`}
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => setShowPreview(true)} 
                    className="flex-1 py-2.5 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all font-medium shadow-md"
                  >
                    Preview
                  </button>
                  <button 
                    onClick={saveQuiz} 
                    disabled={saving} 
                    className="flex-1 py-2.5 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-lg hover:from-teal-600 hover:to-teal-700 transition-all font-medium shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Saving...' : (selectedQuiz ? 'Update Quiz' : 'Publish Quiz')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Manage Tab - All Quizzes */}
        {activeTab === 'manage' && (
          <div className="space-y-6">
            {/* Statistics Cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className={`rounded-xl p-4 text-center border-2 ${
                isDarkMode 
                  ? 'bg-blue-900/30 backdrop-blur-sm border-teal-400' 
                  : 'bg-blue-50 border-teal-500 shadow-md'
              }`}>
                <p className={`text-[10px] uppercase tracking-wider ${
                  isDarkMode ? 'text-blue-300' : 'text-[#19475B]'
                }`}>
                  Total Quizzes
                </p>
                <p className={`text-2xl font-bold ${
                  isDarkMode ? 'text-blue-200' : 'text-[#19475B]'
                }`}>
                  {totalQuizzes}
                </p>
              </div>

              <div className={`rounded-xl p-4 text-center border-2 ${
                isDarkMode 
                  ? 'bg-emerald-900/30 backdrop-blur-sm border-teal-400' 
                  : 'bg-emerald-50 border-teal-500 shadow-md'
              }`}>
                <p className={`text-[10px] uppercase tracking-wider ${
                  isDarkMode ? 'text-emerald-300' : 'text-[#19475B]'
                }`}>
                  Active Quizzes
                </p>
                <p className={`text-2xl font-bold ${
                  isDarkMode ? 'text-emerald-200' : 'text-[#19475B]'
                }`}>
                  {activeQuizzes}
                </p>
              </div>

              <div className={`rounded-xl p-4 text-center border-2 ${
                isDarkMode 
                  ? 'bg-purple-900/30 backdrop-blur-sm border-teal-400' 
                  : 'bg-purple-50 border-teal-500 shadow-md'
              }`}>
                <p className={`text-[10px] uppercase tracking-wider ${
                  isDarkMode ? 'text-purple-300' : 'text-[#19475B]'
                }`}>
                  Total Questions
                </p>
                <p className={`text-2xl font-bold ${
                  isDarkMode ? 'text-purple-200' : 'text-[#19475B]'
                }`}>
                  {totalQuestions}
                </p>
              </div>
            </div>

            {/* Filters */}
            <div className={`rounded-xl border-2 ${
              isDarkMode 
                ? 'bg-slate-900/50 border-teal-400' 
                : 'bg-white border-teal-500'
            }`}>
              <div className={`p-4 border-b ${
                isDarkMode 
                  ? 'border-teal-400/30 bg-teal-900/20' 
                  : 'border-teal-500/30 bg-gradient-to-r from-teal-50 to-emerald-50'
              }`}>
                <div className="flex flex-wrap gap-3">
                  <div className="flex-1 min-w-[200px] relative">
                    <input
                      type="text"
                      placeholder="Search quizzes..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className={`w-full px-3 py-2 pl-9 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all ${
                        isDarkMode 
                          ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500' 
                          : 'bg-white border-gray-300 text-[#19475B]'
                      } border`}
                    />
                    <svg className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${isDarkMode ? 'text-slate-400' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <select
                    value={filterLevel}
                    onChange={(e) => setFilterLevel(e.target.value)}
                    className={`px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                      isDarkMode 
                        ? 'bg-slate-900 border-slate-700 text-white' 
                        : 'bg-white border-gray-300 text-[#19475B]'
                    } border`}
                  >
                    <option value="">All Levels</option>
                    {CLASS_LEVELS.map(level => (
                      <option key={level.id} value={level.id}>{level.icon} {level.name}</option>
                    ))}
                  </select>
                  <select
                    value={filterDifficulty}
                    onChange={(e) => setFilterDifficulty(e.target.value)}
                    className={`px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                      isDarkMode 
                        ? 'bg-slate-900 border-slate-700 text-white' 
                        : 'bg-white border-gray-300 text-[#19475B]'
                    } border`}
                  >
                    <option value="">All Difficulties</option>
                    {DIFFICULTY_LEVELS.map(level => (
                      <option key={level.id} value={level.id}>{level.name}</option>
                    ))}
                  </select>
                  {(search || filterLevel || filterDifficulty) && (
                    <button
                      onClick={() => {
                        setSearch('');
                        setFilterLevel('');
                        setFilterDifficulty('');
                      }}
                      className={`px-3 py-2 text-sm transition-colors ${
                        isDarkMode ? 'text-slate-400 hover:text-slate-300' : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Clear All
                    </button>
                  )}
                </div>
              </div>
              
              <div className="p-4">
                {loading ? (
                  <div className="text-center py-12">
                    <div className="inline-block w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className={`mt-3 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                      Loading quizzes...
                    </p>
                  </div>
                ) : filteredQuizzes.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="text-6xl mb-4">📋</div>
                    <p className={`text-lg font-medium ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                      No quizzes found
                    </p>
                    <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                      {search || filterLevel || filterDifficulty 
                        ? 'Try adjusting your filters' 
                        : 'Create your first quiz to get started'}
                    </p>
                    {(search || filterLevel || filterDifficulty) ? (
                      <button 
                        onClick={() => {
                          setSearch('');
                          setFilterLevel('');
                          setFilterDifficulty('');
                        }}
                        className="mt-4 text-teal-500 dark:text-teal-400 text-sm hover:underline font-medium"
                      >
                        Clear all filters
                      </button>
                    ) : (
                      <button 
                        onClick={() => setActiveTab('create')} 
                        className="mt-4 px-6 py-2 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-lg hover:from-teal-600 hover:to-teal-700 transition-all font-medium shadow-md"
                      >
                        Create New Quiz
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
          </div>
        )}
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { 
          background: ${isDarkMode ? '#334155' : '#cbd5e1'};
          border-radius: 2px;
        }
        .dark .prose {
          color: #e2e8f0;
        }
        .dark .prose strong {
          color: #f1f5f9;
        }
        .line-clamp-1 {
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default AdminQuizzes;