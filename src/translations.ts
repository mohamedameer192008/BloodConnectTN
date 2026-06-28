export type Language = 'en' | 'ta';

export interface TranslationDict {
  findDonors: string;
  emergencyRequests: string;
  registerAsDonor: string;
  donationGuide: string;
  hospitalsBanks: string;
  myProfile: string;
  admin: string;
  signIn: string;
  signOut: string;
  heroTagline: string;
  heroHeading: string;
  heroDesc: string;
  needBloodNow: string;
  quickBloodFilters: string;
  quickBloodDesc: string;
  searchDatabase: string;
  searchDesc: string;
  bloodGroupReq: string;
  districtLabel: string;
  talukLabel: string;
  cityAreaPin: string;
  availableOnly: string;
  findNearby: string;
  locating: string;
  gpsProximity: string;
  matchesFound: string;
  whyDonate: string;
  whyDonateDesc: string;
  saveThreeLives: string;
  saveThreeDesc: string;
  stimulateCells: string;
  stimulateDesc: string;
  freeCheckup: string;
  freeCheckupDesc: string;
  statsTitle: string;
  statsDesc: string;
  totalRegistered: string;
  activeRequests: string;
  livesSaved: string;
  emergencyAlerts: string;
  emergencyAlertsDesc: string;
  areYouInNeed: string;
  postAlertDesc: string;
  postAlertBtn: string;
  activeRequestsFeed: string;
  dialSeeker: string;
  whatMembersSay: string;
  testimonialsDesc: string;
  faqTitle: string;
  faqDesc: string;
  contactAssistance: string;
  contactDesc: string;
  callDesk: string;
  emailSupport: string;
  hqOffice: string;
  allGroups: string;
  allDistricts: string;
  allTaluks: string;
  selectDistrictFirst: string;
  contactNumberLocked: string;
  signInToContact: string;
  activeAndAvailable: string;
  onRestPeriod: string;
  lastDonated: string;
  ageGender: string;
  eligibleToDonate: string;
}

