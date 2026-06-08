import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import API_URL from '../config';

export const useAdminDashboard = () => {
  const [stats, setStats] = useState({ totalLearners: 0, totalQuizzes: 0, totalQuestions: 0, totalSubmissions: 0, averageScore: 0 });
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const [statsRes, actRes] = await Promise.all([
          axios.get(`${API_URL}/api/admin/dashboard-stats`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${API_URL}/api/admin/activities`, { headers: { Authorization: `Bearer ${token}` } })
        ]);
        setStats({
          totalLearners: statsRes.data.stats.total_learners || 0,
          totalQuizzes: statsRes.data.stats.total_quizzes || 0,
          totalQuestions: statsRes.data.stats.total_questions || 0,
          totalSubmissions: statsRes.data.stats.total_submissions || 0,
          averageScore: statsRes.data.stats.average_quiz_score || 0
        });
        setActivities(actRes.data.activities || []);
      } catch (err) {
        console.error("Fetch failed", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return { stats, activities, loading };
};