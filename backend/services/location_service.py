"""
WeatherTrust AI — Indian Geographic Location Hierarchy Service
Provides authoritative, hierarchical selection and autocomplete search for Indian locations:
India -> State / Union Territory -> Place / City / District -> Live Weather & Forecast Tracking.

Contains all 28 Indian States and 8 Union Territories with verified real geographic coordinates.
"""

from typing import List, Dict, Any, Optional

INDIAN_LOCATIONS: List[Dict[str, Any]] = [
    # =========================================================================
    # ANDHRA PRADESH (AP)
    # =========================================================================
    {"country": "India", "state": "Andhra Pradesh", "state_code": "AP", "place": "Vijayawada", "district": "NTR", "latitude": 16.5062, "longitude": 80.6480},
    {"country": "India", "state": "Andhra Pradesh", "state_code": "AP", "place": "Visakhapatnam", "district": "Visakhapatnam", "latitude": 17.6868, "longitude": 83.2185},
    {"country": "India", "state": "Andhra Pradesh", "state_code": "AP", "place": "Guntur", "district": "Guntur", "latitude": 16.3067, "longitude": 80.4365},
    {"country": "India", "state": "Andhra Pradesh", "state_code": "AP", "place": "Nellore", "district": "Sri Potti Sriramulu Nellore", "latitude": 14.4426, "longitude": 79.9865},
    {"country": "India", "state": "Andhra Pradesh", "state_code": "AP", "place": "Tirupati", "district": "Tirupati", "latitude": 13.6288, "longitude": 79.4192},
    {"country": "India", "state": "Andhra Pradesh", "state_code": "AP", "place": "Kurnool", "district": "Kurnool", "latitude": 15.8281, "longitude": 78.0373},
    {"country": "India", "state": "Andhra Pradesh", "state_code": "AP", "place": "Rajahmundry", "district": "East Godavari", "latitude": 17.0005, "longitude": 81.8040},
    {"country": "India", "state": "Andhra Pradesh", "state_code": "AP", "place": "Kadapa", "district": "YSR Kadapa", "latitude": 14.4673, "longitude": 78.8242},
    {"country": "India", "state": "Andhra Pradesh", "state_code": "AP", "place": "Kakinada", "district": "Kakinada", "latitude": 16.9891, "longitude": 82.2475},
    {"country": "India", "state": "Andhra Pradesh", "state_code": "AP", "place": "Anantapur", "district": "Anantapur", "latitude": 14.6819, "longitude": 77.6006},
    {"country": "India", "state": "Andhra Pradesh", "state_code": "AP", "place": "Ongole", "district": "Prakasam", "latitude": 15.5057, "longitude": 80.0499},
    {"country": "India", "state": "Andhra Pradesh", "state_code": "AP", "place": "Eluru", "district": "Eluru", "latitude": 16.7107, "longitude": 81.0952},
    {"country": "India", "state": "Andhra Pradesh", "state_code": "AP", "place": "Krishna District", "district": "Krishna", "latitude": 16.1875, "longitude": 81.1389},
    {"country": "India", "state": "Andhra Pradesh", "state_code": "AP", "place": "Machilipatnam", "district": "Krishna", "latitude": 16.1875, "longitude": 81.1389},
    {"country": "India", "state": "Andhra Pradesh", "state_code": "AP", "place": "Chittoor", "district": "Chittoor", "latitude": 13.2172, "longitude": 79.1003},
    {"country": "India", "state": "Andhra Pradesh", "state_code": "AP", "place": "Vizianagaram", "district": "Vizianagaram", "latitude": 18.1067, "longitude": 83.3956},
    {"country": "India", "state": "Andhra Pradesh", "state_code": "AP", "place": "Srikakulam", "district": "Srikakulam", "latitude": 18.2949, "longitude": 83.8938},
    {"country": "India", "state": "Andhra Pradesh", "state_code": "AP", "place": "Amaravati", "district": "Guntur", "latitude": 16.5417, "longitude": 80.5158},
    {"country": "India", "state": "Andhra Pradesh", "state_code": "AP", "place": "Nandyal", "district": "Nandyal", "latitude": 15.4886, "longitude": 78.4836},
    {"country": "India", "state": "Andhra Pradesh", "state_code": "AP", "place": "Bhimavaram", "district": "West Godavari", "latitude": 16.5449, "longitude": 81.5212},
    {"country": "India", "state": "Andhra Pradesh", "state_code": "AP", "place": "Proddatur", "district": "YSR Kadapa", "latitude": 14.7500, "longitude": 78.5500},

    # =========================================================================
    # ARUNACHAL PRADESH (AR)
    # =========================================================================
    {"country": "India", "state": "Arunachal Pradesh", "state_code": "AR", "place": "Itanagar", "district": "Papum Pare", "latitude": 27.0844, "longitude": 93.6053},
    {"country": "India", "state": "Arunachal Pradesh", "state_code": "AR", "place": "Naharlagun", "district": "Papum Pare", "latitude": 27.1064, "longitude": 93.6937},
    {"country": "India", "state": "Arunachal Pradesh", "state_code": "AR", "place": "Pasighat", "district": "East Siang", "latitude": 28.0664, "longitude": 95.3268},
    {"country": "India", "state": "Arunachal Pradesh", "state_code": "AR", "place": "Tawang", "district": "Tawang", "latitude": 27.5861, "longitude": 91.8594},
    {"country": "India", "state": "Arunachal Pradesh", "state_code": "AR", "place": "Ziro", "district": "Lower Subansiri", "latitude": 27.5452, "longitude": 93.8291},
    {"country": "India", "state": "Arunachal Pradesh", "state_code": "AR", "place": "Bomdila", "district": "West Kameng", "latitude": 27.2645, "longitude": 92.4159},
    {"country": "India", "state": "Arunachal Pradesh", "state_code": "AR", "place": "Tezu", "district": "Lohit", "latitude": 27.9167, "longitude": 96.1667},
    {"country": "India", "state": "Arunachal Pradesh", "state_code": "AR", "place": "Roing", "district": "Lower Dibang Valley", "latitude": 28.1394, "longitude": 95.8394},

    # =========================================================================
    # ASSAM (AS)
    # =========================================================================
    {"country": "India", "state": "Assam", "state_code": "AS", "place": "Guwahati", "district": "Kamrup Metropolitan", "latitude": 26.1445, "longitude": 91.7362},
    {"country": "India", "state": "Assam", "state_code": "AS", "place": "Silchar", "district": "Cachar", "latitude": 24.8170, "longitude": 92.7985},
    {"country": "India", "state": "Assam", "state_code": "AS", "place": "Dibrugarh", "district": "Dibrugarh", "latitude": 27.4728, "longitude": 94.9120},
    {"country": "India", "state": "Assam", "state_code": "AS", "place": "Jorhat", "district": "Jorhat", "latitude": 26.7509, "longitude": 94.2037},
    {"country": "India", "state": "Assam", "state_code": "AS", "place": "Nagaon", "district": "Nagaon", "latitude": 26.3468, "longitude": 92.6840},
    {"country": "India", "state": "Assam", "state_code": "AS", "place": "Tinsukia", "district": "Tinsukia", "latitude": 27.4922, "longitude": 95.3558},
    {"country": "India", "state": "Assam", "state_code": "AS", "place": "Tezpur", "district": "Sonitpur", "latitude": 26.6528, "longitude": 92.7926},
    {"country": "India", "state": "Assam", "state_code": "AS", "place": "Bongaigaon", "district": "Bongaigaon", "latitude": 26.5024, "longitude": 90.5584},
    {"country": "India", "state": "Assam", "state_code": "AS", "place": "Barpeta", "district": "Barpeta", "latitude": 26.3211, "longitude": 91.0061},

    # =========================================================================
    # BIHAR (BR)
    # =========================================================================
    {"country": "India", "state": "Bihar", "state_code": "BR", "place": "Patna", "district": "Patna", "latitude": 25.5941, "longitude": 85.1376},
    {"country": "India", "state": "Bihar", "state_code": "BR", "place": "Gaya", "district": "Gaya", "latitude": 24.7914, "longitude": 85.0002},
    {"country": "India", "state": "Bihar", "state_code": "BR", "place": "Bhagalpur", "district": "Bhagalpur", "latitude": 25.2425, "longitude": 86.9842},
    {"country": "India", "state": "Bihar", "state_code": "BR", "place": "Muzaffarpur", "district": "Muzaffarpur", "latitude": 26.1209, "longitude": 85.3647},
    {"country": "India", "state": "Bihar", "state_code": "BR", "place": "Darbhanga", "district": "Darbhanga", "latitude": 26.1542, "longitude": 85.8918},
    {"country": "India", "state": "Bihar", "state_code": "BR", "place": "Purnia", "district": "Purnia", "latitude": 25.7771, "longitude": 87.4753},
    {"country": "India", "state": "Bihar", "state_code": "BR", "place": "Arrah", "district": "Bhojpur", "latitude": 25.5560, "longitude": 84.6603},
    {"country": "India", "state": "Bihar", "state_code": "BR", "place": "Begusarai", "district": "Begusarai", "latitude": 25.4182, "longitude": 86.1272},
    {"country": "India", "state": "Bihar", "state_code": "BR", "place": "Katihar", "district": "Katihar", "latitude": 25.5394, "longitude": 87.5700},
    {"country": "India", "state": "Bihar", "state_code": "BR", "place": "Munger", "district": "Munger", "latitude": 25.3757, "longitude": 86.4744},
    {"country": "India", "state": "Bihar", "state_code": "BR", "place": "Chhapra", "district": "Saran", "latitude": 25.7848, "longitude": 84.7274},

    # =========================================================================
    # CHHATTISGARH (CG)
    # =========================================================================
    {"country": "India", "state": "Chhattisgarh", "state_code": "CG", "place": "Raipur", "district": "Raipur", "latitude": 21.2514, "longitude": 81.6296},
    {"country": "India", "state": "Chhattisgarh", "state_code": "CG", "place": "Bilaspur", "district": "Bilaspur", "latitude": 22.0797, "longitude": 82.1409},
    {"country": "India", "state": "Chhattisgarh", "state_code": "CG", "place": "Bhilai", "district": "Durg", "latitude": 21.1938, "longitude": 81.3509},
    {"country": "India", "state": "Chhattisgarh", "state_code": "CG", "place": "Durg", "district": "Durg", "latitude": 21.1904, "longitude": 81.2849},
    {"country": "India", "state": "Chhattisgarh", "state_code": "CG", "place": "Korba", "district": "Korba", "latitude": 22.3595, "longitude": 82.7501},
    {"country": "India", "state": "Chhattisgarh", "state_code": "CG", "place": "Rajnandgaon", "district": "Rajnandgaon", "latitude": 21.0961, "longitude": 81.0347},
    {"country": "India", "state": "Chhattisgarh", "state_code": "CG", "place": "Jagdalpur", "district": "Bastar", "latitude": 19.0740, "longitude": 82.0080},
    {"country": "India", "state": "Chhattisgarh", "state_code": "CG", "place": "Ambikapur", "district": "Surguja", "latitude": 23.1189, "longitude": 83.1979},
    {"country": "India", "state": "Chhattisgarh", "state_code": "CG", "place": "Raigarh", "district": "Raigarh", "latitude": 21.8974, "longitude": 83.3950},

    # =========================================================================
    # GOA (GA)
    # =========================================================================
    {"country": "India", "state": "Goa", "state_code": "GA", "place": "Panaji", "district": "North Goa", "latitude": 15.4909, "longitude": 73.8278},
    {"country": "India", "state": "Goa", "state_code": "GA", "place": "Margao", "district": "South Goa", "latitude": 15.2832, "longitude": 73.9862},
    {"country": "India", "state": "Goa", "state_code": "GA", "place": "Vasco da Gama", "district": "South Goa", "latitude": 15.3982, "longitude": 73.8113},
    {"country": "India", "state": "Goa", "state_code": "GA", "place": "Mapusa", "district": "North Goa", "latitude": 15.5937, "longitude": 73.8142},
    {"country": "India", "state": "Goa", "state_code": "GA", "place": "Ponda", "district": "North Goa", "latitude": 15.4026, "longitude": 74.0086},
    {"country": "India", "state": "Goa", "state_code": "GA", "place": "Bicholim", "district": "North Goa", "latitude": 15.5947, "longitude": 73.9533},
    {"country": "India", "state": "Goa", "state_code": "GA", "place": "Curchorem", "district": "South Goa", "latitude": 15.2604, "longitude": 74.1105},

    # =========================================================================
    # GUJARAT (GJ)
    # =========================================================================
    {"country": "India", "state": "Gujarat", "state_code": "GJ", "place": "Ahmedabad", "district": "Ahmedabad", "latitude": 23.0225, "longitude": 72.5714},
    {"country": "India", "state": "Gujarat", "state_code": "GJ", "place": "Surat", "district": "Surat", "latitude": 21.1702, "longitude": 72.8311},
    {"country": "India", "state": "Gujarat", "state_code": "GJ", "place": "Vadodara", "district": "Vadodara", "latitude": 22.3072, "longitude": 73.1812},
    {"country": "India", "state": "Gujarat", "state_code": "GJ", "place": "Rajkot", "district": "Rajkot", "latitude": 22.3039, "longitude": 70.8022},
    {"country": "India", "state": "Gujarat", "state_code": "GJ", "place": "Bhavnagar", "district": "Bhavnagar", "latitude": 21.7645, "longitude": 72.1519},
    {"country": "India", "state": "Gujarat", "state_code": "GJ", "place": "Jamnagar", "district": "Jamnagar", "latitude": 22.4707, "longitude": 70.0577},
    {"country": "India", "state": "Gujarat", "state_code": "GJ", "place": "Gandhinagar", "district": "Gandhinagar", "latitude": 23.2156, "longitude": 72.6369},
    {"country": "India", "state": "Gujarat", "state_code": "GJ", "place": "Junagadh", "district": "Junagadh", "latitude": 21.5222, "longitude": 70.4579},
    {"country": "India", "state": "Gujarat", "state_code": "GJ", "place": "Anand", "district": "Anand", "latitude": 22.5645, "longitude": 72.9289},
    {"country": "India", "state": "Gujarat", "state_code": "GJ", "place": "Navsari", "district": "Navsari", "latitude": 20.9500, "longitude": 72.9300},
    {"country": "India", "state": "Gujarat", "state_code": "GJ", "place": "Morbi", "district": "Morbi", "latitude": 22.8173, "longitude": 70.8370},
    {"country": "India", "state": "Gujarat", "state_code": "GJ", "place": "Bhuj", "district": "Kutch", "latitude": 23.2420, "longitude": 69.6669},
    {"country": "India", "state": "Gujarat", "state_code": "GJ", "place": "Porbandar", "district": "Porbandar", "latitude": 21.6417, "longitude": 69.6293},
    {"country": "India", "state": "Gujarat", "state_code": "GJ", "place": "Mehsana", "district": "Mehsana", "latitude": 23.5880, "longitude": 72.3693},

    # =========================================================================
    # HARYANA (HR)
    # =========================================================================
    {"country": "India", "state": "Haryana", "state_code": "HR", "place": "Gurugram", "district": "Gurugram", "latitude": 28.4595, "longitude": 77.0266},
    {"country": "India", "state": "Haryana", "state_code": "HR", "place": "Faridabad", "district": "Faridabad", "latitude": 28.4089, "longitude": 77.3178},
    {"country": "India", "state": "Haryana", "state_code": "HR", "place": "Panipat", "district": "Panipat", "latitude": 29.3909, "longitude": 76.9635},
    {"country": "India", "state": "Haryana", "state_code": "HR", "place": "Ambala", "district": "Ambala", "latitude": 30.3782, "longitude": 76.7767},
    {"country": "India", "state": "Haryana", "state_code": "HR", "place": "Hisar", "district": "Hisar", "latitude": 29.1492, "longitude": 75.7217},
    {"country": "India", "state": "Haryana", "state_code": "HR", "place": "Rohtak", "district": "Rohtak", "latitude": 28.8955, "longitude": 76.6066},
    {"country": "India", "state": "Haryana", "state_code": "HR", "place": "Karnal", "district": "Karnal", "latitude": 29.6857, "longitude": 76.9905},
    {"country": "India", "state": "Haryana", "state_code": "HR", "place": "Sonipat", "district": "Sonipat", "latitude": 28.9931, "longitude": 77.0151},
    {"country": "India", "state": "Haryana", "state_code": "HR", "place": "Panchkula", "district": "Panchkula", "latitude": 30.6942, "longitude": 76.8606},
    {"country": "India", "state": "Haryana", "state_code": "HR", "place": "Yamunanagar", "district": "Yamunanagar", "latitude": 30.1290, "longitude": 77.2674},
    {"country": "India", "state": "Haryana", "state_code": "HR", "place": "Kurukshetra", "district": "Kurukshetra", "latitude": 29.9695, "longitude": 76.8783},
    {"country": "India", "state": "Haryana", "state_code": "HR", "place": "Sirsa", "district": "Sirsa", "latitude": 29.5349, "longitude": 75.0298},

    # =========================================================================
    # HIMACHAL PRADESH (HP)
    # =========================================================================
    {"country": "India", "state": "Himachal Pradesh", "state_code": "HP", "place": "Shimla", "district": "Shimla", "latitude": 31.1048, "longitude": 77.1734},
    {"country": "India", "state": "Himachal Pradesh", "state_code": "HP", "place": "Dharamshala", "district": "Kangra", "latitude": 32.2190, "longitude": 76.3234},
    {"country": "India", "state": "Himachal Pradesh", "state_code": "HP", "place": "Manali", "district": "Kullu", "latitude": 32.2432, "longitude": 77.1892},
    {"country": "India", "state": "Himachal Pradesh", "state_code": "HP", "place": "Solan", "district": "Solan", "latitude": 30.9084, "longitude": 77.0999},
    {"country": "India", "state": "Himachal Pradesh", "state_code": "HP", "place": "Mandi", "district": "Mandi", "latitude": 31.7087, "longitude": 76.9320},
    {"country": "India", "state": "Himachal Pradesh", "state_code": "HP", "place": "Kullu", "district": "Kullu", "latitude": 31.9579, "longitude": 77.1095},
    {"country": "India", "state": "Himachal Pradesh", "state_code": "HP", "place": "Bilaspur", "district": "Bilaspur", "latitude": 31.3325, "longitude": 76.7589},
    {"country": "India", "state": "Himachal Pradesh", "state_code": "HP", "place": "Chamba", "district": "Chamba", "latitude": 32.5534, "longitude": 76.1258},
    {"country": "India", "state": "Himachal Pradesh", "state_code": "HP", "place": "Hamirpur", "district": "Hamirpur", "latitude": 31.6862, "longitude": 76.5213},
    {"country": "India", "state": "Himachal Pradesh", "state_code": "HP", "place": "Una", "district": "Una", "latitude": 31.4685, "longitude": 76.2708},

    # =========================================================================
    # JHARKHAND (JH)
    # =========================================================================
    {"country": "India", "state": "Jharkhand", "state_code": "JH", "place": "Ranchi", "district": "Ranchi", "latitude": 23.3441, "longitude": 85.3096},
    {"country": "India", "state": "Jharkhand", "state_code": "JH", "place": "Jamshedpur", "district": "East Singhbhum", "latitude": 22.8046, "longitude": 86.2029},
    {"country": "India", "state": "Jharkhand", "state_code": "JH", "place": "Dhanbad", "district": "Dhanbad", "latitude": 23.7957, "longitude": 86.4304},
    {"country": "India", "state": "Jharkhand", "state_code": "JH", "place": "Bokaro Steel City", "district": "Bokaro", "latitude": 23.6693, "longitude": 86.1511},
    {"country": "India", "state": "Jharkhand", "state_code": "JH", "place": "Deoghar", "district": "Deoghar", "latitude": 24.4826, "longitude": 86.7001},
    {"country": "India", "state": "Jharkhand", "state_code": "JH", "place": "Hazaribagh", "district": "Hazaribagh", "latitude": 23.9961, "longitude": 85.3637},
    {"country": "India", "state": "Jharkhand", "state_code": "JH", "place": "Giridih", "district": "Giridih", "latitude": 24.1852, "longitude": 86.3087},
    {"country": "India", "state": "Jharkhand", "state_code": "JH", "place": "Ramgarh", "district": "Ramgarh", "latitude": 23.6333, "longitude": 85.5167},
    {"country": "India", "state": "Jharkhand", "state_code": "JH", "place": "Dumka", "district": "Dumka", "latitude": 24.2686, "longitude": 87.2488},

    # =========================================================================
    # KARNATAKA (KA)
    # =========================================================================
    {"country": "India", "state": "Karnataka", "state_code": "KA", "place": "Bengaluru", "district": "Bengaluru Urban", "latitude": 12.9716, "longitude": 77.5946},
    {"country": "India", "state": "Karnataka", "state_code": "KA", "place": "Mysuru", "district": "Mysuru", "latitude": 12.2958, "longitude": 76.6394},
    {"country": "India", "state": "Karnataka", "state_code": "KA", "place": "Mangaluru", "district": "Dakshina Kannada", "latitude": 12.9141, "longitude": 74.8560},
    {"country": "India", "state": "Karnataka", "state_code": "KA", "place": "Hubballi", "district": "Dharwad", "latitude": 15.3647, "longitude": 75.1240},
    {"country": "India", "state": "Karnataka", "state_code": "KA", "place": "Belagavi", "district": "Belagavi", "latitude": 15.8497, "longitude": 74.4977},
    {"country": "India", "state": "Karnataka", "state_code": "KA", "place": "Kalaburagi", "district": "Kalaburagi", "latitude": 17.3297, "longitude": 76.8343},
    {"country": "India", "state": "Karnataka", "state_code": "KA", "place": "Davanagere", "district": "Davanagere", "latitude": 14.4644, "longitude": 75.9218},
    {"country": "India", "state": "Karnataka", "state_code": "KA", "place": "Ballari", "district": "Ballari", "latitude": 15.1394, "longitude": 76.9214},
    {"country": "India", "state": "Karnataka", "state_code": "KA", "place": "Shivamogga", "district": "Shivamogga", "latitude": 13.9299, "longitude": 75.5681},
    {"country": "India", "state": "Karnataka", "state_code": "KA", "place": "Tumakuru", "district": "Tumakuru", "latitude": 13.3379, "longitude": 77.1010},
    {"country": "India", "state": "Karnataka", "state_code": "KA", "place": "Udupi", "district": "Udupi", "latitude": 13.3409, "longitude": 74.7421},
    {"country": "India", "state": "Karnataka", "state_code": "KA", "place": "Bidar", "district": "Bidar", "latitude": 17.9104, "longitude": 77.5199},
    {"country": "India", "state": "Karnataka", "state_code": "KA", "place": "Hassan", "district": "Hassan", "latitude": 13.0072, "longitude": 76.0963},
    {"country": "India", "state": "Karnataka", "state_code": "KA", "place": "Vijayapura", "district": "Vijayapura", "latitude": 16.8302, "longitude": 75.7100},
    {"country": "India", "state": "Karnataka", "state_code": "KA", "place": "Raichur", "district": "Raichur", "latitude": 16.2076, "longitude": 77.3463},
    {"country": "India", "state": "Karnataka", "state_code": "KA", "place": "Mandya", "district": "Mandya", "latitude": 12.5218, "longitude": 76.8951},

    # =========================================================================
    # KERALA (KL)
    # =========================================================================
    {"country": "India", "state": "Kerala", "state_code": "KL", "place": "Thiruvananthapuram", "district": "Thiruvananthapuram", "latitude": 8.5241, "longitude": 76.9366},
    {"country": "India", "state": "Kerala", "state_code": "KL", "place": "Kochi", "district": "Ernakulam", "latitude": 9.9312, "longitude": 76.2673},
    {"country": "India", "state": "Kerala", "state_code": "KL", "place": "Kozhikode", "district": "Kozhikode", "latitude": 11.2588, "longitude": 75.7804},
    {"country": "India", "state": "Kerala", "state_code": "KL", "place": "Thrissur", "district": "Thrissur", "latitude": 10.5276, "longitude": 76.2144},
    {"country": "India", "state": "Kerala", "state_code": "KL", "place": "Kollam", "district": "Kollam", "latitude": 8.8932, "longitude": 76.6141},
    {"country": "India", "state": "Kerala", "state_code": "KL", "place": "Alappuzha", "district": "Alappuzha", "latitude": 9.4981, "longitude": 76.3388},
    {"country": "India", "state": "Kerala", "state_code": "KL", "place": "Kannur", "district": "Kannur", "latitude": 11.8745, "longitude": 75.3704},
    {"country": "India", "state": "Kerala", "state_code": "KL", "place": "Palakkad", "district": "Palakkad", "latitude": 10.7867, "longitude": 76.6548},
    {"country": "India", "state": "Kerala", "state_code": "KL", "place": "Kottayam", "district": "Kottayam", "latitude": 9.5916, "longitude": 76.5222},
    {"country": "India", "state": "Kerala", "state_code": "KL", "place": "Malappuram", "district": "Malappuram", "latitude": 11.0732, "longitude": 76.0740},
    {"country": "India", "state": "Kerala", "state_code": "KL", "place": "Wayanad", "district": "Wayanad", "latitude": 11.6050, "longitude": 76.0828},
    {"country": "India", "state": "Kerala", "state_code": "KL", "place": "Idukki", "district": "Idukki", "latitude": 9.8494, "longitude": 76.9806},
    {"country": "India", "state": "Kerala", "state_code": "KL", "place": "Kasaragod", "district": "Kasaragod", "latitude": 12.4996, "longitude": 74.9869},
    {"country": "India", "state": "Kerala", "state_code": "KL", "place": "Pathanamthitta", "district": "Pathanamthitta", "latitude": 9.2648, "longitude": 76.7870},

    # =========================================================================
    # MADHYA PRADESH (MP)
    # =========================================================================
    {"country": "India", "state": "Madhya Pradesh", "state_code": "MP", "place": "Bhopal", "district": "Bhopal", "latitude": 23.2599, "longitude": 77.4126},
    {"country": "India", "state": "Madhya Pradesh", "state_code": "MP", "place": "Indore", "district": "Indore", "latitude": 22.7196, "longitude": 75.8577},
    {"country": "India", "state": "Madhya Pradesh", "state_code": "MP", "place": "Gwalior", "district": "Gwalior", "latitude": 26.2183, "longitude": 78.1828},
    {"country": "India", "state": "Madhya Pradesh", "state_code": "MP", "place": "Jabalpur", "district": "Jabalpur", "latitude": 23.1815, "longitude": 79.9864},
    {"country": "India", "state": "Madhya Pradesh", "state_code": "MP", "place": "Ujjain", "district": "Ujjain", "latitude": 23.1765, "longitude": 75.7885},
    {"country": "India", "state": "Madhya Pradesh", "state_code": "MP", "place": "Sagar", "district": "Sagar", "latitude": 23.8388, "longitude": 78.7378},
    {"country": "India", "state": "Madhya Pradesh", "state_code": "MP", "place": "Dewas", "district": "Dewas", "latitude": 22.9676, "longitude": 76.0534},
    {"country": "India", "state": "Madhya Pradesh", "state_code": "MP", "place": "Satna", "district": "Satna", "latitude": 24.6005, "longitude": 80.8322},
    {"country": "India", "state": "Madhya Pradesh", "state_code": "MP", "place": "Ratlam", "district": "Ratlam", "latitude": 23.3315, "longitude": 75.0367},
    {"country": "India", "state": "Madhya Pradesh", "state_code": "MP", "place": "Rewa", "district": "Rewa", "latitude": 24.5373, "longitude": 81.3042},
    {"country": "India", "state": "Madhya Pradesh", "state_code": "MP", "place": "Singrauli", "district": "Singrauli", "latitude": 24.1992, "longitude": 82.6645},

    # =========================================================================
    # MAHARASHTRA (MH)
    # =========================================================================
    {"country": "India", "state": "Maharashtra", "state_code": "MH", "place": "Mumbai", "district": "Mumbai City", "latitude": 19.0760, "longitude": 72.8777},
    {"country": "India", "state": "Maharashtra", "state_code": "MH", "place": "Pune", "district": "Pune", "latitude": 18.5204, "longitude": 73.8567},
    {"country": "India", "state": "Maharashtra", "state_code": "MH", "place": "Nagpur", "district": "Nagpur", "latitude": 21.1458, "longitude": 79.0882},
    {"country": "India", "state": "Maharashtra", "state_code": "MH", "place": "Nashik", "district": "Nashik", "latitude": 19.9975, "longitude": 73.7898},
    {"country": "India", "state": "Maharashtra", "state_code": "MH", "place": "Thane", "district": "Thane", "latitude": 19.2183, "longitude": 72.9781},
    {"country": "India", "state": "Maharashtra", "state_code": "MH", "place": "Chhatrapati Sambhajinagar", "district": "Chhatrapati Sambhajinagar", "latitude": 19.8762, "longitude": 75.3433},
    {"country": "India", "state": "Maharashtra", "state_code": "MH", "place": "Solapur", "district": "Solapur", "latitude": 17.6599, "longitude": 75.9064},
    {"country": "India", "state": "Maharashtra", "state_code": "MH", "place": "Kolhapur", "district": "Kolhapur", "latitude": 16.7050, "longitude": 74.2433},
    {"country": "India", "state": "Maharashtra", "state_code": "MH", "place": "Amravati", "district": "Amravati", "latitude": 20.9320, "longitude": 77.7523},
    {"country": "India", "state": "Maharashtra", "state_code": "MH", "place": "Navi Mumbai", "district": "Thane", "latitude": 19.0330, "longitude": 73.0297},
    {"country": "India", "state": "Maharashtra", "state_code": "MH", "place": "Kalyan-Dombivli", "district": "Thane", "latitude": 19.2403, "longitude": 73.1305},
    {"country": "India", "state": "Maharashtra", "state_code": "MH", "place": "Nanded", "district": "Nanded", "latitude": 19.1383, "longitude": 77.3210},
    {"country": "India", "state": "Maharashtra", "state_code": "MH", "place": "Jalgaon", "district": "Jalgaon", "latitude": 21.0077, "longitude": 75.5626},
    {"country": "India", "state": "Maharashtra", "state_code": "MH", "place": "Akola", "district": "Akola", "latitude": 20.7002, "longitude": 77.0082},
    {"country": "India", "state": "Maharashtra", "state_code": "MH", "place": "Latur", "district": "Latur", "latitude": 18.4088, "longitude": 76.5604},
    {"country": "India", "state": "Maharashtra", "state_code": "MH", "place": "Dhule", "district": "Dhule", "latitude": 20.9042, "longitude": 74.7749},
    {"country": "India", "state": "Maharashtra", "state_code": "MH", "place": "Ahmednagar", "district": "Ahmednagar", "latitude": 19.0948, "longitude": 74.7479},
    {"country": "India", "state": "Maharashtra", "state_code": "MH", "place": "Chandrapur", "district": "Chandrapur", "latitude": 19.9615, "longitude": 79.2961},

    # =========================================================================
    # MANIPUR (MN)
    # =========================================================================
    {"country": "India", "state": "Manipur", "state_code": "MN", "place": "Imphal", "district": "Imphal West", "latitude": 24.8170, "longitude": 93.9368},
    {"country": "India", "state": "Manipur", "state_code": "MN", "place": "Churachandpur", "district": "Churachandpur", "latitude": 24.3333, "longitude": 93.6833},
    {"country": "India", "state": "Manipur", "state_code": "MN", "place": "Thoubal", "district": "Thoubal", "latitude": 24.6333, "longitude": 94.0167},
    {"country": "India", "state": "Manipur", "state_code": "MN", "place": "Bishnupur", "district": "Bishnupur", "latitude": 24.6324, "longitude": 93.7645},
    {"country": "India", "state": "Manipur", "state_code": "MN", "place": "Kakching", "district": "Kakching", "latitude": 24.4833, "longitude": 93.9833},
    {"country": "India", "state": "Manipur", "state_code": "MN", "place": "Ukhrul", "district": "Ukhrul", "latitude": 25.1167, "longitude": 94.3667},
    {"country": "India", "state": "Manipur", "state_code": "MN", "place": "Senapati", "district": "Senapati", "latitude": 25.2686, "longitude": 94.0189},

    # =========================================================================
    # MEGHALAYA (ML)
    # =========================================================================
    {"country": "India", "state": "Meghalaya", "state_code": "ML", "place": "Shillong", "district": "East Khasi Hills", "latitude": 25.5788, "longitude": 91.8933},
    {"country": "India", "state": "Meghalaya", "state_code": "ML", "place": "Tura", "district": "West Garo Hills", "latitude": 25.5144, "longitude": 90.2201},
    {"country": "India", "state": "Meghalaya", "state_code": "ML", "place": "Jowai", "district": "West Jaintia Hills", "latitude": 25.4526, "longitude": 92.2034},
    {"country": "India", "state": "Meghalaya", "state_code": "ML", "place": "Cherrapunji", "district": "East Khasi Hills", "latitude": 25.2702, "longitude": 91.7323},
    {"country": "India", "state": "Meghalaya", "state_code": "ML", "place": "Nongstoin", "district": "West Khasi Hills", "latitude": 25.5200, "longitude": 91.2700},
    {"country": "India", "state": "Meghalaya", "state_code": "ML", "place": "Williamnagar", "district": "East Garo Hills", "latitude": 25.6000, "longitude": 90.6200},

    # =========================================================================
    # MIZORAM (MZ)
    # =========================================================================
    {"country": "India", "state": "Mizoram", "state_code": "MZ", "place": "Aizawl", "district": "Aizawl", "latitude": 23.7271, "longitude": 92.7176},
    {"country": "India", "state": "Mizoram", "state_code": "MZ", "place": "Lunglei", "district": "Lunglei", "latitude": 22.8833, "longitude": 92.7333},
    {"country": "India", "state": "Mizoram", "state_code": "MZ", "place": "Champhai", "district": "Champhai", "latitude": 23.4757, "longitude": 93.3283},
    {"country": "India", "state": "Mizoram", "state_code": "MZ", "place": "Serchhip", "district": "Serchhip", "latitude": 23.3417, "longitude": 92.8500},
    {"country": "India", "state": "Mizoram", "state_code": "MZ", "place": "Kolasib", "district": "Kolasib", "latitude": 24.2300, "longitude": 92.6800},
    {"country": "India", "state": "Mizoram", "state_code": "MZ", "place": "Saiha", "district": "Siaha", "latitude": 22.4833, "longitude": 92.9667},

    # =========================================================================
    # NAGALAND (NL)
    # =========================================================================
    {"country": "India", "state": "Nagaland", "state_code": "NL", "place": "Kohima", "district": "Kohima", "latitude": 25.6751, "longitude": 94.1086},
    {"country": "India", "state": "Nagaland", "state_code": "NL", "place": "Dimapur", "district": "Dimapur", "latitude": 25.9068, "longitude": 93.7273},
    {"country": "India", "state": "Nagaland", "state_code": "NL", "place": "Mokokchung", "district": "Mokokchung", "latitude": 26.3249, "longitude": 94.5165},
    {"country": "India", "state": "Nagaland", "state_code": "NL", "place": "Tuensang", "district": "Tuensang", "latitude": 26.2800, "longitude": 94.8300},
    {"country": "India", "state": "Nagaland", "state_code": "NL", "place": "Wokha", "district": "Wokha", "latitude": 26.0988, "longitude": 94.2618},
    {"country": "India", "state": "Nagaland", "state_code": "NL", "place": "Zunheboto", "district": "Zunheboto", "latitude": 25.9700, "longitude": 94.5200},
    {"country": "India", "state": "Nagaland", "state_code": "NL", "place": "Mon", "district": "Mon", "latitude": 26.7500, "longitude": 95.0700},

    # =========================================================================
    # ODISHA (OD)
    # =========================================================================
    {"country": "India", "state": "Odisha", "state_code": "OD", "place": "Bhubaneswar", "district": "Khordha", "latitude": 20.2961, "longitude": 85.8245},
    {"country": "India", "state": "Odisha", "state_code": "OD", "place": "Cuttack", "district": "Cuttack", "latitude": 20.4625, "longitude": 85.8828},
    {"country": "India", "state": "Odisha", "state_code": "OD", "place": "Rourkela", "district": "Sundargarh", "latitude": 22.2604, "longitude": 84.8536},
    {"country": "India", "state": "Odisha", "state_code": "OD", "place": "Berhampur", "district": "Ganjam", "latitude": 19.3150, "longitude": 84.7941},
    {"country": "India", "state": "Odisha", "state_code": "OD", "place": "Sambalpur", "district": "Sambalpur", "latitude": 21.4669, "longitude": 83.9812},
    {"country": "India", "state": "Odisha", "state_code": "OD", "place": "Puri", "district": "Puri", "latitude": 19.8135, "longitude": 85.8312},
    {"country": "India", "state": "Odisha", "state_code": "OD", "place": "Balasore", "district": "Balasore", "latitude": 21.4934, "longitude": 86.9135},
    {"country": "India", "state": "Odisha", "state_code": "OD", "place": "Bhadrak", "district": "Bhadrak", "latitude": 21.0574, "longitude": 86.5158},
    {"country": "India", "state": "Odisha", "state_code": "OD", "place": "Baripada", "district": "Mayurbhanj", "latitude": 21.9333, "longitude": 86.7333},
    {"country": "India", "state": "Odisha", "state_code": "OD", "place": "Jharsuguda", "district": "Jharsuguda", "latitude": 21.8554, "longitude": 84.0063},

    # =========================================================================
    # PUNJAB (PB)
    # =========================================================================
    {"country": "India", "state": "Punjab", "state_code": "PB", "place": "Ludhiana", "district": "Ludhiana", "latitude": 30.9010, "longitude": 75.8573},
    {"country": "India", "state": "Punjab", "state_code": "PB", "place": "Amritsar", "district": "Amritsar", "latitude": 31.6340, "longitude": 74.8723},
    {"country": "India", "state": "Punjab", "state_code": "PB", "place": "Jalandhar", "district": "Jalandhar", "latitude": 31.3260, "longitude": 75.5762},
    {"country": "India", "state": "Punjab", "state_code": "PB", "place": "Patiala", "district": "Patiala", "latitude": 30.3398, "longitude": 76.3869},
    {"country": "India", "state": "Punjab", "state_code": "PB", "place": "Bathinda", "district": "Bathinda", "latitude": 30.2110, "longitude": 74.9455},
    {"country": "India", "state": "Punjab", "state_code": "PB", "place": "Mohali", "district": "SAS Nagar", "latitude": 30.7046, "longitude": 76.7179},
    {"country": "India", "state": "Punjab", "state_code": "PB", "place": "Hoshiarpur", "district": "Hoshiarpur", "latitude": 31.5300, "longitude": 75.9200},
    {"country": "India", "state": "Punjab", "state_code": "PB", "place": "Pathankot", "district": "Pathankot", "latitude": 32.2689, "longitude": 75.6499},
    {"country": "India", "state": "Punjab", "state_code": "PB", "place": "Moga", "district": "Moga", "latitude": 30.8230, "longitude": 75.1734},

    # =========================================================================
    # RAJASTHAN (RJ)
    # =========================================================================
    {"country": "India", "state": "Rajasthan", "state_code": "RJ", "place": "Jaipur", "district": "Jaipur", "latitude": 26.9124, "longitude": 75.7873},
    {"country": "India", "state": "Rajasthan", "state_code": "RJ", "place": "Jodhpur", "district": "Jodhpur", "latitude": 26.2389, "longitude": 73.0243},
    {"country": "India", "state": "Rajasthan", "state_code": "RJ", "place": "Kota", "district": "Kota", "latitude": 25.2138, "longitude": 75.8648},
    {"country": "India", "state": "Rajasthan", "state_code": "RJ", "place": "Bikaner", "district": "Bikaner", "latitude": 28.0229, "longitude": 73.3119},
    {"country": "India", "state": "Rajasthan", "state_code": "RJ", "place": "Ajmer", "district": "Ajmer", "latitude": 26.4499, "longitude": 74.6399},
    {"country": "India", "state": "Rajasthan", "state_code": "RJ", "place": "Udaipur", "district": "Udaipur", "latitude": 24.5854, "longitude": 73.7125},
    {"country": "India", "state": "Rajasthan", "state_code": "RJ", "place": "Bhilwara", "district": "Bhilwara", "latitude": 25.3500, "longitude": 74.6333},
    {"country": "India", "state": "Rajasthan", "state_code": "RJ", "place": "Alwar", "district": "Alwar", "latitude": 27.5530, "longitude": 76.6346},
    {"country": "India", "state": "Rajasthan", "state_code": "RJ", "place": "Sikar", "district": "Sikar", "latitude": 27.6119, "longitude": 75.1398},
    {"country": "India", "state": "Rajasthan", "state_code": "RJ", "place": "Sri Ganganagar", "district": "Sri Ganganagar", "latitude": 29.9038, "longitude": 73.8772},
    {"country": "India", "state": "Rajasthan", "state_code": "RJ", "place": "Bharatpur", "district": "Bharatpur", "latitude": 27.2152, "longitude": 77.5030},
    {"country": "India", "state": "Rajasthan", "state_code": "RJ", "place": "Pali", "district": "Pali", "latitude": 25.7713, "longitude": 73.3234},

    # =========================================================================
    # SIKKIM (SK)
    # =========================================================================
    {"country": "India", "state": "Sikkim", "state_code": "SK", "place": "Gangtok", "district": "East Sikkim", "latitude": 27.3389, "longitude": 88.6065},
    {"country": "India", "state": "Sikkim", "state_code": "SK", "place": "Namchi", "district": "South Sikkim", "latitude": 27.1667, "longitude": 88.3500},
    {"country": "India", "state": "Sikkim", "state_code": "SK", "place": "Geyzing", "district": "West Sikkim", "latitude": 27.2889, "longitude": 88.2361},
    {"country": "India", "state": "Sikkim", "state_code": "SK", "place": "Mangan", "district": "North Sikkim", "latitude": 27.5097, "longitude": 88.5297},
    {"country": "India", "state": "Sikkim", "state_code": "SK", "place": "Ravangla", "district": "South Sikkim", "latitude": 27.3060, "longitude": 88.3630},
    {"country": "India", "state": "Sikkim", "state_code": "SK", "place": "Pelling", "district": "West Sikkim", "latitude": 27.3167, "longitude": 88.2333},

    # =========================================================================
    # TAMIL NADU (TN)
    # =========================================================================
    {"country": "India", "state": "Tamil Nadu", "state_code": "TN", "place": "Chennai", "district": "Chennai", "latitude": 13.0827, "longitude": 80.2707},
    {"country": "India", "state": "Tamil Nadu", "state_code": "TN", "place": "Coimbatore", "district": "Coimbatore", "latitude": 11.0168, "longitude": 76.9558},
    {"country": "India", "state": "Tamil Nadu", "state_code": "TN", "place": "Madurai", "district": "Madurai", "latitude": 9.9252, "longitude": 78.1198},
    {"country": "India", "state": "Tamil Nadu", "state_code": "TN", "place": "Tiruchirappalli", "district": "Tiruchirappalli", "latitude": 10.7905, "longitude": 78.7047},
    {"country": "India", "state": "Tamil Nadu", "state_code": "TN", "place": "Salem", "district": "Salem", "latitude": 11.6643, "longitude": 78.1460},
    {"country": "India", "state": "Tamil Nadu", "state_code": "TN", "place": "Tirunelveli", "district": "Tirunelveli", "latitude": 8.7139, "longitude": 77.7567},
    {"country": "India", "state": "Tamil Nadu", "state_code": "TN", "place": "Tiruppur", "district": "Tiruppur", "latitude": 11.1085, "longitude": 77.3411},
    {"country": "India", "state": "Tamil Nadu", "state_code": "TN", "place": "Vellore", "district": "Vellore", "latitude": 12.9165, "longitude": 79.1325},
    {"country": "India", "state": "Tamil Nadu", "state_code": "TN", "place": "Erode", "district": "Erode", "latitude": 11.3410, "longitude": 77.7172},
    {"country": "India", "state": "Tamil Nadu", "state_code": "TN", "place": "Thoothukudi", "district": "Thoothukudi", "latitude": 8.7642, "longitude": 78.1348},
    {"country": "India", "state": "Tamil Nadu", "state_code": "TN", "place": "Dindigul", "district": "Dindigul", "latitude": 10.3673, "longitude": 77.9803},
    {"country": "India", "state": "Tamil Nadu", "state_code": "TN", "place": "Thanjavur", "district": "Thanjavur", "latitude": 10.7870, "longitude": 79.1378},
    {"country": "India", "state": "Tamil Nadu", "state_code": "TN", "place": "Ranipet", "district": "Ranipet", "latitude": 12.9272, "longitude": 79.3331},
    {"country": "India", "state": "Tamil Nadu", "state_code": "TN", "place": "Nagercoil", "district": "Kanyakumari", "latitude": 8.1833, "longitude": 77.4119},
    {"country": "India", "state": "Tamil Nadu", "state_code": "TN", "place": "Kanchipuram", "district": "Kanchipuram", "latitude": 12.8342, "longitude": 79.7036},

    # =========================================================================
    # TELANGANA (TG)
    # =========================================================================
    {"country": "India", "state": "Telangana", "state_code": "TG", "place": "Hyderabad", "district": "Hyderabad", "latitude": 17.3850, "longitude": 78.4867},
    {"country": "India", "state": "Telangana", "state_code": "TG", "place": "Warangal", "district": "Hanamkonda", "latitude": 17.9689, "longitude": 79.5941},
    {"country": "India", "state": "Telangana", "state_code": "TG", "place": "Nizamabad", "district": "Nizamabad", "latitude": 18.6725, "longitude": 78.0941},
    {"country": "India", "state": "Telangana", "state_code": "TG", "place": "Karimnagar", "district": "Karimnagar", "latitude": 18.4386, "longitude": 79.1288},
    {"country": "India", "state": "Telangana", "state_code": "TG", "place": "Ramagundam", "district": "Peddapalli", "latitude": 18.7621, "longitude": 79.4754},
    {"country": "India", "state": "Telangana", "state_code": "TG", "place": "Khammam", "district": "Khammam", "latitude": 17.2473, "longitude": 80.1514},
    {"country": "India", "state": "Telangana", "state_code": "TG", "place": "Mahbubnagar", "district": "Mahbubnagar", "latitude": 16.7488, "longitude": 77.9856},
    {"country": "India", "state": "Telangana", "state_code": "TG", "place": "Nalgonda", "district": "Nalgonda", "latitude": 17.0577, "longitude": 79.2684},
    {"country": "India", "state": "Telangana", "state_code": "TG", "place": "Adilabad", "district": "Adilabad", "latitude": 19.6641, "longitude": 78.5320},
    {"country": "India", "state": "Telangana", "state_code": "TG", "place": "Suryapet", "district": "Suryapet", "latitude": 17.1439, "longitude": 79.6239},
    {"country": "India", "state": "Telangana", "state_code": "TG", "place": "Siddipet", "district": "Siddipet", "latitude": 18.1018, "longitude": 78.8520},

    # =========================================================================
    # TRIPURA (TR)
    # =========================================================================
    {"country": "India", "state": "Tripura", "state_code": "TR", "place": "Agartala", "district": "West Tripura", "latitude": 23.8315, "longitude": 91.2868},
    {"country": "India", "state": "Tripura", "state_code": "TR", "place": "Dharmanagar", "district": "North Tripura", "latitude": 24.3833, "longitude": 92.1667},
    {"country": "India", "state": "Tripura", "state_code": "TR", "place": "Udaipur", "district": "Gomati", "latitude": 23.5333, "longitude": 91.4833},
    {"country": "India", "state": "Tripura", "state_code": "TR", "place": "Kailashahar", "district": "Unakoti", "latitude": 24.3333, "longitude": 92.0000},
    {"country": "India", "state": "Tripura", "state_code": "TR", "place": "Belonia", "district": "South Tripura", "latitude": 23.2500, "longitude": 91.4500},
    {"country": "India", "state": "Tripura", "state_code": "TR", "place": "Khowai", "district": "Khowai", "latitude": 24.0625, "longitude": 91.6047},
    {"country": "India", "state": "Tripura", "state_code": "TR", "place": "Ambassa", "district": "Dhalai", "latitude": 23.9167, "longitude": 91.8500},

    # =========================================================================
    # UTTAR PRADESH (UP)
    # =========================================================================
    {"country": "India", "state": "Uttar Pradesh", "state_code": "UP", "place": "Lucknow", "district": "Lucknow", "latitude": 26.8467, "longitude": 80.9462},
    {"country": "India", "state": "Uttar Pradesh", "state_code": "UP", "place": "Kanpur", "district": "Kanpur Nagar", "latitude": 26.4499, "longitude": 80.3319},
    {"country": "India", "state": "Uttar Pradesh", "state_code": "UP", "place": "Ghaziabad", "district": "Ghaziabad", "latitude": 28.6692, "longitude": 77.4538},
    {"country": "India", "state": "Uttar Pradesh", "state_code": "UP", "place": "Agra", "district": "Agra", "latitude": 27.1767, "longitude": 78.0081},
    {"country": "India", "state": "Uttar Pradesh", "state_code": "UP", "place": "Meerut", "district": "Meerut", "latitude": 28.9845, "longitude": 77.7064},
    {"country": "India", "state": "Uttar Pradesh", "state_code": "UP", "place": "Varanasi", "district": "Varanasi", "latitude": 25.3176, "longitude": 82.9739},
    {"country": "India", "state": "Uttar Pradesh", "state_code": "UP", "place": "Prayagraj", "district": "Prayagraj", "latitude": 25.4358, "longitude": 81.8463},
    {"country": "India", "state": "Uttar Pradesh", "state_code": "UP", "place": "Bareilly", "district": "Bareilly", "latitude": 28.3670, "longitude": 79.4304},
    {"country": "India", "state": "Uttar Pradesh", "state_code": "UP", "place": "Aligarh", "district": "Aligarh", "latitude": 27.8974, "longitude": 78.0880},
    {"country": "India", "state": "Uttar Pradesh", "state_code": "UP", "place": "Moradabad", "district": "Moradabad", "latitude": 28.8356, "longitude": 78.7747},
    {"country": "India", "state": "Uttar Pradesh", "state_code": "UP", "place": "Saharanpur", "district": "Saharanpur", "latitude": 29.9680, "longitude": 77.5452},
    {"country": "India", "state": "Uttar Pradesh", "state_code": "UP", "place": "Gorakhpur", "district": "Gorakhpur", "latitude": 26.7606, "longitude": 83.3732},
    {"country": "India", "state": "Uttar Pradesh", "state_code": "UP", "place": "Noida", "district": "Gautam Buddha Nagar", "latitude": 28.5355, "longitude": 77.3910},
    {"country": "India", "state": "Uttar Pradesh", "state_code": "UP", "place": "Firozabad", "district": "Firozabad", "latitude": 27.1597, "longitude": 78.3957},
    {"country": "India", "state": "Uttar Pradesh", "state_code": "UP", "place": "Jhansi", "district": "Jhansi", "latitude": 25.4484, "longitude": 78.5685},
    {"country": "India", "state": "Uttar Pradesh", "state_code": "UP", "place": "Mathura", "district": "Mathura", "latitude": 27.4924, "longitude": 77.6737},
    {"country": "India", "state": "Uttar Pradesh", "state_code": "UP", "place": "Ayodhya", "district": "Ayodhya", "latitude": 26.7922, "longitude": 82.1998},

    # =========================================================================
    # UTTARAKHAND (UK)
    # =========================================================================
    {"country": "India", "state": "Uttarakhand", "state_code": "UK", "place": "Dehradun", "district": "Dehradun", "latitude": 30.3165, "longitude": 78.0322},
    {"country": "India", "state": "Uttarakhand", "state_code": "UK", "place": "Haridwar", "district": "Haridwar", "latitude": 29.9457, "longitude": 78.1642},
    {"country": "India", "state": "Uttarakhand", "state_code": "UK", "place": "Roorkee", "district": "Haridwar", "latitude": 29.8543, "longitude": 77.8880},
    {"country": "India", "state": "Uttarakhand", "state_code": "UK", "place": "Haldwani", "district": "Nainital", "latitude": 29.2183, "longitude": 79.5130},
    {"country": "India", "state": "Uttarakhand", "state_code": "UK", "place": "Rudrapur", "district": "Udham Singh Nagar", "latitude": 28.9800, "longitude": 79.4000},
    {"country": "India", "state": "Uttarakhand", "state_code": "UK", "place": "Kashipur", "district": "Udham Singh Nagar", "latitude": 29.2100, "longitude": 78.9500},
    {"country": "India", "state": "Uttarakhand", "state_code": "UK", "place": "Rishikesh", "district": "Dehradun", "latitude": 30.0869, "longitude": 78.2676},
    {"country": "India", "state": "Uttarakhand", "state_code": "UK", "place": "Nainital", "district": "Nainital", "latitude": 29.3919, "longitude": 79.4542},
    {"country": "India", "state": "Uttarakhand", "state_code": "UK", "place": "Mussoorie", "district": "Dehradun", "latitude": 30.4598, "longitude": 78.0644},
    {"country": "India", "state": "Uttarakhand", "state_code": "UK", "place": "Almora", "district": "Almora", "latitude": 29.5971, "longitude": 79.6591},

    # =========================================================================
    # WEST BENGAL (WB)
    # =========================================================================
    {"country": "India", "state": "West Bengal", "state_code": "WB", "place": "Kolkata", "district": "Kolkata", "latitude": 22.5726, "longitude": 88.3639},
    {"country": "India", "state": "West Bengal", "state_code": "WB", "place": "Howrah", "district": "Howrah", "latitude": 22.5958, "longitude": 88.2636},
    {"country": "India", "state": "West Bengal", "state_code": "WB", "place": "Asansol", "district": "Paschim Bardhaman", "latitude": 23.6739, "longitude": 86.9524},
    {"country": "India", "state": "West Bengal", "state_code": "WB", "place": "Siliguri", "district": "Darjeeling", "latitude": 26.7271, "longitude": 88.3953},
    {"country": "India", "state": "West Bengal", "state_code": "WB", "place": "Durgapur", "district": "Paschim Bardhaman", "latitude": 23.5204, "longitude": 87.3119},
    {"country": "India", "state": "West Bengal", "state_code": "WB", "place": "Bardhaman", "district": "Purba Bardhaman", "latitude": 23.2324, "longitude": 87.8615},
    {"country": "India", "state": "West Bengal", "state_code": "WB", "place": "Malda", "district": "Malda", "latitude": 25.0108, "longitude": 88.1411},
    {"country": "India", "state": "West Bengal", "state_code": "WB", "place": "Baharampur", "district": "Murshidabad", "latitude": 24.0988, "longitude": 88.2685},
    {"country": "India", "state": "West Bengal", "state_code": "WB", "place": "Kharagpur", "district": "Paschim Medinipur", "latitude": 22.3460, "longitude": 87.2320},
    {"country": "India", "state": "West Bengal", "state_code": "WB", "place": "Darjeeling", "district": "Darjeeling", "latitude": 27.0410, "longitude": 88.2663},
    {"country": "India", "state": "West Bengal", "state_code": "WB", "place": "Jalpaiguri", "district": "Jalpaiguri", "latitude": 26.5414, "longitude": 88.7196},

    # =========================================================================
    # ANDAMAN & NICOBAR ISLANDS (AN) - UT
    # =========================================================================
    {"country": "India", "state": "Andaman & Nicobar Islands", "state_code": "AN", "place": "Port Blair", "district": "South Andaman", "latitude": 11.6234, "longitude": 92.7265},
    {"country": "India", "state": "Andaman & Nicobar Islands", "state_code": "AN", "place": "Diglipur", "district": "North & Middle Andaman", "latitude": 13.2667, "longitude": 92.9833},
    {"country": "India", "state": "Andaman & Nicobar Islands", "state_code": "AN", "place": "Havelock Island", "district": "South Andaman", "latitude": 12.0167, "longitude": 92.9833},
    {"country": "India", "state": "Andaman & Nicobar Islands", "state_code": "AN", "place": "Car Nicobar", "district": "Nicobar", "latitude": 9.1667, "longitude": 92.7667},
    {"country": "India", "state": "Andaman & Nicobar Islands", "state_code": "AN", "place": "Mayabunder", "district": "North & Middle Andaman", "latitude": 12.9250, "longitude": 92.9300},

    # =========================================================================
    # CHANDIGARH (CH) - UT
    # =========================================================================
    {"country": "India", "state": "Chandigarh", "state_code": "CH", "place": "Chandigarh", "district": "Chandigarh", "latitude": 30.7333, "longitude": 76.7794},

    # =========================================================================
    # DADRA & NAGAR HAVELI AND DAMAN & DIU (DN) - UT
    # =========================================================================
    {"country": "India", "state": "Dadra & Nagar Haveli and Daman & Diu", "state_code": "DN", "place": "Daman", "district": "Daman", "latitude": 20.4283, "longitude": 72.8397},
    {"country": "India", "state": "Dadra & Nagar Haveli and Daman & Diu", "state_code": "DN", "place": "Diu", "district": "Diu", "latitude": 20.7144, "longitude": 70.9874},
    {"country": "India", "state": "Dadra & Nagar Haveli and Daman & Diu", "state_code": "DN", "place": "Silvassa", "district": "Dadra and Nagar Haveli", "latitude": 20.2763, "longitude": 73.0083},

    # =========================================================================
    # DELHI (DL) - NCT UT
    # =========================================================================
    {"country": "India", "state": "Delhi", "state_code": "DL", "place": "New Delhi", "district": "New Delhi", "latitude": 28.6139, "longitude": 77.2090},
    {"country": "India", "state": "Delhi", "state_code": "DL", "place": "Central Delhi", "district": "Central Delhi", "latitude": 28.6450, "longitude": 77.2167},
    {"country": "India", "state": "Delhi", "state_code": "DL", "place": "South Delhi", "district": "South Delhi", "latitude": 28.5200, "longitude": 77.2100},
    {"country": "India", "state": "Delhi", "state_code": "DL", "place": "North Delhi", "district": "North Delhi", "latitude": 28.7000, "longitude": 77.1700},
    {"country": "India", "state": "Delhi", "state_code": "DL", "place": "West Delhi", "district": "West Delhi", "latitude": 28.6667, "longitude": 77.0667},
    {"country": "India", "state": "Delhi", "state_code": "DL", "place": "East Delhi", "district": "East Delhi", "latitude": 28.6280, "longitude": 77.2950},
    {"country": "India", "state": "Delhi", "state_code": "DL", "place": "Dwarka", "district": "South West Delhi", "latitude": 28.5921, "longitude": 77.0460},
    {"country": "India", "state": "Delhi", "state_code": "DL", "place": "Rohini", "district": "North West Delhi", "latitude": 28.7166, "longitude": 77.1166},

    # =========================================================================
    # JAMMU & KASHMIR (JK) - UT
    # =========================================================================
    {"country": "India", "state": "Jammu & Kashmir", "state_code": "JK", "place": "Srinagar", "district": "Srinagar", "latitude": 34.0837, "longitude": 74.7973},
    {"country": "India", "state": "Jammu & Kashmir", "state_code": "JK", "place": "Jammu", "district": "Jammu", "latitude": 32.7266, "longitude": 74.8570},
    {"country": "India", "state": "Jammu & Kashmir", "state_code": "JK", "place": "Anantnag", "district": "Anantnag", "latitude": 33.7311, "longitude": 75.1522},
    {"country": "India", "state": "Jammu & Kashmir", "state_code": "JK", "place": "Baramulla", "district": "Baramulla", "latitude": 34.2090, "longitude": 74.3436},
    {"country": "India", "state": "Jammu & Kashmir", "state_code": "JK", "place": "Udhampur", "district": "Udhampur", "latitude": 32.9258, "longitude": 75.1416},
    {"country": "India", "state": "Jammu & Kashmir", "state_code": "JK", "place": "Katra", "district": "Reasi", "latitude": 32.9916, "longitude": 74.9318},
    {"country": "India", "state": "Jammu & Kashmir", "state_code": "JK", "place": "Sopore", "district": "Baramulla", "latitude": 34.2967, "longitude": 74.4722},

    # =========================================================================
    # LADAKH (LA) - UT
    # =========================================================================
    {"country": "India", "state": "Ladakh", "state_code": "LA", "place": "Leh", "district": "Leh", "latitude": 34.1526, "longitude": 77.5771},
    {"country": "India", "state": "Ladakh", "state_code": "LA", "place": "Kargil", "district": "Kargil", "latitude": 34.5539, "longitude": 76.1349},
    {"country": "India", "state": "Ladakh", "state_code": "LA", "place": "Diskit", "district": "Leh", "latitude": 34.5428, "longitude": 77.5583},
    {"country": "India", "state": "Ladakh", "state_code": "LA", "place": "Dras", "district": "Kargil", "latitude": 34.4294, "longitude": 75.7547},

    # =========================================================================
    # LAKSHADWEEP (LD) - UT
    # =========================================================================
    {"country": "India", "state": "Lakshadweep", "state_code": "LD", "place": "Kavaratti", "district": "Lakshadweep", "latitude": 10.5667, "longitude": 72.6417},
    {"country": "India", "state": "Lakshadweep", "state_code": "LD", "place": "Agatti", "district": "Lakshadweep", "latitude": 10.8533, "longitude": 72.1931},
    {"country": "India", "state": "Lakshadweep", "state_code": "LD", "place": "Amini", "district": "Lakshadweep", "latitude": 11.1228, "longitude": 72.7317},
    {"country": "India", "state": "Lakshadweep", "state_code": "LD", "place": "Andrott", "district": "Lakshadweep", "latitude": 10.8219, "longitude": 73.6797},
    {"country": "India", "state": "Lakshadweep", "state_code": "LD", "place": "Minicoy", "district": "Lakshadweep", "latitude": 8.2747, "longitude": 73.0489},

    # =========================================================================
    # PUDUCHERRY (PY) - UT
    # =========================================================================
    {"country": "India", "state": "Puducherry", "state_code": "PY", "place": "Puducherry", "district": "Puducherry", "latitude": 11.9416, "longitude": 79.8083},
    {"country": "India", "state": "Puducherry", "state_code": "PY", "place": "Karaikal", "district": "Karaikal", "latitude": 10.9254, "longitude": 79.8380},
    {"country": "India", "state": "Puducherry", "state_code": "PY", "place": "Mahe", "district": "Mahe", "latitude": 11.7002, "longitude": 75.5340},
    {"country": "India", "state": "Puducherry", "state_code": "PY", "place": "Yanam", "district": "Yanam", "latitude": 16.7330, "longitude": 82.2170},
]


