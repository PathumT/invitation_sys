import type { Design, DesignElement } from "../types";
import { grandOpeningTemplate } from "./grandOpeningTemplate";
export const categories = [
  "Grand Opening",
  "Wedding",
  "Birthday",
  "Engagement",
  "Anniversary",
  "Corporate Event",
  "Graduation",
  "Baby Shower",
  "General Invitation",
  "Housewarming",
  "Party Celebrations",
  "Religious Celebration",
  "Holiday Celebration",
  "Store Opening",
  "Product Launch",
  "Conference",
  "Dinner Party",
  "General Events",
  "Corporate",
];
const themes = [
  {
    name: "The botanical edit",
    category: "Wedding",
    paper: "#f7f5ed",
    ink: "#284c3d",
    accent: "#657c4b",
    art: "botanical",
    kicker: "THE JOY OF TOGETHERNESS",
    heading: "Together with their families",
    footer: "A DAY TO CHERISH. A MEMORY TO KEEP.",
  },
  {
    name: "After hours",
    category: "Birthday",
    paper: "#202b45",
    ink: "#f8e5bc",
    accent: "#e9bd72",
    art: "celestial",
    kicker: "ANOTHER YEAR. A LITTLE MORE MAGIC.",
    heading: "An evening of laughter & celebration",
    footer: "GOOD PEOPLE · GREAT MEMORIES",
  },
  {
    name: "Modern romance",
    category: "Engagement",
    paper: "#fbefeb",
    ink: "#713e45",
    accent: "#a95966",
    art: "romance",
    kicker: "THE BEGINNING OF ALWAYS",
    heading: "Two hearts. One beautiful story.",
    footer: "COME CELEBRATE OUR NEXT CHAPTER",
  },
  {
    name: "Golden moments",
    category: "Anniversary",
    paper: "#f7f0dc",
    ink: "#665024",
    accent: "#9b742c",
    art: "golden",
    kicker: "HERE’S TO LOVE THAT ONLY GROWS",
    heading: "Celebrating a life beautifully shared",
    footer: "LOVE, LAUGHTER & HAPPILY EVER AFTER",
  },
  {
    name: "The gathering",
    category: "Corporate Event",
    paper: "#eff3f3",
    ink: "#1e3e4d",
    accent: "#2e6576",
    art: "architect",
    kicker: "IDEAS. CONNECTIONS. POSSIBILITIES.",
    heading: "You are cordially invited to",
    footer: "CONNECT · CONVERSE · BE INSPIRED",
  },
  {
    name: "A new chapter",
    category: "Graduation",
    paper: "#eee9f4",
    ink: "#4f3e66",
    accent: "#735590",
    art: "chapter",
    kicker: "THE FUTURE IS LOOKING BRIGHT",
    heading: "A milestone worth celebrating",
    footer: "BIG DREAMS. BRAVE BEGINNINGS.",
  },
  {
    name: "Little beginnings",
    category: "Baby Shower",
    paper: "#f5f2e8",
    ink: "#416559",
    accent: "#768861",
    art: "little",
    kicker: "A LITTLE WONDER IS ON THE WAY",
    heading: "Join us for a shower of love",
    footer: "TINY MOMENTS. ENDLESS LOVE.",
  },
  {
    name: "Simply together",
    category: "General Invitation",
    paper: "#f0ebe1",
    ink: "#383e38",
    accent: "#826a46",
    art: "together",
    kicker: "A PLACE AT THE TABLE, JUST FOR YOU",
    heading: "Good company makes every moment",
    footer: "LET’S MAKE A LITTLE TIME FOR EACH OTHER",
  },
];
function text(
  id: string,
  value: string,
  y: number,
  size: number,
  color: string,
  height = 40,
  align: "left" | "center" = "center",
): DesignElement {
  return {
    id,
    type: "text",
    x: align === "left" ? 60 : 50,
    y,
    width: align === "left" ? 360 : 380,
    height,
    text: value,
    fill: color,
    fontSize: size,
    fontFamily: ["title", "host", "venue", "intro"].includes(id)
      ? "Georgia"
      : "Arial",
    align,
    rotation: 0,
  };
}
export const starterTemplates = themes.map((t, index) => {
  const align = index === 4 ? ("left" as const) : ("center" as const);
  const elements: DesignElement[] = [
    {
      id: `art-${t.art}`,
      type: "image",
      src: `/templates/${t.art}.svg`,
      x: 0,
      y: 0,
      width: 480,
      height: 720,
      fill: t.paper,
      fontSize: 20,
      fontFamily: "Arial",
      align: "center",
      rotation: 0,
    },
    text("eyebrow", t.kicker, 74, 10, t.ink, 26, align),
    text("intro", t.heading, 157, 16, t.ink, 38, align),
    text(
      "title",
      "{{eventTitle}}",
      207,
      index === 4 ? 45 : 48,
      t.ink,
      126,
      align,
    ),
    text("host", "Hosted with love by {{hostName}}", 348, 17, t.ink, 53, align),
    text("date-label", "SAVE THE DATE", 420, 9, t.ink, 20, align),
    text("date", "{{eventDate}}  ·  {{eventTime}}", 446, 17, t.ink, 35, align),
    text("venue", "{{venueName}}", 505, 22, t.ink, 40, align),
    text("address", "{{venueAddress}}", 552, 12, t.ink, 40, align),
    text("guest", "An invitation for {{guestName}}", 613, 14, t.ink, 35, align),
    text("closing", t.footer, 668, 8, t.ink, 20, align),
  ];
  const design: Design = {
    background: t.paper,
    decorated: true,
    palette: { ink: t.ink, accent: t.accent },
    elements,
  };
  return { id: `starter-${index}`, name: t.name, category: t.category, design };
});
starterTemplates.splice(1, 0, grandOpeningTemplate);

