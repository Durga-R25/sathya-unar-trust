/**
 * Script to upload mock videos and evaluations to Firebase Firestore
 * Run this once to populate your database with example data
 *
 * Usage: node scripts/uploadMockData.js
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp } = require('firebase-admin/firestore');
const path = require('path');

// Initialize Firebase Admin SDK
// Make sure you have your service account key file
const serviceAccount = require('../scienceverse-competition-firebase-adminsdk.json');

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

// Mock Videos Data
const mockVideos = [
  {
    videoId: "vid001",
    title: "How to Make a Volcano - Chemical Reaction",
    description: "Learn about acid-base reactions by creating a volcanic eruption using baking soda and vinegar. Perfect for understanding chemical reactions!",
    uploaderId: "student001",
    uploaderName: "Priya Sharma",
    uploaderSchool: "TN-CHN-GOVT-001",
    schoolName: "Government High School, Chennai",
    district: "Chennai",
    state: "Tamil Nadu",
    schoolId: "TN-CHN-GOVT-001",
    class: "10",
    category: "Chemistry",
    tags: ["chemistry", "reaction", "volcano", "experiment"],
    duration: 180,
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=400&h=700&fit=crop",
    uploadedAt: new Date("2024-01-15"),
    createdAt: new Date("2024-01-15"),
    status: "active",
    approvedBy: "admin001",
    approvedAt: new Date("2024-01-15"),
    totalEvaluations: 4,
    judgeEvaluations: 2,
    teacherEvaluations: 1,
    studentEvaluations: 1,
    scientificClarity: 4.2,
    humanityCare: 3.8,
    realLifeImpact: 4.0,
    originalThinking: 3.5,
    aggregateScore: 3.875,
    views: 1250,
    hasVoiceover: true
  },
  {
    videoId: "vid002",
    title: "Solar Panel from Scratch - Renewable Energy",
    description: "Building a working solar panel using simple materials. Understanding photovoltaic cells and sustainable energy solutions for rural areas.",
    uploaderId: "student002",
    uploaderName: "Rahul Kumar",
    uploaderSchool: "TN-MDU-GOVT-002",
    schoolName: "Government School, Madurai",
    district: "Madurai",
    state: "Tamil Nadu",
    schoolId: "TN-MDU-GOVT-002",
    class: "11",
    category: "Physics",
    tags: ["solar", "energy", "renewable", "sustainable"],
    duration: 240,
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=400&h=700&fit=crop",
    uploadedAt: new Date("2024-01-16"),
    createdAt: new Date("2024-01-16"),
    status: "active",
    approvedBy: "admin001",
    approvedAt: new Date("2024-01-16"),
    totalEvaluations: 2,
    judgeEvaluations: 2,
    teacherEvaluations: 0,
    studentEvaluations: 0,
    scientificClarity: 4.5,
    humanityCare: 4.75,
    realLifeImpact: 5.0,
    originalThinking: 4.25,
    aggregateScore: 4.625,
    views: 2100,
    hasVoiceover: true
  },
  {
    videoId: "vid003",
    title: "Water Purification System Using Local Materials",
    description: "Creating a low-cost water filter using sand, charcoal, and gravel. Addressing clean water challenges in our village.",
    uploaderId: "student003",
    uploaderName: "Anjali Devi",
    uploaderSchool: "TN-TRI-GOVT-003",
    schoolName: "Government High School, Trichy",
    district: "Trichy",
    state: "Tamil Nadu",
    schoolId: "TN-TRI-GOVT-003",
    class: "12",
    category: "Environment",
    tags: ["water", "purification", "health", "community"],
    duration: 200,
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400&h=700&fit=crop",
    uploadedAt: new Date("2024-01-17"),
    createdAt: new Date("2024-01-17"),
    status: "active",
    approvedBy: "admin001",
    approvedAt: new Date("2024-01-17"),
    totalEvaluations: 2,
    judgeEvaluations: 1,
    teacherEvaluations: 1,
    studentEvaluations: 0,
    scientificClarity: 4.25,
    humanityCare: 5.0,
    realLifeImpact: 4.75,
    originalThinking: 4.0,
    aggregateScore: 4.5,
    views: 3200,
    hasVoiceover: true
  },
  {
    videoId: "vid004",
    title: "Growing Plants in Space - Hydroponics Experiment",
    description: "Testing hydroponic farming methods that could work in space. Learning about plant biology and future food systems.",
    uploaderId: "student004",
    uploaderName: "Arjun Patel",
    uploaderSchool: "TN-COI-GOVT-004",
    schoolName: "Government School, Coimbatore",
    district: "Coimbatore",
    state: "Tamil Nadu",
    schoolId: "TN-COI-GOVT-004",
    class: "10",
    category: "Biology",
    tags: ["hydroponics", "plants", "space", "agriculture"],
    duration: 220,
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?w=400&h=700&fit=crop",
    uploadedAt: new Date("2024-01-18"),
    createdAt: new Date("2024-01-18"),
    status: "active",
    approvedBy: "admin001",
    approvedAt: new Date("2024-01-18"),
    totalEvaluations: 1,
    judgeEvaluations: 1,
    teacherEvaluations: 0,
    studentEvaluations: 0,
    scientificClarity: 4.5,
    humanityCare: 4.0,
    realLifeImpact: 4.0,
    originalThinking: 5.0,
    aggregateScore: 4.375,
    views: 1800,
    hasVoiceover: true
  },
  {
    videoId: "vid005",
    title: "Mobile App for Crop Disease Detection - AI Project",
    description: "Built an app using machine learning to detect crop diseases from photos. Helping farmers save their harvest.",
    uploaderId: "student005",
    uploaderName: "Kavya Reddy",
    uploaderSchool: "TN-SLM-GOVT-005",
    schoolName: "Government High School, Salem",
    district: "Salem",
    state: "Tamil Nadu",
    schoolId: "TN-SLM-GOVT-005",
    class: "12",
    category: "Technology",
    tags: ["AI", "agriculture", "app", "innovation"],
    duration: 260,
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1560264280-88b68371db39?w=400&h=700&fit=crop",
    uploadedAt: new Date("2024-01-19"),
    createdAt: new Date("2024-01-19"),
    status: "active",
    approvedBy: "admin001",
    approvedAt: new Date("2024-01-19"),
    totalEvaluations: 3,
    judgeEvaluations: 2,
    teacherEvaluations: 1,
    studentEvaluations: 0,
    scientificClarity: 4.67,
    humanityCare: 4.5,
    realLifeImpact: 5.0,
    originalThinking: 4.83,
    aggregateScore: 4.75,
    views: 4500,
    hasVoiceover: true
  }
];

// Mock Evaluations Data
const mockEvaluations = [
  // vid001 evaluations
  {
    evaluationId: 'eval_001',
    videoId: 'vid001',
    evaluatorId: 'judge_001',
    evaluatorName: 'Dr. Anjali Mehta',
    evaluatorRole: 'judge',
    evaluatorSchool: 'Science Education Board',
    scientificClarity: 4.0,
    humanityCare: 4.0,
    realLifeImpact: 4.0,
    originalThinking: 3.0,
    averageRating: 3.75,
    comment: 'Excellent demonstration of acid-base reactions. Clear explanation and good safety practices. Could improve on real-world applications.',
    evaluatedAt: new Date('2024-01-15T10:30:00')
  },
  {
    evaluationId: 'eval_002',
    videoId: 'vid001',
    evaluatorId: 'judge_002',
    evaluatorName: 'Prof. Rajesh Singh',
    evaluatorRole: 'judge',
    evaluatorSchool: 'Science Education Board',
    scientificClarity: 4.5,
    humanityCare: 3.5,
    realLifeImpact: 4.0,
    originalThinking: 4.0,
    averageRating: 4.0,
    comment: 'Very well presented with proper methodology. Great use of common materials. Impressive clarity in explanation.',
    evaluatedAt: new Date('2024-01-15T14:20:00')
  },
  {
    evaluationId: 'eval_003',
    videoId: 'vid001',
    evaluatorId: 'teacher_001',
    evaluatorName: 'Mrs. Lakshmi Iyer',
    evaluatorRole: 'teacher',
    evaluatorSchool: 'Government High School, Chennai',
    scientificClarity: 4.0,
    humanityCare: 4.0,
    realLifeImpact: 4.0,
    originalThinking: 3.0,
    averageRating: 3.75,
    comment: 'Priya has done an excellent job! The experiment is safe and educational. Perfect for classroom demonstration.',
    evaluatedAt: new Date('2024-01-15T16:45:00')
  },
  {
    evaluationId: 'eval_004',
    videoId: 'vid001',
    evaluatorId: 'student_002',
    evaluatorName: 'Arjun Kumar',
    evaluatorRole: 'student',
    evaluatorSchool: 'Government High School, Trichy',
    scientificClarity: 5.0,
    humanityCare: 4.0,
    realLifeImpact: 4.0,
    originalThinking: 4.0,
    averageRating: 4.25,
    comment: 'Amazing! I tried this at home and it worked perfectly. Very easy to understand.',
    evaluatedAt: new Date('2024-01-16T09:15:00')
  },

  // vid002 evaluations
  {
    evaluationId: 'eval_005',
    videoId: 'vid002',
    evaluatorId: 'judge_001',
    evaluatorName: 'Dr. Anjali Mehta',
    evaluatorRole: 'judge',
    evaluatorSchool: 'Science Education Board',
    scientificClarity: 4.5,
    humanityCare: 5.0,
    realLifeImpact: 5.0,
    originalThinking: 4.5,
    averageRating: 4.75,
    comment: 'Outstanding project! Addresses real energy challenges in rural areas. Excellent understanding of renewable energy principles.',
    evaluatedAt: new Date('2024-01-16T11:00:00')
  },
  {
    evaluationId: 'eval_006',
    videoId: 'vid002',
    evaluatorId: 'judge_003',
    evaluatorName: 'Dr. Suresh Patel',
    evaluatorRole: 'judge',
    evaluatorSchool: 'Science Education Board',
    scientificClarity: 4.5,
    humanityCare: 4.5,
    realLifeImpact: 5.0,
    originalThinking: 4.0,
    averageRating: 4.5,
    comment: 'Impressive work on solar energy. The practical approach and cost-effectiveness make this highly replicable.',
    evaluatedAt: new Date('2024-01-16T15:30:00')
  },

  // vid003 evaluations
  {
    evaluationId: 'eval_007',
    videoId: 'vid003',
    evaluatorId: 'judge_002',
    evaluatorName: 'Prof. Rajesh Singh',
    evaluatorRole: 'judge',
    evaluatorSchool: 'Science Education Board',
    scientificClarity: 4.0,
    humanityCare: 5.0,
    realLifeImpact: 5.0,
    originalThinking: 4.0,
    averageRating: 4.5,
    comment: 'Brilliant solution to a critical problem! The water filter design is practical and affordable.',
    evaluatedAt: new Date('2024-01-17T10:00:00')
  },
  {
    evaluationId: 'eval_008',
    videoId: 'vid003',
    evaluatorId: 'teacher_002',
    evaluatorName: 'Mr. Venkatesh Rao',
    evaluatorRole: 'teacher',
    evaluatorSchool: 'Government School, Madurai',
    scientificClarity: 4.5,
    humanityCare: 5.0,
    realLifeImpact: 4.5,
    originalThinking: 4.0,
    averageRating: 4.5,
    comment: 'Excellent community-focused project. Anjali has shown great initiative in solving local water quality issues.',
    evaluatedAt: new Date('2024-01-17T14:20:00')
  },

  // vid004 evaluations
  {
    evaluationId: 'eval_009',
    videoId: 'vid004',
    evaluatorId: 'judge_001',
    evaluatorName: 'Dr. Anjali Mehta',
    evaluatorRole: 'judge',
    evaluatorSchool: 'Science Education Board',
    scientificClarity: 4.5,
    humanityCare: 4.0,
    realLifeImpact: 4.0,
    originalThinking: 5.0,
    averageRating: 4.375,
    comment: 'Very innovative! The hydroponics approach shows advanced understanding of plant biology and future agriculture.',
    evaluatedAt: new Date('2024-01-18T12:00:00')
  },

  // vid005 evaluations
  {
    evaluationId: 'eval_010',
    videoId: 'vid005',
    evaluatorId: 'judge_003',
    evaluatorName: 'Dr. Suresh Patel',
    evaluatorRole: 'judge',
    evaluatorSchool: 'Science Education Board',
    scientificClarity: 5.0,
    humanityCare: 4.5,
    realLifeImpact: 5.0,
    originalThinking: 5.0,
    averageRating: 4.875,
    comment: 'Exceptional integration of AI and agriculture! This project demonstrates cutting-edge technology application for real-world problems.',
    evaluatedAt: new Date('2024-01-19T10:30:00')
  },
  {
    evaluationId: 'eval_011',
    videoId: 'vid005',
    evaluatorId: 'judge_001',
    evaluatorName: 'Dr. Anjali Mehta',
    evaluatorRole: 'judge',
    evaluatorSchool: 'Science Education Board',
    scientificClarity: 4.5,
    humanityCare: 4.5,
    realLifeImpact: 5.0,
    originalThinking: 5.0,
    averageRating: 4.75,
    comment: 'Outstanding work! The ML model accuracy and practical deployment strategy are impressive for a student project.',
    evaluatedAt: new Date('2024-01-19T14:00:00')
  },
  {
    evaluationId: 'eval_012',
    videoId: 'vid005',
    evaluatorId: 'teacher_003',
    evaluatorName: 'Dr. Priya Sharma',
    evaluatorRole: 'teacher',
    evaluatorSchool: 'Government High School, Salem',
    scientificClarity: 4.5,
    humanityCare: 4.5,
    realLifeImpact: 5.0,
    originalThinking: 4.5,
    averageRating: 4.625,
    comment: 'Kavya has exceeded all expectations! This app can genuinely help farmers in our region.',
    evaluatedAt: new Date('2024-01-19T16:30:00')
  }
];

async function uploadMockData() {
  console.log('🚀 Starting mock data upload to Firebase...\n');

  try {
    // Upload Videos
    console.log('📹 Uploading mock videos...');
    const batch = db.batch();
    let count = 0;

    for (const video of mockVideos) {
      const videoRef = db.collection('videos').doc();
      const videoData = {
        ...video,
        uploadedAt: Timestamp.fromDate(video.uploadedAt),
        createdAt: Timestamp.fromDate(video.createdAt),
        approvedAt: Timestamp.fromDate(video.approvedAt)
      };
      batch.set(videoRef, videoData);
      count++;
      console.log(`  ✓ Added: ${video.title}`);
    }

    await batch.commit();
    console.log(`\n✅ Successfully uploaded ${count} videos!\n`);

    // Upload Evaluations
    console.log('⭐ Uploading mock evaluations...');
    const evalBatch = db.batch();
    let evalCount = 0;

    for (const evaluation of mockEvaluations) {
      const evalRef = db.collection('evaluations').doc();
      const evalData = {
        ...evaluation,
        evaluatedAt: Timestamp.fromDate(evaluation.evaluatedAt)
      };
      evalBatch.set(evalRef, evalData);
      evalCount++;
      console.log(`  ✓ Added evaluation by ${evaluation.evaluatorName} for ${evaluation.videoId}`);
    }

    await evalBatch.commit();
    console.log(`\n✅ Successfully uploaded ${evalCount} evaluations!\n`);

    console.log('🎉 All mock data uploaded successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Videos: ${count}`);
    console.log(`   - Evaluations: ${evalCount}`);
    console.log('\n✨ Your Firebase database now has example content!');

  } catch (error) {
    console.error('❌ Error uploading mock data:', error);
    process.exit(1);
  }

  process.exit(0);
}

// Run the upload
uploadMockData();
