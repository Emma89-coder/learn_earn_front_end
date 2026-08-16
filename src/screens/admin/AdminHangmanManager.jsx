import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import API_URL from '../../config';
import dictionaryService from '../../services/dictionaryService';
import {
  Plus, Edit, Trash2, Save, X, Upload,
  Image, BookOpen, Globe, GraduationCap,
  Music, Activity,
  Search, Download, Upload as UploadIcon, RefreshCw,
  Sparkles, Wand2,
  Folder, FolderOpen, File, ChevronRight, ChevronDown,
  Star, AlertCircle, Loader, CheckCircle, Globe as GlobeIcon,
  FileText, FileSpreadsheet
} from 'lucide-react';

// Import file parsing libraries
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

const AdminHangmanManager = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  // State
  const [words, setWords] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingWord, setEditingWord] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [parsedWords, setParsedWords] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [showPdfImport, setShowPdfImport] = useState(false);
  const [pdfImporting, setPdfImporting] = useState(false);
  const [pdfCategory, setPdfCategory] = useState('');
  const [generatingHint, setGeneratingHint] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState({});
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('portal-theme');
    return savedTheme ? savedTheme === 'dark' : false;
  });
  const [isFetchingDictionary, setIsFetchingDictionary] = useState(false);
  const [dictionaryData, setDictionaryData] = useState(null);
  const [showDictionaryPanel, setShowDictionaryPanel] = useState(false);
  const [formData, setFormData] = useState({
    word: '',
    category: '',
    hint: '',
    difficulty: 'medium',
    points: 2
  });

  useEffect(() => {
    localStorage.setItem('portal-theme', isDarkMode ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  // Subject-based category definitions - Teal themed
  const categoryOptions = {
    'mathematics': { 
      name: 'Mathematics', 
      icon: <BookOpen size={16} />, 
      color: '#0d9488', 
      bg: 'bg-teal-50', 
      text: 'text-teal-600',
      border: 'border-teal-200',
      description: 'Math vocabulary and terms',
      emoji: '🔢'
    },
    'english': { 
      name: 'English', 
      icon: <BookOpen size={16} />, 
      color: '#0d9488', 
      bg: 'bg-teal-50', 
      text: 'text-teal-600',
      border: 'border-teal-200',
      description: 'English language vocabulary',
      emoji: '📚'
    },
    'primary-science': { 
      name: 'Science', 
      icon: <Globe size={16} />, 
      color: '#0d9488', 
      bg: 'bg-teal-50', 
      text: 'text-teal-600',
      border: 'border-teal-200',
      description: 'Science terms and concepts',
      emoji: '🔬'
    },
    'social-studies': { 
      name: 'Social Studies', 
      icon: <GraduationCap size={16} />, 
      color: '#0d9488', 
      bg: 'bg-teal-50', 
      text: 'text-teal-600',
      border: 'border-teal-200',
      description: 'Geography, history and civics',
      emoji: '🌍'
    },
    'bible-knowledge': { 
      name: 'Bible Knowledge', 
      icon: <BookOpen size={16} />, 
      color: '#0d9488', 
      bg: 'bg-teal-50', 
      text: 'text-teal-600',
      border: 'border-teal-200',
      description: 'Biblical terms and names',
      emoji: '📖'
    },
    'arts-life-skills': { 
      name: 'Arts & Life Skills', 
      icon: <Music size={16} />, 
      color: '#0d9488', 
      bg: 'bg-teal-50', 
      text: 'text-teal-600',
      border: 'border-teal-200',
      description: 'Creative arts and life skills',
      emoji: '🎨'
    },
    'chichewa': { 
      name: 'Chichewa', 
      icon: <GraduationCap size={16} />, 
      color: '#0d9488', 
      bg: 'bg-teal-50', 
      text: 'text-teal-600',
      border: 'border-teal-200',
      description: 'Chichewa language vocabulary',
      emoji: '🇲🇼'
    }
  };

  const difficultyConfig = {
    easy: { bg: 'bg-teal-100', text: 'text-teal-700', label: 'Easy', icon: '🟢' },
    medium: { bg: 'bg-teal-200', text: 'text-teal-800', label: 'Medium', icon: '🟡' },
    hard: { bg: 'bg-teal-300', text: 'text-teal-900', label: 'Hard', icon: '🔴' }
  };

  // Toggle folder expansion
  const toggleFolder = (categoryKey) => {
    setExpandedFolders(prev => ({
      ...prev,
      [categoryKey]: !prev[categoryKey]
    }));
  };

  // Expand all folders
  const expandAllFolders = () => {
    const allExpanded = {};
    categories.forEach(cat => {
      allExpanded[cat] = true;
    });
    setExpandedFolders(allExpanded);
  };

  // Collapse all folders
  const collapseAllFolders = () => {
    setExpandedFolders({});
  };

  // Generate fallback hint
  const generateFallbackHint = (word, category) => {
    const categoryHints = {
      'mathematics': ['A mathematical term or concept', 'Used in math calculations', 'A number or shape related word'],
      'english': ['An English language term', 'A grammar or vocabulary word', 'Related to reading and writing'],
      'primary-science': ['A science term or concept', 'Related to nature or experiments', 'A scientific word'],
      'social-studies': ['Related to geography or history', 'A place or cultural term', 'About people and society'],
      'bible-knowledge': ['A biblical term or name', 'Related to faith and scripture', 'From the Bible'],
      'arts-life-skills': ['Related to art or life skills', 'A creative or practical term', 'About expression or health'],
      'chichewa': ['A Chichewa vocabulary word', 'A word in the Chichewa language', 'Used in everyday Chichewa']
    };

    const hints = categoryHints[category] || ['A word related to this subject', 'A term you need to guess'];
    return hints[Math.floor(Math.random() * hints.length)] + ` (${word.length} letters)`;
  };

  // Dictionary-based hint generation
  const generateFromDictionary = async (word) => {
    if (!word || word.trim() === '') {
      toast.error('Please enter a word first');
      return null;
    }

    setIsFetchingDictionary(true);
    setDictionaryData(null);
    setShowDictionaryPanel(false);

    try {
      const data = await dictionaryService.getWordData(word);
      
      if (data && (data.hint || data.definition)) {
        setDictionaryData(data);
        setShowDictionaryPanel(true);
        
        const hint = data.hint || data.definition || '';
        
        let difficulty = formData.difficulty;
        if (word.length <= 4) difficulty = 'easy';
        else if (word.length <= 6) difficulty = 'medium';
        else if (word.length <= 8) difficulty = 'hard';
        else difficulty = 'medium';
        
        const points = word.length <= 4 ? 2 : word.length <= 6 ? 3 : word.length <= 8 ? 4 : 5;
        
        setFormData(prev => ({
          ...prev,
          hint: hint,
          difficulty: difficulty,
          points: points
        }));
        
        toast.success(`Found definition for "${word}"!`);
        return { hint, difficulty, points };
      } else {
        const fallbackHint = generateFallbackHint(word, formData.category || '');
        setFormData(prev => ({
          ...prev,
          hint: fallbackHint
        }));
        toast.success('Using fallback hint generation');
        return { hint: fallbackHint };
      }
    } catch (error) {
      console.error('Error fetching from dictionary:', error);
      const fallbackHint = generateFallbackHint(word, formData.category || '');
      setFormData(prev => ({
        ...prev,
        hint: fallbackHint
      }));
      toast.success('Using fallback hint generation');
      return { hint: fallbackHint };
    } finally {
      setIsFetchingDictionary(false);
    }
  };

  // Generate hint using dictionary or fallback
  const generateHint = async (word) => {
    if (!word || word.trim() === '') {
      toast.error('Please enter a word first');
      return;
    }
    
    setGeneratingHint(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/api/ai/generate-hangman-hint`, {
        word,
        category: formData.category || ''
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data?.success && response.data.hint) {
        setFormData(prev => ({
          ...prev,
          hint: response.data.hint
        }));
        toast.success('AI hint generated!');
        return;
      }
    } catch (error) {
      console.warn('AI hangman hint failed, falling back to dictionary:', error.response?.data || error.message);
    }

    try {
      const data = await dictionaryService.getWordData(word);
      if (data && data.hint) {
        setFormData(prev => ({
          ...prev,
          hint: data.hint
        }));
        toast.success('Hint from dictionary!');
      } else if (data && data.definition) {
        setFormData(prev => ({
          ...prev,
          hint: data.definition
        }));
        toast.success('Hint from dictionary definition!');
      } else {
        const fallbackHint = generateFallbackHint(word, formData.category || '');
        setFormData(prev => ({
          ...prev,
          hint: fallbackHint
        }));
        toast.success('Hint generated using fallback!');
      }
    } catch (error) {
      const fallbackHint = generateFallbackHint(word, formData.category || '');
      setFormData(prev => ({
        ...prev,
        hint: fallbackHint
      }));
      toast.success('Hint generated using fallback!');
    } finally {
      setGeneratingHint(false);
    }
  };

  // Auto-generate hint on blur
  const autoGenerateHint = async () => {
    if (formData.word && !formData.hint) {
      await generateFromDictionary(formData.word);
    }
  };

  // Render dictionary info panel
  const renderDictionaryInfo = () => {
    if (!dictionaryData || !showDictionaryPanel) return null;
    
    return (
      <div className={`p-4 rounded-xl border-2 space-y-2 animate-fadeIn ${
        isDarkMode 
          ? 'bg-teal-900/30 border-teal-400/30' 
          : 'bg-gradient-to-r from-teal-50 to-cyan-50 border-teal-300'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GlobeIcon size={16} className="text-teal-600" />
            <span className="text-xs font-semibold text-teal-800 dark:text-teal-300">Dictionary Definition</span>
          </div>
          <button
            onClick={() => setShowDictionaryPanel(false)}
            className="p-1 hover:bg-teal-100 rounded-lg transition text-gray-400"
          >
            <X size={14} />
          </button>
        </div>
        {dictionaryData.phonetic && (
          <p className="text-xs text-teal-600 dark:text-teal-400 font-mono">/{dictionaryData.phonetic}/</p>
        )}
        <p className="text-sm text-teal-800 dark:text-teal-200">
          <span className="font-medium">Definition:</span> {dictionaryData.definition || dictionaryData.hint}
        </p>
        {dictionaryData.partOfSpeech && (
          <p className="text-xs text-teal-600 dark:text-teal-400">
            <span className="font-medium">Part of Speech:</span> {dictionaryData.partOfSpeech}
          </p>
        )}
        {dictionaryData.synonyms && dictionaryData.synonyms.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            <span className="text-xs text-teal-600 dark:text-teal-400 font-medium">Synonyms:</span>
            {dictionaryData.synonyms.slice(0, 5).map((syn, i) => (
              <span key={i} className="text-xs bg-teal-100 text-teal-700 dark:bg-teal-800/50 dark:text-teal-300 px-2 py-0.5 rounded-full">
                {syn}
              </span>
            ))}
          </div>
        )}
        <div className="flex items-center gap-2 mt-1 pt-1 border-t border-teal-200 dark:border-teal-400/20">
          <CheckCircle size={14} className="text-teal-500" />
          <span className="text-xs text-teal-700 dark:text-teal-400">Dictionary data loaded successfully</span>
        </div>
      </div>
    );
  };

  // Fetch words
  const fetchWords = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/admin/hangman/words`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setWords(response.data.words);
        const uniqueCategories = [...new Set(response.data.words.map(w => w.category))];
        setCategories(uniqueCategories);
        const expanded = {};
        uniqueCategories.forEach(cat => {
          expanded[cat] = true;
        });
        setExpandedFolders(expanded);
      }
    } catch (error) {
      console.error('Error fetching words:', error);
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again');
        logout();
      } else {
        toast.error('Failed to load words');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWords();
  }, []);

  // Handle image selection
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be less than 5MB');
        return;
      }
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Add word
  const handleAddWord = async () => {
    if (!formData.word || !formData.category) {
      toast.error('Word and category are required');
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      
      const formDataObj = new FormData();
      formDataObj.append('word', formData.word);
      formDataObj.append('category', formData.category);
      formDataObj.append('hint', formData.hint || '');
      formDataObj.append('difficulty', formData.difficulty);
      formDataObj.append('points', formData.points);
      if (selectedImage) {
        formDataObj.append('image', selectedImage);
      }

      const response = await axios.post(`${API_URL}/api/admin/hangman/words`, formDataObj, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        toast.success('Word added successfully!');
        setShowAddModal(false);
        resetForm();
        fetchWords();
      }
    } catch (error) {
      console.error('Error adding word:', error);
      toast.error(error.response?.data?.message || 'Failed to add word');
    } finally {
      setSaving(false);
    }
  };

  // Edit word
  const handleEditWord = async () => {
    if (!formData.word || !formData.category) {
      toast.error('Word and category are required');
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      
      const formDataObj = new FormData();
      formDataObj.append('word', formData.word);
      formDataObj.append('category', formData.category);
      formDataObj.append('hint', formData.hint || '');
      formDataObj.append('difficulty', formData.difficulty);
      formDataObj.append('points', formData.points);
      if (selectedImage) {
        formDataObj.append('image', selectedImage);
      }

      const response = await axios.put(`${API_URL}/api/admin/hangman/words/${editingWord._id}`, formDataObj, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        toast.success('Word updated successfully!');
        setShowEditModal(false);
        resetForm();
        fetchWords();
      }
    } catch (error) {
      console.error('Error updating word:', error);
      toast.error(error.response?.data?.message || 'Failed to update word');
    } finally {
      setSaving(false);
    }
  };

  // Delete word
  const handleDeleteWord = async (wordId) => {
    if (!window.confirm('Are you sure you want to delete this word? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.delete(`${API_URL}/api/admin/hangman/words/${wordId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        toast.success('Word deleted successfully!');
        fetchWords();
      }
    } catch (error) {
      console.error('Error deleting word:', error);
      toast.error('Failed to delete word');
    } finally {
      setLoading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      word: '',
      category: '',
      hint: '',
      difficulty: 'medium',
      points: 2
    });
    setSelectedImage(null);
    setImagePreview(null);
    setEditingWord(null);
    setDictionaryData(null);
    setShowDictionaryPanel(false);
  };

  // Open edit modal
  const openEditModal = (word) => {
    setEditingWord(word);
    setFormData({
      word: word.word,
      category: word.category,
      hint: word.hint || '',
      difficulty: word.difficulty || 'medium',
      points: word.points || 2
    });
    if (word.imageUrl) {
      setImagePreview(word.imageUrl);
    }
    setShowEditModal(true);
  };

  // Export words
  const exportWords = () => {
    const dataStr = JSON.stringify(words, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hangman_words_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Words exported successfully!');
  };

  // Parse DOCX file
  const parseDocx = async (file) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      const text = result.value;
      return parseTextContent(text);
    } catch (error) {
      console.error('Error parsing DOCX:', error);
      throw new Error('Failed to parse DOCX file');
    }
  };

  // Parse PDF file
  const parsePdf = async (file) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({
        data: arrayBuffer,
        useSystemFonts: true,
        useWorkerFetch: true,
        disableAutoFetch: false,
        stopAtErrors: false
      });
      const pdf = await loadingTask.promise;
      let fullText = '';

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        fullText += pageText + '\n';
      }

      await pdf.destroy();
      return parseTextContent(fullText);
    } catch (error) {
      console.warn('Primary PDF parse failed, trying fallback:', error);
      try {
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({
          data: arrayBuffer,
          useSystemFonts: false,
          useWorkerFetch: false,
          disableAutoFetch: false,
          stopAtErrors: true
        });
        const pdf = await loadingTask.promise;
        let fullText = '';

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map(item => item.str).join(' ');
          fullText += pageText + '\n';
        }

        await pdf.destroy();
        return parseTextContent(fullText);
      } catch (fallbackError) {
        console.error('Fallback PDF parse failed:', fallbackError);
        throw new Error('Failed to parse PDF file');
      }
    }
  };

  // Parse text content to extract words
  const parseTextContent = (text) => {
    const words = [];
    const cleanedText = text
      .replace(/\r\n/g, '\n')
      .replace(/[•*\u2022]/g, '')
      .replace(/[—–]/g, '-')
      .replace(/\s{2,}/g, ' ')
      .trim();

    const lines = cleanedText
      .split('\n')
      .map(line => line.trim().replace(/^[\d\.\)\-\s]+/, ''))
      .filter(line => line.length > 0);

    for (const line of lines) {
      const normalizedLine = line.replace(/\s*[-–—:;|]\s*/, ' - ');

      // Try to parse as "word - hint" format
      const match = normalizedLine.match(/^([A-Za-z]+)\s*-\s*(.+)$/);
      if (match) {
        words.push({
          word: match[1].trim().toUpperCase(),
          hint: match[2].trim()
        });
        continue;
      }

      // Try to parse as "word,hint" or "word;hint" format
      const parts = normalizedLine.split(/[,;]\s*/).map(s => s.trim());
      if (parts.length >= 2 && parts[0] && parts[1]) {
        words.push({
          word: parts[0].toUpperCase(),
          hint: parts[1]
        });
        continue;
      }

      // Try to parse as "word" only (no hint)
      const wordMatch = normalizedLine.match(/^([A-Za-z]+)$/);
      if (wordMatch && wordMatch[1].length > 1) {
        words.push({
          word: wordMatch[1].trim().toUpperCase(),
          hint: `A word with ${wordMatch[1].length} letters`
        });
      }
    }

    return words;
  };

  // Handle file import selection
  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const fileExtension = file.name.split('.').pop().toLowerCase();
    
    // Check if file type is supported
    const supportedTypes = ['json', 'csv', 'txt', 'docx', 'pdf'];
    if (!supportedTypes.includes(fileExtension)) {
      toast.error(`Unsupported file type: ${fileExtension}. Supported types: ${supportedTypes.join(', ')}`);
      return;
    }
    
    setImportFile(file);
    setParsedWords([]);
    setShowPreview(false);
    
    try {
      let parsed = [];
      
      if (fileExtension === 'json') {
        const text = await file.text();
        const data = JSON.parse(text);
        parsed = Array.isArray(data) ? data : [data];
      } else if (fileExtension === 'csv') {
        const text = await file.text();
        const lines = text.split('\n').filter(line => line.trim());
        parsed = lines.map(line => {
          const [word, hint, category, difficulty] = line.split(',').map(s => s.trim());
          return { word: word?.toUpperCase(), hint, category, difficulty };
        });
      } else if (fileExtension === 'txt') {
        const text = await file.text();
        parsed = parseTextContent(text);
      } else if (fileExtension === 'docx') {
        parsed = await parseDocx(file);
      } else if (fileExtension === 'pdf') {
        parsed = await parsePdf(file);
      }
      
      // Validate and clean parsed words
      const validWords = parsed
        .filter(w => w.word && w.word.length > 0)
        .map(w => ({
          word: w.word.toUpperCase(),
          hint: w.hint || `A word with ${w.word.length} letters`,
          category: w.category || 'general',
          difficulty: w.difficulty || 'medium'
        }));
      
      if (validWords.length === 0) {
        toast.warning('No valid words found in the file');
        setParsedWords([]);
      } else {
        setParsedWords(validWords);
        setShowPreview(true);
        toast.dismiss();
        toast.success(`Found ${validWords.length} words in the file`);
      }
    } catch (error) {
      console.error('Error parsing file:', error);
      toast.dismiss();
      toast.error(`Failed to parse file: ${error.message}`);
      setParsedWords([]);
    }
  };

  // Import parsed words
  const importParsedWords = async () => {
    if (parsedWords.length === 0) {
      toast.error('No words to import');
      return;
    }

    try {
      setLoading(true);
      // Close modal immediately for better UX
      setShowBulkImport(false);
      
      const token = localStorage.getItem('token');
      let added = 0;
      let enhanced = 0;
      
      for (const word of parsedWords) {
        try {
          // Generate hint if missing
          if (!word.hint || word.hint.includes('letters')) {
            try {
              const dictData = await dictionaryService.getWordData(word.word);
              if (dictData && (dictData.hint || dictData.definition)) {
                word.hint = dictData.hint || dictData.definition;
                enhanced++;
              } else {
                word.hint = generateFallbackHint(word.word, word.category);
              }
            } catch (dictError) {
              word.hint = generateFallbackHint(word.word, word.category);
            }
          }
          
          await axios.post(`${API_URL}/api/admin/hangman/words`, word, {
            headers: { Authorization: `Bearer ${token}` }
          });
          added++;
        } catch (e) {
          console.log('Skipping existing word:', word.word);
        }
      }
      
      // Reset state
      setImportFile(null);
      setParsedWords([]);
      setShowPreview(false);
      
      // Fetch updated word list
      await fetchWords();
      
      // Dismiss all toasts silently
      toast.dismiss();
    } catch (error) {
      console.error('Error importing words:', error);
      toast.dismiss();
      toast.error('Failed to import words');
    } finally {
      setLoading(false);
    }
  };

  // PDF Import — extract words + images from PDF via backend
  const handlePdfImport = async (file) => {
    if (!file) return;
    if (!pdfCategory) {
      toast.error('Please select a subject folder first');
      return;
    }

    setPdfImporting(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('pdf', file);
      formData.append('category', pdfCategory);

      const response = await axios.post(`${API_URL}/api/admin/hangman/import-pdf`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        },
        timeout: 60000 // 60s for large PDFs
      });

      if (response.data.success) {
        const { saved, images_extracted, total_found, errors } = response.data;
        toast.success(`Imported ${saved} words (${images_extracted} images extracted)`);
        if (errors && errors.length > 0) {
          console.warn('Import errors:', errors);
        }
        setShowPdfImport(false);
        setPdfCategory('');
        fetchWords();
      } else {
        toast.error(response.data.message || 'Import failed');
      }
    } catch (error) {
      console.error('PDF import error:', error);
      toast.error(error.response?.data?.message || 'Failed to import PDF');
    } finally {
      setPdfImporting(false);
    }
  };

  // Bulk generate hints with dictionary
  const bulkGenerateHints = async () => {
    if (words.length === 0) {
      toast.error('No words to generate hints for');
      return;
    }

    if (!window.confirm(`Generate hints for all ${words.length} words using dictionary?`)) {
      return;
    }

    setLoading(true);
    let updated = 0;
    let failed = 0;
    let fromDictionary = 0;

    for (const word of words) {
      try {
        let newHint = null;
        
        try {
          const dictData = await dictionaryService.getWordData(word.word);
          if (dictData && (dictData.hint || dictData.definition)) {
            newHint = dictData.hint || dictData.definition;
            fromDictionary++;
          }
        } catch (dictError) {
          newHint = generateFallbackHint(word.word, word.category);
        }
        
        if (newHint && newHint !== word.hint) {
          const token = localStorage.getItem('token');
          await axios.put(`${API_URL}/api/admin/hangman/words/${word._id}`, {
            ...word,
            hint: newHint
          }, {
            headers: { Authorization: `Bearer ${token}` }
          });
          updated++;
        }
      } catch (error) {
        console.error('Failed to update hint for:', word.word);
        failed++;
      }
    }

    toast.success(`Updated ${updated} words! (${fromDictionary} from dictionary, ${updated - fromDictionary} from fallback) ${failed} failed.`);
    fetchWords();
    setLoading(false);
  };

  // Filter words
  const getFilteredWords = () => {
    return words.filter(word => {
      const matchesSearch = word.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (word.hint && word.hint.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = selectedCategory === 'all' || word.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  };

  const filteredWords = getFilteredWords();

  // Group words by category for folder view
  const getWordsByCategory = () => {
    const grouped = {};
    categories.forEach(cat => {
      grouped[cat] = words.filter(w => w.category === cat);
    });
    return grouped;
  };

  const wordsByCategory = getWordsByCategory();

  // Stats
  const stats = {
    total: words.length,
    categories: categories.length,
    withImages: words.filter(w => w.imageUrl).length,
    avgPoints: words.length ? Math.round(words.reduce((sum, w) => sum + (w.points || 2), 0) / words.length) : 0,
    withHints: words.filter(w => w.hint && w.hint.length > 0).length
  };

  // Render Word Card
  const WordCard = ({ word, index }) => (
    <div className={`flex items-center gap-2 p-2 rounded-lg border transition-all hover:shadow-md group ${
      isDarkMode 
        ? 'bg-slate-800 border-slate-700 hover:border-teal-400' 
        : 'bg-white border-gray-200 hover:border-teal-400'
    }`}>
      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
        isDarkMode ? 'bg-teal-500/20 text-teal-400' : 'bg-teal-100 text-teal-600'
      }`}>
        {index + 1}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className={`font-bold text-sm ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
            {word.word}
          </span>
          {word.hint && (
            <span className={`text-[10px] flex items-center gap-0.5 px-1.5 py-0.5 rounded-full ${
              isDarkMode ? 'bg-teal-500/20 text-teal-400' : 'bg-teal-50 text-teal-600'
            }`}>
              <Sparkles size={10} />
              {word.hint}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
            difficultyConfig[word.difficulty]?.bg || 'bg-teal-100'
          } ${difficultyConfig[word.difficulty]?.text || 'text-teal-700'}`}>
            {difficultyConfig[word.difficulty]?.icon} {difficultyConfig[word.difficulty]?.label || word.difficulty}
          </span>
          <span className={`text-[10px] flex items-center gap-0.5 ${
            isDarkMode ? 'text-slate-400' : 'text-gray-500'
          }`}>
            <Star size={10} className="text-teal-400" />
            {word.points || 2} pts
          </span>
        </div>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {word.imageUrl && (
          <img src={word.imageUrl} alt={word.word} className="w-6 h-6 rounded object-cover border border-gray-200" />
        )}
        <button
          onClick={() => openEditModal(word)}
          className={`p-1 rounded transition-colors ${
            isDarkMode ? 'hover:bg-teal-500/20 text-teal-400' : 'hover:bg-teal-50 text-teal-500'
          }`}
          title="Edit"
        >
          <Edit size={14} />
        </button>
        <button
          onClick={() => handleDeleteWord(word._id)}
          className={`p-1 rounded transition-colors ${
            isDarkMode ? 'hover:bg-red-500/20 text-red-400' : 'hover:bg-red-50 text-red-500'
          }`}
          title="Delete"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );

  // Add Word Modal Component
  const AddWordModal = () => (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${
      isDarkMode ? 'bg-black/80' : 'bg-black/50'
    } backdrop-blur-sm`} onClick={() => { setShowAddModal(false); resetForm(); }}>
      <div className={`rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border-2 ${
        isDarkMode 
          ? 'bg-slate-800 border-teal-400' 
          : 'bg-white border-teal-500'
      }`} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={`px-5 py-3 border-b flex justify-between items-center ${
          isDarkMode 
            ? 'border-teal-400/30 bg-gradient-to-r from-teal-900/40 to-slate-800' 
            : 'border-teal-100 bg-gradient-to-r from-teal-50 to-white'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center shadow">
              <Plus size={16} className="text-white" />
            </div>
            <div>
              <h2 className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                Add New Word
              </h2>
              <p className={`text-[10px] ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                Add a vocabulary word to a subject
              </p>
            </div>
          </div>
          <button 
            onClick={() => { setShowAddModal(false); resetForm(); }} 
            className={`p-1.5 rounded-lg transition-colors ${
              isDarkMode ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-gray-100 text-gray-400'
            }`}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Word + Dictionary Button */}
          <div>
            <label className={`block text-xs font-semibold mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
              Word <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={formData.word}
                onChange={(e) => {
                  const newWord = e.target.value.toUpperCase();
                  setFormData(prev => ({ ...prev, word: newWord }));
                  setDictionaryData(null);
                  setShowDictionaryPanel(false);
                }}
                onBlur={autoGenerateHint}
                className={`flex-1 px-3 py-2 rounded-lg border-2 text-sm font-mono tracking-wide outline-none focus:ring-2 focus:ring-teal-500 transition-all ${
                  isDarkMode 
                    ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400 focus:border-teal-400' 
                    : 'bg-white border-gray-200 text-gray-700 placeholder-gray-400 focus:border-teal-500'
                }`}
                placeholder="e.g. FRACTION"
                autoFocus
              />
              <button
                type="button"
                onClick={() => generateFromDictionary(formData.word)}
                disabled={!formData.word || isFetchingDictionary}
                className={`px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap ${
                  isDarkMode 
                    ? 'bg-teal-500/80 text-white hover:bg-teal-500' 
                    : 'bg-teal-500 text-white hover:bg-teal-600'
                }`}
                title="Look up word in dictionary"
              >
                {isFetchingDictionary ? (
                  <Loader size={14} className="animate-spin" />
                ) : (
                  <Wand2 size={14} />
                )}
                {isFetchingDictionary ? 'Loading' : 'Lookup'}
              </button>
            </div>
          </div>

          {/* Subject Selection */}
          <div>
            <label className={`block text-xs font-semibold mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
              Subject <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {Object.entries(categoryOptions).map(([key, value]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({ ...prev, category: key }));
                    if (formData.hint) setFormData(prev => ({ ...prev, hint: '' }));
                  }}
                  className={`p-2 rounded-lg border-2 text-center transition-all ${
                    formData.category === key
                      ? isDarkMode
                        ? 'border-teal-400 bg-teal-500/20'
                        : 'border-teal-500 bg-teal-50'
                      : isDarkMode
                        ? 'border-slate-600 hover:border-slate-500 bg-slate-700/50'
                        : 'border-gray-200 hover:border-teal-300 bg-gray-50'
                  }`}
                >
                  <span className="text-lg block">{value.emoji}</span>
                  <span className={`text-[9px] font-medium block mt-0.5 leading-tight ${
                    formData.category === key
                      ? isDarkMode ? 'text-teal-300' : 'text-teal-700'
                      : isDarkMode ? 'text-slate-400' : 'text-gray-600'
                  }`}>
                    {value.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Dictionary Info */}
          {renderDictionaryInfo()}

          {/* Hint */}
          <div>
            <label className={`block text-xs font-semibold mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
              Hint / Clue
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={formData.hint}
                onChange={(e) => setFormData(prev => ({ ...prev, hint: e.target.value }))}
                className={`flex-1 px-3 py-2 rounded-lg border-2 text-sm outline-none focus:ring-2 focus:ring-teal-500 transition-all ${
                  isDarkMode 
                    ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400 focus:border-teal-400' 
                    : 'bg-white border-gray-200 text-gray-700 placeholder-gray-400 focus:border-teal-500'
                }`}
                placeholder="Auto-generated or type your own"
              />
              <button
                onClick={() => generateHint(formData.word)}
                disabled={!formData.word || generatingHint}
                className={`px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap ${
                  isDarkMode 
                    ? 'bg-teal-500/80 text-white hover:bg-teal-500' 
                    : 'bg-teal-500 text-white hover:bg-teal-600'
                }`}
                title="Generate hint with AI"
              >
                {generatingHint ? (
                  <Loader size={14} className="animate-spin" />
                ) : (
                  <Sparkles size={14} />
                )}
                AI Hint
              </button>
            </div>
          </div>

          {/* Difficulty + Points Row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={`block text-xs font-semibold mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                Difficulty
              </label>
              <div className="flex gap-1.5">
                {[
                  { key: 'easy', label: 'Easy', icon: '🟢' },
                  { key: 'medium', label: 'Med', icon: '🟡' },
                  { key: 'hard', label: 'Hard', icon: '🔴' }
                ].map(diff => (
                  <button
                    key={diff.key}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, difficulty: diff.key }))}
                    className={`flex-1 py-1.5 rounded-lg border-2 text-xs font-medium text-center transition-all ${
                      formData.difficulty === diff.key
                        ? isDarkMode
                          ? 'border-teal-400 bg-teal-500/20 text-teal-300'
                          : 'border-teal-500 bg-teal-50 text-teal-700'
                        : isDarkMode
                          ? 'border-slate-600 text-slate-400 hover:border-slate-500'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {diff.icon} {diff.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className={`block text-xs font-semibold mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                Points
              </label>
              <input
                type="number"
                value={formData.points}
                onChange={(e) => setFormData(prev => ({ ...prev, points: parseInt(e.target.value) || 0 }))}
                className={`w-full px-3 py-2 rounded-lg border-2 text-sm outline-none focus:ring-2 focus:ring-teal-500 transition-all ${
                  isDarkMode 
                    ? 'bg-slate-700 border-slate-600 text-white focus:border-teal-400' 
                    : 'bg-white border-gray-200 text-gray-700 focus:border-teal-500'
                }`}
                min="1"
                max="50"
              />
            </div>
          </div>

          {/* Image Upload (compact) */}
          <div>
            <label className={`block text-xs font-semibold mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
              Image <span className={`font-normal ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>(optional)</span>
            </label>
            <div className={`border-2 border-solid rounded-lg p-3 text-center transition-colors cursor-pointer ${
              isDarkMode 
                ? 'border-slate-600 hover:border-teal-400' 
                : 'border-gray-200 hover:border-teal-400'
            }`}>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
                id="image-upload"
              />
              <label htmlFor="image-upload" className="cursor-pointer block">
                {imagePreview ? (
                  <div className="relative inline-block">
                    <img src={imagePreview} alt="Preview" className="max-h-24 rounded-lg shadow-sm" />
                    <button
                      onClick={(e) => { e.preventDefault(); setImagePreview(null); setSelectedImage(null); }}
                      className="absolute -top-1.5 -right-1.5 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition shadow"
                    >
                      <X size={10} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2 py-2">
                    <Upload size={16} className={isDarkMode ? 'text-slate-500' : 'text-gray-400'} />
                    <span className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                      Click to upload (PNG, JPG up to 5MB)
                    </span>
                  </div>
                )}
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`px-5 py-3 border-t flex justify-between items-center ${
          isDarkMode 
            ? 'border-teal-400/30 bg-slate-800/80' 
            : 'border-teal-100 bg-gray-50'
        }`}>
          <div className={`text-[10px] ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
            {formData.word && formData.category ? '✓ Ready to save' : 'Fill word + subject'}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { setShowAddModal(false); resetForm(); }}
              className={`px-4 py-2 font-medium rounded-lg transition-colors text-xs ${
                isDarkMode 
                  ? 'text-slate-300 hover:bg-slate-700' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Cancel
            </button>
            <button
              onClick={handleAddWord}
              disabled={saving || !formData.word || !formData.category}
              className={`px-5 py-2 text-white font-semibold rounded-lg transition-all shadow flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed text-xs ${
                isDarkMode 
                  ? 'bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400' 
                  : 'bg-teal-600 hover:bg-teal-700'
              }`}
            >
              {saving ? (
                <>
                  <Loader size={14} className="animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus size={14} />
                  Add Word
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Edit Word Modal Component
  const EditWordModal = () => (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${
      isDarkMode ? 'bg-black/80' : 'bg-black/50'
    } backdrop-blur-sm`} onClick={() => { setShowEditModal(false); resetForm(); }}>
      <div className={`rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border-2 ${
        isDarkMode 
          ? 'bg-slate-800 border-teal-400' 
          : 'bg-white border-teal-500'
      }`} onClick={(e) => e.stopPropagation()}>
        <div className={`sticky top-0 px-6 py-4 border-b flex justify-between items-center rounded-t-2xl ${
          isDarkMode 
            ? 'bg-slate-800 border-teal-400/30' 
            : 'bg-white border-teal-100'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${
              isDarkMode ? 'bg-teal-500/30' : 'bg-teal-500'
            }`}>
              <Edit size={20} className="text-white" />
            </div>
            <div>
              <h2 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                Edit Word
              </h2>
              <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                Update the word details
              </p>
            </div>
          </div>
          <button 
            onClick={() => { setShowEditModal(false); resetForm(); }} 
            className={`p-2 rounded-lg transition-colors ${
              isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-100'
            }`}
          >
            <X size={20} className={isDarkMode ? 'text-slate-400' : 'text-gray-500'} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-semibold mb-1.5 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                Word <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.word}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, word: e.target.value.toUpperCase() }));
                    setDictionaryData(null);
                    setShowDictionaryPanel(false);
                  }}
                  className={`flex-1 px-4 py-2.5 rounded-xl border-2 text-sm outline-none focus:ring-2 focus:ring-teal-500 transition-all ${
                    isDarkMode 
                      ? 'bg-slate-700 border-slate-600 text-white focus:border-teal-400' 
                      : 'bg-white border-gray-200 text-gray-700 focus:border-teal-500'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => generateFromDictionary(formData.word)}
                  disabled={!formData.word || isFetchingDictionary}
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap shadow-sm ${
                    isDarkMode 
                      ? 'bg-teal-500/80 text-white hover:bg-teal-500' 
                      : 'bg-teal-500 text-white hover:bg-teal-600'
                  }`}
                >
                  {isFetchingDictionary ? (
                    <>
                      <Loader size={16} className="animate-spin" />
                      <span>Loading...</span>
                    </>
                  ) : (
                    <>
                      <Wand2 size={16} />
                      <span>Dictionary</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className={`block text-sm font-semibold mb-1.5 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                Category Folder <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className={`w-full px-4 py-2.5 rounded-xl border-2 text-sm outline-none focus:ring-2 focus:ring-teal-500 transition-all ${
                  isDarkMode 
                    ? 'bg-slate-700 border-slate-600 text-white focus:border-teal-400' 
                    : 'bg-white border-gray-200 text-gray-700 focus:border-teal-500'
                }`}
              >
                <option value="">Select a folder</option>
                {Object.entries(categoryOptions).map(([key, value]) => (
                  <option key={key} value={key}>
                    {value.emoji} {value.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {renderDictionaryInfo()}

          <div>
            <label className={`block text-sm font-semibold mb-1.5 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
              Hint
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={formData.hint}
                onChange={(e) => setFormData(prev => ({ ...prev, hint: e.target.value }))}
                className={`flex-1 px-4 py-2.5 rounded-xl border-2 text-sm outline-none focus:ring-2 focus:ring-teal-500 transition-all ${
                  isDarkMode 
                    ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400 focus:border-teal-400' 
                    : 'bg-white border-gray-200 text-gray-700 placeholder-gray-400 focus:border-teal-500'
                }`}
                placeholder="Enter a hint for the word"
              />
              <button
                onClick={() => generateHint(formData.word)}
                disabled={!formData.word || generatingHint}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap shadow-sm ${
                  isDarkMode 
                    ? 'bg-teal-500/80 text-white hover:bg-teal-500' 
                    : 'bg-teal-500 text-white hover:bg-teal-600'
                }`}
              >
                {generatingHint ? (
                  <>
                    <Loader size={16} className="animate-spin" />
                    <span>Gen...</span>
                  </>
                ) : (
                  <>
                    <Wand2 size={16} />
                    <span>AI Hint</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-semibold mb-1.5 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                Difficulty
              </label>
              <select
                value={formData.difficulty}
                onChange={(e) => setFormData(prev => ({ ...prev, difficulty: e.target.value }))}
                className={`w-full px-4 py-2.5 rounded-xl border-2 text-sm outline-none focus:ring-2 focus:ring-teal-500 transition-all ${
                  isDarkMode 
                    ? 'bg-slate-700 border-slate-600 text-white focus:border-teal-400' 
                    : 'bg-white border-gray-200 text-gray-700 focus:border-teal-500'
                }`}
              >
                <option value="easy">🟢 Easy</option>
                <option value="medium">🟡 Medium</option>
                <option value="hard">🔴 Hard</option>
              </select>
            </div>
            <div>
              <label className={`block text-sm font-semibold mb-1.5 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                Points
              </label>
              <input
                type="number"
                value={formData.points}
                onChange={(e) => setFormData(prev => ({ ...prev, points: parseInt(e.target.value) || 0 }))}
                className={`w-full px-4 py-2.5 rounded-xl border-2 text-sm outline-none focus:ring-2 focus:ring-teal-500 transition-all ${
                  isDarkMode 
                    ? 'bg-slate-700 border-slate-600 text-white focus:border-teal-400' 
                    : 'bg-white border-gray-200 text-gray-700 focus:border-teal-500'
                }`}
                min="1"
                max="50"
              />
            </div>
          </div>

          <div>
            <label className={`block text-sm font-semibold mb-1.5 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
              Image
            </label>
            <div className={`border-2 border-solid rounded-xl p-4 text-center transition-colors cursor-pointer ${
              isDarkMode 
                ? 'border-slate-600 hover:border-teal-400' 
                : 'border-gray-200 hover:border-teal-500'
            }`}>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
                id="edit-image-upload"
              />
              <label htmlFor="edit-image-upload" className="cursor-pointer block">
                {imagePreview ? (
                  <div className="relative inline-block">
                    <img src={imagePreview} alt="Preview" className="max-h-40 rounded-lg shadow-sm" />
                    <button
                      onClick={(e) => { e.preventDefault(); setImagePreview(null); setSelectedImage(null); }}
                      className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-md"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="py-6">
                    <Upload size={32} className={`mx-auto mb-3 ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`} />
                    <p className={`text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>
                      Click to upload a new image
                    </p>
                    <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
                      PNG, JPG, GIF up to 5MB
                    </p>
                  </div>
                )}
              </label>
            </div>
          </div>
        </div>

        <div className={`sticky bottom-0 px-6 py-4 border-t flex justify-end gap-3 rounded-b-2xl ${
          isDarkMode 
            ? 'bg-slate-800 border-teal-400/30' 
            : 'bg-gray-50 border-teal-100'
        }`}>
          <button
            onClick={() => { setShowEditModal(false); resetForm(); }}
            className={`px-5 py-2.5 font-medium rounded-xl transition-colors text-sm ${
              isDarkMode 
                ? 'text-slate-300 hover:bg-slate-700' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Cancel
          </button>
          <button
            onClick={handleEditWord}
            disabled={saving}
            className={`px-6 py-2.5 text-white font-semibold rounded-xl transition-all shadow-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm ${
              isDarkMode 
                ? 'bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400' 
                : 'bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600'
            }`}
          >
            {saving ? (
              <>
                <Loader size={16} className="animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={16} />
                Update Word
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  // Bulk Import Modal
  const BulkImportModal = () => (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${
      isDarkMode ? 'bg-black/80' : 'bg-black/50'
    } backdrop-blur-sm`} onClick={() => { setShowBulkImport(false); setImportFile(null); setParsedWords([]); setShowPreview(false); }}>
      <div className={`rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border-2 ${
        isDarkMode 
          ? 'bg-slate-800 border-teal-400' 
          : 'bg-white border-teal-500'
      }`} onClick={(e) => e.stopPropagation()}>
        <div className={`sticky top-0 px-6 py-4 border-b flex justify-between items-center rounded-t-2xl ${
          isDarkMode 
            ? 'bg-slate-800 border-teal-400/30' 
            : 'bg-white border-teal-100'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${
              isDarkMode ? 'bg-teal-500/30' : 'bg-teal-500'
            }`}>
              <UploadIcon size={20} className="text-white" />
            </div>
            <div>
              <h2 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                Bulk Import Words
              </h2>
              <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                Import words from JSON, CSV, TXT, DOCX, or PDF files
              </p>
            </div>
          </div>
          <button 
            onClick={() => { setShowBulkImport(false); setImportFile(null); setParsedWords([]); setShowPreview(false); }} 
            className={`p-2 rounded-lg transition-colors ${
              isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-100'
            }`}
          >
            <X size={20} className={isDarkMode ? 'text-slate-400' : 'text-gray-500'} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <label className={`block text-sm font-semibold mb-1.5 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
              Choose File
            </label>
            <div className={`border-2 border-solid rounded-xl p-6 text-center transition-colors cursor-pointer ${
              isDarkMode 
                ? 'border-slate-600 hover:border-teal-400' 
                : 'border-gray-200 hover:border-teal-500'
            }`}>
              <input
                type="file"
                accept=".json,.csv,.txt,.docx,.pdf"
                onChange={handleFileSelect}
                className="hidden"
                id="bulk-import-file"
              />
              <label htmlFor="bulk-import-file" className="cursor-pointer block">
                {importFile ? (
                  <div>
                    <div className="text-3xl mb-2">📄</div>
                    <p className={`font-medium text-sm ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                      {importFile.name}
                    </p>
                    <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                      {(importFile.size / 1024).toFixed(1)} KB
                    </p>
                    <div className="flex justify-center gap-2 mt-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        isDarkMode ? 'bg-teal-500/20 text-teal-300' : 'bg-teal-100 text-teal-700'
                      }`}>
                        {importFile.name.split('.').pop().toUpperCase()}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        isDarkMode ? 'bg-teal-500/20 text-teal-300' : 'bg-teal-100 text-teal-700'
                      }`}>
                        {parsedWords.length} words found
                      </span>
                    </div>
                    <button
                      onClick={(e) => { e.preventDefault(); setImportFile(null); setParsedWords([]); setShowPreview(false); }}
                      className="mt-2 text-xs text-red-500 hover:text-red-600"
                    >
                      Remove file
                    </button>
                  </div>
                ) : (
                  <div className="py-6">
                    <UploadIcon size={48} className={`mx-auto mb-3 ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`} />
                    <p className={`text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>
                      Click or drag to select a file
                    </p>
                    <div className="flex flex-wrap justify-center gap-2 mt-3">
                      <span className={`text-xs px-2 py-1 rounded ${
                        isDarkMode ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-gray-600'
                      }`}>
                        JSON
                      </span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        isDarkMode ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-gray-600'
                      }`}>
                        CSV
                      </span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        isDarkMode ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-gray-600'
                      }`}>
                        TXT
                      </span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        isDarkMode ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-gray-600'
                      }`}>
                        DOCX
                      </span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        isDarkMode ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-gray-600'
                      }`}>
                        PDF
                      </span>
                    </div>
                    <p className={`text-xs mt-2 ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
                      Max file size: 10MB
                    </p>
                  </div>
                )}
              </label>
            </div>
          </div>

          <div className={`p-3 rounded-lg border ${
            isDarkMode 
              ? 'bg-teal-500/10 border-teal-400/30' 
              : 'bg-teal-50 border-teal-200'
          }`}>
            <p className={`text-xs font-medium ${isDarkMode ? 'text-teal-300' : 'text-teal-700'}`}>
              📝 Supported Formats:
            </p>
            <ul className={`text-xs mt-1 space-y-0.5 ${isDarkMode ? 'text-teal-300/70' : 'text-teal-600'}`}>
              <li>• <span className="font-mono">JSON</span>: Array of word objects with word, hint, category, difficulty</li>
              <li>• <span className="font-mono">CSV</span>: word,hint,category,difficulty (one per line)</li>
              <li>• <span className="font-mono">TXT</span>: word - hint (one per line)</li>
              <li>• <span className="font-mono">DOCX</span>: Extracts text and parses word-hint pairs</li>
              <li>• <span className="font-mono">PDF</span>: Extracts text and parses word-hint pairs</li>
            </ul>
          </div>

          {showPreview && parsedWords.length > 0 && (
            <div className={`p-3 rounded-lg border ${
              isDarkMode 
                ? 'bg-teal-500/10 border-teal-400/30' 
                : 'bg-teal-50 border-teal-200'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <p className={`text-xs font-medium ${isDarkMode ? 'text-teal-300' : 'text-teal-700'}`}>
                  Preview ({parsedWords.length} words)
                </p>
                <button
                  onClick={() => setShowPreview(false)}
                  className={`text-xs ${isDarkMode ? 'text-slate-400 hover:text-white' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  Hide
                </button>
              </div>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {parsedWords.slice(0, 10).map((word, idx) => (
                  <div key={idx} className={`text-xs flex items-center gap-2 ${
                    isDarkMode ? 'text-slate-300' : 'text-gray-600'
                  }`}>
                    <span className="font-bold">{word.word}</span>
                    <span className={isDarkMode ? 'text-slate-500' : 'text-gray-400'}>-</span>
                    <span className="truncate">{word.hint}</span>
                  </div>
                ))}
                {parsedWords.length > 10 && (
                  <p className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
                    ... and {parsedWords.length - 10} more
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className={`sticky bottom-0 px-6 py-4 border-t flex justify-end gap-3 rounded-b-2xl ${
          isDarkMode 
            ? 'bg-slate-800 border-teal-400/30' 
            : 'bg-gray-50 border-teal-100'
        }`}>
          <button
            onClick={() => { setShowBulkImport(false); setImportFile(null); setParsedWords([]); setShowPreview(false); }}
            className={`px-5 py-2.5 font-medium rounded-xl transition-colors text-sm ${
              isDarkMode 
                ? 'text-slate-300 hover:bg-slate-700' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Cancel
          </button>
          <button
            onClick={importParsedWords}
            disabled={!importFile || parsedWords.length === 0 || loading}
            className={`px-6 py-2.5 text-white font-semibold rounded-xl transition-all shadow-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm ${
              isDarkMode 
                ? 'bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400' 
                : 'bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600'
            }`}
          >
            {loading ? (
              <>
                <Loader size={16} className="animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Sparkles size={16} />
                Import {parsedWords.length} Words
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  // Main Return
  return (
    <div className={`w-full transition-all duration-500 ${
      isDarkMode 
        ? 'bg-transparent' 
        : 'bg-transparent'
    }`}>
      
      {/* Modals */}
      {showAddModal && <AddWordModal />}
      {showEditModal && <EditWordModal />}
      {showBulkImport && <BulkImportModal />}

      <main className="w-full px-0 sm:px-0 lg:px-0 py-4 max-w-full">
        {/* Stat Cards */}
        <div className="grid grid-cols-5 gap-2 mb-5 w-full">
          <div className={`rounded-lg px-3 py-2 transition-all duration-300 border-2 ${
            isDarkMode 
              ? 'bg-teal-900/30 backdrop-blur-sm border-teal-400' 
              : 'bg-teal-50 border-teal-500 shadow-md'
          }`}>
            <p className={`text-[9px] uppercase tracking-wider ${isDarkMode ? 'text-teal-300' : 'text-[#19475B]'}`}>
              Total Words
            </p>
            <p className={`text-lg font-bold ${isDarkMode ? 'text-teal-200' : 'text-[#19475B]'}`}>
              {stats.total}
            </p>
          </div>

          <div className={`rounded-lg px-3 py-2 transition-all duration-300 border-2 ${
            isDarkMode 
              ? 'bg-teal-900/30 backdrop-blur-sm border-teal-400' 
              : 'bg-teal-50 border-teal-500 shadow-md'
          }`}>
            <p className={`text-[9px] uppercase tracking-wider ${isDarkMode ? 'text-teal-300' : 'text-[#19475B]'}`}>
              Folders
            </p>
            <p className={`text-lg font-bold ${isDarkMode ? 'text-teal-200' : 'text-[#19475B]'}`}>
              {stats.categories}
            </p>
          </div>

          <div className={`rounded-lg px-3 py-2 transition-all duration-300 border-2 ${
            isDarkMode 
              ? 'bg-teal-900/30 backdrop-blur-sm border-teal-400' 
              : 'bg-teal-50 border-teal-500 shadow-md'
          }`}>
            <p className={`text-[9px] uppercase tracking-wider ${isDarkMode ? 'text-teal-300' : 'text-[#19475B]'}`}>
              With Images
            </p>
            <p className={`text-lg font-bold ${isDarkMode ? 'text-teal-200' : 'text-[#19475B]'}`}>
              {stats.withImages}
            </p>
          </div>

          <div className={`rounded-lg px-3 py-2 transition-all duration-300 border-2 ${
            isDarkMode 
              ? 'bg-teal-900/30 backdrop-blur-sm border-teal-400' 
              : 'bg-teal-50 border-teal-500 shadow-md'
          }`}>
            <p className={`text-[9px] uppercase tracking-wider ${isDarkMode ? 'text-teal-300' : 'text-[#19475B]'}`}>
              Avg Points
            </p>
            <p className={`text-lg font-bold ${isDarkMode ? 'text-teal-200' : 'text-[#19475B]'}`}>
              {stats.avgPoints}
            </p>
          </div>

          <div className={`rounded-lg px-3 py-2 transition-all duration-300 border-2 ${
            isDarkMode 
              ? 'bg-teal-900/30 backdrop-blur-sm border-teal-400' 
              : 'bg-teal-50 border-teal-500 shadow-md'
          }`}>
            <p className={`text-[9px] uppercase tracking-wider ${isDarkMode ? 'text-teal-300' : 'text-[#19475B]'}`}>
              With Hints
            </p>
            <p className={`text-lg font-bold ${isDarkMode ? 'text-teal-200' : 'text-[#19475B]'}`}>
              {stats.withHints}
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          
          {/* Folder View */}
          <div className={`rounded-2xl transition-all duration-500 overflow-hidden border-2 order-2 lg:order-1 ${
            isDarkMode 
              ? 'bg-slate-800/50 backdrop-blur-sm border-teal-400' 
              : 'bg-white shadow-xl border-teal-500'
          }`}>
            <div className={`p-4 border-b ${
              isDarkMode 
                ? 'border-teal-400/30 bg-teal-900/20' 
                : 'border-teal-500/30 bg-gradient-to-r from-teal-50 to-emerald-50'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className={`text-base font-bold ${isDarkMode ? 'text-teal-300' : 'text-[#19475B]'}`}>
                    Word Folders
                  </h2>
                  <p className={`text-[11px] mt-0.5 ${isDarkMode ? 'text-teal-300/70' : 'text-[#19475B]/70'}`}>
                    Organize and manage hangman words
                  </p>
                </div>
                <div className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                  isDarkMode 
                    ? 'bg-teal-500/20 text-teal-300' 
                    : 'bg-teal-100 text-[#19475B]'
                }`}>
                  {words.length} words
                </div>
              </div>
            </div>

            {/* Search & Filter */}
            <div className="p-3 border-b border-teal-200 dark:border-teal-700">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex-1 relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-teal-400" />
                  <input
                    type="text"
                    placeholder="Search words or hints..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`w-full pl-9 pr-3 py-1.5 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-teal-500 transition-all ${
                      isDarkMode 
                        ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500 focus:border-teal-400' 
                        : 'bg-white border-teal-200 text-[#19475B] placeholder-teal-400 focus:border-teal-500'
                    }`}
                  />
                </div>
                <div className="sm:w-44">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className={`w-full px-3 py-1.5 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-teal-500 transition-all ${
                      isDarkMode 
                        ? 'bg-slate-900 border-slate-700 text-white focus:border-teal-400' 
                        : 'bg-white border-teal-200 text-[#19475B] focus:border-teal-500'
                    }`}
                  >
                    <option value="all">All Folders</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>
                        {categoryOptions[cat]?.emoji} {categoryOptions[cat]?.name || cat}
                      </option>
                    ))}
                  </select>
                </div>
                {(searchTerm || selectedCategory !== 'all') && (
                  <button
                    onClick={() => { setSearchTerm(''); setSelectedCategory('all'); }}
                    className={`px-3 py-1.5 text-sm rounded-lg border transition ${
                      isDarkMode 
                        ? 'border-slate-700 text-slate-300 hover:bg-slate-700' 
                        : 'border-teal-200 text-[#19475B] hover:bg-teal-50'
                    }`}
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </div>

            <div className="p-3 max-h-[60vh] overflow-y-auto custom-scrollbar">
              {loading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((item) => (
                    <div key={item} className={`h-16 rounded-xl animate-pulse ${isDarkMode ? 'bg-slate-700/50' : 'bg-teal-100'}`} />
                  ))}
                </div>
              ) : categories.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-5xl mb-3">📁</div>
                  <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-[#19475B]/70'}`}>
                    No folders yet
                  </p>
                  <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                    Add your first word to create a folder
                  </p>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className={`mt-3 px-4 py-2 text-white rounded-lg font-medium transition shadow-md text-sm ${
                      isDarkMode 
                        ? 'bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400' 
                        : 'bg-teal-600 hover:bg-teal-700'
                    }`}
                  >
                    <Plus size={16} className="inline mr-1" />
                    Add Word
                  </button>
                </div>
              ) : (
                // Show only subject folders (all 7 subjects always visible)
                Object.entries(categoryOptions).map(([categoryKey, categoryInfo]) => {
                  const categoryWords = wordsByCategory[categoryKey] || [];
                  const isExpanded = expandedFolders[categoryKey];
                  
                  return (
                    <div key={categoryKey} className={`rounded-xl border overflow-hidden transition-all hover:shadow-md mb-2 ${
                      isDarkMode 
                        ? 'bg-slate-800 border-slate-700' 
                        : 'bg-white border-teal-200'
                    }`}>
                      <div
                        className={`flex items-center justify-between p-3 cursor-pointer transition-colors ${
                          isDarkMode ? 'hover:bg-slate-700/50' : 'hover:bg-teal-50'
                        }`}
                        onClick={() => toggleFolder(categoryKey)}
                      >
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-10 h-10 rounded-xl flex items-center justify-center"
                            style={{ backgroundColor: '#0d9488' + '20' }}
                          >
                            <span className="text-xl">{categoryInfo.emoji}</span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                                {categoryInfo.name}
                              </span>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                isDarkMode ? 'bg-slate-700 text-slate-400' : 'bg-teal-100 text-teal-600'
                              }`}>
                                {categoryWords.length} words
                              </span>
                            </div>
                            <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                              {categoryInfo.description}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setFormData(prev => ({ ...prev, category: categoryKey }));
                              setShowAddModal(true);
                            }}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isDarkMode 
                                ? 'hover:bg-teal-500/20 text-teal-400' 
                                : 'hover:bg-teal-100 text-teal-600'
                            }`}
                            title="Add word to this subject"
                          >
                            <Plus size={18} />
                          </button>
                          <span className={isDarkMode ? 'text-slate-500' : 'text-gray-400'}>
                            {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                          </span>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className={`border-t p-3 ${isDarkMode ? 'border-slate-700' : 'border-teal-100'}`}>
                          {categoryWords.length === 0 ? (
                            <div className={`text-center py-4 text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-400'}`}>
                              No words in this subject yet
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setFormData(prev => ({ ...prev, category: categoryKey }));
                                  setShowAddModal(true);
                                }}
                                className={`ml-1 font-medium ${
                                  isDarkMode ? 'text-teal-400 hover:text-teal-300' : 'text-teal-600 hover:text-teal-700'
                                }`}
                              >
                                Add one →
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-1.5">
                              {/* Show word count summary instead of individual cards */}
                              <div className={`flex items-center justify-between px-3 py-2 rounded-lg ${
                                isDarkMode ? 'bg-slate-900/50' : 'bg-teal-50/50'
                              }`}>
                                <div className="flex items-center gap-4 text-xs">
                                  <span className={isDarkMode ? 'text-slate-300' : 'text-gray-600'}>
                                    📝 {categoryWords.length} words
                                  </span>
                                  <span className={isDarkMode ? 'text-slate-400' : 'text-gray-500'}>
                                    🟢 {categoryWords.filter(w => w.difficulty === 'easy').length} easy
                                  </span>
                                  <span className={isDarkMode ? 'text-slate-400' : 'text-gray-500'}>
                                    🟡 {categoryWords.filter(w => w.difficulty === 'medium').length} medium
                                  </span>
                                  <span className={isDarkMode ? 'text-slate-400' : 'text-gray-500'}>
                                    🔴 {categoryWords.filter(w => w.difficulty === 'hard').length} hard
                                  </span>
                                </div>
                              </div>
                              
                              {/* Compact word list - just names, no full cards */}
                              <div className="flex flex-wrap gap-1.5 px-1">
                                {categoryWords.map(word => (
                                  <span
                                    key={word.id || word._id}
                                    className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg border cursor-pointer group transition-all hover:shadow-sm ${
                                      isDarkMode
                                        ? 'bg-slate-700 border-slate-600 text-slate-200 hover:border-teal-400'
                                        : 'bg-white border-gray-200 text-gray-700 hover:border-teal-400'
                                    }`}
                                    title={word.hint || word.word}
                                  >
                                    <span className="font-semibold">{word.word}</span>
                                    <button
                                      onClick={() => openEditModal(word)}
                                      className="opacity-0 group-hover:opacity-100 transition-opacity text-teal-500"
                                      title="Edit"
                                    >
                                      <Edit size={10} />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteWord(word.id || word._id)}
                                      className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400"
                                      title="Delete"
                                    >
                                      <Trash2 size={10} />
                                    </button>
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div className={`p-3 border-t ${
              isDarkMode 
                ? 'border-slate-700 bg-slate-900/50' 
                : 'border-teal-200 bg-teal-50'
            }`}>
              <div className="flex justify-between items-center text-[11px]">
                <div className={`flex items-center gap-4 ${isDarkMode ? 'text-slate-400' : 'text-[#19475B]/70'}`}>
                  <span className="flex items-center gap-1">
                    <File size={14} />
                    {words.length} words
                  </span>
                  <span className="flex items-center gap-1">
                    <Folder size={14} />
                    {categories.length} folders
                  </span>
                  <span className="flex items-center gap-1">
                    <Sparkles size={14} className="text-teal-500" />
                    {stats.withHints} hints
                  </span>
                </div>
                <div className={`text-[10px] ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                  Updated: {new Date().toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className={`rounded-2xl transition-all duration-500 overflow-hidden border-2 order-1 lg:order-2 ${
            isDarkMode 
              ? 'bg-slate-800/50 backdrop-blur-sm border-teal-400' 
              : 'bg-white shadow-xl border-teal-500'
          }`}>
            <div className={`p-4 border-b ${
              isDarkMode 
                ? 'border-teal-400/30 bg-teal-900/20' 
                : 'border-teal-500/30 bg-gradient-to-r from-teal-50 to-emerald-50'
            }`}>
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-md ${
                  isDarkMode ? 'bg-teal-500/30' : 'bg-teal-500'
                }`}>
                  <Sparkles size={16} className="text-white" />
                </div>
                <div>
                  <h3 className={`font-bold text-sm ${isDarkMode ? 'text-teal-300' : 'text-[#19475B]'}`}>
                    Quick Actions
                  </h3>
                  <p className={`text-[11px] ${isDarkMode ? 'text-teal-300/70' : 'text-[#19475B]/70'}`}>
                    Manage your word collection
                  </p>
                </div>
              </div>
            </div>

            <div className="p-3 space-y-2">
              <button
                onClick={bulkGenerateHints}
                disabled={loading || words.length === 0}
                className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50 ${
                  isDarkMode 
                    ? 'bg-teal-500/20 text-teal-400 hover:bg-teal-500/30' 
                    : 'bg-teal-50 text-teal-700 hover:bg-teal-100'
                }`}
              >
                <Wand2 size={16} />
                Generate All Hints
              </button>
              <button
                onClick={exportWords}
                className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  isDarkMode 
                    ? 'bg-teal-500/20 text-teal-400 hover:bg-teal-500/30' 
                    : 'bg-teal-50 text-teal-700 hover:bg-teal-100'
                }`}
              >
                <Download size={16} />
                Export Words
              </button>
              <button
                onClick={() => setShowBulkImport(true)}
                className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  isDarkMode 
                    ? 'bg-teal-500/20 text-teal-400 hover:bg-teal-500/30' 
                    : 'bg-teal-50 text-teal-700 hover:bg-teal-100'
                }`}
              >
                <UploadIcon size={16} />
                Bulk Import
              </button>
              <button
                onClick={() => setShowPdfImport(true)}
                className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  isDarkMode 
                    ? 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30' 
                    : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                }`}
              >
                <FileText size={16} />
                Import from PDF
              </button>
              <button
                onClick={expandAllFolders}
                className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  isDarkMode 
                    ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' 
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <ChevronDown size={16} />
                Expand All Folders
              </button>
              <button
                onClick={collapseAllFolders}
                className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  isDarkMode 
                    ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' 
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <ChevronRight size={16} />
                Collapse All Folders
              </button>
              <button
                onClick={fetchWords}
                className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  isDarkMode 
                    ? 'bg-teal-500/20 text-teal-400 hover:bg-teal-500/30' 
                    : 'bg-teal-50 text-teal-700 hover:bg-teal-100'
                }`}
              >
                <RefreshCw size={16} />
                Refresh
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className={`w-full px-3 py-2 rounded-lg text-sm font-medium text-white transition-all shadow-md flex items-center justify-center gap-2 ${
                  isDarkMode 
                    ? 'bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400' 
                    : 'bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600'
                }`}
              >
                <Plus size={16} />
                Add Word
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* PDF Import Modal */}
      {showPdfImport && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${isDarkMode ? 'bg-black/80' : 'bg-black/50'} backdrop-blur-sm`}
          onClick={() => { setShowPdfImport(false); setPdfCategory(''); }}>
          <div className={`rounded-2xl max-w-md w-full shadow-2xl border-2 ${
            isDarkMode ? 'bg-slate-800 border-teal-400' : 'bg-white border-teal-500'
          }`} onClick={e => e.stopPropagation()}>
            
            {/* Header */}
            <div className={`px-5 py-4 border-b flex justify-between items-center ${
              isDarkMode ? 'border-teal-400/30 bg-teal-900/20' : 'border-teal-100 bg-teal-50'
            }`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500 flex items-center justify-center shadow">
                  <FileText size={20} className="text-white" />
                </div>
                <div>
                  <h2 className={`text-base font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                    Import from PDF
                  </h2>
                  <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                    Extract words and illustrations from a PDF
                  </p>
                </div>
              </div>
              <button onClick={() => { setShowPdfImport(false); setPdfCategory(''); }}
                className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-gray-100 text-gray-400'}`}>
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4">
              {/* Subject selector */}
              <div>
                <label className={`block text-sm font-semibold mb-1.5 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                  Subject Folder
                </label>
                <select
                  value={pdfCategory}
                  onChange={e => setPdfCategory(e.target.value)}
                  className={`w-full px-3 py-2.5 rounded-xl border text-sm ${
                    isDarkMode 
                      ? 'bg-slate-900 border-slate-700 text-white' 
                      : 'bg-white border-gray-200 text-gray-800'
                  } focus:border-teal-400 outline-none`}
                >
                  <option value="">Select a subject...</option>
                  {Object.entries(categoryOptions).map(([key, cat]) => (
                    <option key={key} value={key}>{cat.emoji} {cat.name}</option>
                  ))}
                </select>
              </div>

              {/* File upload */}
              <div>
                <label className={`block text-sm font-semibold mb-1.5 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                  PDF File
                </label>
                <div className={`border-2 border-solid rounded-xl p-6 text-center transition ${
                  isDarkMode ? 'border-slate-600 hover:border-teal-400' : 'border-gray-200 hover:border-teal-400'
                }`}>
                  <FileText size={32} className={`mx-auto mb-2 ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`} />
                  <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                    Upload a PDF with vocabulary words and illustrations
                  </p>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={e => {
                      if (e.target.files[0]) handlePdfImport(e.target.files[0]);
                    }}
                    disabled={!pdfCategory || pdfImporting}
                    className="mt-3 text-sm file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-teal-500 file:text-white hover:file:bg-teal-600 file:cursor-pointer disabled:opacity-50"
                  />
                </div>
              </div>

              {/* What it does */}
              <div className={`p-3 rounded-xl text-xs space-y-1 ${isDarkMode ? 'bg-slate-900 text-slate-400' : 'bg-gray-50 text-gray-500'}`}>
                <p className="font-semibold text-teal-600">What this does:</p>
                <p>1. Extracts text from the PDF</p>
                <p>2. Uses AI to find vocabulary words and create hints</p>
                <p>3. Extracts illustrations/images and uploads them</p>
                <p>4. Links images to matching words</p>
                <p>5. Saves everything to the selected subject folder</p>
              </div>

              {/* Loading state */}
              {pdfImporting && (
                <div className="flex items-center justify-center gap-3 py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-3 border-teal-500 border-t-transparent" />
                  <p className={`text-sm font-medium ${isDarkMode ? 'text-teal-400' : 'text-teal-600'}`}>
                    Processing PDF... extracting words and images
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out forwards;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb { 
          background: ${isDarkMode ? '#334155' : '#cbd5e1'};
          borderRadius: '2px';
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: ${isDarkMode ? '#475569' : '#94a3b8'};
        }
      `}</style>
    </div>
  );
};

export default AdminHangmanManager;