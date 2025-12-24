# ScienceVerse Demo Guide

## 🎬 What You'll See

### Home Screen (Video Feed)

```
┌─────────────────────────┐
│  🔬 ScienceVerse    🔔3 │  ← Header
├─────────────────────────┤
│                         │
│                         │
│      [VIDEO PLAYING]    │  ← Full-screen video
│                         │
│                     ┌─┐ │
│                     │4.7│ │  ← Scores (right side)
│                     │🔬│ │
│                     │❤️│ │
│                     │🌍│ │
│                     │💡│ │
│                     │👥│ │
│                     └─┘ │
│ ┌─────────────────────┐ │
│ │ Chemistry           │ │  ← Category badge
│ │ How to Make Volcano │ │  ← Title
│ │ Learn about acid... │ │  ← Description
│ │ 👤 Priya Sharma     │ │  ← Student name
│ │ 🏫 Govt High School │ │  ← School
│ │ #chemistry #volcano │ │  ← Tags
│ └─────────────────────┘ │
├─────────────────────────┤
│ 🏠  🔍  ➕  👤  ⚙️   │  ← Bottom Navigation
└─────────────────────────┘
```

### Interactions

**Swipe Up** → Next video (with smooth transition)
**Swipe Down** → Previous video
**Tap Video** → Play/Pause
**Tap Score Circle** → Open detailed evaluation modal

### Detailed Score Modal

```
┌─────────────────────────┐
│ How to Make Volcano  ✕  │
├─────────────────────────┤
│ Overall Score           │
│      ┌───────┐          │
│      │ 4.05  │          │  ← Weighted score
│      │ /5.00 │          │
│      └───────┘          │
│ • Judge (70%): 3 reviews│
│ • Teacher (20%): 8      │
│ • Student (10%): 34     │
├─────────────────────────┤
│ Evaluation Dimensions   │
│                         │
│ 🔬 Scientific Clarity   │
│ ★★★★☆ 4.2              │
│                         │
│ ❤️ Humanity & Care      │
│ ★★★★☆ 3.8              │
│                         │
│ 🌍 Real-Life Impact     │
│ ★★★★★ 4.0              │
│                         │
│ 💡 Original Thinking    │
│ ★★★☆☆ 3.5              │
├─────────────────────────┤
│ Evaluation Statistics   │
│  45      1,250    3.6%  │
│ Reviews  Views   Engage │
└─────────────────────────┘
```

## 🎮 How to Use

### Navigation

**Desktop:**
- `↑` Arrow Up = Previous video
- `↓` Arrow Down = Next video
- `Space` or Click = Play/Pause
- `M` = Mute/Unmute (future)

**Mobile:**
- Swipe Up = Next video
- Swipe Down = Previous video
- Single Tap = Play/Pause
- Long Press = Show controls (future)

**Touch Gestures:**
- Vertical swipe = Navigate videos
- Tap score button = View details
- Tap anywhere on video = Play/Pause
- Swipe left/right = Reserved for future (related videos)

### Video Controls

```
┌─────────────────────────┐
│                         │
│   ▶ (when paused)       │  ← Large play button
│                         │
├─────────────────────────┤
│ ████████───────  65%    │  ← Progress bar
└─────────────────────────┘
                          🔊  ← Volume button
```

### Bottom Navigation Tabs

1. **🏠 Home** (Active)
   - Video feed
   - Main experience

2. **🔍 Discover** (Phase 4)
   - Search videos
   - Filter by category
   - Leaderboards

3. **➕ Upload** (Phase 3)
   - Record video
   - Upload from gallery
   - Add metadata

4. **👤 Profile** (Phase 6)
   - User info
   - My videos
   - My evaluations

5. **⚙️ More** (Phase 5)
   - Settings
   - Admin panel
   - Help & Feedback

## 🎯 Test Cases

### Basic Functionality

**Test 1: Video Playback**
1. Load app
2. Video should auto-play
3. ✓ Video plays smoothly
4. ✓ Audio is audible

**Test 2: Navigation**
1. Swipe up (or press ↓)
2. Current video pauses
3. Next video starts playing
4. ✓ Smooth transition
5. ✓ Counter updates (1/5 → 2/5)

**Test 3: Play/Pause**
1. Tap video while playing
2. ✓ Video pauses
3. ✓ Play button appears
4. Tap again
5. ✓ Video resumes

**Test 4: Score Details**
1. Tap score circle (top right)
2. ✓ Modal opens with details
3. ✓ Shows 4 dimensions with stars
4. ✓ Shows weighted scoring breakdown
5. Tap outside or ✕
6. ✓ Modal closes

**Test 5: Volume Control**
1. Tap volume button (bottom right)
2. ✓ Video mutes (🔊 → 🔇)
3. Tap again
4. ✓ Video unmutes

### Responsive Design

**Test 6: Mobile Portrait**
- Resolution: 375x667 (iPhone SE)
- ✓ Full-screen video
- ✓ All controls visible
- ✓ Text readable
- ✓ Touch targets ≥ 44px

**Test 7: Mobile Landscape** (Not primary, but should work)
- Rotate device
- ✓ Video fills screen
- ✓ Controls accessible

**Test 8: Tablet**
- Resolution: 768x1024 (iPad)
- ✓ Centered content
- ✓ Larger touch targets
- ✓ Better typography

