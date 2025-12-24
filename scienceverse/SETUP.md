# ScienceVerse Setup Guide

## 🚀 Getting Started

### Step 1: Install Dependencies

```bash
cd scienceapp
npm install
```

This will install:
- React 18
- react-swipeable (for touch gestures)
- react-scripts (build tooling)

### Step 2: Start Development Server

```bash
npm start
```

The app will automatically open in your browser at `http://localhost:3000`

### Step 3: Test the Application

**Desktop Testing:**
1. Use arrow keys (↑↓) to navigate between videos
2. Click on the video to play/pause
3. Click on the score circle (right side) to view detailed evaluation breakdown
4. Test responsive design by resizing browser window

**Mobile Testing:**
1. Open `http://YOUR_IP:3000` on your mobile device (same network)
   - Find your IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
2. Swipe up/down to navigate videos
3. Tap video to play/pause
4. Tap score circle for detailed scores
5. Test with Chrome DevTools mobile emulation

**Testing Features:**
- ✅ Vertical swipe navigation
- ✅ Auto-play on view
- ✅ Video controls (play/pause, volume)
- ✅ Scientific evaluation display (4 dimensions)
- ✅ Video metadata (title, description, student info)
- ✅ Bottom navigation
- ✅ Detailed score modal

## 📁 Project Structure

```
scienceapp/
├── public/
│   ├── index.html          # Main HTML file
│   ├── manifest.json       # PWA manifest
│   └── service-worker.js   # Offline caching (basic)
├── src/
│   ├── components/         # React components
│   │   ├── VideoPlayer.js       # Individual video player
│   │   ├── VideoPlayer.css
│   │   ├── VideoFeed.js         # Swipeable container
│   │   ├── VideoFeed.css
│   │   ├── Navigation.js        # Bottom nav bar
│   │   ├── Navigation.css
│   │   ├── VideoInfo.js         # Video details modal
│   │   ├── VideoInfo.css
│   │   ├── ScoreDisplay.js      # Evaluation breakdown
│   │   └── ScoreDisplay.css
│   ├── data/
│   │   └── mockVideos.js        # Sample video data
│   ├── App.js              # Main app component
│   ├── App.css             # Main styles
│   ├── index.js            # Entry point
│   └── index.css           # Global styles
├── package.json            # Dependencies
├── README.md               # Main documentation
├── SETUP.md               # This file
└── .gitignore             # Git ignore rules
```

## 🎨 Customization

### Adding More Mock Videos

Edit `src/data/mockVideos.js`:

```javascript
export const mockVideos = [
  {
    videoId: "vid001",
    title: "Your Video Title",
    description: "Description here...",
    uploaderId: "student001",
    uploaderName: "Student Name",
    uploaderSchool: "TN-CHN-GOVT-001",
    schoolName: "Government High School, Chennai",
    district: "Chennai",
    category: "Physics", // Physics, Chemistry, Biology, Environment, Technology
    tags: ["experiment", "science"],
    duration: 180, // seconds
    fileUrl: "URL_TO_VIDEO.mp4",
    thumbnailUrl: "URL_TO_THUMBNAIL.jpg",
    uploadedAt: new Date("2024-01-15"),
    status: "approved",
    totalEvaluations: 45,
    judgeEvaluations: 3,
    teacherEvaluations: 8,
    studentEvaluations: 34,
    scientificClarity: 4.2,  // 0-5 scale
    humanityCare: 3.8,
    realLifeImpact: 4.0,
    originalThinking: 3.5,
    aggregateScore: 4.05,    // Weighted average
    views: 1250,
    hasVoiceover: true
  },
  // Add more videos...
];
```

### Changing Colors

Edit `src/App.css` and component CSS files:

```css
/* Primary color */
--primary: #6366f1;

/* Secondary color */
--secondary: #8b5cf6;

/* Background */
--background: #0f172a;
```

### Modifying Navigation

Edit `src/components/Navigation.js`:

```javascript
const tabs = [
  { id: 'home', label: 'Home', icon: '🏠' },
  { id: 'discover', label: 'Discover', icon: '🔍' },
  // Add/remove tabs...
];
```

## 🏗️ Building for Production

### Create Production Build

```bash
npm run build
```

