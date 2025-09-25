// Country and State/Province utility for address forms
// Centralized data and functions for use across the SSH University application
export interface Country {
  code: string
  name: string
}
export interface StateProvince {
  code: string
  name: string
}
export interface AddressFormData {
  country: string
  state: string
  city: string
  address_line_1: string
  address_line_2?: string
  zip_code: string
}
// Comprehensive world countries - alphabetically sorted
export const countries: Country[] = [
  { code: 'AF', name: 'Afghanistan' },
  { code: 'AL', name: 'Albania' },
  { code: 'DZ', name: 'Algeria' },
  { code: 'AD', name: 'Andorra' },
  { code: 'AO', name: 'Angola' },
  { code: 'AG', name: 'Antigua and Barbuda' },
  { code: 'AR', name: 'Argentina' },
  { code: 'AM', name: 'Armenia' },
  { code: 'AU', name: 'Australia' },
  { code: 'AT', name: 'Austria' },
  { code: 'AZ', name: 'Azerbaijan' },
  { code: 'BS', name: 'Bahamas' },
  { code: 'BH', name: 'Bahrain' },
  { code: 'BD', name: 'Bangladesh' },
  { code: 'BB', name: 'Barbados' },
  { code: 'BY', name: 'Belarus' },
  { code: 'BE', name: 'Belgium' },
  { code: 'BZ', name: 'Belize' },
  { code: 'BJ', name: 'Benin' },
  { code: 'BT', name: 'Bhutan' },
  { code: 'BO', name: 'Bolivia' },
  { code: 'BA', name: 'Bosnia and Herzegovina' },
  { code: 'BW', name: 'Botswana' },
  { code: 'BR', name: 'Brazil' },
  { code: 'BN', name: 'Brunei' },
  { code: 'BG', name: 'Bulgaria' },
  { code: 'BF', name: 'Burkina Faso' },
  { code: 'BI', name: 'Burundi' },
  { code: 'CV', name: 'Cabo Verde' },
  { code: 'KH', name: 'Cambodia' },
  { code: 'CM', name: 'Cameroon' },
  { code: 'CA', name: 'Canada' },
  { code: 'CF', name: 'Central African Republic' },
  { code: 'TD', name: 'Chad' },
  { code: 'CL', name: 'Chile' },
  { code: 'CN', name: 'China' },
  { code: 'CO', name: 'Colombia' },
  { code: 'KM', name: 'Comoros' },
  { code: 'CG', name: 'Congo' },
  { code: 'CD', name: 'Congo (Democratic Republic)' },
  { code: 'CR', name: 'Costa Rica' },
  { code: 'CI', name: "Côte d'Ivoire" },
  { code: 'HR', name: 'Croatia' },
  { code: 'CU', name: 'Cuba' },
  { code: 'CY', name: 'Cyprus' },
  { code: 'CZ', name: 'Czech Republic' },
  { code: 'DK', name: 'Denmark' },
  { code: 'DJ', name: 'Djibouti' },
  { code: 'DM', name: 'Dominica' },
  { code: 'DO', name: 'Dominican Republic' },
  { code: 'EC', name: 'Ecuador' },
  { code: 'EG', name: 'Egypt' },
  { code: 'SV', name: 'El Salvador' },
  { code: 'GQ', name: 'Equatorial Guinea' },
  { code: 'ER', name: 'Eritrea' },
  { code: 'EE', name: 'Estonia' },
  { code: 'SZ', name: 'Eswatini' },
  { code: 'ET', name: 'Ethiopia' },
  { code: 'FJ', name: 'Fiji' },
  { code: 'FI', name: 'Finland' },
  { code: 'FR', name: 'France' },
  { code: 'GA', name: 'Gabon' },
  { code: 'GM', name: 'Gambia' },
  { code: 'GE', name: 'Georgia' },
  { code: 'DE', name: 'Germany' },
  { code: 'GH', name: 'Ghana' },
  { code: 'GR', name: 'Greece' },
  { code: 'GD', name: 'Grenada' },
  { code: 'GT', name: 'Guatemala' },
  { code: 'GN', name: 'Guinea' },
  { code: 'GW', name: 'Guinea-Bissau' },
  { code: 'GY', name: 'Guyana' },
  { code: 'HT', name: 'Haiti' },
  { code: 'HN', name: 'Honduras' },
  { code: 'HU', name: 'Hungary' },
  { code: 'IS', name: 'Iceland' },
  { code: 'IN', name: 'India' },
  { code: 'ID', name: 'Indonesia' },
  { code: 'IR', name: 'Iran' },
  { code: 'IQ', name: 'Iraq' },
  { code: 'IE', name: 'Ireland' },
  { code: 'IL', name: 'Israel' },
  { code: 'IT', name: 'Italy' },
  { code: 'JM', name: 'Jamaica' },
  { code: 'JP', name: 'Japan' },
  { code: 'JO', name: 'Jordan' },
  { code: 'KZ', name: 'Kazakhstan' },
  { code: 'KE', name: 'Kenya' },
  { code: 'KI', name: 'Kiribati' },
  { code: 'KP', name: 'Korea (North)' },
  { code: 'KR', name: 'Korea (South)' },
  { code: 'KW', name: 'Kuwait' },
  { code: 'KG', name: 'Kyrgyzstan' },
  { code: 'LA', name: 'Laos' },
  { code: 'LV', name: 'Latvia' },
  { code: 'LB', name: 'Lebanon' },
  { code: 'LS', name: 'Lesotho' },
  { code: 'LR', name: 'Liberia' },
  { code: 'LY', name: 'Libya' },
  { code: 'LI', name: 'Liechtenstein' },
  { code: 'LT', name: 'Lithuania' },
  { code: 'LU', name: 'Luxembourg' },
  { code: 'MG', name: 'Madagascar' },
  { code: 'MW', name: 'Malawi' },
  { code: 'MY', name: 'Malaysia' },
  { code: 'MV', name: 'Maldives' },
  { code: 'ML', name: 'Mali' },
  { code: 'MT', name: 'Malta' },
  { code: 'MH', name: 'Marshall Islands' },
  { code: 'MR', name: 'Mauritania' },
  { code: 'MU', name: 'Mauritius' },
  { code: 'MX', name: 'Mexico' },
  { code: 'FM', name: 'Micronesia' },
  { code: 'MD', name: 'Moldova' },
  { code: 'MC', name: 'Monaco' },
  { code: 'MN', name: 'Mongolia' },
  { code: 'ME', name: 'Montenegro' },
  { code: 'MA', name: 'Morocco' },
  { code: 'MZ', name: 'Mozambique' },
  { code: 'MM', name: 'Myanmar' },
  { code: 'NA', name: 'Namibia' },
  { code: 'NR', name: 'Nauru' },
  { code: 'NP', name: 'Nepal' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'NZ', name: 'New Zealand' },
  { code: 'NI', name: 'Nicaragua' },
  { code: 'NE', name: 'Niger' },
  { code: 'NG', name: 'Nigeria' },
  { code: 'MK', name: 'North Macedonia' },
  { code: 'NO', name: 'Norway' },
  { code: 'OM', name: 'Oman' },
  { code: 'PK', name: 'Pakistan' },
  { code: 'PW', name: 'Palau' },
  { code: 'PA', name: 'Panama' },
  { code: 'PG', name: 'Papua New Guinea' },
  { code: 'PY', name: 'Paraguay' },
  { code: 'PE', name: 'Peru' },
  { code: 'PH', name: 'Philippines' },
  { code: 'PL', name: 'Poland' },
  { code: 'PT', name: 'Portugal' },
  { code: 'QA', name: 'Qatar' },
  { code: 'RO', name: 'Romania' },
  { code: 'RU', name: 'Russia' },
  { code: 'RW', name: 'Rwanda' },
  { code: 'KN', name: 'Saint Kitts and Nevis' },
  { code: 'LC', name: 'Saint Lucia' },
  { code: 'VC', name: 'Saint Vincent and the Grenadines' },
  { code: 'WS', name: 'Samoa' },
  { code: 'SM', name: 'San Marino' },
  { code: 'ST', name: 'São Tomé and Príncipe' },
  { code: 'SA', name: 'Saudi Arabia' },
  { code: 'SN', name: 'Senegal' },
  { code: 'RS', name: 'Serbia' },
  { code: 'SC', name: 'Seychelles' },
  { code: 'SL', name: 'Sierra Leone' },
  { code: 'SG', name: 'Singapore' },
  { code: 'SK', name: 'Slovakia' },
  { code: 'SI', name: 'Slovenia' },
  { code: 'SB', name: 'Solomon Islands' },
  { code: 'SO', name: 'Somalia' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'SS', name: 'South Sudan' },
  { code: 'ES', name: 'Spain' },
  { code: 'LK', name: 'Sri Lanka' },
  { code: 'SD', name: 'Sudan' },
  { code: 'SR', name: 'Suriname' },
  { code: 'SE', name: 'Sweden' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'SY', name: 'Syria' },
  { code: 'TW', name: 'Taiwan' },
  { code: 'TJ', name: 'Tajikistan' },
  { code: 'TZ', name: 'Tanzania' },
  { code: 'TH', name: 'Thailand' },
  { code: 'TL', name: 'Timor-Leste' },
  { code: 'TG', name: 'Togo' },
  { code: 'TO', name: 'Tonga' },
  { code: 'TT', name: 'Trinidad and Tobago' },
  { code: 'TN', name: 'Tunisia' },
  { code: 'TR', name: 'Turkey' },
  { code: 'TM', name: 'Turkmenistan' },
  { code: 'TV', name: 'Tuvalu' },
  { code: 'UG', name: 'Uganda' },
  { code: 'UA', name: 'Ukraine' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'US', name: 'United States' },
  { code: 'UY', name: 'Uruguay' },
  { code: 'UZ', name: 'Uzbekistan' },
  { code: 'VU', name: 'Vanuatu' },
  { code: 'VA', name: 'Vatican City' },
  { code: 'VE', name: 'Venezuela' },
  { code: 'VN', name: 'Vietnam' },
  { code: 'YE', name: 'Yemen' },
  { code: 'ZM', name: 'Zambia' },
  { code: 'ZW', name: 'Zimbabwe' },
]
// States/provinces data for countries that have sub-divisions
export const statesProvinces: Record<string, StateProvince[]> = {
  US: [
    { code: 'AL', name: 'Alabama' },
    { code: 'AK', name: 'Alaska' },
    { code: 'AZ', name: 'Arizona' },
    { code: 'AR', name: 'Arkansas' },
    { code: 'CA', name: 'California' },
    { code: 'CO', name: 'Colorado' },
    { code: 'CT', name: 'Connecticut' },
    { code: 'DE', name: 'Delaware' },
    { code: 'FL', name: 'Florida' },
    { code: 'GA', name: 'Georgia' },
    { code: 'HI', name: 'Hawaii' },
    { code: 'ID', name: 'Idaho' },
    { code: 'IL', name: 'Illinois' },
    { code: 'IN', name: 'Indiana' },
    { code: 'IA', name: 'Iowa' },
    { code: 'KS', name: 'Kansas' },
    { code: 'KY', name: 'Kentucky' },
    { code: 'LA', name: 'Louisiana' },
    { code: 'ME', name: 'Maine' },
    { code: 'MD', name: 'Maryland' },
    { code: 'MA', name: 'Massachusetts' },
    { code: 'MI', name: 'Michigan' },
    { code: 'MN', name: 'Minnesota' },
    { code: 'MS', name: 'Mississippi' },
    { code: 'MO', name: 'Missouri' },
    { code: 'MT', name: 'Montana' },
    { code: 'NE', name: 'Nebraska' },
    { code: 'NV', name: 'Nevada' },
    { code: 'NH', name: 'New Hampshire' },
    { code: 'NJ', name: 'New Jersey' },
    { code: 'NM', name: 'New Mexico' },
    { code: 'NY', name: 'New York' },
    { code: 'NC', name: 'North Carolina' },
    { code: 'ND', name: 'North Dakota' },
    { code: 'OH', name: 'Ohio' },
    { code: 'OK', name: 'Oklahoma' },
    { code: 'OR', name: 'Oregon' },
    { code: 'PA', name: 'Pennsylvania' },
    { code: 'RI', name: 'Rhode Island' },
    { code: 'SC', name: 'South Carolina' },
    { code: 'SD', name: 'South Dakota' },
    { code: 'TN', name: 'Tennessee' },
    { code: 'TX', name: 'Texas' },
    { code: 'UT', name: 'Utah' },
    { code: 'VT', name: 'Vermont' },
    { code: 'VA', name: 'Virginia' },
    { code: 'WA', name: 'Washington' },
    { code: 'WV', name: 'West Virginia' },
    { code: 'WI', name: 'Wisconsin' },
    { code: 'WY', name: 'Wyoming' },
    { code: 'DC', name: 'District of Columbia' },
  ],
  CA: [
    { code: 'AB', name: 'Alberta' },
    { code: 'BC', name: 'British Columbia' },
    { code: 'MB', name: 'Manitoba' },
    { code: 'NB', name: 'New Brunswick' },
    { code: 'NL', name: 'Newfoundland and Labrador' },
    { code: 'NT', name: 'Northwest Territories' },
    { code: 'NS', name: 'Nova Scotia' },
    { code: 'NU', name: 'Nunavut' },
    { code: 'ON', name: 'Ontario' },
    { code: 'PE', name: 'Prince Edward Island' },
    { code: 'QC', name: 'Quebec' },
    { code: 'SK', name: 'Saskatchewan' },
    { code: 'YT', name: 'Yukon' },
  ],
  AU: [
    { code: 'ACT', name: 'Australian Capital Territory' },
    { code: 'NSW', name: 'New South Wales' },
    { code: 'NT', name: 'Northern Territory' },
    { code: 'QLD', name: 'Queensland' },
    { code: 'SA', name: 'South Australia' },
    { code: 'TAS', name: 'Tasmania' },
    { code: 'VIC', name: 'Victoria' },
    { code: 'WA', name: 'Western Australia' },
  ],
  IN: [
    { code: 'AP', name: 'Andhra Pradesh' },
    { code: 'AR', name: 'Arunachal Pradesh' },
    { code: 'AS', name: 'Assam' },
    { code: 'BR', name: 'Bihar' },
    { code: 'CG', name: 'Chhattisgarh' },
    { code: 'GA', name: 'Goa' },
    { code: 'GJ', name: 'Gujarat' },
    { code: 'HR', name: 'Haryana' },
    { code: 'HP', name: 'Himachal Pradesh' },
    { code: 'JH', name: 'Jharkhand' },
    { code: 'KA', name: 'Karnataka' },
    { code: 'KL', name: 'Kerala' },
    { code: 'MP', name: 'Madhya Pradesh' },
    { code: 'MH', name: 'Maharashtra' },
    { code: 'MN', name: 'Manipur' },
    { code: 'ML', name: 'Meghalaya' },
    { code: 'MZ', name: 'Mizoram' },
    { code: 'NL', name: 'Nagaland' },
    { code: 'OD', name: 'Odisha' },
    { code: 'PB', name: 'Punjab' },
    { code: 'RJ', name: 'Rajasthan' },
    { code: 'SK', name: 'Sikkim' },
    { code: 'TN', name: 'Tamil Nadu' },
    { code: 'TG', name: 'Telangana' },
    { code: 'TR', name: 'Tripura' },
    { code: 'UP', name: 'Uttar Pradesh' },
    { code: 'UK', name: 'Uttarakhand' },
    { code: 'WB', name: 'West Bengal' },
    { code: 'AN', name: 'Andaman and Nicobar Islands' },
    { code: 'CH', name: 'Chandigarh' },
    { code: 'DN', name: 'Dadra and Nagar Haveli' },
    { code: 'DD', name: 'Daman and Diu' },
    { code: 'DL', name: 'Delhi' },
    { code: 'JK', name: 'Jammu and Kashmir' },
    { code: 'LA', name: 'Ladakh' },
    { code: 'LD', name: 'Lakshadweep' },
    { code: 'PY', name: 'Puducherry' },
  ],
  GB: [
    { code: 'ENG', name: 'England' },
    { code: 'SCT', name: 'Scotland' },
    { code: 'WLS', name: 'Wales' },
    { code: 'NIR', name: 'Northern Ireland' },
  ],
  DE: [
    { code: 'BW', name: 'Baden-Württemberg' },
    { code: 'BY', name: 'Bavaria' },
    { code: 'BE', name: 'Berlin' },
    { code: 'BB', name: 'Brandenburg' },
    { code: 'HB', name: 'Bremen' },
    { code: 'HH', name: 'Hamburg' },
    { code: 'HE', name: 'Hesse' },
    { code: 'NI', name: 'Lower Saxony' },
    { code: 'MV', name: 'Mecklenburg-Vorpommern' },
    { code: 'NW', name: 'North Rhine-Westphalia' },
    { code: 'RP', name: 'Rhineland-Palatinate' },
    { code: 'SL', name: 'Saarland' },
    { code: 'SN', name: 'Saxony' },
    { code: 'ST', name: 'Saxony-Anhalt' },
    { code: 'SH', name: 'Schleswig-Holstein' },
    { code: 'TH', name: 'Thuringia' },
  ],
  BR: [
    { code: 'AC', name: 'Acre' },
    { code: 'AL', name: 'Alagoas' },
    { code: 'AP', name: 'Amapá' },
    { code: 'AM', name: 'Amazonas' },
    { code: 'BA', name: 'Bahia' },
    { code: 'CE', name: 'Ceará' },
    { code: 'DF', name: 'Distrito Federal' },
    { code: 'ES', name: 'Espírito Santo' },
    { code: 'GO', name: 'Goiás' },
    { code: 'MA', name: 'Maranhão' },
    { code: 'MT', name: 'Mato Grosso' },
    { code: 'MS', name: 'Mato Grosso do Sul' },
    { code: 'MG', name: 'Minas Gerais' },
    { code: 'PA', name: 'Pará' },
    { code: 'PB', name: 'Paraíba' },
    { code: 'PR', name: 'Paraná' },
    { code: 'PE', name: 'Pernambuco' },
    { code: 'PI', name: 'Piauí' },
    { code: 'RJ', name: 'Rio de Janeiro' },
    { code: 'RN', name: 'Rio Grande do Norte' },
    { code: 'RS', name: 'Rio Grande do Sul' },
    { code: 'RO', name: 'Rondônia' },
    { code: 'RR', name: 'Roraima' },
    { code: 'SC', name: 'Santa Catarina' },
    { code: 'SP', name: 'São Paulo' },
    { code: 'SE', name: 'Sergipe' },
    { code: 'TO', name: 'Tocantins' },
  ],
  MX: [
    { code: 'AGU', name: 'Aguascalientes' },
    { code: 'BCN', name: 'Baja California' },
    { code: 'BCS', name: 'Baja California Sur' },
    { code: 'CAM', name: 'Campeche' },
    { code: 'CHP', name: 'Chiapas' },
    { code: 'CHH', name: 'Chihuahua' },
    { code: 'COA', name: 'Coahuila' },
    { code: 'COL', name: 'Colima' },
    { code: 'DUR', name: 'Durango' },
    { code: 'GUA', name: 'Guanajuato' },
    { code: 'GRO', name: 'Guerrero' },
    { code: 'HID', name: 'Hidalgo' },
    { code: 'JAL', name: 'Jalisco' },
    { code: 'MEX', name: 'México' },
    { code: 'MIC', name: 'Michoacán' },
    { code: 'MOR', name: 'Morelos' },
    { code: 'NAY', name: 'Nayarit' },
    { code: 'NLE', name: 'Nuevo León' },
    { code: 'OAX', name: 'Oaxaca' },
    { code: 'PUE', name: 'Puebla' },
    { code: 'QUE', name: 'Querétaro' },
    { code: 'ROO', name: 'Quintana Roo' },
    { code: 'SLP', name: 'San Luis Potosí' },
    { code: 'SIN', name: 'Sinaloa' },
    { code: 'SON', name: 'Sonora' },
    { code: 'TAB', name: 'Tabasco' },
    { code: 'TAM', name: 'Tamaulipas' },
    { code: 'TLA', name: 'Tlaxcala' },
    { code: 'VER', name: 'Veracruz' },
    { code: 'YUC', name: 'Yucatán' },
    { code: 'ZAC', name: 'Zacatecas' },
    { code: 'CMX', name: 'Mexico City' },
  ],
  AR: [
    { code: 'BA', name: 'Buenos Aires' },
    { code: 'CT', name: 'Catamarca' },
    { code: 'CH', name: 'Chaco' },
    { code: 'CU', name: 'Chubut' },
    { code: 'CB', name: 'Córdoba' },
    { code: 'CR', name: 'Corrientes' },
    { code: 'ER', name: 'Entre Ríos' },
    { code: 'FM', name: 'Formosa' },
    { code: 'JY', name: 'Jujuy' },
    { code: 'LP', name: 'La Pampa' },
    { code: 'LR', name: 'La Rioja' },
    { code: 'MZ', name: 'Mendoza' },
    { code: 'MN', name: 'Misiones' },
    { code: 'NQ', name: 'Neuquén' },
    { code: 'RN', name: 'Río Negro' },
    { code: 'SA', name: 'Salta' },
    { code: 'SJ', name: 'San Juan' },
    { code: 'SL', name: 'San Luis' },
    { code: 'SC', name: 'Santa Cruz' },
    { code: 'SF', name: 'Santa Fe' },
    { code: 'SE', name: 'Santiago del Estero' },
    { code: 'TF', name: 'Tierra del Fuego' },
    { code: 'TM', name: 'Tucumán' },
    { code: 'CF', name: 'Ciudad Autónoma de Buenos Aires' },
  ],
  IT: [
    { code: 'ABR', name: 'Abruzzo' },
    { code: 'BAS', name: 'Basilicata' },
    { code: 'CAL', name: 'Calabria' },
    { code: 'CAM', name: 'Campania' },
    { code: 'EMR', name: 'Emilia-Romagna' },
    { code: 'FVG', name: 'Friuli-Venezia Giulia' },
    { code: 'LAZ', name: 'Lazio' },
    { code: 'LIG', name: 'Liguria' },
    { code: 'LOM', name: 'Lombardy' },
    { code: 'MAR', name: 'Marche' },
    { code: 'MOL', name: 'Molise' },
    { code: 'PIE', name: 'Piedmont' },
    { code: 'PUG', name: 'Puglia' },
    { code: 'SAR', name: 'Sardinia' },
    { code: 'SIC', name: 'Sicily' },
    { code: 'TAA', name: 'Trentino-Alto Adige' },
    { code: 'TOS', name: 'Tuscany' },
    { code: 'UMB', name: 'Umbria' },
    { code: 'VDA', name: 'Aosta Valley' },
    { code: 'VEN', name: 'Veneto' },
  ],
  ES: [
    { code: 'AN', name: 'Andalusia' },
    { code: 'AR', name: 'Aragon' },
    { code: 'AS', name: 'Asturias' },
    { code: 'IB', name: 'Balearic Islands' },
    { code: 'PV', name: 'Basque Country' },
    { code: 'CN', name: 'Canary Islands' },
    { code: 'CB', name: 'Cantabria' },
    { code: 'CL', name: 'Castile and León' },
    { code: 'CM', name: 'Castile-La Mancha' },
    { code: 'CT', name: 'Catalonia' },
    { code: 'EX', name: 'Extremadura' },
    { code: 'GA', name: 'Galicia' },
    { code: 'RI', name: 'La Rioja' },
    { code: 'MD', name: 'Madrid' },
    { code: 'MC', name: 'Murcia' },
    { code: 'NC', name: 'Navarre' },
    { code: 'VC', name: 'Valencia' },
    { code: 'CE', name: 'Ceuta' },
    { code: 'ML', name: 'Melilla' },
  ],
  FR: [
    { code: 'ARA', name: 'Auvergne-Rhône-Alpes' },
    { code: 'BFC', name: 'Bourgogne-Franche-Comté' },
    { code: 'BRE', name: 'Bretagne' },
    { code: 'CVL', name: 'Centre-Val de Loire' },
    { code: 'COR', name: 'Corse' },
    { code: 'GES', name: 'Grand Est' },
    { code: 'HDF', name: 'Hauts-de-France' },
    { code: 'IDF', name: 'Île-de-France' },
    { code: 'NOR', name: 'Normandie' },
    { code: 'NAQ', name: 'Nouvelle-Aquitaine' },
    { code: 'OCC', name: 'Occitanie' },
    { code: 'PDL', name: 'Pays de la Loire' },
    { code: 'PAC', name: "Provence-Alpes-Côte d'Azur" },
  ],
  ZA: [
    { code: 'EC', name: 'Eastern Cape' },
    { code: 'FS', name: 'Free State' },
    { code: 'GP', name: 'Gauteng' },
    { code: 'KZN', name: 'KwaZulu-Natal' },
    { code: 'LP', name: 'Limpopo' },
    { code: 'MP', name: 'Mpumalanga' },
    { code: 'NC', name: 'Northern Cape' },
    { code: 'NW', name: 'North West' },
    { code: 'WC', name: 'Western Cape' },
  ],
  MY: [
    { code: 'JHR', name: 'Johor' },
    { code: 'KDH', name: 'Kedah' },
    { code: 'KTN', name: 'Kelantan' },
    { code: 'KUL', name: 'Kuala Lumpur' },
    { code: 'LBN', name: 'Labuan' },
    { code: 'MLK', name: 'Malacca' },
    { code: 'NSN', name: 'Negeri Sembilan' },
    { code: 'PHG', name: 'Pahang' },
    { code: 'PNG', name: 'Penang' },
    { code: 'PRK', name: 'Perak' },
    { code: 'PLS', name: 'Perlis' },
    { code: 'PJY', name: 'Putrajaya' },
    { code: 'SBH', name: 'Sabah' },
    { code: 'SWK', name: 'Sarawak' },
    { code: 'SGR', name: 'Selangor' },
    { code: 'TRG', name: 'Terengganu' },
  ],
  IE: [
    { code: 'CW', name: 'Carlow' },
    { code: 'CN', name: 'Cavan' },
    { code: 'CE', name: 'Clare' },
    { code: 'CO', name: 'Cork' },
    { code: 'DL', name: 'Donegal' },
    { code: 'D', name: 'Dublin' },
    { code: 'G', name: 'Galway' },
    { code: 'KY', name: 'Kerry' },
    { code: 'KE', name: 'Kildare' },
    { code: 'KK', name: 'Kilkenny' },
    { code: 'LS', name: 'Laois' },
    { code: 'LM', name: 'Leitrim' },
    { code: 'LK', name: 'Limerick' },
    { code: 'LD', name: 'Longford' },
    { code: 'LH', name: 'Louth' },
    { code: 'MO', name: 'Mayo' },
    { code: 'MH', name: 'Meath' },
    { code: 'MN', name: 'Monaghan' },
    { code: 'OY', name: 'Offaly' },
    { code: 'RN', name: 'Roscommon' },
    { code: 'SO', name: 'Sligo' },
    { code: 'TA', name: 'Tipperary' },
    { code: 'WD', name: 'Waterford' },
    { code: 'WH', name: 'Westmeath' },
    { code: 'WX', name: 'Wexford' },
    { code: 'WW', name: 'Wicklow' },
  ],
}
/**
 * Get all countries sorted alphabetically
 */
