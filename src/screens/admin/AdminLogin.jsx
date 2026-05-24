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
    <div className="w-full flex flex-col items-center text-center mb-3">
      <div className="relative transform transition-transform hover:scale-[1.01] duration-300 ease-out -mb-8 sm:-mb-10">
        <img 
          src="logo.png" 
          alt="Learn & Earn Logo" 
          className="w-56 h-56 sm:w-64 sm:h-64 object-contain image-render-crisp"
          loading="eager"
        />
      </div>
      
      <p className="text-slate-500 text-xs font-bold tracking-widest uppercase relative z-10 -mt-1">
        Empower. Grow. Prosper.
      </p>
      
      <div className="w-10 h-0.5 bg-gradient-to-r from-[#1A237E] via-[#00B0FF] to-[#1A237E] my-1.5"></div>
      
      <p className="text-[#1A237E] text-xs font-extrabold tracking-wider uppercase">
        Admin Portal
      </p>
    </div>
  );

  return (
    <div className="relative h-screen w-full flex items-center justify-center p-4 bg-[#F4F7FA] overflow-hidden select-none">
      
      {/* Background Blur Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-[#1A237E]/6 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-[#00B0FF]/12 rounded-full blur-[150px] pointer-events-none"></div>
      <div className="absolute top-[30%] right-[10%] w-[25vw] h-[25vw] bg-[#00B0FF]/6 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="max-w-md w-full z-10">
        
        <SchoolBranding />

        {/* Card with learner-style rounded corners and soft shadow */}
        <div className="w-full bg-white rounded-3xl shadow-[0_25px_55px_rgba(26,35,126,0.05)] overflow-hidden border border-gray-300">
          
          <div className="p-5">
            <form onSubmit={handleSubmit} className="space-y-3.5">
              
              {/* Username Field */}
              <div>
                <label className="block text-slate-700 text-xs font-bold uppercase tracking-wider mb-1.5">
                  Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="w-4 h-4 text-[#00B0FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={loading}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-none text-slate-800 text-base placeholder-slate-400 focus:outline-none focus:border-[#00B0FF] focus:bg-white transition-all duration-200"
                    placeholder="Enter your admin username"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-slate-700 text-xs font-bold uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="w-4 h-4 text-[#00B0FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-none text-slate-800 text-base placeholder-slate-400 focus:outline-none focus:border-[#00B0FF] focus:bg-white transition-all duration-200"
                    placeholder="Enter your password"
                  />
                </div>
              </div>

              {/* Login Button - Darkblue-Azure-Darkblue Gradient */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-2.5 bg-gradient-to-r from-[#1A237E] via-[#00B0FF] to-[#1A237E] text-white font-bold rounded-xl shadow-md hover:shadow-[#00B0FF]/20 transform hover:scale-[1.01] transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2 text-sm"
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
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    <span>Sign In →</span>
                  </>
                )}
              </button>

              {/* Error Message */}
              {error && (
                <div className="mt-3.5 p-2.5 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 text-red-700 text-xs">
                    <svg className="w-4 h-4 flex-shrink-0 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{error}</span>
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* Footer - Light Grey Background, No Shadow */}
          <div className="bg-gray-200 px-5 py-3">
            <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-slate-600">
              <span className="flex items-center gap-1 font-medium">
                <svg className="w-3 h-3 text-[#1A237E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6-4h12a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6a2 2 0 012-2zm10-4V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Secure Portal
              </span>
              <span className="text-slate-400">•</span>
              <span className="hover:text-slate-800 transition-colors">Admin Access</span>
              <span className="text-slate-400">•</span>
              <span className="hover:text-slate-800 transition-colors">System Management</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;