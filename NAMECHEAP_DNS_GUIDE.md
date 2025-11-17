# Namecheap DNS Configuration Guide for cocopops.unlikelypro.app

**Complete Visual Walkthrough with Step-by-Step Instructions**

---

## 📍 Overview

You'll be adding a CNAME record in Namecheap that points `cocopops.unlikelypro.app` to your Vercel deployment.

**What you need:**
- Namecheap account login
- Domain: `unlikelypro.app`
- CNAME value from Vercel (usually `cname.vercel-dns.com`)

**Time required:** 3-5 minutes

---

## Step 1: Log in to Namecheap

### 1.1 Navigate to Namecheap
- Open your browser
- Go to: **https://www.namecheap.com**
- Click the **"Sign In"** button (top right corner)

### 1.2 Enter Credentials
- Enter your **username** or **email**
- Enter your **password**
- Click **"Sign In"**

**Visual Reference:**
```
┌─────────────────────────────────────────┐
│  NAMECHEAP                    [Sign In] │
├─────────────────────────────────────────┤
│                                         │
│     ┌───────────────────────────┐      │
│     │  Username or Email        │      │
│     └───────────────────────────┘      │
│                                         │
│     ┌───────────────────────────┐      │
│     │  Password                 │      │
│     └───────────────────────────┘      │
│                                         │
│          [Sign In Button]              │
│                                         │
└─────────────────────────────────────────┘
```

---

## Step 2: Access Domain Management

### 2.1 Navigate to Domain List
After logging in, you'll see the Namecheap dashboard.

- Look for the left sidebar or top navigation
- Click on **"Domain List"** or **"Domains"**
- You'll see all your registered domains

**Visual Reference:**
```
┌─────────────────────────────────────────┐
│  ☰ Dashboard                            │
│  📋 Domain List        ← CLICK HERE     │
│  🛒 Products                            │
│  💳 Billing                             │
│  ⚙️  Settings                           │
└─────────────────────────────────────────┘
```

### 2.2 Find unlikelypro.app
You'll see a list of your domains:

```
┌──────────────────────────────────────────────────┐
│  Domain Name          Status      Expires        │
├──────────────────────────────────────────────────┤
│  unlikelypro.app      Active      Dec 2026       │
│                       [Manage] [Renew]           │
└──────────────────────────────────────────────────┘
```

- Locate **unlikelypro.app** in the list
- Click the **"Manage"** button next to it

---

## Step 3: Access Advanced DNS Settings

### 3.1 Navigate to Advanced DNS Tab
After clicking "Manage", you'll see the domain management page with several tabs:

```
┌─────────────────────────────────────────────────┐
│  unlikelypro.app                                │
├─────────────────────────────────────────────────┤
│  [Details] [Advanced DNS] [WhoisGuard] [...]   │
│              ↑                                  │
│         CLICK HERE                              │
└─────────────────────────────────────────────────┘
```

- Click on the **"Advanced DNS"** tab
- This is where you'll add your DNS records

### 3.2 View Current DNS Records
You'll see your current DNS records displayed in a table:

```
┌────────────────────────────────────────────────────────┐
│  HOST RECORDS                                          │
├────────────────────────────────────────────────────────┤
│  Type    Host    Value              TTL    Actions     │
├────────────────────────────────────────────────────────┤
│  A       @       123.45.67.89       Auto   [Edit][×]   │
│  CNAME   www     unlikelypro.app    Auto   [Edit][×]   │
│                                                         │
│  [+ ADD NEW RECORD]  ← WE'LL CLICK THIS               │
└────────────────────────────────────────────────────────┘
```

---

## Step 4: Add CNAME Record for cocopops

### 4.1 Click "Add New Record"
- Look for the button that says **"ADD NEW RECORD"** or **"+ ADD NEW RECORD"**
- Click it
- A new row will appear in the table

### 4.2 Fill in the CNAME Record Details

You'll see a form with these fields:

