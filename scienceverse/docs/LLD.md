# ScienceVerse - Low-Level Design (LLD)

## Table of Contents
- [Introduction](#introduction)
- [Component Design](#component-design)
- [Data Structures](#data-structures)
- [Algorithms and Logic](#algorithms-and-logic)
- [State Management](#state-management)
- [API Integration](#api-integration)
- [UI Component Specifications](#ui-component-specifications)
- [Security Implementation](#security-implementation)
- [Performance Optimizations](#performance-optimizations)

---

## Introduction

This Low-Level Design (LLD) document provides detailed technical specifications for implementing the ScienceVerse platform. It covers component-level design, data structures, algorithms, and implementation details.

### Document Purpose
- Provide implementation-ready specifications for developers
- Define component interfaces and interactions
- Document algorithms and business logic
- Specify data structures and state management
- Detail security and performance implementations

---

## Component Design

### 1. Authentication Components

#### **1.1 LoginScreen Component**

**File:** `src/components/LoginScreen.js`

**Purpose:** Handles user authentication

**Props:**
```javascript
{
  onLogin: (user: User) => void  // Callback after successful login
}
```

**State:**
```javascript
{
  email: string,           // User email input
  password: string,        // User password input
  isLogin: boolean,        // Toggle between login/register
  loading: boolean,        // Loading state during auth
  error: string | null     // Error message
}
```

**Key Methods:**

```javascript
handleLogin = async () => {
  // 1. Validate inputs
  if (!email || !password) {
    setError('Please fill in all fields');
    return;
  }

  // 2. Attempt Firebase authentication
  try {
    setLoading(true);
    const userCredential = await signInWithEmailAndPassword(auth, email, password);

    // 3. Fetch user profile from Firestore
    const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));

    if (!userDoc.exists()) {
      throw new Error('User profile not found');
    }

    // 4. Construct user object
    const userData = {
      uid: userCredential.user.uid,
      email: userCredential.user.email,
      ...userDoc.data()
    };

    // 5. Call parent callback
    onLogin(userData);

  } catch (error) {
    setError(error.message);
  } finally {
    setLoading(false);
  }
}

handleRegister = async () => {
  // 1. Validate inputs
  if (!name || !email || !password || !schoolName || !role) {
    setError('Please fill in all fields');
    return;
  }

  // 2. Create Firebase auth account
  try {
    setLoading(true);
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);

    // 3. Create user profile in Firestore
    const userData = {
      name,
      email,
      role,
      schoolName,
      createdAt: new Date().toISOString(),
      badges: [],
      totalScore: 0
    };

    await setDoc(doc(db, 'users', userCredential.user.uid), userData);

    // 4. Return complete user object
    onLogin({
      uid: userCredential.user.uid,
      ...userData
    });

  } catch (error) {
    setError(error.message);
  } finally {
    setLoading(false);
  }
}
```

**Validation Rules:**
- Email: Must be valid email format
- Password: Minimum 6 characters (Firebase requirement)
- Name: Required, non-empty string
- School: Required, non-empty string
- Role: Must be one of ['student', 'teacher', 'judge', 'admin']

---

#### **1.2 UserContext Provider**

**File:** `src/context/UserContext.js`

**Purpose:** Global user state management

**Context Value:**
```javascript
{
  currentUser: User | null,
  setCurrentUser: (user: User | null) => void,
  logout: () => Promise<void>
}
```

**Implementation:**
```javascript
export const UserProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);

  // Persist user to localStorage
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('scienceverse_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('scienceverse_user');
    }
  }, [currentUser]);

  // Restore user from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('scienceverse_user');
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Failed to restore user:', error);
        localStorage.removeItem('scienceverse_user');
      }
    }
  }, []);

  const logout = async () => {
    await signOut(auth);
    setCurrentUser(null);
  };

  return (
    <UserContext.Provider value={{ currentUser, setCurrentUser, logout }}>
      {children}
    </UserContext.Provider>
  );
};
```

---

### 2. Video Components

#### **2.1 VideoPlayer Component**

**File:** `src/components/VideoPlayer.js`

**Purpose:** Full-screen video player with controls

**Props:**
```javascript
{
  video: Video,                    // Video object
  onEvaluate: (videoId) => void,  // Open evaluation form
  onViewEvaluations: (videoId) => void,  // View evaluations
  currentUser: User,              // Current logged-in user
  evaluations: Evaluation[]       // All evaluations for this video
}
```

**State:**
```javascript
{
  isPlaying: boolean,      // Video playing state
  isMuted: boolean,        // Audio muted state
  showDescription: boolean // Description overlay visibility
}
```

**Key Methods:**

```javascript
togglePlayPause = () => {
  const videoElement = videoRef.current;

  if (isPlaying) {
    videoElement.pause();
  } else {
    videoElement.play();
  }

  setIsPlaying(!isPlaying);
}

handleVideoEnd = () => {
  // Auto-loop video (TikTok behavior)
  videoRef.current.currentTime = 0;
  videoRef.current.play();
}

calculateAverageScore = (evaluations) => {
  if (!evaluations || evaluations.length === 0) return 0;

  const videoEvals = evaluations.filter(e => e.videoId === video.videoId);
  if (videoEvals.length === 0) return 0;

  const sum = videoEvals.reduce((acc, e) => acc + e.overallScore, 0);
  return (sum / videoEvals.length).toFixed(1);
}

canEvaluate = (currentUser, video) => {
  // Students cannot evaluate
  if (currentUser.role === 'student') return false;

  // Cannot evaluate own video
  if (currentUser.uid === video.uploaderId) return false;

  // Teachers can only evaluate videos from their school
  if (currentUser.role === 'teacher') {
    return currentUser.schoolName === video.uploaderSchool;
  }

  // Judges and admins can evaluate any video
  return true;
}
```

**Video Element Configuration:**
```javascript
<video
  ref={videoRef}
  src={video.videoUrl}
  className="video-player"
  playsInline           // Prevent fullscreen on iOS
  loop={false}          // Manual looping via onEnded
  muted={isMuted}
  onClick={togglePlayPause}
  onEnded={handleVideoEnd}
  onPlay={() => setIsPlaying(true)}
  onPause={() => setIsPlaying(false)}
/>
```

---

#### **2.2 VideoFeed Component**

**File:** `src/components/VideoFeed.js`

**Purpose:** Swipeable feed of videos (TikTok-style)

**Props:**
```javascript
{
  videos: Video[],
  onEvaluate: (videoId) => void,
  onViewEvaluations: (videoId) => void,
  evaluations: Evaluation[],
  initialVideoId?: string  // Optional: Jump to specific video
}
```

**State:**
```javascript
{
  currentIndex: number,    // Current video index
  touchStart: number,      // Touch start Y position
  touchEnd: number         // Touch end Y position
}
```

**Key Methods:**

```javascript
getInitialIndex = () => {
  if (initialVideoId) {
    const index = videos.findIndex(v => v.videoId === initialVideoId);
    return index >= 0 ? index : 0;
  }
  return 0;
}

handleTouchStart = (e) => {
  setTouchStart(e.touches[0].clientY);
}

handleTouchMove = (e) => {
  setTouchEnd(e.touches[0].clientY);
}

handleTouchEnd = () => {
  if (!touchStart || !touchEnd) return;

  const distance = touchStart - touchEnd;
  const swipeThreshold = 50;  // Minimum swipe distance

  if (distance > swipeThreshold) {
    // Swipe up - next video
    handleNext();
  } else if (distance < -swipeThreshold) {
    // Swipe down - previous video
    handlePrevious();
  }

  setTouchStart(null);
  setTouchEnd(null);
}

handleNext = () => {
  if (currentIndex < videos.length - 1) {
    setCurrentIndex(currentIndex + 1);
  }
}

handlePrevious = () => {
  if (currentIndex > 0) {
    setCurrentIndex(currentIndex - 1);
  }
}

handleKeyPress = (e) => {
  if (e.key === 'ArrowUp') handlePrevious();
  if (e.key === 'ArrowDown') handleNext();
}
```

**Swipe Detection Algorithm:**
```
1. Capture touch start Y position
2. Track touch movement
3. Calculate distance on touch end
4. If distance > threshold (50px):
   - Positive distance = swipe up → next video
   - Negative distance = swipe down → previous video
5. Reset touch positions
```

---

#### **2.3 UploadScreen Component**

**File:** `src/components/UploadScreen.js`

**Purpose:** Video upload with metadata and thumbnail generation

**Props:**
```javascript
{
  currentUser: User,
  onUploadComplete: () => void  // Callback after upload
}
```

**State:**
```javascript
{
  title: string,
  description: string,
  category: string,
  videoFile: File | null,
  uploadProgress: number,   // 0-100
  uploading: boolean,
  error: string | null
}
```

**Key Methods:**

```javascript
generateThumbnail = (videoFile) => {
  return new Promise((resolve, reject) => {
    // 1. Create video element
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    // 2. Load video file
    video.preload = 'metadata';
    video.src = URL.createObjectURL(videoFile);

    // 3. Seek to 1 second (or 10% of duration)
    video.onloadedmetadata = () => {
      video.currentTime = Math.min(1, video.duration * 0.1);
    };

    // 4. Capture frame when seeked
    video.onseeked = () => {
      // Set canvas dimensions to video dimensions
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // 5. Convert canvas to blob
      canvas.toBlob((blob) => {
        URL.revokeObjectURL(video.src);
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to generate thumbnail'));
        }
      }, 'image/jpeg', 0.8);  // JPEG quality 80%
    };

    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      reject(new Error('Failed to load video'));
    };
  });
}

handleFormSubmit = async (e) => {
  e.preventDefault();

  // 1. Validate inputs
  if (!title || !description || !category || !videoFile) {
    setError('Please fill in all fields');
    return;
  }

  // 2. Validate file
  const maxSize = 100 * 1024 * 1024;  // 100MB
  if (videoFile.size > maxSize) {
    setError('Video file is too large (max 100MB)');
    return;
  }

  setUploading(true);
  setError(null);

  try {
    const videoId = `video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // 3. Upload video file
    const videoPath = `videos/${videoId}/${videoFile.name}`;
    const videoRef = ref(storage, videoPath);
    const videoUploadTask = uploadBytesResumable(videoRef, videoFile);

    // Monitor video upload progress
    await new Promise((resolve, reject) => {
      videoUploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 80;
          setUploadProgress(progress);
        },
        (error) => reject(error),
        () => resolve()
      );
    });

    const videoDownloadURL = await getDownloadURL(videoUploadTask.snapshot.ref);

    // 4. Generate and upload thumbnail
    setUploadProgress(85);
    const thumbnailBlob = await generateThumbnail(videoFile);

    const thumbnailPath = `thumbnails/${videoId}/thumbnail.jpg`;
    const thumbnailRef = ref(storage, thumbnailPath);
    const thumbnailUploadTask = uploadBytesResumable(thumbnailRef, thumbnailBlob);

    await new Promise((resolve, reject) => {
      thumbnailUploadTask.on(
        'state_changed',
        null,
        (error) => reject(error),
        () => resolve()
      );
    });

    const thumbnailURL = await getDownloadURL(thumbnailUploadTask.snapshot.ref);

    // 5. Get video duration
    setUploadProgress(95);
    const duration = await getVideoDuration(videoFile);

    // 6. Save metadata to Firestore
    const videoData = {
      videoId: videoId,
      title: title,
      description: description,
      category: category,
      videoUrl: videoDownloadURL,
      thumbnailUrl: thumbnailURL,
      duration: duration,
      uploaderId: currentUser.uid,
      uploaderName: currentUser.name,
      uploaderSchool: currentUser.schoolName,
      status: currentUser.role === 'admin' ? 'active' : 'pending',
      createdAt: new Date().toISOString(),
      views: 0,
      likes: 0
    };

    await addDoc(collection(db, 'videos'), videoData);

    setUploadProgress(100);

    // 7. Success callback
    setTimeout(() => {
      onUploadComplete();
    }, 500);

  } catch (error) {
    console.error('Upload error:', error);
    setError(error.message || 'Failed to upload video');
    setUploading(false);
    setUploadProgress(0);
  }
}

getVideoDuration = (videoFile) => {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.src = URL.createObjectURL(videoFile);

    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      resolve(Math.floor(video.duration));
    };
  });
}
```

**Upload Flow:**
```
1. Validate form inputs
2. Validate video file (size, type)
3. Upload video file to Storage (0-80% progress)
4. Generate thumbnail from video (85% progress)
5. Upload thumbnail to Storage
6. Extract video duration
7. Save metadata to Firestore (95% progress)
8. Complete upload (100% progress)
9. Trigger success callback
```

---

### 3. Evaluation Components

#### **3.1 EvaluationForm Component**

**File:** `src/components/EvaluationForm.js`

**Purpose:** Multi-dimensional video evaluation form

**Props:**
```javascript
{
  video: Video,
  currentUser: User,
  onSubmit: (evaluation: Evaluation) => void,
  onCancel: () => void
}
```

**State:**
```javascript
{
  scientificClarity: number,    // 1-5
  humanityAndCare: number,      // 1-5
  realLifeImpact: number,       // 1-5
  originalThinking: number,     // 1-5
  comments: string,
  submitting: boolean,
  error: string | null
}
```

**Key Methods:**

```javascript
calculateOverallScore = () => {
  // Weighted average of all dimensions
  const scores = [
    scientificClarity,
    humanityAndCare,
    realLifeImpact,
    originalThinking
  ];

  const sum = scores.reduce((acc, score) => acc + score, 0);
  return (sum / scores.length).toFixed(2);
}

validateForm = () => {
  // All dimensions must be rated
  if (!scientificClarity || !humanityAndCare || !realLifeImpact || !originalThinking) {
    setError('Please rate all dimensions');
    return false;
  }

  // Comments optional but recommended
  if (!comments || comments.trim().length < 10) {
    const confirmSubmit = window.confirm(
      'Are you sure you want to submit without detailed comments?'
    );
    if (!confirmSubmit) return false;
  }

  return true;
}

handleSubmit = async () => {
  if (!validateForm()) return;

  setSubmitting(true);
  setError(null);

  try {
    const evaluationData = {
      evaluationId: `eval_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      videoId: video.videoId,
      evaluatorId: currentUser.uid,
      evaluatorName: currentUser.name,
      evaluatorRole: currentUser.role,
      scientificClarity: scientificClarity,
      humanityAndCare: humanityAndCare,
      realLifeImpact: realLifeImpact,
      originalThinking: originalThinking,
      overallScore: parseFloat(calculateOverallScore()),
      comments: comments.trim(),
      createdAt: new Date().toISOString()
    };

    // Save to Firestore
    await addDoc(collection(db, 'evaluations'), evaluationData);

    // Update video aggregate score
    await updateVideoScore(video.videoId);

    // Create notification for video uploader
    await createNotification({
      userId: video.uploaderId,
      title: 'New Evaluation Received',
      message: `${currentUser.name} rated your video "${video.title}"`,
      icon: '⭐',
      type: 'evaluation',
      read: false,
      createdAt: new Date().toISOString()
    });

    onSubmit(evaluationData);

  } catch (error) {
    console.error('Evaluation submission error:', error);
    setError('Failed to submit evaluation. Please try again.');
  } finally {
    setSubmitting(false);
  }
}

updateVideoScore = async (videoId) => {
  // Fetch all evaluations for this video
  const evaluationsQuery = query(
    collection(db, 'evaluations'),
    where('videoId', '==', videoId)
  );

  const snapshot = await getDocs(evaluationsQuery);
  const evaluations = snapshot.docs.map(doc => doc.data());

  if (evaluations.length === 0) return;

  // Calculate average score
  const totalScore = evaluations.reduce((sum, e) => sum + e.overallScore, 0);
  const averageScore = totalScore / evaluations.length;

  // Update video document
  const videosQuery = query(
    collection(db, 'videos'),
    where('videoId', '==', videoId)
  );

  const videoSnapshot = await getDocs(videosQuery);
  if (!videoSnapshot.empty) {
    const videoDoc = videoSnapshot.docs[0];
    await updateDoc(videoDoc.ref, {
      averageScore: parseFloat(averageScore.toFixed(2)),
      evaluationCount: evaluations.length
    });
  }
}
```

**Evaluation Dimensions:**
```javascript
const dimensions = [
  {
    key: 'scientificClarity',
    label: 'Scientific Clarity',
    description: 'How clearly is the science explained?',
    icon: '🔬'
  },
  {
    key: 'humanityAndCare',
    label: 'Humanity & Care',
    description: 'Does it show compassion and human connection?',
    icon: '❤️'
  },
  {
    key: 'realLifeImpact',
    label: 'Real-Life Impact',
    description: 'How applicable is it to real-world problems?',
    icon: '🌍'
  },
  {
    key: 'originalThinking',
    label: 'Original Thinking',
    description: 'How creative and innovative is the approach?',
    icon: '💡'
  }
];
```

**Rating Scale:**
- 1 star: Poor
- 2 stars: Fair
- 3 stars: Good
- 4 stars: Very Good
- 5 stars: Excellent

---

#### **3.2 EvaluationsList Component**

**File:** `src/components/EvaluationsList.js`

**Purpose:** Display all evaluations for a video

**Props:**
```javascript
{
  video: Video,
  evaluations: Evaluation[],
  onClose: () => void
}
```

**Key Methods:**

```javascript
getVideoEvaluations = () => {
  return evaluations.filter(e => e.videoId === video.videoId);
}

calculateAverageByDimension = (dimension) => {
  const videoEvals = getVideoEvaluations();
  if (videoEvals.length === 0) return 0;

  const sum = videoEvals.reduce((acc, e) => acc + e[dimension], 0);
  return (sum / videoEvals.length).toFixed(1);
}

getScoreColor = (score) => {
  if (score >= 4.5) return '#10b981';  // Green
  if (score >= 3.5) return '#3b82f6';  // Blue
  if (score >= 2.5) return '#f59e0b';  // Orange
  return '#ef4444';  // Red
}

renderStars = (rating) => {
  return Array.from({ length: 5 }, (_, index) => (
    <span key={index} style={{
      color: index < Math.floor(rating) ? '#fbbf24' : '#d1d5db'
    }}>
      ★
    </span>
  ));
}
```

---

### 4. Discovery Components

#### **4.1 DiscoveryScreen Component**

**File:** `src/components/DiscoveryScreen.js`

**Purpose:** Browse and filter approved videos

**Props:**
```javascript
{
  videos: Video[],
  onVideoSelect: (video: Video) => void
}
```

**State:**
```javascript
{
  selectedCategory: string,      // 'All' or specific category
  sortBy: string,                // 'newest' | 'popular' | 'topRated'
  searchQuery: string,           // Search input
  filteredVideos: Video[]        // Processed video list
}
```

**Key Methods:**

```javascript
filterAndSortVideos = () => {
  let result = videos.filter(v => v.status === 'active');

  // Filter by category
  if (selectedCategory !== 'All') {
    result = result.filter(v => v.category === selectedCategory);
  }

  // Filter by search query
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    result = result.filter(v =>
      v.title.toLowerCase().includes(query) ||
      v.description.toLowerCase().includes(query) ||
      v.uploaderName.toLowerCase().includes(query)
    );
  }

  // Sort
  switch (sortBy) {
    case 'newest':
      result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      break;

    case 'popular':
      result.sort((a, b) => (b.views || 0) - (a.views || 0));
      break;

    case 'topRated':
      result.sort((a, b) => (b.averageScore || 0) - (a.averageScore || 0));
      break;
  }

  setFilteredVideos(result);
}

// Update filtered videos when filters change
useEffect(() => {
  filterAndSortVideos();
}, [selectedCategory, sortBy, searchQuery, videos]);
```

**Categories:**
```javascript
const categories = [
  'All',
  'Physics',
  'Chemistry',
  'Biology',
  'Environmental Science',
  'Technology',
  'Mathematics',
  'Other'
];
```

---

#### **4.2 VideoGrid Component**

**File:** `src/components/VideoGrid.js`

**Purpose:** Grid layout of video cards

**Props:**
```javascript
{
  videos: Video[],
  onVideoClick: (video: Video) => void
}
```

**Key Methods:**

```javascript
formatDuration = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

renderVideoCard = (video) => {
  return (
    <div
      className="video-card"
      onClick={() => onVideoClick(video)}
      style={{ cursor: 'pointer' }}
    >
      <div className="video-thumbnail">
        {/* Thumbnail or placeholder */}
        {video.thumbnailUrl ? (
          <img
            src={video.thumbnailUrl}
            alt={video.title}
            className="thumbnail-image"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextElementSibling.style.display = 'flex';
            }}
          />
        ) : null}

        <div
          className="thumbnail-placeholder"
          style={{
            display: video.thumbnailUrl ? 'none' : 'flex',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '48px'
          }}
        >
          🎬
        </div>

        {/* Duration badge */}
        <div className="duration-badge">
          {formatDuration(video.duration || 0)}
        </div>

        {/* Score badge */}
        {video.averageScore && (
          <div className="score-badge">
            ⭐ {video.averageScore}
          </div>
        )}
      </div>

      <div className="video-info">
        <h3>{video.title}</h3>
        <p className="video-uploader">{video.uploaderName}</p>
        <div className="video-stats">
          <span>👁️ {video.views || 0}</span>
          <span>💬 {video.evaluationCount || 0}</span>
        </div>
      </div>
    </div>
  );
}
```

---

### 5. Admin Components

#### **5.1 AdminPanel Component**

**File:** `src/components/AdminPanel.js`

**Purpose:** System administration dashboard

**Props:**
```javascript
{
  currentUser: User,
  videos: Video[],
  onApprove: (videoId: string) => void,
  onReject: (videoId: string) => void
}
```

**State:**
```javascript
{
  activeTab: string,              // 'videos' | 'users' | 'schools' | 'stats'
  users: User[],
  schools: School[],
  pendingVideos: Video[],
  loading: boolean
}
```

**Key Methods:**

```javascript
loadUsers = async () => {
  try {
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const usersList = usersSnapshot.docs.map(doc => ({
      uid: doc.id,
      ...doc.data()
    }));
    setUsers(usersList);
  } catch (error) {
    console.error('Error loading users:', error);
  }
}

loadSchools = async () => {
  try {
    const schoolsSnapshot = await getDocs(collection(db, 'schools'));
    const schoolsList = schoolsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setSchools(schoolsList);
  } catch (error) {
    console.error('Error loading schools:', error);
  }
}

getPendingVideos = () => {
  return videos.filter(v => v.status === 'pending')
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

calculateStats = () => {
  return {
    totalUsers: users.length,
    totalVideos: videos.length,
    pendingVideos: videos.filter(v => v.status === 'pending').length,
    activeVideos: videos.filter(v => v.status === 'active').length,
    totalSchools: schools.length,
    usersByRole: {
      student: users.filter(u => u.role === 'student').length,
      teacher: users.filter(u => u.role === 'teacher').length,
      judge: users.filter(u => u.role === 'judge').length,
      admin: users.filter(u => u.role === 'admin').length
    }
  };
}

handleApproveVideo = async (videoId) => {
  const confirmApprove = window.confirm('Approve this video?');
  if (!confirmApprove) return;

  try {
    // Find video document
    const videosQuery = query(
      collection(db, 'videos'),
      where('videoId', '==', videoId)
    );
    const snapshot = await getDocs(videosQuery);

    if (!snapshot.empty) {
      const videoDoc = snapshot.docs[0];
      const videoData = videoDoc.data();

      // Update status
      await updateDoc(videoDoc.ref, {
        status: 'active',
        approvedBy: currentUser.name,
        approvedAt: new Date().toISOString()
      });

      // Create notification for uploader
      await addDoc(collection(db, 'notifications'), {
        userId: videoData.uploaderId,
        title: 'Video Approved!',
        message: `Your video "${videoData.title}" has been approved and is now live.`,
        icon: '✅',
        type: 'approval',
        read: false,
        createdAt: new Date().toISOString()
      });

      onApprove(videoId);
    }
  } catch (error) {
    console.error('Error approving video:', error);
    alert('Failed to approve video');
  }
}

handleRejectVideo = async (videoId) => {
  const reason = prompt('Enter rejection reason:');
  if (!reason) return;

  try {
    const videosQuery = query(
      collection(db, 'videos'),
      where('videoId', '==', videoId)
    );
    const snapshot = await getDocs(videosQuery);

    if (!snapshot.empty) {
      const videoDoc = snapshot.docs[0];
      const videoData = videoDoc.data();

      // Update status
      await updateDoc(videoDoc.ref, {
        status: 'rejected',
        rejectedBy: currentUser.name,
        rejectedAt: new Date().toISOString(),
        rejectionReason: reason
      });

      // Create notification
      await addDoc(collection(db, 'notifications'), {
        userId: videoData.uploaderId,
        title: 'Video Not Approved',
        message: `Your video "${videoData.title}" was not approved. Reason: ${reason}`,
        icon: '❌',
        type: 'rejection',
        read: false,
        createdAt: new Date().toISOString()
      });

      onReject(videoId);
    }
  } catch (error) {
    console.error('Error rejecting video:', error);
    alert('Failed to reject video');
  }
}
```

---

### 6. Notification Components

#### **6.1 NotificationBell Component**

**File:** Integrated in `src/App.js`

**Purpose:** Display notification count and dropdown

**State:**
```javascript
{
  notifications: Notification[],
  unreadCount: number,
  showDropdown: boolean
}
```

**Key Methods:**

```javascript
loadNotifications = async () => {
  if (!currentUser) return;

  try {
    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('userId', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(notificationsQuery);
    const notificationsList = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || new Date()
    }));

    setNotifications(notificationsList);

    // Count unread
    const unread = notificationsList.filter(n => !n.read).length;
    setUnreadCount(unread);

  } catch (error) {
    console.error('Error loading notifications:', error);
    setNotifications([]);
    setUnreadCount(0);
  }
}

markAsRead = async (notificationId) => {
  try {
    const notifRef = doc(db, 'notifications', notificationId);
    await updateDoc(notifRef, { read: true });

    // Update local state
    setNotifications(notifications.map(n =>
      n.id === notificationId ? { ...n, read: true } : n
    ));
    setUnreadCount(Math.max(0, unreadCount - 1));

  } catch (error) {
    console.error('Error marking notification as read:', error);
  }
}

getTimeAgo = (date) => {
  const now = new Date();
  const diff = now - new Date(date);
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
  return new Date(date).toLocaleDateString();
}
```

---

## Data Structures

### 1. User Object

```javascript
{
  uid: string,                    // Firebase Auth UID
  email: string,                  // User email
  name: string,                   // Display name
  role: 'student' | 'teacher' | 'judge' | 'admin',
  schoolName: string,             // Associated school
  createdAt: string,              // ISO timestamp
  badges: string[],               // Array of badge IDs
  totalScore: number,             // Cumulative score
  profilePhoto?: string           // Optional profile photo URL
}
```

### 2. Video Object

```javascript
{
  videoId: string,                // Unique video ID
  title: string,                  // Video title
  description: string,            // Description
  category: string,               // Science category
  videoUrl: string,               // Firebase Storage URL
  thumbnailUrl: string,           // Thumbnail Storage URL
  duration: number,               // Duration in seconds
  uploaderId: string,             // Uploader UID
  uploaderName: string,           // Uploader name
  uploaderSchool: string,         // School name
  status: 'pending' | 'active' | 'rejected',
  createdAt: string,              // ISO timestamp
  approvedBy?: string,            // Approver name
  approvedAt?: string,            // Approval timestamp
  rejectedBy?: string,            // Rejecter name
  rejectedAt?: string,            // Rejection timestamp
  rejectionReason?: string,       // Rejection reason
  views: number,                  // View count
  likes: number,                  // Like count
  averageScore?: number,          // Average evaluation score
  evaluationCount?: number        // Number of evaluations
}
```

### 3. Evaluation Object

```javascript
{
  evaluationId: string,           // Unique evaluation ID
  videoId: string,                // Associated video ID
  evaluatorId: string,            // Evaluator UID
  evaluatorName: string,          // Evaluator name
  evaluatorRole: string,          // Evaluator role
  scientificClarity: number,      // 1-5 rating
  humanityAndCare: number,        // 1-5 rating
  realLifeImpact: number,         // 1-5 rating
  originalThinking: number,       // 1-5 rating
  overallScore: number,           // Calculated average (1-5)
  comments: string,               // Detailed feedback
  createdAt: string               // ISO timestamp
}
```

### 4. Notification Object

```javascript
{
  id: string,                     // Firestore document ID
  userId: string,                 // Recipient UID
  title: string,                  // Notification title
  message: string,                // Notification message
  icon: string,                   // Emoji icon
  type: 'approval' | 'evaluation' | 'badge' | 'reminder' | 'announcement',
  read: boolean,                  // Read status
  createdAt: string               // ISO timestamp
}
```

### 5. School Object

```javascript
{
  id: string,                     // School ID
  name: string,                   // School name
  address: string,                // School address
  city: string,                   // City
  state: string,                  // State
  principalName: string,          // Principal name
  contactEmail: string,           // Contact email
  contactPhone: string,           // Contact phone
  createdAt: string               // ISO timestamp
}
```

---

## Algorithms and Logic

### 1. Video Score Calculation Algorithm

**Purpose:** Calculate aggregate score for a video from all evaluations

```javascript
function calculateVideoScore(evaluations, videoId) {
  // 1. Filter evaluations for this video
  const videoEvaluations = evaluations.filter(e => e.videoId === videoId);

  // 2. Return 0 if no evaluations
  if (videoEvaluations.length === 0) {
    return {
      averageScore: 0,
      dimensionScores: {
        scientificClarity: 0,
        humanityAndCare: 0,
        realLifeImpact: 0,
        originalThinking: 0
      },
      evaluationCount: 0
    };
  }

  // 3. Calculate average for each dimension
  const dimensionScores = {
    scientificClarity: 0,
    humanityAndCare: 0,
    realLifeImpact: 0,
    originalThinking: 0
  };

  videoEvaluations.forEach(evaluation => {
    dimensionScores.scientificClarity += evaluation.scientificClarity;
    dimensionScores.humanityAndCare += evaluation.humanityAndCare;
    dimensionScores.realLifeImpact += evaluation.realLifeImpact;
    dimensionScores.originalThinking += evaluation.originalThinking;
  });

  const count = videoEvaluations.length;
  Object.keys(dimensionScores).forEach(key => {
    dimensionScores[key] = parseFloat((dimensionScores[key] / count).toFixed(2));
  });

  // 4. Calculate overall average score
  const totalScore = videoEvaluations.reduce((sum, e) => sum + e.overallScore, 0);
  const averageScore = parseFloat((totalScore / count).toFixed(2));

  return {
    averageScore,
    dimensionScores,
    evaluationCount: count
  };
}
```

**Time Complexity:** O(n) where n = number of evaluations for the video

---

### 2. Badge Calculation Algorithm

**Purpose:** Determine badges earned based on user activity

```javascript
function calculateBadges(user, videos, evaluations) {
  const badges = [];

  // User's videos
  const userVideos = videos.filter(v => v.uploaderId === user.uid && v.status === 'active');

  // User's evaluations
  const userEvaluations = evaluations.filter(e => e.evaluatorId === user.uid);

  // Badge 1: First Steps (Upload first video)
  if (userVideos.length >= 1) {
    badges.push({
      id: 'first_steps',
      name: 'First Steps',
      icon: '🎬',
      description: 'Uploaded your first video'
    });
  }

  // Badge 2: Rising Star (5+ approved videos)
  if (userVideos.length >= 5) {
    badges.push({
      id: 'rising_star',
      name: 'Rising Star',
      icon: '🌟',
      description: 'Uploaded 5 approved videos'
    });
  }

  // Badge 3: Quality Star (Average score >= 4.5)
  const videoScores = userVideos
    .map(v => v.averageScore || 0)
    .filter(score => score > 0);

  if (videoScores.length > 0) {
    const avgScore = videoScores.reduce((sum, s) => sum + s, 0) / videoScores.length;

    if (avgScore >= 4.5) {
      badges.push({
        id: 'quality_star',
        name: 'Quality Star',
        icon: '⭐',
        description: 'Maintained average score above 4.5'
      });
    }
  }

  // Badge 4: Active Evaluator (Evaluated 10+ videos)
  if (userEvaluations.length >= 10) {
    badges.push({
      id: 'active_evaluator',
      name: 'Active Evaluator',
      icon: '📝',
      description: 'Evaluated 10+ videos'
    });
  }

  // Badge 5: Science Champion (Top 10% scores in category)
  // (Implementation would require category-wide score comparison)

  // Badge 6: School Pride (School-specific achievements)
  // (Implementation would require school-wide metrics)

  return badges;
}
```

---

### 3. Video Feed Ranking Algorithm

**Purpose:** Order videos in discovery feed based on multiple factors

```javascript
function rankVideos(videos, sortBy = 'trending') {
  switch (sortBy) {
    case 'newest':
      return videos.sort((a, b) =>
        new Date(b.createdAt) - new Date(a.createdAt)
      );

    case 'popular':
      return videos.sort((a, b) =>
        (b.views || 0) - (a.views || 0)
      );

    case 'topRated':
      return videos.sort((a, b) =>
        (b.averageScore || 0) - (a.averageScore || 0)
      );

    case 'trending':
      // Trending = weighted score based on recency, views, and ratings
      return videos.sort((a, b) => {
        const scoreA = calculateTrendingScore(a);
        const scoreB = calculateTrendingScore(b);
        return scoreB - scoreA;
      });

    default:
      return videos;
  }
}

function calculateTrendingScore(video) {
  // Recency factor (videos from last 7 days get boost)
  const daysSinceUpload = (Date.now() - new Date(video.createdAt)) / (1000 * 60 * 60 * 24);
  const recencyScore = Math.max(0, 1 - (daysSinceUpload / 7));

  // Engagement factor (views + evaluations)
  const views = video.views || 0;
  const evaluations = video.evaluationCount || 0;
  const engagementScore = Math.log10(views + 1) + (evaluations * 2);

  // Quality factor (average score)
  const qualityScore = video.averageScore || 0;

  // Weighted combination
  const trendingScore =
    (recencyScore * 0.3) +
    (engagementScore * 0.4) +
    (qualityScore * 0.3);

  return trendingScore;
}
```

---

### 4. Search Algorithm

**Purpose:** Full-text search across video metadata

```javascript
function searchVideos(videos, searchQuery) {
  if (!searchQuery || searchQuery.trim() === '') {
    return videos;
  }

  const query = searchQuery.toLowerCase().trim();
  const queryTerms = query.split(/\s+/);  // Split into words

  return videos.filter(video => {
    // Search in title
    const titleMatch = video.title.toLowerCase().includes(query);

    // Search in description
    const descriptionMatch = video.description.toLowerCase().includes(query);

    // Search in uploader name
    const uploaderMatch = video.uploaderName.toLowerCase().includes(query);

    // Search in category
    const categoryMatch = video.category.toLowerCase().includes(query);

    // Multi-term search (all terms must match somewhere)
    const multiTermMatch = queryTerms.every(term =>
      video.title.toLowerCase().includes(term) ||
      video.description.toLowerCase().includes(term) ||
      video.uploaderName.toLowerCase().includes(term) ||
      video.category.toLowerCase().includes(term)
    );

    return titleMatch || descriptionMatch || uploaderMatch || categoryMatch || multiTermMatch;
  });
}
```

**Time Complexity:** O(n * m) where n = videos, m = query terms

---

## State Management

### Global State (UserContext)

```javascript
// UserContext.js
const UserContext = createContext({
  currentUser: null,
  setCurrentUser: () => {},
  logout: () => {}
});

export const UserProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);

  // Persist to localStorage
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('scienceverse_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('scienceverse_user');
    }
  }, [currentUser]);

  // Restore from localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem('scienceverse_user');
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (error) {
        localStorage.removeItem('scienceverse_user');
      }
    }
  }, []);

  const logout = async () => {
    await signOut(auth);
    setCurrentUser(null);
  };

  return (
    <UserContext.Provider value={{ currentUser, setCurrentUser, logout }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
```

### Local Component State

Each component manages its own local state using React hooks:

```javascript
// Example: UploadScreen
const [formData, setFormData] = useState({
  title: '',
  description: '',
  category: '',
  videoFile: null
});

const [ui, setUI] = useState({
  uploading: false,
  progress: 0,
  error: null
});
```

---

## API Integration

### Firebase Authentication API

```javascript
// Sign In
import { signInWithEmailAndPassword } from 'firebase/auth';

const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    throw new Error(error.message);
  }
}

// Sign Up
import { createUserWithEmailAndPassword } from 'firebase/auth';

const registerUser = async (email, password) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    throw new Error(error.message);
  }
}

// Sign Out
import { signOut } from 'firebase/auth';

const logoutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    throw new Error(error.message);
  }
}
```

### Firestore API

```javascript
// Add Document
import { collection, addDoc } from 'firebase/firestore';

const createVideo = async (videoData) => {
  try {
    const docRef = await addDoc(collection(db, 'videos'), videoData);
    return docRef.id;
  } catch (error) {
    throw new Error(error.message);
  }
}

// Query Documents
import { collection, query, where, getDocs } from 'firebase/firestore';

const getVideosByStatus = async (status) => {
  try {
    const q = query(
      collection(db, 'videos'),
      where('status', '==', status)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    throw new Error(error.message);
  }
}

// Update Document
import { doc, updateDoc } from 'firebase/firestore';

const approveVideo = async (videoId, approverName) => {
  try {
    const videoRef = doc(db, 'videos', videoId);
    await updateDoc(videoRef, {
      status: 'active',
      approvedBy: approverName,
      approvedAt: new Date().toISOString()
    });
  } catch (error) {
    throw new Error(error.message);
  }
}

// Delete Document
import { doc, deleteDoc } from 'firebase/firestore';

const deleteVideo = async (videoId) => {
  try {
    await deleteDoc(doc(db, 'videos', videoId));
  } catch (error) {
    throw new Error(error.message);
  }
}
```

### Firebase Storage API

```javascript
// Upload File with Progress
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

const uploadVideo = (file, onProgress) => {
  return new Promise((resolve, reject) => {
    const storageRef = ref(storage, `videos/${Date.now()}_${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress(progress);
      },
      (error) => {
        reject(error);
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        resolve(downloadURL);
      }
    );
  });
}

// Delete File
import { ref, deleteObject } from 'firebase/storage';

const deleteVideoFile = async (videoUrl) => {
  try {
    const storageRef = ref(storage, videoUrl);
    await deleteObject(storageRef);
  } catch (error) {
    throw new Error(error.message);
  }
}
```

---

## UI Component Specifications

### 1. Color Palette

```css
:root {
  /* Primary Colors */
  --primary-blue: #3b82f6;
  --primary-purple: #8b5cf6;
  --primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

  /* Status Colors */
  --success-green: #10b981;
  --warning-orange: #f59e0b;
  --error-red: #ef4444;
  --info-blue: #3b82f6;

  /* Neutral Colors */
  --gray-50: #f9fafb;
  --gray-100: #f3f4f6;
  --gray-200: #e5e7eb;
  --gray-300: #d1d5db;
  --gray-400: #9ca3af;
  --gray-500: #6b7280;
  --gray-600: #4b5563;
  --gray-700: #374151;
  --gray-800: #1f2937;
  --gray-900: #111827;

  /* Background */
  --bg-primary: #ffffff;
  --bg-secondary: #f9fafb;
  --bg-tertiary: #f3f4f6;

  /* Text */
  --text-primary: #111827;
  --text-secondary: #6b7280;
  --text-tertiary: #9ca3af;
}
```

### 2. Typography

```css
/* Font Stack */
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto',
               'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans',
               'Helvetica Neue', sans-serif;
}

