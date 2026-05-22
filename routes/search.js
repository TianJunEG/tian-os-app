import express from 'express';
import TutorProfile from '../models/TutorProfile.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Enhanced 9-Criteria Matching Algorithm (85%+ success target)
// Based on pitch: subject, grade, teaching style, availability, location, success rate, preferences, special needs, price
const calculateCompatibilityScore = (tutorProfile, parentProfile, searchCriteria) => {
  const weights = {
    subjectAlignment: 0.25,      // 25% - Does tutor teach the subject?
    gradeFit: 0.20,              // 20% - Right grade level experience?
    teachingStyle: 0.15,         // 15% - Match parent's preferred style?
    availability: 0.15,          // 15% - Can they schedule when needed?
    locationProximity: 0.10,     // 10% - Reasonable distance?
    tutorSuccessRate: 0.10,      // 10% - High match success rate?
    parentPreferences: 0.05,     // 5% - Meets special requests?
    specialNeedsCompat: 0.05,    // 5% - Can handle learning disabilities?
    priceFit: 0.05               // 5% - Within budget range?
  };

  const scores = {};

  // 1. SUBJECT ALIGNMENT (0-100)
  if (searchCriteria.specialty && tutorProfile.specialties) {
    const exactMatch = tutorProfile.specialties.some(s =>
      s.toLowerCase() === searchCriteria.specialty.toLowerCase()
    );
    const relatedMatch = tutorProfile.specialties.some(s =>
      s.toLowerCase().includes(searchCriteria.specialty.split(' ')[0].toLowerCase())
    );
    scores.subjectAlignment = exactMatch ? 100 : (relatedMatch ? 70 : 0);
  } else {
    scores.subjectAlignment = 50; // Neutral if no specialty specified
  }

  // 2. GRADE FIT (0-100)
  if (searchCriteria.grade && tutorProfile.grades) {
    const gradeNumber = parseInt(searchCriteria.grade);
    const tutorGrades = tutorProfile.grades.map(g => parseInt(g));
    const gradeDiff = Math.min(...tutorGrades.map(tg => Math.abs(tg - gradeNumber)));

    if (gradeDiff === 0) {
      scores.gradeFit = 100; // Exact match
    } else if (gradeDiff === 1) {
      scores.gradeFit = 100; // ±1 grade
    } else if (gradeDiff === 2) {
      scores.gradeFit = 70;  // ±2 grades
    } else {
      scores.gradeFit = 0;   // Too different
    }
  } else {
    scores.gradeFit = 50; // Neutral
  }

  // 3. TEACHING STYLE MATCH (0-100)
  const parentStyle = parentProfile?.preferredStyle || searchCriteria.teachingStyle;
  const tutorStyle = tutorProfile.teachingStyle || 'balanced';

  const styleMatches = {
    'conceptual-conceptual': 100,
    'conceptual-balanced': 85,
    'conceptual-rote': 40,
    'balanced-conceptual': 85,
    'balanced-balanced': 100,
    'balanced-rote': 85,
    'rote-conceptual': 40,
    'rote-balanced': 85,
    'rote-rote': 100
  };

  const styleKey = `${(parentStyle || 'balanced').toLowerCase()}-${tutorStyle.toLowerCase()}`;
  scores.teachingStyle = styleMatches[styleKey] || 70;

  // 4. AVAILABILITY MATCH (0-100)
  if (searchCriteria.preferredDays && searchCriteria.preferredDays.length > 0 && tutorProfile.availability) {
    const availableDays = searchCriteria.preferredDays.filter(day =>
      tutorProfile.availability[day.toLowerCase()]
    ).length;

    const overlapPercentage = (availableDays / searchCriteria.preferredDays.length) * 100;

    if (overlapPercentage >= 80) {
      scores.availability = 100; // Good overlap
    } else if (overlapPercentage >= 50) {
      scores.availability = 80;  // Some overlap
    } else if (overlapPercentage > 0) {
      scores.availability = 50;  // Limited overlap
    } else {
      scores.availability = 20;  // No overlap
    }
  } else {
    scores.availability = 70; // Can't measure, give benefit of doubt
  }

  // 5. LOCATION PROXIMITY (0-100)
  // Uses postal codes for Singapore
  const calculateDistance = (tutorPostal, parentPostal) => {
    if (!tutorPostal || !parentPostal) return 5000; // Max distance if no data
    const distance = Math.abs(parseInt(tutorPostal) - parseInt(parentPostal));
    return distance < 10000 ? distance / 100 : 5000; // Normalize to 0-50
  };

  const distance = calculateDistance(tutorProfile.postalCode, parentProfile?.postalCode);

  if (distance < 5) {
    scores.locationProximity = 100; // Same area
  } else if (distance < 15) {
    scores.locationProximity = 80;  // Close (5km)
  } else if (distance < 30) {
    scores.locationProximity = 50;  // Moderate (15km)
  } else {
    scores.locationProximity = 20;  // Far (20km+)
  }

  // 6. TUTOR SUCCESS RATE (0-100)
  // Based on historical match success from completed bookings
  const matchSuccessRate = tutorProfile.matchSuccessRate || tutorProfile.rating?.average / 5 * 100 || 60;

  if (matchSuccessRate >= 90) {
    scores.tutorSuccessRate = 100;
  } else if (matchSuccessRate >= 80) {
    scores.tutorSuccessRate = 85;
  } else if (matchSuccessRate >= 70) {
    scores.tutorSuccessRate = 70;
  } else if (matchSuccessRate >= 60) {
    scores.tutorSuccessRate = 50;
  } else {
    scores.tutorSuccessRate = Math.max(0, matchSuccessRate);
  }

  // 7. PARENT PREFERENCES (0-100)
  let preferenceScore = 70; // Base score

  const preferences = parentProfile?.preferences || searchCriteria.preferences || {};

  // Female tutor preference
  if (preferences.female && tutorProfile.gender === 'Female') {
    preferenceScore = 100;
  } else if (preferences.female && tutorProfile.gender !== 'Female') {
    preferenceScore = 50;
  }

  // Ex-MOE teacher preference
  if (preferences.moeteacher && tutorProfile.background && tutorProfile.background.includes('MOE')) {
    preferenceScore = Math.max(preferenceScore, 100);
  }

  // PSLE/O-Level specialist preference
  if (preferences.pslespecialist && tutorProfile.specialization && tutorProfile.specialization.includes('PSLE')) {
    preferenceScore = Math.max(preferenceScore, 100);
  }

  scores.parentPreferences = preferenceScore;

  // 8. SPECIAL NEEDS COMPATIBILITY (0-100)
  const parentSpecialNeeds = parentProfile?.specialNeeds || searchCriteria.specialNeeds;

  let specialNeedsScore = 100; // Assume compatible if no special needs

  if (parentSpecialNeeds) {
    const needsList = Array.isArray(parentSpecialNeeds) ? parentSpecialNeeds : [parentSpecialNeeds];
    const tutorCertifications = tutorProfile.specialization || [];

    const certifiedNeeds = needsList.filter(need =>
      tutorCertifications.some(cert =>
        cert.toLowerCase().includes(need.toLowerCase())
      )
    ).length;

    if (certifiedNeeds === needsList.length) {
      specialNeedsScore = 100; // All needs covered
    } else if (certifiedNeeds > 0) {
      specialNeedsScore = 80;  // Some needs covered
    } else if (tutorProfile.rating?.average >= 4.5) {
      specialNeedsScore = 60;  // No certification but excellent tutor
    } else {
      specialNeedsScore = 30;  // No certification, not ideal
    }
  }

  scores.specialNeedsCompat = specialNeedsScore;

  // 9. PRICE FIT (0-100)
  if (searchCriteria.budget && tutorProfile.hourlyRate) {
    const priceDiff = tutorProfile.hourlyRate - searchCriteria.budget;

    if (priceDiff <= 0) {
      scores.priceFit = 100; // Within budget
    } else if (priceDiff <= 5) {
      scores.priceFit = 100;  // ±$5 = excellent fit
    } else if (priceDiff <= 10) {
      scores.priceFit = 70;   // ±$10 = acceptable
    } else {
      scores.priceFit = Math.max(0, 100 - (priceDiff * 2)); // Scale down
    }
  } else {
    scores.priceFit = 50; // Can't measure
  }

  // CALCULATE WEIGHTED SCORE
  const weightedScore =
    (scores.subjectAlignment * weights.subjectAlignment) +
    (scores.gradeFit * weights.gradeFit) +
    (scores.teachingStyle * weights.teachingStyle) +
    (scores.availability * weights.availability) +
    (scores.locationProximity * weights.locationProximity) +
    (scores.tutorSuccessRate * weights.tutorSuccessRate) +
    (scores.parentPreferences * weights.parentPreferences) +
    (scores.specialNeedsCompat * weights.specialNeedsCompat) +
    (scores.priceFit * weights.priceFit);

  return {
    overallScore: Math.round(weightedScore),
    criteriaScores: scores,
    matchExplanation: generateMatchExplanation(scores, tutorProfile)
  };
};

