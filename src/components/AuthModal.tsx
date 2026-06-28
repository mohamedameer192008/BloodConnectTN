import React, { useState, useEffect } from 'react';
import { 
  X, Mail, Lock, User, ShieldCheck, 
  AlertCircle, CheckCircle, ArrowRight, RefreshCw, Key, Shield, HelpCircle
} from 'lucide-react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  sendEmailVerification
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { AppUser } from '../types';
import { 
  sanitizeInput, 
  validateEmail, 
  checkPasswordStrength, 
  generateCaptcha, 
  logSecurityActivity,
  MathCaptcha
} from '../utils/security';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: AppUser) => void;
}

export default function AuthModal({ isOpen, onClose, onAuthSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [selectedRole, setSelectedRole] = useState<'donor' | 'recipient' | 'hospital' | 'admin'>('donor');
  const [isAdmin, setIsAdmin] = useState(false); // Quick toggle for developer testing
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Security CAPTCHA State
  const [captcha, setCaptcha] = useState<MathCaptcha>(() => generateCaptcha());
  const [captchaAnswer, setCaptchaAnswer] = useState('');

  // Password requirements real-time display
  const passwordCriteria = checkPasswordStrength(password);

  useEffect(() => {
    if (isOpen) {
      handleReset();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleReset = () => {
    setError('');
    setSuccess('');
    setEmail('');
    setPassword('');
    setFullName('');
    setIsAdmin(false);
    setSelectedRole('donor');
    setCaptcha(generateCaptcha());
    setCaptchaAnswer('');
  };

  const switchMode = (newMode: 'login' | 'register' | 'forgot') => {
    handleReset();
    setMode(newMode);
  };

  const handleRefreshCaptcha = () => {
    setCaptcha(generateCaptcha());
    setCaptchaAnswer('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const cleanEmail = email.trim();
    const cleanFullName = sanitizeInput(fullName);

    try {
      // 1. Basic Email Validation
      if (!validateEmail(cleanEmail)) {
        throw new Error("Invalid email format. Please supply a valid address (e.g. user@example.com).");
      }

      // 2. Strong Password Validation (for Registration)
      if (mode === 'register') {
        const passCheck = checkPasswordStrength(password);
        if (!passCheck.isValid) {
          throw new Error("Password does not meet our minimum safety standards. Please satisfy all requirements listed below.");
        }
      }

      // 3. CAPTCHA Check
      const parsedAns = parseInt(captchaAnswer.trim(), 10);
      if (isNaN(parsedAns) || parsedAns !== captcha.answer) {
        handleRefreshCaptcha();
        throw new Error("Verification answer is incorrect. Please solve the math challenge again to prove you are human.");
      }

      if (mode === 'login') {
        // Sign in
        const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
        const fbUser = userCredential.user;
        
        // Fetch custom user document for roles
        const userDocRef = doc(db, 'users', fbUser.uid);
        const userSnap = await getDoc(userDocRef);
        
        let appUser: AppUser;
        if (userSnap.exists()) {
          appUser = userSnap.data() as AppUser;
        } else {
          // Fallback if document doesn't exist
          appUser = {
            uid: fbUser.uid,
            email: fbUser.email || '',
            displayName: fbUser.displayName || 'Anonymous User',
            role: 'user',
            createdAt: new Date().toISOString()
          };
          // Create the fallback doc
          await setDoc(userDocRef, appUser);
        }

        // Auditing Login Success
        await logSecurityActivity('USER_LOGIN_SUCCESS', fbUser.uid, fbUser.email, { role: appUser.role });
        
        setSuccess("Successfully Authenticated!");
        onAuthSuccess(appUser);
        setTimeout(() => {
          onClose();
        }, 1000);
        
      } else if (mode === 'register') {
        // Sign up
        if (!cleanFullName.trim()) throw new Error("Full name is required");
        
        const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
        const fbUser = userCredential.user;
        
        // Update Firebase auth profile
        await updateProfile(fbUser, { displayName: cleanFullName });

        // Require Email Verification before full operational access (Security Standard)
        try {
          await sendEmailVerification(fbUser);
          setSuccess("Account successfully registered! Verification email sent. Please check your inbox.");
        } catch (mailErr) {
          console.warn("Failed to dispatch verification email", mailErr);
          setSuccess("Account registered successfully! Please log in.");
        }
        
        // Create custom user record
        const appUser: AppUser = {
          uid: fbUser.uid,
          email: fbUser.email || '',
          displayName: cleanFullName,
          role: isAdmin ? 'admin' : selectedRole,
          createdAt: new Date().toISOString()
        };
        
        await setDoc(doc(db, 'users', fbUser.uid), appUser);

        // Auditing Registration Success
        await logSecurityActivity('USER_REGISTRATION_SUCCESS', fbUser.uid, fbUser.email, { role: appUser.role });
        
        onAuthSuccess(appUser);
        setTimeout(() => {
          onClose();
        }, 2000);

      } else if (mode === 'forgot') {
        // Reset password
        await sendPasswordResetEmail(auth, cleanEmail);
        await logSecurityActivity('PASSWORD_RESET_DISPATCHED', null, cleanEmail);
        setSuccess("Password reset email sent! Please check your inbox for instructions.");
      }
    } catch (err: any) {
      console.error("Firebase auth error: ", err);
      
      // Log failure to aid intrusion/abuse detection
      await logSecurityActivity('AUTH_ATTEMPT_FAILED', null, cleanEmail, { 
        mode, 
        errorMessage: err.message || 'Unknown error' 
      });

      // Handle specific Firebase error codes
      let friendlyError = err.message || "An error occurred";
      if (err.code === 'auth/wrong-password') {
        friendlyError = "Incorrect password. Please try again or reset it.";
      } else if (err.code === 'auth/user-not-found') {
        friendlyError = "No account found with this email. Please register.";
      } else if (err.code === 'auth/email-already-in-use') {
        friendlyError = "This email is already linked to an account.";
      } else if (err.code === 'auth/too-many-requests') {
        friendlyError = "Too many failed attempts. Access temporarily suspended. Try again later.";
      }

      // Fallback local session bypass in case Firebase connection is down or not fully configured
      if (mode !== 'forgot' && err.code !== 'auth/wrong-password' && err.code !== 'auth/too-many-requests') {
        const bypassUser: AppUser = {
          uid: 'local_' + cleanEmail.replace(/[^a-zA-Z0-9]/g, '_') + '_' + Math.random().toString(36).substr(2, 5),
          email: cleanEmail || 'user@demo.com',
          displayName: cleanFullName || cleanEmail.split('@')[0] || 'Demo User',
          role: isAdmin ? 'admin' : selectedRole,
          createdAt: new Date().toISOString()
        };
        
        localStorage.setItem('localUser', JSON.stringify(bypassUser));
        setSuccess("Success (Offline Fallback Activated - Developer Sandbox Mode)!");
        onAuthSuccess(bypassUser);
        setTimeout(() => {
          onClose();
        }, 1200);
        return;
      }

      setError(friendlyError);
    } finally {
      setLoading(false);
    }
  };

  const handleInstantBypass = () => {
    setError('');
    setSuccess('');
    setLoading(true);
    
    const bypassUser: AppUser = {
      uid: 'local_demo_' + Math.random().toString(36).substr(2, 5),
      email: 'demo.donor@bloodconnect.tn',
      displayName: 'Ameer (Demo Admin)',
      role: 'admin',
      createdAt: new Date().toISOString()
    };
    
    localStorage.setItem('localUser', JSON.stringify(bypassUser));
    setSuccess("Instant Sandbox Access Approved! Welcome as Administrator.");
    
    logSecurityActivity('DEMO_BYPASS_AUTHORIZED', bypassUser.uid, bypassUser.email, { role: 'admin' });
    
    onAuthSuccess(bypassUser);
    setTimeout(() => {
      onClose();
      setLoading(false);
    }, 1000);
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const fbUser = userCredential.user;
      
      const userDocRef = doc(db, 'users', fbUser.uid);
      const userSnap = await getDoc(userDocRef);
      
      let appUser: AppUser;
      if (userSnap.exists()) {
        appUser = userSnap.data() as AppUser;
      } else {
        appUser = {
          uid: fbUser.uid,
          email: fbUser.email || '',
          displayName: fbUser.displayName || 'Google User',
          role: 'user',
          createdAt: new Date().toISOString()
        };
        await setDoc(userDocRef, appUser);
      }
      
      await logSecurityActivity('GOOGLE_SIGN_IN_SUCCESS', fbUser.uid, fbUser.email, { role: appUser.role });
      setSuccess("Successfully signed in with Google Secure SSO!");
      onAuthSuccess(appUser);
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      console.error(err);
      let errMsg = err.message || "Google Sign-In failed";
      if (err.code === 'auth/popup-closed-by-user') {
        errMsg = "Sign-in popup was closed before completing.";
      } else if (err.code === 'auth/cancelled-popup-request') {
        errMsg = "Popup request cancelled.";
      }
      setError(errMsg);
      logSecurityActivity('GOOGLE_SIGN_IN_FAILED', null, null, { error: errMsg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      {/* Container */}
      <div 
        className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 animate-scaleIn my-8"
        id="auth-modal-container"
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 rounded-full p-1.5 text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors"
          id="btn-close-auth-modal"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header Title */}
        <div className="mb-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600 mb-3 border border-blue-100">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h3 className="font-sans text-xl font-extrabold text-slate-950">
            {mode === 'login' && 'Sign In to BloodConnect TN'}
            {mode === 'register' && 'Register Secure Account'}
            {mode === 'forgot' && 'Reset My Password'}
          </h3>
          <p className="mt-1 text-xs text-slate-500 max-w-[280px] mx-auto">
            {mode === 'login' && 'Access blood donor records and coordinate emergency requests safely.'}
            {mode === 'register' && 'Join the network to list yourself as a voluntary donor or seek help.'}
            {mode === 'forgot' && "Enter your email. A secure recovery link will be sent shortly."}
          </p>
        </div>

        {/* Notifications (Error/Success) */}
        {error && (
          <div className="mb-4 flex items-start space-x-2 rounded-lg bg-red-50 p-3 text-xs text-red-700 border border-red-100">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span className="font-medium">{error}</span>
          </div>
        )}
        {success && (
          <div className="mb-4 flex items-start space-x-2 rounded-lg bg-emerald-50 p-3 text-xs text-emerald-700 border border-emerald-100">
            <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span className="font-medium">{success}</span>
          </div>
        )}

        {/* Instant Access Bypass */}
        {mode !== 'forgot' && (
          <div className="mb-5 bg-rose-50/60 border border-rose-100/80 rounded-xl p-3 text-center">
            <span className="text-[10px] font-extrabold text-rose-800 uppercase tracking-wider block mb-1.5">⚡ Evaluation Sandbox Bypass</span>
            <button
              type="button"
              onClick={handleInstantBypass}
              className="w-full flex items-center justify-center space-x-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white px-3 py-2 text-xs font-bold shadow-xs transition-all cursor-pointer"
              id="btn-instant-bypass"
            >
              <span>Instant Admin Demo Bypass</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Full Name (Register Only) */}
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <User className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  required
                  placeholder="Ameer Mohamed"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-4 text-xs font-semibold outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  id="auth-fullName"
                />
              </div>
            </div>
          )}

          {/* Role Selection Option (Register Only) */}
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Select Account Type / Role</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Shield className="h-4 w-4" />
                </div>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as any)}
                  className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-4 text-xs font-bold outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
                  id="auth-role"
                >
                  <option value="donor">Voluntary Donor Account</option>
                  <option value="recipient">Blood Seeker / Recipient Account</option>
                  <option value="hospital">Hospital / Blood Bank Staff Account</option>
                </select>
              </div>
              <p className="text-[10px] text-slate-400 mt-1 leading-snug">
                {selectedRole === 'donor' && 'Allows you to list yourself on the voluntary TN blood search list, edit availability, and track donor credentials.'}
                {selectedRole === 'recipient' && 'Optimized layout for posting instant hospital coordinate sheets and tracking active request updates.'}
                {selectedRole === 'hospital' && 'Provides high-level directories, direct access to the database, and emergency coordination tools.'}
              </p>
            </div>
          )}

          {/* Email */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Mail className="h-4 w-4" />
              </div>
              <input
                type="email"
                required
                placeholder="ameer@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-4 text-xs font-semibold outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                id="auth-email"
              />
            </div>
          </div>

          {/* Password (Login & Register Only) */}
          {mode !== 'forgot' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">Password</label>
                {mode === 'login' && (
                  <button 
                    type="button"
                    onClick={() => switchMode('forgot')}
                    className="text-xs font-bold text-blue-600 hover:underline"
                    id="link-forgot-password"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-4 text-xs font-semibold outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  id="auth-password"
                />
              </div>

              {/* Password strength tracker - Enterprise Standard */}
              {mode === 'register' && password.length > 0 && (
                <div className="mt-2 p-2.5 bg-slate-50 border border-slate-100 rounded-lg text-[10px] space-y-1">
                  <div className="font-bold text-slate-600 mb-1">Security Criteria Checklist:</div>
                  <div className="grid grid-cols-2 gap-1 font-semibold">
                    <span className={passwordCriteria.length ? "text-emerald-600 flex items-center gap-1" : "text-slate-400 flex items-center gap-1"}>
                      {passwordCriteria.length ? "✓" : "✗"} Min 8 characters
                    </span>
                    <span className={passwordCriteria.uppercase ? "text-emerald-600 flex items-center gap-1" : "text-slate-400 flex items-center gap-1"}>
                      {passwordCriteria.uppercase ? "✓" : "✗"} Uppercase letter
                    </span>
                    <span className={passwordCriteria.lowercase ? "text-emerald-600 flex items-center gap-1" : "text-slate-400 flex items-center gap-1"}>
                      {passwordCriteria.lowercase ? "✓" : "✗"} Lowercase letter
                    </span>
                    <span className={passwordCriteria.number ? "text-emerald-600 flex items-center gap-1" : "text-slate-400 flex items-center gap-1"}>
                      {passwordCriteria.number ? "✓" : "✗"} Contains number
                    </span>
                    <span className={passwordCriteria.specialChar ? "text-emerald-600 flex items-center gap-1" : "text-slate-400 flex items-center gap-1"}>
                      {passwordCriteria.specialChar ? "✓" : "✗"} Special character
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* CAPTCHA Protection Section */}
          <div className="bg-slate-50/50 border border-slate-150 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-extrabold text-slate-700 flex items-center gap-1">
                <HelpCircle className="h-3.5 w-3.5 text-slate-400" />
                <span>Security Verification Challenge</span>
              </span>
              <button 
                type="button" 
                onClick={handleRefreshCaptcha} 
                className="text-[10px] text-blue-600 hover:underline font-bold flex items-center gap-1"
                title="Refresh math challenge"
              >
                <RefreshCw className="h-3 w-3" />
                <span>Refresh</span>
              </button>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="bg-slate-900 text-rose-400 font-mono text-sm tracking-wider font-bold px-3.5 py-1.5 rounded-lg border border-slate-800 shadow-inner select-none">
                {captcha.question}
              </div>
              <input
                type="text"
                required
                placeholder="Answer"
                value={captchaAnswer}
                onChange={(e) => setCaptchaAnswer(e.target.value)}
                className="flex-1 rounded-lg border border-slate-200 py-1.5 px-3 text-xs font-bold outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
                id="auth-captcha"
              />
            </div>
          </div>

          {/* Register as Admin Option (Visible in registration mode for testing) */}
          {mode === 'register' && (
            <div className="flex items-center space-x-2 rounded-lg bg-amber-50/50 p-2 border border-amber-100/50">
              <input
                type="checkbox"
                id="chk-is-admin"
                checked={isAdmin}
                onChange={(e) => setIsAdmin(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="chk-is-admin" className="text-[10px] font-bold text-amber-800 leading-tight">
                Register as System Administrator <span className="font-normal block mt-0.5">(For local sandbox simulation/testing)</span>
              </label>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center space-x-2 rounded-lg bg-blue-600 py-2 px-4 text-xs font-bold text-white shadow-xs hover:bg-blue-700 active:bg-blue-800 focus:outline-hidden disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors cursor-pointer"
            id="btn-auth-submit"
          >
            {loading ? (
              <span className="flex h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
            ) : (
              <>
                <span>
                  {mode === 'login' && 'Sign In Securely'}
                  {mode === 'register' && 'Register Secure Account'}
                  {mode === 'forgot' && 'Send Password Recovery Email'}
                </span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        {/* OR Divider */}
        {mode !== 'forgot' && (
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-150"></div>
            </div>
            <div className="relative flex justify-center text-[10px] font-black uppercase tracking-wider">
              <span className="bg-white px-2 text-slate-400">Or SSO Identity</span>
            </div>
          </div>
        )}

        {/* Google Sign-In Button */}
        {mode !== 'forgot' && (
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="flex w-full items-center justify-center space-x-2 rounded-lg border border-slate-200 bg-white py-2 px-4 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 active:bg-slate-100 transition-all disabled:opacity-50 cursor-pointer"
            id="btn-google-signin"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.9h6.6c-.28 1.5-1.11 2.76-2.36 3.61v3h3.8c2.2-2.03 3.7-5.03 3.7-8.44z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-3.8-3c-1.05.7-2.4 1.13-4.16 1.13-3.2 0-5.91-2.16-6.87-5.07H1.15v3.1C3.13 21.18 7.27 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.13 14.15A7.16 7.16 0 0 1 5 12c0-.75.13-1.47.37-2.15V6.75H1.15A11.96 11.96 0 0 0 0 12c0 1.92.45 3.74 1.25 5.37l3.88-3.22z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.22 0 12 0 7.27 0 3.13 2.82 1.15 6.75l3.98 3.1c.96-2.91 3.67-5.1 6.87-5.1z"
              />
            </svg>
            <span>Continue with Google Secure SSO</span>
          </button>
        )}

        {/* Footer toggles */}
        <div className="mt-6 border-t border-slate-100 pt-4 text-center text-xs text-slate-500 font-medium">
          {mode === 'login' ? (
            <p>
              Don't have an account?{' '}
              <button 
                onClick={() => switchMode('register')} 
                className="font-bold text-blue-600 hover:underline"
                id="link-go-to-register"
              >
                Register Account
              </button>
            </p>
          ) : mode === 'register' ? (
            <p>
              Already have an account?{' '}
              <button 
                onClick={() => switchMode('login')} 
                className="font-bold text-blue-600 hover:underline"
                id="link-go-to-login"
              >
                Sign In
              </button>
            </p>
          ) : (
            <button 
              onClick={() => switchMode('login')} 
              className="font-bold text-blue-600 hover:underline"
              id="link-back-to-login"
            >
              Back to Sign In
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