export const getCountries = (): Country[] => {
  return countries.sort((a, b) => a.name.localeCompare(b.name))
}
/**
 * Get states/provinces for a specific country code
 * @param countryCode - The 2-letter country code (e.g., 'US', 'CA', 'IN')
 * @returns Array of states/provinces for the country, sorted alphabetically
 */
export const getStatesForCountry = (countryCode: string): StateProvince[] => {
  const states = statesProvinces[countryCode] || []
  return states.sort((a, b) => a.name.localeCompare(b.name))
}
/**
 * Check if a country has states/provinces
 * @param countryCode - The 2-letter country code
 * @returns boolean indicating if the country has states/provinces
 */
export const countryHasStates = (countryCode: string): boolean => {
  return !!statesProvinces[countryCode] && statesProvinces[countryCode].length > 0
}
/**
 * Get country name by country code
 * @param countryCode - The 2-letter country code
 * @returns The country name or empty string if not found
 */
export const getCountryName = (countryCode: string): string => {
  const country = countries.find((c) => c.code === countryCode)
  return country?.name || ''
}

/**
 * Get country code by country name (reverse lookup)
 * @param countryName - The full country name
 * @returns The 2-letter country code or empty string if not found
 */
export const getCountryCodeByName = (countryName: string): string => {
  if (!countryName) return ''
  const country = countries.find((c) => c.name.toLowerCase() === countryName.toLowerCase())
  return country?.code || ''
}

