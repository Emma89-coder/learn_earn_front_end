import React, { useEffect, useState } from 'react';
import axios from 'axios';
import API_URL from '../../config';

const LearnerBadges = () => {
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBadges = async () => {
      try {
        const { data } = await axios.get(`${API_URL}/api/learner/badges`);
        setBadges(data.badges || []);
      } catch (error) {
        console.error('Fetch learner badges error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBadges();
  }, []);

  return (
    <div className="p-6 bg-slate-950 min-h-screen text-slate-100">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="rounded-3xl border border-slate-700 bg-slate-900/90 p-6">
          <h1 className="text-3xl font-bold">Your Badges</h1>
          <p className="mt-2 text-slate-400">Badges you have earned appear below.</p>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((item) => (
              <div key={item} className="h-28 rounded-3xl bg-slate-900/80 animate-pulse" />
            ))}
          </div>
        ) : badges.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-700 bg-slate-900/80 p-8 text-center text-slate-400">
            <p className="text-lg font-medium">No badges earned yet.</p>
            <p className="mt-2">Complete quizzes and earn badges for your progress.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {badges.map((badge) => (
              <div key={badge.id} className="rounded-3xl border border-slate-700 bg-slate-900/90 p-5 shadow-lg">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-800 text-3xl">
                    {badge.icon_url ? <img src={badge.icon_url} alt={badge.name} className="h-14 w-14 object-contain" /> : '🏅'}
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">{badge.name}</h2>
                    <p className="text-sm text-slate-400">{badge.criteria}</p>
                  </div>
                </div>
                <p className="mt-4 text-slate-300">{badge.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LearnerBadges;
