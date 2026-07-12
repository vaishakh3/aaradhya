export type Product = {
  id: string;
  name: string;
  category: "Sarees" | "Sets" | "Occasion" | string;
  subtitle: string;
  fabric: string;
  description: string;
  colors: string;
  image: string;
  imageAlt: string;
  instagramUrl?: string;
  active?: boolean;
  sort?: number;
};

export const fallbackProducts: Product[] = [
  {
    id: "AR-001",
    name: "Vasudha",
    category: "Sarees",
    subtitle: "Aubergine handloom saree",
    fabric: "Silk-cotton handloom",
    description:
      "A quiet statement in Aaradhya aubergine, finished with a fine antique-gold selvedge and an easy, fluid drape.",
    colors: "Aubergine / Antique gold",
    image: "/campaign/vasudha-saree.webp",
    imageAlt: "Woman wearing the Vasudha aubergine handloom saree",
    active: true,
    sort: 10,
  },
  {
    id: "AR-002",
    name: "Ira",
    category: "Sets",
    subtitle: "Pearl kurta set",
    fabric: "Cotton-silk / Organza",
    description:
      "Pearl ivory, barely-there embroidery and an organza dupatta edged in aubergine - considered ease for luminous days.",
    colors: "Pearl / Aubergine",
    image: "/campaign/ira-kurta.webp",
    imageAlt: "Woman wearing the Ira pearl ivory kurta set",
    active: true,
    sort: 20,
  },
  {
    id: "AR-003",
    name: "Maya",
    category: "Occasion",
    subtitle: "Plum embroidered anarkali",
    fabric: "Silk blend / Tonal embroidery",
    description:
      "A sculpted occasion silhouette in deep plum, embroidered tone on tone so the movement - not the ornament - takes centre stage.",
    colors: "Plum / Muted gold",
    image: "/campaign/maya-anarkali.webp",
    imageAlt: "Woman wearing the Maya deep plum anarkali",
    active: true,
    sort: 30,
  },
  {
    id: "AR-004",
    name: "Tara",
    category: "Sarees",
    subtitle: "Rose handwoven saree",
    fabric: "Textured silk-cotton",
    description:
      "A muted rose weave with a restrained aubergine edge - soft in colour, assured in character, and made for repeat wearing.",
    colors: "Dusty rose / Aubergine",
    image: "/campaign/tara-saree.webp",
    imageAlt: "Woman wearing the Tara muted rose handwoven saree",
    active: true,
    sort: 40,
  },
];

export const sortProducts = (products: Product[]) =>
  [...products]
    .filter((product) => product.active !== false)
    .sort((a, b) => Number(a.sort || 0) - Number(b.sort || 0));
