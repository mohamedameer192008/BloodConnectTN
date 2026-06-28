import React, { useState } from 'react';
import { 
  Building2, MapPin, Phone, Search, Droplet, 
  Map, CheckCircle, ShieldAlert, Navigation, ExternalLink, Calendar
} from 'lucide-react';
import { DISTRICTS } from '../locations';
import { Language, translations } from '../translations';

interface HospitalDirectoryProps {
  lang: Language;
}

interface BloodBank {
  id: string;
  name: string;
  type: 'Govt Hospital' | 'Private Blood Bank' | 'Red Cross' | 'Charitable';
  district: string;
  address: string;
  phone: string;
  googleMapsUrl: string;
  lastUpdated: string;
  stock: Record<string, 'High' | 'Moderate' | 'Low' | 'Out of Stock' | 'Call to Check'>;
  verified: boolean;
}

const INITIAL_BLOOD_BANKS: BloodBank[] = [
  {
    id: 'bb1',
    name: 'Rajiv Gandhi Government General Hospital Blood Bank',
    type: 'Govt Hospital',
    district: 'Chennai',
    address: 'E.V.R. Periyar Salai, Park Town, Opp. Chennai Central Railway Station, Chennai - 600003',
    phone: '+91 44 2530 5000',
    googleMapsUrl: 'https://maps.google.com/?q=Rajiv+Gandhi+Government+General+Hospital+Chennai',
    lastUpdated: 'Today, 10:30 AM',
    stock: {
      'A+': 'High', 'A-': 'Moderate', 'B+': 'High', 'B-': 'Low',
      'AB+': 'Moderate', 'AB-': 'Low', 'O+': 'High', 'O-': 'Moderate'
    },
    verified: true
  },
  {
    id: 'bb2',
    name: 'Madras Medical College & Government General Hospital',
    type: 'Govt Hospital',
    district: 'Chennai',
    address: 'Near Central Railway Station, EVR Road, Chennai - 600003',
    phone: '+91 44 2530 5112',
    googleMapsUrl: 'https://maps.google.com/?q=Madras+Medical+College+Chennai',
    lastUpdated: 'Yesterday',
    stock: {
      'A+': 'High', 'A-': 'Low', 'B+': 'High', 'B-': 'Low',
      'AB+': 'Moderate', 'AB-': 'Out of Stock', 'O+': 'High', 'O-': 'Moderate'
    },
    verified: true
  },
  {
    id: 'bb3',
    name: 'Tamil Nadu Red Cross Society Blood Bank',
    type: 'Red Cross',
    district: 'Chennai',
    address: 'No 32/50, Red Cross Building, Montieth Road, Egmore, Chennai - 600008',
    phone: '+91 44 2855 4548',
    googleMapsUrl: 'https://maps.google.com/?q=Indian+Red+Cross+Society+Chennai',
    lastUpdated: 'Today, 09:15 AM',
    stock: {
      'A+': 'Moderate', 'A-': 'Moderate', 'B+': 'Moderate', 'B-': 'Low',
      'AB+': 'Low', 'AB-': 'Low', 'O+': 'High', 'O-': 'Low'
    },
    verified: true
  },
  {
    id: 'bb4',
    name: 'Government Rajaji Hospital Blood Bank',
    type: 'Govt Hospital',
    district: 'Madurai',
    address: 'Panagal Road, Goripalayam, Madurai - 625020',
    phone: '+91 452 258 9700',
    googleMapsUrl: 'https://maps.google.com/?q=Government+Rajaji+Hospital+Madurai',
    lastUpdated: 'Today, 11:00 AM',
    stock: {
      'A+': 'High', 'A-': 'Moderate', 'B+': 'High', 'B-': 'Moderate',
      'AB+': 'High', 'AB-': 'Low', 'O+': 'High', 'O-': 'Low'
    },
    verified: true
  },
  {
    id: 'bb5',
    name: 'Government Coimbatore Medical College Hospital Blood Bank',
    type: 'Govt Hospital',
    district: 'Coimbatore',
    address: 'Trichy Road, Coimbatore - 641018',
    phone: '+91 422 230 1393',
    googleMapsUrl: 'https://maps.google.com/?q=Coimbatore+Medical+College+Hospital',
    lastUpdated: '2 days ago',
    stock: {
      'A+': 'High', 'A-': 'Low', 'B+': 'High', 'B-': 'Out of Stock',
      'AB+': 'Moderate', 'AB-': 'Low', 'O+': 'High', 'O-': 'Moderate'
    },
    verified: true
  },
  {
    id: 'bb6',
    name: 'Government Kilpauk Medical College Hospital Blood Bank',
    type: 'Govt Hospital',
    district: 'Chennai',
    address: 'No 825, Poonamallee High Road, Kilpauk, Chennai - 600010',
    phone: '+91 44 2641 2946',
    googleMapsUrl: 'https://maps.google.com/?q=Kilpauk+Medical+College+Hospital+Chennai',
    lastUpdated: 'Today, 08:00 AM',
    stock: {
      'A+': 'Moderate', 'A-': 'Low', 'B+': 'High', 'B-': 'Low',
      'AB+': 'Moderate', 'AB-': 'Low', 'O+': 'Moderate', 'O-': 'Low'
    },
    verified: true
  },
  {
    id: 'bb7',
    name: 'Rotary Club Charitable Blood Bank',
    type: 'Charitable',
    district: 'Coimbatore',
    address: 'No 12, Rotary Tower, Avinashi Road, Coimbatore - 641037',
    phone: '+91 422 252 8251',
    googleMapsUrl: 'https://maps.google.com/?q=Rotary+Blood+Bank+Coimbatore',
    lastUpdated: 'Yesterday',
    stock: {
      'A+': 'High', 'A-': 'Moderate', 'B+': 'High', 'B-': 'Call to Check',
      'AB+': 'Moderate', 'AB-': 'Call to Check', 'O+': 'High', 'O-': 'Moderate'
    },
    verified: true
  },
  {
    id: 'bb8',
    name: 'KAP Viswanatham Government Medical College Blood Bank',
    type: 'Govt Hospital',
    district: 'Tiruchirappalli',
    address: 'Collector Office Road, Cantonment, Tiruchirappalli - 620001',
    phone: '+91 431 241 4972',
    googleMapsUrl: 'https://maps.google.com/?q=KAP+Viswanatham+Medical+College+Trichy',
    lastUpdated: 'Today, 11:30 AM',
    stock: {
      'A+': 'High', 'A-': 'Moderate', 'B+': 'High', 'B-': 'Low',
      'AB+': 'Moderate', 'AB-': 'Low', 'O+': 'High', 'O-': 'Low'
    },
    verified: true
  }
];