/* Font Sizes */
.text-xs { font-size: 0.75rem; }     /* 12px */
.text-sm { font-size: 0.875rem; }    /* 14px */
.text-base { font-size: 1rem; }      /* 16px */
.text-lg { font-size: 1.125rem; }    /* 18px */
.text-xl { font-size: 1.25rem; }     /* 20px */
.text-2xl { font-size: 1.5rem; }     /* 24px */
.text-3xl { font-size: 1.875rem; }   /* 30px */
.text-4xl { font-size: 2.25rem; }    /* 36px */

/* Font Weights */
.font-normal { font-weight: 400; }
.font-medium { font-weight: 500; }
.font-semibold { font-weight: 600; }
.font-bold { font-weight: 700; }
```

### 3. Spacing System

```css
/* Spacing Scale (based on 4px) */
.space-1 { margin/padding: 0.25rem; }  /* 4px */
.space-2 { margin/padding: 0.5rem; }   /* 8px */
.space-3 { margin/padding: 0.75rem; }  /* 12px */
.space-4 { margin/padding: 1rem; }     /* 16px */
.space-5 { margin/padding: 1.25rem; }  /* 20px */
.space-6 { margin/padding: 1.5rem; }   /* 24px */
.space-8 { margin/padding: 2rem; }     /* 32px */
.space-10 { margin/padding: 2.5rem; }  /* 40px */
.space-12 { margin/padding: 3rem; }    /* 48px */
.space-16 { margin/padding: 4rem; }    /* 64px */
```

### 4. Button Styles

```css
/* Primary Button */
.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  border: none;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-primary:active {
  transform: translateY(0);
}

