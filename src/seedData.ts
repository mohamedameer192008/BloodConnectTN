import { collection, getDocs, writeBatch, doc } from 'firebase/firestore';
import { Firestore } from 'firebase/firestore';
import { Donor, BloodGroup } from './types';

// Let's create about 25 realistic donors across different Tamil Nadu districts
export const MOCK_DONORS_SEED: Omit<Donor, 'id' | 'registeredAt'>[] = [
  {
    fullName: "Anand Krishnan",
    age: 28,
    gender: "Male",
    bloodGroup: "O+",
    mobileNumber: "9840123456",
    emailAddress: "anand.k@example.com",
    district: "Chennai",
    taluk: "Mylapore",
    city: "Mylapore",
    state: "Tamil Nadu",
    pinCode: "600004",
    latitude: 13.0333,
    longitude: 80.2667,
    lastDonationDate: "2026-03-10", // Eligible
    availabilityStatus: "Available",
    medicalEligibility: true,
    emergencyContact: "Anjali Krishnan (Wife) - 9840123457",
    verified: true,
    blocked: false,
    numDonations: 4
  },
  {
    fullName: "Priya Sundar",
    age: 24,
    gender: "Female",
    bloodGroup: "B+",
    mobileNumber: "9444987654",
    emailAddress: "priya.s@example.com",
    district: "Chennai",
    taluk: "Velachery",
    city: "Velachery",
    state: "Tamil Nadu",
    pinCode: "600042",
    latitude: 12.9833,
    longitude: 80.2167,
    lastDonationDate: "2026-05-20", // Not eligible (within 90 days)
    availabilityStatus: "Not Available",
    medicalEligibility: true,
    emergencyContact: "Sundararaman (Father) - 9444987650",
    verified: true,
    blocked: false,
    numDonations: 2
  },
  {
    fullName: "Karthik Raja",
    age: 32,
    gender: "Male",
    bloodGroup: "A+",
    mobileNumber: "9894012345",
    emailAddress: "karthik.raja@example.com",
    district: "Coimbatore",
    taluk: "Coimbatore South",
    city: "Ramanathapuram",
    state: "Tamil Nadu",
    pinCode: "641045",
    latitude: 10.9983,
    longitude: 76.9616,
    lastDonationDate: "2025-11-15", // Eligible
    availabilityStatus: "Available",
    medicalEligibility: true,
    emergencyContact: "Raja (Father) - 9894012340",
    verified: true,
    blocked: false,
    numDonations: 8
  },
  {
    fullName: "Meera Nair",
    age: 29,
    gender: "Female",
    bloodGroup: "O-", // Rare
    mobileNumber: "9789012345",
    emailAddress: "meera.nair@example.com",
    district: "Coimbatore",
    taluk: "Pollachi",
    city: "Pollachi Town",
    state: "Tamil Nadu",
    pinCode: "642001",
    latitude: 10.6583,
    longitude: 77.0083,
    lastDonationDate: "2026-02-14", // Eligible
    availabilityStatus: "Available",
    medicalEligibility: true,
    emergencyContact: "Gopal Nair (Brother) - 9789012341",
    verified: true,
    blocked: false,
    numDonations: 3
  },
  {
    fullName: "Saravanan Muthu",
    age: 35,
    gender: "Male",
    bloodGroup: "AB+",
    mobileNumber: "9940112233",
    emailAddress: "saravanan.m@example.com",
    district: "Madurai",
    taluk: "Madurai East",
    city: "Anna Nagar",
    state: "Tamil Nadu",
    pinCode: "625020",
    latitude: 9.9252,
    longitude: 78.1198,
    lastDonationDate: "2026-01-05", // Eligible
    availabilityStatus: "Available",
    medicalEligibility: true,
    emergencyContact: "Selvi Saravanan (Wife) - 9940112234",
    verified: true,
    blocked: false,
    numDonations: 5
  },
  {
    fullName: "Divya Bharathi",
    age: 22,
    gender: "Female",
    bloodGroup: "A-",
    mobileNumber: "9047055443",
    emailAddress: "divya.b@example.com",
    district: "Madurai",
    taluk: "Melur",
    city: "Melur Town",
    state: "Tamil Nadu",
    pinCode: "625106",
    latitude: 10.0333,
    longitude: 78.3333,
    lastDonationDate: "2026-04-18", // Not eligible (within 90 days)
    availabilityStatus: "Available",
    medicalEligibility: true,
    emergencyContact: "Bharathi (Mother) - 9047055440",
    verified: true,
    blocked: false,
    numDonations: 1
  },
  {
    fullName: "Ranganathan Swamy",
    age: 45,
    gender: "Male",
    bloodGroup: "AB-", // Rare
    mobileNumber: "9842145678",
    emailAddress: "ranga.swamy@example.com",
    district: "Tiruchirappalli",
    taluk: "Srirangam",
    city: "Srirangam",
    state: "Tamil Nadu",
    pinCode: "620006",
    latitude: 10.8622,
    longitude: 78.6902,
    lastDonationDate: "2025-08-10", // Eligible
    availabilityStatus: "Available",
    medicalEligibility: true,
    emergencyContact: "Sridhar (Son) - 9842145670",
    verified: true,
    blocked: false,
    numDonations: 12
  },
  {
    fullName: "Abishek Kumar",
    age: 31,
    gender: "Male",
    bloodGroup: "B-",
    mobileNumber: "9488123456",
    emailAddress: "abishek.k@example.com",
    district: "Tiruchirappalli",
    taluk: "Trichy West",
    city: "Thillai Nagar",
    state: "Tamil Nadu",
    pinCode: "620018",
    latitude: 10.8222,
    longitude: 78.6850,
    lastDonationDate: "2026-05-01", // Not eligible
    availabilityStatus: "Not Available",
    medicalEligibility: true,
    emergencyContact: "Kumar (Father) - 9488123450",
    verified: true,
    blocked: false,
    numDonations: 3
  },
  {
    fullName: "Venkatesan Selvam",
    age: 38,
    gender: "Male",
    bloodGroup: "O+",
    mobileNumber: "9843055667",
    emailAddress: "venkat.s@example.com",
    district: "Salem",
    taluk: "Salem",
    city: "Hasthampatti",
    state: "Tamil Nadu",
    pinCode: "636007",
    latitude: 11.6667,
    longitude: 78.1667,
    lastDonationDate: "2026-03-25", // Eligible
    availabilityStatus: "Available",
    medicalEligibility: true,
    emergencyContact: "Geetha Selvam (Wife) - 9843055660",
    verified: true,
    blocked: false,
    numDonations: 6
  },
  {
    fullName: "Nandhini Devi",
    age: 26,
    gender: "Female",
    bloodGroup: "A+",
    mobileNumber: "9600123456",
    emailAddress: "nandhini.d@example.com",
    district: "Vellore",
    taluk: "Katpadi",
    city: "Gandhinagar",
    state: "Tamil Nadu",
    pinCode: "632006",
    latitude: 12.9667,
    longitude: 79.1333,
    lastDonationDate: "2026-02-10", // Eligible
    availabilityStatus: "Available",
    medicalEligibility: true,
    emergencyContact: "Loganathan (Husband) - 9600123450",
    verified: true,
    blocked: false,
    numDonations: 3
  },
  {
    fullName: "Balaji Ramakrishnan",
    age: 29,
    gender: "Male",
    bloodGroup: "B+",
    mobileNumber: "9865011223",
    emailAddress: "balaji.ram@example.com",
    district: "Thanjavur",
    taluk: "Kumbakonam",
    city: "Kumbakonam Town",
    state: "Tamil Nadu",
    pinCode: "612001",
    latitude: 10.9667,
    longitude: 79.3833,
    lastDonationDate: "2026-01-20", // Eligible
    availabilityStatus: "Available",
    medicalEligibility: true,
    emergencyContact: "Ramakrishnan (Father) - 9865011220",
    verified: true,
    blocked: false,
    numDonations: 7
  },
  {
    fullName: "Jenifer David",
    age: 27,
    gender: "Female",
    bloodGroup: "O-",
    mobileNumber: "9566123456",
    emailAddress: "jenifer.d@example.com",
    district: "Tirunelveli",
    taluk: "Palayamkottai",
    city: "Palayamkottai",
    state: "Tamil Nadu",
    pinCode: "627002",
    latitude: 8.7167,
    longitude: 77.7333,
    lastDonationDate: "2026-04-05", // Not Eligible
    availabilityStatus: "Available",
    medicalEligibility: true,
    emergencyContact: "David (Father) - 9566123450",
    verified: false, // Pending verification to show unverified states
    blocked: false,
    numDonations: 2
  },
  {
    fullName: "Rajesh Kannan",
    age: 41,
    gender: "Male",
    bloodGroup: "AB-",
    mobileNumber: "9443212345",
    emailAddress: "rajesh.k@example.com",
    district: "Erode",
    taluk: "Gobichettipalayam",
    city: "Gobichettipalayam",
    state: "Tamil Nadu",
    pinCode: "638452",
    latitude: 11.4500,
    longitude: 77.4333,
    lastDonationDate: "2025-09-09", // Eligible
    availabilityStatus: "Available",
    medicalEligibility: true,
    emergencyContact: "Kannan (Father) - 9443212340",
    verified: true,
    blocked: false,
    numDonations: 15
  },
  {
    fullName: "Praveen Kumar",
    age: 33,
    gender: "Male",
    bloodGroup: "O+",
    mobileNumber: "9842187654",
    emailAddress: "praveen.k@example.com",
    district: "Thoothukudi",
    taluk: "Tiruchendur",
    city: "Tiruchendur Town",
    state: "Tamil Nadu",
    pinCode: "628215",
    latitude: 8.4833,
    longitude: 78.1167,
    lastDonationDate: "2026-03-01", // Eligible
    availabilityStatus: "Available",
    medicalEligibility: true,
    emergencyContact: "Selvam (Uncle) - 9842187650",
    verified: true,
    blocked: false,
    numDonations: 4
  },
  {
    fullName: "Suresh Murugan",
    age: 36,
    gender: "Male",
    bloodGroup: "B+",
    mobileNumber: "9944112233",
    emailAddress: "suresh.m@example.com",
    district: "Tiruppur",
    taluk: "Avinashi",
    city: "Avinashi Town",
    state: "Tamil Nadu",
    pinCode: "641654",
    latitude: 11.1833,
    longitude: 77.2667,
    lastDonationDate: "2026-05-15", // Not Eligible
    availabilityStatus: "Available",
    medicalEligibility: true,
    emergencyContact: "Murugan (Father) - 9944112230",
    verified: true,
    blocked: false,
    numDonations: 6
  },
  {
    fullName: "Maria Johnson",
    age: 30,
    gender: "Female",
    bloodGroup: "A-",
    mobileNumber: "9894123456",
    emailAddress: "maria.j@example.com",
    district: "Kanyakumari",
    taluk: "Agastheeswaram",
    city: "Nagercoil",
    state: "Tamil Nadu",
    pinCode: "629001",
    latitude: 8.1833,
    longitude: 77.4167,
    lastDonationDate: "2026-02-28", // Eligible
    availabilityStatus: "Available",
    medicalEligibility: true,
    emergencyContact: "Johnson (Husband) - 9894123450",
    verified: true,
    blocked: false,
    numDonations: 5
  }
];

// Seed function
export const seedDonorsIfEmpty = async (db: Firestore): Promise<void> => {
  try {
    const donorsCol = collection(db, 'donors');
    const snap = await getDocs(donorsCol);
    
    if (snap.empty) {
      console.log("No donor profiles found in Firestore. Seeding database with realistic Tamil Nadu donors...");
      const batch = writeBatch(db);
      
      MOCK_DONORS_SEED.forEach((donorData, index) => {
        const docRef = doc(donorsCol); // Generates auto ID
        const finalDonor: Donor = {
          ...donorData,
          id: docRef.id,
          registeredAt: new Date(Date.now() - index * 3 * 24 * 3600 * 1000).toISOString() // Staggered registration dates
        };
        batch.set(docRef, finalDonor);
      });
      
      await batch.commit();
      console.log("Successfully seeded 16 Tamil Nadu donor records!");
    } else {
      console.log("Database already contains donor profiles. Skipping seed.");
    }
  } catch (err) {
    console.error("Error seeding donor profiles: ", err);
  }
};