def get_all_states() -> List[Dict[str, Any]]:
    """
    Returns unique sorted list of all Indian States and Union Territories.
    Each item contains state name, state code, and place count.
    """
    seen = {}
    for loc in INDIAN_LOCATIONS:
        st = loc["state"]
        if st not in seen:
            seen[st] = {
                "state": st,
                "state_code": loc["state_code"],
                "country": "India",
                "place_count": 1
            }
        else:
            seen[st]["place_count"] += 1

    return sorted(list(seen.values()), key=lambda x: x["state"])


def get_places_by_state(state_name: str) -> List[Dict[str, Any]]:
    """
    Returns only the places/cities belonging to the selected Indian state or UT.
    Guarantees strict isolation (e.g. Karnataka places NEVER show when Andhra Pradesh is selected).
    """
    target = (state_name or "").strip().lower()
    if not target:
        return []

    # Direct match or alias match
    matches = [
        loc for loc in INDIAN_LOCATIONS
        if loc["state"].lower() == target or loc["state_code"].lower() == target
    ]

    # Handle common alias names like Delhi vs NCT of Delhi
    if not matches and "delhi" in target:
        matches = [loc for loc in INDIAN_LOCATIONS if loc["state"] == "Delhi"]

    return sorted(matches, key=lambda x: x["place"])


