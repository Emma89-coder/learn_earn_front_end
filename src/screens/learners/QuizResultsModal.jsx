import React, { useState } from 'react';

const LEVEL_COLORS = {
  1:'bg-green-400', 2:'bg-green-500', 3:'bg-teal-400', 4:'bg-teal-500',
  5:'bg-blue-400',  6:'bg-blue-500',  7:'bg-purple-400',8:'bg-purple-500',
  9:'bg-orange-500',10:'bg-red-500',
};

const QuizResultsModal = ({
  isOpen, onClose,
  results = {},
  onRetake, onNextLevel, onViewDashboard, onViewHistory, onShare,
  isDarkMode = false,
}) => {
  const [showAnswers, setShowAnswers] = useState(false);

  if (!isOpen) return null;

  const {
    scorePercentage = 0,
    correctCount    = 0,
    totalQuestions  = 0,
    earnedPoints    = 0,
    passed          = false,
    answers         = [],
    quizTitle       = 'Quiz',
    quizGameLevel   = 1,
    newQuizLevel    = 1,
    levelAdvanced   = false,
    championBadgeEarned = false,
    currentQuizLevel = 1,
  } = results;

  const card = 'bg-[#f8fbff]';
  const text = 'text-[#1f2937]';
  const sub = 'text-[#4b5563]';
  const divBg = 'bg-[#eef4ff]';

  const headerColor = championBadgeEarned
    ? 'bg-amber-500'
    : levelAdvanced
      ? 'bg-purple-500'
      : passed ? 'bg-teal-500' : 'bg-red-500';

  const headerEmoji = championBadgeEarned ? '🏆' : levelAdvanced ? '⬆️' : passed ? '🎉' : '💪';
  const headerTitle = championBadgeEarned
    ? 'QUIZ CHAMPION!'
    : levelAdvanced ? `Level Up! → Level ${newQuizLevel}`
    : passed ? 'Quiz Complete!' : 'Keep Practicing!';

  // Level progress bar: show progress from current game level toward 10
  const progressPct = Math.min(((currentQuizLevel - 1) / 9) * 100, 100);
  const levelColor  = LEVEL_COLORS[currentQuizLevel] || 'bg-teal-500';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}>
      <div className={`w-full max-w-md rounded-2xl shadow-2xl overflow-hidden ${card} max-h-[92vh] flex flex-col`}
        onClick={e => e.stopPropagation()}>

        {/* ── Header ── */}
        <div className={`${headerColor} p-5 text-center flex-shrink-0`}>
          <div className={`text-5xl mb-1 ${championBadgeEarned ? 'animate-bounce' : ''}`}>{headerEmoji}</div>
          <h2 className="text-lg font-black text-[#f8fbff]">{headerTitle}</h2>
          <p className="text-[#f8fbff] text-xs mt-0.5">{quizTitle}</p>
          {quizGameLevel && (
            <div className={`inline-block mt-1.5 text-xs font-bold px-2.5 py-0.5 rounded-full ${LEVEL_COLORS[quizGameLevel] || 'bg-teal-500'} text-[#f8fbff] shadow`}>
              Level {quizGameLevel}
            </div>
          )}
        </div>

        <div className="overflow-y-auto flex-1">

          {/* Champion celebration */}
          {championBadgeEarned && (
            <div className="mx-4 mt-4 bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center">
              <div className="text-3xl mb-1">🏆✨🌟</div>
              <p className="font-black text-yellow-700 text-base">You are a Quiz Champion!</p>
              <p className="text-yellow-600 text-xs mt-1">You've completed all 10 levels. The Champion Badge is now in your collection!</p>
            </div>
          )}

          {/* Level-up banner */}
          {levelAdvanced && !championBadgeEarned && (
            <div className="mx-4 mt-4 bg-purple-50 border border-purple-200 rounded-xl p-3 text-center">
              <p className="font-bold text-purple-700 text-sm">
                🎊 You advanced to <span className="text-purple-900">Level {newQuizLevel}</span>!
              </p>
              <p className="text-purple-500 text-xs mt-0.5">Keep going — only {10 - newQuizLevel} level{10 - newQuizLevel !== 1 ? 's' : ''} to the champion badge!</p>
            </div>
          )}

          {/* Score */}
          <div className="text-center py-4">
            <div className="text-5xl font-black text-teal-300">{scorePercentage}%</div>
            <p className={`text-xs mt-0.5 ${sub}`}>Your Score</p>
          </div>

          {/* Stats row */}
          <div className="flex justify-around border-t border-b border-[#dbe7ff] py-3 px-4">
            <div className="text-center">
              <div className="text-lg">✅</div>
              <div className={`font-bold text-sm ${text}`}>{correctCount}/{totalQuestions}</div>
              <div className={`text-xs ${sub}`}>Correct</div>
            </div>
            <div className="text-center">
              <div className="text-lg">💎</div>
              <div className="font-bold text-sm text-teal-300">+{earnedPoints}</div>
              <div className={`text-xs ${sub}`}>Points</div>
            </div>
            <div className="text-center">
              <div className="text-lg">{passed ? '🏅' : '🎯'}</div>
              <div className={`font-bold text-sm ${passed ? 'text-emerald-300' : 'text-rose-300'}`}>
                {passed ? 'Passed' : 'Failed'}
              </div>
              <div className={`text-xs ${sub}`}>Status</div>
            </div>
          </div>

          {/* Level progress bar */}
          <div className="px-4 py-3">
            <div className="flex justify-between items-center mb-1.5">
              <span className={`text-xs font-semibold ${sub}`}>Overall Level Progress</span>
              <span className={`text-xs font-bold ${text}`}>
                {championBadgeEarned ? '🏆 Champion' : `Level ${currentQuizLevel} / 10`}
              </span>
            </div>
            <div className="h-3 rounded-full bg-[#dbe7ff] overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${levelColor}`}
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <div className="flex justify-between mt-1">
              {[1,2,3,4,5,6,7,8,9,10].map(l => (
                <div key={l}
                  className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold
                    ${l < currentQuizLevel  ? 'bg-emerald-400 text-white'
                      : l === currentQuizLevel ? `${LEVEL_COLORS[l]} text-white ring-2 ring-white shadow`
                      : 'bg-[#c9d9f8] text-[#6b7280]'}`}
                >
                  {l === 10 ? '👑' : l}
                </div>
              ))}
            </div>
          </div>

          {/* Show/hide answers */}
          <div className="px-4 pb-1">
            <button onClick={() => setShowAnswers(!showAnswers)}
              className={`w-full py-2 rounded-lg text-sm font-medium transition ${divBg} ${text} hover:opacity-80`}>
              {showAnswers ? 'Hide Answers' : 'Review Answers'}
            </button>
          </div>

          {showAnswers && answers.length > 0 && (
            <div className="px-4 pb-3 max-h-52 overflow-y-auto space-y-2">
              {answers.map((a, i) => (
                <div key={i} className={`p-2 rounded-lg text-xs border ${a.isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                  <div className="flex justify-between"><span className={`font-bold ${text}`}>Q{i + 1}</span><span>{a.isCorrect ? '✓' : '✗'}</span></div>
                  {a.questionText && <p className={`mt-0.5 line-clamp-2 ${sub}`}>{a.questionText}</p>}
                  <div className="text-green-700 mt-0.5 font-medium">✓ {a.correctAnswer}</div>
                  {!a.isCorrect && a.selectedOption && <div className="text-red-600">✗ {a.selectedOption}</div>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Action buttons ── */}
        <div className="p-4 pt-2 space-y-2 flex-shrink-0 border-t border-[#dbe7ff]">
          <div className="flex gap-2">
            <button onClick={passed ? onNextLevel : onRetake}
              className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 rounded-xl font-bold text-white text-sm transition shadow">
              {passed ? (championBadgeEarned ? '🏆 View Badges' : '▶ Next Level') : '🔄 Try Again'}
            </button>
            <button onClick={onShare}
              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-xl font-bold text-white text-sm transition shadow">
              📤 Share
            </button>
          </div>
          <div className="flex gap-2">
            <button onClick={onViewHistory}
              className="flex-1 py-2 rounded-xl text-sm font-semibold border-2 transition border-[#c9d9f8] text-[#374151] hover:bg-[#f2f7ff]">
              📋 History
            </button>
            <button onClick={onViewDashboard}
              className="flex-1 py-2 rounded-xl text-sm font-semibold border-2 transition border-[#c9d9f8] text-[#374151] hover:bg-[#f2f7ff]">
              🏠 Dashboard
            </button>
          </div>
        </div>
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

export default QuizResultsModal;