```
┌─────────────────────────────────────────────────────┐
│  ADD NEW RECORD                                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Type: [Dropdown ▼]                                │
│        ↓                                            │
│        Select: CNAME Record                         │
│                                                     │
│  Host: [_________________]                          │
│        ↓                                            │
│        Enter: cocopops                              │
│                                                     │
│  Value: [_________________________________]         │
│         ↓                                           │
│         Enter: cname.vercel-dns.com                 │
│                                                     │
│  TTL: [Automatic ▼]                                │
│       ↓                                             │
│       Leave as: Automatic                           │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Detailed Field Instructions:**

#### Field 1: Type
- **Click** the dropdown menu
- **Select**: `CNAME Record`
- Other options you'll see: A Record, AAAA Record, MX Record, TXT Record, etc.
- Make sure you select **CNAME Record**

#### Field 2: Host
- **Enter**: `cocopops`
- ⚠️ **IMPORTANT**: Do NOT enter the full domain
- ❌ Wrong: `cocopops.unlikelypro.app`
- ✅ Correct: `cocopops`
- Namecheap will automatically append `.unlikelypro.app`

#### Field 3: Value (or Target)
- **Enter**: `cname.vercel-dns.com`
- This is the value Vercel provided
- ⚠️ **IMPORTANT**: Copy exactly from Vercel, including any trailing dots
- Common Vercel CNAME values:
  - `cname.vercel-dns.com`
  - `cname.vercel-dns.com.`
  - `76.76.21.21` (if A record instead)

#### Field 4: TTL (Time To Live)
- **Select**: `Automatic` (recommended)
- Or choose: `300` (5 minutes) for faster propagation
- Or choose: `1 min` if available

### 4.3 Visual Example of Completed Form

```
┌─────────────────────────────────────────────────────┐
│  Type:  [CNAME Record ▼]                            │
│                                                     │
│  Host:  [cocopops________________]                  │
│                                                     │
│  Value: [cname.vercel-dns.com___________________]   │
│                                                     │
│  TTL:   [Automatic ▼]                              │
│                                                     │
│         [✓ Save]  [× Cancel]                       │
└─────────────────────────────────────────────────────┘
```

---

## Step 5: Save the DNS Record

### 5.1 Save Your Changes
After filling in all fields:

- Look for a **green checkmark (✓)** button or **"Save"** button
- Click it to save the record
- The new record will be added to your DNS table

### 5.2 Save All Changes
Namecheap requires a final confirmation:

- Look for a **"Save All Changes"** button at the top or bottom of the page
- It's usually a **green button**
- Click it to commit all DNS changes

**Visual Reference:**
```
┌─────────────────────────────────────────────────────┐
│  HOST RECORDS                                       │
│                                                     │
│  ⚠️  You have unsaved changes                       │
│                                                     │
│  [Save All Changes]  ← CLICK THIS (Green Button)   │
└─────────────────────────────────────────────────────┘
```

### 5.3 Confirmation Message
You should see a success message:

```
┌─────────────────────────────────────────────────────┐
│  ✓ Success!                                         │
│  Your DNS records have been updated successfully.   │
└─────────────────────────────────────────────────────┘
```

---

## Step 6: Verify the DNS Record

### 6.1 Check Your DNS Table
After saving, your DNS records should now include:

```
┌──────────────────────────────────────────────────────────┐
│  HOST RECORDS                                            │
├──────────────────────────────────────────────────────────┤
│  Type    Host       Value                  TTL  Actions  │
├──────────────────────────────────────────────────────────┤
│  A       @          123.45.67.89           Auto [Edit][×]│
│  CNAME   www        unlikelypro.app        Auto [Edit][×]│
│  CNAME   cocopops   cname.vercel-dns.com   Auto [Edit][×]│
│          ↑          ↑                                     │
│          NEW RECORD ADDED!                               │
└──────────────────────────────────────────────────────────┘
```

### 6.2 Double-Check the Values
Verify that:
- ✅ Type is **CNAME**
- ✅ Host is **cocopops**
- ✅ Value is **cname.vercel-dns.com** (or your Vercel value)
- ✅ TTL is **Automatic** or **300**

---

## Step 7: Wait for DNS Propagation

### 7.1 What Happens Now?
DNS changes take time to propagate across the internet:

- **Minimum**: 5-10 minutes
- **Typical**: 15-30 minutes
- **Maximum**: Up to 48 hours (rare)

### 7.2 Check Propagation Status

**Option A: Use DNSChecker.org**
1. Go to: https://dnschecker.org
2. Enter: `cocopops.unlikelypro.app`
3. Select: **CNAME** from the dropdown
4. Click **Search**
5. You'll see a world map showing DNS servers
6. Green checkmarks = DNS has propagated
7. Red X = Still waiting

**Visual Reference:**
```
┌─────────────────────────────────────────────────────┐
│  DNSChecker.org                                     │
├─────────────────────────────────────────────────────┤
│  Domain: [cocopops.unlikelypro.app____] [CNAME ▼]  │
│                                                     │
│  [Search]                                           │
│                                                     │
│  🌍 World Map                                       │
│  ✓ USA East      cname.vercel-dns.com              │
│  ✓ USA West      cname.vercel-dns.com              │
│  ✓ Europe        cname.vercel-dns.com              │
│  × Asia          (propagating...)                   │
└─────────────────────────────────────────────────────┘
```

**Option B: Use Command Line**
If you're comfortable with terminal:

```bash
# Check CNAME record
dig cocopops.unlikelypro.app CNAME

# Expected output:
# cocopops.unlikelypro.app. 300 IN CNAME cname.vercel-dns.com.
```

**Option C: Wait for Vercel**
- Go back to Vercel Domains page
- Vercel automatically checks DNS every few minutes
- When DNS is correct, you'll see: ✅ **Valid Configuration**

---

## Step 8: Verify in Vercel

### 8.1 Check Vercel Domain Status
1. Go to: https://vercel.com/dustins-projects-d4c633f6/inspection-tracker-recovery/settings/domains
2. Find `cocopops.unlikelypro.app` in the list
3. Look for the status indicator

**Possible Statuses:**

```
⏳ Pending Verification
   DNS records not detected yet. Wait a few minutes.

