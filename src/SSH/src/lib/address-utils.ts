// Country and State/Province utility for address forms
// Centralized data and functions for use across the SSH University application
import { convertISO3ToISO2, convertISO2ToISO3 } from './iso-utils'

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
// Comprehensive world countries - alphabetically sorted (using ISO 3166-1 alpha-3 codes)
export const countries: Country[] = [
  { code: 'AFG', name: 'Afghanistan' },
  { code: 'ALB', name: 'Albania' },
  { code: 'DZA', name: 'Algeria' },
  { code: 'AND', name: 'Andorra' },
  { code: 'AGO', name: 'Angola' },
  { code: 'ATG', name: 'Antigua and Barbuda' },
  { code: 'ARG', name: 'Argentina' },
  { code: 'ARM', name: 'Armenia' },
  { code: 'AUS', name: 'Australia' },
  { code: 'AUT', name: 'Austria' },
  { code: 'AZE', name: 'Azerbaijan' },
  { code: 'BHS', name: 'Bahamas' },
  { code: 'BHR', name: 'Bahrain' },
  { code: 'BGD', name: 'Bangladesh' },
  { code: 'BRB', name: 'Barbados' },
  { code: 'BLR', name: 'Belarus' },
  { code: 'BEL', name: 'Belgium' },
  { code: 'BLZ', name: 'Belize' },
  { code: 'BEN', name: 'Benin' },
  { code: 'BTN', name: 'Bhutan' },
  { code: 'BOL', name: 'Bolivia' },
  { code: 'BIH', name: 'Bosnia and Herzegovina' },
  { code: 'BWA', name: 'Botswana' },
  { code: 'BRA', name: 'Brazil' },
  { code: 'BRN', name: 'Brunei' },
  { code: 'BGR', name: 'Bulgaria' },
  { code: 'BFA', name: 'Burkina Faso' },
  { code: 'BDI', name: 'Burundi' },
  { code: 'CPV', name: 'Cabo Verde' },
  { code: 'KHM', name: 'Cambodia' },
  { code: 'CMR', name: 'Cameroon' },
  { code: 'CAN', name: 'Canada' },
  { code: 'CAF', name: 'Central African Republic' },
  { code: 'TCD', name: 'Chad' },
  { code: 'CHL', name: 'Chile' },
  { code: 'CHN', name: 'China' },
  { code: 'COL', name: 'Colombia' },
  { code: 'COM', name: 'Comoros' },
  { code: 'COG', name: 'Congo' },
  { code: 'COD', name: 'Congo (Democratic Republic)' },
  { code: 'CRI', name: 'Costa Rica' },
  { code: 'CIV', name: "Côte d'Ivoire" },
  { code: 'HRV', name: 'Croatia' },
  { code: 'CUB', name: 'Cuba' },
  { code: 'CYP', name: 'Cyprus' },
  { code: 'CZE', name: 'Czech Republic' },
  { code: 'DNK', name: 'Denmark' },
  { code: 'DJI', name: 'Djibouti' },
  { code: 'DMA', name: 'Dominica' },
  { code: 'DOM', name: 'Dominican Republic' },
  { code: 'ECU', name: 'Ecuador' },
  { code: 'EGY', name: 'Egypt' },
  { code: 'SLV', name: 'El Salvador' },
  { code: 'GNQ', name: 'Equatorial Guinea' },
  { code: 'ERI', name: 'Eritrea' },
  { code: 'EST', name: 'Estonia' },
  { code: 'SWZ', name: 'Eswatini' },
  { code: 'ETH', name: 'Ethiopia' },
  { code: 'FJI', name: 'Fiji' },
  { code: 'FIN', name: 'Finland' },
  { code: 'FRA', name: 'France' },
  { code: 'GAB', name: 'Gabon' },
  { code: 'GMB', name: 'Gambia' },
  { code: 'GEO', name: 'Georgia' },
  { code: 'DEU', name: 'Germany' },
  { code: 'GHA', name: 'Ghana' },
  { code: 'GRC', name: 'Greece' },
  { code: 'GRD', name: 'Grenada' },
  { code: 'GTM', name: 'Guatemala' },
  { code: 'GIN', name: 'Guinea' },
  { code: 'GNB', name: 'Guinea-Bissau' },
  { code: 'GUY', name: 'Guyana' },
  { code: 'HTI', name: 'Haiti' },
  { code: 'HND', name: 'Honduras' },
  { code: 'HUN', name: 'Hungary' },
  { code: 'ISL', name: 'Iceland' },
  { code: 'IND', name: 'India' },
  { code: 'IDN', name: 'Indonesia' },
  { code: 'IRN', name: 'Iran' },
  { code: 'IRQ', name: 'Iraq' },
  { code: 'IRL', name: 'Ireland' },
  { code: 'ISR', name: 'Israel' },
  { code: 'ITA', name: 'Italy' },
  { code: 'JAM', name: 'Jamaica' },
  { code: 'JPN', name: 'Japan' },
  { code: 'JOR', name: 'Jordan' },
  { code: 'KAZ', name: 'Kazakhstan' },
  { code: 'KEN', name: 'Kenya' },
  { code: 'KIR', name: 'Kiribati' },
  { code: 'PRK', name: 'Korea (North)' },
  { code: 'KOR', name: 'Korea (South)' },
  { code: 'KWT', name: 'Kuwait' },
  { code: 'KGZ', name: 'Kyrgyzstan' },
  { code: 'LAO', name: 'Laos' },
  { code: 'LVA', name: 'Latvia' },
  { code: 'LBN', name: 'Lebanon' },
  { code: 'LSO', name: 'Lesotho' },
  { code: 'LBR', name: 'Liberia' },
  { code: 'LBY', name: 'Libya' },
  { code: 'LIE', name: 'Liechtenstein' },
  { code: 'LTU', name: 'Lithuania' },
  { code: 'LUX', name: 'Luxembourg' },
  { code: 'MDG', name: 'Madagascar' },
  { code: 'MWI', name: 'Malawi' },
  { code: 'MYS', name: 'Malaysia' },
  { code: 'MDV', name: 'Maldives' },
  { code: 'MLI', name: 'Mali' },
  { code: 'MLT', name: 'Malta' },
  { code: 'MHL', name: 'Marshall Islands' },
  { code: 'MRT', name: 'Mauritania' },
  { code: 'MUS', name: 'Mauritius' },
  { code: 'MEX', name: 'Mexico' },
  { code: 'FSM', name: 'Micronesia' },
  { code: 'MDA', name: 'Moldova' },
  { code: 'MCO', name: 'Monaco' },
  { code: 'MNG', name: 'Mongolia' },
  { code: 'MNE', name: 'Montenegro' },
  { code: 'MAR', name: 'Morocco' },
  { code: 'MOZ', name: 'Mozambique' },
  { code: 'MMR', name: 'Myanmar' },
  { code: 'NAM', name: 'Namibia' },
  { code: 'NRU', name: 'Nauru' },
  { code: 'NPL', name: 'Nepal' },
  { code: 'NLD', name: 'Netherlands' },
  { code: 'NZL', name: 'New Zealand' },
  { code: 'NIC', name: 'Nicaragua' },
  { code: 'NER', name: 'Niger' },
  { code: 'NGA', name: 'Nigeria' },
  { code: 'MKD', name: 'North Macedonia' },
  { code: 'NOR', name: 'Norway' },
  { code: 'OMN', name: 'Oman' },
  { code: 'PAK', name: 'Pakistan' },
  { code: 'PLW', name: 'Palau' },
  { code: 'PAN', name: 'Panama' },
  { code: 'PNG', name: 'Papua New Guinea' },
  { code: 'PRY', name: 'Paraguay' },
  { code: 'PER', name: 'Peru' },
  { code: 'PHL', name: 'Philippines' },
  { code: 'POL', name: 'Poland' },
  { code: 'PRT', name: 'Portugal' },
  { code: 'QAT', name: 'Qatar' },
  { code: 'ROU', name: 'Romania' },
  { code: 'RUS', name: 'Russia' },
  { code: 'RWA', name: 'Rwanda' },
  { code: 'KNA', name: 'Saint Kitts and Nevis' },
  { code: 'LCA', name: 'Saint Lucia' },
  { code: 'VCT', name: 'Saint Vincent and the Grenadines' },
  { code: 'WSM', name: 'Samoa' },
  { code: 'SMR', name: 'San Marino' },
  { code: 'STP', name: 'São Tomé and Príncipe' },
  { code: 'SAU', name: 'Saudi Arabia' },
  { code: 'SEN', name: 'Senegal' },
  { code: 'SRB', name: 'Serbia' },
  { code: 'SYC', name: 'Seychelles' },
  { code: 'SLE', name: 'Sierra Leone' },
  { code: 'SGP', name: 'Singapore' },
  { code: 'SVK', name: 'Slovakia' },
  { code: 'SVN', name: 'Slovenia' },
  { code: 'SLB', name: 'Solomon Islands' },
  { code: 'SOM', name: 'Somalia' },
  { code: 'ZAF', name: 'South Africa' },
  { code: 'SSD', name: 'South Sudan' },
  { code: 'ESP', name: 'Spain' },
  { code: 'LKA', name: 'Sri Lanka' },
  { code: 'SDN', name: 'Sudan' },
  { code: 'SUR', name: 'Suriname' },
  { code: 'SWE', name: 'Sweden' },
  { code: 'CHE', name: 'Switzerland' },
  { code: 'SYR', name: 'Syria' },
  { code: 'TWN', name: 'Taiwan' },
  { code: 'TJK', name: 'Tajikistan' },
  { code: 'TZA', name: 'Tanzania' },
  { code: 'THA', name: 'Thailand' },
  { code: 'TLS', name: 'Timor-Leste' },
  { code: 'TGO', name: 'Togo' },
  { code: 'TON', name: 'Tonga' },
  { code: 'TTO', name: 'Trinidad and Tobago' },
  { code: 'TUN', name: 'Tunisia' },
  { code: 'TUR', name: 'Turkey' },
  { code: 'TKM', name: 'Turkmenistan' },
  { code: 'TUV', name: 'Tuvalu' },
  { code: 'UGA', name: 'Uganda' },
  { code: 'UKR', name: 'Ukraine' },
  { code: 'ARE', name: 'United Arab Emirates' },
  { code: 'GBR', name: 'United Kingdom' },
  { code: 'USA', name: 'United States' },
  { code: 'URY', name: 'Uruguay' },
  { code: 'UZB', name: 'Uzbekistan' },
  { code: 'VUT', name: 'Vanuatu' },
  { code: 'VAT', name: 'Vatican City' },
  { code: 'VEN', name: 'Venezuela' },
  { code: 'VNM', name: 'Vietnam' },
  { code: 'YEM', name: 'Yemen' },
  { code: 'ZMB', name: 'Zambia' },
  { code: 'ZWE', name: 'Zimbabwe' },
]
// States/provinces data for countries that have sub-divisions
export const statesProvinces: Record<string, StateProvince[]> = {
  USA: [
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
  CAN: [
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
  AUS: [
    { code: 'AC', name: 'Australian Capital Territory' },
    { code: 'NS', name: 'New South Wales' },
    { code: 'NT', name: 'Northern Territory' },
    { code: 'QL', name: 'Queensland' },
    { code: 'SA', name: 'South Australia' },
    { code: 'TA', name: 'Tasmania' },
    { code: 'VI', name: 'Victoria' },
    { code: 'WA', name: 'Western Australia' },
  ],
  IND: [
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
  GBR: [
    { code: 'EN', name: 'England' },
    { code: 'SC', name: 'Scotland' },
    { code: 'WA', name: 'Wales' },
    { code: 'NI', name: 'Northern Ireland' },
  ],
  DEU: [
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
    { code: 'SX', name: 'Saxony-Anhalt' },
    { code: 'SH', name: 'Schleswig-Holstein' },
    { code: 'TH', name: 'Thuringia' },
  ],
  BRA: [
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
  MEX: [
    { code: 'AG', name: 'Aguascalientes' },
    { code: 'BC', name: 'Baja California' },
    { code: 'BS', name: 'Baja California Sur' },
    { code: 'CM', name: 'Campeche' },
    { code: 'CS', name: 'Chiapas' },
    { code: 'CH', name: 'Chihuahua' },
    { code: 'CO', name: 'Coahuila' },
    { code: 'CL', name: 'Colima' },
    { code: 'DG', name: 'Durango' },
    { code: 'GT', name: 'Guanajuato' },
    { code: 'GR', name: 'Guerrero' },
    { code: 'HG', name: 'Hidalgo' },
    { code: 'JA', name: 'Jalisco' },
    { code: 'EM', name: 'México' },
    { code: 'MI', name: 'Michoacán' },
    { code: 'MO', name: 'Morelos' },
    { code: 'NA', name: 'Nayarit' },
    { code: 'NL', name: 'Nuevo León' },
    { code: 'OA', name: 'Oaxaca' },
    { code: 'PU', name: 'Puebla' },
    { code: 'QT', name: 'Querétaro' },
    { code: 'QR', name: 'Quintana Roo' },
    { code: 'SL', name: 'San Luis Potosí' },
    { code: 'SI', name: 'Sinaloa' },
    { code: 'SO', name: 'Sonora' },
    { code: 'TB', name: 'Tabasco' },
    { code: 'TM', name: 'Tamaulipas' },
    { code: 'TL', name: 'Tlaxcala' },
    { code: 'VE', name: 'Veracruz' },
    { code: 'YU', name: 'Yucatán' },
    { code: 'ZA', name: 'Zacatecas' },
    { code: 'MX', name: 'Mexico City' },
  ],
  ARG: [
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
  ITA: [
    { code: 'AB', name: 'Abruzzo' },
    { code: 'BA', name: 'Basilicata' },
    { code: 'CL', name: 'Calabria' },
    { code: 'CA', name: 'Campania' },
    { code: 'ER', name: 'Emilia-Romagna' },
    { code: 'FV', name: 'Friuli-Venezia Giulia' },
    { code: 'LZ', name: 'Lazio' },
    { code: 'LI', name: 'Liguria' },
    { code: 'LO', name: 'Lombardy' },
    { code: 'MA', name: 'Marche' },
    { code: 'MO', name: 'Molise' },
    { code: 'PI', name: 'Piedmont' },
    { code: 'PU', name: 'Puglia' },
    { code: 'SA', name: 'Sardinia' },
    { code: 'SI', name: 'Sicily' },
    { code: 'TA', name: 'Trentino-Alto Adige' },
    { code: 'TO', name: 'Tuscany' },
    { code: 'UM', name: 'Umbria' },
    { code: 'VD', name: 'Aosta Valley' },
    { code: 'VE', name: 'Veneto' },
  ],
  ESP: [
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
  FRA: [
    { code: 'AR', name: 'Auvergne-Rhône-Alpes' },
    { code: 'BF', name: 'Bourgogne-Franche-Comté' },
    { code: 'BR', name: 'Bretagne' },
    { code: 'CV', name: 'Centre-Val de Loire' },
    { code: 'CR', name: 'Corse' },
    { code: 'GE', name: 'Grand Est' },
    { code: 'HF', name: 'Hauts-de-France' },
    { code: 'IF', name: 'Île-de-France' },
    { code: 'NO', name: 'Normandie' },
    { code: 'NA', name: 'Nouvelle-Aquitaine' },
    { code: 'OC', name: 'Occitanie' },
    { code: 'PL', name: 'Pays de la Loire' },
    { code: 'PA', name: "Provence-Alpes-Côte d'Azur" },
  ],
  ZAF: [
    { code: 'EC', name: 'Eastern Cape' },
    { code: 'FS', name: 'Free State' },
    { code: 'GP', name: 'Gauteng' },
    { code: 'KZ', name: 'KwaZulu-Natal' },
    { code: 'LP', name: 'Limpopo' },
    { code: 'MP', name: 'Mpumalanga' },
    { code: 'NC', name: 'Northern Cape' },
    { code: 'NW', name: 'North West' },
    { code: 'WC', name: 'Western Cape' },
  ],
  MYS: [
    { code: 'JH', name: 'Johor' },
    { code: 'KD', name: 'Kedah' },
    { code: 'KT', name: 'Kelantan' },
    { code: 'KL', name: 'Kuala Lumpur' },
    { code: 'LB', name: 'Labuan' },
    { code: 'ML', name: 'Malacca' },
    { code: 'NS', name: 'Negeri Sembilan' },
    { code: 'PH', name: 'Pahang' },
    { code: 'PN', name: 'Penang' },
    { code: 'PR', name: 'Perak' },
    { code: 'PL', name: 'Perlis' },
    { code: 'PJ', name: 'Putrajaya' },
    { code: 'SB', name: 'Sabah' },
    { code: 'SW', name: 'Sarawak' },
    { code: 'SG', name: 'Selangor' },
    { code: 'TR', name: 'Terengganu' },
  ],
  IRL: [
    { code: 'CW', name: 'Carlow' },
    { code: 'CN', name: 'Cavan' },
    { code: 'CE', name: 'Clare' },
    { code: 'CO', name: 'Cork' },
    { code: 'DL', name: 'Donegal' },
    { code: 'DU', name: 'Dublin' },
    { code: 'GA', name: 'Galway' },
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
 * @param countryCode - The 3-letter country code (e.g., 'USA', 'CAN', 'IND')
 * @returns Array of states/provinces for the country, sorted alphabetically
 */
export const getStatesForCountry = (countryCode: string): StateProvince[] => {
  const states = statesProvinces[countryCode] || []
  return states.sort((a, b) => a.name.localeCompare(b.name))
}
/**
 * Check if a country has states/provinces
 * @param countryCode - The 3-letter country code
 * @returns boolean indicating if the country has states/provinces
 */
export const countryHasStates = (countryCode: string): boolean => {
  return !!statesProvinces[countryCode] && statesProvinces[countryCode].length > 0
}
/**
 * Get country name by country code
 * @param countryCode - The 3-letter country code
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
 * @param countryCode - The 2-letter or 3-letter country code
 * @param stateCode - The state/province code
 * @returns The state/province name or empty string if not found
 */
export const getStateName = (countryCode: string, stateCode: string): string => {
  // statesProvinces uses 3-letter country codes as keys
  let countryCode3 = countryCode
  if (countryCode.length === 2) {
    // Convert 2-letter to 3-letter if needed
    countryCode3 = convertISO2ToISO3(countryCode)
  }
  const states = statesProvinces[countryCode3] || []
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
