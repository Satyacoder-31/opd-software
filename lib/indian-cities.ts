import type { IndianState } from "./indian-states";

/**
 * State → cities mapping for clinic listing / discovery filters.
 * Choose a state first, then get city recommendations from this map.
 */
export const CITIES_BY_STATE: Record<IndianState, string[]> = {
  "Andhra Pradesh": [
    "Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Kurnool",
    "Kakinada", "Anantapur", "Kadapa", "Ongole", "Eluru",
    "Nandyal", "Machilipatnam", "Adoni", "Tenali", "Proddatur",
    "Hindupur", "Bhimavaram", "Madanapalle", "Guntakal", "Srikakulam",
    "Dharmavaram", "Gudivada", "Chittoor", "Ramagundam", "Vijayanagaram",
  ],
  "Arunachal Pradesh": ["Itanagar", "Naharlagun", "Pasighat", "Tawang"],
  "Assam": ["Guwahati", "Silchar", "Dibrugarh", "Jorhat", "Nagaon", "Tezpur", "Tinsukia"],
  "Bihar": [
    "Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Purnia",
    "Darbhanga", "Bihar Sharif", "Arrah", "Begusarai", "Katihar",
    "Munger", "Chapra", "Sasaram", "Hajipur", "Dehri",
    "Siwan", "Bettiah", "Motihari", "Saharsa",
  ],
  "Chhattisgarh": ["Raipur", "Bhilai", "Bilaspur", "Korba", "Durg", "Rajnandgaon", "Jagdalpur"],
  "Goa": ["Panaji", "Margao", "Vasco da Gama", "Mapusa", "Ponda"],
  "Gujarat": [
    "Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar",
    "Jamnagar", "Junagadh", "Gandhinagar", "Gandhidham", "Anand",
    "Morvi", "Nadiad", "Mehsana", "Surendranagar Dudhrej",
  ],
  "Haryana": [
    "Gurugram", "Faridabad", "Panipat", "Ambala", "Yamunanagar",
    "Rohtak", "Hisar", "Karnal", "Sonipat", "Panchkula",
    "Bhiwani", "Sirsa",
  ],
  "Himachal Pradesh": ["Shimla", "Dharamshala", "Mandi", "Solan", "Kullu"],
  "Jharkhand": [
    "Ranchi", "Jamshedpur", "Dhanbad", "Bokaro", "Deoghar",
    "Hazaribagh", "Giridih",
  ],
  "Karnataka": [
    "Bengaluru", "Mysuru", "Hubli-Dharwad", "Mangaluru", "Belgaum",
    "Davanagere", "Bellary", "Gulbarga", "Bijapur", "Shivamogga",
    "Tumkur", "Raichur", "Bidar", "Hospet", "Udupi",
  ],
  "Kerala": [
    "Kochi", "Thiruvananthapuram", "Kozhikode", "Thrissur", "Kollam",
    "Alappuzha", "Kottayam", "Palakkad", "Kannur", "Malappuram",
  ],
  "Madhya Pradesh": [
    "Indore", "Bhopal", "Jabalpur", "Gwalior", "Ujjain",
    "Sagar", "Dewas", "Satna", "Ratlam", "Rewa",
    "Singrauli", "Murwara", "Khandwa", "Burhanpur", "Morena",
    "Bhind", "Guna", "Shivpuri",
  ],
  "Maharashtra": [
    "Mumbai", "Pune", "Nagpur", "Thane", "Nashik",
    "Pimpri-Chinchwad", "Navi Mumbai", "Vasai-Virar", "Aurangabad", "Solapur",
    "Kalyan-Dombivli", "Bhiwandi", "Amravati", "Nanded", "Kolhapur",
    "Akola", "Malegaon", "Jalgaon", "Latur", "Dhule",
    "Ahmednagar", "Chandrapur", "Parbhani", "Ichalkaranji", "Jalna",
    "Ambernath", "Bhusawal", "Panvel", "Satara", "Sangli-Miraj & Kupwad",
    "Ulhasnagar",
  ],
  "Manipur": ["Imphal", "Thoubal", "Bishnupur"],
  "Meghalaya": ["Shillong", "Tura", "Jowai"],
  "Mizoram": ["Aizawl", "Lunglei", "Champhai"],
  "Nagaland": ["Kohima", "Dimapur", "Mokokchung"],
  "Odisha": [
    "Bhubaneswar", "Cuttack", "Rourkela", "Berhampur", "Sambalpur",
    "Balasore", "Puri", "Baripada",
  ],
  "Punjab": [
    "Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Bathinda",
    "Mohali", "Pathankot", "Hoshiarpur", "Phagwara",
  ],
  "Rajasthan": [
    "Jaipur", "Jodhpur", "Kota", "Bikaner", "Ajmer",
    "Udaipur", "Bhilwara", "Alwar", "Bharatpur", "Sikar",
    "Sri Ganganagar", "Pali",
  ],
  "Sikkim": ["Gangtok", "Namchi", "Gyalshing"],
  "Tamil Nadu": [
    "Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem",
    "Tirunelveli", "Tirupur", "Erode", "Vellore", "Thoothukudi",
    "Dindigul", "Thanjavur", "Nagercoil", "Ambattur", "Avadi",
    "Pallavaram",
  ],
  "Telangana": [
    "Hyderabad", "Warangal", "Nizamabad", "Khammam", "Karimnagar",
    "Secunderabad", "Ramagundam",
  ],
  "Tripura": ["Agartala", "Udaipur", "Dharmanagar"],
  "Uttar Pradesh": [
    "Lucknow", "Kanpur", "Ghaziabad", "Agra", "Meerut",
    "Varanasi", "Allahabad (Prayagraj)", "Bareilly", "Moradabad", "Aligarh",
    "Saharanpur", "Gorakhpur", "Noida", "Firozabad", "Jhansi",
    "Muzaffarnagar", "Mathura", "Shahjahanpur", "Rampur", "Farrukhabad",
    "Hapur", "Etawah", "Mirzapur", "Bulandshahr", "Sambhal",
    "Amroha", "Loni", "Unnao", "Rae Bareli", "Bahraich",
    "Jaunpur", "Orai", "Fatehpur", "Akbarpur", "Mau",
  ],
  "Uttarakhand": ["Dehradun", "Haridwar", "Roorkee", "Haldwani", "Kashipur", "Rudrapur"],
  "West Bengal": [
    "Kolkata", "Howrah", "Durgapur", "Asansol", "Siliguri",
    "Maheshtala", "Rajpur Sonarpur", "South Dumdum", "Bhatpara", "Panihati",
    "Kamarhati", "Bardhaman", "Kulti", "Bally", "Barasat",
    "North Dumdum", "Madhyamgram", "Bidhannagar", "Naihati", "Kharagpur",
    "Malda", "Haldia", "Raiganj", "Serampore", "Hugli",
    "Berhampore", "Uluberia",
  ],
  "Andaman and Nicobar Islands": ["Port Blair"],
  "Chandigarh": ["Chandigarh"],
  "Dadra and Nagar Haveli and Daman and Diu": ["Silvassa", "Daman", "Diu"],
  "Delhi": ["New Delhi", "Delhi", "Nangloi Jat", "Karawal Nagar", "Kirari Suleman Nagar", "Sultan Pur Majra", "Bhalswa Jahangir Pur", "Khora"],
  "Jammu and Kashmir": ["Srinagar", "Jammu", "Anantnag", "Baramulla", "Sopore"],
  "Ladakh": ["Leh", "Kargil"],
  "Lakshadweep": ["Kavaratti"],
  "Puducherry": ["Puducherry", "Ozhukarai", "Karaikal"],
};

/** Flat list of all cities (for backward compatibility). */
export const INDIAN_CITIES: string[] = Object.values(CITIES_BY_STATE).flat();

export type IndianCity = string;

const CITY_SET = new Set<string>(INDIAN_CITIES);

export function isKnownIndianCity(city: string): boolean {
  return CITY_SET.has(city.trim());
}

/** Get cities for a given state. Returns empty array if state not found. */
export function getCitiesForState(state: string): string[] {
  return CITIES_BY_STATE[state as IndianState] ?? [];
}

/** Case-insensitive substring search within a state (or all cities if no state). */
export function searchIndianCities(
  query: string,
  limit = 40,
  state?: string,
): string[] {
  const pool = state ? getCitiesForState(state) : INDIAN_CITIES;
  const q = query.trim().toLocaleLowerCase();
  if (!q) return pool.slice(0, limit);
  const matches: string[] = [];
  for (const city of pool) {
    if (city.toLocaleLowerCase().includes(q)) {
      matches.push(city);
      if (matches.length >= limit) break;
    }
  }
  return matches;
}
