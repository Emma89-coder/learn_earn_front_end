// AdminHangmanManager.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import API_URL from '../../config';
import {
  ArrowLeft, Plus, Edit, Trash2, Save, X, Upload,
  Image, BookOpen, Shirt, Briefcase, Globe, GraduationCap,
  Music, Utensils, Car, Home, Activity, Gamepad2,
  Search, Download, Upload as UploadIcon, RefreshCw,
  Trophy, Zap, TrendingUp, Award, Sparkles, Wand2,
  Folder, FolderOpen, File, ChevronRight, ChevronDown
} from 'lucide-react';

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
  const [generatingHint, setGeneratingHint] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState({});
  const [viewMode, setViewMode] = useState('folders'); // 'folders' or 'list'
  const [formData, setFormData] = useState({
    word: '',
    category: '',
    hint: '',
    difficulty: 'medium',
    points: 2
  });

  // Category definitions with folder icons
  const categoryOptions = {
    clothes: { 
      name: 'Clothes', 
      icon: <Shirt size={20} />, 
      color: '#ec4899', 
      bg: 'bg-pink-100', 
      text: 'text-pink-700',
      description: 'Fashion and clothing items',
      emoji: '👗'
    },
    careers: { 
      name: 'Careers', 
      icon: <Briefcase size={20} />, 
      color: '#3b82f6', 
      bg: 'bg-blue-100', 
      text: 'text-blue-700',
      description: 'Professions and jobs',
      emoji: '💼'
    },
    countries: { 
      name: 'Countries', 
      icon: <Globe size={20} />, 
      color: '#10b981', 
      bg: 'bg-emerald-100', 
      text: 'text-emerald-700',
      description: 'Nations around the world',
      emoji: '🌍'
    },
    classroom: { 
      name: 'Classroom', 
      icon: <GraduationCap size={20} />, 
      color: '#8b5cf6', 
      bg: 'bg-purple-100', 
      text: 'text-purple-700',
      description: 'School and education items',
      emoji: '🏫'
    },
    music: { 
      name: 'Music', 
      icon: <Music size={20} />, 
      color: '#f43f5e', 
      bg: 'bg-rose-100', 
      text: 'text-rose-700',
      description: 'Musical instruments and terms',
      emoji: '🎵'
    },
    food: { 
      name: 'Food', 
      icon: <Utensils size={20} />, 
      color: '#f59e0b', 
      bg: 'bg-amber-100', 
      text: 'text-amber-700',
      description: 'Delicious food items',
      emoji: '🍕'
    },
    vehicles: { 
      name: 'Vehicles', 
      icon: <Car size={20} />, 
      color: '#06b6d4', 
      bg: 'bg-cyan-100', 
      text: 'text-cyan-700',
      description: 'Transportation and vehicles',
      emoji: '🚗'
    },
    home: { 
      name: 'Home', 
      icon: <Home size={20} />, 
      color: '#14b8a6', 
      bg: 'bg-teal-100', 
      text: 'text-teal-700',
      description: 'Household items and rooms',
      emoji: '🏠'
    },
    sports: { 
      name: 'Sports', 
      icon: <Activity size={20} />, 
      color: '#ef4444', 
      bg: 'bg-red-100', 
      text: 'text-red-700',
      description: 'Sports and athletic activities',
      emoji: '⚽'
    },
    gaming: { 
      name: 'Gaming', 
      icon: <Gamepad2 size={20} />, 
      color: '#8b5cf6', 
      bg: 'bg-indigo-100', 
      text: 'text-indigo-700',
      description: 'Video games and gaming terms',
      emoji: '🎮'
    }
  };

  const difficultyColors = {
    easy: { bg: 'bg-green-100', text: 'text-green-700' },
    medium: { bg: 'bg-amber-100', text: 'text-amber-700' },
    hard: { bg: 'bg-red-100', text: 'text-red-700' }
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

  // AI Hint Generation
  const generateAIHint = async (word, category) => {
    if (!word) {
      toast.error('Please enter a word first');
      return;
    }

    setGeneratingHint(true);
    try {
      // Smart hint generation
      const hint = generateFallbackHint(word, category);
      setFormData(prev => ({ ...prev, hint: hint }));
      toast.success('✨ Hint generated successfully!');
    } catch (error) {
      console.error('Error generating hint:', error);
      toast.error('Failed to generate hint');
    } finally {
      setGeneratingHint(false);
    }
  };

  // Fallback hint generation
  const generateFallbackHint = (word, category) => {
    const wordHints = {
      MALAWI: 'The Warm Heart of Africa',
      ZAMBIA: 'Home to Victoria Falls',
      TANZANIA: 'Home to Mount Kilimanjaro',
      KENYA: 'Known for its wildlife safaris',
      NIGERIA: 'The Giant of Africa',
      GHANA: 'The Gold Coast of Africa',
      EGYPT: 'Home to the ancient pyramids',
      'SOUTH AFRICA': 'The Rainbow Nation',
      TEACHER: 'Helps students learn and grow',
      DOCTOR: 'Treats patients and saves lives',
      ENGINEER: 'Builds and designs structures',
      NURSE: 'Cares for patients in hospitals',
      GUITAR: 'A stringed musical instrument with six strings',
      PIANO: 'A keyboard instrument with black and white keys',
      DRUMS: 'Percussion instrument played with sticks',
      VIOLIN: 'String instrument played with a bow',
      PIZZA: 'Italian dish with cheese and toppings',
      BURGER: 'Served between two buns with a patty',
      PASTA: 'Italian noodle dish',
      SUSHI: 'Japanese rice dish with raw fish',
      BICYCLE: 'Two-wheeled pedal-powered vehicle',
      CAR: 'Four-wheeled motor vehicle for transportation',
      KITCHEN: 'Room where food is prepared and cooked',
      BATHROOM: 'Room for personal hygiene and bathing',
      BEDROOM: 'Room where you sleep and rest',
      FOOTBALL: 'Most popular sport played with a round ball',
      BASKETBALL: 'Sport played with a hoop and ball',
      TENNIS: 'Racket sport played on a court',
      SWIMMING: 'Moving through water using limbs',
      MINECRAFT: 'Popular block-building video game',
      FORTNITE: 'Popular battle royale video game',
      MARIO: 'Famous plumber video game character',
      ZELDA: 'Adventure video game series',
      HANGMAN: 'A classic word guessing game',
      JACKET: 'A piece of clothing worn on the upper body for warmth',
      TROUSERS: 'A garment worn on the legs, also called pants',
      SHIRT: 'A garment worn on the upper torso',
      DRESS: 'A one-piece garment for women',
      SKIRT: 'A garment that hangs from the waist',
      JEANS: 'Denim pants for casual wear',
      SWEATER: 'A knitted garment for warmth',
      SCARF: 'Worn around the neck for warmth or style',
      GLOVES: 'Hand coverings for warmth or protection',
      BOOTS: 'Footwear that covers the ankle and foot',
      SANDALS: 'Open footwear with straps',
      HAT: 'Headwear for fashion or protection from sun',
      BELT: 'A strap worn around the waist to hold up pants'
    };

    // Check for word-specific hint
    const wordKey = word.toUpperCase();
    if (wordHints[wordKey]) {
      return wordHints[wordKey];
    }

    // Category-based hints
    const categoryHints = {
      clothes: ['A type of garment worn on the body', 'A fashion item you wear', 'Something you put on daily'],
      careers: ['A profession or occupation', 'A job title or career path', 'What someone does for work'],
      countries: ['A nation in the world', 'A country with a capital city', 'A place on the map'],
      classroom: ['Found in a school or classroom', 'Something students use', 'An educational item'],
      music: ['A musical instrument or term', 'Something used to create music', 'A sound-making device'],
      food: ['A type of food or dish', 'Something delicious to eat', 'A culinary item'],
      vehicles: ['A mode of transportation', 'Something that moves people or goods', 'A vehicle on the road'],
      home: ['Found in a house or home', 'A household item', 'Something in your living space'],
      sports: ['A sport or physical activity', 'Something played competitively', 'An athletic activity'],
      gaming: ['A video game or gaming term', 'Something from the gaming world', 'A game title or reference']
    };

    const hints = categoryHints[category] || ['A word related to this category', 'A term you need to guess'];
    return hints[Math.floor(Math.random() * hints.length)] + ` (${word.length} letters)`;
  };

  // Auto-generate hint
  const autoGenerateHint = async () => {
    if (formData.word && formData.category && !formData.hint) {
      await generateAIHint(formData.word, formData.category);
    }
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
        // Auto-expand categories with words
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
        toast.success('Word added successfully! 🎉');
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
        toast.success('Word updated successfully! 📝');
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
        toast.success('Word deleted successfully! 🗑️');
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

  // Add default words
  const addDefaultWords = async () => {
    const defaultWords = [
      // Countries
      { word: 'MALAWI', category: 'countries' },
      { word: 'ZAMBIA', category: 'countries' },
      { word: 'TANZANIA', category: 'countries' },
      { word: 'KENYA', category: 'countries' },
      { word: 'NIGERIA', category: 'countries' },
      // Careers
      { word: 'TEACHER', category: 'careers' },
      { word: 'DOCTOR', category: 'careers' },
      { word: 'ENGINEER', category: 'careers' },
      { word: 'NURSE', category: 'careers' },
      // Music
      { word: 'GUITAR', category: 'music' },
      { word: 'PIANO', category: 'music' },
      { word: 'DRUMS', category: 'music' },
      { word: 'VIOLIN', category: 'music' },
      // Food
      { word: 'PIZZA', category: 'food' },
      { word: 'BURGER', category: 'food' },
      { word: 'PASTA', category: 'food' },
      { word: 'SUSHI', category: 'food' },
      // Vehicles
      { word: 'BICYCLE', category: 'vehicles' },
      { word: 'CAR', category: 'vehicles' },
      { word: 'MOTORCYCLE', category: 'vehicles' },
      // Home
      { word: 'KITCHEN', category: 'home' },
      { word: 'BATHROOM', category: 'home' },
      { word: 'BEDROOM', category: 'home' },
      { word: 'LIVINGROOM', category: 'home' },
      // Sports
      { word: 'FOOTBALL', category: 'sports' },
      { word: 'BASKETBALL', category: 'sports' },
      { word: 'TENNIS', category: 'sports' },
      { word: 'SWIMMING', category: 'sports' },
      // Gaming
      { word: 'MINECRAFT', category: 'gaming' },
      { word: 'FORTNITE', category: 'gaming' },
      { word: 'MARIO', category: 'gaming' },
      // Clothes
      { word: 'JACKET', category: 'clothes' },
      { word: 'TROUSERS', category: 'clothes' },
      { word: 'SHIRT', category: 'clothes' },
      { word: 'DRESS', category: 'clothes' }
    ];

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      let added = 0;
      for (const wordData of defaultWords) {
        try {
          const hint = generateFallbackHint(wordData.word, wordData.category);
          await axios.post(`${API_URL}/api/admin/hangman/words`, {
            word: wordData.word,
            category: wordData.category,
            hint: hint,
            difficulty: 'medium',
            points: 2
          }, {
            headers: { Authorization: `Bearer ${token}` }
          });
          added++;
        } catch (e) {
          console.log('Skipping existing word:', wordData.word);
        }
      }
      
      toast.success(`Added ${added} default words to folders! 🎯`);
      fetchWords();
    } catch (error) {
      console.error('Error adding default words:', error);
      toast.error('Failed to add default words');
    } finally {
      setLoading(false);
    }
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
    toast.success('Words exported successfully! 📤');
  };

  // Import words
  const importWords = async () => {
    if (!importFile) {
      toast.error('Please select a file to import');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const importedWords = JSON.parse(e.target.result);
          let added = 0;
          
          for (const word of importedWords) {
            try {
              if (!word.hint) {
                word.hint = generateFallbackHint(word.word, word.category);
              }
              await axios.post(`${API_URL}/api/admin/hangman/words`, word, {
                headers: { Authorization: `Bearer ${token}` }
              });
              added++;
            } catch (e) {
              console.log('Skipping existing word:', word.word);
            }
          }
          
          toast.success(`Imported ${added} words into folders! 📥`);
          setImportFile(null);
          setShowBulkImport(false);
          fetchWords();
        } catch (error) {
          console.error('Error importing words:', error);
          toast.error('Failed to import words. Check file format.');
        } finally {
          setLoading(false);
        }
      };
      
      reader.readAsText(importFile);
    } catch (error) {
      console.error('Error importing words:', error);
      toast.error('Failed to import words');
      setLoading(false);
    }
  };

  // Bulk generate hints
  const bulkGenerateHints = async () => {
    if (words.length === 0) {
      toast.error('No words to generate hints for');
      return;
    }

    if (!window.confirm(`Generate hints for all ${words.length} words?`)) {
      return;
    }

    setLoading(true);
    let updated = 0;
    let failed = 0;

    for (const word of words) {
      try {
        const newHint = generateFallbackHint(word.word, word.category);
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

    toast.success(`✨ Updated ${updated} words with new hints! ${failed} failed.`);
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
    <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200 hover:shadow-md transition-all hover:border-teal-300">
      <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-sm font-bold text-teal-700 flex-shrink-0">
        {index + 1}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-bold text-gray-800">{word.word}</span>
          {word.hint && (
            <span className="text-xs text-purple-600 flex items-center gap-1">
              <Sparkles size={12} />
              {word.hint}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
            difficultyColors[word.difficulty]?.bg || 'bg-gray-100'
          } ${difficultyColors[word.difficulty]?.text || 'text-gray-600'}`}>
            {word.difficulty || 'medium'}
          </span>
          <span className="text-xs text-gray-500">⭐ {word.points || 2} pts</span>
        </div>
      </div>
      <div className="flex items-center gap-1">
        {word.imageUrl && (
          <img src={word.imageUrl} alt={word.word} className="w-8 h-8 rounded-lg object-cover border border-gray-200" />
        )}
        <button
          onClick={() => openEditModal(word)}
          className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-500 transition-colors"
          title="Edit"
        >
          <Edit size={16} />
        </button>
        <button
          onClick={() => handleDeleteWord(word._id)}
          className="p-1.5 hover:bg-red-50 rounded-lg text-red-500 transition-colors"
          title="Delete"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );

  // Add Word Modal
  const AddWordModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => { setShowAddModal(false); resetForm(); }}>
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-md">
              <Plus size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Add New Word</h2>
              <p className="text-sm text-gray-500">Add a new word to a category folder</p>
            </div>
          </div>
          <button onClick={() => { setShowAddModal(false); resetForm(); }} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Word *</label>
              <input
                type="text"
                value={formData.word}
                onChange={(e) => {
                  const newWord = e.target.value.toUpperCase();
                  setFormData({ ...formData, word: newWord });
                  if (formData.hint) setFormData(prev => ({ ...prev, hint: '' }));
                }}
                onBlur={autoGenerateHint}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none transition-all"
                placeholder="Enter the word"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category Folder *</label>
              <select
                value={formData.category}
                onChange={(e) => {
                  setFormData({ ...formData, category: e.target.value });
                  if (formData.hint) setFormData(prev => ({ ...prev, hint: '' }));
                }}
                onBlur={autoGenerateHint}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none transition-all"
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hint</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={formData.hint}
                onChange={(e) => setFormData({ ...formData, hint: e.target.value })}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none transition-all"
                placeholder="AI will generate a hint automatically"
              />
              <button
                onClick={() => generateAIHint(formData.word, formData.category)}
                disabled={!formData.word || generatingHint}
                className="px-4 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl hover:from-purple-600 hover:to-indigo-600 transition-all shadow-md flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {generatingHint ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 size={16} />
                    AI Hint
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
              <select
                value={formData.difficulty}
                onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none transition-all"
              >
                <option value="easy">🌱 Easy</option>
                <option value="medium">📘 Medium</option>
                <option value="hard">🎓 Hard</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Points</label>
              <input
                type="number"
                value={formData.points}
                onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none transition-all"
                min="1"
                max="50"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Image (Optional)</label>
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:border-teal-400 transition-colors">
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
                    <img src={imagePreview} alt="Preview" className="max-h-48 rounded-lg shadow-sm" />
                    <button
                      onClick={(e) => { e.preventDefault(); setImagePreview(null); setSelectedImage(null); }}
                      className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-md"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="py-8">
                    <Upload size={32} className="mx-auto text-gray-400 mb-3" />
                    <p className="text-sm text-gray-600 font-medium">Click to upload an image</p>
                    <p className="text-xs text-gray-400 mt-1">PNG, JPG, GIF up to 5MB</p>
                  </div>
                )}
              </label>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-100 px-6 py-4 flex justify-end gap-3 rounded-b-2xl">
          <button
            onClick={() => { setShowAddModal(false); resetForm(); }}
            className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleAddWord}
            disabled={saving}
            className="px-6 py-2.5 bg-gradient-to-r from-teal-600 to-cyan-600 text-white font-medium rounded-xl hover:from-teal-700 hover:to-cyan-700 transition-all shadow-md flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Adding...
              </>
            ) : (
              <>
                <Sparkles size={18} />
                Add to Folder
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  // Edit Word Modal
  const EditWordModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => { setShowEditModal(false); resetForm(); }}>
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-md">
              <Edit size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Edit Word</h2>
              <p className="text-sm text-gray-500">Update the word details</p>
            </div>
          </div>
          <button onClick={() => { setShowEditModal(false); resetForm(); }} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Word *</label>
              <input
                type="text"
                value={formData.word}
                onChange={(e) => setFormData({ ...formData, word: e.target.value.toUpperCase() })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category Folder *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none transition-all"
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hint</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={formData.hint}
                onChange={(e) => setFormData({ ...formData, hint: e.target.value })}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none transition-all"
                placeholder="Enter a hint for the word"
              />
              <button
                onClick={() => generateAIHint(formData.word, formData.category)}
                disabled={!formData.word || generatingHint}
                className="px-4 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl hover:from-purple-600 hover:to-indigo-600 transition-all shadow-md flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {generatingHint ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 size={16} />
                    AI Hint
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
              <select
                value={formData.difficulty}
                onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none transition-all"
              >
                <option value="easy">🌱 Easy</option>
                <option value="medium">📘 Medium</option>
                <option value="hard">🎓 Hard</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Points</label>
              <input
                type="number"
                value={formData.points}
                onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none transition-all"
                min="1"
                max="50"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:border-teal-400 transition-colors">
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
                    <img src={imagePreview} alt="Preview" className="max-h-48 rounded-lg shadow-sm" />
                    <button
                      onClick={(e) => { e.preventDefault(); setImagePreview(null); setSelectedImage(null); }}
                      className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-md"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="py-8">
                    <Upload size={32} className="mx-auto text-gray-400 mb-3" />
                    <p className="text-sm text-gray-600 font-medium">Click to upload a new image</p>
                    <p className="text-xs text-gray-400 mt-1">PNG, JPG, GIF up to 5MB</p>
                  </div>
                )}
              </label>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-100 px-6 py-4 flex justify-end gap-3 rounded-b-2xl">
          <button
            onClick={() => { setShowEditModal(false); resetForm(); }}
            className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleEditWord}
            disabled={saving}
            className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Saving...
              </>
            ) : (
              <>
                <Save size={18} />
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => { setShowBulkImport(false); setImportFile(null); }}>
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-md">
              <UploadIcon size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Import Words</h2>
              <p className="text-sm text-gray-500">Import words into folders from JSON</p>
            </div>
          </div>
          <button onClick={() => { setShowBulkImport(false); setImportFile(null); }} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-purple-400 transition-colors">
            <input
              type="file"
              accept=".json"
              onChange={(e) => setImportFile(e.target.files[0])}
              className="hidden"
              id="import-file"
            />
            <label htmlFor="import-file" className="cursor-pointer block">
              {importFile ? (
                <div>
                  <div className="text-4xl mb-3">📄</div>
                  <p className="font-medium text-gray-800">{importFile.name}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {(importFile.size / 1024).toFixed(1)} KB
                  </p>
                  <button
                    onClick={(e) => { e.preventDefault(); setImportFile(null); }}
                    className="mt-2 text-sm text-red-500 hover:text-red-600"
                  >
                    Remove file
                  </button>
                </div>
              ) : (
                <div className="py-4">
                  <UploadIcon size={40} className="mx-auto text-gray-400 mb-3" />
                  <p className="text-sm text-gray-600 font-medium">Click to select a JSON file</p>
                  <p className="text-xs text-gray-400 mt-1">Export format from this manager</p>
                </div>
              )}
            </label>
          </div>

          <div className="mt-4 p-3 bg-blue-50 rounded-xl border border-blue-200">
            <p className="text-xs text-blue-700">
              💡 Missing hints will be automatically generated
            </p>
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
          <button
            onClick={() => { setShowBulkImport(false); setImportFile(null); }}
            className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={importWords}
            disabled={!importFile || loading}
            className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all shadow-md flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Importing...
              </>
            ) : (
              <>
                <Sparkles size={18} />
                Import into Folders
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-teal-50/30">
      {/* Modals */}
      {showAddModal && <AddWordModal />}
      {showEditModal && <EditWordModal />}
      {showBulkImport && <BulkImportModal />}

      {/* Header */}
      <header className="bg-gradient-to-r from-teal-700 via-teal-600 to-cyan-600 shadow-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/admin-dashboard')}
                className="p-2 hover:bg-white/20 rounded-xl transition-all text-white"
              >
                <ArrowLeft size={24} />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <Folder size={22} className="text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-black text-white">Hangman Manager</h1>
                  <p className="text-xs text-cyan-200 font-medium">Organize words in folders</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {categories.length > 0 && (
                <>
                  <button
                    onClick={expandAllFolders}
                    className="px-3 py-2 bg-white/15 text-white rounded-xl text-sm font-medium hover:bg-white/25 transition flex items-center gap-1.5"
                  >
                    <ChevronDown size={16} />
                    Expand All
                  </button>
                  <button
                    onClick={collapseAllFolders}
                    className="px-3 py-2 bg-white/15 text-white rounded-xl text-sm font-medium hover:bg-white/25 transition flex items-center gap-1.5"
                  >
                    <ChevronRight size={16} />
                    Collapse All
                  </button>
                </>
              )}
              <button
                onClick={bulkGenerateHints}
                disabled={loading || words.length === 0}
                className="px-3 py-2 bg-purple-500/20 text-white rounded-xl text-sm font-medium hover:bg-purple-500/30 transition flex items-center gap-1.5 disabled:opacity-50"
              >
                <Wand2 size={16} />
                Generate All Hints
              </button>
              <button
                onClick={addDefaultWords}
                className="px-3 py-2 bg-white/15 text-white rounded-xl text-sm font-medium hover:bg-white/25 transition flex items-center gap-1.5"
              >
                <BookOpen size={16} />
                Default
              </button>
              <button
                onClick={exportWords}
                className="px-3 py-2 bg-white/15 text-white rounded-xl text-sm font-medium hover:bg-white/25 transition flex items-center gap-1.5"
              >
                <Download size={16} />
                Export
              </button>
              <button
                onClick={() => setShowBulkImport(true)}
                className="px-3 py-2 bg-white/15 text-white rounded-xl text-sm font-medium hover:bg-white/25 transition flex items-center gap-1.5"
              >
                <UploadIcon size={16} />
                Import
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-cyan-400 to-teal-400 text-teal-900 rounded-xl font-bold hover:shadow-lg transition flex items-center gap-2"
              >
                <Plus size={18} />
                Add Word
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-teal-100 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-teal-500 font-bold uppercase tracking-wider">Total Words</p>
                <p className="text-2xl font-black text-teal-800 mt-1">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
                <File size={24} className="text-teal-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-purple-100 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-purple-500 font-bold uppercase tracking-wider">Folders</p>
                <p className="text-2xl font-black text-purple-800 mt-1">{stats.categories}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Folder size={24} className="text-purple-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-blue-100 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-blue-500 font-bold uppercase tracking-wider">With Images</p>
                <p className="text-2xl font-black text-blue-800 mt-1">{stats.withImages}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Image size={24} className="text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-amber-100 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-amber-500 font-bold uppercase tracking-wider">Avg Points</p>
                <p className="text-2xl font-black text-amber-800 mt-1">{stats.avgPoints}</p>
              </div>
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                <Trophy size={24} className="text-amber-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-purple-100 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-purple-500 font-bold uppercase tracking-wider">With Hints</p>
                <p className="text-2xl font-black text-purple-800 mt-1">{stats.withHints}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Sparkles size={24} className="text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search words or hints..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none transition-all"
              />
            </div>
            <div className="sm:w-48">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none transition-all"
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
                className="px-4 py-2.5 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Folder View */}
        <div className="space-y-4">
          {categories.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <div className="text-6xl mb-4">📁</div>
              <p className="text-gray-500 text-lg">No folders yet</p>
              <p className="text-gray-400 text-sm mt-1">Add your first word to create a folder</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="mt-4 px-6 py-2.5 bg-teal-600 text-white rounded-xl font-medium hover:bg-teal-700 transition shadow-md"
              >
                <Plus size={18} className="inline mr-2" />
                Add Word
              </button>
            </div>
          ) : (
            categories.map((categoryKey) => {
              const categoryWords = wordsByCategory[categoryKey] || [];
              const isExpanded = expandedFolders[categoryKey];
              const categoryInfo = categoryOptions[categoryKey];
              
              return (
                <div key={categoryKey} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  {/* Folder Header */}
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => toggleFolder(categoryKey)}
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: categoryInfo?.color + '20' }}
                      >
                        {isExpanded ? (
                          <FolderOpen size={20} style={{ color: categoryInfo?.color }} />
                        ) : (
                          <Folder size={20} style={{ color: categoryInfo?.color }} />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-800">
                            {categoryInfo?.emoji} {categoryInfo?.name || categoryKey}
                          </span>
                          <span className="text-xs text-gray-400">({categoryWords.length} words)</span>
                        </div>
                        <p className="text-xs text-gray-500">{categoryInfo?.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setFormData({ ...formData, category: categoryKey });
                          setShowAddModal(true);
                        }}
                        className="p-1.5 hover:bg-teal-50 rounded-lg text-teal-600 transition-colors"
                        title="Add word to this folder"
                      >
                        <Plus size={16} />
                      </button>
                      <span className="text-gray-400">
                        {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                      </span>
                    </div>
                  </div>

                  {/* Folder Content - Word List */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 p-3 space-y-2">
                      {categoryWords.length === 0 ? (
                        <div className="text-center py-6 text-gray-400 text-sm">
                          No words in this folder yet
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setFormData({ ...formData, category: categoryKey });
                              setShowAddModal(true);
                            }}
                            className="ml-2 text-teal-600 hover:text-teal-700 font-medium"
                          >
                            Add one →
                          </button>
                        </div>
                      ) : (
                        categoryWords.map((word, index) => (
                          <WordCard key={word._id} word={word} index={index} />
                        ))
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 px-4 py-3 bg-white rounded-xl shadow-sm border border-gray-200 flex justify-between items-center text-sm text-gray-500">
          <span>Total: {words.length} words across {categories.length} folders</span>
          <div className="flex items-center gap-3">
            <span className="text-xs text-purple-600 flex items-center gap-1">
              <Sparkles size={12} />
              {stats.withHints} words have AI hints
            </span>
            <button
              onClick={fetchWords}
              className="flex items-center gap-1.5 text-teal-600 hover:text-teal-700 transition-colors"
            >
              <RefreshCw size={14} />
              Refresh
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminHangmanManager;