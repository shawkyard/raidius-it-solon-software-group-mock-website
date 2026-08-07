// ---------------------------------------------------------------------------
// Solen Software Group — canonical dataset
//
// CONCEPT BUILD. Compiled from public sources (solensoftwaregroup.com, portfolio
// company sites, press releases, LinkedIn). Several details conflict between
// sources; some are inferred. Verify before treating any of this as fact.
// See CONTENT-TODO in README.md.
// ---------------------------------------------------------------------------

const offices = [
  { city: 'Salt Lake City', region: 'Utah, USA', tz: 'America/Denver',    isHQ: true,  headcount: 11 },
  { city: 'Lisbon',         region: 'Portugal',  tz: 'Europe/Lisbon',     isHQ: false, headcount: 4  },
  { city: 'New York',       region: 'New York, USA', tz: 'America/New_York', isHQ: false, headcount: 3 },
  { city: 'Toronto',        region: 'Ontario, Canada', tz: 'America/Toronto', isHQ: false, headcount: 1 },
  { city: 'São Paulo',      region: 'Brazil',    tz: 'America/Sao_Paulo', isHQ: false, headcount: 1  }
];

const portfolio = [
  {
    slug: 'track-star', name: 'Track Star', vertical: 'Fleet & Government',
    tagline: 'Fleet GPS, telematics and enterprise asset management.',
    description: 'Track Star builds GPS tracking, telematics and asset management systems for organisations that cannot afford to lose a vehicle, a tool or a chain of custody. Its platform covers location, maintenance, safety and compliance in a single operational view.',
    hqCity: 'Calabash', hqRegion: 'North Carolina', hqCountry: 'USA',
    founded: 2000, acquired: 2022,
    leaderName: 'Mike Hughes', leaderTitle: 'Founder & Chief Executive Officer',
    customerType: 'Police departments, government agencies and municipal fleet operators.',
    products: ['GPS Tracking', 'Telematics', 'Asset Management', 'Compliance Reporting'],
    accentStat: 'Revenue grew roughly 40% following the partnership',
    expertise: ['CJIS', 'Government procurement', 'IoT hardware', 'Fleet operations'],
    quote: { text: 'Alexander and the Solen team are interested in long term ownership of Track Star and their other properties, to grow them and hold on to them, not bundle them up with something else and send them over for an instant profit.', author: 'Mike Hughes', role: 'Founder & CEO' }
  },
  {
    slug: 'viapeople', name: 'ViaPeople', vertical: 'Human Capital',
    tagline: 'Talent and performance management for investment firms.',
    description: 'ViaPeople provides performance management, 360-degree feedback and talent development software built for the way investment firms actually evaluate people. It is used by private equity firms and investment banks to run structured review cycles at portfolio scale.',
    hqCity: 'Plainsboro', hqRegion: 'New Jersey', hqCountry: 'USA',
    founded: null, acquired: 2023,
    leaderName: null, leaderTitle: null,
    customerType: 'Private equity firms, investment banks and their portfolio companies.',
    products: ['Performance Management', '360 Feedback', 'Talent Development'],
    accentStat: 'SOC 2 Type I certified',
    expertise: ['SOC 2', 'EU–U.S. Data Privacy Framework', 'Security questionnaires'],
    quote: null
  },
  {
    slug: 'spiralinks', name: 'SpiraLinks', vertical: 'Human Capital',
    tagline: 'Global compensation planning — salary, bonus and equity.',
    description: 'SpiraLinks builds FocalReview, a compensation planning platform that handles salary, bonus and equity administration across currencies, countries and pay structures. It has been continuously developed since 1994.',
    hqCity: 'Campbell', hqRegion: 'California', hqCountry: 'USA',
    secondaryOffice: 'Wyboston, England',
    founded: 1994, acquired: null,
    leaderName: 'Julie Southern', leaderTitle: 'Founder & Chief Executive Officer',
    customerType: 'Global enterprises running multi-country compensation cycles.',
    products: ['FocalReview', 'Compensation Planning', 'Equity Administration'],
    accentStat: 'Three decades of continuous operation',
    expertise: ['Multi-currency payroll', 'GDPR', 'UK & India operations', 'DMARC enforcement'],
    quote: { text: 'It was not a harvest of resources but a strategic direction to grow the business.', author: 'Julie Southern', role: 'Founder & CEO' }
  },
  {
    slug: 'primate-technologies', name: 'Primate Technologies', vertical: 'Asset Intelligence',
    tagline: 'Enterprise asset management for vehicle, equipment and tool security.',
    description: 'Primate Technologies secures and tracks high-value physical assets — vehicles, equipment and tools — for organisations where loss and misuse carry real operational cost.',
    hqCity: 'Melbourne', hqRegion: 'Florida', hqCountry: 'USA',
    founded: null, acquired: 2024,
    leaderName: 'Rita Patterson', leaderTitle: 'Co-Founder',
    customerType: 'Utilities, contractors and fleet operators.',
    products: ['Asset Security', 'Equipment Tracking', 'Tool Management'],
    accentStat: null,
    expertise: ['Utilities', 'Field operations'],
    quote: { text: "Solen's investments are providing a great future for Primate's customers and employees.", author: 'Rita Patterson', role: 'Co-Founder' }
  },
  {
    slug: 'nextalk', name: 'NexTalk', vertical: 'Accessibility',
    tagline: 'ADA-compliant real-time text communication.',
    description: 'NexTalk provides real-time text communication infrastructure that lets deaf and hard-of-hearing users reach contact centres and internal help desks directly, meeting accessibility obligations that most communication platforms do not address.',
    hqCity: 'Murray', hqRegion: 'Utah', hqCountry: 'USA',
    founded: null, acquired: 2024,
    leaderName: 'Travis Gollaher', leaderTitle: 'General Manager',
    customerType: 'Enterprises and public bodies with ADA accessibility obligations.',
    products: ['Real-Time Text', 'Accessible Contact Centre'],
    accentStat: null,
    expertise: ['ADA compliance', 'FCC regulation', 'Accessibility'],
    quote: null
  },
  {
    slug: 'fmsi', name: 'FMSI', vertical: 'Financial Services',
    tagline: 'Branch performance and workforce management for financial institutions.',
    description: 'FMSI measures and optimises branch performance and staffing for banks and credit unions — matching labour to transaction demand across networks of physical locations. The business relaunched as an independent company in 2025 after a divestiture from a larger enterprise parent.',
    hqCity: 'Cottonwood Heights', hqRegion: 'Utah', hqCountry: 'USA',
    founded: 1990, acquired: 2025,
    leaderName: 'Jacob Reeves', leaderTitle: 'General Manager',
    customerType: 'Banks and credit unions operating branch networks.',
    products: ['Branch Performance Analytics', 'Workforce Management', 'Lobby Tracking'],
    accentStat: 'Relaunched as an independent company in 2025',
    expertise: ['GLBA', 'FFIEC examination', 'Credit union operations'],
    quote: null
  },
  {
    slug: 'champ-software', name: 'Champ Software', vertical: 'Public Health',
    tagline: 'Nightingale Notes — electronic health records for public health.',
    description: 'Champ Software builds Nightingale Notes, an electronic health record designed specifically for public health agencies rather than adapted from a clinical product. It has served community health, home care and aging services since 1985.',
    hqCity: 'Mankato', hqRegion: 'Minnesota', hqCountry: 'USA',
    founded: 1985, acquired: null,
    leaderName: 'Scott Dunnewind', leaderTitle: 'Chief Executive Officer',
    customerType: 'Public health agencies, home care providers and aging and disability resource centres.',
    products: ['Nightingale Notes EHR'],
    accentStat: 'Serving public health since 1985',
    expertise: ['HIPAA', 'HITECH', 'PHI handling', 'Public health reporting'],
    quote: null
  },
  {
    slug: 'autotime', name: 'AutoTime', vertical: 'Aerospace & Defense',
    tagline: 'DCAA-compliant labour tracking and time capture.',
    description: 'AutoTime captures labour and time data to the standard defence contractors are audited against. For companies billing the federal government, the difference between compliant and non-compliant time capture is the difference between getting paid and not.',
    hqCity: 'Plainsboro', hqRegion: 'New Jersey', hqCountry: 'USA',
    founded: null, acquired: null,
    leaderName: null, leaderTitle: null,
    customerType: 'Aerospace and defence contractors billing federal programmes.',
    products: ['Labour Tracking', 'DCAA Time Capture', 'Shop Floor Data Collection'],
    accentStat: null,
    expertise: ['DCAA', 'DFARS', 'NIST 800-171', 'Defense contracting'],
    quote: null
  },
  {
    slug: 'thingtech', name: 'ThingTech', vertical: 'Asset Intelligence',
    tagline: 'Connected asset and field operations management.',
    description: 'ThingTech connects physical assets to the systems that manage them, giving field-heavy organisations a live operational picture of what they own and where it is working.',
    hqCity: null, hqRegion: null, hqCountry: 'USA',
    founded: null, acquired: null,
    leaderName: null, leaderTitle: null,
    customerType: 'Asset-intensive and field service operations.',
    products: [],
    accentStat: null,
    expertise: ['Field service', 'Asset telemetry'],
    quote: null
  },
  {
    slug: 'dash', name: 'Dash', vertical: 'Supply Chain',
    tagline: 'Operations and workflow automation.',
    description: 'Dash automates operational workflow for distribution and supply chain businesses, replacing manual document handling with structured process.',
    hqCity: 'Germantown', hqRegion: 'Wisconsin', hqCountry: 'USA',
    founded: null, acquired: null,
    leaderName: 'Jim Van Hecke', leaderTitle: 'Founder',
    customerType: 'Distribution and supply chain operators.',
    products: [],
    accentStat: null,
    expertise: ['Workflow automation', 'Distribution'],
    quote: { text: 'It has proven to be a win for those of us who originally founded the company.', author: 'Jim Van Hecke', role: 'Founder' }
  },
  {
    slug: 'smrtr', name: 'SMRTR', vertical: 'Food & Beverage',
    tagline: 'Compliance and process automation for the food and beverage supply chain.',
    description: 'SMRTR automates compliance documentation and business process across food and beverage distribution, where traceability requirements and thin margins make manual paperwork expensive. It also runs an ERP implementation practice spanning the major mid-market platforms.',
    hqCity: null, hqRegion: null, hqCountry: 'USA',
    founded: null, acquired: null,
    leaderName: 'Susanne Moore', leaderTitle: 'Founder',
    customerType: 'Food and beverage distributors, manufacturers and wholesalers.',
    products: ['Compliance Automation', 'Document Management', 'ERP Implementation'],
    accentStat: 'Available on the SYSPRO Marketplace',
    expertise: ['FSMA 204', 'ERP integration', 'SYSPRO', 'Boomi & MuleSoft'],
    quote: { text: 'Partnering with Solen came down to alignment on core values.', author: 'Susanne Moore', role: 'Founder' }
  },
  {
    slug: 'cairn-applications', name: 'Cairn Applications', vertical: 'Waste Management',
    tagline: 'Box Tracker and Route Tracker — route and container operations for waste haulers.',
    description: 'Cairn Applications builds Box Tracker and Route Tracker, cloud software that manages container inventory, routing and dispatch for waste hauling operators. Founded in 2008 and run as a family business until joining Solen.',
    hqCity: null, hqRegion: 'New England', hqCountry: 'USA',
    founded: 2008, acquired: 2025,
    leaderName: 'Jim and Angela Moser', leaderTitle: 'Founders',
    customerType: 'Waste hauling and roll-off container operators.',
    products: ['Box Tracker', 'Route Tracker'],
    accentStat: 'Closed December 2025',
    expertise: ['Route optimisation', 'Waste logistics'],
    quote: null
  },
  {
    slug: 'spokane-software', name: 'Spokane Software Systems', vertical: 'Agriculture',
    tagline: 'Agricultural ERP and produce traceability.',
    description: 'Spokane Software builds the operational backbone for produce businesses — packing, shipping and traceability workflows that growers, packers and shippers depend on to move perishable goods and satisfy regulators. Founded in 1978.',
    hqCity: null, hqRegion: null, hqCountry: 'USA',
    founded: 1978, acquired: 2025,
    leaderName: 'Chris Poston', leaderTitle: 'Chief Executive Officer',
    customerType: 'Growers, packers and shippers across the produce supply chain.',
    products: ['Spokane System', 'Produce Traceability', 'Packing & Shipping ERP'],
    accentStat: 'Serving the produce industry since 1978',
    expertise: ['FSMA 204 traceability', 'Agricultural ERP', 'Cold chain'],
    quote: null
  },
  {
    slug: 'thought-foundry', name: 'Thought Foundry', vertical: 'Media & Entertainment',
    tagline: 'MDEO — digital content entitlement management.',
    description: 'Thought Foundry builds MDEO, the platform that manages digital content entitlements for major film studios. Who can watch what, where, on which platform, and for how long — resolved at the scale and reliability the studio business requires.',
    hqCity: 'Los Angeles', hqRegion: 'California', hqCountry: 'USA',
    founded: null, acquired: 2026,
    leaderName: 'Timur Insepov', leaderTitle: 'Chief Executive Officer',
    customerType: 'Major film studios and content distributors.',
    products: ['MDEO'],
    accentStat: "Solen's entry into media and entertainment",
    expertise: ['Studio security review', 'Content entitlements', 'Media supply chain'],
    quote: null
  },
  {
    slug: 'trackit', name: 'Trackit', vertical: 'Public Transit',
    tagline: 'PTASP compliance, safety reporting and cross-department collaboration for transit.',
    description: 'Trackit gives transit agencies a single place to run safety plan compliance, incident recordkeeping and cross-department collaboration — the administrative machinery that federal transit regulation requires and that most agencies run on spreadsheets.',
    hqCity: null, hqRegion: null, hqCountry: 'USA',
    founded: null, acquired: 2026,
    leaderName: 'Mark Anderson', leaderTitle: 'President',
    customerType: 'Public transit agencies and authorities.',
    products: ['PTASP Compliance', 'Safety Reporting', 'Incident Management'],
    accentStat: 'In use at over 100 transit locations',
    expertise: ['PTASP', 'FTA regulation', 'Transit procurement'],
    quote: { text: 'Customers can expect the same high level of support with all the same people involved.', author: 'Mark Anderson', role: 'President' }
  }
];

