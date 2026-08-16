import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import API_URL from '../../config';

// ==========================================
// UTILITIES & ICONS
// ==========================================
const formatXP = (points) => new Intl.NumberFormat('en-US').format(points || 0);

const SunIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
  </svg>
);

const MoonIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
  </svg>
);

const AlertIcon = () => (
  <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const CrownIcon = () => (
  <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
    <path d="M10 1l2.5 5h5l-4 4 1.5 5-5-2.5-5 2.5 1.5-5-4-4h5l2.5-5z" />
  </svg>
);

// ==========================================
// MAIN LEADERBOARD COMPONENT
// ==========================================
const Leaderboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('portal-theme');
    return savedTheme ? savedTheme === 'dark' : true;
  });

  const fetchLeaderboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${API_URL}/api/leaderboard`);
      setLeaderboard(response.data.leaderboard || []);
    } catch (err) {
      console.error('Leaderboard fetch failed:', err);
      setError('Unable to load leaderboard standings. Please check your connection.');
      toast.error('Could not load leaderboard.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  useEffect(() => {
    localStorage.setItem('portal-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
      toast.success('Logged out successfully.');
    } catch (err) {
      toast.error('Logout failed. Please try again.');
    }
  };

  const colors = useMemo(() => ({
    bg: isDarkMode ? 'bg-[#0B132B]' : 'bg-[#F4F7F6]',
    card: isDarkMode ? 'bg-[#1C2541] border border-teal-500/20 shadow-xl' : 'bg-white border border-teal-200/50 shadow-sm',
    textMain: isDarkMode ? 'text-white' : 'text-[#0B132B]',
    textMuted: isDarkMode ? 'text-slate-400' : 'text-slate-600',
    tableHeaderBg: isDarkMode ? 'bg-[#0B132B]/50' : 'bg-teal-50/50',
    tableRowEven: isDarkMode ? 'bg-slate-800/20' : 'bg-teal-50/30',
    border: isDarkMode ? 'border-slate-800' : 'border-slate-200'
  }), [isDarkMode]);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${colors.bg}`}>
      
      {/* Top Navigation Header - Teal Themed */}
      <header className={`sticky top-0 z-40 w-full bg-gradient-to-r from-teal-600 to-teal-700 shadow-lg transition-colors`}>
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 h-20">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="relative w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-2xl">🏆</span>
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-white">
                  Leaderboard <span className="text-teal-200">Standings</span>
                </h1>
                <p className="text-xs text-teal-100/80">
                  Top performers across all modules
                </p>
              </div>
            </div>

            <nav className="flex flex-wrap items-center gap-3" aria-label="Page actions">
              <button
                type="button"
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-2.5 rounded-xl border border-white/20 text-white hover:bg-white/10 transition-all focus:outline-none focus:ring-2 focus:ring-white/30"
                aria-label={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {isDarkMode ? <SunIcon /> : <MoonIcon />}
              </button>
              <button
                type="button"
                onClick={() => navigate('/learner-dashboard')}
                className="px-4 py-2 rounded-xl text-sm font-semibold border border-white/20 text-white hover:bg-white/10 transition-all focus:outline-none focus:ring-2 focus:ring-white/30"
              >
                Dashboard
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-white/20 text-white hover:bg-white/30 shadow transition-all focus:outline-none focus:ring-2 focus:ring-white/30"
              >
                Logout
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Workspace Panels */}
      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        
        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3 text-red-500">
              <AlertIcon />
              <p className="text-sm font-medium">{error}</p>
            </div>
            <button 
              onClick={fetchLeaderboard}
              className="px-4 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        <section className="grid gap-6 lg:grid-cols-12 items-start">
          <div className={`lg:col-span-7 rounded-2xl p-6 transition-all ${colors.card}`}>
            <PodiumSection loading={loading} leaderboard={leaderboard} colors={colors} isDarkMode={isDarkMode} />
          </div>
          <div className={`lg:col-span-5 rounded-2xl p-6 transition-all ${colors.card}`}>
            <UserSnapshot user={user} colors={colors} isDarkMode={isDarkMode} />
          </div>
        </section>

        <section className={`rounded-2xl overflow-hidden transition-all shadow-sm ${colors.card}`}>
          <div className="p-6 border-b border-teal-500/20">
            <h2 className={`text-lg font-bold ${colors.textMain}`}>Full Directory</h2>
            <p className={`text-xs ${colors.textMuted}`}>Comprehensive roster ordered by total historical points</p>
          </div>
          <LeaderboardTable loading={loading} leaderboard={leaderboard} user={user} colors={colors} />
        </section>
      </main>
    </div>
  );
};

