import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Trophy, 
  Users, 
  CheckCircle2, 
  Clock, 
  CalendarPlus, 
  FileCheck, 
  ArrowUpRight, 
  TrendingUp,
  MapPin,
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function AdminDashboard() {
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['adminDashboard'],
    queryFn: async () => {
      const res = await api.get('/dashboard');
      return res.data;
    }
  });

  const { data: teamsData } = useQuery({
    queryKey: ['teams-count'],
    queryFn: async () => {
      const res = await api.get('/teams');
      return res.data;
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-64 bg-emerald-950/10 rounded-xl"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-white/70 rounded-2xl border border-[#dbe5f5]"></div>
          ))}
        </div>
      </div>
    );
  }

  const allTournaments = data?.tournaments || [];
  const openTournaments = allTournaments.filter((t: any) => t.status === 'Registration Open');

  const stats = [
    { 
      title: 'DB Tournaments', 
      value: data?.totalTournaments || 0, 
      icon: Trophy, 
      color: 'text-[#0b8852]', 
      bg: 'bg-emerald-50 border border-emerald-200/50',
      change: 'Active & Scheduled'
    },
    { 
      title: 'Registered Teams', 
      value: teamsData?.length || data?.totalRegistrations || 0, 
      icon: Users, 
      color: 'text-[#2563eb]', 
      bg: 'bg-blue-50 border border-blue-200/50',
      change: 'All Squads'
    },
    { 
      title: 'Pending Verification', 
      value: data?.pendingRegs || 0, 
      icon: Clock, 
      color: 'text-[#f97316]', 
      bg: 'bg-amber-50 border border-amber-200/50',
      change: 'Requires Review'
    },
    { 
      title: 'Verified Passes', 
      value: data?.approvedRegs || 0, 
      icon: CheckCircle2, 
      color: 'text-[#006c40]', 
      bg: 'bg-emerald-50 border border-emerald-200/50',
      change: 'Official Entry Passes'
    },
  ];

  return (
    <div className="space-y-8 pb-16">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-[11px] font-extrabold uppercase tracking-widest text-[#006c40] mb-1">
            Enterprise Management
          </div>
          <h1 className="text-3xl font-bold font-heading tracking-tight text-[#0b1c30]">
            System Dashboard
          </h1>
          <p className="text-[#5c6878] text-sm mt-1">
            Real-time telemetry and management for tournaments, squads, and verification passes.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="primary" 
            onClick={() => navigate('/admin/tournaments')}
            className="shadow-md"
          >
            <Trophy className="w-4 h-4 mr-2" /> Manage Tournaments
          </Button>
          <Button 
            variant="outline"
            onClick={() => navigate('/admin/payments')}
          >
            <FileCheck className="w-4 h-4 mr-2" /> Verify Payments
          </Button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div 
            key={i} 
            initial={{ opacity: 0, y: 18 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: i * 0.08, ease: [0.165, 0.84, 0.44, 1] }}
          >
            <Card className="tactile-card border border-[#dbe5f5] hover:border-[#0b8852]/30 p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#5c6878] mb-1.5">{stat.title}</p>
                  <p className="text-3xl font-extrabold font-heading text-[#0b1c30] tracking-tight">{stat.value}</p>
                  <div className="flex items-center gap-1.5 mt-2 text-xs font-bold text-[#006c40]">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>{stat.change}</span>
                  </div>
                </div>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${stat.bg} ${stat.color} shadow-xs`}>
                  <stat.icon className="w-6 h-6" />
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Open Registration Slots Section */}
      <Card className="border border-[#dbe5f5] bg-white p-6 shadow-sm">
        <CardHeader className="p-0 pb-4 flex flex-row items-center justify-between border-b border-[#dbe5f5]">
          <div>
            <CardTitle className="text-lg font-bold font-heading text-[#0b1c30]">
              Open Registration Slots
            </CardTitle>
            <p className="text-xs text-[#5c6878] mt-0.5">
              Tournaments currently accepting squad applications.
            </p>
          </div>
          <span className="status status-emerald text-xs">
            {openTournaments.length} Open
          </span>
        </CardHeader>

        <CardContent className="p-0 pt-4">
          {openTournaments.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#5c6878]">
              No tournaments currently open for registration.
            </div>
          ) : (
            <div className="divide-y divide-[#dbe5f5]">
              {openTournaments.map((t: any) => (
                <div key={t.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="status status-slate text-[10px]">{t.sport}</span>
                      <strong className="text-sm font-heading text-[#0b1c30]">{t.name}</strong>
                    </div>
                    <p className="text-[#5c6878] flex items-center gap-1.5 text-[11px]">
                      <MapPin className="w-3 h-3 text-[#006c40]" /> {t.primary_place}
                    </p>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <span className="text-[#5c6878] block text-[10px] uppercase font-bold">Registration Closes</span>
                      <strong className="text-[#0b1c30] font-semibold">
                        {t.registration_close ? new Date(t.registration_close).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBA'}
                      </strong>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => navigate('/admin/tournaments')}
                      className="text-xs"
                    >
                      Manage
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Two-Column Grid: Tournaments & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border border-[#dbe5f5] bg-white p-6 shadow-sm">
          <CardHeader className="p-0 pb-4 flex flex-row items-center justify-between border-b border-[#dbe5f5]">
            <div>
              <CardTitle className="text-lg font-bold font-heading text-[#0b1c30]">Database Tournaments</CardTitle>
              <p className="text-xs text-[#5c6878] mt-0.5">Recently created tournament records in the platform.</p>
            </div>
            <Link to="/admin/tournaments" className="text-xs font-bold text-[#006c40] hover:underline flex items-center gap-1">
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </CardHeader>

          <CardContent className="p-0 pt-4 space-y-2.5">
            {allTournaments.slice(0, 5).map((item: any) => (
              <div 
                key={item.id} 
                className="flex items-center justify-between p-3 rounded-xl bg-[#eff4ff]/30 border border-[#dbe5f5] hover:bg-[#eaf4e4]/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white border border-[#dbe5f5] flex items-center justify-center text-[#006c40] font-bold text-xs shadow-xs">
                    <Trophy className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#0b1c30]">{item.name}</p>
                    <p className="text-[11px] text-[#5c6878]">{item.sport} • {item.primary_place}</p>
                  </div>
                </div>
                <span className={`status ${item.status === 'Registration Open' ? 'status-emerald' : 'status-slate'} text-[10px]`}>
                  {item.status}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Quick Actions Panel */}
        <Card className="border border-[#dbe5f5] bg-white p-6 shadow-sm flex flex-col justify-between">
          <CardHeader className="p-0 pb-4 border-b border-[#dbe5f5]">
            <CardTitle className="text-lg font-bold font-heading text-[#0b1c30]">Operations Panel</CardTitle>
            <p className="text-xs text-[#5c6878] mt-0.5">Quick management links</p>
          </CardHeader>
          <CardContent className="p-0 pt-4 space-y-3">
            <Link to="/admin/tournaments" className="flex items-center justify-between p-3.5 rounded-xl border border-[#dbe5f5] hover:border-[#0b8852]/40 hover:bg-[#eaf4e4]/30 transition-all group">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#006c40] flex items-center justify-center font-bold">
                  <Trophy className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#0b1c30]">Tournaments Manager</p>
                  <p className="text-[11px] text-[#5c6878]">Add, edit, or delete events</p>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-[#5c6878] group-hover:text-[#006c40] transition-colors" />
            </Link>

            <Link to="/admin/teams" className="flex items-center justify-between p-3.5 rounded-xl border border-[#dbe5f5] hover:border-[#0b8852]/40 hover:bg-[#eaf4e4]/30 transition-all group">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#2563eb] flex items-center justify-center font-bold">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#0b1c30]">Teams & Squads</p>
                  <p className="text-[11px] text-[#5c6878]">Inspect athlete rosters</p>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-[#5c6878] group-hover:text-[#006c40] transition-colors" />
            </Link>

            <Link to="/admin/payments" className="flex items-center justify-between p-3.5 rounded-xl border border-[#dbe5f5] hover:border-[#0b8852]/40 hover:bg-[#eaf4e4]/30 transition-all group">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-[#f97316] flex items-center justify-center font-bold">
                  <FileCheck className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#0b1c30]">Payment Verification</p>
                  <p className="text-[11px] text-[#5c6878]">Verify UPI & issue digital passes</p>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-[#5c6878] group-hover:text-[#006c40] transition-colors" />
            </Link>
          </CardContent>
          <div className="mt-4 pt-4 border-t border-[#dbe5f5] text-[11px] text-[#5c6878] text-center font-medium">
            Smart Sportz Enterprise v2.4
          </div>
        </Card>
      </div>
    </div>
  );
}

