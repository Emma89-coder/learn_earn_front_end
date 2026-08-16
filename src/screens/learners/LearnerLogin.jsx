import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

const LearnerLogin = ({ serverStatus }) => {
  const [username, setUsername] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const savedUsername = localStorage.getItem('rememberedLearnerUsername');
    const savedRegNumber = localStorage.getItem('rememberedLearnerRegNumber');
    const remember = localStorage.getItem('rememberLearner') === 'true';
    if (remember && savedUsername && savedRegNumber) {
      setUsername(savedUsername);
      setRegistrationNumber(savedRegNumber);
      setRememberMe(true);
    }
  }, []);

  const handleLogin = async () => {
    if (!username || !registrationNumber) {
      setError('Please enter both username and registration number');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await login({ 
        username: username.trim(), 
        registrationNumber: registrationNumber.trim().toUpperCase() 
      }, true);
      
      if (result.success) {
        if (rememberMe) {
          localStorage.setItem('rememberedLearnerUsername', username);
          localStorage.setItem('rememberedLearnerRegNumber', registrationNumber.trim().toUpperCase());
          localStorage.setItem('rememberLearner', 'true');
        } else {
          localStorage.removeItem('rememberedLearnerUsername');
          localStorage.removeItem('rememberedLearnerRegNumber');
          localStorage.removeItem('rememberLearner');
        }

        toast.success(`Welcome back, ${result.user?.fullName || result.user?.username || username}!`);
        navigate('/learner-dashboard');
      } else {
        setError(result.error || 'Invalid credentials');
        toast.error(result.error || 'Login failed');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Connection failed';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const SchoolBranding = () => (
    <div className="w-full flex flex-col items-center text-center mb-6">
      <div className="relative transform transition-all duration-500 hover:scale-105">
        <img 
          src="logo.png" 
          alt="Learn & Earn Logo" 
          className="relative w-44 h-44 object-contain drop-shadow-2xl"
          loading="eager"
        />
      </div>
      
      <h1 className="text-2xl font-bold text-[#1A237E] -mt-2">
        Learn & Earn
      </h1>
      
      <div className="flex items-center gap-2 mt-1">
        <div className="w-8 h-0.5 bg-[#1A237E] rounded-full"></div>
        <span className="text-xs font-medium text-slate-500 tracking-wider">LEARNER PORTAL</span>
        <div className="w-8 h-0.5 bg-[#1A237E] rounded-full"></div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 w-full h-full flex items-center justify-center p-4 bg-white overflow-hidden">
      
      <div className="relative w-full max-w-md mx-auto">
        
        <SchoolBranding />

        {/* Form Card */}
        <div className="w-full bg-white rounded-lg shadow-lg border border-slate-200 p-6">
          <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} className="space-y-4">
            
            {/* Username Field */}
            <div className="space-y-1.5">
              <label className="block text-slate-700 text-sm font-semibold ml-1">
                Username
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-all group-focus-within:scale-110">
                  <svg className="w-5 h-5 text-slate-400 group-focus-within:text-[#008080] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                  className="w-full pl-10 pr-3 py-2.5 bg-white border-2 border-slate-200 rounded-md text-slate-800 text-sm placeholder-slate-400 focus:outline-none focus:border-[#008080] focus:ring-2 focus:ring-[#008080]/10 transition-all duration-200"
                  placeholder="Enter your username"
                />
              </div>
            </div>

            {/* Registration Number Field */}
            <div className="space-y-1.5">
              <label className="block text-slate-700 text-sm font-semibold ml-1">
                Registration Number
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-all group-focus-within:scale-110">
                  <svg className="w-5 h-5 text-slate-400 group-focus-within:text-[#008080] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 20h10M7 4h10M7 8h10M7 12h10M7 16h10" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={registrationNumber}
                  onChange={(e) => setRegistrationNumber(e.target.value.toUpperCase())}
                  disabled={loading}
                  className="w-full pl-10 pr-3 py-2.5 bg-white border-2 border-slate-200 rounded-md text-slate-800 font-mono text-sm uppercase placeholder-slate-400 focus:outline-none focus:border-[#008080] focus:ring-2 focus:ring-[#008080]/10 transition-all duration-200"
                  placeholder="e.g., 24-0123"
                />
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center justify-between pt-1 px-1">
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-[#008080] border-2 border-slate-300 rounded focus:ring-0 focus:ring-offset-0 accent-[#008080] cursor-pointer transition-all"
                  />
                </div>
                <span className="text-sm text-slate-600 group-hover:text-slate-800 transition-colors font-medium">Keep me signed in</span>
              </label>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading || serverStatus?.status === 'offline'}
              className="w-full mt-2 py-2.5 bg-[#008080] text-white font-bold rounded-md shadow-md hover:shadow-lg transform hover:scale-[1.02] transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 text-sm"
            >
              Sign In
            </button>
          </form>

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-md">
              <div className="flex items-center gap-2 text-red-700 text-sm">
                <svg className="w-4 h-4 flex-shrink-0 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium">{error}</span>
              </div>
            </div>
          )}

          {/* Server Offline Alert */}
          {serverStatus?.status === 'offline' && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-100 rounded-md">
              <div className="flex items-center gap-2 text-amber-700 text-sm">
                <span className="text-base">⚠</span>
                <span className="font-medium">Server is offline. Please check your connection.</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-5 pt-3">
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 font-medium text-slate-400 hover:text-[#1A237E] transition-colors cursor-pointer">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6-4h12a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6a2 2 0 012-2zm10-4V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Secure Portal
            </span>
            <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
            <span className="text-slate-400 hover:text-[#008080] transition-colors cursor-pointer font-medium">Earn Points</span>
            <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
            <span className="text-slate-400 hover:text-[#008080] transition-colors cursor-pointer font-medium">Get Rewards</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LearnerLogin;