**Test 9: Desktop**
- Resolution: 1920x1080
- ✓ Max-width constraint
- ✓ Keyboard navigation works
- ✓ Mouse interactions smooth

### Performance

**Test 10: Low-End Device**
- Device: Android 8, 2GB RAM
- ✓ App loads < 3s
- ✓ Video plays without stuttering
- ✓ Swipe gestures responsive
- ✓ No lag in UI

**Test 11: Slow Network (3G)**
- Throttle to 3G in DevTools
- ✓ App shell loads quickly
- ✓ Video starts within 5s
- ✓ Loading indicator shows
- ✓ Preloading works

**Test 12: Offline Mode**
- Disable network
- ✓ Offline banner appears
- ✓ Last loaded video still works
- Note: Full offline support in Phase 7

### Edge Cases

**Test 13: First Video**
- Navigate to video #1
- Swipe down
- ✓ Stays on first video (no crash)
- ✓ Optional: Show "No previous video" toast

**Test 14: Last Video**
- Navigate to video #5
- Swipe up
- ✓ Stays on last video
- ✓ Optional: Loop back to first

**Test 15: Rapid Swiping**
- Swipe up rapidly 5 times
- ✓ No duplicate videos
- ✓ Correct video plays
- ✓ No state bugs

**Test 16: Background Tab**
- Play video
- Switch to another browser tab
- ✓ Video pauses
- Return to tab
- ✓ Video remains paused

## 📊 Expected Mock Data

### 5 Sample Videos

1. **How to Make a Volcano**
   - Category: Chemistry
   - Student: Priya Sharma, Chennai
   - Score: 4.05/5.00
   - 45 evaluations

2. **Solar Panel from Scratch**
   - Category: Physics
   - Student: Rahul Kumar, Madurai
   - Score: 4.62/5.00
   - 52 evaluations
   - **Highest rated**

3. **Water Purification System**
   - Category: Environment
   - Student: Anjali Devi, Trichy
   - Score: 4.58/5.00
   - 68 evaluations
   - **Most evaluated**

4. **Growing Plants in Space**
   - Category: Biology
   - Student: Arjun Patel, Coimbatore
   - Score: 4.32/5.00
   - 41 evaluations

5. **AI Crop Disease Detection**
   - Category: Technology
   - Student: Kavya Reddy, Salem
   - Score: 4.72/5.00
   - 78 evaluations
   - **Most innovative**

## 🎨 Visual Experience

### Animations

1. **Swipe Transition**
   - Duration: 300ms
   - Easing: ease-out
   - Transform: translateY()

2. **Play Button**
   - Fade in: 200ms
   - Scale on tap: 0.9
   - Bounce effect

3. **Modal Open**
   - Slide up from bottom
   - Background blur
   - Duration: 250ms

4. **Button Press**
   - Scale: 0.95
   - Duration: 100ms
   - Haptic feedback (future)

### Color Scheme

**Dark Theme** (Primary)
- Background: `#0f172a` (Dark Navy)
- Primary: `#6366f1` (Indigo)
- Secondary: `#8b5cf6` (Purple)
- Text: `#f1f5f9` (Off-White)
- Accent: `#fbbf24` (Gold for stars)

**Gradients**
- Score Circle: Indigo → Purple (135deg)
- Header: Dark Navy → Transparent
- Bottom Nav: Dark Navy with blur

### Typography

- **Headings:** 18-24px, Bold (700)
- **Body:** 14-16px, Regular (400)
- **Labels:** 12-13px, Medium (500)
- **Numbers:** Tabular numerals for scores

## 🚀 Performance Expectations

### Metrics

| Metric | Target | Current |
|--------|--------|---------|
| First Paint | < 1s | ~0.8s |
| Video Start | < 3s | ~2s |
| Swipe Response | < 100ms | ~50ms |
| FPS | 60 | 60 |
| Bundle Size | < 300KB | ~250KB |

### Network Performance

**3G Network (750 Kbps)**
- App load: ~2-3s
- Video buffering: ~3-5s
- ✓ Acceptable for rural India

**4G Network**
- App load: < 1s
- Video buffering: < 2s
- ✓ Smooth experience

## 🎓 Educational Value

### How It Helps Students

1. **Engaging Format**
   - Familiar UX (like TikTok)
   - Short, digestible content
   - Visual learning

2. **Fair Evaluation**
   - Multiple dimensions
   - Transparent scoring
   - Weighted by expertise

3. **Inspiration**
   - See peers' projects
   - Learn from examples
   - Build confidence

4. **Competition**
   - Healthy competition
   - School vs school
   - District-level recognition

## 🔮 What's Coming Next

### Phase 2: Evaluation System
Users will be able to:
- Rate videos on 4 dimensions
- See who evaluated (transparency)
- Submit comments
- View evaluation history

### Phase 3: Upload Flow
Students will be able to:
- Record videos in-app
- Upload from gallery
- Add title, description, tags
- Track upload progress

### Phase 4: Discovery
Everyone will be able to:
- Search by keyword
- Filter by category/school
- View leaderboards
- See trending videos

Ready to test? Run `npm start` and explore!

---

**Enjoy exploring ScienceVerse!** 🔬🚀