export const translations: Record<Language, TranslationDict> = {
  en: {
    findDonors: "Find Donors",
    emergencyRequests: "Emergency Requests",
    registerAsDonor: "Register as Donor",
    donationGuide: "Donation Guide & AI Chatbot",
    hospitalsBanks: "Hospitals & Blood Banks",
    myProfile: "My Profile",
    admin: "Admin Panel",
    signIn: "Sign In",
    signOut: "Sign Out",
    heroTagline: "Tamil Nadu Voluntary Blood Donor Finder",
    heroHeading: "Find a Blood Donor & Save Lives in Emergencies",
    heroDesc: "Connect with verified voluntary blood donors across Tamil Nadu. Quickly find matching donors near your location or post an emergency request.",
    needBloodNow: "Need Blood Now?",
    quickBloodFilters: "Quick Blood Group Filters",
    quickBloodDesc: "Select a specific blood type below to automatically filter compatible donors.",
    searchDatabase: "Search Voluntary Database",
    searchDesc: "Filter by blood group, district, and taluk to find live available matches.",
    bloodGroupReq: "Blood Group Required",
    districtLabel: "District (Tamil Nadu)",
    talukLabel: "Taluk / Region",
    cityAreaPin: "City, Area or PIN Code",
    availableOnly: "Available Donors Only",
    findNearby: "Find Nearby Donors",
    locating: "Locating...",
    gpsProximity: "GPS Proximity Enabled",
    matchesFound: "Matches Found",
    whyDonate: "Why Donate Blood?",
    whyDonateDesc: "Safe blood donation is one of the most powerful contributions you can make to human society.",
    saveThreeLives: "Save Up To 3 Lives",
    saveThreeDesc: "Every whole blood donation can be separated into red cells, plasma, and platelets, helping three different patients in medical need.",
    stimulateCells: "Stimulate Cell Production",
    stimulateDesc: "Donating whole blood triggers your body to synthesize fresh red blood cells within weeks, helping maintain high cardiovascular vitality.",
    freeCheckup: "Free Health Checkup",
    freeCheckupDesc: "Before donating, all volunteers undergo a mini physical checkup checking pulse, blood pressure, temperature, and hemoglobin levels.",
    statsTitle: "Platform Statistics",
    statsDesc: "Our real-time verified statistics update daily across voluntary healthcare networks in Tamil Nadu.",
    totalRegistered: "Registered Donors",
    activeRequests: "Active Requests",
    livesSaved: "Lives Saved",
    emergencyAlerts: "Emergency Alerts",
    emergencyAlertsDesc: "Active urgent requests seeking critical blood units across hospital blood banks in Tamil Nadu.",
    areYouInNeed: "Are you in immediate need of blood?",
    postAlertDesc: "Post an emergency alert to notify matching voluntary donors in the district instantly. Our system connects you with active local volunteers.",
    postAlertBtn: "Post Emergency Request",
    activeRequestsFeed: "Active Urgent Requests Feed",
    dialSeeker: "Dial Seeker",
    whatMembersSay: "What Our Members Say",
    testimonialsDesc: "Heartfelt stories from verified donors and recipients in our Tamil Nadu network.",
    faqTitle: "Frequently Asked Questions",
    faqDesc: "In-depth clinical inquiries regarding whole blood donation procedure and donor safety.",
    contactAssistance: "Contact Our Assistance Desk",
    contactDesc: "Need help coordinating whole blood drives or technical platform issues?",
    callDesk: "Call Assistance Desk",
    emailSupport: "Email Support",
    hqOffice: "Headquarters Office",
    allGroups: "All Blood Groups",
    allDistricts: "All Districts",
    allTaluks: "All Taluks",
    selectDistrictFirst: "Select District First",
    contactNumberLocked: "Contact number locked for privacy",
    signInToContact: "Sign In to Contact Donor",
    activeAndAvailable: "Active & Available",
    onRestPeriod: "On Rest Period",
    lastDonated: "Last Donated",
    ageGender: "Age & Gender",
    eligibleToDonate: "Eligible to Donate Whole Blood",
  },
  ta: {
    findDonors: "நன்கொடையாளர்களைக் கண்டறி",
    emergencyRequests: "அவசரக் கோரிக்கைகள்",
    registerAsDonor: "நன்கொடையாளராகப் பதிவு செய்",
    donationGuide: "வழிகாட்டி & AI அரட்டை",
    hospitalsBanks: "மருத்துவமனைகள் & இரத்த வங்கிகள்",
    myProfile: "எனது சுயவிவரம்",
    admin: "நிர்வாகக் குழு",
    signIn: "உள்நுழைக",
    signOut: "வெளியேறு",
    heroTagline: "தமிழ்நாடு தன்னார்வ இரத்த நன்கொடையாளர் கண்டறிப்பான்",
    heroHeading: "இரத்த நன்கொடையாளரைக் கண்டறிந்து அவசர காலத்தில் உயிரைக் காப்போம்",
    heroDesc: "தமிழ்நாடு முழுவதும் உள்ள சரிபார்க்கப்பட்ட தன்னார்வ இரத்த நன்கொடையாளர்களுடன் இணையுங்கள். உங்கள் இருப்பிடத்திற்கு அருகிலுள்ள நன்கொடையாளர்களை விரைவாகக் கண்டறியுங்கள் அல்லது அவசர இரத்தக் கோரிக்கையை இடுங்கள்.",
    needBloodNow: "இரத்தம் உடனே தேவையா?",
    quickBloodFilters: "விரைவான இரத்த பிரிவு வடிகட்டிகள்",
    quickBloodDesc: "பொருத்தமான நன்கொடையாளர்களை தானாகவே வடிகட்ட கீழே உள்ள ஒரு குறிப்பிட்ட இரத்தப் பிரிவைத் தேர்ந்தெடுக்கவும்.",
    searchDatabase: "தன்னார்வ தரவுத்தளத்தைத் தேடு",
    searchDesc: "நேரடி இருப்பு உள்ள நன்கொடையாளர்களைக் கண்டறிய இரத்தப் பிரிவு, மாவட்டம் மற்றும் தாலுகா மூலம் வடிகட்டவும்.",
    bloodGroupReq: "தேவைப்படும் இரத்த பிரிவு",
    districtLabel: "மாவட்டம் (தமிழ்நாடு)",
    talukLabel: "தாலுகா / பகுதி",
    cityAreaPin: "நகரம், பகுதி அல்லது அஞ்சல் குறியீடு",
    availableOnly: "இருப்பில் உள்ள நன்கொடையாளர்கள் மட்டும்",
    findNearby: "அருகிலுள்ள நன்கொடையாளர்களைக் காண்",
    locating: "இருப்பிடத்தைக் கண்டறிகிறது...",
    gpsProximity: "GPS இருப்பிடம் இயக்கப்பட்டது",
    matchesFound: "பொருத்தங்கள் கண்டறியப்பட்டன",
    whyDonate: "இரத்தம் ஏன் தானம் செய்ய வேண்டும்?",
    whyDonateDesc: "பாதுகாப்பான இரத்த தானம் என்பது மனித சமூகத்திற்கு நீங்கள் செய்யக்கூடிய மிகச் சிறந்த பங்களிப்புகளில் ஒன்றாகும்.",
    saveThreeLives: "3 உயிர்கள் வரை காக்கலாம்",
    saveThreeDesc: "ஒவ்வொரு முழு இரத்த தானமும் சிவப்பு அணுக்கள், பிளாஸ்மா மற்றும் பிளேட்லெட்டுகளாக பிரிக்கப்பட்டு, மூன்று வெவ்வேறு நோயாளிகளுக்கு உதவுகிறது.",
    stimulateCells: "செல் உற்பத்தியை அதிகரிக்கும்",
    stimulateDesc: "இரத்த தானம் செய்வதன் மூலம் உங்கள் உடல் சில வாரங்களுக்குள் புதிய சிவப்பு இரத்த அணுக்களை உருவாக்கி, இதய ஆரோக்கியத்தை மேம்படுத்துகிறது.",
    freeCheckup: "இலவச மருத்துவ பரிசோதனை",
    freeCheckupDesc: "இரத்த தானம் செய்வதற்கு முன், அனைத்து தன்னார்வலர்களுக்கும் நாடித் துடிப்பு, இரத்த அழுத்தம், உடல் வெப்பநிலை மற்றும் ஹீமோகுளோபின் அளவுகள் சோதிக்கப்படும்.",
    statsTitle: "தளத்தின் புள்ளிவிவரங்கள்",
    statsDesc: "தமிழ்நாட்டின் தன்னார்வ சுகாதார நெட்வொர்க்குகளில் எங்களது நேரடி புள்ளிவிவரங்கள் தினசரி புதுப்பிக்கப்படுகின்றன.",
    totalRegistered: "பதிவு செய்யப்பட்ட நன்கொடையாளர்கள்",
    activeRequests: "செயலில் உள்ள கோரிக்கைகள்",
    livesSaved: "காக்கப்பட்ட உயிர்கள்",
    emergencyAlerts: "அவசர எச்சரிக்கைகள்",
    emergencyAlertsDesc: "தமிழ்நாட்டில் உள்ள பல்வேறு மருத்துவமனை இரத்த வங்கிகளில் இரத்தம் தேவைப்படும் அவசரக் கோரிக்கைகள்.",
    areYouInNeed: "உங்களுக்கு அவசரமாக இரத்தம் தேவையா?",
    postAlertDesc: "மாவட்டத்தில் உள்ள பொருத்தமான தன்னார்வ நன்கொடையாளர்களுக்கு உடனடியாகத் தெரிவிக்க அவசர எச்சரிக்கையை இடுங்கள். எங்கள் தளம் உங்களை இணைக்கும்.",
    postAlertBtn: "அவசர கோரிக்கையை இடுகையிடு",
    activeRequestsFeed: "செயலில் உள்ள அவசர கோரிக்கைகள்",
    dialSeeker: "அழைப்பு செய்",
    whatMembersSay: "நமது உறுப்பினர்கள் கூறுவது",
    testimonialsDesc: "தமிழ்நாடு நெட்வொர்க்கில் உள்ள சரிபார்க்கப்பட்ட நன்கொடையாளர்கள் மற்றும் பயனாளிகளின் நெஞ்சார்ந்த கதைகள்.",
    faqTitle: "அடிக்கடி கேட்கப்படும் கேள்விகள்",
    faqDesc: "இரத்த தானம் செய்யும் முறை மற்றும் நன்கொடையாளர்களின் பாதுகாப்பு குறித்த மருத்துவக் கேள்விகள்.",
    contactAssistance: "எங்கள் உதவி மையத்தைத் தொடர்பு கொள்ளவும்",
    contactDesc: "இரத்த தான முகாம்களை ஒருங்கிணைப்பதில் உதவி தேவையா அல்லது தளத்தில் தொழில்நுட்பக் கோளாறுகளா?",
    callDesk: "உதவி மையத்தை அழைக்கவும்",
    emailSupport: "மின்னஞ்சல் ஆதரவு",
    hqOffice: "தலைமையகம்",
    allGroups: "அனைத்து இரத்த பிரிவுகள்",
    allDistricts: "அனைத்து மாவட்டங்கள்",
    allTaluks: "அனைத்து தாலுகாக்கள்",
    selectDistrictFirst: "முதலில் மாவட்டத்தைத் தேர்ந்தெடுக்கவும்",
    contactNumberLocked: "தனியுரிமைக்காக எண் பூட்டப்பட்டுள்ளது",
    signInToContact: "நன்கொடையாளரைத் தொடர்பு கொள்ள உள்நுழைக",
    activeAndAvailable: "செயலில் & இருப்பில் உள்ளவர்",
    onRestPeriod: "ஓய்வு காலத்தில் உள்ளார்",
    lastDonated: "கடைசியாக தானம் செய்தது",
    ageGender: "வயது & பாலினம்",
    eligibleToDonate: "இரத்த தானம் செய்ய தகுதியுடையவர்",
  }
};
