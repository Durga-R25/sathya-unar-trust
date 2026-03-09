import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../config/firebase';
import VideoRecorder from './VideoRecorder';
import VideoUploader from './VideoUploader';
import UploadForm from './UploadForm';
import UploadProgress from './UploadProgress';
import './UploadScreen.css';

/**
 * UploadScreen Component
 * Main upload interface with two options:
 * 1. Record video using camera
 * 2. Upload existing video from device
 */
const UploadScreen = ({ currentUser, onClose, onUploadComplete }) => {
  // For teachers, we need to first select which student to upload for
  const isTeacher = currentUser && currentUser.role && currentUser.role.toLowerCase() === 'teacher';
  const [uploadStep, setUploadStep] = useState(isTeacher ? 'selectStudent' : 'choose'); // selectStudent, choose, record, upload, form, uploading, complete
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [videoDuration, setVideoDuration] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [students, setStudents] = useState([]);

  // Load students for teachers
  useEffect(() => {
    if (isTeacher && currentUser.schoolName) {
      loadStudentsFromSchool();
    }
  }, [isTeacher, currentUser]);

  const loadStudentsFromSchool = async () => {
    try {
      const studentsQuery = query(
        collection(db, 'users'),
        where('schoolName', '==', currentUser.schoolName),
        where('role', '==', 'student')
      );
      const snapshot = await getDocs(studentsQuery);
      const studentsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setStudents(studentsList);
    } catch (error) {
      console.error('Error loading students:', error);
    }
  };

  // Competition settings (would come from admin config in Phase 5)
  const competitionSettings = {
    maxDuration: 300, // 5 minutes in seconds
    maxFileSize: 50 * 1024 * 1024, // 50MB
    allowedFormats: ['video/mp4', 'video/webm', 'video/quicktime'],
    categories: [
      'Physics',
      'Chemistry',
      'Biology',
      'Environment',
      'Technology',
      'Mathematics',
      'Engineering',
      'Agriculture',
      'Health Sciences',
      'Innovation'
    ]
  };

  // Extract video duration from a File object via a temporary video element
  const extractDuration = (file) => {
    return new Promise((resolve) => {
      const tempVideo = document.createElement('video');
      tempVideo.preload = 'metadata';
      const url = URL.createObjectURL(file);
      tempVideo.src = url;
      tempVideo.onloadedmetadata = () => {
        URL.revokeObjectURL(url);
        resolve(Math.round(tempVideo.duration) || 0);
      };
      tempVideo.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(0);
      };
    });
  };

  const handleRecordComplete = async (blob) => {
    // Create file from blob
    const file = new File([blob], `recording_${Date.now()}.webm`, { type: 'video/webm' });
    const dur = await extractDuration(file);
    setVideoDuration(dur);
    setVideoFile(file);
    setSelectedVideo(URL.createObjectURL(blob));
    setUploadStep('form');
  };

  const handleFileSelect = (file) => {
    // Validate file
    if (!competitionSettings.allowedFormats.includes(file.type)) {
      alert('Invalid file format. Please upload MP4, WebM, or MOV files.');
      return;
    }

    if (file.size > competitionSettings.maxFileSize) {
      alert(`File too large. Maximum size is ${competitionSettings.maxFileSize / (1024 * 1024)}MB.`);
      return;
    }

    extractDuration(file).then(dur => setVideoDuration(dur));
    setVideoFile(file);
    setSelectedVideo(URL.createObjectURL(file));
    setUploadStep('form');
  };

  // Generate thumbnail from video file
  const generateThumbnail = (videoFile) => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');

      video.preload = 'metadata';
      video.src = URL.createObjectURL(videoFile);

      video.onloadedmetadata = () => {
        // Seek to 1 second or 10% of video duration, whichever is less
        video.currentTime = Math.min(1, video.duration * 0.1);
      };

      video.onseeked = () => {
        // Set canvas size to video size
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Draw video frame to canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Convert canvas to blob
        canvas.toBlob((blob) => {
          URL.revokeObjectURL(video.src);
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to generate thumbnail'));
          }
        }, 'image/jpeg', 0.8);
      };

      video.onerror = () => {
        URL.revokeObjectURL(video.src);
        reject(new Error('Failed to load video for thumbnail'));
      };
    });
  };

  const handleFormSubmit = async (metadata) => {
    setUploadStep('uploading');

    try {
      // Determine who the video is for (student or teacher uploading for student)
      const uploaderInfo = isTeacher && selectedStudent ? {
        uploaderId: selectedStudent.uid,
        uploaderName: selectedStudent.name,
        uploaderSchool: selectedStudent.schoolName,
        district: selectedStudent.district,
        schoolId: selectedStudent.schoolId,
        class: selectedStudent.class,
        state: selectedStudent.state,
        uploadedBy: currentUser.uid, // Track that teacher uploaded it
        uploadedByName: currentUser.name
      } : {
        uploaderId: currentUser.userId || currentUser.uid,
        uploaderName: currentUser.name,
        uploaderSchool: currentUser.schoolName,
        district: currentUser.district,
        schoolId: currentUser.schoolId,
        class: currentUser.class,
        state: currentUser.state
      };

      // Generate unique video ID
      const videoId = `vid_${Date.now()}_${uploaderInfo.uploaderId}`;

      // Generate thumbnail from video
      console.log('Generating thumbnail...');
      const thumbnailBlob = await generateThumbnail(videoFile);

      // Upload thumbnail to Firebase Storage first
      const thumbnailRef = ref(storage, `thumbnails/${videoId}/thumbnail.jpg`);
      const thumbnailUploadTask = uploadBytesResumable(thumbnailRef, thumbnailBlob);

      await new Promise((resolve, reject) => {
        thumbnailUploadTask.on('state_changed',
          null,
          reject,
          resolve
        );
      });

      const thumbnailURL = await getDownloadURL(thumbnailUploadTask.snapshot.ref);
      console.log('Thumbnail uploaded:', thumbnailURL);

      // Upload video to Firebase Storage
      const storageRef = ref(storage, `videos/${videoId}/${videoFile.name}`);
      const uploadTask = uploadBytesResumable(storageRef, videoFile);

      // Monitor upload progress
      uploadTask.on('state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(Math.round(progress));
        },
        (error) => {
          console.error('Upload error:', error);
          throw error;
        },
        async () => {
          // Upload completed, get download URL
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

          // Save video metadata to Firestore
          // Students videos need approval, teachers can upload as active
          const videoStatus = isTeacher ? 'active' : 'pending';

          const videoData = {
            videoId: videoId,
            videoUrl: downloadURL,
            thumbnailUrl: thumbnailURL,
            ...metadata,
            ...uploaderInfo,
            uploadedAt: serverTimestamp(),
            createdAt: serverTimestamp(),
            status: videoStatus, // active, pending, rejected
            approvedBy: isTeacher ? currentUser.uid : null, // Teachers auto-approve
            approvedAt: isTeacher ? serverTimestamp() : null,
            fileSize: videoFile.size,
            fileName: videoFile.name,
            duration: videoDuration,
            views: 0,
            totalEvaluations: 0,
            judgeEvaluations: 0,
            teacherEvaluations: 0,
            studentEvaluations: 0,
            scientificClarity: 0,
            humanityCare: 0,
            realLifeImpact: 0,
            originalThinking: 0,
            aggregateScore: 0
          };

          await addDoc(collection(db, 'videos'), videoData);

          setUploadStep('complete');

          // Notify parent
          if (onUploadComplete) {
            onUploadComplete(videoData);
          }

          // Auto-close after 3 seconds
          setTimeout(() => {
            onClose();
          }, 3000);
        }
      );

    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed: ' + error.message);
      setUploadStep('form');
    }
  };

  const handleBack = () => {
    if (uploadStep === 'record' || uploadStep === 'upload') {
      setUploadStep('choose');
    } else if (uploadStep === 'form') {
      setUploadStep('choose');
      setSelectedVideo(null);
      setVideoFile(null);
    } else if (uploadStep === 'choose' && isTeacher) {
      setUploadStep('selectStudent');
      setSelectedStudent(null);
    }
  };

  return (
    <div className="upload-screen-overlay">
      <div className="upload-screen">
        {/* Header */}
        <div className="upload-header">
          {uploadStep !== 'selectStudent' && uploadStep !== 'choose' && uploadStep !== 'uploading' && uploadStep !== 'complete' && (
            <button className="back-button" onClick={handleBack}>
              ← Back
            </button>
          )}
          {uploadStep === 'choose' && isTeacher && (
            <button className="back-button" onClick={handleBack}>
              ← Back
            </button>
          )}
          <h2 className="upload-title">
            {uploadStep === 'selectStudent' && 'Select Student'}
            {uploadStep === 'choose' && 'Upload Video'}
            {uploadStep === 'record' && 'Record Video'}
            {uploadStep === 'upload' && 'Select Video'}
            {uploadStep === 'form' && 'Video Details'}
            {uploadStep === 'uploading' && 'Uploading...'}
            {uploadStep === 'complete' && 'Upload Complete!'}
          </h2>
          {uploadStep !== 'uploading' && (
            <button className="close-button" onClick={onClose}>
              ✕
            </button>
          )}
        </div>

        {/* Content */}
        <div className="upload-content">
          {/* Step 0: Select Student (for teachers) */}
          {uploadStep === 'selectStudent' && (
            <div className="student-selection">
              <p className="upload-subtitle">
                Select which student you're uploading for
              </p>

              {students.length === 0 ? (
                <div className="no-students-message">
                  <span className="message-icon">📚</span>
                  <h3>No Students Found</h3>
                  <p>You don't have any students in your school yet.</p>
                  <p>Please create student accounts first in the Admin panel.</p>
                </div>
              ) : (
                <div className="students-list">
                  {students.map((student) => (
                    <button
                      key={student.id}
                      className={`student-card ${selectedStudent?.id === student.id ? 'selected' : ''}`}
                      onClick={() => {
                        setSelectedStudent(student);
                        setUploadStep('choose');
                      }}
                    >
                      <div className="student-icon">🎓</div>
                      <div className="student-info">
                        <h4>{student.name}</h4>
                        <p>{student.schoolId}</p>
                        {student.class && <p>Class {student.class}</p>}
                      </div>
                      {selectedStudent?.id === student.id && (
                        <span className="selected-badge">✓</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 1: Choose Method */}
          {uploadStep === 'choose' && (
            <div className="upload-choice">
              <p className="upload-subtitle">
                Choose how you want to add your science project video
              </p>

              <div className="upload-options">
                <button
                  className="upload-option-card"
                  onClick={() => setUploadStep('record')}
                >
                  <span className="option-icon">📹</span>
                  <h3 className="option-title">Record Video</h3>
                  <p className="option-description">
                    Use your camera to record your experiment live
                  </p>
                  <span className="option-badge">Max {competitionSettings.maxDuration / 60} min</span>
                </button>

                <button
                  className="upload-option-card"
                  onClick={() => setUploadStep('upload')}
                >
                  <span className="option-icon">📁</span>
                  <h3 className="option-title">Upload Video</h3>
                  <p className="option-description">
                    Choose an existing video from your device
                  </p>
                  <span className="option-badge">Max {competitionSettings.maxFileSize / (1024 * 1024)}MB</span>
                </button>
              </div>

              <div className="upload-info">
                <h4 className="info-title">📋 Requirements:</h4>
                <ul className="info-list">
                  <li>Maximum duration: {competitionSettings.maxDuration / 60} minutes</li>
                  <li>Maximum file size: {competitionSettings.maxFileSize / (1024 * 1024)}MB</li>
                  <li>Formats: MP4, WebM, MOV</li>
                  <li>Must show your science experiment or project</li>
                  <li>Audio required (voice-over or narration)</li>
                </ul>
              </div>
            </div>
          )}

          {/* Step 2a: Record Video */}
          {uploadStep === 'record' && (
            <VideoRecorder
              maxDuration={competitionSettings.maxDuration}
              onRecordComplete={handleRecordComplete}
              onCancel={() => setUploadStep('choose')}
            />
          )}

          {/* Step 2b: Upload Video */}
          {uploadStep === 'upload' && (
            <VideoUploader
              allowedFormats={competitionSettings.allowedFormats}
              maxFileSize={competitionSettings.maxFileSize}
              onFileSelect={handleFileSelect}
              onCancel={() => setUploadStep('choose')}
            />
          )}

          {/* Step 3: Metadata Form */}
          {uploadStep === 'form' && (
            <UploadForm
              videoUrl={selectedVideo}
              videoFile={videoFile}
              categories={competitionSettings.categories}
              currentUser={currentUser}
              onSubmit={handleFormSubmit}
              onCancel={handleBack}
            />
          )}

          {/* Step 4: Uploading */}
          {uploadStep === 'uploading' && (
            <UploadProgress
              progress={uploadProgress}
              fileName={videoFile?.name}
            />
          )}

          {/* Step 5: Complete */}
          {uploadStep === 'complete' && (
            <div className="upload-complete">
              <span className="complete-icon">✅</span>
              <h3 className="complete-title">Upload Successful!</h3>
              <p className="complete-message">
                Your video has been uploaded and is being processed.
                It will be visible to judges and other students shortly.
              </p>
              <div className="complete-actions">
                <button className="primary-button" onClick={onClose}>
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UploadScreen;
