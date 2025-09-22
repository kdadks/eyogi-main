import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

export const dynamic = 'force-dynamic'

type LexicalNode = {
  type: string
  text?: string
  children?: LexicalNode[]
  fields?: {
    doc?: {
      value: string | Record<string, unknown>
      relationTo: string
    }
  }
  id?: string
  format?: number
  indent?: number
  version?: number
  direction?: string
}

type _LexicalContent = {
  root: {
    children: LexicalNode[]
  }
}

type _BrokenReference = {
  docId: string
  collection: string
  field: string
  mediaId: string | number
  relationTo: string
  nodeId: string
}

type _CollectionName = 'pages' | 'posts' | 'aboutUs' | 'donation' | 'privacyPolicy'

export async function GET() {
  try {
    const config = await configPromise
    const payload = await getPayload({ config })

    console.log('🔍 Checking for broken media references...')

    // Get all collections that might have rich text content
    const collections = [
      'pages',
      'posts',
      'media',
      'categories',
      'Faq',
      'membership',
      'formLinks',
    ] as const
    const globals = ['about-us', 'privacy-policy', 'donation'] as const
    const brokenReferences: _BrokenReference[] = []

    // Check collections
    for (const collectionName of collections) {
      try {
        const { docs } = await payload.find({
          collection: collectionName,
          limit: 1000,
        })

        for (const doc of docs) {
          // Check various rich text fields
          const richTextFields = ['content', 'richText', 'description', 'body', 'text']

          for (const fieldName of richTextFields) {
            if (doc[fieldName]) {
              const brokenRefs = findBrokenMediaReferences(
                doc[fieldName],
                String(doc.id),
                collectionName,
                fieldName,
              )
              brokenReferences.push(...brokenRefs)
            }
          }
        }
      } catch (error) {
        console.log(`Collection ${collectionName} not found or error:`, (error as Error).message)
      }
    }

    // Check globals
    for (const globalName of globals) {
      try {
        const doc = await payload.findGlobal({
          slug: globalName,
        })

        if (doc) {
          // Check various rich text fields
          const richTextFields = ['content', 'richText', 'description', 'body', 'text']

          for (const fieldName of richTextFields) {
            if (doc[fieldName]) {
              const brokenRefs = findBrokenMediaReferences(
                doc[fieldName],
                globalName,
                'global',
                fieldName,
              )
              brokenReferences.push(...brokenRefs)
            }
          }
        }
      } catch (error) {
        console.log(`Global ${globalName} not found or error:`, (error as Error).message)
      }
    }

    console.log(`Found ${brokenReferences.length} broken media references`)

    return NextResponse.json({
      success: true,
      brokenReferences,
      count: brokenReferences.length,
      summary: {
        mediaIds: [...new Set(brokenReferences.map((ref) => ref.mediaId))],
        affectedDocuments: brokenReferences.length,
      },
    })
  } catch (error) {
    console.error('Error checking broken references:', error)
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 })
  }
}

export async function POST() {
  try {
    const config = await configPromise
    const payload = await getPayload({ config })

    console.log('🧹 Cleaning up broken media references...')

    // Get all collections that might have rich text content
    const collections = [
      'pages',
      'posts',
      'media',
      'categories',
      'Faq',
      'membership',
      'formLinks',
    ] as const
    const globals = ['about-us', 'privacy-policy', 'donation'] as const
    let fixedCount = 0

    // Fix collections
    for (const collectionName of collections) {
      try {
        const { docs } = await payload.find({
          collection: collectionName,
          limit: 1000,
        })

        for (const doc of docs) {
          // Check various rich text fields
          const richTextFields = ['content', 'richText', 'description', 'body', 'text']
          let documentUpdated = false
          const updatedDoc = { ...doc }

          for (const fieldName of richTextFields) {
            if (doc[fieldName]) {
              const cleanedContent = cleanBrokenMediaReferences(doc[fieldName])
              if (cleanedContent !== doc[fieldName]) {
                updatedDoc[fieldName] = cleanedContent
                documentUpdated = true
              }
            }
          }

          if (documentUpdated) {
            await payload.update({
              collection: collectionName,
              id: doc.id,
              data: updatedDoc,
            })
            fixedCount++
            console.log(`Fixed broken references in ${collectionName}:${doc.id}`)
          }
        }
      } catch (error) {
        console.log(`Collection ${collectionName} not found or error:`, (error as Error).message)
      }
    }

    // Fix globals
    for (const globalName of globals) {
      try {
        const doc = await payload.findGlobal({
          slug: globalName,
        })

        if (doc) {
          // Check various rich text fields
          const richTextFields = ['content', 'richText', 'description', 'body', 'text']
          let documentUpdated = false
          const updatedDoc = { ...doc }

          for (const fieldName of richTextFields) {
            if (doc[fieldName]) {
              const cleanedContent = cleanBrokenMediaReferences(doc[fieldName])
              if (cleanedContent !== doc[fieldName]) {
                updatedDoc[fieldName] = cleanedContent
                documentUpdated = true
              }
            }
          }

          if (documentUpdated) {
            await payload.updateGlobal({
              slug: globalName,
              data: updatedDoc,
            })
            fixedCount++
            console.log(`Fixed broken references in global:${globalName}`)
          }
        }
      } catch (error) {
        console.log(`Global ${globalName} not found or error:`, (error as Error).message)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Fixed broken media references in ${fixedCount} documents`,
      fixedCount,
    })
  } catch (error) {
    console.error('Error cleaning broken references:', error)
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 })
  }
}

function findBrokenMediaReferences(
  content: unknown,
  docId: string,
  collection: string,
  field: string,
): _BrokenReference[] {
  const brokenRefs: _BrokenReference[] = []

  if (
    !content ||
    typeof content !== 'object' ||
    !('root' in content) ||
    !content.root ||
    typeof content.root !== 'object' ||
    !('children' in content.root)
  ) {
    return brokenRefs
  }

  function traverse(node: LexicalNode) {
    if (node.type === 'link' && node.fields?.doc) {
      const { value, relationTo } = node.fields.doc

      // Check if value is just an ID instead of an object
      if (typeof value !== 'object' && relationTo === 'media') {
        brokenRefs.push({
          docId,
          collection,
          field,
          mediaId: value,
          relationTo,
          nodeId: node.id || 'unknown',
        })
      }
    }

    if (node.children) {
      node.children.forEach(traverse)
    }
  }

  const rootNode = content.root as { children: LexicalNode[] }
  rootNode.children.forEach(traverse)
  return brokenRefs
}

function cleanBrokenMediaReferences(content: unknown): unknown {
  if (
    !content ||
    typeof content !== 'object' ||
    !('root' in content) ||
    !content.root ||
    typeof content.root !== 'object' ||
    !('children' in content.root)
  ) {
    return content
  }

  const cleanedContent = JSON.parse(JSON.stringify(content))

  function traverse(node: LexicalNode) {
    if (node.type === 'link' && node.fields?.doc) {
      const { value, relationTo } = node.fields.doc

      // Remove broken media references
      if (typeof value !== 'object' && relationTo === 'media') {
        // Convert link to plain text
        node.type = 'text'
        node.text = node.children?.[0]?.text || 'Broken Link'
        delete node.fields
        delete node.children
        delete node.format
        delete node.indent
        delete node.version
        delete node.direction
      }
    }

    if (node.children) {
      node.children.forEach(traverse)
    }
  }

  const rootNode = cleanedContent.root as { children: LexicalNode[] }
  rootNode.children.forEach(traverse)
  return cleanedContent
}
