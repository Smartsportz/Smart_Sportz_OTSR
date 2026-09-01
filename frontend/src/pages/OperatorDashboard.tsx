import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { Tournament } from '../types';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Calendar, Users, Trophy, ArrowRight, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';

const defaultSportImages: Record<string, string> = {
  Cricket: '/assets/cricket-stadium.png',
  Football: '/assets/football-match.png',
  Basketball: '/assets/basketball-match.png',
  Volleyball: '/assets/volleyball-match.png',
  Chess: '/assets/hero-light.png',
  Badminton: '/assets/poster.jpeg',
};

export default function OperatorDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: tournaments, isLoading } = useQuery<Tournament[]>({
    queryKey: ['tournaments'],
    queryFn: async () => {
      const res = await api.get('/tournaments');
      return res.data;
    }
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Registration Open':
      case 'Live':
        return <span className="status status-emerald">{status}</span>;
      case 'Upcoming':
        return <span className="status status-orange">{status}</span>;
      case 'Registration Closed':
      case 'Completed':
        return <span className="status status-slate">{status}</span>;
      default:
        return <span className="status status-emerald">{status}</span>;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-64 bg-emerald-950/10 rounded-xl"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-80 bg-white/70 rounded-2xl border border-[#dbe5f5]"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-[11px] font-extrabold uppercase tracking-widest text-[#006c40] mb-1">
            Active Events
          </div>
          <h1 className="text-3xl font-bold font-heading tracking-tight text-[#0b1c30]">
            Available Tournaments
          </h1>
          <p className="text-[#5c6878] text-sm mt-1">
            Select an active sporting championship to register team rosters and secure participation.
          </p>
        </div>

        {/* Assigned Regions Info Badge */}
        {user?.allocated_places && user.allocated_places.length > 0 && (
          <div className="bg-white border border-[#dbe5f5] rounded-2xl p-3 shadow-2xs flex items-center gap-2 self-start sm:self-auto">
            <MapPin className="w-4 h-4 text-[#006c40] shrink-0" />
            <div className="text-xs">
              <span className="text-[#5c6878] font-bold block">Assigned Regions:</span>
              <div className="flex flex-wrap gap-1 mt-0.5">
                {user.allocated_places.map((place: string) => (
                  <span key={place} className="px-1.5 py-0.5 rounded-md bg-[#eff4ff] text-[#006c40] font-bold text-[10px]">
                    {place}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tournaments?.map((t: any, i) => (
          <motion.div 
            key={t.id} 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: i * 0.08, ease: [0.165, 0.84, 0.44, 1] }}
          >
            <Card className="tactile-card h-full flex flex-col border border-[#dbe5f5] bg-white overflow-hidden p-0 group justify-between">
              <div>
                {/* Sport Banner Header with Image */}
                <div className="h-40 relative overflow-hidden bg-neutral-900">
                  <img 
                    src={t.image || defaultSportImages[t.sport] || '/assets/cricket-stadium.png'} 
                    alt={t.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/assets/cricket-stadium.png';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
                  
                  <div className="absolute top-3.5 right-3.5 z-20">
                    {getStatusBadge(t.status)}
                  </div>
                  <div className="absolute top-3.5 left-3.5 z-20">
                    <span className="px-2.5 py-1 rounded-full bg-black/60 text-white border border-white/20 text-xs font-extrabold backdrop-blur-md shadow-xs">
                      {t.sport}
                    </span>
                  </div>
                  <div className="absolute bottom-3 left-4 right-4 z-20 text-white">
                    <h3 className="text-lg font-bold font-heading line-clamp-1 leading-snug">
                      {t.name}
                    </h3>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  <p className="text-xs text-[#5c6878] line-clamp-2 leading-relaxed">
                    {t.description || 'Championship tournament event organized with official rules and verification.'}
                  </p>

                  <div className="space-y-2.5 pt-2 border-t border-[#dbe5f5] text-xs text-[#5c6878]">
                    <div className="flex items-center gap-2.5">
                      <Calendar className="w-4 h-4 text-[#006c40]" />
                      <span className="font-semibold text-[#0b1c30]">
                        {new Date(t.tournament_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <MapPin className="w-4 h-4 text-[#006c40]" />
                      <span className="font-medium">{t.primary_place} • {t.address}</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Users className="w-4 h-4 text-[#006c40]" />
                      <span className="font-medium">{t.min_members} - {t.max_members} Members (Age {t.min_age}-{t.max_age} yrs)</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 pt-0">
                <Button 
                  variant={t.status === 'Registration Open' || t.status === 'Upcoming' ? 'primary' : 'outline'}
                  className="w-full flex items-center justify-center gap-2"
                  onClick={() => navigate(`/operator/register/${t.id}`)}
                  disabled={t.status !== 'Registration Open' && t.status !== 'Upcoming'}
                >
                  <span>{t.status === 'Registration Open' || t.status === 'Upcoming' ? 'Register Team Roster' : 'Registration Closed'}</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          </motion.div>
        ))}

        {tournaments?.length === 0 && (
          <div className="col-span-full py-16 text-center border border-dashed border-[#dbe5f5] rounded-2xl bg-white/50">
            <Trophy className="w-12 h-12 text-[#006c40]/40 mx-auto mb-3" />
            <p className="text-base font-bold text-[#0b1c30]">No tournaments available</p>
            <p className="text-xs text-[#5c6878] mt-1">Please check back once the Super Admin publishes upcoming events.</p>
          </div>
        )}
      </div>
    </div>
  );
}

