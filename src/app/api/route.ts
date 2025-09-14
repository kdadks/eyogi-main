import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    name: 'eYogi Gurukul API',
    status: 'active',
    description: 'API for eYogi educational platform',
    endpoints: [
      '/api/graphql - GraphQL API',
      '/api/graphql-playground - GraphQL Explorer',
      '/api/send - Contact form submission',
    ],
  })
}
