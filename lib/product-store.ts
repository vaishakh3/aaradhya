import crypto from "node:crypto";
import { fallbackProducts, type Product } from "./content";

const SHEET_NAME = "Products";
const COLUMNS = [
  "id",
  "name",
  "category",
  "subtitle",
  "fabric",
  "description",
  "colors",
  "image",
  "imageAlt",
  "instagramUrl",
  "active",
  "sort",
] as const;

type ProductInput = Partial<Product>;

const spreadsheetId = () => process.env.GOOGLE_SHEETS_ID;

export const productStoreConfigured = () =>
  Boolean(spreadsheetId() && process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY);

const columnLetter = (number: number) => {
  let result = "";
  let value = number;
  while (value > 0) {
    value -= 1;
    result = String.fromCharCode(65 + (value % 26)) + result;
    value = Math.floor(value / 26);
  }
  return result;
};

const lastColumn = columnLetter(COLUMNS.length);

const getSheetsClient = async () => {
  const { google } = await import("googleapis");
  const auth = new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: String(process.env.GOOGLE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  await auth.authorize();
  return google.sheets({ version: "v4", auth });
};

const rowToProduct = (row: string[]): Product => {
  const item = Object.fromEntries(COLUMNS.map((column, index) => [column, row[index] ?? ""]));
  return {
    id: String(item.id),
    name: String(item.name),
    category: String(item.category || "Collection"),
    subtitle: String(item.subtitle),
    fabric: String(item.fabric),
    description: String(item.description),
    colors: String(item.colors),
    image: String(item.image),
    imageAlt: String(item.imageAlt),
    instagramUrl: String(item.instagramUrl || "") || undefined,
    active: !["false", "0", "no", "inactive"].includes(String(item.active).toLowerCase()),
    sort: Number(item.sort || 0),
  };
};

const productToRow = (product: Product) =>
  COLUMNS.map((column) => {
    const value = product[column as keyof Product];
    if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
    return value == null ? "" : String(value);
  });

const normalizeProduct = (input: ProductInput, existing?: Product): Product => {
  const merged = { ...existing, ...input } as Product;
  return {
    id: String(merged.id || "").trim(),
    name: String(merged.name || "").trim(),
    category: String(merged.category || "Collection").trim(),
    subtitle: String(merged.subtitle || "").trim(),
    fabric: String(merged.fabric || "").trim(),
    description: String(merged.description || "").trim(),
    colors: String(merged.colors || "").trim(),
    image: String(merged.image || "").trim(),
    imageAlt: String(merged.imageAlt || `${merged.name || "Aaradhya"} look`).trim(),
    instagramUrl: String(merged.instagramUrl || "").trim() || undefined,
    active: merged.active !== false,
    sort: Number(merged.sort || 0),
  };
};

const validateProduct = (product: Product) => {
  if (!product.name) throw new Error("Product name is required.");
  if (!product.category) throw new Error("Category is required.");
  if (!product.image) throw new Error("A product image is required.");
  return product;
};

const ensureSheet = async (sheets: Awaited<ReturnType<typeof getSheetsClient>>) => {
  const id = spreadsheetId();
  if (!id) throw new Error("Google Sheets is not configured.");

  const metadata = await sheets.spreadsheets.get({
    spreadsheetId: id,
    fields: "sheets.properties(sheetId,title)",
  });
  let sheet = metadata.data.sheets?.find((entry) => entry.properties?.title === SHEET_NAME)?.properties;

  if (!sheet) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: id,
      requestBody: { requests: [{ addSheet: { properties: { title: SHEET_NAME } } }] },
    });
    const refreshed = await sheets.spreadsheets.get({
      spreadsheetId: id,
      fields: "sheets.properties(sheetId,title)",
    });
    sheet = refreshed.data.sheets?.find((entry) => entry.properties?.title === SHEET_NAME)?.properties;
  }

  const header = await sheets.spreadsheets.values.get({ spreadsheetId: id, range: `${SHEET_NAME}!1:1` });
  const currentHeader = header.data.values?.[0] || [];
  if (COLUMNS.some((column, index) => currentHeader[index] !== column)) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: id,
      range: `${SHEET_NAME}!A1:${lastColumn}1`,
      valueInputOption: "RAW",
      requestBody: { values: [[...COLUMNS]] },
    });
  }

  return sheet;
};

const readRows = async (sheets: Awaited<ReturnType<typeof getSheetsClient>>, seed = true) => {
  await ensureSheet(sheets);
  const id = spreadsheetId()!;
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: id,
    range: `${SHEET_NAME}!A2:${lastColumn}`,
  });
  let products = (response.data.values || []).map(rowToProduct).filter((product) => product.id);

  if (!products.length && seed) {
    await sheets.spreadsheets.values.append({
      spreadsheetId: id,
      range: `${SHEET_NAME}!A:${lastColumn}`,
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values: fallbackProducts.map(productToRow) },
    });
    products = fallbackProducts.map((product) => ({ ...product }));
  }
  return products;
};

