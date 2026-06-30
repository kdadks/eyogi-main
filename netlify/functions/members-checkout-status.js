function json(statusCode, payload) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }
}

export const handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return json(405, { error: 'Method not allowed' })
  }

  const registrationId = event.queryStringParameters?.registrationId

  if (!registrationId || typeof registrationId !== 'string') {
    return json(400, { error: 'Registration ID is required' })
  }

  // Membership checkout data is primarily maintained client-side in session storage.
  // This fallback endpoint exists so /api/members/checkout-status/* is wired on Netlify.
  return json(404, {
    error: 'Checkout data not found',
    message: 'Please retry membership registration if this page was reopened later.',
  })
}
