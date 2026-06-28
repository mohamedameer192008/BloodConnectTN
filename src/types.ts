export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

export interface Donor {
  id: string;
  fullName: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  bloodGroup: BloodGroup;
  mobileNumber: string;
  emailAddress: string;
  district: string;
  taluk: string;
  city: string;
  state: string; // Default: 'Tamil Nadu'
  pinCode: string;
  latitude?: number;
  longitude?: number;
  lastDonationDate?: string; // YYYY-MM-DD
  availabilityStatus: 'Available' | 'Not Available';
  medicalEligibility: boolean;
  emergencyContact: string;
  verified: boolean;
  blocked: boolean;
  numDonations: number;
  registeredAt: string;
  hideMobileNumber?: boolean;
  hideEmailAddress?: boolean;
}

export interface EmergencyRequest {
  id: string;
  patientName: string;
  bloodGroup: BloodGroup;
  unitsRequired: number;
  hospitalName: string;
  hospitalAddress: string;
  district: string;
  contactPerson: string;
  mobileNumber: string;
  emergencyLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  requiredDate: string; // YYYY-MM-DD
  requiredTime: string; // HH:MM
  additionalNotes?: string;
  postedBy: string; // user uid
  postedAt: string;
  status: 'Open' | 'Fulfilled' | 'Cancelled';
}

export interface AppNotification {
  id: string;
  userId: string; // Recipient user ID
  title: string;
  message: string;
  requestId?: string;
  bloodGroup?: BloodGroup;
  district?: string;
  isRead: boolean;
  createdAt: string;
}

export interface DonationHistory {
  id: string;
  donorId: string;
  donationDate: string;
  hospitalName?: string;
  unitsDonated: number;
  notes?: string;
}

export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  role: 'user' | 'admin' | 'donor' | 'recipient' | 'hospital';
  donorProfileId?: string; // Links to Donor record if registered as a donor
  createdAt: string;
}
