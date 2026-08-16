// frontend/src/screens/admin/AdminSpellingBee.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import API_URL from '../../config';
import dictionaryService from '../../services/dictionaryService';
import { 
  Plus, Edit2, Trash2, Search, X, Upload, Download, 
  BookOpen, Sparkles, AlertCircle, Wand2,
  FileText, Loader, CheckCircle, Volume2, Globe,
  Clock, Award, Timer,
  Mic, MicOff, File, FileSpreadsheet,
  HelpCircle, Copy, VolumeX
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

const AdminSpellingBee = () => {
  const navigate = useNavigate();
  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('all');
  const [filterLevel, setFilterLevel] = useState('all');
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [showTimerSettings, setShowTimerSettings] = useState(false);
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importFileContent, setImportFileContent] = useState(null);
  const [importPreview, setImportPreview] = useState([]);
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [isGeneratingHint, setIsGeneratingHint] = useState(false);
  const [isGeneratingExample, setIsGeneratingExample] = useState(false);
  const [isFetchingDictionary, setIsFetchingDictionary] = useState(false);
  const [dictionaryData, setDictionaryData] = useState(null);
  const [showDictionaryPanel, setShowDictionaryPanel] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlayingClone, setIsPlayingClone] = useState(false);
  const [cloneVoiceData, setCloneVoiceData] = useState(null);
  const [voiceAnalysis, setVoiceAnalysis] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    byDifficulty: {},
    byLevel: {}
  });
  const [timerConfig, setTimerConfig] = useState({
    defaultTimeLimit: 60,
    timeLimitPerDifficulty: {
      easy: 60,
      medium: 45,
      hard: 30,
      expert: 20
    }
  });
  const [voiceSettings, setVoiceSettings] = useState({
    enabled: true,
    useClonedVoice: false,
    voiceSpeed: 0.9,
    voicePitch: 1.0
  });
  const [formData, setFormData] = useState({
    word: '',
    hint: '',
    example: '',
    difficulty: 'medium',
    level: 1,
    points: 10,
    is_active: true
  });

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioRef = useRef(null);

  const difficulties = ['easy', 'medium', 'hard', 'expert'];
  const LEVELS = Array.from({ length: 10 }, (_, i) => i + 1);
  
  const difficultyColors = {
    easy: 'bg-cyan-50 text-cyan-700',
    medium: 'bg-teal-50 text-teal-700',
    hard: 'bg-amber-50 text-amber-700',
    expert: 'bg-rose-50 text-rose-700'
  };
  
  const difficultyPoints = {
    easy: 5,
    medium: 10,
    hard: 15,
    expert: 20
  };

  const levelColors = {
    1: 'bg-cyan-100 text-cyan-700',
    2: 'bg-cyan-200 text-cyan-800',
    3: 'bg-teal-100 text-teal-700',
    4: 'bg-teal-200 text-teal-800',
    5: 'bg-blue-100 text-blue-700',
    6: 'bg-blue-200 text-blue-800',
    7: 'bg-indigo-100 text-indigo-700',
    8: 'bg-indigo-200 text-indigo-800',
    9: 'bg-purple-100 text-purple-700',
    10: 'bg-purple-200 text-purple-800'
  };

  const getAuthToken = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Authentication required. Please login again.');
      navigate('/login');
      return null;
    }
    return token;
  };

  const formatExampleWithWord = (example, word) => {
    if (!example) return '';
    return example.replace(/___/g, word);
  };

  // Analyze voice to extract pitch and speed
  const analyzeVoice = async (audioData) => {
    try {
      const mimeType = audioData.format === 'webm' ? 'audio/webm' : 'audio/wav';
      const audioBlob = base64ToBlob(audioData.audioData, mimeType);
      if (!audioBlob) return null;

      const arrayBuffer = await audioBlob.arrayBuffer();
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      const channelData = audioBuffer.getChannelData(0);
      if (!channelData || channelData.length === 0) return null;
      
      // Calculate pitch using zero-crossing rate
      let zeroCrossings = 0;
      for (let i = 1; i < channelData.length; i++) {
        if ((channelData[i] >= 0 && channelData[i-1] < 0) || 
            (channelData[i] < 0 && channelData[i-1] >= 0)) {
          zeroCrossings++;
        }
      }
      
      const sampleRate = audioBuffer.sampleRate || 44100;
      let pitch = 0;
      if (zeroCrossings > 0 && channelData.length > 0) {
        pitch = (zeroCrossings / channelData.length) * sampleRate / 2;
      }
      
      // Ensure pitch is valid
      if (!isFinite(pitch) || isNaN(pitch) || pitch <= 0) {
        pitch = 200;
      }
      
      // Calculate RMS
      let rms = 0;
      for (let i = 0; i < channelData.length; i++) {
        rms += channelData[i] * channelData[i];
      }
      rms = Math.sqrt(rms / channelData.length);
      
      if (!isFinite(rms) || isNaN(rms)) {
        rms = 0.5;
      }
      
      // Normalize pitch to 0.5-1.5 range
      const minPitch = 85;
      const maxPitch = 255;
      let normalizedPitch = (pitch - minPitch) / (maxPitch - minPitch);
      normalizedPitch = Math.min(Math.max(normalizedPitch, 0.5), 1.5);
      
      // Calculate speaking rate
      let peaks = 0;
      const threshold = 0.15;
      for (let i = 1; i < channelData.length - 1; i++) {
        if (channelData[i] > threshold && channelData[i] > channelData[i-1] && channelData[i] > channelData[i+1]) {
          peaks++;
        }
      }
      
      const duration = audioBuffer.duration || 3;
      const syllablesPerSecond = peaks / duration;
      const avgRate = 5;
      let speed = syllablesPerSecond / avgRate;
      speed = Math.min(Math.max(speed, 0.5), 1.5);
      
      return {
        pitch: normalizedPitch,
        speed: speed,
        volume: Math.min(rms * 5, 1.5),
        duration: duration,
        originalPitch: pitch,
        syllablesPerSecond: syllablesPerSecond
      };
    } catch (error) {
      console.error('Error analyzing voice:', error);
      return {
        pitch: 1.0,
        speed: 0.9,
        volume: 0.8,
        duration: 3,
        originalPitch: 200,
        syllablesPerSecond: 5
      };
    }
  };

  // Voice Recording Functions
  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error('Your browser does not support microphone access. Please use Chrome, Firefox, or Edge.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      if (!stream.getAudioTracks().length) {
        toast.error('No audio tracks available. Please check your microphone.');
        return;
      }

      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        try {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const reader = new FileReader();
          reader.onloadend = async () => {
            const base64Audio = reader.result.split(',')[1];
            const voiceData = {
              audioData: base64Audio,
              timestamp: new Date().toISOString(),
              format: 'webm'
            };
            setCloneVoiceData(voiceData);
            
            // Analyze the voice
            const loadingToast = toast.loading('Analyzing your voice characteristics...');
            
            const analysis = await analyzeVoice(voiceData);
            if (analysis) {
              setVoiceAnalysis(analysis);
              setVoiceSettings(prev => ({
                ...prev,
                voiceSpeed: analysis.speed,
                voicePitch: analysis.pitch
              }));
              
              toast.dismiss(loadingToast);
              toast.success(`Voice analyzed! Pitch: ${analysis.pitch.toFixed(2)}, Speed: ${analysis.speed.toFixed(2)}`);
            } else {
              toast.dismiss(loadingToast);
              toast.success('Voice recorded successfully!');
            }
            
            try {
              localStorage.setItem('cloneVoiceData', JSON.stringify(voiceData));
              if (analysis) {
                localStorage.setItem('voiceAnalysis', JSON.stringify(analysis));
              }
            } catch (e) {
              console.warn('Could not save to localStorage:', e);
            }
          };
          reader.onerror = () => {
            toast.error('Failed to process audio. Please try again.');
          };
          reader.readAsDataURL(audioBlob);
        } catch (error) {
          console.error('Error processing audio:', error);
          toast.error('Failed to process audio. Please try again.');
        }
        
        stream.getTracks().forEach(track => track.stop());
        setIsRecording(false);
      };

      mediaRecorderRef.current.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        toast.error('Recording error. Please try again.');
        setIsRecording(false);
      };

      mediaRecorderRef.current.start(1000);
      setIsRecording(true);
      toast.success('Recording... Speak clearly for 3-5 seconds.');
      
      setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          stopRecording();
        }
      }, 5000);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        toast.error('Microphone access denied. Please allow microphone access in your browser settings and refresh the page.');
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        toast.error('No microphone found. Please connect a microphone and try again.');
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        toast.error('Microphone is in use by another application. Please close other apps and try again.');
      } else if (error.name === 'OverconstrainedError') {
        toast.error('Microphone does not meet requirements. Please try a different microphone.');
      } else {
        toast.error(`Unable to access microphone: ${error.message || 'Please check your microphone settings.'}`);
      }
      
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try {
        mediaRecorderRef.current.stop();
      } catch (error) {
        console.error('Error stopping recording:', error);
        toast.error('Error stopping recording. Please try again.');
        setIsRecording(false);
      }
    }
  };

  const playCloneVoiceOnly = () => {
    if (!cloneVoiceData) {
      toast.error('No cloned voice available. Please record your voice first.');
      return;
    }

    try {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        if (audioRef.current.src) {
          URL.revokeObjectURL(audioRef.current.src);
        }
      }

      const mimeType = cloneVoiceData.format === 'webm' ? 'audio/webm' : 'audio/wav';
      const audioBlob = base64ToBlob(cloneVoiceData.audioData, mimeType);
      if (!audioBlob) return;
      
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
      audio.volume = 0.9;
      
      audio.onplay = () => {
        setIsPlayingClone(true);
      };
      audio.onended = () => {
        setIsPlayingClone(false);
        if (audio.src) {
          URL.revokeObjectURL(audio.src);
        }
      };
      audio.onerror = (e) => {
        setIsPlayingClone(false);
        if (audio.src) {
          URL.revokeObjectURL(audio.src);
        }
        console.error('Audio playback error:', e);
        toast.error('Error playing cloned voice.');
      };
      
      audio.play().catch((error) => {
        console.error('Playback failed:', error);
        toast.error('Failed to play audio. Please try recording again.');
        setIsPlayingClone(false);
        if (audio.src) {
          URL.revokeObjectURL(audio.src);
        }
      });
    } catch (error) {
      console.error('Error playing clone voice:', error);
      toast.error('Error playing cloned voice.');
      setIsPlayingClone(false);
    }
  };

  const deleteCloneVoice = async () => {
    try {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        if (audioRef.current.src) {
          URL.revokeObjectURL(audioRef.current.src);
        }
      }
      
      const token = getAuthToken();
      if (token) {
        await axios.delete(`${API_URL}/api/spelling/admin/clone-voice`, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }
    } catch (error) {
      console.warn('Error deleting clone voice from server:', error);
    }
    
    setCloneVoiceData(null);
    setVoiceAnalysis(null);
    try {
      localStorage.removeItem('cloneVoiceData');
      localStorage.removeItem('voiceAnalysis');
    } catch (e) {
      console.warn('Could not remove from localStorage:', e);
    }
    toast.success('Cloned voice removed.');
  };

  const base64ToBlob = (base64, mimeType) => {
    try {
      const byteCharacters = atob(base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      return new Blob([byteArray], { type: mimeType });
    } catch (error) {
      console.error('Error converting base64 to blob:', error);
      toast.error('Error processing audio data.');
      return null;
    }
  };

  // Speak with cloned voice characteristics
  const speakWithVoice = (text) => {
    if (!voiceSettings.enabled) return;
    
    // If using cloned voice and we have analysis data
    if (voiceSettings.useClonedVoice && voiceAnalysis) {
      try {
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Apply cloned voice characteristics
        let pitchValue = voiceAnalysis.pitch || 1.0;
        if (!isFinite(pitchValue) || isNaN(pitchValue)) {
          pitchValue = 1.0;
        }
        utterance.pitch = Math.min(Math.max(pitchValue, 0.5), 1.5);
        
        let speedValue = voiceAnalysis.speed || 0.9;
        if (!isFinite(speedValue) || isNaN(speedValue)) {
          speedValue = 0.9;
        }
        utterance.rate = Math.min(Math.max(speedValue, 0.5), 1.5);
        
        // Try to find a natural sounding voice
        const voices = window.speechSynthesis.getVoices();
        const naturalVoices = voices.filter(v => 
          v.lang.startsWith('en') && 
          (v.name.includes('Samantha') || 
           v.name.includes('Google UK') || 
           v.name.includes('Daniel') ||
           v.name.includes('Alex'))
        );
        
        if (naturalVoices.length > 0) {
          utterance.voice = naturalVoices[0];
        }
        
        window.speechSynthesis.speak(utterance);
      } catch (error) {
        console.error('Error speaking with cloned voice:', error);
        fallbackSpeak(text);
      }
    } else {
      // Default voice or fallback
      fallbackSpeak(text);
    }
  };

  const fallbackSpeak = (text) => {
    try {
      const utterance = new SpeechSynthesisUtterance(text);
      const rate = Math.min(Math.max(voiceSettings.voiceSpeed || 0.9, 0.5), 1.5);
      const pitch = Math.min(Math.max(voiceSettings.voicePitch || 1.0, 0.5), 1.5);
      utterance.rate = rate;
      utterance.pitch = pitch;
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.error('Fallback speech failed:', error);
    }
  };

  const generateGenericHintAndExample = (word) => {
    const lowerWord = word.toLowerCase();
    const wordLength = word.length;
    const firstLetter = word.charAt(0);
    
    let type = 'word';
    if (lowerWord.endsWith('tion') || lowerWord.endsWith('sion') || lowerWord.endsWith('ment') || 
        lowerWord.endsWith('ness') || lowerWord.endsWith('ity') || lowerWord.endsWith('ism')) {
      type = 'noun';
    } else if (lowerWord.endsWith('ed') || lowerWord.endsWith('ing') || lowerWord.endsWith('en') || 
               lowerWord.endsWith('ize') || lowerWord.endsWith('ate')) {
      type = 'verb';
    } else if (lowerWord.endsWith('ous') || lowerWord.endsWith('ful') || lowerWord.endsWith('al') || 
               lowerWord.endsWith('ic') || lowerWord.endsWith('able') || lowerWord.endsWith('ible') ||
               lowerWord.endsWith('ive') || lowerWord.endsWith('y')) {
      type = 'adjective';
    } else if (lowerWord.endsWith('ly')) {
      type = 'adverb';
    }
    
    let hint = `A ${type} that starts with '${firstLetter}' and has ${wordLength} letters`;
    if (type === 'noun') {
      hint = `A ${type} meaning something related to ${lowerWord.slice(0, 4)}...`;
    } else if (type === 'verb') {
      hint = `An action that means to ${lowerWord.slice(0, 4)}...`;
    } else if (type === 'adjective') {
      hint = `A descriptive ${type} used to describe something ${lowerWord.slice(0, 4)}...`;
    } else if (type === 'adverb') {
      hint = `A word that describes how something is done, ending in 'ly'`;
    }
    
    let example = `The word ___ is used in many contexts.`;
    if (type === 'noun') {
      example = `She learned about ___ in school today.`;
    } else if (type === 'verb') {
      example = `You need to ___ carefully.`;
    } else if (type === 'adjective') {
      example = `The situation was very ___ .`;
    } else if (type === 'adverb') {
      example = `She spoke ___ to the audience.`;
    }
    
    return { hint, example };
  };

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
        let example = data.example || '';
        
        if (!example && data.definition) {
          const shortDef = data.definition.length > 50 ? data.definition.substring(0, 50) + '...' : data.definition;
          example = `The word ___ means "${shortDef}".`;
        }
        
        if (!example) {
          example = `The word ___ is used in various contexts.`;
        }
        
        let difficulty = formData.difficulty;
        if (word.length <= 4) difficulty = 'easy';
        else if (word.length <= 6) difficulty = 'medium';
        else if (word.length <= 8) difficulty = 'hard';
        else difficulty = 'expert';
        
        const points = difficultyPoints[difficulty] || 10;
        
        setFormData(prev => ({
          ...prev,
          hint: hint,
          example: example,
          difficulty: difficulty,
          points: points
        }));
        
        toast.success(`Found definition for "${word}"!`);
        return { hint, example, difficulty, points };
      } else {
        const result = generateGenericHintAndExample(word);
        setFormData(prev => ({
          ...prev,
          hint: result.hint,
          example: result.example
        }));
        toast.success('Using fallback hint generation');
        return result;
      }
    } catch (error) {
      console.error('Error fetching from dictionary:', error);
      const result = generateGenericHintAndExample(word);
      setFormData(prev => ({
        ...prev,
        hint: result.hint,
        example: result.example
      }));
      toast.success('Using fallback hint generation');
      return result;
    } finally {
      setIsFetchingDictionary(false);
    }
  };

  const generateHint = async (word) => {
    if (!word || word.trim() === '') {
      toast.error('Please enter a word first');
      return;
    }
    
    setIsGeneratingHint(true);
    
    try {
      const data = await dictionaryService.getWordData(word);
      if (data && data.hint) {
        setFormData(prev => ({
          ...prev,
          hint: data.hint
        }));
        toast.success('Hint from dictionary!');
      } else {
        const result = generateGenericHintAndExample(word);
        setFormData(prev => ({
          ...prev,
          hint: result.hint
        }));
        toast.success('Hint generated!');
      }
    } catch (error) {
      const result = generateGenericHintAndExample(word);
      setFormData(prev => ({
        ...prev,
        hint: result.hint
      }));
      toast.success('Hint generated!');
    } finally {
      setIsGeneratingHint(false);
    }
  };

  const generateExample = async (word) => {
    if (!word || word.trim() === '') {
      toast.error('Please enter a word first');
      return;
    }
    
    setIsGeneratingExample(true);
    
    try {
      const data = await dictionaryService.getWordData(word);
      if (data && data.example) {
        setFormData(prev => ({
          ...prev,
          example: data.example
        }));
        toast.success('Example from dictionary!');
      } else {
        const result = generateGenericHintAndExample(word);
        setFormData(prev => ({
          ...prev,
          example: result.example
        }));
        toast.success('Example generated!');
      }
    } catch (error) {
      const result = generateGenericHintAndExample(word);
      setFormData(prev => ({
        ...prev,
        example: result.example
      }));
      toast.success('Example generated!');
    } finally {
      setIsGeneratingExample(false);
    }
  };

  const generateBoth = async (word) => {
    if (!word || word.trim() === '') {
      toast.error('Please enter a word first');
      return;
    }
    
    await generateFromDictionary(word);
  };

  const loadTimerSettings = async () => {
    try {
      const token = getAuthToken();
      if (!token) return;

      const response = await axios.get(`${API_URL}/api/spelling/admin/timer-settings`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success && response.data.settings) {
        setTimerConfig(response.data.settings);
      }
    } catch (error) {
      console.error('Error loading timer settings:', error);
    }
  };

  const saveTimerSettings = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await axios.post(`${API_URL}/api/spelling/admin/timer-settings`, timerConfig, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        toast.success('Timer settings saved successfully!');
        setShowTimerSettings(false);
      } else {
        toast.error(response.data.message || 'Failed to save timer settings');
      }
    } catch (error) {
      console.error('Error saving timer settings:', error);
      toast.error('Failed to save timer settings');
    } finally {
      setLoading(false);
    }
  };

  const loadVoiceSettings = async () => {
    try {
      const token = getAuthToken();
      if (!token) return;

      const response = await axios.get(`${API_URL}/api/spelling/admin/voice-settings`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success && response.data.settings) {
        setVoiceSettings({
          enabled: response.data.settings.enabled !== false,
          useClonedVoice: response.data.settings.useClonedVoice || false,
          voiceSpeed: response.data.settings.voiceSpeed || 0.9,
          voicePitch: response.data.settings.voicePitch || 1.0
        });
        
        if (response.data.settings.cloneVoiceData) {
          setCloneVoiceData(response.data.settings.cloneVoiceData);
        }
        if (response.data.settings.voiceAnalysis) {
          setVoiceAnalysis(response.data.settings.voiceAnalysis);
        }
      }
    } catch (error) {
      console.error('Error loading voice settings from server:', error);
      try {
        const savedSettings = localStorage.getItem('voiceSettings');
        if (savedSettings) {
          const parsedSettings = JSON.parse(savedSettings);
          setVoiceSettings(prev => ({
            ...prev,
            ...parsedSettings
          }));
        }
        const savedVoiceData = localStorage.getItem('cloneVoiceData');
        if (savedVoiceData) {
          const parsedData = JSON.parse(savedVoiceData);
          setCloneVoiceData(parsedData);
        }
        const savedAnalysis = localStorage.getItem('voiceAnalysis');
        if (savedAnalysis) {
          const parsedAnalysis = JSON.parse(savedAnalysis);
          setVoiceAnalysis(parsedAnalysis);
        }
      } catch (e) {
        console.warn('Could not load from localStorage:', e);
      }
    }
  };

  const saveVoiceSettings = async () => {
    try {
      setLoading(true);
      
      try {
        localStorage.setItem('voiceSettings', JSON.stringify({
          enabled: voiceSettings.enabled,
          useClonedVoice: voiceSettings.useClonedVoice,
          voiceSpeed: voiceSettings.voiceSpeed,
          voicePitch: voiceSettings.voicePitch
        }));
        if (cloneVoiceData) {
          localStorage.setItem('cloneVoiceData', JSON.stringify(cloneVoiceData));
        }
        if (voiceAnalysis) {
          localStorage.setItem('voiceAnalysis', JSON.stringify(voiceAnalysis));
        }
      } catch (e) {
        console.warn('Could not save to localStorage:', e);
      }

      const token = getAuthToken();
      if (!token) {
        setLoading(false);
        toast.success('Settings saved locally!');
        setShowVoiceSettings(false);
        return;
      }

      const settingsToSave = {
        enabled: voiceSettings.enabled,
        useClonedVoice: voiceSettings.useClonedVoice,
        voiceSpeed: voiceSettings.voiceSpeed,
        voicePitch: voiceSettings.voicePitch,
        cloneVoiceData: cloneVoiceData || null,
        voiceAnalysis: voiceAnalysis || null
      };

      const response = await axios.post(`${API_URL}/api/spelling/admin/voice-settings`, settingsToSave, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        toast.success('Voice settings saved successfully!');
        setShowVoiceSettings(false);
      } else {
        toast.success('Settings saved locally!');
        setShowVoiceSettings(false);
      }
    } catch (error) {
      console.error('Error saving voice settings:', error);
      toast.success('Settings saved locally!');
      setShowVoiceSettings(false);
    } finally {
      setLoading(false);
    }
  };

  const extractWordsFromText = (text) => {
    if (!text || text.trim() === '') return [];
    
    const lines = text.split('\n').filter(line => line.trim());
    const words = [];
    
    const isStructured = lines.some(line => line.includes('\t') || line.includes('|') || line.includes(','));
    
    if (isStructured) {
      const delimiter = lines[0].includes('\t') ? '\t' : 
                       lines[0].includes('|') ? '|' : ',';
      
      const firstLine = lines[0].split(delimiter).map(s => s.trim().toLowerCase());
      const hasHeaders = firstLine.some(h => ['word', 'hint', 'example', 'difficulty', 'level'].includes(h));
      
      const startIndex = hasHeaders ? 1 : 0;
      
      for (let i = startIndex; i < lines.length; i++) {
        const parts = lines[i].split(delimiter).map(s => s.trim());
        if (parts.length >= 1) {
          const wordObj = {
            word: parts[0] || '',
            hint: parts[1] || '',
            example: parts[2] || '',
            difficulty: parts[3] || '',
            level: parseInt(parts[4]) || 1,
            points: parseInt(parts[5]) || 10
          };
          if (wordObj.word) {
            words.push(wordObj);
          }
        }
      }
    } else {
      lines.forEach(line => {
        const trimmed = line.trim();
        const match = trimmed.match(/^([^-–—:;|]+)[-–—:;|]\s*(.+)$/);
        if (match) {
          words.push({
            word: match[1].trim(),
            hint: match[2].trim(),
            example: '',
            difficulty: '',
            level: 1,
            points: 10
          });
        } else {
          words.push({
            word: trimmed,
            hint: '',
            example: '',
            difficulty: '',
            level: 1,
            points: 10
          });
        }
      });
    }
    
    return words;
  };

  const determineDifficulty = (word) => {
    const len = word.length;
    if (len <= 4) return 'easy';
    if (len <= 6) return 'medium';
    if (len <= 8) return 'hard';
    return 'expert';
  };

  const parsePDF = async (arrayBuffer) => {
    try {
      const bufferCopy = arrayBuffer.slice(0);
      
      const loadingTask = pdfjsLib.getDocument({
        data: bufferCopy,
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
      return fullText;
    } catch (error) {
      console.error('PDF parsing error:', error);
      
      try {
        const bufferCopy = arrayBuffer.slice(0);
        const loadingTask = pdfjsLib.getDocument({
          data: bufferCopy,
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
        return fullText;
      } catch (fallbackError) {
        console.error('PDF fallback parsing error:', fallbackError);
        throw new Error('Unable to parse PDF file. Please ensure it contains readable text.');
      }
    }
  };

  const parseFileContent = async (file) => {
    setIsParsingFile(true);
    setImportPreview([]);
    
    try {
      const fileType = file.name.split('.').pop().toLowerCase();
      let text = '';
      let parsedWords = [];

      if (fileType === 'json') {
        const content = await file.text();
        const data = JSON.parse(content);
        if (Array.isArray(data)) {
          parsedWords = data;
        } else if (data.words && Array.isArray(data.words)) {
          parsedWords = data.words;
        } else {
          throw new Error('Invalid JSON format. Expected an array of words.');
        }
      } else if (fileType === 'pdf') {
        try {
          const arrayBuffer = await file.arrayBuffer();
          text = await parsePDF(arrayBuffer);
          parsedWords = extractWordsFromText(text);
        } catch (pdfError) {
          throw new Error(`PDF parsing failed: ${pdfError.message}`);
        }
      } else if (fileType === 'docx') {
        try {
          const arrayBuffer = await file.arrayBuffer();
          const result = await mammoth.extractRawText({ arrayBuffer });
          text = result.value;
          parsedWords = extractWordsFromText(text);
        } catch (docxError) {
          throw new Error(`DOCX parsing failed: ${docxError.message}`);
        }
      } else if (fileType === 'txt' || fileType === 'csv') {
        const content = await file.text();
        text = content;
        parsedWords = extractWordsFromText(text);
      } else {
        throw new Error(`Unsupported file type: ${fileType}. Please use JSON, PDF, DOCX, TXT, or CSV.`);
      }

      if (parsedWords.length === 0) {
        throw new Error('No words found in the file. Please check the file format.');
      }

      const formattedWords = parsedWords.map(w => {
        const wordObj = typeof w === 'string' ? { word: w } : w;
        return {
          word: wordObj.word?.toString().trim().toUpperCase() || '',
          hint: wordObj.hint || wordObj.definition || '',
          example: wordObj.example || wordObj.sentence || '',
          difficulty: wordObj.difficulty || determineDifficulty(wordObj.word || ''),
          level: parseInt(wordObj.level) || 1,
          points: parseInt(wordObj.points) || 10,
          is_active: wordObj.is_active !== undefined ? wordObj.is_active : true
        };
      }).filter(w => w.word.length > 0);

      if (formattedWords.length === 0) {
        throw new Error('No valid words found after parsing.');
      }

      setImportPreview(formattedWords);
      setImportFileContent(parsedWords);
      
      toast.success(`Parsed ${formattedWords.length} words from ${file.name}`);
      return formattedWords;
    } catch (error) {
      console.error('Error parsing file:', error);
      toast.error(`Failed to parse file: ${error.message}`);
      return null;
    } finally {
      setIsParsingFile(false);
    }
  };

  const handleFileSelect = async (file) => {
    setImportFile(file);
    if (file) {
      await parseFileContent(file);
    }
  };

  const renderDictionaryInfo = () => {
    if (!dictionaryData || !showDictionaryPanel) return null;
    
    return (
      <div className="p-4 bg-gradient-to-r from-cyan-50 to-teal-50 rounded-xl border-2 border-teal-300 space-y-2 animate-fadeIn">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe size={16} className="text-cyan-600" />
            <span className="text-xs font-semibold text-cyan-800">Dictionary Definition</span>
          </div>
          <div className="flex items-center gap-2">
            {dictionaryData.audio && (
              <button
                onClick={() => {
                  const audio = new Audio(dictionaryData.audio);
                  audio.play();
                }}
                className="p-1.5 hover:bg-cyan-100 rounded-lg transition text-cyan-600"
                title="Listen to pronunciation"
              >
                <Volume2 size={16} />
              </button>
            )}
            <button
              onClick={() => setShowDictionaryPanel(false)}
              className="p-1 hover:bg-cyan-100 rounded-lg transition text-gray-400"
            >
              <X size={14} />
            </button>
          </div>
        </div>
        {dictionaryData.phonetic && (
          <p className="text-xs text-cyan-600 font-mono">/{dictionaryData.phonetic}/</p>
        )}
        <p className="text-sm text-cyan-800">
          <span className="font-medium">Definition:</span> {dictionaryData.definition || dictionaryData.hint}
        </p>
        {dictionaryData.partOfSpeech && (
          <p className="text-xs text-cyan-600">
            <span className="font-medium">Part of Speech:</span> {dictionaryData.partOfSpeech}
          </p>
        )}
        {dictionaryData.example && (
          <p className="text-sm text-cyan-700 italic bg-cyan-100/50 p-2 rounded-lg">
            "{formatExampleWithWord(dictionaryData.example, formData.word)}"
          </p>
        )}
        {dictionaryData.synonyms && dictionaryData.synonyms.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            <span className="text-xs text-cyan-600 font-medium">Synonyms:</span>
            {dictionaryData.synonyms.slice(0, 5).map((syn, i) => (
              <span key={i} className="text-xs bg-cyan-100 text-cyan-700 px-2 py-0.5 rounded-full">
                {syn}
              </span>
            ))}
          </div>
        )}
        <div className="flex items-center gap-2 mt-1 pt-1 border-t border-teal-200">
          <CheckCircle size={14} className="text-green-500" />
          <span className="text-xs text-green-700">Dictionary data loaded successfully</span>
        </div>
      </div>
    );
  };

  useEffect(() => {
    fetchWords();
    loadTimerSettings();
    loadVoiceSettings();
  }, []);

  const fetchWords = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await axios.get(`${API_URL}/api/spelling/admin/words`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.success) {
        setWords(response.data.words);
        calculateStats(response.data.words);
      } else {
        toast.error(response.data.message || 'Failed to load words');
      }
    } catch (error) {
      console.error('Error fetching words:', error);
      
      if (error.response) {
        const status = error.response.status;
        const message = error.response.data?.message || 'Failed to load words';
        
        if (status === 401) {
          toast.error('Session expired. Please login again.');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/login');
        } else if (status === 403) {
          toast.error('You do not have permission to access spelling words.');
        } else if (status === 404) {
          toast.error('Spelling words endpoint not found.');
        } else {
          toast.error(message);
        }
      } else if (error.request) {
        toast.error('No response from server.');
      } else {
        toast.error('Failed to load words.');
      }
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (wordsList) => {
    const byDifficulty = {};
    const byLevel = {};
    
    difficulties.forEach(d => {
      byDifficulty[d] = wordsList.filter(w => w.difficulty === d).length;
    });
    
    LEVELS.forEach(l => {
      byLevel[l] = wordsList.filter(w => w.level === l).length;
    });
    
    setStats({
      total: wordsList.length,
      active: wordsList.filter(w => w.is_active).length,
      inactive: wordsList.filter(w => !w.is_active).length,
      byDifficulty,
      byLevel
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.word || !formData.difficulty || !formData.level) {
      toast.error('Word, difficulty, and level are required');
      return;
    }

    try {
      setLoading(true);
      const token = getAuthToken();
      if (!token) {
        setLoading(false);
        return;
      }

      const submitData = {
        ...formData,
        level: parseInt(formData.level) || 1
      };

      const url = isEditing 
        ? `${API_URL}/api/spelling/admin/words/${currentId}`
        : `${API_URL}/api/spelling/admin/words`;
      
      const method = isEditing ? 'put' : 'post';
      const response = await axios[method](url, submitData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        toast.success(isEditing ? 'Word updated!' : 'Word added!');
        setShowAddModal(false);
        setIsEditing(false);
        setCurrentId(null);
        setFormData({ word: '', hint: '', example: '', difficulty: 'medium', level: 1, points: 10, is_active: true });
        setDictionaryData(null);
        setShowDictionaryPanel(false);
        fetchWords();
      }
    } catch (error) {
      console.error('Error saving word:', error);
      
      if (error.response) {
        const status = error.response.status;
        if (status === 401) {
          toast.error('Session expired. Please login again.');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/login');
        } else if (status === 403) {
          toast.error('You do not have permission to add words.');
        } else {
          toast.error(error.response?.data?.message || 'Failed to save word');
        }
      } else {
        toast.error('Failed to save word.');
      }
    } finally {
      setLoading(false);
    }
  };

  const deleteWord = async (id) => {
    if (!window.confirm('Delete this word?')) return;
    try {
      setLoading(true);
      const token = getAuthToken();
      if (!token) {
        setLoading(false);
        return;
      }

      await axios.delete(`${API_URL}/api/spelling/admin/words/${id}`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      toast.success('Word deleted');
      fetchWords();
    } catch (error) {
      console.error('Error deleting word:', error);
      
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      } else {
        toast.error('Failed to delete word');
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (word) => {
    try {
      setLoading(true);
      const token = getAuthToken();
      if (!token) {
        setLoading(false);
        return;
      }

      await axios.put(`${API_URL}/api/spelling/admin/words/${word.id}`, {
        ...word,
        is_active: !word.is_active
      }, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      toast.success(word.is_active ? 'Word deactivated' : 'Word activated');
      fetchWords();
    } catch (error) {
      console.error('Error toggling word:', error);
      
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      } else {
        toast.error('Failed to update word');
      }
    } finally {
      setLoading(false);
    }
  };

  const exportWords = () => {
    const exportData = words.map(w => ({
      word: w.word,
      hint: w.hint || '',
      example: w.example || '',
      difficulty: w.difficulty,
      level: parseInt(w.level) || 1,
      points: w.points || 10
    }));
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `spelling_words_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Words exported successfully!');
  };

  const exportToTxt = () => {
    let textContent = 'SPELLING BEE WORD LIST\n';
    textContent += `${'='.repeat(70)}\n`;
    textContent += `Generated on: ${new Date().toLocaleDateString()}\n`;
    textContent += `Total Words: ${words.length} | Active: ${stats.active}\n`;
    textContent += `${'='.repeat(70)}\n\n`;
    
    words.forEach((word, index) => {
      const formattedExample = formatExampleWithWord(word.example, word.word);
      textContent += `${String(index + 1).padStart(3, '0')}. ${word.word.toUpperCase()}\n`;
      textContent += `   Hint: ${word.hint || 'No hint available'}\n`;
      if (formattedExample) {
        textContent += `   Example: ${formattedExample}\n`;
      }
      textContent += `   Difficulty: ${word.difficulty.toUpperCase()} | Level: ${parseInt(word.level) || 1} | Points: ${word.points || 10}\n`;
      textContent += `   ${'-'.repeat(60)}\n\n`;
    });
    
    const blob = new Blob([textContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `spelling_words_${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Words exported to TXT successfully!');
  };

  const exportToCsv = () => {
    const headers = ['Word', 'Hint', 'Example (with word)', 'Difficulty', 'Level', 'Points', 'Status'];
    const rows = words.map(w => [
      w.word,
      w.hint || '',
      formatExampleWithWord(w.example, w.word),
      w.difficulty,
      parseInt(w.level) || 1,
      w.points || 10,
      w.is_active ? 'Active' : 'Inactive'
    ]);
    
    let csvContent = headers.join(',') + '\n';
    rows.forEach(row => {
      const escapedRow = row.map(cell => {
        if (typeof cell === 'string' && (cell.includes(',') || cell.includes('"'))) {
          return `"${cell.replace(/"/g, '""')}"`;
        }
        return cell;
      });
      csvContent += escapedRow.join(',') + '\n';
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `spelling_words_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Words exported to CSV successfully!');
  };

  const importWords = async () => {
    if (!importFile) {
      toast.error('Please select a file');
      return;
    }

    try {
      setLoading(true);
      const token = getAuthToken();
      if (!token) {
        setLoading(false);
        return;
      }

      let wordsToImport = importPreview;
      if (wordsToImport.length === 0) {
        const parsed = await parseFileContent(importFile);
        if (!parsed || parsed.length === 0) {
          toast.error('No valid words found in the file');
          setLoading(false);
          return;
        }
        wordsToImport = parsed;
      }

      const enhancedWords = [];
      let enhanced = 0;
      
      for (const word of wordsToImport) {
        word.level = parseInt(word.level) || 1;
        
        if (!word.hint || !word.example) {
          try {
            const data = await dictionaryService.getWordData(word.word);
            if (data) {
              word.hint = word.hint || data.hint || data.definition || '';
              word.example = word.example || data.example || '';
              enhanced++;
            }
          } catch (err) {
            if (!word.hint || !word.example) {
              const fallback = generateGenericHintAndExample(word.word);
              word.hint = word.hint || fallback.hint;
              word.example = word.example || fallback.example;
            }
          }
        }
        enhancedWords.push(word);
      }
      
      const response = await axios.post(`${API_URL}/api/spelling/admin/words/import`, {
        words: enhancedWords
      }, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.success) {
        toast.success(`Imported ${response.data.imported} words successfully! (${enhanced} enhanced with dictionary)`);
        setImportFile(null);
        setImportFileContent(null);
        setImportPreview([]);
        setShowBulkImport(false);
        fetchWords();
      }
    } catch (error) {
      console.error('Error importing words:', error);
      toast.error('Failed to import words. Check file format.');
    } finally {
      setLoading(false);
    }
  };

  const bulkGenerateHints = async () => {
    if (words.length === 0) {
      toast.error('No words to generate hints for');
      return;
    }

    if (!window.confirm(`Generate hints for all ${words.length} words using the dictionary?`)) {
      return;
    }

    setLoading(true);
    let updated = 0;
    let failed = 0;

    for (const word of words) {
      try {
        const data = await dictionaryService.getWordData(word.word);
        if (data && (data.hint || data.definition)) {
          const token = getAuthToken();
          if (!token) {
            setLoading(false);
            return;
          }
          
          await axios.put(`${API_URL}/api/spelling/admin/words/${word.id}`, {
            ...word,
            hint: data.hint || data.definition || word.hint,
            example: data.example || word.example
          }, {
            headers: { 
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          updated++;
        } else {
          const fallback = generateGenericHintAndExample(word.word);
          const token = getAuthToken();
          if (!token) {
            setLoading(false);
            return;
          }
          
          await axios.put(`${API_URL}/api/spelling/admin/words/${word.id}`, {
            ...word,
            hint: fallback.hint || word.hint,
            example: fallback.example || word.example
          }, {
            headers: { 
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          updated++;
        }
      } catch (error) {
        console.error('Failed to update hint for:', word.word);
        failed++;
      }
    }

    toast.success(`Updated ${updated} words! ${failed} failed.`);
    fetchWords();
    setLoading(false);
  };

  const filteredWords = words.filter(word => {
    const matchesSearch = word.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (word.hint && word.hint.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesDifficulty = filterDifficulty === 'all' || word.difficulty === filterDifficulty;
    const matchesLevel = filterLevel === 'all' || word.level === parseInt(filterLevel);
    return matchesSearch && matchesDifficulty && matchesLevel;
  });

  const displayExampleWithWord = (example, word) => {
    if (!example) return '-';
    return formatExampleWithWord(example, word);
  };

  return (
    <div className="p-6 bg-gradient-to-br from-white via-cyan-50/30 to-teal-50/30 min-h-screen">
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-cyan-100 to-teal-100 rounded-xl border-2 border-teal-300">
            <BookOpen className="text-cyan-600 h-6 w-6" />
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setShowVoiceSettings(true)}
            className="px-2.5 py-1.5 bg-white/80 text-slate-700 rounded-lg hover:bg-cyan-50/80 transition flex items-center gap-1.5 border-2 border-teal-300 text-xs font-medium shadow-sm"
          >
            <Mic size={14} className="text-cyan-600" />
            Voice
          </button>
          <button
            onClick={() => setShowTimerSettings(true)}
            className="px-2.5 py-1.5 bg-white/80 text-slate-700 rounded-lg hover:bg-cyan-50/80 transition flex items-center gap-1.5 border-2 border-teal-300 text-xs font-medium shadow-sm"
          >
            <Timer size={14} className="text-teal-600" />
            Timer
          </button>
          <button
            onClick={bulkGenerateHints}
            disabled={loading || words.length === 0}
            className="px-2.5 py-1.5 bg-white/80 text-slate-700 rounded-lg hover:bg-cyan-50/80 transition flex items-center gap-1.5 border-2 border-teal-300 text-xs font-medium shadow-sm disabled:opacity-50"
          >
            <Wand2 size={14} className="text-purple-600" />
            Get Hints
          </button>
          <button
            onClick={exportToTxt}
            className="px-2.5 py-1.5 bg-white/80 text-slate-700 rounded-lg hover:bg-cyan-50/80 transition flex items-center gap-1.5 border-2 border-teal-300 text-xs font-medium shadow-sm"
          >
            <FileText size={14} className="text-cyan-600" />
            TXT
          </button>
          <button
            onClick={exportToCsv}
            className="px-2.5 py-1.5 bg-white/80 text-slate-700 rounded-lg hover:bg-cyan-50/80 transition flex items-center gap-1.5 border-2 border-teal-300 text-xs font-medium shadow-sm"
          >
            <FileText size={14} className="text-teal-600" />
            CSV
          </button>
          <button
            onClick={exportWords}
            className="px-2.5 py-1.5 bg-white/80 text-slate-700 rounded-lg hover:bg-cyan-50/80 transition flex items-center gap-1.5 border-2 border-teal-300 text-xs font-medium shadow-sm"
          >
            <Download size={14} className="text-amber-600" />
            JSON
          </button>
          <button
            onClick={() => {
              setImportFile(null);
              setImportFileContent(null);
              setImportPreview([]);
              setShowBulkImport(true);
            }}
            className="px-2.5 py-1.5 bg-white/80 text-slate-700 rounded-lg hover:bg-cyan-50/80 transition flex items-center gap-1.5 border-2 border-teal-300 text-xs font-medium shadow-sm"
          >
            <Upload size={14} className="text-cyan-600" />
            Import
          </button>
          <button
            onClick={() => {
              setIsEditing(false);
              setCurrentId(null);
              setFormData({ word: '', hint: '', example: '', difficulty: 'medium', level: 1, points: 10, is_active: true });
              setDictionaryData(null);
              setShowDictionaryPanel(false);
              setShowAddModal(true);
            }}
            className="px-3 py-1.5 bg-gradient-to-r from-cyan-500 to-teal-500 text-white rounded-lg hover:from-cyan-600 hover:to-teal-600 transition flex items-center gap-1.5 shadow-lg shadow-teal-500/30 text-xs font-medium border-2 border-teal-400"
          >
            <Plus size={14} />
            Add Word
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <div className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-lg p-3 shadow-sm">
          <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Total</p>
          <p className="text-xl font-bold text-slate-800 mt-0.5">{stats.total}</p>
        </div>
        <div className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-lg p-3 shadow-sm">
          <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Active</p>
          <p className="text-xl font-bold text-emerald-600 mt-0.5">{stats.active}</p>
        </div>
        <div className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-lg p-3 shadow-sm">
          <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Inactive</p>
          <p className="text-xl font-bold text-rose-600 mt-0.5">{stats.inactive}</p>
        </div>
        <div className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-lg p-3 shadow-sm">
          <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Levels</p>
          <p className="text-xl font-bold text-indigo-600 mt-0.5">{LEVELS.length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mr-1">Levels:</span>
        {LEVELS.map(level => (
          <button
            key={level}
            onClick={() => setFilterLevel(filterLevel === level.toString() ? 'all' : level.toString())}
            className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition ${
              filterLevel === level.toString() 
                ? levelColors[level] + ' ring-2 ring-teal-400/50' 
                : 'bg-slate-100 text-slate-500 hover:bg-cyan-50'
            }`}
          >
            {level}
          </button>
        ))}
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mx-2">|</span>
        {difficulties.map(diff => (
          <button
            key={diff}
            onClick={() => setFilterDifficulty(filterDifficulty === diff ? 'all' : diff)}
            className={`px-2.5 py-0.5 rounded-lg text-[10px] font-semibold border transition ${
              filterDifficulty === diff 
                ? difficultyColors[diff] + ' ring-2 ring-teal-400/50 border-teal-300' 
                : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-cyan-50'
            }`}
          >
            <span className="capitalize">{diff}</span>
            <span className="ml-0.5 text-slate-400 font-normal">({difficultyPoints[diff]}pts)</span>
          </button>
        ))}
      </div>

      {/* Main Table - With Full Borders and Mist Grey Header */}
      <div className="border border-slate-300 rounded-lg overflow-hidden bg-white shadow-sm">
        {/* Table Header with Search */}
        <div className="bg-slate-50 border-b border-slate-300 px-4 py-3 flex flex-col sm:flex-row justify-between items-center gap-2">
          <div className="relative flex-1 w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search words or hints..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-3 py-1.5 text-sm text-slate-800 focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {(searchQuery || filterDifficulty !== 'all' || filterLevel !== 'all') && (
              <button
                onClick={() => { setSearchQuery(''); setFilterDifficulty('all'); setFilterLevel('all'); }}
                className="px-2.5 py-1 text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition whitespace-nowrap"
              >
                Clear
              </button>
            )}
            <div className="text-xs font-semibold px-3 py-1 bg-cyan-50 rounded-lg text-cyan-700 border border-cyan-200 whitespace-nowrap">
              <span className="text-cyan-600 font-bold">{filteredWords.length}</span> / {words.length}
            </div>
          </div>
        </div>

        {/* Table Body with Full Borders and Mist Grey Header */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#E8EAED]">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider border border-slate-300">#</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider border border-slate-300">Word</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider border border-slate-300">Hint</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider border border-slate-300">Example</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider border border-slate-300">Level</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider border border-slate-300">Difficulty</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider border border-slate-300">Points</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider border border-slate-300">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider border border-slate-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" className="px-4 py-12 text-center border border-slate-300">
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-5 h-5 border-2 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-sm text-slate-500">Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredWords.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-4 py-16 text-center border border-slate-300">
                    <div className="flex flex-col items-center gap-2">
                      <HelpCircle size={36} className="text-slate-300" />
                      <p className="text-sm text-slate-500 font-medium">No words found.</p>
                      <button
                        onClick={() => {
                          setIsEditing(false);
                          setCurrentId(null);
                          setFormData({ word: '', hint: '', example: '', difficulty: 'medium', level: 1, points: 10, is_active: true });
                          setDictionaryData(null);
                          setShowDictionaryPanel(false);
                          setShowAddModal(true);
                        }}
                        className="text-cyan-600 hover:text-cyan-700 text-xs font-medium"
                      >
                        Add your first word
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredWords.map((wordItem, index) => (
                  <tr key={wordItem.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 text-sm text-slate-500 border border-slate-300">{index + 1}</td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-700 border border-slate-300">{wordItem.word}</td>
                    <td className="px-4 py-3 text-sm text-slate-600 border border-slate-300">{wordItem.hint || '-'}</td>
                    <td className="px-4 py-3 text-sm text-slate-600 max-w-[200px] truncate border border-slate-300">
                      {displayExampleWithWord(wordItem.example, wordItem.word)}
                    </td>
                    <td className="px-4 py-3 text-sm border border-slate-300">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${levelColors[wordItem.level] || 'bg-slate-100 text-slate-600'}`}>
                        {wordItem.level}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm border border-slate-300">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        wordItem.difficulty === 'easy' ? 'bg-cyan-50 text-cyan-700' :
                        wordItem.difficulty === 'medium' ? 'bg-teal-50 text-teal-700' :
                        wordItem.difficulty === 'hard' ? 'bg-amber-50 text-amber-700' :
                        'bg-rose-50 text-rose-700'
                      }`}>
                        {wordItem.difficulty}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-amber-600 border border-slate-300">{wordItem.points || 10}</td>
                    <td className="px-4 py-3 text-sm border border-slate-300">
                      <button
                        onClick={() => toggleActive(wordItem)}
                        className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          wordItem.is_active 
                            ? 'bg-emerald-100 text-emerald-700' 
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {wordItem.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-sm border border-slate-300">
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => {
                            setIsEditing(true);
                            setCurrentId(wordItem.id);
                            setFormData({
                              word: wordItem.word,
                              hint: wordItem.hint || '',
                              example: wordItem.example || '',
                              difficulty: wordItem.difficulty,
                              level: parseInt(wordItem.level) || 1,
                              points: wordItem.points || 10,
                              is_active: wordItem.is_active
                            });
                            setDictionaryData(null);
                            setShowDictionaryPanel(false);
                            setShowAddModal(true);
                          }}
                          className="p-1 rounded hover:bg-blue-50 text-blue-600 transition"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => deleteWord(wordItem.id)}
                          className="p-1 rounded hover:bg-rose-50 text-rose-500 transition"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="bg-slate-50 border-t border-slate-300 px-4 py-2 flex justify-between items-center">
          <span className="text-xs text-slate-500">
            Showing <span className="font-semibold text-slate-700">{filteredWords.length}</span> of{' '}
            <span className="font-semibold text-slate-700">{words.length}</span> words
          </span>
          <span className="flex items-center gap-2 text-xs text-slate-500">
            <span className="font-semibold text-emerald-600">{stats.active}</span> active
            <span className="text-slate-300">|</span>
            <span className="font-semibold text-rose-600">{stats.inactive}</span> inactive
            {voiceAnalysis && (
              <>
                <span className="text-slate-300">|</span>
                <span className="font-semibold text-cyan-600">Voice Cloned</span>
              </>
            )}
          </span>
        </div>
      </div>

      {/* Voice Settings Modal */}
      {showVoiceSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-fadeIn max-h-[90vh] overflow-y-auto border-2 border-teal-300">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Mic size={20} className="text-cyan-600" />
                Voice Settings
              </h2>
              <button onClick={() => setShowVoiceSettings(false)} className="p-1 hover:bg-cyan-50 rounded-lg transition text-slate-400">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border-2 border-slate-200">
                <div>
                  <p className="text-sm font-semibold text-slate-700">Enable Voice</p>
                  <p className="text-xs text-slate-500">Voice feedback for learners</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={voiceSettings.enabled}
                    onChange={(e) => setVoiceSettings({ ...voiceSettings, enabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:ring-2 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border-2 border-slate-200">
                <div>
                  <p className="text-sm font-semibold text-slate-700">Use Cloned Voice</p>
                  <p className="text-xs text-slate-500">Apply your voice characteristics to all words</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={voiceSettings.useClonedVoice}
                    onChange={(e) => setVoiceSettings({ ...voiceSettings, useClonedVoice: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:ring-2 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500"></div>
                </label>
              </div>

              {/* Voice Cloning Section */}
              <div className="p-4 bg-gradient-to-r from-cyan-50 to-teal-50 rounded-xl border-2 border-teal-200">
                <p className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                  <Copy size={16} className="text-cyan-600" />
                  Clone Your Voice
                </p>
                <p className="text-xs text-slate-500 mb-3">Record your voice to analyze pitch and speed</p>
                
                <div className="mb-3 p-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
                  <AlertCircle size={14} className="inline mr-1" />
                  Speak clearly for 3-5 seconds. We'll analyze your pitch and speaking speed.
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {!isRecording ? (
                    <button
                      onClick={startRecording}
                      className="flex-1 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg text-sm font-medium transition flex items-center justify-center gap-2 min-w-[100px]"
                    >
                      <Mic size={16} />
                      Record Voice
                    </button>
                  ) : (
                    <button
                      onClick={stopRecording}
                      className="flex-1 px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-sm font-medium transition flex items-center justify-center gap-2 animate-pulse min-w-[100px]"
                    >
                      <MicOff size={16} />
                      Recording...
                    </button>
                  )}
                  
                  <button
                    onClick={playCloneVoiceOnly}
                    disabled={!cloneVoiceData || isPlayingClone}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2 min-w-[100px] ${
                      cloneVoiceData && !isPlayingClone
                        ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    {isPlayingClone ? (
                      <>
                        <Loader size={16} className="animate-spin" />
                        Playing...
                      </>
                    ) : (
                      <>
                        <Volume2 size={16} />
                        Play Recording
                      </>
                    )}
                  </button>
                  
                  {cloneVoiceData && (
                    <button
                      onClick={deleteCloneVoice}
                      className="px-4 py-2 bg-rose-100 hover:bg-rose-200 text-rose-600 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2"
                    >
                      <Trash2 size={16} />
                      Remove
                    </button>
                  )}
                </div>
                
                {voiceAnalysis && (
                  <div className="mt-3 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                    <p className="text-xs font-semibold text-emerald-700 mb-1">Voice Analysis Results</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Pitch:</span>
                        <span className="font-semibold text-emerald-700">{voiceAnalysis.pitch.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Speed:</span>
                        <span className="font-semibold text-emerald-700">{voiceAnalysis.speed.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Duration:</span>
                        <span className="font-semibold text-emerald-700">{voiceAnalysis.duration.toFixed(1)}s</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Syllables/sec:</span>
                        <span className="font-semibold text-emerald-700">{voiceAnalysis.syllablesPerSecond.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                )}
                
                {!cloneVoiceData && !isRecording && (
                  <p className="text-xs text-slate-400 mt-2">
                    No voice cloned yet. Click "Record Voice" and speak clearly.
                  </p>
                )}
                
                {isRecording && (
                  <p className="text-xs text-rose-600 mt-2 flex items-center gap-1 animate-pulse">
                    <Loader size={12} className="animate-spin" />
                    Recording... Please speak clearly for 3-5 seconds
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Voice Speed (override)
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="1.5"
                  step="0.1"
                  value={voiceSettings.voiceSpeed}
                  onChange={(e) => setVoiceSettings({ ...voiceSettings, voiceSpeed: parseFloat(e.target.value) })}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-500"
                />
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Slow</span>
                  <span>{voiceSettings.voiceSpeed}x</span>
                  <span>Fast</span>
                </div>
                {voiceAnalysis && (
                  <p className="text-[10px] text-slate-400 mt-1">
                    Analyzed speed: {voiceAnalysis.speed.toFixed(2)}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Voice Pitch (override)
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="1.5"
                  step="0.1"
                  value={voiceSettings.voicePitch}
                  onChange={(e) => setVoiceSettings({ ...voiceSettings, voicePitch: parseFloat(e.target.value) })}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-500"
                />
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Low</span>
                  <span>{voiceSettings.voicePitch}x</span>
                  <span>High</span>
                </div>
                {voiceAnalysis && (
                  <p className="text-[10px] text-slate-400 mt-1">
                    Analyzed pitch: {voiceAnalysis.pitch.toFixed(2)}
                  </p>
                )}
              </div>

              {/* Preview Button - Uses cloned voice */}
              <div className="p-3 bg-cyan-50 rounded-xl border-2 border-teal-200">
                <p className="text-xs text-cyan-700 flex items-start gap-1.5">
                  <Volume2 size={14} className="flex-shrink-0 mt-0.5 text-cyan-600" />
                  Preview: 
                  {voiceSettings.useClonedVoice && voiceAnalysis ? (
                    <button 
                      onClick={() => {
                        speakWithVoice("This is how all words will sound with your cloned voice characteristics.");
                      }}
                      className="text-cyan-600 hover:text-cyan-700 font-medium underline text-xs"
                    >
                      Click to hear your cloned voice on sample text
                    </button>
                  ) : voiceSettings.useClonedVoice && !voiceAnalysis ? (
                    <span className="text-amber-600 text-xs">
                      No voice analyzed. Please record your voice first.
                    </span>
                  ) : (
                    <button 
                      onClick={() => {
                        fallbackSpeak("This is how all words will sound with default voice.");
                      }}
                      className="text-cyan-600 hover:text-cyan-700 font-medium underline text-xs"
                    >
                      Click to preview default voice
                    </button>
                  )}
                </p>
                {voiceSettings.useClonedVoice && voiceAnalysis && (
                  <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                    <CheckCircle size={12} />
                    Your voice characteristics (pitch: {voiceAnalysis.pitch.toFixed(2)}, speed: {voiceAnalysis.speed.toFixed(2)}) applied
                  </p>
                )}
                {!voiceSettings.useClonedVoice && voiceAnalysis && (
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                    <AlertCircle size={12} />
                    Enable "Use Cloned Voice" above to apply your voice characteristics
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-4 border-t-2 border-slate-200">
              <button
                onClick={() => setShowVoiceSettings(false)}
                className="flex-1 px-4 py-2.5 border-2 border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition font-medium text-sm"
              >
                Cancel
              </button>
              <button
                onClick={saveVoiceSettings}
                disabled={loading}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-teal-500 text-white rounded-xl hover:from-cyan-600 hover:to-teal-600 transition font-medium shadow-lg shadow-teal-500/30 disabled:opacity-50 border-2 border-teal-400 text-sm"
              >
                {loading ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Timer Settings Modal */}
      {showTimerSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-fadeIn max-h-[90vh] overflow-y-auto border-2 border-teal-300">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Timer size={20} className="text-cyan-600" />
                Timer Settings
              </h2>
              <button onClick={() => setShowTimerSettings(false)} className="p-1 hover:bg-cyan-50 rounded-lg transition text-slate-400">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-3 bg-cyan-50 rounded-xl border-2 border-teal-200">
                <p className="text-xs text-cyan-700 flex items-start gap-1.5">
                  <AlertCircle size={14} className="flex-shrink-0 mt-0.5 text-cyan-600" />
                  Set time limits per word for each difficulty level.
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Default Time (seconds)
                </label>
                <input
                  type="number"
                  value={timerConfig.defaultTimeLimit}
                  onChange={(e) => setTimerConfig({
                    ...timerConfig,
                    defaultTimeLimit: parseInt(e.target.value) || 30
                  })}
                  className="w-full px-4 py-2.5 bg-white border-2 border-slate-200 rounded-xl focus:border-teal-400 focus:ring-2 focus:ring-teal-100 outline-none transition text-slate-800 text-sm"
                  min="10"
                  max="120"
                />
              </div>

              <div className="border-t-2 border-slate-200 pt-4">
                <p className="text-sm font-semibold text-slate-700 mb-3">Time per Difficulty</p>
                
                {difficulties.map(diff => (
                  <div key={diff} className="flex items-center gap-3 mb-3">
                    <span className={`px-2 py-1 rounded-lg text-xs font-bold border ${difficultyColors[diff]}`}>
                      {diff}
                    </span>
                    <input
                      type="number"
                      value={timerConfig.timeLimitPerDifficulty?.[diff] || timerConfig.defaultTimeLimit}
                      onChange={(e) => setTimerConfig({
                        ...timerConfig,
                        timeLimitPerDifficulty: {
                          ...timerConfig.timeLimitPerDifficulty,
                          [diff]: parseInt(e.target.value) || timerConfig.defaultTimeLimit
                        }
                      })}
                      className="flex-1 px-4 py-2 bg-white border-2 border-slate-200 rounded-xl focus:border-teal-400 focus:ring-2 focus:ring-teal-100 outline-none transition text-slate-800 text-sm"
                      min="10"
                      max="120"
                      placeholder="Seconds"
                    />
                    <span className="text-xs text-slate-400">sec</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-4 border-t-2 border-slate-200">
              <button
                onClick={() => setShowTimerSettings(false)}
                className="flex-1 px-4 py-2.5 border-2 border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition font-medium text-sm"
              >
                Cancel
              </button>
              <button
                onClick={saveTimerSettings}
                disabled={loading}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-teal-500 text-white rounded-xl hover:from-cyan-600 hover:to-teal-600 transition font-medium shadow-lg shadow-teal-500/30 disabled:opacity-50 border-2 border-teal-400 text-sm"
              >
                {loading ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-fadeIn max-h-[90vh] overflow-y-auto border-2 border-teal-300">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-slate-800">
                {isEditing ? 'Edit Word' : 'Add New Word'}
              </h2>
              <button onClick={() => { setShowAddModal(false); setDictionaryData(null); setShowDictionaryPanel(false); }} className="p-1 hover:bg-cyan-50 rounded-lg transition text-slate-400">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Word <span className="text-rose-500">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.word}
                    onChange={(e) => {
                      setFormData({ ...formData, word: e.target.value.toUpperCase() });
                      setDictionaryData(null);
                      setShowDictionaryPanel(false);
                    }}
                    className="flex-1 px-4 py-2.5 bg-white border-2 border-slate-200 rounded-xl focus:border-teal-400 focus:ring-2 focus:ring-teal-100 outline-none transition text-slate-800 uppercase text-sm"
                    placeholder="Enter the word"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => generateBoth(formData.word)}
                    disabled={!formData.word || isFetchingDictionary}
                    className="px-3 py-2 bg-purple-100 text-purple-700 rounded-xl hover:bg-purple-200 transition disabled:opacity-50 flex items-center gap-1 text-xs whitespace-nowrap border-2 border-purple-200"
                  >
                    {isFetchingDictionary ? (
                      <Loader size={14} className="animate-spin" />
                    ) : (
                      <Wand2 size={14} />
                    )}
                    <span className="hidden sm:inline">Dictionary</span>
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Auto-generate from dictionary or use fallback</p>
              </div>

              {renderDictionaryInfo()}

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Hint</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.hint}
                    onChange={(e) => setFormData({ ...formData, hint: e.target.value })}
                    className="flex-1 px-4 py-2.5 bg-white border-2 border-slate-200 rounded-xl focus:border-teal-400 focus:ring-2 focus:ring-teal-100 outline-none transition text-slate-800 text-sm"
                    placeholder="Enter a hint"
                  />
                  <button
                    type="button"
                    onClick={() => generateHint(formData.word)}
                    disabled={!formData.word || isGeneratingHint}
                    className="px-3 py-2 bg-purple-50 text-purple-600 rounded-xl hover:bg-purple-100 transition disabled:opacity-50 flex items-center gap-1 text-xs border-2 border-purple-200"
                  >
                    {isGeneratingHint ? <Loader size={14} className="animate-spin" /> : <Wand2 size={14} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Example Sentence</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.example}
                    onChange={(e) => setFormData({ ...formData, example: e.target.value })}
                    className="flex-1 px-4 py-2.5 bg-white border-2 border-slate-200 rounded-xl focus:border-teal-400 focus:ring-2 focus:ring-teal-100 outline-none transition text-slate-800 text-sm"
                    placeholder="e.g., The ___ is very bright today."
                  />
                  <button
                    type="button"
                    onClick={() => generateExample(formData.word)}
                    disabled={!formData.word || isGeneratingExample}
                    className="px-3 py-2 bg-purple-50 text-purple-600 rounded-xl hover:bg-purple-100 transition disabled:opacity-50 flex items-center gap-1 text-xs border-2 border-purple-200"
                  >
                    {isGeneratingExample ? <Loader size={14} className="animate-spin" /> : <Wand2 size={14} />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Use ___ to represent the word in the sentence</p>
                {formData.word && formData.example && (
                  <p className="text-xs text-cyan-600 mt-1 bg-cyan-50 p-1.5 rounded-lg border-2 border-teal-200">
                    Preview: {formatExampleWithWord(formData.example, formData.word)}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Level <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.level}
                    onChange={(e) => setFormData({ ...formData, level: parseInt(e.target.value) })}
                    className="w-full px-4 py-2.5 bg-white border-2 border-slate-200 rounded-xl focus:border-teal-400 focus:ring-2 focus:ring-teal-100 outline-none transition text-slate-800 text-sm"
                  >
                    {LEVELS.map(level => (
                      <option key={level} value={level}>
                        Level {level} {level <= 3 ? '(Easy)' : level <= 6 ? '(Medium)' : level <= 9 ? '(Hard)' : '(Expert)'}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Difficulty <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white border-2 border-slate-200 rounded-xl focus:border-teal-400 focus:ring-2 focus:ring-teal-100 outline-none transition text-slate-800 text-sm"
                  >
                    {difficulties.map(d => (
                      <option key={d} value={d}>
                        {d.charAt(0).toUpperCase() + d.slice(1)} ({difficultyPoints[d]} pts)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Points</label>
                <input
                  type="number"
                  value={formData.points}
                  onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2.5 bg-white border-2 border-slate-200 rounded-xl focus:border-teal-400 focus:ring-2 focus:ring-teal-100 outline-none transition text-slate-800 text-sm"
                  min="1"
                  max="50"
                />
                <p className="text-[10px] text-slate-400 mt-1">Recommended: 5-20 points based on difficulty</p>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 text-teal-500 rounded focus:ring-teal-400 border-2 border-slate-300"
                />
                <label className="text-sm text-slate-700">Active (visible to learners)</label>
              </div>

              <div className="flex gap-3 mt-4 pt-4 border-t-2 border-slate-200">
                <button
                  type="button"
                  onClick={() => { setShowAddModal(false); setDictionaryData(null); setShowDictionaryPanel(false); }}
                  className="flex-1 px-4 py-2.5 border-2 border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition font-medium text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-teal-500 text-white rounded-xl hover:from-cyan-600 hover:to-teal-600 transition font-medium shadow-lg shadow-teal-500/30 disabled:opacity-50 border-2 border-teal-400 text-sm"
                >
                  {loading ? 'Saving...' : (isEditing ? 'Update' : 'Add')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      {showBulkImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl animate-fadeIn max-h-[90vh] overflow-y-auto border-2 border-teal-300">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Upload size={20} className="text-cyan-600" />
                Import Words
              </h2>
              <button onClick={() => setShowBulkImport(false)} className="p-1 hover:bg-cyan-50 rounded-lg transition text-slate-400">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="border-2 border-dashed border-teal-300 rounded-xl p-8 text-center hover:border-teal-500 transition-colors">
                <input
                  type="file"
                  accept=".json,.pdf,.docx,.txt,.csv"
                  onChange={(e) => handleFileSelect(e.target.files[0])}
                  className="hidden"
                  id="import-file"
                />
                <label htmlFor="import-file" className="cursor-pointer block">
                  {importFile ? (
                    <div>
                      <div className="flex items-center justify-center gap-3 mb-2">
                        {importFile.name.endsWith('.pdf') && <File size={32} className="text-rose-500" />}
                        {importFile.name.endsWith('.docx') && <File size={32} className="text-blue-500" />}
                        {importFile.name.endsWith('.json') && <FileText size={32} className="text-amber-500" />}
                        {importFile.name.endsWith('.txt') && <FileText size={32} className="text-slate-500" />}
                        {importFile.name.endsWith('.csv') && <FileSpreadsheet size={32} className="text-emerald-500" />}
                        <div>
                          <p className="font-medium text-slate-800 text-sm">{importFile.name}</p>
                          <p className="text-xs text-slate-500">
                            {(importFile.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={(e) => { e.preventDefault(); setImportFile(null); setImportPreview([]); }}
                        className="mt-2 text-sm text-rose-500 hover:text-rose-600"
                      >
                        Remove file
                      </button>
                    </div>
                  ) : (
                    <div className="py-4">
                      <Upload size={40} className="mx-auto text-cyan-300 mb-3" />
                      <p className="text-sm text-slate-600 font-medium">Click to select a file</p>
                      <p className="text-xs text-slate-400 mt-1">
                        Supports: JSON, PDF, DOCX, TXT, CSV
                      </p>
                    </div>
                  )}
                </label>
              </div>

              {isParsingFile && (
                <div className="flex items-center justify-center gap-3 py-4">
                  <Loader size={24} className="animate-spin text-cyan-600" />
                  <span className="text-sm text-slate-600">Reading file...</span>
                </div>
              )}

              {importPreview.length > 0 && (
                <div className="border-2 border-teal-200 rounded-xl overflow-hidden">
                  <div className="bg-cyan-50/50 px-4 py-2 border-b-2 border-teal-200 flex justify-between items-center">
                    <span className="text-sm font-semibold text-slate-700">
                      Preview: {importPreview.length} words found
                    </span>
                    <span className="text-xs text-slate-500">
                      {importPreview.filter(w => w.word).length} valid words
                    </span>
                  </div>
                  <div className="max-h-60 overflow-y-auto p-2">
                    <div className="grid grid-cols-1 gap-1">
                      {importPreview.slice(0, 20).map((word, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm p-1.5 hover:bg-cyan-50 rounded">
                          <span className="font-mono text-slate-400 w-8">{idx + 1}.</span>
                          <span className="font-bold text-slate-800">{word.word || 'Missing'}</span>
                          {word.hint && (
                            <span className="text-slate-500 text-xs truncate">- {word.hint}</span>
                          )}
                          <span className={`ml-auto text-xs px-2 py-0.5 rounded-lg ${difficultyColors[word.difficulty] || 'bg-slate-100 text-slate-600'}`}>
                            {word.difficulty || 'unknown'}
                          </span>
                        </div>
                      ))}
                      {importPreview.length > 20 && (
                        <div className="text-center text-xs text-slate-400 py-2">
                          + {importPreview.length - 20} more words
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="p-3 bg-cyan-50 rounded-xl border-2 border-teal-200">
                <p className="text-xs text-cyan-700 flex items-start gap-1.5">
                  <AlertCircle size={14} className="flex-shrink-0 mt-0.5 text-cyan-600" />
                  <span>
                    <strong>File formats:</strong><br />
                    • <strong>JSON:</strong> List of words with: word, hint, example, difficulty, level, points<br />
                    • <strong>PDF/DOCX/TXT:</strong> One word per line, or with separators (|, ,, tab)<br />
                    • <strong>CSV:</strong> Columns: word, hint, example, difficulty, level, points
                  </span>
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-4 border-t-2 border-slate-200">
              <button
                onClick={() => setShowBulkImport(false)}
                className="flex-1 px-4 py-2.5 border-2 border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition font-medium text-sm"
              >
                Cancel
              </button>
              <button
                onClick={importWords}
                disabled={!importFile || loading || isParsingFile || importPreview.length === 0}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-teal-500 text-white rounded-xl hover:from-cyan-600 hover:to-teal-600 transition font-medium shadow-lg shadow-teal-500/30 disabled:opacity-50 border-2 border-teal-400 text-sm"
              >
                {loading ? 'Importing...' : `Import ${importPreview.length} Words`}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.25s ease-out forwards;
        }
        ::-webkit-scrollbar {
          width: 6px;
        }
        ::-webkit-scrollbar-track {
          background: rgba(226, 232, 240, 0.5);
          border-radius: 3px;
        }
        ::-webkit-scrollbar-thumb {
          background: rgba(56, 189, 248, 0.3);
          border-radius: 3px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(56, 189, 248, 0.5);
        }
      `}</style>
    </div>
  );
};

export default AdminSpellingBee;