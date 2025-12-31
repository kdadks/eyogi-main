import { supabaseAdmin } from '../supabase'
import { decryptProfileFields } from '../encryption'
import { getCountryNameFromISO3 } from '../iso-utils'
import { getStateName } from '../address-utils'

// ============================================
// COUNTRY & STATE MAPPINGS (ISO to Full Name)
// ============================================

const COUNTRY_CODES: Record<string, string> = {
  US: 'United States',
  GB: 'United Kingdom',
  CA: 'Canada',
  AU: 'Australia',
  IN: 'India',
  DE: 'Germany',
  FR: 'France',
  JP: 'Japan',
  CN: 'China',
  BR: 'Brazil',
  MX: 'Mexico',
  NZ: 'New Zealand',
  SG: 'Singapore',
  HK: 'Hong Kong',
  AE: 'United Arab Emirates',
  SA: 'Saudi Arabia',
  KR: 'South Korea',
  ID: 'Indonesia',
  TH: 'Thailand',
  MY: 'Malaysia',
  PH: 'Philippines',
  VN: 'Vietnam',
  TR: 'Turkey',
  IT: 'Italy',
  ES: 'Spain',
  NL: 'Netherlands',
  CH: 'Switzerland',
  SE: 'Sweden',
  NO: 'Norway',
  DK: 'Denmark',
  FI: 'Finland',
  PL: 'Poland',
  RU: 'Russia',
  ZA: 'South Africa',
  NG: 'Nigeria',
  EG: 'Egypt',
  ZM: 'Zambia',
  KE: 'Kenya',
}

const US_STATE_CODES: Record<string, string> = {
  AL: 'Alabama',
  AK: 'Alaska',
  AZ: 'Arizona',
  AR: 'Arkansas',
  CA: 'California',
  CO: 'Colorado',
  CT: 'Connecticut',
  DE: 'Delaware',
  FL: 'Florida',
  GA: 'Georgia',
  HI: 'Hawaii',
  ID: 'Idaho',
  IL: 'Illinois',
  IN: 'Indiana',
  IA: 'Iowa',
  KS: 'Kansas',
  KY: 'Kentucky',
  LA: 'Louisiana',
  ME: 'Maine',
  MD: 'Maryland',
  MA: 'Massachusetts',
  MI: 'Michigan',
  MN: 'Minnesota',
  MS: 'Mississippi',
  MO: 'Missouri',
  MT: 'Montana',
  NE: 'Nebraska',
  NV: 'Nevada',
  NH: 'New Hampshire',
  NJ: 'New Jersey',
  NM: 'New Mexico',
  NY: 'New York',
  NC: 'North Carolina',
  ND: 'North Dakota',
  OH: 'Ohio',
  OK: 'Oklahoma',
  OR: 'Oregon',
  PA: 'Pennsylvania',
  RI: 'Rhode Island',
  SC: 'South Carolina',
  SD: 'South Dakota',
  TN: 'Tennessee',
  TX: 'Texas',
  UT: 'Utah',
  VT: 'Vermont',
  VA: 'Virginia',
  WA: 'Washington',
  WV: 'West Virginia',
  WI: 'Wisconsin',
  WY: 'Wyoming',
  DC: 'District of Columbia',
}

const CANADIAN_PROVINCES: Record<string, string> = {
  AB: 'Alberta',
  BC: 'British Columbia',
  MB: 'Manitoba',
  NB: 'New Brunswick',
  NL: 'Newfoundland and Labrador',
  NS: 'Nova Scotia',
  ON: 'Ontario',
  PE: 'Prince Edward Island',
  QC: 'Quebec',
  SK: 'Saskatchewan',
  YT: 'Yukon',
  NT: 'Northwest Territories',
  NU: 'Nunavut',
}

const INDIAN_STATES: Record<string, string> = {
  AN: 'Andaman and Nicobar Islands',
  AP: 'Andhra Pradesh',
  AR: 'Arunachal Pradesh',
  AS: 'Assam',
  BR: 'Bihar',
  CG: 'Chhattisgarh',
  CH: 'Chandigarh',
  DL: 'Delhi',
  GA: 'Goa',
  GJ: 'Gujarat',
  HR: 'Haryana',
  HP: 'Himachal Pradesh',
  JK: 'Jammu and Kashmir',
  JH: 'Jharkhand',
  KA: 'Karnataka',
  KL: 'Kerala',
  LA: 'Ladakh',
  LD: 'Lakshadweep',
  MP: 'Madhya Pradesh',
  MH: 'Maharashtra',
  MN: 'Manipur',
  ML: 'Meghalaya',
  MZ: 'Mizoram',
  OD: 'Odisha',
  OL: 'Odisha',
  PB: 'Punjab',
  PY: 'Puducherry',
  RJ: 'Rajasthan',
  SK: 'Sikkim',
  TN: 'Tamil Nadu',
  TG: 'Telangana',
  TR: 'Tripura',
  UP: 'Uttar Pradesh',
  UK: 'Uttarakhand',
  WB: 'West Bengal',
}

const AUSTRALIAN_STATES: Record<string, string> = {
  NSW: 'New South Wales',
  VIC: 'Victoria',
  QLD: 'Queensland',
  WA: 'Western Australia',
  SA: 'South Australia',
  TAS: 'Tasmania',
  NT: 'Northern Territory',
  ACT: 'Australian Capital Territory',
}

// Note: getStateName is imported from address-utils and handles all countries

function getCountryName(code: string): string {
  if (!code || code === 'Unknown') return ''
  const name = getCountryNameFromISO3(code)
  return name || code
}

// ============================================
// TYPES & INTERFACES
// ============================================

export interface DateRange {
  start: string
  end: string
}

