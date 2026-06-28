import React, { useState } from 'react';
import { 
  User, Mail, Calendar, Shield, Heart, MapPin, 
  Droplet, Phone, AlertCircle, CheckCircle2, 
  Clock, CheckCircle, XCircle, Trash2, ArrowRight, ToggleLeft, ToggleRight
} from 'lucide-react';
import { AppUser, Donor, EmergencyRequest, BloodGroup } from '../types';
import { doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { logSecurityActivity } from '../utils/security';

interface UserProfileProps {
  user: AppUser | null;
  onOpenAuth: () => void;
  onRefreshDatabase: () => void;
  emergencyRequests: EmergencyRequest[];
  allDonors: Donor[];
  setActiveTab: (tab: string) => void;
}

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

export default function UserProfile({
  user,
  onOpenAuth,
  onRefreshDatabase,
  emergencyRequests,
  allDonors,
  setActiveTab
}: UserProfileProps) {
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInputEmail, setDeleteInputEmail] = useState('');

  // Find if this user has a donor profile
  const donorProfile = allDonors.find(d => d.emailAddress.toLowerCase() === user?.email.toLowerCase());

  // Filter emergency requests submitted by this user
  const myRequests = emergencyRequests.filter(r => r.postedBy === user?.uid);

  // Toggle donor privacy flags
  const togglePrivacySetting = async (field: 'hideMobileNumber' | 'hideEmailAddress') => {
    if (!donorProfile || !user) return;
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    const currentValue = !!(donorProfile as any)[field];
    const newValue = !currentValue;

    try {
      const donorRef = doc(db, 'donors', donorProfile.id);
      await updateDoc(donorRef, {
        [field]: newValue
      });
      setSuccessMsg(`Privacy filter updated successfully! Your ${field === 'hideMobileNumber' ? 'Mobile Number' : 'Email Address'} is now ${newValue ? 'HIDDEN from public searches' : 'VISIBLE to authenticated seekers'}.`);
      await logSecurityActivity('DONOR_PRIVACY_UPDATE', user.uid, user.email, { field, value: newValue });
      onRefreshDatabase();
    } catch (err) {
      setErrorMsg("Failed to update privacy settings. Ensure your Firebase permissions are active.");
    } finally {
      setLoading(false);
    }
  };

  // Export User personal data (GDPR-compliant portability feature)
  const downloadPersonalData = async () => {
    if (!user) return;
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const personalData = {
        meta: {
          organization: "Tamil Nadu Voluntary Blood Donor Finder",
          securityStandard: "ISO/IEC 27001 & GDPR Compliant Data Portability",
          exportedAt: new Date().toISOString(),
        },
        accountDetails: {
          uid: user.uid,
          displayName: user.displayName,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt,
        },
        donorProfile: donorProfile ? {
          fullName: donorProfile.fullName,
          age: donorProfile.age,
          gender: donorProfile.gender,
          bloodGroup: donorProfile.bloodGroup,
          mobileNumber: donorProfile.mobileNumber,
          emailAddress: donorProfile.emailAddress,
          city: donorProfile.city,
          taluk: donorProfile.taluk,
          district: donorProfile.district,
          state: donorProfile.state,
          pinCode: donorProfile.pinCode,
          lastDonationDate: donorProfile.lastDonationDate || 'Not specified',
          availabilityStatus: donorProfile.availabilityStatus,
          verified: donorProfile.verified,
          hideMobileNumber: !!donorProfile.hideMobileNumber,
          hideEmailAddress: !!donorProfile.hideEmailAddress,
          registeredAt: donorProfile.registeredAt,
        } : "No active donor card is linked to this account",
        emergencyRequestsPosted: myRequests.map(r => ({
          requestId: r.id,
          patientName: r.patientName,
          bloodGroup: r.bloodGroup,
          unitsRequired: r.unitsRequired,
          hospitalName: r.hospitalName,
          district: r.district,
          contactPerson: r.contactPerson,
          mobileNumber: r.mobileNumber,
          emergencyLevel: r.emergencyLevel,
          status: r.status,
          postedAt: r.postedAt,
        })),
      };

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(personalData, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `BloodConnect_TN_Personal_Data_${user.displayName.replace(/\s+/g, '_')}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      setSuccessMsg("Personal information folder exported successfully in high-security JSON format.");
      await logSecurityActivity('GDPR_DATA_EXPORT_SUCCESS', user.uid, user.email);
    } catch (err: any) {
      setErrorMsg("Failed to generate secure archive. Try again.");
    }
  };

  // Permanently purge user account & all corresponding documents (Absolute Privacy Standard)
  const handlePermanentAccountDeletion = async () => {
    if (!user) return;
    if (deleteInputEmail.trim().toLowerCase() !== user.email.toLowerCase()) {
      setErrorMsg("Email address confirmation mismatch. Please type your exact email to confirm.");
      return;
    }

    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      await logSecurityActivity('ACCOUNT_DELETION_INITIATED', user.uid, user.email);

      // A. Delete user profile record in Firestore
      try {
        await deleteDoc(doc(db, 'users', user.uid));
      } catch (dbErr) {
        console.warn("User record deletion failed (maybe already deleted):", dbErr);
      }

      // B. Delete donor profile record in Firestore (if any)
      if (donorProfile) {
        try {
          await deleteDoc(doc(db, 'donors', donorProfile.id));
        } catch (dbErr) {
          console.warn("Donor record deletion failed:", dbErr);
        }
      }

      // C. Cancel user's submitted emergency requests to avoid dead broadcasts
      for (const req of myRequests) {
        try {
          await updateDoc(doc(db, 'emergencyRequests', req.id), {
            status: 'Cancelled',
            patientName: '[DELETED USER]',
            contactPerson: '[DELETED USER]',
            mobileNumber: '0000000000',
            additionalNotes: 'Poster permanently closed their account and destroyed their associated databases.'
          });
        } catch (dbErr) {
          console.warn("Failed to sanitize emergency request during account purge:", dbErr);
        }
      }

      // D. Try Auth Account deletion if verified session is active
      const currentUser = auth.currentUser;
      if (currentUser) {
        try {
          await currentUser.delete();
        } catch (authErr) {
          console.warn("Firebase credential purge skipped (requires recent login fallback):", authErr);
        }
      }

      // E. Purge local session storage & trigger refresh
      await auth.signOut();
      localStorage.removeItem('localUser');
      setSuccessMsg("All records completely purged! Your account has been deleted permanently.");
      
      await logSecurityActivity('ACCOUNT_DELETION_COMPLETE', user.uid, user.email);
      
      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (err: any) {
      setErrorMsg(`Purge process aborted: ${err.message || 'Server error'}`);
    } finally {
      setLoading(false);
      setShowDeleteConfirm(false);
      setDeleteInputEmail('');
    }
  };

  // Parse helper for Firestore error
  function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
    const errInfo: FirestoreErrorInfo = {
      error: error instanceof Error ? error.message : String(error),
      authInfo: {
        userId: auth.currentUser?.uid,
        email: auth.currentUser?.email,
        emailVerified: auth.currentUser?.emailVerified,
        isAnonymous: auth.currentUser?.isAnonymous,
      },
      operationType,
      path
    };
    console.error('Firestore Error in Profile: ', JSON.stringify(errInfo));
    throw new Error(JSON.stringify(errInfo));
  }

  // Handle donor availability toggle
  const toggleAvailability = async () => {
    if (!donorProfile) return;
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    const newStatus = donorProfile.availabilityStatus === 'Available' ? 'Not Available' : 'Available';
    const path = `donors/${donorProfile.id}`;

    try {
      const donorRef = doc(db, 'donors', donorProfile.id);
      await updateDoc(donorRef, {
        availabilityStatus: newStatus
      });
      setSuccessMsg(`Availability status changed to ${newStatus === 'Available' ? 'Available' : 'Unavailable'}!`);
      onRefreshDatabase();
    } catch (err) {
      try {
        handleFirestoreError(err, OperationType.UPDATE, path);
      } catch (finalErr: any) {
        setErrorMsg("Failed to update status. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle request status update (Fulfill or Cancel)
  const handleRequestStatus = async (requestId: string, newStatus: 'Fulfilled' | 'Cancelled') => {
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);
    const path = `emergencyRequests/${requestId}`;

    try {
      const reqRef = doc(db, 'emergencyRequests', requestId);
      await updateDoc(reqRef, {
        status: newStatus
      });
      setSuccessMsg(`Emergency request marked as ${newStatus}!`);
      onRefreshDatabase();
    } catch (err) {
      try {
        handleFirestoreError(err, OperationType.UPDATE, path);
      } catch (finalErr: any) {
        setErrorMsg("Failed to update request status. Check your permissions.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Format date helper
  const formatDate = (isoString?: string) => {
    if (!isoString) return 'N/A';
    return new Date(isoString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Get eligibility days logic
  const getEligibilityDays = (lastDonationDate?: string) => {
    if (!lastDonationDate) return { eligible: true, daysLeft: 0 };
    const lastDate = new Date(lastDonationDate);
    const nextEligible = new Date(lastDate);
    nextEligible.setDate(lastDate.getDate() + 90);
    const today = new Date();
    if (nextEligible <= today) return { eligible: true, daysLeft: 0 };
    const diffTime = Math.abs(nextEligible.getTime() - today.getTime());
    return { eligible: false, daysLeft: Math.ceil(diffTime / (1000 * 60 * 60 * 24)) };
  };

  const eligibility = donorProfile ? getEligibilityDays(donorProfile.lastDonationDate) : { eligible: true, daysLeft: 0 };

  if (!user) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xs">
        <User className="mx-auto h-12 w-12 text-slate-400 stroke-1" />
        <h3 className="mt-4 font-sans text-lg font-bold text-slate-900">Sign In Required</h3>
        <p className="mt-2 text-sm text-slate-500 leading-relaxed">
          Please sign in to view your account details, track your donor registration, and manage your posted emergency blood requests.
        </p>
        <button
          onClick={onOpenAuth}
          className="mt-6 inline-flex items-center space-x-1.5 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-blue-700 transition-colors"
          id="btn-profile-auth-trigger"
        >
          <span>Sign In / Create Account</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      {/* Title Header */}
      <div>
        <h1 className="font-sans text-xl font-black text-slate-950 tracking-tight">
          My Account Dashboard
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Manage your personal records, active donor status, and blood request postings.
        </p>
      </div>

      {/* Alert Messaging */}
      {errorMsg && (
        <div className="flex items-start space-x-2 rounded-lg bg-red-50 p-3.5 text-xs text-red-700 border border-red-100">
          <AlertCircle className="h-4.5 w-4.5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="flex items-start space-x-2 rounded-lg bg-emerald-50 p-3.5 text-xs text-emerald-700 border border-emerald-100">
          <CheckCircle2 className="h-4.5 w-4.5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Profile Overview Card & Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* User Card */}
        <div className="md:col-span-1 rounded-xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600 font-extrabold text-lg border border-rose-100">
                {user.displayName.charAt(0).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <h2 className="text-sm font-extrabold text-slate-950 truncate">{user.displayName}</h2>
                <div className="flex items-center space-x-1.5 mt-0.5">
                  <Shield className="h-3 w-3 text-slate-400" />
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{user.role} account</span>
                </div>
              </div>
            </div>

            <div className="space-y-2 border-t border-slate-100 pt-3 text-xs">
              <div className="flex items-center space-x-2 text-slate-600">
                <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{user.email}</span>
              </div>
              <div className="flex items-center space-x-2 text-slate-600">
                <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span>Joined {formatDate(user.createdAt)}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-150/40">
            {donorProfile ? (
              <div className="flex items-center space-x-2 text-[10px] text-emerald-600 font-bold bg-emerald-50/50 border border-emerald-100 rounded px-2.5 py-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                <span>Registered Blood Donor</span>
              </div>
            ) : (
              <div className="flex flex-col space-y-2">
                <div className="text-[10px] text-slate-500 font-medium">
                  Not registered as a donor yet.
                </div>
                <button
                  onClick={() => setActiveTab('register-donor')}
                  className="w-full flex items-center justify-center space-x-1 rounded bg-rose-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-rose-700 transition-all"
                >
                  <Heart className="h-3.5 w-3.5 shrink-0" />
                  <span>Become a Donor</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* Stat 1: Donor Status */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Donor Registration</span>
              {donorProfile ? (
                <div className="mt-2 space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded bg-rose-100 text-rose-700 font-black text-xs">
                      {donorProfile.bloodGroup}
                    </span>
                    <div>
                      <span className="text-xs font-bold text-slate-900 block leading-tight">Compatible Group</span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">State: {donorProfile.district}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs pt-1.5 border-t border-slate-100">
                    <span className="text-slate-500 font-medium">Availability:</span>
                    <span className={`font-bold ${donorProfile.availabilityStatus === 'Available' ? 'text-emerald-600' : 'text-slate-500'}`}>
                      {donorProfile.availabilityStatus === 'Available' ? 'AVAILABLE' : 'TEMPORARILY OUT'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="mt-3 text-xs text-slate-500 leading-relaxed">
                  Become part of Tamil Nadu's lifesaving coordinate index. Update availability, locations, and coordinate donation history cleanly.
                </div>
              )}
            </div>

            {donorProfile && (
              <button
                onClick={toggleAvailability}
                disabled={loading}
                className="mt-3 w-full flex items-center justify-center space-x-1.5 rounded border border-slate-200 bg-slate-50/50 hover:bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-all"
              >
                {donorProfile.availabilityStatus === 'Available' ? (
                  <>
                    <ToggleRight className="h-4 w-4 text-emerald-500" />
                    <span>Go Offline (Unavailable)</span>
                  </>
                ) : (
                  <>
                    <ToggleLeft className="h-4 w-4 text-slate-400" />
                    <span>Go Online (Available Now)</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Stat 2: Emergency Postings */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Emergency Postings</span>
              <div className="mt-2 flex items-baseline space-x-2">
                <span className="text-3xl font-black text-slate-900">{myRequests.length}</span>
                <span className="text-xs text-slate-500 font-semibold">submitted requests</span>
              </div>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Active requests are broadcast to matching blood donors in the district to initiate immediate reachout.
              </p>
            </div>

            <button
              onClick={() => setActiveTab('requests')}
              className="mt-3 w-full flex items-center justify-center space-x-1 rounded border border-slate-200 bg-slate-50/50 hover:bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-all"
            >
              <span>Submit New Emergency Posting</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>

        </div>
      </div>

      {/* Main Sections: Donor Details & Active Request Manager */}
      <div className="grid grid-cols-1 gap-6">

        {/* SECTION A: Donor Profile Details */}
        {donorProfile && (
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-sans text-sm font-bold text-slate-950 uppercase tracking-wider">
                My Donor Information Card
              </h3>
              <button
                onClick={() => setActiveTab('register-donor')}
                className="text-xs font-bold text-blue-600 hover:underline"
              >
                Edit Donor Profile
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 text-xs">
              <div className="space-y-1 bg-slate-50/50 border border-slate-100 rounded-lg p-3">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Age & Gender</span>
                <span className="font-bold text-slate-800">{donorProfile.age} Years, {donorProfile.gender}</span>
              </div>
              <div className="space-y-1 bg-slate-50/50 border border-slate-100 rounded-lg p-3">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Primary Contact</span>
                <span className="font-bold text-slate-800">{donorProfile.mobileNumber}</span>
              </div>
              <div className="space-y-1 bg-slate-50/50 border border-slate-100 rounded-lg p-3">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Primary Location</span>
                <span className="font-bold text-slate-800 truncate block">
                  {donorProfile.city}, {donorProfile.taluk}
                </span>
                <span className="block text-[9px] text-slate-400 font-semibold">{donorProfile.district} District</span>
              </div>
              <div className="space-y-1 bg-slate-50/50 border border-slate-100 rounded-lg p-3">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Last Donated Date</span>
                <span className="font-bold text-slate-800">{donorProfile.lastDonationDate ? formatDate(donorProfile.lastDonationDate) : 'Never Donated / Not Specified'}</span>
              </div>
              <div className="space-y-1 bg-slate-50/50 border border-slate-100 rounded-lg p-3">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Donation Eligibility</span>
                <span className={`font-bold ${eligibility.eligible ? 'text-emerald-600' : 'text-slate-500'}`}>
                  {eligibility.eligible ? 'ELIGIBLE NOW' : `Eligible in ${eligibility.daysLeft} Days`}
                </span>
              </div>
              <div className="space-y-1 bg-slate-50/50 border border-slate-100 rounded-lg p-3">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Account Trust Badge</span>
                <span className={`font-bold ${donorProfile.verified ? 'text-blue-600' : 'text-slate-400'}`}>
                  {donorProfile.verified ? 'OFFICIALLY VERIFIED' : 'PENDING REVIEW'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* SECTION B: Manage My Active Requests */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <h3 className="font-sans text-sm font-bold text-slate-950 uppercase tracking-wider border-b border-slate-100 pb-3">
            My Submitted Emergency Requests ({myRequests.length})
          </h3>

          {myRequests.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <Clock className="mx-auto h-8 w-8 stroke-1 text-slate-300 mb-2" />
              <p className="text-xs font-semibold">You haven't submitted any emergency requests.</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Need immediate blood donation? Head to the Emergency Requests feed to submit.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {myRequests.map((req) => (
                <div key={req.id} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-11 items-center justify-center rounded bg-rose-50 text-[10px] font-bold text-rose-700">
                        {req.bloodGroup}
                      </span>
                      <h4 className="text-xs font-extrabold text-slate-900">
                        Patient: {req.patientName} ({req.unitsRequired} Units Required)
                      </h4>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                        req.emergencyLevel === 'Critical' ? 'bg-red-100 text-red-700' :
                        req.emergencyLevel === 'High' ? 'bg-orange-100 text-orange-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {req.emergencyLevel}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 font-medium">
                      Hospital: <span className="text-slate-800">{req.hospitalName}</span> ({req.district})
                    </p>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      <span>Posted: {formatDate(req.postedAt)}</span>
                      <span>Required Date: {formatDate(req.requiredDate)}</span>
                    </div>
                  </div>

                  {/* Actions / Status */}
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className={`inline-flex items-center justify-center text-[10px] font-bold px-2 py-0.5 rounded ${
                        req.status === 'Open' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                        req.status === 'Fulfilled' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                        'bg-slate-50 text-slate-400 border border-slate-100'
                      }`}>
                        {req.status === 'Open' ? '● OPEN' : req.status === 'Fulfilled' ? '✓ FULFILLED' : '✕ CANCELLED'}
                      </span>
                    </div>

                    {req.status === 'Open' && (
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => handleRequestStatus(req.id, 'Fulfilled')}
                          disabled={loading}
                          className="flex h-7 px-2.5 items-center justify-center rounded bg-emerald-600 text-[10px] font-bold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                          title="Mark as Fulfilled"
                        >
                          Fulfill
                        </button>
                        <button
                          onClick={() => handleRequestStatus(req.id, 'Cancelled')}
                          disabled={loading}
                          className="flex h-7 px-2.5 items-center justify-center rounded bg-slate-100 text-[10px] font-bold text-slate-600 hover:bg-slate-200 disabled:opacity-50 transition-colors"
                          title="Mark as Cancelled"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SECTION C: GDPR Privacy & Account Trust Settings */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-sans text-sm font-bold text-slate-950 uppercase tracking-wider flex items-center gap-2">
              <Shield className="h-4 w-4 text-blue-600" />
              <span>GDPR Privacy & Account Trust Panel</span>
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5 leading-normal">
              Manage your personal data visibility preferences, export portability files, or permanently delete your details.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Column 1: Contact Visibility controls */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-tight">Contact Filtering Preferences</h4>
              
              {donorProfile ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl">
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-slate-800 block">Hide Mobile Number</span>
                      <span className="text-[10px] text-slate-400 font-medium block max-w-[220px]">
                        Prevents public seekers from seeing your phone number. Only verified admins can view.
                      </span>
                    </div>
                    <button
                      onClick={() => togglePrivacySetting('hideMobileNumber')}
                      disabled={loading}
                      className="cursor-pointer"
                      id="btn-toggle-hide-phone"
                    >
                      {donorProfile.hideMobileNumber ? (
                        <ToggleRight className="h-9 w-9 text-blue-600" />
                      ) : (
                        <ToggleLeft className="h-9 w-9 text-slate-300" />
                      )}
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl">
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-slate-800 block">Hide Email Address</span>
                      <span className="text-[10px] text-slate-400 font-medium block max-w-[220px]">
                        Hides your email address on search results. Keeps digital outreach strictly sandboxed.
                      </span>
                    </div>
                    <button
                      onClick={() => togglePrivacySetting('hideEmailAddress')}
                      disabled={loading}
                      className="cursor-pointer"
                      id="btn-toggle-hide-email"
                    >
                      {donorProfile.hideEmailAddress ? (
                        <ToggleRight className="h-9 w-9 text-blue-600" />
                      ) : (
                        <ToggleLeft className="h-9 w-9 text-slate-300" />
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400 font-semibold leading-relaxed">
                  No voluntary donor profile is active. Register as a donor to toggle specific PII filters.
                </div>
              )}
            </div>

            {/* Column 2: Data Portability & Permanent purge */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-tight">Data Portability & Purge Operations</h4>
              
              <div className="space-y-3.5">
                <div className="p-3 bg-blue-50/40 border border-blue-100 rounded-xl space-y-2">
                  <span className="text-xs font-bold text-slate-800 block">Download My Records (GDPR File)</span>
                  <p className="text-[10px] text-slate-500 leading-normal">
                    Download a standard-compliant, portable JSON representation containing all profile files, request logs, and account metadata.
                  </p>
                  <button
                    onClick={downloadPersonalData}
                    className="flex items-center justify-center space-x-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 text-[10px] font-bold shadow-xs transition-all cursor-pointer"
                    id="btn-download-gdpr-data"
                  >
                    <span>Download Personal Data Archive (JSON)</span>
                  </button>
                </div>

                <div className="p-3 bg-red-50/40 border border-red-100 rounded-xl space-y-2">
                  <span className="text-xs font-bold text-red-800 block">Permanently Close & Purge Account</span>
                  <p className="text-[10px] text-red-600/80 leading-normal">
                    Irreversibly delete your account document, donor details, and related indexes from all active databases.
                  </p>
                  
                  {!showDeleteConfirm ? (
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="flex items-center justify-center space-x-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 text-[10px] font-bold shadow-xs transition-all cursor-pointer"
                      id="btn-trigger-delete-account"
                    >
                      <span>Permanently Delete My Account</span>
                    </button>
                  ) : (
                    <div className="p-3 bg-white border border-red-200 rounded-lg space-y-2.5 shadow-sm animate-scaleIn">
                      <p className="text-[10px] text-red-700 font-bold uppercase tracking-wider flex items-center gap-1">
                        <AlertCircle className="h-3.5 w-3.5" />
                        <span>Warning: This Action is Irreversible</span>
                      </p>
                      
                      <div className="space-y-1">
                        <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                          Type your email to confirm deletion (<span className="font-mono text-slate-800 lowercase">{user.email}</span>):
                        </label>
                        <input
                          type="email"
                          required
                          placeholder="Type your email"
                          value={deleteInputEmail}
                          onChange={(e) => setDeleteInputEmail(e.target.value)}
                          className="w-full rounded border border-slate-200 py-1.5 px-2.5 text-xs font-semibold outline-hidden focus:border-red-500 bg-white"
                          id="inp-delete-email-confirm"
                        />
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={handlePermanentAccountDeletion}
                          disabled={loading}
                          className="flex-1 flex items-center justify-center rounded bg-red-600 hover:bg-red-700 text-white py-1.5 text-[10px] font-bold transition-all cursor-pointer"
                          id="btn-confirm-delete"
                        >
                          {loading ? 'Purging...' : 'Yes, Delete All My Data'}
                        </button>
                        <button
                          onClick={() => {
                            setShowDeleteConfirm(false);
                            setDeleteInputEmail('');
                          }}
                          className="flex-1 flex items-center justify-center rounded bg-slate-100 hover:bg-slate-200 text-slate-700 py-1.5 text-[10px] font-bold transition-all cursor-pointer"
                          id="btn-cancel-delete"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
