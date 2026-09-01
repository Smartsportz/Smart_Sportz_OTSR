import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Users, 
  Search, 
  Trophy, 
  MapPin, 
  Phone, 
  Mail, 
  ShieldCheck, 
  Eye, 
  Download, 
  CheckCircle2, 
  Clock,
  Filter,
  FileSpreadsheet,
  Layers
} from 'lucide-react';
import * as XLSX from 'xlsx';

export default function TeamsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTournamentId, setSelectedTournamentId] = useState('all');
  const [selectedSport, setSelectedSport] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedTeam, setSelectedTeam] = useState<any | null>(null);

  // Fetch all registered teams
  const { data: teamsList, isLoading: loadingTeams } = useQuery({
    queryKey: ['teams-list'],
    queryFn: async () => {
      const res = await api.get('/teams');
      return res.data;
    }
  });

  // Fetch tournaments list for the tournament selector
  const { data: tournamentsList } = useQuery({
    queryKey: ['tournaments-list-for-teams'],
    queryFn: async () => {
      const res = await api.get('/tournaments');
      return res.data;
    }
  });

  // Filter teams based on search, tournament, sport, and status
  const filteredTeams = (teamsList || []).filter((team: any) => {
    const matchesSearch = 
      team.team_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.captain.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.tournament_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (team.unique_pass && team.unique_pass.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesTournament = selectedTournamentId === 'all' || team.tournament_id === selectedTournamentId;
    const matchesSport = selectedSport === 'all' || team.tournament_sport === selectedSport;
    const matchesStatus = selectedStatus === 'all' || team.payment_status === selectedStatus;

    return matchesSearch && matchesTournament && matchesSport && matchesStatus;
  });

  // Unique sports available in dataset
  const sports = Array.from(new Set((teamsList || []).map((t: any) => t.tournament_sport).filter(Boolean)));

  // Download filtered teams as Excel (.xlsx)
  const handleExportExcel = () => {
    if (!filteredTeams || filteredTeams.length === 0) {
      alert('No teams to export with the current filter settings.');
      return;
    }

    const exportRows = filteredTeams.map((team: any, idx: number) => {
      const rosterNames = (team.players || []).map((p: any) => `${p.name} (${p.age} yrs)`).join(', ');

      return {
        'S.No': idx + 1,
        'Team Name': team.team_name,
        'Tournament': team.tournament_name,
        'Sport': team.tournament_sport,
        'Captain Name': team.captain,
        'Captain Phone': team.phone,
        'Captain Email': team.email,
        'City': team.city,
        'State': team.state,
        'Total Athletes': team.player_count || team.players?.length || 0,
        'Athletes List': rosterNames,
        'Payment Status': team.payment_status,
        'Digital Pass Ref': team.unique_pass || team.registration_id || 'N/A',
        'Registered On': team.created_at ? new Date(team.created_at).toLocaleDateString() : 'N/A'
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportRows);

    // Auto-fit column widths
    const columnWidths = [
      { wch: 6 },   // S.No
      { wch: 24 },  // Team Name
      { wch: 26 },  // Tournament
      { wch: 14 },  // Sport
      { wch: 20 },  // Captain Name
      { wch: 16 },  // Phone
      { wch: 24 },  // Email
      { wch: 16 },  // City
      { wch: 16 },  // State
      { wch: 14 },  // Total Athletes
      { wch: 45 },  // Athletes List
      { wch: 18 },  // Payment Status
      { wch: 20 },  // Pass Ref
      { wch: 16 }   // Registered On
    ];
    worksheet['!cols'] = columnWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Teams & Rosters');

    const selectedTournamentObj = tournamentsList?.find((t: any) => t.id === selectedTournamentId);
    const fileNameSuffix = selectedTournamentObj ? selectedTournamentObj.name.replace(/[^a-zA-Z0-9]/g, '_') : 'All_Tournaments';
    const dateStr = new Date().toISOString().split('T')[0];

    XLSX.writeFile(workbook, `SmartSportz_Teams_${fileNameSuffix}_${dateStr}.xlsx`);
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-[11px] font-extrabold uppercase tracking-widest text-[#006c40] mb-1">
            Squad Directory
          </div>
          <h1 className="text-3xl font-bold font-heading tracking-tight text-[#0b1c30]">
            Registered Teams & Rosters
          </h1>
          <p className="text-[#5c6878] text-sm mt-1">
            Filter, inspect athlete rosters, and export official participant records in Excel format.
          </p>
        </div>

        {/* Excel Download CTA */}
        <Button 
          variant="primary" 
          size="lg"
          onClick={handleExportExcel}
          className="shadow-[0_8px_20px_rgba(0,108,64,0.22)] flex items-center gap-2"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Download Excel ({filteredTeams.length})</span>
        </Button>
      </div>

      {/* Filters and Controls Card */}
      <div className="bg-white p-5 rounded-2xl border border-[#dbe5f5] shadow-xs space-y-4">
        {/* Tournament Selector Pill Tabs */}
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#5c6878] uppercase tracking-wider mb-2">
            <Trophy className="w-3.5 h-3.5 text-[#006c40]" /> Select Tournament:
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
              All Tournaments ({(teamsList || []).length})
            </button>
            {tournamentsList?.map((t: any) => {
              const tTeamsCount = (teamsList || []).filter((team: any) => team.tournament_id === t.id).length;

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
                    {tTeamsCount}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Search and Secondary Filter Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-3 border-t border-[#dbe5f5]">
          {/* Search Box */}
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-[#5c6878]" />
            <Input 
              placeholder="Search team, captain, phone, city, pass..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 bg-[#eff4ff]/30 text-xs"
            />
          </div>

          {/* Sport Filter */}
          <div>
            <Select value={selectedSport} onValueChange={setSelectedSport}>
              <SelectTrigger className="bg-[#eff4ff]/30 text-xs"><SelectValue placeholder="Sport: All" /></SelectTrigger>
              <SelectContent className="bg-white border border-[#dbe5f5] shadow-lg rounded-xl">
                <SelectItem value="all">All Sports</SelectItem>
                {sports.map((sport: string) => (
                  <SelectItem key={sport} value={sport}>{sport}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status Filter */}
          <div>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="bg-[#eff4ff]/30 text-xs"><SelectValue placeholder="Status: All" /></SelectTrigger>
              <SelectContent className="bg-white border border-[#dbe5f5] shadow-lg rounded-xl">
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Verified">Verified Pass</SelectItem>
                <SelectItem value="Pending Verification">Pending Verification</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Teams Table Container */}
      <div className="bg-white rounded-2xl border border-[#dbe5f5] shadow-sm overflow-hidden">
        {loadingTeams ? (
          <div className="p-12 text-center text-[#5c6878] space-y-3 animate-pulse">
            <div className="h-6 w-48 bg-neutral-200 rounded mx-auto"></div>
            <div className="h-4 w-72 bg-neutral-100 rounded mx-auto"></div>
          </div>
        ) : filteredTeams.length === 0 ? (
          <div className="p-16 text-center text-[#5c6878] space-y-2">
            <Users className="w-10 h-10 text-[#006c40]/40 mx-auto mb-1" />
            <p className="font-bold text-sm text-[#0b1c30]">No teams match the selected criteria</p>
            <p className="text-xs">Try selecting a different tournament or adjusting search filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#eff4ff]/60 border-b border-[#dbe5f5] text-[#5c6878] font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4 w-12 text-center">#</th>
                  <th className="py-3.5 px-4">Team Name</th>
                  <th className="py-3.5 px-4">Tournament</th>
                  <th className="py-3.5 px-4">Captain</th>
                  <th className="py-3.5 px-4">Phone</th>
                  <th className="py-3.5 px-4">Origin City</th>
                  <th className="py-3.5 px-4 text-center">Roster Size</th>
                  <th className="py-3.5 px-4">Pass / Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#dbe5f5]">
                {filteredTeams.map((team: any, index: number) => {
                  const isVerified = team.payment_status === 'Verified';

                  return (
                    <tr 
                      key={team.id || index}
                      className="hover:bg-[#eff4ff]/30 transition-colors"
                    >
                      <td className="py-3.5 px-4 text-center font-bold text-[#5c6878]">
                        {index + 1}
                      </td>

                      {/* Team Name */}
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-[#0b1c30] text-sm block">
                          {team.team_name}
                        </span>
                        <span className="text-[11px] text-[#5c6878]">{team.email}</span>
                      </td>

                      {/* Tournament & Sport */}
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-[#0b1c30] block">
                          {team.tournament_name}
                        </span>
                        <span className="status status-slate text-[9px] py-0 px-1.5 inline-block mt-0.5">
                          {team.tournament_sport}
                        </span>
                      </td>

                      {/* Captain */}
                      <td className="py-3.5 px-4 font-bold text-[#0b1c30]">
                        {team.captain}
                      </td>

                      {/* Phone */}
                      <td className="py-3.5 px-4 font-mono font-medium text-[#0b1c30]">
                        {team.phone}
                      </td>

                      {/* City & State */}
                      <td className="py-3.5 px-4 text-[#5c6878]">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-[#006c40]" />
                          <span>{team.city}, {team.state}</span>
                        </span>
                      </td>

                      {/* Roster count badge */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full font-bold bg-neutral-100 text-[#0b1c30]">
                          {team.player_count || team.players?.length || 0} Athletes
                        </span>
                      </td>

                      {/* Status / Pass badge */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <span className={`status ${isVerified ? 'status-emerald' : 'status-orange'} text-[10px]`}>
                            {isVerified ? 'Verified Pass' : 'Pending Verification'}
                          </span>
                          {team.unique_pass && (
                            <span className="text-[10px] font-mono text-[#006c40] font-bold block">
                              {team.unique_pass}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* View Roster Action */}
                      <td className="py-3.5 px-4 text-right">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedTeam(team)}
                          className="text-xs text-[#006c40] hover:bg-[#eaf4e4] border-[#006c40]/20"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" /> View Roster
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer summary bar */}
        <div className="p-4 bg-neutral-50/70 border-t border-[#dbe5f5] flex flex-col sm:flex-row justify-between items-center text-xs text-[#5c6878] gap-2">
          <div>
            Showing <strong>{filteredTeams.length}</strong> of <strong>{(teamsList || []).length}</strong> total registered squads.
          </div>
          <div className="font-semibold text-[#006c40]">
            Export includes full player rosters, contact records, and entry references.
          </div>
        </div>
      </div>

      {/* Roster Inspection Modal Dialog */}
      <Dialog open={Boolean(selectedTeam)} onOpenChange={(open) => !open && setSelectedTeam(null)}>
        <DialogContent className="max-w-md bg-white rounded-2xl border border-[#dbe5f5] shadow-2xl p-6">
          <DialogHeader className="border-b border-[#dbe5f5] pb-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="status status-emerald text-[10px]">{selectedTeam?.tournament_sport}</span>
              {selectedTeam?.unique_pass && (
                <span className="status status-slate text-[10px]">{selectedTeam?.unique_pass}</span>
              )}
            </div>
            <DialogTitle className="font-heading font-bold text-xl text-[#0b1c30]">
              {selectedTeam?.team_name}
            </DialogTitle>
            <p className="text-xs text-[#5c6878]">
              Captain: <strong>{selectedTeam?.captain}</strong> ({selectedTeam?.phone}) • {selectedTeam?.city}, {selectedTeam?.state}
            </p>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#5c6878]">
                Official Athlete Roster ({selectedTeam?.players?.length || 0} Registered)
              </h4>
              <span className="text-[11px] font-semibold text-[#006c40]">
                {selectedTeam?.tournament_name}
              </span>
            </div>

            <div className="divide-y divide-[#dbe5f5] border border-[#dbe5f5] rounded-xl overflow-hidden max-h-72 overflow-y-auto">
              {selectedTeam?.players?.length > 0 ? (
                selectedTeam.players.map((p: any, idx: number) => (
                  <div key={idx} className="p-3 bg-white flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-[#eff4ff] text-[#006c40] font-bold text-[10px] flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="font-bold text-[#0b1c30]">{p.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[#5c6878] font-semibold">{p.age} yrs</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-neutral-100 text-[#5c6878]">
                        {idx === 0 ? 'Captain' : idx === 1 ? 'Sub-Cap' : 'Player'}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-xs text-[#5c6878]">
                  No player records attached to this team.
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

