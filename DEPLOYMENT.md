# Deployment Guide: Vercel + Railway

This guide explains how to deploy the Drive Content Hub monorepo application using Vercel for the frontend and Railway for the backend.

**Important**: This is a monorepo with `client/`, `server/`, and `shared/` directories. The deployment splits these for optimal hosting.

## Backend Deployment (Railway)

1. Sign up at [railway.app](https://railway.app)
2. Create a new project and connect your GitHub repository
3. Add the following environment variables in Railway:
   - `DATABASE_URL` - Your PostgreSQL database connection string
   - `CLOUDINARY_CLOUD_NAME` - Your Cloudinary cloud name
   - `CLOUDINARY_API_KEY` - Your Cloudinary API key
   - `CLOUDINARY_API_SECRET` - Your Cloudinary API secret
   - `SESSION_SECRET` - Random secret for session encryption

4. Railway will automatically detect and deploy your Node.js application

## Frontend Deployment (Vercel)

1. Sign up at [vercel.com](https://vercel.com)
2. Create a new project and import your GitHub repository
3. The project is configured to automatically redirect API requests to your Railway backend using the rewrite rules in `vercel.json`. No additional environment variables are needed in Vercel.

4. The project includes a `vercel.json` file in the root that handles API rewrites to your Railway backend. Before deploying, update the `vercel.json` file with your actual Railway backend URL:
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "client/package.json",
         "use": "@vercel/static-build",
         "config": {
           "distDir": "dist-client"
         }
       }
     ],
     "routes": [
       {
         "src": "/api/(.*)",
         "dest": "https://your-railway-backend-url-production.up.railway.app/api/$1"
       }
     ],
     "headers": [
       {
         "source": "/(.*)",
         "headers": [
           {
             "key": "Access-Control-Allow-Origin",
             "value": "*"
           }
         ]
       }
     ]
   }
   ```

## CORS Configuration

The backend is already configured to handle CORS for the Vercel frontend deployment. The configuration allows requests from:
- `http://localhost:3000` (local development)
- `http://localhost:5173` (Vite local development)
- `https://*.vercel.app` (Vercel deployments)

## Cloudinary Setup

1. Sign up at [cloudinary.com](https://cloudinary.com)
2. Get your Cloud Name, API Key, and API Secret from the dashboard
3. Add these to your Railway environment variables

## Seeding Initial Data

After deploying, you may need to seed the initial admin user:
1. Access your deployed application
2. The seed script should automatically create an admin user with:
   - Username: `admin`
   - Password: `0777`

## Important Notes

- Make sure to use HTTPS URLs for production deployments
- The session cookies are configured to work across domains when deployed
- Cloudinary is used for image storage instead of local file system
- The PostgreSQL database persists data between deployments

## Troubleshooting

If you encounter issues:
1. Check that all environment variables are correctly set
2. Verify that CORS settings allow your frontend domain
3. Confirm that Cloudinary credentials are correct
4. Check the application logs in both Railway and Vercel dashboards