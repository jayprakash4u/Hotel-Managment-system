'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { api } from '@/lib/api';
import { CountryMasterItem } from '@/lib/types';
import { SelectOption } from '@/components/ui/MasterSearchableSelect';

/**
 * Maintained ISO 3166-1 alpha-2 complete country and nationality demonym dataset.
 * Used for instant client-side rendering, offline reliability, and fallback.
 */
export const FALLBACK_COUNTRIES: CountryMasterItem[] = [
  // Primary Hospitality Demographics
  { id: 'c-np', countryCode: 'NP', countryName: 'Nepal', nationalityName: 'Nepali', isActive: true, displayOrder: 1 },
  { id: 'c-in', countryCode: 'IN', countryName: 'India', nationalityName: 'Indian', isActive: true, displayOrder: 2 },
  { id: 'c-us', countryCode: 'US', countryName: 'United States', nationalityName: 'American', isActive: true, displayOrder: 3 },
  { id: 'c-gb', countryCode: 'GB', countryName: 'United Kingdom', nationalityName: 'British', isActive: true, displayOrder: 4 },
  { id: 'c-au', countryCode: 'AU', countryName: 'Australia', nationalityName: 'Australian', isActive: true, displayOrder: 5 },
  { id: 'c-cn', countryCode: 'CN', countryName: 'China', nationalityName: 'Chinese', isActive: true, displayOrder: 6 },
  { id: 'c-jp', countryCode: 'JP', countryName: 'Japan', nationalityName: 'Japanese', isActive: true, displayOrder: 7 },
  { id: 'c-ca', countryCode: 'CA', countryName: 'Canada', nationalityName: 'Canadian', isActive: true, displayOrder: 8 },
  { id: 'c-de', countryCode: 'DE', countryName: 'Germany', nationalityName: 'German', isActive: true, displayOrder: 9 },
  { id: 'c-fr', countryCode: 'FR', countryName: 'France', nationalityName: 'French', isActive: true, displayOrder: 10 },
  { id: 'c-bt', countryCode: 'BT', countryName: 'Bhutan', nationalityName: 'Bhutanese', isActive: true, displayOrder: 11 },
  { id: 'c-bd', countryCode: 'BD', countryName: 'Bangladesh', nationalityName: 'Bangladeshi', isActive: true, displayOrder: 12 },
  { id: 'c-lk', countryCode: 'LK', countryName: 'Sri Lanka', nationalityName: 'Sri Lankan', isActive: true, displayOrder: 13 },
  { id: 'c-th', countryCode: 'TH', countryName: 'Thailand', nationalityName: 'Thai', isActive: true, displayOrder: 14 },
  { id: 'c-sg', countryCode: 'SG', countryName: 'Singapore', nationalityName: 'Singaporean', isActive: true, displayOrder: 15 },
  { id: 'c-my', countryCode: 'MY', countryName: 'Malaysia', nationalityName: 'Malaysian', isActive: true, displayOrder: 16 },
  { id: 'c-ae', countryCode: 'AE', countryName: 'United Arab Emirates', nationalityName: 'Emirati', isActive: true, displayOrder: 17 },
  { id: 'c-kr', countryCode: 'KR', countryName: 'South Korea', nationalityName: 'South Korean', isActive: true, displayOrder: 18 },
  { id: 'c-it', countryCode: 'IT', countryName: 'Italy', nationalityName: 'Italian', isActive: true, displayOrder: 19 },
  { id: 'c-es', countryCode: 'ES', countryName: 'Spain', nationalityName: 'Spanish', isActive: true, displayOrder: 20 },
  { id: 'c-ch', countryCode: 'CH', countryName: 'Switzerland', nationalityName: 'Swiss', isActive: true, displayOrder: 21 },
  { id: 'c-nl', countryCode: 'NL', countryName: 'Netherlands', nationalityName: 'Dutch', isActive: true, displayOrder: 22 },
  { id: 'c-ru', countryCode: 'RU', countryName: 'Russia', nationalityName: 'Russian', isActive: true, displayOrder: 23 },
  { id: 'c-sa', countryCode: 'SA', countryName: 'Saudi Arabia', nationalityName: 'Saudi', isActive: true, displayOrder: 24 },
  { id: 'c-qa', countryCode: 'QA', countryName: 'Qatar', nationalityName: 'Qatari', isActive: true, displayOrder: 25 },
  { id: 'c-kw', countryCode: 'KW', countryName: 'Kuwait', nationalityName: 'Kuwaiti', isActive: true, displayOrder: 26 },
  { id: 'c-mv', countryCode: 'MV', countryName: 'Maldives', nationalityName: 'Maldivian', isActive: true, displayOrder: 27 },
  { id: 'c-pk', countryCode: 'PK', countryName: 'Pakistan', nationalityName: 'Pakistani', isActive: true, displayOrder: 28 },
  { id: 'c-id', countryCode: 'ID', countryName: 'Indonesia', nationalityName: 'Indonesian', isActive: true, displayOrder: 29 },
  { id: 'c-ph', countryCode: 'PH', countryName: 'Philippines', nationalityName: 'Filipino', isActive: true, displayOrder: 30 },
  { id: 'c-vn', countryCode: 'VN', countryName: 'Vietnam', nationalityName: 'Vietnamese', isActive: true, displayOrder: 31 },
  { id: 'c-nz', countryCode: 'NZ', countryName: 'New Zealand', nationalityName: 'New Zealander', isActive: true, displayOrder: 32 },
  { id: 'c-za', countryCode: 'ZA', countryName: 'South Africa', nationalityName: 'South African', isActive: true, displayOrder: 33 },
  { id: 'c-br', countryCode: 'BR', countryName: 'Brazil', nationalityName: 'Brazilian', isActive: true, displayOrder: 34 },
  { id: 'c-mx', countryCode: 'MX', countryName: 'Mexico', nationalityName: 'Mexican', isActive: true, displayOrder: 35 },
  { id: 'c-se', countryCode: 'SE', countryName: 'Sweden', nationalityName: 'Swedish', isActive: true, displayOrder: 36 },
  { id: 'c-no', countryCode: 'NO', countryName: 'Norway', nationalityName: 'Norwegian', isActive: true, displayOrder: 37 },
  { id: 'c-dk', countryCode: 'DK', countryName: 'Denmark', nationalityName: 'Danish', isActive: true, displayOrder: 38 },
  { id: 'c-fi', countryCode: 'FI', countryName: 'Finland', nationalityName: 'Finnish', isActive: true, displayOrder: 39 },
  { id: 'c-at', countryCode: 'AT', countryName: 'Austria', nationalityName: 'Austrian', isActive: true, displayOrder: 40 },
  { id: 'c-be', countryCode: 'BE', countryName: 'Belgium', nationalityName: 'Belgian', isActive: true, displayOrder: 41 },
  { id: 'c-ie', countryCode: 'IE', countryName: 'Ireland', nationalityName: 'Irish', isActive: true, displayOrder: 42 },
  { id: 'c-pt', countryCode: 'PT', countryName: 'Portugal', nationalityName: 'Portuguese', isActive: true, displayOrder: 43 },
  { id: 'c-pl', countryCode: 'PL', countryName: 'Poland', nationalityName: 'Polish', isActive: true, displayOrder: 44 },
  { id: 'c-tr', countryCode: 'TR', countryName: 'Turkey', nationalityName: 'Turkish', isActive: true, displayOrder: 45 },
  { id: 'c-il', countryCode: 'IL', countryName: 'Israel', nationalityName: 'Israeli', isActive: true, displayOrder: 46 },
  { id: 'c-eg', countryCode: 'EG', countryName: 'Egypt', nationalityName: 'Egyptian', isActive: true, displayOrder: 47 },

  // All remaining ISO 3166-1 alpha-2 sovereign countries & territories
  { id: 'c-af', countryCode: 'AF', countryName: 'Afghanistan', nationalityName: 'Afghan', isActive: true, displayOrder: 100 },
  { id: 'c-al', countryCode: 'AL', countryName: 'Albania', nationalityName: 'Albanian', isActive: true, displayOrder: 100 },
  { id: 'c-dz', countryCode: 'DZ', countryName: 'Algeria', nationalityName: 'Algerian', isActive: true, displayOrder: 100 },
  { id: 'c-ad', countryCode: 'AD', countryName: 'Andorra', nationalityName: 'Andorran', isActive: true, displayOrder: 100 },
  { id: 'c-ao', countryCode: 'AO', countryName: 'Angola', nationalityName: 'Angolan', isActive: true, displayOrder: 100 },
  { id: 'c-ag', countryCode: 'AG', countryName: 'Antigua and Barbuda', nationalityName: 'Antiguan and Barbudan', isActive: true, displayOrder: 100 },
  { id: 'c-ar', countryCode: 'AR', countryName: 'Argentina', nationalityName: 'Argentine', isActive: true, displayOrder: 100 },
  { id: 'c-am', countryCode: 'AM', countryName: 'Armenia', nationalityName: 'Armenian', isActive: true, displayOrder: 100 },
  { id: 'c-az', countryCode: 'AZ', countryName: 'Azerbaijan', nationalityName: 'Azerbaijani', isActive: true, displayOrder: 100 },
  { id: 'c-bs', countryCode: 'BS', countryName: 'Bahamas', nationalityName: 'Bahamian', isActive: true, displayOrder: 100 },
  { id: 'c-bh', countryCode: 'BH', countryName: 'Bahrain', nationalityName: 'Bahraini', isActive: true, displayOrder: 100 },
  { id: 'c-bb', countryCode: 'BB', countryName: 'Barbados', nationalityName: 'Barbadian', isActive: true, displayOrder: 100 },
  { id: 'c-by', countryCode: 'BY', countryName: 'Belarus', nationalityName: 'Belarusian', isActive: true, displayOrder: 100 },
  { id: 'c-bz', countryCode: 'BZ', countryName: 'Belize', nationalityName: 'Belizean', isActive: true, displayOrder: 100 },
  { id: 'c-bj', countryCode: 'BJ', countryName: 'Benin', nationalityName: 'Beninese', isActive: true, displayOrder: 100 },
  { id: 'c-bo', countryCode: 'BO', countryName: 'Bolivia', nationalityName: 'Bolivian', isActive: true, displayOrder: 100 },
  { id: 'c-ba', countryCode: 'BA', countryName: 'Bosnia and Herzegovina', nationalityName: 'Bosnian and Herzegovinian', isActive: true, displayOrder: 100 },
  { id: 'c-bw', countryCode: 'BW', countryName: 'Botswana', nationalityName: 'Motswana', isActive: true, displayOrder: 100 },
  { id: 'c-bn', countryCode: 'BN', countryName: 'Brunei', nationalityName: 'Bruneian', isActive: true, displayOrder: 100 },
  { id: 'c-bg', countryCode: 'BG', countryName: 'Bulgaria', nationalityName: 'Bulgarian', isActive: true, displayOrder: 100 },
  { id: 'c-bf', countryCode: 'BF', countryName: 'Burkina Faso', nationalityName: 'Burkinabe', isActive: true, displayOrder: 100 },
  { id: 'c-bi', countryCode: 'BI', countryName: 'Burundi', nationalityName: 'Burundian', isActive: true, displayOrder: 100 },
  { id: 'c-cv', countryCode: 'CV', countryName: 'Cabo Verde', nationalityName: 'Cabo Verdean', isActive: true, displayOrder: 100 },
  { id: 'c-kh', countryCode: 'KH', countryName: 'Cambodia', nationalityName: 'Cambodian', isActive: true, displayOrder: 100 },
  { id: 'c-cm', countryCode: 'CM', countryName: 'Cameroon', nationalityName: 'Cameroonian', isActive: true, displayOrder: 100 },
  { id: 'c-cf', countryCode: 'CF', countryName: 'Central African Republic', nationalityName: 'Central African', isActive: true, displayOrder: 100 },
  { id: 'c-td', countryCode: 'TD', countryName: 'Chad', nationalityName: 'Chadian', isActive: true, displayOrder: 100 },
  { id: 'c-cl', countryCode: 'CL', countryName: 'Chile', nationalityName: 'Chilean', isActive: true, displayOrder: 100 },
  { id: 'c-co', countryCode: 'CO', countryName: 'Colombia', nationalityName: 'Colombian', isActive: true, displayOrder: 100 },
  { id: 'c-km', countryCode: 'KM', countryName: 'Comoros', nationalityName: 'Comorian', isActive: true, displayOrder: 100 },
  { id: 'c-cg', countryCode: 'CG', countryName: 'Congo (Brazzaville)', nationalityName: 'Congolese', isActive: true, displayOrder: 100 },
  { id: 'c-cd', countryCode: 'CD', countryName: 'Congo (Kinshasa)', nationalityName: 'Congolese', isActive: true, displayOrder: 100 },
  { id: 'c-cr', countryCode: 'CR', countryName: 'Costa Rica', nationalityName: 'Costa Rican', isActive: true, displayOrder: 100 },
  { id: 'c-hr', countryCode: 'HR', countryName: 'Croatia', nationalityName: 'Croatian', isActive: true, displayOrder: 100 },
  { id: 'c-cu', countryCode: 'CU', countryName: 'Cuba', nationalityName: 'Cuban', isActive: true, displayOrder: 100 },
  { id: 'c-cy', countryCode: 'CY', countryName: 'Cyprus', nationalityName: 'Cypriot', isActive: true, displayOrder: 100 },
  { id: 'c-cz', countryCode: 'CZ', countryName: 'Czech Republic', nationalityName: 'Czech', isActive: true, displayOrder: 100 },
  { id: 'c-dj', countryCode: 'DJ', countryName: 'Djibouti', nationalityName: 'Djiboutian', isActive: true, displayOrder: 100 },
  { id: 'c-dm', countryCode: 'DM', countryName: 'Dominica', nationalityName: 'Dominican', isActive: true, displayOrder: 100 },
  { id: 'c-do', countryCode: 'DO', countryName: 'Dominican Republic', nationalityName: 'Dominican', isActive: true, displayOrder: 100 },
  { id: 'c-ec', countryCode: 'EC', countryName: 'Ecuador', nationalityName: 'Ecuadorian', isActive: true, displayOrder: 100 },
  { id: 'c-sv', countryCode: 'SV', countryName: 'El Salvador', nationalityName: 'Salvadoran', isActive: true, displayOrder: 100 },
  { id: 'c-gq', countryCode: 'GQ', countryName: 'Equatorial Guinea', nationalityName: 'Equatorial Guinean', isActive: true, displayOrder: 100 },
  { id: 'c-er', countryCode: 'ER', countryName: 'Eritrea', nationalityName: 'Eritrean', isActive: true, displayOrder: 100 },
  { id: 'c-ee', countryCode: 'EE', countryName: 'Estonia', nationalityName: 'Estonian', isActive: true, displayOrder: 100 },
  { id: 'c-sz', countryCode: 'SZ', countryName: 'Eswatini', nationalityName: 'Eswatini', isActive: true, displayOrder: 100 },
  { id: 'c-et', countryCode: 'ET', countryName: 'Ethiopia', nationalityName: 'Ethiopian', isActive: true, displayOrder: 100 },
  { id: 'c-fj', countryCode: 'FJ', countryName: 'Fiji', nationalityName: 'Fijian', isActive: true, displayOrder: 100 },
  { id: 'c-ga', countryCode: 'GA', countryName: 'Gabon', nationalityName: 'Gabonese', isActive: true, displayOrder: 100 },
  { id: 'c-gm', countryCode: 'GM', countryName: 'Gambia', nationalityName: 'Gambian', isActive: true, displayOrder: 100 },
  { id: 'c-ge', countryCode: 'GE', countryName: 'Georgia', nationalityName: 'Georgian', isActive: true, displayOrder: 100 },
  { id: 'c-gh', countryCode: 'GH', countryName: 'Ghana', nationalityName: 'Ghanaian', isActive: true, displayOrder: 100 },
  { id: 'c-gr', countryCode: 'GR', countryName: 'Greece', nationalityName: 'Greek', isActive: true, displayOrder: 100 },
  { id: 'c-gd', countryCode: 'GD', countryName: 'Grenada', nationalityName: 'Grenadian', isActive: true, displayOrder: 100 },
  { id: 'c-gt', countryCode: 'GT', countryName: 'Guatemala', nationalityName: 'Guatemalan', isActive: true, displayOrder: 100 },
  { id: 'c-gn', countryCode: 'GN', countryName: 'Guinea', nationalityName: 'Guinean', isActive: true, displayOrder: 100 },
  { id: 'c-gw', countryCode: 'GW', countryName: 'Guinea-Bissau', nationalityName: 'Bissau-Guinean', isActive: true, displayOrder: 100 },
  { id: 'c-gy', countryCode: 'GY', countryName: 'Guyana', nationalityName: 'Guyanese', isActive: true, displayOrder: 100 },
  { id: 'c-ht', countryCode: 'HT', countryName: 'Haiti', nationalityName: 'Haitian', isActive: true, displayOrder: 100 },
  { id: 'c-hn', countryCode: 'HN', countryName: 'Honduras', nationalityName: 'Honduran', isActive: true, displayOrder: 100 },
  { id: 'c-hu', countryCode: 'HU', countryName: 'Hungary', nationalityName: 'Hungarian', isActive: true, displayOrder: 100 },
  { id: 'c-is', countryCode: 'IS', countryName: 'Iceland', nationalityName: 'Icelander', isActive: true, displayOrder: 100 },
  { id: 'c-ir', countryCode: 'IR', countryName: 'Iran', nationalityName: 'Iranian', isActive: true, displayOrder: 100 },
  { id: 'c-iq', countryCode: 'IQ', countryName: 'Iraq', nationalityName: 'Iraqi', isActive: true, displayOrder: 100 },
  { id: 'c-jm', countryCode: 'JM', countryName: 'Jamaica', nationalityName: 'Jamaican', isActive: true, displayOrder: 100 },
  { id: 'c-jo', countryCode: 'JO', countryName: 'Jordan', nationalityName: 'Jordanian', isActive: true, displayOrder: 100 },
  { id: 'c-kz', countryCode: 'KZ', countryName: 'Kazakhstan', nationalityName: 'Kazakhstani', isActive: true, displayOrder: 100 },
  { id: 'c-ke', countryCode: 'KE', countryName: 'Kenya', nationalityName: 'Kenyan', isActive: true, displayOrder: 100 },
  { id: 'c-ki', countryCode: 'KI', countryName: 'Kiribati', nationalityName: 'I-Kiribati', isActive: true, displayOrder: 100 },
  { id: 'c-kp', countryCode: 'KP', countryName: 'North Korea', nationalityName: 'North Korean', isActive: true, displayOrder: 100 },
  { id: 'c-kg', countryCode: 'KG', countryName: 'Kyrgyzstan', nationalityName: 'Kyrgyzstani', isActive: true, displayOrder: 100 },
  { id: 'c-la', countryCode: 'LA', countryName: 'Laos', nationalityName: 'Lao', isActive: true, displayOrder: 100 },
  { id: 'c-lv', countryCode: 'LV', countryName: 'Latvia', nationalityName: 'Latvian', isActive: true, displayOrder: 100 },
  { id: 'c-lb', countryCode: 'LB', countryName: 'Lebanon', nationalityName: 'Lebanese', isActive: true, displayOrder: 100 },
  { id: 'c-ls', countryCode: 'LS', countryName: 'Lesotho', nationalityName: 'Basotho', isActive: true, displayOrder: 100 },
  { id: 'c-lr', countryCode: 'LR', countryName: 'Liberia', nationalityName: 'Liberian', isActive: true, displayOrder: 100 },
  { id: 'c-ly', countryCode: 'LY', countryName: 'Libya', nationalityName: 'Libyan', isActive: true, displayOrder: 100 },
  { id: 'c-li', countryCode: 'LI', countryName: 'Liechtenstein', nationalityName: 'Liechtensteiner', isActive: true, displayOrder: 100 },
  { id: 'c-lt', countryCode: 'LT', countryName: 'Lithuania', nationalityName: 'Lithuanian', isActive: true, displayOrder: 100 },
  { id: 'c-lu', countryCode: 'LU', countryName: 'Luxembourg', nationalityName: 'Luxembourgish', isActive: true, displayOrder: 100 },
  { id: 'c-mg', countryCode: 'MG', countryName: 'Madagascar', nationalityName: 'Malagasy', isActive: true, displayOrder: 100 },
  { id: 'c-mw', countryCode: 'MW', countryName: 'Malawi', nationalityName: 'Malawian', isActive: true, displayOrder: 100 },
  { id: 'c-ml', countryCode: 'ML', countryName: 'Mali', nationalityName: 'Malian', isActive: true, displayOrder: 100 },
  { id: 'c-mt', countryCode: 'MT', countryName: 'Malta', nationalityName: 'Maltese', isActive: true, displayOrder: 100 },
  { id: 'c-mh', countryCode: 'MH', countryName: 'Marshall Islands', nationalityName: 'Marshallese', isActive: true, displayOrder: 100 },
  { id: 'c-mr', countryCode: 'MR', countryName: 'Mauritania', nationalityName: 'Mauritanian', isActive: true, displayOrder: 100 },
  { id: 'c-mu', countryCode: 'MU', countryName: 'Mauritius', nationalityName: 'Mauritian', isActive: true, displayOrder: 100 },
  { id: 'c-fm', countryCode: 'FM', countryName: 'Micronesia', nationalityName: 'Micronesian', isActive: true, displayOrder: 100 },
  { id: 'c-md', countryCode: 'MD', countryName: 'Moldova', nationalityName: 'Moldovan', isActive: true, displayOrder: 100 },
  { id: 'c-mc', countryCode: 'MC', countryName: 'Monaco', nationalityName: 'Monegasque', isActive: true, displayOrder: 100 },
  { id: 'c-mn', countryCode: 'MN', countryName: 'Mongolia', nationalityName: 'Mongolian', isActive: true, displayOrder: 100 },
  { id: 'c-me', countryCode: 'ME', countryName: 'Montenegro', nationalityName: 'Montenegrin', isActive: true, displayOrder: 100 },
  { id: 'c-ma', countryCode: 'MA', countryName: 'Morocco', nationalityName: 'Moroccan', isActive: true, displayOrder: 100 },
  { id: 'c-mz', countryCode: 'MZ', countryName: 'Mozambique', nationalityName: 'Mozambican', isActive: true, displayOrder: 100 },
  { id: 'c-mm', countryCode: 'MM', countryName: 'Myanmar', nationalityName: 'Burmese', isActive: true, displayOrder: 100 },
  { id: 'c-na', countryCode: 'NA', countryName: 'Namibia', nationalityName: 'Namibian', isActive: true, displayOrder: 100 },
  { id: 'c-nr', countryCode: 'NR', countryName: 'Nauru', nationalityName: 'Nauruan', isActive: true, displayOrder: 100 },
  { id: 'c-ni', countryCode: 'NI', countryName: 'Nicaragua', nationalityName: 'Nicaraguan', isActive: true, displayOrder: 100 },
  { id: 'c-ne', countryCode: 'NE', countryName: 'Niger', nationalityName: 'Nigerien', isActive: true, displayOrder: 100 },
  { id: 'c-ng', countryCode: 'NG', countryName: 'Nigeria', nationalityName: 'Nigerian', isActive: true, displayOrder: 100 },
  { id: 'c-mk', countryCode: 'MK', countryName: 'North Macedonia', nationalityName: 'Macedonian', isActive: true, displayOrder: 100 },
  { id: 'c-om', countryCode: 'OM', countryName: 'Oman', nationalityName: 'Omani', isActive: true, displayOrder: 100 },
  { id: 'c-pw', countryCode: 'PW', countryName: 'Palau', nationalityName: 'Palauan', isActive: true, displayOrder: 100 },
  { id: 'c-ps', countryCode: 'PS', countryName: 'Palestine', nationalityName: 'Palestinian', isActive: true, displayOrder: 100 },
  { id: 'c-pa', countryCode: 'PA', countryName: 'Panama', nationalityName: 'Panamanian', isActive: true, displayOrder: 100 },
  { id: 'c-pg', countryCode: 'PG', countryName: 'Papua New Guinea', nationalityName: 'Papua New Guinean', isActive: true, displayOrder: 100 },
  { id: 'c-py', countryCode: 'PY', countryName: 'Paraguay', nationalityName: 'Paraguayan', isActive: true, displayOrder: 100 },
  { id: 'c-pe', countryCode: 'PE', countryName: 'Peru', nationalityName: 'Peruvian', isActive: true, displayOrder: 100 },
  { id: 'c-ro', countryCode: 'RO', countryName: 'Romania', nationalityName: 'Romanian', isActive: true, displayOrder: 100 },
  { id: 'c-rw', countryCode: 'RW', countryName: 'Rwanda', nationalityName: 'Rwandan', isActive: true, displayOrder: 100 },
  { id: 'c-kn', countryCode: 'KN', countryName: 'Saint Kitts and Nevis', nationalityName: 'Kittitian and Nevisian', isActive: true, displayOrder: 100 },
  { id: 'c-lc', countryCode: 'LC', countryName: 'Saint Lucia', nationalityName: 'Saint Lucian', isActive: true, displayOrder: 100 },
  { id: 'c-vc', countryCode: 'VC', countryName: 'Saint Vincent and the Grenadines', nationalityName: 'Saint Vincentian', isActive: true, displayOrder: 100 },
  { id: 'c-ws', countryCode: 'WS', countryName: 'Samoa', nationalityName: 'Samoan', isActive: true, displayOrder: 100 },
  { id: 'c-sm', countryCode: 'SM', countryName: 'San Marino', nationalityName: 'Sammarinese', isActive: true, displayOrder: 100 },
  { id: 'c-st', countryCode: 'ST', countryName: 'Sao Tome and Principe', nationalityName: 'Sao Tomean', isActive: true, displayOrder: 100 },
  { id: 'c-sn', countryCode: 'SN', countryName: 'Senegal', nationalityName: 'Senegalese', isActive: true, displayOrder: 100 },
  { id: 'c-rs', countryCode: 'RS', countryName: 'Serbia', nationalityName: 'Serbian', isActive: true, displayOrder: 100 },
  { id: 'c-sc', countryCode: 'SC', countryName: 'Seychelles', nationalityName: 'Seychellois', isActive: true, displayOrder: 100 },
  { id: 'c-sl', countryCode: 'SL', countryName: 'Sierra Leone', nationalityName: 'Sierra Leonean', isActive: true, displayOrder: 100 },
  { id: 'c-sk', countryCode: 'SK', countryName: 'Slovakia', nationalityName: 'Slovak', isActive: true, displayOrder: 100 },
  { id: 'c-si', countryCode: 'SI', countryName: 'Slovenia', nationalityName: 'Slovenian', isActive: true, displayOrder: 100 },
  { id: 'c-sb', countryCode: 'SB', countryName: 'Solomon Islands', nationalityName: 'Solomon Islander', isActive: true, displayOrder: 100 },
  { id: 'c-so', countryCode: 'SO', countryName: 'Somalia', nationalityName: 'Somali', isActive: true, displayOrder: 100 },
  { id: 'c-ss', countryCode: 'SS', countryName: 'South Sudan', nationalityName: 'South Sudanese', isActive: true, displayOrder: 100 },
  { id: 'c-sd', countryCode: 'SD', countryName: 'Sudan', nationalityName: 'Sudanese', isActive: true, displayOrder: 100 },
  { id: 'c-sr', countryCode: 'SR', countryName: 'Suriname', nationalityName: 'Surinamese', isActive: true, displayOrder: 100 },
  { id: 'c-sy', countryCode: 'SY', countryName: 'Syria', nationalityName: 'Syrian', isActive: true, displayOrder: 100 },
  { id: 'c-tw', countryCode: 'TW', countryName: 'Taiwan', nationalityName: 'Taiwanese', isActive: true, displayOrder: 100 },
  { id: 'c-tj', countryCode: 'TJ', countryName: 'Tajikistan', nationalityName: 'Tajik', isActive: true, displayOrder: 100 },
  { id: 'c-tz', countryCode: 'TZ', countryName: 'Tanzania', nationalityName: 'Tanzanian', isActive: true, displayOrder: 100 },
  { id: 'c-tl', countryCode: 'TL', countryName: 'Timor-Leste', nationalityName: 'Timorese', isActive: true, displayOrder: 100 },
  { id: 'c-tg', countryCode: 'TG', countryName: 'Togo', nationalityName: 'Togolese', isActive: true, displayOrder: 100 },
  { id: 'c-to', countryCode: 'TO', countryName: 'Tonga', nationalityName: 'Tongan', isActive: true, displayOrder: 100 },
  { id: 'c-tt', countryCode: 'TT', countryName: 'Trinidad and Tobago', nationalityName: 'Trinidadian and Tobagonian', isActive: true, displayOrder: 100 },
  { id: 'c-tn', countryCode: 'TN', countryName: 'Tunisia', nationalityName: 'Tunisian', isActive: true, displayOrder: 100 },
  { id: 'c-tm', countryCode: 'TM', countryName: 'Turkmenistan', nationalityName: 'Turkmen', isActive: true, displayOrder: 100 },
  { id: 'c-tv', countryCode: 'TV', countryName: 'Tuvalu', nationalityName: 'Tuvaluan', isActive: true, displayOrder: 100 },
  { id: 'c-ug', countryCode: 'UG', countryName: 'Uganda', nationalityName: 'Ugandan', isActive: true, displayOrder: 100 },
  { id: 'c-ua', countryCode: 'UA', countryName: 'Ukraine', nationalityName: 'Ukrainian', isActive: true, displayOrder: 100 },
  { id: 'c-uy', countryCode: 'UY', countryName: 'Uruguay', nationalityName: 'Uruguayan', isActive: true, displayOrder: 100 },
  { id: 'c-uz', countryCode: 'UZ', countryName: 'Uzbekistan', nationalityName: 'Uzbek', isActive: true, displayOrder: 100 },
  { id: 'c-vu', countryCode: 'VU', countryName: 'Vanuatu', nationalityName: 'Ni-Vanuatu', isActive: true, displayOrder: 100 },
  { id: 'c-va', countryCode: 'VA', countryName: 'Vatican City', nationalityName: 'Vatican', isActive: true, displayOrder: 100 },
  { id: 'c-ve', countryCode: 'VE', countryName: 'Venezuela', nationalityName: 'Venezuelan', isActive: true, displayOrder: 100 },
  { id: 'c-ye', countryCode: 'YE', countryName: 'Yemen', nationalityName: 'Yemeni', isActive: true, displayOrder: 100 },
  { id: 'c-zm', countryCode: 'ZM', countryName: 'Zambia', nationalityName: 'Zambian', isActive: true, displayOrder: 100 },
  { id: 'c-zw', countryCode: 'ZW', countryName: 'Zimbabwe', nationalityName: 'Zimbabwean', isActive: true, displayOrder: 100 },

  // Territories and autonomous regions
  { id: 'c-hk', countryCode: 'HK', countryName: 'Hong Kong', nationalityName: 'Hong Konger', isActive: true, displayOrder: 50 },
  { id: 'c-mo', countryCode: 'MO', countryName: 'Macau', nationalityName: 'Macanese', isActive: true, displayOrder: 50 },
  { id: 'c-pr', countryCode: 'PR', countryName: 'Puerto Rico', nationalityName: 'Puerto Rican', isActive: true, displayOrder: 100 },
  { id: 'c-bm', countryCode: 'BM', countryName: 'Bermuda', nationalityName: 'Bermudian', isActive: true, displayOrder: 100 },
  { id: 'c-ky', countryCode: 'KY', countryName: 'Cayman Islands', nationalityName: 'Caymanian', isActive: true, displayOrder: 100 },
  { id: 'c-gi', countryCode: 'GI', countryName: 'Gibraltar', nationalityName: 'Gibraltarian', isActive: true, displayOrder: 100 },
  { id: 'c-gl', countryCode: 'GL', countryName: 'Greenland', nationalityName: 'Greenlandic', isActive: true, displayOrder: 100 },
  { id: 'c-gu', countryCode: 'GU', countryName: 'Guam', nationalityName: 'Guamanian', isActive: true, displayOrder: 100 },
  { id: 'c-fo', countryCode: 'FO', countryName: 'Faroe Islands', nationalityName: 'Faroese', isActive: true, displayOrder: 100 },
  { id: 'c-aw', countryCode: 'AW', countryName: 'Aruba', nationalityName: 'Aruban', isActive: true, displayOrder: 100 },
  { id: 'c-cw', countryCode: 'CW', countryName: 'Curacao', nationalityName: 'Curacaoan', isActive: true, displayOrder: 100 },
  { id: 'c-pf', countryCode: 'PF', countryName: 'French Polynesia', nationalityName: 'French Polynesian', isActive: true, displayOrder: 100 },
  { id: 'c-nc', countryCode: 'NC', countryName: 'New Caledonia', nationalityName: 'New Caledonian', isActive: true, displayOrder: 100 },
  { id: 'c-vi', countryCode: 'VI', countryName: 'U.S. Virgin Islands', nationalityName: 'U.S. Virgin Islander', isActive: true, displayOrder: 100 },
  { id: 'c-vg', countryCode: 'VG', countryName: 'British Virgin Islands', nationalityName: 'British Virgin Islander', isActive: true, displayOrder: 100 },
  { id: 'c-tc', countryCode: 'TC', countryName: 'Turks and Caicos Islands', nationalityName: 'Turks and Caicos Islander', isActive: true, displayOrder: 100 },
];