/* Secondary Button */
.btn-secondary {
  background: white;
  color: #667eea;
  border: 2px solid #667eea;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: #f0f4ff;
}

/* Danger Button */
.btn-danger {
  background: #ef4444;
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  border: none;
  font-weight: 600;
  cursor: pointer;
}

.btn-danger:hover {
  background: #dc2626;
}
```

### 5. Card Styles

```css
.card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 20px;
  transition: box-shadow 0.3s;
}

.card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.card-header {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 16px;
  color: #111827;
}

.card-body {
  color: #6b7280;
  line-height: 1.6;
}
```

---

## Security Implementation

### 1. Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper Functions
    function isAuthenticated() {
      return request.auth != null;
    }

    function getUserData() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data;
    }

    function isStudent() {
      return isAuthenticated() && getUserData().role == 'student';
    }

    function isTeacher() {
      return isAuthenticated() && getUserData().role == 'teacher';
    }

    function isJudge() {
      return isAuthenticated() && getUserData().role == 'judge';
    }

    function isAdmin() {
      return isAuthenticated() && getUserData().role == 'admin';
    }

    function isOwner(ownerId) {
      return isAuthenticated() && request.auth.uid == ownerId;
    }

    // Users Collection
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() && request.auth.uid == userId;
      allow update: if isOwner(userId) || isAdmin();
      allow delete: if isAdmin();
    }

    // Videos Collection
    match /videos/{videoId} {
      allow read: if isAuthenticated();

      allow create: if isAuthenticated() && (
        isStudent() || isTeacher() || isAdmin()
      );

      allow update: if isOwner(resource.data.uploaderId) || isAdmin() || (
        isTeacher() &&
        resource.data.uploaderSchool == getUserData().schoolName &&
        request.resource.data.diff(resource.data).affectedKeys()
          .hasOnly(['status', 'approvedBy', 'approvedAt'])
      );

      allow delete: if isOwner(resource.data.uploaderId) || isAdmin();
    }

    // Evaluations Collection
    match /evaluations/{evalId} {
      allow read: if isAuthenticated();

      allow create: if isAuthenticated() && (
        isTeacher() || isJudge() || isAdmin()
      );

      allow update: if isOwner(resource.data.evaluatorId) || isAdmin();
      allow delete: if isOwner(resource.data.evaluatorId) || isAdmin();
    }

    // Notifications Collection
    match /notifications/{notificationId} {
      allow read: if isAuthenticated() &&
        resource.data.userId == request.auth.uid;

      allow create: if isAuthenticated();

      allow update: if isAuthenticated() &&
        resource.data.userId == request.auth.uid;

      allow delete: if isAuthenticated() &&
        resource.data.userId == request.auth.uid;
    }

    // Schools Collection
    match /schools/{schoolId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin();
    }
  }
}
```

