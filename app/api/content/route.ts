import { fallbackProducts, sortProducts, type Product } from "../../../lib/content";

export const dynamic = "force-dynamic";

function parseCsv(csv: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < csv.length; index += 1) {
    const char = csv[index];
    const next = csv[index + 1];
    if (char === '"' && quoted && next === '"') {
      field += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(field.trim());
      field = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(field.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  row.push(field.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

function fromCsv(csv: string): Product[] {
  const [headers = [], ...rows] = parseCsv(csv);
  const normalized = headers.map((header) => header.trim().toLowerCase());

  return rows.map((row, index) => {
    const item = Object.fromEntries(normalized.map((header, column) => [header, row[column] || ""]));
    return {
      id: item.id || `AR-${String(index + 1).padStart(3, "0")}`,
      name: item.name || item.title || "Untitled",
      category: item.category || "Collection",
      subtitle: item.subtitle || "Aaradhya signature",
      fabric: item.fabric || "",
      description: item.description || "",
      colors: item.colors || "",
      image: item.image || "/campaign/vasudha-saree.webp",
      imageAlt: item.image_alt || item.imagealt || `${item.name || item.title || "Aaradhya"} look`,
      instagramUrl: item.instagram_url || item.instagramurl || undefined,
      active: !["false", "no", "0", "inactive"].includes(item.active.toLowerCase()),
      sort: Number(item.sort || (index + 1) * 10),
    };
  });
}

export async function GET() {
  const sheetUrl = process.env.GOOGLE_SHEETS_CSV_URL;
  if (!sheetUrl) {
    return Response.json({ source: "fallback", products: sortProducts(fallbackProducts) });
  }

  try {
    const response = await fetch(sheetUrl, { headers: { Accept: "text/csv" } });
    if (!response.ok) throw new Error(`Sheet returned ${response.status}`);
    const products = sortProducts(fromCsv(await response.text()));
    if (!products.length) throw new Error("Sheet has no active products");
    return Response.json(
      { source: "google-sheets", products },
      { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" } },
    );
  } catch {
    return Response.json({ source: "fallback", products: sortProducts(fallbackProducts) });
  }
}
