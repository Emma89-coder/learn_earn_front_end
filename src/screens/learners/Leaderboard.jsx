import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import API_URL from '../../config';

const Leaderboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('portal-theme');
    return savedTheme ? savedTheme === 'dark' : true;
  });

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  useEffect(() => {
    localStorage.setItem('portal-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/leaderboard`);
      setLeaderboard(response.data.leaderboard || []);
    } catch (error) {
      console.error('Leaderboard fetch failed:', error);
      toast.error('Could not load leaderboard.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
    toast.success('Logged out successfully.');
  };

  // Color theme mapping system
  const colors = {
    bg: isDarkMode ? 'bg-[#0B132B]' : 'bg-[#F4F7F6]',
    card: isDarkMode ? 'bg-[#1C2541] border border-slate-700/60 shadow-xl' : 'bg-white border border-slate-200 shadow-sm',
    textMain: isDarkMode ? 'text-white' : 'text-[#0B132B]',
    textMuted: isDarkMode ? 'text-slate-400' : 'text-slate-600',
    tableHeaderBg: isDarkMode ? 'bg-[#0B132B]/50' : 'bg-slate-100',
    tableRowEven: isDarkMode ? 'bg-slate-800/20' : 'bg-slate-50/50',
    border: isDarkMode ? 'border-slate-800' : 'border-slate-200'
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${colors.bg}`}>
      
      {/* Top Sticky Navigation Header */}
      <header className={`sticky top-0 z-40 w-full border-b backdrop-blur-md ${
        isDarkMode ? 'bg-[#0B132B]/90 border-slate-800' : 'bg-white/90 border-slate-200'
      }`}>
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#00B0FF]">
              Performance System
            </span>
            <h1 className={`text-2xl font-bold mt-0.5 ${colors.textMain}`}>
              Leaderboard <span className="text-[#00B0FF]">Standings</span>
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-xl border border-[#00B0FF] hover:bg-[#00B0FF]/10 text-lg transition-all"
              title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDarkMode ? '☀️' : '🌙'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/learner-dashboard')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold border border-[#00B0FF] hover:bg-[#00B0FF]/10 transition-all ${colors.textMain}`}
            >
              Back to Dashboard
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-[#008080] text-white hover:bg-[#006666] shadow transition-all"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace Panels */}
      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        
        {/* Top Summary Cards Row */}
        <section className="grid gap-6 lg:grid-cols-12 items-start">
          
          {/* Left Summary: Podium Winners Overview */}
          <div className={`lg:col-span-7 rounded-2xl p-6 ${colors.card}`}>
            <div className="mb-6 flex items-center justify-between border-b pb-4 border-slate-700/30">
              <div>
                <h2 className={`text-lg font-bold ${colors.textMain}`}>Current Champion</h2>
                <p className={`text-xs ${colors.textMuted}`}>Top performers within our study workspace</p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-[#00B0FF]/10 text-[#00B0FF] uppercase tracking-wider">
                Top 100
              </span>
            </div>

            {loading ? (
              <div className="space-y-4">
                <div className="h-28 rounded-xl bg-slate-300/10 animate-pulse" />
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-24 rounded-xl bg-slate-300/10 animate-pulse" />
                  <div className="h-24 rounded-xl bg-slate-300/10 animate-pulse" />
                </div>
              </div>
            ) : leaderboard.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-8 text-center text-sm text-slate-400">
                No active metrics or scores available yet.
              </div>
            ) : (
              <div className="space-y-4">
                {/* Rank #1 Pod Accent */}
                <div className="rounded-xl border border-[#00B0FF]/30 bg-[#00B0FF]/5 p-5 relative overflow-hidden">
                  <div className="absolute right-4 top-4 text-4xl opacity-20 font-black select-none text-[#00B0FF]">#1</div>
                  <p className="text-xs font-bold text-[#00B0FF] uppercase tracking-wider">
                    {leaderboard[0].class_level || 'Grade Level Unassigned'}
                  </p>
                  <h3 className={`mt-1 text-xl font-bold ${colors.textMain}`}>
                    {leaderboard[0].full_name || leaderboard[0].username}
                  </h3>
                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="text-2xl font-black text-[#00B0FF]">{leaderboard[0].lifetime_points || 0}</span>
                    <span className={`text-xs font-medium ${colors.textMuted}`}>Lifetime XP accumulated</span>
                  </div>
                </div>

                {/* Rank #2 and Rank #3 Runnerups Grid */}
                <div className="grid gap-4 sm:grid-cols-2">
                  {leaderboard.slice(1, 3).map((learner, idx) => (
                    <div key={learner.id || idx} className={`rounded-xl p-4 border ${isDarkMode ? 'border-slate-800 bg-slate-900/40' : 'border-slate-200 bg-slate-50'}`}>
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-bold text-slate-400 uppercase">Rank #{learner.rank || idx + 2}</span>
                        <span className="text-[10px] font-medium text-[#008080]">{learner.class_level || 'General'}</span>
                      </div>
                      <h4 className={`mt-2 font-bold text-sm truncate ${colors.textMain}`}>
                        {learner.full_name || learner.username}
                      </h4>
                      <p className="text-xs text-[#00B0FF] font-semibold mt-3">{learner.lifetime_points || 0} Lifetime XP</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Summary: User Personal Standing Snapshot */}
          <div className={`lg:col-span-5 rounded-2xl p-6 ${colors.card}`}>
            <div className="mb-6 border-b pb-4 border-slate-700/30">
              <h2 className={`text-lg font-bold ${colors.textMain}`}>Your Position</h2>
              <p className={`text-xs ${colors.textMuted}`}>Personal tracking and dynamic standing status</p>
            </div>

            <div className={`rounded-xl p-5 border ${isDarkMode ? 'bg-[#0B132B] border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <span className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded bg-slate-500/10 text-slate-400 uppercase">
                Active Session Account
              </span>
              <h3 className={`mt-3 text-lg font-bold truncate ${colors.textMain}`}>
                {user?.fullName || user?.username || 'Guest Profile'}
              </h3>
              <p className="text-xs text-[#008080] font-medium mt-1">
                {user?.classLevel || user?.class_level || 'No Class Setup Assigned'}
              </p>

              <div className="mt-5 grid grid-cols-2 gap-4 border-t pt-4 border-slate-700/30">
                <div>
                  <p className="text-[11px] uppercase font-bold tracking-wide text-slate-400">Total Score</p>
                  <p className={`text-lg font-bold mt-0.5 ${colors.textMain}`}>{user?.lifetime_points ?? '—'} <span className="text-xs font-normal text-slate-500">XP</span></p>
                </div>
                <div>
                  <p className="text-[11px] uppercase font-bold tracking-wide text-slate-400">Current Points</p>
                  <p className={`text-lg font-bold mt-0.5 ${colors.textMain}`}>{user?.current_points ?? '—'} <span className="text-xs font-normal text-slate-500">XP</span></p>
                </div>
              </div>
            </div>
          </div>

        </section>

        {/* Global Standings Table Grid Listing */}
        <section className={`rounded-2xl overflow-hidden ${colors.card}`}>
          <div className="p-6 border-b border-slate-700/30">
            <h2 className={`text-lg font-bold ${colors.textMain}`}>Full Leaderboard</h2>
            <p className={`text-xs ${colors.textMuted}`}>Comprehensive directory ordered by top historical points metrics</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className={`text-xs font-bold uppercase tracking-wider text-slate-400 border-b ${colors.border} ${colors.tableHeaderBg}`}>
                  <th className="px-6 py-4 w-20">Rank</th>
                  <th className="px-6 py-4">Learner Identity</th>
                  <th className="px-6 py-4">Class Level</th>
                  <th className="px-6 py-4">Lifetime XP</th>
                  <th className="px-6 py-4">Current XP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/10">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-sm text-slate-400">
                      Syncing real-time records data from registry...
                    </td>
                  </tr>
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
                        className={`transition-colors text-sm ${
                          isCurrentUser 
                            ? 'bg-[#00B0FF]/15 border-y border-[#00B0FF]/30' 
                            : isEvenRow ? colors.tableRowEven : 'bg-transparent'
                        }`}
                      >
                        <td className="px-6 py-4 font-bold text-[#00B0FF]">
                          #{learner.rank || idx + 1}
                        </td>
                        <td className={`px-6 py-4 font-medium ${isCurrentUser ? 'text-[#00B0FF] font-bold' : colors.textMain}`}>
                          {learner.full_name || learner.username}
                          {isCurrentUser && <span className="ml-2 text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-[#00B0FF]/20">You</span>}
                        </td>
                        <td className={`px-6 py-4 ${colors.textMuted}`}>
                          {learner.class_level || learner.classLevel || '—'}
                        </td>
                        <td className={`px-6 py-4 font-semibold ${colors.textMain}`}>
                          {learner.lifetime_points ?? 0}
                        </td>
                        <td className={`px-6 py-4 font-semibold ${colors.textMain}`}>
                          {learner.current_points ?? 0}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

      </main>
    </div>
  );
};

export default Leaderboard;