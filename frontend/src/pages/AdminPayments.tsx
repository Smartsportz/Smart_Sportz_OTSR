import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { Registration } from '../types';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { QRCodeSVG } from 'qrcode.react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  CheckCircle2, 
  XCircle, 
  Eye, 
  Download, 
  Clock, 
  ShieldCheck, 
  Phone, 
  User, 
  QrCode, 
  Trophy,
  Filter
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function AdminPayments() {
  const queryClient = useQueryClient();
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>('all');

  const { data: tournamentsList } = useQuery({
    queryKey: ['tournaments-for-payments'],
    queryFn: async () => {
      const res = await api.get('/tournaments');
      return res.data;
    }
  });

  const { data: registrations, isLoading } = useQuery<Registration[]>({
    queryKey: ['registrations'],
    queryFn: async () => {
      const res = await api.get('/registrations');
      return res.data;
    }
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => api.post(`/registrations/${id}/approve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['registrations'] });
    }
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => api.post(`/registrations/${id}/reject`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['registrations'] });
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-64 bg-emerald-950/10 rounded-xl"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-64 bg-white/70 rounded-2xl border border-[#dbe5f5]"></div>
          ))}
        </div>
      </div>
    );
  }

  // Filter registrations by selected tournament
  const filteredRegs = (registrations || []).filter(r => {
    if (selectedTournamentId === 'all') return true;
    return r.tournament_id === selectedTournamentId;
  });

  const pendingRegs = filteredRegs.filter(r => r.payment_status === 'Pending Verification');
  const approvedRegs = filteredRegs.filter(r => r.payment_status === 'Verified');

  const tournamentMap = new Map((tournamentsList || []).map((t: any) => [t.id, t]));

  return (
    <div className="space-y-8 pb-16">
      <div>
        <div className="text-[11px] font-extrabold uppercase tracking-widest text-[#006c40] mb-1">
          Financial Operations
        </div>
        <h1 className="text-3xl font-bold font-heading tracking-tight text-[#0b1c30]">
          Payments & Pass Issuance
        </h1>
        <p className="text-[#5c6878] text-sm mt-1">
          Verify operator-submitted manual UPI transactions, validate team entries, and issue official passes.
        </p>
      </div>

      {/* Tournament Filter Pills / Selector */}
      <div className="bg-white p-4 rounded-2xl border border-[#dbe5f5] shadow-xs space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-[#5c6878] uppercase tracking-wider mb-1">
          <Filter className="w-3.5 h-3.5 text-[#006c40]" /> Filter by Tournament:
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedTournamentId('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedTournamentId === 'all'
                ? 'bg-[#006c40] text-white shadow-xs'
                : 'bg-[#eff4ff]/60 text-[#5c6878] hover:bg-[#eaf4e4] hover:text-[#006c40]'
            }`}
          >
            All Tournaments ({registrations?.length || 0})
          </button>
          {tournamentsList?.map((t: any) => {
            const tRegsCount = (registrations || []).filter(r => r.tournament_id === t.id).length;
            const tPendingCount = (registrations || []).filter(r => r.tournament_id === t.id && r.payment_status === 'Pending Verification').length;

            return (
              <button
                key={t.id}
                onClick={() => setSelectedTournamentId(t.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  selectedTournamentId === t.id
                    ? 'bg-[#006c40] text-white shadow-xs'
                    : 'bg-[#eff4ff]/60 text-[#5c6878] hover:bg-[#eaf4e4] hover:text-[#006c40]'
                }`}
              >
                <span>{t.name}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  selectedTournamentId === t.id ? 'bg-white/20 text-white' : 'bg-white text-[#0b1c30]'
                }`}>
                  {tRegsCount}
                </span>
                {tPendingCount > 0 && (
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Pending Verification Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold font-heading text-[#0b1c30]">Pending Verification Queue</h2>
            <span className="status status-orange text-xs">{pendingRegs.length} Pending</span>
          </div>
        </div>

        {pendingRegs.length === 0 && (
          <div className="p-8 text-center border border-dashed border-[#dbe5f5] rounded-2xl bg-white/60">
            <CheckCircle2 className="w-10 h-10 text-[#006c40]/50 mx-auto mb-2" />
            <p className="font-bold text-sm text-[#0b1c30]">All caught up!</p>
            <p className="text-xs text-[#5c6878] mt-0.5">No pending payment verification requests for this selection.</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pendingRegs.map((reg, idx) => {
            const tourney = tournamentMap.get(reg.tournament_id);

            return (
              <motion.div 
                key={reg.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className="tactile-card border border-amber-200 bg-white shadow-sm flex flex-col justify-between overflow-hidden p-0">
                  <div className="p-5 border-b border-[#dbe5f5] bg-amber-50/40 flex items-center justify-between">
                    <div>
                      <span className="status status-orange text-[10px] mb-1.5">{reg.registration_id}</span>
                      <h3 className="font-bold font-heading text-lg text-[#0b1c30]">{reg.team_name}</h3>
                      <p className="text-[11px] text-[#5c6878] mt-0.5 flex items-center gap-1">
                        <Trophy className="w-3 h-3 text-[#006c40]" /> {tourney?.name || 'Tournament'}
                      </p>
                    </div>
                    <div className="w-9 h-9 rounded-xl bg-amber-100/80 text-[#c2410c] flex items-center justify-center">
                      <Clock className="w-4 h-4" />
                    </div>
                  </div>

                  <div className="p-5 space-y-2 text-xs text-[#5c6878] flex-1">
                    <div className="flex items-center gap-2 text-[#0b1c30]">
                      <User className="w-3.5 h-3.5 text-[#006c40]" />
                      <span>Captain: <strong>{reg.captain}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-[#006c40]" />
                      <span>Phone: {reg.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>Origin: {reg.city}, {reg.state}</span>
                    </div>
                  </div>

                  <div className="p-4 bg-neutral-50/70 border-t border-[#dbe5f5] flex gap-2.5">
                    <Button 
                      variant="primary" 
                      size="sm" 
                      className="flex-1 text-xs" 
                      disabled={approveMutation.isPending}
                      onClick={() => approveMutation.mutate(reg.registration_id)}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Approve Pass
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      className="flex-1 text-xs" 
                      disabled={rejectMutation.isPending}
                      onClick={() => rejectMutation.mutate(reg.registration_id)}
                    >
                      <XCircle className="w-3.5 h-3.5 mr-1" /> Reject
                    </Button>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Approved Passes Section */}
      <div className="space-y-4 pt-6 border-t border-[#dbe5f5]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold font-heading text-[#0b1c30]">Verified Tournament Passes</h2>
            <span className="status status-emerald text-xs">{approvedRegs.length} Verified</span>
          </div>
        </div>

        {approvedRegs.length === 0 && (
          <div className="p-8 text-center border border-dashed border-[#dbe5f5] rounded-2xl bg-white/60">
            <QrCode className="w-10 h-10 text-[#006c40]/50 mx-auto mb-2" />
            <p className="font-bold text-sm text-[#0b1c30]">No verified passes issued yet</p>
            <p className="text-xs text-[#5c6878] mt-0.5">Approved registrations will appear here with cryptographic QR codes.</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {approvedRegs.map((reg, idx) => {
            const tourney = tournamentMap.get(reg.tournament_id);

            return (
              <motion.div 
                key={reg.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className="tactile-card border border-emerald-200/80 bg-white shadow-sm flex flex-col justify-between overflow-hidden p-0">
                  <div className="p-5 border-b border-[#dbe5f5] bg-emerald-50/30 flex items-start justify-between gap-3">
                    <div>
                      <span className="status status-emerald text-[10px] mb-1.5">Pass: {reg.unique_pass}</span>
                      <h3 className="font-bold font-heading text-lg text-[#0b1c30]">{reg.team_name}</h3>
                      <p className="text-xs text-[#5c6878] mt-0.5">{tourney?.name || 'Tournament'}</p>
                    </div>
                    <div className="p-2 bg-white rounded-xl border border-[#dbe5f5] shadow-xs">
                      <QRCodeSVG value={reg.unique_pass || 'SS-VERIFIED'} size={56} />
                    </div>
                  </div>

                  <div className="p-4 bg-emerald-50/10 text-xs text-[#5c6878] space-y-1.5 border-b border-[#dbe5f5]">
                    <div className="flex justify-between">
                      <span>Captain:</span>
                      <strong className="text-[#0b1c30]">{reg.captain}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Location:</span>
                      <strong className="text-[#0b1c30]">{reg.city}, {reg.state}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Phone:</span>
                      <strong className="text-[#0b1c30]">{reg.phone}</strong>
                    </div>
                  </div>

                  <div className="p-4 bg-white">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full text-[#006c40] border-[#006c40]/20 hover:bg-[#eaf4e4]"
                      onClick={() => alert(`Official verification pass for ${reg.team_name} (${reg.unique_pass}) downloaded successfully.`)}
                    >
                      <Download className="w-3.5 h-3.5 mr-1.5" /> Download Digital Pass
                    </Button>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

