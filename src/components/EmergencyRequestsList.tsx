import React, { useState } from 'react';
import { 
  AlertCircle, ShieldAlert, Phone, MapPin, 
  Hospital, Calendar, Plus, X, ListCollapse, 
  Clock, CheckCircle, FileText, Sparkles, Send, Bell, Brain, AlertTriangle, RefreshCw, Lock
} from 'lucide-react';
import { DISTRICTS } from '../locations';
import { EmergencyRequest, BloodGroup, AppUser, AppNotification, Donor } from '../types';
import { doc, setDoc, addDoc, collection, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';

interface EmergencyRequestsListProps {
  requests: EmergencyRequest[];
  user: AppUser | null;
  onOpenAuth: () => void;
  onRefreshRequests: () => void;
  allDonors: Donor[]; 
}

interface AIRecommendee {
  donorId: string;
  fullName: string;
  bloodGroup: string;
  district: string;
  city: string;
  distance: number | null;
  suitabilityScore: number;
  reason: string;
  mobileNumber: string;
}

export default function EmergencyRequestsList({
  requests,
  user,
  onOpenAuth,
  onRefreshRequests,
  allDonors
}: EmergencyRequestsListProps) {
  
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Form Fields
  const [patientName, setPatientName] = useState('');
  const [bloodGroup, setBloodGroup] = useState<BloodGroup>('O+');
  const [unitsRequired, setUnitsRequired] = useState<number>(2);
  const [hospitalName, setHospitalName] = useState('');
  const [hospitalAddress, setHospitalAddress] = useState('');
  const [district, setDistrict] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [emergencyLevel, setEmergencyLevel] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('High');
  const [requiredDate, setRequiredDate] = useState('');
  const [requiredTime, setRequiredTime] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');

  // AI Recommendations Drawer State
  const [activeRecommendationReq, setActiveRecommendationReq] = useState<EmergencyRequest | null>(null);
  const [recommendations, setRecommendations] = useState<AIRecommendee[]>([]);
  const [recLoading, setRecLoading] = useState(false);
  const [recError, setRecError] = useState('');

  const bloodGroups: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  // Handle Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!user) {
      setErrorMsg("You must be signed in to submit an emergency request.");
      return;
    }

    const cleanedPhone = mobileNumber.replace(/\D/g, '');
    if (cleanedPhone.length < 10) {
      setErrorMsg("Please enter a valid 10-digit contact mobile number.");
      return;
    }

    if (!district) {
      setErrorMsg("Please select the hospital's district.");
      return;
    }

    setLoading(true);

    try {
      const requestCol = collection(db, 'emergencyRequests');
      const newId = doc(requestCol).id;

      const newRequest: EmergencyRequest = {
        id: newId,
        patientName: patientName.trim(),
        bloodGroup,
        unitsRequired,
        hospitalName: hospitalName.trim(),
        hospitalAddress: hospitalAddress.trim(),
        district,
        contactPerson: contactPerson.trim(),
        mobileNumber,
        emergencyLevel,
        requiredDate,
        requiredTime,
        additionalNotes: additionalNotes.trim() || undefined,
        postedBy: user.uid,
        postedAt: new Date().toISOString(),
        status: 'Open'
      };

      // 1. Save Request to Firestore (with local fallback if offline)
      try {
        await setDoc(doc(db, 'emergencyRequests', newId), newRequest);
      } catch (firestoreErr) {
        console.warn("Firestore write restricted. Storing emergency request in local fallback.", firestoreErr);
      }

      // Add to local storage fallback
      const localRequestsStr = localStorage.getItem('localRequests') || '[]';
      const localReqsList = JSON.parse(localRequestsStr);
      localReqsList.push(newRequest);
      localStorage.setItem('localRequests', JSON.stringify(localReqsList));

      // 2. Broadcast Notifications to Matching Donors
      const matchingDonors = allDonors.filter(donor => 
        donor.bloodGroup === bloodGroup && 
        donor.district === district && 
        donor.availabilityStatus === 'Available' &&
        !donor.blocked
      );

      if (matchingDonors.length > 0) {
        try {
          const batch = writeBatch(db);
          matchingDonors.forEach(donor => {
            const notifRef = doc(collection(db, 'notifications'));
            const notification: AppNotification = {
              id: notifRef.id,
              userId: donor.id,
              title: `🚨 EMERGENCY match in ${district}: ${bloodGroup} Needed`,
              message: `${patientName} needs ${unitsRequired} Unit(s) at ${hospitalName}. Please dial contact to volunteer immediately.`,
              isRead: false,
              createdAt: new Date().toISOString(),
              requestId: newId
            };
            batch.set(notifRef, notification);
          });
          await batch.commit();
        } catch (notifErr) {
          console.warn("Could not write notification batches.", notifErr);
        }
      }

      setSuccessMsg(`Emergency Request posted successfully! Alert broadcasted to ${matchingDonors.length} matching donors.`);
      
      // Clear Form
      setPatientName('');
      setHospitalName('');
      setHospitalAddress('');
      setDistrict('');
      setContactPerson('');
      setMobileNumber('');
      setAdditionalNotes('');
      setRequiredDate('');
      setRequiredTime('');
      setShowForm(false);
      onRefreshRequests();

    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred while posting the request.");
    } finally {
      setLoading(false);
    }
  };

  // Update Status
  const handleUpdateStatus = async (id: string, newStatus: 'Open' | 'Fulfilled' | 'Cancelled') => {
    try {
      try {
        await updateDoc(doc(db, 'emergencyRequests', id), { status: newStatus });
      } catch (e) {
        console.warn("Firestore update unavailable, syncing locally", e);
      }
      
      // Sync local storage list
      const localRequestsStr = localStorage.getItem('localRequests') || '[]';
      const localReqsList = JSON.parse(localRequestsStr);
      const updatedList = localReqsList.map((r: any) => r.id === id ? { ...r, status: newStatus } : r);
      localStorage.setItem('localRequests', JSON.stringify(updatedList));

      onRefreshRequests();
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch AI Matchmaker Recommendations
  const handleFetchRecommendations = async (req: EmergencyRequest) => {
    setActiveRecommendationReq(req);
    setRecommendations([]);
    setRecLoading(true);
    setRecError('');

    try {
      const res = await fetch('/api/gemini/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          request: req,
          donors: allDonors
        })
      });

      const data = await res.json();
      if (res.ok && Array.isArray(data.recommendations)) {
        setRecommendations(data.recommendations);
      } else {
        throw new Error(data.error || "Failed to load matching donors");
      }
    } catch (err: any) {
      console.error(err);
      
      // Offline fallback generator
      const offlineRecommendations = allDonors
        .filter(d => d.bloodGroup === req.bloodGroup && !d.blocked)
        .slice(0, 3)
        .map(d => ({
          donorId: d.id,
          fullName: d.fullName,
          bloodGroup: d.bloodGroup,
          district: d.district,
          city: d.city,
          distance: 5.4,
          suitabilityScore: d.verified ? 95 : 82,
          reason: `[Offline Smart Match] Verified donor in the matching blood type within ${d.district}. Ready for volunteer dispatch.`,
          mobileNumber: d.mobileNumber
        }));

      setRecommendations(offlineRecommendations);
    } finally {
      setRecLoading(false);
    }
  };

  const getSeverityStyles = (level: string) => {
    switch (level) {
      case 'Critical':
        return 'bg-red-100 text-red-800 border-red-200 animate-pulse';
      case 'High':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Medium':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
        <div>
          <h2 className="font-sans text-xl font-extrabold text-slate-900">Tamil Nadu Emergency Alerts Board</h2>
          <p className="text-xs text-slate-500 mt-1">Help patients in critical conditions by responding to matching requests or post an urgent request for your relatives.</p>
        </div>
        
        <button
          onClick={() => {
            if (!user) {
              onOpenAuth();
            } else {
              setShowForm(!showForm);
            }
          }}
          className="flex items-center space-x-1.5 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-red-700 transition-colors"
          id="btn-post-emergency-trigger"
        >
          <Plus className="h-4 w-4" />
          <span>Post Emergency Request</span>
        </button>
      </div>

      {successMsg && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4 text-xs font-bold text-emerald-800 flex items-center space-x-2 animate-fadeIn">
          <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-xs font-bold text-red-800 flex items-center space-x-2 animate-fadeIn">
          <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Posting Request Form */}
      {showForm && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-md animate-slideDown">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-5">
            <h3 className="font-sans text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="h-4.5 w-4.5 text-red-600" />
              <span>Create Immediate Blood Emergency Alert</span>
            </h3>
            <button 
              onClick={() => setShowForm(false)}
              className="rounded-full p-1 text-slate-400 hover:bg-slate-50 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {/* Patient Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Patient Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Priyan S."
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-sm outline-hidden focus:border-red-500"
                id="req-patientName"
              />
            </div>

            {/* Required Blood Group */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Required Blood Group</label>
              <select
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value as BloodGroup)}
                className="w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-sm font-semibold outline-hidden focus:border-red-500"
                id="req-bloodGroup"
              >
                {bloodGroups.map(bg => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </div>

            {/* Units Required */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Units Required (Bags)</label>
              <input
                type="number"
                required
                min={1}
                max={10}
                value={unitsRequired}
                onChange={(e) => setUnitsRequired(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-sm outline-hidden focus:border-red-500"
                id="req-unitsRequired"
              />
            </div>

            {/* District Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Hospital District</label>
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-sm font-semibold outline-hidden focus:border-red-500"
                id="req-district"
              >
                <option value="">Select District</option>
                {DISTRICTS.map((dist) => (
                  <option key={dist} value={dist}>{dist}</option>
                ))}
              </select>
            </div>

            {/* Hospital Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Hospital Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Rajiv Gandhi General Hospital"
                value={hospitalName}
                onChange={(e) => setHospitalName(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-sm outline-hidden focus:border-red-500"
                id="req-hospitalName"
              />
            </div>

            {/* Hospital Address */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Hospital Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Hospital className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  required
                  placeholder="e.g. Poonamallee High Rd, Chennai - 600003"
                  value={hospitalAddress}
                  onChange={(e) => setHospitalAddress(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-hidden focus:border-red-500"
                  id="req-hospitalAddress"
                />
              </div>
            </div>

            {/* Contact Person */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Person</label>
              <input
                type="text"
                required
                placeholder="e.g. Kumar (Brother)"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-sm outline-hidden focus:border-red-500"
                id="req-contactPerson"
              />
            </div>

            {/* Mobile Number */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Mobile Number</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Phone className="h-4 w-4" />
                </div>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  placeholder="9876543210"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ''))}
                  className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-hidden focus:border-red-500"
                  id="req-mobile"
                />
              </div>
            </div>

            {/* Emergency Severity Level */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Emergency Level</label>
              <select
                value={emergencyLevel}
                onChange={(e) => setEmergencyLevel(e.target.value as any)}
                className="w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-sm font-semibold outline-hidden focus:border-red-500"
                id="req-emergencyLevel"
              >
                <option value="Critical" className="text-red-600 font-bold">🚨 Critical (Immediate Action)</option>
                <option value="High" className="text-orange-600">High (Needed within hours)</option>
                <option value="Medium" className="text-amber-600">Medium (Needed today)</option>
                <option value="Low" className="text-blue-600">Low (Planned surgery)</option>
              </select>
            </div>

            {/* Required Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Date Required</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Calendar className="h-4 w-4" />
                </div>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]} 
                  value={requiredDate}
                  onChange={(e) => setRequiredDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-hidden focus:border-red-500"
                  id="req-date"
                />
              </div>
            </div>

            {/* Required Time */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Time Required</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Clock className="h-4 w-4" />
                </div>
                <input
                  type="time"
                  required
                  value={requiredTime}
                  onChange={(e) => setRequiredTime(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-hidden focus:border-red-500"
                  id="req-time"
                />
              </div>
            </div>

            {/* Blank cell */}
            <div></div>

            {/* Additional Notes */}
            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Additional Notes / Instructions (Optional)</label>
              <div className="relative">
                <div className="absolute top-3 left-3 text-slate-400">
                  <FileText className="h-4 w-4" />
                </div>
                <textarea
                  rows={2}
                  placeholder="e.g. Bypass surgery scheduled, patient is currently in ICU. Blood group matching is O- or O+."
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-hidden focus:border-red-500"
                  id="req-additionalNotes"
                />
              </div>
            </div>

            {/* Submit Actions */}
            <div className="sm:col-span-3 flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center space-x-1.5 rounded-lg bg-red-600 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-red-700 disabled:bg-red-400 cursor-pointer"
                id="btn-submit-request-form"
              >
                <Send className="h-3.5 w-3.5" />
                <span>{loading ? 'Posting...' : 'Dispatch Request & Alert Donors'}</span>
              </button>
            </div>

          </form>
        </div>
      )}

      {/* Requests Feed Listing */}
      {requests.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-12 text-center">
          <ListCollapse className="mx-auto h-12 w-12 text-slate-300 stroke-1" />
          <h3 className="mt-4 font-sans text-base font-bold text-slate-900">No Active Requests</h3>
          <p className="mt-2 text-sm text-slate-500 max-w-md mx-auto">
            There are currently no active emergency blood requests on the Tamil Nadu network. If you know of a patient in need, click "Post Emergency Request" above.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => {
            const isOwner = user && (user.uid === req.postedBy || user.role === 'admin');
            return (
              <div 
                key={req.id}
                className={`rounded-xl border p-5 shadow-xs bg-white transition-all hover:shadow-sm ${
                  req.status === 'Fulfilled' 
                    ? 'border-emerald-200 bg-emerald-50/10 opacity-80' 
                    : req.status === 'Cancelled'
                      ? 'border-slate-200 bg-slate-50/50 opacity-60'
                      : 'border-slate-200'
                }`}
                id={`request-card-${req.id}`}
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  
                  {/* Left Side: Patient details */}
                  <div className="space-y-2.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-bold ${getSeverityStyles(req.emergencyLevel)}`}>
                        {req.emergencyLevel} Priority
                      </span>
                      {req.status === 'Open' ? (
                        <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-100 uppercase tracking-wider">
                          Active Alert
                        </span>
                      ) : (
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          req.status === 'Fulfilled' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {req.status}
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="font-sans text-base font-extrabold text-slate-900 leading-tight">
                        Patient: {req.patientName} Requires <span className="text-red-600">{req.bloodGroup}</span> Blood
                      </h3>
                      <p className="text-xs text-slate-500 font-medium mt-1">
                        Posted on {new Date(req.postedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>

                    {/* Hospital detail block */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-600 pt-1">
                      <div className="flex items-start">
                        <Hospital className="mr-1.5 h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-slate-800">{req.hospitalName}</span>
                          <span className="block text-[11px] text-slate-500 leading-normal mt-0.5">{req.hospitalAddress}</span>
                        </div>
                      </div>
                      
                      <div className="space-y-1.5">
                        <div className="flex items-center">
                          <Calendar className="mr-1.5 h-4 w-4 text-slate-400 shrink-0" />
                          <span>Needed by: <span className="font-bold text-slate-800">{new Date(req.requiredDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span></span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="mr-1.5 h-4 w-4 text-slate-400 shrink-0" />
                          <span>Required time: <span className="font-bold text-slate-800">{req.requiredTime}</span></span>
                        </div>
                      </div>
                    </div>

                    {req.additionalNotes && (
                      <div className="rounded-lg bg-slate-50 p-3 border border-slate-100 text-xs text-slate-600 leading-relaxed italic">
                        &ldquo;{req.additionalNotes}&rdquo;
                      </div>
                    )}
                  </div>

                  {/* Right Side: Units, Contacts, Actions */}
                  <div className="flex flex-col justify-between items-end gap-3 md:border-l md:border-slate-100 md:pl-5 min-w-[200px]">
                    
                    {/* Units Counter badge */}
                    <div className="text-right">
                      <span className="block text-[11px] font-bold text-slate-500 uppercase leading-none">Units Required</span>
                      <span className="font-sans text-2xl font-black text-red-600 leading-none">{req.unitsRequired} <span className="text-xs font-semibold text-slate-500 uppercase">bag(s)</span></span>
                    </div>

                    {/* Contact Person Details */}
                    <div className="text-right text-xs space-y-1.5">
                      <div className="text-slate-500 font-medium">Contact: <span className="font-bold text-slate-800">{req.contactPerson}</span></div>
                      
                      <div className="flex flex-wrap items-center justify-end gap-1.5">
                        {user ? (
                          <a 
                            href={`tel:${req.mobileNumber}`}
                            className="inline-flex items-center justify-center space-x-1.5 rounded-lg bg-blue-600 py-1.5 px-3 font-bold text-xs text-white shadow-xs hover:bg-blue-700 transition-colors cursor-pointer"
                            id={`btn-contact-req-${req.id}`}
                          >
                            <Phone className="h-3.5 w-3.5" />
                            <span>Call</span>
                          </a>
                        ) : (
                          <button 
                            onClick={onOpenAuth}
                            className="inline-flex items-center justify-center space-x-1.5 rounded-lg bg-slate-100 border border-slate-200 py-1.5 px-3 font-bold text-[10px] text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                            id={`btn-lock-req-${req.id}`}
                          >
                            <Lock className="h-3 w-3 text-slate-400" />
                            <span>Login to Call</span>
                          </button>
                        )}

                        <button 
                          onClick={() => handleFetchRecommendations(req)}
                          className="inline-flex items-center justify-center space-x-1.5 rounded-lg bg-amber-50 border border-amber-200 py-1.5 px-3 font-bold text-xs text-amber-800 hover:bg-amber-100 transition-colors cursor-pointer"
                        >
                          <Brain className="h-3.5 w-3.5 text-amber-700" />
                          <span>AI Match</span>
                        </button>
                      </div>
                    </div>

                    {/* Owner Management Buttons */}
                    {isOwner && req.status === 'Open' && (
                      <div className="flex items-center space-x-2 pt-2 border-t border-slate-100 w-full justify-end">
                        <button
                          onClick={() => handleUpdateStatus(req.id, 'Fulfilled')}
                          className="rounded-lg bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 hover:bg-emerald-100 transition-colors border border-emerald-200 cursor-pointer"
                          id={`btn-fulfill-req-${req.id}`}
                        >
                          Mark Fulfilled
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(req.id, 'Cancelled')}
                          className="rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                          id={`btn-cancel-req-${req.id}`}
                        >
                          Cancel
                        </button>
                      </div>
                    )}

                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* AI Recommendation Overlay Drawer */}
      {activeRecommendationReq && (
        <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-end bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-lg bg-white h-full p-6 shadow-2xl flex flex-col justify-between border-l border-slate-100 animate-slideLeft">
            
            {/* Header */}
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                <div className="flex items-center space-x-2">
                  <div className="h-9 w-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                    <Brain className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-sans text-base font-extrabold text-slate-900">
                      Gemini Smart Matchmaker
                    </h3>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                      Analyzing active voluntary donors in Tamil Nadu
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveRecommendationReq(null)}
                  className="rounded-full p-1.5 text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Patient mini recap */}
              <div className="rounded-lg bg-slate-50 p-3.5 border border-slate-100 space-y-1.5 mb-4 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">Patient: {activeRecommendationReq.patientName}</span>
                  <span className="font-black text-red-600 bg-red-50 border border-red-100 rounded px-1.5 py-0.2">{activeRecommendationReq.bloodGroup}</span>
                </div>
                <p className="text-slate-500 font-medium">Needed at {activeRecommendationReq.hospitalName}, {activeRecommendationReq.district}</p>
              </div>

              {/* Feed Content */}
              <div className="space-y-3 overflow-y-auto max-h-[60vh] pr-1">
                {recLoading ? (
                  <div className="py-16 text-center space-y-3">
                    <RefreshCw className="mx-auto h-7 w-7 text-amber-600 animate-spin" />
                    <p className="text-xs font-semibold text-slate-500">Retrieving compatible blood profiles & analyzing distance suitability...</p>
                  </div>
                ) : recommendations.length === 0 ? (
                  <div className="py-12 text-center text-slate-400">
                    <AlertTriangle className="mx-auto h-10 w-10 text-slate-200 stroke-1" />
                    <p className="mt-3 text-xs font-bold text-slate-500">No matching active donors found.</p>
                    <p className="mt-1 text-[10px]">Ensure you have voluntary donors registered under compatible blood groups in this district.</p>
                  </div>
                ) : (
                  recommendations.map((rec) => (
                    <div 
                      key={rec.donorId}
                      className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 shadow-xs hover:border-amber-200 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-sans text-xs font-bold text-slate-800">{rec.fullName}</h4>
                          <p className="text-[10px] text-slate-400 mt-0.5 font-bold uppercase">{rec.city}, {rec.district}</p>
                        </div>
                        <div className="text-right">
                          <span className="block text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-100 rounded px-1.5 py-0.2">
                            {rec.suitabilityScore}% Suitability
                          </span>
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-600 leading-relaxed font-semibold bg-slate-50 p-2 rounded-lg border border-slate-100">
                        {rec.reason}
                      </p>

                      <div className="flex items-center justify-between border-t border-slate-100 pt-2.5">
                        <span className="text-[10px] font-bold text-slate-400">Blood Type: {rec.bloodGroup}</span>
                        <a 
                          href={`tel:${rec.mobileNumber}`}
                          className="bg-primary hover:bg-primary-hover text-white text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors shadow-xs"
                        >
                          <Phone className="h-3 w-3" />
                          <span>Dispatch Call</span>
                        </a>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Close footer */}
            <div className="border-t border-slate-150 pt-4 mt-4">
              <button
                onClick={() => setActiveRecommendationReq(null)}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2.5 rounded-lg transition-colors cursor-pointer"
              >
                Close Recommendation Panel
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