const team = [
  { name: 'Alexander Spencer', title: 'Founder & Chief Executive Officer', office: 'Salt Lake City', focus: 'Leadership',
    bio: 'Previously a software engineer at Amazon working on Alexa, and a technology partner at SpringTide Capital. BS Electrical Engineering, Brigham Young University. MBA, Harvard Business School.', bookable: true },
  { name: 'Rafael Mazzeo', title: 'Operating Partner', office: 'Salt Lake City', focus: 'Operations',
    bio: 'Previously Chief Operating Officer and Operating Partner at Valsoft and Aspire Software. Held CIO roles across Brazil, Belgium, France and India before moving into software operations.', bookable: true },
  { name: 'Will Nouse', title: 'Director of M&A', office: 'New York', focus: 'M&A',
    bio: 'Previously corporate finance and M&A at Roper Technologies, and an investment banking analyst at MHT Partners.', bookable: true },
  { name: 'Sam Clayton', title: 'Investment Partner', office: 'Salt Lake City', focus: 'M&A',
    bio: 'Spent seven years at CrowdStrike before moving to the buy side. University of Utah.', bookable: true },
  { name: 'Aurelio Rospigliosi', title: 'Vice President, Operations', office: 'New York', focus: 'Operations',
    bio: 'Previously Credicorp Capital and APOYO Consultoría in Peru. MBA, Columbia Business School.', bookable: true },
  { name: 'Jude Murray', title: 'Corporate Development Manager', office: 'Lisbon', focus: 'M&A',
    bio: 'Previously senior corporate development at Lumine Group, part of Constellation Software, based in Portugal.', bookable: true },
  { name: 'Rodrigo Soto Larrain', title: 'M&A Manager', office: 'São Paulo', focus: 'M&A',
    bio: 'Previously Dura Software, Electrolux and Zurich Insurance across Latin America.', bookable: true },
  { name: 'Bruna Silva', title: 'Director of Talent', office: 'Lisbon', focus: 'People',
    bio: 'Previously senior leadership and development advisor at Valsoft Corporation. MS Development and International Relations, Aalborg University.', bookable: true },
  { name: 'Jaco Potgieter', title: 'Head of Control and Accounting', office: 'Lisbon', focus: 'Finance',
    bio: 'Nineteen years as Group Financial Controller at 20th Century Fox, then Director of Control and Accounting at Kantar. Joined Solen as Finance Integration Lead.', bookable: true },
  { name: 'Inês Pequeno', title: 'Lead Accountant', office: 'Lisbon', focus: 'Finance',
    bio: 'Leads finance onboarding for newly acquired companies into the shared finance function. Previously Thales.', bookable: true },
  { name: 'Brinton Wilkins', title: 'General Counsel', office: 'Salt Lake City', focus: 'Legal',
    bio: 'Previously a partner at Arcus Technology Law. JD, Brigham Young University.', bookable: true },
  { name: 'Lizzie Rosegrant', title: 'Marketing Director', office: 'Salt Lake City', focus: 'Marketing',
    bio: 'Previously global campaigns at Turnitin, and marketing director roles inside the Solen portfolio at Track Star and Primate Technologies.', bookable: false },
  { name: 'Michael Oliver', title: 'Operating Vice President', office: 'Salt Lake City', focus: 'Operations',
    bio: 'Concurrently Chief Operating Officer of Track Star. Previously a software engineer at Ancestry and an analyst at Goldman Sachs.', bookable: true },
  { name: 'Daniel Mockaitis', title: 'Operating Vice President', office: 'New York', focus: 'Operations',
    bio: 'Embedded with ViaPeople. Previously a senior digital analyst at McKinsey & Company. UC Berkeley.', bookable: true },
  { name: 'Noah Davis', title: 'M&A Associate', office: 'Salt Lake City', focus: 'M&A',
    bio: 'Previously Clozd. Brigham Young University.', bookable: false },
  { name: 'Carter Chytraus', title: 'M&A Associate', office: 'Salt Lake City', focus: 'M&A',
    bio: 'Previously FP&A at SkyShare and a venture analyst at Sound Ventures. Fluent in Brazilian Portuguese.', bookable: false },
  { name: 'Spencer McDougal', title: 'Corporate Development Associate', office: 'Salt Lake City', focus: 'M&A',
    bio: 'Previously a private equity analyst at Ridgeview Capital and Cumming Capital Management.', bookable: false }
];

