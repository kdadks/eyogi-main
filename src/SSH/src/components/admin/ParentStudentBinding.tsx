import React, { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import toast from 'react-hot-toast'
import {
  LinkIcon,
  MagnifyingGlassIcon,
  UserGroupIcon,
  AcademicCapIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'
import { useRefresh } from '@/contexts/RefreshContext'
import { getAllParents, getUnboundStudents } from '@/lib/api/users'
import {
  bindStudentToParent,
  unbindStudentFromParent,
  getAdminBoundPairs,
  type BoundPair,
} from '@/lib/api/children'

// ── Types ────────────────────────────────────────────────────────────────────

interface SimpleProfile {
  id: string
  full_name: string | null
  email: string
  student_id?: string | null
  created_at: string
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

// ── Component ────────────────────────────────────────────────────────────────

export default function ParentStudentBinding() {
  const [activeTab, setActiveTab] = useState<'bind' | 'bound'>('bind')

  // --- data ---
  const [parents, setParents] = useState<SimpleProfile[]>([])
  const [students, setStudents] = useState<SimpleProfile[]>([])
  const [boundPairs, setBoundPairs] = useState<BoundPair[]>([])
  const [loading, setLoading] = useState(true)

  // --- selection ---
  const [selectedParent, setSelectedParent] = useState<SimpleProfile | null>(null)
  const [selectedStudent, setSelectedStudent] = useState<SimpleProfile | null>(null)

  // --- search ---
  const [parentSearch, setParentSearch] = useState('')
  const [studentSearch, setStudentSearch] = useState('')
  const [boundSearch, setBoundSearch] = useState('')

  // --- pagination ---
  const BOUND_PAGE_SIZE = 25
  const [boundPage, setBoundPage] = useState(1)

  // --- action state ---
  const [binding, setBinding] = useState(false)
  const [unbindingId, setUnbindingId] = useState<string | null>(null) // relationshipId

  const { refreshKey } = useRefresh()

  // ── Load data ──────────────────────────────────────────────────────────────

  const loadData = async () => {
    setLoading(true)
    try {
      const [parentsData, studentsData, pairsResult] = await Promise.all([
        getAllParents(),
        getUnboundStudents(),
        getAdminBoundPairs(),
      ])
      setParents(parentsData as unknown as SimpleProfile[])
      setStudents(studentsData as unknown as SimpleProfile[])
      setBoundPairs(pairsResult.data || [])
    } catch {
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [refreshKey])

  // ── Filtered lists ─────────────────────────────────────────────────────────

  const filteredParents = useMemo(() => {
    const q = parentSearch.toLowerCase()
    if (!q) return parents
    return parents.filter(
      (p) => (p.full_name || '').toLowerCase().includes(q) || p.email.toLowerCase().includes(q),
    )
  }, [parents, parentSearch])

  const filteredStudents = useMemo(() => {
    const q = studentSearch.toLowerCase()
    if (!q) return students
    return students.filter(
      (s) =>
        (s.full_name || '').toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        (s.student_id || '').toLowerCase().includes(q),
    )
  }, [students, studentSearch])

  const filteredBoundPairs = useMemo(() => {
    const q = boundSearch.toLowerCase()
    if (!q) return boundPairs
    return boundPairs.filter(
      (p) =>
        p.parentName.toLowerCase().includes(q) ||
        p.parentEmail.toLowerCase().includes(q) ||
        p.studentName.toLowerCase().includes(q) ||
        p.studentEmail.toLowerCase().includes(q) ||
        (p.studentStudentId || '').toLowerCase().includes(q),
    )
  }, [boundPairs, boundSearch])

  const boundTotalPages = Math.max(1, Math.ceil(filteredBoundPairs.length / BOUND_PAGE_SIZE))

  const pagedBoundPairs = useMemo(() => {
    const start = (boundPage - 1) * BOUND_PAGE_SIZE
    return filteredBoundPairs.slice(start, start + BOUND_PAGE_SIZE)
  }, [filteredBoundPairs, boundPage])

  // ── Actions ────────────────────────────────────────────────────────────────

  const handleBind = async () => {
    if (!selectedParent || !selectedStudent) return
    setBinding(true)
    try {
      const { error } = await bindStudentToParent(selectedParent.id, selectedStudent.id)
      if (error) {
        toast.error(error)
        return
      }
      toast.success(
        `${selectedStudent.full_name || 'Student'} bound to ${selectedParent.full_name || 'Parent'} successfully`,
      )
      setSelectedParent(null)
      setSelectedStudent(null)
      await loadData()
    } catch {
      toast.error('An unexpected error occurred')
    } finally {
      setBinding(false)
    }
  }

  const handleUnbind = async (pair: BoundPair) => {
    setUnbindingId(pair.relationshipId)
    try {
      const { error } = await unbindStudentFromParent(pair.parentId, pair.studentId)
      if (error) {
        toast.error(error)
        return
      }
      toast.success(`${pair.studentName} unbound from ${pair.parentName}`)
      await loadData()
    } catch {
      toast.error('An unexpected error occurred')
    } finally {
      setUnbindingId(null)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
              <UserGroupIcon className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Registered Parents</p>
              <p className="text-2xl font-bold text-gray-900">{parents.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
              <AcademicCapIcon className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Unbound Students</p>
              <p className="text-2xl font-bold text-gray-900">{students.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
              <LinkIcon className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Active Bindings</p>
              <p className="text-2xl font-bold text-gray-900">{boundPairs.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex gap-6">
          {(
            [
              { key: 'bind', label: 'Bind New', icon: LinkIcon },
              { key: 'bound', label: 'Manage Bindings', icon: CheckCircleIcon },
            ] as {
              key: 'bind' | 'bound'
              label: string
              icon: React.ComponentType<{ className?: string }>
            }[]
          ).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === key
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
              {key === 'bound' && boundPairs.length > 0 && (
                <Badge variant="info" className="ml-1 text-xs px-1.5 py-0">
                  {boundPairs.length}
                </Badge>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* ── TAB: Bind New ─────────────────────────────────────────────────── */}
      {activeTab === 'bind' && (
        <div className="space-y-4">
          {/* Selection summary bar */}
          {(selectedParent || selectedStudent) && (
            <div className="flex flex-wrap items-center gap-3 bg-orange-50 border border-orange-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500">Parent:</span>
                {selectedParent ? (
                  <span className="font-medium text-gray-900 flex items-center gap-1">
                    {selectedParent.full_name || selectedParent.email}
                    <button
                      onClick={() => setSelectedParent(null)}
                      className="ml-1 text-gray-400 hover:text-gray-600"
                    >
                      <XMarkIcon className="h-3.5 w-3.5" />
                    </button>
                  </span>
                ) : (
                  <span className="text-gray-400 italic">not selected</span>
                )}
              </div>
              <span className="text-gray-300">→</span>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500">Student:</span>
                {selectedStudent ? (
                  <span className="font-medium text-gray-900 flex items-center gap-1">
                    {selectedStudent.full_name || selectedStudent.email}
                    <button
                      onClick={() => setSelectedStudent(null)}
                      className="ml-1 text-gray-400 hover:text-gray-600"
                    >
                      <XMarkIcon className="h-3.5 w-3.5" />
                    </button>
                  </span>
                ) : (
                  <span className="text-gray-400 italic">not selected</span>
                )}
              </div>
              {selectedParent && selectedStudent && (
                <Button size="sm" onClick={handleBind} disabled={binding} className="ml-auto gap-2">
                  <LinkIcon className="h-4 w-4" />
                  {binding ? 'Binding…' : 'Bind Student to Parent'}
                </Button>
              )}
            </div>
          )}

          {/* Warning */}
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
            <ExclamationTriangleIcon className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>
              Once bound, the student will <strong>not be able to log in independently</strong>.
              Their activity will appear in the parent's dashboard.
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Parents list */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                    <UserGroupIcon className="h-5 w-5 text-blue-500" />
                    Parents
                  </h2>
                  <Badge variant="info">{filteredParents.length}</Badge>
                </div>
                <div className="relative mt-2">
                  <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search by name or email…"
                    value={parentSearch}
                    onChange={(e) => setParentSearch(e.target.value)}
                    className="pl-9 text-sm"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex items-center justify-center py-10 text-gray-400 text-sm">
                    Loading…
                  </div>
                ) : filteredParents.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-gray-400 text-sm gap-2">
                    <UserGroupIcon className="h-8 w-8" />
                    <span>
                      {parentSearch ? 'No parents match your search' : 'No parents found'}
                    </span>
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
                    {filteredParents.map((parent) => {
                      const isSelected = selectedParent?.id === parent.id
                      return (
                        <li
                          key={parent.id}
                          onClick={() => setSelectedParent(isSelected ? null : parent)}
                          className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-blue-50 border-l-4 border-blue-500'
                              : 'hover:bg-gray-50 border-l-4 border-transparent'
                          }`}
                        >
                          <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-semibold text-blue-700">
                              {(parent.full_name || parent.email)[0].toUpperCase()}
                            </span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {parent.full_name || '—'}
                            </p>
                            <p className="text-xs text-gray-500 truncate">{parent.email}</p>
                          </div>
                          {isSelected && (
                            <CheckCircleIcon className="h-5 w-5 text-blue-500 flex-shrink-0" />
                          )}
                        </li>
                      )
                    })}
                  </ul>
                )}
              </CardContent>
            </Card>

            {/* Students list */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                    <AcademicCapIcon className="h-5 w-5 text-amber-500" />
                    Unbound Students
                  </h2>
                  <Badge variant="warning">{filteredStudents.length}</Badge>
                </div>
                <div className="relative mt-2">
                  <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search by name, email or student ID…"
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    className="pl-9 text-sm"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex items-center justify-center py-10 text-gray-400 text-sm">
                    Loading…
                  </div>
                ) : filteredStudents.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-gray-400 text-sm gap-2">
                    <AcademicCapIcon className="h-8 w-8" />
                    <span>
                      {studentSearch
                        ? 'No students match your search'
                        : 'All students are already bound to a parent'}
                    </span>
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
                    {filteredStudents.map((student) => {
                      const isSelected = selectedStudent?.id === student.id
                      return (
                        <li
                          key={student.id}
                          onClick={() => setSelectedStudent(isSelected ? null : student)}
                          className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-amber-50 border-l-4 border-amber-500'
                              : 'hover:bg-gray-50 border-l-4 border-transparent'
                          }`}
                        >
                          <div className="h-9 w-9 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-semibold text-amber-700">
                              {(student.full_name || student.email)[0].toUpperCase()}
                            </span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {student.full_name || '—'}
                            </p>
                            <p className="text-xs text-gray-500 truncate">{student.email}</p>
                            {student.student_id && (
                              <p className="text-xs text-gray-400">ID: {student.student_id}</p>
                            )}
                          </div>
                          {isSelected && (
                            <CheckCircleIcon className="h-5 w-5 text-amber-500 flex-shrink-0" />
                          )}
                        </li>
                      )
                    })}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Bind button (bottom, when both selected) */}
          {selectedParent && selectedStudent && (
            <div className="flex justify-center">
              <Button size="lg" onClick={handleBind} disabled={binding} className="gap-2 px-8">
                <LinkIcon className="h-5 w-5" />
                {binding
                  ? 'Binding…'
                  : `Bind "${selectedStudent.full_name || 'Student'}" to "${selectedParent.full_name || 'Parent'}"`}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* ── TAB: Manage Bindings ──────────────────────────────────────────── */}
      {activeTab === 'bound' && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h2 className="text-base font-semibold text-gray-900">Active Bindings</h2>
              <div className="relative w-72">
                <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search parents or students…"
                  value={boundSearch}
                  onChange={(e) => {
                    setBoundSearch(e.target.value)
                    setBoundPage(1)
                  }}
                  className="pl-9 text-sm"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12 text-gray-400 text-sm">
                Loading…
              </div>
            ) : filteredBoundPairs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400 text-sm gap-2">
                <LinkIcon className="h-8 w-8" />
                <span>
                  {boundSearch ? 'No bindings match your search' : 'No active bindings yet'}
                </span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Parent</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Student</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Student ID</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Bound On</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-600">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {pagedBoundPairs.map((pair) => (
                      <tr key={pair.relationshipId} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">{pair.parentName}</p>
                          <p className="text-xs text-gray-500">{pair.parentEmail}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">{pair.studentName}</p>
                          <p className="text-xs text-gray-500">{pair.studentEmail}</p>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{pair.studentStudentId || '—'}</td>
                        <td className="px-4 py-3 text-gray-500">{formatDate(pair.boundAt)}</td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUnbind(pair)}
                            disabled={unbindingId === pair.relationshipId}
                            className="text-red-600 border-red-200 hover:bg-red-50 gap-1"
                          >
                            <XMarkIcon className="h-3.5 w-3.5" />
                            {unbindingId === pair.relationshipId ? 'Unbinding…' : 'Unbind'}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {/* Pagination footer */}
            {!loading && filteredBoundPairs.length > 0 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
                <p className="text-xs text-gray-500">
                  Showing{' '}
                  <span className="font-medium">
                    {(boundPage - 1) * BOUND_PAGE_SIZE + 1}–
                    {Math.min(boundPage * BOUND_PAGE_SIZE, filteredBoundPairs.length)}
                  </span>{' '}
                  of <span className="font-medium">{filteredBoundPairs.length}</span> bindings
                </p>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setBoundPage(1)}
                    disabled={boundPage === 1}
                    className="px-2 py-1 text-xs"
                  >
                    «
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setBoundPage((p) => Math.max(1, p - 1))}
                    disabled={boundPage === 1}
                    className="px-2 py-1 text-xs"
                  >
                    ‹
                  </Button>
                  <span className="px-3 py-1 text-xs text-gray-700">
                    Page {boundPage} of {boundTotalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setBoundPage((p) => Math.min(boundTotalPages, p + 1))}
                    disabled={boundPage === boundTotalPages}
                    className="px-2 py-1 text-xs"
                  >
                    ›
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setBoundPage(boundTotalPages)}
                    disabled={boundPage === boundTotalPages}
                    className="px-2 py-1 text-xs"
                  >
                    »
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
