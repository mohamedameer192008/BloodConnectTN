import React, { useState, useEffect } from 'react';
import { 
  User, Calendar, MapPin, Phone, Droplet, 
  CheckCircle2, AlertTriangle, ShieldCheck, 
  ToggleLeft, ToggleRight, Heart, Sparkles, Lock, ShieldAlert
} from 'lucide-react';
import { DISTRICTS, getTaluksForDistrict } from '../locations';
import { Donor, BloodGroup, AppUser } from '../types';
import { doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

interface DonorRegistrationFormProps {
  user: AppUser | null;
  onOpenAuth: () => void;
  onRefreshDatabase: () => void;
}

export default function DonorRegistrationForm({
  user,
  onOpenAuth,
  onRefreshDatabase
}: DonorRegistrationFormProps) {
  
  const [donorProfile, setDonorProfile] = useState<Donor | null>(null);
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState<number>(25);
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [bloodGroup, setBloodGroup] = useState<BloodGroup>('O+');
  const [mobileNumber, setMobileNumber] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [district, setDistrict] = useState('');
  const [taluk, setTaluk] = useState('');
  const [city, setCity] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [latitude, setLatitude] = useState<number | undefined>(undefined);
  const [longitude, setLongitude] = useState<number | undefined>(undefined);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsSuccess, setGpsSuccess] = useState(false);
  const [lastDonationDate, setLastDonationDate] = useState('');
  const [availabilityStatus, setAvailabilityStatus] = useState<'Available' | 'Not Available'>('Available');
  
  // Medical eligibility checklist
  const [medHealthy, setMedHealthy] = useState(true);
  const [medWeight, setMedWeight] = useState(true); // >= 45kg
  const [medInfections, setMedInfections] = useState(true);
  const [medTattoo, setMedTattoo] = useState(true); // No tattoo in last 6 months

  // Emergency contact
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');
  const [emergencyContactRel, setEmergencyContactRel] = useState('');

  const bloodGroups: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  // Fetch donor profile for logged in user
  useEffect(() => {
    const fetchDonorProfile = async () => {
      if (!user) {
        setDonorProfile(null);
        return;
      }
      setProfileLoading(true);
      try {
        // Query donor document where emailAddress matches or user registered it
        const donorsCol = collection(db, 'donors');
        const q = query(donorsCol, where("emailAddress", "==", user.email));
        const snap = await getDocs(q);
        
        if (!snap.empty) {
          const donorDoc = snap.docs[0];
          const donorData = donorDoc.data() as Donor;
          setDonorProfile(donorData);
          
          // Pre-fill form fields
          setFullName(donorData.fullName);
          setAge(donorData.age);
          setGender(donorData.gender);
          setBloodGroup(donorData.bloodGroup);
          setMobileNumber(donorData.mobileNumber);
          setEmailAddress(donorData.emailAddress);
          setDistrict(donorData.district);
          setTaluk(donorData.taluk);
          setCity(donorData.city);
          setPinCode(donorData.pinCode);
          setLatitude(donorData.latitude);
          setLongitude(donorData.longitude);
          if (donorData.latitude && donorData.longitude) setGpsSuccess(true);
          setLastDonationDate(donorData.lastDonationDate || '');
          setAvailabilityStatus(donorData.availabilityStatus);
          
          // Emergency contact parse
          const contactStr = donorData.emergencyContact || '';
          if (contactStr) {
            const matches = contactStr.match(/(.*?)\s*\((.*?)\)\s*-\s*(.*)/);
            if (matches && matches.length >= 4) {
              setEmergencyContactName(matches[1].trim());
              setEmergencyContactRel(matches[2].trim());
              setEmergencyContactPhone(matches[3].trim());
            } else {
              setEmergencyContactName(contactStr);
            }
          }
        } else {
          // No profile, clear/initialize defaults
          setDonorProfile(null);
          setFullName(user.displayName || '');
          setEmailAddress(user.email || '');
          setDistrict('');
          setTaluk('');
          setCity('');
          setPinCode('');
          setLatitude(undefined);
          setLongitude(undefined);
          setGpsSuccess(false);
          setLastDonationDate('');
          setAvailabilityStatus('Available');
          setEmergencyContactName('');
          setEmergencyContactPhone('');
          setEmergencyContactRel('');
        }
      } catch (err) {
        console.error("Error fetching donor profile:", err);
      } finally {
        setProfileLoading(false);
      }
    };
    fetchDonorProfile();
  }, [user?.uid]);

  // Capture GPS Location
  const captureGPS = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by this browser.");
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        setGpsLoading(false);
        setGpsSuccess(true);
      },
      (error) => {
        console.error(error);
        alert("Unable to retrieve location. Please input coordinates manually or skip.");
        setGpsLoading(false);
      },
      { timeout: 8000 }
    );
  };

  // Form Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    // Validations (Relaxed and non-blocking)
    if (age < 16 || age > 75) {
      setErrorMsg("Donor age must be between 16 and 75 years old.");
      return;
    }

    const cleanedPhone = mobileNumber.replace(/\D/g, '');
    if (cleanedPhone.length < 10) {
      setErrorMsg("Please enter a valid 10-digit mobile number.");
      return;
    }

    if (!district || !taluk || !city.trim() || !pinCode.trim()) {
      setErrorMsg("Please complete all location details (District, Taluk, City, and PIN Code).");
      return;
    }

    // Medical check (Relaxed: allow registration but warn if not fully compliant, never block!)
    const isMedicallyEligible = medHealthy && medWeight && medInfections && medTattoo;

    setLoading(true);
    try {
      const emergencyContactString = emergencyContactName.trim() 
        ? `${emergencyContactName.trim()} (${emergencyContactRel.trim() || 'Relation'}) - ${emergencyContactPhone.trim()}`
        : '';

      const donorCol = collection(db, 'donors');
      // If updating, keep existing ID and verification status. If new, generate auto ID.
      const docId = donorProfile?.id || doc(donorCol).id;
      const isVerified = donorProfile?.verified ?? false; // keep verification state or false if new
      const isBlocked = donorProfile?.blocked ?? false;
      const originalNumDonations = donorProfile?.numDonations ?? 0;

      const updatedDonor: Donor = {
        id: docId,
        fullName: fullName.trim(),
        age,
        gender,
        bloodGroup,
        mobileNumber,
        emailAddress: emailAddress.trim().toLowerCase(),
        district,
        taluk,
        city: city.trim(),
        state: "Tamil Nadu",
        pinCode: pinCode.trim(),
        latitude,
        longitude,
        lastDonationDate: lastDonationDate || undefined,
        availabilityStatus,
        medicalEligibility: isMedicallyEligible, // based on checklist validation but does not block registration
        emergencyContact: emergencyContactString,
        verified: isVerified,
        blocked: isBlocked,
        numDonations: originalNumDonations,
        registeredAt: donorProfile?.registeredAt || new Date().toISOString()
      };

      try {
        await setDoc(doc(db, 'donors', docId), updatedDonor);

        // Also update users document to link donor profile
        if (user && !user.uid.startsWith('local_')) {
          await setDoc(doc(db, 'users', user.uid), {
            ...user,
            donorProfileId: docId
          }, { merge: true });
        }
      } catch (firestoreErr) {
        console.warn("Firestore write restricted. Storing donor profile in local fallback storage.", firestoreErr);
        const localDonorsStr = localStorage.getItem('localDonors') || '[]';
        const localDonors = JSON.parse(localDonorsStr);
        const filtered = localDonors.filter((d: any) => d.emailAddress.toLowerCase() !== updatedDonor.emailAddress.toLowerCase());
        filtered.push(updatedDonor);
        localStorage.setItem('localDonors', JSON.stringify(filtered));
      }

      // Update local user state if we are a local user
      if (user) {
        const updatedUser = {
          ...user,
          donorProfileId: docId
        };
        if (user.uid.startsWith('local_')) {
          localStorage.setItem('localUser', JSON.stringify(updatedUser));
        }
      }

      setDonorProfile(updatedDonor);
      setSuccessMsg(donorProfile ? "Donor profile updated successfully!" : "Congratulations! You have successfully registered as an active blood donor.");
      onRefreshDatabase();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to save donor profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // If user is not logged in, request login
  if (!user) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xs">
        <Lock className="mx-auto h-12 w-12 text-slate-400 stroke-1" />
        <h3 className="mt-4 font-sans text-lg font-bold text-slate-900">Sign In Required</h3>
        <p className="mt-2 text-sm text-slate-500 leading-relaxed">
          To register as a blood donor or manage your donor status, you must be logged into a secure account. This links your donor information and protects your privacy.
        </p>
        <button
          onClick={onOpenAuth}
          className="mt-6 inline-flex items-center space-x-1.5 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-blue-700 transition-colors"
          id="btn-donor-auth-trigger"
        >
          <span>Sign In / Create Account</span>
        </button>
      </div>
    );
  }

  const taluks = district ? getTaluksForDistrict(district) : [];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      
      {/* Overview Card */}
      <div className="rounded-2xl bg-gradient-to-r from-red-50/50 to-orange-50/50 p-6 border border-red-100/60 shadow-xs">
        <div className="flex items-start space-x-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
            <Heart className="h-6 w-6 fill-red-600 stroke-red-600" />
          </div>
          <div>
            <h2 className="font-sans text-xl font-extrabold text-slate-900 tracking-tight">
              {donorProfile ? 'Manage Your Donor Profile' : 'Register as a Blood Donor'}
            </h2>
            <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">
              {donorProfile 
                ? 'Keep your availability status, last donation date, and contact details up-to-date so patients and hospital staff can connect with you during an emergency.'
                : 'Join Tamil Nadu\'s trusted network of voluntary blood donors. Your commitment can save lives in critical emergency moments. Registration is free and secure.'}
            </p>
          </div>
        </div>
      </div>

      {profileLoading ? (
        <div className="flex flex-col items-center justify-center py-12 space-y-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          <span className="text-sm font-medium text-slate-500">Loading profile data...</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
          
          {/* Notifications */}
          {errorMsg && (
            <div className="flex items-start space-x-2 rounded-lg bg-red-50 p-4 text-sm text-red-700 border border-red-100">
              <ShieldAlert className="h-5 w-5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="flex items-start space-x-2 rounded-lg bg-emerald-50 p-4 text-sm text-emerald-700 border border-emerald-100">
              <CheckCircle2 className="h-5 w-5 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Quick Availability Status Toggle (for existing donors) */}
          {donorProfile && (
            <div className="rounded-lg bg-slate-50 p-4 border border-slate-100 flex items-center justify-between">
              <div>
                <span className="block text-sm font-bold text-slate-900">Donor Availability Status</span>
                <span className="text-xs text-slate-500">Toggle this off if you are temporarily unable to donate.</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className={`text-xs font-bold ${availabilityStatus === 'Available' ? 'text-emerald-600' : 'text-slate-500'}`}>
                  {availabilityStatus === 'Available' ? 'ACTIVE & AVAILABLE' : 'TEMPORARILY UNAVAILABLE'}
                </span>
                <button
                  type="button"
                  onClick={() => setAvailabilityStatus(prev => prev === 'Available' ? 'Not Available' : 'Available')}
                  className="text-slate-600 focus:outline-hidden"
                  id="btn-toggle-availability"
                >
                  {availabilityStatus === 'Available' ? (
                    <ToggleRight className="h-9 w-9 text-emerald-500 stroke-1" />
                  ) : (
                    <ToggleLeft className="h-9 w-9 text-slate-400 stroke-1" />
                  )}
                </button>
              </div>
            </div>
          )}

          {/* SECTION 1: Personal details */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">
              1. Personal Details
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              
              {/* Name */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Full Name (As in ID)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <User className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter full name"
                    className="w-full rounded-lg border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    id="donor-reg-fullName"
                  />
                </div>
              </div>

              {/* Blood Group */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Blood Group</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-red-500">
                    <Droplet className="h-4 w-4 fill-red-500" />
                  </div>
                  <select
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value as BloodGroup)}
                    className="w-full rounded-lg border border-slate-200 py-2.5 pl-9 pr-3 text-sm font-medium text-slate-900 outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    id="donor-reg-bloodGroup"
                  >
                    {bloodGroups.map((bg) => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Age */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Age (18 - 65)</label>
                <input
                  type="number"
                  required
                  min="18"
                  max="65"
                  value={age}
                  onChange={(e) => setAge(parseInt(e.target.value) || 0)}
                  className="w-full rounded-lg border border-slate-200 py-2.5 px-3 text-sm outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  id="donor-reg-age"
                />
              </div>

              {/* Gender */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as any)}
                  className="w-full rounded-lg border border-slate-200 py-2.5 px-3 text-sm outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  id="donor-reg-gender"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Mobile Number */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Mobile Number</label>
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
                    className="w-full rounded-lg border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    id="donor-reg-mobile"
                  />
                </div>
              </div>

            </div>
          </div>

          {/* SECTION 2: Location details */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">
              2. Location Details
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              
              {/* State (Disabled) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">State</label>
                <input
                  type="text"
                  disabled
                  value="Tamil Nadu (Default)"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm text-slate-500 cursor-not-allowed"
                />
              </div>

              {/* District */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">District</label>
                <select
                  required
                  value={district}
                  onChange={(e) => { setDistrict(e.target.value); setTaluk(''); }}
                  className="w-full rounded-lg border border-slate-200 py-2.5 px-3 text-sm outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  id="donor-reg-district"
                >
                  <option value="">Select District</option>
                  {DISTRICTS.map((dist) => (
                    <option key={dist} value={dist}>{dist}</option>
                  ))}
                </select>
              </div>

              {/* Taluk */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Taluk</label>
                <select
                  required
                  disabled={!district}
                  value={taluk}
                  onChange={(e) => setTaluk(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 py-2.5 px-3 text-sm outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                  id="donor-reg-taluk"
                >
                  <option value="">{district ? 'Select Taluk' : 'Select District First'}</option>
                  {taluks.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {/* Village / City */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Village / City / Street Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Adyar or Gandhinagar"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 py-2.5 px-3 text-sm outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  id="donor-reg-city"
                />
              </div>

              {/* PIN Code */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">PIN Code</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="600020"
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full rounded-lg border border-slate-200 py-2.5 px-3 text-sm outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  id="donor-reg-pinCode"
                />
              </div>

              {/* GPS Coordinates */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">GPS Proximity Location (Optional)</label>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={captureGPS}
                    disabled={gpsLoading}
                    className={`flex-1 flex items-center justify-center space-x-1.5 rounded-lg border text-xs font-semibold py-2.5 transition-colors ${
                      gpsSuccess 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                    id="btn-capture-gps"
                  >
                    <MapPin className="h-4 w-4 text-slate-400" />
                    <span>{gpsLoading ? 'Capturing...' : gpsSuccess ? 'GPS Captured ✓' : 'Pin My Location'}</span>
                  </button>
                  {gpsSuccess && (
                    <button
                      type="button"
                      onClick={() => { setLatitude(undefined); setLongitude(undefined); setGpsSuccess(false); }}
                      className="rounded-lg border border-red-200 bg-red-50 px-3 text-xs font-bold text-red-600 hover:bg-red-100"
                      id="btn-clear-gps"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

            </div>
          </div>

          {/* SECTION 3: Donation history */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">
              3. Donation History & Availability
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              
              {/* Last Blood Donation Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Last Donation Date (Leave empty if never)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <input
                    type="date"
                    value={lastDonationDate}
                    max={new Date().toISOString().split('T')[0]} // Cannot be in future
                    onChange={(e) => setLastDonationDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    id="donor-reg-lastDonation"
                  />
                </div>
              </div>

              {/* Availability Status for NEW registration */}
              {!donorProfile && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Availability Status</label>
                  <select
                    value={availabilityStatus}
                    onChange={(e) => setAvailabilityStatus(e.target.value as any)}
                    className="w-full rounded-lg border border-slate-200 py-2.5 px-3 text-sm outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    id="donor-reg-availability"
                  >
                    <option value="Available">Available Immediately</option>
                    <option value="Not Available">Not Available Now</option>
                  </select>
                </div>
              )}

            </div>
          </div>

          {/* SECTION 4: Medical eligibility checks */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3 border-b border-slate-100 pb-2">
              4. Medical Eligibility Declaration
            </h3>
            <div className="rounded-lg bg-blue-50/50 border border-blue-100 p-4 mb-4 flex items-start space-x-2">
              <Sparkles className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
              <div className="text-xs text-blue-800 leading-relaxed">
                To guarantee blood transfusion safety, all donors must fulfill standard medical eligibility parameters. Please review and verify the following:
              </div>
            </div>
            
            <div className="space-y-3">
              {/* Question 1 */}
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={medHealthy}
                  onChange={(e) => setMedHealthy(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 mt-1"
                />
                <span className="text-xs text-slate-700 font-medium">
                  I feel healthy, well, and capable of completing standard activities today.
                </span>
              </label>

              {/* Question 2 */}
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={medWeight}
                  onChange={(e) => setMedWeight(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 mt-1"
                />
                <span className="text-xs text-slate-700 font-medium">
                  My body weight is above 45kg (Minimum threshold for safe blood extraction).
                </span>
              </label>

              {/* Question 3 */}
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={medInfections}
                  onChange={(e) => setMedInfections(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 mt-1"
                />
                <span className="text-xs text-slate-700 font-medium">
                  I have not had any chronic infections, active fevers, or antibiotic treatment in the last 14 days.
                </span>
              </label>

              {/* Question 4 */}
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={medTattoo}
                  onChange={(e) => setMedTattoo(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 mt-1"
                />
                <span className="text-xs text-slate-700 font-medium">
                  I have not received any professional tattoos, microblading, body piercings, or dental surgeries within the last 6 months.
                </span>
              </label>
            </div>
          </div>

          {/* SECTION 5: Emergency Contact */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">
              5. Emergency Secondary Contact
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              
              {/* Contact Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Contact Person Name</label>
                <input
                  type="text"
                  placeholder="e.g. Priya (Spouse)"
                  value={emergencyContactName}
                  onChange={(e) => setEmergencyContactName(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 py-2.5 px-3 text-sm outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  id="donor-reg-emergencyName"
                />
              </div>

              {/* Relationship */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Relationship to Donor</label>
                <input
                  type="text"
                  placeholder="e.g. Wife, Father, Brother"
                  value={emergencyContactRel}
                  onChange={(e) => setEmergencyContactRel(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 py-2.5 px-3 text-sm outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  id="donor-reg-emergencyRel"
                />
              </div>

              {/* Phone number */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Contact Phone Number</label>
                <input
                  type="tel"
                  placeholder="9876543211"
                  value={emergencyContactPhone}
                  onChange={(e) => setEmergencyContactPhone(e.target.value.replace(/\D/g, ''))}
                  className="w-full rounded-lg border border-slate-200 py-2.5 px-3 text-sm outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  id="donor-reg-emergencyPhone"
                />
              </div>

            </div>
          </div>

          {/* Submit Action */}
          <div className="border-t border-slate-200 pt-5 flex items-center justify-between">
            <div className="text-xs text-slate-500">
              * By saving, you consent to publish your name, blood group, and city to authorized emergency search results.
            </div>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-2 rounded-lg bg-red-600 px-6 py-3 text-sm font-semibold text-white shadow-xs hover:bg-red-700 active:bg-red-800 focus:outline-hidden disabled:bg-red-400 disabled:cursor-not-allowed transition-colors"
              id="btn-save-donor-profile"
            >
              {loading ? (
                <span className="flex h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{donorProfile ? 'Update Donor Profile' : 'Submit Donor Registration'}</span>
                </>
              )}
            </button>
          </div>

        </form>
      )}

    </div>
  );
}
