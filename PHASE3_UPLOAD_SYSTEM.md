# Phase 3: Video Upload Flow

## ✅ Completed Features

### 1. **Upload Screen with Two Methods**
- **Record Video**: Use device camera to record live
- **Upload Video**: Select existing video from device
- Modal interface with step-by-step flow
- Competition settings integration (max duration, file size)

### 2. **Video Recorder**
- Real-time camera preview
- Recording controls (Start, Pause, Resume, Stop)
- Live timer with color-coded warnings
- Progress bar showing duration
- Maximum duration enforcement (auto-stop)
- Recording preview before submission
- Retry option if not satisfied

### 3. **File Uploader**
- Drag-and-drop interface
- File picker button
- Format validation (MP4, WebM, MOV)
- File size validation (max 50MB)
- Visual feedback on drag
- Supported formats display

### 4. **Metadata Form**
- Video preview thumbnail
- Required fields:
  - Title (10-100 characters)
  - Description (50-500 characters)
  - Category (10 science categories)
- Optional field:
  - Tags (up to 5, comma-separated)
- Real-time character counters
- Form validation with error messages
- Uploader info display (name, school, class, district)

### 5. **Upload Progress**
- Animated progress bar
- Percentage display
- Multi-step progress indicator:
  1. Uploading
  2. Validating
  3. Processing
  4. Complete
- File name display
- Warning not to close window

### 6. **Success Confirmation**
- Animated success icon
- Confirmation message
- Auto-close after 3 seconds
- Processing status notification

## 📁 Files Created

```
src/components/
├── UploadScreen.js/css        # Main upload interface
├── VideoRecorder.js/css       # Camera recording
├── VideoUploader.js/css       # File picker & drag-drop
├── UploadForm.js/css          # Metadata form
└── UploadProgress.js/css      # Progress indicator
```

## 🎮 How to Use

### Testing the Upload Flow

1. **Open Upload Screen:**
   - Click the ➕ Upload tab in bottom navigation
   - Upload screen opens as full-screen modal

2. **Choose Upload Method:**
   - **Option A: Record Video**
     - Click "Record Video" card
     - Allow camera permission
     - Click "Start Recording"
     - Record your experiment (max 5 minutes)
     - Click "Stop" when done
     - Preview your recording
     - Click "Use This Recording" or "Record Again"

   - **Option B: Upload Video**
     - Click "Upload Video" card
     - Drag-and-drop video or click to browse
     - Select video file (MP4, WebM, or MOV)
     - File validates automatically

3. **Fill Metadata Form:**
   - Preview shows selected video
   - Enter **Title** (required, 10-100 chars)
   - Enter **Description** (required, 50-500 chars)
   - Select **Category** (required)
   - Add **Tags** (optional, comma-separated)
   - Review your details (name, school, class)
   - Click "Upload Video"

4. **Upload Progress:**
   - Watch upload progress (0-100%)
   - See processing steps
   - Wait for completion

5. **Success:**
   - See success confirmation
   - Modal auto-closes after 3 seconds

## 🎨 UI/UX Highlights

### Upload Choice Screen
- **Two Large Cards**: Record vs Upload
- **Clear Icons**: 📹 for camera, 📁 for file
- **Badges**: Show max duration/size
- **Requirements List**: Easy-to-read checklist

### Video Recorder
- **Full-Screen Preview**: See yourself while recording
- **Live Timer**: Shows time with color coding
  - Green: 0-70%
  - Orange: 70-90%
  - Red: 90-100%
- **Recording Indicator**: Red "REC" dot with pulse animation
- **Progress Bar**: Visual duration indicator
- **Controls**: Large, touch-friendly buttons
- **Tips**: Helpful recording advice before starting

### File Uploader
- **Drag-and-Drop Zone**: Hover effect on drag
- **Visual Feedback**: Border changes when dragging
- **Format Badges**: Show supported formats
- **Info Panel**: Display requirements

### Metadata Form
- **Video Preview**: See your video while filling form
- **Real-Time Validation**: Errors show as you type
- **Character Counters**: Track limits for title/description
- **Uploader Card**: Shows your submission details
- **Two-Column Info Grid**: Clean layout for details

### Upload Progress
- **Animated Progress Bar**: Smooth gradient fill with shimmer effect
- **Large Percentage**: Easy to see progress
- **Step Indicators**: 4 steps with icons
- **Warning Message**: Don't close window
- **Bounce Animation**: Icon bounces while uploading

## 🔧 Technical Implementation

### State Management

```javascript
const [uploadStep, setUploadStep] = useState('choose');
// Steps: choose → record/upload → form → uploading → complete

const [selectedVideo, setSelectedVideo] = useState(null);
const [videoFile, setVideoFile] = useState(null);
const [uploadProgress, setUploadProgress] = useState(0);
```

### Video Recording

```javascript
// Use MediaRecorder API
const stream = await navigator.mediaDevices.getUserMedia({
  video: { width: 1280, height: 720 },
  audio: true
});

const mediaRecorder = new MediaRecorder(stream, {
  mimeType: 'video/webm;codecs=vp8,opus'
});
```

