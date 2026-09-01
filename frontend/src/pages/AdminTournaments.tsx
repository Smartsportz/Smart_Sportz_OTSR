import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Trophy, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Users, 
  Calendar, 
  MapPin, 
  Image as ImageIcon,
  PlusCircle,
  CheckCircle2,
  X,
  Clock
} from 'lucide-react';
import { motion } from 'framer-motion';

const defaultSportImages: Record<string, string> = {
  Cricket: '/assets/cricket-stadium.png',
  Football: '/assets/football-match.png',
  Basketball: '/assets/basketball-match.png',
  Volleyball: '/assets/volleyball-match.png',
  Chess: '/assets/hero-light.png',
  Badminton: '/assets/poster.jpeg',
};

export default function AdminTournaments() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTournamentId, setEditingTournamentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    sport: 'Cricket',
    status: 'Upcoming',
    primary_place: 'Mumbai',
    tournament_date: '',
    registration_open: '',
    registration_close: '',
    capacity: '16',
    min_members: '2',
    max_members: '15',
    min_age: '12',
    max_age: '45',
    show_jersey_size: false,
    image: '/assets/cricket-stadium.png',
    poster: '/assets/poster.jpeg',
    address: '',
    description: '',
    sport_description: ''
  });

  const [paymentLines, setPaymentLines] = useState([{ title: 'Entry Fee', amount: '5000' }]);
  const [prizePool, setPrizePool] = useState([
    { position: '1st Place Champion', amount: '25000' },
    { position: 'Runner Up', amount: '10000' }
  ]);

  const { data: tournamentsList, isLoading } = useQuery({
    queryKey: ['admin-tournaments'],
    queryFn: async () => {
      const res = await api.get('/tournaments');
      return res.data;
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/tournaments/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tournaments'] });
    }
  });

  const handleOpenCreate = () => {
    setEditingTournamentId(null);
    setFormData({
      name: '',
      sport: 'Cricket',
      status: 'Upcoming',
      primary_place: 'Mumbai',
      tournament_date: '',
      registration_open: '',
      registration_close: '',
      capacity: '16',
      min_members: '2',
      max_members: '15',
      min_age: '12',
      max_age: '45',
      show_jersey_size: false,
      image: defaultSportImages['Cricket'] || '/assets/cricket-stadium.png',
      poster: '/assets/poster.jpeg',
      address: '',
      description: '',
      sport_description: ''
    });
    setPaymentLines([{ title: 'Entry Fee', amount: '5000' }]);
    setPrizePool([
      { position: '1st Place Champion', amount: '25000' },
      { position: 'Runner Up', amount: '10000' }
    ]);
    setModalOpen(true);
  };

  const handleOpenEdit = async (t: any) => {
    setEditingTournamentId(t.id);
    try {
      const res = await api.get(`/tournaments/${t.id}`);
      const full = res.data;
      setFormData({
        name: full.name || '',
        sport: full.sport || 'Cricket',
        status: full.status || 'Upcoming',
        primary_place: full.primary_place || 'Mumbai',
        tournament_date: full.tournament_date || '',
        registration_open: full.registration_open || '',
        registration_close: full.registration_close || '',
        capacity: String(full.capacity || 16),
        min_members: String(full.min_members || 2),
        max_members: String(full.max_members || 15),
        min_age: String(full.min_age || 12),
        max_age: String(full.max_age || 45),
        show_jersey_size: Boolean(full.show_jersey_size),
        image: full.image || defaultSportImages[full.sport] || '/assets/cricket-stadium.png',
        poster: full.poster || '/assets/poster.jpeg',
        address: full.address || '',
        description: full.description || '',
        sport_description: full.sport_description || ''
      });
      if (full.payment_lines && full.payment_lines.length > 0) {
        setPaymentLines(full.payment_lines.map((pl: any) => ({ title: pl.title, amount: String(pl.amount) })));
      } else {
        setPaymentLines([{ title: 'Entry Fee', amount: '5000' }]);
      }
      if (full.prize_pool && full.prize_pool.length > 0) {
        setPrizePool(full.prize_pool.map((pp: any) => ({ position: pp.position, amount: String(pp.amount) })));
      } else {
        setPrizePool([{ position: '1st Place Champion', amount: '25000' }]);
      }
      setModalOpen(true);
    } catch (err) {
      alert('Could not fetch tournament details');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await api.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setFormData(prev => ({ ...prev, image: res.data.url }));
    } catch (err) {
      alert('Image upload failed');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...formData,
        payment_lines: paymentLines,
        prize_pool: prizePool
      };

      if (editingTournamentId) {
        await api.put(`/tournaments/${editingTournamentId}`, payload);
      } else {
        await api.post('/tournaments', payload);
      }

      queryClient.invalidateQueries({ queryKey: ['admin-tournaments'] });
      setModalOpen(false);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to save tournament');
    } finally {
      setLoading(false);
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'Registration Open':
        return 'status-emerald';
      case 'Upcoming':
        return 'status-orange';
      case 'Live':
        return 'status-pink';
      default:
        return 'status-slate';
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header with Title and Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-[11px] font-extrabold uppercase tracking-widest text-[#006c40] mb-1">
            Tournament Operations
          </div>
          <h1 className="text-3xl font-bold font-heading tracking-tight text-[#0b1c30]">
            Tournaments Directory
          </h1>
          <p className="text-[#5c6878] text-sm mt-1">
            Manage upcoming, active, and completed sporting championships with live slot metrics.
          </p>
        </div>

        <Button 
          variant="primary" 
          size="lg"
          onClick={handleOpenCreate}
          className="shadow-[0_10px_22px_rgba(0,108,64,0.22)]"
        >
          <Plus className="w-4 h-4 mr-2" /> Add New Tournament
        </Button>
      </div>

      {/* Tournaments Grid / Table */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-64 rounded-2xl bg-white/70 border border-[#dbe5f5]"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tournamentsList?.map((t: any, idx: number) => {
            const registered = t.registered_count || 0;
            const capacity = t.capacity || 16;
            const progress = Math.min(100, Math.round((registered / capacity) * 100));

            return (
              <motion.div 
                key={t.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className="tactile-card border border-[#dbe5f5] bg-white shadow-sm flex flex-col justify-between overflow-hidden p-0 group">
                  <div>
                    {/* Sport Image Banner */}
                    <div className="h-36 relative overflow-hidden bg-neutral-900">
                      <img 
                        src={t.image || defaultSportImages[t.sport] || '/assets/cricket-stadium.png'} 
                        alt={t.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/assets/cricket-stadium.png';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
                      <div className="absolute top-3 left-3 flex gap-2">
                        <span className={`status ${getStatusClass(t.status)} text-[10px]`}>
                          {t.status}
                        </span>
                        <span className="status status-slate text-[10px] bg-black/60 text-white border-white/20">
                          {t.sport}
                        </span>
                      </div>
                      <div className="absolute bottom-3 left-3 right-3 text-white">
                        <h3 className="font-bold font-heading text-base leading-snug line-clamp-1">
                          {t.name}
                        </h3>
                        <p className="text-[11px] text-white/80 flex items-center gap-1.5 mt-0.5">
                          <MapPin className="w-3 h-3 text-emerald-400" /> {t.primary_place}
                        </p>
                      </div>
                    </div>

                    {/* Content Details */}
                    <div className="p-4 space-y-3 text-xs text-[#5c6878]">
                      <div className="flex justify-between items-center">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-[#006c40]" /> Event Date:
                        </span>
                        <strong className="text-[#0b1c30]">
                          {t.tournament_date ? new Date(t.tournament_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBA'}
                        </strong>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-[#006c40]" /> Team Roster:
                        </span>
                        <strong className="text-[#0b1c30]">
                          {t.min_members} - {t.max_members} Athletes ({t.min_age}-{t.max_age} yrs)
                        </strong>
                      </div>

                      {/* Slot Capacity Progress */}
                      <div className="space-y-1.5 pt-1">
                        <div className="flex justify-between text-[11px] font-bold">
                          <span className="text-[#5c6878]">Filled Capacity:</span>
                          <span className="text-[#006c40]">{registered} / {capacity} Teams</span>
                        </div>
                        <div className="w-full bg-neutral-100 rounded-full h-2 overflow-hidden border border-[#dbe5f5]">
                          <div 
                            className="bg-gradient-to-r from-[#006c40] to-[#0b8852] h-full rounded-full transition-all duration-500"
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="p-3 bg-neutral-50/70 border-t border-[#dbe5f5] flex items-center justify-between gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => navigate('/admin/teams')}
                      className="text-xs text-[#006c40]"
                    >
                      <Users className="w-3 h-3 mr-1" /> Teams ({registered})
                    </Button>

                    <div className="flex items-center gap-1.5">
                      <Button 
                        variant="ghost" 
                        size="icon-sm"
                        onClick={() => handleOpenEdit(t)}
                        className="text-[#0b1c30] hover:bg-neutral-200"
                        title="Edit Tournament"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon-sm"
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete "${t.name}"? This action cannot be undone.`)) {
                            deleteMutation.mutate(t.id);
                          }
                        }}
                        className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                        title="Delete Tournament"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Tournament Dialog Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl border border-[#dbe5f5] shadow-2xl p-6">
          <DialogHeader className="border-b border-[#dbe5f5] pb-4">
            <DialogTitle className="font-heading font-bold text-xl text-[#0b1c30]">
              {editingTournamentId ? 'Edit Tournament Event' : 'Create New Tournament Event'}
            </DialogTitle>
            <p className="text-xs text-[#5c6878]">
              Configure tournament schedules, participant limits, registration fees, and prize allocations.
            </p>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6 pt-4">
            {/* General Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-[#5c6878]">Tournament Name</Label>
                <Input 
                  required 
                  placeholder="e.g. National Championship 2026"
                  value={formData.name} 
                  onChange={e => setFormData({ ...formData, name: e.target.value })} 
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-[#5c6878]">Sport Discipline</Label>
                <Select 
                  value={formData.sport} 
                  onValueChange={v => {
                    setFormData({ 
                      ...formData, 
                      sport: v,
                      image: defaultSportImages[v] || formData.image 
                    });
                  }}
                >
                  <SelectTrigger><SelectValue placeholder="Select Sport" /></SelectTrigger>
                  <SelectContent className="bg-white border border-[#dbe5f5] shadow-lg rounded-xl">
                    <SelectItem value="Cricket">Cricket</SelectItem>
                    <SelectItem value="Football">Football</SelectItem>
                    <SelectItem value="Basketball">Basketball</SelectItem>
                    <SelectItem value="Volleyball">Volleyball</SelectItem>
                    <SelectItem value="Chess">Chess</SelectItem>
                    <SelectItem value="Badminton">Badminton</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-[#5c6878]">Host City / Place</Label>
                <Select value={formData.primary_place} onValueChange={v => setFormData({ ...formData, primary_place: v })}>
                  <SelectTrigger><SelectValue placeholder="Select City" /></SelectTrigger>
                  <SelectContent className="bg-white border border-[#dbe5f5] shadow-lg rounded-xl">
                    <SelectItem value="Mumbai">Mumbai</SelectItem>
                    <SelectItem value="Bengaluru">Bengaluru</SelectItem>
                    <SelectItem value="Delhi NCR">Delhi NCR</SelectItem>
                    <SelectItem value="Chennai">Chennai</SelectItem>
                    <SelectItem value="Hyderabad">Hyderabad</SelectItem>
                    <SelectItem value="Kolkata">Kolkata</SelectItem>
                    <SelectItem value="Pune">Pune</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-[#5c6878]">Event Status</Label>
                <Select value={formData.status} onValueChange={v => setFormData({ ...formData, status: v })}>
                  <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent className="bg-white border border-[#dbe5f5] shadow-lg rounded-xl">
                    <SelectItem value="Upcoming">Upcoming</SelectItem>
                    <SelectItem value="Registration Open">Registration Open</SelectItem>
                    <SelectItem value="Registration Closed">Registration Closed</SelectItem>
                    <SelectItem value="Live">Live</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Poster & Image Upload */}
            <div className="p-4 rounded-xl border border-[#dbe5f5] bg-[#eff4ff]/30 space-y-3">
              <Label className="text-xs font-bold uppercase tracking-wider text-[#5c6878]">Tournament Banner Image</Label>
              <div className="flex flex-col sm:flex-row gap-4 items-center">
                <div className="w-28 h-18 rounded-xl overflow-hidden border border-[#dbe5f5] bg-neutral-900 flex-shrink-0">
                  <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 space-y-2">
                  <Input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleImageUpload} 
                    className="cursor-pointer text-xs"
                  />
                  <div className="flex flex-wrap gap-2 text-[11px]">
                    <span className="text-[#5c6878]">Presets:</span>
                    {Object.keys(defaultSportImages).map(sport => (
                      <button 
                        key={sport}
                        type="button" 
                        onClick={() => setFormData({ ...formData, image: defaultSportImages[sport] })}
                        className="font-bold text-[#006c40] hover:underline cursor-pointer"
                      >
                        {sport}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Dates & Constraints */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-[#5c6878]">Tournament Date</Label>
                <Input type="date" required value={formData.tournament_date} onChange={e => setFormData({ ...formData, tournament_date: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-[#5c6878]">Reg Opens</Label>
                <Input type="date" required value={formData.registration_open} onChange={e => setFormData({ ...formData, registration_open: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-[#5c6878]">Reg Closes</Label>
                <Input type="date" required value={formData.registration_close} onChange={e => setFormData({ ...formData, registration_close: e.target.value })} />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-[#5c6878]">Team Capacity</Label>
                <Input type="number" required value={formData.capacity} onChange={e => setFormData({ ...formData, capacity: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-[#5c6878]">Roster (Min/Max)</Label>
                <div className="flex gap-2">
                  <Input type="number" placeholder="Min" value={formData.min_members} onChange={e => setFormData({ ...formData, min_members: e.target.value })} />
                  <Input type="number" placeholder="Max" value={formData.max_members} onChange={e => setFormData({ ...formData, max_members: e.target.value })} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-[#5c6878]">Age Limits (Min/Max)</Label>
                <div className="flex gap-2">
                  <Input type="number" placeholder="Min" value={formData.min_age} onChange={e => setFormData({ ...formData, min_age: e.target.value })} />
                  <Input type="number" placeholder="Max" value={formData.max_age} onChange={e => setFormData({ ...formData, max_age: e.target.value })} />
                </div>
              </div>
            </div>

            {/* T-Shirt / Jersey Size Input Toggle */}
            <div className="p-4 rounded-xl border border-[#dbe5f5] bg-[#eff4ff]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#006c40] block">Athlete T-Shirt / Jersey Size</span>
                <p className="text-xs text-[#5c6878] mt-0.5">
                  Choose whether operators & teams should provide athlete uniform sizes (XS, S, M, L, XL, XXL) during registration.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, show_jersey_size: !formData.show_jersey_size })}
                  className={`px-3.5 py-1.5 rounded-lg font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                    formData.show_jersey_size
                      ? 'bg-[#006c40] text-white shadow-xs'
                      : 'bg-white border border-[#dbe5f5] text-[#5c6878] hover:bg-neutral-50'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${formData.show_jersey_size ? 'bg-emerald-300' : 'bg-gray-300'}`}></span>
                  {formData.show_jersey_size ? 'Size Input Enabled' : 'Size Input Disabled'}
                </button>
              </div>
            </div>

            {/* Address & Rules */}
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-[#5c6878]">Full Venue Address</Label>
                <Textarea required value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} placeholder="Stadium or sports complex address..." />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-[#5c6878]">Tournament Description & Rules</Label>
                <Textarea required value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Tournament description and fair-play rules..." />
              </div>
            </div>

            {/* Dynamic Fee Lines */}
            <div className="space-y-3 border-t border-[#dbe5f5] pt-4">
              <div className="flex justify-between items-center">
                <Label className="text-xs font-bold uppercase tracking-wider text-[#5c6878]">Registration Fee Lines</Label>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setPaymentLines([...paymentLines, { title: '', amount: '500' }])}
                >
                  <PlusCircle className="w-3.5 h-3.5 mr-1 text-[#006c40]" /> Add Fee Line
                </Button>
              </div>
              {paymentLines.map((line, idx) => (
                <div key={idx} className="flex gap-3 items-center">
                  <Input 
                    placeholder="Fee Title" 
                    value={line.title} 
                    onChange={e => {
                      const updated = [...paymentLines]; updated[idx].title = e.target.value; setPaymentLines(updated);
                    }} 
                    className="flex-1"
                  />
                  <div className="w-36 relative">
                    <span className="absolute left-3 top-2.5 text-xs font-bold text-[#5c6878]">₹</span>
                    <Input 
                      type="number" 
                      placeholder="Amount" 
                      value={line.amount} 
                      onChange={e => {
                        const updated = [...paymentLines]; updated[idx].amount = e.target.value; setPaymentLines(updated);
                      }} 
                      className="pl-7 font-bold text-[#0b1c30]"
                    />
                  </div>
                  {paymentLines.length > 1 && (
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon-sm" 
                      className="text-rose-500" 
                      onClick={() => setPaymentLines(paymentLines.filter((_, i) => i !== idx))}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {/* Dynamic Prize Pool */}
            <div className="space-y-3 border-t border-[#dbe5f5] pt-4">
              <div className="flex justify-between items-center">
                <Label className="text-xs font-bold uppercase tracking-wider text-[#5c6878]">Prize Pool Distribution</Label>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setPrizePool([...prizePool, { position: '', amount: '5000' }])}
                >
                  <PlusCircle className="w-3.5 h-3.5 mr-1 text-[#006c40]" /> Add Prize
                </Button>
              </div>
              {prizePool.map((prize, idx) => (
                <div key={idx} className="flex gap-3 items-center">
                  <Input 
                    placeholder="Position (e.g. 1st Place)" 
                    value={prize.position} 
                    onChange={e => {
                      const updated = [...prizePool]; updated[idx].position = e.target.value; setPrizePool(updated);
                    }} 
                    className="flex-1"
                  />
                  <div className="w-36 relative">
                    <span className="absolute left-3 top-2.5 text-xs font-bold text-[#5c6878]">₹</span>
                    <Input 
                      type="number" 
                      placeholder="Amount" 
                      value={prize.amount} 
                      onChange={e => {
                        const updated = [...prizePool]; updated[idx].amount = e.target.value; setPrizePool(updated);
                      }} 
                      className="pl-7 font-bold text-[#006c40]"
                    />
                  </div>
                  {prizePool.length > 1 && (
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon-sm" 
                      className="text-rose-500" 
                      onClick={() => setPrizePool(prizePool.filter((_, i) => i !== idx))}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-[#dbe5f5]">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={loading}>
                {loading ? 'Saving Tournament...' : editingTournamentId ? 'Update Tournament' : 'Publish Tournament'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
