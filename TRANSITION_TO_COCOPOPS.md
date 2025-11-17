# Transition Plan: "Inspection Tracker" → "CoCo POps"

**Date**: November 16, 2025  
**Status**: In Progress

## Overview

This document outlines the complete transition from "Inspection Tracker" to "CoCo POps" across all configurations, documentation, and integrations.

---

## ✅ Completed Changes

### 1. Frontend Display
- ✅ Landing page title updated
- ✅ Page title (browser tab) updated via VITE_APP_TITLE
- ✅ Logo deployed (Unlikely Professionals)
- ✅ Button text updated to "Login"

### 2. Environment Variables
- ✅ Local `.env`: `VITE_APP_TITLE=CoCo POps`
- ✅ Vercel Production: `VITE_APP_TITLE=CoCo POps`

---

## 🔄 Remaining Changes

### 3. Package Configuration

**File**: `package.json`
```json
Current: "name": "inspection-tracker"
Update to: "name": "cocopops"
```

**Impact**: Package identifier, npm scripts  
**Priority**: Medium

---

### 4. PWA Manifest

**File**: `client/public/manifest.json`
```json
Current: "name": "Inspection Tracker - Field Tech"
Update to: "name": "CoCo POps - Field Tech"
```

**Impact**: Progressive Web App name when installed on mobile devices  
**Priority**: High

---

### 5. HTML Meta Tags

**File**: `client/index.html`
```html
Current: <meta name="apple-mobile-web-app-title" content="Inspection Tracker" />
Update to: <meta name="apple-mobile-web-app-title" content="CoCo POps" />
```

**Impact**: iOS home screen app name  
**Priority**: High

---

### 6. Documentation Files

**Files to Update**:
- `README.md` - Main project description
- `ROLES.md` - User roles documentation
- `WORKFLOWS.md` - Status workflows documentation
- `todo.md` - Project TODO list
- `DEPLOYMENT.md` - Deployment guide
- `SETUP_GUIDE.md` - Setup instructions
- `RECOVERY_SUMMARY.md` - Recovery documentation
- `SETUP_COMPLETE.md` - Setup completion notes
- `DEPLOYMENT_SUCCESS.md` - Deployment success documentation

**Search & Replace**:
```
Find: "Inspection Tracker"
Replace: "CoCo POps"
```

**Impact**: Documentation consistency  
**Priority**: Low (doesn't affect functionality)

---

### 7. OAuth Portal Configuration

**Current Configuration**:
- App ID: `inspection-tracker`
- OAuth Portal: `https://oauth.manus.im`

**Options**:

#### Option A: Keep Current App ID (Recommended)
- ✅ No changes needed to OAuth portal
- ✅ No risk of breaking authentication
- ✅ App ID is internal identifier, not user-facing
- ✅ All user-facing text already says "CoCo POps"

#### Option B: Update App ID
- ⚠️ Requires OAuth portal admin access
- ⚠️ Need to register new app: `cocopops`
- ⚠️ Update `.env`: `VITE_APP_ID=cocopops`
- ⚠️ Update Vercel env vars
- ⚠️ Potential authentication disruption during transition

**Recommendation**: **Keep `inspection-tracker` as the App ID**. It's an internal identifier and doesn't affect user experience. All user-facing branding is already "CoCo POps".

---

### 8. Vercel Project Name

**Current**: `inspection-tracker-recovery`  
**Production URL**: `https://inspection-tracker-recovery.vercel.app`

**Options**:

#### Option A: Keep Current (Recommended)
- ✅ No downtime
- ✅ URL still works
- ✅ Can add custom domain later

#### Option B: Rename Project
- ⚠️ May require redeployment
- ⚠️ URL will change
- ⚠️ Need to update DNS if custom domain

#### Option C: Add Custom Domain (Best Long-term)
- ✅ Professional: `cocopops.com` or `unlikelypro.app`
- ✅ Keep Vercel project name as-is
- ✅ No breaking changes

**Recommendation**: **Add a custom domain** rather than renaming the Vercel project.

---

## 🎯 Recommended Action Plan

### Phase 1: Critical User-Facing Updates (Do Now)
1. ✅ Update PWA manifest name
2. ✅ Update HTML meta tags
3. ✅ Update package.json name

### Phase 2: Documentation Updates (Optional)
4. Update all markdown documentation files
5. Update comments in code

### Phase 3: Infrastructure (Future)
6. Consider custom domain: `cocopops.unlikelypro.app` or similar
7. Keep OAuth App ID as `inspection-tracker` (internal only)

---

## Implementation Commands

### Update PWA Manifest
```bash
# Edit client/public/manifest.json
sed -i 's/Inspection Tracker/CoCo POps/g' client/public/manifest.json
```

### Update HTML Meta Tags
```bash
# Edit client/index.html
sed -i 's/Inspection Tracker/CoCo POps/g' client/index.html
```

### Update Package Name
```bash
# Edit package.json
sed -i 's/"name": "inspection-tracker"/"name": "cocopops"/g' package.json
```

### Update All Documentation
```bash
# Update all markdown files
find . -name "*.md" -not -path "./node_modules/*" -not -path "./.git/*" -exec sed -i 's/Inspection Tracker/CoCo POps/g' {} +
```

---

## Testing Checklist

After updates:
- [ ] PWA install shows "CoCo POps"
- [ ] iOS home screen shows "CoCo POps"
- [ ] Browser tab title shows "CoCo POps"
- [ ] OAuth login still works
- [ ] All documentation references updated
- [ ] No broken links or references

---

## Notes

- **OAuth App ID**: Keeping as `inspection-tracker` is fine - it's internal
- **Vercel Project**: Can keep current name, add custom domain later
- **Database**: No changes needed
- **GitHub Repo**: Can rename to `unlikelypro.app` or `cocopops` if desired

---

## Questions?

- Do you want to update the OAuth App ID? (Not recommended)
- Do you want a custom domain? (Recommended for production)
- Should we rename the GitHub repository?

---

**Next Step**: Run Phase 1 updates to complete the critical user-facing rebranding.