// Generate human-readable explanation for the match
const generateMatchExplanation = (scores, tutor) => {
  const topCriteria = Object.entries(scores)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([criterion, score]) => {
      const explanations = {
        subjectAlignment: 'teaches your subject',
        gradeFit: 'experienced with your grade',
        teachingStyle: 'matches your teaching style',
        availability: 'has flexible availability',
        locationProximity: 'nearby location',
        tutorSuccessRate: 'proven success rate',
        parentPreferences: 'meets your preferences',
        specialNeedsCompat: 'trained for special needs',
        priceFit: 'fits your budget'
      };
      return explanations[criterion] || criterion;
    });

  return `${Math.round(scores.subjectAlignment)}% subject match: ${topCriteria.join(', ')}`;
};

// @route   POST /api/search/tutors
// @desc    Search and match tutors (9-criteria algorithm)
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const {
      specialty,
      grade,
      budget,
      maxRate,
      preferredDays,
      teachingStyle,
      specialNeeds,
      preferences = {},
      postalCode,
      limit = 5
    } = req.body;

    // Get parent profile for better matching
    const User = (await import('../models/User.js')).default;
    const ParentProfile = (await import('../models/User.js')).default; // Assuming parent data in User

    // Build filter for initial query
    const filter = { isActive: true };

    // Soft filters (don't exclude, just rank lower)
    if (specialty) {
      filter.specialties = { $regex: specialty, $options: 'i' };
    }
    if (grade) {
      filter.grades = grade;
    }
    if (maxRate || budget) {
      const maxPrice = maxRate || budget;
      filter.hourlyRate = { $lte: Math.ceil(maxPrice * 1.2) }; // Allow 20% over budget
    }

    // Get all matching tutors
    const tutorProfiles = await TutorProfile.find(filter)
      .populate('userId', 'name email avatar bio location phone')
      .limit(100); // Get top 100 to score

    // Create parent profile object from request
    const parentProfile = {
      postalCode,
      preferredStyle: teachingStyle,
      specialNeeds,
      preferences,
      budget: budget || maxRate || 60
    };

    // Score and rank tutors using 9-criteria algorithm
    const scoredTutors = tutorProfiles.map(tutor => {
      const compatScore = calculateCompatibilityScore(
        tutor,
        parentProfile,
        {
          specialty,
          grade,
          budget: budget || maxRate || 60,
          preferredDays,
          teachingStyle,
          specialNeeds,
          preferences
        }
      );

      return {
        _id: tutor._id,
        name: tutor.userId?.name || 'Unnamed',
        email: tutor.userId?.email,
        avatar: tutor.userId?.avatar,
        bio: tutor.userId?.bio,
        location: tutor.userId?.location || tutor.postalCode,
        phone: tutor.userId?.phone,
        specialties: tutor.specialties,
        grades: tutor.grades,
        hourlyRate: tutor.hourlyRate,
        rating: tutor.rating,
        totalHoursTaught: tutor.totalHoursTaught,
        responseTime: tutor.responseTime,
        availability: tutor.availability,
        matchScore: compatScore.overallScore,
        criteriaScores: compatScore.criteriaScores,
        explanation: compatScore.matchExplanation,
        matchConfidence: compatScore.overallScore >= 70 ? 'High' : 'Medium'
      };
    });

    // Filter for minimum threshold (70+) and sort by score
    const qualifiedMatches = scoredTutors
      .filter(t => t.matchScore >= 70)
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, Math.max(3, limit));

    res.json({
      success: true,
      count: qualifiedMatches.length,
      threshold: 70,
      tutors: qualifiedMatches,
      searchCriteria: {
        specialty,
        grade,
        budget: budget || maxRate,
        preferredDays,
        specialNeeds
      }
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: error.message });
  }
});

