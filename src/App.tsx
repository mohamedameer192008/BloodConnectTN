import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { auth, db } from './firebase';
import { AppUser, Donor, EmergencyRequest, AppNotification } from './types';
import { seedDonorsIfEmpty } from './seedData';
import { Language } from './translations';

// Component Imports
import Header from './components/Header';
import Footer from './components/Footer';
import SearchDonors from './components/SearchDonors';
import DonorRegistrationForm from './components/DonorRegistrationForm';
import EmergencyRequestsList from './components/EmergencyRequestsList';
import BloodDonationInfo from './components/BloodDonationInfo';
import AdminPanel from './components/AdminPanel';
import AuthModal from './components/AuthModal';
import NotificationCenter from './components/NotificationCenter';
import UserProfile from './components/UserProfile';
import HospitalDirectory from './components/HospitalDirectory';
import NetworkDashboard from './components/NetworkDashboard';

export default function App() {
  // Language state
  const [lang, setLang] = useState<Language>(() => {
    return (localStorage.getItem('app-lang') as Language) || 'en';
  });

  useEffect(() => {
    localStorage.setItem('app-lang', lang);
  }, [lang]);

  // Navigation & Modal State
  const [activeTab, setActiveTab] = useState<string>('search');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Database Data States
  const [user, setUser] = useState<AppUser | null>(null);
  const [donors, setDonors] = useState<Donor[]>([]);
  const [emergencyRequests, setEmergencyRequests] = useState<EmergencyRequest[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  
  // Loading & Initialization States
  const [initializing, setInitializing] = useState(true);
  const [dbLoading, setDbLoading] = useState(false);

  // Sync / Refresh functions
  const fetchDonors = async () => {
    try {
      const snap = await getDocs(collection(db, 'donors'));
      const donorList: Donor[] = [];
      snap.forEach((doc) => {
        donorList.push(doc.data() as Donor);
      });

      // Merge with locally registered donors
      const localDonorsStr = localStorage.getItem('localDonors');
      if (localDonorsStr) {
        try {
          const localList = JSON.parse(localDonorsStr) as Donor[];
          localList.forEach(ld => {
            const index = donorList.findIndex(d => d.id === ld.id || d.emailAddress.toLowerCase() === ld.emailAddress.toLowerCase());
            if (index !== -1) {
              donorList[index] = ld; // update
            } else {
              donorList.push(ld); // insert
            }
          });
        } catch (e) {
          console.error(e);
        }
      }

      setDonors(donorList);
    } catch (err) {
      console.error("Error fetching donors list: ", err);
      // Fallback to local only if database fails
      const localDonorsStr = localStorage.getItem('localDonors');
      if (localDonorsStr) {
        try {
          setDonors(JSON.parse(localDonorsStr));
        } catch (e) {}
      }
    }
  };

  const fetchEmergencyRequests = async () => {
    try {
      const snap = await getDocs(collection(db, 'emergencyRequests'));
      const reqList: EmergencyRequest[] = [];
      snap.forEach((doc) => {
        reqList.push(doc.data() as EmergencyRequest);
      });

      // Merge with locally stored emergency requests
      const localRequestsStr = localStorage.getItem('localRequests');
      if (localRequestsStr) {
        try {
          const localList = JSON.parse(localRequestsStr) as EmergencyRequest[];
          localList.forEach(lr => {
            const index = reqList.findIndex(r => r.id === lr.id);
            if (index !== -1) {
              reqList[index] = lr; // update status/data
            } else {
              reqList.push(lr); // insert new
            }
          });
        } catch (e) {
          console.error(e);
        }
      }

      // Sort: Open requests first, then by posted date
      reqList.sort((a, b) => {
        if (a.status === 'Open' && b.status !== 'Open') return -1;
        if (a.status !== 'Open' && b.status === 'Open') return 1;
        return new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime();
      });
      setEmergencyRequests(reqList);
    } catch (err) {
      console.error("Error fetching emergency requests: ", err);
      // Fallback to local only if database fails
      const localRequestsStr = localStorage.getItem('localRequests');
      if (localRequestsStr) {
        try {
          const localList = JSON.parse(localRequestsStr) as EmergencyRequest[];
          localList.sort((a, b) => {
            if (a.status === 'Open' && b.status !== 'Open') return -1;
            if (a.status !== 'Open' && b.status === 'Open') return 1;
            return new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime();
          });
          setEmergencyRequests(localList);
        } catch (e) {}
      }
    }
  };

  const fetchNotifications = async (donorProfileId?: string) => {
    if (!user) {
      setNotifications([]);
      return;
    }
    try {
      const notificationsCol = collection(db, 'notifications');
      
      // We look for notifications where the recipient userId is either the user's donor profile ID or general uid
      const searchId = donorProfileId || user.donorProfileId || user.uid;
      
      const q = query(notificationsCol, where("userId", "==", searchId));
      const snap = await getDocs(q);
      const notifList: AppNotification[] = [];
      snap.forEach((doc) => {
        notifList.push(doc.data() as AppNotification);
      });
      // Sort newest first
      notifList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setNotifications(notifList);
    } catch (err) {
      console.error("Error fetching notifications: ", err);
    }
  };

  const handleRefreshDatabase = async () => {
    setDbLoading(true);
    await Promise.all([
      fetchDonors(),
      fetchEmergencyRequests()
    ]);
    if (user) {
      await fetchNotifications();
    }
    setDbLoading(false);
  };

  // Initial Auth & Seed Sync
  useEffect(() => {
    const initializeApp = async () => {
      // 1. Seed database with realistic Tamil Nadu donors if empty
      await seedDonorsIfEmpty(db);
      
      // 2. Load initial core records
      await Promise.all([
        fetchDonors(),
        fetchEmergencyRequests()
      ]);
      
      // 3. Listen to Auth State Changes
      onAuthStateChanged(auth, async (fbUser) => {
        if (fbUser) {
          const userDocRef = doc(db, 'users', fbUser.uid);
          const userSnap = await getDoc(userDocRef);
          
          let appUser: AppUser;
          if (userSnap.exists()) {
            appUser = userSnap.data() as AppUser;
          } else {
            // First-time signup doc creation check (fallback)
            appUser = {
              uid: fbUser.uid,
              email: fbUser.email || '',
              displayName: fbUser.displayName || 'Anonymous',
              role: 'user',
              createdAt: new Date().toISOString()
            };
            await setDoc(userDocRef, appUser);
          }
          
          setUser(appUser);
          
          // Fetch notifications for logged-in donor
          await fetchNotifications(appUser.donorProfileId || appUser.uid);
        } else {
          const localUserStr = localStorage.getItem('localUser');
          if (localUserStr) {
            try {
              const localUserObj = JSON.parse(localUserStr);
              setUser(localUserObj);
              // Fetch notifications for local user as well
              await fetchNotifications(localUserObj.donorProfileId || localUserObj.uid);
            } catch (e) {
              setUser(null);
              setNotifications([]);
            }
          } else {
            setUser(null);
            setNotifications([]);
          }
        }
        setInitializing(false);
      });
    };
    
    initializeApp();
  }, []);

  // Logout action
  const handleLogout = async () => {
    try {
      localStorage.removeItem('localUser');
      await signOut(auth);
      setUser(null);
      setNotifications([]);
      setActiveTab('search');
    } catch (err) {
      console.error("Error signing out: ", err);
      localStorage.removeItem('localUser');
      setUser(null);
      setNotifications([]);
      setActiveTab('search');
    }
  };

  const handleAuthSuccess = (appUser: AppUser) => {
    setUser(appUser);
    fetchNotifications(appUser.donorProfileId || appUser.uid);
  };

  const unreadNotificationsCount = notifications.filter(n => !n.isRead).length;

  if (initializing) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 space-y-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
        <div className="text-center">
          <p className="font-sans text-sm font-bold text-slate-800">Establishing Secure Network Connection</p>
          <p className="text-xs text-slate-400 mt-1">Tamil Nadu Voluntary Blood Donor Finder</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50 text-slate-800 font-sans antialiased">
      
      {/* Header bar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        onOpenAuth={() => setAuthModalOpen(true)}
        onLogout={handleLogout}
        unreadNotifications={unreadNotificationsCount}
        onOpenNotifications={() => setNotificationsOpen(true)}
        lang={lang}
        setLang={setLang}
      />

      {/* Main Body */}
      <main className="flex-grow mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        
        {activeTab === 'search' && (
          <SearchDonors
            allDonors={donors}
            emergencyRequests={emergencyRequests}
            userLoggedIn={user !== null}
            onOpenAuth={() => setAuthModalOpen(true)}
            loading={dbLoading}
            setActiveTab={setActiveTab}
            lang={lang}
          />
        )}

        {activeTab === 'requests' && (
          <EmergencyRequestsList
            requests={emergencyRequests}
            user={user}
            onOpenAuth={() => setAuthModalOpen(true)}
            onRefreshRequests={handleRefreshDatabase}
            allDonors={donors}
          />
        )}

        {activeTab === 'register-donor' && (
          <DonorRegistrationForm
            user={user}
            onOpenAuth={() => setAuthModalOpen(true)}
            onRefreshDatabase={handleRefreshDatabase}
          />
        )}

        {activeTab === 'guide' && (
          <BloodDonationInfo lang={lang} />
        )}

        {activeTab === 'hospitals' && (
          <HospitalDirectory lang={lang} />
        )}

        {activeTab === 'analytics' && (
          <NetworkDashboard donors={donors} requests={emergencyRequests} lang={lang} />
        )}

        {activeTab === 'profile' && (
          <UserProfile
            user={user}
            onOpenAuth={() => setAuthModalOpen(true)}
            onRefreshDatabase={handleRefreshDatabase}
            emergencyRequests={emergencyRequests}
            allDonors={donors}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'admin' && (
          <AdminPanel
            donors={donors}
            requests={emergencyRequests}
            onRefreshAll={handleRefreshDatabase}
            user={user}
          />
        )}

      </main>

      {/* Footer bar */}
      <Footer />

      {/* Authentication Modal Dialog */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* Notification Center Slide Panel */}
      <NotificationCenter
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        notifications={notifications}
        onRefreshNotifications={() => fetchNotifications()}
      />

    </div>
  );
}
