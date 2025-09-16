// Debug script to check image loading issues on paginated pages
// Add this temporarily to your hinduism page to debug

console.log('=== DEBUG: Post data on page', posts.page, '===')
console.log('Total posts:', posts.docs.length)
console.log('Posts with images:', posts.docs.filter((post) => post.coverImage).length)

posts.docs.forEach((post, index) => {
  console.log(`Post ${index + 1}:`, {
    title: post.title,
    slug: post.slug,
    hasCoverImage: !!post.coverImage,
    coverImageType: typeof post.coverImage,
    coverImageUrl:
      post.coverImage && typeof post.coverImage === 'object' ? post.coverImage.url : 'N/A',
  })
})

// Check if coverImage is populated properly
const postsWithImages = posts.docs.filter(
  (post) => post.coverImage && typeof post.coverImage === 'object',
)
console.log('Posts with properly populated images:', postsWithImages.length)

if (postsWithImages.length > 0) {
  console.log('Sample image data:', {
    url: postsWithImages[0].coverImage.url,
    filename: postsWithImages[0].coverImage.filename,
    mimeType: postsWithImages[0].coverImage.mimeType,
  })
}
