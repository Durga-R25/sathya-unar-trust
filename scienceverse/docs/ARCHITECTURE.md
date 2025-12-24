# ScienceVerse - System Architecture

## Table of Contents
- [Overview](#overview)
- [Application Architecture](#application-architecture)
- [Technical Stack](#technical-stack)
- [System Components](#system-components)
- [Infrastructure Architecture](#infrastructure-architecture)
- [Security Architecture](#security-architecture)

---

## Overview

**ScienceVerse** is a TikTok-style video competition platform for science education, designed to enable students to upload science project videos, receive evaluations from judges/teachers, and compete for recognition through a gamified badge system.

### Key Objectives
- Enable seamless video upload and discovery
- Provide multi-role user management (Students, Teachers, Judges, Admins)
- Implement real-time evaluation and feedback system
- Scale to support thousands of concurrent users
- Ensure data security and role-based access control

---

## Application Architecture

### **1. Three-Tier Architecture**

```
┌─────────────────────────────────────────────────────────┐
│                   PRESENTATION LAYER                    │
│  ┌──────────────────────────────────────────────────┐  │
│  │  React SPA (Single Page Application)            │  │
│  │  - Progressive Web App (PWA)                     │  │
│  │  - Responsive UI Components                      │  │
│  │  - Client-side Routing                           │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────┐
│                   APPLICATION LAYER                     │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Firebase Services                               │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐ │  │
│  │  │ Cloud      │  │ Cloud      │  │ Cloud      │ │  │
│  │  │ Functions  │  │ Firestore  │  │ Storage    │ │  │
│  │  └────────────┘  └────────────┘  └────────────┘ │  │
│  │  ┌────────────┐  ┌────────────┐                 │  │
│  │  │ Auth       │  │ Hosting    │                 │  │
│  │  └────────────┘  └────────────┘                 │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────┐
│                      DATA LAYER                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Firebase Firestore (NoSQL Database)            │  │
│  │  - Users Collection                              │  │
│  │  - Videos Collection                             │  │
│  │  - Evaluations Collection                        │  │
│  │  - Notifications Collection                      │  │
│  │  - Schools Collection                            │  │
│  │                                                  │  │
│  │  Firebase Storage (Object Storage)              │  │
│  │  - Video Files (videos/)                        │  │
│  │  - Thumbnails (thumbnails/)                     │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### **2. Component Architecture**

```
┌──────────────────────────────────────────────────────────┐
│                    React Application                     │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │   Context   │  │  Services   │  │   Utils     │    │
│  │  Providers  │  │  Layer      │  │  Helpers    │    │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘    │
│         │                │                │            │
│  ┌──────▼────────────────▼────────────────▼──────┐    │
│  │           Core Application Logic              │    │
│  └───────────────────────┬───────────────────────┘    │
│                          │                            │
│  ┌───────────────────────▼───────────────────────┐    │
│  │          Feature Components                   │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐     │    │
│  │  │ Video    │ │ Discovery│ │ Evaluation│     │    │
│  │  │ Feed     │ │ Screen   │ │ Panel     │     │    │
│  │  └──────────┘ └──────────┘ └──────────┘     │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐     │    │
│  │  │ Upload   │ │ Admin    │ │ Profile   │     │    │
│  │  │ Screen   │ │ Panel    │ │ Screen    │     │    │
│  │  └──────────┘ └──────────┘ └──────────┘     │    │
│  └───────────────────────────────────────────────┘    │
│                                                          │
│  ┌───────────────────────────────────────────────┐    │
│  │          Shared Components                    │    │
│  │  Navigation, Video Player, Search, Filters   │    │
│  └───────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────┘
```

---

## Technical Stack

### **Frontend**
- **Framework:** React 18.x
- **Language:** JavaScript (ES6+)
- **State Management:** React Context API
- **Routing:** React Router (client-side)
- **Build Tool:** Create React App (Webpack)
- **Styling:** CSS3 with CSS Modules
- **Video Handling:** HTML5 Video API

### **Backend (BaaS - Backend as a Service)**
- **Platform:** Firebase (Google Cloud Platform)
- **Authentication:** Firebase Authentication
- **Database:** Cloud Firestore (NoSQL)
- **Storage:** Firebase Cloud Storage
- **Functions:** Cloud Functions for Firebase (Node.js)
- **Hosting:** Firebase Hosting (CDN)

### **Development Tools**
- **Version Control:** Git
- **Package Manager:** npm
- **Code Quality:** ESLint
- **Deployment:** Firebase CLI

---

## System Components

### **1. Authentication Service**
```
┌────────────────────────────────────────┐
│      Firebase Authentication          │
├────────────────────────────────────────┤
│  • Email/Password Authentication      │
│  • Session Management                 │
│  • Token-based Authorization          │
│  • Role-based Access Control (RBAC)  │
│                                        │
│  User Roles:                          │
│  - Student                            │
│  - Teacher                            │
│  - Judge                              │
│  - Admin                              │
└────────────────────────────────────────┘
```

### **2. Video Management Service**
```
┌────────────────────────────────────────┐
│      Video Management Module           │
├────────────────────────────────────────┤
│  • Video Upload (resumable)           │
│  • Thumbnail Generation               │
│  • Metadata Storage                   │
│  • Video Streaming                    │
│  • Status Management (pending/active) │
│  • Approval Workflow                  │
└────────────────────────────────────────┘
```

### **3. Evaluation Service**
```
┌────────────────────────────────────────┐
│      Evaluation Management             │
├────────────────────────────────────────┤
│  • Multi-dimensional Rating           │
│    - Scientific Clarity               │
│    - Humanity & Care                  │
│    - Real-Life Impact                 │
│    - Original Thinking                │
│  • Aggregate Score Calculation        │
│  • Evaluation History                 │
│  • Role-specific Constraints          │
└────────────────────────────────────────┘
```

### **4. Notification Service**
```
┌────────────────────────────────────────┐
│      Notification System               │
├────────────────────────────────────────┤
│  • Real-time Notifications            │
│  • User-specific Delivery             │
│  • Read/Unread Tracking               │
│  • Multiple Notification Types:       │
│    - Video Approvals                  │
│    - New Evaluations                  │
│    - Badge Achievements               │
│    - System Announcements             │
└────────────────────────────────────────┘
```

### **5. Gamification Service**
```
┌────────────────────────────────────────┐
│      Badges & Achievements             │
├────────────────────────────────────────┤
│  • Badge Calculation Engine           │
│  • Achievement Tracking               │
│  • Leaderboard System                 │
│  • School Rankings                    │
│  • Category-based Competition         │
└────────────────────────────────────────┘
```

---

## Infrastructure Architecture

### **Deployment Architecture**

```
                    ┌─────────────┐
                    │   Users     │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │  Internet   │
                    └──────┬──────┘
                           │
            ┌──────────────▼──────────────┐
            │   Firebase Hosting (CDN)    │
            │   - Global Distribution     │
            │   - SSL/TLS                 │
            │   - Caching                 │
            └──────────────┬──────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
┌───────▼────────┐ ┌──────▼──────┐ ┌────────▼────────┐
│  Firestore     │ │   Cloud     │ │    Cloud        │
│  Database      │ │  Storage    │ │   Functions     │
│  - Multi-      │ │  - Video    │ │  - Server-side  │
│    region      │ │    Files    │ │    Logic        │
│  - Auto-scale  │ │  - Images   │ │  - Triggers     │
└────────────────┘ └─────────────┘ └─────────────────┘
        │                  │                  │
        └──────────────────┼──────────────────┘
                           │
                  ┌────────▼────────┐
                  │  Firebase Auth  │
                  │  - Identity     │
                  │  - RBAC         │
                  └─────────────────┘
```

### **Data Flow Architecture**

```
┌──────────┐         ┌──────────┐         ┌──────────┐
│  Client  │────1───▶│  Auth    │────2───▶│ Firebase │
│  (React) │         │  Check   │         │ Services │
└──────────┘         └──────────┘         └──────────┘
     │                                           │
     │              ┌──────────┐                 │
     └─────3───────▶│  Request │◀────4───────────┘
                    │  Data    │
                    └──────────┘
                         │
                    ┌────▼────┐
                    │ Process │
                    │  Data   │
                    └────┬────┘
                         │
                    ┌────▼────┐
                    │ Update  │
                    │   UI    │
                    └─────────┘
```

---

## Security Architecture

### **1. Authentication & Authorization**

**Multi-Layer Security Model:**
```
┌─────────────────────────────────────────┐
│  Layer 1: Firebase Authentication      │
│  - Email/Password verification         │
│  - Token-based sessions                │
│  - Secure token storage                │
└──────────────┬──────────────────────────┘
               ▼
┌─────────────────────────────────────────┐
│  Layer 2: Firestore Security Rules     │
│  - Role-based access control           │
│  - Resource-level permissions          │
│  - Field-level security                │
└──────────────┬──────────────────────────┘
               ▼
┌─────────────────────────────────────────┐
│  Layer 3: Application Logic            │
│  - UI-level role checks                │
│  - Component-level authorization       │
│  - Action validation                   │
└─────────────────────────────────────────┘
```

### **2. Data Security**

**Firestore Security Rules:**
```javascript
// Example: Video collection security
match /videos/{videoId} {
  allow read: if isAuthenticated();

  allow create: if isStudent() && isOwner()
                || isTeacher()
                || isAdmin();

  allow update: if isOwner()
                || (isTeacher() && sameSchool())
                || isAdmin();

  allow delete: if isOwner() || isAdmin();
}
```

**Storage Security Rules:**
```javascript
// Video upload security
match /videos/{videoId}/{fileName} {
  allow read: if request.auth != null;

  allow write: if request.auth != null
               && request.resource.size < 100MB
               && request.resource.contentType.matches('video/.*');
}
```

### **3. Data Validation**

**Input Validation Layers:**
- Client-side validation (React forms)
- Server-side validation (Cloud Functions)
- Database constraints (Firestore rules)

### **4. Privacy & Compliance**

**Data Protection Measures:**
- Encrypted data transmission (HTTPS/TLS)
- Encrypted data at rest (Firebase default)
- User consent management
- GDPR-compliant data handling
- Role-based data visibility

---

## Network Architecture

```
┌────────────────────────────────────────────────┐
│            Global CDN (Firebase Hosting)       │
│  ┌──────────────────────────────────────────┐ │
│  │  Edge Locations (Worldwide)              │ │
│  │  - Static assets caching                 │ │
│  │  - SSL/TLS termination                   │ │
│  │  - DDoS protection                       │ │
│  └──────────────────────────────────────────┘ │
└────────────────────┬───────────────────────────┘
                     │
    ┌────────────────┼────────────────┐
    │                │                │
┌───▼───┐      ┌────▼────┐     ┌────▼────┐
│Region │      │ Region  │     │ Region  │
│  US   │      │   EU    │     │  Asia   │
└───┬───┘      └────┬────┘     └────┬────┘
    │               │               │
    └───────────────┼───────────────┘
                    │
          ┌─────────▼─────────┐
          │  Firebase Backend │
          │  - Auto-scaling   │
          │  - Load balancing │
          └───────────────────┘
```

---

## Monitoring & Observability

### **System Monitoring**
```
┌──────────────────────────────────────┐
│  Firebase Console Dashboard          │
├──────────────────────────────────────┤
│  • Real-time User Analytics          │
│  • Performance Monitoring            │
│  • Crash Reporting                   │
│  • Database Metrics                  │
│  • Storage Usage                     │
│  • Function Execution Logs           │
└──────────────────────────────────────┘
```

### **Key Metrics Tracked**
- Active users (real-time, daily, monthly)
- Video upload rate
- Evaluation submission rate
- API response times
- Error rates
- Storage consumption
- Database read/write operations

---

## Technology Decisions

### **Why Firebase?**
1. **Rapid Development:** BaaS reduces backend complexity
2. **Auto-scaling:** Handles traffic spikes automatically
3. **Real-time:** Built-in real-time database capabilities
4. **Security:** Enterprise-grade security out-of-the-box
5. **Cost-effective:** Pay-as-you-grow pricing model
6. **Reliability:** 99.95% uptime SLA

### **Why React?**
1. **Component Reusability:** Modular architecture
2. **Performance:** Virtual DOM optimization
3. **Community:** Large ecosystem and support
4. **PWA Support:** Progressive web app capabilities
5. **SEO-friendly:** Server-side rendering possible

### **Why NoSQL (Firestore)?**
1. **Flexibility:** Schema-less document model
2. **Scalability:** Horizontal scaling built-in
3. **Real-time:** Live data synchronization
4. **Querying:** Rich query capabilities with indexes
5. **Offline Support:** Built-in offline persistence

---

## Future Enhancements

### **Phase 1: Current Implementation**
- ✅ Video upload and discovery
- ✅ Multi-role authentication
- ✅ Evaluation system
- ✅ Admin panel
- ✅ Notifications
- ✅ Badge system

### **Phase 2: Planned Features**
- [ ] Real-time video streaming (HLS/DASH)
- [ ] Video transcoding pipeline
- [ ] Advanced search with Algolia
- [ ] Machine learning recommendations
- [ ] Mobile native apps (React Native)
- [ ] WebRTC for live competitions

### **Phase 3: Advanced Features**
- [ ] Multi-language support (i18n)
- [ ] Advanced analytics dashboard
- [ ] Integration with learning management systems
- [ ] Blockchain-based certificates
- [ ] AI-powered content moderation

---

## Conclusion

The ScienceVerse architecture is designed for:
- **Scalability:** Auto-scales to millions of users
- **Reliability:** 99.95% uptime with Firebase
- **Security:** Multi-layer security architecture
- **Performance:** Global CDN with edge caching
- **Maintainability:** Modular, component-based design
- **Extensibility:** Easy to add new features

This architecture supports the current requirements while remaining flexible for future growth and feature additions.
