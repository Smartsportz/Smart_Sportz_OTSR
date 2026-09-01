import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { 
  UserCog, 
  Plus, 
  Edit, 
  Trash2, 
  MapPin, 
  Mail, 
  Phone, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle,
  X,
  Search,
  PlusCircle
} from 'lucide-react';
import { motion } from 'framer-motion';

const defaultCitiesList = [
  'Mumbai',
  'Bengaluru',
  'Delhi NCR',
  'Chennai',
  'Hyderabad',
  'Kolkata',
  'Pune',
  'Mysuru',
  'Ahmedabad',
  'Jaipur',
  'Chandigarh',
  'Kochi'
];

interface OperatorItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  allocated_places: string[];
  created_at: string;
}

export default function AdminOperators() {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingOperator, setEditingOperator] = useState<OperatorItem | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<OperatorItem | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formPassword, setFormPassword] = useState('operator123');
  const [allocatedPlaces, setAllocatedPlaces] = useState<string[]>(['Mumbai']);
  const [customCity, setCustomCity] = useState('');

  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  const { data: rawData, isLoading, error: fetchError, refetch } = useQuery({
    queryKey: ['admin-operators'],
    queryFn: async () => {
      try {
        const res = await api.get('/operators');
        return Array.isArray(res.data) ? res.data : [];
      } catch (err: any) {
        console.error('Error fetching operators:', err);
        return [];
      }
    }
  });

  const operators: OperatorItem[] = Array.isArray(rawData) ? rawData : [];

  const handleOpenAdd = () => {
    setEditingOperator(null);
    setFormName('');
    setFormEmail('');
    setFormPhone('');
    setFormPassword('operator123');
    setAllocatedPlaces(['Mumbai']);
    setCustomCity('');
    setFormError('');
    setFormSuccess('');
    setModalOpen(true);
  };

  const handleOpenEdit = (op: OperatorItem) => {
    if (!op) return;
    setEditingOperator(op);
    setFormName(op.name || '');
    setFormEmail(op.email || '');
    setFormPhone(op.phone || '');
    setFormPassword('');
    let places: string[] = ['Mumbai'];
    if (Array.isArray(op.allocated_places)) {
      places = op.allocated_places;
    } else if (typeof op.allocated_places === 'string') {
      try { places = JSON.parse(op.allocated_places); } catch { places = [op.allocated_places]; }
    }
    setAllocatedPlaces(places.length > 0 ? places : ['Mumbai']);
    setCustomCity('');
    setFormError('');
    setFormSuccess('');
    setModalOpen(true);
  };

  const toggleCity = (city: string) => {
    if (allocatedPlaces.includes(city)) {
      setAllocatedPlaces(allocatedPlaces.filter(c => c !== city));
    } else {
      setAllocatedPlaces([...allocatedPlaces, city]);
    }
  };

  const handleAddCustomCity = () => {
    const trimmed = customCity.trim();
    if (!trimmed) return;
    if (!allocatedPlaces.includes(trimmed)) {
      setAllocatedPlaces([...allocatedPlaces, trimmed]);
    }
    setCustomCity('');
  };

  const handleSaveOperator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formEmail.trim()) {
      setFormError('Name and email are required.');
      return;
    }
    if (allocatedPlaces.length === 0) {
      setFormError('Please allocate at least one place/city to this operator.');
      return;
    }

    setSaving(true);
    setFormError('');
    setFormSuccess('');

    try {
      const payload: any = {
        name: formName.trim(),
        email: formEmail.trim(),
        phone: formPhone.trim() || '9999999999',
        allocated_places: allocatedPlaces
      };

      if (editingOperator) {
        if (formPassword && formPassword.trim()) {
          payload.password = formPassword.trim();
        }
        await api.put(`/operators/${editingOperator.id}`, payload);
      } else {
        payload.password = formPassword || 'operator123';
        await api.post('/operators', payload);
      }

      queryClient.invalidateQueries({ queryKey: ['admin-operators'] });
      setModalOpen(false);
    } catch (err: any) {
      setFormError(err.response?.data?.error || err.message || 'Failed to save operator');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteOperator = async () => {
    if (!deleteCandidate) return;
    try {
      await api.delete(`/operators/${deleteCandidate.id}`);
      queryClient.invalidateQueries({ queryKey: ['admin-operators'] });
      setDeleteCandidate(null);
    } catch (err: any) {
      alert(err.response?.data?.error || err.message || 'Failed to delete operator');
    }
  };

  const filteredOperators = operators.filter(op => {
    if (!op) return false;
    const q = (search || '').toLowerCase().trim();
    if (!q) return true;
    
    const name = String(op.name || '').toLowerCase();
    const email = String(op.email || '').toLowerCase();
    const phone = String(op.phone || '').toLowerCase();
    
    let places: string[] = [];
    if (Array.isArray(op.allocated_places)) {
      places = op.allocated_places;
    } else if (typeof op.allocated_places === 'string') {
      try { places = JSON.parse(op.allocated_places); } catch { places = [op.allocated_places]; }
    }
    
    return (
      name.includes(q) ||
      email.includes(q) ||
      phone.includes(q) ||
      places.some(p => String(p || '').toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-8 pb-16">
      {/* Header & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-[11px] font-extrabold uppercase tracking-widest text-[#006c40] mb-1">
            Access & Region Allocation
          </div>
          <h1 className="text-3xl font-bold font-heading tracking-tight text-[#0b1c30]">
            Regional Operators Management
          </h1>
          <p className="text-[#5c6878] text-sm mt-1">
            Create regional operator accounts and allocate specific cities/places for managing tournament registrations.
          </p>
        </div>

        <Button 
          variant="primary" 
          onClick={handleOpenAdd}
          className="flex items-center gap-2 shadow-sm self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Operator</span>
        </Button>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-2xl border border-[#dbe5f5] shadow-xs">
        <div className="relative w-full md:w-96">
          <Input 
            placeholder="Search by name, email, phone, or assigned place..." 
            value={search} 
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-10 rounded-xl"
          />
          <Search className="w-4 h-4 text-[#5c6878] absolute left-3 top-3 pointer-events-none" />
        </div>
        <div className="text-xs text-[#5c6878] font-bold">
          Total Operators: <span className="text-[#006c40]">{operators.length}</span>
        </div>
      </div>

      {/* Operators Table */}
      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          <div className="h-14 bg-white/70 rounded-xl border border-[#dbe5f5]"></div>
          <div className="h-20 bg-white/70 rounded-xl border border-[#dbe5f5]"></div>
          <div className="h-20 bg-white/70 rounded-xl border border-[#dbe5f5]"></div>
        </div>
      ) : filteredOperators.length === 0 ? (
        <Card className="tactile-card border border-[#dbe5f5] bg-white p-12 text-center">
          <UserCog className="w-12 h-12 text-[#5c6878] mx-auto mb-3 opacity-60" />
          <h3 className="font-heading font-bold text-lg text-[#0b1c30]">No operators found</h3>
          <p className="text-xs text-[#5c6878] mt-1 max-w-sm mx-auto">
            {search ? 'Try adjusting your search query.' : 'Click "Add New Operator" to create an operational manager account.'}
          </p>
        </Card>
      ) : (
        <div className="bg-white rounded-2xl border border-[#dbe5f5] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#eff4ff]/60 border-b border-[#dbe5f5] text-[#5c6878] uppercase text-[10px] font-extrabold tracking-wider">
                <tr>
                  <th className="py-3.5 px-4 w-12 text-center">#</th>
                  <th className="py-3.5 px-4 min-w-[180px]">Operator Name</th>
                  <th className="py-3.5 px-4 min-w-[200px]">Email & Contact</th>
                  <th className="py-3.5 px-4 min-w-[220px]">Allocated Places / Cities</th>
                  <th className="py-3.5 px-4 w-28">Status</th>
                  <th className="py-3.5 px-4 w-28">Created Date</th>
                  <th className="py-3.5 px-4 w-28 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#dbe5f5]/60">
                {filteredOperators.map((op, idx) => (
                  <tr key={op.id} className="hover:bg-[#eff4ff]/30 transition-colors">
                    <td className="py-3.5 px-4 text-center font-bold text-[#5c6878]">{idx + 1}</td>
                    
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#006c40] to-[#0b8852] text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                          {op.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <strong className="text-sm font-heading font-bold text-[#0b1c30] block">
                            {op.name}
                          </strong>
                          <span className="text-[10px] uppercase font-extrabold text-[#006c40]">
                            Regional Operator
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 space-y-1">
                      <div className="flex items-center gap-1.5 text-[#0b1c30]">
                        <Mail className="w-3.5 h-3.5 text-[#5c6878]" />
                        <span>{op.email}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[#5c6878]">
                        <Phone className="w-3.5 h-3.5" />
                        <span>{op.phone || '-'}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      {(() => {
                        let places: string[] = [];
                        if (Array.isArray(op.allocated_places)) {
                          places = op.allocated_places;
                        } else if (typeof op.allocated_places === 'string') {
                          try { places = JSON.parse(op.allocated_places); } catch { places = [op.allocated_places]; }
                        }
                        return (
                          <div className="flex flex-wrap gap-1.5 max-w-xs">
                            {places && places.length > 0 ? (
                              places.map((place: string) => (
                                <span 
                                  key={place} 
                                  className="px-2 py-0.5 rounded-md bg-[#eff4ff] border border-[#dbe5f5] text-[#006c40] font-extrabold text-[11px] flex items-center gap-1"
                                >
                                  <MapPin className="w-2.5 h-2.5" />
                                  {place}
                                </span>
                              ))
                            ) : (
                              <span className="text-gray-400 italic text-[11px]">No places allocated</span>
                            )}
                          </div>
                        );
                      })()}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-[#006c40] border border-emerald-200 text-[10px] font-extrabold uppercase">
                        {op.status || 'Active'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-[#5c6878]">
                      {op.created_at ? new Date(op.created_at).toLocaleDateString('en-IN') : 'Active'}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button 
                          variant="ghost" 
                          size="icon-sm"
                          onClick={() => handleOpenEdit(op)}
                          className="text-[#0b1c30] hover:bg-neutral-100"
                          title="Edit Operator & Place Allocation"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon-sm"
                          onClick={() => setDeleteCandidate(op)}
                          className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                          title="Delete Operator"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Operator Modal Dialog */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#dbe5f5] max-w-xl w-full max-h-[90vh] overflow-y-auto flex flex-col animate-in fade-in">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#006c40] to-[#0b8852] p-5 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-extrabold text-lg text-white border border-white/30">
                  <UserCog className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading font-extrabold text-lg leading-tight">
                    {editingOperator ? `Edit Operator: ${editingOperator.name}` : 'Add New Regional Operator'}
                  </h3>
                  <p className="text-xs text-emerald-100">
                    Set credentials and allocate regional tournament access.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveOperator} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <Label className="text-xs font-bold uppercase tracking-wider text-[#5c6878]">Operator Full Name *</Label>
                  <Input 
                    type="text" 
                    required 
                    placeholder="e.g. Rajesh Kumar" 
                    value={formName} 
                    onChange={e => setFormName(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-bold uppercase tracking-wider text-[#5c6878]">Email Address *</Label>
                    <Input 
                      type="email" 
                      required 
                      placeholder="operator@smartsportz.in" 
                      value={formEmail} 
                      onChange={e => setFormEmail(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-bold uppercase tracking-wider text-[#5c6878]">Phone Number</Label>
                    <Input 
                      type="tel" 
                      maxLength={10}
                      placeholder="10-digit mobile" 
                      value={formPhone} 
                      onChange={e => setFormPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-bold uppercase tracking-wider text-[#5c6878]">
                    {editingOperator ? 'Update Password (Optional)' : 'Default Password *'}
                  </Label>
                  <Input 
                    type="text" 
                    placeholder={editingOperator ? 'Leave blank to keep unchanged' : 'Default password: operator123'} 
                    value={formPassword} 
                    onChange={e => setFormPassword(e.target.value)}
                    className="mt-1"
                  />
                  <span className="text-[11px] text-[#5c6878]">
                    {editingOperator ? 'Only fill if you want to reset password.' : 'Default: operator123. Operator can change it anytime.'}
                  </span>
                </div>

                {/* Multiple Place Allocation Checkboxes */}
                <div className="p-4 rounded-xl border border-[#dbe5f5] bg-[#eff4ff]/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold uppercase tracking-wider text-[#006c40] flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" /> Allocated Places / Regional Access *
                    </Label>
                    <span className="text-xs font-bold text-[#006c40]">
                      {allocatedPlaces.length} Place(s) Selected
                    </span>
                  </div>

                  <p className="text-xs text-[#5c6878]">
                    Select one or multiple cities this operator is permitted to view, manage, and register tournament teams for.
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                    {defaultCitiesList.map(city => {
                      const isSelected = allocatedPlaces.includes(city);
                      return (
                        <button
                          key={city}
                          type="button"
                          onClick={() => toggleCity(city)}
                          className={`p-2 rounded-xl border text-xs font-bold transition-all flex items-center gap-2 cursor-pointer text-left ${
                            isSelected 
                              ? 'bg-[#006c40] text-white border-[#006c40] shadow-xs' 
                              : 'bg-white border-[#dbe5f5] text-[#0b1c30] hover:border-[#006c40]'
                          }`}
                        >
                          <span className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center text-[9px] ${
                            isSelected ? 'bg-white text-[#006c40] border-white' : 'border-gray-300'
                          }`}>
                            {isSelected && '✓'}
                          </span>
                          <span className="truncate">{city}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Add Custom Place */}
                  <div className="flex gap-2 pt-2 border-t border-[#dbe5f5]/70">
                    <Input 
                      placeholder="Add another city / place..." 
                      value={customCity} 
                      onChange={e => setCustomCity(e.target.value)}
                      className="h-9 text-xs"
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddCustomCity(); } }}
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={handleAddCustomCity}
                      className="text-xs shrink-0"
                    >
                      <PlusCircle className="w-3.5 h-3.5 mr-1 text-[#006c40]" /> Add Place
                    </Button>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-[#dbe5f5]">
                <Button type="button" variant="outline" size="sm" onClick={() => setModalOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={saving} 
                  size="sm" 
                  className="bg-[#006c40] hover:bg-[#0b8852] text-white"
                >
                  {saving ? 'Saving...' : editingOperator ? 'Save Changes' : 'Create Operator'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteCandidate && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#dbe5f5] max-w-sm w-full p-6 space-y-4 animate-in fade-in text-center">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-heading font-extrabold text-lg text-[#0b1c30]">Delete Operator?</h3>
              <p className="text-xs text-[#5c6878] mt-1">
                Are you sure you want to remove <strong className="text-[#0b1c30]">{deleteCandidate.name}</strong> ({deleteCandidate.email})? They will lose access to all allocated tournament areas.
              </p>
            </div>
            <div className="flex gap-2 justify-center pt-2">
              <Button variant="outline" size="sm" onClick={() => setDeleteCandidate(null)}>
                Cancel
              </Button>
              <Button variant="destructive" size="sm" onClick={handleDeleteOperator}>
                Confirm Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
