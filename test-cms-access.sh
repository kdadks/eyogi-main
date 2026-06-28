#!/bin/bash
# Quick test to access Create functionality

echo "=== Testing CMS Access ==="
echo ""
echo "1. Direct URL to create new page:"
echo "   http://localhost:3001/admin/cms/editor/new"
echo ""
echo "2. CMS Dashboard:"
echo "   http://localhost:3001/admin/cms"
echo ""
echo "3. Edit existing Home page:"
echo "   Check the CMS dashboard for the Home page ID and click Edit"
echo ""
echo "=== Checking if dev server is running ==="
if lsof -ti:3001 > /dev/null 2>&1; then
  echo "✓ Dev server is running on port 3001"
else
  echo "✗ Dev server is NOT running"
  echo "  Run: npm run dev"
fi
echo ""
echo "=== Next Steps ==="
echo "1. Navigate to: http://localhost:3001/admin/cms/editor/new"
echo "2. This will open the content editor directly"
echo "3. Fill in the form and click Save"