const sortAllProducts = (products: Product[]) =>
  [...products].sort(
    (left, right) => Number(left.sort || 0) - Number(right.sort || 0) || left.name.localeCompare(right.name),
  );

export const getStoredProducts = async ({ includeInactive = false } = {}) => {
  if (!productStoreConfigured()) {
    const products = fallbackProducts.map((product) => ({ ...product }));
    return {
      products: includeInactive ? sortAllProducts(products) : sortAllProducts(products.filter((product) => product.active !== false)),
      source: "fallback",
      configured: false,
    };
  }

  const sheets = await getSheetsClient();
  const products = sortAllProducts(await readRows(sheets));
  return {
    products: includeInactive ? products : products.filter((product) => product.active !== false),
    source: "google-sheets",
    configured: true,
  };
};

const nextProductId = (products: Product[]) => {
  const next = Math.max(0, ...products.map((product) => Number(product.id.match(/(\d+)$/)?.[1] || 0))) + 1;
  return `AR-${String(next).padStart(3, "0")}`;
};

export const createStoredProduct = async (input: ProductInput) => {
  if (!productStoreConfigured()) throw new Error("Google Sheets is not configured.");
  const sheets = await getSheetsClient();
  const products = await readRows(sheets);
  const product = validateProduct(
    normalizeProduct({
      ...input,
      id: String(input.id || nextProductId(products)),
      active: input.active !== false,
      sort: Number(input.sort || (products.length + 1) * 10),
    }),
  );
  if (products.some((entry) => entry.id === product.id)) throw new Error("That product ID already exists.");

  await sheets.spreadsheets.values.append({
    spreadsheetId: spreadsheetId()!,
    range: `${SHEET_NAME}!A:${lastColumn}`,
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: [productToRow(product)] },
  });
  return product;
};

export const updateStoredProduct = async (id: string, input: ProductInput) => {
  if (!productStoreConfigured()) throw new Error("Google Sheets is not configured.");
  const sheets = await getSheetsClient();
  const products = await readRows(sheets);
  const index = products.findIndex((product) => product.id === id);
  if (index < 0) throw new Error("Product not found.");
  const product = validateProduct(normalizeProduct({ ...input, id }, products[index]));

  await sheets.spreadsheets.values.update({
    spreadsheetId: spreadsheetId()!,
    range: `${SHEET_NAME}!A${index + 2}:${lastColumn}${index + 2}`,
    valueInputOption: "RAW",
    requestBody: { values: [productToRow(product)] },
  });
  return product;
};

export const deleteStoredProduct = async (id: string) => {
  if (!productStoreConfigured()) throw new Error("Google Sheets is not configured.");
  const sheets = await getSheetsClient();
  const sheet = await ensureSheet(sheets);
  const products = await readRows(sheets, false);
  const index = products.findIndex((product) => product.id === id);
  if (index < 0 || sheet?.sheetId == null) throw new Error("Product not found.");

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: spreadsheetId()!,
    requestBody: {
      requests: [{
        deleteDimension: {
          range: { sheetId: sheet.sheetId, dimension: "ROWS", startIndex: index + 1, endIndex: index + 2 },
        },
      }],
    },
  });
  return { id };
};

export const reorderStoredProducts = async (orderedIds: string[]) => {
  if (!productStoreConfigured()) throw new Error("Google Sheets is not configured.");
  if (!orderedIds.length) throw new Error("No product order was provided.");
  const sheets = await getSheetsClient();
  const products = await readRows(sheets, false);
  const existingIds = new Set(products.map((product) => product.id));
  if (orderedIds.some((id) => !existingIds.has(id))) throw new Error("The product order is out of date. Refresh and try again.");

  const positions = new Map(orderedIds.map((id, index) => [id, (index + 1) * 10]));
  const reordered = products.map((product) => ({ ...product, sort: positions.get(product.id) ?? product.sort }));
  await sheets.spreadsheets.values.update({
    spreadsheetId: spreadsheetId()!,
    range: `${SHEET_NAME}!A2:${lastColumn}${reordered.length + 1}`,
    valueInputOption: "RAW",
    requestBody: { values: reordered.map(productToRow) },
  });
  return sortAllProducts(reordered);
};

export const cloudinaryUploadConfigured = () =>
  Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);

export const signCloudinaryUpload = () => {
  if (!cloudinaryUploadConfigured()) throw new Error("Cloudinary is not configured.");
  const timestamp = Math.round(Date.now() / 1000);
  const folder = process.env.CLOUDINARY_UPLOAD_FOLDER || "aaradhya/products";
  const payload = `folder=${folder}&timestamp=${timestamp}${process.env.CLOUDINARY_API_SECRET}`;
  return {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME!,
    apiKey: process.env.CLOUDINARY_API_KEY!,
    folder,
    timestamp,
    signature: crypto.createHash("sha1").update(payload).digest("hex"),
  };
};
