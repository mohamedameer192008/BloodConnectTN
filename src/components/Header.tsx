import React, { useState } from 'react';
import { Droplet, Menu, X, User, Bell, LogOut, Shield, Languages } from 'lucide-react';
import { AppUser } from '../types';
import { Language, translations } from '../translations';
import Logo from './Logo';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: AppUser | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  unreadNotifications: number;
  onOpenNotifications: () => void;
  lang: Language;
  setLang: (lang: Language) => void;
}

export default function Header({
  activeTab,
  setActiveTab,
  user,
  onOpenAuth,
  onLogout,
  unreadNotifications,
  onOpenNotifications,
  lang,
  setLang
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const t = translations[lang];

  const navigation = [
    { name: t.findDonors, id: 'search' },
    { name: t.emergencyRequests, id: 'requests' },
    { name: t.registerAsDonor, id: 'register-donor' },
    { name: t.donationGuide, id: 'guide' },
    { name: t.hospitalsBanks, id: 'hospitals' },
    { name: lang === 'en' ? 'Analytics' : 'விளக்கப்படம்', id: 'analytics' }
  ];

  if (user) {
    navigation.push({ name: t.myProfile, id: 'profile' });
  }

  const handleNavClick = (tabId: string) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
  };

  const toggleLanguage = () => {
    setLang(lang === 'en' ? 'ta' : 'en');
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white shadow-xs">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Logo and Brand */}
        <div 
          className="flex cursor-pointer items-center space-x-2" 
          onClick={() => handleNavClick('search')}
          id="brand-logo"
        >
          <Logo iconOnly={true} className="h-8.5 w-auto shrink-0" />
          <div>
            <span className="font-sans text-[15px] font-extrabold tracking-tight text-slate-800 leading-none block">
              BloodConnect <span className="text-primary">TN</span>
            </span>
            <span className="block text-[8px] font-bold tracking-wider text-slate-400 uppercase leading-none mt-0.5">
              {lang === 'en' ? 'Emergency Blood Finder' : 'அவசர இரத்த சேவை'}
            </span>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex h-full items-stretch">
          {navigation.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`flex items-center px-2.5 border-b-2 text-[10px] lg:text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === item.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
              id={`nav-item-${item.id}`}
            >
              {item.name}
            </button>
          ))}
          
          {user?.role === 'admin' && (
            <button
              onClick={() => handleNavClick('admin')}
              className={`flex items-center space-x-1 px-3 border-b-2 text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'admin'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
              id="nav-item-admin"
            >
              <Shield className="h-3.5 w-3.5 text-primary" />
              <span>{t.admin}</span>
            </button>
          )}
        </nav>

        {/* Right Action Area (Language, Theme, Auth + Notifications) */}
        <div className="hidden md:flex md:items-center md:space-x-3.5">
          
          {/* Language Switcher */}
          <button
            onClick={toggleLanguage}
            className="flex items-center space-x-1 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 px-2.5 py-1.5 text-xs font-bold text-slate-700 transition-all cursor-pointer"
            title="Switch Language / தமிழ்"
          >
            <Languages className="h-3.5 w-3.5 text-slate-500" />
            <span className="font-extrabold">{lang === 'en' ? 'தமிழ்' : 'English'}</span>
          </button>

          {user ? (
            <>
              {/* Notification bell */}
              <button
                onClick={onOpenNotifications}
                className="relative rounded-full p-2 text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors cursor-pointer"
                title="Notifications"
                id="btn-notifications"
              >
                <Bell className="h-4 w-4" />
                {unreadNotifications > 0 && (
                  <span className="absolute top-1.5 right-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-rose-600 text-[8px] font-black text-white">
                    {unreadNotifications}
                  </span>
                )}
              </button>

              {/* User Profile Info */}
              <div className="flex items-center space-x-2 border-l border-slate-200 pl-4 h-8">
                <button
                  onClick={() => handleNavClick('profile')}
                  className="text-right hover:opacity-85 focus:outline-hidden transition-opacity cursor-pointer text-left"
                  title="View Account Dashboard"
                >
                  <div className="text-xs font-bold text-slate-900 truncate max-w-[120px] leading-tight">
                    {user.displayName}
                  </div>
                  <div className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">
                    {user.role}
                  </div>
                </button>
                <button
                  onClick={onLogout}
                  className="rounded-full p-1.5 text-slate-400 hover:bg-red-50 hover:text-primary transition-colors cursor-pointer"
                  title="Logout"
                  id="btn-logout"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center space-x-1.5 rounded-lg bg-primary px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-primary-hover active:scale-98 transition-all cursor-pointer"
              id="btn-login-trigger"
            >
              <User className="h-3.5 w-3.5" />
              <span>{t.signIn}</span>
            </button>
          )}
        </div>

        {/* Mobile menu button */}
        <div className="flex items-center space-x-2 md:hidden">
          {user && (
            <button
              onClick={onOpenNotifications}
              className="relative rounded-full p-2 text-slate-500 hover:bg-slate-100 transition-colors"
              id="btn-notifications-mobile"
            >
              <Bell className="h-5 w-5" />
              {unreadNotifications > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                  {unreadNotifications}
                </span>
              )}
            </button>
          )}

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:outline-hidden"
            id="btn-mobile-menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="border-t border-slate-200 bg-white px-4 py-3 md:hidden space-y-1 animate-fadeIn">
          
          {/* Mobile Language Selection Toggle */}
          <button
            onClick={toggleLanguage}
            className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-base font-bold bg-slate-50 border border-slate-100 mb-2 cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Languages className="h-5 w-5 text-slate-500" />
              <span>{lang === 'en' ? 'தமிழ் மொழிக்கு மாறவும்' : 'Switch to English'}</span>
            </div>
            <span className="text-primary font-black">{lang === 'en' ? 'தமிழ்' : 'EN'}</span>
          </button>

          {navigation.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`block w-full text-left rounded-lg px-3 py-2.5 text-base font-medium transition-colors ${
                activeTab === item.id
                  ? 'bg-red-50 text-primary'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              {item.name}
            </button>
          ))}

          {user?.role === 'admin' && (
            <button
              onClick={() => handleNavClick('admin')}
              className={`flex w-full items-center space-x-2 text-left rounded-lg px-3 py-2.5 text-base font-medium transition-colors ${
                activeTab === 'admin'
                  ? 'bg-red-50 text-primary'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Shield className="h-5 w-5 text-primary" />
              <span>{t.admin}</span>
            </button>
          )}

          {/* Mobile Auth Options */}
          <div className="border-t border-slate-200 pt-3 mt-3">
            {user ? (
              <div className="space-y-3">
                <button
                  onClick={() => handleNavClick('profile')}
                  className="block w-full text-left px-3 py-1 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  <div className="text-sm font-semibold text-slate-900">{user.displayName}</div>
                  <div className="text-xs text-slate-500">{user.email}</div>
                  <div className="text-[10px] text-blue-600 font-bold mt-0.5">Tap to view Dashboard →</div>
                </button>
                <button
                  onClick={() => {
                    onLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="flex w-full items-center space-x-2 rounded-lg px-3 py-2.5 text-base font-medium text-primary hover:bg-red-50/50 transition-colors cursor-pointer"
                >
                  <LogOut className="h-5 w-5" />
                  <span>{t.signOut}</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  onOpenAuth();
                  setMobileMenuOpen(false);
                }}
                className="flex w-full items-center justify-center space-x-2 rounded-lg bg-primary px-4 py-2.5 text-base font-medium text-white shadow-xs hover:bg-primary-hover transition-colors cursor-pointer"
              >
                <User className="h-5 w-5" />
                <span>{t.signIn}</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
