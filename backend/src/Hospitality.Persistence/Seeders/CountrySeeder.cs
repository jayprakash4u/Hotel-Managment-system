using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Hospitality.Domain.Entities;
using Hospitality.Persistence.Data;

namespace Hospitality.Persistence.Seeders;

public static class CountrySeeder
{
    public static async Task SeedCountriesAndMigrateGuestsAsync(HospitalityDbContext db, ILogger? logger = null)
    {
        try
        {
            // 1. Ensure table and columns exist in PostgreSQL
            await db.Database.ExecuteSqlRawAsync(@"
                CREATE TABLE IF NOT EXISTS ""Country"" (
                    ""id"" text PRIMARY KEY,
                    ""countryCode"" varchar(2) NOT NULL,
                    ""countryName"" text NOT NULL,
                    ""nationalityName"" text NOT NULL,
                    ""isActive"" boolean NOT NULL DEFAULT true,
                    ""displayOrder"" integer NOT NULL DEFAULT 100,
                    ""createdAt"" timestamp with time zone NOT NULL DEFAULT now(),
                    ""updatedAt"" timestamp with time zone NOT NULL DEFAULT now()
                );

                CREATE UNIQUE INDEX IF NOT EXISTS ""IX_Country_countryCode"" ON ""Country"" (""countryCode"");
                CREATE INDEX IF NOT EXISTS ""IX_Country_nationalityName"" ON ""Country"" (""nationalityName"");
                CREATE INDEX IF NOT EXISTS ""IX_Country_countryName"" ON ""Country"" (""countryName"");

                ALTER TABLE IF EXISTS ""Guest"" ADD COLUMN IF NOT EXISTS ""countryId"" text;
                ALTER TABLE IF EXISTS ""Guest"" ADD COLUMN IF NOT EXISTS ""nationality"" text;
                ALTER TABLE IF EXISTS ""Guests"" ADD COLUMN IF NOT EXISTS ""countryId"" text;
                ALTER TABLE IF EXISTS ""Guests"" ADD COLUMN IF NOT EXISTS ""nationality"" text;
            ");

            // 2. Check if countries are already seeded
            var existingCount = await db.Countries.CountAsync();
            if (existingCount < 200)
            {
                var countries = GetInitialCountries();
                var existingCodes = await db.Countries.Select(c => c.CountryCode).ToListAsync();
                var existingCodesSet = new HashSet<string>(existingCodes, StringComparer.OrdinalIgnoreCase);

                var toAdd = new List<Country>();
                foreach (var c in countries)
                {
                    if (!existingCodesSet.Contains(c.CountryCode))
                    {
                        toAdd.Add(c);
                        existingCodesSet.Add(c.CountryCode);
                    }
                }

                if (toAdd.Count > 0)
                {
                    db.Countries.AddRange(toAdd);
                    await db.SaveChangesAsync();
                    logger?.LogInformation("CountrySeeder: Successfully seeded {Count} countries.", toAdd.Count);
                }
            }

            // 3. Migrate existing guests safely without breaking historical records
            await db.Database.ExecuteSqlRawAsync(@"
                -- Map Guest by CountryName or NationalityName
                UPDATE ""Guest"" g
                SET ""countryId"" = c.""id"",
                    ""nationality"" = COALESCE(g.""nationality"", c.""nationalityName"")
                FROM ""Country"" c
                WHERE g.""countryId"" IS NULL
                  AND (LOWER(TRIM(g.""country"")) = LOWER(c.""countryName"")
                    OR LOWER(TRIM(g.""country"")) = LOWER(c.""nationalityName"")
                    OR (LOWER(TRIM(g.""country"")) = 'usa' AND c.""countryCode"" = 'US')
                    OR (LOWER(TRIM(g.""country"")) = 'uk' AND c.""countryCode"" = 'GB'));

                -- Fallback for default Nepal if country is empty
                UPDATE ""Guest"" g
                SET ""countryId"" = c.""id"",
                    ""nationality"" = 'Nepali'
                FROM ""Country"" c
                WHERE g.""countryId"" IS NULL
                  AND c.""countryCode"" = 'NP'
                  AND (g.""country"" IS NULL OR TRIM(g.""country"") = '' OR LOWER(TRIM(g.""country"")) = 'nepal');
            ");

            logger?.LogInformation("CountrySeeder: Guest records successfully migrated with Country master references.");
        }
        catch (Exception ex)
        {
            logger?.LogError(ex, "CountrySeeder: An error occurred while seeding countries or migrating guests.");
        }
    }

    public static List<Country> GetInitialCountries()
    {
        var list = new List<(string Code, string Name, string Nationality, int Order)>
        {
            // Primary & Frequent Hospitality Demographics
            ("NP", "Nepal", "Nepali", 1),
            ("IN", "India", "Indian", 2),
            ("US", "United States", "American", 3),
            ("GB", "United Kingdom", "British", 4),
            ("AU", "Australia", "Australian", 5),
            ("CN", "China", "Chinese", 6),
            ("JP", "Japan", "Japanese", 7),
            ("CA", "Canada", "Canadian", 8),
            ("DE", "Germany", "German", 9),
            ("FR", "France", "French", 10),
            ("BT", "Bhutan", "Bhutanese", 11),
            ("BD", "Bangladesh", "Bangladeshi", 12),
            ("LK", "Sri Lanka", "Sri Lankan", 13),
            ("TH", "Thailand", "Thai", 14),
            ("SG", "Singapore", "Singaporean", 15),
            ("MY", "Malaysia", "Malaysian", 16),
            ("AE", "United Arab Emirates", "Emirati", 17),
            ("KR", "South Korea", "South Korean", 18),
            ("IT", "Italy", "Italian", 19),
            ("ES", "Spain", "Spanish", 20),
            ("CH", "Switzerland", "Swiss", 21),
            ("NL", "Netherlands", "Dutch", 22),
            ("RU", "Russia", "Russian", 23),
            ("SA", "Saudi Arabia", "Saudi", 24),
            ("QA", "Qatar", "Qatari", 25),
            ("KW", "Kuwait", "Kuwaiti", 26),
            ("MV", "Maldives", "Maldivian", 27),
            ("PK", "Pakistan", "Pakistani", 28),
            ("ID", "Indonesia", "Indonesian", 29),
            ("PH", "Philippines", "Filipino", 30),
            ("VN", "Vietnam", "Vietnamese", 31),
            ("NZ", "New Zealand", "New Zealander", 32),
            ("ZA", "South Africa", "South African", 33),
            ("BR", "Brazil", "Brazilian", 34),
            ("MX", "Mexico", "Mexican", 35),
            ("SE", "Sweden", "Swedish", 36),
            ("NO", "Norway", "Norwegian", 37),
            ("DK", "Denmark", "Danish", 38),
            ("FI", "Finland", "Finnish", 39),
            ("AT", "Austria", "Austrian", 40),
            ("BE", "Belgium", "Belgian", 41),
            ("IE", "Ireland", "Irish", 42),
            ("PT", "Portugal", "Portuguese", 43),
            ("PL", "Poland", "Polish", 44),
            ("TR", "Turkey", "Turkish", 45),
            ("IL", "Israel", "Israeli", 46),
            ("EG", "Egypt", "Egyptian", 47),

            // All remaining ISO 3166-1 alpha-2 sovereign countries and territories
            ("AF", "Afghanistan", "Afghan", 100),
            ("AL", "Albania", "Albanian", 100),
            ("DZ", "Algeria", "Algerian", 100),
            ("AD", "Andorra", "Andorran", 100),
            ("AO", "Angola", "Angolan", 100),
            ("AG", "Antigua and Barbuda", "Antiguan and Barbudan", 100),
            ("AR", "Argentina", "Argentine", 100),
            ("AM", "Armenia", "Armenian", 100),
            ("AZ", "Azerbaijan", "Azerbaijani", 100),
            ("BS", "Bahamas", "Bahamian", 100),
            ("BH", "Bahrain", "Bahraini", 100),
            ("BB", "Barbados", "Barbadian", 100),
            ("BY", "Belarus", "Belarusian", 100),
            ("BZ", "Belize", "Belizean", 100),
            ("BJ", "Benin", "Beninese", 100),
            ("BO", "Bolivia", "Bolivian", 100),
            ("BA", "Bosnia and Herzegovina", "Bosnian and Herzegovinian", 100),
            ("BW", "Botswana", "Motswana", 100),
            ("BN", "Brunei", "Bruneian", 100),
            ("BG", "Bulgaria", "Bulgarian", 100),
            ("BF", "Burkina Faso", "Burkinabe", 100),
            ("BI", "Burundi", "Burundian", 100),
            ("CV", "Cabo Verde", "Cabo Verdean", 100),
            ("KH", "Cambodia", "Cambodian", 100),
            ("CM", "Cameroon", "Cameroonian", 100),
            ("CF", "Central African Republic", "Central African", 100),
            ("TD", "Chad", "Chadian", 100),
            ("CL", "Chile", "Chilean", 100),
            ("CO", "Colombia", "Colombian", 100),
            ("KM", "Comoros", "Comorian", 100),
            ("CG", "Congo (Brazzaville)", "Congolese", 100),
            ("CD", "Congo (Kinshasa)", "Congolese", 100),
            ("CR", "Costa Rica", "Costa Rican", 100),
            ("HR", "Croatia", "Croatian", 100),
            ("CU", "Cuba", "Cuban", 100),
            ("CY", "Cyprus", "Cypriot", 100),
            ("CZ", "Czech Republic", "Czech", 100),
            ("DJ", "Djibouti", "Djiboutian", 100),
            ("DM", "Dominica", "Dominican", 100),
            ("DO", "Dominican Republic", "Dominican", 100),
            ("EC", "Ecuador", "Ecuadorian", 100),
            ("SV", "El Salvador", "Salvadoran", 100),
            ("GQ", "Equatorial Guinea", "Equatorial Guinean", 100),
            ("ER", "Eritrea", "Eritrean", 100),
            ("EE", "Estonia", "Estonian", 100),
            ("SZ", "Eswatini", "Eswatini", 100),
            ("ET", "Ethiopia", "Ethiopian", 100),
            ("FJ", "Fiji", "Fijian", 100),
            ("GA", "Gabon", "Gabonese", 100),
            ("GM", "Gambia", "Gambian", 100),
            ("GE", "Georgia", "Georgian", 100),
            ("GH", "Ghana", "Ghanaian", 100),
            ("GR", "Greece", "Greek", 100),
            ("GD", "Grenada", "Grenadian", 100),
            ("GT", "Guatemala", "Guatemalan", 100),
            ("GN", "Guinea", "Guinean", 100),
            ("GW", "Guinea-Bissau", "Bissau-Guinean", 100),
            ("GY", "Guyana", "Guyanese", 100),
            ("HT", "Haiti", "Haitian", 100),
            ("HN", "Honduras", "Honduran", 100),
            ("HU", "Hungary", "Hungarian", 100),
            ("IS", "Iceland", "Icelander", 100),
            ("IR", "Iran", "Iranian", 100),
            ("IQ", "Iraq", "Iraqi", 100),
            ("JM", "Jamaica", "Jamaican", 100),
            ("JO", "Jordan", "Jordanian", 100),
            ("KZ", "Kazakhstan", "Kazakhstani", 100),
            ("KE", "Kenya", "Kenyan", 100),
            ("KI", "Kiribati", "I-Kiribati", 100),
            ("KP", "North Korea", "North Korean", 100),
            ("KG", "Kyrgyzstan", "Kyrgyzstani", 100),
            ("LA", "Laos", "Lao", 100),
            ("LV", "Latvia", "Latvian", 100),
            ("LB", "Lebanon", "Lebanese", 100),
            ("LS", "Lesotho", "Basotho", 100),
            ("LR", "Liberia", "Liberian", 100),
            ("LY", "Libya", "Libyan", 100),
            ("LI", "Liechtenstein", "Liechtensteiner", 100),
            ("LT", "Lithuania", "Lithuanian", 100),
            ("LU", "Luxembourg", "Luxembourgish", 100),
            ("MG", "Madagascar", "Malagasy", 100),
            ("MW", "Malawi", "Malawian", 100),
            ("ML", "Mali", "Malian", 100),
            ("MT", "Malta", "Maltese", 100),
            ("MH", "Marshall Islands", "Marshallese", 100),
            ("MR", "Mauritania", "Mauritanian", 100),
            ("MU", "Mauritius", "Mauritian", 100),
            ("FM", "Micronesia", "Micronesian", 100),
            ("MD", "Moldova", "Moldovan", 100),
            ("MC", "Monaco", "Monegasque", 100),
            ("MN", "Mongolia", "Mongolian", 100),
            ("ME", "Montenegro", "Montenegrin", 100),
            ("MA", "Morocco", "Moroccan", 100),
            ("MZ", "Mozambique", "Mozambican", 100),
            ("MM", "Myanmar", "Burmese", 100),
            ("NA", "Namibia", "Namibian", 100),
            ("NR", "Nauru", "Nauruan", 100),
            ("NI", "Nicaragua", "Nicaraguan", 100),
            ("NE", "Niger", "Nigerien", 100),
            ("NG", "Nigeria", "Nigerian", 100),
            ("MK", "North Macedonia", "Macedonian", 100),
            ("OM", "Oman", "Omani", 100),
            ("PW", "Palau", "Palauan", 100),
            ("PS", "Palestine", "Palestinian", 100),
            ("PA", "Panama", "Panamanian", 100),
            ("PG", "Papua New Guinea", "Papua New Guinean", 100),
            ("PY", "Paraguay", "Paraguayan", 100),
            ("PE", "Peru", "Peruvian", 100),
            ("RO", "Romania", "Romanian", 100),
            ("RW", "Rwanda", "Rwandan", 100),
            ("KN", "Saint Kitts and Nevis", "Kittitian and Nevisian", 100),
            ("LC", "Saint Lucia", "Saint Lucian", 100),
            ("VC", "Saint Vincent and the Grenadines", "Saint Vincentian", 100),
            ("WS", "Samoa", "Samoan", 100),
            ("SM", "San Marino", "Sammarinese", 100),
            ("ST", "Sao Tome and Principe", "Sao Tomean", 100),
            ("SN", "Senegal", "Senegalese", 100),
            ("RS", "Serbia", "Serbian", 100),
            ("SC", "Seychelles", "Seychellois", 100),
            ("SL", "Sierra Leone", "Sierra Leonean", 100),
            ("SK", "Slovakia", "Slovak", 100),
            ("SI", "Slovenia", "Slovenian", 100),
            ("SB", "Solomon Islands", "Solomon Islander", 100),
            ("SO", "Somalia", "Somali", 100),
            ("SS", "South Sudan", "South Sudanese", 100),
            ("SD", "Sudan", "Sudanese", 100),
            ("SR", "Suriname", "Surinamese", 100),
            ("SY", "Syria", "Syrian", 100),
            ("TW", "Taiwan", "Taiwanese", 100),
            ("TJ", "Tajikistan", "Tajik", 100),
            ("TZ", "Tanzania", "Tanzanian", 100),
            ("TL", "Timor-Leste", "Timorese", 100),
            ("TG", "Togo", "Togolese", 100),
            ("TO", "Tonga", "Tongan", 100),
            ("TT", "Trinidad and Tobago", "Trinidadian and Tobagonian", 100),
            ("TN", "Tunisia", "Tunisian", 100),
            ("TM", "Turkmenistan", "Turkmen", 100),
            ("TV", "Tuvalu", "Tuvaluan", 100),
            ("UG", "Uganda", "Ugandan", 100),
            ("UA", "Ukraine", "Ukrainian", 100),
            ("UY", "Uruguay", "Uruguayan", 100),
            ("UZ", "Uzbekistan", "Uzbek", 100),
            ("VU", "Vanuatu", "Ni-Vanuatu", 100),
            ("VA", "Vatican City", "Vatican", 100),
            ("VE", "Venezuela", "Venezuelan", 100),
            ("YE", "Yemen", "Yemeni", 100),
            ("ZM", "Zambia", "Zambian", 100),
            ("ZW", "Zimbabwe", "Zimbabwean", 100),

            // Territories & autonomous regions commonly in hospitality
            ("HK", "Hong Kong", "Hong Konger", 50),
            ("MO", "Macau", "Macanese", 50),
            ("PR", "Puerto Rico", "Puerto Rican", 100),
            ("BM", "Bermuda", "Bermudian", 100),
            ("KY", "Cayman Islands", "Caymanian", 100),
            ("GI", "Gibraltar", "Gibraltarian", 100),
            ("GL", "Greenland", "Greenlandic", 100),
            ("GU", "Guam", "Guamanian", 100),
            ("FO", "Faroe Islands", "Faroese", 100),
            ("AW", "Aruba", "Aruban", 100),
            ("CW", "Curacao", "Curacaoan", 100),
            ("PF", "French Polynesia", "French Polynesian", 100),
            ("NC", "New Caledonia", "New Caledonian", 100),
            ("VI", "U.S. Virgin Islands", "U.S. Virgin Islander", 100),
            ("VG", "British Virgin Islands", "British Virgin Islander", 100),
            ("TC", "Turks and Caicos Islands", "Turks and Caicos Islander", 100)
        };

        return list.Select(item => new Country
        {
            Id = Guid.NewGuid().ToString("N"),
            CountryCode = item.Code,
            CountryName = item.Name,
            NationalityName = item.Nationality,
            IsActive = true,
            DisplayOrder = item.Order,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        }).ToList();
    }
}