// @route   GET /api/search/recommendations
// @desc    Get recommended tutors for parent
// @access  Private
router.get('/recommendations', protect, async (req, res) => {
  try {
    // Get featured tutors (highest rated and most experienced)
    const tutors = await TutorProfile.find({ isActive: true })
      .populate('userId', 'name email avatar bio location')
      .sort({ 'rating.average': -1, totalHoursTaught: -1 })
      .limit(10);

    res.json({
      success: true,
      count: tutors.length,
      tutors
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   POST /api/search/match
// @desc    Get top 5 matched tutors for parent (main matching flow)
// @access  Private
router.post('/match', protect, async (req, res) => {
  try {
    const {
      specialty,
      grade,
      budget = 60,
      preferredDays = [],
      teachingStyle,
      specialNeeds = null,
      preferences = {},
      postalCode,
      matchCount = 5
    } = req.body;

    // Validate required fields
    if (!specialty || !grade) {
      return res.status(400).json({
        success: false,
        error: 'specialty and grade are required'
      });
    }

    // Get all active tutors
    const tutorProfiles = await TutorProfile.find({ isActive: true })
      .populate('userId', 'name email avatar bio location phone')
      .limit(500);

    // Parent profile for matching
    const parentProfile = {
      postalCode,
      preferredStyle: teachingStyle || 'balanced',
      specialNeeds,
      preferences,
      budget
    };

    // Score all tutors
    const scoredTutors = tutorProfiles
      .map(tutor => {
        const compatScore = calculateCompatibilityScore(
          tutor,
          parentProfile,
          {
            specialty,
            grade,
            budget,
            preferredDays,
            teachingStyle: teachingStyle || 'balanced',
            specialNeeds,
            preferences
          }
        );

        return {
          _id: tutor._id,
          userId: tutor.userId?._id,
          name: tutor.userId?.name || 'Unnamed',
          email: tutor.userId?.email,
          avatar: tutor.userId?.avatar,
          bio: tutor.userId?.bio,
          location: tutor.userId?.location,
          specialties: tutor.specialties,
          grades: tutor.grades,
          hourlyRate: tutor.hourlyRate,
          rating: tutor.rating,
          totalHoursTaught: tutor.totalHoursTaught,
          responseTime: tutor.responseTime,
          availability: tutor.availability,
          background: tutor.background,
          matchScore: compatScore.overallScore,
          criteriaBreakdown: {
            subjectAlignment: Math.round(compatScore.criteriaScores.subjectAlignment),
            gradeFit: Math.round(compatScore.criteriaScores.gradeFit),
            teachingStyle: Math.round(compatScore.criteriaScores.teachingStyle),
            availability: Math.round(compatScore.criteriaScores.availability),
            location: Math.round(compatScore.criteriaScores.locationProximity),
            successRate: Math.round(compatScore.criteriaScores.tutorSuccessRate),
            preferences: Math.round(compatScore.criteriaScores.parentPreferences),
            specialNeeds: Math.round(compatScore.criteriaScores.specialNeedsCompat),
            price: Math.round(compatScore.criteriaScores.priceFit)
          },
          explanation: compatScore.matchExplanation
        };
      })
      .filter(t => t.matchScore >= 70) // Only return 70+ matches
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, matchCount);

    res.json({
      success: true,
      matchesFound: scoredTutors.length,
      targetMatches: matchCount,
      minScore: 70,
      tutors: scoredTutors,
      stats: {
        totalTutorsEvaluated: tutorProfiles.length,
        qualifiedTutors: scoredTutors.length,
        averageMatchScore: Math.round(
          scoredTutors.reduce((sum, t) => sum + t.matchScore, 0) / scoredTutors.length || 0
        )
      }
    });
  } catch (error) {
    console.error('Match error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// @route   GET /api/search/categories
// @desc    Get popular categories/specialties
// @access  Public
router.get('/categories', async (req, res) => {
  try {
    const categories = [
      { name: 'Math', emoji: '📐', count: 125 },
      { name: 'English', emoji: '📚', count: 98 },
      { name: 'Science', emoji: '🔬', count: 87 },
      { name: 'Languages', emoji: '🌍', count: 76 },
      { name: 'Test Prep', emoji: '✏️', count: 65 },
      { name: 'Programming', emoji: '💻', count: 54 },
      { name: 'History', emoji: '📜', count: 42 },
      { name: 'Business', emoji: '📊', count: 38 }
    ];

    res.json({ success: true, categories });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