// Additive variants reuse licensed repository artwork; original IDs and JSON remain unchanged.
const occasionEdits = [
  [
    "Housewarming",
    "Home, sweet gathering",
    "starter-7",
    "A NEW HOME. A WARM WELCOME.",
    "Come make yourself at home",
  ],
  [
    "Party Celebrations",
    "A night to remember",
    "starter-1",
    "GOOD PEOPLE. GREAT CELEBRATIONS.",
    "Let the celebrations begin",
  ],
  [
    "Religious Celebration",
    "Together in gratitude",
    "starter-0",
    "FAITH. FAMILY. TOGETHERNESS.",
    "Join us for a meaningful celebration",
  ],
  [
    "Holiday Celebration",
    "Season of togetherness",
    "starter-3",
    "THE SEASON IS BRIGHTER TOGETHER",
    "Celebrate the joy of the season",
  ],
  [
    "Store Opening",
    "Open doors",
    "starter-4",
    "A NEW BEGINNING IN OUR COMMUNITY",
    "Be part of our opening celebration",
  ],
  [
    "Product Launch",
    "The next big thing",
    "starter-4",
    "MEET WHAT COMES NEXT",
    "A first look, just for you",
  ],
  [
    "Conference",
    "Ideas in good company",
    "starter-4",
    "CONNECT. LEARN. BE INSPIRED.",
    "A gathering of ideas and people",
  ],
  [
    "Dinner Party",
    "At our table",
    "starter-7",
    "GOOD FOOD. WONDERFUL COMPANY.",
    "There is a place at our table for you",
  ],
  [
    "General Events",
    "A moment worth sharing",
    "starter-2",
    "MAKE TIME FOR SOMETHING SPECIAL",
    "We would love to celebrate with you",
  ],
  [
    "Corporate",
    "An occasion to connect",
    "starter-4",
    "GREAT THINGS START WITH CONNECTION",
    "Join colleagues and friends",
  ],
] as const;
for (const [category, name, sourceId, eyebrow, intro] of occasionEdits) {
  const source = starterTemplates.find((template) => template.id === sourceId)!;
  const design = structuredClone(source.design);
  design.version = 1;
  design.elements = design.elements.map((element) => ({
    ...element,
    ...(element.id === "eyebrow" ? { text: eyebrow } : {}),
    ...(element.id === "intro" ? { text: intro } : {}),
    ...(element.id === "host" ? { text: "Hosted by {{hostName}}" } : {}),
    ...(element.id === "closing"
      ? { text: "YOUR PRESENCE WILL MAKE IT SPECIAL" }
      : {}),
  }));
  starterTemplates.push({
    id: `occasion-${category.toLowerCase().replace(/\s+/g, "-")}`,
    name,
    category,
    design,
  });
}
