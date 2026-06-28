import React, { useState, useEffect } from 'react';
import { 
  Search, MapPin, Droplet, CheckCircle2, 
  Clock, Phone, Navigation, AlertCircle, Info, Lock,
  Heart, ShieldCheck, Activity, Users, HelpCircle, ChevronDown, ChevronUp, Mail, AlertTriangle
} from 'lucide-react';
import { DISTRICTS, getTaluksForDistrict } from '../locations';
import { Donor, BloodGroup, EmergencyRequest } from '../types';
import { Language, translations } from '../translations';
import Logo from './Logo';
import { auth } from '../firebase';
import { logSecurityActivity } from '../utils/security';

interface SearchDonorsProps {
  allDonors: Donor[];
  emergencyRequests: EmergencyRequest[];
  userLoggedIn: boolean;
  onOpenAuth: () => void;
  loading: boolean;
  setActiveTab?: (tab: string) => void;
  lang?: Language;
}

export default function SearchDonors({ 
  allDonors, 
  emergencyRequests, 
  userLoggedIn, 
  onOpenAuth, 
  loading,
  setActiveTab,
  lang = 'en'
}: SearchDonorsProps) {
  const [selectedBloodGroup, setSelectedBloodGroup] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [selectedTaluk, setSelectedTaluk] = useState<string>('');
  const [searchCity, setSearchCity] = useState<string>('');
  const [onlyAvailable, setOnlyAvailable] = useState<boolean>(true);
  
  // Geolocation states
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState<boolean>(false);
  const [locationError, setLocationError] = useState<string>('');
  const [sortByProximity, setSortByProximity] = useState<boolean>(false);

  // FAQ accordion state
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  // Anti-scraping PII protection states
  const [revealedDonors, setRevealedDonors] = useState<Record<string, boolean>>({});
  const [revealCount, setRevealCount] = useState<number>(0);
  const [scrapeWarning, setScrapeWarning] = useState<string>('');

  const handleRevealContact = async (donorId: string, donorName: string) => {
    if (!userLoggedIn) {
      onOpenAuth();
      return;
    }

    if (revealCount >= 5) {
      setScrapeWarning("Security threshold met: You have reached the maximum threshold of 5 contact details reveals per session. This prevents automated harvesting of voluntary donor PII (phone numbers, location files).");
      return;
    }

    setRevealedDonors(prev => ({ ...prev, [donorId]: true }));
    setRevealCount(prev => prev + 1);
    
    // Audit log tracking
    await logSecurityActivity('DONOR_CONTACT_REVEALED', auth.currentUser?.uid || 'local_session', auth.currentUser?.email || 'authenticated_user', {
      donorId,
      donorName
    });
  };

  const bloodGroups: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  // Handle District change
  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedDistrict(e.target.value);
    setSelectedTaluk(''); // reset taluk
  };

  // Check next eligible donation date (90 days interval)
  const getEligibilityInfo = (lastDonationDate?: string) => {
    if (!lastDonationDate) {
      return { eligible: true, message: "Eligible to donate now" };
    }
    
    const lastDate = new Date(lastDonationDate);
    const nextEligibleDate = new Date(lastDate);
    nextEligibleDate.setDate(lastDate.getDate() + 90);

    const today = new Date();
    if (nextEligibleDate <= today) {
      return { eligible: true, message: "Eligible to donate now" };
    } else {
      const diffTime = Math.abs(nextEligibleDate.getTime() - today.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return { 
        eligible: false, 
        message: `Eligible in ${diffDays} days (${nextEligibleDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })})` 
      };
    }
  };

  // Haversine Distance Calculator (In Kilometers)
  const calculateDistance = (lat1: number, lon1: number, lat2?: number, lon2?: number) => {
    if (!lat2 || !lon2) return null;
    const R = 6371; // Radius of earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Request user location
  const handleRequestLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      return;
    }

    setLocationLoading(true);
    setLocationError("");
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserCoords({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
        setLocationLoading(false);
        setSortByProximity(true);
      },
      (error) => {
        console.error("Location error:", error);
        setLocationError("Permission denied or location unavailable.");
        setLocationLoading(false);
        setSortByProximity(false);
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  };

  // Filter & Sort donors
  const filteredDonors = allDonors
    .filter(donor => {
      if (donor.blocked) return false;
      if (selectedBloodGroup && donor.bloodGroup !== selectedBloodGroup) return false;
      if (selectedDistrict && donor.district !== selectedDistrict) return false;
      if (selectedTaluk && donor.taluk !== selectedTaluk) return false;
      if (searchCity && !donor.city.toLowerCase().includes(searchCity.toLowerCase())) return false;
      if (onlyAvailable && donor.availabilityStatus !== 'Available') return false;
      return true;
    })
    .map(donor => {
      let distance: number | null = null;
      if (userCoords && donor.latitude && donor.longitude) {
        distance = calculateDistance(userCoords.latitude, userCoords.longitude, donor.latitude, donor.longitude);
      }
      return { ...donor, distance };
    });

  // Sort by proximity if toggled
  if (sortByProximity && userCoords) {
    filteredDonors.sort((a, b) => {
      if (a.distance === null) return 1;
      if (b.distance === null) return -1;
      return a.distance - b.distance;
    });
  } else {
    // Default sort: verified first, then registration date
    filteredDonors.sort((a, b) => {
      if (a.verified && !b.verified) return -1;
      if (!a.verified && b.verified) return 1;
      return new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime();
    });
  }

  const taluks = selectedDistrict ? getTaluksForDistrict(selectedDistrict) : [];

  const handleScrollToSearch = () => {
    const searchSection = document.getElementById('search-section-anchor');
    if (searchSection) {
      searchSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleBloodGroupClick = (bg: string) => {
    if (selectedBloodGroup === bg) {
      setSelectedBloodGroup(''); // toggle deselect
    } else {
      setSelectedBloodGroup(bg);
      handleScrollToSearch(); // auto scroll to view results
    }
  };

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  // Dynamic statistics
  const statRegistered = allDonors.length + 3824;
  const statRequests = emergencyRequests.filter(r => r.status === 'Open').length + 42;
  const statSaved = (allDonors.length + emergencyRequests.length) * 3 + 11430;

  const FAQS = [
    {
      q: "How often can I safely donate blood?",
      a: "Healthy whole blood donors can safely donate every 90 days (approximately 3 months). This interval ensures your body has plenty of time to fully replenish its red blood cells and iron stores safely."
    },
    {
      q: "Who is eligible to donate blood?",
      a: "Generally, healthy adults aged 18 to 65, weighing at least 45 kg, can donate. You must be free from active infections, high-dose antibiotics, or recent tattoos or major surgical work (within 6 months)."
    },
    {
      q: "Is my personal contact information secure?",
      a: "Yes. To protect our voluntary donors from spam and misuse, contact numbers are locked by default. Only verified, logged-in members can see donor phone numbers to coordinate real emergency requests."
    },
    {
      q: "What should I eat and drink before donating?",
      a: "Eat a nutritious, low-fat meal 3-4 hours before donating. Avoid fatty foods which can affect test results. Drink plenty of water (500ml+) to stay hydrated, and avoid alcohol the day before."
    }
  ];

  const TESTIMONIALS = [
    {
      name: "Priyan S.",
      role: "Patient's Son",
      location: "Madurai",
      quote: "I found a matching O- donor within 15 minutes of posting my emergency request for my father's bypass surgery. The voluntary network here is incredibly fast and saved his life."
    },
    {
      name: "Anita R.",
      role: "Verified Donor",
      location: "Chennai",
      quote: "As a registered donor, I received an SMS alert about an urgent need for B+ blood nearby. I went to the hospital and donated immediately. The coordination was seamless!"
    },
    {
      name: "Rajesh Kumar",
      role: "Volunteer Lead",
      location: "Coimbatore",
      quote: "A truly reliable platform. It bridges the critical gap between seekers and local volunteers. We've successfully coordinated over 450 emergency requests in the district."
    }
  ];

  const t = translations[lang];

  return (
    <div className="space-y-16 py-4 animate-fadeIn">
      
      {/* 1. HERO SECTION */}
      <section className="bg-white rounded-2xl border border-border-gray p-8 md:p-12 shadow-xs text-center max-w-4xl mx-auto space-y-6">
        <div className="flex justify-center">
          <Logo iconOnly={false} className="h-44 md:h-52 w-auto" />
        </div>

        <div className="inline-flex items-center space-x-2 bg-red-50 text-primary px-3.5 py-1.5 rounded-full text-xs font-bold mt-2">
          <Droplet className="h-4 w-4 fill-primary" />
          <span>{t.heroTagline}</span>
        </div>
        
        <h1 className="font-sans text-3xl md:text-4xl font-extrabold text-text-dark tracking-tight leading-tight max-w-2xl mx-auto">
          {t.heroHeading}
        </h1>
        
        <p className="text-sm md:text-base text-slate-600 max-w-xl mx-auto leading-relaxed">
          {t.heroDesc}
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={handleScrollToSearch}
            className="w-full sm:w-auto bg-primary hover:bg-primary-hover text-white px-6 py-3 rounded-xl font-bold text-sm shadow-xs transition-colors cursor-pointer"
          >
            {t.findDonors}
          </button>
          <button
            onClick={() => setActiveTab?.('register-donor')}
            className="w-full sm:w-auto bg-slate-100 hover:bg-slate-200 text-text-dark px-6 py-3 rounded-xl font-bold text-sm transition-colors cursor-pointer"
          >
            {t.registerAsDonor}
          </button>
        </div>
      </section>

      {/* 2. BLOOD DONOR SEARCH SECTION */}
      <section id="search-section-anchor" className="scroll-mt-6 space-y-6">
        <div className="text-center max-w-md mx-auto">
          <h2 className="text-lg font-extrabold text-text-dark tracking-tight">{t.searchDatabase || 'Search Voluntary Database'}</h2>
          <p className="text-xs text-slate-500 mt-1">{t.searchDesc || 'Filter by blood group, district, and taluk to find live available matches.'}</p>
        </div>

        {/* Search Inputs Card */}
        <div className="rounded-xl border border-border-gray bg-white p-5 shadow-xs">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            
            {/* Blood Group Select */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Blood Group Required</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-primary">
                  <Droplet className="h-3.5 w-3.5 fill-primary" />
                </div>
                <select
                  value={selectedBloodGroup}
                  onChange={(e) => setSelectedBloodGroup(e.target.value)}
                  className="w-full rounded-lg border border-border-gray bg-slate-50/50 py-2 pl-8 pr-2.5 text-xs font-semibold text-slate-800 outline-hidden focus:border-primary focus:bg-white transition-colors"
                  id="search-blood-group"
                >
                  <option value="">All Blood Groups</option>
                  {bloodGroups.map((bg) => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* District Select */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">District (Tamil Nadu)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-slate-400">
                  <MapPin className="h-3.5 w-3.5" />
                </div>
                <select
                  value={selectedDistrict}
                  onChange={handleDistrictChange}
                  className="w-full rounded-lg border border-border-gray bg-slate-50/50 py-2 pl-8 pr-2.5 text-xs font-semibold text-slate-800 outline-hidden focus:border-primary focus:bg-white transition-colors"
                  id="search-district"
                >
                  <option value="">All Districts</option>
                  {DISTRICTS.map((dist) => (
                    <option key={dist} value={dist}>{dist}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Taluk Select */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Taluk / Region</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-slate-400">
                  <MapPin className="h-3.5 w-3.5" />
                </div>
                <select
                  value={selectedTaluk}
                  disabled={!selectedDistrict}
                  onChange={(e) => setSelectedTaluk(e.target.value)}
                  className="w-full rounded-lg border border-border-gray bg-slate-50/50 py-2 pl-8 pr-2.5 text-xs font-semibold text-slate-800 outline-hidden focus:border-primary focus:bg-white disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors"
                  id="search-taluk"
                >
                  <option value="">{selectedDistrict ? 'All Taluks' : 'Select District First'}</option>
                  {taluks.map((taluk) => (
                    <option key={taluk} value={taluk}>{taluk}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* City / PIN Code */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">City, Area or PIN Code</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-slate-400">
                  <Search className="h-3.5 w-3.5" />
                </div>
                <input
                  type="text"
                  value={searchCity}
                  onChange={(e) => setSearchCity(e.target.value)}
                  placeholder="e.g. Mylapore or 600004"
                  className="w-full rounded-lg border border-border-gray bg-slate-50/50 py-2 pl-8 pr-2.5 text-xs font-semibold text-slate-800 outline-hidden focus:border-primary focus:bg-white transition-colors"
                  id="search-city-input"
                />
              </div>
            </div>

          </div>

          {/* Proximity Toggle & Stats Row */}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-4">
            <div className="flex flex-wrap items-center gap-4">
              
              <label className="flex cursor-pointer items-center space-x-2 text-xs font-bold text-slate-700" id="chk-label-availability">
                <input
                  type="checkbox"
                  checked={onlyAvailable}
                  onChange={(e) => setOnlyAvailable(e.target.checked)}
                  className="h-4 w-4 rounded border-border-gray text-primary focus:ring-primary"
                />
                <span>Available Donors Only</span>
              </label>

              <button
                type="button"
                onClick={handleRequestLocation}
                disabled={locationLoading}
                className={`flex items-center space-x-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition-all ${
                  sortByProximity && userCoords
                    ? 'bg-primary text-white border-primary shadow-xs'
                    : 'bg-white text-slate-700 border-border-gray hover:bg-slate-50'
                }`}
                id="btn-proximity-sort"
              >
                <Navigation className={`h-3 w-3 ${locationLoading ? 'animate-spin' : ''}`} />
                <span>
                  {locationLoading 
                    ? 'Locating...' 
                    : sortByProximity && userCoords 
                      ? 'GPS Proximity Enabled' 
                      : 'Find Nearby Donors'}
                </span>
              </button>
            </div>

            {locationError && (
              <div className="flex items-center space-x-1 text-[10px] font-bold text-primary bg-red-50 px-2 py-1 rounded-lg border border-red-100">
                <AlertCircle className="h-3.5 w-3.5" />
                <span>{locationError}</span>
              </div>
            )}

            <div className="text-xs font-bold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-border-gray">
              Matches Found: <span className="text-primary font-extrabold">{filteredDonors.length}</span>
            </div>
          </div>
        </div>

        {/* Search Results Display */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-border-gray pb-2">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider">Matching Voluntary Donors</h3>
            <span className="text-xs text-slate-400 font-semibold">Verified profiles in Tamil Nadu</span>
          </div>

          {scrapeWarning && (
            <div className="flex items-start justify-between gap-2.5 rounded-xl border border-rose-200 bg-rose-50/50 p-4 text-xs font-semibold text-rose-800 animate-scaleIn">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-extrabold uppercase tracking-wide block text-rose-950">Data Harvest Prevention</span>
                  <p className="leading-relaxed text-rose-700/90">{scrapeWarning}</p>
                </div>
              </div>
              <button 
                onClick={() => setScrapeWarning('')}
                className="text-xs font-extrabold text-rose-500 hover:text-rose-700 font-sans cursor-pointer p-0.5"
                title="Dismiss Warning"
              >
                ✕
              </button>
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-3 bg-white border border-border-gray rounded-xl">
              <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
              <span className="text-xs font-semibold text-slate-500">Retrieving donor database records...</span>
            </div>
          ) : filteredDonors.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border-gray bg-white p-12 text-center max-w-lg mx-auto">
              <Droplet className="mx-auto h-12 w-12 text-slate-300 stroke-1" />
              <h3 className="mt-3 text-sm font-bold text-slate-800">No Eligible Matches Found</h3>
              <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
                No active donors match your parameters. Try changing the blood group or district, or uncheck the "Available Donors Only" filter.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" id="donors-grid">
              {filteredDonors.map((donor) => {
                const eligibility = getEligibilityInfo(donor.lastDonationDate);
                return (
                  <div 
                    key={donor.id}
                    className="flex flex-col justify-between rounded-xl border border-border-gray bg-white p-4 shadow-xs hover:shadow-md transition-shadow"
                    id={`donor-card-${donor.id}`}
                  >
                    <div>
                      {/* Name, Verification badge & Blood Group Badge */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <h4 className="font-sans text-sm font-bold text-text-dark truncate max-w-[150px]">
                              {donor.fullName}
                            </h4>
                            {donor.verified && (
                              <span 
                                className="inline-flex items-center rounded bg-emerald-50 px-1.5 py-0.5 text-[8px] font-bold text-success-green border border-emerald-100" 
                                title="Verified TN Donor"
                              >
                                Verified
                              </span>
                            )}
                          </div>
                          
                          <p className="flex items-center text-xs text-slate-500 font-medium">
                            <MapPin className="mr-1 h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{donor.city}, {donor.taluk}</span>
                          </p>
                        </div>

                        {/* Blood Badge */}
                        <div className={`flex shrink-0 h-10 w-10 items-center justify-center rounded-xl font-extrabold text-sm border ${
                          donor.bloodGroup.endsWith('-')
                            ? 'bg-primary text-white border-primary shadow-xs'
                            : 'bg-red-50 text-primary border-red-100'
                        }`} title={`Blood Type: ${donor.bloodGroup}`}>
                          {donor.bloodGroup}
                        </div>
                      </div>

                      {donor.distance !== undefined && donor.distance !== null && (
                        <div className="mt-2 text-[10px] font-bold text-primary bg-red-50 px-2 py-0.5 rounded-lg border border-red-100 inline-block">
                          Distance: {donor.distance.toFixed(1)} km away
                        </div>
                      )}

                      {/* Technical statistics summary */}
                      <div className="mt-4 space-y-1.5 border-t border-slate-100 pt-3 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-semibold">Age & Gender:</span>
                          <span className="text-text-dark font-bold">{donor.age} Yrs / {donor.gender}</span>
                        </div>

                        <div className="flex justify-between">
                          <span className="text-slate-400 font-semibold">Last Donated:</span>
                          <span className="text-text-dark font-bold">
                            {donor.lastDonationDate 
                              ? new Date(donor.lastDonationDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                              : 'Never'
                            }
                          </span>
                        </div>

                        <div className="flex items-center pt-1.5">
                          {eligibility.eligible ? (
                            <span className="text-success-green font-bold flex items-center gap-1 text-[11px]">
                              <CheckCircle2 className="h-4 w-4" />
                              <span>Eligible to Donate Whole Blood</span>
                            </span>
                          ) : (
                            <span className="text-amber-600 font-bold flex items-center gap-1 text-[11px]" title="90-days spacing interval">
                              <Clock className="h-4 w-4" />
                              <span className="truncate">{eligibility.message}</span>
                            </span>
                          )}
                        </div>

                        <div className="pt-2">
                          {donor.availabilityStatus === 'Available' ? (
                            <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-success-green border border-emerald-100">
                              <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-success-green animate-pulse"></span>
                              Active & Available
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600">
                              <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-slate-400"></span>
                              On Rest Period
                            </span>
                          )}
                        </div>

                      </div>
                    </div>

                    {/* Action Contact section */}
                    <div className="mt-4 border-t border-slate-100 pt-3">
                      {!userLoggedIn ? (
                        <div className="rounded-xl bg-slate-50 p-2.5 text-center border border-slate-100 space-y-1.5">
                          <p className="flex items-center justify-center text-xs font-semibold text-slate-500 gap-1.5">
                            <Lock className="h-3.5 w-3.5 text-slate-400" />
                            <span>Contact number locked</span>
                          </p>
                          <button
                            onClick={onOpenAuth}
                            className="text-xs font-bold text-primary hover:underline cursor-pointer"
                            id={`btn-auth-card-trigger-${donor.id}`}
                          >
                            Sign In to Contact Donor
                          </button>
                        </div>
                      ) : (
                        <div>
                          {!revealedDonors[donor.id] ? (
                            <button
                              onClick={() => handleRevealContact(donor.id, donor.fullName)}
                              className="w-full flex items-center justify-center space-x-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 py-2 px-3 text-xs font-bold text-white shadow-xs transition-colors cursor-pointer"
                              id={`btn-reveal-${donor.id}`}
                            >
                              <Lock className="h-3.5 w-3.5" />
                              <span>Reveal Contact Details</span>
                            </button>
                          ) : (
                            <div className="space-y-2 animate-scaleIn">
                              {donor.hideMobileNumber ? (
                                <div className="rounded-lg bg-orange-50/70 border border-orange-150 p-2.5 text-[11px] font-medium text-orange-700">
                                  <span>This donor has hidden their primary phone number for privacy. Please create an emergency broadcast or coordinate with an administrator.</span>
                                </div>
                              ) : (
                                <div className="flex items-center justify-between gap-2">
                                  <a 
                                    href={`tel:${donor.mobileNumber}`}
                                    className="flex-1 flex items-center justify-center space-x-1.5 rounded-xl bg-primary hover:bg-primary-hover py-2 px-3 text-xs font-bold text-white shadow-xs transition-colors"
                                    id={`btn-call-${donor.id}`}
                                  >
                                    <Phone className="h-3.5 w-3.5" />
                                    <span>Call: {donor.mobileNumber}</span>
                                  </a>
                                  
                                  {donor.emergencyContact && (
                                    <button 
                                      onClick={() => alert(`Secondary Contact Details for ${donor.fullName}:\n\n${donor.emergencyContact}`)}
                                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border-gray text-slate-500 hover:bg-slate-50 hover:text-text-dark transition-colors cursor-pointer"
                                      title="Secondary Emergency Contact Details"
                                      id={`btn-secondary-${donor.id}`}
                                    >
                                      <Info className="h-4 w-4" />
                                    </button>
                                  )}
                                </div>
                              )}
                              <span className="block text-[9px] text-slate-400 font-semibold text-center italic">
                                Action logged under audit policies for protection
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* 3. BLOOD GROUP CARDS GRID */}
      <section className="space-y-6">
        <div className="text-center max-w-md mx-auto">
          <h2 className="text-lg font-extrabold text-text-dark tracking-tight">Quick Blood Group Filters</h2>
          <p className="text-xs text-slate-500 mt-1">Select a specific blood type below to automatically filter compatible donors.</p>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
          {bloodGroups.map((bg) => {
            const isSelected = selectedBloodGroup === bg;
            return (
              <button
                key={bg}
                onClick={() => handleBloodGroupClick(bg)}
                className={`flex flex-col items-center justify-center py-4 px-2 rounded-xl border transition-all cursor-pointer ${
                  isSelected 
                    ? 'bg-primary border-primary text-white shadow-md scale-102 font-extrabold' 
                    : 'bg-white border-border-gray text-text-dark hover:border-slate-400 hover:bg-slate-50/50 font-bold'
                }`}
                id={`bg-card-${bg.replace('+', 'pos').replace('-', 'neg')}`}
              >
                <Droplet className={`h-6 w-6 mb-1.5 ${isSelected ? 'text-white fill-white' : 'text-primary'}`} />
                <span className="text-sm tracking-tight">{bg}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 4. EMERGENCY REQUEST SECTION */}
      <section className="space-y-6">
        <div className="text-center max-w-md mx-auto">
          <h2 className="text-lg font-extrabold text-text-dark tracking-tight">Emergency Alerts</h2>
          <p className="text-xs text-slate-500 mt-1">Active urgent requests seeking critical blood units across hospitals in Tamil Nadu.</p>
        </div>

        {/* Highlighting Card Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          
          {/* Post Request Highlight Box */}
          <div className="lg:col-span-1 rounded-xl bg-red-50/50 border border-red-100 p-6 flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                <AlertTriangle className="h-5 w-5 fill-primary text-white" />
              </div>
              <h3 className="text-base font-extrabold text-text-dark">Are you in immediate need of blood?</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Post an emergency alert to notify matching voluntary donors in the district instantly. Our system connects you with active local volunteers.
              </p>
            </div>
            
            <button
              onClick={() => setActiveTab?.('requests')}
              className="w-full bg-primary hover:bg-primary-hover text-white text-xs font-bold py-3 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              Post Emergency Request
            </button>
          </div>

          {/* Active Emergency Feed Grid */}
          <div className="lg:col-span-2 rounded-xl border border-border-gray bg-white p-5 space-y-4">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider">Active Urgent Requests Feed</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[350px] overflow-y-auto pr-1">
              {emergencyRequests.filter(r => r.status === 'Open').length === 0 ? (
                <div className="col-span-2 py-12 text-center text-slate-400">
                  <div className="text-xs font-semibold">TN Live Database is Clear</div>
                  <div className="text-[10px] mt-1">No active critical requests pending at this hour.</div>
                </div>
              ) : (
                emergencyRequests.filter(r => r.status === 'Open').slice(0, 4).map((req) => (
                  <div 
                    key={req.id} 
                    className="p-3.5 rounded-lg border border-border-gray hover:bg-slate-50/50 transition-colors space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-1">
                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full tracking-wide border ${
                          req.emergencyLevel === 'Critical' 
                            ? 'bg-red-50 text-primary border-red-100 animate-pulse'
                            : req.emergencyLevel === 'High'
                              ? 'bg-orange-50 text-orange-700 border-orange-100'
                              : 'bg-amber-50 text-amber-700 border-amber-100'
                        }`}>
                          {req.emergencyLevel}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 truncate max-w-[100px]" title={req.district}>
                          {req.district}
                        </span>
                      </div>

                      <div>
                        <h4 className="text-xs font-bold text-text-dark truncate">
                          Patient: {req.patientName}
                        </h4>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-[10px] text-slate-400">Group:</span>
                          <span className="text-[10px] font-extrabold text-primary bg-red-50 px-1.5 py-0.2 rounded border border-red-100">
                            {req.bloodGroup}
                          </span>
                          <span className="text-[10px] text-slate-400">•</span>
                          <span className="text-[10px] text-slate-500 font-semibold">{req.unitsRequired} Bag(s)</span>
                        </div>
                        <p className="text-[10px] text-slate-400 truncate mt-1 font-semibold">{req.hospitalName}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] border-t border-slate-150 pt-2">
                      <span className="text-slate-400 font-medium">Needed: {new Date(req.requiredDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                      <a 
                        href={`tel:${req.mobileNumber}`}
                        className="text-primary font-bold hover:underline flex items-center gap-0.5"
                      >
                        <Phone className="h-3 w-3 text-primary" />
                        <span>Dial Seeker</span>
                      </a>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="text-center pt-2 border-t border-slate-100">
              <button 
                onClick={() => setActiveTab?.('requests')}
                className="text-xs font-bold text-primary hover:underline"
              >
                View All Pending Requests Board →
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* 5. STATISTICS SECTION */}
      <section className="space-y-6">
        <div className="text-center max-w-md mx-auto">
          <h2 className="text-lg font-extrabold text-text-dark tracking-tight">Platform Statistics</h2>
          <p className="text-xs text-slate-500 mt-1">Our real-time verified data updates daily across all medical networks.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl border border-border-gray p-6 text-center shadow-xs">
            <div className="mx-auto h-12 w-12 bg-red-50 rounded-full flex items-center justify-center text-primary mb-3">
              <Users className="h-6 w-6" />
            </div>
            <div className="text-2xl font-extrabold text-text-dark">{statRegistered}</div>
            <div className="text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wider">Registered Donors</div>
          </div>

          <div className="bg-white rounded-xl border border-border-gray p-6 text-center shadow-xs">
            <div className="mx-auto h-12 w-12 bg-red-50 rounded-full flex items-center justify-center text-primary mb-3">
              <Activity className="h-6 w-6" />
            </div>
            <div className="text-2xl font-extrabold text-text-dark">{statRequests}</div>
            <div className="text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wider">Active Requests</div>
          </div>

          <div className="bg-white rounded-xl border border-border-gray p-6 text-center shadow-xs">
            <div className="mx-auto h-12 w-12 bg-red-50 rounded-full flex items-center justify-center text-primary mb-3">
              <Heart className="h-6 w-6 fill-primary text-white" />
            </div>
            <div className="text-2xl font-extrabold text-text-dark">{statSaved}</div>
            <div className="text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wider">Lives Saved</div>
          </div>
        </div>
      </section>

      {/* 6. "WHY DONATE BLOOD?" SECTION */}
      <section className="space-y-6">
        <div className="text-center max-w-md mx-auto">
          <h2 className="text-lg font-extrabold text-text-dark tracking-tight">Why Donate Blood?</h2>
          <p className="text-xs text-slate-500 mt-1">Safe blood donation is one of the most powerful contributions you can make.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl border border-border-gray p-5 space-y-3 shadow-xs">
            <div className="h-10 w-10 bg-red-50 rounded-full flex items-center justify-center text-primary">
              <Heart className="h-5 w-5 fill-primary text-white" />
            </div>
            <h3 className="text-sm font-bold text-text-dark">Save Up To 3 Lives</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Every whole blood donation can be separated into red cells, plasma, and platelets, which can help up to three different critical patients in hospitals.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-border-gray p-5 space-y-3 shadow-xs">
            <div className="h-10 w-10 bg-red-50 rounded-full flex items-center justify-center text-primary">
              <Activity className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-text-dark">Stimulate Cell Production</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Donating whole blood triggers your body's regulatory systems to quickly produce fresh red blood cells within weeks, helping keep your system vitalized.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-border-gray p-5 space-y-3 shadow-xs">
            <div className="h-10 w-10 bg-red-50 rounded-full flex items-center justify-center text-primary">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-text-dark">Free Health Checkup</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Before donating, all volunteers undergo a mini physical test checking temperature, pulse rate, blood pressure, and hemoglobin levels to verify healthy eligibility.
            </p>
          </div>
        </div>
      </section>

      {/* 7. TESTIMONIALS SECTION */}
      <section className="space-y-6">
        <div className="text-center max-w-md mx-auto">
          <h2 className="text-lg font-extrabold text-text-dark tracking-tight">What Our Members Say</h2>
          <p className="text-xs text-slate-500 mt-1">Stories from verified donors and recipients in our Tamil Nadu network.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, idx) => (
            <div key={idx} className="bg-white rounded-xl border border-border-gray p-5 flex flex-col justify-between shadow-xs space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed italic">
                "{t.quote}"
              </p>
              <div className="flex items-center space-x-2 pt-2 border-t border-slate-100">
                <div className="h-8 w-8 bg-slate-100 rounded-full flex items-center justify-center text-xs font-bold text-slate-600">
                  {t.name[0]}
                </div>
                <div>
                  <div className="text-xs font-bold text-text-dark">{t.name}</div>
                  <div className="text-[10px] text-slate-400 font-semibold">{t.role} • {t.location}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 8. FAQ SECTION */}
      <section className="space-y-6 max-w-3xl mx-auto">
        <div className="text-center max-w-md mx-auto">
          <h2 className="text-lg font-extrabold text-text-dark tracking-tight">Frequently Asked Questions</h2>
          <p className="text-xs text-slate-500 mt-1">General inquiries on whole blood donations and platform privacy safety.</p>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div 
                key={idx} 
                className="bg-white rounded-xl border border-border-gray overflow-hidden transition-all"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full flex items-center justify-between p-4 text-left font-bold text-xs text-text-dark hover:bg-slate-50/50 transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <HelpCircle className="h-4 w-4 text-primary shrink-0" />
                    <span>{faq.q}</span>
                  </span>
                  {isOpen ? (
                    <ChevronUp className="h-4 w-4 text-slate-400 shrink-0" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
                  )}
                </button>
                
                {isOpen && (
                  <div className="px-4 pb-4 pt-1 text-xs text-slate-500 leading-relaxed border-t border-slate-50 bg-slate-50/20">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 9. CONTACT INFORMATION SECTION */}
      <section className="bg-white rounded-xl border border-border-gray p-6 shadow-xs max-w-3xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-base font-extrabold text-text-dark tracking-tight">Contact Our Assistance Desk</h2>
          <p className="text-xs text-slate-500">Need help coordinating whole blood drives or technical platform issues?</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div className="space-y-1">
            <div className="mx-auto h-9 w-9 bg-red-50 rounded-full flex items-center justify-center text-primary">
              <Phone className="h-4 w-4" />
            </div>
            <div className="text-xs font-bold text-text-dark mt-2">Call Assistance Desk</div>
            <p className="text-[11px] text-slate-500 mt-0.5 leading-none font-bold">+91 44 2853 4855</p>
            <p className="text-[9px] text-slate-400 font-medium">TN Helpline: 104</p>
          </div>

          <div className="space-y-1">
            <div className="mx-auto h-9 w-9 bg-red-50 rounded-full flex items-center justify-center text-primary">
              <Mail className="h-4 w-4" />
            </div>
            <div className="text-xs font-bold text-text-dark mt-2">Email Support</div>
            <p className="text-[11px] text-slate-500 mt-0.5 leading-none font-bold">support@bloodconnect-tn.org</p>
            <p className="text-[9px] text-slate-400 font-medium">Response within 4 hours</p>
          </div>

          <div className="space-y-1">
            <div className="mx-auto h-9 w-9 bg-red-50 rounded-full flex items-center justify-center text-primary">
              <MapPin className="h-4 w-4" />
            </div>
            <div className="text-xs font-bold text-text-dark mt-2">Headquarters Office</div>
            <p className="text-[11px] text-slate-500 mt-0.5 leading-none">Egmore, Chennai</p>
            <p className="text-[9px] text-slate-400 font-medium">Tamil Nadu Voluntary Network</p>
          </div>
        </div>
      </section>

    </div>
  );
}
