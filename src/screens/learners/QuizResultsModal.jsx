// QuizResultsModal.jsx
import React from 'react';

const QuizResultsModal = ({ 
  isOpen, 
  onClose, 
  results, 
  onRetake, 
  onNextLevel, 
  onViewDashboard, 
  onViewHistory, 
  onShare 
}) => {
  if (!isOpen) return null;

  const {
    scorePercentage = 0,
    earnedPoints = 0,
    correctCount = 0,
    totalQuestions = 0,
    passed = false,
    answers = [],
    quizTitle = 'Quiz',
  } = results;

  const getGrade = () => {
    if (scorePercentage >= 90) return { label: 'excellent!', emoji: '🌟' };
    if (scorePercentage >= 70) return { label: 'good job!', emoji: '👏' };
    if (scorePercentage >= 60) return { label: 'well done!', emoji: '🎉' };
    if (scorePercentage >= 40) return { label: 'keep practicing!', emoji: '📚' };
    return { label: 'keep trying!', emoji: '💪' };
  };

  const grade = getGrade();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl border border-slate-200">
        
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-800">quiz results</h2>
              <p className="text-xs text-slate-500 truncate max-w-[200px]">{quizTitle}</p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-400"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Score Section */}
        <div className="px-6 py-6 text-center border-b border-slate-100">
          <div className="relative inline-flex items-center justify-center mb-2">
            <div className="w-28 h-28 rounded-full border-4 border-teal-100 flex items-center justify-center">
              <div>
                <span className="text-3xl font-bold text-slate-800">{scorePercentage}%</span>
                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">score</p>
              </div>
            </div>
            {passed && (
              <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-green-500 flex items-center justify-center shadow-lg text-white text-sm font-bold">
                ✓
              </div>
            )}
          </div>
          
          <div className="flex items-center justify-center gap-2">
            <span className="text-2xl">{grade.emoji}</span>
            <span className="text-lg font-bold text-slate-800">{grade.label}</span>
          </div>

          <div className="mt-3 flex items-center justify-center gap-6 text-sm">
            <div className="text-center">
              <p className="font-bold text-slate-800">{correctCount}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">correct</p>
            </div>
            <div className="w-px h-8 bg-slate-200"></div>
            <div className="text-center">
              <p className="font-bold text-slate-800">{totalQuestions - correctCount}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">wrong</p>
            </div>
            <div className="w-px h-8 bg-slate-200"></div>
            <div className="text-center">
              <p className="font-bold text-teal-600">+{earnedPoints}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">points</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-6 py-5 space-y-2.5">
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={onRetake}
              className="py-2.5 rounded-xl text-sm font-semibold text-teal-600 bg-teal-50 hover:bg-teal-100 transition-colors border border-teal-200"
            >
              retake quiz
            </button>
            <button
              onClick={onShare}
              className="py-2.5 rounded-xl text-sm font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-200"
            >
              share results
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={onViewDashboard}
              className="py-2 rounded-xl text-xs font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-200"
            >
              dashboard
            </button>
            <button
              onClick={onViewHistory}
              className="py-2 rounded-xl text-xs font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-200"
            >
              history
            </button>
            <button
              onClick={onNextLevel}
              className="py-2 rounded-xl text-xs font-medium text-white bg-teal-500 hover:bg-teal-600 transition-colors shadow-sm"
            >
              next quiz
            </button>
          </div>
        </div>

        {/* Answer Review */}
        {answers.length > 0 && (
          <div className="px-6 pb-5">
            <details className="group">
              <summary className="flex items-center justify-between cursor-pointer text-xs font-medium text-slate-500 hover:text-slate-700 transition-colors">
                <span>review answers</span>
                <span className="text-slate-400 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <div className="mt-3 space-y-2 max-h-48 overflow-y-auto pr-1">
                {answers.map((ans, idx) => (
                  <div key={idx} className="flex items-start gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <div className="flex-shrink-0 mt-0.5 text-sm">
                      {ans.isCorrect ? '✓' : '✕'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-medium text-slate-700 truncate">
                        q{idx + 1}: {String(ans.questionText || '').toLowerCase()}
                      </p>
                      <div className="flex items-center gap-3 mt-0.5 text-[10px]">
                        <span className="text-slate-500">your answer: <span className={ans.isCorrect ? 'text-green-600 font-medium' : 'text-red-500 font-medium'}>{ans.selectedOption || '—'}</span></span>
                        {!ans.isCorrect && (
                          <span className="text-slate-500">correct: <span className="text-teal-600 font-medium">{ans.correctAnswer}</span></span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </details>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out forwards;
        }
        .max-h-48 {
          max-height: 12rem;
        }
        .max-h-48::-webkit-scrollbar {
          width: 3px;
        }
        .max-h-48::-webkit-scrollbar-track {
          background: transparent;
        }
        .max-h-48::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
};

export default QuizResultsModal;