export interface StudentAnalytics {
  totalStudents: number
  activeStudents: number
  newStudents: number
  studentsByAgeGroup: Array<{
    ageGroup: string
    count: number
  }>
  studentsByLocation: Array<{
    city: string
    state: string
    country: string
    location: string
    count: number
  }>
  studentsByStatus: Array<{
    status: string
    count: number
  }>
  topStudents: Array<{
    id: string
    name: string
    coursesCompleted: number
    certificatesEarned: number
    attendanceRate: number
  }>
}

export interface EnrollmentAnalytics {
  totalEnrollments: number
  enrollmentsByStatus: Array<{
    status: string
    count: number
  }>
  enrollmentTrends: Array<{
    date: string
    count: number
  }>
  completionRate: number
  averageTimeToComplete: number
  enrollmentsByCourse: Array<{
    courseId: string
    courseName: string
    count: number
  }>
}

export interface CourseAnalytics {
  totalCourses: number
  activeCourses: number
  popularCourses: Array<{
    id: string
    title: string
    enrollments: number
    completions: number
    completionRate: number
  }>
  coursesByLevel: Array<{
    level: string
    count: number
  }>
  coursesByDeliveryMethod: Array<{
    method: string
    count: number
  }>
  capacityUtilization: Array<{
    courseId: string
    courseName: string
    enrolled: number
    maxStudents: number
    utilizationRate: number
  }>
}

export interface TeacherAnalytics {
  totalTeachers: number
  activeTeachers: number
  teacherWorkload: Array<{
    teacherId: string
    teacherName: string
    studentCount: number
    courseCount: number
    batchCount: number
    certificatesIssued: number
  }>
  topTeachers: Array<{
    teacherId: string
    teacherName: string
    metric: string
    value: number
  }>
}

export interface BatchAnalytics {
  totalBatches: number
  batchesByStatus: Array<{
    status: string
    count: number
  }>
  averageBatchSize: number
  batchProgress: Array<{
    batchId: string
    batchName: string
    totalWeeks: number
    completedWeeks: number
    progressPercentage: number
  }>
  batchesByGurukul: Array<{
    gurukulId: string
    gurukulName: string
    count: number
  }>
}

export interface AttendanceAnalytics {
  overallAttendanceRate: number
  attendanceByStatus: Array<{
    status: string
    count: number
    percentage: number
  }>
  attendanceTrends: Array<{
    date: string
    presentCount: number
    absentCount: number
    lateCount: number
    excusedCount: number
  }>
  lowAttendanceStudents: Array<{
    studentId: string
    studentName: string
    attendanceRate: number
    totalClasses: number
    presentCount: number
  }>
  perfectAttendanceStudents: Array<{
    studentId: string
    studentName: string
    totalClasses: number
  }>
}

export interface CertificateAnalytics {
  totalCertificates: number
  certificatesThisMonth: number
  certificatesThisWeek: number
  certificatesByCourse: Array<{
    courseId: string
    courseName: string
    count: number
  }>
  certificatesByGurukul: Array<{
    gurukulId: string
    gurukulName: string
    count: number
  }>
  certificatesByTeacher: Array<{
    teacherId: string
    teacherName: string
    count: number
  }>
  certificateTrends: Array<{
    date: string
    count: number
  }>
  averageTimeToComplete: number
}

export interface GurukulAnalytics {
  gurukulPerformance: Array<{
    gurukulId: string
    gurukulName: string
    courseCount: number
    studentCount: number
    enrollmentCount: number
    certificateCount: number
    completionRate: number
  }>
}

export interface SiteAnalytics {
  pageViews: Array<{
    pagePath: string
    views: number
    uniqueUsers: number
    averageDuration: number
  }>
  userActivity: Array<{
    date: string
    activeUsers: number
    sessions: number
  }>
  deviceTypes: Array<{
    deviceType: string
    count: number
    percentage: number
  }>
  topReferrers: Array<{
    referrer: string
    count: number
  }>
  locationData: Array<{
    country: string
    count: number
  }>
}

// ============================================
// STUDENT ANALYTICS
// ============================================

