import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import API_URL from '../../config';
import { useTheme } from '../../contexts/ThemeContext';
import useVoice from '../../hooks/useVoice';
import QuizResultsModal from './QuizResultsModal';

const renderFormattedText = (text) => {
  if (!text) return '';
  return text
    .replace(/__(.*?)__/g, '<u class="underline decoration-2 decoration-teal-500">$1</u>')
    .replace(/<u>(.*?)<\/u>/g, '<u class="underline decoration-2 decoration-teal-500">$1</u>')
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');
};

const normalizeSentenceCase = (text) => {
  if (!text) return '';
  const lower = String(text).toLowerCase();
  return lower.replace(/(^\s*[a-z])|([.!?]\s+[a-z])/g, (match) => match.toUpperCase());
};

const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const LEVEL_COLORS = {
  1: 'bg-green-400',   2: 'bg-green-500',
  3: 'bg-teal-400',    4: 'bg-teal-500',
  5: 'bg-blue-400',    6: 'bg-blue-500',
  7: 'bg-purple-400',  8: 'bg-purple-500',
  9: 'bg-orange-500',  10: 'bg-red-500',
};

const DISTRICT_CATEGORY_LABELS = {
  all: 'Mixed Challenge',
  'capitals-major-towns': 'Capitals and Major Towns',
  'borders-neighbors': 'Borders and Neighbors',
  'physical-features': 'Physical Features',
  'parks-wildlife': 'National Parks and Wildlife',
  'economic-activities': 'Economic Activities',
  'transport-border-posts': 'Transport and Border Posts',
  'history-culture': 'History and Cultural Landmarks',
  'region-classification': 'Region Classification',
};