### 2. Storage Security Rules

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {

    // Videos
    match /videos/{videoId}/{fileName} {
      allow read: if request.auth != null;

      allow write: if request.auth != null &&
        request.resource.size < 100 * 1024 * 1024 &&  // Max 100MB
        request.resource.contentType.matches('video/.*');
    }

    // Thumbnails
    match /thumbnails/{videoId}/{fileName} {
      allow read: if request.auth != null;

      allow write: if request.auth != null &&
        request.resource.size < 5 * 1024 * 1024 &&  // Max 5MB
        request.resource.contentType.matches('image/.*');
    }
  }
}
```

### 3. Input Validation

```javascript
// Form Validation Utilities
const validators = {
  email: (value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  },

  password: (value) => {
    return value.length >= 6;
  },

  required: (value) => {
    return value !== null && value !== undefined && value.toString().trim() !== '';
  },

  maxLength: (value, max) => {
    return value.length <= max;
  },

  minLength: (value, min) => {
    return value.length >= min;
  },

  fileSize: (file, maxSizeInMB) => {
    const maxBytes = maxSizeInMB * 1024 * 1024;
    return file.size <= maxBytes;
  },

  fileType: (file, allowedTypes) => {
    return allowedTypes.some(type => file.type.includes(type));
  }
};