⚠️ Invalid Configuration
   DNS record is incorrect. Double-check Namecheap settings.

✅ Valid Configuration
   DNS is correct! SSL certificate being issued.

🔒 Ready
   Everything is working! Site is live with SSL.
```

### 8.2 SSL Certificate
Once DNS is validated:
- Vercel automatically issues a free SSL certificate
- Uses Let's Encrypt
- Takes 5-10 minutes
- No action needed from you

---

## Step 9: Test Your Site

### 9.1 Visit Your Custom Domain
Once Vercel shows "Ready":

1. Open a new browser tab
2. Go to: **https://cocopops.unlikelypro.app**
3. You should see your CoCo POps landing page
4. Check for the 🔒 padlock in the address bar (SSL active)

### 9.2 Test All Functionality
- ✅ Page loads correctly
- ✅ Logo displays
- ✅ Custom cursor works
- ✅ Click "Login" button
- ✅ OAuth redirects properly
- ✅ After login, returns to custom domain

---

## 🎉 Success Checklist

Once everything is working:

- [x] CNAME record added in Namecheap
- [x] DNS propagated (checked with dnschecker.org)
- [x] Vercel shows "Valid Configuration"
- [x] SSL certificate issued (🔒)
- [x] Site loads at https://cocopops.unlikelypro.app
- [x] Login/OAuth works
- [x] All features functional

---

## 🔧 Troubleshooting Common Issues

### Issue 1: "Invalid Configuration" in Vercel

**Symptoms:**
- Vercel shows red X or warning
- Says "DNS records not found"

**Solutions:**
1. **Check Host field in Namecheap**
   - Should be: `cocopops`
   - NOT: `cocopops.unlikelypro.app`
   - NOT: `@`

2. **Check Value field**
   - Should be exactly what Vercel provided
   - Usually: `cname.vercel-dns.com`
   - Check for typos

3. **Check Record Type**
   - Should be: `CNAME Record`
   - NOT: `A Record` (unless Vercel specifically said A record)

4. **Wait longer**
   - DNS can take 15-30 minutes
   - Be patient!

### Issue 2: DNS Not Propagating

**Symptoms:**
- DNSChecker shows red X everywhere
- Been waiting 30+ minutes

**Solutions:**
1. **Verify you clicked "Save All Changes"**
   - Go back to Namecheap Advanced DNS
   - Make sure there's no "unsaved changes" warning

2. **Try lower TTL**
   - Edit the CNAME record
   - Change TTL to `300` (5 minutes)
   - Save again

3. **Check Namecheap nameservers**
   - Go to Domain → Details tab
   - Nameservers should be Namecheap's (not custom)
   - If custom, DNS changes won't work

### Issue 3: Site Loads But No SSL

**Symptoms:**
- Site loads at http://cocopops.unlikelypro.app
- But https:// shows certificate error

**Solutions:**
1. **Wait for SSL issuance**
   - Vercel issues SSL automatically
   - Can take 10-15 minutes after DNS validates

2. **Check Vercel status**
   - Should show "Ready" not just "Valid Configuration"

3. **Force HTTPS**
   - Vercel automatically redirects HTTP to HTTPS
   - If not, check Vercel settings

### Issue 4: Old Vercel URL Still Shows

**Symptoms:**
- Custom domain works
- But old inspection-tracker-recovery.vercel.app still primary

**Solutions:**
1. **Set as primary domain** (optional)
   - In Vercel Domains settings
   - Click three dots next to cocopops.unlikelypro.app
   - Select "Set as Primary Domain"
   - All URLs will redirect to custom domain

---

## 📸 Quick Visual Summary

### The Complete DNS Record

```
┌─────────────────────────────────────────────────────┐
│  FINAL RESULT IN NAMECHEAP:                         │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Type:    CNAME Record                              │
│  Host:    cocopops                                  │
│  Value:   cname.vercel-dns.com                      │
│  TTL:     Automatic                                 │
│                                                     │
│  This creates:                                      │
│  cocopops.unlikelypro.app → Vercel                  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### The Flow

```
User types:
cocopops.unlikelypro.app
         ↓
DNS lookup (Namecheap)
         ↓
CNAME → cname.vercel-dns.com
         ↓
Vercel servers
         ↓
Your CoCo POps app
         ↓
User sees your site! 🎉
```

---

## 📞 Need More Help?

If you're stuck:

1. **Take a screenshot** of your Namecheap DNS records
2. **Take a screenshot** of your Vercel domain status
3. **Share with me** and I'll help troubleshoot!

Common questions:
- "Which value did Vercel give you?"
- "What does the Vercel status say?"
- "How long has it been since you added the record?"

---

## ✅ You're Done!

Once your site loads at **https://cocopops.unlikelypro.app**, you're all set!

Your CoCo POps app now has:
- ✅ Professional custom domain
- ✅ Free SSL certificate
- ✅ Automatic HTTPS
- ✅ Fast global CDN
- ✅ OAuth working perfectly

**Congratulations!** 🎊
