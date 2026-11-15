export type Property = {
  created_at?: string;
  gallery?: string[];
  panorama?: string;
  model?: string;
  video?: string;
  id: string;
  title: string;
  area: string;
  city: string;
  type: string;
  purpose: string;
  price: number;
  beds: number;
  baths: number;
  sqyd: number;
  image: string;
  featured: boolean;
  status: string;
  demo: boolean;
  furnished: boolean;
  amenities: string[];
  description: string;
};
export const properties: Property[] = [
  {
    id: "MS-D01",
    title: "The Palm Residence",
    area: "DHA Phase 8",
    city: "Karachi",
    type: "House",
    purpose: "Buy",
    price: 185000000,
    beds: 6,
    baths: 7,
    sqyd: 1000,
    image: "/assets/villa.jpg",
    featured: true,
    status: "Ready",
    demo: true,
    furnished: false,
    amenities: ["Garden", "Parking", "Terrace", "Study"],
    description:
      "An illustrative contemporary residence with generous living spaces, a private garden and a considered indoor-outdoor connection. Photography and specifications demonstrate the platform and do not represent an available property.",
  },
  {
    id: "MS-D02",
    title: "A View Above the Ordinary",
    area: "Clifton",
    city: "Karachi",
    type: "Apartment",
    purpose: "Buy",
    price: 65000000,
    beds: 3,
    baths: 4,
    sqyd: 300,
    image: "/assets/interior.jpg",
    featured: true,
    status: "Ready",
    demo: true,
    furnished: true,
    amenities: ["Security", "Parking", "Elevator", "Terrace"],
    description:
      "An illustrative apartment concept with natural light, open living spaces and refined finishes. This sample is for exploring the property experience only.",
  },
  {
    id: "MS-D03",
    title: "The Garden House",
    area: "DHA Phase 6",
    city: "Karachi",
    type: "House",
    purpose: "Rent",
    price: 450000,
    beds: 5,
    baths: 6,
    sqyd: 500,
    image: "/assets/garden.jpg",
    featured: true,
    status: "Ready",
    demo: true,
    furnished: false,
    amenities: ["Garden", "Parking", "Study"],
    description:
      "A sample family home concept featuring a secluded garden, generous bedrooms and spaces for everyday living. Not an available rental.",
  },
  {
    id: "MS-D04",
    title: "A New Perspective on Business",
    area: "Shahrah-e-Faisal",
    city: "Karachi",
    type: "Office",
    purpose: "Rent",
    price: 280000,
    beds: 0,
    baths: 2,
    sqyd: 200,
    image: "/assets/office.jpg",
    featured: false,
    status: "Ready",
    demo: true,
    furnished: true,
    amenities: ["Security", "Parking", "Elevator"],
    description:
      "A demonstration commercial workspace with flexible floor space and contemporary finishes. Contact the team to discuss actual commercial requirements.",
  },
  {
    id: "MS-D05",
    title: "A Canvas for Your Vision",
    area: "DHA Phase 8",
    city: "Karachi",
    type: "Plot",
    purpose: "Buy",
    price: 95000000,
    beds: 0,
    baths: 0,
    sqyd: 500,
    image: "/assets/architecture.jpg",
    featured: false,
    status: "Plot",
    demo: true,
    furnished: false,
    amenities: [],
    description:
      "An illustrative residential land entry. Imagery is architectural inspiration and does not depict a verified parcel. No location pin or ownership claim is implied.",
  },
  {
    id: "MS-D06",
    title: "The Courtyard Collection",
    area: "DHA Phase 6",
    city: "Karachi",
    type: "House",
    purpose: "Buy",
    price: 120000000,
    beds: 5,
    baths: 6,
    sqyd: 500,
    image: "/assets/hero.jpg",
    featured: false,
    status: "Under construction",
    demo: true,
    furnished: false,
    amenities: ["Garden", "Parking", "Terrace"],
    description:
      "A sample contemporary house concept for demonstrating property discovery. All pricing, dimensions and specifications are illustrative.",
  },
];
export const services = [
  {
    slug: "buy-property",
    name: "Property Purchase",
    label: "Find your place.",
    text: "A thoughtful search begins with understanding how you want to live. We help you define your requirements, explore suitable options and navigate the purchase process.",
    steps: [
      "Your requirements",
      "Property discovery",
      "Due diligence coordination",
      "Purchase support",
    ],
  },
  {
    slug: "sell-property",
    name: "Property Sale",
    label: "Your next chapter starts here.",
    text: "Position your property with care. Discuss market context, presentation, buyer inquiries and a clear path from listing to negotiation.",
    steps: [
      "Property assessment",
      "Marketing plan",
      "Buyer introductions",
      "Negotiation support",
    ],
  },
  {
    slug: "rent-property",
    name: "Property Rentals",
    label: "A space that fits your life.",
    text: "From a family home to a commercial workspace, share your rental needs and let us help you explore suitable options in Karachi.",
    steps: [
      "Rental brief",
      "Curated options",
      "Property viewings",
      "Agreement coordination",
    ],
  },
  {
    slug: "construction",
    name: "Construction",
    label: "Exceptional living, built from the ground up.",
    text: "Bring a residential or commercial vision into focus through a considered brief, construction planning and a coordinated approach to materials and execution.",
    steps: [
      "Project discovery",
      "Scope & planning",
      "Construction coordination",
      "Completion review",
    ],
  },
  {
    slug: "development",
    name: "Real Estate Development",
    label: "See the potential. Shape the future.",
    text: "Explore development possibilities through a clear understanding of site requirements, intended use, project feasibility and long-term goals.",
    steps: [
      "Opportunity brief",
      "Feasibility discussion",
      "Development planning",
      "Project coordination",
    ],
  },
  {
    slug: "property-management",
    name: "Property Management",
    label: "Your property. Thoughtfully cared for.",
    text: "Discuss ongoing property administration, tenant coordination and maintenance requirements with a single point of contact.",
    steps: [
      "Property review",
      "Management scope",
      "Tenant coordination",
      "Maintenance planning",
    ],
  },
  {
    slug: "renovation",
    name: "Property Renovation",
    label: "Reimagine what home can be.",
    text: "Make room for a new way of living. Plan considered upgrades, practical improvements and refined finishes for residential and commercial spaces.",
    steps: [
      "Space assessment",
      "Design brief",
      "Finishes & scope",
      "Renovation coordination",
    ],
  },
];
export const projects = [
  {
    slug: "courtyard-residence",
    title: "The Courtyard Residence",
    category: "Residential concept",
    image: "/assets/architecture.jpg",
    text: "An architectural mood study exploring shade, privacy and connected living spaces. Concept imagery only; this is not a completed M. Star Associates project.",
  },
  {
    slug: "contemporary-living",
    title: "The Art of Contemporary Living",
    category: "Interior inspiration",
    image: "/assets/interior.jpg",
    text: "A materials and spatial inspiration study combining natural textures, generous light and a calm palette. Illustrative inspiration, not a completed company project.",
  },
  {
    slug: "garden-retreat",
    title: "The Garden Retreat",
    category: "Landscape inspiration",
    image: "/assets/garden.jpg",
    text: "A visual reference for considered outdoor spaces and the connection between architecture and landscape. Inspiration imagery, not a verified portfolio project.",
  },
];
export const articles = [
  {
    slug: "buying-in-karachi",
    title: "A considered approach to buying property in Karachi",
    category: "Buyer’s guide",
    date: "November 2026",
    image: "/assets/villa.jpg",
    body: [
      "Begin with the life you want to build. Define your preferred area, household needs, commute and a realistic total budget before shortlisting properties. Allow for taxes, transfer expenses, professional advice and any improvements.",
      "Compare the condition, access, utilities and planning context of each option. Visit at different times of day where possible, and record questions rather than relying on photography alone.",
      "Before making a commitment, engage qualified independent legal and tax advisers to verify title, approvals, seller authority and transaction requirements. M. Star Associates can discuss your requirements and coordinate the next steps; this article is general information, not legal advice.",
    ],
  },
  {
    slug: "construction-planning",
    title: "From first idea to a well-defined construction brief",
    category: "Construction",
    date: "November 2026",
    image: "/assets/architecture.jpg",
    body: [
      "A strong construction brief brings budget, space and priorities together. Start with who will use the building and how its spaces should support daily life.",
      "Document your desired rooms, circulation, storage and outdoor space. Discuss local approvals, site conditions, utilities, programme and contingency with qualified professionals.",
      "Compare written scopes and material specifications before appointing contractors. Clear responsibilities, progress reviews and documented changes help keep the project understandable.",
    ],
  },
  {
    slug: "property-investment",
    title: "Look beyond the asking price",
    category: "Investment perspective",
    date: "November 2026",
    image: "/assets/interior.jpg",
    body: [
      "A property investment deserves a full view of costs and responsibilities. Consider acquisition expenses, maintenance, vacancy, taxes and the time needed to manage the asset.",
      "Assess the area, permitted use, condition and realistic demand using independently verified information. Any potential rental yield depends on actual occupancy, expenses and market conditions.",
      "Returns are not guaranteed. Seek independent financial, legal and tax advice before investing, and make decisions in the context of your own circumstances.",
    ],
  },
];
export const faqs = [
  [
    "Where is your office?",
    "Lane 4C, Building No. 4, Office No. 1, Nishat Commercial, Phase 6, DHA, Karachi, Pakistan, 75500. Please request an appointment before visiting.",
  ],
  [
    "Are the properties on this website available?",
    "The initial collection contains clearly labeled sample listings. Prices, imagery and specifications are illustrative. Ask our team about verified current availability.",
  ],
  [
    "Which services can I discuss with your team?",
    "Property sale, purchase, rentals, construction, real estate development, property management and renovation.",
  ],
  [
    "Can I request a property valuation?",
    "Yes. Share the property location, type, size and condition using the valuation form. Any initial assessment is indicative and subject to review.",
  ],
  [
    "Which area units do you support?",
    "Square feet, square yards, marla and kanal. This platform uses 1 square yard = 9 square feet, 1 marla = 272.25 square feet and 1 kanal = 20 marla. Local conventions can vary; verify title documents.",
  ],
  [
    "Do you provide investment guarantees?",
    "No. Property values and returns can change. Independent legal, tax and financial advice is recommended before any commitment.",
  ],
];
export const money = (n: number) =>
  n >= 10000000
    ? `${+(n / 10000000).toFixed(2)} crore`
    : n >= 100000
      ? `${+(n / 100000).toFixed(2)} lakh`
      : n.toLocaleString("en-PK");
export const areaValue = (sqyd: number, unit: string) =>
  ({
    sqyd,
    sqft: sqyd * 9,
    marla: (sqyd * 9) / 272.25,
    kanal: (sqyd * 9) / 5445,
  })[unit] ?? sqyd;
export const address =
  "Lane 4C, Building No. 4, Office No. 1, Nishat Commercial, Phase 6, DHA, Karachi, Pakistan, 75500";
