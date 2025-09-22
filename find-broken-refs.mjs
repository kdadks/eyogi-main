import { getPayload } from 'payload'
import configPromise from './src/payload.config.ts'

async function findBrokenReferences() {
  try {
    const config = await configPromise
    const payload = await getPayload({ config })

    console.log('🔍 Searching for broken media references (IDs 21 and 90)...')

    // Check pages collection
    const pages = await payload.find({
      collection: 'pages',
      limit: 1000,
    })

    for (const page of pages.docs) {
      if (page.content) {
        const content = JSON.stringify(page.content)
        if (content.includes('"value":21') || content.includes('"value":90')) {
          console.log(`\n📄 Found broken reference in page: ${page.title || page.id}`)
          console.log(`   ID: ${page.id}`)
          console.log(`   Slug: ${page.slug}`)
          if (content.includes('"value":21')) console.log('   Contains reference to media ID 21')
          if (content.includes('"value":90')) console.log('   Contains reference to media ID 90')
        }
      }
    }

    // Check posts collection
    const posts = await payload.find({
      collection: 'posts',
      limit: 1000,
    })

    for (const post of posts.docs) {
      if (post.content) {
        const content = JSON.stringify(post.content)
        if (content.includes('"value":21') || content.includes('"value":90')) {
          console.log(`\n📝 Found broken reference in post: ${post.title || post.id}`)
          console.log(`   ID: ${post.id}`)
          console.log(`   Slug: ${post.slug}`)
          if (content.includes('"value":21')) console.log('   Contains reference to media ID 21')
          if (content.includes('"value":90')) console.log('   Contains reference to media ID 90')
        }
      }
    }

    // Check globals
    const globals = ['about-us', 'privacy-policy', 'donation']
    for (const globalSlug of globals) {
      try {
        const global = await payload.findGlobal({ slug: globalSlug })
        if (global && global.content) {
          const content = JSON.stringify(global.content)
          if (content.includes('"value":21') || content.includes('"value":90')) {
            console.log(`\n🌐 Found broken reference in global: ${globalSlug}`)
            if (content.includes('"value":21')) console.log('   Contains reference to media ID 21')
            if (content.includes('"value":90')) console.log('   Contains reference to media ID 90')
          }
        }
      } catch (_error) {
        console.log(`Global ${globalSlug} not found`)
      }
    }

    console.log('\n✅ Search complete!')
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

findBrokenReferences()
