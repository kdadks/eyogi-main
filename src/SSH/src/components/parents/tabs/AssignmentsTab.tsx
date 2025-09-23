import React, { useState } from 'react'
import {
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  Star,
  Filter,
  ChevronDown,
} from 'lucide-react'
import { Child } from '../../../data/mockParentsData'

interface AssignmentsTabProps {
  child: Child
}

type AssignmentFilter = 'all' | 'pending' | 'submitted' | 'graded' | 'overdue'

export default function AssignmentsTab({ child }: AssignmentsTabProps) {
  const [filter, setFilter] = useState<AssignmentFilter>('all')
  const [sortBy, setSortBy] = useState<'dueDate' | 'status' | 'grade'>('dueDate')

  const filteredAssignments = child.assignments.filter((assignment) => {
    if (filter === 'all') return true
    if (filter === 'overdue') {
      return assignment.status === 'pending' && new Date(assignment.dueDate) < new Date()
    }
    return assignment.status === filter
  })

  const sortedAssignments = [...filteredAssignments].sort((a, b) => {
    switch (sortBy) {
      case 'dueDate':
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      case 'status':
        return a.status.localeCompare(b.status)
      case 'grade':
        return (b.grade || 0) - (a.grade || 0)
      default:
        return 0
    }
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatDateShort = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
  }

  const getStatusIcon = (status: string, dueDate: string) => {
    if (status === 'pending' && new Date(dueDate) < new Date()) {
      return <AlertCircle className="h-5 w-5 text-red-500" />
    }

    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-orange-500" />
      case 'submitted':
        return <FileText className="h-5 w-5 text-blue-500" />
      case 'graded':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      default:
        return <Clock className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusColor = (status: string, dueDate: string) => {
    if (status === 'pending' && new Date(dueDate) < new Date()) {
      return 'bg-red-100 text-red-800'
    }

    switch (status) {
      case 'pending':
        return 'bg-orange-100 text-orange-800'
      case 'submitted':
        return 'bg-blue-100 text-blue-800'
      case 'graded':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy':
        return 'bg-green-100 text-green-800'
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'Hard':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string, dueDate: string) => {
    if (status === 'pending' && new Date(dueDate) < new Date()) {
      return 'Overdue'
    }
    return status.charAt(0).toUpperCase() + status.slice(1)
  }

  // Assignment statistics
  const stats = {
    total: child.assignments.length,
    pending: child.assignments.filter((a) => a.status === 'pending').length,
    submitted: child.assignments.filter((a) => a.status === 'submitted').length,
    graded: child.assignments.filter((a) => a.status === 'graded').length,
    overdue: child.assignments.filter(
      (a) => a.status === 'pending' && new Date(a.dueDate) < new Date(),
    ).length,
    averageGrade:
      child.assignments.filter((a) => a.grade).length > 0
        ? Math.round(
            child.assignments.filter((a) => a.grade).reduce((sum, a) => sum + (a.grade || 0), 0) /
              child.assignments.filter((a) => a.grade).length,
          )
        : 0,
  }

  return (
    <div className="space-y-6">
      {/* Assignment Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <div className="text-2xl font-bold text-gray-900 mb-1">{stats.total}</div>
          <div className="text-sm text-gray-500">Total</div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 text-center">
          <div className="text-2xl font-bold text-orange-600 mb-1">{stats.pending}</div>
          <div className="text-sm text-gray-500">Pending</div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 text-center">
          <div className="text-2xl font-bold text-blue-600 mb-1">{stats.submitted}</div>
          <div className="text-sm text-gray-500">Submitted</div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 text-center">
          <div className="text-2xl font-bold text-green-600 mb-1">{stats.graded}</div>
          <div className="text-sm text-gray-500">Graded</div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 text-center">
          <div className="text-2xl font-bold text-red-600 mb-1">{stats.overdue}</div>
          <div className="text-sm text-gray-500">Overdue</div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as AssignmentFilter)}
                className="appearance-none bg-white border border-gray-300 rounded-md px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All Assignments</option>
                <option value="pending">Pending</option>
                <option value="submitted">Submitted</option>
                <option value="graded">Graded</option>
                <option value="overdue">Overdue</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>

            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'dueDate' | 'status' | 'grade')}
                className="appearance-none bg-white border border-gray-300 rounded-md px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="dueDate">Sort by Due Date</option>
                <option value="status">Sort by Status</option>
                <option value="grade">Sort by Grade</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
          </div>

          <div className="text-sm text-gray-500">
            Showing {sortedAssignments.length} of {child.assignments.length} assignments
          </div>
        </div>
      </div>

      {/* Assignments List */}
      {sortedAssignments.length > 0 ? (
        <div className="space-y-4">
          {sortedAssignments.map((assignment) => (
            <div key={assignment.id} className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      {getStatusIcon(assignment.status, assignment.dueDate)}
                      <h3 className="text-lg font-medium text-gray-900">{assignment.title}</h3>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${getStatusColor(assignment.status, assignment.dueDate)}`}
                      >
                        {getStatusText(assignment.status, assignment.dueDate)}
                      </span>
                    </div>

                    <p className="text-gray-600 mb-3">{assignment.description}</p>

                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span className="font-medium text-indigo-600">{assignment.courseName}</span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${getDifficultyColor(assignment.difficulty)}`}
                      >
                        {assignment.difficulty}
                      </span>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        <span>{assignment.estimatedTime} min</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right ml-6">
                    <div className="text-sm text-gray-500 mb-1">Due Date</div>
                    <div
                      className={`font-medium ${
                        assignment.status === 'pending' && new Date(assignment.dueDate) < new Date()
                          ? 'text-red-600'
                          : 'text-gray-900'
                      }`}
                    >
                      {formatDateShort(assignment.dueDate)}
                    </div>
                  </div>
                </div>

                {/* Assignment Details */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Due:</span>
                      <span className="ml-2 font-medium">{formatDate(assignment.dueDate)}</span>
                    </div>

                    {assignment.submittedAt && (
                      <div>
                        <span className="text-gray-500">Submitted:</span>
                        <span className="ml-2 font-medium">
                          {formatDate(assignment.submittedAt)}
                        </span>
                      </div>
                    )}

                    {assignment.grade && (
                      <div className="flex items-center">
                        <span className="text-gray-500">Grade:</span>
                        <div className="ml-2 flex items-center">
                          <Star className="h-4 w-4 text-yellow-500 mr-1" />
                          <span className="font-medium text-green-600">{assignment.grade}%</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {assignment.feedback && (
                    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
                      <div className="text-sm">
                        <span className="font-medium text-green-800">Teacher Feedback:</span>
                        <p className="mt-1 text-green-700">{assignment.feedback}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* No Assignments State */
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Calendar className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {filter === 'all' ? 'No assignments yet' : `No ${filter} assignments`}
          </h3>
          <p className="text-gray-500">
            {filter === 'all'
              ? `${child.fullName} doesn't have any assignments yet.`
              : `${child.fullName} doesn't have any ${filter} assignments.`}
          </p>
        </div>
      )}

      {/* Assignment Performance Summary */}
      {stats.graded > 0 && (
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg shadow p-6 text-white">
          <h3 className="text-lg font-medium mb-4">Assignment Performance Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold mb-2">{stats.averageGrade}%</div>
              <div className="text-sm opacity-90">Average Grade</div>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold mb-2">
                {Math.round((stats.graded / stats.total) * 100)}%
              </div>
              <div className="text-sm opacity-90">Completion Rate</div>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold mb-2">{stats.overdue}</div>
              <div className="text-sm opacity-90">Overdue Items</div>
            </div>
          </div>

          {stats.averageGrade >= 85 && (
            <div className="mt-4 p-3 bg-white bg-opacity-20 rounded-lg">
              <p className="text-sm">
                🎉 Excellent work! {child.fullName} is maintaining high grades on assignments.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
