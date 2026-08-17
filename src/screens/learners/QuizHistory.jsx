import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import API_URL from '../../config';
import { useTheme } from '../../contexts/ThemeContext';

// ── Level metadata ───────────────────────────────────────────────────────────
const LEVEL_META = [
  { label: 'Starter',  color: 'from-emerald-400 to-emerald-500', ring: 'ring-emerald-200', text: 'text-emerald-600' },
  { label: 'Explorer', color: 'from-teal-400 to-teal-500',       ring: 'ring-teal-200',    text: 'text-teal-600'    },
  { label: 'Thinker',  color: 'from-cyan-400 to-cyan-500',       ring: 'ring-cyan-200',    text: 'text-cyan-600'    },
  { label: 'Achiever', color: 'from-sky-400 to-sky-500',         ring: 'ring-sky-200',     text: 'text-sky-600'     },
  { label: 'Scholar',  color: 'from-blue-400 to-blue-500',       ring: 'ring-blue-200',    text: 'text-blue-600'    },
  { label: 'Expert',   color: 'from-indigo-400 to-indigo-500',   ring: 'ring-indigo-200',  text: 'text-indigo-600'  },
  { label: 'Master',   color: 'from-violet-400 to-violet-500',   ring: 'ring-violet-200',  text: 'text-violet-600'  },
  { label: 'Elite',    color: 'from-purple-400 to-purple-500',   ring: 'ring-purple-200',  text: 'text-purple-600'  },
  { label: 'Legend',   color: 'from-orange-400 to-orange-500',   ring: 'ring-orange-200',  text: 'text-orange-600'  },
  { label: 'Champion', color: 'from-amber-400 to-yellow-400',    ring: 'ring-amber-200',   text: 'text-amber-600'   },
];

const formatDate = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

