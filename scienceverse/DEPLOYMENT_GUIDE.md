# Deployment Guide - ScienceVerse

This guide provides step-by-step instructions for deploying the ScienceVerse platform to production.

## Prerequisites

- Node.js 16+ and npm installed
- Firebase CLI installed (`npm install -g firebase-tools`)
- Firebase project created (see FIREBASE_SETUP_GUIDE.md)
- Git installed

---

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Environment Setup](#environment-setup)
3. [Building for Production](#building-for-production)
4. [Firebase Deployment](#firebase-deployment)
5. [Post-Deployment Verification](#post-deployment-verification)
6. [Rollback Procedure](#rollback-procedure)
7. [Monitoring](#monitoring)

---

## Pre-Deployment Checklist

### Code Quality
- [ ] All tests pass: `npm test`
- [ ] No console errors in browser
- [ ] Code linting passed: `npm run lint`
- [ ] Build succeeds: `npm run build`

### Firebase Setup
- [ ] Firebase project created
- [ ] Firestore database created
- [ ] Storage bucket created
- [ ] Authentication enabled
- [ ] Cloud Functions deployed
- [ ] Security rules deployed

### Configuration
- [ ] `.env` file configured with production values
- [ ] Firebase config added to `src/config/firebase.js`
- [ ] Service worker configured for PWA
- [ ] Manifest.json updated with production URLs

### Security
- [ ] Environment variables not committed to Git
- [ ] API keys restricted to production domains
- [ ] Firestore security rules reviewed
- [ ] Storage security rules reviewed
- [ ] CORS configured correctly

---

## Environment Setup

### Step 1: Clone Repository

```bash
git clone https://github.com/your-org/scienceverse.git
cd scienceverse
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Configure Environment

Create `.env` file:

```bash
# Firebase Configuration
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=scienceverse-competition.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=scienceverse-competition
REACT_APP_FIREBASE_STORAGE_BUCKET=scienceverse-competition.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id

# App Configuration
REACT_APP_ENV=production
REACT_APP_VERSION=1.0.0
REACT_APP_API_URL=https://scienceverse-competition.web.app
```

### Step 4: Initialize Firebase

```bash
firebase login
firebase use scienceverse-competition
```

---

## Building for Production

### Step 1: Run Production Build

```bash
npm run build
```

This creates an optimized production build in the `build/` folder.

### Step 2: Test Build Locally

```bash
# Serve build folder locally
npx serve -s build

# Or use Firebase hosting emulator
firebase serve --only hosting
```

Open http://localhost:5000 and verify:
- App loads without errors
- All features work correctly
- No console warnings
- Service worker registers
- Offline mode works

### Step 3: Optimize Build (Optional)

```bash
# Analyze bundle size
npm install --save-dev webpack-bundle-analyzer
npm run build -- --stats

# View bundle analysis
npx webpack-bundle-analyzer build/bundle-stats.json
```

Target metrics:
- First Contentful Paint (FCP): < 1.8s
- Time to Interactive (TTI): < 3.8s
- Cumulative Layout Shift (CLS): < 0.1
- Bundle size: < 500KB (gzipped)

---

## Firebase Deployment

### Option 1: Deploy Everything (Recommended for first deployment)

```bash
firebase deploy
```

This deploys:
- Hosting (web app)
- Firestore rules & indexes
- Storage rules
- Cloud Functions

### Option 2: Deploy Specific Services

**Deploy only Hosting:**
```bash
firebase deploy --only hosting
```

**Deploy only Functions:**
```bash
cd functions
npm install
cd ..
firebase deploy --only functions
```

**Deploy only Firestore rules:**
```bash
firebase deploy --only firestore:rules
```

**Deploy only Storage rules:**
```bash
firebase deploy --only storage
```

### Deployment Output Example

```
=== Deploying to 'scienceverse-competition'...

i  deploying firestore, storage, functions, hosting
i  firestore: checking firestore.rules for compilation errors...
✔  firestore: rules file firestore.rules compiled successfully
i  storage: checking storage.rules for compilation errors...
✔  storage: rules file storage.rules compiled successfully
i  functions: ensuring required API cloudfunctions.googleapis.com is enabled...
✔  functions: required API cloudfunctions.googleapis.com is enabled
i  functions: preparing functions directory for uploading...
i  functions: packaged functions (45.2 KB) for uploading
✔  functions: functions folder uploaded successfully
i  hosting[scienceverse-competition]: beginning deploy...
i  hosting[scienceverse-competition]: found 15 files in build
✔  hosting[scienceverse-competition]: file upload complete
i  hosting[scienceverse-competition]: finalizing version...
✔  hosting[scienceverse-competition]: version finalized
i  hosting[scienceverse-competition]: releasing new version...
✔  hosting[scienceverse-competition]: release complete

✔  Deploy complete!

Project Console: https://console.firebase.google.com/project/scienceverse-competition/overview
Hosting URL: https://scienceverse-competition.web.app
```

---

## Post-Deployment Verification

### Step 1: Verify Deployment

Visit your production URL: `https://scienceverse-competition.web.app`

### Step 2: Functional Testing

Test all critical user flows:

**Authentication:**
- [ ] Login as Student with School ID
- [ ] Login as Teacher with email
- [ ] Login as Judge with email
- [ ] Login as Admin with email
- [ ] Logout works correctly
- [ ] Session persists on refresh

**Video Upload:**
- [ ] Camera recording works
- [ ] File upload works
- [ ] Video metadata form validates correctly
- [ ] Upload progress shows
- [ ] Video appears in feed after upload
- [ ] Thumbnail generates automatically

**Video Feed:**
- [ ] Videos load correctly
- [ ] Swipe navigation works
- [ ] Auto-play works
- [ ] Video info displays
- [ ] Scores display correctly

**Evaluation:**
- [ ] Evaluation panel opens
- [ ] Star ratings work
- [ ] Comment submission works
- [ ] Evaluation appears in history
- [ ] Weighted score calculates correctly

**Discovery:**
- [ ] Search works
- [ ] Filters work (category, school, rating)
- [ ] Sorting works
- [ ] Leaderboards display correctly

**Admin Panel (admin role only):**
- [ ] Dashboard loads
- [ ] Analytics display correctly
- [ ] Competition settings can be updated
- [ ] Categories can be managed
- [ ] Data export works

**Profile:**
- [ ] Profile screen opens
- [ ] User info displays correctly
- [ ] Statistics show accurately
- [ ] Logout works

### Step 3: Performance Testing

Use Chrome DevTools Lighthouse:

```bash
# Run Lighthouse audit
lighthouse https://scienceverse-competition.web.app --view
```

Target scores:
- Performance: > 90
- Accessibility: > 95
- Best Practices: > 95
- SEO: > 90
- PWA: 100

### Step 4: Mobile Testing

Test on real devices:
- Android 10+ (various screen sizes)
- Low-end devices (2GB RAM, slow CPU)
- 2G/3G network conditions

Use Chrome DevTools Device Mode:
- Enable "Slow 3G" throttling
- Test various screen sizes
- Verify touch interactions

### Step 5: Monitor Logs

```bash
# View hosting logs
firebase hosting:logs

# View function logs
firebase functions:log

# View Firestore operations (in Firebase Console)
```

---

## Rollback Procedure

### Option 1: Rollback via Firebase Console

1. Go to Firebase Console → Hosting
2. Click on "Release history"
3. Find previous working version
4. Click "⋮" menu → "Rollback"

### Option 2: Rollback via CLI

```bash
# List previous deployments
firebase hosting:channel:list

# Deploy previous version
firebase hosting:clone source-site-id:source-channel-id destination-site-id:destination-channel-id
```

### Option 3: Redeploy Previous Version

```bash
# Checkout previous git commit
git log --oneline
git checkout <commit-hash>

# Rebuild and deploy
npm run build
firebase deploy --only hosting
```

---

## Continuous Deployment (Optional)

### GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Firebase

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '16'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Build
        run: npm run build
        env:
          REACT_APP_FIREBASE_API_KEY: ${{ secrets.FIREBASE_API_KEY }}
          REACT_APP_FIREBASE_AUTH_DOMAIN: ${{ secrets.FIREBASE_AUTH_DOMAIN }}
          REACT_APP_FIREBASE_PROJECT_ID: ${{ secrets.FIREBASE_PROJECT_ID }}
          REACT_APP_FIREBASE_STORAGE_BUCKET: ${{ secrets.FIREBASE_STORAGE_BUCKET }}
          REACT_APP_FIREBASE_MESSAGING_SENDER_ID: ${{ secrets.FIREBASE_MESSAGING_SENDER_ID }}
          REACT_APP_FIREBASE_APP_ID: ${{ secrets.FIREBASE_APP_ID }}

      - name: Deploy to Firebase
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          channelId: live
          projectId: scienceverse-competition
```

### Add GitHub Secrets

In GitHub repository → Settings → Secrets:
- `FIREBASE_API_KEY`
- `FIREBASE_AUTH_DOMAIN`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_STORAGE_BUCKET`
- `FIREBASE_MESSAGING_SENDER_ID`
- `FIREBASE_APP_ID`
- `FIREBASE_SERVICE_ACCOUNT` (download from Firebase Console → Project Settings → Service Accounts)

---

## Monitoring

### Firebase Performance Monitoring

Add to `src/index.js`:

```javascript
import { getPerformance } from 'firebase/performance';
import app from './config/firebase';

const perf = getPerformance(app);
```

### Error Tracking

Add to `src/index.js`:

```javascript
window.onerror = (message, source, lineno, colno, error) => {
  console.error('Global error:', { message, source, lineno, colno, error });

  // Log to Firebase (or other error tracking service)
  logErrorToFirebase({
    message,
    source,
    lineno,
    colno,
    stack: error?.stack,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent
  });
};
```

### Analytics Dashboard

Monitor in Firebase Console:
- **Performance:** Response times, network requests
- **Hosting:** Traffic, bandwidth usage
- **Functions:** Invocations, errors, execution time
- **Firestore:** Reads, writes, deletes
- **Storage:** Uploads, downloads, storage used

### Alerts

Set up alerts in Firebase Console:
- Function error rate > 5%
- Function execution time > 10s
- Storage bandwidth > 1TB/day
- Firestore reads > 1M/day

---

## Maintenance

### Regular Tasks

**Daily:**
- Monitor error logs
- Check function execution times
- Review user feedback

**Weekly:**
- Review performance metrics
- Check storage usage
- Update dependencies (security patches)

**Monthly:**
- Full security audit
- Performance optimization
- Backup Firestore data
- Review and optimize Cloud Functions

### Backup Strategy

**Firestore Backup:**
```bash
# Export Firestore data
gcloud firestore export gs://scienceverse-competition-backups/$(date +%Y%m%d)
```

**Storage Backup:**
```bash
# Copy Storage bucket
gsutil -m cp -r gs://scienceverse-competition.appspot.com gs://scienceverse-competition-backups/storage/$(date +%Y%m%d)
```

**Automated Backups:**

Create Cloud Scheduler job in Firebase Console:
- Frequency: Daily at 2 AM
- Target: Cloud Function `exportFirestoreData`
- Retention: 30 days

---

## Scaling Considerations

### For 20,000 concurrent users:

**Firestore:**
- Use composite indexes for complex queries
- Implement pagination (20-50 items per page)
- Cache frequently accessed data client-side
- Use Firestore offline persistence

**Storage:**
- Enable CDN caching for videos
- Use adaptive bitrate streaming (HLS/DASH)
- Implement lazy loading for thumbnails
- Compress videos before upload

**Functions:**
- Increase function memory (1GB → 2GB)
- Use function concurrency controls
- Implement exponential backoff for retries
- Monitor cold start times

**Hosting:**
- Enable Firebase CDN (automatic)
- Implement service worker caching
- Use code splitting for faster loads
- Optimize images and assets

---

## Troubleshooting

### Deployment Fails

**Error: "Permission denied"**
```bash
# Re-authenticate
firebase login --reauth

# Check project
firebase use --add
```

**Error: "Build fails"**
```bash
# Clear cache
rm -rf node_modules
rm package-lock.json
npm install
npm run build
```

**Error: "Functions deployment timeout"**
```bash
# Deploy functions individually
firebase deploy --only functions:functionName

# Increase timeout in firebase.json
{
  "functions": {
    "source": "functions",
    "timeout": "540s"
  }
}
```

### App Not Loading

1. Check Firebase Console → Hosting → Deployment status
2. Verify DNS settings (if using custom domain)
3. Clear browser cache (Ctrl+Shift+R)
4. Check browser console for errors
5. Verify Firebase config in `.env`

### Functions Not Triggering

1. Check function logs: `firebase functions:log`
2. Verify Firestore triggers match collection names
3. Check security rules allow operations
4. Ensure indexes are deployed

---

## Support

For deployment issues:
- Firebase Support: https://firebase.google.com/support
- Stack Overflow: Tag `firebase` + `react`
- GitHub Issues: https://github.com/your-org/scienceverse/issues

---

**Last Updated:** 2024-01-15
**Version:** 1.0