/**
 * Normalize country input to country code (handles both codes and names)
 * @param countryInput - Either a country code or country name
 * @returns The 2-letter country code or original input if it's already a valid code
 */
export const normalizeToCountryCode = (countryInput: string): string => {
  if (!countryInput) return ''

  // Check if it's already a valid country code
  const isValidCode = countries.some((c) => c.code === countryInput.toUpperCase())
  if (isValidCode) return countryInput.toUpperCase()

  // Try to convert from name to code
  const codeFromName = getCountryCodeByName(countryInput)
  if (codeFromName) return codeFromName

  // Return original input as fallback
  return countryInput
}

/**
 * Get state/province name by country code and state code
 * @param countryCode - The 2-letter country code
 * @param stateCode - The state/province code
 * @returns The state/province name or empty string if not found
 */
export const getStateName = (countryCode: string, stateCode: string): string => {
  const states = statesProvinces[countryCode] || []
  const state = states.find((s) => s.code === stateCode)
  return state?.name || ''
}
/**
 * Validate address data
 * @param addressData - The address form data
 * @returns Object with validation results
 */
export const validateAddress = (addressData: AddressFormData) => {
  const errors: string[] = []
  if (!addressData.country) {
    errors.push('Country is required')
  }
  if (countryHasStates(addressData.country) && !addressData.state) {
    errors.push('State/Province is required')
  }
  if (!addressData.city) {
    errors.push('City is required')
  }
  if (!addressData.address_line_1) {
    errors.push('Address line 1 is required')
  }
  if (!addressData.zip_code) {
    errors.push('ZIP/Postal code is required')
  }
  return {
    isValid: errors.length === 0,
    errors,
  }
}
/**
 * Format a complete address string
 * @param addressData - The address data
 * @returns Formatted address string
 */
export const formatAddress = (addressData: AddressFormData): string => {
  const parts = [
    addressData.address_line_1,
    addressData.address_line_2,
    addressData.city,
    getStateName(addressData.country, addressData.state),
    addressData.zip_code,
    getCountryName(addressData.country),
  ].filter(Boolean)
  return parts.join(', ')
}
// Most commonly used countries (can be customized based on your user base)
export const popularCountries = [
  'US',
  'CA',
  'GB',
  'AU',
  'IN',
  'DE',
  'FR',
  'IT',
  'ES',
  'BR',
  'MX',
  'JP',
  'CN',
]
/**
 * Get popular countries first, then the rest
 */
export const getCountriesWithPopularFirst = (): Country[] => {
  const popular = popularCountries
    .map((code) => countries.find((c) => c.code === code))
    .filter(Boolean) as Country[]
  const others = countries.filter((c) => !popularCountries.includes(c.code))
  return [...popular, ...others]
}