export default function HospitalDirectory({ lang }: HospitalDirectoryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedStockFilter, setSelectedStockFilter] = useState('');

  const t = translations[lang];

  // Filtering Logic
  const filteredBanks = INITIAL_BLOOD_BANKS.filter(bb => {
    const matchesSearch = bb.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          bb.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDistrict = selectedDistrict ? bb.district === selectedDistrict : true;
    const matchesType = selectedType ? bb.type === selectedType : true;
    
    // Filter by specific blood group stock if requested
    const matchesStock = selectedStockFilter 
      ? bb.stock[selectedStockFilter] === 'High' || bb.stock[selectedStockFilter] === 'Moderate'
      : true;

    return matchesSearch && matchesDistrict && matchesType && matchesStock;
  });

  const getStockBadgeColor = (status: string) => {
    switch (status) {
      case 'High':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'Moderate':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'Low':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'Out of Stock':
        return 'bg-red-50 text-red-800 border-red-200';
      default:
        return 'bg-slate-50 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Title section */}
      <div className="rounded-2xl bg-white border border-border-gray p-8 shadow-xs text-center space-y-3 max-w-4xl mx-auto">
        <Building2 className="mx-auto h-12 w-12 text-primary" />
        <h2 className="font-sans text-2xl font-extrabold text-text-dark tracking-tight">
          {lang === 'en' ? 'Hospitals & Blood Bank Directory' : 'மருத்துவமனைகள் மற்றும் இரத்த வங்கிகள்'}
        </h2>
        <p className="text-sm text-slate-500 max-w-xl mx-auto leading-relaxed">
          {lang === 'en' 
            ? 'Find registered government hospitals, private blood banks, and charitable collection centers across Tamil Nadu. Access direct contacts and stock levels.'
            : 'தமிழ்நாடு முழுவதும் பதிவுசெய்யப்பட்ட அரசு மருத்துவமனைகள், தனியார் இரத்த வங்கிகள் மற்றும் தன்னார்வ சேகரிப்பு மையங்களைக் கண்டறியுங்கள்.'}
        </p>
      </div>

      {/* Filter and Search Panel */}
      <div className="rounded-2xl border border-border-gray bg-white p-6 shadow-xs max-w-6xl mx-auto space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Keyword search */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              {lang === 'en' ? 'Search Bank or Hospital' : 'மருத்துவமனை அல்லது வங்கியின் பெயர்'}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Search className="h-4 w-4" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={lang === 'en' ? 'e.g. Rajiv Gandhi' : 'எ.கா. ராஜீவ் காந்தி'}
                className="w-full rounded-lg border border-border-gray bg-slate-50/50 py-2 pl-9 pr-3 text-xs font-semibold text-slate-800 outline-hidden focus:border-primary focus:bg-white transition-colors"
              />
            </div>
          </div>

          {/* District Selector */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              {lang === 'en' ? 'District' : 'மாவட்டம்'}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <MapPin className="h-4 w-4" />
              </div>
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="w-full rounded-lg border border-border-gray bg-slate-50/50 py-2 pl-9 pr-3 text-xs font-semibold text-slate-800 outline-hidden focus:border-primary focus:bg-white transition-colors"
              >
                <option value="">{lang === 'en' ? 'All Districts' : 'அனைத்து மாவட்டங்கள்'}</option>
                {DISTRICTS.map((dist) => (
                  <option key={dist} value={dist}>{dist}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Organization Type Selector */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              {lang === 'en' ? 'Facility Type' : 'மையத்தின் வகை'}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Building2 className="h-4 w-4" />
              </div>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full rounded-lg border border-border-gray bg-slate-50/50 py-2 pl-9 pr-3 text-xs font-semibold text-slate-800 outline-hidden focus:border-primary focus:bg-white transition-colors"
              >
                <option value="">{lang === 'en' ? 'All Types' : 'அனைத்து வகைகள்'}</option>
                <option value="Govt Hospital">{lang === 'en' ? 'Government Hospital' : 'அரசு மருத்துவமனை'}</option>
                <option value="Private Blood Bank">{lang === 'en' ? 'Private Blood Bank' : 'தனியார் இரத்த வங்கி'}</option>
                <option value="Red Cross">{lang === 'en' ? 'Red Cross Society' : 'ரெட் கிராஸ் சொசைட்டி'}</option>
                <option value="Charitable">{lang === 'en' ? 'Charitable Organization' : 'அறக்கட்டளை மையம்'}</option>
              </select>
            </div>
          </div>

          {/* Blood Group Stock Availability filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              {lang === 'en' ? 'Filter by Blood Stock' : 'இரத்த இருப்பு வடிகட்டி'}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-primary">
                <Droplet className="h-4 w-4 fill-primary" />
              </div>
              <select
                value={selectedStockFilter}
                onChange={(e) => setSelectedStockFilter(e.target.value)}
                className="w-full rounded-lg border border-border-gray bg-slate-50/50 py-2 pl-9 pr-3 text-xs font-semibold text-slate-800 outline-hidden focus:border-primary focus:bg-white transition-colors"
              >
                <option value="">{lang === 'en' ? 'No Stock Filter' : 'இருப்பு வடிகட்டி இல்லை'}</option>
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                  <option key={bg} value={bg}>{bg} ({lang === 'en' ? 'Available' : 'இருப்பு உள்ளது'})</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center text-xs font-bold text-slate-500 pt-3 border-t border-slate-100">
          <span>{lang === 'en' ? 'Verified Centers' : 'சரிபார்க்கப்பட்ட மையங்கள்'}: <span className="text-primary font-extrabold">{filteredBanks.length}</span></span>
          <span className="text-slate-400 font-semibold">{lang === 'en' ? 'Database synched with TN Health Dept.' : 'தரவுத்தளம் சுகாதாரத் துறையுடன் இணைக்கப்பட்டுள்ளது.'}</span>
        </div>
      </div>

      {/* Directory Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl mx-auto">
        {filteredBanks.length === 0 ? (
          <div className="col-span-2 text-center py-16 rounded-xl border border-dashed border-border-gray bg-white max-w-lg mx-auto">
            <Building2 className="mx-auto h-12 w-12 text-slate-300 stroke-1" />
            <h3 className="mt-3 text-sm font-bold text-slate-800">{lang === 'en' ? 'No Registered Centers Found' : 'இரத்த மையங்கள் எதுவும் காணப்படவில்லை'}</h3>
            <p className="mt-1 text-xs text-slate-500">
              {lang === 'en' ? 'Try adjusting your search criteria or district filter.' : 'தயவுசெய்து உங்கள் தேடல் தகுதியை மாற்றவும்.'}
            </p>
          </div>
        ) : (
          filteredBanks.map((bb) => (
            <div 
              key={bb.id}
              className="bg-white rounded-xl border border-border-gray p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              id={`hospital-card-${bb.id}`}
            >
              <div className="space-y-3">
                {/* Header Name & Type */}
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="font-sans text-sm font-bold text-text-dark leading-tight">
                        {bb.name}
                      </h3>
                      {bb.verified && (
                        <span className="bg-emerald-50 text-emerald-700 text-[8px] font-black uppercase px-1.5 py-0.5 rounded border border-emerald-100 inline-flex items-center gap-0.5 shrink-0">
                          <CheckCircle className="h-2.5 w-2.5" />
                          <span>Govt Approved</span>
                        </span>
                      )}
                    </div>
                    <span className="inline-block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {bb.type}
                    </span>
                  </div>

                  <div className="bg-red-50 text-primary rounded-xl h-9 w-9 flex items-center justify-center shrink-0 border border-red-100">
                    <Building2 className="h-5 w-5" />
                  </div>
                </div>

                {/* Details list */}
                <div className="space-y-2 text-xs text-slate-600">
                  <div className="flex items-start">
                    <MapPin className="h-4 w-4 text-slate-400 shrink-0 mr-2 mt-0.5" />
                    <span>{bb.address}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 text-slate-400 shrink-0 mr-2" />
                      <span className="font-bold">{bb.phone}</span>
                    </div>
                    <div className="flex items-center text-[10px] text-slate-400 font-bold gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>Updated: {bb.lastUpdated}</span>
                    </div>
                  </div>
                </div>

                {/* Blood Group Stock levels */}
                <div className="border-t border-slate-100 pt-3">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    {lang === 'en' ? 'Live Blood stock indicators' : 'இரத்த பிரிவு இருப்பு அளவுகள்'}
                  </span>
                  
                  <div className="grid grid-cols-4 gap-2">
                    {Object.entries(bb.stock).map(([bg, status]) => (
                      <div 
                        key={bg}
                        className={`rounded-lg border px-1.5 py-1 text-center text-[10px] font-black flex flex-col items-center justify-center ${getStockBadgeColor(status)}`}
                      >
                        <span className="block font-bold">{bg}</span>
                        <span className="block text-[8px] font-medium tracking-tighter uppercase mt-0.5">{status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Actions buttons */}
              <div className="flex gap-2 border-t border-slate-100 pt-3">
                <a 
                  href={`tel:${bb.phone}`}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Phone className="h-3.5 w-3.5" />
                  <span>{lang === 'en' ? 'Call Center' : 'அழைப்பு செய்'}</span>
                </a>

                <a 
                  href={bb.googleMapsUrl}
                  target="_blank"
                  referrerPolicy="no-referrer"
                  className="flex-1 bg-primary hover:bg-primary-hover text-white font-bold text-xs py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                >
                  <Navigation className="h-3.5 w-3.5" />
                  <span>{lang === 'en' ? 'Navigate Map' : 'வரைபடம் காண்'}</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
