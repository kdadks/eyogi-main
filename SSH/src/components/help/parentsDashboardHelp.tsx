import React from 'react'
import { HelpTopic } from './HelpModal'

export const parentsDashboardHelpTopics: HelpTopic[] = [
  {
    id: 'overview',
    title: 'Dashboard Overview',
    icon: '👨‍👩‍👧‍👦',
    description: 'Monitor your child\'s learning journey and educational progress',
    sections: [
      {
        id: 'overview-children',
        heading: 'Your Children',
        content:
          'View all children linked to your account. Each child profile shows their current courses, completion status, and certificates earned.',
        tips: [
          'Add all your children to track their education',
          'Switch between child profiles to view individual progress',
          'Child profile shows real-time enrollment status',
          'Track multiple children\'s learning simultaneously',
        ],
      },
      {
        id: 'overview-progress',
        heading: 'Learning Progress Summary',
        content:
          'Quick overview of each child\'s learning statistics: courses in progress, completed courses, certificates earned, and overall learning pace.',
        tips: [
          'Monitor completion rate to ensure consistent engagement',
          'Check for long periods without progress',
          'Celebrate course completions and certificates',
          'Use progress to discuss learning goals with your child',
        ],
      },
      {
        id: 'overview-alerts',
        heading: 'Important Alerts',
        content:
          'Receive notifications about significant events: course completions, certificate awards, low engagement, or action items requiring parent approval.',
        tips: [
          'Enable notifications for important milestones',
          'Address low engagement early with encouragement',
          'Approve necessary consent forms when prompted',
          'Review alerts regularly for updates',
        ],
      },
    ],
  },
  {
    id: 'children',
    title: 'Children Management',
    icon: '👶',
    description: 'Add and manage your children\'s learning profiles',
    sections: [
      {
        id: 'children-add',
        heading: 'Adding Children',
        content:
          'Add your children to your parent account. Link existing student profiles or create new profiles for each child. Requires child email to establish connection.',
        tips: [
          'Link your child\'s existing student account',
          'Get child approval to link their account',
          'Create new profile if child doesn\'t have an account',
          'Use child\'s full legal name for official records',
        ],
      },
      {
        id: 'children-profile',
        heading: 'Child Profile Management',
        content:
          'View and manage each child\'s profile information, contact details, and educational records. Update information as needed.',
        tips: [
          'Keep contact information current',
          'Review profile for accuracy on certificates',
          'Note any special learning needs or accommodations',
          'Share profile information with child\'s school if needed',
        ],
      },
      {
        id: 'children-permissions',
        heading: 'Permission & Consent',
        content:
          'Manage permissions for your child\'s learning. As parent, you may need to approve certain actions or provide consent forms.',
        tips: [
          'Provide required parental consent for courses',
          'Approve third-party integrations if needed',
          'Manage data sharing preferences',
          'Review privacy policies for each course',
        ],
      },
    ],
  },
  {
    id: 'courses',
    title: 'Child\'s Courses',
    icon: '📚',
    description: 'Monitor courses your child is enrolled in or has completed',
    sections: [
      {
        id: 'courses-active',
        heading: 'Active Courses',
        content:
          'View courses your child is currently taking. Each course card shows progress, enrollment status, completion percentage, and time remaining.',
        tips: [
          'Check progress regularly to ensure engagement',
          'Click course to see detailed learning materials and activities',
          'Monitor completion percentage - should increase over time',
          'Note estimated completion date',
        ],
      },
      {
        id: 'courses-completed',
        heading: 'Completed Courses',
        content:
          'Archive of courses your child has successfully completed. Shows completion date, performance metrics, and earned certificates.',
        tips: [
          'Review completed courses to understand skills acquired',
          'Check for patterns in course choice and completion',
          'Use completed courses when discussing educational progress',
          'Archive data for future reference or applications',
        ],
      },
      {
        id: 'courses-details',
        heading: 'Course Content & Materials',
        content:
          'View course details, learning materials, and activities. Understand what your child is learning and how the course is structured.',
        tips: [
          'Review learning outcomes to understand course goals',
          'Check prerequisites your child should have',
          'See instructor credentials and background',
          'Review course format (self-paced, synchronous, etc.)',
        ],
      },
    ],
  },
  {
    id: 'progress',
    title: 'Learning Progress',
    icon: '📈',
    description: 'Track detailed learning progress and performance metrics',
    sections: [
      {
        id: 'progress-tracking',
        heading: 'Progress Tracking',
        content:
          'Monitor your child\'s progress in each course through percentage completion, assignments submitted, quizzes taken, and time spent learning.',
        tips: [
          'Regular progress indicates healthy engagement',
          'No progress for extended period may indicate disengagement',
          'Monitor consistency - steady progress is better than sporadic',
          'Note any dramatic changes in progress patterns',
        ],
      },
      {
        id: 'progress-assessment',
        heading: 'Performance & Grades',
        content:
          'View your child\'s performance in courses through grades, quiz scores, and assignment results. Understand strengths and areas for improvement.',
        tips: [
          'Review performance to understand learning strengths',
          'Identify areas where your child needs additional help',
          'Discuss grades and feedback with your child',
          'Connect feedback to real-world applications',
        ],
      },
      {
        id: 'progress-analytics',
        heading: 'Learning Analytics',
        content:
          'Detailed analytics showing learning patterns, time spent per course, topic mastery levels, and comparative performance metrics.',
        tips: [
          'Identify optimal learning times for your child',
          'See which topics are challenging vs. easy',
          'Monitor study consistency and time management',
          'Use data to discuss learning strategies',
        ],
      },
    ],
  },
  {
    id: 'certificates',
    title: 'Certificates & Achievements',
    icon: '🏆',
    description: 'View and manage certificates your child has earned',
    sections: [
      {
        id: 'certificates-earned',
        heading: 'Earned Certificates',
        content:
          'Collection of all certificates your child has earned by completing courses. Each certificate shows achievement date and course details.',
        tips: [
          'Celebrate certificate achievements with your child',
          'Download and print certificates to display',
          'Share certificates with grandparents or family',
          'Archive for future school or job applications',
        ],
      },
      {
        id: 'certificates-download',
        heading: 'Download & Share',
        content: 'Download certificates as PDFs. Share with schools, tutors, employers, or include in portfolios.',
        tips: [
          'Download in high-quality PDF format',
          'Print for display on child\'s wall or portfolio',
          'Share with child\'s school for academic records',
          'Use in job applications for internships',
        ],
      },
      {
        id: 'certificates-verification',
        heading: 'Certificate Verification',
        content:
          'Certificates include verification codes. Schools or employers can verify authenticity of certificates using the code.',
        tips: [
          'Keep verification codes for future reference',
          'Share verification details with relevant institutions',
          'Certificates are officially recorded in system',
          'Verify certificate details before sharing',
        ],
      },
    ],
  },
  {
    id: 'attendance',
    title: 'Attendance Monitoring',
    icon: '📅',
    description: 'Monitor your child\'s attendance and session participation',
    sections: [
      {
        id: 'attendance-records',
        heading: 'Attendance Records',
        content:
          'View attendance records for synchronous courses and batch learning sessions. See dates attended and any absences.',
        tips: [
          'Regular attendance ensures course completion eligibility',
          'Absences may impact certificate awards',
          'Encourage attendance for live interactive sessions',
          'Review attendance with your child',
        ],
      },
      {
        id: 'attendance-importance',
        heading: 'Attendance Impact',
        content:
          'Attendance is crucial for synchronous learning experiences. Regular participation improves learning outcomes and course completion.',
        tips: [
          'Ensure your child attends scheduled sessions',
          'Create regular learning schedule',
          'Provide quiet space for learning',
          'Encourage active participation during sessions',
        ],
      },
      {
        id: 'attendance-support',
        heading: 'Supporting Attendance',
        content:
          'As parent, help establish consistent learning routines. Support your child in meeting attendance commitments.',
        tips: [
          'Set regular learning times in family schedule',
          'Minimize distractions during course time',
          'Communicate schedule conflicts with instructors',
          'Celebrate good attendance milestones',
        ],
      },
    ],
  },
  {
    id: 'communication',
    title: 'Communication',
    icon: '💬',
    description: 'Communicate with instructors and manage learning support',
    sections: [
      {
        id: 'communication-instructors',
        heading: 'Contacting Instructors',
        content:
          'Send messages to course instructors regarding your child\'s learning, concerns, or accommodation needs.',
        tips: [
          'Reach out if child struggles with course content',
          'Communicate about attendance or health issues',
          'Discuss accommodations for special needs',
          'Be professional and constructive in communication',
        ],
      },
      {
        id: 'communication-support',
        heading: 'Learning Support',
        content:
          'Access resources for supporting your child\'s learning at home. Find tutoring, study guides, and parental guidance materials.',
        tips: [
          'Review course materials to understand content',
          'Help your child create study schedules',
          'Identify areas where additional support is needed',
          'Connect with tutors or learning specialists',
        ],
      },
    ],
  },
  {
    id: 'settings',
    title: 'Account Settings',
    icon: '⚙️',
    description: 'Manage account preferences and notification settings',
    sections: [
      {
        id: 'settings-notifications',
        heading: 'Notification Preferences',
        content:
          'Customize which notifications you receive. Choose alert types, frequency, and delivery methods (email, SMS, in-app).',
        tips: [
          'Enable alerts for course completions and certificates',
          'Get notified of low engagement or performance concerns',
          'Set notification frequency (immediate, daily digest, weekly)',
          'Choose preferred contact method',
        ],
      },
      {
        id: 'settings-privacy',
        heading: 'Privacy & Consent',
        content:
          'Manage privacy settings and data usage. Control how child\'s information is used and shared.',
        tips: [
          'Review and approve data consent forms',
          'Manage third-party sharing preferences',
          'Protect child\'s privacy and data',
          'Request data export or deletion if needed',
        ],
      },
      {
        id: 'settings-profile',
        heading: 'Parent Profile',
        content: 'Update your parent account information including name, email, phone, and contact preferences.',
        tips: [
          'Keep contact information current for important notifications',
          'Use valid email for account recovery',
          'Maintain multiple contact methods',
          'Review privacy settings regularly',
        ],
      },
    ],
  },
]
