import React, { useState } from 'react';
import { 
  Users, AlertCircle, ShieldAlert, Check, 
  Trash2, Edit, CheckCircle, ShieldCheck, 
  Download, Plus, Search, MapPin, Droplet, AlertTriangle, X
} from 'lucide-react';
import { Donor, EmergencyRequest, BloodGroup, AppUser } from '../types';
import { doc, setDoc, deleteDoc, updateDoc, collection } from 'firebase/firestore';
import { db } from '../firebase';
import { DISTRICTS, getTaluksForDistrict } from '../locations';

interface AdminPanelProps {
  donors: Donor[];
  requests: EmergencyRequest[];
  onRefreshAll: () => void;
  user: AppUser | null;
}

export default function AdminPanel({ donors, requests, onRefreshAll, user }: AdminPanelProps) {
  
  const [activeTab, setActiveTab] = useState<'donors' | 'requests' | 'stats'>('donors');
  const [donorSearch, setDonorSearch] = useState('');
  
  // Edit Donor Modal states
  const [editingDonor, setEditingDonor] = useState<Donor | null>(null);
  const [editName, setEditName] = useState('');
  const [editAge, setEditAge] = useState(25);
  const [editPhone, setEditPhone] = useState('');
  const [editDistrict, setEditDistrict] = useState('');
  const [editTaluk, setEditTaluk] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editAvailability, setEditAvailability] = useState<'Available' | 'Not Available'>('Available');
  const [editNumDonations, setEditNumDonations] = useState(0);

  if (!user || user.role !== 'admin') {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-red-200 bg-red-50 p-8 text-center shadow-xs">
        <ShieldAlert className="mx-auto h-12 w-12 text-red-600 animate-bounce" />
        <h3 className="mt-4 font-sans text-lg font-bold text-slate-900">Access Denied</h3>
        <p className="mt-2 text-sm text-slate-600">
          This dashboard is restricted to system administrators. Please log in with an administrator account to view database statistics and manage donor records.
        </p>
      </div>
    );
  }

  // Statistics Computations
  const totalDonors = donors.length;
  const activeRequests = requests.filter(r => r.status === 'Open').length;
  const verifiedDonors = donors.filter(d => d.verified).length;
  const blockedDonors = donors.filter(d => d.blocked).length;

  // Blood group breakdown
  const bloodGroups: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const bloodGroupStats = bloodGroups.map(bg => {
    const count = donors.filter(d => d.bloodGroup === bg).length;
    const percentage = totalDonors > 0 ? (count / totalDonors) * 100 : 0;
    return { bg, count, percentage };
  });

  // District breakdown
  const districtStats = DISTRICTS.map(dist => {
    const count = donors.filter(d => d.district === dist).length;
    return { dist, count };
  }).filter(item => item.count > 0).sort((a,b) => b.count - a.count);

  // Toggle Verification status
  const handleToggleVerification = async (donorId: string, currentStatus: boolean) => {
    try {
      const docRef = doc(db, 'donors', donorId);
      await updateDoc(docRef, { verified: !currentStatus });
      onRefreshAll();
    } catch (err) {
      console.error(err);
      alert("Failed to update donor verification status.");
    }
  };

  // Toggle Block status (Fake account defense)
  const handleToggleBlock = async (donorId: string, currentStatus: boolean) => {
    try {
      const docRef = doc(db, 'donors', donorId);
      await updateDoc(docRef, { blocked: !currentStatus });
      onRefreshAll();
    } catch (err) {
      console.error(err);
      alert("Failed to update donor block status.");
    }
  };

  // Delete Donor
  const handleDeleteDonor = async (donorId: string) => {
    if (!window.confirm("Are you absolutely sure you want to permanently delete this donor profile? This operation cannot be undone.")) return;
    try {
      await deleteDoc(doc(db, 'donors', donorId));
      onRefreshAll();
    } catch (err) {
      console.error(err);
      alert("Failed to delete donor profile.");
    }
  };

  // Delete Emergency Request
  const handleDeleteRequest = async (reqId: string) => {
    if (!window.confirm("Are you sure you want to delete this emergency request?")) return;
    try {
      await deleteDoc(doc(db, 'emergencyRequests', reqId));
      onRefreshAll();
    } catch (err) {
      console.error(err);
      alert("Failed to delete request.");
    }
  };

  // Trigger edit donor
  const startEditDonor = (donor: Donor) => {
    setEditingDonor(donor);
    setEditName(donor.fullName);
    setEditAge(donor.age);
    setEditPhone(donor.mobileNumber);
    setEditDistrict(donor.district);
    setEditTaluk(donor.taluk);
    setEditCity(donor.city);
    setEditAvailability(donor.availabilityStatus);
    setEditNumDonations(donor.numDonations);
  };

  // Save edit donor
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDonor) return;

    try {
      const docRef = doc(db, 'donors', editingDonor.id);
      await updateDoc(docRef, {
        fullName: editName.trim(),
        age: editAge,
        mobileNumber: editPhone,
        district: editDistrict,
        taluk: editTaluk,
        city: editCity.trim(),
        availabilityStatus: editAvailability,
        numDonations: editNumDonations
      });
      setEditingDonor(null);
      onRefreshAll();
    } catch (err) {
      console.error(err);
      alert("Failed to update donor profile.");
    }
  };

  // EXPORT DONORS TO CSV (NATIVE DOWNLOAD - Zero dependencies)
  const exportToCSV = () => {
    if (donors.length === 0) {
      alert("No donor records to export.");
      return;
    }

    const headers = [
      'Full Name', 'Age', 'Gender', 'Blood Group', 'Mobile Number', 
      'Email', 'District', 'Taluk', 'City', 'PIN Code', 
      'Last Donation', 'Availability', 'Verified', 'Blocked', 'Donations Count', 'Registered At'
    ];

    const rows = donors.map(d => [
      `"${d.fullName.replace(/"/g, '""')}"`,
      d.age,
      d.gender,
      d.bloodGroup,
      d.mobileNumber,
      d.emailAddress,
      d.district,
      d.taluk,
      `"${d.city.replace(/"/g, '""')}"`,
      d.pinCode,
      d.lastDonationDate || 'N/A',
      d.availabilityStatus,
      d.verified ? 'Yes' : 'No',
      d.blocked ? 'Yes' : 'No',
      d.numDonations,
      d.registeredAt
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `tamil_nadu_blood_donors_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link); // Required for FF
    link.click();
    document.body.removeChild(link);
  };

  // Filter donors based on admin search
  const filteredDonors = donors.filter(d => 
    d.fullName.toLowerCase().includes(donorSearch.toLowerCase()) ||
    d.bloodGroup.toLowerCase().includes(donorSearch.toLowerCase()) ||
    d.city.toLowerCase().includes(donorSearch.toLowerCase()) ||
    d.district.toLowerCase().includes(donorSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Admin Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h2 className="font-sans text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-blue-600 fill-blue-50" />
            <span>Administrator Control Dashboard</span>
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Database access, stats overview, donor verification, request deletion, and secure database exports.
          </p>
        </div>

        <button
          onClick={exportToCSV}
          className="flex items-center justify-center space-x-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors shrink-0"
          id="btn-export-csv"
        >
          <Download className="h-4 w-4 text-slate-500" />
          <span>Export Donors Database (CSV)</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {/* Total Donors */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="block text-xs font-semibold text-slate-500 uppercase">Total Donors</span>
          <span className="mt-2 block font-sans text-2xl font-bold text-slate-900">{totalDonors}</span>
        </div>

        {/* Active Emergency Requests */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="block text-xs font-semibold text-slate-500 uppercase">Active Requests</span>
          <span className="mt-2 block font-sans text-2xl font-bold text-red-600">{activeRequests}</span>
        </div>

        {/* Verified Accounts */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="block text-xs font-semibold text-slate-500 uppercase">Verified Donors</span>
          <span className="mt-2 block font-sans text-2xl font-bold text-emerald-600">
            {verifiedDonors} <span className="text-xs font-normal text-slate-400">({totalDonors > 0 ? Math.round((verifiedDonors / totalDonors) * 100) : 0}%)</span>
          </span>
        </div>

        {/* Blocked Accounts */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="block text-xs font-semibold text-slate-500 uppercase">Blocked / Flagged</span>
          <span className="mt-2 block font-sans text-2xl font-bold text-slate-600">
            {blockedDonors} <span className="text-xs font-normal text-slate-400">({totalDonors > 0 ? Math.round((blockedDonors / totalDonors) * 100) : 0}%)</span>
          </span>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('donors')}
          className={`px-4 py-2.5 text-xs font-bold uppercase border-b-2 transition-colors ${
            activeTab === 'donors'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Manage Donors ({totalDonors})
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`px-4 py-2.5 text-xs font-bold uppercase border-b-2 transition-colors ${
            activeTab === 'requests'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Manage Requests ({requests.length})
        </button>
        <button
          onClick={() => setActiveTab('stats')}
          className={`px-4 py-2.5 text-xs font-bold uppercase border-b-2 transition-colors ${
            activeTab === 'stats'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Demographics & Stats
        </button>
      </div>

      {/* TAB 1: Manage Donors */}
      {activeTab === 'donors' && (
        <div className="space-y-4">
          
          {/* Table Controls (Search filter) */}
          <div className="flex max-w-md items-center rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-xs">
            <Search className="h-4 w-4 text-slate-400 mr-2" />
            <input
              type="text"
              value={donorSearch}
              onChange={(e) => setDonorSearch(e.target.value)}
              placeholder="Search by name, blood group, city or district..."
              className="w-full text-xs outline-hidden"
              id="admin-donor-search"
            />
          </div>

          {/* Donors Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full border-collapse text-left text-xs text-slate-600">
              <thead className="bg-slate-50 font-bold text-slate-800 border-b border-slate-200">
                <tr>
                  <th className="p-4">Donor Name</th>
                  <th className="p-4 text-center">Group</th>
                  <th className="p-4">Location</th>
                  <th className="p-4">Phone</th>
                  <th className="p-4 text-center">Availability</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDonors.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500 font-medium">
                      No matching donor records discovered.
                    </td>
                  </tr>
                ) : (
                  filteredDonors.map((donor) => (
                    <tr 
                      key={donor.id} 
                      className={`hover:bg-slate-50/50 ${donor.blocked ? 'bg-red-50/20' : ''}`}
                      id={`admin-row-donor-${donor.id}`}
                    >
                      {/* Name / Age */}
                      <td className="p-4 font-bold text-slate-900">
                        <div>
                          <span>{donor.fullName}</span>
                          <span className="block text-[10px] text-slate-500 font-normal mt-0.5">{donor.age} yrs &bull; {donor.gender}</span>
                        </div>
                      </td>

                      {/* Blood Group */}
                      <td className="p-4 text-center">
                        <span className="inline-block rounded-md bg-red-50 px-2 py-1 font-black text-red-600 border border-red-100">
                          {donor.bloodGroup}
                        </span>
                      </td>

                      {/* Location */}
                      <td className="p-4 font-medium">
                        <div>
                          <span>{donor.city}</span>
                          <span className="block text-[10px] text-slate-500 font-normal mt-0.5">{donor.taluk}, {donor.district}</span>
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="p-4 font-mono font-medium">{donor.mobileNumber}</td>

                      {/* Availability */}
                      <td className="p-4 text-center">
                        {donor.availabilityStatus === 'Available' ? (
                          <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-100">
                            Available
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                            Unavailable
                          </span>
                        )}
                      </td>

                      {/* Status Flags (Verified / Blocked) */}
                      <td className="p-4 text-center space-y-1">
                        <div>
                          {donor.verified ? (
                            <span className="inline-flex items-center rounded bg-blue-50 px-1.5 py-0.5 text-[9px] font-bold text-blue-700 border border-blue-100">Verified</span>
                          ) : (
                            <span className="inline-flex items-center rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-500">Pending</span>
                          )}
                        </div>
                        {donor.blocked && (
                          <div>
                            <span className="inline-flex items-center rounded bg-red-100 px-1.5 py-0.5 text-[9px] font-bold text-red-800 border border-red-200">Blocked</span>
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right space-x-1.5">
                        
                        {/* Verify toggle */}
                        <button
                          onClick={() => handleToggleVerification(donor.id, donor.verified)}
                          className={`rounded px-2 py-1 text-[10px] font-bold transition-colors ${
                            donor.verified 
                              ? 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100' 
                              : 'bg-emerald-600 text-white hover:bg-emerald-700'
                          }`}
                          title={donor.verified ? "De-verify Donor" : "Verify Donor"}
                        >
                          {donor.verified ? 'Unverify' : 'Verify'}
                        </button>

                        {/* Block toggle */}
                        <button
                          onClick={() => handleToggleBlock(donor.id, donor.blocked)}
                          className={`rounded px-2 py-1 text-[10px] font-bold transition-colors ${
                            donor.blocked 
                              ? 'bg-green-600 text-white hover:bg-green-700' 
                              : 'bg-slate-100 text-slate-700 hover:bg-red-50 hover:text-red-600'
                          }`}
                          title={donor.blocked ? "Unblock Account" : "Block Fake Account"}
                        >
                          {donor.blocked ? 'Unblock' : 'Block'}
                        </button>

                        {/* Edit Button */}
                        <button
                          onClick={() => startEditDonor(donor)}
                          className="rounded border border-slate-200 bg-white p-1 text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                          title="Edit Donor Profile"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => handleDeleteDonor(donor.id)}
                          className="rounded border border-red-100 bg-red-50 p-1 text-red-600 hover:bg-red-100"
                          title="Delete Donor Profile"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>

                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* TAB 2: Manage Requests */}
      {activeTab === 'requests' && (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full border-collapse text-left text-xs text-slate-600">
            <thead className="bg-slate-50 font-bold text-slate-800 border-b border-slate-200">
              <tr>
                <th className="p-4">Patient Name</th>
                <th className="p-4 text-center">Blood</th>
                <th className="p-4 text-center">Units</th>
                <th className="p-4">Hospital Details</th>
                <th className="p-4">Priority</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500 font-medium">
                    No emergency requests discovered in database.
                  </td>
                </tr>
              ) : (
                requests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/50" id={`admin-row-req-${req.id}`}>
                    
                    {/* Patient Name */}
                    <td className="p-4 font-bold text-slate-900">{req.patientName}</td>

                    {/* Blood Group */}
                    <td className="p-4 text-center">
                      <span className="inline-block rounded bg-red-50 px-2 py-0.5 font-bold text-red-600">{req.bloodGroup}</span>
                    </td>

                    {/* Units */}
                    <td className="p-4 text-center font-bold text-slate-800">{req.unitsRequired}</td>

                    {/* Hospital */}
                    <td className="p-4 font-medium">
                      <div>
                        <span>{req.hospitalName}</span>
                        <span className="block text-[10px] text-slate-500 font-normal mt-0.5">{req.district}</span>
                      </div>
                    </td>

                    {/* Priority */}
                    <td className="p-4 font-semibold">{req.emergencyLevel}</td>

                    {/* Status */}
                    <td className="p-4 text-center">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        req.status === 'Open' 
                          ? 'bg-blue-50 text-blue-700 border border-blue-100' 
                          : req.status === 'Fulfilled'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                            : 'bg-slate-100 text-slate-700'
                      }`}>
                        {req.status}
                      </span>
                    </td>

                    {/* Action buttons */}
                    <td className="p-4 text-right space-x-1.5">
                      <button
                        onClick={() => handleDeleteRequest(req.id)}
                        className="rounded border border-red-100 bg-red-50 p-1.5 text-red-600 hover:bg-red-100"
                        title="Delete Request"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: Statistics Overview */}
      {activeTab === 'stats' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Blood group Distribution */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
            <h3 className="font-sans text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 mb-4">
              Blood Group Distribution
            </h3>
            <div className="space-y-3.5">
              {bloodGroupStats.map((stat) => (
                <div key={stat.bg}>
                  <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                    <span>Group {stat.bg}</span>
                    <span>{stat.count} donor(s) ({Math.round(stat.percentage)}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-red-500 h-full rounded-full" 
                      style={{ width: `${stat.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Regional Distribution */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
            <h3 className="font-sans text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 mb-4">
              Regional Active Donors (By District)
            </h3>
            {districtStats.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-8">No geographical donor distribution statistics yet.</p>
            ) : (
              <div className="space-y-3.5">
                {districtStats.map((item) => {
                  const maxCount = Math.max(...districtStats.map(x => x.count));
                  const percentage = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
                  return (
                    <div key={item.dist}>
                      <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-slate-400" />
                          <span>{item.dist} District</span>
                        </span>
                        <span>{item.count} donor(s)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-blue-600 h-full rounded-full" 
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      )}

      {/* EDIT DONOR INLINE MODAL */}
      {editingDonor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-xl bg-white p-6 shadow-xl border border-slate-100 animate-scaleIn">
            
            <button 
              type="button"
              onClick={() => setEditingDonor(null)}
              className="absolute top-4 right-4 rounded-full p-1.5 text-slate-400 hover:bg-slate-50"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="font-sans text-base font-bold text-slate-900 mb-4 border-b pb-2">
              Edit Donor Profile: {editingDonor.fullName}
            </h3>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              
              <div className="grid grid-cols-2 gap-3">
                
                {/* Full name */}
                <div className="col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Donor Full Name</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full rounded border border-slate-200 p-2 text-slate-900"
                  />
                </div>

                {/* Age */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Age</label>
                  <input
                    type="number"
                    required
                    min={18}
                    max={65}
                    value={editAge}
                    onChange={(e) => setEditAge(parseInt(e.target.value) || 18)}
                    className="w-full rounded border border-slate-200 p-2 text-slate-900"
                  />
                </div>

                {/* Mobile Number */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mobile Number</label>
                  <input
                    type="tel"
                    required
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full rounded border border-slate-200 p-2 text-slate-900"
                  />
                </div>

                {/* District selection */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">District</label>
                  <select
                    value={editDistrict}
                    onChange={(e) => { setEditDistrict(e.target.value); setEditTaluk(''); }}
                    className="w-full rounded border border-slate-200 p-2 text-slate-900"
                  >
                    {DISTRICTS.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                {/* Taluk selection */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Taluk</label>
                  <select
                    value={editTaluk}
                    onChange={(e) => setEditTaluk(e.target.value)}
                    className="w-full rounded border border-slate-200 p-2 text-slate-900"
                  >
                    <option value="">Select Taluk</option>
                    {getTaluksForDistrict(editDistrict).map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                {/* City */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">City / Village</label>
                  <input
                    type="text"
                    required
                    value={editCity}
                    onChange={(e) => setEditCity(e.target.value)}
                    className="w-full rounded border border-slate-200 p-2 text-slate-900"
                  />
                </div>

                {/* Total Donations */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Total Donations Count</label>
                  <input
                    type="number"
                    min={0}
                    value={editNumDonations}
                    onChange={(e) => setEditNumDonations(parseInt(e.target.value) || 0)}
                    className="w-full rounded border border-slate-200 p-2 text-slate-900"
                  />
                </div>

                {/* Availability status */}
                <div className="col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Availability Status</label>
                  <select
                    value={editAvailability}
                    onChange={(e) => setEditAvailability(e.target.value as any)}
                    className="w-full rounded border border-slate-200 p-2 text-slate-900 font-semibold"
                  >
                    <option value="Available">Available Immediately</option>
                    <option value="Not Available">Not Available Now</option>
                  </select>
                </div>

              </div>

              {/* Actions */}
              <div className="border-t pt-3 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setEditingDonor(null)}
                  className="rounded border bg-white p-2 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded bg-blue-600 p-2 text-white font-bold hover:bg-blue-700"
                >
                  Save Changes
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
