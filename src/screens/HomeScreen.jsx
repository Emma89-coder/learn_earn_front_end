import React from 'react';
import { useNavigate } from 'react-router-dom';

const HomeScreen = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-50">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-navy/5 rounded-2xl mb-6 mx-auto">
            <svg className="w-12 h-12 text-azure" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-4">
            <span className="text-navy">Learn & </span>
            <span className="text-azure">Earn</span>
          </h1>
          
          <div className="w-20 h-1 bg-gold mx-auto mb-6"></div>
          
          <p className="text-gray-600 text-lg mb-12 max-w-2xl mx-auto">
            Gamified learning platform for Malawian students. Earn points, win rewards, and excel in your studies!
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/learner-login')}
              className="px-8 py-3 bg-azure text-white font-semibold rounded-xl hover:bg-opacity-90 transition shadow-lg"
            >
              🎓 Student Login
            </button>
            
            <button
              onClick={() => navigate('/admin-login')}
              className="px-8 py-3 border-2 border-navy text-navy font-semibold rounded-xl hover:bg-navy hover:text-white transition"
            >
              👨‍💼 Admin Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeScreen;