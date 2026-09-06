export interface CountryData {
  name: string;
  code: string; // ISO Alpha-2 (e.g. 'US', 'IN', 'BW')
  iso3: string; // ISO Alpha-3 (e.g. 'USA', 'IND', 'BWA')
  flag: string;
  region: 'North America' | 'Europe' | 'Asia-Pacific' | 'Africa' | 'Latin America' | 'Middle East' | 'Oceania';
  initial: string; // 'A', 'B', 'C', etc.
  aliases: string[];
  tier: 1 | 2 | 3;
  dialCode: string;
  cities: string[];
  locale: string;
  languages: string;
  sampleIpPrefixes: string[];
}

export const COUNTRIES_DATABASE: CountryData[] = [
  // --- A ---
  {
    name: 'Argentina',
    code: 'AR',
    iso3: 'ARG',
    flag: '🇦🇷',
    region: 'Latin America',
    initial: 'A',
    aliases: ['ARG', 'Argentina'],
    tier: 2,
    dialCode: '+54',
    cities: ['Buenos Aires', 'Córdoba', 'Rosario'],
    locale: 'es-ar',
    languages: 'es-AR,es;q=0.9,en;q=0.8',
    sampleIpPrefixes: ['181.44.', '190.183.']
  },
  {
    name: 'Australia',
    code: 'AU',
    iso3: 'AUS',
    flag: '🇦🇺',
    region: 'Oceania',
    initial: 'A',
    aliases: ['AUS', 'Australia', 'Oz'],
    tier: 1,
    dialCode: '+61',
    cities: ['Sydney', 'Melbourne', 'Brisbane', 'Perth'],
    locale: 'en-au',
    languages: 'en-AU,en-GB;q=0.9,en;q=0.8',
    sampleIpPrefixes: ['139.130.', '1.120.', '203.217.']
  },
  {
    name: 'Austria',
    code: 'AT',
    iso3: 'AUT',
    flag: '🇦🇹',
    region: 'Europe',
    initial: 'A',
    aliases: ['AUT', 'Austria', 'Österreich'],
    tier: 1,
    dialCode: '+43',
    cities: ['Vienna', 'Graz', 'Salzburg', 'Innsbruck'],
    locale: 'de-at',
    languages: 'de-AT,de;q=0.9,en;q=0.8',
    sampleIpPrefixes: ['193.170.', '80.120.']
  },

  // --- B ---
  {
    name: 'Bangladesh',
    code: 'BD',
    iso3: 'BGD',
    flag: '🇧🇩',
    region: 'Asia-Pacific',
    initial: 'B',
    aliases: ['BGD', 'Bangladesh', 'BD'],
    tier: 3,
    dialCode: '+880',
    cities: ['Dhaka', 'Chittagong', 'Sylhet'],
    locale: 'bn-bd',
    languages: 'bn-BD,bn;q=0.9,en;q=0.8',
    sampleIpPrefixes: ['103.205.', '118.179.']
  },
  {
    name: 'Belgium',
    code: 'BE',
    iso3: 'BEL',
    flag: '🇧🇪',
    region: 'Europe',
    initial: 'B',
    aliases: ['BEL', 'Belgium', 'Belgique', 'België'],
    tier: 1,
    dialCode: '+32',
    cities: ['Brussels', 'Antwerp', 'Ghent', 'Bruges'],
    locale: 'nl-be',
    languages: 'nl-BE,fr-BE;q=0.9,en;q=0.8',
    sampleIpPrefixes: ['193.190.', '81.246.']
  },
  {
    name: 'Botswana',
    code: 'BW',
    iso3: 'BWA',
    flag: '🇧🇼',
    region: 'Africa',
    initial: 'B',
    aliases: ['BWA', 'BW', 'Botswana', 'WebZone Hub', 'Gaborone'],
    tier: 2,
    dialCode: '+267',
    cities: ['Gaborone', 'Francistown', 'Maun', 'Kasane', 'Palapye'],
    locale: 'en-bw',
    languages: 'en-BW,en;q=0.9,tn;q=0.8',
    sampleIpPrefixes: ['102.134.', '168.167.', '197.242.']
  },
  {
    name: 'Brazil',
    code: 'BR',
    iso3: 'BRA',
    flag: '🇧🇷',
    region: 'Latin America',
    initial: 'B',
    aliases: ['BRA', 'Brazil', 'Brasil', 'BR'],
    tier: 2,
    dialCode: '+55',
    cities: ['São Paulo', 'Rio de Janeiro', 'Brasília', 'Curitiba'],
    locale: 'pt-br',
    languages: 'pt-BR,pt;q=0.9,en;q=0.8',
    sampleIpPrefixes: ['177.18.', '189.120.', '201.55.']
  },

  // --- C ---
  {
    name: 'Canada',
    code: 'CA',
    iso3: 'CAN',
    flag: '🇨🇦',
    region: 'North America',
    initial: 'C',
    aliases: ['CAN', 'Canada', 'CA'],
    tier: 1,
    dialCode: '+1',
    cities: ['Toronto', 'Vancouver', 'Montreal', 'Calgary', 'Ottawa'],
    locale: 'en-ca',
    languages: 'en-CA,en-US;q=0.9,fr-CA;q=0.8',
    sampleIpPrefixes: ['142.112.', '24.225.', '99.230.', '199.19.']
  },
  {
    name: 'Chile',
    code: 'CL',
    iso3: 'CHL',
    flag: '🇨🇱',
    region: 'Latin America',
    initial: 'C',
    aliases: ['CHL', 'Chile', 'CL'],
    tier: 2,
    dialCode: '+56',
    cities: ['Santiago', 'Valparaíso', 'Concepción'],
    locale: 'es-cl',
    languages: 'es-CL,es;q=0.9,en;q=0.8',
    sampleIpPrefixes: ['190.160.', '200.89.']
  },
  {
    name: 'China',
    code: 'CN',
    iso3: 'CHN',
    flag: '🇨🇳',
    region: 'Asia-Pacific',
    initial: 'C',
    aliases: ['CHN', 'China', 'CN', 'PRC'],
    tier: 2,
    dialCode: '+86',
    cities: ['Shanghai', 'Beijing', 'Shenzhen', 'Guangzhou'],
    locale: 'zh-cn',
    languages: 'zh-CN,zh;q=0.9,en;q=0.8',
    sampleIpPrefixes: ['116.228.', '202.108.']
  },
  {
    name: 'Colombia',
    code: 'CO',
    iso3: 'COL',
    flag: '🇨🇴',
    region: 'Latin America',
    initial: 'C',
    aliases: ['COL', 'Colombia', 'CO'],
    tier: 2,
    dialCode: '+57',
    cities: ['Bogotá', 'Medellín', 'Cali'],
    locale: 'es-co',
    languages: 'es-CO,es;q=0.9,en;q=0.8',
    sampleIpPrefixes: ['181.128.', '190.248.']
  },
  {
    name: 'Czech Republic',
    code: 'CZ',
    iso3: 'CZE',
    flag: '🇨🇿',
    region: 'Europe',
    initial: 'C',
    aliases: ['CZE', 'Czechia', 'Czech Republic', 'CZ'],
    tier: 2,
    dialCode: '+420',
    cities: ['Prague', 'Brno', 'Ostrava'],
    locale: 'cs-cz',
    languages: 'cs-CZ,cs;q=0.9,en;q=0.8',
    sampleIpPrefixes: ['195.113.', '89.176.']
  },

  // --- D ---
  {
    name: 'Denmark',
    code: 'DK',
    iso3: 'DNK',
    flag: '🇩🇰',
    region: 'Europe',
    initial: 'D',
    aliases: ['DNK', 'Denmark', 'Danmark', 'DK'],
    tier: 1,
    dialCode: '+45',
    cities: ['Copenhagen', 'Aarhus', 'Odense'],
    locale: 'da-dk',
    languages: 'da-DK,da;q=0.9,en;q=0.8',
    sampleIpPrefixes: ['194.255.', '87.60.']
  },

  // --- E ---
  {
    name: 'Egypt',
    code: 'EG',
    iso3: 'EGY',
    flag: '🇪🇬',
    region: 'Africa',
    initial: 'E',
    aliases: ['EGY', 'Egypt', 'EG'],
    tier: 3,
    dialCode: '+20',
    cities: ['Cairo', 'Alexandria', 'Giza'],
    locale: 'ar-eg',
    languages: 'ar-EG,ar;q=0.9,en;q=0.8',
    sampleIpPrefixes: ['156.200.', '197.38.']
  },

  // --- F ---
  {
    name: 'Finland',
    code: 'FI',
    iso3: 'FIN',
    flag: '🇫🇮',
    region: 'Europe',
    initial: 'F',
    aliases: ['FIN', 'Finland', 'Suomi', 'FI'],
    tier: 1,
    dialCode: '+358',
    cities: ['Helsinki', 'Espoo', 'Tampere'],
    locale: 'fi-fi',
    languages: 'fi-FI,fi;q=0.9,en;q=0.8',
    sampleIpPrefixes: ['193.166.', '88.195.']
  },
  {
    name: 'France',
    code: 'FR',
    iso3: 'FRA',
    flag: '🇫🇷',
    region: 'Europe',
    initial: 'F',
    aliases: ['FRA', 'France', 'FR'],
    tier: 1,
    dialCode: '+33',
    cities: ['Paris', 'Marseille', 'Lyon', 'Toulouse'],
    locale: 'fr-fr',
    languages: 'fr-FR,fr;q=0.9,en;q=0.8',
    sampleIpPrefixes: ['193.51.', '90.84.', '82.64.']
  },

  // --- G ---
  {
    name: 'Germany',
    code: 'DE',
    iso3: 'DEU',
    flag: '🇩🇪',
    region: 'Europe',
    initial: 'G',
    aliases: ['DEU', 'DE', 'Germany', 'Deutschland', 'GER'],
    tier: 1,
    dialCode: '+49',
    cities: ['Berlin', 'Munich', 'Frankfurt', 'Hamburg', 'Cologne'],
    locale: 'de-de',
    languages: 'de-DE,de;q=0.9,en;q=0.8',
    sampleIpPrefixes: ['85.214.', '91.64.', '178.63.', '194.95.']
  },
  {
    name: 'Ghana',
    code: 'GH',
    iso3: 'GHA',
    flag: '🇬🇭',
    region: 'Africa',
    initial: 'G',
    aliases: ['GHA', 'Ghana', 'GH'],
    tier: 3,
    dialCode: '+233',
    cities: ['Accra', 'Kumasi', 'Tamale'],
    locale: 'en-gh',
    languages: 'en-GH,en;q=0.9',
    sampleIpPrefixes: ['154.160.', '197.251.']
  },
  {
    name: 'Greece',
    code: 'GR',
    iso3: 'GRC',
    flag: '🇬🇷',
    region: 'Europe',
    initial: 'G',
    aliases: ['GRC', 'Greece', 'Hellas', 'GR'],
    tier: 2,
    dialCode: '+30',
    cities: ['Athens', 'Thessaloniki', 'Patras'],
    locale: 'el-gr',
    languages: 'el-GR,el;q=0.9,en;q=0.8',
    sampleIpPrefixes: ['195.134.', '79.166.']
  },

  // --- H ---
  {
    name: 'Hong Kong',
    code: 'HK',
    iso3: 'HKG',
    flag: '🇭🇰',
    region: 'Asia-Pacific',
    initial: 'H',
    aliases: ['HKG', 'Hong Kong', 'HK'],
    tier: 1,
    dialCode: '+852',
    cities: ['Hong Kong', 'Kowloon'],
    locale: 'zh-hk',
    languages: 'zh-HK,zh;q=0.9,en-US;q=0.8',
    sampleIpPrefixes: ['202.175.', '119.236.']
  },

  // --- I ---
  {
    name: 'India',
    code: 'IN',
    iso3: 'IND',
    flag: '🇮🇳',
    region: 'Asia-Pacific',
    initial: 'I',
    aliases: ['IND', 'IN', 'India', 'Bharat', 'Hindustan'],
    tier: 2,
    dialCode: '+91',
    cities: ['Mumbai', 'Bengaluru', 'Delhi', 'Hyderabad', 'Pune', 'Chennai', 'Kolkata'],
    locale: 'en-in',
    languages: 'en-IN,en;q=0.9,hi;q=0.8',
    sampleIpPrefixes: ['103.21.', '49.207.', '157.34.', '106.51.', '122.160.']
  },
  {
    name: 'Indonesia',
    code: 'ID',
    iso3: 'IDN',
    flag: '🇮🇩',
    region: 'Asia-Pacific',
    initial: 'I',
    aliases: ['IDN', 'Indonesia', 'ID'],
    tier: 3,
    dialCode: '+62',
    cities: ['Jakarta', 'Surabaya', 'Bandung', 'Bali'],
    locale: 'id-id',
    languages: 'id-ID,id;q=0.9,en;q=0.8',
    sampleIpPrefixes: ['180.252.', '114.124.']
  },
  {
    name: 'Ireland',
    code: 'IE',
    iso3: 'IRL',
    flag: '🇮🇪',
    region: 'Europe',
    initial: 'I',
    aliases: ['IRL', 'Ireland', 'Éire', 'IE'],
    tier: 1,
    dialCode: '+353',
    cities: ['Dublin', 'Cork', 'Galway', 'Limerick'],
    locale: 'en-ie',
    languages: 'en-IE,en;q=0.9,ga;q=0.8',
    sampleIpPrefixes: ['193.120.', '89.100.']
  },
  {
    name: 'Israel',
    code: 'IL',
    iso3: 'ISR',
    flag: '🇮🇱',
    region: 'Middle East',
    initial: 'I',
    aliases: ['ISR', 'Israel', 'IL'],
    tier: 1,
    dialCode: '+972',
    cities: ['Tel Aviv', 'Jerusalem', 'Haifa'],
    locale: 'he-il',
    languages: 'he-IL,he;q=0.9,en;q=0.8',
    sampleIpPrefixes: ['192.114.', '84.108.']
  },
  {
    name: 'Italy',
    code: 'IT',
    iso3: 'ITA',
    flag: '🇮🇹',
    region: 'Europe',
    initial: 'I',
    aliases: ['ITA', 'Italy', 'Italia', 'IT'],
    tier: 1,
    dialCode: '+39',
    cities: ['Rome', 'Milan', 'Naples', 'Turin'],
    locale: 'it-it',
    languages: 'it-IT,it;q=0.9,en;q=0.8',
    sampleIpPrefixes: ['193.204.', '151.48.']
  },

  // --- J ---
  {
    name: 'Japan',
    code: 'JP',
    iso3: 'JPN',
    flag: '🇯🇵',
    region: 'Asia-Pacific',
    initial: 'J',
    aliases: ['JPN', 'Japan', 'Nippon', 'JP'],
    tier: 1,
    dialCode: '+81',
    cities: ['Tokyo', 'Osaka', 'Nagoya', 'Fukuoka', 'Sapporo'],
    locale: 'ja-jp',
    languages: 'ja-JP,ja;q=0.9,en;q=0.8',
    sampleIpPrefixes: ['133.242.', '150.95.', '160.16.', '210.140.']
  },

  // --- K ---
  {
    name: 'Kenya',
    code: 'KE',
    iso3: 'KEN',
    flag: '🇰🇪',
    region: 'Africa',
    initial: 'K',
    aliases: ['KEN', 'Kenya', 'KE', 'Nairobi'],
    tier: 3,
    dialCode: '+254',
    cities: ['Nairobi', 'Mombasa', 'Kisumu'],
    locale: 'en-ke',
    languages: 'en-KE,sw;q=0.9,en;q=0.8',
    sampleIpPrefixes: ['197.232.', '102.135.']
  },
  {
    name: 'Kuwait',
    code: 'KW',
    iso3: 'KWT',
    flag: '🇰🇼',
    region: 'Middle East',
    initial: 'K',
    aliases: ['KWT', 'Kuwait', 'KW'],
    tier: 1,
    dialCode: '+965',
    cities: ['Kuwait City', 'Hawally'],
    locale: 'ar-kw',
    languages: 'ar-KW,ar;q=0.9,en;q=0.8',
    sampleIpPrefixes: ['62.215.', '188.70.']
  },

  // --- M ---
  {
    name: 'Malaysia',
    code: 'MY',
    iso3: 'MYS',
    flag: '🇲🇾',
    region: 'Asia-Pacific',
    initial: 'M',
    aliases: ['MYS', 'Malaysia', 'MY'],
    tier: 2,
    dialCode: '+60',
    cities: ['Kuala Lumpur', 'Penang', 'Johor Bahru'],
    locale: 'ms-my',
    languages: 'ms-MY,en-MY;q=0.9,en;q=0.8',
    sampleIpPrefixes: ['175.143.', '115.132.']
  },
  {
    name: 'Mexico',
    code: 'MX',
    iso3: 'MEX',
    flag: '🇲🇽',
    region: 'Latin America',
    initial: 'M',
    aliases: ['MEX', 'Mexico', 'México', 'MX'],
    tier: 2,
    dialCode: '+52',
    cities: ['Mexico City', 'Guadalajara', 'Monterrey'],
    locale: 'es-mx',
    languages: 'es-MX,es;q=0.9,en;q=0.8',
    sampleIpPrefixes: ['189.200.', '201.140.']
  },
  {
    name: 'Morocco',
    code: 'MA',
    iso3: 'MAR',
    flag: '🇲🇦',
    region: 'Africa',
    initial: 'M',
    aliases: ['MAR', 'Morocco', 'Maroc', 'MA'],
    tier: 3,
    dialCode: '+212',
    cities: ['Casablanca', 'Rabat', 'Marrakech'],
    locale: 'ar-ma',
    languages: 'ar-MA,fr;q=0.9,ar;q=0.8',
    sampleIpPrefixes: ['196.200.', '105.154.']
  },

  // --- N ---
  {
    name: 'Netherlands',
    code: 'NL',
    iso3: 'NLD',
    flag: '🇳🇱',
    region: 'Europe',
    initial: 'N',
    aliases: ['NLD', 'Netherlands', 'Holland', 'Nederland', 'NL'],
    tier: 1,
    dialCode: '+31',
    cities: ['Amsterdam', 'Rotterdam', 'The Hague', 'Utrecht'],
    locale: 'nl-nl',
    languages: 'nl-NL,nl;q=0.9,en;q=0.8',
    sampleIpPrefixes: ['145.220.', '82.161.']
  },
  {
    name: 'New Zealand',
    code: 'NZ',
    iso3: 'NZL',
    flag: '🇳🇿',
    region: 'Oceania',
    initial: 'N',
    aliases: ['NZL', 'New Zealand', 'Aotearoa', 'NZ'],
    tier: 1,
    dialCode: '+64',
    cities: ['Auckland', 'Wellington', 'Christchurch'],
    locale: 'en-nz',
    languages: 'en-NZ,en;q=0.9',
    sampleIpPrefixes: ['122.56.', '202.89.']
  },
  {
    name: 'Nigeria',
    code: 'NG',
    iso3: 'NGA',
    flag: '🇳🇬',
    region: 'Africa',
    initial: 'N',
    aliases: ['NGA', 'Nigeria', 'NG', 'Lagos'],
    tier: 3,
    dialCode: '+234',
    cities: ['Lagos', 'Abuja', 'Port Harcourt', 'Ibadan'],
    locale: 'en-ng',
    languages: 'en-NG,en;q=0.9',
    sampleIpPrefixes: ['102.89.', '197.210.']
  },
  {
    name: 'Norway',
    code: 'NO',
    iso3: 'NOR',
    flag: '🇳🇴',
    region: 'Europe',
    initial: 'N',
    aliases: ['NOR', 'Norway', 'Norge', 'NO'],
    tier: 1,
    dialCode: '+47',
    cities: ['Oslo', 'Bergen', 'Trondheim'],
    locale: 'no-no',
    languages: 'no-NO,no;q=0.9,en;q=0.8',
    sampleIpPrefixes: ['193.156.', '84.212.']
  },

  // --- P ---
  {
    name: 'Pakistan',
    code: 'PK',
    iso3: 'PAK',
    flag: '🇵🇰',
    region: 'Asia-Pacific',
    initial: 'P',
    aliases: ['PAK', 'Pakistan', 'PK'],
    tier: 3,
    dialCode: '+92',
    cities: ['Karachi', 'Lahore', 'Islamabad'],
    locale: 'ur-pk',
    languages: 'ur-PK,en;q=0.9,ur;q=0.8',
    sampleIpPrefixes: ['110.39.', '182.185.']
  },
  {
    name: 'Peru',
    code: 'PE',
    iso3: 'PER',
    flag: '🇵🇪',
    region: 'Latin America',
    initial: 'P',
    aliases: ['PER', 'Peru', 'Perú', 'PE'],
    tier: 2,
    dialCode: '+51',
    cities: ['Lima', 'Arequipa', 'Cusco'],
    locale: 'es-pe',
    languages: 'es-PE,es;q=0.9,en;q=0.8',
    sampleIpPrefixes: ['190.232.', '200.48.']
  },
  {
    name: 'Philippines',
    code: 'PH',
    iso3: 'PHL',
    flag: '🇵🇭',
    region: 'Asia-Pacific',
    initial: 'P',
    aliases: ['PHL', 'Philippines', 'PH', 'Pilipinas'],
    tier: 3,
    dialCode: '+63',
    cities: ['Manila', 'Cebu City', 'Davao City'],
    locale: 'en-ph',
    languages: 'en-PH,tl;q=0.9,en;q=0.8',
    sampleIpPrefixes: ['112.198.', '124.104.']
  },
  {
    name: 'Poland',
    code: 'PL',
    iso3: 'POL',
    flag: '🇵🇱',
    region: 'Europe',
    initial: 'P',
    aliases: ['POL', 'Poland', 'Polska', 'PL'],
    tier: 2,
    dialCode: '+48',
    cities: ['Warsaw', 'Kraków', 'Wrocław', 'Gdańsk'],
    locale: 'pl-pl',
    languages: 'pl-PL,pl;q=0.9,en;q=0.8',
    sampleIpPrefixes: ['193.0.', '83.30.']
  },
  {
    name: 'Portugal',
    code: 'PT',
    iso3: 'PRT',
    flag: '🇵🇹',
    region: 'Europe',
    initial: 'P',
    aliases: ['PRT', 'Portugal', 'PT'],
    tier: 2,
    dialCode: '+351',
    cities: ['Lisbon', 'Porto', 'Braga'],
    locale: 'pt-pt',
    languages: 'pt-PT,pt;q=0.9,en;q=0.8',
    sampleIpPrefixes: ['193.136.', '85.240.']
  },

  // --- Q ---
  {
    name: 'Qatar',
    code: 'QA',
    iso3: 'QAT',
    flag: '🇶🇦',
    region: 'Middle East',
    initial: 'Q',
    aliases: ['QAT', 'Qatar', 'QA', 'Doha'],
    tier: 1,
    dialCode: '+974',
    cities: ['Doha', 'Al Rayyan'],
    locale: 'ar-qa',
    languages: 'ar-QA,ar;q=0.9,en;q=0.8',
    sampleIpPrefixes: ['78.100.', '178.152.']
  },

  // --- R ---
  {
    name: 'Romania',
    code: 'RO',
    iso3: 'ROU',
    flag: '🇷🇴',
    region: 'Europe',
    initial: 'R',
    aliases: ['ROU', 'Romania', 'RO'],
    tier: 2,
    dialCode: '+40',
    cities: ['Bucharest', 'Cluj-Napoca', 'Timișoara'],
    locale: 'ro-ro',
    languages: 'ro-RO,ro;q=0.9,en;q=0.8',
    sampleIpPrefixes: ['193.226.', '86.120.']
  },

  // --- S ---
  {
    name: 'Saudi Arabia',
    code: 'SA',
    iso3: 'SAU',
    flag: '🇸🇦',
    region: 'Middle East',
    initial: 'S',
    aliases: ['SAU', 'Saudi Arabia', 'KSA', 'SA', 'Riyadh'],
    tier: 1,
    dialCode: '+966',
    cities: ['Riyadh', 'Jeddah', 'Dammam'],
    locale: 'ar-sa',
    languages: 'ar-SA,ar;q=0.9,en;q=0.8',
    sampleIpPrefixes: ['212.118.', '188.50.']
  },
  {
    name: 'Singapore',
    code: 'SG',
    iso3: 'SGP',
    flag: '🇸🇬',
    region: 'Asia-Pacific',
    initial: 'S',
    aliases: ['SGP', 'Singapore', 'SG'],
    tier: 1,
    dialCode: '+65',
    cities: ['Singapore'],
    locale: 'en-sg',
    languages: 'en-SG,en;q=0.9,zh-SG;q=0.8',
    sampleIpPrefixes: ['103.28.', '118.200.', '202.166.']
  },
  {
    name: 'South Africa',
    code: 'ZA',
    iso3: 'ZAF',
    flag: '🇿🇦',
    region: 'Africa',
    initial: 'S',
    aliases: ['ZAF', 'South Africa', 'RSA', 'ZA', 'Joburg'],
    tier: 2,
    dialCode: '+27',
    cities: ['Johannesburg', 'Cape Town', 'Durban', 'Pretoria'],
    locale: 'en-za',
    languages: 'en-ZA,en;q=0.9,af;q=0.8',
    sampleIpPrefixes: ['102.130.', '105.4.', '196.25.']
  },
  {
    name: 'South Korea',
    code: 'KR',
    iso3: 'KOR',
    flag: '🇰🇷',
    region: 'Asia-Pacific',
    initial: 'S',
    aliases: ['KOR', 'South Korea', 'Korea', 'KR', 'ROK', 'Seoul'],
    tier: 1,
    dialCode: '+82',
    cities: ['Seoul', 'Busan', 'Incheon', 'Daegu'],
    locale: 'ko-kr',
    languages: 'ko-KR,ko;q=0.9,en;q=0.8',
    sampleIpPrefixes: ['175.200.', '211.234.']
  },
  {
    name: 'Spain',
    code: 'ES',
    iso3: 'ESP',
    flag: '🇪🇸',
    region: 'Europe',
    initial: 'S',
    aliases: ['ESP', 'Spain', 'España', 'ES'],
    tier: 1,
    dialCode: '+34',
    cities: ['Madrid', 'Barcelona', 'Valencia', 'Seville'],
    locale: 'es-es',
    languages: 'es-ES,es;q=0.9,en;q=0.8',
    sampleIpPrefixes: ['193.144.', '88.24.']
  },
  {
    name: 'Sweden',
    code: 'SE',
    iso3: 'SWE',
    flag: '🇸🇪',
    region: 'Europe',
    initial: 'S',
    aliases: ['SWE', 'Sweden', 'Sverige', 'SE'],
    tier: 1,
    dialCode: '+46',
    cities: ['Stockholm', 'Gothenburg', 'Malmö'],
    locale: 'sv-se',
    languages: 'sv-SE,sv;q=0.9,en;q=0.8',
    sampleIpPrefixes: ['193.10.', '85.224.']
  },
  {
    name: 'Switzerland',
    code: 'CH',
    iso3: 'CHE',
    flag: '🇨🇭',
    region: 'Europe',
    initial: 'S',
    aliases: ['CHE', 'Switzerland', 'Schweiz', 'Suisse', 'CH'],
    tier: 1,
    dialCode: '+41',
    cities: ['Zurich', 'Geneva', 'Basel', 'Bern'],
    locale: 'de-ch',
    languages: 'de-CH,fr-CH;q=0.9,en;q=0.8',
    sampleIpPrefixes: ['193.134.', '178.192.']
  },

  // --- T ---
  {
    name: 'Taiwan',
    code: 'TW',
    iso3: 'TWN',
    flag: '🇹🇼',
    region: 'Asia-Pacific',
    initial: 'T',
    aliases: ['TWN', 'Taiwan', 'TW', 'Taipei'],
    tier: 1,
    dialCode: '+886',
    cities: ['Taipei', 'Kaohsiung', 'Taichung', 'Tainan'],
    locale: 'zh-tw',
    languages: 'zh-TW,zh;q=0.9,en-US;q=0.8',
    sampleIpPrefixes: ['114.32.', '118.163.', '220.130.']
  },
  {
    name: 'Thailand',
    code: 'TH',
    iso3: 'THA',
    flag: '🇹🇭',
    region: 'Asia-Pacific',
    initial: 'T',
    aliases: ['THA', 'Thailand', 'TH', 'Bangkok'],
    tier: 2,
    dialCode: '+66',
    cities: ['Bangkok', 'Chiang Mai', 'Phuket'],
    locale: 'th-th',
    languages: 'th-TH,th;q=0.9,en;q=0.8',
    sampleIpPrefixes: ['171.96.', '182.52.']
  },
  {
    name: 'Turkey',
    code: 'TR',
    iso3: 'TUR',
    flag: '🇹🇷',
    region: 'Europe',
    initial: 'T',
    aliases: ['TUR', 'Turkey', 'Türkiye', 'TR', 'Istanbul'],
    tier: 2,
    dialCode: '+90',
    cities: ['Istanbul', 'Ankara', 'Izmir'],
    locale: 'tr-tr',
    languages: 'tr-TR,tr;q=0.9,en;q=0.8',
    sampleIpPrefixes: ['193.140.', '78.160.']
  },

  // --- U ---
  {
    name: 'United Arab Emirates',
    code: 'AE',
    iso3: 'ARE',
    flag: '🇦🇪',
    region: 'Middle East',
    initial: 'U',
    aliases: ['ARE', 'UAE', 'United Arab Emirates', 'Emirates', 'Dubai', 'Abu Dhabi', 'AE'],
    tier: 1,
    dialCode: '+971',
    cities: ['Dubai', 'Abu Dhabi', 'Sharjah'],
    locale: 'ar-ae',
    languages: 'ar-AE,en-US;q=0.9,en;q=0.8',
    sampleIpPrefixes: ['94.200.', '185.120.', '86.96.']
  },
  {
    name: 'United Kingdom',
    code: 'GB',
    iso3: 'GBR',
    flag: '🇬🇧',
    region: 'Europe',
    initial: 'U',
    aliases: ['GBR', 'UK', 'GB', 'United Kingdom', 'Great Britain', 'Britain', 'England', 'Scotland', 'Wales'],
    tier: 1,
    dialCode: '+44',
    cities: ['London', 'Manchester', 'Birmingham', 'Edinburgh', 'Glasgow', 'Leeds'],
    locale: 'en-gb',
    languages: 'en-GB,en;q=0.9',
    sampleIpPrefixes: ['82.165.', '86.130.', '151.224.', '212.58.']
  },
  {
    name: 'United States',
    code: 'US',
    iso3: 'USA',
    flag: '🇺🇸',
    region: 'North America',
    initial: 'U',
    aliases: ['USA', 'US', 'United States', 'America', 'United States of America', 'U.S.', 'U.S.A.'],
    tier: 1,
    dialCode: '+1',
    cities: ['New York', 'San Francisco', 'Chicago', 'Austin', 'Seattle', 'Los Angeles', 'Miami'],
    locale: 'en-us',
    languages: 'en-US,en;q=0.9',
    sampleIpPrefixes: ['172.56.', '98.114.', '66.249.', '104.28.', '198.51.', '162.243.']
  },
  {
    name: 'Ukraine',
    code: 'UA',
    iso3: 'UKR',
    flag: '🇺🇦',
    region: 'Europe',
    initial: 'U',
    aliases: ['UKR', 'Ukraine', 'UA', 'Kyiv'],
    tier: 2,
    dialCode: '+380',
    cities: ['Kyiv', 'Lviv', 'Odesa'],
    locale: 'uk-ua',
    languages: 'uk-UA,uk;q=0.9,en;q=0.8',
    sampleIpPrefixes: ['194.44.', '91.200.']
  },

  // --- V ---
  {
    name: 'Vietnam',
    code: 'VN',
    iso3: 'VNM',
    flag: '🇻🇳',
    region: 'Asia-Pacific',
    initial: 'V',
    aliases: ['VNM', 'Vietnam', 'Việt Nam', 'VN'],
    tier: 3,
    dialCode: '+84',
    cities: ['Ho Chi Minh City', 'Hanoi', 'Da Nang'],
    locale: 'vi-vn',
    languages: 'vi-VN,vi;q=0.9,en;q=0.8',
    sampleIpPrefixes: ['113.160.', '171.224.']
  }
];

