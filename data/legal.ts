export const legalOperator = {
  name: "Benjamin Trinidad Segura",
  address: {
    street: "Anne-Frank-Straße 7",
    postalCode: "60433",
    city: "Frankfurt am Main",
    country: "Germany",
  },
  email: "goatrecrutainer@gmail.com",
  status: "private-individual",
} as const;

export const privacySupervisoryAuthority = {
  name: "Der Hessische Beauftragte für Datenschutz und Informationsfreiheit (HBDI)",
  street: "Wilhelmstraße 7",
  postalCity: "65185 Wiesbaden",
  email: "poststelle@datenschutz.hessen.de",
  phone: "+49 611 1408-0",
  website: "https://datenschutz.hessen.de/",
} as const;

export const supabaseProjectFacts = {
  plan: "Free",
  infrastructure: "AWS",
  region: "eu-central-1",
  location: "Frankfurt, EU",
  automaticBackups: false,
  pointInTimeRecovery: false,
} as const;
