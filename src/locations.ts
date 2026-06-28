export interface LocationData {
  district: string;
  taluks: string[];
}

export const TAMIL_NADU_LOCATIONS: LocationData[] = [
  {
    district: "Chennai",
    taluks: [
      "Egmore",
      "Mylapore",
      "Guindy",
      "Tondiarpet",
      "Velachery",
      "Ambattur",
      "Aminjikarai",
      "Mambalam",
      "Purasawalkam",
      "Sholinganallur"
    ]
  },
  {
    district: "Coimbatore",
    taluks: [
      "Coimbatore North",
      "Coimbatore South",
      "Pollachi",
      "Mettupalayam",
      "Sulur",
      "Valparai",
      "Annur",
      "Madukkarai"
    ]
  },
  {
    district: "Madurai",
    taluks: [
      "Madurai South",
      "Madurai North",
      "Madurai East",
      "Madurai West",
      "Melur",
      "Thirumangalam",
      "Usilampatti",
      "Vadipatti",
      "Tirupparankundram"
    ]
  },
  {
    district: "Tiruchirappalli",
    taluks: [
      "Trichy East",
      "Trichy West",
      "Srirangam",
      "Lalgudi",
      "Manapparai",
      "Musiri",
      "Thuraiyur",
      "Thiruverumbur"
    ]
  },
  {
    district: "Salem",
    taluks: [
      "Salem",
      "Attur",
      "Mettur",
      "Omalur",
      "Sankari",
      "Yercaud",
      "Edappadi",
      "Gangavalli",
      "Vazhapadi"
    ]
  },
  {
    district: "Vellore",
    taluks: [
      "Vellore",
      "Katpadi",
      "Gudiyatham",
      "Pernambut",
      "Anaicut",
      "K V Kuppam"
    ]
  },
  {
    district: "Tirunelveli",
    taluks: [
      "Tirunelveli",
      "Palayamkottai",
      "Ambasamudram",
      "Nanguneri",
      "Radhapuram",
      "Cheranmahadevi",
      "Manur"
    ]
  },
  {
    district: "Thanjavur",
    taluks: [
      "Thanjavur",
      "Kumbakonam",
      "Pattukkottai",
      "Orathanadu",
      "Thiruvaiyaru",
      "Papanasam",
      "Peravurani"
    ]
  },
  {
    district: "Erode",
    taluks: [
      "Erode",
      "Gobichettipalayam",
      "Bhavani",
      "Perundurai",
      "Sathyamangalam",
      "Kodumudi",
      "Anthiyur"
    ]
  },
  {
    district: "Thoothukudi",
    taluks: [
      "Thoothukudi",
      "Kovilpatti",
      "Tiruchendur",
      "Srivaikuntam",
      "Ottapidaram",
      "Ettayapuram",
      "Vilathikulam"
    ]
  },
  {
    district: "Tiruppur",
    taluks: [
      "Tiruppur South",
      "Tiruppur North",
      "Avinashi",
      "Dharapuram",
      "Kangeyam",
      "Udumalaipettai",
      "Palladam",
      "Madathukulam"
    ]
  },
  {
    district: "Kanyakumari",
    taluks: [
      "Agastheeswaram",
      "Kalkulam",
      "Thovalai",
      "Vilavancode",
      "Killiyoor",
      "Thiruvattar"
    ]
  },
  {
    district: "Dindigul",
    taluks: [
      "Dindigul West",
      "Dindigul East",
      "Kodaikanal",
      "Palani",
      "Oddanchatram",
      "Nilakottai",
      "Natham",
      "Vedasandur"
    ]
  },
  {
    district: "Kanchipuram",
    taluks: [
      "Kanchipuram",
      "Sriperumbudur",
      "Walajabad",
      "Kundrathur",
      "Uthiramerur"
    ]
  },
  {
    district: "Cuddalore",
    taluks: [
      "Cuddalore",
      "Chidambaram",
      "Panruti",
      "Vridhachalam",
      "Kurinjipadi",
      "Bhuvanagiri",
      "Srimushnam"
    ]
  },
  {
    district: "Tiruvallur",
    taluks: [
      "Tiruvallur",
      "Avadi",
      "Poonamallee",
      "Ambattur",
      "Gummidipoondi",
      "Ponneri",
      "Tiruttani",
      "Uthukkottai"
    ]
  }
];

// Flat utility to get all districts
export const DISTRICTS = TAMIL_NADU_LOCATIONS.map(l => l.district).sort();

// Utility to get taluks for a given district
export const getTaluksForDistrict = (districtName: string): string[] => {
  const found = TAMIL_NADU_LOCATIONS.find(l => l.district === districtName);
  return found ? found.taluks.sort() : [];
};
