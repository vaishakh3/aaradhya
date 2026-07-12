# Aaradhya

A premium, inquiry-led website for Aaradhya women's clothing.

## Content workflow

The website works immediately with its curated fallback collection. To manage products without a database:

1. Create a Google Sheet with these columns: `id`, `name`, `category`, `subtitle`, `fabric`, `description`, `colors`, `image`, `image_alt`, `instagram_url`, `active`, `sort`.
2. Publish the product tab as CSV and set its export URL as `GOOGLE_SHEETS_CSV_URL`.
3. Upload product photography to Cloudinary and paste each delivery URL into the `image` column.
4. Set `active` to `FALSE` to hide an item and use `sort` values such as 10, 20, 30 to order the collection.

Product inquiries open WhatsApp with the product name and reference already included.
