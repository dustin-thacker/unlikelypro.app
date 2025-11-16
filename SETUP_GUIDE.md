# Setup Guide - Inspection Tracker Recovery

## Current Status

✅ **Frontend Deployed to Vercel**: https://inspection-tracker-recovery.vercel.app
✅ **Project Files Recovered**: All files extracted and organized
✅ **Dependencies Installed**: Ready for local development
⚠️ **Backend Configuration Needed**: Environment variables required

## What's Working

- Frontend is deployed and accessible on Vercel
- Project structure is intact with all files
- Build process is functional
- Local development environment is ready

## What Needs Configuration

The application is currently showing an error because it needs:

1. **Database Connection**: MySQL database URL
2. **Backend API**: The app needs a backend server running
3. **Environment Variables**: Various configuration settings
4. **AWS S3**: For file uploads (if using this feature)

## Next Steps to Continue Development

### Option 1: Full-Stack Development in Manus (Recommended)

1. **Set up a database** (choose one):
   - **PlanetScale** (recommended): https://planetscale.com
     - Free tier available
     - MySQL compatible
     - Easy setup
   - **Railway**: https://railway.app
   - **Local MySQL**: Install MySQL locally

2. **Configure environment variables**:
   ```bash
   cd /home/ubuntu/inspection-tracker-recovery
   cp .env.example .env
   # Edit .env with your database URL and other settings
   ```

3. **Run database migrations**:
   ```bash
   pnpm db:push
   ```

4. **Start development server**:
   ```bash
   pnpm dev
   ```
   This will start both frontend and backend locally.

### Option 2: Deploy Backend to Vercel (Serverless)

For a serverless backend deployment, you'll need to:

1. Create a separate Vercel project for the backend
2. Configure it as a Node.js serverless function
3. Set up environment variables in Vercel dashboard
4. Update frontend to point to the backend API URL

### Option 3: Use Existing Database

If you had a database from the previous deployment:

1. Get the connection string from your previous setup
2. Add it to `.env` as `DATABASE_URL`
3. Test the connection locally

## Environment Variables Required

Create a `.env` file with these variables:

```bash
# Database (Required)
DATABASE_URL=mysql://user:password@host:port/database

# Application
NODE_ENV=development
PORT=3000

# AWS S3 (Optional - only if using file uploads)
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name

# Email Service (Optional - only if using email features)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_email@example.com
SMTP_PASS=your_password
```

## Vercel Deployment Configuration

To update the Vercel deployment with environment variables:

1. Go to: https://vercel.com/dustins-projects-d4c633f6/inspection-tracker-recovery/settings/environment-variables

2. Add each environment variable:
   - `DATABASE_URL`
   - `AWS_ACCESS_KEY_ID` (if needed)
   - `AWS_SECRET_ACCESS_KEY` (if needed)
   - Other variables as needed

3. Redeploy:
   ```bash
   vercel --prod
   ```

## GitHub Setup (Optional but Recommended)

To enable automatic deployments and version control:

1. **Create a GitHub repository manually**:
   - Go to: https://github.com/new
   - Name: `inspection-tracker`
   - Keep it private
   - Don't initialize with README

2. **Push code to GitHub**:
   ```bash
   cd /home/ubuntu/inspection-tracker-recovery
   git remote add origin https://github.com/YOUR_USERNAME/inspection-tracker.git
   git branch -M main
   git push -u origin main
   ```

3. **Connect to Vercel**:
   - Go to Vercel dashboard
   - Click "Connect Git" on your project
   - Select your GitHub repository
   - Vercel will now auto-deploy on every push

## Local Development Commands

```bash
# Install dependencies
pnpm install

# Run development server (frontend + backend)
pnpm dev

# Build for production
pnpm build

# Run production build locally
pnpm start

# Type checking
pnpm check

# Format code
pnpm format

# Run tests
pnpm test

# Database migrations
pnpm db:push
```

## Project Structure

```
inspection-tracker-recovery/
├── client/              # React frontend
│   ├── src/            # Source code
│   └── public/         # Static assets
├── server/             # Express backend
│   ├── _core/          # Core server functionality
│   └── *.ts            # API routes and services
├── shared/             # Shared types and utilities
├── drizzle/            # Database schema and migrations
├── .env                # Environment variables (create this)
├── package.json        # Dependencies and scripts
├── vercel.json         # Vercel deployment config
└── README.md           # Project documentation
```

## Troubleshooting

### "Invalid URL" Error on Vercel

This means the frontend can't connect to the backend. Solutions:

1. **For development**: Run the backend locally with `pnpm dev`
2. **For production**: Set up environment variables in Vercel
3. **Check**: Make sure `DATABASE_URL` is configured

### Database Connection Errors

1. Verify `DATABASE_URL` format: `mysql://user:password@host:port/database`
2. Check database is accessible from your location
3. Ensure database exists and credentials are correct

### Build Errors

1. Clear node_modules: `rm -rf node_modules && pnpm install`
2. Clear build cache: `rm -rf dist .vercel`
3. Check for TypeScript errors: `pnpm check`

## Getting Help

- **Vercel Documentation**: https://vercel.com/docs
- **Drizzle ORM Docs**: https://orm.drizzle.team
- **Project Issues**: Check the `todo.md` file for known issues

## Important Files

- `ROLES.md` - User roles and permissions documentation
- `WORKFLOWS.md` - Application workflows
- `todo.md` - Development tasks and known issues
- `pricing_correlation_notes.md` - Pricing logic notes
- `DEPLOYMENT.md` - Detailed deployment instructions

## Quick Start (If You Have a Database)

```bash
# 1. Configure environment
cd /home/ubuntu/inspection-tracker-recovery
echo "DATABASE_URL=your_mysql_url_here" > .env

# 2. Run migrations
pnpm db:push

# 3. Start development
pnpm dev

# 4. Open in browser
# Frontend: https://3000-[your-sandbox-url]
# Backend API: https://3000-[your-sandbox-url]/api
```

## Production Deployment Checklist

- [ ] Database is set up and accessible
- [ ] Environment variables configured in Vercel
- [ ] Database migrations run successfully
- [ ] Frontend builds without errors
- [ ] Backend API endpoints are working
- [ ] File uploads configured (if needed)
- [ ] Email service configured (if needed)
- [ ] Custom domain set up (optional)
- [ ] GitHub repository connected for auto-deploy
- [ ] Backup strategy in place

## Contact & Support

For issues specific to this recovery:
- Check the Vercel deployment logs
- Review the build logs at: https://vercel.com/dustins-projects-d4c633f6/inspection-tracker-recovery

For Manus-specific questions:
- Visit: https://help.manus.im