let globalCachedCountries: CountryMasterItem[] | null = null;
let inFlightFetch: Promise<CountryMasterItem[]> | null = null;

export function useCountryMaster() {
  const [countries, setCountries] = useState<CountryMasterItem[]>(() => {
    return globalCachedCountries || FALLBACK_COUNTRIES;
  });
  const [loading, setLoading] = useState<boolean>(!globalCachedCountries);
  const [error, setError] = useState<string | null>(null);

  const loadCountries = useCallback(async (forceRefresh = false) => {
    if (!forceRefresh && globalCachedCountries) {
      setCountries(globalCachedCountries);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (!inFlightFetch || forceRefresh) {
        inFlightFetch = api.getCountries().then((data) => {
          if (Array.isArray(data) && data.length > 0) {
            globalCachedCountries = data;
            return data;
          }
          return FALLBACK_COUNTRIES;
        });
      }

      const res = await inFlightFetch;
      setCountries(res);
    } catch (err: any) {
      console.warn('Could not load countries from API, using complete offline master dataset:', err);
      setError(err?.message || 'Failed to fetch country records. Using offline master list.');
      setCountries(globalCachedCountries || FALLBACK_COUNTRIES);
    } finally {
      setLoading(false);
      inFlightFetch = null;
    }
  }, []);

  useEffect(() => {
    loadCountries();
  }, [loadCountries]);

  /**
   * Normalized dropdown options for MasterSearchableSelect:
   * - Primary label: Demonym / Nationality (e.g., "Nepali", "Indian", "American")
   * - Value: Database Country Id
   * - Subtext: Official Country Name (e.g., "Nepal", "India", "United States")
   */
  const options: SelectOption[] = useMemo(() => {
    return countries
      .filter((c) => c.isActive)
      .map((c) => ({
        label: c.nationalityName,
        value: c.id,
        subtext: c.countryName,
      }));
  }, [countries]);

  /**
   * Helper to look up a country record by ID, CountryCode, Nationality, or Country Name.
   * Ensures backwards compatibility with historical free-text values.
   */
  const findCountry = useCallback(
    (query?: string | null): CountryMasterItem | undefined => {
      if (!query || typeof query !== 'string') return undefined;
      const clean = query.trim().toLowerCase();
      return countries.find(
        (c) =>
          c.id.toLowerCase() === clean ||
          c.countryCode.toLowerCase() === clean ||
          c.nationalityName.toLowerCase() === clean ||
          c.countryName.toLowerCase() === clean
      );
    },
    [countries]
  );

  return {
    countries,
    options,
    loading,
    error,
    refetch: () => loadCountries(true),
    findCountry,
  };
}