// ==========================================
// MEMOIZED SUB-COMPONENTS 
// ==========================================

const PodiumSection = memo(({ loading, leaderboard, colors, isDarkMode }) => {
  if (loading) {
    return (
      <div className="space-y-4" aria-busy="true" aria-label="Loading podium">
        <div className="h-28 rounded-xl bg-slate-300/20 dark:bg-slate-700/50 animate-pulse" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-24 rounded-xl bg-slate-300/20 dark:bg-slate-700/50 animate-pulse" />
          <div className="h-24 rounded-xl bg-slate-300/20 dark:bg-slate-700/50 animate-pulse" />
        </div>
      </div>
    );
  }

  if (leaderboard.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-8 text-center text-sm text-slate-400">
        No active scores available to construct the podium.
      </div>
    );
  }

  const champion = leaderboard[0];
  const runnersUp = leaderboard.slice(1, 3);

  return (
    <>
      <div className="mb-6 flex items-center justify-between border-b pb-4 border-teal-500/20">
        <div>
          <h2 className={`text-lg font-bold ${colors.textMain}`}>Current Champion</h2>
          <p className={`text-xs ${colors.textMuted}`}>Top performers across all modules</p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-teal-500/10 text-teal-500 uppercase tracking-wider">
          Top 3
        </span>
      </div>

      <div className="space-y-4">
        {champion && (
          <div className="rounded-xl border border-teal-500/30 bg-teal-500/5 p-5 relative overflow-hidden group hover:border-teal-500/60 transition-all cursor-default">
            <div className="absolute right-4 top-4 flex items-center gap-1">
              <CrownIcon />
              <span className="text-2xl font-black text-yellow-400/30 group-hover:scale-110 transition-transform">
                #1
              </span>
            </div>
            <p className="text-xs font-bold text-teal-500 uppercase tracking-wider">
              {champion.class_level || 'General'}
            </p>
            <h3 className={`mt-1 text-xl font-bold ${colors.textMain}`}>
              {champion.full_name || champion.username}
            </h3>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-2xl font-black text-teal-500">{formatXP(champion.lifetime_points)}</span>
              <span className={`text-xs font-medium ${colors.textMuted}`}>Lifetime XP</span>
            </div>
          </div>
        )}

        {runnersUp.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            {runnersUp.map((learner, idx) => (
              <div 
                key={learner.id || idx} 
                className={`rounded-xl p-4 border transition-all hover:shadow-md ${
                  isDarkMode ? 'border-slate-800 bg-slate-900/40' : 'border-teal-200/50 bg-teal-50/30'
                }`}
              >
                <div className="flex justify-between items-start">
                  <span className="text-xs font-bold text-slate-400 uppercase">Rank #{learner.rank || idx + 2}</span>
                  <span className="text-[10px] font-medium text-teal-500">{learner.class_level || 'General'}</span>
                </div>
                <h4 className={`mt-2 font-bold text-sm truncate ${colors.textMain}`}>
                  {learner.full_name || learner.username}
                </h4>
                <p className="text-xs text-teal-500 font-semibold mt-3">{formatXP(learner.lifetime_points)} XP</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
});

const UserSnapshot = memo(({ user, colors, isDarkMode }) => (
  <>
    <div className="mb-6 border-b pb-4 border-teal-500/20">
      <h2 className={`text-lg font-bold ${colors.textMain}`}>Your Position</h2>
      <p className={`text-xs ${colors.textMuted}`}>Personal tracking and standing status</p>
    </div>

    <div className={`rounded-xl p-5 border ${isDarkMode ? 'bg-[#0B132B] border-teal-500/20' : 'bg-teal-50/50 border-teal-200/50'}`}>
      <span className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded bg-teal-500/10 text-teal-500 uppercase">
        Active Session
      </span>
      <h3 className={`mt-3 text-lg font-bold truncate ${colors.textMain}`}>
        {user?.fullName || user?.username || 'Guest Profile'}
      </h3>
      <p className="text-xs text-teal-500 font-medium mt-1">
        {user?.classLevel || user?.class_level || 'No Class Assigned'}
      </p>

      <div className="mt-5 grid grid-cols-2 gap-4 border-t pt-4 border-teal-500/20">
        <div>
          <p className="text-[11px] uppercase font-bold tracking-wide text-slate-400">Lifetime Score</p>
          <p className={`text-lg font-bold mt-0.5 ${colors.textMain}`}>
            {user?.lifetime_points ? formatXP(user.lifetime_points) : '—'} <span className="text-xs font-normal text-slate-500">XP</span>
          </p>
        </div>
        <div>
          <p className="text-[11px] uppercase font-bold tracking-wide text-slate-400">Current Points</p>
          <p className={`text-lg font-bold mt-0.5 ${colors.textMain}`}>
            {user?.current_points ? formatXP(user.current_points) : '—'} <span className="text-xs font-normal text-slate-500">XP</span>
          </p>
        </div>
      </div>
    </div>
  </>
));

const TableSkeleton = () => (
  <>
    {[...Array(5)].map((_, i) => (
      <tr key={i} className="animate-pulse">
        <td className="px-6 py-4"><div className="h-4 w-8 bg-slate-300/20 dark:bg-slate-700/50 rounded"></div></td>
        <td className="px-6 py-4"><div className="h-4 w-32 bg-slate-300/20 dark:bg-slate-700/50 rounded"></div></td>
        <td className="px-6 py-4"><div className="h-4 w-20 bg-slate-300/20 dark:bg-slate-700/50 rounded"></div></td>
        <td className="px-6 py-4"><div className="h-4 w-16 bg-slate-300/20 dark:bg-slate-700/50 rounded"></div></td>
        <td className="px-6 py-4"><div className="h-4 w-16 bg-slate-300/20 dark:bg-slate-700/50 rounded"></div></td>
      </tr>
    ))}
  </>
);

const LeaderboardTable = memo(({ loading, leaderboard, user, colors }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-left border-collapse" aria-label="Global Leaderboard">
      <thead>
        <tr className={`text-xs font-bold uppercase tracking-wider text-slate-400 border-b ${colors.border} ${colors.tableHeaderBg}`}>
          <th scope="col" className="px-6 py-4 w-24">Rank</th>
          <th scope="col" className="px-6 py-4">Learner Identity</th>
          <th scope="col" className="px-6 py-4">Class Level</th>
          <th scope="col" className="px-6 py-4">Lifetime XP</th>
          <th scope="col" className="px-6 py-4">Current XP</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-200/10">
        {loading ? (
          <TableSkeleton />
        ) : leaderboard.length === 0 ? (
          <tr>
            <td colSpan={5} className="px-6 py-12 text-center text-sm text-slate-400">
              No matching user points profiles cataloged.
            </td>
          </tr>
        ) : (
          leaderboard.map((learner, idx) => {
            const isCurrentUser = learner.id === user?.id || learner.username === user?.username;
            const isEvenRow = idx % 2 === 0;

            return (
              <tr
                key={learner.id || idx}
                className={`transition-colors text-sm hover:bg-teal-500/5 ${
                  isCurrentUser 
                    ? 'bg-teal-500/15 border-y border-teal-500/30 font-semibold' 
                    : isEvenRow ? colors.tableRowEven : 'bg-transparent'
                }`}
              >
                <td className="px-6 py-4 font-bold text-teal-500">
                  #{learner.rank || idx + 1}
                </td>
                <td className={`px-6 py-4 font-medium ${isCurrentUser ? 'text-teal-500 font-bold' : colors.textMain}`}>
                  <div className="flex items-center gap-2">
                    <span>{learner.full_name || learner.username}</span>
                    {isCurrentUser && (
                      <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-500" title="This is your account">
                        You
                      </span>
                    )}
                  </div>
                </td>
                <td className={`px-6 py-4 ${colors.textMuted}`}>
                  {learner.class_level || learner.classLevel || '—'}
                </td>
                <td className={`px-6 py-4 font-semibold ${colors.textMain}`}>
                  {formatXP(learner.lifetime_points)}
                </td>
                <td className={`px-6 py-4 font-semibold ${colors.textMain}`}>
                  {formatXP(learner.current_points)}
                </td>
              </tr>
            );
          })
        )}
      </tbody>
    </table>
  </div>
));

export default Leaderboard;