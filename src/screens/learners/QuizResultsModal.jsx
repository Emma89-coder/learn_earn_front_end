import React, { useState } from 'react';

const QuizResultsModal = ({ 
  isOpen, 
  onClose, 
  results, 
  onRetake, 
  onNextLevel, 
  onViewDashboard, 
  onShare,
  isDarkMode = false 
}) => {
  const [showAnswers, setShowAnswers] = useState(false);

  if (!isOpen) return null;

  const { 
    scorePercentage, 
    correctCount, 
    totalQuestions, 
    earnedPoints, 
    passed, 
    answers = [],
    quizTitle = 'Quiz'
  } = results;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className={`w-full max-w-md rounded-2xl shadow-xl overflow-hidden ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`} onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className={`p-6 text-center ${passed ? 'bg-teal-500' : 'bg-red-500'}`}>
          <div className="text-5xl mb-2">{passed ? '🎉' : '💪'}</div>
          <h2 className="text-xl font-bold text-white">
            {passed ? 'Quiz Complete!' : 'Keep Practicing!'}
          </h2>
          <p className="text-white/80 text-sm mt-1">{quizTitle}</p>
        </div>

        {/* Score */}
        <div className="text-center py-6">
          <div className="text-5xl font-bold text-teal-500">{scorePercentage}%</div>
          <p className="text-sm text-gray-500 mt-1">Your Score</p>
        </div>

        {/* Stats - Simple Row */}
        <div className="flex justify-around border-t border-b border-gray-100 py-3 px-4">
          <div className="text-center">
            <div className="text-lg">✅</div>
            <div className="font-semibold text-gray-800">{correctCount}/{totalQuestions}</div>
            <div className="text-xs text-gray-500">Correct</div>
          </div>
          <div className="text-center">
            <div className="text-lg">💎</div>
            <div className="font-semibold text-teal-600">+{earnedPoints}</div>
            <div className="text-xs text-gray-500">Points</div>
          </div>
          <div className="text-center">
            <div className="text-lg">{passed ? '🏆' : '🎯'}</div>
            <div className={`font-semibold ${passed ? 'text-green-600' : 'text-red-600'}`}>
              {passed ? 'Passed' : 'Failed'}
            </div>
            <div className="text-xs text-gray-500">Status</div>
          </div>
        </div>

        {/* Toggle Answers */}
        <div className="p-4">
          <button
            onClick={() => setShowAnswers(!showAnswers)}
            className={`w-full py-2 rounded-lg text-sm font-medium transition ${
              isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            {showAnswers ? 'Hide Answers' : 'Show Answers'}
          </button>
        </div>

        {/* Answers Section */}
        {showAnswers && (
          <div className="px-4 pb-4 max-h-64 overflow-y-auto">
            <div className="space-y-2">
              {answers.map((answer, i) => (
                <div key={i} className={`p-2 rounded-lg text-sm ${answer.isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                  <div className="flex justify-between items-start">
                    <span className="font-medium text-gray-700">Q{i + 1}</span>
                    <span>{answer.isCorrect ? '✓' : '✗'}</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">{answer.questionText}</p>
                  <div className="text-xs mt-1 text-green-700">✓ {answer.correctAnswer}</div>
                  {!answer.isCorrect && answer.selectedOption && (
                    <div className="text-xs mt-1 text-red-600">✗ Your: {answer.selectedOption}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="p-4 pt-0 space-y-2">
          <div className="flex gap-2">
            {passed ? (
              <button onClick={onNextLevel} className="flex-1 py-2 bg-teal-600 hover:bg-teal-700 rounded-lg font-medium text-white text-sm transition">
                Next Level
              </button>
            ) : (
              <button onClick={onRetake} className="flex-1 py-2 bg-teal-600 hover:bg-teal-700 rounded-lg font-medium text-white text-sm transition">
                Try Again
              </button>
            )}
            <button onClick={onShare} className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium text-white text-sm transition">
              Share
            </button>
          </div>
          <button onClick={onViewDashboard} className="w-full py-2 border-2 border-teal-500 text-teal-600 rounded-lg font-medium text-sm hover:bg-teal-50 transition">
            Dashboard
          </button>
        </div>
      </div>

      <style jsx>{`
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default QuizResultsModal;