// Illustrative forum content for the Portfolio Hub. REPLACE BEFORE ANY REAL USE.
const forum = [
  { id: 1, topic: 'Security & Compliance', title: 'Anyone been through SOC 2 Type I recently? Studio customer is asking.',
    author: 'Timur Insepov', company: 'Thought Foundry', replies: 7, lastActivity: '2 hours ago', solenBadge: false,
    excerpt: 'A studio customer has come back with a vendor security questionnaire that assumes we hold SOC 2. We do not. Before I go and price an audit, has anyone here done this recently and what did it actually cost in time and money?' },
  { id: 2, topic: 'Security & Compliance', title: 'Re: SOC 2 — we did Type I in about four months',
    author: 'ViaPeople leadership', company: 'ViaPeople', replies: 0, lastActivity: '1 hour ago', solenBadge: false,
    excerpt: 'We used a compliance automation platform and a third-party auditor. Type I first, then Type II on a rolling basis. Happy to share the whole runbook and our auditor contact — no reason for you to start from a blank page.' },
  { id: 3, topic: 'Go-to-Market', title: 'Government procurement cycles — how do you forecast against them?',
    author: 'Mark Anderson', company: 'Trackit', replies: 5, lastActivity: '5 hours ago', solenBadge: false,
    excerpt: 'Transit agency budgets move on an annual federal cycle and our pipeline forecasting keeps assuming commercial timelines. Track Star sells to police and municipal fleets, so I suspect this is a solved problem somewhere in the group.' },
  { id: 4, topic: 'Go-to-Market', title: 'Re: Government procurement — we forecast on fiscal year, not calendar',
    author: 'Mike Hughes', company: 'Track Star', replies: 0, lastActivity: '3 hours ago', solenBadge: false,
    excerpt: 'Two things that helped us: forecast against the customer fiscal year rather than ours, and get on the cooperative purchasing schedules early. Cuts months off the cycle. Send me a note and I will walk you through how we structured it.' },
  { id: 5, topic: 'M&A Integration', title: 'Finance onboarding — what to prepare before week two',
    author: 'Inês Pequeno', company: 'Solen', replies: 12, lastActivity: '1 day ago', solenBadge: true,
    excerpt: 'For companies joining us this quarter: here is the short list of what makes finance onboarding fast. Chart of accounts, last three years of statements, your revenue recognition policy, and a named contact who can answer questions without escalating.' },
  { id: 6, topic: 'Hiring', title: 'Hiring engineers in Portugal — what we learned',
    author: 'Bruna Silva', company: 'Solen', replies: 4, lastActivity: '2 days ago', solenBadge: true,
    excerpt: 'Several companies have asked about extending engineering into Lisbon. We have now hired there repeatedly and there are a few things worth knowing about contracts, notice periods and the local market rate before you start.' },
  { id: 7, topic: 'Product', title: 'How much AI is your roadmap actually promising customers?',
    author: 'Scott Dunnewind', company: 'Champ Software', replies: 9, lastActivity: '3 days ago', solenBadge: false,
    excerpt: 'Public health agencies are starting to ask what our AI story is. Given we handle PHI, I am cautious about what we commit to. Curious where everyone else has landed on the line between useful and reckless.' },
  { id: 8, topic: 'Pricing', title: 'Annual uplift — what are people actually getting away with?',
    author: 'Julie Southern', company: 'SpiraLinks', replies: 11, lastActivity: '4 days ago', solenBadge: false,
    excerpt: 'We have historically been shy about annual increases and I suspect we have left a lot on the table across three decades. Interested in what the rest of the group is doing, particularly in long-tenured accounts.' }
];

