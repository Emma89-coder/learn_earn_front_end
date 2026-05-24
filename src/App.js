import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';

// Screens
import HomeScreen from './screens/HomeScreen';
import LearnerLogin from './screens/learners/LearnerLogin';
import LearnerDashboard from './screens/learners/LearnerDashboard';
import QuizPage from './screens/learners/QuizPage';
import Leaderboard from './screens/learners/Leaderboard';
import TakeQuiz from './screens/learners/TakeQuiz';
import RewardsStore from './screens/learners/RewardsStore';
import LearnerBadges from './screens/learners/LearnerBadges';
import AdminLogin from './screens/admin/AdminLogin';
import AdminDashboard from './screens/admin/AdminDashboard';
import AdminRewards from './screens/admin/AdminRewards';
import AdminQuizzes from './screens/admin/AdminQuizzes';
import AdminBadges from './screens/admin/AdminBadges';
import AdminLearners from './screens/admin/AdminLearners';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster position="top-right" />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomeScreen />} />
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
          {/* Take Quiz Route - IMPORTANT: Add this line */}
          <Route path="/quiz/:quizId" element={
            <PrivateRoute allowedRoles={['learner']}>
              <TakeQuiz />
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
          
          {/* Catch all - redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;