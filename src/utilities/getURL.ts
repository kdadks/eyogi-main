export function getURL(path: string = ''): string {
  const baseURL =
    import.meta.env.VITE_SERVER_URL ||
    process.env.URL ||
    process.env.DEPLOY_PRIME_URL ||
    process.env.DEPLOY_URL ||
    (typeof window !== 'undefined' ? window.location.origin : '')

  return `${baseURL}${path}`
}

export function getServerSideURL(path: string = ''): string {
  return getURL(path)
}