// The 99-point post-acquisition checklist, grouped by phase.
const checklist = [
  { phase: 'Finance Onboarding', items: [
    'Chart of accounts mapped to group standard','Historical financials loaded (3 years)','Revenue recognition policy documented',
    'Monthly close calendar agreed','Banking and treasury access transferred','AR ageing reviewed and cleaned',
    'AP vendor list validated','Payroll provider confirmed','Tax filings and jurisdictions catalogued',
    'Budget and forecast model built','KPI reporting pack defined','First month-end close completed with support',
    'Audit trail and controls documented','Expense policy adopted','Corporate card programme issued',
    'Intercompany agreements executed','Transfer pricing reviewed','FX exposure assessed','Finance contact named at company',
    'Quarterly business review scheduled'] },
  { phase: 'People & HR', items: [
    'Employee census verified','Employment contracts reviewed','Benefits programmes catalogued','Payroll cutover completed',
    'HRIS onboarding complete','Org chart documented','Compensation bands benchmarked','PTO policy reconciled',
    'Performance review cycle aligned','Key person risks identified','Retention agreements where needed',
    'Handbook and policies issued','Training and development access granted','Recruiting pipeline reviewed',
    'Contractor arrangements assessed','Immigration and work authorisation checked','Local employment law reviewed by jurisdiction',
    'HR contact named at company'] },
  { phase: 'Legal & Contracts', items: [
    'Corporate records collected','Customer contract inventory built','Auto-renewal terms flagged','Vendor contract inventory built',
    'IP assignment confirmed','Trademark and domain register verified','Open source licence review','Data processing agreements catalogued',
    'Privacy policy reviewed','Insurance policies reviewed and bound','Litigation and claims disclosed','Regulatory obligations registered',
    'Entity structure confirmed','Signature authority matrix issued','Standard contract templates adopted','Legal contact named at company'] },
  { phase: 'Go-to-Market', items: [
    'Pricing model and history reviewed','Discount practice audited','Customer concentration analysed','Churn and retention baselined',
    'Win/loss review conducted','Sales pipeline reviewed','CRM hygiene assessed','ICP and segmentation documented',
    'Competitive landscape mapped','Marketing spend reviewed','Website and brand audit','Reference customers identified',
    'Cross-sell opportunities across portfolio mapped','Sales Mastermind onboarding scheduled','Annual uplift strategy agreed',
    'Partner and channel relationships catalogued','Renewal calendar built','GTM contact named at company',
    'Customer advisory input gathered','Product roadmap communicated to customers'] },
  { phase: 'Technology & Security', items: [
    'Environment inventory documented','Identity platform and tenant catalogued','MFA coverage verified','Privileged access reviewed',
    'Endpoint inventory and management assessed','Email authentication (SPF, DKIM, DMARC) verified','Backup and restore tested',
    'Disaster recovery plan reviewed','Production infrastructure documented','Cloud spend reviewed','Security baseline assessed',
    'Vulnerability and patch process reviewed','Logging and monitoring assessed','Incident response plan confirmed',
    'Compliance obligations mapped to controls','SaaS and licence inventory built','Duplicate spend across portfolio identified',
    'AI acceptable use policy issued','Offboarding process verified','Documentation platform populated',
    'Technical debt register created','Key technical person risk documented','Security contact named at company',
    'Access review scheduled','Cyber insurance requirements verified'] }
];

