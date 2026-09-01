import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Trophy, 
  MapPin, 
  Calendar, 
  Users, 
  ShieldCheck, 
  QrCode, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  AlertCircle,
  XCircle,
  Building2,
  Phone,
  Mail,
  UserCheck
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function RegistrationFlow() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [successData, setSuccessData] = useState<any>(null);

  const { data: tournament, isLoading } = useQuery({
    queryKey: ['tournament', id],
    queryFn: async () => {
      const res = await api.get(`/tournaments/${id}`);
      return res.data;
    }
  });

  const [formData, setFormData] = useState({
    team_name: '', city: '', state: '',
    captain: '', sub_captain: '', coach: '',
    email: '', phone: '',
    rules_accepted: false
  });

  const [teamNameError, setTeamNameError] = useState('');
  const [checkingTeamName, setCheckingTeamName] = useState(false);

  // Player roster slots pre-populated based on tournament.max_members
  const maxMembers = Number(tournament?.max_members || 15);
  const minMembers = Number(tournament?.min_members || 1);
  const minAge = Number(tournament?.min_age || 10);
  const maxAge = Number(tournament?.max_age || 50);

  const [playerSlots, setPlayerSlots] = useState<Array<{ name: string; age: string; size?: string }>>([]);

  // Initialize slots when tournament loads
  useEffect(() => {
    if (tournament && playerSlots.length === 0) {
      const count = Number(tournament.max_members || 15);
      const initialSlots = Array.from({ length: count }, () => ({ name: '', age: '', size: 'M' }));
      setPlayerSlots(initialSlots);
    }
  }, [tournament]);

  // Check team name uniqueness with debounce
  useEffect(() => {
    const trimmed = formData.team_name.trim();
    if (!trimmed || !id) {
      setTeamNameError('');
      return;
    }

    const timer = setTimeout(async () => {
      setCheckingTeamName(true);
      try {
        const res = await api.get(`/tournaments/${id}/check-team?name=${encodeURIComponent(trimmed)}`);
        if (res.data.exists) {
          setTeamNameError('This team name is already taken. Please choose another name.');
        } else {
          setTeamNameError('');
        }
      } catch (err) {
        setTeamNameError('');
      } finally {
        setCheckingTeamName(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [formData.team_name, id]);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse max-w-4xl mx-auto">
        <div className="h-28 bg-white/70 rounded-2xl border border-[#dbe5f5]"></div>
        <div className="h-96 bg-white/70 rounded-2xl border border-[#dbe5f5]"></div>
      </div>
    );
  }

  const handlePlayerChange = (index: number, field: 'name' | 'age' | 'size', value: string) => {
    const updated = [...playerSlots];
    updated[index] = { ...updated[index], [field]: value };
    setPlayerSlots(updated);
  };

  // Helper validation functions
  const isAgeValid = (ageStr: string): boolean => {
    if (!ageStr) return false;
    const num = Number(ageStr);
    return !isNaN(num) && num >= minAge && num <= maxAge;
  };

  // Validate step 1:
  // 1. Team name not empty and not duplicated
  // 2. Captain, city, state, email, phone not empty
  // 3. Rules accepted
  // 4. At least `minMembers` filled with valid names and ages in [minAge, maxAge]
  // 5. Any other filled slots must also have valid names & ages in [minAge, maxAge]
  const filledSlots = playerSlots.filter(p => p.name.trim() !== '' || p.age.trim() !== '');
  const validFilledSlots = playerSlots.filter(p => p.name.trim() !== '' && isAgeValid(p.age));
  
  const hasMinMembersValid = validFilledSlots.length >= minMembers;
  const allTouchedSlotsValid = filledSlots.every(p => p.name.trim() !== '' && isAgeValid(p.age));

  const isPhoneValid = /^[0-9]{10}$/.test(formData.phone);

  const isStep1Valid = Boolean(
    formData.team_name.trim() &&
    !teamNameError &&
    formData.captain.trim() &&
    formData.city.trim() &&
    formData.state.trim() &&
    formData.email.trim() &&
    isPhoneValid &&
    formData.rules_accepted &&
    hasMinMembersValid &&
    allTouchedSlotsValid
  );

  const handleNext = () => setStep(step + 1);
  const handleBack = () => setStep(step - 1);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const activePlayers = playerSlots.filter(p => p.name.trim() !== '');
      const res = await api.post('/registrations', {
        tournament_id: id,
        ...formData,
        players: activePlayers
      });
      setSuccessData(res.data);
      setStep(4);
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const totalFee = tournament?.payment_lines?.reduce((sum: number, line: any) => sum + Number(line.amount), 0) || 500;

  const stepsList = [
    { num: 1, title: 'Team Roster' },
    { num: 2, title: 'Fee Review' },
    { num: 3, title: 'UPI Payment' },
    { num: 4, title: 'Verification' }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Tournament Header Banner */}
      <Card className="tactile-card border border-[#dbe5f5] bg-white p-6 shadow-sm overflow-hidden relative">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-[#006c40] to-[#0b8852] rounded-2xl flex items-center justify-center text-white shadow-md flex-shrink-0">
              <Trophy className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="status status-emerald text-[10px]">{tournament?.sport}</span>
                <span className="text-xs text-[#5c6878]">ID: {tournament?.id}</span>
              </div>
              <h1 className="text-2xl font-bold font-heading text-[#0b1c30]">{tournament?.name}</h1>
              <p className="text-xs text-[#5c6878] mt-0.5 flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-[#006c40]" /> {tournament?.primary_place} • {tournament?.address}
              </p>
            </div>
          </div>
          <div className="flex md:flex-col items-end justify-between border-t md:border-t-0 md:border-l border-[#dbe5f5] pt-3 md:pt-0 md:pl-6 text-xs text-[#5c6878] gap-1">
            <div className="flex items-center gap-1.5 font-bold text-[#0b1c30]">
              <Calendar className="w-3.5 h-3.5 text-[#006c40]" />
              <span>{new Date(tournament?.tournament_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
            <div>Eligible Age: <strong className="text-[#0b1c30]">{minAge} - {maxAge} yrs</strong></div>
            <div>Team Roster: <strong className="text-[#0b1c30]">{minMembers} min / {maxMembers} max athletes</strong></div>
          </div>
        </div>
      </Card>

      {/* Progress Stepper */}
      <div className="flex items-center justify-between px-4">
        {stepsList.map((s, idx) => (
          <React.Fragment key={s.num}>
            <div className="flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                step === s.num 
                  ? 'bg-[#006c40] text-white shadow-[0_0_15px_rgba(0,108,64,0.35)] ring-4 ring-[#006c40]/15' 
                  : step > s.num 
                    ? 'bg-[#eaf4e4] text-[#006c40] font-extrabold' 
                    : 'bg-white border border-[#dbe5f5] text-[#5c6878]'
              }`}>
                {step > s.num ? <CheckCircle2 className="w-4 h-4" /> : s.num}
              </div>
              <span className={`text-xs font-bold hidden sm:inline ${step >= s.num ? 'text-[#0b1c30]' : 'text-[#5c6878]'}`}>
                {s.title}
              </span>
            </div>
            {idx < stepsList.length - 1 && (
              <div className={`flex-1 h-0.5 mx-3 transition-colors ${step > s.num ? 'bg-[#006c40]' : 'bg-[#dbe5f5]'}`}></div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step 1: Team & Players */}
      {step === 1 && (
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <Card className="tactile-card border border-[#dbe5f5] bg-white p-6 shadow-sm space-y-6">
            <CardHeader className="p-0 pb-4 border-b border-[#dbe5f5]">
              <CardTitle className="text-lg font-bold font-heading text-[#0b1c30]">Team Information & Captain Contact</CardTitle>
              <p className="text-xs text-[#5c6878]">Provide official team registration details and athlete roster.</p>
            </CardHeader>

            <CardContent className="p-0 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold uppercase tracking-wider text-[#5c6878]">Team Name</Label>
                    {checkingTeamName && <span className="text-[10px] text-[#5c6878] animate-pulse">Checking name...</span>}
                  </div>
                  <Input 
                    required 
                    placeholder="e.g. Mumbai Warriors" 
                    value={formData.team_name} 
                    onChange={e => setFormData({ ...formData, team_name: e.target.value })}
                    className={teamNameError ? 'border-rose-500 focus-visible:ring-rose-500' : ''}
                  />
                  {teamNameError && (
                    <div className="flex items-center gap-1 text-[11px] font-bold text-rose-600 mt-1">
                      <XCircle className="w-3.5 h-3.5" />
                      <span>{teamNameError}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider text-[#5c6878]">Captain Full Name</Label>
                  <Input 
                    required 
                    placeholder="Primary Team Captain" 
                    value={formData.captain} 
                    onChange={e => setFormData({ ...formData, captain: e.target.value })} 
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider text-[#5c6878]">City / Club</Label>
                  <Input 
                    required 
                    placeholder="e.g. Mumbai" 
                    value={formData.city} 
                    onChange={e => setFormData({ ...formData, city: e.target.value })} 
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider text-[#5c6878]">State</Label>
                  <Input 
                    required 
                    placeholder="e.g. Maharashtra" 
                    value={formData.state} 
                    onChange={e => setFormData({ ...formData, state: e.target.value })} 
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider text-[#5c6878]">Captain Email</Label>
                  <Input 
                    type="email" 
                    required 
                    placeholder="captain@team.in" 
                    value={formData.email} 
                    onChange={e => setFormData({ ...formData, email: e.target.value })} 
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold uppercase tracking-wider text-[#5c6878]">Captain Phone Number</Label>
                    <span className="text-[10px] font-bold text-[#5c6878]">{formData.phone.length}/10 digits</span>
                  </div>
                  <Input 
                    type="tel" 
                    inputMode="numeric"
                    pattern="[0-9]{10}"
                    maxLength={10}
                    required 
                    placeholder="10-digit Mobile Number (e.g. 9876543210)" 
                    value={formData.phone} 
                    onChange={e => {
                      const onlyNums = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setFormData({ ...formData, phone: onlyNums });
                    }} 
                    className={formData.phone.length > 0 && formData.phone.length < 10 ? 'border-amber-500 focus-visible:ring-amber-500' : ''}
                  />
                  {formData.phone.length > 0 && formData.phone.length < 10 && (
                    <div className="flex items-center gap-1 text-[11px] font-bold text-amber-600 mt-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>Phone number must be exactly 10 digits ({10 - formData.phone.length} more needed).</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Pre-rendered Player Roster Slots */}
              <div className="pt-6 border-t border-[#dbe5f5] space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div>
                    <h3 className="text-base font-bold font-heading text-[#0b1c30]">
                      Athlete Roster ({validFilledSlots.length} / {maxMembers} filled)
                    </h3>
                    <p className="text-xs text-[#5c6878]">
                      Fill at least <strong>{minMembers} athlete{minMembers > 1 ? 's' : ''}</strong> (slots 1 to {minMembers} are required). Remaining slots are optional.
                    </p>
                  </div>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                    hasMinMembersValid 
                      ? 'bg-[#eaf4e4] text-[#006c40]' 
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    {hasMinMembersValid ? '✓ Minimum Roster Met' : `Need ${minMembers - validFilledSlots.length} more player(s)`}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {playerSlots.map((slot, idx) => {
                    const isRequired = idx < minMembers;
                    const hasName = slot.name.trim() !== '';
                    const hasAge = slot.age.trim() !== '';
                    const ageNum = Number(slot.age);
                    const isAgeOut = hasAge && (isNaN(ageNum) || ageNum < minAge || ageNum > maxAge);

                    return (
                      <div 
                        key={idx} 
                        className={`p-3 rounded-xl border transition-all ${
                          isRequired 
                            ? 'bg-[#eff4ff]/50 border-[#dbe5f5]' 
                            : 'bg-white border-[#dbe5f5]/80'
                        }`}
                      >
                        <div className="flex flex-wrap md:flex-nowrap gap-3 items-center">
                          <span className={`w-7 h-7 rounded-full font-bold text-xs flex items-center justify-center flex-shrink-0 ${
                            isRequired 
                              ? 'bg-[#006c40] text-white shadow-xs' 
                              : 'bg-neutral-100 text-[#5c6878]'
                          }`}>
                            {idx + 1}
                          </span>

                          <div className="flex-1 min-w-[200px]">
                            <Input 
                              placeholder={isRequired ? `Player ${idx + 1} Name (Required)` : `Player ${idx + 1} Name (Optional)`}
                              value={slot.name}
                              onChange={e => handlePlayerChange(idx, 'name', e.target.value)}
                            />
                          </div>

                          <div className="w-32">
                            <Input 
                              type="number" 
                              placeholder={`Age (${minAge}-${maxAge})`}
                              value={slot.age}
                              onChange={e => handlePlayerChange(idx, 'age', e.target.value)}
                              className={isAgeOut ? 'border-rose-500 focus-visible:ring-rose-500 text-rose-600' : ''}
                            />
                          </div>

                          {/* T-Shirt / Jersey Size Input (if enabled for this tournament) */}
                          {Boolean(tournament?.show_jersey_size) && (
                            <div className="w-28">
                              <select
                                value={slot.size || 'M'}
                                onChange={e => handlePlayerChange(idx, 'size', e.target.value)}
                                className="w-full h-10 px-2.5 py-1.5 rounded-xl border border-[#dbe5f5] text-xs font-bold text-[#0b1c30] bg-white focus:outline-hidden focus:border-[#006c40]"
                                title="Uniform / T-Shirt Size"
                              >
                                <option value="XS">Size XS</option>
                                <option value="S">Size S</option>
                                <option value="M">Size M</option>
                                <option value="L">Size L</option>
                                <option value="XL">Size XL</option>
                                <option value="XXL">Size XXL</option>
                              </select>
                            </div>
                          )}

                          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg ${
                            isRequired 
                              ? 'bg-emerald-50 text-[#006c40]' 
                              : 'bg-neutral-100 text-[#5c6878]'
                          }`}>
                            {idx === 0 ? 'Captain' : idx === 1 ? 'Sub-Captain' : isRequired ? 'Required' : 'Optional'}
                          </span>
                        </div>

                        {isAgeOut && (
                          <div className="flex items-center gap-1 text-[11px] font-bold text-rose-600 mt-1.5 pl-10">
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>Athlete age must be between {minAge} and {maxAge} years.</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Tournament Fair-Play Agreement */}
              <div className="pt-4 border-t border-[#dbe5f5] flex items-start gap-3 bg-[#eaf4e4]/40 p-4 rounded-xl">
                <Checkbox 
                  id="rules" 
                  checked={formData.rules_accepted} 
                  onCheckedChange={(c) => setFormData({ ...formData, rules_accepted: !!c })} 
                  className="mt-0.5"
                />
                <label htmlFor="rules" className="text-xs text-[#0b1c30] font-medium leading-relaxed cursor-pointer select-none">
                  I confirm that all entered athletes meet the tournament age criteria ({minAge} to {maxAge} years) and agree to abide by all Smart Sportz tournament regulations and fair-play policies.
                </label>
              </div>

              <div className="flex items-center justify-between pt-2">
                <Button variant="outline" onClick={() => navigate('/operator')}>Cancel</Button>
                <Button 
                  variant="primary" 
                  onClick={handleNext} 
                  disabled={!isStep1Valid}
                  className="flex items-center gap-2"
                >
                  <span>Review Fee Summary</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Step 2: Summary */}
      {step === 2 && (
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <Card className="tactile-card border border-[#dbe5f5] bg-white overflow-hidden p-0 shadow-sm">
            <div className="bg-gradient-to-r from-[#006c40] to-[#0b8852] p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-200">Step 2 of 4</span>
                  <h2 className="text-xl font-bold font-heading text-white">Registration & Fee Summary</h2>
                </div>
                <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold text-white">
                  {formData.team_name}
                </span>
              </div>
            </div>

            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl bg-[#eff4ff]/50 border border-[#dbe5f5] text-xs">
                <div>
                  <span className="text-[#5c6878] block">Team Name:</span>
                  <strong className="text-sm font-heading text-[#0b1c30]">{formData.team_name}</strong>
                </div>
                <div>
                  <span className="text-[#5c6878] block">Captain:</span>
                  <strong className="text-sm font-heading text-[#0b1c30]">{formData.captain}</strong>
                </div>
                <div>
                  <span className="text-[#5c6878] block">Origin:</span>
                  <strong className="text-sm font-heading text-[#0b1c30]">{formData.city}, {formData.state}</strong>
                </div>
                <div>
                  <span className="text-[#5c6878] block">Total Athletes:</span>
                  <strong className="text-sm font-heading text-[#0b1c30]">{validFilledSlots.length} Players</strong>
                </div>
              </div>

              {/* Registered Team Members Roster Display */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-[#5c6878] flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#006c40]" /> Registered Team Members ({validFilledSlots.length})
                  </h3>
                  <span className="text-xs text-[#006c40] font-bold">Roster Verified</span>
                </div>

                <div className="border border-[#dbe5f5] rounded-xl overflow-hidden shadow-2xs">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-[#eff4ff]/70 text-[#5c6878] uppercase text-[10px] font-extrabold tracking-wider border-b border-[#dbe5f5]">
                      <tr>
                        <th className="py-2.5 px-3 w-12 text-center">#</th>
                        <th className="py-2.5 px-3">Athlete Name</th>
                        <th className="py-2.5 px-3 w-20">Age</th>
                        {Boolean(tournament?.show_jersey_size) && (
                          <th className="py-2.5 px-3 w-24">Uniform Size</th>
                        )}
                        <th className="py-2.5 px-3 w-28 text-right">Role</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#dbe5f5]/60 bg-white">
                      {validFilledSlots.map((player, idx) => (
                        <tr key={idx} className="hover:bg-[#eff4ff]/20">
                          <td className="py-2 px-3 text-center font-bold text-[#5c6878]">{idx + 1}</td>
                          <td className="py-2 px-3 font-bold text-[#0b1c30]">{player.name}</td>
                          <td className="py-2 px-3 text-[#5c6878]">{player.age} yrs</td>
                          {Boolean(tournament?.show_jersey_size) && (
                            <td className="py-2 px-3">
                              <span className="px-2 py-0.5 rounded-md bg-[#eff4ff] text-[#006c40] font-bold text-[11px]">
                                {player.size || 'M'}
                              </span>
                            </td>
                          )}
                          <td className="py-2 px-3 text-right">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              idx === 0 ? 'bg-emerald-50 text-[#006c40]' : idx === 1 ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-600'
                            }`}>
                              {idx === 0 ? 'Captain' : idx === 1 ? 'Sub-Captain' : 'Player'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Fee Breakdown */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#5c6878]">Required Tournament Fees</h3>
                <div className="divide-y divide-[#dbe5f5] rounded-xl border border-[#dbe5f5] overflow-hidden">
                  {tournament?.payment_lines?.map((line: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center p-3.5 text-xs bg-white">
                      <span className="font-semibold text-[#0b1c30]">{line.title}</span>
                      <strong className="font-bold text-[#0b1c30]">₹{line.amount}</strong>
                    </div>
                  ))}
                  <div className="flex justify-between items-center p-4 bg-[#eaf4e4] text-sm">
                    <span className="font-extrabold text-[#006c40]">Total Payable Amount</span>
                    <strong className="text-xl font-bold font-heading text-[#006c40]">₹{totalFee}</strong>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4">
                <Button variant="outline" onClick={handleBack}>
                  <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Roster
                </Button>
                <Button variant="primary" onClick={handleNext} className="flex items-center gap-2">
                  <span>Proceed to UPI Payment</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Step 3: Manual UPI Payment (Screenshot Upload Removed) */}
      {step === 3 && (
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <Card className="tactile-card border border-[#dbe5f5] bg-white p-6 shadow-sm space-y-6 text-center">
            <CardHeader className="p-0 pb-4 border-b border-[#dbe5f5]">
              <CardTitle className="text-lg font-bold font-heading text-[#0b1c30]">Tournament UPI Payment</CardTitle>
              <p className="text-xs text-[#5c6878]">
                Scan the official Smart Sportz QR code using any UPI App (GPay, PhonePe, Paytm, BHIM) to complete the transfer.
              </p>
            </CardHeader>

            <CardContent className="p-0 space-y-6">
              {/* QR Code Container */}
              <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-[#eff4ff]/60 border border-[#dbe5f5] max-w-sm mx-auto">
                <div className="bg-white p-4 rounded-2xl border border-[#dbe5f5] shadow-md mb-3">
                  <QRCodeSVG 
                    value={`upi://pay?pa=smartsportz@upi&pn=SmartSportz%20Championship&am=${totalFee}&cu=INR`} 
                    size={180} 
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-bold text-[#5c6878]">Tournament UPI VPA:</span>
                  <p className="text-sm font-extrabold text-[#006c40] font-mono bg-white px-4 py-1.5 rounded-lg border border-[#dbe5f5]">
                    smartsportz@upi
                  </p>
                  <p className="text-sm font-bold text-[#0b1c30] mt-1">Exact Payable Amount: <span className="text-[#006c40] font-extrabold">₹{totalFee}</span></p>
                </div>
              </div>

              <div className="p-4 bg-[#eaf4e4]/60 border border-[#bce1bf] rounded-xl text-xs text-[#006c40] max-w-md mx-auto leading-relaxed text-left space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" /> Instant Operator Verification
                </p>
                <p className="text-[#5c6878]">
                  Once you have initiated the UPI transfer, click below to submit your official application. The tournament admin will verify the transfer and issue your digital entry pass.
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-[#dbe5f5]">
                <Button variant="outline" onClick={handleBack}>
                  <ArrowLeft className="w-4 h-4 mr-1.5" /> Back
                </Button>
                <Button 
                  variant="primary" 
                  onClick={handleSubmit} 
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{loading ? 'Submitting Registration...' : 'Complete & Submit Registration'}</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Step 4: Verification Submitted */}
      {step === 4 && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.35 }}>
          <Card className="tactile-card border border-emerald-200 bg-white p-8 text-center space-y-6 shadow-md max-w-2xl mx-auto">
            <div className="w-20 h-20 bg-gradient-to-br from-[#006c40] to-[#0b8852] rounded-3xl flex items-center justify-center mx-auto text-white shadow-lg">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <span className="status status-emerald text-xs mb-2">Registration Submitted</span>
              <h2 className="text-2xl font-bold font-heading text-[#0b1c30]">Application in Review</h2>
              <p className="text-xs text-[#5c6878] mt-1.5 max-w-md mx-auto leading-relaxed">
                Your team registration has been recorded and submitted for tournament administrator verification.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#eff4ff] border border-[#dbe5f5] max-w-sm mx-auto space-y-1">
              <span className="text-xs text-[#5c6878]">Tracking Pass Reference</span>
              <p className="text-2xl font-bold font-heading text-[#006c40] tracking-wider font-mono">
                {successData?.registration_id}
              </p>
              <p className="text-[11px] font-bold text-amber-600 pt-1">Status: Pending Admin Verification</p>
            </div>

            <div className="pt-4 flex justify-center gap-3">
              <Button 
                variant="primary"
                onClick={() => navigate('/operator')}
              >
                Return to Tournaments Dashboard
              </Button>
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