export async function getStudentAnalytics(
  dateRange: DateRange,
  gurukulId?: string,
): Promise<StudentAnalytics> {
  try {
    // Get all students
    let studentsQuery = supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('role', 'student')
      .gte('created_at', dateRange.start)
      .lte('created_at', dateRange.end)

    const { data: allStudents } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('role', 'student')

    // Decrypt all student profiles
    const decryptedAllStudents = allStudents?.map((student) => decryptProfileFields(student))

    const { data: newStudents } = await studentsQuery

    // Decrypt new student profiles
    const decryptedNewStudents = newStudents?.map((student) => decryptProfileFields(student))

    // Get students by age group
    const studentsByAge = (decryptedAllStudents || []).reduce((acc: any, student: any) => {
      if (student.age) {
        const ageGroup =
          student.age < 6
            ? '0-5'
            : student.age < 13
              ? '6-12'
              : student.age < 18
                ? '13-17'
                : student.age < 25
                  ? '18-24'
                  : '25+'
        acc[ageGroup] = (acc[ageGroup] || 0) + 1
      }
      return acc
    }, {})

    const studentsByAgeGroup = Object.entries(studentsByAge).map(([ageGroup, count]) => ({
      ageGroup,
      count: count as number,
    }))

    // Get students by location - group by state, country (not by city)
    const locationMap = new Map()
    ;(decryptedAllStudents || []).forEach((student: any) => {
      // State and country are not encrypted, use them for grouping
      const state = student.state || 'NULL'
      const country = student.country || 'NULL'

      // Create key using only state + country for grouping
      // City is only used for display when state is NULL
      const key = `${state}|${country}`
      locationMap.set(key, (locationMap.get(key) || 0) + 1)
    })

    const studentsByLocation = Array.from(locationMap.entries())
      .map(([key, count]) => {
        const [state, country] = key.split('|')

        // Get full country name
        const fullCountry = country !== 'NULL' ? getCountryName(country) : ''

        // Priority: state > country
        let location = ''
        if (state && state !== 'NULL') {
          // Show state + country
          const fullState = getStateName(country, state)
          const stateDisplay = fullState && fullState !== '' ? fullState : state
          location = fullCountry ? `${stateDisplay}, ${fullCountry}` : stateDisplay
        } else {
          // Fallback to country only if no state
          location = fullCountry || 'Unknown'
        }

        return { city: '', state, country, location, count }
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // Get students by status
    const statusMap = new Map()
    ;(decryptedAllStudents || []).forEach((student: any) => {
      const status = student.status || 'active'
      statusMap.set(status, (statusMap.get(status) || 0) + 1)
    })

    const studentsByStatus = Array.from(statusMap.entries()).map(([status, count]) => ({
      status,
      count,
    }))

    // Get top performing students
    const { data: enrollments } = await supabaseAdmin
      .from('enrollments')
      .select('student_id, status')
      .eq('status', 'completed')

    const { data: certificates } = await supabaseAdmin.from('certificates').select('student_id')

    const { data: attendanceRecords } = await supabaseAdmin
      .from('attendance_records')
      .select('student_id, status')

    const studentMetrics = new Map()

    // Count completions
    ;(enrollments || []).forEach((enr: any) => {
      const metrics = studentMetrics.get(enr.student_id) || {
        coursesCompleted: 0,
        certificatesEarned: 0,
        totalClasses: 0,
        presentClasses: 0,
      }
      metrics.coursesCompleted++
      studentMetrics.set(enr.student_id, metrics)
    })

    // Count certificates
    ;(certificates || []).forEach((cert: any) => {
      const metrics = studentMetrics.get(cert.student_id) || {
        coursesCompleted: 0,
        certificatesEarned: 0,
        totalClasses: 0,
        presentClasses: 0,
      }
      metrics.certificatesEarned++
      studentMetrics.set(cert.student_id, metrics)
    })

    // Calculate attendance
    ;(attendanceRecords || []).forEach((att: any) => {
      const metrics = studentMetrics.get(att.student_id) || {
        coursesCompleted: 0,
        certificatesEarned: 0,
        totalClasses: 0,
        presentClasses: 0,
      }
      metrics.totalClasses++
      if (att.status === 'present') metrics.presentClasses++
      studentMetrics.set(att.student_id, metrics)
    })

    const topStudents = Array.from(studentMetrics.entries())
      .map(([studentId, metrics]: [string, any]) => {
        const student = decryptedAllStudents?.find((s: any) => s.id === studentId)
        return {
          id: studentId,
          name: student?.full_name || 'Unknown',
          coursesCompleted: metrics.coursesCompleted,
          certificatesEarned: metrics.certificatesEarned,
          attendanceRate:
            metrics.totalClasses > 0
              ? Math.round((metrics.presentClasses / metrics.totalClasses) * 100)
              : 0,
        }
      })
      .sort((a, b) => b.coursesCompleted - a.coursesCompleted)
      .slice(0, 10)

    return {
      totalStudents: decryptedAllStudents?.length || 0,
      activeStudents: decryptedAllStudents?.filter((s: any) => s.status === 'active').length || 0,
      newStudents: decryptedNewStudents?.length || 0,
      studentsByAgeGroup,
      studentsByLocation,
      studentsByStatus,
      topStudents,
    }
  } catch (error) {
    console.error('Error fetching student analytics:', error)
    throw error
  }
}

// ============================================
// ENROLLMENT ANALYTICS
// ============================================

export async function getEnrollmentAnalytics(
  dateRange: DateRange,
  gurukulId?: string,
): Promise<EnrollmentAnalytics> {
  try {
    let query = supabaseAdmin.from('enrollments').select('*, course:courses(title, gurukul_id)')

    const { data: enrollments } = await query

    // Filter by gurukul if specified
    const filteredEnrollments = gurukulId
      ? enrollments?.filter((e: any) => e.course?.gurukul_id === gurukulId)
      : enrollments

    // Enrollments in date range
    const rangeEnrollments = filteredEnrollments?.filter(
      (e: any) => e.created_at >= dateRange.start && e.created_at <= dateRange.end,
    )

    // By status (filtered by date range)
    const statusMap = new Map()
    ;(rangeEnrollments || []).forEach((enr: any) => {
      statusMap.set(enr.status, (statusMap.get(enr.status) || 0) + 1)
    })

    const enrollmentsByStatus = Array.from(statusMap.entries()).map(([status, count]) => ({
      status,
      count,
    }))

    // Enrollment trends (based on selected date range)
    const dailyEnrollments = new Map()
    ;(rangeEnrollments || []).forEach((enr: any) => {
      const date = new Date(enr.created_at)
      const dateStr = date.toISOString().split('T')[0]
      dailyEnrollments.set(dateStr, (dailyEnrollments.get(dateStr) || 0) + 1)
    })

    const enrollmentTrends = Array.from(dailyEnrollments.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // Completion rate (filtered by date range)
    const completedCount =
      rangeEnrollments?.filter((e: any) => e.status === 'completed').length || 0
    const totalCount = rangeEnrollments?.length || 1
    const completionRate = Math.round((completedCount / totalCount) * 100)

    // Average time to complete (filtered by date range)
    const completedEnrollments =
      rangeEnrollments?.filter((e: any) => e.status === 'completed' && e.completed_at) || []
    const totalDays = completedEnrollments.reduce((sum: number, enr: any) => {
      const start = new Date(enr.enrolled_at)
      const end = new Date(enr.completed_at)
      const days = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
      return sum + days
    }, 0)
    const averageTimeToComplete =
      completedEnrollments.length > 0 ? Math.round(totalDays / completedEnrollments.length) : 0

    // By course (filtered by date range)
    const courseMap = new Map()
    ;(rangeEnrollments || []).forEach((enr: any) => {
      const courseId = enr.course_id
      const courseName = enr.course?.title || 'Unknown'
      const existing = courseMap.get(courseId) || { courseId, courseName, count: 0 }
      existing.count++
      courseMap.set(courseId, existing)
    })

    const enrollmentsByCourse = Array.from(courseMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    return {
      totalEnrollments: rangeEnrollments?.length || 0,
      enrollmentsByStatus,
      enrollmentTrends,
      completionRate,
      averageTimeToComplete,
      enrollmentsByCourse,
    }
  } catch (error) {
    console.error('Error fetching enrollment analytics:', error)
    throw error
  }
}

// ============================================
// COURSE ANALYTICS
// ============================================

export async function getCourseAnalytics(
  dateRange: DateRange,
  gurukulId?: string,
): Promise<CourseAnalytics> {
  try {
    let coursesQuery = supabaseAdmin.from('courses').select('*')
    if (gurukulId) {
      coursesQuery = coursesQuery.eq('gurukul_id', gurukulId)
    }

    const { data: courses } = await coursesQuery

    const activeCourses = courses?.filter((c: any) => c.is_active).length || 0

    // Get enrollments for each course
    const { data: enrollments } = await supabaseAdmin
      .from('enrollments')
      .select('course_id, status')

    // Popular courses
    const courseStats = new Map()
    ;(enrollments || []).forEach((enr: any) => {
      const stats = courseStats.get(enr.course_id) || { enrollments: 0, completions: 0 }
      stats.enrollments++
      if (enr.status === 'completed') stats.completions++
      courseStats.set(enr.course_id, stats)
    })

    const popularCourses = (courses || [])
      .map((course: any) => {
        const stats = courseStats.get(course.id) || { enrollments: 0, completions: 0 }
        return {
          id: course.id,
          title: course.title,
          enrollments: stats.enrollments,
          completions: stats.completions,
          completionRate:
            stats.enrollments > 0 ? Math.round((stats.completions / stats.enrollments) * 100) : 0,
        }
      })
      .sort((a, b) => b.enrollments - a.enrollments)
      .slice(0, 10)

    // By level
    const levelMap = new Map()
    ;(courses || []).forEach((course: any) => {
      levelMap.set(course.level, (levelMap.get(course.level) || 0) + 1)
    })

    const coursesByLevel = Array.from(levelMap.entries()).map(([level, count]) => ({
      level,
      count,
    }))

    // By delivery method
    const methodMap = new Map()
    ;(courses || []).forEach((course: any) => {
      methodMap.set(course.delivery_method, (methodMap.get(course.delivery_method) || 0) + 1)
    })

    const coursesByDeliveryMethod = Array.from(methodMap.entries()).map(([method, count]) => ({
      method,
      count,
    }))

    // Capacity utilization
    const capacityUtilization = (courses || [])
      .map((course: any) => {
        const stats = courseStats.get(course.id) || { enrollments: 0 }
        const enrolled = stats.enrollments
        const maxStudents = course.max_students || 1
        return {
          courseId: course.id,
          courseName: course.title,
          enrolled,
          maxStudents,
          utilizationRate: Math.round((enrolled / maxStudents) * 100),
        }
      })
      .sort((a, b) => b.utilizationRate - a.utilizationRate)
      .slice(0, 10)

    return {
      totalCourses: courses?.length || 0,
      activeCourses,
      popularCourses,
      coursesByLevel,
      coursesByDeliveryMethod,
      capacityUtilization,
    }
  } catch (error) {
    console.error('Error fetching course analytics:', error)
    throw error
  }
}

// ============================================
// TEACHER ANALYTICS
// ============================================

export async function getTeacherAnalytics(
  dateRange: DateRange,
  gurukulId?: string,
): Promise<TeacherAnalytics> {
  try {
    const { data: teachers } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('role', 'teacher')

    // Decrypt all teacher profiles
    const decryptedTeachers = teachers?.map((teacher) => decryptProfileFields(teacher))

    const activeTeachers = decryptedTeachers?.filter((t: any) => t.status === 'active').length || 0

    // Get teacher workload
    // Note: teacher_id in course_assignments is profiles.id (UUID)
    const { data: courseAssignments } = await supabaseAdmin
      .from('course_assignments')
      .select('teacher_id, course:courses(id, title)')
      .eq('is_active', true)

    const { data: batches } = await supabaseAdmin
      .from('batches')
      .select('teacher_id, students:batch_students(count)')
      .eq('is_active', true)

    const { data: certificates } = await supabaseAdmin.from('certificates').select('teacher_id')

    const teacherMetrics = new Map()

    // Count courses - teacher_id is profiles.id (UUID)
    ;(courseAssignments || []).forEach((assignment: any) => {
      if (assignment.teacher_id) {
        const metrics = teacherMetrics.get(assignment.teacher_id) || {
          studentCount: 0,
          courseCount: 0,
          batchCount: 0,
          certificatesIssued: 0,
        }
        metrics.courseCount++
        teacherMetrics.set(assignment.teacher_id, metrics)
      }
    })

    // Count batches and students
    ;(batches || []).forEach((batch: any) => {
      if (batch.teacher_id) {
        const metrics = teacherMetrics.get(batch.teacher_id) || {
          studentCount: 0,
          courseCount: 0,
          batchCount: 0,
          certificatesIssued: 0,
        }
        metrics.batchCount++
        metrics.studentCount += batch.students?.[0]?.count || 0
        teacherMetrics.set(batch.teacher_id, metrics)
      }
    })

    // Count certificates
    ;(certificates || []).forEach((cert: any) => {
      if (cert.teacher_id) {
        const metrics = teacherMetrics.get(cert.teacher_id) || {
          studentCount: 0,
          courseCount: 0,
          batchCount: 0,
          certificatesIssued: 0,
        }
        metrics.certificatesIssued++
        teacherMetrics.set(cert.teacher_id, metrics)
      }
    })

    const teacherWorkload = (decryptedTeachers || [])
      .map((teacher: any) => {
        const metrics = teacherMetrics.get(teacher.id) || {
          studentCount: 0,
          courseCount: 0,
          batchCount: 0,
          certificatesIssued: 0,
        }
        return {
          teacherId: teacher.id,
          teacherName: teacher.full_name || 'Unknown',
          studentCount: metrics.studentCount,
          courseCount: metrics.courseCount,
          batchCount: metrics.batchCount,
          certificatesIssued: metrics.certificatesIssued,
        }
      })
      .filter((t) => t.studentCount > 0 || t.courseCount > 0)
      .sort((a, b) => b.studentCount - a.studentCount)

    const topTeachers = teacherWorkload.slice(0, 10).map((t) => ({
      teacherId: t.teacherId,
      teacherName: t.teacherName,
      metric: 'students',
      value: t.studentCount,
    }))

    return {
      totalTeachers: decryptedTeachers?.length || 0,
      activeTeachers,
      teacherWorkload,
      topTeachers,
    }
  } catch (error) {
    console.error('Error fetching teacher analytics:', error)
    throw error
  }
}

// ============================================
// BATCH ANALYTICS
// ============================================

export async function getBatchAnalytics(
  dateRange: DateRange,
  gurukulId?: string,
): Promise<BatchAnalytics> {
  try {
    let batchQuery = supabaseAdmin
      .from('batches')
      .select(
        '*, gurukul:gurukuls(name), students:batch_students(count), progress:batch_progress(*)',
      )

    if (gurukulId) {
      batchQuery = batchQuery.eq('gurukul_id', gurukulId)
    }

    const { data: batches } = await batchQuery

    // Fetch batch courses and course details separately
    const batchIds = (batches || []).map((batch: any) => batch.id)
    let coursesQuery = supabaseAdmin
      .from('batch_courses')
      .select('batch_id, course:courses(duration_weeks)')
      .in('batch_id', batchIds)
      .eq('is_active', true)

    const { data: coursesData } = await coursesQuery

    // Create a map of batch_id to course data
    const courseMap = new Map<string, any>()
    coursesData?.forEach((item: any) => {
      if (item.course && !courseMap.has(item.batch_id)) {
        courseMap.set(item.batch_id, item.course)
      }
    })

    // By status
    const statusMap = new Map()
    ;(batches || []).forEach((batch: any) => {
      statusMap.set(batch.status, (statusMap.get(batch.status) || 0) + 1)
    })

    const batchesByStatus = Array.from(statusMap.entries()).map(([status, count]) => ({
      status,
      count,
    }))

    // Average batch size
    const totalStudents = (batches || []).reduce((sum: number, batch: any) => {
      return sum + (batch.students?.[0]?.count || 0)
    }, 0)
    const averageBatchSize = batches?.length ? Math.round(totalStudents / batches.length) : 0

    // Batch progress
    const batchProgress = (batches || [])
      .map((batch: any) => {
        const progress = batch.progress || []
        const course = courseMap.get(batch.id)
        const totalWeeks = course?.duration_weeks || 0
        const completedWeeks = progress.filter((p: any) => p.is_completed).length
        return {
          batchId: batch.id,
          batchName: batch.name,
          totalWeeks,
          completedWeeks,
          progressPercentage: totalWeeks > 0 ? Math.round((completedWeeks / totalWeeks) * 100) : 0,
        }
      })
      .sort((a, b) => b.progressPercentage - a.progressPercentage)
      .slice(0, 10)

    // By gurukul
    const gurukulMap = new Map()
    ;(batches || []).forEach((batch: any) => {
      const gurukulId = batch.gurukul_id
      const gurukulName = batch.gurukul?.name || 'Unknown'
      const existing = gurukulMap.get(gurukulId) || { gurukulId, gurukulName, count: 0 }
      existing.count++
      gurukulMap.set(gurukulId, existing)
    })

    const batchesByGurukul = Array.from(gurukulMap.values())

    return {
      totalBatches: batches?.length || 0,
      batchesByStatus,
      averageBatchSize,
      batchProgress,
      batchesByGurukul,
    }
  } catch (error) {
    console.error('Error fetching batch analytics:', error)
    throw error
  }
}

// ============================================
// ATTENDANCE ANALYTICS
// ============================================

export async function getAttendanceAnalytics(
  dateRange: DateRange,
  gurukulId?: string,
): Promise<AttendanceAnalytics> {
  try {
    // Convert ISO timestamp to date-only strings for comparison with class_date field
    const startDate = new Date(dateRange.start).toISOString().split('T')[0]
    const endDate = new Date(dateRange.end).toISOString().split('T')[0]

    const { data: attendanceRecords, error: fetchError } = await supabaseAdmin
      .from('attendance_records')
      .select(
        `
        *,
        student:profiles!attendance_records_student_id_fkey(full_name),
        batch:batches(id, gurukul_id)
      `,
      )
      .gte('class_date', startDate)
      .lte('class_date', endDate)

    if (fetchError) {
      console.error('Error fetching attendance records:', fetchError)
      throw fetchError
    }

    if (!attendanceRecords || attendanceRecords.length === 0) {
      return {
        overallAttendanceRate: 0,
        attendanceByStatus: [],
        attendanceTrends: [],
        lowAttendanceStudents: [],
        perfectAttendanceStudents: [],
      }
    }

    // Decrypt student profiles in attendance records
    const decryptedAttendanceRecords = attendanceRecords.map((record) => ({
      ...record,
      student: record.student ? decryptProfileFields(record.student) : null,
    }))

    const filteredRecords = gurukulId
      ? decryptedAttendanceRecords.filter((r: any) => {
          const batchGurukulId = r.batch?.gurukul_id
          return batchGurukulId === gurukulId
        })
      : decryptedAttendanceRecords

    const totalRecords = filteredRecords.length || 0

    if (totalRecords === 0) {
      return {
        overallAttendanceRate: 0,
        attendanceByStatus: [],
        attendanceTrends: [],
        lowAttendanceStudents: [],
        perfectAttendanceStudents: [],
      }
    }

    // By status
    const statusMap = new Map()
    ;(filteredRecords || []).forEach((record: any) => {
      statusMap.set(record.status, (statusMap.get(record.status) || 0) + 1)
    })

    const attendanceByStatus = Array.from(statusMap.entries()).map(([status, count]) => ({
      status,
      count,
      percentage: totalRecords > 0 ? Math.round((count / totalRecords) * 100) : 0,
    }))

    const presentCount = statusMap.get('present') || 0
    const lateCount = statusMap.get('late') || 0
    const excusedCount = statusMap.get('excused') || 0
    const attendedCount = presentCount + lateCount + excusedCount
    const overallAttendanceRate =
      totalRecords > 0 ? Math.round((attendedCount / totalRecords) * 100) : 0

    // Attendance trends
    const dailyAttendance = new Map()
    ;(filteredRecords || []).forEach((record: any) => {
      const date = record.class_date
      const daily = dailyAttendance.get(date) || {
        date,
        presentCount: 0,
        absentCount: 0,
        lateCount: 0,
        excusedCount: 0,
      }
      if (record.status === 'present') daily.presentCount++
      if (record.status === 'absent') daily.absentCount++
      if (record.status === 'late') daily.lateCount++
      if (record.status === 'excused') daily.excusedCount++
      dailyAttendance.set(date, daily)
    })

    const attendanceTrends = Array.from(dailyAttendance.values())
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30) // Last 30 days

    // Student attendance rates
    const studentAttendance = new Map()
    ;(filteredRecords || []).forEach((record: any) => {
      const studentId = record.student_id
      const stats = studentAttendance.get(studentId) || {
        studentId,
        studentName: record.student?.full_name || 'Unknown',
        totalClasses: 0,
        presentCount: 0,
      }
      stats.totalClasses++
      if (record.status === 'present') stats.presentCount++
      studentAttendance.set(studentId, stats)
    })

    const lowAttendanceStudents = Array.from(studentAttendance.values())
      .map((stats: any) => ({
        ...stats,
        attendanceRate:
          stats.totalClasses > 0 ? Math.round((stats.presentCount / stats.totalClasses) * 100) : 0,
      }))
      .filter((s) => s.attendanceRate < 75 && s.totalClasses >= 5)
      .sort((a, b) => a.attendanceRate - b.attendanceRate)
      .slice(0, 10)

    const perfectAttendanceStudents = Array.from(studentAttendance.values())
      .filter((stats: any) => stats.totalClasses === stats.presentCount && stats.totalClasses >= 5)
      .map((stats: any) => ({
        studentId: stats.studentId,
        studentName: stats.studentName,
        totalClasses: stats.totalClasses,
      }))
      .slice(0, 10)

    return {
      overallAttendanceRate,
      attendanceByStatus,
      attendanceTrends,
      lowAttendanceStudents,
      perfectAttendanceStudents,
    }
  } catch (error) {
    console.error('Error fetching attendance analytics:', error)
    throw error
  }
}

// ============================================
// CERTIFICATE ANALYTICS
// ============================================

export async function getCertificateAnalytics(
  dateRange: DateRange,
  gurukulId?: string,
): Promise<CertificateAnalytics> {
  try {
    const { data: allCertificates } = await supabaseAdmin
      .from('certificates')
      .select(
        '*, course:courses(title, gurukul_id), teacher:profiles!certificates_teacher_id_fkey(full_name)',
      )
      .eq('is_active', true)

    // Decrypt teacher profiles in certificates
    const decryptedAllCertificates = allCertificates?.map((cert) => ({
      ...cert,
      teacher: cert.teacher ? decryptProfileFields(cert.teacher) : null,
    }))

    const filteredCertificates = gurukulId
      ? decryptedAllCertificates?.filter((c: any) => c.course?.gurukul_id === gurukulId)
      : decryptedAllCertificates

    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const certificatesThisWeek =
      filteredCertificates?.filter((c: any) => new Date(c.created_at) >= weekAgo).length || 0

    const certificatesThisMonth =
      filteredCertificates?.filter((c: any) => new Date(c.created_at) >= monthAgo).length || 0

    // By course
    const courseMap = new Map()
    ;(filteredCertificates || []).forEach((cert: any) => {
      const courseId = cert.course_id
      const courseName = cert.course?.title || 'Unknown'
      const existing = courseMap.get(courseId) || { courseId, courseName, count: 0 }
      existing.count++
      courseMap.set(courseId, existing)
    })

    const certificatesByCourse = Array.from(courseMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // By gurukul
    const gurukulMap = new Map()
    ;(filteredCertificates || []).forEach((cert: any) => {
      const gurukulId = cert.course?.gurukul_id || 'unknown'
      const gurukulName = 'Gurukul'
      const existing = gurukulMap.get(gurukulId) || { gurukulId, gurukulName, count: 0 }
      existing.count++
      gurukulMap.set(gurukulId, existing)
    })

    const certificatesByGurukul = Array.from(gurukulMap.values())

    // By teacher
    const teacherMap = new Map()
    ;(filteredCertificates || []).forEach((cert: any) => {
      if (cert.teacher_id) {
        const teacherId = cert.teacher_id
        const teacherName = cert.teacher?.full_name || 'Unknown'
        const existing = teacherMap.get(teacherId) || { teacherId, teacherName, count: 0 }
        existing.count++
        teacherMap.set(teacherId, existing)
      }
    })

    const certificatesByTeacher = Array.from(teacherMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // Certificate trends (last 30 days)
    const dailyCertificates = new Map()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    ;(filteredCertificates || []).forEach((cert: any) => {
      const date = new Date(cert.created_at)
      if (date >= thirtyDaysAgo) {
        const dateStr = date.toISOString().split('T')[0]
        dailyCertificates.set(dateStr, (dailyCertificates.get(dateStr) || 0) + 1)
      }
    })

    const certificateTrends = Array.from(dailyCertificates.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // Average time to complete
    const { data: enrollments } = await supabaseAdmin
      .from('enrollments')
      .select('enrolled_at, completed_at')
      .eq('status', 'completed')
      .not('completed_at', 'is', null)

    const totalDays = (enrollments || []).reduce((sum: number, enr: any) => {
      const start = new Date(enr.enrolled_at)
      const end = new Date(enr.completed_at)
      const days = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
      return sum + days
    }, 0)

    const averageTimeToComplete = enrollments?.length
      ? Math.round(totalDays / enrollments.length)
      : 0

    return {
      totalCertificates: filteredCertificates?.length || 0,
      certificatesThisMonth,
      certificatesThisWeek,
      certificatesByCourse,
      certificatesByGurukul,
      certificatesByTeacher,
      certificateTrends,
      averageTimeToComplete,
    }
  } catch (error) {
    console.error('Error fetching certificate analytics:', error)
    throw error
  }
}

// ============================================
// GURUKUL ANALYTICS
// ============================================

export async function getGurukulAnalytics(dateRange: DateRange): Promise<GurukulAnalytics> {
  try {
    const { data: gurukuls } = await supabaseAdmin.from('gurukuls').select('*')

    const { data: courses } = await supabaseAdmin.from('courses').select('id, gurukul_id')

    // Fetch enrollments with course_id to join with courses manually
    const { data: enrollments } = await supabaseAdmin
      .from('enrollments')
      .select('id, course_id, student_id, status')

    const { data: certificates } = await supabaseAdmin.from('certificates').select('id, course_id')

    const { data: batchStudents } = await supabaseAdmin
      .from('batch_students')
      .select('student_id, batch:batches(gurukul_id)')

    // Create a map of course_id to gurukul_id for efficient lookup
    const courseGurukulMap = new Map<string, string>()
    ;(courses || []).forEach((course: any) => {
      if (course.id && course.gurukul_id) {
        courseGurukulMap.set(course.id, course.gurukul_id)
      }
    })

    const gurukulPerformance = (gurukuls || []).map((gurukul: any) => {
      const gurukulCourses = courses?.filter((c: any) => c.gurukul_id === gurukul.id) || []

      // Get course IDs for this gurukul
      const gurukulCourseIds = new Set(gurukulCourses.map((c: any) => c.id))

      // Filter enrollments by checking if course_id belongs to this gurukul
      const gurukulEnrollments =
        enrollments?.filter((e: any) => {
          if (!e.course_id) return false
          const courseGurukulId = courseGurukulMap.get(e.course_id)
          return courseGurukulId === gurukul.id
        }) || []

      // Filter certificates similarly
      const gurukulCertificates =
        certificates?.filter((c: any) => {
          if (!c.course_id) return false
          const courseGurukulId = courseGurukulMap.get(c.course_id)
          return courseGurukulId === gurukul.id
        }) || []

      // Get unique students from both batch_students and enrollments
      const studentIds = new Set<string>()

      // Add students from batch_students
      batchStudents?.forEach((bs: any) => {
        if (bs.batch?.gurukul_id === gurukul.id && bs.student_id) {
          studentIds.add(bs.student_id)
        }
      })

      // Also add students from enrollments for this gurukul
      gurukulEnrollments.forEach((e: any) => {
        if (e.student_id) {
          studentIds.add(e.student_id)
        }
      })

      const completedEnrollments = gurukulEnrollments.filter(
        (e: any) => e.status === 'completed',
      ).length
      const totalEnrollments = gurukulEnrollments.length || 1

      return {
        gurukulId: gurukul.id,
        gurukulName: gurukul.name,
        courseCount: gurukulCourses.length,
        studentCount: studentIds.size,
        enrollmentCount: gurukulEnrollments.length,
        certificateCount: gurukulCertificates.length,
        completionRate: Math.round((completedEnrollments / totalEnrollments) * 100),
      }
    })

    return {
      gurukulPerformance,
    }
  } catch (error) {
    console.error('Error fetching gurukul analytics:', error)
    throw error
  }
}

// ============================================
// SITE ANALYTICS
// ============================================

export async function getSiteAnalytics(dateRange: DateRange): Promise<SiteAnalytics> {
  try {
    const { data: pageAnalytics } = await supabaseAdmin
      .from('page_analytics')
      .select('*')
      .gte('created_at', dateRange.start)
      .lte('created_at', dateRange.end)

    // Page views
    const pageViewMap = new Map()
    const usersByPage = new Map()
    const durationsByPage = new Map()

    ;(pageAnalytics || []).forEach((record: any) => {
      const page = record.page_path

      // Count views
      pageViewMap.set(page, (pageViewMap.get(page) || 0) + 1)

      // Track unique users
      if (!usersByPage.has(page)) {
        usersByPage.set(page, new Set())
      }
      if (record.user_id) {
        usersByPage.get(page).add(record.user_id)
      }

      // Track durations
      if (record.duration_seconds) {
        if (!durationsByPage.has(page)) {
          durationsByPage.set(page, [])
        }
        durationsByPage.get(page).push(record.duration_seconds)
      }
    })

    const pageViews = Array.from(pageViewMap.entries())
      .map(([pagePath, views]) => {
        const uniqueUsers = usersByPage.get(pagePath)?.size || 0
        const durations = durationsByPage.get(pagePath) || []
        const averageDuration =
          durations.length > 0
            ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
            : 0

        return {
          pagePath,
          views,
          uniqueUsers,
          averageDuration,
        }
      })
      .sort((a, b) => b.views - a.views)
      .slice(0, 20)

    // User activity by date
    const dailyActivity = new Map()
    ;(pageAnalytics || []).forEach((record: any) => {
      const date = new Date(record.created_at).toISOString().split('T')[0]
      const activity = dailyActivity.get(date) || { date, activeUsers: new Set(), sessions: 0 }

      if (record.user_id) {
        activity.activeUsers.add(record.user_id)
      }
      if (record.session_id) {
        activity.sessions++
      }

      dailyActivity.set(date, activity)
    })

    const userActivity = Array.from(dailyActivity.values())
      .map(({ date, activeUsers, sessions }) => ({
        date,
        activeUsers: activeUsers.size,
        sessions,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // Device types
    const deviceMap = new Map()
    const totalDevices = pageAnalytics?.length || 1

    ;(pageAnalytics || []).forEach((record: any) => {
      const device = record.device_type || 'unknown'
      deviceMap.set(device, (deviceMap.get(device) || 0) + 1)
    })

    const deviceTypes = Array.from(deviceMap.entries()).map(([deviceType, count]) => ({
      deviceType,
      count,
      percentage: Math.round((count / totalDevices) * 100),
    }))

    // Top referrers with source parsing
    const referrerMap = new Map()
    const sourceMap = new Map()

    ;(pageAnalytics || []).forEach((record: any) => {
      if (record.referrer) {
        // Filter out localhost referrers
        if (!isLocalhost(record.referrer)) {
          referrerMap.set(record.referrer, (referrerMap.get(record.referrer) || 0) + 1)

          // Parse source from referrer
          const source = parseReferrerSource(record.referrer)
          sourceMap.set(source, (sourceMap.get(source) || 0) + 1)
        }
      } else {
        // No referrer means direct traffic
        sourceMap.set('Direct', (sourceMap.get('Direct') || 0) + 1)
      }
    })

    const topReferrers = Array.from(referrerMap.entries())
      .map(([referrer, count]) => ({ referrer, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    const trafficSources = Array.from(sourceMap.entries())
      .map(([source, count]) => ({
        source,
        count,
        percentage: Math.round((count / (pageAnalytics?.length || 1)) * 100),
      }))
      .sort((a, b) => b.count - a.count)

    // Location data
    const locationMap = new Map()
    ;(pageAnalytics || []).forEach((record: any) => {
      if (record.country) {
        locationMap.set(record.country, (locationMap.get(record.country) || 0) + 1)
      }
    })

    const locationData = Array.from(locationMap.entries())
      .map(([country, count]) => ({
        country,
        count,
        percentage: Math.round((count / (pageAnalytics?.length || 1)) * 100),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15)

    // Browser statistics
    const browserMap = new Map()
    ;(pageAnalytics || []).forEach((record: any) => {
      if (record.browser) {
        browserMap.set(record.browser, (browserMap.get(record.browser) || 0) + 1)
      }
    })

    const browserStats = Array.from(browserMap.entries())
      .map(([browser, count]) => ({
        browser,
        count,
        percentage: Math.round((count / (pageAnalytics?.length || 1)) * 100),
      }))
      .sort((a, b) => b.count - a.count)

    return {
      pageViews,
      userActivity,
      deviceTypes,
      browserStats,
      topReferrers,
      trafficSources,
      locationData,
    }
  } catch (error) {
    console.error('Error fetching site analytics:', error)
    // Return empty data if page_analytics table doesn't exist
    return {
      pageViews: [],
      userActivity: [],
      deviceTypes: [],
      browserStats: [],
      topReferrers: [],
      trafficSources: [],
      locationData: [],
    }
  }
}

// Helper function to check if referrer is from localhost
function isLocalhost(referrer: string): boolean {
  if (!referrer) return false
  try {
    const url = new URL(referrer)
    const hostname = url.hostname.toLowerCase()
    return (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname.startsWith('localhost:') ||
      hostname.startsWith('127.0.0.1:')
    )
  } catch {
    return false
  }
}

// Helper function to parse referrer into source categories
function parseReferrerSource(referrer: string): string {
  if (!referrer) return 'Direct'

  // Don't track localhost referrers
  if (isLocalhost(referrer)) return null as any

  try {
    const url = new URL(referrer)
    const hostname = url.hostname.toLowerCase()

    // Social Media
    if (hostname.includes('facebook.com') || hostname.includes('fb.com')) return 'Facebook'
    if (hostname.includes('twitter.com') || hostname.includes('t.co')) return 'Twitter'
    if (hostname.includes('linkedin.com')) return 'LinkedIn'
    if (hostname.includes('instagram.com')) return 'Instagram'
    if (hostname.includes('youtube.com')) return 'YouTube'
    if (hostname.includes('pinterest.com')) return 'Pinterest'
    if (hostname.includes('reddit.com')) return 'Reddit'
    if (hostname.includes('tiktok.com')) return 'TikTok'

    // Search Engines
    if (hostname.includes('google.com') || hostname.includes('google.')) return 'Google'
    if (hostname.includes('bing.com')) return 'Bing'
    if (hostname.includes('yahoo.com')) return 'Yahoo'
    if (hostname.includes('duckduckgo.com')) return 'DuckDuckGo'
    if (hostname.includes('baidu.com')) return 'Baidu'

    // Email
    if (hostname.includes('mail.') || hostname.includes('outlook.') || hostname.includes('gmail.'))
      return 'Email'

    // External Referral
    return 'External'
  } catch {
    return 'Unknown'
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

export function getDateRange(period: string): DateRange {
  const end = new Date()
  const start = new Date()

  switch (period) {
    case '7d':
      start.setDate(start.getDate() - 7)
      break
    case '30d':
      start.setDate(start.getDate() - 30)
      break
    case '90d':
      start.setDate(start.getDate() - 90)
      break
    case '1y':
      start.setFullYear(start.getFullYear() - 1)
      break
    default:
      start.setDate(start.getDate() - 30)
  }

  return {
    start: start.toISOString(),
    end: end.toISOString(),
  }
}