const ScoreBadge = ({ score, passed }) => {
  const cls = passed
    ? score >= 80
      ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
      : 'bg-teal-100 text-teal-700 border-teal-200'
    : 'bg-red-100 text-red-600 border-red-200';
  return (
    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${cls}`}>
      {score}%
    </span>
  );
};

const QuizHistory = () => {
  const navigate = useNavigate();
  const { settings: theme, getPageStyles } = useTheme();
  const [attempts, setAttempts]         = useState([]);
  const [levelInfo, setLevelInfo]       = useState({ current_level: 1, is_champion: false, levels: [] });
  const [loading, setLoading]           = useState(true);
  const [filterLevel, setFilterLevel]   = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery]   = useState('');
  const [expandedId, setExpandedId]     = useState(null);
  const [activeTab, setActiveTab]       = useState('levels');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const [histRes, lvlRes] = await Promise.all([
        axios.get(`${API_URL}/api/learner/quiz-history`, { headers }),
        axios.get(`${API_URL}/api/learner/quiz-level`,   { headers }),
      ]);
      if (histRes.data.success) setAttempts(histRes.data.attempts || []);
      if (lvlRes.data.success)  setLevelInfo(lvlRes.data);
    } catch (err) {
      if (err.response?.status === 401) { toast.error('Session expired'); navigate('/learner-login'); }
      else toast.error('Failed to load quiz history');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = attempts.filter(a => {
    if (filterLevel  !== 'all' && String(a.quiz_level) !== filterLevel) return false;
    if (filterStatus === 'passed' && !a.passed) return false;
    if (filterStatus === 'failed' &&  a.passed) return false;
    if (searchQuery && !a.quiz_title?.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !a.quiz_topic?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const stats = {
    total:     attempts.length,
    passed:    attempts.filter(a => a.passed).length,
    avgScore:  attempts.length ? Math.round(attempts.reduce((s, a) => s + (a.score || 0), 0) / attempts.length) : 0,
    bestScore: attempts.length ? Math.max(...attempts.map(a => a.score || 0)) : 0,
    totalPts:  attempts.reduce((s, a) => s + (a.points_earned || 0), 0),
  };

  const uniqueLevels = [...new Set(attempts.map(a => a.quiz_level).filter(Boolean))].sort((a, b) => a - b);

  const getSafeAnswers = (ans) => {
    if (!ans) return [];
    if (typeof ans === 'string') { try { return JSON.parse(ans); } catch { return []; } }
    return ans;
  };

  // Levels rendered sequentially 1 → 10 along the path layout
  const levelsArray = Array.from({ length: 10 }, (_, i) => i + 1);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-14 h-14 border-4 border-teal-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-teal-600 font-semibold text-sm">Loading…</p>
        </div>
      </div>
    );
  }

  // Find info about the current active stage
  const activeStageMeta = LEVEL_META[(levelInfo.current_level || 1) - 1];
  const activeStageInfo = levelInfo.levels?.find(l => l.level === levelInfo.current_level) || {};

  return (
    <div className="learner-themed min-h-screen selection:bg-teal-200" style={getPageStyles('quizHistory')}>

      {/* ── Header ── */}
      <header className="backdrop-blur-md border-b border-white/10 sticky top-0 z-50 shadow-sm" style={{ backgroundColor: 'var(--learner-header-bg, #19475F)' }}>
        <div className="max-w-5xl mx-auto px-5 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-teal-50 rounded-xl transition text-teal-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div>
              <h1 className="text-base font-black text-teal-800 tracking-tight">Quiz Track</h1>
              <p className="text-[11px] text-teal-500 font-medium">{attempts.length} quizzes taken</p>
            </div>
          </div>

          {levelInfo.is_champion ? (
            <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-600 rounded-full px-3 py-1">
              <span>🏆</span>
              <span className="text-[11px] font-black tracking-wide">CHAMPION</span>
            </div>
          ) : (
            <div className={`text-xs font-bold px-3 py-1 rounded-full text-white bg-gradient-to-r ${activeStageMeta?.color || 'from-teal-400 to-teal-500'} shadow-sm`}>
              Level {levelInfo.current_level} / 10
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="max-w-5xl mx-auto px-5 flex gap-1 border-t border-teal-50">
          {[
            { id: 'levels',  icon: '🎮', label: 'Level Track' },
            { id: 'history', icon: '📋', label: 'History' },
          ].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`px-4 py-2.5 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-all
                ${activeTab === t.id
                  ? 'border-teal-500 text-teal-600'
                  : 'border-transparent text-gray-400 hover:text-teal-500'}`}>
              <span>{t.icon}</span>{t.label}
            </button>
          ))}
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-5 py-6 space-y-6">

        {/* ── Stats row ── */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: 'Attempts', value: stats.total,     icon: '📝', color: 'text-teal-700'   },
            { label: 'Passed',   value: stats.passed,    icon: '✅', color: 'text-emerald-700' },
            { label: 'Avg',      value: `${stats.avgScore}%`,  icon: '📊', color: 'text-blue-700'   },
            { label: 'Best',     value: `${stats.bestScore}%`, icon: '🏅', color: 'text-amber-700'  },
            { label: 'Points',   value: stats.totalPts,        icon: '💎', color: 'text-purple-700' },
          ].map(s => (
            <div key={s.label} className="bg-white border border-teal-100 rounded-2xl p-2.5 text-center shadow-sm hover:shadow-md transition-shadow">
              <div className="text-lg mb-0.5">{s.icon}</div>
              <div className={`text-lg font-black ${s.color}`}>{s.value}</div>
              <div className="text-[9px] text-gray-400 font-semibold uppercase tracking-wider">{s.label}</div>
            </div>
          ))}
        </div>

        {/* ══════════ ROADMAP TAB (COMPACT WINDING TRACK) ══════════ */}
        {activeTab === 'levels' && (
          <div className="space-y-4">
            
            {/* Active Stage Quick Info Strip */}
            {!levelInfo.is_champion && (
              <div className="bg-white border border-teal-100 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${activeStageMeta.color} flex items-center justify-center text-white font-black text-sm shadow-inner`}>
                    {levelInfo.current_level}
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-wider">Current Stage</h4>
                    <p className="text-sm font-bold text-teal-900">{activeStageMeta.label}</p>
                  </div>
                </div>
                <button onClick={() => navigate('/quizzes')}
                  className={`px-5 py-2 text-xs font-black text-white bg-gradient-to-r ${activeStageMeta.color} rounded-xl shadow-md hover:opacity-95 transition`}>
                  Start Level {levelInfo.current_level} →
                </button>
              </div>
            )}

            {/* Winding Compact Track Map Container */}
            <div className="bg-teal-50/40 border border-teal-100/60 rounded-3xl p-6 sm:p-10 relative overflow-hidden shadow-sm">
              
              {/* Minimal SVG Path Winding Directly Through Node Rows */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none hidden sm:block" fill="none">
                <path 
                  d="M 80 75 L 680 75 C 740 75, 740 195, 680 195 L 80 195 C 20 195, 20 315, 80 315 L 400 315" 
                  stroke="#ccf5ef" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" 
                />
                <path 
                  d="M 80 75 L 680 75 C 740 75, 740 195, 680 195 L 80 195 C 20 195, 20 315, 80 315 L 400 315" 
                  stroke="white" strokeWidth="2" strokeDasharray="8 8" strokeLinecap="round" 
                />
              </svg>

              {/* Grid System arranging Stage Nodes into standard winding curves */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-y-12 gap-x-6 relative z-10">
                {levelsArray.map((lvl) => {
                  const meta    = LEVEL_META[lvl - 1];
                  const info    = levelInfo.levels?.find(l => l.level === lvl) || {};
                  const cur     = levelInfo.current_level || 1;
                  
                  const isCur   = lvl === cur;
                  const isDone  = lvl < cur;
                  const isLock  = lvl > cur;

                  // Modulo logic arranges items in zig-zag order on large screens (1-5 left-to-right, 6-10 right-to-left)
                  let orderClass = "";
                  if (lvl > 5) {
                    const positions = { 6: "sm:order-10", 7: "sm:order-9", 8: "sm:order-8", 9: "sm:order-7", 10: "sm:order-6" };
                    orderClass = positions[lvl];
                  }

                  return (
                    <div key={lvl} className={`flex flex-col items-center ${orderClass} ${isLock ? 'opacity-50' : 'opacity-100'}`}>
                      
                      {/* Compact Node Circle */}
                      <div className="relative group">
                        <button
                          disabled={isLock}
                          onClick={() => isCur && navigate('/quizzes')}
                          className={`w-14 h-14 rounded-full flex flex-col items-center justify-center font-black transition-all relative z-10 shadow-md
                            ${isCur ? `bg-gradient-to-br ${meta.color} text-white ring-4 ring-offset-2 ${meta.ring} scale-110 animate-pulse` 
                                    : isDone ? 'bg-white border-2 border-emerald-400 text-emerald-600' 
                                             : 'bg-gray-200 border-2 border-gray-300 text-gray-400 cursor-not-allowed'}`}
                        >
                          <span className="text-[10px] opacity-75 uppercase leading-none tracking-tighter">LVL</span>
                          <span className="text-base leading-tight font-black">{lvl}</span>
                        </button>

                        {/* Direct Node Badge Icon overlays */}
                        {isDone && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow text-[10px] font-black z-20 border border-white">✓</div>
                        )}
                        {isLock && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-gray-400 text-white rounded-full flex items-center justify-center shadow text-[9px] z-20 border border-white">🔒</div>
                        )}
                        {isCur && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-teal-500 text-white rounded-full flex items-center justify-center shadow text-[9px] font-black z-20 border border-white animate-bounce">▶</div>
                        )}
                      </div>

                      {/* Small text below node */}
                      <div className="text-center mt-2 max-w-[110px]">
                        <p className={`text-[11px] font-black uppercase tracking-wide truncate ${isCur ? 'text-teal-700' : 'text-gray-600'}`}>
                          {lvl === 10 ? '👑 ' : ''}{meta.label}
                        </p>
                        {info.attempts > 0 ? (
                          <p className="text-[10px] font-semibold text-gray-400 leading-none mt-0.5">
                            Best: <span className={meta.text}>{info.best_score}%</span>
                          </p>
                        ) : (
                          <p className="text-[10px] text-gray-400/80 leading-none mt-0.5">
                            {isCur ? 'Play' : isLock ? 'Locked' : '0%'}
                          </p>
                        )}
                      </div>

                    </div>
                  );
                })}
              </div>
            </div>

            {/* Champion Achievement Footer Banner */}
            {levelInfo.is_champion && (
              <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-2xl p-4 text-center">
                <p className="font-black text-amber-700 text-sm">🏆 Quiz Road Completed!</p>
                <p className="text-amber-500 text-[11px]">You've conquered all 10 stages of the track map.</p>
              </div>
            )}
          </div>
        )}

        {/* ── History Tab ── */}
        {activeTab === 'history' && (
          <>
            {/* Filters */}
            <div className="bg-white border border-teal-100 rounded-2xl p-4 flex flex-wrap gap-3 items-center shadow-sm">
              <input
                type="text" placeholder="Search quiz name or topic…"
                value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                className="flex-1 min-w-[160px] px-3 py-2 border border-teal-100 bg-teal-50/40 rounded-xl text-sm focus:border-teal-400 focus:ring-2 focus:ring-teal-100 outline-none transition placeholder-gray-300"
              />
              <select value={filterLevel} onChange={e => setFilterLevel(e.target.value)}
                className="px-3 py-2 border border-teal-100 bg-teal-50/40 rounded-xl text-sm text-gray-600 outline-none focus:border-teal-400 transition">
                <option value="all">All Levels</option>
                {uniqueLevels.map(l => <option key={l} value={String(l)}>Level {l}</option>)}
              </select>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-teal-100 bg-teal-50/40 rounded-xl text-sm text-gray-600 outline-none focus:border-teal-400 transition">
                <option value="all">All Results</option>
                <option value="passed">Passed ✅</option>
                <option value="failed">Failed ❌</option>
              </select>
              {(filterLevel !== 'all' || filterStatus !== 'all' || searchQuery) && (
                <button onClick={() => { setFilterLevel('all'); setFilterStatus('all'); setSearchQuery(''); }}
                  className="text-xs text-red-400 hover:text-red-500 font-semibold px-2 py-1.5 rounded-lg hover:bg-red-50 transition">
                  ✕ Clear
                </button>
              )}
            </div>

            {/* Attempt list */}
            {filtered.length === 0 ? (
              <div className="bg-white border border-teal-100 rounded-2xl p-14 text-center shadow-sm">
                <div className="text-5xl mb-3">{attempts.length === 0 ? '📝' : '🔍'}</div>
                <p className="text-gray-400 font-medium text-sm">
                  {attempts.length === 0 ? 'No quizzes taken yet.' : 'No attempts match your filters.'}
                </p>
                {attempts.length === 0 && (
                  <button onClick={() => navigate('/quizzes')}
                    className="mt-4 px-6 py-2 bg-teal-500 text-white rounded-xl font-semibold text-sm hover:bg-teal-600 transition shadow-sm">
                    Browse Quizzes →
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map(attempt => {
                  const isExpanded   = expandedId === attempt.id;
                  const meta         = LEVEL_META[(attempt.quiz_level || 1) - 1];
                  const safeAnswers  = getSafeAnswers(attempt.answers);
                  return (
                    <div key={attempt.id} className="bg-white border border-teal-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                      <div className={`h-1 w-full bg-gradient-to-r ${meta.color}`} />
                      <div className="p-4 flex items-center gap-4">
                        <div className={`w-11 h-11 rounded-xl flex-shrink-0 flex flex-col items-center justify-center font-black text-white bg-gradient-to-br shadow-sm ${meta.color}`}>
                          <span className="text-[8px] opacity-80 uppercase leading-none tracking-widest">Lv</span>
                          <span className="text-sm leading-tight">{attempt.quiz_level || 1}</span>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-bold text-gray-800 text-sm truncate">{attempt.quiz_title || 'Untitled Quiz'}</p>
                            <ScoreBadge score={attempt.score} passed={attempt.passed} />
                            {attempt.passed
                              ? <span className="text-[10px] bg-emerald-100 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">✓ Passed</span>
                              : <span className="text-[10px] bg-red-100 text-red-600 border border-red-200 px-2 py-0.5 rounded-full font-bold">✗ Failed</span>
                            }
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-[11px] text-gray-400 flex-wrap">
                            {attempt.quiz_topic && <span className="text-teal-500 font-medium">📚 {attempt.quiz_topic}</span>}
                            <span>✅ {attempt.correct_count}/{attempt.total_questions}</span>
                            {attempt.points_earned > 0 && <span className="text-amber-500 font-semibold">💎 +{attempt.points_earned}</span>}
                            <span>🕐 {formatDate(attempt.attempted_at)}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button onClick={() => navigate(`/quiz/${attempt.quiz_id}`)}
                            className="text-xs bg-teal-500 hover:bg-teal-600 text-white px-3 py-1.5 rounded-lg font-bold shadow-sm transition">
                            Retake
                          </button>
                          {safeAnswers.length > 0 && (
                            <button onClick={() => setExpandedId(isExpanded ? null : attempt.id)}
                              className="text-xs border border-teal-200 text-teal-600 px-3 py-1.5 rounded-lg font-semibold hover:bg-teal-50 transition">
                              {isExpanded ? 'Hide' : 'Review'}
                            </button>
                          )}
                        </div>
                      </div>

                      {isExpanded && safeAnswers.length > 0 && (
                        <div className="border-t border-teal-50 bg-teal-50/40 px-4 py-3 max-h-64 overflow-y-auto space-y-2">
                          <p className="text-[10px] font-black text-teal-500 uppercase tracking-wider mb-2">Answer Review</p>
                          {safeAnswers.map((ans, i) => (
                            <div key={i} className={`p-2.5 rounded-xl text-xs border ${ans.isCorrect ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
                              <div className="flex justify-between mb-0.5">
                                <span className="font-bold text-gray-500">Q{i + 1}</span>
                                <span>{ans.isCorrect ? '✅' : '❌'}</span>
                              </div>
                              {ans.questionText && <p className="text-gray-600 line-clamp-2">{String(ans.questionText).toLowerCase()}</p>}
                              <p className="text-emerald-700 font-semibold mt-1">✓ {ans.correctAnswer}</p>
                              {!ans.isCorrect && ans.selectedOption && (
                                <p className="text-red-500 font-medium">✗ {ans.selectedOption}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

      </div>

      <style>{`
        .line-clamp-2 {
          display: -webkit-box; -webkit-line-clamp: 2;
          -webkit-box-orient: vertical; overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default QuizHistory;