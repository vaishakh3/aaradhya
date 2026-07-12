# Aaradhya collection studio

The private admin panel lives at `/admin`. It can add, edit, hide, reorder, and delete products. Product data is stored in Google Sheets and product images are uploaded directly to Cloudinary.

## 1. Create the Google Sheet

1. Create a blank Google spreadsheet.
2. Copy the spreadsheet ID from its URL: `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit`.
3. In Google Cloud, create a service account and a JSON key.
4. Share the spreadsheet with the service account email as an **Editor**.

The first authenticated admin request creates a `Products` tab and fills it with the current bundled products. No columns need to be created manually.

## 2. Connect Cloudinary

Create or use a Cloudinary account and copy its cloud name, API key, and API secret. Uploads are signed by the server and default to the `aaradhya/products` folder.

## 3. Add deployment settings

Add these environment variables to the Vercel project for Production, Preview, and Development:

```env
ADMIN_USERNAME=aaradhya-admin
ADMIN_PASSWORD=use-a-strong-unique-password
SESSION_SECRET=use-at-least-32-random-characters

GOOGLE_SHEETS_ID=your-spreadsheet-id
GOOGLE_SERVICE_ACCOUNT_EMAIL=service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
CLOUDINARY_UPLOAD_FOLDER=aaradhya/products
```

Redeploy after saving the variables. Then open `/admin`, sign in, and the collection studio will be ready to publish changes to the storefront.

Never commit real credentials or the service-account JSON file to Git.
