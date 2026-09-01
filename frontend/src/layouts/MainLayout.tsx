import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LogOut, LayoutDashboard, Trophy, Users, FileCheck, UserCog, User, ShieldCheck, Key, MapPin, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import api from '../lib/api';

export default function MainLayout() {
  const { user, logout, updateUser } = useAuth();
  const location = useLocation();

  // Profile Modal State
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileTab, setProfileTab] = useState<'profile' | 'password'>('profile');
  
  // Profile edit fields
  const [editName, setEditName] = useState(user?.name || '');
  const [editPhone, setEditPhone] = useState(user?.phone || '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');
  const [profileErr, setProfileErr] = useState('');

  // Password change fields & step-by-step verification
  const [passwordStep, setPasswordStep] = useState<1 | 2>(1);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordVerifying, setPasswordVerifying] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState('');
  const [passwordErr, setPasswordErr] = useState('');

  const openProfile = () => {
    setEditName(user?.name || '');
    setEditPhone(user?.phone || '');
    setProfileMsg('');
    setProfileErr('');
    setPasswordStep(1);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordMsg('');
    setPasswordErr('');
    setShowProfileModal(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) {
      setProfileErr('Full name is required.');
      return;
    }
    setProfileSaving(true);
    setProfileMsg('');
    setProfileErr('');
    try {
      const res = await api.put('/auth/profile', { name: editName, phone: editPhone });
      if (res.data.user) {
        updateUser(res.data.user);
      }
      setProfileMsg('Profile updated successfully!');
    } catch (err: any) {
      setProfileErr(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleVerifyCurrentPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !currentPassword.trim()) {
      setPasswordErr('Please enter your current password.');
      return;
    }
    setPasswordVerifying(true);
    setPasswordErr('');
    setPasswordMsg('');
    try {
      await api.post('/auth/verify-current-password', { currentPassword });
      setPasswordStep(2);
      setPasswordErr('');
    } catch (err: any) {
      setPasswordErr(err.response?.data?.error || 'Current password is wrong');
    } finally {
      setPasswordVerifying(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      setPasswordErr('Please enter your current password.');
      setPasswordStep(1);
      return;
    }
    if (newPassword.length < 6) {
      setPasswordErr('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordErr('New password and confirm password do not match.');
      return;
    }
    setPasswordSaving(true);
    setPasswordMsg('');
    setPasswordErr('');
    try {
      const res = await api.post('/auth/change-password', { currentPassword, newPassword });
      setPasswordMsg(res.data.message || 'Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordStep(1);
    } catch (err: any) {
      setPasswordErr(err.response?.data?.error || 'Failed to change password');
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <div className="app-shell flex flex-col min-h-screen font-sans text-[#0b1c30]">
      {/* Glassmorphism Header */}
      <header className="glass-header sticky top-0 z-50 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to={user?.role === 'admin' ? '/admin' : '/operator'} className="flex items-center gap-3 group">
              <img 
                src="/assets/logo.png" 
                alt="Smart Sportz Logo" 
                className="h-10 w-auto object-contain transition-transform group-hover:scale-105"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <div className="flex flex-col">
                <span className="font-heading font-extrabold text-xl tracking-tight text-[#0b1c30] leading-tight">
                  Smart Sportz
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#006c40]">
                  Enterprise Sports SaaS
                </span>
              </div>
            </Link>
            
            {user && (
              <nav className="hidden md:flex items-center">
                <div className="nav-pill-group">
                  {user.role === 'admin' ? (
                    <>
                      <Link 
                        to="/admin" 
                        className={`nav-pill-item ${location.pathname === '/admin' ? 'active' : ''}`}
                      >
                        <LayoutDashboard className="w-4 h-4" /> Dashboard
                      </Link>
                      <Link 
                        to="/admin/tournaments" 
                        className={`nav-pill-item ${location.pathname.startsWith('/admin/tournaments') ? 'active' : ''}`}
                      >
                        <Trophy className="w-4 h-4" /> Tournaments
                      </Link>
                      <Link 
                        to="/admin/operators" 
                        className={`nav-pill-item ${location.pathname === '/admin/operators' ? 'active' : ''}`}
                      >
                        <UserCog className="w-4 h-4" /> Operators
                      </Link>
                      <Link 
                        to="/admin/teams" 
                        className={`nav-pill-item ${location.pathname === '/admin/teams' ? 'active' : ''}`}
                      >
                        <Users className="w-4 h-4" /> Teams
                      </Link>
                      <Link 
                        to="/admin/payments" 
                        className={`nav-pill-item ${location.pathname === '/admin/payments' ? 'active' : ''}`}
                      >
                        <FileCheck className="w-4 h-4" /> Payments
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link 
                        to="/operator" 
                        className={`nav-pill-item ${location.pathname === '/operator' ? 'active' : ''}`}
                      >
                        <Trophy className="w-4 h-4" /> Tournaments
                      </Link>
                      <Link 
                        to="/teams" 
                        className={`nav-pill-item ${location.pathname === '/teams' ? 'active' : ''}`}
                      >
                        <Users className="w-4 h-4" /> Teams
                      </Link>
                    </>
                  )}
                </div>
              </nav>
            )}
          </div>

          {user && (
            <div className="flex items-center gap-3">
              {/* Profile Badge & Logo Trigger */}
              <button 
                type="button"
                onClick={openProfile}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-white/90 border border-[#dbe5f5] hover:border-[#006c40] hover:shadow-sm text-xs transition-all cursor-pointer group"
                title="View Profile & Settings"
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#006c40] to-[#0b8852] text-white flex items-center justify-center font-bold text-[11px] shadow-xs">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="font-bold text-[#0b1c30] group-hover:text-[#006c40] leading-none">
                    {user.name}
                  </span>
                  <span className="text-[9px] uppercase font-extrabold text-[#5c6878] tracking-wider mt-0.5">
                    {user.role === 'admin' ? 'Super Admin' : 'Manager / Op'}
                  </span>
                </div>
              </button>

              <Button 
                variant="outline" 
                size="sm" 
                onClick={logout} 
                className="text-[#5c6878] hover:text-rose-600 hover:border-rose-200 h-9"
              >
                <LogOut className="w-3.5 h-3.5 mr-1.5" /> Logout
              </Button>
            </div>
          )}
        </div>
      </header>

      {/* Profile & Password Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#dbe5f5] max-w-lg w-full overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#006c40] to-[#0b8852] p-5 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-extrabold text-lg text-white border border-white/30">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div>
                  <h3 className="font-heading font-extrabold text-lg leading-tight">My Profile & Security</h3>
                  <p className="text-xs text-emerald-100">{user?.email}</p>
                </div>
              </div>
              <button 
                onClick={() => setShowProfileModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="flex border-b border-[#dbe5f5] bg-[#eff4ff]/40 p-2 gap-2">
              <button
                type="button"
                onClick={() => setProfileTab('profile')}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  profileTab === 'profile' ? 'bg-white text-[#006c40] shadow-xs' : 'text-[#5c6878] hover:text-[#0b1c30]'
                }`}
              >
                <User className="w-3.5 h-3.5" /> Profile Details
              </button>
              <button
                type="button"
                onClick={() => setProfileTab('password')}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  profileTab === 'password' ? 'bg-white text-[#006c40] shadow-xs' : 'text-[#5c6878] hover:text-[#0b1c30]'
                }`}
              >
                <Key className="w-3.5 h-3.5" /> Change Password
              </button>
            </div>

            {/* Tab 1: Profile Details */}
            {profileTab === 'profile' && (
              <form onSubmit={handleSaveProfile} className="p-6 space-y-4">
                {profileMsg && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                    <span>{profileMsg}</span>
                  </div>
                )}
                {profileErr && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{profileErr}</span>
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-[#5c6878] mb-1">Full Name</label>
                    <input 
                      type="text" 
                      value={editName} 
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#dbe5f5] text-sm focus:outline-hidden focus:border-[#006c40]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#5c6878] mb-1">Email Address</label>
                    <input 
                      type="email" 
                      value={user?.email || ''} 
                      disabled
                      className="w-full px-3 py-2 rounded-xl border border-[#dbe5f5] text-sm bg-gray-100 text-gray-500 cursor-not-allowed"
                    />
                    <span className="text-[11px] text-[#5c6878]">Email is your system identifier and cannot be changed here.</span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#5c6878] mb-1">Phone Number</label>
                    <input 
                      type="tel" 
                      value={editPhone} 
                      maxLength={10}
                      onChange={(e) => setEditPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      className="w-full px-3 py-2 rounded-xl border border-[#dbe5f5] text-sm focus:outline-hidden focus:border-[#006c40]"
                      placeholder="10-digit mobile number"
                    />
                  </div>

                  {/* Role & Allocated Cities Display */}
                  <div className="bg-[#eff4ff]/60 border border-[#dbe5f5] rounded-xl p-3.5 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[#5c6878] font-bold">Assigned Role:</span>
                      <span className="px-2 py-0.5 rounded-md bg-[#eaf4e4] text-[#006c40] font-extrabold uppercase text-[10px]">
                        {user?.role === 'admin' ? 'Super Administrator' : 'Regional Operator'}
                      </span>
                    </div>

                    {user?.role === 'operator' && (
                      <div className="pt-2 border-t border-[#dbe5f5]/60">
                        <span className="text-[#5c6878] font-bold text-xs flex items-center gap-1 mb-1.5">
                          <MapPin className="w-3.5 h-3.5 text-[#006c40]" /> Allocated Cities / Regions:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {user?.allocated_places && user.allocated_places.length > 0 ? (
                            user.allocated_places.map((place: string) => (
                              <span key={place} className="px-2 py-0.5 rounded-md bg-white border border-[#dbe5f5] text-[#0b1c30] text-[11px] font-bold">
                                {place}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-gray-400 italic">No specific regions allocated</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 flex justify-end gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowProfileModal(false)}>
                    Close
                  </Button>
                  <Button type="submit" disabled={profileSaving} size="sm" className="bg-[#006c40] hover:bg-[#0b8852] text-white">
                    {profileSaving ? 'Saving...' : 'Save Profile'}
                  </Button>
                </div>
              </form>
            )}

            {/* Tab 2: Change Password */}
            {profileTab === 'password' && (
              <div className="p-6 space-y-4">
                {passwordMsg && (
                  <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                    <span>{passwordMsg}</span>
                  </div>
                )}
                {passwordErr && (
                  <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{passwordErr}</span>
                  </div>
                )}

                {/* Step 1: Verify Current Password Only */}
                {passwordStep === 1 && (
                  <form onSubmit={handleVerifyCurrentPassword} className="space-y-4">
                    <div className="bg-[#eff4ff]/60 border border-[#dbe5f5] rounded-xl p-3.5 text-xs text-[#5c6878]">
                      Please enter your current account password to proceed with setting a new password.
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#5c6878] mb-1">Current Password *</label>
                      <input 
                        type="password" 
                        value={currentPassword} 
                        onChange={(e) => {
                          setCurrentPassword(e.target.value);
                          setPasswordErr('');
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-[#dbe5f5] text-sm focus:outline-hidden focus:border-[#006c40]"
                        placeholder="Enter your current password"
                        required
                        autoFocus
                      />
                    </div>

                    <div className="pt-3 flex justify-end gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => setShowProfileModal(false)}>
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={passwordVerifying || !currentPassword.trim()} 
                        size="sm" 
                        className="bg-[#006c40] hover:bg-[#0b8852] text-white cursor-pointer"
                      >
                        {passwordVerifying ? 'Verifying...' : 'Next →'}
                      </Button>
                    </div>
                  </form>
                )}

                {/* Step 2: Set New Password & Confirm */}
                {passwordStep === 2 && (
                  <form onSubmit={handleChangePassword} className="space-y-4">
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-800 flex items-center justify-between">
                      <span className="flex items-center gap-1.5 font-bold">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Current Password Verified
                      </span>
                      <button 
                        type="button" 
                        onClick={() => {
                          setPasswordStep(1);
                          setNewPassword('');
                          setConfirmPassword('');
                          setPasswordErr('');
                        }}
                        className="text-[11px] underline text-emerald-700 hover:text-emerald-900 cursor-pointer font-bold"
                      >
                        Change
                      </button>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-[#5c6878] mb-1">New Password *</label>
                        <input 
                          type="password" 
                          value={newPassword} 
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-[#dbe5f5] text-sm focus:outline-hidden focus:border-[#006c40]"
                          placeholder="Minimum 6 characters"
                          required
                          autoFocus
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#5c6878] mb-1">Confirm New Password *</label>
                        <input 
                          type="password" 
                          value={confirmPassword} 
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-[#dbe5f5] text-sm focus:outline-hidden focus:border-[#006c40]"
                          placeholder="Confirm new password"
                          required
                        />
                      </div>
                    </div>

                    <div className="pt-3 flex justify-between items-center gap-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                          setPasswordStep(1);
                          setNewPassword('');
                          setConfirmPassword('');
                          setPasswordErr('');
                        }}
                      >
                        ← Back
                      </Button>

                      <div className="flex gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={() => setShowProfileModal(false)}>
                          Cancel
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={passwordSaving} 
                          size="sm" 
                          className="bg-[#006c40] hover:bg-[#0b8852] text-white cursor-pointer"
                        >
                          {passwordSaving ? 'Updating...' : 'Update Password'}
                        </Button>
                      </div>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Outlet />
      </main>

      {/* Complete Smart Sportz Footer */}
      <footer className="bg-white border-t border-[#dbe5f5] mt-auto pt-12 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Top Brand & Socials Section */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-8 border-b border-[#dbe5f5]">
            <div className="space-y-2 max-w-md">
              <div className="flex items-center gap-3">
                <img 
                  src="/assets/logo.png" 
                  alt="Smart Sportz" 
                  className="h-9 w-auto object-contain"
                  onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                />
                <span className="font-heading font-extrabold text-xl tracking-tight text-[#0b1c30]">SmartSportz.in</span>
              </div>
              <p className="text-xs text-[#5c6878] leading-relaxed">
                Enterprise sports tournament management for registrations, payments, live scoring, and athletic analytics.
              </p>
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-3">
              {/* LinkedIn */}
              <a 
                href="https://www.linkedin.com/in/smart-sportz-in-825454430/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-9 h-9 rounded-xl border border-[#dbe5f5] bg-[#eff4ff]/60 hover:bg-[#eaf4e4] hover:text-[#006c40] text-[#5c6878] flex items-center justify-center transition-colors"
                aria-label="LinkedIn"
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </a>
              {/* Instagram */}
              <a 
                href="https://www.instagram.com/smartsportz.in/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-9 h-9 rounded-xl border border-[#dbe5f5] bg-[#eff4ff]/60 hover:bg-[#eaf4e4] hover:text-[#006c40] text-[#5c6878] flex items-center justify-center transition-colors"
                aria-label="Instagram"
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                </svg>
              </a>
              {/* Facebook */}
              <a 
                href="https://www.facebook.com/profile.php?id=61593795923695" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-9 h-9 rounded-xl border border-[#dbe5f5] bg-[#eff4ff]/60 hover:bg-[#eaf4e4] hover:text-[#006c40] text-[#5c6878] flex items-center justify-center transition-colors"
                aria-label="Facebook"
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              {/* WhatsApp */}
              <a 
                href="https://whatsapp.com/channel/0029VbDXEhUGehENTglonS34" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-9 h-9 rounded-xl border border-[#dbe5f5] bg-[#eff4ff]/60 hover:bg-[#eaf4e4] hover:text-[#006c40] text-[#5c6878] flex items-center justify-center transition-colors"
                aria-label="WhatsApp"
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </a>
              {/* YouTube */}
              <a 
                href="https://youtube.com/@smartsportzin?si=GaemsUBAiH1ybYQc" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-9 h-9 rounded-xl border border-[#dbe5f5] bg-[#eff4ff]/60 hover:bg-[#eaf4e4] hover:text-[#006c40] text-[#5c6878] flex items-center justify-center transition-colors"
                aria-label="YouTube"
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* 3-Column Navigation Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 py-8 border-b border-[#dbe5f5] text-xs">
            <div className="space-y-3 flex flex-col">
              <span className="font-extrabold text-[#0b1c30] uppercase tracking-wider">Platform</span>
              <Link to="/operator" className="text-[#5c6878] hover:text-[#006c40] transition-colors">Tournaments</Link>
              <Link to="/teams" className="text-[#5c6878] hover:text-[#006c40] transition-colors">Teams & Rosters</Link>
              <Link to="/admin/payments" className="text-[#5c6878] hover:text-[#006c40] transition-colors">Passes & Verification</Link>
            </div>
            <div className="space-y-3 flex flex-col">
              <span className="font-extrabold text-[#0b1c30] uppercase tracking-wider">Resources</span>
              <span className="text-[#5c6878] hover:text-[#006c40] cursor-pointer">Tournament Rulebook</span>
              <span className="text-[#5c6878] hover:text-[#006c40] cursor-pointer">Event Gallery</span>
              <span className="text-[#5c6878] hover:text-[#006c40] cursor-pointer">Frequently Asked Questions</span>
            </div>
            <div className="space-y-3 flex flex-col">
              <span className="font-extrabold text-[#0b1c30] uppercase tracking-wider">Company</span>
              <span className="text-[#5c6878] hover:text-[#006c40] cursor-pointer">About Smart Sportz</span>
              <span className="text-[#5c6878] hover:text-[#006c40] cursor-pointer">Contact & Support</span>
              <span className="text-[#5c6878] hover:text-[#006c40] cursor-pointer">Sponsors & Partners</span>
            </div>
          </div>

          {/* Rights Banner */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-6 text-[11px] text-[#5c6878]">
            <div>
              all rights received by <strong className="text-[#0b1c30]">smartsportz.in@2026</strong>
            </div>
            <div>
              powered by <strong className="text-[#006c40]">Brillaris Global Pro</strong>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

