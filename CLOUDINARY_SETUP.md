# Cloudinary Setup Guide

This application uses Cloudinary for image storage and optimization. Follow these steps to set up Cloudinary:

## 1. Create a Cloudinary Account

1. Go to [https://cloudinary.com](https://cloudinary.com)
2. Sign up for a free account (or use an existing account)
3. Once logged in, you'll be taken to your dashboard

## 2. Get Your Cloudinary Credentials

From your Cloudinary dashboard, you'll need:

- **Cloud Name**: Found in the dashboard URL or under "Account Details"
- **API Key**: Found in the dashboard under "Account Details"
- **API Secret**: Found in the dashboard under "Account Details" (click "Reveal" to see it)

## 3. Add Environment Variables

Add the following environment variables to your `.env.local` file:

```env
# Cloudinary Configuration
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here
```

**Important Notes:**
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` is prefixed with `NEXT_PUBLIC_` because it's used in client-side code
- `CLOUDINARY_API_KEY` and `CLOUDINARY_API_SECRET` should NOT be prefixed with `NEXT_PUBLIC_` as they are server-side only
- Never commit your `.env.local` file to version control

## 4. Restart Your Development Server

After adding the environment variables, restart your Next.js development server:

```bash
npm run dev
```

## 5. Test the Integration

1. Try creating an event with an image upload
2. Try submitting a KYC application with ID images
3. Check your Cloudinary dashboard to see if images are being uploaded

## Image Storage Structure

Images are organized in Cloudinary folders:

- **Events**: `madeenajuba/events/`
- **KYC Documents**: `madeenajuba/kyc/`

## Features

- **Automatic Image Optimization**: Cloudinary automatically optimizes images for web delivery
- **Responsive Images**: Images are automatically resized and compressed
- **CDN Delivery**: Images are delivered via Cloudinary's global CDN for fast loading
- **Format Optimization**: Images are automatically converted to the best format (WebP, AVIF, etc.)

## Troubleshooting

### Images not uploading?

1. Check that all environment variables are set correctly
2. Verify your Cloudinary credentials in the dashboard
3. Check the browser console and server logs for error messages
4. Ensure your Cloudinary account is active (free tier is fine)

### Images not displaying?

1. Check that `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` is set correctly
2. Verify the image URLs in your database are Cloudinary URLs
3. Check the Next.js image configuration in `next.config.ts`

