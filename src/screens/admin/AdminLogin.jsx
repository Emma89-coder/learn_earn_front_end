import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const AdminLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      const message = 'Please enter both username and password';
      setError(message);
      toast.error(message);
      return;
    }

    setLoading(true);
    const result = await login({ username: username.trim(), password }, false);
    setLoading(false);

    if (result.success) {
      setError('');
      toast.success('Welcome back, admin!');
      navigate('/admin-dashboard');
    } else {
      setError(result.error || 'Login failed');
      toast.error(result.error || 'Login failed');
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
        <span className="text-xs font-medium text-slate-500 tracking-wider">ADMIN PORTAL</span>
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
          <form onSubmit={handleSubmit} className="space-y-4">
            
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
                  placeholder="Enter your admin username"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label className="block text-slate-700 text-sm font-semibold ml-1">
                Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-all group-focus-within:scale-110">
                  <svg className="w-5 h-5 text-slate-400 group-focus-within:text-[#008080] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="w-full pl-10 pr-3 py-2.5 bg-white border-2 border-slate-200 rounded-md text-slate-800 text-sm placeholder-slate-400 focus:outline-none focus:border-[#008080] focus:ring-2 focus:ring-[#008080]/10 transition-all duration-200"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 bg-[#008080] text-white font-bold rounded-md shadow-md hover:shadow-lg transform hover:scale-[1.02] transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2 text-sm group"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </>
              )}
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
            <span className="text-slate-400 hover:text-[#008080] transition-colors cursor-pointer font-medium">Admin Access</span>
            <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
            <span className="text-slate-400 hover:text-[#008080] transition-colors cursor-pointer font-medium">System Management</span>
          </div>
        </div>

        {/* Authorized Personnel Only */}
        <p className="text-center text-xs text-slate-400 mt-3">
          Authorized personnel only
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;