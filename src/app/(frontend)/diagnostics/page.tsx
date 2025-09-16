import React from 'react'

export const dynamic = 'force-dynamic'

export default async function DiagnosticPage() {
  let payloadTest = 'Not tested'
  let dbTest = 'Not tested'

  // Environment check
  const envCheck = {
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URI: process.env.DATABASE_URI ? 'SET' : 'MISSING',
    PAYLOAD_SECRET: process.env.PAYLOAD_SECRET ? 'SET' : 'MISSING',
    UPLOADTHING_TOKEN: process.env.UPLOADTHING_TOKEN ? 'SET' : 'MISSING',
    NEXT_PUBLIC_SERVER_URL: process.env.NEXT_PUBLIC_SERVER_URL || 'MISSING',
    NETLIFY: process.env.NETLIFY || 'false',
    URL: process.env.URL || 'MISSING',
  }

  // Database test
  try {
    const { Client } = await import('pg')
    const client = new Client({
      connectionString: process.env.DATABASE_URI,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    })
    await client.connect()
    const result = await client.query('SELECT NOW() as current_time')
    await client.end()
    dbTest = `SUCCESS: ${result.rows[0].current_time}`
  } catch (error) {
    dbTest = `ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`
  }

  // Payload test
  try {
    const configPromise = await import('@payload-config')
    const config = await configPromise.default
    const { getPayload } = await import('payload')
    const payload = await getPayload({ config })
    const result = await payload.find({
      collection: 'categories',
      limit: 1,
    })
    payloadTest = `SUCCESS: Found ${result.totalDocs} categories`
  } catch (error) {
    payloadTest = `ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`
  }

  return (
    <div className="container mx-auto p-8 text-white">
      <h1 className="text-3xl font-bold mb-8">Production Diagnostics</h1>

      <div className="space-y-6">
        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Environment Variables</h2>
          <pre className="text-sm overflow-auto">{JSON.stringify(envCheck, null, 2)}</pre>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Database Connection</h2>
          <p className={dbTest.startsWith('SUCCESS') ? 'text-green-400' : 'text-red-400'}>
            {dbTest}
          </p>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Payload Initialization</h2>
          <p className={payloadTest.startsWith('SUCCESS') ? 'text-green-400' : 'text-red-400'}>
            {payloadTest}
          </p>
        </div>
      </div>
    </div>
  )
}