export interface CountryPresetBundle {
  id: string;
  name: string;
  flag: string;
  description: string;
  countryCodes: string[];
}

export const COUNTRY_PRESET_BUNDLES: CountryPresetBundle[] = [
  {
    id: 'worldwide',
    name: 'Worldwide Pool (Global)',
    flag: '🌐',
    description: 'Any incoming verified visitor from our global residential mesh.',
    countryCodes: []
  },
  {
    id: 'tier1',
    name: 'Tier-1 High-Value CPC',
    flag: '💎',
    description: 'US, UK, Canada, Australia, Germany, New Zealand, Ireland',
    countryCodes: ['US', 'GB', 'CA', 'AU', 'DE', 'NZ', 'IE']
  },
  {
    id: 'africa_hub',
    name: 'Africa Regional & WebZoneBW Hub',
    flag: '🇧🇼',
    description: 'Botswana (BW Ecosystem Hub), South Africa, Nigeria, Kenya, Ghana, Egypt',
    countryCodes: ['BW', 'ZA', 'NG', 'KE', 'GH', 'EG']
  },
  {
    id: 'north_america',
    name: 'North America (US & Canada)',
    flag: '🇺🇸',
    description: 'United States, Canada, Mexico',
    countryCodes: ['US', 'CA', 'MX']
  },
  {
    id: 'europe_top',
    name: 'Europe & UK High-Traffic',
    flag: '🇪🇺',
    description: 'United Kingdom, Germany, France, Netherlands, Italy, Spain, Switzerland, Sweden',
    countryCodes: ['GB', 'DE', 'FR', 'NL', 'IT', 'ES', 'CH', 'SE']
  },
  {
    id: 'apac_tech',
    name: 'Asia-Pacific Tech Corridors',
    flag: '🌏',
    description: 'India, Japan, Singapore, Australia, South Korea, Taiwan, Malaysia',
    countryCodes: ['IN', 'JP', 'SG', 'AU', 'KR', 'TW', 'MY']
  },
  {
    id: 'middle_east',
    name: 'Middle East & Gulf Hubs',
    flag: '🇦🇪',
    description: 'UAE (Dubai), Saudi Arabia, Qatar, Kuwait, Israel',
    countryCodes: ['AE', 'SA', 'QA', 'KW', 'IL']
  },
  {
    id: 'latam',
    name: 'Latin America Growth Markets',
    flag: '🌎',
    description: 'Brazil, Mexico, Argentina, Colombia, Chile, Peru',
    countryCodes: ['BR', 'MX', 'AR', 'CO', 'CL', 'PE']
  }
];