const TakeQuiz = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const { getPageStyles } = useTheme();
  const { speak, stop: stopVoice } = useVoice();

  // Core quiz state
  const [quiz, setQuiz] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState([]);
  const answersRef = useRef([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Timer
  const [timeLeft, setTimeLeft] = useState(30);
  const MAX_TIME = 30;
  const POINTS_PER_QUESTION = 2;

  // Per-question UI state
  const [fiftyFiftyUsed, setFiftyFiftyUsed] = useState(false);
  const [filteredOptions, setFilteredOptions] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [currentScore, setCurrentScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);

  // Level / access
  const [learnerClass, setLearnerClass] = useState(null);
  const [learnerCurrentLevel, setLearnerCurrentLevel] = useState(null);
  const [quizLevel, setQuizLevel] = useState(null);       // class-level (standard-X)
  const [quizGameLevel, setQuizGameLevel] = useState(1);   // numeric 1-10
  const [userGameLevel, setUserGameLevel] = useState(1);   // learner's current game level
  const [accessDenied, setAccessDenied] = useState(false);
  const [accessError, setAccessError] = useState('');
  const [isRandomQuiz, setIsRandomQuiz] = useState(false);
  const [totalAvailable, setTotalAvailable] = useState(0);
  const [districtCategory, setDistrictCategory] = useState('all');
  const [districtCategories, setDistrictCategories] = useState([]);

  // Results modal
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [quizResults, setQuizResults] = useState({
    scorePercentage: 0, earnedPoints: 0, correctCount: 0,
    totalQuestions: 0, passed: false, answers: [],
    levelAdvanced: false, newQuizLevel: 1, championBadgeEarned: false,
    currentQuizLevel: 1,
  });

  const audioRef = useRef(null);

  // ── helpers ─────────────────────────────────────────────────────────────
  const sanitizeValue = (v) => {
    if (v === null || v === undefined || v === 'null' || v === 'Null' || v === 'NULL') return '';
    return String(v).trim();
  };
  const normalizeValue = (v) => sanitizeValue(v).toLowerCase();
  const formatLevelName = (l) => {
    if (!l) return 'Unknown';
    return l.split('-').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
  };
  const pageStyles = {
    ...getPageStyles('quizTaking'),
    backgroundColor: '#f5f9ff',
    backgroundImage: 'linear-gradient(180deg, #f8fbff 0%, #eef5ff 100%)',
    color: '#1e293b',
  };
  const isDarkMode = false;

  // ── audio ────────────────────────────────────────────────────────────────
  const initAudio = () => {
    if (!audioRef.current) audioRef.current = new (window.AudioContext || window.webkitAudioContext)();
    if (audioRef.current.state === 'suspended') audioRef.current.resume();
  };
  const playSound = (freq = 587.33, dur = 0.15, type = 'sine', vol = 0.1) => {
    try {
      initAudio(); const ctx = audioRef.current;
      const osc = ctx.createOscillator(); const g = ctx.createGain();
      osc.type = type; osc.frequency.setValueAtTime(freq, ctx.currentTime);
      g.gain.setValueAtTime(vol, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
      osc.connect(g); g.connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime + dur);
    } catch (e) {}
  };
  const playTick  = () => playSound(880, 0.05, 'sine', 0.03);
  const playNav   = () => playSound(587.33, 0.1, 'sine', 0.08);
  const playCorrect = () => {
    try {
      initAudio(); const ctx = audioRef.current;
      [523.25, 587.33, 659.25, 783.99].forEach((f, i) => {
        setTimeout(() => {
          const o = ctx.createOscillator(); const g = ctx.createGain();
          o.type = 'sine'; o.frequency.setValueAtTime(f, ctx.currentTime);
          g.gain.setValueAtTime(0.15, ctx.currentTime);
          g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
          o.connect(g); g.connect(ctx.destination); o.start(); o.stop(ctx.currentTime + 0.2);
        }, i * 80);
      });
    } catch (e) {}
  };
  const playWrong = () => {
    try {
      initAudio(); const ctx = audioRef.current;
      [440, 349.23, 293.66].forEach((f, i) => {
        setTimeout(() => {
          const o = ctx.createOscillator(); const g = ctx.createGain();
          o.type = 'sawtooth'; o.frequency.setValueAtTime(f, ctx.currentTime);
          g.gain.setValueAtTime(0.12, ctx.currentTime);
          g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
          o.connect(g); g.connect(ctx.destination); o.start(); o.stop(ctx.currentTime + 0.25);
        }, i * 100);
      });
    } catch (e) {}
  };
  const playApplause = () => {
    try {
      initAudio(); const ctx = audioRef.current;
      [[0,800,0.08],[50,1000,0.07],[100,1200,0.06],[150,900,0.07],
       [200,1100,0.06],[250,1300,0.05],[300,950,0.05],[350,1050,0.04]
      ].forEach(([d, f, v]) => {
        setTimeout(() => {
          const o = ctx.createOscillator(); const g = ctx.createGain();
          o.type = 'sine'; o.frequency.setValueAtTime(f, ctx.currentTime);
          g.gain.setValueAtTime(v, ctx.currentTime);
          g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
          o.connect(g); g.connect(ctx.destination); o.start(); o.stop(ctx.currentTime + 0.3);
        }, d);
      });
    } catch (e) {}
  };
  const playTimesUp = () => {
    try {
      initAudio(); const ctx = audioRef.current;
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.type = 'sawtooth'; o.frequency.setValueAtTime(220, ctx.currentTime);
      o.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.5);
      g.gain.setValueAtTime(0.15, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      o.connect(g); g.connect(ctx.destination); o.start(); o.stop(ctx.currentTime + 0.6);
    } catch (e) {}
  };

  // ── data fetching ────────────────────────────────────────────────────────
  const getLearnerProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const r = await axios.get(`${API_URL}/api/learner/profile`, { headers: { Authorization: `Bearer ${token}` } });
      if (r.data.success) {
        setLearnerClass(r.data.learner.class_level || 'standard-5');
        setLearnerCurrentLevel(r.data.learner.current_level || r.data.learner.class_level || 'standard-5');
      }
    } catch { setLearnerClass('standard-5'); setLearnerCurrentLevel('standard-5'); }
  };

  const getUserGameLevel = async () => {
    try {
      const token = localStorage.getItem('token');
      const r = await axios.get(`${API_URL}/api/learner/quiz-level`, { headers: { Authorization: `Bearer ${token}` } });
      if (r.data.success) setUserGameLevel(r.data.current_level || 1);
    } catch { setUserGameLevel(1); }
  };

  const fetchQuiz = async () => {
    try {
      setLoading(true);
      setAccessDenied(false);
      setAccessError('');
      setQuizCompleted(false);
      setCurrentQuestion(0);
      setCurrentScore(0);
      setFiftyFiftyUsed(false);
      setFilteredOptions(null);
      setShowFeedback(false);
      setSelectedOption(null);

      const token = localStorage.getItem('token');
      const urlParams = new URLSearchParams(window.location.search);
      const randomParam = urlParams.get('random');
      const limitParam  = urlParams.get('limit');
      const districtCategoryParam = urlParams.get('districtCategory') || districtCategory || 'all';
      
      let url;
      if (quizId === 'malawi-districts') {
        url = `${API_URL}/api/districts/quiz?count=10&category=${encodeURIComponent(districtCategoryParam)}`;
      } else {
        url = `${API_URL}/api/learner/quiz/${quizId}`;
        if (randomParam === 'true') { url += `?random=true&limit=${limitParam || 20}`; setIsRandomQuiz(true); }
      }

      const response = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!response.data.success) throw new Error('Quiz not found');

      const quizData = response.data.quiz;

      if (quizId === 'malawi-districts') {
        setDistrictCategory(quizData.district_category || districtCategoryParam || 'all');
        const available = Array.isArray(quizData.available_categories) && quizData.available_categories.length > 0
          ? quizData.available_categories
          : Object.keys(DISTRICT_CATEGORY_LABELS).map(id => ({ id, label: DISTRICT_CATEGORY_LABELS[id] }));
        setDistrictCategories(available);
      }

      // Access check is done here to avoid extra network round-trips.
      if (
        quizId !== 'malawi-districts' &&
        quizData.class_level &&
        learnerCurrentLevel &&
        quizData.class_level !== learnerCurrentLevel
      ) {
        setAccessError(`❌ Access Denied: This quiz is for ${formatLevelName(quizData.class_level)} learners only.`);
        setAccessDenied(true);
        setLoading(false);
        return;
      }

      setQuizLevel(quizData.class_level || null);
      setQuizGameLevel(quizData.quiz_level || 1);

      let questions = quizData.questions;
      if (typeof questions === 'string') questions = JSON.parse(questions);
      setTotalAvailable(quizData.total_questions_available || questions.length);

      const randomizedQuestions = questions.map((q, idx) => {
        const opts = (q.options || []).map(o => ({
          text: normalizeSentenceCase(sanitizeValue(o)),
          isCorrect: normalizeValue(o) === normalizeValue(q.correctAnswer),
        }));
        const shuffled = shuffleArray(opts);
        return {
          ...q,
          id: q.id || idx,
          question: normalizeSentenceCase(sanitizeValue(q.question)) || 'No question text',
          options: shuffled.map(o => o.text),
          correctAnswer: normalizeSentenceCase(sanitizeValue(shuffled.find(o => o.isCorrect)?.text || q.correctAnswer)),
          questionImage: q.questionImage && q.questionImage.trim() !== '' &&
            q.questionImage !== 'null' && q.questionImage !== 'NULL' ? q.questionImage : null,
        };
      });

      setQuiz({ ...quizData, questions: randomizedQuestions });
      const init = new Array(randomizedQuestions.length).fill('');
      setAnswers(init);
      answersRef.current = init;
      setTimeLeft(MAX_TIME);
      setCurrentScore(0);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching quiz:', err);
      toast.error('Quiz unavailable');
      navigate('/quizzes');
    }
  };

  // ── lifecycle ────────────────────────────────────────────────────────────
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    setIsRandomQuiz(urlParams.get('random') === 'true');
  }, []);

  useEffect(() => { getLearnerProfile(); getUserGameLevel(); }, []);

  useEffect(() => {
    if (learnerCurrentLevel !== null) fetchQuiz();
  }, [quizId, learnerCurrentLevel]); // eslint-disable-line

  useEffect(() => {
    if (quizId === 'malawi-districts' && learnerCurrentLevel !== null) {
      fetchQuiz();
    }
  }, [districtCategory]); // eslint-disable-line

  // Timer
  useEffect(() => {
    if (!quiz || loading || timeLeft <= 0 || showFeedback || quizCompleted) return;
    playTick();
    const timer = setInterval(() => {
      setTimeLeft(prev => { if (prev <= 1) { clearInterval(timer); return 0; } return prev - 1; });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, quiz, loading, showFeedback, quizCompleted]); // eslint-disable-line

  // Auto-submit on timeout
  useEffect(() => {
    if (timeLeft === 0 && !showFeedback && quiz && !loading && !quizCompleted) handleTimeout();
  }, [timeLeft]); // eslint-disable-line

  // Read question aloud with cloned voice when question changes
  useEffect(() => {
    if (quiz && quiz.questions && quiz.questions[currentQuestion] && !showFeedback && !quizCompleted) {
      const q = quiz.questions[currentQuestion];
      const questionText = sanitizeValue(q.question);
      if (questionText) {
        speak(questionText);
      }
    }
  }, [currentQuestion, quiz]); // eslint-disable-line

  // Auto-advance after feedback
  useEffect(() => {
    if (!showFeedback) return;
    const t = setTimeout(() => {
      setShowFeedback(false);
      setSelectedOption(null);
      if (currentQuestion + 1 < (quiz?.questions?.length || 0)) {
        setCurrentQuestion(prev => prev + 1);
        setFilteredOptions(null);
        setFiftyFiftyUsed(false);
        setTimeLeft(MAX_TIME);
      } else {
        setQuizCompleted(true);
      }
    }, 2000);
    return () => clearTimeout(t);
  }, [showFeedback]); // eslint-disable-line

  // ── interaction handlers ─────────────────────────────────────────────────
  const handleTimeout = () => {
    if (showFeedback || quizCompleted) return;
    const currentQ = quiz.questions[currentQuestion];
    playTimesUp();
    setFeedbackMessage(`⏰ Time's up! Correct answer: ${sanitizeValue(currentQ.correctAnswer)}`);
    speak(`Time is up. The answer is ${sanitizeValue(currentQ.correctAnswer)}`);
    setIsAnswerCorrect(false);
    setShowFeedback(true);
    const na = [...answers]; na[currentQuestion] = ''; setAnswers(na); answersRef.current = na;
  };

  const handleAnswerSelect = (option) => {
    if (!quiz || loading || showFeedback || selectedOption || quizCompleted) return;
    playNav();
    setSelectedOption(option);
    const currentQ = quiz.questions[currentQuestion];
    const cleanOpt = sanitizeValue(option);
    const cleanAns = sanitizeValue(currentQ.correctAnswer);
    const correct  = normalizeValue(cleanOpt) === normalizeValue(cleanAns) && normalizeValue(cleanOpt) !== '';
    if (correct) { playCorrect(); setCurrentScore(p => p + POINTS_PER_QUESTION); setFeedbackMessage(`✅ Correct! 🎉 +${POINTS_PER_QUESTION} Points!`); speak('Correct! Well done!'); }
    else { playWrong(); setFeedbackMessage(`❌ Incorrect! Correct answer: ${cleanAns || 'N/A'}`); speak(`Wrong. The answer is ${cleanAns}`); }
    setIsAnswerCorrect(correct);
    setShowFeedback(true);
    const na = [...answers]; na[currentQuestion] = cleanOpt; setAnswers(na); answersRef.current = na;
  };

  // Manual navigation (prev/next without auto-advance)
  const goToQuestion = (idx) => {
    if (showFeedback) return;
    playNav();
    setCurrentQuestion(idx);
    setFilteredOptions(null);
    setFiftyFiftyUsed(false);
    setTimeLeft(MAX_TIME);
    setSelectedOption(answersRef.current[idx] || null);
  };

  const handleFiftyFifty = () => {
    if (!quiz || loading || fiftyFiftyUsed || showFeedback || quizCompleted) return;
    playNav();
    const currentQ = quiz.questions[currentQuestion];
    const cleanAns  = sanitizeValue(currentQ.correctAnswer);
    const wrong = currentQ.options.filter(o => normalizeValue(o) !== normalizeValue(cleanAns) && o !== '');
    setFilteredOptions([cleanAns, wrong[Math.floor(Math.random() * wrong.length)] || currentQ.options[0]]);
    setFiftyFiftyUsed(true);
    toast.success('🎯 Two options remaining!', { icon: '💡' });
    playSound(880, 0.2, 'sine', 0.1);
  };

  const handleSubmit = async () => {
    if (submitting || !quiz) return;
    setSubmitting(true);
    const latestAnswers = answersRef.current;
    try {
      let correctCount = 0;
      const formattedAnswers = latestAnswers.map((answer, idx) => {
        const q = quiz.questions[idx];
        const ca = sanitizeValue(q.correctAnswer);
        const sa = sanitizeValue(answer);
        const isCorrect = normalizeValue(sa) === normalizeValue(ca) && normalizeValue(sa) !== '';
        if (isCorrect) correctCount++;
        return { questionId: q.id || idx, selectedOption: sa, isCorrect, correctAnswer: ca, questionText: q.question };
      });

      const earnedPoints    = correctCount * POINTS_PER_QUESTION;
      const scorePercentage = Math.round((correctCount / quiz.questions.length) * 100);
      const passed          = scorePercentage >= 60;
      const token           = localStorage.getItem('token');

      let levelAdvanced = false, newQuizLevel = null, championBadgeEarned = false, currentQuizLevel = userGameLevel;

      // Only submit to backend for real quizzes (not special ones like malawi-districts)
      if (quizId !== 'malawi-districts') {
        const submitRes = await axios.post(`${API_URL}/api/learner/quiz-submit-v2`, {
          quizId: parseInt(quizId),
          answers: formattedAnswers,
          score: scorePercentage,
          pointsEarned: earnedPoints,
          correctCount,
          totalQuestions: quiz.questions.length,
          quizTitle: quiz.title,
          quizTopic: quiz.topic,
        }, { headers: { Authorization: `Bearer ${token}` } });

        levelAdvanced = submitRes.data.levelAdvanced || false;
        newQuizLevel = submitRes.data.newQuizLevel;
        championBadgeEarned = submitRes.data.championBadgeEarned || false;
        currentQuizLevel = submitRes.data.currentQuizLevel || userGameLevel;
      } else {
        // For districts quiz, just award points directly
        if (passed && earnedPoints > 0) {
          try {
            await axios.post(`${API_URL}/api/learner/quiz-submit`, {
              quizId: 0,
              answers: formattedAnswers,
              score: scorePercentage,
              pointsEarned: earnedPoints
            }, { headers: { Authorization: `Bearer ${token}` } });
          } catch (e) {
            // Silent fail — points might not be awarded but don't block results
          }
        }
      }

      setQuizResults({
        scorePercentage, earnedPoints, correctCount,
        totalQuestions: quiz.questions.length, passed,
        answers: formattedAnswers,
        quizTitle: quiz.title,
        totalAvailable,
        isRandom: isRandomQuiz,
        quizLevel,
        quizGameLevel,
        levelAdvanced:          levelAdvanced  || false,
        newQuizLevel:           newQuizLevel   || currentQuizLevel || 1,
        championBadgeEarned:    championBadgeEarned || false,
        currentQuizLevel:       currentQuizLevel || userGameLevel,
      });

      if (levelAdvanced && championBadgeEarned) {
        setTimeout(() => toast.success('🏆 CHAMPION BADGE EARNED! You completed all 10 levels!', { duration: 8000 }), 800);
      } else if (levelAdvanced) {
        setTimeout(() => toast.success(`🎉 Level Up! You reached Level ${newQuizLevel}!`, { duration: 5000 }), 800);
      }

      setShowResultsModal(true);
      if (passed) playApplause();

    } catch (err) {
      console.error('Error submitting quiz:', err);
      toast.error('Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetakeQuiz = async () => { setShowResultsModal(false); await fetchQuiz(); };
  const handleNextLevel  = () => { setShowResultsModal(false); navigate('/quizzes'); };
  const handleViewDashboard = () => { setShowResultsModal(false); navigate('/learner-dashboard'); };
  const handleViewHistory   = () => { setShowResultsModal(false); navigate('/quiz-history'); };

  const handleShareResults = () => {
    const { scorePercentage, correctCount, totalQuestions, passed, earnedPoints, championBadgeEarned } = quizResults;
    const msg = `I scored ${scorePercentage}% (${correctCount}/${totalQuestions}) on a quiz! ${passed ? '🎉 Passed!' : '📚 Keep practicing!'} Earned ${earnedPoints} pts!${championBadgeEarned ? ' 🏆 Champion badge unlocked!' : ''}`;
    if (navigator.share) { navigator.share({ title: 'Quiz Results', text: msg }).catch(() => {}); }
    else { navigator.clipboard.writeText(msg); toast.success('Results copied!'); }
  };

  // ── early returns ────────────────────────────────────────────────────────
  if (accessDenied) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-sky-50 text-slate-800'}`}>
        <div className={`w-full max-w-md rounded-3xl p-6 text-center shadow-2xl ${isDarkMode ? 'bg-slate-900 border border-slate-700' : 'bg-white border border-slate-200'}`}>
          <div className="text-7xl mb-4">🚫</div>
          <h2 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>Access Denied</h2>
          <div className={`p-4 rounded-lg mb-6 ${isDarkMode ? 'bg-red-950/40 text-red-300 border border-red-900' : 'bg-red-50 text-red-700 border border-red-200'}`}><p className="text-sm">{accessError}</p></div>
          <button onClick={() => navigate('/quizzes')} className="w-full py-3 bg-teal-500 text-white rounded-xl font-semibold hover:bg-teal-600 transition">
            Back to Quizzes
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-sky-50 text-slate-800'}`}>
        <div className={`w-full max-w-md rounded-3xl p-8 text-center shadow-2xl ${isDarkMode ? 'bg-slate-900 border border-slate-700' : 'bg-white border border-slate-200'}`}>
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-teal-600 border-t-transparent mx-auto mb-4"></div>
          <p className={isDarkMode ? 'text-slate-300' : 'text-slate-600'}>Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (!quiz || !quiz.questions?.length) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-sky-50 text-slate-800'}`}>
        <div className={`w-full max-w-md rounded-3xl p-8 text-center shadow-2xl ${isDarkMode ? 'bg-slate-900 border border-slate-700' : 'bg-white border border-slate-200'}`}>
          <p className={isDarkMode ? 'text-slate-300' : 'text-slate-600'}>No questions found.</p>
          <button onClick={() => navigate('/quizzes')} className="mt-4 w-full py-3 bg-teal-500 text-white rounded-xl font-semibold hover:bg-teal-600 transition">
            Back to Quizzes
          </button>
        </div>
      </div>
    );
  }

  // ── render helpers ───────────────────────────────────────────────────────
  const currentQ     = quiz.questions[currentQuestion];
  const optionsToShow = filteredOptions || currentQ.options;
  const hasImage     = !!currentQ.questionImage;
  const answeredCount = answersRef.current.filter(a => a !== '').length;
  const levelColor   = LEVEL_COLORS[quizGameLevel] || 'bg-teal-500';

  const renderOptions = (extraClass = '') => optionsToShow.map((option, idx) => {
    const letter = String.fromCharCode(65 + idx);
    const isSelected   = selectedOption === option;
    const wasAnswered  = answersRef.current[currentQuestion] === option && !showFeedback;
    const highlighted  = isSelected || wasAnswered;
    return (
      <button
        key={idx}
        onClick={() => handleAnswerSelect(option)}
        disabled={showFeedback || !!selectedOption || quizCompleted}
        className={`w-full py-3 px-4 rounded-xl flex items-center gap-3 transition-all duration-200 text-left ${extraClass}
          ${highlighted
            ? 'bg-teal-500 text-white shadow-lg ring-2 ring-teal-400'
            : (!showFeedback && !selectedOption && !quizCompleted)
              ? isDarkMode
                ? 'bg-slate-800 hover:ring-2 hover:ring-teal-400 hover:bg-slate-700 text-slate-100 border border-slate-700'
                : 'bg-white border border-slate-200 hover:ring-2 hover:ring-sky-300 hover:bg-sky-50 text-slate-700'
              : isDarkMode
                ? 'bg-slate-800/60 opacity-70 text-slate-400 border border-slate-700'
                : 'bg-slate-100 opacity-70 text-slate-500 border border-slate-200'
          } ${quizCompleted ? 'cursor-not-allowed' : ''}`}
      >
        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${highlighted ? 'bg-white text-teal-600' : isDarkMode ? 'bg-slate-500 text-slate-100' : 'bg-slate-500 text-white'}`}>
          {letter}
        </div>
        <span className={`font-semibold text-sm flex-1 ${highlighted ? 'text-white' : isDarkMode ? 'text-slate-100' : 'text-slate-700'}`}>{option}</span>
      </button>
    );
  });

  // ── action bar (prev / next / submit) ───────────────────────────────────
  const renderActionBar = () => (
    <div className="flex gap-3 mt-6">
      {/* Prev */}
      <button
        onClick={() => currentQuestion > 0 && goToQuestion(currentQuestion - 1)}
        disabled={currentQuestion === 0 || showFeedback}
        className={`px-5 py-3 rounded-xl font-semibold text-sm transition-all flex items-center gap-1
          ${currentQuestion === 0 || showFeedback
            ? isDarkMode
              ? 'opacity-40 cursor-not-allowed bg-slate-800 text-slate-500'
              : 'opacity-40 cursor-not-allowed bg-gray-100 text-gray-400'
            : isDarkMode
              ? 'bg-slate-900 border-2 border-slate-600 text-slate-200 hover:bg-slate-800 shadow-sm'
                    : 'bg-white border-2 border-slate-300 text-slate-700 hover:bg-slate-50 shadow-sm'}`}
      >
        ◀ Prev
      </button>

      {/* Next or Submit */}
      {!quizCompleted && currentQuestion < quiz.questions.length - 1 ? (
        <button
          onClick={() => goToQuestion(currentQuestion + 1)}
          disabled={showFeedback}
          className="flex-1 py-3 rounded-xl font-semibold text-sm bg-teal-500 text-white hover:bg-teal-600 transition shadow-sm flex items-center justify-center gap-1"
        >
          Next ▶
        </button>
      ) : quizCompleted ? (
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all animate-pulse
            ${submitting ? 'opacity-50 cursor-not-allowed bg-slate-300 text-white' : 'bg-green-500 text-white hover:bg-green-600 shadow-md'}`}
        >
          {submitting ? 'Submitting…' : '📝 Submit Quiz'}
        </button>
      ) : (
        <div className={`flex-1 py-3 rounded-xl text-sm text-center font-medium flex items-center justify-center ${isDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-sky-50 text-slate-700 border border-sky-100'}`}>
          {answeredCount}/{quiz.questions.length} Answered
        </div>
      )}
    </div>
  );

  // ── question navigator sidebar ───────────────────────────────────────────
  const renderNavSidebar = () => (
    <div className={`rounded-2xl shadow-lg p-4 flex flex-col gap-3 w-full ${isDarkMode ? 'bg-slate-900 border border-slate-700' : 'bg-white border border-slate-200'}`}>
      {/* Header */}
      <div className={`flex items-center justify-between pb-3 ${isDarkMode ? 'border-b border-slate-700' : 'border-b border-slate-100'}`}>
        <span className={`text-xs font-black uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Questions</span>
        <span className="text-xs font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">
          {answeredCount}/{quiz.questions.length}
        </span>
      </div>

      {/* Dot grid */}
      <div className="grid grid-cols-5 gap-1.5">
        {quiz.questions.map((_, idx) => {
          const answered  = answersRef.current[idx] !== '';
          const isCurrent = idx === currentQuestion;
          return (
            <button
              key={idx}
              onClick={() => !showFeedback && goToQuestion(idx)}
              title={`Q${idx + 1}${answered ? ' ✓' : ''}`}
              className={`w-full aspect-square rounded-lg text-xs font-bold transition-all
                ${isCurrent
                  ? 'bg-teal-500 text-white ring-2 ring-teal-300 ring-offset-1 scale-110 shadow'
                  : answered
                    ? 'bg-green-400 text-white hover:bg-green-500'
                    : isDarkMode
                      ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              {idx + 1}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className={`flex flex-col gap-1.5 pt-2 ${isDarkMode ? 'border-t border-slate-700' : 'border-t border-slate-100'}`}>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-teal-500 flex-shrink-0" />
          <span className={`text-[10px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Current</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-green-400 flex-shrink-0" />
          <span className={`text-[10px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Answered</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded flex-shrink-0 ${isDarkMode ? 'bg-slate-700 border border-slate-500' : 'bg-slate-100 border border-slate-300'}`} />
          <span className={`text-[10px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Unanswered</span>
        </div>
      </div>

      {/* Submit button pinned at bottom when quiz is complete */}
      {quizCompleted && (
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className={`w-full mt-2 py-2.5 rounded-xl font-bold text-sm transition-all
            ${submitting
              ? isDarkMode
                ? 'opacity-50 cursor-not-allowed bg-slate-700 text-slate-400'
                : 'opacity-50 cursor-not-allowed bg-slate-300 text-slate-600'
              : 'bg-green-500 text-white hover:bg-green-600 shadow-md animate-pulse'}`}
        >
          {submitting ? 'Submitting…' : '📝 Submit'}
        </button>
      )}
    </div>
  );

  // ── main render ──────────────────────────────────────────────────────────
  return (
    <div className={`learner-themed h-screen flex flex-col overflow-hidden ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}
      style={pageStyles}
    >
      <QuizResultsModal
        isOpen={showResultsModal}
        onClose={() => setShowResultsModal(false)}
        results={quizResults}
        onRetake={handleRetakeQuiz}
        onNextLevel={handleNextLevel}
        onViewDashboard={handleViewDashboard}
        onViewHistory={handleViewHistory}
        onShare={handleShareResults}
        isDarkMode={isDarkMode}
      />

      {/* ── Top bar ── */}
      <div className="flex-shrink-0 px-4 pt-4 pb-3 max-w-6xl w-full mx-auto flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className={`${levelColor} text-white text-xs font-bold px-3 py-1.5 rounded-full shadow`}>
            Level {quizGameLevel}
          </span>
          {quiz.title && (
            <span className={`text-sm font-medium truncate max-w-xs ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>{quiz.title}</span>
          )}
        </div>
        {quizId === 'malawi-districts' && (
          <div className="flex items-center gap-2">
            <label className={`text-xs font-semibold ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>Category</label>
            <select
              value={districtCategory}
              onChange={(e) => {
                const nextCategory = e.target.value;
                setDistrictCategory(nextCategory);
                const params = new URLSearchParams(window.location.search);
                params.set('districtCategory', nextCategory);
                window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
              }}
              className="text-xs px-2 py-1.5 rounded-lg border border-teal-300 bg-white text-slate-700 focus:border-teal-400 focus:ring-2 focus:ring-teal-100 outline-none"
            >
              {(districtCategories.length > 0 ? districtCategories : Object.keys(DISTRICT_CATEGORY_LABELS).map(id => ({ id, label: DISTRICT_CATEGORY_LABELS[id] }))).map((c) => (
                <option key={c.id} value={c.id}>{c.label || DISTRICT_CATEGORY_LABELS[c.id] || c.id}</option>
              ))}
            </select>
          </div>
        )}
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/quiz-history')}
            className={`text-xs px-3 py-1.5 rounded-full transition font-medium ${isDarkMode ? 'text-teal-300 border border-teal-700 hover:bg-teal-900/40' : 'text-teal-600 border border-teal-300 hover:bg-teal-50'}`}
          >
            📋 History
          </button>
          <button
            onClick={() => setShowExitModal(true)}
            className={`text-xs px-3 py-1.5 rounded-full transition ${isDarkMode ? 'text-slate-300 border border-slate-600 hover:bg-slate-800' : 'text-slate-600 border border-slate-200 hover:bg-slate-100'}`}
          >
            ✕ Exit
          </button>
        </div>
      </div>

      {/* ── Body: quiz card + right sidebar ── */}
      <div className="flex-1 overflow-hidden px-4 pb-4 max-w-6xl w-full mx-auto flex gap-4 items-stretch min-h-0">

        {/* CENTER — Quiz card */}
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
          <div className={`rounded-2xl shadow-2xl flex flex-col overflow-hidden h-full ${isDarkMode ? 'bg-slate-900 border border-slate-700' : 'bg-white/95 border border-slate-200'}`}>

            {/* Card header — fixed, never scrolls */}
            <div className="relative flex-shrink-0 bg-teal-600 px-6 py-4">
              <div className={`absolute -bottom-7 left-1/2 -translate-x-1/2 w-14 h-14 rounded-full flex items-center justify-center font-bold text-white shadow-lg z-10 ring-4 ring-white text-lg
                ${timeLeft <= 5 ? 'bg-red-500 animate-pulse' : 'bg-teal-500'}`}>
                {quizCompleted ? '✓' : timeLeft}
              </div>
              <div className="flex justify-between items-center">
                <div className="text-white font-semibold text-sm">
                  Q {currentQuestion + 1} / {quiz.questions.length}
                  {quizCompleted && <span className="ml-2 text-green-300 text-xs">✓ Complete!</span>}
                  {quizId === 'malawi-districts' && (
                    <span className="ml-2 text-[11px] text-teal-100 font-medium">
                      • {DISTRICT_CATEGORY_LABELS[districtCategory] || 'Mixed Challenge'}
                    </span>
                  )}
                </div>
                <div className="bg-white/20 px-4 py-1.5 rounded-full">
                  <span className="text-white text-sm">Score: </span>
                  <span className="text-white font-bold text-xl">{currentScore}</span>
                </div>
              </div>
            </div>

            {/* Question + options — fills remaining card height, no scroll */}
            {hasImage ? (
              <div className="flex flex-col md:flex-row flex-1 min-h-0 overflow-hidden pt-8">
                <div className={`md:w-1/2 p-5 flex items-center justify-center overflow-hidden ${isDarkMode ? 'bg-slate-800 border-r border-slate-700' : 'bg-sky-50 border-r border-slate-200'}`}>
                  <div className="text-center">
                    <div className={`rounded-xl p-3 shadow-md ${isDarkMode ? 'bg-slate-900' : 'bg-white'}`}>
                      <img src={currentQ.questionImage} alt="Question" className="max-w-full max-h-56 object-contain mx-auto" />
                    </div>
                    <p className={`font-bold mt-3 text-sm px-2 ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}
                       dangerouslySetInnerHTML={{ __html: renderFormattedText(currentQ.question) }} />
                  </div>
                </div>
                <div className="md:w-1/2 p-5 flex flex-col justify-between overflow-hidden">
                  <div className="space-y-2 flex-1">{renderOptions()}</div>
                  {renderActionBar()}
                </div>
              </div>
            ) : (
              <div className="flex-1 min-h-0 p-6 pt-8 flex flex-col justify-between overflow-hidden">
                {/* Question text */}
                <div className={`rounded-xl p-4 text-center flex-shrink-0 ${isDarkMode ? 'bg-slate-800 border border-slate-700' : 'bg-sky-50 border border-slate-200'}`}>
                  <h2 className={`text-lg font-bold leading-relaxed ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}
                      dangerouslySetInnerHTML={{ __html: renderFormattedText(currentQ.question) }} />
                </div>
                {/* Options — grow to fill, no overflow */}
                <div className="flex flex-col gap-2 flex-1 justify-center my-3">
                  {renderOptions()}
                </div>
                {/* Action bar — pinned to bottom */}
                <div className="flex-shrink-0">
                  {renderActionBar()}
                </div>
              </div>
            )}
          </div>

          {/* Mobile navigator */}
          <div className="lg:hidden mt-3 overflow-y-auto max-h-48">
            {renderNavSidebar()}
          </div>
        </div>

        {/* RIGHT — 50:50 + Navigator (desktop only, scrollable if needed) */}
        <div className="hidden lg:flex w-56 flex-shrink-0 flex-col gap-3 overflow-y-auto">

          {/* 50:50 lifeline */}
          <button
            onClick={handleFiftyFifty}
            disabled={fiftyFiftyUsed || showFeedback || quizCompleted}
            className={`flex-shrink-0 w-full py-3 rounded-xl font-bold text-sm transition-all
              ${fiftyFiftyUsed || showFeedback || quizCompleted
                ? isDarkMode
                  ? 'opacity-40 cursor-not-allowed bg-slate-800 text-slate-500'
                  : 'opacity-40 cursor-not-allowed bg-gray-100 text-gray-400'
                : isDarkMode
                  ? 'bg-slate-900 border-2 border-teal-600 text-teal-300 hover:bg-teal-900/20 shadow-sm'
                    : 'bg-white border-2 border-teal-500 text-teal-700 hover:bg-teal-50 shadow-sm'}`}
          >
            🎯 50:50
          </button>

          {/* Question Navigator */}
          {renderNavSidebar()}

        </div>

      </div>

      {/* Exit confirmation modal */}
      {showExitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className={`rounded-2xl shadow-xl w-full max-w-xs p-6 text-center ${isDarkMode ? 'bg-slate-900 border border-slate-700' : 'bg-white border border-slate-200'}`}>
            <div className="text-3xl mb-3">🚪</div>
            <h3 className={`text-base font-bold mb-1 ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>Leave Quiz?</h3>
            <p className={`text-sm mb-5 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Your progress will be lost.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowExitModal(false)}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition ${isDarkMode ? 'border border-slate-600 text-slate-200 hover:bg-slate-800' : 'border border-slate-200 text-slate-700 hover:bg-slate-50'}`}
              >
                Stay
              </button>
              <button
                onClick={() => { setShowExitModal(false); navigate('/quizzes'); }}
                className="flex-1 py-2.5 text-sm font-bold bg-red-500 text-white rounded-xl hover:bg-red-600 transition"
              >
                Leave
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feedback toast */}
      {showFeedback && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
          <div className={`rounded-xl shadow-2xl px-6 py-3 flex items-center gap-2 ${isAnswerCorrect ? 'bg-green-500' : 'bg-red-500'}`}>
            <span className="text-white text-lg">{isAnswerCorrect ? '🎉' : '💡'}</span>
            <p className="text-white font-semibold text-sm">{feedbackMessage}</p>
          </div>
        </div>
      )}

      <style>{`
        .learner-themed {
          font-family: Calibri, 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          font-size: 14pt;
          line-height: 1.5;
        }
        .learner-themed,
        .learner-themed * {
          font-family: Calibri, 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif !important;
        }
        .learner-themed .text-xs,
        .learner-themed .text-sm,
        .learner-themed .text-base {
          font-size: 14pt !important;
          line-height: 1.4;
        }
        .learner-themed .text-lg {
          font-size: 16pt !important;
          line-height: 1.45;
        }
        .learner-themed .text-xl {
          font-size: 18pt !important;
          line-height: 1.45;
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateX(-50%) translateY(20px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        .animate-slide-up { animation: slideUp 0.3s ease-out; }
      `}</style>
    </div>
  );
};

export default TakeQuiz;