### File Validation

```javascript
// Format check
if (!allowedFormats.includes(file.type)) {
  alert('Invalid format');
  return;
}

// Size check
if (file.size > maxFileSize) {
  alert('File too large');
  return;
}
```

### Mock Upload (Phase 7 will use Firebase)

```javascript
// Simulate upload progress
for (let progress = 0; progress <= 100; progress += 10) {
  await new Promise(resolve => setTimeout(resolve, 300));
  setUploadProgress(progress);
}
```

## 📊 Competition Settings

```javascript
const competitionSettings = {
  maxDuration: 300,        // 5 minutes
  maxFileSize: 50 * 1024 * 1024,  // 50MB
  allowedFormats: ['video/mp4', 'video/webm', 'video/quicktime'],
  categories: [
    'Physics', 'Chemistry', 'Biology', 'Environment',
    'Technology', 'Mathematics', 'Engineering', 'Agriculture',
    'Health Sciences', 'Innovation'
  ]
};
```

## 📱 Mobile Optimizations

- **Portrait-First**: Optimized for phone recording
- **Touch-Friendly**: Large buttons (44px+)
- **Full-Screen Camera**: Maximize preview area
- **Bottom Controls**: Easy thumb reach
- **Responsive Forms**: Stack on mobile
- **Smooth Animations**: 60fps throughout

## ♿ Accessibility

- ✅ Keyboard navigation
- ✅ Clear labels and hints
- ✅ Error messages with icons
- ✅ Color-coded status (not color-only)
- ✅ Screen reader friendly
- ✅ Focus management

## 🔮 Phase 7 Integration

Current mock implementation will be replaced with:

### Firebase Storage

```javascript
// Upload to Firebase Storage
const storageRef = firebase.storage().ref();
const videoRef = storageRef.child(`videos/${userId}/${videoId}.mp4`);

const uploadTask = videoRef.put(videoFile);

uploadTask.on('state_changed',
  (snapshot) => {
    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
    setUploadProgress(progress);
  },
  (error) => console.error(error),
  () => {
    // Get download URL
    uploadTask.snapshot.ref.getDownloadURL().then((url) => {
      // Save metadata to Firestore
    });
  }
);
```

### Cloud Functions

```javascript
// Triggered on video upload
exports.onVideoUpload = functions.storage
  .object()
  .onFinalize(async (object) => {
    // Extract video metadata
    // Generate thumbnail
    // Validate content (optional AI check)
    // Update Firestore document
    // Send notification to admins
  });
```

### Firestore Integration

```javascript
// Save video metadata
await firebase.firestore().collection('videos').add({
  ...metadata,
  uploaderId: currentUser.uid,
  uploaderName: currentUser.name,
  uploadedAt: firebase.firestore.FieldValue.serverTimestamp(),
  status: 'processing',
  fileUrl: downloadURL,
  // ... rest of metadata
});
```

## 🎯 Form Validation Rules

| Field | Min | Max | Required | Notes |
|-------|-----|-----|----------|-------|
| Title | 10 | 100 | Yes | Clear, descriptive title |
| Description | 50 | 500 | Yes | Explain experiment fully |
| Category | - | - | Yes | Select from 10 options |
| Tags | 0 | 5 | No | Comma-separated keywords |

## 📈 Success Metrics

Phase 3 successfully implements:
- ✅ Two upload methods (record + file)
- ✅ Real-time camera recording
- ✅ Drag-and-drop file upload
- ✅ Complete metadata form
- ✅ File validation
- ✅ Progress tracking
- ✅ Success confirmation
- ✅ Mobile-optimized UI
- ✅ Smooth animations

## 🐛 Known Limitations (Fixed in Phase 7)

1. **No Actual Upload**: Currently mock simulation
2. **No Thumbnail Generation**: Manual thumbnail in Phase 7
3. **No Video Validation**: AI content check in Phase 7
4. **No Compression**: Client-side compression in Phase 7
5. **No Persistence**: Videos don't save (mock only)
6. **No Admin Config**: Settings are hardcoded
7. **Camera Permissions**: Requires manual allow

## 🎓 Student Experience

### What Students Can Do:

1. **Record Experiment Live**
   - Show experiment step-by-step
   - Explain while recording
   - See timer to stay within limit

2. **Upload Pre-recorded Video**
   - Edit video first on phone
   - Upload polished final version
   - Check file size before upload

3. **Add Detailed Information**
   - Describe project thoroughly
   - Choose right category
   - Add searchable tags

4. **Track Upload Progress**
   - See real-time progress
   - Know when it's safe to close
   - Get confirmation of success

## 🔜 Next Steps

Ready for **Phase 4: Discovery & Search**!

Features to build:
- Search functionality (keywords)
- Category filtering
- School-based filtering
- Leaderboard (school, district, category)
- Trending videos
- Sort by score/views/date

---

**Phase 3 Complete!** 🎉 Students can now record and upload their science projects!
