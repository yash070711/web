/* Major cities and counties by US state — used by Define Jurisdiction. */
(function () {
  window.PS = window.PS || {};
  const STATES = [
    { abbr: 'AL', name: 'Alabama' }, { abbr: 'AK', name: 'Alaska' }, { abbr: 'AZ', name: 'Arizona' },
    { abbr: 'AR', name: 'Arkansas' }, { abbr: 'CA', name: 'California' }, { abbr: 'CO', name: 'Colorado' },
    { abbr: 'CT', name: 'Connecticut' }, { abbr: 'DE', name: 'Delaware' }, { abbr: 'DC', name: 'District of Columbia' },
    { abbr: 'FL', name: 'Florida' }, { abbr: 'GA', name: 'Georgia' }, { abbr: 'HI', name: 'Hawaii' },
    { abbr: 'ID', name: 'Idaho' }, { abbr: 'IL', name: 'Illinois' }, { abbr: 'IN', name: 'Indiana' },
    { abbr: 'IA', name: 'Iowa' }, { abbr: 'KS', name: 'Kansas' }, { abbr: 'KY', name: 'Kentucky' },
    { abbr: 'LA', name: 'Louisiana' }, { abbr: 'ME', name: 'Maine' }, { abbr: 'MD', name: 'Maryland' },
    { abbr: 'MA', name: 'Massachusetts' }, { abbr: 'MI', name: 'Michigan' }, { abbr: 'MN', name: 'Minnesota' },
    { abbr: 'MS', name: 'Mississippi' }, { abbr: 'MO', name: 'Missouri' }, { abbr: 'MT', name: 'Montana' },
    { abbr: 'NE', name: 'Nebraska' }, { abbr: 'NV', name: 'Nevada' }, { abbr: 'NH', name: 'New Hampshire' },
    { abbr: 'NJ', name: 'New Jersey' }, { abbr: 'NM', name: 'New Mexico' }, { abbr: 'NY', name: 'New York' },
    { abbr: 'NC', name: 'North Carolina' }, { abbr: 'ND', name: 'North Dakota' }, { abbr: 'OH', name: 'Ohio' },
    { abbr: 'OK', name: 'Oklahoma' }, { abbr: 'OR', name: 'Oregon' }, { abbr: 'PA', name: 'Pennsylvania' },
    { abbr: 'RI', name: 'Rhode Island' }, { abbr: 'SC', name: 'South Carolina' }, { abbr: 'SD', name: 'South Dakota' },
    { abbr: 'TN', name: 'Tennessee' }, { abbr: 'TX', name: 'Texas' }, { abbr: 'UT', name: 'Utah' },
    { abbr: 'VT', name: 'Vermont' }, { abbr: 'VA', name: 'Virginia' }, { abbr: 'WA', name: 'Washington' },
    { abbr: 'WV', name: 'West Virginia' }, { abbr: 'WI', name: 'Wisconsin' }, { abbr: 'WY', name: 'Wyoming' }
  ];

  const CITIES = {
    AL: ['Birmingham', 'Montgomery', 'Huntsville', 'Mobile', 'Tuscaloosa', 'Hoover', 'Auburn', 'Jefferson County'],
    AK: ['Anchorage', 'Fairbanks', 'Juneau', 'Wasilla', 'Sitka', 'Ketchikan', 'Kenai Peninsula'],
    AZ: ['Phoenix', 'Tucson', 'Mesa', 'Chandler', 'Scottsdale', 'Glendale', 'Gilbert', 'Tempe', 'Maricopa County'],
    AR: ['Little Rock', 'Fayetteville', 'Fort Smith', 'Springdale', 'Jonesboro', 'Rogers', 'Pulaski County'],
    CA: ['Los Angeles', 'San Diego', 'San Jose', 'San Francisco', 'Sacramento', 'Fresno', 'Oakland', 'Long Beach', 'Anaheim', 'Riverside', 'Los Angeles County', 'Orange County'],
    CO: ['Denver', 'Colorado Springs', 'Aurora', 'Fort Collins', 'Lakewood', 'Boulder', 'Denver County'],
    CT: ['Bridgeport', 'New Haven', 'Hartford', 'Stamford', 'Waterbury', 'Norwalk', 'Fairfield County'],
    DE: ['Wilmington', 'Dover', 'Newark', 'Middletown', 'New Castle County', 'Kent County', 'Sussex County'],
    DC: ['Washington', 'Northwest', 'Northeast', 'Southeast', 'Southwest'],
    FL: ['Jacksonville', 'Miami', 'Tampa', 'Orlando', 'St. Petersburg', 'Hialeah', 'Fort Lauderdale', 'Tallahassee', 'Miami-Dade County', 'Orange County'],
    GA: ['Atlanta', 'Augusta', 'Columbus', 'Macon', 'Savannah', 'Athens', 'Sandy Springs', 'Fulton County', 'Gwinnett County'],
    HI: ['Honolulu', 'Pearl City', 'Hilo', 'Kailua', 'Kaneohe', 'Maui County', 'Hawaii County'],
    ID: ['Boise', 'Meridian', 'Nampa', 'Idaho Falls', 'Pocatello', 'Caldwell', 'Ada County'],
    IL: ['Chicago', 'Aurora', 'Naperville', 'Joliet', 'Rockford', 'Springfield', 'Elgin', 'Cook County', 'DuPage County'],
    IN: ['Indianapolis', 'Fort Wayne', 'Evansville', 'South Bend', 'Carmel', 'Bloomington', 'Marion County'],
    IA: ['Des Moines', 'Cedar Rapids', 'Davenport', 'Sioux City', 'Iowa City', 'Waterloo', 'Polk County'],
    KS: ['Wichita', 'Overland Park', 'Kansas City', 'Olathe', 'Topeka', 'Lawrence', 'Johnson County'],
    KY: ['Louisville', 'Lexington', 'Bowling Green', 'Owensboro', 'Covington', 'Jefferson County', 'Fayette County'],
    LA: ['New Orleans', 'Baton Rouge', 'Shreveport', 'Lafayette', 'Lake Charles', 'Kenner', 'Orleans Parish', 'East Baton Rouge Parish'],
    ME: ['Portland', 'Lewiston', 'Bangor', 'South Portland', 'Auburn', 'Cumberland County'],
    MD: ['Baltimore', 'Columbia', 'Germantown', 'Silver Spring', 'Frederick', 'Rockville', 'Montgomery County', 'Prince George\'s County'],
    MA: ['Boston', 'Worcester', 'Springfield', 'Cambridge', 'Lowell', 'Brockton', 'Quincy', 'Suffolk County', 'Middlesex County'],
    MI: ['Detroit', 'Grand Rapids', 'Warren', 'Sterling Heights', 'Ann Arbor', 'Lansing', 'Wayne County', 'Oakland County'],
    MN: ['Minneapolis', 'St. Paul', 'Rochester', 'Duluth', 'Bloomington', 'Brooklyn Park', 'Hennepin County', 'Ramsey County'],
    MS: ['Jackson', 'Gulfport', 'Southaven', 'Hattiesburg', 'Biloxi', 'Meridian', 'Hinds County'],
    MO: ['Kansas City', 'St. Louis', 'Springfield', 'Columbia', 'Independence', 'Lee\'s Summit', 'St. Louis County', 'Jackson County'],
    MT: ['Billings', 'Missoula', 'Great Falls', 'Bozeman', 'Butte', 'Helena', 'Yellowstone County'],
    NE: ['Omaha', 'Lincoln', 'Bellevue', 'Grand Island', 'Kearney', 'Douglas County', 'Lancaster County'],
    NV: ['Las Vegas', 'Henderson', 'Reno', 'North Las Vegas', 'Sparks', 'Carson City', 'Clark County', 'Washoe County'],
    NH: ['Manchester', 'Nashua', 'Concord', 'Dover', 'Rochester', 'Hillsborough County', 'Rockingham County'],
    NJ: ['Newark', 'Jersey City', 'Paterson', 'Elizabeth', 'Trenton', 'Camden', 'Essex County', 'Bergen County'],
    NM: ['Albuquerque', 'Las Cruces', 'Rio Rancho', 'Santa Fe', 'Roswell', 'Farmington', 'Bernalillo County'],
    NY: ['New York City', 'Buffalo', 'Rochester', 'Yonkers', 'Syracuse', 'Albany', 'New York County', 'Kings County', 'Queens County', 'Westchester County'],
    NC: ['Charlotte', 'Raleigh', 'Greensboro', 'Durham', 'Winston-Salem', 'Fayetteville', 'Mecklenburg County', 'Wake County'],
    ND: ['Fargo', 'Bismarck', 'Grand Forks', 'Minot', 'West Fargo', 'Cass County', 'Burleigh County'],
    OH: ['Columbus', 'Cleveland', 'Cincinnati', 'Toledo', 'Akron', 'Dayton', 'Franklin County', 'Cuyahoga County'],
    OK: ['Oklahoma City', 'Tulsa', 'Norman', 'Broken Arrow', 'Edmond', 'Lawton', 'Oklahoma County', 'Tulsa County'],
    OR: ['Portland', 'Salem', 'Eugene', 'Gresham', 'Hillsboro', 'Beaverton', 'Multnomah County', 'Washington County'],
    PA: ['Philadelphia', 'Pittsburgh', 'Allentown', 'Reading', 'Scranton', 'Erie', 'Philadelphia County', 'Allegheny County'],
    RI: ['Providence', 'Warwick', 'Cranston', 'Pawtucket', 'East Providence', 'Providence County'],
    SC: ['Charleston', 'Columbia', 'North Charleston', 'Mount Pleasant', 'Rock Hill', 'Greenville', 'Charleston County', 'Richland County'],
    SD: ['Sioux Falls', 'Rapid City', 'Aberdeen', 'Brookings', 'Watertown', 'Minnehaha County'],
    TN: ['Nashville', 'Memphis', 'Knoxville', 'Chattanooga', 'Clarksville', 'Murfreesboro', 'Davidson County', 'Shelby County'],
    TX: ['Houston', 'San Antonio', 'Dallas', 'Austin', 'Fort Worth', 'El Paso', 'Arlington', 'Corpus Christi', 'Harris County', 'Dallas County', 'Travis County'],
    UT: ['Salt Lake City', 'West Valley City', 'Provo', 'West Jordan', 'Orem', 'Sandy', 'Salt Lake County', 'Utah County'],
    VT: ['Burlington', 'South Burlington', 'Rutland', 'Essex', 'Colchester', 'Chittenden County'],
    VA: ['Virginia Beach', 'Norfolk', 'Chesapeake', 'Richmond', 'Newport News', 'Alexandria', 'Arlington County', 'Fairfax County'],
    WA: ['Seattle', 'Spokane', 'Tacoma', 'Vancouver', 'Bellevue', 'Kent', 'King County', 'Pierce County', 'Snohomish County'],
    WV: ['Charleston', 'Huntington', 'Morgantown', 'Parkersburg', 'Wheeling', 'Kanawha County'],
    WI: ['Milwaukee', 'Madison', 'Green Bay', 'Kenosha', 'Racine', 'Appleton', 'Milwaukee County', 'Dane County'],
    WY: ['Cheyenne', 'Casper', 'Laramie', 'Gillette', 'Rock Springs', 'Laramie County', 'Natrona County'],
    India: ['Mumbai', 'Delhi', 'Bengaluru', 'Chennai', 'Hyderabad', 'Kolkata', 'Pune', 'Ahmedabad', 'Jaipur', 'Kochi', 'Chandigarh', 'Lucknow'],
    UAE: ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Ras Al Khaimah', 'Fujairah', 'Umm Al Quwain'],
    UK: ['London', 'Manchester', 'Birmingham', 'Leeds', 'Glasgow', 'Edinburgh', 'Bristol', 'Liverpool', 'Cardiff', 'Belfast']
  };

  const COUNTRIES = {
    India: { abbr: 'IN', name: 'India' },
    UAE: { abbr: 'AE', name: 'UAE' },
    UK: { abbr: 'GB', name: 'UK' }
  };

  function meta(codeOrName) {
    const s = String(codeOrName || '').trim();
    if (!s) return { abbr: '', name: '' };
    if (COUNTRIES[s]) return COUNTRIES[s];
    const upper = s.toUpperCase();
    const byAbbr = STATES.find(x => x.abbr === upper);
    if (byAbbr) return byAbbr;
    const byName = STATES.find(x => x.name.toLowerCase() === s.toLowerCase());
    if (byName) return byName;
    return { abbr: upper.slice(0, 2), name: s };
  }

  function citiesFor(codeOrName) {
    const raw = String(codeOrName || '').trim();
    if (CITIES[raw]) return CITIES[raw].slice();
    const { abbr, name } = meta(codeOrName);
    return (CITIES[abbr] || CITIES[name] || []).slice();
  }

  PS.places = { STATES, CITIES, meta, citiesFor };
})();
