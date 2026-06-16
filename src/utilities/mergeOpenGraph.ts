export interface OpenGraphMetadata {
  title?: string
  description?: string
  image?: string
  url?: string
}

export function mergeOpenGraph(
  og: OpenGraphMetadata,
  defaults?: OpenGraphMetadata,
): OpenGraphMetadata {
  return {
    ...defaults,
    ...og,
  }
}
