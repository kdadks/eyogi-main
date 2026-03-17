import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { supabaseAdmin } from '@/lib/supabase'
import toast from 'react-hot-toast'
import {
  DocumentTextIcon,
  ArrowDownTrayIcon,
  UserIcon,
} from '@heroicons/react/24/outline'

interface QuizAnswer {
  id: string
  name: string
  email: string
  phone: string
  created_at: string
}

export default function QuizAnswersAnalytics() {
  const [quizAnswers, setQuizAnswers] = useState<QuizAnswer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadQuizAnswers()
  }, [])

  const loadQuizAnswers = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabaseAdmin
        .from('quiz_answers')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setQuizAnswers(data || [])
    } catch (error) {
      console.error('Error loading quiz answers:', error)
      toast.error('Failed to load quiz answers')
    } finally {
      setLoading(false)
    }
  }

  const exportToCSV = () => {
    if (quizAnswers.length === 0) return

    const headers = ['Name', 'Email', 'Phone', 'Registration Date']
    const rows = quizAnswers.map((answer) => [
      answer.name,
      answer.email,
      answer.phone,
      new Date(answer.created_at).toLocaleString(),
    ])

    const csv = [headers.join(','), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(','))].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `quiz-answers-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)

    toast.success('Report exported successfully')
  }

  const stats = {
    total: quizAnswers.length,
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Quiz Answers Analytics</h2>
          <p className="text-gray-600 mt-1">View and download quiz answer registrations</p>
        </div>
        <Button
          onClick={exportToCSV}
          className="bg-green-600 hover:bg-green-700 text-white"
          disabled={quizAnswers.length === 0}
        >
          <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
          Export to CSV
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Total Registrations</p>
                <p className="text-3xl font-bold text-blue-900 mt-2">{stats.total}</p>
              </div>
              <DocumentTextIcon className="h-12 w-12 text-blue-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quiz Answers Table */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">
            Quiz Answer Registrations ({quizAnswers.length})
          </h3>
        </CardHeader>
        <CardContent>
          {quizAnswers.length === 0 ? (
            <div className="text-center py-12">
              <DocumentTextIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No registrations yet</h3>
              <p className="text-gray-600">Quiz answer registrations will appear here</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Registration Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {quizAnswers.map((answer) => (
                    <tr key={answer.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                            <UserIcon className="h-5 w-5 text-white" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{answer.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {answer.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {answer.phone}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(answer.created_at).toLocaleString()}
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