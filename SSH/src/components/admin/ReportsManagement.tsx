import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import {
  DocumentChartBarIcon,
  ArrowDownTrayIcon,
  FunnelIcon,
  CalendarIcon,
  AcademicCapIcon,
  BuildingLibraryIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline'
import {
  generateEnrollmentReport,
  generateBatchReport,
  exportToCSV,
  EnrollmentReportRecord,
  BatchReportRecord,
  EnrollmentReportFilters,
  BatchReportFilters,
} from '@/lib/api/reports'
import { getGurukuls } from '@/lib/api/gurukuls'
import { getCourses } from '@/lib/api/courses'
import { getBatches } from '@/lib/api/batches'
import { Gurukul, Course, Batch } from '@/types'
import toast from 'react-hot-toast'

type ReportType = 'enrollment' | 'batch'

const ReportsManagement: React.FC = () => {
  const [reportType, setReportType] = useState<ReportType>('enrollment')
  const [loading, setLoading] = useState(false)
  const [showFilters, setShowFilters] = useState(true)

  // Data states
  const [enrollmentData, setEnrollmentData] = useState<EnrollmentReportRecord[]>([])
  const [batchData, setBatchData] = useState<BatchReportRecord[]>([])

  // Reference data
  const [gurukuls, setGurukuls] = useState<Gurukul[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [batches, setBatches] = useState<Batch[]>([])

  // Enrollment filters
  const [enrollmentFilters, setEnrollmentFilters] = useState<EnrollmentReportFilters>({
    startDate: '',
    endDate: '',
    status: '',
    gurukulId: '',
    courseId: '',
  })

  // Batch filters
  const [batchFilters, setBatchFilters] = useState<BatchReportFilters>({
    gurukulId: '',
    courseId: '',
    batchId: '',
    status: '',
  })

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20

  useEffect(() => {
    loadReferenceData()
  }, [])

  const loadReferenceData = async () => {
    try {
      const [gurukulsResult, coursesResult, batchesResult] = await Promise.all([
        getGurukuls(),
        getCourses(),
        getBatches(),
      ])
      setGurukuls(gurukulsResult.gurukuls)
      setCourses(coursesResult.courses)
      setBatches(batchesResult)
    } catch (error) {
      console.error('Error loading reference data:', error)
      toast.error('Failed to load reference data')
    }
  }

  const handleGenerateReport = async () => {
    setLoading(true)
    setCurrentPage(1)
    try {
      if (reportType === 'enrollment') {
        const data = await generateEnrollmentReport(enrollmentFilters)
        setEnrollmentData(data)
        toast.success(`Generated ${data.length} enrollment records`)
      } else {
        const data = await generateBatchReport(batchFilters)
        setBatchData(data)
        toast.success(`Generated ${data.length} batch records`)
      }
    } catch (error) {
      console.error('Error generating report:', error)
      toast.error('Failed to generate report')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = () => {
    try {
      const timestamp = new Date().toISOString().split('T')[0]
      if (reportType === 'enrollment') {
        if (enrollmentData.length === 0) {
          toast.error('No data to export')
          return
        }
        exportToCSV(enrollmentData, `enrollment-report-${timestamp}.csv`)
        toast.success(`Enrollment report exported successfully (${enrollmentData.length} records)`)
      } else {
        if (batchData.length === 0) {
          toast.error('No data to export')
          return
        }
        exportToCSV(batchData, `batch-report-${timestamp}.csv`)
        toast.success(`Batch report exported successfully (${batchData.length} records)`)
      }
    } catch (error) {
      console.error('Error exporting report:', error)
      toast.error('Failed to export report')
    }
  }

  const handleClearFilters = () => {
    if (reportType === 'enrollment') {
      setEnrollmentFilters({
        startDate: '',
        endDate: '',
        status: '',
        gurukulId: '',
        courseId: '',
      })
      setEnrollmentData([])
    } else {
      setBatchFilters({
        gurukulId: '',
        courseId: '',
        batchId: '',
        status: '',
      })
      setBatchData([])
    }
    setCurrentPage(1)
  }

  // Get current page data
  const currentData = reportType === 'enrollment' ? enrollmentData : batchData
  const totalPages = Math.ceil(currentData.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedData = currentData.slice(startIndex, endIndex)

  return (
    <div className="space-y-6">
      {/* Report Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Report Type</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button
              onClick={() => {
                setReportType('enrollment')
                setCurrentPage(1)
              }}
              className={`p-4 rounded-lg border-2 transition-all flex items-center gap-3 ${
                reportType === 'enrollment'
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <AcademicCapIcon className="h-6 w-6 text-orange-500 flex-shrink-0" />
              <div className="text-left">
                <h3 className="text-base font-semibold mb-1">Enrollment Report</h3>
                <p className="text-xs text-gray-600">
                  View student enrollments with course and gurukul details
                </p>
              </div>
            </button>
            <button
              onClick={() => {
                setReportType('batch')
                setCurrentPage(1)
              }}
              className={`p-4 rounded-lg border-2 transition-all flex items-center gap-3 ${
                reportType === 'batch'
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <UserGroupIcon className="h-6 w-6 text-orange-500 flex-shrink-0" />
              <div className="text-left">
                <h3 className="text-base font-semibold mb-1">Batch Report</h3>
                <p className="text-xs text-gray-600">
                  View batch details with student attendance and status
                </p>
              </div>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              <div className="flex items-center gap-2">
                <FunnelIcon className="h-5 w-5" />
                Filters
              </div>
            </CardTitle>
            <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
              {showFilters ? 'Hide' : 'Show'}
            </Button>
          </div>
        </CardHeader>
        {showFilters && (
          <CardContent>
            {reportType === 'enrollment' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Date Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <CalendarIcon className="h-4 w-4 inline mr-1" />
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={enrollmentFilters.startDate}
                    onChange={(e) =>
                      setEnrollmentFilters({ ...enrollmentFilters, startDate: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <CalendarIcon className="h-4 w-4 inline mr-1" />
                    End Date
                  </label>
                  <input
                    type="date"
                    value={enrollmentFilters.endDate}
                    onChange={(e) =>
                      setEnrollmentFilters({ ...enrollmentFilters, endDate: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Enrollment Status
                  </label>
                  <select
                    value={enrollmentFilters.status}
                    onChange={(e) =>
                      setEnrollmentFilters({ ...enrollmentFilters, status: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                {/* Gurukul */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <BuildingLibraryIcon className="h-4 w-4 inline mr-1" />
                    Gurukul
                  </label>
                  <select
                    value={enrollmentFilters.gurukulId}
                    onChange={(e) =>
                      setEnrollmentFilters({ ...enrollmentFilters, gurukulId: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">All Gurukuls</option>
                    {gurukuls.map((gurukul) => (
                      <option key={gurukul.id} value={gurukul.id}>
                        {gurukul.name}
                      </option>
                    ))}
                  </select>
                </div>
                {/* Course */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <AcademicCapIcon className="h-4 w-4 inline mr-1" />
                    Course
                  </label>
                  <select
                    value={enrollmentFilters.courseId}
                    onChange={(e) =>
                      setEnrollmentFilters({ ...enrollmentFilters, courseId: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">All Courses</option>
                    {courses
                      .filter(
                        (course) =>
                          !enrollmentFilters.gurukulId ||
                          course.gurukul_id === enrollmentFilters.gurukulId,
                      )
                      .map((course) => (
                        <option key={course.id} value={course.id}>
                          {course.title}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Gurukul */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <BuildingLibraryIcon className="h-4 w-4 inline mr-1" />
                    Gurukul
                  </label>
                  <select
                    value={batchFilters.gurukulId}
                    onChange={(e) =>
                      setBatchFilters({ ...batchFilters, gurukulId: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">All Gurukuls</option>
                    {gurukuls.map((gurukul) => (
                      <option key={gurukul.id} value={gurukul.id}>
                        {gurukul.name}
                      </option>
                    ))}
                  </select>
                </div>
                {/* Batch */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <UserGroupIcon className="h-4 w-4 inline mr-1" />
                    Batch
                  </label>
                  <select
                    value={batchFilters.batchId}
                    onChange={(e) => setBatchFilters({ ...batchFilters, batchId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">All Batches</option>
                    {batches
                      .filter(
                        (batch) =>
                          !batchFilters.gurukulId || batch.gurukul_id === batchFilters.gurukulId,
                      )
                      .map((batch) => (
                        <option key={batch.id} value={batch.id}>
                          {batch.name}
                        </option>
                      ))}
                  </select>
                </div>
                {/* Course */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <AcademicCapIcon className="h-4 w-4 inline mr-1" />
                    Course
                  </label>
                  <select
                    value={batchFilters.courseId}
                    onChange={(e) => setBatchFilters({ ...batchFilters, courseId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">All Courses</option>
                    {courses
                      .filter(
                        (course) =>
                          !batchFilters.gurukulId || course.gurukul_id === batchFilters.gurukulId,
                      )
                      .map((course) => (
                        <option key={course.id} value={course.id}>
                          {course.title}
                        </option>
                      ))}
                  </select>
                </div>
                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Batch Status
                  </label>
                  <select
                    value={batchFilters.status}
                    onChange={(e) => setBatchFilters({ ...batchFilters, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">All Statuses</option>
                    <option value="not_started">Not Started</option>
                    <option value="active">Active</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>
            )}
            <div className="flex gap-2 mt-4">
              <Button onClick={handleGenerateReport} disabled={loading}>
                {loading ? 'Generating...' : 'Generate Report'}
              </Button>
              <Button variant="outline" onClick={handleClearFilters}>
                Clear Filters
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Results */}
      {currentData.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Report Results ({currentData.length} records)</CardTitle>
              <Button onClick={handleExport} variant="outline" size="sm">
                <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                Export to CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              {reportType === 'enrollment' ? (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student ID
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student Name
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Course Name
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Gurukul Name
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Enrollment Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Phone
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportType === 'enrollment' &&
                      paginatedData.map((record, index) => {
                        const enrollmentRecord = record as EnrollmentReportRecord
                        return (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                              {enrollmentRecord.student_id}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                              {enrollmentRecord.student_name}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {enrollmentRecord.course_name}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {enrollmentRecord.gurukul_name}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                              {enrollmentRecord.enrollment_date}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {enrollmentRecord.student_email}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                              {enrollmentRecord.student_phone || '-'}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">
                              <Badge
                                variant={
                                  enrollmentRecord.enrollment_status === 'approved'
                                    ? 'success'
                                    : enrollmentRecord.enrollment_status === 'pending'
                                      ? 'warning'
                                      : enrollmentRecord.enrollment_status === 'rejected'
                                        ? 'danger'
                                        : 'default'
                                }
                              >
                                {enrollmentRecord.enrollment_status}
                              </Badge>
                            </td>
                          </tr>
                        )
                      })}
                  </tbody>
                </table>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Batch Name
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Gurukul Name
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Course Name
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student ID
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student Name
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Attendance
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Attendance %
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportType === 'batch' &&
                      paginatedData.map((record, index) => {
                        const batchRecord = record as BatchReportRecord
                        return (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {batchRecord.batch_name}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {batchRecord.gurukul_name}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {batchRecord.course_name}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                              {batchRecord.student_id}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                              {batchRecord.student_name}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">
                              <Badge
                                variant={
                                  batchRecord.enrollment_status === 'approved'
                                    ? 'success'
                                    : batchRecord.enrollment_status === 'pending'
                                      ? 'warning'
                                      : 'default'
                                }
                              >
                                {batchRecord.enrollment_status}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">
                              <Badge
                                variant={
                                  batchRecord.attendance_status === 'Good'
                                    ? 'success'
                                    : batchRecord.attendance_status === 'Average'
                                      ? 'warning'
                                      : batchRecord.attendance_status === 'Poor'
                                        ? 'danger'
                                        : 'default'
                                }
                              >
                                {batchRecord.attendance_status}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                              {batchRecord.attendance_percentage}%
                            </td>
                          </tr>
                        )
                      })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  Showing {startIndex + 1} to {Math.min(endIndex, currentData.length)} of{' '}
                  {currentData.length} records
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum
                      if (totalPages <= 5) {
                        pageNum = i + 1
                      } else if (currentPage <= 3) {
                        pageNum = i + 1
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i
                      } else {
                        pageNum = currentPage - 2 + i
                      }
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? 'primary' : 'outline'}
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                        >
                          {pageNum}
                        </Button>
                      )
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {currentData.length === 0 && !loading && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <DocumentChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Report Generated</h3>
              <p className="text-gray-600">
                Select filters and click "Generate Report" to view data
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default ReportsManagement
