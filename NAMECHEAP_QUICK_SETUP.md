# Quick Setup: Add DNS Record in Namecheap

## ✅ Vercel Domain Added Successfully!

Domain `cocopops.unlikelypro.app` has been added to your Vercel project.

---

## 🎯 Next Step: Add CNAME Record in Namecheap

### The Exact Record to Add

```
┌─────────────────────────────────────────────────────┐
│  Type:    CNAME Record                              │
│  Host:    cocopops                                  │
│  Value:   cname.vercel-dns.com                      │
│  TTL:     Automatic (or 300)                        │
└─────────────────────────────────────────────────────┘
```

---

## 📝 Step-by-Step Instructions

### 1. Go to Namecheap
- URL: https://ap.www.namecheap.com
- Log in to your account

### 2. Navigate to Domain
- Click **"Domain List"**
- Find **unlikelypro.app**
- Click **"Manage"**

### 3. Access DNS Settings
- Click the **"Advanced DNS"** tab
- You'll see your current DNS records

### 4. Add New Record
- Click **"ADD NEW RECORD"** button
- Fill in these fields:

**Type:** Select `CNAME Record` from dropdown

**Host:** Enter `cocopops`
- ⚠️ Just "cocopops" - NOT the full domain
- ❌ Wrong: cocopops.unlikelypro.app
- ✅ Correct: cocopops

**Value:** Enter `cname.vercel-dns.com`
- ⚠️ Copy exactly as shown
- This is Vercel's standard CNAME target

**TTL:** Select `Automatic`
- Or choose `300` for faster propagation

### 5. Save Changes
- Click the **green checkmark (✓)** to save the record
- Click **"Save All Changes"** button at the top/bottom
- You should see a success message

---

## ⏱️ What Happens Next?

### DNS Propagation (5-30 minutes)
1. Namecheap publishes your DNS record
2. DNS propagates across the internet
3. Vercel detects the correct DNS configuration
4. Vercel automatically issues SSL certificate
5. Your site goes live!

### Check Progress

**Option 1: DNSChecker.org**
- Go to: https://dnschecker.org
- Enter: `cocopops.unlikelypro.app`
- Select: CNAME
- Click Search
- Green checkmarks = propagated!

**Option 2: Vercel Dashboard**
- Go to: https://vercel.com/dustins-projects-d4c633f6/inspection-tracker-recovery/settings/domains
- Look for `cocopops.unlikelypro.app`
- Status will change from "Pending" to "Valid" to "Ready"

**Option 3: Command Line**
```bash
dig cocopops.unlikelypro.app CNAME
```

---

## ✅ Success Indicators

You'll know it's working when:

1. **DNSChecker shows green checkmarks** ✓
2. **Vercel status shows "Ready"** 🔒
3. **Site loads at https://cocopops.unlikelypro.app** 🌐
4. **SSL certificate is active** (padlock icon 🔒)

---

## 🔧 Troubleshooting

### "Invalid Configuration" in Vercel?
- Double-check Host field is just `cocopops`
- Verify Value is `cname.vercel-dns.com`
- Make sure you clicked "Save All Changes"
- Wait 10-15 minutes for DNS propagation

### DNS Not Propagating?
- Verify the record was saved in Namecheap
- Check for typos in Host or Value
- Try changing TTL to `300` (5 minutes)
- Wait longer - can take up to 30 minutes

### Site Not Loading?
- Check DNS propagation status
- Verify Vercel shows "Ready" status
- Try clearing browser cache
- Try incognito/private browsing mode

---

## 📞 Need Help?

If you get stuck:
1. Take a screenshot of your Namecheap DNS records
2. Check the Vercel domain status
3. Let me know and I'll help troubleshoot!

---

## 🎉 Final Result

Once complete, your CoCo POps app will be live at:

**https://cocopops.unlikelypro.app**

With:
- ✅ Custom branded domain
- ✅ Free SSL certificate (automatic)
- ✅ Fast global CDN
- ✅ OAuth working perfectly
- ✅ Professional production URL

---

**Ready? Go add that CNAME record in Namecheap!** 🚀
