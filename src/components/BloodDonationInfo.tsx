import React, { useState, useRef, useEffect } from 'react';
import { 
  Heart, Sparkles, AlertCircle, HelpCircle, Send,
  ChevronDown, ChevronUp, ShieldCheck, Activity, Brain, User, AlertTriangle, RefreshCw
} from 'lucide-react';
import { Language, translations } from '../translations';

interface BloodDonationInfoProps {
  lang: Language;
}

interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

export default function BloodDonationInfo({ lang }: BloodDonationInfoProps) {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  // Chatbot state
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'model',
      content: lang === 'en' 
        ? "Hello! I am Arogya, your AI health assistant. Ask me anything about blood donation guidelines, eligibility, safety procedures, or blood group compatibility!" 
        : "வணக்கம்! நான் ஆரோக்கியா, உங்கள் AI சுகாதார உதவியாளர். இரத்த தான வழிகாட்டுதல்கள், தகுதிகள் அல்லது பாதுகாப்பு முறைகள் பற்றி என்னிடம் கேளுங்கள்!"
    }
  ]);
  const [userInput, setUserInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Eligibility state
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [lastDonationDate, setLastDonationDate] = useState('');
  const [medicalConditions, setMedicalConditions] = useState('');
  const [travelHistory, setTravelHistory] = useState('');
  const [lifestyleFactors, setLifestyleFactors] = useState('');
  
  const [eligibilityResult, setEligibilityResult] = useState<any | null>(null);
  const [eligibilityLoading, setEligibilityLoading] = useState(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const eligibilityCriteria = [
    { label: lang === 'en' ? 'Age Requirement' : 'வயது வரம்பு', desc: lang === 'en' ? 'Must be between 18 and 65 years of age.' : '18 முதல் 65 வயதுக்கு உட்பட்டவராக இருக்க வேண்டும்.' },
    { label: lang === 'en' ? 'Body Weight' : 'உடல் எடை', desc: lang === 'en' ? 'Must weigh at least 45 kg (some specific collections require 50 kg).' : 'குறைந்தது 45 கிலோ எடை இருக்க வேண்டும்.' },
    { label: lang === 'en' ? 'Hemoglobin Level' : 'ஹீமோகுளோபின் அளவு', desc: lang === 'en' ? 'Must have a minimum hemoglobin percentage of 12.5 g/dL.' : 'குறைந்தபட்சம் 12.5 g/dL ஹீமோகுளோபின் அளவு இருக்க வேண்டும்.' },
    { label: lang === 'en' ? 'Donation Interval' : 'தான இடைவெளி', desc: lang === 'en' ? 'Must allow at least 90 days (3 months) since the last donation.' : 'கடைசி தானத்தில் இருந்து குறைந்தபட்சம் 90 நாட்கள் (3 மாதங்கள்) ஆகியிருக்க வேண்டும்.' },
    { label: lang === 'en' ? 'General Health' : 'பொது ஆரோக்கியம்', desc: lang === 'en' ? 'Must feel well and healthy. Free from active fevers or coughs.' : 'நன்றாக உடல் நலம் பெற்றிருக்க வேண்டும். காய்ச்சல், சளி இருக்கக்கூடாது.' },
    { label: lang === 'en' ? 'No Recent Surgeries/Tattoos' : 'அறுவை சிகிச்சை/பச்சை குத்துதல்', desc: lang === 'en' ? 'No surgical procedures, tattoos, or body piercings in the last 6 months.' : 'கடந்த 6 மாதங்களில் அறுவை சிகிச்சை, பச்சை குத்துதல் இருக்கக்கூடாது.' }
  ];

  const donationSteps = [
    {
      title: lang === 'en' ? '1. Registration & Consent' : '1. பதிவு & ஒப்புதல்',
      desc: lang === 'en' ? 'Verify identity documents and read transfusion safety criteria.' : 'அடையாள ஆவணங்களை சரிபார்த்து, பாதுகாப்பு நெறிமுறைகளைப் படித்தல்.'
    },
    {
      title: lang === 'en' ? '2. Mini Physical Examination' : '2. ஆரம்ப மருத்துவ சோதனை',
      desc: lang === 'en' ? 'A medical official checks vital stats, blood pressure, and hemoglobin levels.' : 'இரத்த அழுத்தம், ஹீமோகுளோபின் மற்றும் உடல் வெப்பநிலை சரிபார்க்கப்படும்.'
    },
    {
      title: lang === 'en' ? '3. Safe Extraction' : '3. பாதுகாப்பான பிரித்தெடுத்தல்',
      desc: lang === 'en' ? 'A brand-new sterile needle extracts 350ml-450ml of whole blood (takes 8-10 mins).' : 'புதிய ஊசியைப் பயன்படுத்தி 350ml-450ml இரத்தம் எடுக்கப்படும் (8-10 நிமிடங்கள்).'
    },
    {
      title: lang === 'en' ? '4. Recovery & Refreshment' : '4. ஓய்வு & புத்துணர்ச்சி',
      desc: lang === 'en' ? 'Rest for 10-15 minutes, consume juice/water and biscuits before leaving.' : '10-15 நிமிடங்கள் ஓய்வெடுத்து, பழச்சாறு/தண்ணீர் மற்றும் பிஸ்கட் உட்கொள்ளுதல்.'
    }
  ];

  const benefits = [
    {
      title: lang === 'en' ? 'Saves Human Lives' : 'உயிர்களைக் காக்கிறது',
      desc: lang === 'en' ? 'Every single donation can save up to 3 individual lives.' : 'ஒவ்வொரு தானமும் 3 நடுத்தர மனித உயிர்கள் வரை காக்க உதவும்.'
    },
    {
      title: lang === 'en' ? 'Stimulates Cell Production' : 'புதிய அணுக்களின் உற்பத்தி',
      desc: lang === 'en' ? 'Triggers bone marrow to synthesize fresh, active red blood cells.' : 'எலும்பு மஜ்ஜையைத் தூண்டி புதிய இரத்த அணுக்களை உற்பத்தி செய்கிறது.'
    },
    {
      title: lang === 'en' ? 'Complimentary Checkup' : 'இலவச உடல் பரிசோதனை',
      desc: lang === 'en' ? 'Receive free screening for BP, pulse, hemoglobin, and blood markers.' : 'இரத்த அழுத்தம், ஹீமோகுளோபின் போன்றவற்றை இலவசமாக அறியலாம்.'
    },
    {
      title: lang === 'en' ? 'Reduces Cardiovascular Risk' : 'இதய நோய் ஆபத்து குறைப்பு',
      desc: lang === 'en' ? 'Regular donation controls iron levels, reducing viscosity and risks.' : 'இரத்த தானம் இரும்புச் சத்தின் அளவைக் கட்டுப்படுத்தி இதய நோய்களைக் குறைக்கிறது.'
    }
  ];

  const faqs = [
    {
      question: lang === 'en' ? "Is donating blood safe?" : "இரத்த தானம் செய்வது பாதுகாப்பானதா?",
      answer: lang === 'en' 
        ? "Absolutely. All needles and extraction kits are 100% sterile, single-use, and disposed of immediately. It is impossible to contract any blood-borne infections by donating blood."
        : "முற்றிலும் பாதுகாப்பானது. பயன்படுத்தப்படும் அனைத்து ஊசிகளும் 100% மலடாக்கப்பட்டவை மற்றும் ஒருமுறை மட்டுமே பயன்படுத்தக்கூடியவை. எனவே தொற்று ஏற்பட வாய்ப்பே இல்லை."
    },
    {
      question: lang === 'en' ? "How long does it take for my body to replenish?" : "உடல் இழந்த இரத்தத்தை எவ்வளவு நேரத்தில் மீட்டெடுக்கும்?",
      answer: lang === 'en'
        ? "Your blood volume is fully restored within 24 to 48 hours through increased fluid intake. Red blood cells take about 4 to 8 weeks to fully synthesize, which is why there is a mandatory 90-day waiting interval."
        : "அதிக திரவங்களை உட்கொள்வதன் மூலம் 24 முதல் 48 மணி நேரத்திற்குள் இரத்த அளவு முழுமையாக மீட்டமைக்கப்படும். சிவப்பு அணுக்கள் முழுமையாக உருவாக 4-8 வாரங்கள் ஆகும், இதனால் தான் 90 நாட்கள் இடைவெளி தேவை."
    }
  ];

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  // Chatbot Submit
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    const userMsg = userInput.trim();
    setUserInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setChatLoading(true);

    try {
      // Map ChatMessage structure to format expected by backend api
      const chatHistory = messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        content: m.content
      }));

      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, history: chatHistory })
      });

      const data = await res.json();
      if (res.ok && data.reply) {
        setMessages(prev => [...prev, { role: 'model', content: data.reply }]);
      } else {
        throw new Error(data.error || "Failed to load reply");
      }
    } catch (err: any) {
      console.error(err);
      setMessages(prev => [...prev, { 
        role: 'model', 
        content: lang === 'en' 
          ? "I'm having trouble connecting to the medical AI server right now. Rest assured: O- can donate to everyone, AB+ can receive from everyone, and you can donate every 90 days if healthy."
          : "தற்போது மருத்துவ AI சேவையகத்துடன் இணைப்பதில் சிக்கல் உள்ளது. கவலைப்பட வேண்டாம்: ஆரோக்கியமானவர்கள் 90 நாட்களுக்கு ஒருமுறை இரத்தம் வழங்கலாம்."
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    setUserInput(prompt);
  };

  // Eligibility Checker Submit
  const handleCheckEligibility = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!age || !weight) {
      alert(lang === 'en' ? "Please provide both Age and Weight." : "வயது மற்றும் எடையை தயவுசெய்து குறிப்பிடவும்.");
      return;
    }

    setEligibilityLoading(true);
    setEligibilityResult(null);

    try {
      const res = await fetch('/api/gemini/eligibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          age,
          weight,
          lastDonationDate,
          medicalConditions,
          travelHistory,
          lifestyleFactors
        })
      });

      const data = await res.json();
      if (res.ok) {
        setEligibilityResult(data);
      } else {
        throw new Error(data.error || "Failed to analyze");
      }
    } catch (err: any) {
      console.error(err);
      // Hard Fallback calculation
      const isEligible = Number(age) >= 18 && Number(age) <= 65 && Number(weight) >= 45 && !medicalConditions;
      setEligibilityResult({
        eligible: isEligible,
        score: isEligible ? 90 : 35,
        analysis: lang === 'en'
          ? `[Local Offline Assessment] Based on your inputs: Age ${age}, Weight ${weight}kg, you are ${isEligible ? 'Eligible' : 'Not Eligible'} to donate. Ensure you drink water and avoid alcohol for 24 hours.`
          : `உங்களது தகவல்களின்படி: வயது ${age}, எடை ${weight} கிலோ. நீங்கள் இரத்த தானம் செய்ய ${isEligible ? 'தகுதியுடையவர்' : 'தகுதியற்றவர்'}.`,
        recommendations: [
          lang === 'en' ? "Drink 500ml water and have a healthy meal prior to donation." : "தானம் செய்வதற்கு முன் 500 மிலி தண்ணீர் மற்றும் உணவு உட்கொள்ளவும்.",
          lang === 'en' ? "Ensure 8 hours of restful sleep." : "8 மணி நேரம் நல்ல தூக்கம் இருப்பதை உறுதி செய்யவும்."
        ]
      });
    } finally {
      setEligibilityLoading(false);
    }
  };

  return (
    <div className="space-y-12 max-w-6xl mx-auto">
      
      {/* Hero Banner */}
      <div className="rounded-2xl bg-white border border-border-gray p-8 shadow-xs text-center">
        <Heart className="mx-auto h-12 w-12 text-primary fill-red-50" />
        <h2 className="mt-4 font-sans text-2xl font-extrabold text-text-dark tracking-tight">
          {lang === 'en' ? 'Clinical Donation Guide & AI Center' : 'மருத்துவ வழிகாட்டி மற்றும் AI மையம்'}
        </h2>
        <p className="mt-2 text-sm text-slate-500 max-w-xl mx-auto leading-relaxed">
          {lang === 'en' 
            ? 'Arm yourself with professional medical guidelines. Chat with our medical AI assistant, verify your safe eligibility, and read our safety checklists.'
            : 'அங்கீகரிக்கப்பட்ட மருத்துவ வழிகாட்டுதல்களை அறியுங்கள். எங்களது AI ஆரோக்கியாவிடம் உரையாடி உங்களது தகுதியை சரிபார்க்கவும்.'}
        </p>
      </div>

      {/* Grid: AI Chatbot & AI Eligibility Checker */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
        
        {/* 1. AI Chatbot Card */}
        <div className="rounded-2xl border border-border-gray bg-white p-5 shadow-xs flex flex-col justify-between h-[500px]">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
            <Brain className="h-5 w-5 text-primary" />
            <div>
              <h3 className="text-xs font-black text-text-dark uppercase tracking-wide">
                {lang === 'en' ? 'Arogya Medical FAQ AI Chatbot' : 'ஆரோக்கியா AI மருத்துவ அரட்டை'}
              </h3>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                {lang === 'en' ? 'Powered by Gemini 3.5 Flash' : 'ஜெமினி 3.5 ஃப்ளாஷ் மூலம் இயங்குகிறது'}
              </p>
            </div>
          </div>

          {/* Messages screen */}
          <div className="flex-grow overflow-y-auto my-4 space-y-3 pr-1 text-xs max-h-[300px]">
            {messages.map((m, idx) => (
              <div key={idx} className={`flex items-start gap-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {m.role === 'model' && (
                  <div className="h-7 w-7 bg-red-50 text-primary border border-red-100 rounded-lg flex items-center justify-center shrink-0">
                    <Brain className="h-4 w-4" />
                  </div>
                )}
                <div className={`p-3 rounded-xl max-w-[80%] leading-relaxed ${
                  m.role === 'user' 
                    ? 'bg-primary text-white font-semibold' 
                    : 'bg-slate-50 text-slate-700 border border-slate-100'
                }`}>
                  {m.content}
                </div>
                {m.role === 'user' && (
                  <div className="h-7 w-7 bg-slate-100 text-slate-600 rounded-lg flex items-center justify-center shrink-0">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))}
            {chatLoading && (
              <div className="flex items-center space-x-2 text-slate-400 pl-10">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce"></span>
                <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce delay-75"></span>
                <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce delay-150"></span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input & Quick Prompts */}
          <div className="space-y-3">
            {/* Quick Prompts Row */}
            <div className="flex flex-wrap gap-1.5 text-[9px] font-bold text-slate-500 uppercase tracking-wide">
              <button 
                onClick={() => handleQuickPrompt(lang === 'en' ? "Can I donate blood if I have diabetes?" : "நீரிழிவு நோய் இருந்தால் இரத்தம் கொடுக்கலாமா?")}
                className="bg-slate-50 border border-slate-100 hover:border-slate-300 rounded-md px-2 py-1 transition-colors cursor-pointer"
              >
                {lang === 'en' ? 'Diabetes Guidelines' : 'நீரிழிவு நெறிமுறை'}
              </button>
              <button 
                onClick={() => handleQuickPrompt(lang === 'en' ? "What is the interval between blood donations?" : "இரண்டு தானங்களுக்கு இடையே எவ்வளவு காலம் இடைவெளி தேவை?")}
                className="bg-slate-50 border border-slate-100 hover:border-slate-300 rounded-md px-2 py-1 transition-colors cursor-pointer"
              >
                {lang === 'en' ? '90-Days Rule' : '90 நாட்கள் விதி'}
              </button>
              <button 
                onClick={() => handleQuickPrompt(lang === 'en' ? "Explain blood type compatibility rules." : "இரத்த வகை பொருத்தம் பற்றி விளக்குங்கள்.")}
                className="bg-slate-50 border border-slate-100 hover:border-slate-300 rounded-md px-2 py-1 transition-colors cursor-pointer"
              >
                {lang === 'en' ? 'Compatibility' : 'இரத்தப் பொருத்தம்'}
              </button>
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder={lang === 'en' ? 'Ask Arogya AI...' : 'ஆரோக்கியாவிடம் கேளுங்கள்...'}
                className="flex-1 rounded-lg border border-border-gray bg-slate-50/50 py-2.5 px-3 text-xs font-semibold text-slate-800 outline-hidden focus:border-primary focus:bg-white transition-all"
                id="chatbot-text-input"
              />
              <button
                type="submit"
                disabled={chatLoading}
                className="bg-primary hover:bg-primary-hover text-white rounded-lg px-4 flex items-center justify-center transition-colors shadow-xs cursor-pointer"
                id="btn-chatbot-submit"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>

        {/* 2. AI Eligibility Checker Card */}
        <div className="rounded-2xl border border-border-gray bg-white p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-3 mb-4">
            <Sparkles className="h-5 w-5 text-emerald-600" />
            <div>
              <h3 className="text-xs font-black text-text-dark uppercase tracking-wide">
                {lang === 'en' ? 'AI Blood Donation Eligibility Checker' : 'AI இரத்த தான தகுதி சரிபார்ப்பு'}
              </h3>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                {lang === 'en' ? 'Verify medical suitability instantly' : 'மருத்துவத் தகுதியை உடனடியாக அறியுங்கள்'}
              </p>
            </div>
          </div>

          <form onSubmit={handleCheckEligibility} className="space-y-3.5 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[9px] font-bold uppercase text-slate-500 mb-1">{lang === 'en' ? 'Age (Years)' : 'வயது'}</label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="e.g. 28"
                  className="w-full rounded-lg border border-border-gray bg-slate-50/50 py-1.5 px-3 font-semibold outline-hidden focus:border-primary transition-colors"
                  id="eligibility-age"
                />
              </div>
              <div>
                <label className="block text-[9px] font-bold uppercase text-slate-500 mb-1">{lang === 'en' ? 'Weight (kg)' : 'எடை (கிலோ)'}</label>
                <input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="e.g. 62"
                  className="w-full rounded-lg border border-border-gray bg-slate-50/50 py-1.5 px-3 font-semibold outline-hidden focus:border-primary transition-colors"
                  id="eligibility-weight"
                />
              </div>
            </div>

            <div>
              <label className="block text-[9px] font-bold uppercase text-slate-500 mb-1">{lang === 'en' ? 'Last Donation Date (Optional)' : 'கடைசியாக தானம் செய்த தேதி'}</label>
              <input
                type="date"
                value={lastDonationDate}
                onChange={(e) => setLastDonationDate(e.target.value)}
                className="w-full rounded-lg border border-border-gray bg-slate-50/50 py-1.5 px-3 font-semibold outline-hidden focus:border-primary transition-colors"
                id="eligibility-last-date"
              />
            </div>

            <div>
              <label className="block text-[9px] font-bold uppercase text-slate-500 mb-1">{lang === 'en' ? 'Medical Conditions / Medications' : 'மருத்துவ குறைபாடுகள் / மருந்துகள்'}</label>
              <input
                type="text"
                value={medicalConditions}
                onChange={(e) => setMedicalConditions(e.target.value)}
                placeholder={lang === 'en' ? 'e.g. Hypertension, none' : 'எ.கா. உயர் இரத்த அழுத்தம், எதுவும் இல்லை'}
                className="w-full rounded-lg border border-border-gray bg-slate-50/50 py-1.5 px-3 font-semibold outline-hidden focus:border-primary transition-colors"
                id="eligibility-medicals"
              />
            </div>

            <button
              type="submit"
              disabled={eligibilityLoading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-lg shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              id="btn-check-eligibility"
            >
              {eligibilityLoading ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>{lang === 'en' ? 'Analyzing medical suitability...' : 'பரிசோதிக்கிறது...'}</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>{lang === 'en' ? 'Check Eligibility Status' : 'தகுதியைச் சோதிக்கவும்'}</span>
                </>
              )}
            </button>
          </form>

          {/* Result Block */}
          {eligibilityResult && (
            <div className={`mt-4 rounded-xl border p-4 text-xs space-y-2.5 animate-fadeIn ${
              eligibilityResult.eligible 
                ? 'bg-emerald-50 border-emerald-150 text-emerald-900' 
                : 'bg-red-50 border-red-150 text-red-900'
            }`} id="eligibility-result-card">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-extrabold">
                  {eligibilityResult.eligible ? <ShieldCheck className="h-5 w-5 text-emerald-600" /> : <AlertTriangle className="h-5 w-5 text-red-600" />}
                  <span>{eligibilityResult.eligible ? (lang === 'en' ? 'Eligible to Donate!' : 'இரத்த தானம் செய்ய தகுதியுடையவர்!') : (lang === 'en' ? 'Deferred / Not Eligible' : 'இரத்த தானம் செய்ய தகுதியற்றவர்')}</span>
                </span>
                <span className="font-sans font-black bg-white px-2 py-0.5 rounded-md border text-slate-800">
                  {lang === 'en' ? 'Safety Score' : 'பாதுகாப்பு மதிப்பு'}: {eligibilityResult.score}/100
                </span>
              </div>
              
              <p className="leading-relaxed font-semibold">{eligibilityResult.analysis}</p>

              {eligibilityResult.recommendations && eligibilityResult.recommendations.length > 0 && (
                <div className="space-y-1 border-t border-slate-200/50 pt-2 text-[11px]">
                  <span className="block font-black uppercase text-slate-500">{lang === 'en' ? 'Recommendations' : 'முன்மொழிவுகள்'}:</span>
                  <ul className="list-disc pl-4 space-y-1 font-medium">
                    {eligibilityResult.recommendations.map((rec: string, i: number) => (
                      <li key={i}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

      </div>

      {/* Standard criteria list grids */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Eligibility Criteria */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <h3 className="font-sans text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
            <AlertCircle className="h-5 w-5 text-amber-500 shrink-0" />
            <span>{lang === 'en' ? 'Standard Donor Safety Criteria' : 'நிலையான நன்கொடையாளர் பாதுகாப்பு நெறிமுறைகள்'}</span>
          </h3>
          <ul className="space-y-3">
            {eligibilityCriteria.map((item, index) => (
              <li key={index} className="flex items-start text-xs leading-normal">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-50 text-[10px] font-bold text-amber-700 mr-2.5 mt-0.5">
                  ✓
                </span>
                <div>
                  <span className="font-bold text-slate-800 block">{item.label}</span>
                  <span className="text-slate-500 mt-0.5 block leading-relaxed">{item.desc}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Benefits */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <h3 className="font-sans text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
            <Activity className="h-5 w-5 text-red-500 shrink-0" />
            <span>{lang === 'en' ? 'Health & Social Benefits' : 'ஆரோக்கியம் மற்றும் சமூக நன்மைகள்'}</span>
          </h3>
          <ul className="space-y-3">
            {benefits.map((item, index) => (
              <li key={index} className="flex items-start text-xs leading-normal">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-50 text-[10px] font-bold text-red-700 mr-2.5 mt-0.5">
                  ❤
                </span>
                <div>
                  <span className="font-bold text-slate-800 block">{item.title}</span>
                  <span className="text-slate-500 mt-0.5 block leading-relaxed">{item.desc}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>

      </div>

      {/* Donation Process Step-by-Step */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
        <h3 className="font-sans text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3 mb-5">
          <ShieldCheck className="h-5 w-5 text-emerald-500 shrink-0" />
          <span>{lang === 'en' ? 'The Four-Step Blood Donation Process' : 'நான்கு கட்ட இரத்த தான முறை'}</span>
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {donationSteps.map((step, index) => (
            <div key={index} className="rounded-lg bg-slate-50/50 p-4 border border-slate-100 relative">
              <span className="block text-xs font-bold text-blue-600 mb-1">STEP 0{index + 1}</span>
              <h4 className="text-xs font-bold text-slate-800">{step.title}</h4>
              <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
