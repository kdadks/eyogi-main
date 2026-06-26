export function getURL(path: string = ''): string {
  const baseURL =
    process.env.VERCEL_PROJECT_PRODUCTION_URL && process.env.VERCEL_ENV === 'production'
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : import.meta.env.VITE_SERVER_URL || 'http://localhost:3000'

  return `${baseURL}${path}`
}

export function getServerSideURL(path: string = ''): string {
  return getURL(path)
}
