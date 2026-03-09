# ScienceVerse - Design Patterns

## Table of Contents
- [Overview](#overview)
- [Architectural Patterns](#architectural-patterns)
- [Creational Patterns](#creational-patterns)
- [Structural Patterns](#structural-patterns)
- [Behavioral Patterns](#behavioral-patterns)
- [React-Specific Patterns](#react-specific-patterns)
- [State Management Patterns](#state-management-patterns)
- [Data Access Patterns](#data-access-patterns)
- [Security Patterns](#security-patterns)
- [Performance Patterns](#performance-patterns)
- [Pattern Selection Rationale](#pattern-selection-rationale)

---

## Overview

This document describes all design patterns used in the ScienceVerse platform, explaining their implementation, benefits, and rationale for selection.

### Pattern Categories

```
┌─────────────────────────────────────────────────────────┐
│              ScienceVerse Design Patterns               │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Architectural Patterns                                 │
│  ├─ Three-Tier Architecture                            │
│  ├─ Backend as a Service (BaaS)                        │
│  └─ Single Page Application (SPA)                      │
│                                                         │
│  Creational Patterns                                    │
│  ├─ Singleton                                          │
│  ├─ Factory                                            │
│  └─ Builder                                            │
│                                                         │
│  Structural Patterns                                    │
│  ├─ Composite                                          │
│  ├─ Adapter                                            │
│  └─ Facade                                             │
│                                                         │
│  Behavioral Patterns                                    │
│  ├─ Observer                                           │
│  ├─ Strategy                                           │
│  ├─ Command                                            │
│  └─ State                                              │
│                                                         │
│  React-Specific Patterns                               │
│  ├─ Container/Presentational                           │
│  ├─ Higher-Order Components                            │
│  ├─ Render Props (via Context)                        │
│  ├─ Compound Components                                │
│  └─ Custom Hooks                                       │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Architectural Patterns

### 1. Three-Tier Architecture

**Description:** Separation of concerns into Presentation, Application, and Data layers.

**Implementation:**

```
┌─────────────────────────────────────────┐
│      PRESENTATION LAYER                 │
│  ┌───────────────────────────────────┐  │
│  │  React Components                 │  │
│  │  - VideoPlayer.js                 │  │
│  │  - DiscoveryScreen.js             │  │
│  │  - UploadScreen.js                │  │
│  │  - EvaluationForm.js              │  │
│  └───────────────────────────────────┘  │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│      APPLICATION LAYER                  │
│  ┌───────────────────────────────────┐  │
│  │  Firebase Services                │  │
│  │  - Authentication                 │  │
│  │  - Firestore Queries              │  │
│  │  - Storage Operations             │  │
│  │  - Business Logic                 │  │
│  └───────────────────────────────────┘  │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│      DATA LAYER                         │
│  ┌───────────────────────────────────┐  │
│  │  Firebase Backend                 │  │
│  │  - Firestore Database             │  │
│  │  - Cloud Storage                  │  │
│  │  - Security Rules                 │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

**Benefits:**
- ✅ Clear separation of concerns
- ✅ Independent layer development
- ✅ Easier testing and maintenance
- ✅ Technology flexibility per layer

**Example:**
```javascript
// Presentation Layer (VideoPlayer.js)
const VideoPlayer = ({ video, onEvaluate }) => {
  // UI rendering only
  return <video src={video.videoUrl} />;
};

// Application Layer (services/videoService.js)
export const getActiveVideos = async () => {
  const q = query(
    collection(db, 'videos'),
    where('status', '==', 'active')
  );
  return await getDocs(q);
};

// Data Layer (firestore.rules)
match /videos/{videoId} {
  allow read: if isAuthenticated();
}
```

---

### 2. Backend as a Service (BaaS)

**Description:** Leveraging Firebase as a managed backend platform.

**Implementation:**

```javascript
// firebase.js - Single configuration point
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  // ...
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
```

**Benefits:**
- ✅ No server infrastructure to manage
- ✅ Auto-scaling
- ✅ Built-in security
- ✅ Real-time capabilities
- ✅ Pay-as-you-go pricing

**Rationale:**
- Rapid development (MVP to market in weeks)
- Focus on features, not infrastructure
- Production-ready security and scalability
- Cost-effective for startups

---

### 3. Single Page Application (SPA)

**Description:** Client-side routing without full page reloads.

**Implementation:**

```javascript
// App.js
const App = () => {
  const [currentTab, setCurrentTab] = useState('home');

  const renderScreen = () => {
    switch (currentTab) {
      case 'home':
        return <VideoFeed videos={videos} />;
      case 'discover':
        return <DiscoveryScreen videos={videos} />;
      case 'upload':
        return <UploadScreen currentUser={currentUser} />;
      case 'admin':
        return <AdminPanel videos={videos} />;
      default:
        return <VideoFeed videos={videos} />;
    }
  };

  return (
    <div className="app">
      <Navigation currentTab={currentTab} onTabChange={setCurrentTab} />
      {renderScreen()}
    </div>
  );
};
```

**Benefits:**
- ✅ Instant navigation (no page reloads)
- ✅ Better user experience
- ✅ Reduced server load
- ✅ Easier state management

---

## Creational Patterns

### 1. Singleton Pattern

**Description:** Ensure only one instance of a class exists.

**Implementation: Firebase Services**

```javascript
// firebase.js
const app = initializeApp(firebaseConfig);  // Single instance

// Export singleton instances
export const auth = getAuth(app);      // One auth instance
export const db = getFirestore(app);   // One db instance
export const storage = getStorage(app); // One storage instance

// Usage across the app
import { db } from './firebase';  // Always same instance
```

**Benefits:**
- ✅ Single connection pool
- ✅ Consistent state
- ✅ Reduced memory usage
- ✅ Global access point

**Why This Pattern:**
Firebase requires single initialized instance to manage connection pooling, caching, and authentication state efficiently.

---

### 2. Factory Pattern

**Description:** Create objects without specifying exact class.

**Implementation: Notification Factory**

```javascript
// utils/notificationFactory.js
export const createNotification = (type, data) => {
  const baseNotification = {
    id: `notif_${Date.now()}_${Math.random().toString(36)}`,
    createdAt: new Date().toISOString(),
    read: false
  };

  switch (type) {
    case 'VIDEO_APPROVED':
      return {
        ...baseNotification,
        userId: data.uploaderId,
        title: 'Video Approved!',
        message: `Your video "${data.videoTitle}" has been approved`,
        icon: '✅',
        type: 'approval'
      };

    case 'NEW_EVALUATION':
      return {
        ...baseNotification,
        userId: data.uploaderId,
        title: 'New Evaluation Received',
        message: `${data.evaluatorName} rated your video`,
        icon: '⭐',
        type: 'evaluation'
      };

    case 'BADGE_EARNED':
      return {
        ...baseNotification,
        userId: data.userId,
        title: 'Badge Earned!',
        message: `Congratulations! You earned "${data.badgeName}"`,
        icon: '🏆',
        type: 'badge'
      };

    case 'SYSTEM_ANNOUNCEMENT':
      return {
        ...baseNotification,
        userId: data.userId,
        title: data.title,
        message: data.message,
        icon: '📢',
        type: 'announcement'
      };

    default:
      throw new Error(`Unknown notification type: ${type}`);
  }
};

// Usage
const notification = createNotification('VIDEO_APPROVED', {
  uploaderId: 'user123',
  videoTitle: 'Volcano Experiment'
});
```

**Benefits:**
- ✅ Consistent notification structure
- ✅ Easy to add new types
- ✅ Centralized notification logic
- ✅ Type safety and validation

---

### 3. Builder Pattern

**Description:** Construct complex objects step by step.

**Implementation: Video Upload Builder**

```javascript
// utils/VideoBuilder.js
class VideoBuilder {
  constructor() {
    this.video = {
      videoId: `video_${Date.now()}_${Math.random().toString(36)}`,
      createdAt: new Date().toISOString(),
      views: 0,
      likes: 0
    };
  }

  setTitle(title) {
    this.video.title = title;
    return this;
  }

  setDescription(description) {
    this.video.description = description;
    return this;
  }

  setCategory(category) {
    this.video.category = category;
    return this;
  }

  setVideoUrl(url) {
    this.video.videoUrl = url;
    return this;
  }

  setThumbnailUrl(url) {
    this.video.thumbnailUrl = url;
    return this;
  }

  setDuration(duration) {
    this.video.duration = duration;
    return this;
  }

  setUploader(user) {
    this.video.uploaderId = user.uid;
    this.video.uploaderName = user.name;
    this.video.uploaderSchool = user.schoolName;
    return this;
  }

  setStatus(user) {
    // Admins auto-approve
    this.video.status = user.role === 'admin' ? 'active' : 'pending';
    return this;
  }

  build() {
    // Validate required fields
    const required = ['title', 'description', 'category', 'videoUrl', 'uploaderId'];
    for (const field of required) {
      if (!this.video[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
    return this.video;
  }
}

// Usage
const videoData = new VideoBuilder()
  .setTitle('Volcano Science')
  .setDescription('Learn about chemical reactions')
  .setCategory('Chemistry')
  .setVideoUrl(downloadURL)
  .setThumbnailUrl(thumbnailURL)
  .setDuration(120)
  .setUploader(currentUser)
  .setStatus(currentUser)
  .build();

await addDoc(collection(db, 'videos'), videoData);
```

**Benefits:**
- ✅ Fluent interface
- ✅ Required field validation
- ✅ Step-by-step construction
- ✅ Immutable result object

---

## Structural Patterns

### 1. Composite Pattern

**Description:** Treat individual objects and compositions uniformly.

**Implementation: Component Tree**

```javascript
// App.js - Root composite
const App = () => {
  return (
    <div className="app">
      <Header />              {/* Composite */}
      <MainContent />         {/* Composite */}
      <Navigation />          {/* Composite */}
    </div>
  );
};

// MainContent.js - Intermediate composite
const MainContent = () => {
  return (
    <div className="main-content">
      {currentTab === 'home' && <VideoFeed />}     {/* Composite */}
      {currentTab === 'discover' && <DiscoveryScreen />}  {/* Composite */}
    </div>
  );
};

// VideoFeed.js - Intermediate composite
const VideoFeed = ({ videos }) => {
  return (
    <div className="video-feed">
      {videos.map(video => (
        <VideoPlayer key={video.videoId} video={video} />  {/* Leaf */}
      ))}
    </div>
  );
};

// VideoPlayer.js - Leaf component
const VideoPlayer = ({ video }) => {
  return <video src={video.videoUrl} />;  // Atomic component
};
```

**Benefits:**
- ✅ Uniform interface for all components
- ✅ Recursive composition
- ✅ Easy to add new components
- ✅ Natural React component hierarchy

---

### 2. Adapter Pattern

**Description:** Convert interface of a class into another interface.

**Implementation: Firebase Timestamp Adapter**

```javascript
// utils/dateAdapter.js

// Adapter for Firestore Timestamp
export const timestampToDate = (timestamp) => {
  if (!timestamp) return new Date();

  // Firestore Timestamp has toDate() method
  if (timestamp.toDate && typeof timestamp.toDate === 'function') {
    return timestamp.toDate();
  }

  // Already a Date object
  if (timestamp instanceof Date) {
    return timestamp;
  }

  // ISO string
  if (typeof timestamp === 'string') {
    return new Date(timestamp);
  }

  // Unix timestamp
  if (typeof timestamp === 'number') {
    return new Date(timestamp);
  }

  return new Date();
};

// Usage in components
const VideoCard = ({ video }) => {
  const date = timestampToDate(video.createdAt);
  const formattedDate = date.toLocaleDateString();

  return <div>Uploaded: {formattedDate}</div>;
};

// Adapter for Date to Firestore Timestamp
export const dateToTimestamp = (date) => {
  if (date instanceof Date) {
    return Timestamp.fromDate(date);
  }

  if (typeof date === 'string') {
    return Timestamp.fromDate(new Date(date));
  }

  return Timestamp.now();
};
```

**Benefits:**
- ✅ Consistent date handling
- ✅ Handles multiple formats
- ✅ Isolates Firebase-specific types
- ✅ Easy to test and maintain

---

### 3. Facade Pattern

**Description:** Provide simplified interface to complex subsystem.

**Implementation: Video Service Facade**

```javascript
// services/videoService.js

// Facade that simplifies complex Firebase operations
class VideoService {
  // Simple interface for uploading video
  async uploadVideo(file, metadata, currentUser, onProgress) {
    // Complex multi-step process hidden behind simple method
    try {
      // 1. Generate video ID
      const videoId = this._generateVideoId();

      // 2. Upload video file
      const videoUrl = await this._uploadVideoFile(file, videoId, onProgress);

      // 3. Generate and upload thumbnail
      const thumbnailUrl = await this._generateAndUploadThumbnail(file, videoId);

      // 4. Extract video duration
      const duration = await this._getVideoDuration(file);

      // 5. Create Firestore document
      const videoData = this._buildVideoData({
        videoId,
        videoUrl,
        thumbnailUrl,
        duration,
        metadata,
        currentUser
      });

      await this._saveToFirestore(videoData);

      // 6. Send notifications
      await this._notifyAdmins(videoData);

      return { success: true, videoId };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Simple interface for getting videos
  async getActiveVideos(filters = {}) {
    const { category, sortBy, limit = 20 } = filters;

    let q = query(
      collection(db, 'videos'),
      where('status', '==', 'active')
    );

    if (category && category !== 'All') {
      q = query(q, where('category', '==', category));
    }

    if (sortBy === 'newest') {
      q = query(q, orderBy('createdAt', 'desc'));
    } else if (sortBy === 'topRated') {
      q = query(q, orderBy('averageScore', 'desc'));
    }

    q = query(q, limit(limit));

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  // Private helper methods (complex implementation details)
  _generateVideoId() { /* ... */ }
  _uploadVideoFile(file, videoId, onProgress) { /* ... */ }
  _generateAndUploadThumbnail(file, videoId) { /* ... */ }
  _getVideoDuration(file) { /* ... */ }
  _buildVideoData(params) { /* ... */ }
  _saveToFirestore(data) { /* ... */ }
  _notifyAdmins(video) { /* ... */ }
}

export const videoService = new VideoService();

// Usage - Simple interface hides complexity
const handleUpload = async () => {
  const result = await videoService.uploadVideo(
    videoFile,
    { title, description, category },
    currentUser,
    (progress) => setUploadProgress(progress)
  );

  if (result.success) {
    showToast('Upload successful!');
  } else {
    showToast(`Upload failed: ${result.error}`);
  }
};
```

**Benefits:**
- ✅ Simplified interface for complex operations
- ✅ Hides implementation details
- ✅ Easy to use and understand
- ✅ Centralized business logic

---

## Behavioral Patterns

### 1. Observer Pattern

**Description:** Define one-to-many dependency where observers are notified of state changes.

**Implementation: React Context + useState**

```javascript
// context/UserContext.js

// Subject
export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  // Observable state
  const [currentUser, setCurrentUser] = useState(null);

  // Notify all observers when state changes
  const login = (user) => {
    setCurrentUser(user);  // Notifies all observers
  };

  const logout = () => {
    setCurrentUser(null);  // Notifies all observers
  };

  return (
    <UserContext.Provider value={{ currentUser, login, logout }}>
      {children}
    </UserContext.Provider>
  );
};

// Observer 1: Header component
const Header = () => {
  const { currentUser } = useContext(UserContext);  // Subscribes to changes

  return (
    <div>
      {currentUser ? `Welcome, ${currentUser.name}` : 'Please login'}
    </div>
  );
};

// Observer 2: Navigation component
const Navigation = () => {
  const { currentUser } = useContext(UserContext);  // Subscribes to changes

  return (
    <nav>
      {currentUser?.role === 'admin' && <Link to="/admin">Admin</Link>}
    </nav>
  );
};

// Observer 3: VideoPlayer component
const VideoPlayer = ({ video }) => {
  const { currentUser } = useContext(UserContext);  // Subscribes to changes

  const canEvaluate = currentUser && currentUser.uid !== video.uploaderId;

  return (
    <div>
      <video src={video.videoUrl} />
      {canEvaluate && <button>Evaluate</button>}
    </div>
  );
};
```

**Flow:**
```
UserContext (Subject)
     │
     ├─ currentUser state changes (login/logout)
     │
     ├──> Header (Observer) - Re-renders
     │
     ├──> Navigation (Observer) - Re-renders
     │
     └──> VideoPlayer (Observer) - Re-renders
```

**Benefits:**
- ✅ Loose coupling between components
- ✅ Automatic updates on state change
- ✅ No prop drilling
- ✅ Centralized state management

---

### 2. Strategy Pattern

**Description:** Define family of algorithms, make them interchangeable.

**Implementation: Video Sorting Strategies**

```javascript
// utils/sortingStrategies.js

// Strategy interface
class SortStrategy {
  sort(videos) {
    throw new Error('Method not implemented');
  }
}

// Concrete strategies
class NewestFirstStrategy extends SortStrategy {
  sort(videos) {
    return [...videos].sort((a, b) =>
      new Date(b.createdAt) - new Date(a.createdAt)
    );
  }
}

class MostPopularStrategy extends SortStrategy {
  sort(videos) {
    return [...videos].sort((a, b) =>
      (b.views || 0) - (a.views || 0)
    );
  }
}

class TopRatedStrategy extends SortStrategy {
  sort(videos) {
    return [...videos].sort((a, b) =>
      (b.averageScore || 0) - (a.averageScore || 0)
    );
  }
}

class TrendingStrategy extends SortStrategy {
  sort(videos) {
    return [...videos].sort((a, b) => {
      const scoreA = this._calculateTrendingScore(a);
      const scoreB = this._calculateTrendingScore(b);
      return scoreB - scoreA;
    });
  }

  _calculateTrendingScore(video) {
    const daysSinceUpload = (Date.now() - new Date(video.createdAt)) / (1000 * 60 * 60 * 24);
    const recencyScore = Math.max(0, 1 - (daysSinceUpload / 7));
    const engagementScore = Math.log10((video.views || 0) + 1) + ((video.evaluationCount || 0) * 2);
    const qualityScore = video.averageScore || 0;

    return (recencyScore * 0.3) + (engagementScore * 0.4) + (qualityScore * 0.3);
  }
}

// Strategy factory
export const getSortStrategy = (sortBy) => {
  switch (sortBy) {
    case 'newest':
      return new NewestFirstStrategy();
    case 'popular':
      return new MostPopularStrategy();
    case 'topRated':
      return new TopRatedStrategy();
    case 'trending':
      return new TrendingStrategy();
    default:
      return new NewestFirstStrategy();
  }
};

// Context that uses strategy
class VideoSorter {
  constructor(strategy) {
    this.strategy = strategy;
  }

  setStrategy(strategy) {
    this.strategy = strategy;
  }

  sortVideos(videos) {
    return this.strategy.sort(videos);
  }
}

// Usage in React component
const DiscoveryScreen = ({ videos }) => {
  const [sortBy, setSortBy] = useState('newest');

  const sortedVideos = useMemo(() => {
    const strategy = getSortStrategy(sortBy);
    const sorter = new VideoSorter(strategy);
    return sorter.sortVideos(videos);
  }, [videos, sortBy]);

  return (
    <div>
      <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
        <option value="newest">Newest First</option>
        <option value="popular">Most Popular</option>
        <option value="topRated">Top Rated</option>
        <option value="trending">Trending</option>
      </select>

      <VideoGrid videos={sortedVideos} />
    </div>
  );
};
```

**Benefits:**
- ✅ Easy to add new sorting algorithms
- ✅ Runtime strategy switching
- ✅ Open/Closed principle (open for extension, closed for modification)
- ✅ Testable strategies in isolation

---

### 3. Command Pattern

**Description:** Encapsulate request as object.

**Implementation: Video Actions**

```javascript
// commands/VideoCommands.js

// Command interface
class Command {
  execute() {
    throw new Error('Execute method not implemented');
  }

  undo() {
    throw new Error('Undo method not implemented');
  }
}

// Concrete commands
class ApproveVideoCommand extends Command {
  constructor(videoId, approverName, videoService) {
    super();
    this.videoId = videoId;
    this.approverName = approverName;
    this.videoService = videoService;
    this.previousStatus = null;
  }

  async execute() {
    // Save previous state for undo
    const video = await this.videoService.getVideo(this.videoId);
    this.previousStatus = video.status;

    // Execute command
    await this.videoService.updateVideoStatus(this.videoId, {
      status: 'active',
      approvedBy: this.approverName,
      approvedAt: new Date().toISOString()
    });

    // Send notification
    await this.videoService.notifyVideoApproval(this.videoId);
  }

  async undo() {
    // Revert to previous status
    await this.videoService.updateVideoStatus(this.videoId, {
      status: this.previousStatus,
      approvedBy: null,
      approvedAt: null
    });
  }
}

class RejectVideoCommand extends Command {
  constructor(videoId, rejectorName, reason, videoService) {
    super();
    this.videoId = videoId;
    this.rejectorName = rejectorName;
    this.reason = reason;
    this.videoService = videoService;
    this.previousStatus = null;
  }

  async execute() {
    const video = await this.videoService.getVideo(this.videoId);
    this.previousStatus = video.status;

    await this.videoService.updateVideoStatus(this.videoId, {
      status: 'rejected',
      rejectedBy: this.rejectorName,
      rejectedAt: new Date().toISOString(),
      rejectionReason: this.reason
    });

    await this.videoService.notifyVideoRejection(this.videoId, this.reason);
  }

  async undo() {
    await this.videoService.updateVideoStatus(this.videoId, {
      status: this.previousStatus,
      rejectedBy: null,
      rejectedAt: null,
      rejectionReason: null
    });
  }
}

// Command invoker
class VideoCommandInvoker {
  constructor() {
    this.history = [];
    this.currentIndex = -1;
  }

  async executeCommand(command) {
    await command.execute();

    // Clear redo history
    this.history = this.history.slice(0, this.currentIndex + 1);

    // Add to history
    this.history.push(command);
    this.currentIndex++;
  }

  async undo() {
    if (this.currentIndex >= 0) {
      const command = this.history[this.currentIndex];
      await command.undo();
      this.currentIndex--;
    }
  }

  async redo() {
    if (this.currentIndex < this.history.length - 1) {
      this.currentIndex++;
      const command = this.history[this.currentIndex];
      await command.execute();
    }
  }

  canUndo() {
    return this.currentIndex >= 0;
  }

  canRedo() {
    return this.currentIndex < this.history.length - 1;
  }
}

// Usage in AdminPanel
const AdminPanel = () => {
  const [commandInvoker] = useState(() => new VideoCommandInvoker());

  const handleApprove = async (videoId) => {
    const command = new ApproveVideoCommand(videoId, currentUser.name, videoService);
    await commandInvoker.executeCommand(command);
    showToast('Video approved');
  };

  const handleReject = async (videoId, reason) => {
    const command = new RejectVideoCommand(videoId, currentUser.name, reason, videoService);
    await commandInvoker.executeCommand(command);
    showToast('Video rejected');
  };

  const handleUndo = async () => {
    if (commandInvoker.canUndo()) {
      await commandInvoker.undo();
      showToast('Action undone');
    }
  };

  return (
    <div>
      {/* Video list */}
      {pendingVideos.map(video => (
        <div key={video.id}>
          <button onClick={() => handleApprove(video.id)}>Approve</button>
          <button onClick={() => handleReject(video.id, 'Reason...')}>Reject</button>
        </div>
      ))}

      {/* Undo/Redo buttons */}
      <button onClick={handleUndo} disabled={!commandInvoker.canUndo()}>
        Undo
      </button>
    </div>
  );
};
```

**Benefits:**
- ✅ Undo/redo functionality
- ✅ Command queuing
- ✅ Logging and audit trail
- ✅ Macro commands (batch operations)

---

### 4. State Pattern

**Description:** Object alters behavior when internal state changes.

**Implementation: Video Upload State Machine**

```javascript
// states/UploadStates.js

// State interface
class UploadState {
  constructor(context) {
    this.context = context;
  }

  start() {
    throw new Error('Method not implemented');
  }

  pause() {
    throw new Error('Method not implemented');
  }

  resume() {
    throw new Error('Method not implemented');
  }

  cancel() {
    throw new Error('Method not implemented');
  }

  complete() {
    throw new Error('Method not implemented');
  }

  fail(error) {
    throw new Error('Method not implemented');
  }
}

// Concrete states
class IdleState extends UploadState {
  start() {
    this.context.setState(new UploadingState(this.context));
    this.context.beginUpload();
  }

  pause() {
    throw new Error('Cannot pause when idle');
  }

  resume() {
    throw new Error('Cannot resume when idle');
  }

  cancel() {
    // Already idle, nothing to cancel
  }
}

class UploadingState extends UploadState {
  start() {
    throw new Error('Already uploading');
  }

  pause() {
    this.context.setState(new PausedState(this.context));
    this.context.pauseUpload();
  }

  resume() {
    throw new Error('Already uploading');
  }

  cancel() {
    this.context.setState(new CanceledState(this.context));
    this.context.cancelUpload();
  }

  complete() {
    this.context.setState(new CompletedState(this.context));
    this.context.finalizeUpload();
  }

  fail(error) {
    this.context.setState(new FailedState(this.context, error));
    this.context.handleUploadError(error);
  }
}

class PausedState extends UploadState {
  start() {
    throw new Error('Upload already in progress (paused)');
  }

  pause() {
    // Already paused
  }

  resume() {
    this.context.setState(new UploadingState(this.context));
    this.context.resumeUpload();
  }

  cancel() {
    this.context.setState(new CanceledState(this.context));
    this.context.cancelUpload();
  }
}

class CompletedState extends UploadState {
  start() {
    throw new Error('Upload already completed');
  }

  pause() {
    throw new Error('Cannot pause completed upload');
  }

  resume() {
    throw new Error('Cannot resume completed upload');
  }

  cancel() {
    throw new Error('Cannot cancel completed upload');
  }
}

class FailedState extends UploadState {
  constructor(context, error) {
    super(context);
    this.error = error;
  }

  start() {
    // Retry upload
    this.context.setState(new IdleState(this.context));
    this.context.state.start();
  }

  cancel() {
    this.context.setState(new CanceledState(this.context));
  }
}

class CanceledState extends UploadState {
  start() {
    // Start new upload
    this.context.setState(new IdleState(this.context));
    this.context.state.start();
  }
}

// Context
class UploadContext {
  constructor() {
    this.state = new IdleState(this);
    this.uploadTask = null;
    this.progress = 0;
  }

  setState(state) {
    this.state = state;
    this.notifyObservers();
  }

  start() {
    this.state.start();
  }

  pause() {
    this.state.pause();
  }

  resume() {
    this.state.resume();
  }

  cancel() {
    this.state.cancel();
  }

  // Context-specific methods
  beginUpload() {
    // Start actual upload
    console.log('Beginning upload...');
  }

  pauseUpload() {
    if (this.uploadTask) {
      this.uploadTask.pause();
    }
  }

  resumeUpload() {
    if (this.uploadTask) {
      this.uploadTask.resume();
    }
  }

  cancelUpload() {
    if (this.uploadTask) {
      this.uploadTask.cancel();
    }
    this.progress = 0;
  }

  finalizeUpload() {
    this.progress = 100;
    console.log('Upload completed!');
  }

  handleUploadError(error) {
    console.error('Upload failed:', error);
  }

  notifyObservers() {
    // Notify React components of state change
  }
}

// Usage in React component
const UploadScreen = () => {
  const [uploadContext] = useState(() => new UploadContext());
  const [uploadState, setUploadState] = useState('idle');

  const handleStartUpload = () => {
    try {
      uploadContext.start();
      setUploadState('uploading');
    } catch (error) {
      alert(error.message);
    }
  };

  const handlePauseUpload = () => {
    try {
      uploadContext.pause();
      setUploadState('paused');
    } catch (error) {
      alert(error.message);
    }
  };

  const handleResumeUpload = () => {
    try {
      uploadContext.resume();
      setUploadState('uploading');
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div>
      {uploadState === 'idle' && (
        <button onClick={handleStartUpload}>Start Upload</button>
      )}
      {uploadState === 'uploading' && (
        <button onClick={handlePauseUpload}>Pause Upload</button>
      )}
      {uploadState === 'paused' && (
        <button onClick={handleResumeUpload}>Resume Upload</button>
      )}
    </div>
  );
};
```

**State Diagram:**
```
     ┌─────┐
     │Idle │
     └──┬──┘
        │ start()
        ▼
   ┌────────────┐
   │ Uploading  │◄──────────┐
   └─┬────┬───┬─┘           │
     │    │   │   resume()  │
     │    │   └─────────────┤
     │    │           ┌─────┴───┐
     │    │           │ Paused  │
     │    │           └─────────┘
     │    │ complete()
     │    ▼
     │  ┌───────────┐
     │  │Completed  │
     │  └───────────┘
     │ fail(error)
     ▼
   ┌────────┐
   │Failed  │
   └────────┘
     │ cancel()
     ▼
   ┌─────────┐
   │Canceled │
   └─────────┘
```

**Benefits:**
- ✅ Clean state transitions
- ✅ Prevents invalid state changes
- ✅ Centralized state logic
- ✅ Easy to add new states

---

## React-Specific Patterns

### 1. Container/Presentational Pattern

**Description:** Separate logic (container) from UI (presentational).

**Implementation:**

```javascript
// Presentational Component (VideoCardView.js)
// Pure UI component, no business logic
const VideoCardView = ({
  video,
  averageScore,
  formattedDuration,
  onVideoClick,
  onEvaluateClick
}) => {
  return (
    <div className="video-card" onClick={() => onVideoClick(video)}>
      <img src={video.thumbnailUrl} alt={video.title} />
      <h3>{video.title}</h3>
      <p>{video.uploaderName}</p>
      <div className="video-stats">
        <span>{formattedDuration}</span>
        {averageScore > 0 && <span>⭐ {averageScore}</span>}
      </div>
      {onEvaluateClick && (
        <button onClick={(e) => {
          e.stopPropagation();
          onEvaluateClick(video);
        }}>
          Evaluate
        </button>
      )}
    </div>
  );
};

// Container Component (VideoCardContainer.js)
// Contains logic and state
const VideoCardContainer = ({ video, evaluations, currentUser }) => {
  // Business logic
  const averageScore = useMemo(() => {
    const videoEvals = evaluations.filter(e => e.videoId === video.videoId);
    if (videoEvals.length === 0) return 0;
    const sum = videoEvals.reduce((acc, e) => acc + e.overallScore, 0);
    return (sum / videoEvals.length).toFixed(1);
  }, [evaluations, video.videoId]);

  const formattedDuration = useMemo(() => {
    const minutes = Math.floor(video.duration / 60);
    const seconds = video.duration % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, [video.duration]);

  const canEvaluate = useMemo(() => {
    return currentUser &&
           currentUser.role !== 'student' &&
           currentUser.uid !== video.uploaderId;
  }, [currentUser, video.uploaderId]);

  // Event handlers
  const handleVideoClick = (video) => {
    console.log('Playing video:', video.title);
    // Navigate to video
  };

  const handleEvaluateClick = (video) => {
    console.log('Evaluating video:', video.title);
    // Open evaluation form
  };

  // Render presentational component
  return (
    <VideoCardView
      video={video}
      averageScore={averageScore}
      formattedDuration={formattedDuration}
      onVideoClick={handleVideoClick}
      onEvaluateClick={canEvaluate ? handleEvaluateClick : null}
    />
  );
};
```

**Benefits:**
- ✅ Reusable presentational components
- ✅ Easier testing (test UI separately from logic)
- ✅ Better separation of concerns
- ✅ Cleaner code organization

---

### 2. Higher-Order Component (HOC) Pattern

**Description:** Function that takes component and returns enhanced component.

**Implementation: withAuth HOC**

```javascript
// hoc/withAuth.js

// HOC that adds authentication checks
const withAuth = (WrappedComponent, requiredRole = null) => {
  return (props) => {
    const { currentUser } = useContext(UserContext);
    const navigate = useNavigate();

    useEffect(() => {
      // Redirect if not authenticated
      if (!currentUser) {
        navigate('/login');
        return;
      }

      // Check role if specified
      if (requiredRole && currentUser.role !== requiredRole) {
        navigate('/unauthorized');
        return;
      }
    }, [currentUser, navigate]);

    // Don't render if not authenticated
    if (!currentUser) {
      return <div>Loading...</div>;
    }

    // Check role
    if (requiredRole && currentUser.role !== requiredRole) {
      return <div>Access Denied</div>;
    }

    // Render wrapped component with additional props
    return <WrappedComponent {...props} currentUser={currentUser} />;
  };
};

// Usage

// Component without HOC
const AdminPanelComponent = ({ currentUser, videos }) => {
  return (
    <div>
      <h1>Admin Panel</h1>
      <p>Welcome, {currentUser.name}</p>
      {/* Admin UI */}
    </div>
  );
};

// Enhanced component with HOC
const AdminPanel = withAuth(AdminPanelComponent, 'admin');

// Now AdminPanel automatically:
// 1. Checks if user is authenticated
// 2. Checks if user has 'admin' role
// 3. Redirects if conditions not met
// 4. Passes currentUser as prop

export default AdminPanel;
```

**Benefits:**
- ✅ Reusable authentication logic
- ✅ Keeps components focused on UI
- ✅ Easy to add to any component
- ✅ Centralized access control

---

### 3. Custom Hooks Pattern

**Description:** Extract stateful logic into reusable hooks.

**Implementation: useVideos Hook**

```javascript
// hooks/useVideos.js

const useVideos = (filters = {}) => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadVideos = async () => {
      setLoading(true);
      setError(null);

      try {
        // Build query
        let q = query(
          collection(db, 'videos'),
          where('status', '==', 'active')
        );

        // Apply filters
        if (filters.category && filters.category !== 'All') {
          q = query(q, where('category', '==', filters.category));
        }

        if (filters.sortBy === 'newest') {
          q = query(q, orderBy('createdAt', 'desc'));
        } else if (filters.sortBy === 'topRated') {
          q = query(q, orderBy('averageScore', 'desc'));
        }

        if (filters.limit) {
          q = query(q, limit(filters.limit));
        }

        // Execute query
        const snapshot = await getDocs(q);
        const videosList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setVideos(videosList);
      } catch (err) {
        console.error('Error loading videos:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadVideos();
  }, [filters.category, filters.sortBy, filters.limit]);

  // Helper methods
  const refetch = useCallback(() => {
    setLoading(true);
    // Trigger re-fetch by forcing dependency change
  }, []);

  return { videos, loading, error, refetch };
};

// Usage in multiple components
const VideoFeed = () => {
  const { videos, loading, error } = useVideos({ sortBy: 'newest', limit: 20 });

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <div>
      {videos.map(video => (
        <VideoPlayer key={video.id} video={video} />
      ))}
    </div>
  );
};

const DiscoveryScreen = () => {
  const [category, setCategory] = useState('All');
  const [sortBy, setSortBy] = useState('newest');

  const { videos, loading, error } = useVideos({ category, sortBy });

  return (
    <div>
      <CategoryFilter value={category} onChange={setCategory} />
      <SortDropdown value={sortBy} onChange={setSortBy} />
      {loading ? <LoadingSpinner /> : <VideoGrid videos={videos} />}
    </div>
  );
};
```

**More Custom Hooks:**

```javascript
// hooks/useAuth.js
const useAuth = () => {
  const { currentUser, login, logout } = useContext(UserContext);

  const isAuthenticated = !!currentUser;
  const isAdmin = currentUser?.role === 'admin';
  const isTeacher = currentUser?.role === 'teacher';
  const isStudent = currentUser?.role === 'student';

  return {
    currentUser,
    isAuthenticated,
    isAdmin,
    isTeacher,
    isStudent,
    login,
    logout
  };
};

// hooks/useNotifications.js
const useNotifications = (userId) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!userId) return;

    const loadNotifications = async () => {
      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      const notifList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setNotifications(notifList);
      setUnreadCount(notifList.filter(n => !n.read).length);
    };

    loadNotifications();

    // Refresh every 30 seconds
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [userId]);

  const markAsRead = async (notificationId) => {
    await updateDoc(doc(db, 'notifications', notificationId), {
      read: true
    });

    setNotifications(notifications.map(n =>
      n.id === notificationId ? { ...n, read: true } : n
    ));
    setUnreadCount(Math.max(0, unreadCount - 1));
  };

  return { notifications, unreadCount, markAsRead };
};

// Usage
const Header = () => {
  const { currentUser } = useAuth();
  const { unreadCount } = useNotifications(currentUser?.uid);

  return (
    <header>
      <button className="notification-bell">
        🔔
        {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
      </button>
    </header>
  );
};
```

**Benefits:**
- ✅ Reusable stateful logic
- ✅ Cleaner components
- ✅ Easy to test
- ✅ Composable hooks

---

## State Management Patterns

### 1. Lifting State Up

**Description:** Share state by moving it to closest common ancestor.

**Implementation:**

```javascript
// App.js - Common ancestor
const App = () => {
  // Lifted state
  const [videos, setVideos] = useState([]);
  const [evaluations, setEvaluations] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  // Shared by all child components
  return (
    <div>
      <VideoFeed
        videos={videos}
        evaluations={evaluations}
        currentUser={currentUser}
      />
      <DiscoveryScreen
        videos={videos}
        evaluations={evaluations}
      />
      <AdminPanel
        videos={videos}
        onVideoUpdate={(updatedVideo) => {
          setVideos(videos.map(v =>
            v.id === updatedVideo.id ? updatedVideo : v
          ));
        }}
      />
    </div>
  );
};
```

**Benefits:**
- ✅ Single source of truth
- ✅ Synchronized state across components
- ✅ Predictable data flow

---

### 2. Context for Global State

**Description:** Avoid prop drilling with Context API.

**Implementation:**

```javascript
// context/AppContext.js
export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [videos, setVideos] = useState([]);
  const [evaluations, setEvaluations] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const addVideo = (video) => {
    setVideos([...videos, video]);
  };

  const updateVideo = (videoId, updates) => {
    setVideos(videos.map(v =>
      v.videoId === videoId ? { ...v, ...updates } : v
    ));
  };

  const addEvaluation = (evaluation) => {
    setEvaluations([...evaluations, evaluation]);
  };

  const value = {
    videos,
    evaluations,
    notifications,
    addVideo,
    updateVideo,
    addEvaluation
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

// Usage - No prop drilling
const DeepNestedComponent = () => {
  const { videos, addVideo } = useContext(AppContext);
  // Direct access to global state
};
```

---

## Data Access Patterns

### 1. Repository Pattern

**Description:** Centralize data access logic.

**Implementation:**

```javascript
// repositories/VideoRepository.js
class VideoRepository {
  constructor(db) {
    this.db = db;
    this.collection = 'videos';
  }

  async findById(videoId) {
    const q = query(
      collection(this.db, this.collection),
      where('videoId', '==', videoId)
    );
    const snapshot = await getDocs(q);
    return snapshot.empty ? null : snapshot.docs[0].data();
  }

  async findByStatus(status) {
    const q = query(
      collection(this.db, this.collection),
      where('status', '==', status)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data());
  }

  async findByUploader(uploaderId) {
    const q = query(
      collection(this.db, this.collection),
      where('uploaderId', '==', uploaderId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data());
  }

  async create(videoData) {
    const docRef = await addDoc(collection(this.db, this.collection), videoData);
    return docRef.id;
  }

  async update(videoId, updates) {
    const q = query(
      collection(this.db, this.collection),
      where('videoId', '==', videoId)
    );
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      await updateDoc(snapshot.docs[0].ref, updates);
    }
  }

  async delete(videoId) {
    const q = query(
      collection(this.db, this.collection),
      where('videoId', '==', videoId)
    );
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      await deleteDoc(snapshot.docs[0].ref);
    }
  }
}

// Export singleton instance
export const videoRepository = new VideoRepository(db);

// Usage
const videos = await videoRepository.findByStatus('active');
```

**Benefits:**
- ✅ Centralized data access
- ✅ Easier to change database
- ✅ Consistent query patterns
- ✅ Testable with mocks

---

## Security Patterns

### 1. Defense in Depth

**Description:** Multiple layers of security.

**Implementation:**

```
Layer 1: Client-Side Validation
   ↓
Layer 2: UI-Level Authorization (React)
   ↓
Layer 3: Firebase Security Rules
   ↓
Layer 4: Server-Side Validation (Cloud Functions - Future)
```

**Example:**

```javascript
// Layer 1: Client validation
const validateUpload = (formData) => {
  if (!formData.title || formData.title.length > 100) {
    return { valid: false, error: 'Invalid title' };
  }
  // More validations...
  return { valid: true };
};

// Layer 2: UI authorization
const UploadButton = ({ currentUser }) => {
  const canUpload = ['student', 'teacher', 'admin'].includes(currentUser?.role);

  if (!canUpload) {
    return null;  // Don't show button
  }

  return <button>Upload Video</button>;
};

// Layer 3: Firestore rules
// match /videos/{videoId} {
//   allow create: if isAuthenticated() && (isStudent() || isTeacher() || isAdmin());
// }
```

**Benefits:**
- ✅ Multiple failure points for attackers
- ✅ Comprehensive protection
- ✅ Fail-safe defaults

---

## Performance Patterns

### 1. Memoization Pattern

**Description:** Cache expensive calculations.

**Implementation:**

```javascript
const VideoFeed = ({ videos, evaluations }) => {
  // Memoize expensive sort operation
  const sortedVideos = useMemo(() => {
    return videos.sort((a, b) =>
      new Date(b.createdAt) - new Date(a.createdAt)
    );
  }, [videos]);

  // Memoize expensive score calculation
  const videosWithScores = useMemo(() => {
    return sortedVideos.map(video => {
      const videoEvals = evaluations.filter(e => e.videoId === video.videoId);
      const avgScore = videoEvals.length > 0
        ? videoEvals.reduce((sum, e) => sum + e.overallScore, 0) / videoEvals.length
        : 0;

      return { ...video, calculatedScore: avgScore };
    });
  }, [sortedVideos, evaluations]);

  // Memoize callback
  const handleVideoClick = useCallback((videoId) => {
    console.log('Video clicked:', videoId);
  }, []);

  return (
    <div>
      {videosWithScores.map(video => (
        <VideoCard
          key={video.id}
          video={video}
          onClick={handleVideoClick}
        />
      ))}
    </div>
  );
};
```

---

### 2. Lazy Loading Pattern

**Description:** Load components only when needed.

**Implementation:**

```javascript
// Lazy load heavy components
const AdminPanel = lazy(() => import('./components/AdminPanel'));
const DiscoveryScreen = lazy(() => import('./components/DiscoveryScreen'));
const EvaluationForm = lazy(() => import('./components/EvaluationForm'));

const App = () => {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      {showAdmin && <AdminPanel />}
      {showDiscovery && <DiscoveryScreen />}
      {showEvaluation && <EvaluationForm />}
    </Suspense>
  );
};
```

---

## Pattern Selection Rationale

### Why These Patterns?

**1. Three-Tier Architecture**
- ✅ Clear separation of concerns
- ✅ Industry standard
- ✅ Scales well
- ✅ Easy for new developers to understand

**2. BaaS (Firebase)**
- ✅ Faster time to market (MVP ready in weeks)
- ✅ No infrastructure management
- ✅ Built-in scalability
- ✅ Cost-effective for startups

**3. Observer Pattern (Context)**
- ✅ React's built-in state management
- ✅ No external dependencies
- ✅ Sufficient for current scale
- ✅ Can upgrade to Redux if needed

**4. Strategy Pattern (Sorting)**
- ✅ Multiple sorting algorithms needed
- ✅ Easy to add new sorting methods
- ✅ Testable in isolation
- ✅ Clear, maintainable code

**5. Facade Pattern (Services)**
- ✅ Simplifies complex Firebase operations
- ✅ Easier to test (mock facade)
- ✅ Centralized business logic
- ✅ Future-proof (easy to swap backends)

---

## Conclusion

The ScienceVerse platform implements a carefully selected set of design patterns that provide:

- **Maintainability:** Clear structure and separation of concerns
- **Scalability:** Patterns that grow with the application
- **Testability:** Isolated components and logic
- **Performance:** Optimized rendering and data access
- **Security:** Multiple layers of protection
- **Developer Experience:** Intuitive patterns, easy onboarding

These patterns were chosen based on:
1. **Project requirements** (MVP, rapid development)
2. **Team size** (small team, need simplicity)
3. **Technology stack** (React + Firebase)
4. **Future growth** (patterns that scale)
5. **Industry best practices** (proven patterns)

The result is a robust, maintainable, and scalable application architecture.
