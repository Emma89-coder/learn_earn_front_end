import React from 'react';
import { useNavigate } from 'react-router-dom';
import ThemeSettings from '../../components/admin/ThemeSettings';

const AdminAppearance = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Appearance</h1>
            <p className="text-slate-300">Hardcoded appearance settings for the admin experience.</p>
          </div>
          <button
            onClick={() => navigate('/admin-dashboard')}
            className="px-4 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-500"
          >
            Back
          </button>
        </div>

        <div className="rounded-2xl border border-slate-700 bg-slate-800 p-6">
          <ThemeSettings />
        </div>
      </div>
    </div>
  );
};

export default AdminAppearance;
