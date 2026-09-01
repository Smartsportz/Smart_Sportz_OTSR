import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import api from '../lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Lock, Mail, ShieldCheck } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  // Forgot password modal state
  const [forgotModal, setForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMsg, setForgotMsg] = useState('');
  const [forgotErr, setForgotErr] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/login', { email, password });
      login(res.data.token, res.data.user);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      setForgotErr('Please enter your email address.');
      return;
    }
    setForgotLoading(true);
    setForgotMsg('');
    setForgotErr('');
    try {
      const res = await api.post('/auth/forgot-password', { email: forgotEmail.trim() });
      setForgotMsg(res.data.message || 'Password reset email sent successfully!');
    } catch (err: any) {
      setForgotErr(err.response?.data?.error || 'Failed to request password reset');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen app-shell flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 24 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.45, ease: [0.165, 0.84, 0.44, 1] }}
        className="w-full max-w-md"
      >
        <Card className="border border-[#dbe5f5] shadow-[0_20px_50px_rgba(15,23,42,0.12)] bg-white/95 backdrop-blur-xl">
          <CardHeader className="space-y-3 text-center pb-6">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-[#006c40] to-[#0b8852] rounded-2xl flex items-center justify-center shadow-[0_8px_20px_rgba(0,108,64,0.35)]">
              <span className="text-white font-extrabold text-3xl font-heading leading-none">S</span>
            </div>
            <div>
              <CardTitle className="text-2xl font-bold font-heading tracking-tight text-[#0b1c30]">Smart Sportz</CardTitle>
              <CardDescription className="text-[#5c6878] font-medium text-sm mt-1">Enterprise Tournament & Team Operations</CardDescription>
            </div>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              {error && (
                <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl font-bold border border-rose-200 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                  {error}
                </div>
              )}
              
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-[#5c6878]">Email Address</Label>
                <div className="relative">
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="admin@smartsportz.in" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    required 
                    className="pl-9"
                  />
                  <Mail className="w-4 h-4 text-[#5c6878] absolute left-3 top-3 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-[#5c6878]">Password</Label>
                  <button 
                    type="button" 
                    onClick={() => { setForgotModal(true); setForgotEmail(email); setForgotMsg(''); setForgotErr(''); }}
                    className="text-xs text-[#006c40] hover:underline font-bold"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="••••••••" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    required 
                    className="pl-9"
                  />
                  <Lock className="w-4 h-4 text-[#5c6878] absolute left-3 top-3 pointer-events-none" />
                </div>
              </div>

              <div className="rounded-xl bg-[#eff4ff] border border-[#dbe5f5] p-3.5 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#006c40]">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Demo Credentials</span>
                </div>
                <div className="grid grid-cols-1 gap-1 text-[11px] text-[#5c6878]">
                  <p><strong className="text-[#0b1c30]">Admin:</strong> admin@smartsportz.in / admin123</p>
                  <p><strong className="text-[#0b1c30]">Operator:</strong> operator@smartsportz.in / operator123</p>
                </div>
              </div>
            </CardContent>
            
            <CardFooter className="pt-2">
              <Button 
                type="submit" 
                variant="primary"
                size="lg"
                className="w-full" 
                disabled={loading}
              >
                {loading ? 'Authenticating...' : 'Sign in to Smart Sportz'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </motion.div>

      {/* Forgot Password Modal */}
      {forgotModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#dbe5f5] max-w-md w-full p-6 space-y-4 animate-in fade-in">
            <div className="flex justify-between items-center pb-2 border-b border-[#dbe5f5]">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-[#006c40]" />
                <h3 className="font-heading font-extrabold text-lg text-[#0b1c30]">Forgot Password</h3>
              </div>
              <button 
                type="button" 
                onClick={() => setForgotModal(false)}
                className="text-[#5c6878] hover:text-[#0b1c30] text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[#5c6878] leading-relaxed">
              Enter your registered account email address. We will generate a temporary login password and send it directly to your email.
            </p>

            {forgotMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-medium">
                {forgotMsg}
              </div>
            )}
            {forgotErr && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-medium">
                {forgotErr}
              </div>
            )}

            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-[#5c6878]">Registered Email</Label>
                <div className="relative">
                  <Input 
                    type="email" 
                    placeholder="you@example.com" 
                    value={forgotEmail} 
                    onChange={e => setForgotEmail(e.target.value)} 
                    required 
                    className="pl-9"
                  />
                  <Mail className="w-4 h-4 text-[#5c6878] absolute left-3 top-3 pointer-events-none" />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setForgotModal(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={forgotLoading}
                  size="sm"
                  className="bg-[#006c40] hover:bg-[#0b8852] text-white"
                >
                  {forgotLoading ? 'Sending...' : 'Send Reset Email'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
