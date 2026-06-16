import React from 'react'
import { HelpTopic } from './HelpModal'

export const studentDashboardHelpTopics: HelpTopic[] = [
  {
    id: 'home',
    title: 'Dashboard Home',
    icon: '🏠',
    description: 'Your personal learning hub with quick stats and recommendations',
    sections: [
      {
        id: 'home-welcome',
        heading: 'Welcome Section',
        content:
          'Your dashboard greets you with a personalized message showing the time of day and your name. Below are your key learning metrics at a glance.',
        tips: [
          'Check your completion rate to track overall progress',
          'Monitor active courses to know what\'s in progress',
          'See pending actions requiring your attention',
        ],
      },
      {
        id: 'home-stats',
        heading: 'Learning Statistics',
        content:
          'Quick view of your learning journey: total enrollments, active courses, completed courses, certificates earned, and upcoming batches. These update in real-time.',
        tips: [
          'Click on any stat to drill down for details',
          'Badges show count of pending or recommended actions',
          'Aim to increase completed courses and certificates',
        ],
      },
      {
        id: 'home-recommendations',
        heading: 'Recommended Courses',
        content:
          'See courses recommended based on your interests and learning history. Recommendations help you discover relevant learning opportunities.',
        tips: [
          'Browse recommended courses to expand your skills',
          'Check course details and prerequisites before enrolling',
          'Add courses to your wishlist for later',
        ],
      },
      {
        id: 'home-recent',
        heading: 'Recent Activity',
        content: 'See your recent actions: enrollments, course completions, certificates earned, and attendance records.',
        tips: [
          'Recent activity helps you remember where you left off',
          'Click on recent items to jump to that course or certificate',
        ],
      },
    ],
  },
  {
    id: 'courses',
    title: 'My Courses',
    icon: '📖',
    description: 'Browse and manage all your enrolled and available courses',
    sections: [
      {
        id: 'courses-enrolled',
        heading: 'Enrolled Courses',
        content:
          'View all courses you\'re currently enrolled in. Each course card shows progress bar, completion percentage, and enrollment status.',
        tips: [
          'Progress bar shows your completion percentage in the course',
          'Color coding: Green=Active, Blue=Completed, Yellow=Pending approval',
          'Click "Continue Learning" to resume the course',
          'See estimated time to complete remaining material',
        ],
        example:
          '"Python Basics" shows 65% complete with 3 weeks remaining. Green progress bar indicates active enrollment.',
      },
      {
        id: 'courses-catalog',
        heading: 'Course Catalog',
        content:
          'Browse all available courses. Filter by level, topic, and duration. View detailed course information before deciding to enroll.',
        tips: [
          'Read course descriptions to understand learning outcomes',
          'Check prerequisites to ensure readiness',
          'View instructor credentials and course reviews',
          'Enroll in courses matching your learning goals',
          'Filter by level: Elementary, Basic, Intermediate, Advanced',
        ],
      },
      {
        id: 'courses-search',
        heading: 'Finding Courses',
        content: 'Use search and filters to find courses matching your interests, skill level, and availability.',
        tips: [
          'Search by course title, topic, or keyword',
          'Filter by level to match your current skills',
          'Sort by popularity, newest, or duration',
          'Save searches for frequently looked-up topics',
        ],
      },
    ],
  },
  {
    id: 'enrollments',
    title: 'My Enrollments',
    icon: '📝',
    description: 'Track the status and history of all your course enrollments',
    sections: [
      {
        id: 'enrollment-status',
        heading: 'Enrollment Status',
        content:
          'View current status of each enrollment: Pending (awaiting approval), Approved (active learning), or Completed (finished course).',
        tips: [
          'Pending status means instructor needs to approve your enrollment',
          'Approved means you have full access to course materials',
          'Completed means you finished and can download certificate',
          'Contact instructor if approval is delayed',
        ],
      },
      {
        id: 'enrollment-history',
        heading: 'Enrollment History',
        content:
          'Complete record of all your enrollments including dates enrolled, approval dates, and completion dates. Useful for tracking your learning journey.',
        tips: [
          'Review your enrollment history for resume or portfolio',
          'Export enrollment records for official transcripts',
          'See patterns in your learning (frequency, types of courses)',
        ],
      },
      {
        id: 'enrollment-actions',
        heading: 'Enrollment Actions',
        content:
          'Request enrollment in new courses, withdraw from courses (if allowed), and download enrollment certificates or records.',
        tips: [
          'Withdraw from courses early if you change your learning goals',
          'Download enrollment certificates as proof of participation',
          'Contact instructors with questions about enrollment',
        ],
      },
    ],
  },
  {
    id: 'certificates',
    title: 'My Certificates',
    icon: '🎓',
    description: 'View and download your earned achievement certificates',
    sections: [
      {
        id: 'certificates-overview',
        heading: 'Your Achievements',
        content:
          'Gallery of all certificates you\'ve earned by completing courses. Each certificate shows the course name, completion date, and certificate ID.',
        tips: [
          'Download certificates as PDFs for your portfolio',
          'Share certificates on LinkedIn or resume',
          'Certificate ID can be verified by institutions',
          'Each certificate is dated and includes course details',
        ],
      },
      {
        id: 'certificates-download',
        heading: 'Downloading Certificates',
        content:
          'Download your certificates in PDF format. PDFs are high-quality and suitable for printing or sharing digitally.',
        tips: [
          'Download immediately after course completion',
          'Keep copies for your records',
          'Share certificates with employers or educators',
          'Certificates include verification details',
        ],
      },
      {
        id: 'certificates-verification',
        heading: 'Certificate Verification',
        content:
          'Each certificate has a unique verification code. Organizations can verify certificate authenticity using this code on the verification page.',
        tips: [
          'Share verification code with organizations checking your credentials',
          'Verification codes prove certificate authenticity',
          'Certificates are issued automatically upon course completion',
          'Archive certificates for future reference',
        ],
      },
    ],
  },
  {
    id: 'batches',
    title: 'My Batches',
    icon: '👫',
    description: 'Manage group learning cohorts and track group progress',
    sections: [
      {
        id: 'batch-overview',
        heading: 'Batch Learning Groups',
        content:
          'View batches (learning cohorts) you\'re part of. Batches are groups of students learning together with synchronized timelines and group activities.',
        tips: [
          'Batches provide structured group learning experiences',
          'All batch members learn content simultaneously',
          'Batch schedules are fixed - important for synchronous content',
          'Group participation enhances learning outcomes',
        ],
      },
      {
        id: 'batch-progress',
        heading: 'Tracking Batch Progress',
        content:
          'See overall batch progress and your individual progress within the batch. Compare your completion with other batch members.',
        tips: [
          'Batch progress shows percentage completion of group',
          'Your progress relative to batch average helps gauge engagement',
          'Accelerate or slow to match batch pace as needed',
          'Communicate with batch mates on group activities',
        ],
      },
      {
        id: 'batch-activities',
        heading: 'Batch Activities',
        content:
          'Participate in group activities, discussions, and projects organized at the batch level. Group activities enhance learning and community.',
        tips: [
          'Complete group activities to earn participation credits',
          'Collaborate with batch mates on projects',
          'Participate in discussions and forums',
          'Attend scheduled group sessions or meetings',
        ],
      },
    ],
  },
  {
    id: 'attendance',
    title: 'Attendance Records',
    icon: '✅',
    description: 'View your attendance for synchronous sessions and batches',
    sections: [
      {
        id: 'attendance-view',
        heading: 'Your Attendance',
        content:
          'View your attendance record for synchronous classes, batch sessions, and live meetings. Shows dates attended and any absences.',
        tips: [
          'Regular attendance improves course completion',
          'Absences may impact certificate eligibility',
          'Contact instructor about excused absences',
          'Review attendance before course ends',
        ],
      },
      {
        id: 'attendance-importance',
        heading: 'Why Attendance Matters',
        content:
          'Attendance affects your course completion, certificate eligibility, and learning outcomes. Participate actively in scheduled sessions.',
        tips: [
          'Attend synchronous sessions for live instruction',
          'Minimum attendance thresholds may be required for completion',
          'Make-up sessions available for excused absences',
          'Consistent attendance improves learning retention',
        ],
      },
    ],
  },
  {
    id: 'profile',
    title: 'Profile & Settings',
    icon: '👤',
    description: 'Manage your account and learning preferences',
    sections: [
      {
        id: 'profile-edit',
        heading: 'Edit Your Profile',
        content:
          'Update your personal information: name, email, phone, date of birth, and address. This information appears on certificates and official records.',
        tips: [
          'Use your legal name for certificates',
          'Keep email current for course notifications',
          'Add phone for instructor contact',
          'Verify address appears correctly on certificates',
        ],
      },
      {
        id: 'profile-preferences',
        heading: 'Learning Preferences',
        content:
          'Set preferences for course recommendations, notification frequency, and learning style. Customize your learning experience.',
        tips: [
          'Set preferred learning topics for better recommendations',
          'Choose notification frequency (daily, weekly, none)',
          'Indicate learning style (visual, interactive, etc.)',
          'Update language and timezone preferences',
        ],
      },
      {
        id: 'privacy-consent',
        heading: 'Privacy & Consent',
        content:
          'Manage your privacy settings and data consent preferences. Control how your data is used and shared.',
        tips: [
          'Review privacy policy to understand data usage',
          'Provide necessary consent for course features',
          'Manage third-party sharing preferences',
          'Request data export or deletion as needed',
        ],
      },
    ],
  },
  {
    id: 'analytics',
    title: 'Learning Analytics',
    icon: '📊',
    description: 'Track your personal learning performance and progress',
    sections: [
      {
        id: 'analytics-overview',
        heading: 'Your Learning Dashboard',
        content:
          'Visualize your learning journey with charts showing course completion trends, time spent learning, and progress metrics.',
        tips: [
          'Track learning consistency over time',
          'See which course topics take most time',
          'Identify your fastest-completed courses',
          'Use data to plan future learning',
        ],
      },
      {
        id: 'analytics-goals',
        heading: 'Learning Goals',
        content:
          'Set personal learning goals and track progress toward them. Monitor certificates earned and courses completed vs. targets.',
        tips: [
          'Set realistic monthly/yearly completion goals',
          'Track certificates earned toward career goals',
          'Adjust goals based on available time',
          'Celebrate milestones and achievements',
        ],
      },
      {
        id: 'analytics-insights',
        heading: 'Personalized Insights',
        content:
          'Receive AI-powered insights on your learning patterns, recommended next courses, and optimization tips.',
        tips: [
          'Follow course recommendations to stay on learning path',
          'Use performance insights to improve completion rates',
          'Understand your learning pace and style',
          'Get tips for more effective learning',
        ],
      },
    ],
  },
]
