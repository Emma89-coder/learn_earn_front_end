// src/screens/learners/RewardsStore.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import API_URL from '../../config';
import { 
  X, Search, Gift, Sparkles, CheckCircle, Clock, Tag, Copy, Check, 
  Award, Star, AlertCircle, RefreshCw, Trash2, Loader2, ShoppingBag,
  Wallet, History, ArrowLeft, Eye, EyeOff
} from 'lucide-react';

const RewardsStore = () => {
  const { user, logout } = useAuth();
  const { settings: theme, getPageStyles } = useTheme();
  const navigate = useNavigate();
  
  // ─── Theme Colors ───
  const accentColor = theme?.accentColor || '#14b8a6';
  const headingColor = theme?.headingColor || '#ffffff';
  const bodyColor = theme?.bodyColor || '#e2e8f0';  // Ice white for dark backgrounds
  const bgColor = theme?.bgColor || '#003B46';
  const cardBg = theme?.cardBg || '#003B46';
  const headerBg = theme?.headerBg || '#003B46';
  const borderRadius = theme?.borderRadius || '12';
  const fontFamily = theme?.fontFamily || '"Segoe UI", Calibri, "Trebuchet MS"';

  // ─── State ───
  const [rewards, setRewards] = useState([]);
  const [points, setPoints] = useState({ current: 0, lifetime: 0 });
  const [loading, setLoading] = useState(true);
  const [redeemingId, setRedeemingId] = useState(null);
  const [selectedReward, setSelectedReward] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [activeTab, setActiveTab] = useState('store');
  const [redemptions, setRedemptions] = useState([]);
  const [loadingRedemptions, setLoadingRedemptions] = useState(false);
  const [copiedVoucher, setCopiedVoucher] = useState(null);
  const [refundingId, setRefundingId] = useState(null);
  const [showRefundConfirm, setShowRefundConfirm] = useState(false);
  const [refundTarget, setRefundTarget] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('portal-theme');
    return saved ? saved === 'dark' : true;
  });
  const [showBalance, setShowBalance] = useState(true);
  const [viewMode, setViewMode] = useState('grid');

  // ─── Effects ───
  useEffect(() => {
    localStorage.setItem('portal-theme', isDarkMode ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  useEffect(() => {
    fetchData();
    fetchRedemptions();
  }, []);

  // ─── API Calls ───
  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [pointsRes, rewardsRes] = await Promise.all([
        axios.get(`${API_URL}/api/learner/balance`, { headers }),
        axios.get(`${API_URL}/api/learner/rewards`, { headers })
      ]);

      setPoints({
        current: pointsRes.data.current_points || 0,
        lifetime: pointsRes.data.lifetime_points || 0
      });
      
      const activeRewards = (rewardsRes.data.rewards || []).filter(r => r.is_active !== false);
      setRewards(activeRewards);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Could not load rewards');
    } finally {
      setLoading(false);
    }
  };

  const fetchRedemptions = async () => {
    try {
      setLoadingRedemptions(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        setRedemptions([]);
        return;
      }
      
      const res = await axios.get(`${API_URL}/api/learner/redemptions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data.success) {
        const data = (res.data.redemptions || []).filter(r => {
          const status = (r.status || '').toLowerCase();
          return status !== 'refunded' && status !== 'deleted' && status !== 'refund';
        });
        setRedemptions(data);
      } else {
        setRedemptions([]);
      }
    } catch (error) {
      console.error('Error fetching redemptions:', error);
      setRedemptions([]);
    } finally {
      setLoadingRedemptions(false);
    }
  };

  // ─── Redemption ───
  const handleRedeem = async (reward) => {
    try {
      setRedeemingId(reward.id);
      const token = localStorage.getItem('token');
      
      const response = await axios.post(
        `${API_URL}/api/learner/redeem-reward`,
        { rewardId: reward.id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        toast.success(response.data.message || 'Reward redeemed! 🎉', { duration: 4000 });
        
        if (response.data.points_remaining !== undefined) {
          setPoints(prev => ({ ...prev, current: response.data.points_remaining }));
        }

        await Promise.all([fetchRedemptions(), fetchData()]);
        setShowDialog(false);
        setSelectedReward(null);
      } else {
        toast.error(response.data.error || 'Failed to redeem');
      }
    } catch (error) {
      console.error('Redeem error:', error);
      toast.error('Failed to redeem reward');
    } finally {
      setRedeemingId(null);
    }
  };

  // ─── Refund ───
  const requestRefund = (redemption) => {
    setRefundTarget(redemption);
    setShowRefundConfirm(true);
  };

  const confirmRefund = async () => {
    if (!refundTarget) return;
    
    try {
      setRefundingId(refundTarget.id);
      const token = localStorage.getItem('token');
      
      const response = await axios.post(
        `${API_URL}/api/learner/request-refund`,
        { redemptionId: refundTarget.id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        toast.success('Refund request submitted!', { duration: 4000 });
        setTimeout(() => fetchRedemptions(), 500);
        setShowRefundConfirm(false);
        setRefundTarget(null);
      } else {
        toast.error(response.data.message || 'Failed to request refund');
      }
    } catch (error) {
      console.error('Refund error:', error);
      toast.error('Could not request refund');
    } finally {
      setRefundingId(null);
    }
  };

  // ─── Helpers ───
  const copyVoucher = (code) => {
    if (!code) return;
    navigator.clipboard.writeText(code).then(() => {
      setCopiedVoucher(code);
      toast.success('Voucher copied!');
      setTimeout(() => setCopiedVoucher(null), 2000);
    }).catch(() => toast.error('Failed to copy'));
  };

  const getStockStatus = (stock) => {
    if (stock === undefined || stock === null) return { label: 'Unlimited', color: '#5eead4', icon: '∞' };
    if (stock === 0) return { label: 'Out of Stock', color: '#f87171', icon: '❌' };
    if (stock < 10) return { label: 'Low Stock', color: '#fbbf24', icon: '⚠️' };
    return { label: 'In Stock', color: '#5eead4', icon: '✓' };
  };

  const formatPoints = (num) => num?.toLocaleString() || '0';

  // ─── Render Reward Image ───
  const renderRewardImage = (reward, className = 'w-full h-full object-contain') => {
    if (!reward?.image_url) {
      return <span className="text-4xl">🎁</span>;
    }
    const scale = reward.image_scale || 1;
    return (
      <img 
        src={reward.image_url} 
        alt={reward.name}
        className={className}
        style={{ transform: `scale(${scale})` }}
        onError={(e) => {
          e.target.style.display = 'none';
          e.target.parentElement.innerHTML = '<span class="text-4xl">🎁</span>';
        }}
      />
    );
  };

  // ─── Filter Rewards ───
  const filteredRewards = rewards.filter(r => {
    if (searchTerm && !r.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return r.is_active !== false;
  });

  // ─── Stats ───
  const stats = {
    total: rewards.length,
    available: rewards.filter(r => r.stock_quantity === undefined || r.stock_quantity > 0).length,
    points: points.current,
    lifetime: points.lifetime
  };

  const pendingRedemptions = redemptions.filter(r => !r.collected && r.status !== 'pending_refund');
  const collectedRedemptions = redemptions.filter(r => r.collected);

  // ─── Component: Voucher Card ───
  const VoucherCard = ({ redemption }) => {
    const isCollected = redemption.collected;
    const voucherNumber = redemption.voucher_number || '—';
    const isCopied = copiedVoucher === voucherNumber;
    const status = (redemption.status || '').toLowerCase();

    if (['refunded', 'deleted', 'refund'].includes(status)) return null;

    return (
      <div 
        className={`relative rounded-lg border-2 overflow-hidden transition-all duration-300 hover:shadow-xl
          ${isCollected ? 'border-green-500/50' : 'border-teal-500/50'}`}
        style={{
          backgroundColor: isDarkMode ? 'rgb(30 41 59)' : `${cardBg}80`,
          borderColor: isCollected ? '#22c55e' : (isDarkMode ? 'rgb(45 212 191)' : accentColor),
          borderRadius: `${borderRadius}px`
        }}
      >
        <div className={`px-4 py-2 flex items-center justify-between ${isCollected ? 'bg-green-600' : 'bg-teal-600'}`} style={!isDarkMode && !isCollected ? { backgroundColor: accentColor } : {}}>
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-white" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">VOUCHER</span>
          </div>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
            isCollected 
              ? 'bg-green-700 text-white' 
              : status === 'pending_refund'
              ? 'bg-amber-700 text-white'
              : 'bg-teal-700 text-white'
          }`} style={!isDarkMode && !isCollected && status !== 'pending_refund' ? { backgroundColor: accentColor } : {}}>
            {isCollected ? 'COLLECTED' : status === 'pending_refund' ? 'REFUND REQUESTED' : 'ACTIVE'}
          </span>
        </div>

        <div className="p-4 space-y-3">
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-widest" style={{ color: isDarkMode ? '#94a3b8' : bodyColor }}>Voucher Number</p>
            <div className="flex items-center justify-center gap-2 mt-1">
              <span className="font-mono font-bold text-lg tracking-wider" style={{ color: isDarkMode ? '#e2e8f0' : headingColor }}>
                {voucherNumber}
              </span>
              <button
                onClick={() => copyVoucher(voucherNumber)}
                className="p-1.5 rounded-lg transition border" style={{ 
                  backgroundColor: isDarkMode ? 'rgb(30 41 59)' : `${accentColor}20`, 
                  borderColor: isDarkMode ? 'rgb(51 65 85)' : accentColor 
                }}
              >
                {isCopied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" style={{ color: isDarkMode ? '#94a3b8' : accentColor }} />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-center text-xs border-t border-b border-dashed py-2" style={{ borderColor: isDarkMode ? 'rgb(51 65 85)' : `${accentColor}40` }}>
            <div>
              <p style={{ color: isDarkMode ? '#94a3b8' : bodyColor }}>Winner</p>
              <p className="font-semibold" style={{ color: isDarkMode ? '#e2e8f0' : headingColor }}>
                {user?.full_name || user?.username || 'Learner'}
              </p>
            </div>
            <div>
              <p style={{ color: isDarkMode ? '#94a3b8' : bodyColor }}>Points Used</p>
              <p className="font-semibold" style={{ color: isDarkMode ? '#5eead4' : accentColor }}>
                💎 {redemption.points_spent}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border" style={{ 
              backgroundColor: isDarkMode ? 'rgb(30 41 59)' : `${accentColor}20`, 
              borderColor: isDarkMode ? 'rgb(51 65 85)' : accentColor 
            }}>
              <Gift className="w-4 h-4" style={{ color: isDarkMode ? '#94a3b8' : accentColor }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate" style={{ color: isDarkMode ? '#e2e8f0' : headingColor }}>
                {redemption.reward_name || 'Gift'}
              </p>
              <p className="text-[10px]" style={{ color: isDarkMode ? '#94a3b8' : bodyColor }}>
                {new Date(redemption.redeemed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          </div>

          {!isCollected && status !== 'pending_refund' && (
            <button
              onClick={() => requestRefund(redemption)}
              disabled={refundingId === redemption.id}
              className="w-full py-1.5 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1 border" style={{ 
                borderColor: isDarkMode ? 'rgb(239 68 68)' : '#f87171', 
                color: isDarkMode ? 'rgb(248 113 113)' : '#f87171' 
              }}
            >
              {refundingId === redemption.id ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <RefreshCw className="w-3 h-3" />
              )}
              Request Refund
            </button>
          )}
        </div>
      </div>
    );
  };

  // ─── Component: Refund Dialog ───
  const RefundDialog = () => {
    if (!showRefundConfirm || !refundTarget) return null;
    
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="max-w-md w-full rounded-2xl p-6 shadow-2xl border-2" style={{
          backgroundColor: isDarkMode ? 'rgb(30 41 59)' : cardBg,
          borderColor: isDarkMode ? 'rgb(45 212 191)' : accentColor
        }}>
          <h3 className="text-lg font-bold mb-2" style={{ color: isDarkMode ? '#f1f5f9' : headingColor }}>
            Request Refund
          </h3>
          <p className="text-sm mb-4" style={{ color: isDarkMode ? '#94a3b8' : bodyColor }}>
            Are you sure you want to request a refund for "<strong>{refundTarget.reward_name}</strong>"?
          </p>
          <div className="p-3 rounded-lg mb-4 border" style={{ 
            backgroundColor: isDarkMode ? 'rgb(251 191 36 / 0.1)' : `${accentColor}20`, 
            borderColor: isDarkMode ? 'rgb(251 191 36 / 0.3)' : `${accentColor}40` 
          }}>
            <p className="text-xs" style={{ color: isDarkMode ? '#fcd34d' : '#fbbf24' }}>
              ⚠️ This will return <strong>{refundTarget.points_spent}</strong> points to your balance.
              The voucher will be cancelled. An admin must approve this request.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => { setShowRefundConfirm(false); setRefundTarget(null); }}
              className="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition border-2" style={{
                borderColor: isDarkMode ? 'rgb(51 65 85)' : `${accentColor}40`,
                color: isDarkMode ? '#94a3b8' : bodyColor
              }}
            >
              Cancel
            </button>
            <button
              onClick={confirmRefund}
              disabled={refundingId === refundTarget.id}
              className="flex-1 px-4 py-2 rounded-lg text-sm font-bold text-white transition shadow-md"
              style={{ backgroundColor: '#f59e0b' }}
            >
              {refundingId === refundTarget.id ? (
                <Loader2 className="w-4 h-4 animate-spin mx-auto" />
              ) : (
                'Request Refund'
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ─── Component: Reward Dialog ───
  const RewardDialog = () => {
    if (!showDialog || !selectedReward) return null;
    const reward = selectedReward;
    const isOutOfStock = reward.stock_quantity !== undefined && reward.stock_quantity <= 0;
    const canRedeem = !isOutOfStock && points.current >= reward.points_required;
    const deficit = reward.points_required - points.current;
    const stockLow = reward.stock_quantity !== undefined && reward.stock_quantity > 0 && reward.stock_quantity < 10;
    const affordable = points.current >= reward.points_required;

    return (
      <div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-md"
        onClick={() => { setShowDialog(false); setSelectedReward(null); }}
      >
        <div
          className="relative w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl"
          style={{ backgroundColor: isDarkMode ? '#0f172a' : '#f8fafc' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-0 sm:hidden">
            <div className="w-9 h-1 rounded-full bg-white/20" />
          </div>

          {/* Hero banner with gradient overlay */}
          <div className="relative w-full h-52 sm:h-48 overflow-hidden"
               style={{ background: isDarkMode ? 'linear-gradient(135deg,#1e293b 0%,#0f2a35 100%)' : 'linear-gradient(135deg,#e0f2fe 0%,#d1fae5 100%)' }}>
            {renderRewardImage(reward, 'w-full h-full object-contain p-8')}
            {/* Bottom fade */}
            <div className="absolute inset-x-0 bottom-0 h-16 pointer-events-none"
                 style={{ background: isDarkMode ? 'linear-gradient(to top,#0f172a,transparent)' : 'linear-gradient(to top,#f8fafc,transparent)' }} />

            {/* Close */}
            <button
              onClick={() => { setShowDialog(false); setSelectedReward(null); }}
              className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center bg-black/40 hover:bg-black/60 transition backdrop-blur-sm"
            >
              <X size={14} className="text-white" />
            </button>

            {/* Stock pill */}
            {reward.stock_quantity !== undefined && (
              <span className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-[11px] font-bold text-white shadow-lg ${
                isOutOfStock ? 'bg-red-500' : stockLow ? 'bg-amber-500' : 'bg-emerald-500'
              }`}>
                {isOutOfStock ? '✕ Out of stock' : stockLow ? `⚠ ${reward.stock_quantity} left` : `✓ ${reward.stock_quantity} in stock`}
              </span>
            )}
          </div>

          {/* Body */}
          <div className="px-5 pt-3 pb-5 space-y-4">

            {/* Name + description */}
            <div>
              <h3 className="text-xl font-black tracking-tight" style={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>
                {reward.name}
              </h3>
              {reward.description && (
                <p className="mt-1 text-sm leading-relaxed opacity-75" style={{ color: isDarkMode ? '#cbd5e1' : '#334155' }}>
                  {reward.description}
                </p>
              )}
            </div>

            {/* Points summary cards */}
            <div className="grid grid-cols-2 gap-2">
              {/* Cost */}
              <div className="rounded-2xl p-3 text-center"
                   style={{ backgroundColor: isDarkMode ? '#1e293b' : '#fff', border: isDarkMode ? '1px solid #334155' : '1px solid #e2e8f0' }}>
                <p className="text-[10px] font-semibold uppercase tracking-widest mb-1"
                   style={{ color: isDarkMode ? '#64748b' : '#94a3b8' }}>Cost</p>
                <p className="text-2xl font-black leading-none" style={{ color: accentColor }}>
                  {reward.points_required.toLocaleString()}
                </p>
                <p className="text-[10px] mt-0.5" style={{ color: isDarkMode ? '#64748b' : '#94a3b8' }}>points</p>
              </div>

              {/* Balance */}
              <div className="rounded-2xl p-3 text-center"
                   style={{
                     backgroundColor: isDarkMode ? '#1e293b' : '#fff',
                     border: `1px solid ${affordable ? (isDarkMode ? '#166534' : '#bbf7d0') : (isDarkMode ? '#7f1d1d' : '#fecaca')}`
                   }}>
                <p className="text-[10px] font-semibold uppercase tracking-widest mb-1"
                   style={{ color: isDarkMode ? '#64748b' : '#94a3b8' }}>Your Balance</p>
                <p className="text-2xl font-black leading-none"
                   style={{ color: affordable ? '#34d399' : '#f87171' }}>
                  {points.current.toLocaleString()}
                </p>
                <p className="text-[10px] mt-0.5" style={{ color: isDarkMode ? '#64748b' : '#94a3b8' }}>points</p>
              </div>
            </div>

            {/* Deficit notice */}
            {!canRedeem && !isOutOfStock && (
              <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl"
                   style={{ backgroundColor: isDarkMode ? 'rgba(239,68,68,0.12)' : '#fef2f2', border: '1px solid rgba(239,68,68,0.3)' }}>
                <AlertCircle size={15} className="text-red-400 flex-shrink-0" />
                <p className="text-sm" style={{ color: isDarkMode ? '#fca5a5' : '#dc2626' }}>
                  You need <span className="font-bold">{deficit.toLocaleString()} more points</span> to redeem this reward.
                </p>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-2.5 pt-1">
              <button
                onClick={() => { setShowDialog(false); setSelectedReward(null); }}
                className="flex-1 py-3 rounded-2xl font-semibold text-sm transition-all hover:opacity-80"
                style={{
                  backgroundColor: isDarkMode ? '#1e293b' : '#f1f5f9',
                  color: isDarkMode ? '#94a3b8' : '#64748b',
                  border: isDarkMode ? '1px solid #334155' : '1px solid #e2e8f0'
                }}
              >
                Cancel
              </button>
              <button
                disabled={!canRedeem || redeemingId === reward.id}
                onClick={() => handleRedeem(reward)}
                className="flex-[2] py-3 rounded-2xl font-bold text-sm text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 active:scale-95"
                style={{
                  background: canRedeem
                    ? `linear-gradient(135deg, ${accentColor} 0%, ${accentColor}cc 100%)`
                    : 'linear-gradient(135deg, #475569 0%, #334155 100%)',
                  boxShadow: canRedeem ? `0 4px 20px ${accentColor}50` : 'none'
                }}
              >
                {redeemingId === reward.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isOutOfStock ? (
                  'Out of Stock'
                ) : !canRedeem ? (
                  `Need ${deficit.toLocaleString()} more pts`
                ) : (
                  <><Sparkles size={15} /> Redeem Now</>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ─── Main Render ───
  return (
    <div 
      className="min-h-screen w-full max-w-full transition-all duration-500"
      style={{
        ...getPageStyles('rewards'),
        background: isDarkMode
          ? 'linear-gradient(145deg, #0f172a 0%, #111827 55%, #10243c 100%)'
          : 'linear-gradient(145deg, #ecfef8 0%, #dbfbf2 55%, #c8f7ea 100%)',
        backgroundColor: bgColor || '#003B46',
        color: bodyColor || '#e2e8f0',
        fontFamily: `${fontFamily}, sans-serif`,
      }}
    >
      {isDarkMode && <div className="fixed inset-0 bg-slate-900 -z-10" />}

      {/* ─── Header ─── */}
      <header className="sticky top-0 z-40 border-b border-white/10 shadow-[0_20px_40px_-30px_rgba(0,0,0,0.55)]" style={{ background: isDarkMode ? 'linear-gradient(135deg, #0f172a 0%, #0b334f 100%)' : 'linear-gradient(135deg, #0c605c 0%, #0e7b75 100%)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => navigate('/learner-dashboard')}
                className="p-2 rounded-xl hover:bg-white/10 transition border border-white/20"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center border border-white/20 bg-white/5">
                  <img src="/logo.png" alt="Logo" className="w-6 h-6 object-contain brightness-0 invert" />
                </div>
                <div>
                  <h1 className="text-sm font-bold text-white">Rewards Store</h1>
                  <p className="text-[10px] text-white/75 font-semibold uppercase tracking-wider">Redeem your points</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowBalance(!showBalance)}
                className="p-2 rounded-xl hover:bg-white/10 transition border border-white/20"
              >
                {showBalance ? <Eye className="w-4 h-4 text-white" /> : <EyeOff className="w-4 h-4 text-white" />}
              </button>
              <div className="px-3 py-2 rounded-xl border border-white/20 bg-white/10 shadow-inner">
                <span className="text-yellow-300 text-xs">⭐</span>
                <span className="text-white text-xs font-semibold ml-1">
                  {showBalance ? formatPoints(points.current) : '••••'}
                </span>
              </div>
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-2 rounded-xl hover:bg-white/10 transition border border-white/20"
              >
                {isDarkMode ? '☀️' : '🌙'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ─── Main Content ─── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">

        {/* ─── Stats Bar ─── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="rounded-2xl p-3.5 text-center border shadow-sm" style={{
            backgroundColor: isDarkMode ? 'rgb(30 41 59 / 0.85)' : 'rgba(255,255,255,0.88)',
            borderColor: isDarkMode ? 'rgb(51 65 85)' : `${accentColor}35`
          }}>
            <p className="text-[10px] font-medium uppercase tracking-wider" style={{ color: isDarkMode ? '#94a3b8' : bodyColor }}>Points</p>
            <p className="text-lg font-bold" style={{ color: isDarkMode ? '#f1f5f9' : headingColor }}>{formatPoints(points.current)}</p>
          </div>
          <div className="rounded-2xl p-3.5 text-center border shadow-sm" style={{
            backgroundColor: isDarkMode ? 'rgb(30 41 59 / 0.85)' : 'rgba(255,255,255,0.88)',
            borderColor: isDarkMode ? 'rgb(51 65 85)' : `${accentColor}35`
          }}>
            <p className="text-[10px] font-medium uppercase tracking-wider" style={{ color: isDarkMode ? '#94a3b8' : bodyColor }}>Available</p>
            <p className="text-lg font-bold" style={{ color: isDarkMode ? '#f1f5f9' : headingColor }}>{stats.available}</p>
          </div>
          <div className="rounded-2xl p-3.5 text-center border shadow-sm" style={{
            backgroundColor: isDarkMode ? 'rgb(30 41 59 / 0.85)' : 'rgba(255,255,255,0.88)',
            borderColor: isDarkMode ? 'rgb(51 65 85)' : `${accentColor}35`
          }}>
            <p className="text-[10px] font-medium uppercase tracking-wider" style={{ color: isDarkMode ? '#94a3b8' : bodyColor }}>Total Rewards</p>
            <p className="text-lg font-bold" style={{ color: isDarkMode ? '#f1f5f9' : headingColor }}>{stats.total}</p>
          </div>
          <div className="rounded-2xl p-3.5 text-center border shadow-sm" style={{
            backgroundColor: isDarkMode ? 'rgb(30 41 59 / 0.85)' : 'rgba(255,255,255,0.88)',
            borderColor: isDarkMode ? 'rgb(51 65 85)' : `${accentColor}35`
          }}>
            <p className="text-[10px] font-medium uppercase tracking-wider" style={{ color: isDarkMode ? '#94a3b8' : bodyColor }}>Lifetime</p>
            <p className="text-lg font-bold" style={{ color: isDarkMode ? '#f1f5f9' : headingColor }}>{formatPoints(points.lifetime)}</p>
          </div>
        </div>

        {/* ─── Tabs ─── */}
        <div className="flex flex-wrap gap-2 mb-5 p-2 rounded-2xl border" style={{
          backgroundColor: isDarkMode ? 'rgb(15 23 42 / 0.7)' : 'rgba(255,255,255,0.7)',
          borderColor: isDarkMode ? 'rgb(51 65 85)' : `${accentColor}30`
        }}>
          <button
            onClick={() => setActiveTab('store')}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition flex items-center gap-2 border-2 ${
              activeTab === 'store'
                ? 'text-white'
                : isDarkMode 
                  ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700' 
                  : 'bg-white/10 text-white/70 border-white/20 hover:bg-white/20'
            }`}
            style={activeTab === 'store' ? { backgroundColor: accentColor, borderColor: accentColor } : {}}
          >
            <Gift className="w-4 h-4" />
            Store
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/20 text-white">{filteredRewards.length}</span>
          </button>
          <button
            onClick={() => { setActiveTab('vouchers'); fetchRedemptions(); }}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition flex items-center gap-2 border-2 ${
              activeTab === 'vouchers'
                ? 'text-white'
                : isDarkMode 
                  ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700' 
                  : 'bg-white/10 text-white/70 border-white/20 hover:bg-white/20'
            }`}
            style={activeTab === 'vouchers' ? { backgroundColor: accentColor, borderColor: accentColor } : {}}
          >
            <Tag className="w-4 h-4" />
            My Vouchers
            {redemptions.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/20 text-white">{redemptions.length}</span>
            )}
          </button>
        </div>

        {/* ─── VOUCHERS TAB ─── */}
        {activeTab === 'vouchers' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2 p-3 rounded-lg border" style={{
              backgroundColor: isDarkMode ? 'rgb(30 41 59)' : `${cardBg}60`,
              borderColor: isDarkMode ? 'rgb(51 65 85)' : `${accentColor}30`
            }}>
              <div>
                <h2 className="font-bold flex items-center gap-2" style={{ color: isDarkMode ? '#f1f5f9' : headingColor }}>
                  <Award className="w-5 h-5" style={{ color: isDarkMode ? '#5eead4' : accentColor }} />
                  My Vouchers
                </h2>
                <p className="text-xs" style={{ color: isDarkMode ? '#94a3b8' : bodyColor }}>
                  Show your voucher to collect your gift
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="px-2 py-0.5 rounded-full border border-amber-200" style={{
                  backgroundColor: isDarkMode ? 'rgb(251 191 36 / 0.1)' : `${accentColor}20`,
                  color: isDarkMode ? '#fcd34d' : '#fbbf24'
                }}>
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500 mr-1" />
                  {pendingRedemptions.length} pending
                </span>
                <span className="px-2 py-0.5 rounded-full border border-green-200" style={{
                  backgroundColor: isDarkMode ? 'rgb(52 211 153 / 0.1)' : `${accentColor}20`,
                  color: isDarkMode ? '#6ee7b7' : '#6ee7b7'
                }}>
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 mr-1" />
                  {collectedRedemptions.length} collected
                </span>
              </div>
            </div>

            {loadingRedemptions ? (
              <div className="p-12 text-center rounded-lg border" style={{
                backgroundColor: isDarkMode ? 'rgb(30 41 59)' : `${cardBg}40`,
                borderColor: isDarkMode ? 'rgb(51 65 85)' : `${accentColor}30`
              }}>
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" style={{ color: isDarkMode ? '#5eead4' : accentColor }} />
                <p className="text-sm" style={{ color: isDarkMode ? '#94a3b8' : bodyColor }}>Loading vouchers...</p>
              </div>
            ) : redemptions.length === 0 ? (
              <div className="text-center py-16 rounded-lg border" style={{
                backgroundColor: isDarkMode ? 'rgb(30 41 59)' : `${cardBg}40`,
                borderColor: isDarkMode ? 'rgb(51 65 85)' : `${accentColor}30`
              }}>
                <div className="inline-block p-4 rounded-lg mb-4 border" style={{
                  backgroundColor: isDarkMode ? 'rgb(45 212 191 / 0.1)' : `${accentColor}20`,
                  borderColor: isDarkMode ? 'rgb(45 212 191)' : accentColor
                }}>
                  <Tag className="w-10 h-10" style={{ color: isDarkMode ? '#5eead4' : accentColor }} />
                </div>
                <p className="text-lg font-semibold" style={{ color: isDarkMode ? '#f1f5f9' : headingColor }}>No vouchers yet</p>
                <p className="text-sm mt-1" style={{ color: isDarkMode ? '#94a3b8' : bodyColor }}>
                  Visit the Store and redeem your points!
                </p>
                <button
                  onClick={() => setActiveTab('store')}
                  className="mt-4 px-6 py-2 rounded-lg text-white font-medium transition border-2"
                  style={{ backgroundColor: accentColor, borderColor: accentColor }}
                >
                  <Gift className="w-4 h-4 inline mr-2" />
                  Browse Store
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {redemptions.map((r) => (
                  <VoucherCard key={r.id} redemption={r} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── STORE TAB ─── */}
        {activeTab === 'store' && (
          <>
            <div className="mb-4">
              <form onSubmit={(e) => { e.preventDefault(); setSearchTerm(searchInput.trim().toLowerCase()); }} className="flex gap-2 max-w-lg w-full">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => { setSearchInput(e.target.value); if (!e.target.value) setSearchTerm(''); }}
                    className="w-full px-3 py-2.5 pl-9 pr-8 rounded-xl text-sm focus:outline-none focus:ring-2 transition border-2"
                    style={!isDarkMode ? { 
                      backgroundColor: 'rgba(255,255,255,0.85)', 
                      borderColor: `${accentColor}40`, 
                      color: '#0f172a',
                    } : { 
                      backgroundColor: 'rgb(30 41 59 / 0.9)', 
                      borderColor: 'rgb(51 65 85)', 
                      color: '#e2e8f0' 
                    }}
                    placeholder="Search rewards..."
                  />
                  <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: isDarkMode ? '#64748b' : bodyColor }} />
                  {searchInput && (
                    <button
                      type="button"
                      onClick={() => { setSearchInput(''); setSearchTerm(''); }}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs transition-colors"
                      style={{ color: isDarkMode ? '#64748b' : bodyColor }}
                    >
                      ✕
                    </button>
                  )}
                </div>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-sm font-medium text-white transition border-2"
                  style={{ backgroundColor: accentColor, borderColor: accentColor }}
                >
                  Search
                </button>
              </form>
              {searchTerm && (
                <p className="text-xs mt-1" style={{ color: isDarkMode ? '#5eead4' : accentColor }}>
                  Showing results for: <span className="font-semibold">"{searchTerm}"</span> ({filteredRewards.length} found)
                </p>
              )}
            </div>

            <div className="rounded-[26px] border-2 overflow-hidden shadow-[0_20px_45px_-28px_rgba(15,23,42,0.45)]" style={{
              backgroundColor: isDarkMode ? 'rgb(30 41 59 / 0.92)' : 'rgba(255,255,255,0.72)',
              borderColor: isDarkMode ? 'rgb(51 65 85)' : `${accentColor}30`,
            }}>
              <div className="p-4 border-b-2 flex items-center justify-between" style={{
                backgroundColor: isDarkMode ? 'rgb(15 23 42 / 0.9)' : `${accentColor}18`,
                borderColor: isDarkMode ? 'rgb(51 65 85)' : `${accentColor}30`
              }}>
                <div>
                  <h2 className="font-bold flex items-center gap-2" style={{ color: isDarkMode ? '#f1f5f9' : headingColor }}>
                    <Gift className="w-5 h-5" style={{ color: isDarkMode ? '#5eead4' : accentColor }} />
                    Reward Collection
                  </h2>
                  <p className="text-xs" style={{ color: isDarkMode ? '#94a3b8' : bodyColor }}>Browse and redeem your rewards</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                    className="p-2 rounded-lg transition border" style={{
                      borderColor: isDarkMode ? 'rgb(51 65 85)' : `${accentColor}40`
                    }}
                  >
                    {viewMode === 'grid' ? '📋' : '📐'}
                  </button>
                  <span className="px-3 py-1 rounded-full text-[10px] font-semibold border-2" style={{
                    backgroundColor: isDarkMode ? 'rgb(45 212 191 / 0.1)' : `${accentColor}20`,
                    color: isDarkMode ? '#e2e8f0' : headingColor,
                    borderColor: isDarkMode ? 'rgb(51 65 85)' : accentColor
                  }}>
                    {filteredRewards.length} items
                  </span>
                </div>
              </div>

              <div className="p-4 max-h-[65vh] overflow-y-auto custom-scrollbar">
                {loading ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {[...Array(8)].map((_, i) => (
                      <div key={i} className="rounded-2xl overflow-hidden animate-pulse aspect-[4/5]" style={{
                        backgroundColor: isDarkMode ? 'rgb(51 65 85)' : `${accentColor}20`
                      }}>
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="w-12 h-12 rounded-full" style={{
                            backgroundColor: isDarkMode ? 'rgb(71 85 105)' : bodyColor
                          }} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filteredRewards.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="text-5xl mb-4">🎁</div>
                    <p className="text-lg font-semibold" style={{ color: isDarkMode ? '#f1f5f9' : headingColor }}>
                      {searchTerm ? 'No rewards found' : 'No rewards available'}
                    </p>
                    <p className="text-sm mt-2" style={{ color: isDarkMode ? '#94a3b8' : bodyColor }}>
                      {searchTerm ? 'Try searching for something else' : 'Check back later for exciting rewards!'}
                    </p>
                  </div>
                ) : (
                  <div className={`grid ${viewMode === 'grid' ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4' : 'grid-cols-1'} gap-4`}>
                    {filteredRewards.map((reward) => {
                      const stockStatus = getStockStatus(reward.stock_quantity);
                      const isOutOfStock = reward.stock_quantity !== undefined && reward.stock_quantity <= 0;
                      
                      return (
                        <div
                          key={reward.id}
                          onClick={() => !isOutOfStock && setSelectedReward(reward) && setShowDialog(true)}
                          className={`group rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer border ${isOutOfStock ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg hover:-translate-y-1'}`}
                          style={{
                            backgroundColor: isDarkMode ? 'rgb(15 23 42 / 0.75)' : 'rgba(255,255,255,0.94)',
                            borderColor: isDarkMode ? 'rgb(51 65 85)' : `${accentColor}35`,
                          }}
                        >
                          <div className="p-3.5 flex flex-col h-full">
                            <div className="w-full aspect-square rounded-xl overflow-hidden flex items-center justify-center mb-3 border" style={{
                              backgroundColor: isDarkMode ? 'rgb(15 23 42)' : `${accentColor}16`,
                              borderColor: isDarkMode ? 'rgb(51 65 85)' : `${accentColor}30`
                            }}>
                              {renderRewardImage(reward, 'w-full h-full object-contain p-2')}
                            </div>
                            
                            <p className="text-sm font-bold text-center leading-tight min-h-[36px]" style={{ color: isDarkMode ? '#e2e8f0' : '#0f172a' }}>
                              {reward.name}
                            </p>
                            
                            <div className="mt-2 inline-flex items-center justify-center gap-1 self-center rounded-full px-3 py-1 text-xs font-semibold" style={{
                              backgroundColor: isDarkMode ? 'rgb(45 212 191 / 0.16)' : `${accentColor}18`,
                              color: isDarkMode ? '#5eead4' : '#0f766e'
                            }}>
                              {reward.points_required} points
                            </div>

                            <div className="mt-2 text-[11px] text-center font-medium" style={{ color: stockStatus.color }}>
                              {stockStatus.label}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>

      {/* ─── Dialogs ─── */}
      <RewardDialog />
      <RefundDialog />

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { 
          background: ${isDarkMode ? '#475569' : 'rgba(255,255,255,0.2)'};
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: ${isDarkMode ? '#64748b' : 'rgba(255,255,255,0.3)'};
        }
      `}</style>
    </div>
  );
};

export default RewardsStore;