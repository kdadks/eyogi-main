import { HelpTopic } from './HelpModal'
import {
  ChartBarIcon,
  UserGroupIcon,
  DocumentTextIcon,
  AcademicCapIcon,
  BookOpenIcon,
  GlobeAltIcon,
  DocumentDuplicateIcon,
  ChartPieIcon,
} from '@heroicons/react/24/outline'

export const adminDashboardHelpTopics: HelpTopic[] = [
  {
    id: 'overview',
    title: 'Dashboard Overview',
    icon: '📊',
    description: 'Get started with the Admin Dashboard',
    sections: [
      {
        id: 'overview-intro',
        heading: 'What is the Admin Dashboard?',
        content:
          'The Admin Dashboard is a comprehensive management center for business administrators. From here, you can monitor platform metrics, manage users and content, handle enrollments, and access analytics to optimize your educational platform.',
        tips: [
          'Quick Stats show key metrics at a glance',
          'Notifications keep you informed about pending actions',
          'Tab navigation provides quick access to different management areas',
        ],
        example:
          'When you log in, you immediately see pending enrollments (4), new users this week (12), and total platform users (2,341) in the Quick Stats section.',
      },
      {
        id: 'overview-sidebar',
        heading: 'Sidebar Navigation',
        content:
          'The left sidebar contains all main management modules. Click any tab to navigate to that section. You can collapse the sidebar to maximize content area.',
        tips: [
          'Collapse sidebar with the hamburger menu icon',
          'All tabs clearly show their purpose with icons and labels',
          'Active tab is highlighted with a blue background',
        ],
        example: 'Click "Enrollments" tab to see all pending and approved student enrollments.',
      },
      {
        id: 'overview-notifications',
        heading: 'Notifications & Alerts',
        content:
          'The notification bell icon in the top-right shows important system alerts and updates. These include pending enrollments, new user registrations, and system warnings that need your attention.',
        tips: [
          'Click the bell icon to view all notifications',
          'Unread notifications are marked with a badge count',
          'Each notification shows type (info, warning, success, error) with color coding',
        ],
        example:
          'A warning notification appears: "15 enrollments pending approval - Review and approve to enable student access"',
      },
      {
        id: 'overview-quickstats',
        heading: 'Quick Stats Section',
        content:
          'The Quick Stats cards display key metrics: Pending Enrollments (needing approval), New Users (from last 7 days), and Total Users (cumulative platform users). These help you quickly assess platform health.',
        tips: [
          'Stats refresh automatically when you navigate',
          'Click a stat card to jump to the relevant management section',
          'Use these numbers to prioritize daily tasks',
        ],
        example:
          'If Pending Enrollments shows 8, you have 8 students waiting for enrollment approval. Click to go to Enrollments tab.',
      },
    ],
  },
  {
    id: 'analytics',
    title: 'Site Analytics',
    icon: '📈',
    description: 'Monitor platform performance and user behavior',
    sections: [
      {
        id: 'analytics-overview',
        heading: 'Analytics Dashboard',
        content:
          'The Analytics section provides comprehensive insights into platform performance, user engagement, course popularity, and revenue metrics. Use these insights to make data-driven decisions about platform improvements.',
        tips: [
          'Charts update in real-time with new data',
          'Filter analytics by date range for historical comparison',
          'Export reports for board meetings or stakeholder updates',
        ],
        example:
          'The User Growth chart shows your platform has grown from 1,500 users in January to 2,341 users today, a 56% increase.',
      },
      {
        id: 'analytics-engagement',
        heading: 'Engagement Metrics',
        content:
          'Track how actively users are engaging with the platform. Metrics include daily active users, course completion rates, average learning time, and user retention rates.',
        tips: [
          'High engagement rates indicate good content quality',
          'Low engagement may signal need for course improvements or better marketing',
          'Seasonal trends are normal in educational platforms',
        ],
        example:
          'Your analytics show 65% of enrolled students are actively participating in courses, with an average daily learning time of 45 minutes.',
      },
      {
        id: 'analytics-revenue',
        heading: 'Revenue & Financial Analytics',
        content:
          'Monitor monetary performance of your platform including total revenue, average enrollment value, refund rates, and revenue by course or batch.',
        tips: [
          'Revenue shows subscription income and one-time purchases combined',
          'Compare revenue trends month-over-month to identify seasonality',
          'High-revenue courses are your top performers',
        ],
        example:
          'This month shows $25,430 in total revenue, with the "Advanced Python" course generating $8,200 alone.',
      },
      {
        id: 'analytics-courses',
        heading: 'Course Performance Analytics',
        content:
          'See which courses are most popular, have highest completion rates, and generate the most revenue. This helps you identify successful content to replicate and underperforming courses needing improvement.',
        tips: [
          'Sort by enrollments, revenue, or completion rate',
          'High enrollment but low completion may indicate quality issues',
          'Use this data to guide content creation priorities',
        ],
        example:
          'Analytics show "Web Development Bootcamp" has 156 enrollments with 82% completion rate and $12,400 revenue - your top performer.',
      },
    ],
  },
  {
    id: 'enrollments',
    title: 'Enrollment Management',
    icon: '✅',
    description: 'Approve, reject, and manage student enrollments',
    sections: [
      {
        id: 'enrollments-pending',
        heading: 'Pending Enrollments Queue',
        content:
          'All new enrollment requests appear in a queue awaiting approval. Review student information, course details, and enrollment requests before approving or rejecting.',
        tips: [
          'Prioritize processing pending enrollments daily',
          'Check student eligibility requirements before approving',
          'Bulk actions available for processing multiple enrollments at once',
        ],
        example:
          'You see 4 pending enrollments: 3 students enrolled in "Python Basics" and 1 in "Data Science". Review each, then approve all with the "Approve All" button.',
      },
      {
        id: 'enrollments-approval',
        heading: 'Approving Enrollments',
        content:
          'Click the "Approve" button next to an enrollment to confirm it. Once approved, the student gains access to the course and can begin learning immediately.',
        tips: [
          'Approved enrollments cannot be undone - review carefully before approving',
          'The student receives an email confirmation when approved',
          'Keep approval times quick to maintain student satisfaction',
        ],
        example:
          'You review "Rajesh Kumar" for Python Basics enrollment - verified student details are correct, click "Approve", and he immediately gains course access.',
      },
      {
        id: 'enrollments-rejection',
        heading: 'Rejecting Enrollments',
        content:
          'If an enrollment does not meet requirements, click "Reject" and provide a reason. The student receives notification with explanation and can reapply after addressing issues.',
        tips: [
          'Always provide a clear rejection reason',
          'Common reasons: prerequisite not met, payment failed, duplicate enrollment',
          'Help students understand what they need to do to be approved',
        ],
        example:
          'Student lacks required prerequisite (Java Basics). Click "Reject", select reason "Prerequisite not met", and add message: "Complete Java Basics first".',
      },
      {
        id: 'enrollments-filters',
        heading: 'Filtering & Search',
        content:
          'Use search and filter options to find specific enrollments. Filter by status (pending, approved, rejected), course, student name, or date range.',
        tips: [
          'Search by student email for quick lookup',
          'Filter by course to see all students in a batch',
          'Use date filters to see enrollments from specific time periods',
        ],
        example:
          'To approve all enrollments from today, filter by "Status: Pending" and "Date: Today", then use bulk approve action.',
      },
    ],
  },
  {
    id: 'students',
    title: 'Student Management',
    icon: '👥',
    description: 'Manage student profiles and enrollment data',
    sections: [
      {
        id: 'students-view',
        heading: 'Student Profiles',
        content:
          'View comprehensive student information including personal details, enrolled courses, progress, certificates earned, and engagement metrics. Each student has a detailed profile page.',
        tips: [
          'Click any student to view their full profile',
          'View all enrolled courses and completion status',
          'See student learning history and certificates',
        ],
        example:
          'Click on "Priya Sharma" to see her profile with 3 enrolled courses, 1 completed course with certificate, and 87% overall progress.',
      },
      {
        id: 'students-enrollment',
        heading: 'Managing Student Enrollments',
        content:
          'From a student profile, you can view all their course enrollments, see progress, modify enrollment status, or unenroll them if needed.',
        tips: [
          'Unenroll only as a last resort - provide explanation to student',
          'Monitor student progress to identify those needing support',
          'Can manually enroll students in courses if needed',
        ],
        example:
          'View "Amit Singh" enrolled in Python course at 45% completion. Contact him if progress stalls for 2 weeks.',
      },
      {
        id: 'students-progress',
        heading: 'Tracking Student Progress',
        content:
          'Monitor each student progress through courses including lesson completion, quiz scores, assignment submissions, and overall performance.',
        tips: [
          'Low progress may indicate student needs support',
          'Quiz and assignment scores show subject mastery',
          'Intervene early if student falls significantly behind',
        ],
        example:
          'Student "Deepak" completed 8 of 20 lessons, scored 65% on Quiz 2, and hasnt submitted Assignment 3. Contact to provide support.',
      },
      {
        id: 'students-search',
        heading: 'Search & Filter Students',
        content:
          'Find specific students using search by name, email, student ID, or filter by course, progress level, or enrollment date.',
        tips: [
          'Search is case-insensitive and partial matches work',
          'Filter by status to find active, inactive, or completed students',
          'Bulk export student list for reporting',
        ],
        example:
          'Search "Sharma" to find all students with that name, or filter by course "Web Development" to see all students in that batch.',
      },
    ],
  },
  {
    id: 'users',
    title: 'User Management',
    icon: '👤',
    description: 'Manage system users and access control',
    sections: [
      {
        id: 'users-overview',
        heading: 'User Accounts & Roles',
        content:
          'Manage all system users and their roles. Users can be Students, Teachers, Parents, Business Admins, or Super Admins. Each role has different permissions and capabilities.',
        tips: [
          'Students can only access courses theyve enrolled in',
          'Teachers create and manage courses, grade assignments',
          'Business Admins manage users, enrollments, content, and analytics',
          'Super Admins have full system access',
        ],
        example:
          'Your system has: 2,100 Students, 45 Teachers, 320 Parents, 3 Business Admins, and 1 Super Admin = 2,469 total users.',
      },
      {
        id: 'users-add',
        heading: 'Adding New Users',
        content:
          'Create new user accounts manually or invite via email. Assign role, email, and initial password. Users can change password on first login.',
        tips: [
          'Bulk invite features available for adding multiple users',
          'Email invitations include login instructions',
          'Set temporary passwords that users must change on first login',
        ],
        example:
          'Add new teacher: Click "Add User", enter name "Dr. Patel", email "patel@school.edu", assign role "Teacher", send invitation. Dr. Patel receives email and sets their password.',
      },
      {
        id: 'users-roles',
        heading: 'Managing User Roles',
        content:
          'Change user roles to promote teachers to admins, convert student accounts to parent accounts, or modify permissions. Role changes take effect immediately.',
        tips: [
          'Be careful changing roles - ensure user understands new responsibilities',
          'Super Admin role should be limited to senior staff only',
          'Teachers promoted to Business Admin get access to analytics and user management',
        ],
        example:
          'Experienced teacher "Rajesh" doing excellent course management. Change his role from Teacher to Business Admin to help manage the platform.',
      },
      {
        id: 'users-deactivate',
        heading: 'Deactivating & Removing Users',
        content:
          'Deactivate user accounts temporarily (they cannot log in) or permanently delete accounts. Deactivation is reversible, deletion is not.',
        tips: [
          'Always deactivate instead of delete if you might need the account later',
          'Notify users before deactivation',
          'Deletion removes all user data - use cautiously',
        ],
        example:
          'Student graduated and will not return. Deactivate account to keep records but prevent login. If confirmed no return needed, then permanently delete.',
      },
    ],
  },
  {
    id: 'teachers',
    title: 'Teacher Management',
    icon: '👨‍🏫',
    description: 'Manage teacher profiles, assignments, and performance',
    sections: [
      {
        id: 'teachers-overview',
        heading: 'Teacher Profiles & Dashboard',
        content:
          'View detailed information about each teacher including their qualification, subject expertise, courses taught, student reviews, and teaching performance metrics.',
        tips: [
          'Click any teacher to see their complete profile',
          'View all courses assigned to the teacher with student count',
          'See average student satisfaction ratings and reviews',
          'Track teaching hours and engagement metrics',
        ],
        example:
          'View "Prof. Sharma" profile: Teaching "Python Basics" (45 students), "Advanced Python" (28 students), 4.8★ rating from 150 student reviews, teaching for 2 years.',
      },
      {
        id: 'teachers-assign',
        heading: 'Assigning Teachers to Courses',
        content:
          'Assign qualified teachers to course batches. A teacher can teach multiple courses simultaneously if workload permits. Assignments include subject area, student capacity, and time commitment expectations.',
        tips: [
          'Match teacher expertise to course subject matter',
          'Consider teacher workload - limit to 2-3 courses per term',
          'New teachers should start with smaller batches',
          'Teacher-student ratio typically 1:25 to 1:40 optimal',
        ],
        example:
          'Assign "Dr. Kumar" to teach "Java Advanced" batch starting next quarter. 35 students enrolled, 8-week duration, 4 hours per week commitment expected.',
      },
      {
        id: 'teachers-performance',
        heading: 'Monitoring Teacher Performance',
        content:
          'Track teaching quality through student feedback, course completion rates, assignment grading speed, and attendance. Identify high performers for recognition and underperformers for support.',
        tips: [
          'Average student rating above 4.5★ indicates excellent teaching',
          'Fast assignment grading (within 3 days) improves student satisfaction',
          'High course completion rates reflect course quality and teacher engagement',
          'Identify mentorship opportunities for new teachers',
        ],
        example:
          'Teacher "Asha" has 4.2★ rating, grades assignments within 5 days, 68% student completion rate. Provide mentoring to improve grading speed and engagement.',
      },
      {
        id: 'teachers-training',
        heading: 'Teacher Support & Training',
        content:
          'Provide resources, training materials, and support for teachers to improve course delivery. Access to pedagogical resources, platform best practices, and peer collaboration opportunities.',
        tips: [
          'Offer regular training on platform features and pedagogy',
          'Share best practices from high-performing teachers',
          'Provide feedback and coaching for improvement areas',
          'Facilitate peer learning and collaboration',
        ],
        example:
          'Monthly teacher workshops on "Active Learning Strategies" and "Using Platform Analytics". Teachers network and share successful course modules.',
      },
    ],
  },
  {
    id: 'assignments',
    title: 'Course Assignments Management',
    icon: '📋',
    description: 'Create and manage course assignments and assessments',
    sections: [
      {
        id: 'assignments-overview',
        heading: 'Assignment Management System',
        content:
          'Centralized system for creating, distributing, grading, and tracking assignments across all courses. Teachers can create assignments; admins can monitor, audit, and ensure quality standards.',
        tips: [
          'Set clear deadlines with timezone awareness',
          'Use rubrics for consistent and fair grading',
          'Allow resubmissions for low-scoring assignments',
          'Track late submissions separately for reporting',
        ],
        example:
          'View all 234 active assignments across 18 course batches. Filter by status (active, graded, overdue) or course to find assignments needing attention.',
      },
      {
        id: 'assignments-create',
        heading: 'Creating Assignments',
        content:
          'Define assignment parameters: title, description, submission type (file, text, link), deadline, points, rubric criteria, and late submission policies. Support for various file types and formats.',
        tips: [
          'Clear instructions reduce student confusion and support requests',
          'Set realistic deadlines aligned with course pace',
          'Include rubric details (e.g., clarity 20%, correctness 60%, completeness 20%)',
          'Allow 1-2 days grace period for technical issues',
        ],
        example:
          'Create assignment: "Build Personal Website", Description with requirements, Due Sunday 11:59pm, 50 points, Rubric with 5 criteria, Allow resubmission for 5 days.',
      },
      {
        id: 'assignments-grading',
        heading: 'Grading & Feedback',
        content:
          'Monitor submission status, grade assignments using rubrics, provide detailed feedback, and track grading progress. Support for partial grading and peer review workflows.',
        tips: [
          'Grade within 3-5 days to maintain student motivation',
          'Use rubric-based grading for consistency',
          'Provide constructive feedback for improvement',
          'Identify common mistakes to address in class',
        ],
        example:
          'Monitor "Python Basics" Week 3 assignment: 38 submitted, 5 pending, 2 overdue. Grade 10 per day to stay on pace. Use rubric for quick, consistent grading.',
      },
      {
        id: 'assignments-analytics',
        heading: 'Assignment Analytics & Reports',
        content:
          'Analyze submission trends, grading times, score distributions, and student performance patterns. Generate reports by course, teacher, or assignment type.',
        tips: [
          'Track average submission time relative to deadline',
          'Monitor score distribution to identify gaps',
          'Identify students struggling with specific assignment types',
          'Use data to improve assignment design',
        ],
        example:
          'Report shows: 68% on-time submission rate, average score 75%, submission peak 2 hours before deadline. Consider deadline too tight - extend next cycle.',
      },
    ],
  },
  {
    id: 'media',
    title: 'Media Management',
    icon: '🎬',
    description: 'Upload, organize, and manage multimedia content',
    sections: [
      {
        id: 'media-overview',
        heading: 'Media & Asset Management',
        content:
          'Centralized library for managing course videos, images, documents, audio files, and other multimedia assets. Supports HD streaming, thumbnail generation, and metadata tagging.',
        tips: [
          'Organize media by course or topic for easy access',
          'Use descriptive filenames and metadata for searchability',
          'Monitor storage usage to manage platform costs',
          'Regular backups ensure media availability',
        ],
        example:
          'Media library contains 2,340 assets: 450 videos (245GB), 680 images (12GB), 420 PDFs (8GB), 790 audio files (15GB). Well organized by course.',
      },
      {
        id: 'media-upload',
        heading: 'Uploading & Encoding Media',
        content:
          'Upload media files with automatic encoding to multiple quality levels (480p, 720p, 1080p for video). Supports drag-and-drop bulk uploads and background processing.',
        tips: [
          'Upload high-resolution source files - system auto-optimizes',
          'Compress images before upload to save bandwidth',
          'Batch upload multiple files simultaneously',
          'Monitor upload progress and encoding status',
        ],
        example:
          'Upload course video: "Python 101 Lecture.mp4" (2.5GB). System processes and creates 480p, 720p, 1080p versions. Auto-generates thumbnail. Ready in 30 minutes.',
      },
      {
        id: 'media-storage',
        heading: 'Storage & Optimization',
        content:
          'Monitor storage usage, implement retention policies, optimize file sizes, and archive old media. Balance quality with storage costs and bandwidth.',
        tips: [
          'Set auto-delete policy for outdated course materials (e.g., after 2 years)',
          'Archive high-quality originals separately from streaming versions',
          'Monitor video bitrate - higher quality for lectures, lower for thumbnail previews',
          'Use CDN for global distribution and fast loading',
        ],
        example:
          'Review storage: Course videos taking 280GB. Identify "Archive 2023" videos (80GB) for cheaper archive storage. Saves 30% on monthly costs.',
      },
      {
        id: 'media-access',
        heading: 'Media Access & Permissions',
        content:
          'Control who can access, download, or share media. Set permissions by course, student group, or individual. Support for expiring links and watermarking.',
        tips: [
          'Restrict downloads to prevent unauthorized sharing',
          'Use watermarks on sensitive or premium content',
          'Create expiring download links for temporary access',
          'Track media access for licensing and compliance',
        ],
        example:
          'Premium course video: Set access for "Advanced Python" batch only. Add watermark with student name. Create 30-day download links. Log all access attempts.',
      },
    ],
  },
  {
    id: 'cms',
    title: 'Content Management System (CMS)',
    icon: '✏️',
    description: 'Manage course pages, content blocks, and digital assets',
    sections: [
      {
        id: 'cms-overview',
        heading: 'CMS Overview',
        content:
          'Comprehensive content management system for creating and managing course pages, content blocks, and structured learning materials. Supports rich text, video embeds, code blocks, and interactive elements.',
        tips: [
          'Plan content structure before creating pages',
          'Use consistent formatting and styling across courses',
          'Version control allows reverting to previous content',
          'Preview content before publishing to students',
        ],
        example:
          'Manage "Python Basics" course: 24 lesson pages (introduction, concepts, examples), 15 project pages, 8 quiz pages, 3 resource pages. All organized in course hierarchy.',
      },
      {
        id: 'cms-create',
        heading: 'Creating & Editing Content',
        content:
          'Create content pages with rich text editor, embed videos, code snippets, images, and interactive elements. Draft/Preview/Publish workflow ensures quality.',
        tips: [
          'Use heading hierarchy (H1, H2, H3) for structure',
          'Break content into short sections for readability',
          'Embed videos directly into content pages',
          'Use consistent formatting templates',
        ],
        example:
          'Create lesson: "Variables in Python". Title, introduction paragraph, 3 concept sections with examples, embedded video (5min), practice code block, summary.',
      },
      {
        id: 'cms-pages',
        heading: 'Managing Page Hierarchy',
        content:
          'Organize content into logical hierarchies: Courses > Modules > Lessons. Set dependencies, prerequisites, and unlock conditions. Control student access flow.',
        tips: [
          'Sequential modules improve learning flow',
          'Set "complete Module 1 before accessing Module 2" requirements',
          'Add progress indicators showing completion status',
          'Allow teachers to override prerequisites for individual students if needed',
        ],
        example:
          'Course Structure: Module 1 (Basics) > Lesson 1-5, Module 2 (Intermediate) requires Module 1 completion, Module 3 (Advanced) requires Module 2 completion.',
      },
      {
        id: 'cms-publish',
        heading: 'Publishing & Versioning',
        content:
          'Control when content becomes visible to students. Schedule content releases, maintain version history, and compare changes between versions.',
        tips: [
          'Schedule lesson releases to match course calendar',
          'Version history allows comparison of changes',
          'Bulk publish/unpublish multiple pages at once',
          'Archive old content versions for compliance',
        ],
        example:
          'Schedule "Week 4 Lessons" to publish Monday 9am. Content unavailable until then. If errors found, revert to previous version in seconds.',
      },
    ],
  },
  {
    id: 'courses',
    title: 'Course Management',
    icon: '📚',
    description: 'Create, edit, and manage courses and batches',
    sections: [
      {
        id: 'courses-overview',
        heading: 'Course & Batch System',
        content:
          'Courses are educational programs containing multiple lessons, assignments, and quizzes. Batches are scheduled instances of courses with specific start/end dates and enrollment limits.',
        tips: [
          'Multiple batches can run for the same course with different schedules',
          'Each batch has its own students and can have different pricing',
          'Courses must have at least one batch before students can enroll',
        ],
        example:
          'Course "Python Basics" has 3 active batches: Jan-Mar (40 students), Feb-Apr (25 students), Mar-May (starting soon with 0 enrollments).',
      },
      {
        id: 'courses-create',
        heading: 'Creating New Courses',
        content:
          'Add new courses to your platform with course title, description, learning outcomes, difficulty level, and course duration. Teachers can then be assigned to teach the course.',
        tips: [
          'Write clear course descriptions to attract students',
          'List specific learning outcomes students can expect',
          'Set appropriate difficulty levels (Beginner, Intermediate, Advanced)',
          'Define course prerequisites if needed',
        ],
        example:
          'Create new course: Title "Advanced JavaScript", Description "Master async programming, APIs, and frameworks", Duration "8 weeks", Difficulty "Advanced".',
      },
      {
        id: 'courses-content',
        heading: 'Organizing Course Content',
        content:
          'Courses contain modules (main sections) with lessons (individual content pieces). Each lesson can include video, text, code examples, assignments, and quizzes.',
        tips: [
          'Logical module organization improves student learning',
          'Mix content types - video, text, interactive exercises for engagement',
          'Include practice problems and real-world projects',
          'Build knowledge progressively from simple to complex',
        ],
        example:
          'JavaScript course structured as: Module 1 (Basics), Module 2 (DOM), Module 3 (Async), Module 4 (APIs), Module 5 (Frameworks with real project)',
      },
      {
        id: 'courses-batch',
        heading: 'Creating & Managing Batches',
        content:
          'Create specific batch instances with start date, end date, max students, pricing, and assigned teacher. Each batch runs independently with its own enrollment and grading.',
        tips: [
          'Schedule batches around student demand and teacher availability',
          'Limit batch sizes for better teacher-student ratio and engagement',
          'Offer multiple batch dates throughout the year',
          'Different pricing possible for different batches if needed',
        ],
        example:
          'Create batch of Python course: Start Jan 15, End Mar 15, Max 30 students, Price $199, Assign Teacher "Rajesh Kumar", Enable early bird discount 10%.',
      },
    ],
  },
  {
    id: 'gurukuls',
    title: 'Gurukul Management',
    icon: '🏛️',
    description: 'Manage educational institutions and centers',
    sections: [
      {
        id: 'gurukuls-overview',
        heading: 'What are Gurukuls?',
        content:
          'Gurukuls are educational institutions or learning centers within your platform. They can represent physical schools, training centers, or online learning organizations. Each gurukul can have its own courses, teachers, and students.',
        tips: [
          'Use Gurukuls to organize content by educational institution',
          'Each gurukul has its own brand and independent operations',
          'Perfect for school franchises or multi-center organizations',
        ],
        example:
          'Your platform hosts 3 gurukuls: "Delhi Public School", "STEM Academy", and "Online Learning Center", each with separate course catalogs.',
      },
      {
        id: 'gurukuls-create',
        heading: 'Creating a Gurukul',
        content:
          'Set up new educational institution with name, location, description, brand logo, and administrator contact. Configure governance and policies specific to the gurukul.',
        tips: [
          'Professional branding increases trust with students',
          'Clear location information helps local students find your institution',
          'Set up administrator contact for gurukul-specific issues',
        ],
        example:
          'Add gurukul: "Mumbai Tech Academy", Location "Mumbai", Description "Leading technology and programming school", Logo upload, Admin "Ms. Sharma".',
      },
      {
        id: 'gurukuls-teachers',
        heading: 'Managing Gurukul Teachers',
        content:
          'Assign teachers to gurukuls. Teachers can teach courses only in gurukuls they are assigned to. Multiple teachers per gurukul ensure course coverage.',
        tips: [
          'Each teacher specializes in certain subjects - assign accordingly',
          'Monitor teacher workload - typically 2-3 courses per teacher maximum',
          'Ensure subject expertise alignment with courses',
        ],
        example:
          'Gurukul "Tech Academy" has 12 teachers: 4 teaching Python courses, 3 teaching Web Development, 2 teaching Data Science, 3 teaching Mobile Development.',
      },
      {
        id: 'gurukuls-performance',
        heading: 'Gurukul Performance Analytics',
        content:
          'Track each gurukuls performance including total students, courses offered, revenue generated, student satisfaction ratings, and course completion rates.',
        tips: [
          'Compare performance across gurukuls to identify best practices',
          'High completion rates indicate quality content and instruction',
          'Low ratings suggest need for teacher training or curriculum review',
        ],
        example:
          'Compare Performance: Delhi Center (420 students, 8 courses, 78% completion, 4.5★), Mumbai Center (380 students, 6 courses, 72% completion, 4.2★).',
      },
    ],
  },
  {
    id: 'certificates',
    title: 'Certificate Management',
    icon: '🎓',
    description: 'Create and manage course completion certificates',
    sections: [
      {
        id: 'certificates-overview',
        heading: 'Certificate System',
        content:
          'Upon course completion, students receive digital certificates. Certificates validate course completion and can be downloaded, printed, or shared on professional networks.',
        tips: [
          'Professional certificates increase student motivation',
          'Certificates can be verified by employers through unique certificate ID',
          'Students can add certificates to LinkedIn and resumes',
        ],
        example:
          'Student "Ananya" completes "Python Basics" with 85% score. She receives certificate with unique ID, completion date, and course details. Can download and verify.',
      },
      {
        id: 'certificates-create',
        heading: 'Designing Certificates',
        content:
          'Create professional certificate templates with course branding, completion criteria, and layout customization. Set minimum score requirements for certificate eligibility.',
        tips: [
          'Include your institution name prominently',
          'Use professional design and logos',
          'Specify completion requirements (e.g., score must be 60% or higher)',
          'Include signature lines or digital signatures for authenticity',
        ],
        example:
          'Design certificate template: Header "XYZ Educational Platform", Course name, Student name, Completion date, Signature line, Unique certificate ID, Blue gradient background.',
      },
      {
        id: 'certificates-criteria',
        heading: 'Setting Completion Criteria',
        content:
          'Define what students must accomplish to earn certificates. Common criteria include minimum score on final assessment, completion of all lessons, or passing required assignments.',
        tips: [
          'Set realistic but meaningful criteria',
          'Higher standards increase certificate value',
          'Consider difficulty level when setting requirements',
        ],
        example:
          'Python Basics certificate requires: 100% lesson completion AND 70% minimum on final quiz. Advanced Python requires 80% minimum score.',
      },
      {
        id: 'certificates-verify',
        heading: 'Certificate Verification',
        content:
          'Employers and institutions can verify certificate authenticity using the unique certificate ID. Build trust through transparent verification processes.',
        tips: [
          'Maintain certificate database for verification queries',
          'Respond quickly to verification requests',
          'Build reputation as trustworthy credential issuer',
        ],
        example:
          'Employer verifies "Rajesh Kumar" certificate ID "PYT-2024-12549" confirming he completed Python Basics with distinction.',
      },
    ],
  },
]