// Usage Example
const validateUploadForm = (formData) => {
  const errors = {};

  if (!validators.required(formData.title)) {
    errors.title = 'Title is required';
  } else if (!validators.maxLength(formData.title, 100)) {
    errors.title = 'Title must be less than 100 characters';
  }

  if (!validators.required(formData.description)) {
    errors.description = 'Description is required';
  } else if (!validators.minLength(formData.description, 20)) {
    errors.description = 'Description must be at least 20 characters';
  }

  if (!formData.videoFile) {
    errors.videoFile = 'Video file is required';
  } else {
    if (!validators.fileSize(formData.videoFile, 100)) {
      errors.videoFile = 'Video file must be less than 100MB';
    }
    if (!validators.fileType(formData.videoFile, ['video'])) {
      errors.videoFile = 'Only video files are allowed';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};
```

---

## Performance Optimizations

### 1. Lazy Loading Components

```javascript
import { lazy, Suspense } from 'react';

// Lazy load heavy components
const AdminPanel = lazy(() => import('./components/AdminPanel'));
const DiscoveryScreen = lazy(() => import('./components/DiscoveryScreen'));

// Usage with Suspense
<Suspense fallback={<div>Loading...</div>}>
  {showAdmin && <AdminPanel />}
</Suspense>
```

### 2. Memoization

```javascript
import { useMemo, useCallback } from 'react';

// Memoize expensive calculations
const VideoFeed = ({ videos, evaluations }) => {
  const sortedVideos = useMemo(() => {
    return videos.sort((a, b) =>
      new Date(b.createdAt) - new Date(a.createdAt)
    );
  }, [videos]);

  const handleVideoClick = useCallback((videoId) => {
    // Handle click
  }, []);

  // ...
}
```

### 3. Pagination

```javascript
const VIDEOS_PER_PAGE = 12;

const DiscoveryScreen = ({ videos }) => {
  const [page, setPage] = useState(1);

  const paginatedVideos = useMemo(() => {
    const start = (page - 1) * VIDEOS_PER_PAGE;
    const end = start + VIDEOS_PER_PAGE;
    return videos.slice(start, end);
  }, [videos, page]);

  const totalPages = Math.ceil(videos.length / VIDEOS_PER_PAGE);

  return (
    <>
      <VideoGrid videos={paginatedVideos} />
      <Pagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />
    </>
  );
};
```

### 4. Image Optimization

```javascript
// Thumbnail generation with compression
const generateThumbnail = (videoFile) => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    video.onloadedmetadata = () => {
      // Limit thumbnail size
      const maxWidth = 640;
      const maxHeight = 360;

      const aspectRatio = video.videoWidth / video.videoHeight;
      let width = maxWidth;
      let height = maxHeight;

      if (aspectRatio > maxWidth / maxHeight) {
        height = maxWidth / aspectRatio;
      } else {
        width = maxHeight * aspectRatio;
      }

      canvas.width = width;
      canvas.height = height;

      video.currentTime = 1;
    };

    video.onseeked = () => {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Compress to JPEG with 80% quality
      canvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/jpeg', 0.8);
    };

    video.src = URL.createObjectURL(videoFile);
  });
};
```

### 5. Firestore Query Optimization

```javascript
// Use composite indexes for complex queries
const getVideosOptimized = async (category, limit = 20) => {
  const q = query(
    collection(db, 'videos'),
    where('status', '==', 'active'),
    where('category', '==', category),
    orderBy('createdAt', 'desc'),
    limit(limit)  // Limit results to reduce data transfer
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data());
};

// Cache frequently accessed data
const videoCache = new Map();

const getCachedVideo = async (videoId) => {
  if (videoCache.has(videoId)) {
    return videoCache.get(videoId);
  }

  const videoDoc = await getDoc(doc(db, 'videos', videoId));
  const videoData = videoDoc.data();

  videoCache.set(videoId, videoData);
  return videoData;
};
```

---

## Conclusion

This Low-Level Design document provides comprehensive implementation specifications for the ScienceVerse platform. It covers:

- **Component Design:** Detailed specifications for all major components
- **Data Structures:** Complete object definitions
- **Algorithms:** Key business logic implementations
- **State Management:** Global and local state patterns
- **API Integration:** Firebase service integration
- **UI Specifications:** Design system and styling
- **Security:** Multi-layer security implementation
- **Performance:** Optimization strategies

This document should be used alongside the HLD and Architecture documents for complete system understanding and implementation.
