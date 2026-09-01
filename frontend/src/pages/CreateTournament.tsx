import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, Trash2, Calendar, Trophy, DollarSign, Award, ArrowLeft } from 'lucide-react';

export default function CreateTournament() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    sport: '',
    status: 'Upcoming',
    primary_place: '',
    tournament_date: '',
    registration_open: '',
    registration_close: '',
    capacity: '16',
    min_members: '1',
    max_members: '15',
    min_age: '10',
    max_age: '50',
    address: '',
    description: '',
    sport_description: ''
  });

  const [paymentLines, setPaymentLines] = useState([{ title: 'Registration Fee', amount: '500' }]);
  const [prizePool, setPrizePool] = useState([{ position: '1st Place Winner', amount: '10000' }]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/tournaments', {
        ...formData,
        payment_lines: paymentLines,
        prize_pool: prizePool
      });
      navigate('/admin');
    } catch (err) {
      console.error(err);
      alert('Failed to create tournament');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      <div className="flex items-center justify-between">
        <div>
          <button 
            type="button" 
            onClick={() => navigate('/admin')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#006c40] hover:underline mb-2 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold font-heading tracking-tight text-[#0b1c30]">
            Create Tournament
          </h1>
          <p className="text-[#5c6878] text-sm mt-1">
            Configure tournament schedules, participant limits, registration fees, and prize allocations.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <Card className="tactile-card border border-[#dbe5f5] bg-white p-6 shadow-sm">
          <CardHeader className="p-0 pb-5 border-b border-[#dbe5f5] flex flex-row items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#006c40] flex items-center justify-center font-bold">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold font-heading text-[#0b1c30]">General Event Information</CardTitle>
              <p className="text-xs text-[#5c6878]">Name, sport discipline, status, and venue.</p>
            </div>
          </CardHeader>

          <CardContent className="p-0 pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-[#5c6878]">Tournament Name</Label>
              <Input required value={formData.name} onChange={e => handleChange('name', e.target.value)} placeholder="e.g. National Championship 2026" />
            </div>
            
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-[#5c6878]">Sport Discipline</Label>
              <Select value={formData.sport} onValueChange={v => handleChange('sport', v)}>
                <SelectTrigger><SelectValue placeholder="Select Sport" /></SelectTrigger>
                <SelectContent className="bg-white border border-[#dbe5f5] shadow-lg rounded-xl">
                  <SelectItem value="Cricket">Cricket</SelectItem>
                  <SelectItem value="Football">Football</SelectItem>
                  <SelectItem value="Basketball">Basketball</SelectItem>
                  <SelectItem value="Chess">Chess</SelectItem>
                  <SelectItem value="Badminton">Badminton</SelectItem>
                  <SelectItem value="Table Tennis">Table Tennis</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-[#5c6878]">Host City / Primary Place</Label>
              <Select value={formData.primary_place} onValueChange={v => handleChange('primary_place', v)}>
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
              <Label className="text-xs font-bold uppercase tracking-wider text-[#5c6878]">Initial Status</Label>
              <Select value={formData.status} onValueChange={v => handleChange('status', v)}>
                <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent className="bg-white border border-[#dbe5f5] shadow-lg rounded-xl">
                  <SelectItem value="Upcoming">Upcoming</SelectItem>
                  <SelectItem value="Registration Open">Registration Open</SelectItem>
                  <SelectItem value="Registration Closed">Registration Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-1 md:col-span-2 space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-[#5c6878]">Venue Full Address</Label>
              <Textarea required value={formData.address} onChange={e => handleChange('address', e.target.value)} placeholder="Full stadium / sports complex address with landmark..." />
            </div>

            <div className="col-span-1 md:col-span-2 space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-[#5c6878]">Tournament Overview</Label>
              <Textarea required value={formData.description} onChange={e => handleChange('description', e.target.value)} placeholder="Overview, terms, format, and scheduling notes..." />
            </div>
            
            <div className="col-span-1 md:col-span-2 space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-[#5c6878]">Sport Rules & Guidelines</Label>
              <Textarea required value={formData.sport_description} onChange={e => handleChange('sport_description', e.target.value)} placeholder="Match format, innings/halves, equipment requirements..." />
            </div>
          </CardContent>
        </Card>

        {/* Schedule & Eligibility */}
        <Card className="tactile-card border border-[#dbe5f5] bg-white p-6 shadow-sm">
          <CardHeader className="p-0 pb-5 border-b border-[#dbe5f5] flex flex-row items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#2563eb] flex items-center justify-center font-bold">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold font-heading text-[#0b1c30]">Schedule & Roster Constraints</CardTitle>
              <p className="text-xs text-[#5c6878]">Event dates, member counts, and age requirements.</p>
            </div>
          </CardHeader>

          <CardContent className="p-0 pt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-[#5c6878]">Tournament Date</Label>
              <Input type="date" required value={formData.tournament_date} onChange={e => handleChange('tournament_date', e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-[#5c6878]">Registration Opens</Label>
              <Input type="date" required value={formData.registration_open} onChange={e => handleChange('registration_open', e.target.value)} />
            </div>
            
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-[#5c6878]">Registration Closes</Label>
              <Input type="date" required value={formData.registration_close} onChange={e => handleChange('registration_close', e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-[#5c6878]">Team Capacity</Label>
              <Input type="number" required value={formData.capacity} onChange={e => handleChange('capacity', e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-[#5c6878]">Roster Size (Min / Max)</Label>
              <div className="flex gap-2">
                <Input type="number" placeholder="Min" value={formData.min_members} onChange={e => handleChange('min_members', e.target.value)} />
                <Input type="number" placeholder="Max" value={formData.max_members} onChange={e => handleChange('max_members', e.target.value)} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-[#5c6878]">Age Limits (Min / Max)</Label>
              <div className="flex gap-2">
                <Input type="number" placeholder="Min" value={formData.min_age} onChange={e => handleChange('min_age', e.target.value)} />
                <Input type="number" placeholder="Max" value={formData.max_age} onChange={e => handleChange('max_age', e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Lines */}
        <Card className="tactile-card border border-[#dbe5f5] bg-white p-6 shadow-sm">
          <CardHeader className="p-0 pb-5 border-b border-[#dbe5f5] flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#006c40] flex items-center justify-center font-bold">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold font-heading text-[#0b1c30]">Registration Fees & Line Items</CardTitle>
                <p className="text-xs text-[#5c6878]">Breakdown of required fees charged per team.</p>
              </div>
            </div>
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={() => setPaymentLines([...paymentLines, { title: '', amount: '' }])}
            >
              <PlusCircle className="w-4 h-4 mr-1.5 text-[#006c40]" /> Add Fee Line
            </Button>
          </CardHeader>
          <CardContent className="p-0 pt-6 space-y-3">
            {paymentLines.map((line, idx) => (
              <div key={idx} className="flex gap-3 items-center p-3 rounded-xl bg-[#eff4ff]/50 border border-[#dbe5f5]">
                <Input 
                  placeholder="e.g. Entry Fee, Jersey Deposit" 
                  value={line.title} 
                  onChange={e => {
                    const newLines = [...paymentLines]; newLines[idx].title = e.target.value; setPaymentLines(newLines);
                  }} 
                  className="flex-1"
                />
                <div className="w-40 relative">
                  <span className="absolute left-3 top-2.5 text-xs font-bold text-[#5c6878]">₹</span>
                  <Input 
                    type="number" 
                    placeholder="Amount" 
                    value={line.amount} 
                    onChange={e => {
                      const newLines = [...paymentLines]; newLines[idx].amount = e.target.value; setPaymentLines(newLines);
                    }} 
                    className="pl-7 font-bold text-[#0b1c30]"
                  />
                </div>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon-sm" 
                  className="text-rose-500 hover:text-rose-700 hover:bg-rose-50" 
                  onClick={() => setPaymentLines(paymentLines.filter((_, i) => i !== idx))}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Prize Pool */}
        <Card className="tactile-card border border-[#dbe5f5] bg-white p-6 shadow-sm">
          <CardHeader className="p-0 pb-5 border-b border-[#dbe5f5] flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-[#f97316] flex items-center justify-center font-bold">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold font-heading text-[#0b1c30]">Prize Pool Distribution</CardTitle>
                <p className="text-xs text-[#5c6878]">Prize amounts for winning positions.</p>
              </div>
            </div>
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={() => setPrizePool([...prizePool, { position: '', amount: '' }])}
            >
              <PlusCircle className="w-4 h-4 mr-1.5 text-[#006c40]" /> Add Position
            </Button>
          </CardHeader>
          <CardContent className="p-0 pt-6 space-y-3">
            {prizePool.map((prize, idx) => (
              <div key={idx} className="flex gap-3 items-center p-3 rounded-xl bg-[#eff4ff]/50 border border-[#dbe5f5]">
                <Input 
                  placeholder="e.g. 1st Place Champion, Runner Up" 
                  value={prize.position} 
                  onChange={e => {
                    const newPool = [...prizePool]; newPool[idx].position = e.target.value; setPrizePool(newPool);
                  }} 
                  className="flex-1"
                />
                <div className="w-40 relative">
                  <span className="absolute left-3 top-2.5 text-xs font-bold text-[#5c6878]">₹</span>
                  <Input 
                    type="number" 
                    placeholder="Amount" 
                    value={prize.amount} 
                    onChange={e => {
                      const newPool = [...prizePool]; newPool[idx].amount = e.target.value; setPrizePool(newPool);
                    }} 
                    className="pl-7 font-bold text-[#006c40]"
                  />
                </div>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon-sm" 
                  className="text-rose-500 hover:text-rose-700 hover:bg-rose-50" 
                  onClick={() => setPrizePool(prizePool.filter((_, i) => i !== idx))}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => navigate('/admin')}
          >
            Discard
          </Button>
          <Button 
            type="submit" 
            variant="primary"
            size="lg"
            disabled={loading}
          >
            {loading ? 'Publishing Event...' : 'Publish Tournament Event'}
          </Button>
        </div>
      </form>
    </div>
  );
}