/**
 * Returns all distinct initials (A-Z) available in the countries database,
 * along with the count of countries for that initial.
 */
export function getAvailableInitials(): { initial: string; count: number }[] {
  const map = new Map<string, number>();
  for (const c of COUNTRIES_DATABASE) {
    const init = c.initial.toUpperCase();
    map.set(init, (map.get(init) || 0) + 1);
  }
  const initials = Array.from(map.keys()).sort();
  return initials.map(initial => ({
    initial,
    count: map.get(initial) || 0
  }));
}

/**
 * Recalls all countries starting with a specific initial letter
 */
export function getCountriesByInitial(initial: string): CountryData[] {
  const norm = initial.trim().toUpperCase();
  return COUNTRIES_DATABASE.filter(c => c.initial.toUpperCase() === norm);
}

/**
 * Searches and recalls countries by initial, name, ISO-2, ISO-3, dialCode, or alias
 */
export function searchCountriesWithRecall(query: string): CountryData[] {
  const q = query.trim().toLowerCase();
  if (!q) return COUNTRIES_DATABASE;

  // Single letter initial query (e.g. 'u', 'i', 'b')
  if (q.length === 1) {
    return COUNTRIES_DATABASE.filter(c => 
      c.initial.toLowerCase() === q ||
      c.code.toLowerCase().startsWith(q)
    );
  }

  return COUNTRIES_DATABASE.filter(c => {
    if (c.code.toLowerCase() === q) return true;
    if (c.iso3.toLowerCase() === q) return true;
    if (c.name.toLowerCase().includes(q)) return true;
    if (c.dialCode.toLowerCase().includes(q)) return true;
    if (c.region.toLowerCase().includes(q)) return true;
    return c.aliases.some(alias => alias.toLowerCase().includes(q));
  });
}

