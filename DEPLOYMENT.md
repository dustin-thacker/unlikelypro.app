# Deployment Guide for CoCo POps

## Vercel Deployment

This application is configured for deployment on Vercel with a serverless backend.

### Prerequisites

1. A Vercel account (sign up at https://vercel.com)
2. A MySQL database (recommended providers: PlanetScale, Railway, AWS RDS, or Vercel Postgres)
3. AWS S3 bucket for file storage (if using file uploads)

### Deployment Steps

#### Option 1: Deploy via Vercel CLI (Recommended)

1. Install Vercel CLI (if not already installed):
   ```bash
   npm install -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy from the project directory:
   ```bash
   cd /path/to/inspection-tracker-recovery
   vercel
   ```

4. Follow the prompts:
   - Set up and deploy? **Y**
   - Which scope? Select your account
   - Link to existing project? **N**
   - Project name? **inspection-tracker** (or your preferred name)
   - In which directory is your code located? **./**
   - Want to override settings? **Y**
   - Build Command: `pnpm install && pnpm build`
   - Output Directory: `client/dist`
   - Development Command: `pnpm dev`

5. Set environment variables in Vercel dashboard or via CLI:
   ```bash
   vercel env add DATABASE_URL
   vercel env add AWS_ACCESS_KEY_ID
   vercel env add AWS_SECRET_ACCESS_KEY
   vercel env add AWS_REGION
   vercel env add AWS_S3_BUCKET
   ```

#### Option 2: Deploy via Vercel Dashboard

1. Go to https://vercel.com/new
2. Import your Git repository (Vercel will prompt you to connect GitHub)
3. Configure project:
   - Framework Preset: **Other**
   - Build Command: `pnpm install && pnpm build`
   - Output Directory: `client/dist`
   - Install Command: `pnpm install`

4. Add environment variables in the project settings

### Environment Variables

Required environment variables for production:

```
DATABASE_URL=mysql://user:password@host:port/database
NODE_ENV=production
PORT=3000

# AWS S3 (if using file uploads)
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name

# Email Service (if configured)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_email@example.com
SMTP_PASS=your_password
```

### Database Setup

1. **PlanetScale** (Recommended for MySQL):
   - Sign up at https://planetscale.com
   - Create a new database
   - Get connection string from dashboard
   - Add as `DATABASE_URL` in Vercel

2. **Railway**:
   - Sign up at https://railway.app
   - Create MySQL database
   - Copy connection string
   - Add as `DATABASE_URL` in Vercel

3. Run migrations after first deployment:
   ```bash
   # Connect to your production database and run
   pnpm db:push
   ```

### Post-Deployment

1. Verify the deployment at your Vercel URL
2. Test API endpoints: `https://your-app.vercel.app/api/...`
3. Check logs in Vercel dashboard for any errors
4. Set up custom domain (optional) in Vercel project settings

### Troubleshooting

- **Build fails**: Check build logs in Vercel dashboard
- **Database connection errors**: Verify DATABASE_URL is correct
- **API routes not working**: Ensure vercel.json rewrites are configured
- **Missing dependencies**: Check that all dependencies are in package.json

### Continuous Deployment

Once connected to GitHub, Vercel will automatically:
- Deploy on every push to main branch
- Create preview deployments for pull requests
- Run build checks before deployment

### Local Development

To run locally:
```bash
pnpm install
pnpm dev
```

Access at http://localhost:5173 (frontend) and http://localhost:3000 (backend)