def search_indian_locations(query: str, limit: int = 15) -> List[Dict[str, Any]]:
    """
    Searches across Indian locations by place name, district, or state.
    Provides clear context (State / District) to disambiguate identical or similar place names.
    """
    q = (query or "").strip().lower()
    if not q:
        return []

    results = []
    # Exact or prefix place match gets top priority
    for loc in INDIAN_LOCATIONS:
        p_lower = loc["place"].lower()
        d_lower = (loc.get("district") or "").lower()
        s_lower = loc["state"].lower()

        is_place_prefix = p_lower.startswith(q)
        is_place_sub = q in p_lower
        is_dist_match = q in d_lower
        is_state_match = q in s_lower

        if is_place_prefix or is_place_sub or is_dist_match or is_state_match:
            score = 3 if is_place_prefix else (2 if is_place_sub else 1)
            dist_text = f", {loc['district']}" if loc.get("district") else ""
            display_name = f"{loc['place']}{dist_text}, {loc['state']}, India"
            
            item = dict(loc)
            item["display_name"] = display_name
            item["match_score"] = score
            results.append(item)

    # Sort by match score descending, then place name
    results.sort(key=lambda x: (-x["match_score"], x["place"]))
    return results[:limit]


def get_location_by_place_and_state(place: str, state: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """
    Looks up exact location object by place name and optional state name.
    """
    p_clean = (place or "").strip().lower()
    s_clean = (state or "").strip().lower() if state else None

    # First attempt: match both place and state
    if s_clean:
        for loc in INDIAN_LOCATIONS:
            if loc["place"].lower() == p_clean and (
                loc["state"].lower() == s_clean or loc["state_code"].lower() == s_clean
            ):
                return loc

    # Second attempt: match place directly
    for loc in INDIAN_LOCATIONS:
        if loc["place"].lower() == p_clean:
            return loc

    # Third attempt: substring match
    for loc in INDIAN_LOCATIONS:
        if p_clean in loc["place"].lower():
            return loc

    # Fourth attempt: match state name or state code directly
    for loc in INDIAN_LOCATIONS:
        if loc["state"].lower() == p_clean or loc["state_code"].lower() == p_clean:
            return loc

    return None


def get_full_hierarchy() -> Dict[str, List[Dict[str, Any]]]:
    """
    Returns complete hierarchical mapping: State -> List[Places].
    """
    hierarchy: Dict[str, List[Dict[str, Any]]] = {}
    for loc in INDIAN_LOCATIONS:
        st = loc["state"]
        if st not in hierarchy:
            hierarchy[st] = []
        hierarchy[st].append(loc)

    for st in hierarchy:
        hierarchy[st].sort(key=lambda x: x["place"])

    return hierarchy
