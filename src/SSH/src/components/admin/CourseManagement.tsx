import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Course, Gurukul, User } from '@/types'
import { getCourses, createCourse, updateCourse, deleteCourse } from '@/lib/api/courses'
import { getGurukuls } from '@/lib/api/gurukuls'
import { getAllUsers } from '@/lib/api/users'
import { formatCurrency, formatDate, getAgeGroupLabel, getLevelColor } from '@/lib/utils'
import toast from 'react-hot-toast'
import {
  BookOpenIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  UserIcon,
  ClockIcon,
  CurrencyEuroIcon,
  XMarkIcon,
  CheckIcon
} from '@heroicons/react/24/outline'

interface CourseFormData {
  gurukul_id: string
  course_number: string
  title: string
  description: string
  level: 'elementary' | 'basic' | 'intermediate' | 'advanced'
  age_group_min: number
  age_group_max: number
  duration_weeks: number
  fee: number
  max_students: number
  delivery_method: 'physical' | 'remote' | 'hybrid'
  entry_requirements: string
  learning_outcomes: string[]
  teacher_id: string
}

export default function CourseManagement() {
  const [courses, setCourses] = useState<Course[]>([])
  const [gurukuls, setGurukuls] = useState<Gurukul[]>([])
  const [teachers, setTeachers] = useState<User[]>([])
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [gurukulFilter, setGurukulFilter] = useState<string>('all')
  const [levelFilter, setLevelFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const [viewingCourse, setViewingCourse] = useState<Course | null>(null)
  const [formData, setFormData] = useState<CourseFormData>({
    gurukul_id: '',
    course_number: '',
    title: '',
    description: '',
    level: 'basic',
    age_group_min: 8,
    age_group_max: 11,
    duration_weeks: 6,
    fee: 50,
    max_students: 20,
    delivery_method: 'remote',
    entry_requirements: '',
    learning_outcomes: [],
    teacher_id: ''
  })
  const [formLoading, setFormLoading] = useState(false)
  const [learningOutcomeInput, setLearningOutcomeInput] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    filterCourses()
  }, [courses, searchTerm, gurukulFilter, levelFilter, statusFilter])

  const loadData = async () => {
    try {
      const [coursesData, gurukulData, usersData] = await Promise.all([
        getCourses(),
        getGurukuls(),
        getAllUsers()
      ])
      setCourses(coursesData)
      setGurukuls(gurukulData)
      setTeachers(usersData.filter(u => u.role === 'teacher'))
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Failed to load course data')
    } finally {
      setLoading(false)
    }
  }

  const filterCourses = () => {
    let filtered = courses

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(course =>
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.course_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by gurukul
    if (gurukulFilter !== 'all') {
      filtered = filtered.filter(course => course.gurukul_id === gurukulFilter)
    }

    // Filter by level
    if (levelFilter !== 'all') {
      filtered = filtered.filter(course => course.level === levelFilter)
    }

    // Filter by status
    if (statusFilter !== 'all') {
      const isActive = statusFilter === 'active'
      filtered = filtered.filter(course => course.is_active === isActive)
    }

    setFilteredCourses(filtered)
  }

  const resetForm = () => {
    setFormData({
      gurukul_id: '',
      course_number: '',
      title: '',
      description: '',
      level: 'basic',
      age_group_min: 8,
      age_group_max: 11,
      duration_weeks: 6,
      fee: 50,
      max_students: 20,
      delivery_method: 'remote',
      entry_requirements: '',
      learning_outcomes: [],
      teacher_id: ''
    })
    setLearningOutcomeInput('')
    setShowCreateForm(false)
    setEditingCourse(null)
    setViewingCourse(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormLoading(true)

    try {
      if (editingCourse) {
        await updateCourse(editingCourse.id, formData)
        toast.success('Course updated successfully')
      } else {
        await createCourse({ 
          ...formData, 
          syllabus: [], 
          is_active: true 
        })
        toast.success('Course created successfully')
      }
      
      await loadData()
      resetForm()
    } catch (error) {
      console.error('Error saving course:', error)
      toast.error('Failed to save course')
    } finally {
      setFormLoading(false)
    }
  }

  const handleEdit = (course: Course) => {
    setEditingCourse(course)
    setFormData({
      gurukul_id: course.gurukul_id,
      course_number: course.course_number,
      title: course.title,
      description: course.description,
      level: course.level,
      age_group_min: course.age_group_min,
      age_group_max: course.age_group_max,
      duration_weeks: course.duration_weeks,
      fee: course.fee,
      max_students: course.max_students,
      delivery_method: course.delivery_method,
      entry_requirements: course.entry_requirements || '',
      learning_outcomes: course.learning_outcomes,
      teacher_id: course.teacher_id || ''
    })
    setShowCreateForm(true)
  }

  const handleView = (course: Course) => {
    setViewingCourse(course)
  }

  const addLearningOutcome = () => {
    if (learningOutcomeInput.trim()) {
      setFormData(prev => ({
        ...prev,
        learning_outcomes: [...prev.learning_outcomes, learningOutcomeInput.trim()]
      }))
      setLearningOutcomeInput('')
    }
  }

  const removeLearningOutcome = (index: number) => {
    setFormData(prev => ({
      ...prev,
      learning_outcomes: prev.learning_outcomes.filter((_, i) => i !== index)
    }))
  }

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      return
    }

    try {
      await deleteCourse(courseId)
      await loadData()
      toast.success('Course deleted successfully')
    } catch (error) {
      console.error('Error deleting course:', error)
      toast.error('Failed to delete course')
    }
  }

  const handleToggleStatus = async (courseId: string, currentStatus: boolean) => {
    try {
      await updateCourse(courseId, { is_active: !currentStatus })
      await loadData()
      toast.success(`Course ${!currentStatus ? 'activated' : 'deactivated'} successfully`)
    } catch (error) {
      console.error('Error updating course status:', error)
      toast.error('Failed to update course status')
    }
  }

  const stats = {
    total: courses.length,
    active: courses.filter(c => c.is_active).length,
    inactive: courses.filter(c => c.is_active === false).length,
    elementary: courses.filter(c => c.level === 'elementary').length,
    basic: courses.filter(c => c.level === 'basic').length,
    intermediate: courses.filter(c => c.level === 'intermediate').length,
    advanced: courses.filter(c => c.level === 'advanced').length
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="spinner w-8 h-8"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600">Total Courses</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <div className="text-sm text-gray-600">Active</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-600">{stats.inactive}</div>
            <div className="text-sm text-gray-600">Inactive</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.basic + stats.intermediate}</div>
            <div className="text-sm text-gray-600">Popular Levels</div>
          </CardContent>
        </Card>
      </div>

      {/* Course View Modal */}
      {viewingCourse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Course Details</h2>
                <Button variant="ghost" onClick={() => setViewingCourse(null)}>
                  <XMarkIcon className="h-5 w-5" />
                </Button>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-2">Basic Information</h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>Course Number:</strong> {viewingCourse.course_number}</p>
                    <p><strong>Title:</strong> {viewingCourse.title}</p>
                    <p><strong>Gurukul:</strong> {viewingCourse.gurukul?.name}</p>
                    <p><strong>Level:</strong> <Badge className={getLevelColor(viewingCourse.level)}>{viewingCourse.level}</Badge></p>
                    <p><strong>Age Group:</strong> {getAgeGroupLabel(viewingCourse.age_group_min, viewingCourse.age_group_max)}</p>
                    <p><strong>Duration:</strong> {viewingCourse.duration_weeks} weeks</p>
                    <p><strong>Fee:</strong> {formatCurrency(viewingCourse.fee)}</p>
                    <p><strong>Max Students:</strong> {viewingCourse.max_students}</p>
                    <p><strong>Delivery:</strong> {viewingCourse.delivery_method}</p>
                    <p><strong>Teacher:</strong> {viewingCourse.teacher?.full_name || 'Unassigned'}</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-sm text-gray-600 mb-4">{viewingCourse.description}</p>
                  
                  {viewingCourse.entry_requirements && (
                    <>
                      <h3 className="font-semibold mb-2">Entry Requirements</h3>
                      <p className="text-sm text-gray-600 mb-4">{viewingCourse.entry_requirements}</p>
                    </>
                  )}
                  
                  <h3 className="font-semibold mb-2">Learning Outcomes</h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {viewingCourse.learning_outcomes.map((outcome, index) => (
                      <li key={index} className="flex items-start">
                        <CheckIcon className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        {outcome}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {editingCourse ? 'Edit Course' : 'Create New Course'}
              </h3>
              <Button variant="ghost" onClick={resetForm}>
                <XMarkIcon className="h-5 w-5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Gurukul</label>
                  <select
                    value={formData.gurukul_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, gurukul_id: e.target.value }))}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 text-base px-4 py-3"
                    required
                  >
                    <option value="">Select Gurukul</option>
                    {gurukuls.map(gurukul => (
                      <option key={gurukul.id} value={gurukul.id}>
                        {gurukul.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <Input
                  label="Course Number"
                  value={formData.course_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, course_number: e.target.value }))}
                  required
                  placeholder="e.g., C1001"
                />
              </div>

              <Input
                label="Course Title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                required
              />

              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 text-base px-4 py-3"
                  required
                />
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Level</label>
                  <select
                    value={formData.level}
                    onChange={(e) => setFormData(prev => ({ ...prev, level: e.target.value as any }))}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 text-base px-4 py-3"
                  >
                    <option value="elementary">Elementary</option>
                    <option value="basic">Basic</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
                
                <Input
                  label="Min Age"
                  type="number"
                  value={formData.age_group_min}
                  onChange={(e) => setFormData(prev => ({ ...prev, age_group_min: parseInt(e.target.value) }))}
                  required
                  min="4"
                  max="100"
                />
                
                <Input
                  label="Max Age"
                  type="number"
                  value={formData.age_group_max}
                  onChange={(e) => setFormData(prev => ({ ...prev, age_group_max: parseInt(e.target.value) }))}
                  required
                  min="4"
                  max="100"
                />
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <Input
                  label="Duration (weeks)"
                  type="number"
                  value={formData.duration_weeks}
                  onChange={(e) => setFormData(prev => ({ ...prev, duration_weeks: parseInt(e.target.value) }))}
                  required
                  min="1"
                />
                
                <Input
                  label="Fee (€)"
                  type="number"
                  step="0.01"
                  value={formData.fee}
                  onChange={(e) => setFormData(prev => ({ ...prev, fee: parseFloat(e.target.value) }))}
                  required
                  min="0"
                />
                
                <Input
                  label="Max Students"
                  type="number"
                  value={formData.max_students}
                  onChange={(e) => setFormData(prev => ({ ...prev, max_students: parseInt(e.target.value) }))}
                  required
                  min="1"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Delivery Method</label>
                  <select
                    value={formData.delivery_method}
                    onChange={(e) => setFormData(prev => ({ ...prev, delivery_method: e.target.value as any }))}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 text-base px-4 py-3"
                  >
                    <option value="remote">Remote</option>
                    <option value="physical">Physical</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>
                
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Teacher</label>
                  <select
                    value={formData.teacher_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, teacher_id: e.target.value }))}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 text-base px-4 py-3"
                  >
                    <option value="">Unassigned</option>
                    {teachers.map(teacher => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.full_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Entry Requirements</label>
                <textarea
                  value={formData.entry_requirements}
                  onChange={(e) => setFormData(prev => ({ ...prev, entry_requirements: e.target.value }))}
                  rows={2}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 text-base px-4 py-3"
                  placeholder="Optional entry requirements..."
                />
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">Learning Outcomes</label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={learningOutcomeInput}
                    onChange={(e) => setLearningOutcomeInput(e.target.value)}
                    placeholder="Add learning outcome..."
                    className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 text-base px-4 py-3"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addLearningOutcome())}
                  />
                  <Button type="button" onClick={addLearningOutcome}>
                    Add
                  </Button>
                </div>
                {formData.learning_outcomes.length > 0 && (
                  <div className="space-y-2">
                    {formData.learning_outcomes.map((outcome, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm">{outcome}</span>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => removeLearningOutcome(index)}
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex space-x-4">
                <Button type="submit" loading={formLoading}>
                  <CheckIcon className="h-4 w-4 mr-2" />
                  {editingCourse ? 'Update Course' : 'Create Course'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Course Management */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <h2 className="text-xl font-bold">Course Management</h2>
            
            <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4">
              {/* Search */}
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search courses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-3 border border-gray-300 rounded-md text-base focus:ring-orange-500 focus:border-orange-500"
                />
              </div>

              {/* Gurukul Filter */}
              <select
                value={gurukulFilter}
                onChange={(e) => setGurukulFilter(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-md text-base focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="all">All Gurukuls</option>
                {gurukuls.map(gurukul => (
                  <option key={gurukul.id} value={gurukul.id}>
                    {gurukul.name}
                  </option>
                ))}
              </select>

              {/* Level Filter */}
              <select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-md text-base focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="all">All Levels</option>
                <option value="elementary">Elementary</option>
                <option value="basic">Basic</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-md text-base focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>

              <Button onClick={() => setShowCreateForm(true)}>
                <PlusIcon className="h-4 w-4 mr-2" />
                New Course
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {filteredCourses.length === 0 ? (
            <div className="text-center py-8">
              <BookOpenIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No courses found</h3>
              <p className="text-gray-600">No courses match your current filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Course
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Gurukul
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Level
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Teacher
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCourses.map((course) => (
                    <tr key={course.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <BookOpenIcon className="h-5 w-5 text-gray-400 mr-3" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {course.title}
                            </div>
                            <div className="text-sm text-gray-500">
                              {course.course_number}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {course.gurukul?.name || 'Unknown'}
                      </td>
                      <td className="px-6 py-4">
                        <Badge className={getLevelColor(course.level)}>
                          {course.level}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <div className="space-y-1">
                          <div className="flex items-center">
                            <UserIcon className="h-4 w-4 mr-1" />
                            <span>Ages {getAgeGroupLabel(course.age_group_min, course.age_group_max)}</span>
                          </div>
                          <div className="flex items-center">
                            <ClockIcon className="h-4 w-4 mr-1" />
                            <span>{course.duration_weeks} weeks</span>
                          </div>
                          <div className="flex items-center">
                            <CurrencyEuroIcon className="h-4 w-4 mr-1" />
                            <span>{formatCurrency(course.fee)}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {course.teacher?.full_name || 'Unassigned'}
                      </td>
                      <td className="px-6 py-4">
                        <Badge className={course.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                          {course.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          <Button size="sm" variant="ghost">
                            <EyeIcon className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => handleEdit(course)}
                          >
                            <PencilIcon className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant={course.is_active ? "ghost" : "secondary"}
                            onClick={() => handleToggleStatus(course.id, course.is_active)}
                          >
                            {course.is_active ? 'Deactivate' : 'Activate'}
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleDeleteCourse(course.id)}
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}