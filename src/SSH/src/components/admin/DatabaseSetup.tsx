import React, { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { checkTablesExist } from '@/lib/api/setupDatabase'
import toast from 'react-hot-toast'
import {
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline'

export default function DatabaseSetup() {
  const [checking, setChecking] = useState(false)
  const [tableStatus, setTableStatus] = useState<any>(null)

  const checkDatabaseStatus = async () => {
    setChecking(true)
    try {
      const status = await checkTablesExist()
      setTableStatus(status)

      if (status.templatesExist && status.assignmentsExist) {
        toast.success('All certificate tables exist and are ready!')
      } else {
        toast.error('Some certificate tables are missing')
      }
    } catch (error) {
      console.error('Error checking database:', error)
      toast.error('Failed to check database status')
    } finally {
      setChecking(false)
    }
  }

  const createTablesManually = () => {
    toast.info('Please run the SQL commands from create_tables.sql in your Supabase SQL editor', {
      duration: 5000
    })
  }

  return (
    <Card className="border-orange-200">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <ExclamationTriangleIcon className="h-6 w-6 text-orange-600" />
          <h3 className="text-lg font-semibold text-orange-900">Database Setup</h3>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-gray-600">
          Certificate assignments require additional database tables to function properly.
        </p>

        <div className="flex space-x-4">
          <Button
            onClick={checkDatabaseStatus}
            disabled={checking}
            variant="outline"
          >
            {checking ? 'Checking...' : 'Check Database Status'}
          </Button>

          <Button
            onClick={createTablesManually}
            className="bg-orange-600 hover:bg-orange-700"
          >
            Get Setup Instructions
          </Button>
        </div>

        {tableStatus && (
          <div className="mt-4 space-y-2">
            <h4 className="font-medium text-gray-900">Database Status:</h4>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                {tableStatus.templatesExist ? (
                  <CheckCircleIcon className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircleIcon className="h-5 w-5 text-red-500" />
                )}
                <span className={tableStatus.templatesExist ? 'text-green-700' : 'text-red-700'}>
                  Certificate Templates Table: {tableStatus.templatesExist ? 'Exists' : 'Missing'}
                </span>
              </div>

              <div className="flex items-center space-x-2">
                {tableStatus.assignmentsExist ? (
                  <CheckCircleIcon className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircleIcon className="h-5 w-5 text-red-500" />
                )}
                <span className={tableStatus.assignmentsExist ? 'text-green-700' : 'text-red-700'}>
                  Certificate Assignments Table: {tableStatus.assignmentsExist ? 'Exists' : 'Missing'}
                </span>
              </div>
            </div>

            {(!tableStatus.templatesExist || !tableStatus.assignmentsExist) && (
              <div className="mt-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
                <h5 className="font-medium text-orange-900 mb-2">Setup Required:</h5>
                <ol className="list-decimal list-inside space-y-1 text-sm text-orange-700">
                  <li>Go to your Supabase project dashboard</li>
                  <li>Open the SQL Editor</li>
                  <li>Copy and paste the SQL from <code>src/SSH/create_tables.sql</code></li>
                  <li>Execute the SQL to create the required tables</li>
                  <li>Return here and click "Check Database Status" again</li>
                </ol>
              </div>
            )}

            {tableStatus.error && (
              <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200">
                <p className="text-sm text-red-700">
                  <strong>Error:</strong> {tableStatus.error}
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}