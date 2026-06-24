document.addEventListener('DOMContentLoaded', () => {

    // --- GLOBAL AUTH STATE & DROPDOWN LOGIC ---
    let globalUser = null;
    let globalIsPremium = false;
    const authProfileBtn = document.getElementById('authProfileBtn');
    const profileDropdown = document.getElementById('profileDropdown');
    const dropdownEmail = document.getElementById('dropdownEmail');
    const signOutBtn = document.getElementById('signOutBtn');

    async function initAuth(providedUser = undefined) {
        if (providedUser !== undefined) {
            globalUser = providedUser;
        } else if (typeof window.getCurrentUser === 'function') {
            globalUser = await window.getCurrentUser();
        }

        if (globalUser) {
            authProfileBtn.style.background = "#2ea043"; 
            authProfileBtn.style.color = "#fff";
            authProfileBtn.innerHTML = globalUser.email ? globalUser.email.charAt(0).toUpperCase() : "U";
            authProfileBtn.title = "Account Menu";
            
            dropdownEmail.textContent = globalUser.email || "Premium User";
            
            globalIsPremium = await window.checkUserPremium(globalUser.uid);
            fetchContext(); 
        } else {
            authProfileBtn.style.background = "#30363d";
            authProfileBtn.style.color = "#8b949e";
            authProfileBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 16px; height: 16px;"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`;
            authProfileBtn.title = "Sign In";
            if (profileDropdown) profileDropdown.style.display = "none";
            globalIsPremium = false;
        }
    }

    if (authProfileBtn) {
        authProfileBtn.addEventListener('click', async (e) => {
            e.stopPropagation(); 
            if (globalUser) {
                profileDropdown.style.display = profileDropdown.style.display === "block" ? "none" : "block";
            } else {
                authProfileBtn.innerHTML = "...";
                if (typeof window.signInWithGoogle === 'function') {
                    try {
                        const newUser = await window.signInWithGoogle();
                        if (newUser) {
                            await initAuth(newUser); 
                        } else {
                            await initAuth(null); 
                        }
                    } catch(err) {
                        await initAuth(null);
                    }
                }
            }
        });
    }

    document.addEventListener('click', (e) => {
        if (profileDropdown && profileDropdown.style.display === "block") {
            if (!e.target.closest('#profileContainer')) {
                profileDropdown.style.display = "none";
            }
        }
    });

    if (signOutBtn) {
        signOutBtn.addEventListener('click', async (e) => {
            e.stopPropagation(); 
            const confirmOut = confirm("Are you sure you want to sign out?");
            if (confirmOut && typeof window.signOut === 'function') {
                signOutBtn.innerText = "Signing out...";
                await window.signOut(); 
                
                globalUser = null;
                globalIsPremium = false;
                
                profileDropdown.style.display = "none";
                signOutBtn.innerText = "Sign Out";
                
                authProfileBtn.style.background = "#30363d";
                authProfileBtn.style.color = "#8b949e";
                authProfileBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 16px; height: 16px;"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`;
                authProfileBtn.title = "Sign In";
                
                fetchContext(); 
            }
        });
    }

    initAuth(); 

    // --- ACCORDION LOGIC ---
    document.addEventListener('click', (e) => {
        const header = e.target.closest('.accordion-header');
        if (header) {
            header.parentElement.classList.toggle('active');
        }
    });

    // --- UI ELEMENTS ---
    const tabActive = document.getElementById('tabActive');
    const tabCompany = document.getElementById('tabCompany');
    const navTabsContainer = document.querySelector('.nav-tabs');
    const activeProblemContainer = document.getElementById('activeProblemContainer');
    const companyPrepState = document.getElementById('companyPrepState');

    const idleState       = document.getElementById('idleState');
    const lockdownState   = document.getElementById('lockdownState');
    const dashboardState  = document.getElementById('dashboardState');
    const headerTitle     = document.getElementById('headerTitle');
    const difficultyBadge = document.getElementById('difficultyBadge');
    
    const pressureTimer   = document.getElementById('pressureTimer');
    const timerInput      = document.getElementById('timerInput');
    const timerToggleBtn  = document.getElementById('timerToggleBtn');
    const timerResetBtn   = document.getElementById('timerResetBtn');

    const companyTags        = document.getElementById('companyTags');
    const targetTime         = document.getElementById('targetTime');
    const targetSpace        = document.getElementById('targetSpace');
    const dynamicHintsContainer = document.getElementById('dynamicHintsContainer');
    const dynamicEdgeCasesContainer = document.getElementById('dynamicEdgeCasesContainer');

    const companySelect = document.getElementById('companySelect');
    const topicSelect = document.getElementById('topicSelect');
    const sortSelect = document.getElementById('sortSelect');
    const questionList = document.getElementById('questionList');

    let timerInterval = null;
    let timerSecondsRemaining = 0;
    let isTimerRunning = false;
    let globalDatabaseArray = [];

    // --- CLOUD DATABASE URL ---
    const DB_URL = "https://raw.githubusercontent.com/Aditya3113/leetcode-database/refs/heads/main/database_min.json";

    // --- ZERO-CACHE DATABASE FETCH ---
    async function getDatabase() {
        return new Promise((resolve) => {
            chrome.storage.local.get(['problemDatabase', 'lastFetch'], async (result) => {
                const now = new Date().getTime();
                
                // Set to 0 to FORCE fetch the newest Database every single time during dev
                const oneDay = 0; 
                
                if (result.problemDatabase && result.lastFetch && (now - result.lastFetch < oneDay)) {
                    resolve(result.problemDatabase);
                    return;
                }
                try {
                    const response = await fetch(DB_URL, { cache: 'no-store' });
                    const freshData = await response.json();
                    
                    chrome.storage.local.set({ 'problemDatabase': freshData, 'lastFetch': now });
                    resolve(freshData);
                } catch (error) {
                    console.error("Failed to fetch database:", error);
                    resolve(result.problemDatabase || null); 
                }
            });
        });
    }

    // --- UI HELPER: PREMIUM COMPANY FORMATTER ---
    const COMPANY_DISPLAY_NAMES = {
        "1kosmos": "1Kosmos", "6sense": "6sense", "accelya": "Accelya", "accenture": "Accenture",
        "accolite": "Accolite", "acko": "ACKO", "acorns": "Acorns", "activision": "Activision",
        "adobe": "Adobe", "adp": "ADP", "aetion": "Aetion", "affinity": "Affinity", "affirm": "Affirm",
        "agoda": "Agoda", "airbnb": "Airbnb", "airbus": "Airbus", "airtel": "Airtel",
        "airwallex": "Airwallex", "akamai": "Akamai", "akuna-capital": "Akuna Capital",
        "alibaba": "Alibaba", "allincall": "Allincall", "alphonso": "Alphonso", "alten": "Alten",
        "altimetrik": "Altimetrik", "amadeus": "Amadeus", "amazon": "Amazon", "amd": "AMD",
        "amdocs": "Amdocs", "american-airlines": "American Airlines", "american-express": "American Express",
        "amplitude": "Amplitude", "analytics-quotient": "Analytics Quotient", "andela": "Andela",
        "anduril": "Anduril", "anthropic": "Anthropic", "anyscale": "Anyscale", "aon": "Aon",
        "apolloio": "Apolloio", "appdynamics": "Appdynamics", "appfolio": "Appfolio", "apple": "Apple",
        "applied-intuition": "Applied Intuition", "aqr-capital-management": "Aqr Capital Management",
        "arcesium": "Arcesium", "argo-ai": "Argo Ai", "arista-networks": "Arista Networks", "asana": "Asana",
        "ascend": "Ascend", "athenahealth": "athenahealth", "atlassian": "Atlassian", "att": "AT&T",
        "attentive": "Attentive", "audible": "Audible", "auriga": "Auriga", "aurora": "Aurora",
        "autodesk": "Autodesk", "avalara": "Avalara", "avito": "Avito", "axis-bank": "Axis Bank",
        "axon": "Axon", "baidu": "Baidu", "bank-of-america": "Bank of America", "barclays": "Barclays",
        "bcg": "BCG", "bending-spoons": "Bending Spoons", "bill-com": "Bill.com", "bitgo": "BitGo",
        "blackbuck": "Blackbuck", "blackrock": "BlackRock", "blackstone": "Blackstone", "blend": "Blend",
        "blinkit": "Blinkit", "bloomberg": "Bloomberg", "bloomreach": "Bloomreach", "blue-origin": "Blue Origin",
        "bnp-paribas": "BNP Paribas", "bny-mellon": "BNY Mellon", "boeing": "Boeing", "bolt": "Bolt",
        "bookingcom": "Booking.com", "box": "Box", "bp": "BP", "braze": "Braze",
        "bridgewater-associates": "Bridgewater Associates", "brillio": "Brillio", "broadcom": "Broadcom",
        "browserstack": "Browserstack", "bt-group": "Bt Group", "buyhatke": "Buyhatke", "bytedance": "ByteDance",
        "c3-ai": "C3 AI", "cadence": "Cadence", "canonical": "Canonical", "canva": "Canva",
        "capgemini": "Capgemini", "capital-one": "Capital One", "careem": "Careem", "cars24": "Cars24",
        "carwale": "Carwale", "cashfree": "Cashfree", "caterpillar": "Caterpillar", "cerner": "Cerner",
        "chalo": "Chalo", "chargebee": "Chargebee", "checkpoint": "Checkpoint", "chewy": "Chewy",
        "chime": "Chime", "chubb": "Chubb", "ciena": "Ciena", "circle": "Circle", "cisco": "Cisco",
        "citadel": "Citadel", "citi": "Citi", "citrix": "Citrix", "clari": "Clari", "cleartrip": "Cleartrip",
        "clevertap": "Clevertap", "cloudera": "Cloudera", "cloudflare": "Cloudflare", "clutter": "Clutter",
        "cme-group": "Cme Group", "cockroach-labs": "Cockroach Labs", "code-studio": "Code Studio",
        "coditas": "Coditas", "cognizant": "Cognizant", "cohesity": "Cohesity", "coinbase": "Coinbase",
        "coindcx": "CoinDCX", "coinswitch-kuber": "Coinswitch Kuber", "comcast": "Comcast",
        "commvault": "Commvault", "compass": "Compass", "confluent": "Confluent", "couchbase": "Couchbase",
        "coupa": "Coupa", "coupang": "Coupang", "coursera": "Coursera", "coveo": "Coveo", "cred": "CRED",
        "criteo": "Criteo", "crowdstrike": "CrowdStrike", "cruise-automation": "Cruise Automation", "ctc": "Ctc",
        "curefit": "Curefit", "cvent": "Cvent", "cyntexa": "Cyntexa", "cyware": "Cyware", "dailyhunt": "Dailyhunt",
        "darwinbox": "Darwinbox", "dassault-sysetmes": "Dassault Sysetmes", "dataart": "Dataart",
        "databricks": "Databricks", "datadog": "Datadog", "dataminr": "Dataminr", "de-shaw": "D. E. Shaw",
        "deepmind": "DeepMind", "delhivery": "Delhivery", "deliveroo": "Deliveroo", "dell": "Dell",
        "deloitte": "Deloitte", "deltax": "Deltax", "deutsche-bank": "Deutsche Bank", "devrev": "Devrev",
        "dialpad": "Dialpad", "directi": "Directi", "discord": "Discord", "discovery": "Discovery",
        "disney": "Disney", "dji": "Dji", "docusign": "Docusign", "doordash": "DoorDash", "dp-world": "Dp World",
        "drawbridge": "Drawbridge", "dream11": "Dream11", "dropbox": "Dropbox", "druva": "Druva", "drw": "Drw",
        "dtcc": "Dtcc", "dunzo": "Dunzo", "duolingo": "Duolingo", "earnin": "Earnin", "ebay": "eBay",
        "edelweiss": "Edelweiss", "electronic-arts": "Electronic Arts", "elitmus": "Elitmus", "envoy": "Envoy",
        "epam-systems": "EPAM Systems", "epic-games": "Epic Games", "epic-systems": "Epic Systems",
        "epifi": "Epifi", "equinix": "Equinix", "ericsson": "Ericsson", "etsy": "Etsy", "exl": "Exl",
        "expedia": "Expedia", "ey": "EY", "f5-networks": "F5 Networks", "factset": "Factset", "faire": "Faire",
        "fallible": "Fallible", "fanatics": "Fanatics", "fast": "Fast", "fastenal": "Fastenal", "fico": "Fico",
        "fidelity": "Fidelity", "fidessa": "Fidessa", "figma": "Figma", "fiverr": "Fiverr", "fivetran": "Fivetran",
        "flatiron-health": "Flatiron Health", "fleetx": "Fleetx", "flexera": "Flexera", "flexport": "Flexport",
        "flipkart": "Flipkart", "fortinet": "Fortinet", "forusall": "Forusall", "fourkites": "Fourkites",
        "fpt": "Fpt", "fractal-analytics": "Fractal Analytics", "freecharge": "Freecharge",
        "freshworks": "Freshworks", "fynd": "Fynd", "gainsight": "Gainsight", "gameskraft": "Gameskraft",
        "garena": "Garena", "garmin": "Garmin", "gartner": "Gartner", "ge-digital": "Ge Digital",
        "ge-healthcare": "Ge Healthcare", "geico": "Geico", "general-electric": "General Electric",
        "general-motors": "General Motors", "gilt-groupe": "Gilt Groupe", "github": "GitHub",
        "glassdoor": "Glassdoor", "globallogic": "Globallogic", "glovo": "Glovo", "godaddy": "GoDaddy",
        "gojek": "Gojek", "goldman-sachs": "Goldman Sachs", "google": "Google", "gopuff": "Gopuff",
        "goto": "Goto", "grab": "Grab", "grammarly": "Grammarly", "graviton": "Graviton", "groupon": "Groupon",
        "groww": "Groww", "grubhub": "Grubhub", "gsa-capital": "Gsa Capital", "gsn-games": "Gsn Games",
        "guidewire": "Guidewire", "gusto": "Gusto", "harness": "Harness", "hashedin": "Hashedin", "hbo": "HBO",
        "hcl": "HCL", "helix": "Helix", "highspot": "Highspot", "hilabs": "Hilabs", "hive": "Hive", "honey": "Honey",
        "honeywell": "Honeywell", "hopper": "Hopper", "hotstar": "Hotstar", "houzz": "Houzz", "hp": "HP",
        "hpe": "HPE", "hrt": "Hrt", "hsbc": "HSBC", "htc": "HTC", "huawei": "Huawei", "hubspot": "Hubspot",
        "hulu": "Hulu", "ibm": "IBM", "iit-bombay": "IIT Bombay", "imc": "Imc",
        "impact-analytics": "Impact Analytics", "impetus": "Impetus", "increff": "Increff", "indeed": "Indeed",
        "info-edge": "Info Edge", "informatica": "Informatica", "infosys": "Infosys", "inmobi": "InMobi",
        "innovaccer": "Innovaccer", "instabase": "Instabase", "instacart": "Instacart", "intel": "Intel",
        "interactive-brokers": "Interactive Brokers", "intercom": "Intercom", "intuit": "Intuit", "ivp": "Ivp",
        "ixigo": "Ixigo", "ixl": "Ixl", "jane-street": "Jane Street", "jd": "Jd", "jeavio": "Jeavio",
        "jingchi": "Jingchi", "jio": "Jio", "josh-technology": "Josh Technology", "jpmorgan": "JPMorgan",
        "jtg": "Jtg", "jump-trading": "Jump Trading", "juspay": "Juspay", "kakao": "Kakao", "karat": "Karat",
        "kickdrum": "Kickdrum", "kla-tencor": "Kla Tencor", "kla": "Kla",
        "kotak-mahindra-bank": "Kotak Mahindra Bank", "kpmg": "KPMG", "larsen-toubro": "Larsen & Toubro",
        "leap-motion": "Leap Motion", "lendingkart": "Lendingkart", "lenskart": "Lenskart",
        "lg-electronics": "LG Electronics", "liberty-mutual": "Liberty Mutual", "liftoff": "Liftoff",
        "lime": "Lime", "line": "Line", "linkedin": "LinkedIn", "liveramp": "Liveramp", "livspace": "Livspace",
        "lowe": "Lowe", "lti": "Lti", "lucid": "Lucid", "luxoft": "Luxoft", "lyft": "Lyft",
        "machine-zone": "Machine Zone", "machinezone": "Machinezone", "maersk": "Maersk",
        "makemytrip": "MakeMyTrip", "mapbox": "Mapbox", "maq-software": "Maq Software", "marqeta": "Marqeta",
        "mastercard": "Mastercard", "mathworks": "Mathworks", "mcafee": "McAfee", "mcdonalds": "McDonald's",
        "mckinsey": "McKinsey", "medianet": "Medianet", "meesho": "Meesho", "meituan": "Meituan",
        "mercari": "Mercari", "meta": "Meta", "micro1": "Micro1", "microsoft": "Microsoft",
        "microstrategy": "Microstrategy", "millennium": "Millennium", "mindtickle": "Mindtickle",
        "mindtree": "Mindtree", "mishipay": "Mishipay", "mitsogo": "Mitsogo", "mixpanel": "Mixpanel",
        "mobileye": "Mobileye", "mobisy": "Mobisy", "moengage": "Moengage", "moloco": "Moloco",
        "moneylion": "Moneylion", "mongodb": "Mongodb", "morgan-stanley": "Morgan Stanley", "motive": "Motive",
        "moveworks": "Moveworks", "mphasis": "Mphasis", "msci": "Msci", "murex": "Murex", "mykaarma": "Mykaarma",
        "myntra": "Myntra", "nagarro": "Nagarro", "nasdaq": "Nasdaq",
        "national-instruments": "National Instruments",
        "national-payments-coorperation-india": "National Payments Coorperation India", "natwest": "Natwest",
        "navan": "Navan", "naver": "Naver", "navi": "Navi", "ncr": "Ncr", "nerdwallet": "Nerdwallet",
        "netapp": "Netapp", "netcracker-technology": "Netcracker Technology", "netease": "Netease",
        "netflix": "Netflix", "netskope": "Netskope", "netsuite": "Netsuite", "newsbreak": "Newsbreak",
        "nextdoor": "Nextdoor", "nextjump": "Nextjump", "niantic": "Niantic", "nielsen": "Nielsen",
        "nike": "Nike", "nokia": "Nokia", "noon": "Noon", "nordstrom": "Nordstrom", "notion": "Notion",
        "npci": "Npci", "nuro": "Nuro", "nutanix": "Nutanix", "nvidia": "Nvidia", "nykaa": "Nykaa",
        "observeai": "Observeai", "odoo": "Odoo", "okta": "Okta", "okx": "Okx", "ola": "Ola", "olx": "Olx",
        "openai": "OpenAI", "opentext": "Opentext", "oppo": "Oppo", "optiver": "Optiver", "optum": "Optum",
        "oracle": "Oracle", "oscar-health": "Oscar Health", "otterai": "Otterai", "oyo": "OYO", "ozon": "Ozon",
        "palantir": "Palantir", "palo-alto-networks": "Palo Alto Networks", "park": "Park", "patreon": "Patreon",
        "paycom": "Paycom", "paypal": "PayPal", "paypay": "Paypay", "paytm": "Paytm", "payu": "PayU",
        "peak6": "Peak6", "pega": "Pega", "peloton": "Peloton", "persistent-systems": "Persistent Systems",
        "philips": "Philips", "phonepe": "PhonePe", "pickrr": "Pickrr", "pinterest": "Pinterest",
        "plaid": "Plaid", "playsimple": "Playsimple", "pocket-gems": "Pocket Gems", "point72": "Point72",
        "polar": "Polar", "ponyai": "Ponyai", "pornhub": "Pornhub", "porter": "Porter", "poshmark": "Poshmark",
        "postman": "Postman", "postmates": "Postmates", "poynt": "Poynt", "practo": "Practo",
        "publicis-sapient": "Publicis Sapient", "pubmatic": "Pubmatic", "pure-storage": "Pure Storage",
        "pure": "Pure", "purplle": "Purplle", "pwc": "PwC", "qualcomm": "Qualcomm", "qualtrics": "Qualtrics",
        "qualys": "Qualys", "quantcast": "Quantcast", "quantiphi": "Quantiphi", "quince": "Quince",
        "quora": "Quora", "rackspace": "Rackspace", "radius": "Radius", "rakuten": "Rakuten",
        "rally-health": "Rally Health", "ramp-2": "Ramp 2", "razorpay": "Razorpay", "rbc": "Rbc",
        "redbus": "Redbus", "reddit": "Reddit", "redfin": "Redfin", "reliance-retails": "Reliance Retails",
        "remitly": "Remitly", "retailmenot": "Retailmenot", "revolut": "Revolut", "riot-games": "Riot Games",
        "ripple": "Ripple", "rippling": "Rippling", "rivian": "Rivian", "robinhood": "Robinhood",
        "roblox": "Roblox", "rokt": "Rokt", "roku": "Roku", "rubrik": "Rubrik", "salesforce": "Salesforce",
        "sambanova": "Sambanova", "samsara": "Samsara", "samsung": "Samsung", "sap": "SAP",
        "scale-ai": "Scale Ai", "scaler": "Scaler", "schlumberger": "Schlumberger",
        "schneider-electric": "Schneider Electric", "schrodinger": "Schrodinger", "sentry": "Sentry",
        "servicenow": "ServiceNow", "sharechat": "Sharechat", "shift-technology": "Shift Technology",
        "shipsy": "Shipsy", "shopback": "Shopback", "shopee": "Shopee", "shopify": "Shopify",
        "shopup": "Shopup", "siemens": "Siemens", "sig": "Sig", "sigmoid": "Sigmoid",
        "singlestore": "Singlestore", "sixt": "Sixt", "slice": "Slice", "smartnews": "Smartnews",
        "smartsheet": "Smartsheet", "snapchat": "Snapchat", "snapdeal": "Snapdeal", "snowflake": "Snowflake",
        "societe-generale": "Societe Generale", "sofi": "Sofi", "softwire": "Softwire", "sonatus": "Sonatus",
        "sony": "Sony", "soti": "Soti", "soundhound": "Soundhound", "spacex": "SpaceX", "spinny": "Spinny",
        "splunk": "Splunk", "spotify": "Spotify", "sprinklr": "Sprinklr", "square": "Square",
        "squarepoint-capital": "Squarepoint Capital", "squarespace": "Squarespace", "stackadapt": "Stackadapt",
        "stackline": "Stackline", "starbucks": "Starbucks", "state-farm": "State Farm", "strava": "Strava",
        "stripe": "Stripe", "sumologic": "Sumologic", "swiggy": "Swiggy", "syfe": "Syfe", "symantec": "Symantec",
        "synopsys": "Synopsys", "ta-digital": "Ta Digital", "tableau": "Tableau", "tanium": "Tanium",
        "target": "Target", "tcs": "TCS", "tech-mahindra": "Tech Mahindra", "tekion": "Tekion",
        "tencent": "Tencent", "teradata": "Teradata", "tesco": "Tesco", "tesla": "Tesla",
        "texas-instruments": "Texas Instruments", "the-trade-desk": "The Trade Desk",
        "thomson-reuters": "Thomson Reuters", "thoughtspot": "Thoughtspot", "thoughtworks": "Thoughtworks",
        "thousandeyes": "Thousandeyes", "thumbtack": "Thumbtack", "tiaa": "Tiaa",
        "tiger-analytics": "Tiger Analytics", "tiktok": "TikTok", "tinder": "Tinder", "tinkoff": "Tinkoff",
        "toast": "Toast", "tokopedia": "Tokopedia", "tomtom": "Tomtom", "toptal": "Toptal",
        "tower-research": "Tower Research", "tracxn": "Tracxn", "traveloka": "Traveloka",
        "trend-micro": "Trend Micro", "trexquant": "Trexquant", "trilogy": "Trilogy",
        "tripactions": "Tripactions", "tripadvisor": "Tripadvisor", "triplebyte": "Triplebyte",
        "turing": "Turing", "turvo": "Turvo", "tusimple": "Tusimple", "twilio": "Twilio", "twitch": "Twitch",
        "twitter": "Twitter", "two-sigma": "Two Sigma", "uber": "Uber", "ubisoft": "Ubisoft", "ubs": "UBS",
        "udemy": "Udemy", "uipath": "UiPath", "ukg": "Ukg", "unbxd": "Unbxd", "unity": "Unity",
        "unstop": "Unstop", "upstart": "Upstart", "urban-company": "Urban Company", "ust": "Ust",
        "valve": "Valve", "veeva": "Veeva", "verily": "Verily", "veritas": "Veritas", "verizon": "Verizon",
        "verkada": "Verkada", "viasat": "Viasat", "vimeo": "Vimeo", "virtu": "Virtu", "virtusa": "Virtusa",
        "visa": "Visa", "vk": "Vk", "vmware": "VMware", "walmart-labs": "Walmart Labs",
        "warnermedia": "Warnermedia", "wayfair": "Wayfair", "waymo": "Waymo", "wayve": "Wayve",
        "wealthfront": "Wealthfront", "wells-fargo": "Wells Fargo", "weride": "Weride",
        "western-digital": "Western Digital", "whatfix": "Whatfix", "whatnot": "Whatnot", "winzo": "Winzo",
        "wipro": "Wipro", "wise": "Wise", "wish": "Wish", "wissen": "Wissen", "wix": "Wix", "workday": "Workday",
        "works-applications": "Works Applications", "worldquant": "Worldquant",
        "woven-by-toyota": "Woven By Toyota", "xing": "Xing", "yahoo": "Yahoo", "yandex": "Yandex",
        "yatra": "Yatra", "yelp": "Yelp", "yugabyte": "Yugabyte", "zalando": "Zalando", "zappos": "Zappos",
        "zemoso": "Zemoso", "zendesk": "Zendesk", "zenefits": "Zenefits", "zepto": "Zepto",
        "zeta-suite": "Zeta Suite", "zeta": "Zeta", "zillow": "Zillow", "zip": "Zip",
        "ziprecruiter": "Ziprecruiter", "zluri": "Zluri", "zocdoc": "Zocdoc", "zoho": "Zoho", "zomato": "Zomato",
        "zoom": "Zoom", "zoox": "Zoox", "zopsmart": "Zopsmart", "zs-associates": "Zs Associates",
        "zscaler": "Zscaler", "zulily": "Zulily"
    };

    function formatName(str) {
        if (!str) return "";
        const lowerStr = str.toLowerCase();
        if (COMPANY_DISPLAY_NAMES[lowerStr]) {
            return COMPANY_DISPLAY_NAMES[lowerStr];
        }
        return str.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }

    // --- TIMER LOGIC ---
    function updateTimerDisplay() {
        let minutes = parseInt(timerSecondsRemaining / 60, 10);
        let seconds = parseInt(timerSecondsRemaining % 60, 10);
        minutes = minutes < 10 ? "0" + minutes : minutes;
        seconds = seconds < 10 ? "0" + seconds : seconds;
        pressureTimer.textContent = minutes + ":" + seconds;
        pressureTimer.style.color = (timerSecondsRemaining < 300) ? '#cb2431' : '#eff1f6';
    }

    function handleTimerTick() {
        if (timerSecondsRemaining <= 0) {
            clearInterval(timerInterval);
            pressureTimer.textContent = "00:00";
            isTimerRunning = false;
            if (timerToggleBtn) timerToggleBtn.textContent = "Start";
            return;
        }
        timerSecondsRemaining--;
        updateTimerDisplay();
    }

    if (timerToggleBtn) {
        timerToggleBtn.addEventListener('click', () => {
            if (isTimerRunning) {
                clearInterval(timerInterval);
                isTimerRunning = false;
                timerToggleBtn.textContent = "Start";
            } else {
                if (timerSecondsRemaining <= 0 && timerInput) {
                    const inputMinutes = parseInt(timerInput.value, 10) || 0;
                    timerSecondsRemaining = inputMinutes * 60;
                }
                if (timerSecondsRemaining > 0) {
                    clearInterval(timerInterval);
                    timerInterval = setInterval(handleTimerTick, 1000);
                    isTimerRunning = true;
                    timerToggleBtn.textContent = "Pause";
                    updateTimerDisplay();
                }
            }
        });
    }

    if (timerResetBtn) {
        timerResetBtn.addEventListener('click', () => {
            clearInterval(timerInterval);
            isTimerRunning = false;
            timerToggleBtn.textContent = "Start";
            const inputMinutes = timerInput ? (parseInt(timerInput.value, 10) || 0) : 0;
            timerSecondsRemaining = inputMinutes * 60;
            updateTimerDisplay();
        });
    }

    // --- DYNAMIC TOP-LEVEL ACCORDION GENERATOR ---
    function createTopLevelAccordion(title, content, iconSvg) {
        const item = document.createElement('div');
        item.className = 'accordion-item';
        item.innerHTML = `
            <div class="accordion-header">
                <div class="header-left">
                    ${iconSvg}
                    <span>${title}</span>
                </div>
                <svg class="chevron" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </div>
            <div class="accordion-content">${content}</div>
        `;
        return item;
    }

    function resetToIdleState() {
        dashboardState.style.display = 'none';
        lockdownState.style.display = 'none';
        idleState.style.display = 'block';
        if (navTabsContainer) navTabsContainer.style.display = 'flex';
        headerTitle.textContent = "Prep Dashboard";
        difficultyBadge.style.display = 'none';
        clearInterval(timerInterval);
        isTimerRunning = false;
        if (timerToggleBtn) timerToggleBtn.textContent = "Start";
        pressureTimer.textContent = "00:00";
        pressureTimer.style.color = '#eff1f6';
    }

    function triggerLockdownState() {
        dashboardState.style.display = 'none';
        idleState.style.display = 'none';
        companyPrepState.style.display = 'none';
        lockdownState.style.display = 'block'; 
        if (navTabsContainer) navTabsContainer.style.display = 'none';
        headerTitle.textContent = "Restricted Area";
        difficultyBadge.style.display = 'none';
        clearInterval(timerInterval);
        isTimerRunning = false;
        pressureTimer.textContent = "--:--";
        pressureTimer.style.color = '#8b949e';
    }

    async function loadProblemData(title) {
        const db = await getDatabase();
        if (!db) {
            idleState.innerHTML = `<p style="font-size: 13px;">Error loading database.</p>`;
            return;
        }
        const data = db[title];

        if (data) {
            // Respecting the user's tab choice. No forced click to tabActive.
            idleState.style.display = 'none';
            lockdownState.style.display = 'none';
            if (navTabsContainer) navTabsContainer.style.display = 'flex';
            dashboardState.style.display = 'flex';
            headerTitle.textContent = title;

            if (data.difficulty) {
                difficultyBadge.textContent = data.difficulty;
                difficultyBadge.className = `difficulty-badge ${data.difficulty}`;
                difficultyBadge.style.display = 'inline-block';
            } else {
                difficultyBadge.style.display = 'none';
            }

            if (data.timeLimit) {
                const defaultMinutes = Math.floor(data.timeLimit / 60);
                if (timerInput) timerInput.value = defaultMinutes;
                clearInterval(timerInterval);
                isTimerRunning = false;
                if (timerToggleBtn) timerToggleBtn.textContent = "Start";
                timerSecondsRemaining = data.timeLimit;
                updateTimerDisplay();
            }
            
            targetTime.textContent  = data.targetTime;
            targetSpace.textContent = data.targetSpace;

            const freeCompany  = data.companies && data.companies[0] ? formatName(data.companies[0]) : "Standard";
            const hiddenCount  = data.companies ? (data.companies.length - 1) : 0;
            
            if (globalIsPremium) {
                companyTags.innerHTML = data.companies.map(c => `<div class="tag-free">${formatName(c)}</div>`).join('');
            } else if (hiddenCount > 0) {
                companyTags.innerHTML = `
                    <div class="tag-free">${freeCompany}</div>
                    <div class="tag-locked" id="unlockCompaniesBtn" title="Sign in to unlock premium companies!">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                      +${hiddenCount}
                    </div>
                `;

                const unlockBtn = document.getElementById('unlockCompaniesBtn');
                unlockBtn.addEventListener('click', async () => {
                    unlockBtn.innerHTML = `Loading...`;
                    let user = globalUser; 
                    if (!user && typeof window.signInWithGoogle === "function") {
                        user = await window.signInWithGoogle();
                        if (user) await initAuth(user); 
                    }
                    if (user) {
                        unlockBtn.innerHTML = `Checking access...`;
                        const isPremium = await window.checkUserPremium(user.uid);
                        if (isPremium) {
                            globalIsPremium = true; 
                            companyTags.innerHTML = data.companies.map(c => `<div class="tag-free">${formatName(c)}</div>`).join('');
                        } else {
                            unlockBtn.style.display = "none";
                            const paymentContainer = document.createElement('div');
                            paymentContainer.style.width = "100%";
                            paymentContainer.style.marginTop = "12px";
                            paymentContainer.style.display = "flex";
                            paymentContainer.style.flexDirection = "column";
                            paymentContainer.style.gap = "8px";
                            paymentContainer.style.padding = "12px";
                            paymentContainer.style.background = "rgba(255, 152, 0, 0.05)";
                            paymentContainer.style.border = "1px solid #ff9800";
                            paymentContainer.style.borderRadius = "6px";
                            paymentContainer.innerHTML = `
                                <div style="font-size:12px; color:#8b949e; text-align:center; font-weight:500;">Premium Lifetime Unlock</div>
                                <input type="text" id="promoInput" placeholder="PROMO CODE (Optional)" style="padding:8px; background:#0d1117; color:#fff; border:1px solid #30363d; border-radius:4px; text-transform:uppercase; text-align:center; font-family:monospace; outline:none;">
                                <button id="payActionBtn" style="padding:10px; background:#ff9800; color:#000; border:none; border-radius:4px; font-weight:bold; cursor:pointer; transition: background 0.2s;">Proceed to Pay</button>
                            `;
                            companyTags.parentElement.appendChild(paymentContainer);
                            const payActionBtn = document.getElementById('payActionBtn');
                            const promoInput = document.getElementById('promoInput');
                            let currentOrderId = null;

                            payActionBtn.addEventListener('click', async (e) => {
                                e.stopPropagation(); 
                                if (payActionBtn.innerText === "Verify Payment") {
                                    payActionBtn.innerText = "Verifying...";
                                    try {
                                        const res = await fetch('http://localhost:3000/verify-order', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ order_id: currentOrderId })
                                        });
                                        const vData = await res.json();
                                        if (vData.success) {
                                            await window.upgradeUserToPremium(user.uid);
                                            globalIsPremium = true; 
                                            companyTags.innerHTML = data.companies.map(c => `<div class="tag-free">${formatName(c)}</div>`).join('');
                                            paymentContainer.remove(); 
                                        } else {
                                            payActionBtn.innerText = "Verify Payment";
                                            alert("Payment not completed yet.");
                                        }
                                    } catch (err) { alert("Verification error."); }
                                    return;
                                }

                                payActionBtn.innerText = "Connecting...";
                                try {
                                    const bodyData = { promo_code: promoInput.value.trim() };
                                    const response = await fetch('http://localhost:3000/create-order', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify(bodyData)
                                    });
                                    const apiData = await response.json();
                                    if (apiData.error) {
                                        alert(apiData.error); 
                                        payActionBtn.innerText = "Proceed to Pay";
                                        return;
                                    }
                                    currentOrderId = apiData.order.id;
                                    chrome.tabs.create({ url: `http://localhost:3000/pay?order_id=${currentOrderId}&amount=${apiData.finalAmount}` });
                                    payActionBtn.innerText = "Verify Payment";
                                    payActionBtn.style.background = "#2ea043"; 
                                    payActionBtn.style.color = "#ffffff";
                                    promoInput.style.display = "none"; 
                                } catch (error) {
                                    payActionBtn.innerText = "Proceed to Pay";
                                }
                            });
                        }
                    } else {
                        unlockBtn.innerHTML = `+${hiddenCount}`;
                    }
                });
            } else {
                companyTags.innerHTML = `<div class="tag-free">${freeCompany}</div>`;
            }

            // POPULATE TOP LEVEL HINTS
            dynamicHintsContainer.innerHTML = '';
            const hintIcon = `<svg class="header-icon" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6"></path><path d="M10 22h4"></path><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.07 1.5 3.5.76.76 1.21 1.5 1.41 2.5"></path></svg>`;
            if (data.hints && data.hints.length > 0) {
                data.hints.forEach((hint, i) => {
                    dynamicHintsContainer.appendChild(createTopLevelAccordion(`Hint ${i + 1}`, hint, hintIcon));
                });
            }

            // POPULATE TOP LEVEL EDGE CASES
            dynamicEdgeCasesContainer.innerHTML = '';
            const edgeIcon = `<svg class="header-icon" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`;
            if (data.edgeCases && data.edgeCases.length > 0) {
                data.edgeCases.forEach((ec, i) => {
                    const formattedEc = `<code style="font-family:monospace;font-size:12px; color: var(--accent);">${ec}</code>`;
                    dynamicEdgeCasesContainer.appendChild(createTopLevelAccordion(`Edge Case ${i + 1}`, formattedEc, edgeIcon));
                });
            }

        } else {
            headerTitle.textContent = title;
            dashboardState.style.display = 'none';
            lockdownState.style.display = 'none';
            idleState.style.display = 'block';
            idleState.innerHTML = `<p style="font-size: 13px;">Tracking activated for <b>${title}</b>.<br><br>Data for this problem is not in the cloud database yet.</p>`;
        }
    }

    function processTab(activeTab) {
        if (activeTab && activeTab.url && activeTab.url.includes("leetcode.com/contest/")) {
            triggerLockdownState();
            return;
        }

        if (!activeTab || !activeTab.id || !activeTab.url || !activeTab.url.includes("leetcode.com/problems/")) {
            resetToIdleState();
            return;
        }

        const match = activeTab.url.match(/leetcode\.com\/problems\/([^/]+)/);
        const slug = match ? match[1] : null;

        chrome.tabs.sendMessage(activeTab.id, { action: "GET_PROBLEM" }, async (response) => {
            if (chrome.runtime.lastError || !response || !response.title) {
                if (slug) {
                    const db = await getDatabase();
                    if (db) {
                        const matchedTitle = Object.keys(db).find(key => {
                            const expectedUrl = db[key].url || `https://leetcode.com/problems/${key.toLowerCase().replace(/[^a-z0-9]+/g, '-')}/`;
                            return expectedUrl.includes(slug);
                        });
                        if (matchedTitle) {
                            loadProblemData(matchedTitle);
                            return;
                        }
                    }
                }
                resetToIdleState();
                return;
            }
            loadProblemData(response.title);
        });
    }

    function fetchContext() {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            let activeTab = tabs[0];
            if (!activeTab) {
                chrome.tabs.query({ active: true, lastFocusedWindow: true }, (fallbackTabs) => {
                    if (fallbackTabs[0]) processTab(fallbackTabs[0]);
                });
            } else {
                processTab(activeTab);
            }
        });
    }

    chrome.runtime.onMessage.addListener((message) => {
        if (message.action === "SPA_URL_CHANGED") setTimeout(fetchContext, 1000); 
    });
    chrome.tabs.onActivated.addListener(fetchContext);
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
        if (changeInfo.status === 'complete' && tab.active) fetchContext();
    });

    tabActive.addEventListener('click', () => {
        tabActive.style.color = '#fff';
        tabActive.style.borderBottom = '2px solid #ff9800';
        tabCompany.style.color = '#8b949e';
        tabCompany.style.borderBottom = 'none';
        activeProblemContainer.style.display = 'block';
        companyPrepState.style.display = 'none';
    });

    // --- DYNAMIC DROPDOWN GENERATORS ---
    function populateCompanyDropdown() {
        const uniqueCompanies = new Set();
        globalDatabaseArray.forEach(p => {
            if (p.companies) {
                p.companies.forEach(c => uniqueCompanies.add(c.toLowerCase()));
            }
        });

        const sortedCompanies = Array.from(uniqueCompanies).sort();
        companySelect.innerHTML = `<option value="" disabled selected>Select a Company...</option>`;

        sortedCompanies.forEach(company => {
            const option = document.createElement('option');
            option.value = company; 
            option.textContent = formatName(company); 
            companySelect.appendChild(option);
        });
    }

    function populateTopicDropdown() {
        const uniqueTopics = new Set();
        globalDatabaseArray.forEach(p => {
            if (p.topics && Array.isArray(p.topics)) {
                p.topics.forEach(t => uniqueTopics.add(t));
            }
        });

        const sortedTopics = Array.from(uniqueTopics).sort();
        topicSelect.innerHTML = `<option value="All">All Topics</option>`;

        sortedTopics.forEach(topic => {
            const option = document.createElement('option');
            option.value = topic; 
            option.textContent = topic; 
            topicSelect.appendChild(option);
        });
    }

    tabCompany.addEventListener('click', async () => {
        tabCompany.style.color = '#fff';
        tabCompany.style.borderBottom = '2px solid #ff9800';
        tabActive.style.color = '#8b949e';
        tabActive.style.borderBottom = 'none';
        activeProblemContainer.style.display = 'none';
        companyPrepState.style.display = 'block';

        if (globalDatabaseArray.length === 0) {
            const db = await getDatabase();
            if (db) {
                globalDatabaseArray = Object.keys(db).map(key => ({ title: key, ...db[key] }));
                
                populateCompanyDropdown(); 
                populateTopicDropdown(); 
            }
        }
    });

    // --- CSS GRID COMPANY PREP RENDERING ENGINE ---
    function renderCompanyQuestions() {
        const selectedCompany = companySelect.value;
        const selectedTopic = topicSelect.value;
        const selectedSort = sortSelect.value;

        if (!selectedCompany) {
            questionList.innerHTML = `<p style="color: #8b949e; text-align: center; font-size: 13px; margin-top: 20px;">Select a company to view problems.</p>`;
            return;
        }

        let filtered = globalDatabaseArray.filter(p => p.companies && p.companies.includes(selectedCompany));
        if (selectedTopic !== "All") filtered = filtered.filter(p => p.topics && p.topics.includes(selectedTopic));

        filtered.sort((a, b) => {
            if (selectedSort === 'freq-desc') {
                const freqA = (a.companyFrequencies && a.companyFrequencies[selectedCompany]) ? a.companyFrequencies[selectedCompany] : 0;
                const freqB = (b.companyFrequencies && b.companyFrequencies[selectedCompany]) ? b.companyFrequencies[selectedCompany] : 0;
                return freqB - freqA;
            }
            const diffWeight = { "Easy": 1, "Medium": 2, "Hard": 3 };
            const weightA = diffWeight[a.difficulty] || 0;
            const weightB = diffWeight[b.difficulty] || 0;
            return selectedSort === 'diff-asc' ? weightA - weightB : weightB - weightA;
        });

        if (filtered.length === 0) {
            questionList.innerHTML = `<p style="color: #8b949e; text-align: center; font-size: 13px;">No problems found for these filters.</p>`;
            return;
        }

        const headerHtml = `
            <div style="display: grid; grid-template-columns: 45px 1fr 50px 60px; gap: 10px; align-items: center; padding: 0 12px 8px 12px; border-bottom: 1px solid #30363d; margin-bottom: 8px; font-size: 12px; color: #8b949e; font-weight: bold;">
                <div>ID</div>
                <div>Problem Title</div>
                <div style="text-align: right;">Freq</div>
                <div style="text-align: right;">Diff</div>
            </div>
        `;

        const rowsHtml = filtered.map(q => {
            let color = "#00b8a3"; 
            if (q.difficulty === "Medium") color = "#ffc01e"; 
            if (q.difficulty === "Hard") color = "#ff375f"; 
            
            const problemUrl = q.url || `https://leetcode.com/problems/${q.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}/`;

            const rawFreq = q.companyFrequencies ? q.companyFrequencies[selectedCompany] : undefined;
            const displayFreq = rawFreq !== undefined ? `${rawFreq.toFixed(1)}%` : '-';

            return `
            <div class="list-item-card question-click-item" data-url="${problemUrl}" style="cursor: pointer; display: grid; grid-template-columns: 45px 1fr 50px 60px; gap: 10px; align-items: center; width: 100%;">
                <div style="color: #8b949e; font-size: 12px;">${q.id || '-'}</div>
                <div style="color: #eff1f6; font-size: 14px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${q.title}">${q.title}</div>
                <div style="color: #ff9800; font-size: 12px; font-weight: bold; text-align: right;">${displayFreq}</div>
                <div style="color: ${color}; font-size: 12px; font-weight: bold; text-align: right;">${q.difficulty}</div>
            </div>
            `;
        }).join('');

        questionList.innerHTML = headerHtml + rowsHtml;
    }

    questionList.addEventListener('click', (e) => {
        const clickedItem = e.target.closest('.question-click-item');
        if (clickedItem && clickedItem.dataset.url) chrome.tabs.create({ active: true, url: clickedItem.dataset.url });
    });

    companySelect.addEventListener('change', renderCompanyQuestions);
    topicSelect.addEventListener('change', renderCompanyQuestions);
    sortSelect.addEventListener('change', renderCompanyQuestions);
});