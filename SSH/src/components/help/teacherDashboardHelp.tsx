import React from 'react'
import {
  BookOpenIcon,
  UserGroupIcon,
  TrophyIcon,
  ChartBarIcon,
  QueueListIcon,
  CalendarDaysIcon,
  Cog6ToothIcon,
  PlusIcon,
  ClockIcon,
  DocumentTextIcon,
  AcademicCapIcon,
} from '@heroicons/react/24/outline'
import { HelpTopic } from './HelpModal'

export const teacherDashboardHelpTopics: HelpTopic[] = [
  {
    id: 'overview',
    title: 'Dashboard Overview',
    icon: '📊',
    description: 'Get a quick snapshot of your teaching activity and key metrics',
    sections: [
      {
        id: 'overview-stats',
        heading: 'Key Statistics',
        content:
          'The overview displays important metrics at a glance: total courses you have created, total unique students enrolled, certificates issued, and active batches. These numbers update in real-time as students enroll and complete courses.',
        tips: [
          'Click on any stat card to drill down and see detailed information',
          'Stats are calculated from real database data, ensuring accuracy',
          'Pending approvals and certificates badges appear on relevant stats',
        ],
      },
      {
        id: 'overview-actions',
        heading: 'Quick Actions',
        content:
          'Quick action buttons provide shortcuts to the most common tasks: creating new courses, reviewing pending enrollments, issuing certificates, and viewing analytics.',
        tips: [
          'Use "Create New Course" to launch a new educational offering',
          'Check "Review Enrollments" for pending approvals requiring your attention',
          'Use "Issue Certificates" to award students who have completed courses',
          'View "Analytics" to track your teaching performance',
        ],
      },
      {
        id: 'overview-activity',
        heading: 'Recent Activity & Insights',
        content:
          'See recent student completions, certificate issuances, and enrollment requests. Performance insights show your completion rate, revenue, and other key teaching metrics.',
        tips: [
          'Recent activity updates automatically as students engage',
          'Completion rate shows percentage of enrolled students who finished courses',
          'Review insights regularly to improve course quality and engagement',
        ],
      },
    ],
  },
  {
    id: 'courses',
    title: 'My Courses',
    icon: '📚',
    description: 'Create, manage, and monitor your educational courses',
    sections: [
      {
        id: 'course-creation',
        heading: 'Creating a New Course',
        content:
          'Click "Create New Course" to open the course creation form. Fill in required fields including title (minimum 5 characters), description (minimum 20 characters), level, and learning outcomes.',
        tips: [
          'Course title should be clear and descriptive of what students will learn',
          'Level options: Elementary, Basic, Intermediate, Advanced',
          'Add multiple learning outcomes to set clear expectations',
          'Slug is auto-generated but can be customized for URL-friendly names',
          'Mark "Includes Certificate" to automatically issue certs on completion',
        ],
        example:
          'Creating "Advanced Python Programming": Set level to Advanced, add outcomes like "Master async/await patterns" and "Build production-ready applications"',
      },
      {
        id: 'course-details',
        heading: 'Course Details & Management',
        content:
          'Each course card shows key information: cover image, enrolled students, completion rate, and pending certificates. Click "View Details" to see full course information and manage it.',
        tips: [
          'Hover over enrollment stats to see breakdown of approved, completed, and pending students',
          'Color-coded badges indicate course status and student engagement',
          'Add course prerequisites to help students self-assess readiness',
          'Set pricing and currency for paid courses',
          'Add video preview URL for course marketing',
        ],
      },
      {
        id: 'course-media',
        heading: 'Media & SEO Settings',
        content:
          'Upload course images (thumbnail and cover), add video preview URL, and optimize for search engines with meta title and description.',
        tips: [
          'Course images should be clear and professional (recommended: 800x600px or larger)',
          'Meta title and description improve course visibility in search results',
          'Video previews help students decide whether to enroll',
          'Use high-quality images to increase course appeal',
        ],
      },
    ],
  },
  {
    id: 'students',
    title: 'Student & Batch Enrollment',
    icon: '👥',
    description: 'Manage student enrollments and organize students into learning batches',
    sections: [
      {
        id: 'enrollment-approvals',
        heading: 'Pending Enrollment Approvals',
        content:
          'Review and approve new enrollment requests from students. Each request shows student details and which course they want to enroll in. Approve, reject, or request more information.',
        tips: [
          'Approve enrollments to allow students access to course materials',
          'Reject enrollments if they don\'t meet prerequisites',
          'Process approvals regularly to maintain student satisfaction',
          'Email notifications are sent to students upon approval/rejection',
        ],
      },
      {
        id: 'enrolled-students',
        heading: 'Enrolled Students Management',
        content:
          'View all students currently enrolled in your courses. See their enrollment status, courses taken, completed courses, and certificates earned. Export student data for records.',
        tips: [
          'Filter students by enrollment status (approved, completed, pending)',
          'Click on student names to see detailed enrollment history',
          'Track individual student progress and engagement',
          'Export enrollment data for reporting or analysis',
        ],
      },
      {
        id: 'batch-enrollment',
        heading: 'Batch Enrollment Workflow',
        content:
          'Organize students into learning groups (batches). First, create a batch for your course. Then, enroll registered students into the batch. Finally, mark batch as completed and issue certificates to all students.',
        tips: [
          'Step 1: Create a batch and assign it to a course',
          'Step 2: Enroll students - only registered students can be added',
          'Step 3: Track batch progress through the course',
          'Step 4: Mark complete and issue certificates to all batch students',
          'Batches help manage group learning experiences and cohort-based courses',
        ],
        example:
          'For "Python Bootcamp": Create batch for September cohort → Enroll 25 students → Track progress weekly → Mark complete after 12 weeks → Issue 25 certificates',
      },
    ],
  },
  {
    id: 'certificates',
    title: 'Certificate Management',
    icon: '🏆',
    description: 'Issue and manage student certificates for course completion',
    sections: [
      {
        id: 'cert-templates',
        heading: 'Certificate Templates',
        content:
          'Browse available certificate templates designed for different course types and contexts. Preview templates before selecting. Templates can be customized with your course name and student information.',
        tips: [
          'Choose templates that match your course branding and style',
          'Preview templates to ensure they look professional',
          'Different templates available for individual courses vs. batches',
          'Customize template text to include course-specific information',
        ],
      },
      {
        id: 'cert-issuance',
        heading: 'Issuing Certificates',
        content:
          'Issue certificates to students who have completed courses. Select eligible students (those with completed enrollments) and choose a certificate template. Certificates are generated as PDFs and can be downloaded or emailed to students.',
        tips: [
          'Only students with "completed" enrollment status are eligible',
          'Bulk issue certificates to multiple students at once',
          'Download PDF certificates to archive or email directly',
          'Certificate issuance triggers automatic notifications to students',
          'Prevent duplicate certificates - system checks before issuing',
        ],
        example:
          'For course completion: Select all students with "completed" status → Choose professional certificate template → Issue certificates → System sends emails with PDF attachments',
      },
      {
        id: 'batch-certs',
        heading: 'Batch Certificate Issuance',
        content:
          'Issue certificates to all students in a completed batch at once. Select the batch, choose template, and issue certificates in one operation. Saves time for group courses.',
        tips: [
          'Only completed batches appear in the batch certificate section',
          'Batch issuance is faster than individual student issuance',
          'All students in the batch receive certificates simultaneously',
          'Track certificate issuance status for each batch',
        ],
      },
    ],
  },
  {
    id: 'batches',
    title: 'Batch Management',
    icon: '📦',
    description: 'Organize students into learning cohorts and track their progress',
    sections: [
      {
        id: 'batch-creation',
        heading: 'Creating Batches',
        content:
          'Create learning batches to organize students into groups. Each batch is tied to a specific course. Set batch start and end dates, maximum students, and other parameters.',
        tips: [
          'Name batches by cohort (e.g., "September 2024 Cohort")',
          'Set realistic start and end dates for the learning period',
          'Limit batch size to maintain quality of instruction',
          'Batches can be reused across multiple offerings of the same course',
        ],
      },
      {
        id: 'batch-students',
        heading: 'Managing Batch Students',
        content:
          'Add registered students to batches. Only students in your student database can be enrolled. Remove students if needed, track attendance, and monitor progress.',
        tips: [
          'Only registered students appear in the enrollment list',
          'Enroll students before or after batch creation',
          'Track per-student progress within the batch',
          'Export student attendance and progress reports',
        ],
      },
      {
        id: 'batch-progress',
        heading: 'Tracking Batch Progress',
        content:
          'Monitor overall batch progress with percentage completion metrics. See how many students have completed the course, earned certificates, and are currently active.',
        tips: [
          'Progress percentage shows overall batch completion status',
          'Color-coded indicators show batch status (active, completed, etc.)',
          'Compare performance across different batches of the same course',
          'Use progress data to identify struggling students early',
        ],
      },
    ],
  },
  {
    id: 'analytics',
    title: 'Analytics & Insights',
    icon: '📈',
    description: 'Analyze teaching performance and student engagement patterns',
    sections: [
      {
        id: 'analytics-overview',
        heading: 'Analytics Dashboard',
        content:
          'Comprehensive view of your teaching metrics including total enrollments, completion rates, revenue (if applicable), and student engagement trends. Data updates daily.',
        tips: [
          'Monitor completion rate to gauge course effectiveness',
          'Track revenue to understand course financial performance',
          'Compare metrics across different courses and time periods',
          'Export analytics reports for stakeholder communication',
        ],
      },
      {
        id: 'course-analytics',
        heading: 'Per-Course Analytics',
        content:
          'Deep-dive analytics for each course showing enrollment trends, dropout rates, completion patterns, and student feedback. Identify which courses perform best.',
        tips: [
          'High completion rate indicates engaging course content',
          'Identify courses with high dropout to plan improvements',
          'Track enrollment trends to predict demand',
          'Use feedback data to iterate on course content',
        ],
      },
      {
        id: 'student-analytics',
        heading: 'Student Performance',
        content:
          'Track individual and cohort-level student performance. See which students are struggling, completing ahead of schedule, or at risk of dropping out.',
        tips: [
          'Early intervention with struggling students improves outcomes',
          'Recognize and celebrate high-performing students',
          'Use data to provide personalized learning recommendations',
          'Share progress updates with students to boost motivation',
        ],
      },
    ],
  },
  {
    id: 'attendance',
    title: 'Attendance Tracking',
    icon: '📅',
    description: 'Monitor student attendance for batches and synchronous sessions',
    sections: [
      {
        id: 'attendance-recording',
        heading: 'Recording Attendance',
        content:
          'Mark student attendance for synchronous sessions or batch meetings. Track who attended and who missed sessions to identify engagement issues.',
        tips: [
          'Record attendance for in-person or live virtual sessions',
          'Identify chronic absentees who may need intervention',
          'Use attendance data to contact students about course engagement',
          'Export attendance reports for institutional records',
        ],
      },
      {
        id: 'attendance-reports',
        heading: 'Attendance Reports',
        content:
          'Generate attendance reports showing per-student attendance rates, frequent absences, and patterns. Use for performance evaluations and interventions.',
        tips: [
          'Track attendance trends over time',
          'Correlate attendance with course completion',
          'Use low attendance as early warning of potential dropout',
          'Share reports with students to encourage participation',
        ],
      },
    ],
  },
  {
    id: 'profile',
    title: 'Profile & Settings',
    icon: '⚙️',
    description: 'Manage your profile information and dashboard preferences',
    sections: [
      {
        id: 'profile-info',
        heading: 'Profile Information',
        content:
          'Update your personal information including name, email, phone number, and address. This information is displayed to students and in official documents.',
        tips: [
          'Keep contact information current for student communication',
          'Use professional photo for credibility',
          'Add bio or credentials to build student confidence',
          'Update address for official certificates and documents',
        ],
      },
      {
        id: 'privacy-settings',
        heading: 'Privacy & Consent',
        content:
          'View and manage student data consent records. See when students gave consent for data usage and audit consent history for compliance.',
        tips: [
          'Review student consent regularly for compliance',
          'Maintain consent audit trail for regulatory purposes',
          'Respect student privacy preferences',
          'Only view sensitive data as permitted by role',
        ],
      },
    ],
  },
]
