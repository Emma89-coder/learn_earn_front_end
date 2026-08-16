import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import PrivateRoute from './components/PrivateRoute';

// Screens
import LearnerLogin from './screens/learners/LearnerLogin';
import LearnerDashboard from './screens/learners/LearnerDashboard';
import QuizPage from './screens/learners/QuizPage';
import Leaderboard from './screens/learners/Leaderboard';
import TakeQuiz from './screens/learners/TakeQuiz';
import RewardsStore from './screens/learners/RewardsStore';
import LearnerBadges from './screens/learners/LearnerBadges';
import SpellingBee from './screens/learners/SpellingBee';
import Hangman from './screens/learners/Hangman';

// Admin Screens
import AdminLogin from './screens/admin/AdminLogin';
import AdminDashboard from './screens/admin/AdminDashboard';
import AdminRewards from './screens/admin/AdminRewards';
import AdminQuizzes from './screens/admin/AdminQuizzes';
import AdminQuestionBank from './screens/admin/QuestionBank';
import AdminBadges from './screens/admin/AdminBadges';
import AdminLearners from './screens/admin/AdminLearners';
import AdminSpellingBee from './screens/admin/AdminSpellingBee';
import AdminHangmanManager from './screens/admin/AdminHangmanManager';
import AdminRAGEngine from './screens/admin/AdminRAGEngine';
import AdminAppearance from './screens/admin/AdminAppearance';
import AdminDistricts from './screens/admin/AdminDistricts';
import QuizHistory from './screens/learners/QuizHistory';
import SecondaryQuizPage from './screens/learners/SecondaryQuizPage';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="min-h-screen transition-colors duration-300">
            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
                success: {
                  duration: 3000,
                  iconTheme: {
                    primary: '#4ade80',
                    secondary: '#fff',
                  },
                },
                error: {
                  duration: 4000,
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#fff',
                  },
                },
              }}
            />
            <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Navigate to="/learner-login" replace />} />
            <Route path="/learner-login" element={<LearnerLogin />} />
            <Route path="/admin-login" element={<AdminLogin />} />
            
            {/* Learner Routes */}
            <Route path="/learner-dashboard" element={
              <PrivateRoute allowedRoles={['learner']}>
                <LearnerDashboard />
              </PrivateRoute>
            } />
            <Route path="/quizzes" element={
              <PrivateRoute allowedRoles={['learner']}>
                <QuizPage />
              </PrivateRoute>
            } />
            <Route path="/quizzes/:topicId" element={
              <PrivateRoute allowedRoles={['learner']}>
                <QuizPage />
              </PrivateRoute>
            } />
            <Route path="/quiz/:quizId" element={
              <PrivateRoute allowedRoles={['learner']}>
                <TakeQuiz />
              </PrivateRoute>
            } />
            <Route path="/secondary-quiz" element={
              <PrivateRoute allowedRoles={['learner']}>
                <SecondaryQuizPage />
              </PrivateRoute>
            } />
            <Route path="/leaderboard" element={
              <PrivateRoute allowedRoles={['learner']}>
                <Leaderboard />
              </PrivateRoute>
            } />
            <Route path="/rewards" element={
              <PrivateRoute allowedRoles={['learner']}>
                <RewardsStore />
              </PrivateRoute>
            } />
            <Route path="/badges" element={
              <PrivateRoute allowedRoles={['learner']}>
                <LearnerBadges />
              </PrivateRoute>
            } />

            {/* Quiz History */}
            <Route path="/quiz-history" element={
              <PrivateRoute allowedRoles={['learner']}>
                <QuizHistory />
              </PrivateRoute>
            } />
            
            {/* Hangman Routes */}
            <Route path="/hangman" element={
              <PrivateRoute allowedRoles={['learner']}>
                <Hangman />
              </PrivateRoute>
            } />
            <Route path="/hangman/:category" element={
              <PrivateRoute allowedRoles={['learner']}>
                <Hangman />
              </PrivateRoute>
            } />
            
            {/* Spelling Bee Routes */}
            <Route path="/spelling-bee" element={
              <PrivateRoute allowedRoles={['learner']}>
                <SpellingBee />
              </PrivateRoute>
            } />
            
            {/* Admin Routes */}
            <Route path="/admin-dashboard" element={
              <PrivateRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </PrivateRoute>
            } />
            <Route path="/admin-rewards" element={
              <PrivateRoute allowedRoles={['admin']}>
                <AdminRewards />
              </PrivateRoute>
            } />
            <Route path="/admin-quizzes" element={
              <PrivateRoute allowedRoles={['admin']}>
                <AdminQuizzes />
              </PrivateRoute>
            } />
            <Route path="/admin/question-bank" element={
              <PrivateRoute allowedRoles={['admin']}>
                <AdminQuestionBank />
              </PrivateRoute>
            } />
            <Route path="/admin-badges" element={
              <PrivateRoute allowedRoles={['admin']}>
                <AdminBadges />
              </PrivateRoute>
            } />
            <Route path="/admin-learners" element={
              <PrivateRoute allowedRoles={['admin']}>
                <AdminLearners />
              </PrivateRoute>
            } />
            <Route path="/admin-spelling-bee" element={
              <PrivateRoute allowedRoles={['admin']}>
                <AdminSpellingBee />
              </PrivateRoute>
            } />
            <Route path="/admin-hangman" element={
              <PrivateRoute allowedRoles={['admin']}>
                <AdminHangmanManager />
              </PrivateRoute>
            } />
            <Route path="/admin-rag" element={
              <PrivateRoute allowedRoles={['admin']}>
                <AdminRAGEngine />
              </PrivateRoute>
            } />
            
            <Route path="/admin-appearance" element={
              <PrivateRoute allowedRoles={['admin']}>
                <AdminAppearance />
              </PrivateRoute>
            } />
            <Route path="/admin-districts" element={
              <PrivateRoute allowedRoles={['admin']}>
                <AdminDistricts />
              </PrivateRoute>
            } />
            
            {/* Catch all - redirect to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;