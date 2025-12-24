/**
 * Mock evaluations data
 * Simulates evaluations from different users and roles
 * In Phase 7, this will come from Firebase Firestore
 */

export const mockEvaluations = {
  vid001: [
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
      evaluatedAt: new Date('2024-01-15T10:30:00').toISOString()
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
      evaluatedAt: new Date('2024-01-15T14:20:00').toISOString()
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
      evaluatedAt: new Date('2024-01-15T16:45:00').toISOString()
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
      evaluatedAt: new Date('2024-01-16T09:15:00').toISOString()
    }
  ],
  vid002: [
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
      evaluatedAt: new Date('2024-01-16T11:00:00').toISOString()
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
      evaluatedAt: new Date('2024-01-16T15:30:00').toISOString()
    }
  ],
  vid003: [
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
      evaluatedAt: new Date('2024-01-17T10:00:00').toISOString()
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
      evaluatedAt: new Date('2024-01-17T14:20:00').toISOString()
    }
  ],
  vid004: [
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
      evaluatedAt: new Date('2024-01-18T12:00:00').toISOString()
    }
  ],
  vid005: [
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
      evaluatedAt: new Date('2024-01-19T10:30:00').toISOString()
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
      evaluatedAt: new Date('2024-01-19T14:00:00').toISOString()
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
      evaluatedAt: new Date('2024-01-19T16:30:00').toISOString()
    }
  ]
};

// Helper function to get evaluations for a video
export const getEvaluationsForVideo = (videoId) => {
  return mockEvaluations[videoId] || [];
};

// Helper function to add new evaluation
export const addEvaluation = (videoId, evaluation) => {
  if (!mockEvaluations[videoId]) {
    mockEvaluations[videoId] = [];
  }
  mockEvaluations[videoId].push(evaluation);
};