/**
 * Resolves a single country from a code, name, or alias
 */
export function resolveCountry(identifier: string): CountryData | null {
  const clean = identifier.trim().toLowerCase();
  if (!clean) return null;

  for (const c of COUNTRIES_DATABASE) {
    if (c.code.toLowerCase() === clean) return c;
    if (c.iso3.toLowerCase() === clean) return c;
    if (c.name.toLowerCase() === clean) return c;
    if (c.aliases.some(a => a.toLowerCase() === clean)) return c;
  }

  // Substring fallback
  for (const c of COUNTRIES_DATABASE) {
    if (c.name.toLowerCase().includes(clean)) return c;
  }

  return null;
}

export interface ParsedCountryCodesResult {
  matchedCountries: CountryData[];
  unrecognizedTokens: string[];
  formattedString: string;
  isoList: string[];
  isWorldwide: boolean;
}

/**
 * Parses user input string (e.g. "IN, US, UK, BW, DE", "India, Botswana", "i, u, b")
 * into recognized country records and clean format.
 */
export function parseCustomCountryCodes(input: string): ParsedCountryCodesResult {
  const trimmed = input.trim();
  if (!trimmed || trimmed.toLowerCase() === 'worldwide') {
    return {
      matchedCountries: [],
      unrecognizedTokens: [],
      formattedString: 'Worldwide',
      isoList: [],
      isWorldwide: true
    };
  }

  const tokens = trimmed.split(/[,;\/\n\+]+/).map(t => t.trim()).filter(Boolean);
  const matchedMap = new Map<string, CountryData>();
  const unrecognized: string[] = [];

  for (const token of tokens) {
    // If token is single initial like 'i' or 'u'
    if (token.length === 1 && /^[a-zA-Z]$/.test(token)) {
      const recalled = getCountriesByInitial(token);
      if (recalled.length > 0) {
        recalled.forEach(c => matchedMap.set(c.code, c));
        continue;
      }
    }

    const country = resolveCountry(token);
    if (country) {
      matchedMap.set(country.code, country);
    } else {
      unrecognized.push(token);
    }
  }

  const matchedCountries = Array.from(matchedMap.values());
  const isoList = matchedCountries.map(c => c.code);

  const formattedString = matchedCountries.length > 0
    ? matchedCountries.map(c => `${c.name} (${c.code})`).join(', ')
    : (unrecognized.length > 0 ? unrecognized.join(', ') : 'Worldwide');

  return {
    matchedCountries,
    unrecognizedTokens: unrecognized,
    formattedString,
    isoList,
    isWorldwide: matchedCountries.length === 0 && unrecognized.length === 0
  };
}
