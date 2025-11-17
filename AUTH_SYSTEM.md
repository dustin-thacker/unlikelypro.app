# CoCo POps Authentication System

## 🔐 Built-In Authentication

Your CoCo POps application now has a secure, standalone authentication system that doesn't rely on external OAuth providers.

---

## 🎯 Admin Login Credentials

**Production URL**: https://inspection-tracker-recovery.vercel.app/login

**Admin Account**:
- **Email**: `admin@cocopops.app`
- **Password**: `admin123`

⚠️ **IMPORTANT**: Change this password after your first login!

---

## 🚀 How to Access the Management UI

### Step 1: Go to Landing Page
Visit: https://inspection-tracker-recovery.vercel.app

### Step 2: Click "Login" Button
The grey "Login" button is located below the subtitle text.

### Step 3: Enter Credentials
- Email: `admin@cocopops.app`
- Password: `admin123`

### Step 4: Access Admin Dashboard
After successful login, you'll be automatically redirected to the **Admin Dashboard** (Management UI).

---

## 🎨 Login Page Features

- **Professional Design**: Black background with yellow accents
- **Branded**: CoCo POps logo and styling
- **Secure**: Password fields masked
- **User-Friendly**: Clear error messages
- **Responsive**: Works on mobile, tablet, and desktop

---

## 🔒 Security Features

### Password Security
- ✅ **Bcrypt hashing** with salt rounds
- ✅ Passwords never stored in plain text
- ✅ Secure password comparison

### Session Management
- ✅ **JWT tokens** for authentication
- ✅ **HTTP-only cookies** (can't be accessed by JavaScript)
- ✅ 7-day session expiration
- ✅ Secure flag in production (HTTPS only)

### API Protection
- ✅ All admin routes require authentication
- ✅ Role-based access control
- ✅ Token verification on every request

---

## 👥 User Management

### Creating Additional Users

You can create more users through the Admin Dashboard or via API:

**API Endpoint**: `POST /api/auth/register`

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "name": "User Name",
  "role": "admin" | "scheduler" | "field_tech" | "client_ap"
}
```

### Available Roles

| Role | Access Level | Dashboard |
|------|--------------|-----------|
| `admin` | Full system access | `/admin` |
| `scheduler` | Project scheduling | `/scheduler/projects` |
| `field_tech` | Field tasks | `/field-tech` |
| `client_ap` | Accounts payable | `/ap` |

---

## 🔄 Login Flow

```
Landing Page (/)
    ↓
Click "Login" Button
    ↓
Login Page (/login)
    ↓
Enter Email & Password
    ↓
Authentication Check
    ↓
JWT Token Generated
    ↓
Cookie Set (HTTP-only)
    ↓
Redirect to Role Dashboard
    ↓
Admin Dashboard (/admin)
```

---

## 📋 API Endpoints

### POST /api/auth/login
Authenticate user and create session.

**Request**:
```json
{
  "email": "admin@cocopops.app",
  "password": "admin123"
}
```

**Response**:
```json
{
  "user": {
    "id": 1,
    "email": "admin@cocopops.app",
    "name": "Admin User",
    "role": "admin"
  }
}
```

### POST /api/auth/logout
Clear session and log out user.

**Response**:
```json
{
  "success": true
}
```

### GET /api/auth/me
Get current authenticated user.

**Response**:
```json
{
  "user": {
    "id": 1,
    "email": "admin@cocopops.app",
    "name": "Admin User",
    "role": "admin"
  }
}
```

### POST /api/auth/register
Create new user account (admin only).

**Request**:
```json
{
  "email": "newuser@example.com",
  "password": "securepassword",
  "name": "New User",
  "role": "scheduler"
}
```

---

## 🛠️ Technical Implementation

### Stack
- **Backend**: Express.js + tRPC
- **Database**: Railway MySQL
- **Password Hashing**: bcryptjs
- **Tokens**: Jose (JWT)
- **Frontend**: React + Wouter (routing)

### Files Created/Modified

**New Files**:
- `server/_core/auth.ts` - Authentication service
- `server/routes/auth.ts` - Auth API routes
- `client/src/pages/Login.tsx` - Login page component
- `scripts/create-admin.ts` - Admin user creation script

**Modified Files**:
- `server/_core/index.ts` - Added auth routes
- `client/src/App.tsx` - Added login route
- `client/src/pages/Home.tsx` - Updated login button
- `package.json` - Added bcryptjs dependency

---

## 🔧 Environment Variables

### Required (Already Configured)
- `DATABASE_URL` - Railway MySQL connection
- `JWT_SECRET` - Token signing key (auto-generated)

### Optional
- `NODE_ENV` - Set to `production` in Vercel
- `COOKIE_NAME` - Session cookie name (default: `session`)

---

## 🎯 Next Steps

### 1. Test Login (Now!)
1. Visit: https://inspection-tracker-recovery.vercel.app
2. Click "Login"
3. Enter: `admin@cocopops.app` / `admin123`
4. Access Admin Dashboard

### 2. Change Password
After first login, update your admin password for security.

### 3. Create Additional Users
Use the Admin Dashboard to create accounts for:
- Schedulers
- Field technicians
- AP staff
- Other admins

### 4. Explore Management UI
Navigate through:
- Project management
- User management
- Calendar
- Invoices
- RFI system
- Deliverables

---

## 🆘 Troubleshooting

### Can't Log In?
- ✅ Check email spelling: `admin@cocopops.app`
- ✅ Check password: `admin123`
- ✅ Clear browser cookies and try again
- ✅ Try incognito/private browsing mode

### Redirected Back to Login?
- Session may have expired (7 days)
- Clear cookies and log in again

### "Invalid email or password" Error?
- Double-check credentials
- Password is case-sensitive
- Email must be exact match

### Database Connection Error?
- Railway database should be running 24/7
- Check Railway dashboard for database status

---

## 📊 Deployment Status

✅ **Authentication System**: Deployed  
✅ **Admin User Created**: Yes  
✅ **Login Page**: Live  
✅ **API Routes**: Operational  
✅ **Security**: Enabled  
✅ **Production**: https://inspection-tracker-recovery.vercel.app

---

## 🎉 Success!

Your CoCo POps application now has:
- ✅ Secure authentication system
- ✅ Professional login page
- ✅ Admin account ready to use
- ✅ Role-based access control
- ✅ Session management
- ✅ Production deployment

**You can now access the Management UI!**

---

**Created**: November 16, 2025  
**Status**: ✅ Operational  
**Next**: Log in and start managing your projects!