This creates an optimized build in the `build/` folder:
- Minified JavaScript
- Optimized CSS
- Compressed assets
- Service worker for caching

### Test Production Build Locally

```bash
# Install serve globally
npm install -g serve

# Serve the build folder
serve -s build
```

Open `http://localhost:3000` to test the production build.

### Deploy to Hosting

**Option 1: Firebase Hosting** (Recommended for Phase 7)
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize hosting
firebase init hosting

# Deploy
firebase deploy
```

**Option 2: Netlify**
1. Connect GitHub repo to Netlify
2. Build command: `npm run build`
3. Publish directory: `build`
4. Deploy automatically on push

**Option 3: Vercel**
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel
```

## 🔧 Troubleshooting

### Videos Not Playing

**Issue:** Videos don't autoplay on mobile
**Solution:** This is browser security. User must interact with page first. The app handles this by showing a play button.

**Issue:** CORS errors loading videos
**Solution:** Videos must be served from same origin or with proper CORS headers. In production, use Firebase Storage with correct CORS configuration.

### Performance Issues

**Issue:** Laggy scrolling/swiping
**Solution:**
- Reduce video quality
- Decrease preload count in `VideoFeed.js`
- Enable hardware acceleration in browser

**Issue:** Videos taking long to load
**Solution:**
- Compress videos to 720p max
- Use adaptive bitrate streaming (Phase 7)
- Implement progressive loading

### Installation Errors

**Issue:** `npm install` fails
**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

**Issue:** Port 3000 already in use
**Solution:**
```bash
# Use different port
PORT=3001 npm start
```

## 📱 Mobile Testing Tips

### Android Testing

1. **Enable USB Debugging:**
   - Settings → About Phone → Tap "Build Number" 7 times
   - Settings → Developer Options → Enable USB Debugging

2. **Chrome Remote Debugging:**
   - Connect phone via USB
   - Chrome → `chrome://inspect`
   - Click "Inspect" on your device

3. **Test on Network:**
   - Start app: `npm start`
   - Find your IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
   - On phone: Open `http://YOUR_IP:3000`

### iOS Testing

1. **Safari Web Inspector:**
   - iPhone: Settings → Safari → Advanced → Web Inspector
   - Mac: Safari → Develop → [Your iPhone]

2. **Test on Network:**
   - Same as Android method above
   - Works on Safari and Chrome on iOS

## 🎯 Performance Optimization

### Current Optimizations

- ✅ Lazy loading components
- ✅ Video preloading (2 ahead)
- ✅ GPU-accelerated animations
- ✅ Debounced swipe handlers
- ✅ Optimized re-renders
- ✅ CSS containment

### Additional Optimizations (Phase 7)

- Code splitting with React.lazy()
- Image optimization with WebP
- CDN for video delivery
- Service Worker caching strategy
- IndexedDB for offline data

## 🔐 Security Notes

### Current Implementation

- No authentication (Phase 1)
- No data validation (Phase 1)
- Public mock data only

### Future Security (Phase 6+)

- Firebase Authentication
- Firestore security rules
- Content moderation
- Rate limiting
- Input sanitization

## 📊 Monitoring Performance

### Chrome DevTools

1. Open DevTools (F12)
2. Performance tab → Record
3. Perform actions (swipe, play video)
4. Stop recording
5. Analyze:
   - FPS (should be 60)
   - Main thread activity
   - Network requests

### Lighthouse Audit

1. Chrome DevTools → Lighthouse tab
2. Select "Performance" and "PWA"
3. Generate report
4. Target scores:
   - Performance: 90+
   - PWA: 100
   - Accessibility: 90+

## 🚀 Next Steps

After completing Phase 1 testing:

1. **Phase 2:** Add interactive evaluation system
   - Rating UI for 4 dimensions
   - Submit evaluation logic
   - Real-time score updates

2. **Phase 3:** Implement video upload
   - File picker component
   - Camera recording
   - Metadata form
   - Upload progress

3. **Phase 4:** Build discovery features
   - Search functionality
   - Category filters
   - Leaderboards
   - Trending algorithm

Ready to continue? Proceed to Phase 2 implementation!

## 📞 Support

For technical issues:
1. Check this guide first
2. Review component JSDoc comments
3. Check browser console for errors
4. Test in different browsers

---

**Happy Coding!** 🔬✨