const insights = [
  { slug: 'solen-acquires-trackit', category: 'Acquisitions', date: '2026-03-10', title: 'Trackit joins Solen Software Group',
    summary: 'Trackit, a provider of PTASP compliance and safety reporting software used at over 100 transit locations, has joined Solen.',
    body: ['Solen Software Group has acquired Trackit, LLC, a provider of transit-specific software for safety plan compliance, recordkeeping and cross-department collaboration. The transaction closed in February 2026.','Trackit is used at over 100 transit locations. Its platform addresses the administrative requirements of the Public Transportation Agency Safety Plan rule, work that most agencies otherwise run on spreadsheets and shared drives.','Trackit will continue operating with autonomy, with Solen supporting the business through long-term ownership and optional shared services, allowing the team to remain focused on product development and customer support.','Mark Anderson continues as President.'] },
  { slug: 'solen-acquires-spokane-software', category: 'Acquisitions', date: '2026-03-03', title: 'Spokane Software Systems joins Solen Software Group',
    summary: 'A provider of agricultural ERP and produce traceability software, founded in 1978, joins the portfolio.',
    body: ['Solen Software Group has acquired Spokane Software Systems, Inc., a provider of agricultural ERP and produce traceability software for growers, packers and shippers. The transaction closed in December 2025.','Founded in 1978, Spokane Software develops mission-critical systems used by agricultural operators to manage core packing and shipping workflows, supporting operational continuity and regulatory compliance across the supply chain.','Chris Poston continues as Chief Executive Officer.'] },
  { slug: 'solen-acquires-thought-foundry', category: 'Acquisitions', date: '2026-02-20', title: 'Thought Foundry joins Solen Software Group',
    summary: "Solen's entry into media and entertainment, through a platform managing digital content entitlements for major studios.",
    body: ['Solen Software Group has acquired Thought Foundry, Inc., a provider of enterprise SaaS for the media and entertainment industry.','The acquisition marks Solen’s entry into the media and entertainment vertical and extends its focus on high-retention businesses with mission-critical workflows and recurring revenue.','Thought Foundry will continue under its own brand, with planned investment to accelerate product development and expand partnerships. Timur Insepov continues as Chief Executive Officer.'] },
  { slug: 'solen-acquires-cairn-applications', category: 'Acquisitions', date: '2026-01-27', title: 'Cairn Applications joins Solen Software Group',
    summary: 'Box Tracker and Route Tracker, serving the waste hauling industry, join the portfolio.',
    body: ['Solen Software Group has acquired Cairn Applications, Inc., a provider of cloud software purpose-built for the waste hauling industry. The transaction closed in December 2025.','Founded in 2008, Cairn builds Box Tracker and Route Tracker, used by waste operators to manage container inventory, routing and dispatch.','Cairn will continue operating with autonomy, with Solen supporting the business through long-term ownership and optional shared services.'] },
  { slug: 'permanent-capital-versus-private-equity', category: 'Perspectives', date: '2026-02-04', title: 'Permanent capital is a structure, not a promise',
    summary: 'Every acquirer says they are long-term. The difference is whether anything forces them to sell.',
    body: ['Every acquirer tells founders they are in it for the long term. Most of them mean it when they say it. The question worth asking is not whether they intend to hold, but whether anything in their structure would eventually require them to sell.','A traditional fund has a defined life. Capital is raised, deployed, and returned on a schedule that was agreed with limited partners before your company was ever identified as a target. The people you meet may genuinely intend to be good stewards. The fund still has a clock, and the clock does not care.','Permanent capital removes the clock. There is no fund life, no return schedule, and no structural moment at which a company must be sold to satisfy an obligation to someone else.','This matters most in the years after a transaction, when the founder is no longer in the room. A structure that does not require a sale produces different decisions than one that does — about how much to invest in a product, how long to give a strategy, and whether to optimise a business for operation or for resale.','Ask any acquirer what would have to happen for them to sell your company. The answer tells you more than the pitch does.'] },
  { slug: 'why-decentralization-works', category: 'Perspectives', date: '2026-01-14', title: 'What we do not change after an acquisition',
    summary: 'The case for leaving product, pricing and customer relationships exactly where they are.',
    body: ['The instinct after acquiring a company is to improve it. Standardise the product, consolidate the brand, centralise the sales team, migrate everyone onto one system. It feels like value creation, and occasionally it is.','More often it destroys the thing that was bought. A vertical software business is valuable precisely because it has spent decades accumulating a specific understanding of one industry. That understanding lives in people who have talked to those customers for twenty years, and it does not survive being reorganised into a shared services function.','So we leave it alone. Product roadmap, pricing, customer relationships and day-to-day decisions stay with the team that already knows the answer.','What we do take is the work that is genuinely identical across every business we own — financial reporting, HR infrastructure, legal, and increasingly AI capability. None of that is differentiating. All of it consumes the attention of people whose attention should be somewhere else.','Decentralise what is specific. Centralise what is generic. The difficulty is being honest about which is which.'] },
  { slug: 'questions-to-ask-any-acquirer', category: 'Perspectives', date: '2025-12-09', title: 'Nine questions to ask any acquirer, including us',
    summary: 'A founder sells once. The buyer does it monthly. These questions close some of that gap.',
    body: ['The asymmetry in an acquisition conversation is severe. You have done this once. The person across the table does it every month, with a team and a process built for it.','These are the questions we think close some of that gap. We would rather you asked them of us than did not.','What would have to happen for you to sell my company? · How many companies have you sold, and why? · Can I speak to a founder who sold to you three or more years ago, without you on the call? · What changes in the first ninety days? · Who will my team report to? · What happens to my leadership team’s authority? · How is the purchase price structured, and what is contingent? · What does your capital require of you? · What is the worst experience a founder has had with you, and what did you learn?','If an acquirer cannot answer the last one, that is itself an answer.'] }
];

module.exports = { offices, portfolio, team, forum, checklist, insights };
