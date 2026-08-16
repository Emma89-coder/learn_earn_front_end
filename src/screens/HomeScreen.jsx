import React from 'react';
import { useNavigate } from 'react-router-dom';

const HomeScreen = () => {
  const navigate = useNavigate();

  const SchoolBranding = () => (
    <div className="w-full flex flex-col items-center text-center mb-8">
      <div className="relative transform transition-all duration-500 hover:scale-105">
        <img 
          src="logo.png" 
          alt="Learn & Earn Logo" 
          className="relative w-44 h-44 object-contain drop-shadow-2xl"
          loading="eager"
        />
      </div>
      
      <h1 className="text-3xl font-bold text-teal-700 -mt-2">
        Learn & Earn
      </h1>
      
      <div className="flex items-center gap-2 mt-1">
        <div className="w-8 h-0.5 bg-teal-600 rounded-full"></div>
        <span className="text-xs font-medium text-slate-500 tracking-wider">LEARNING PLATFORM</span>
        <div className="w-8 h-0.5 bg-teal-600 rounded-full"></div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-teal-50">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center max-w-3xl mx-auto">
          
          <SchoolBranding />
          
          <p className="text-gray-600 text-lg mb-10 max-w-2xl mx-auto">
            Gamified learning platform for Malawian students. Earn points, win rewards, and excel in your studies!
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/learner-login')}
              className="px-8 py-3 bg-teal-500 text-white font-semibold rounded-xl hover:bg-teal-600 transition shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Student Login
            </button>
            
            <button
              onClick={() => navigate('/admin-login')}
              className="px-8 py-3 bg-cyan-500 text-white font-semibold rounded-xl hover:bg-cyan-600 transition shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Admin Login
            </button>
          </div>

          {/* Decorative elements */}
          <div className="mt-12 flex justify-center gap-6">
            <div className="w-2 h-2 bg-teal-400 rounded-full"></div>
            <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
            <div className="w-2 h-2 bg-azure-400 rounded-full"></div>
          </div>

          {/* Footer */}
          <div className="mt-10 pt-4 border-t border-teal-200">
            <div className="flex flex-wrap items-center justify-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 font-medium text-slate-500 hover:text-teal-700 transition-colors cursor-pointer">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6-4h12a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6a2 2 0 012-2zm10-4V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Secure Platform
              </span>
              <div className="w-1 h-1 bg-teal-300 rounded-full"></div>
              <span className="text-slate-500 hover:text-teal-700 transition-colors cursor-pointer font-medium">Earn Points</span>
              <div className="w-1 h-1 bg-teal-300 rounded-full"></div>
              <span className="text-slate-500 hover:text-teal-700 transition-colors cursor-pointer font-medium">Get Rewards</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeScreen;