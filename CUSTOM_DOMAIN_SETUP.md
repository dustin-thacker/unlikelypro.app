# Custom Domain Setup Guide: cocopops.unlikelypro.app

**Domain**: `cocopops.unlikelypro.app`  
**Registrar**: Namecheap  
**Hosting**: Vercel  
**Date**: November 16, 2025

---

## 📋 Overview

We'll set up a subdomain `cocopops.unlikelypro.app` to point to your Vercel deployment. This involves:
1. Adding the domain in Vercel
2. Getting DNS records from Vercel
3. Adding DNS records in Namecheap
4. Waiting for DNS propagation (5-30 minutes)

---

## Part 1: Add Domain in Vercel

### Step 1: Open Vercel Project Settings

1. Go to: https://vercel.com/dustins-projects-d4c633f6/inspection-tracker-recovery
2. Click on **"Settings"** tab
3. Click on **"Domains"** in the left sidebar

### Step 2: Add Custom Domain

1. In the "Domains" section, find the input field
2. Enter: `cocopops.unlikelypro.app`
3. Click **"Add"**

### Step 3: Get DNS Records

Vercel will show you one of these configurations:

**Option A: CNAME Record** (Most Common)
```
Type: CNAME
Name: cocopops
Value: cname.vercel-dns.com
```

**Option B: A Record** (Less Common)
```
Type: A
Name: cocopops
Value: 76.76.21.21
```

**📝 Write down which option Vercel shows you - we'll need this for Namecheap!**

---

## Part 2: Configure DNS in Namecheap

### Step 1: Log in to Namecheap

1. Go to: https://www.namecheap.com
2. Log in to your account
3. Go to **"Domain List"**
4. Find **"unlikelypro.app"**
5. Click **"Manage"**

### Step 2: Access Advanced DNS

1. Click on the **"Advanced DNS"** tab
2. You'll see your current DNS records

### Step 3: Add DNS Record

**If Vercel gave you a CNAME record:**

1. Click **"Add New Record"**
2. Select **Type**: `CNAME Record`
3. **Host**: `cocopops`
4. **Value**: `cname.vercel-dns.com` (or whatever Vercel provided)
5. **TTL**: `Automatic` (or `300` for faster updates)
6. Click **"Save All Changes"** (green checkmark)

**If Vercel gave you an A record:**

1. Click **"Add New Record"**
2. Select **Type**: `A Record`
3. **Host**: `cocopops`
4. **Value**: `76.76.21.21` (or whatever IP Vercel provided)
5. **TTL**: `Automatic` (or `300`)
6. Click **"Save All Changes"**

### Step 4: Verify DNS Settings

Your DNS records should look like this:

```
Type        Host        Value                   TTL
CNAME       cocopops    cname.vercel-dns.com    Automatic
```

Or:

```
Type        Host        Value           TTL
A           cocopops    76.76.21.21     Automatic
```

---

## Part 3: Wait for DNS Propagation

### What Happens Now?

1. **Namecheap**: DNS records are saved (instant)
2. **DNS Propagation**: Takes 5-30 minutes (sometimes up to 48 hours)
3. **Vercel**: Automatically detects DNS and issues SSL certificate
4. **Your Site**: Will be live at `https://cocopos.unlikelypro.app`

### Check Propagation Status

**Option 1: Use DNS Checker**
- Go to: https://dnschecker.org
- Enter: `cocopops.unlikelypro.app`
- Check if it resolves to Vercel's servers

**Option 2: Use Command Line**
```bash
# Check CNAME
dig cocopops.unlikelypro.app CNAME

# Check A record
dig cocopops.unlikelypro.app A
```

**Option 3: Wait for Vercel**
- Go back to Vercel Domains settings
- Vercel will show a green checkmark when DNS is configured correctly
- SSL certificate will be automatically issued

---

## Part 4: Verify Everything Works

### Step 1: Check Vercel Status

1. Go to Vercel project: https://vercel.com/dustins-projects-d4c633f6/inspection-tracker-recovery/settings/domains
2. Look for `cocopops.unlikelypro.app`
3. Status should show: ✅ **Valid Configuration**

### Step 2: Test Your Site

1. Open: https://cocopops.unlikelypro.app
2. You should see your CoCo POps landing page
3. SSL certificate should be active (🔒 in browser)

### Step 3: Test Login

1. Click the **"Login"** button
2. OAuth should work normally
3. After login, you'll be redirected back to your custom domain

---

## 🎯 Quick Reference

### Vercel Settings
- **Project**: inspection-tracker-recovery
- **URL**: https://vercel.com/dustins-projects-d4c633f6/inspection-tracker-recovery/settings/domains

### Namecheap Settings
- **Domain**: unlikelypro.app
- **URL**: https://ap.www.namecheap.com/domains/domaincontrolpanel/unlikelypro.app/advancedns

### DNS Record to Add
```
Type: CNAME
Host: cocopops
Value: cname.vercel-dns.com (or as provided by Vercel)
TTL: Automatic
```

---

## 🔧 Troubleshooting

### Issue: "Invalid Configuration" in Vercel

**Solution**: 
- Double-check DNS record in Namecheap
- Make sure Host is `cocopops` (not `cocopops.unlikelypro.app`)
- Wait 10-15 minutes for DNS propagation

### Issue: "DNS Not Found"

**Solution**:
- Verify you saved the DNS record in Namecheap
- Check for typos in the Host or Value fields
- Try using TTL of `300` instead of Automatic

### Issue: SSL Certificate Error

**Solution**:
- Wait for Vercel to issue certificate (automatic after DNS validates)
- Usually takes 5-10 minutes after DNS propagates
- Vercel uses Let's Encrypt (free, automatic)

### Issue: Site Shows Old Vercel URL

**Solution**:
- Clear browser cache
- Try incognito/private browsing mode
- Wait a bit longer for DNS propagation

---

## 📝 Next Steps After Setup

### 1. Update OAuth Redirect URI (Optional)

If you want OAuth to redirect to the custom domain:

**In Vercel Environment Variables:**
```bash
# No changes needed - OAuth will work with any domain
```

**In OAuth Portal** (if you have access):
- Add `https://cocopops.unlikelypro.app/api/oauth/callback` as allowed redirect URI

### 2. Set Custom Domain as Primary (Optional)

In Vercel:
1. Go to Domains settings
2. Click the three dots next to `cocopops.unlikelypro.app`
3. Select **"Set as Primary Domain"**
4. All other URLs will redirect to this one

### 3. Update Documentation

Update your documentation to reference the new URL:
- README.md
- DEPLOYMENT.md
- Any client-facing materials

---

## ✅ Completion Checklist

- [ ] Domain added in Vercel
- [ ] DNS record added in Namecheap
- [ ] DNS propagation complete (check dnschecker.org)
- [ ] Vercel shows "Valid Configuration"
- [ ] Site loads at https://cocopops.unlikelypro.app
- [ ] SSL certificate active (🔒)
- [ ] Login button works
- [ ] OAuth redirects properly

---

## 🎉 Success!

Once all checks pass, your CoCo POps app will be live at:

**🌐 https://cocopops.unlikelypro.app**

Professional, branded, and ready for production use!

---

## Need Help?

If you encounter any issues:
1. Check the Troubleshooting section above
2. Verify DNS settings in Namecheap
3. Check Vercel domain status
4. Let me know and I can help debug!
