# Railway Deployment Guide for CoCo POps

## Quick Deploy Steps

### 1. Create New Railway Project

1. Go to https://railway.app/new
2. Click "Deploy from GitHub repo"
3. Select the repository: `dustin-thacker/unlikelypro.app`
4. Railway will automatically detect it's a Node.js project

### 2. Configure Environment Variables

In your Railway project settings, add these environment variables:

```
DATABASE_URL=mysql://root:ZijtKsFICqUeLTuKjqcywvxuKgtkNUgh@switchback.proxy.rlwy.net:36377/railway
JWT_SECRET=cocopops-dev-secret-key-change-in-production-2024
NODE_ENV=production
PORT=3000
```

### 3. Deploy Settings

Railway should automatically detect:
- **Build Command**: `pnpm install && pnpm build`
- **Start Command**: `pnpm start`
- **Port**: 3000

If not, set them manually in the Settings > Deploy section.

### 4. Deploy

1. Click "Deploy" or push to the main branch
2. Railway will build and deploy automatically
3. Once deployed, you'll get a public URL like: `https://your-app.up.railway.app`

### 5. Test Login

1. Go to your Railway URL
2. Navigate to `/login`
3. Login with:
   - Email: `admin@theblkhse.com`
   - Password: `danger42!`
4. You should be redirected to the admin dashboard at `/admin`

## Custom Domain Setup

To use your custom domain (cocopops.unlikelypro.app):

1. In Railway project settings, go to "Settings" > "Domains"
2. Click "Add Domain"
3. Enter: `cocopops.unlikelypro.app`
4. Railway will provide a CNAME record
5. Add the CNAME record to your DNS settings at Namecheap

## Troubleshooting

### Build Fails
- Check that all dependencies are in package.json
- Verify NODE_ENV is set to "production"
- Check build logs in Railway dashboard

### App Crashes on Start
- Verify DATABASE_URL is correct
- Check that JWT_SECRET is set
- Review runtime logs in Railway dashboard

### Can't Login
- Verify JWT_SECRET matches between deployments
- Check that DATABASE_URL points to the correct database
- Ensure the admin user exists in the database

## Database Connection

Your MySQL database is already hosted on Railway at:
```
mysql://root:ZijtKsFICqUeLTuKjqcywvxuKgtkNUgh@switchback.proxy.rlwy.net:36377/railway
```

The application will connect to this database automatically using the DATABASE_URL environment variable.

## Admin User

An admin user has been created with these credentials:
- **Email**: admin@theblkhse.com
- **Password**: danger42!

You can create additional users through the admin dashboard after logging in.

## GitHub Integration

Railway is connected to your GitHub repository. Any push to the `main` branch will trigger an automatic deployment.

To deploy changes:
1. Make changes locally
2. Commit: `git add -A && git commit -m "your message"`
3. Push: `git push`
4. Railway will automatically build and deploy

## Support

If you encounter issues:
1. Check Railway deployment logs
2. Verify all environment variables are set correctly
3. Ensure the database is accessible
4. Check the application logs for errors
