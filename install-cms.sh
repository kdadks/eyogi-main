#!/bin/bash

# CMS Installation Quick Start Script
# This script helps you verify your setup and provides migration commands

set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║   eYogi Gurukul - Comprehensive CMS Installation          ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if .env.local exists
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 1: Checking environment variables..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -f .env.local ]; then
    echo -e "${GREEN}✓${NC} .env.local found"
    
    # Check for required variables
    if grep -q "VITE_SUPABASE_URL" .env.local && grep -q "VITE_SUPABASE_ANON_KEY" .env.local; then
        echo -e "${GREEN}✓${NC} Supabase credentials configured"
    else
        echo -e "${RED}✗${NC} Missing Supabase credentials in .env.local"
        echo "Please add:"
        echo "  VITE_SUPABASE_URL=your_supabase_url"
        echo "  VITE_SUPABASE_ANON_KEY=your_supabase_anon_key"
        exit 1
    fi
else
    echo -e "${RED}✗${NC} .env.local not found"
    echo "Please create .env.local with:"
    echo "  VITE_SUPABASE_URL=your_supabase_url"
    echo "  VITE_SUPABASE_ANON_KEY=your_supabase_anon_key"
    exit 1
fi

echo ""

# Check if migrations exist
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 2: Checking migration files..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -f "migrations/create_comprehensive_cms.sql" ]; then
    echo -e "${GREEN}✓${NC} migrations/create_comprehensive_cms.sql found"
else
    echo -e "${RED}✗${NC} Migration file not found!"
    exit 1
fi

if [ -f "migrations/seed_cms_initial_data.sql" ]; then
    echo -e "${GREEN}✓${NC} migrations/seed_cms_initial_data.sql found"
else
    echo -e "${RED}✗${NC} Seed file not found!"
    exit 1
fi

echo ""

# Check if Node modules are installed
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 3: Checking dependencies..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -d "node_modules" ]; then
    echo -e "${GREEN}✓${NC} node_modules exists"
else
    echo -e "${YELLOW}⚠${NC}  node_modules not found. Installing dependencies..."
    npm install
    echo -e "${GREEN}✓${NC} Dependencies installed"
fi

echo ""

# Check if CMS components exist
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 4: Verifying CMS components..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

FILES=(
    "src/pages/admin/AdminCMS.tsx"
    "src/pages/admin/CMSEditor.tsx"
    "src/components/admin/cms/MediaPicker.tsx"
    "src/components/admin/cms/ContentBlockEditor.tsx"
    "src/components/admin/cms/SEOEditor.tsx"
    "src/components/admin/cms/VersionHistory.tsx"
    "src/lib/cms-api.ts"
    "src/lib/cms-types.ts"
)

MISSING=0
for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} $file"
    else
        echo -e "${RED}✗${NC} $file (missing)"
        MISSING=$((MISSING + 1))
    fi
done

if [ $MISSING -gt 0 ]; then
    echo ""
    echo -e "${RED}Error: $MISSING required files are missing!${NC}"
    exit 1
fi

echo ""

# Print next steps
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Pre-flight checks passed!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo ""
echo "1. RUN DATABASE MIGRATIONS"
echo "   → Go to Supabase Dashboard → SQL Editor"
echo "   → Execute: migrations/create_comprehensive_cms.sql"
echo "   → Then execute: migrations/seed_cms_initial_data.sql"
echo ""
echo "2. START DEVELOPMENT SERVER"
echo "   → Run: npm run dev"
echo "   → Open: http://localhost:5173"
echo ""
echo "3. ACCESS CMS ADMIN"
echo "   → Navigate to: http://localhost:5173/admin"
echo "   → Login with your credentials"
echo "   → Go to Content → CMS (has 'NEW' badge)"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${YELLOW}Important Notes:${NC}"
echo "• Your existing pages will continue to work unchanged"
echo "• CMS provides a parallel content management system"
echo "• No data loss - all existing content is preserved"
echo "• You can migrate pages to CMS gradually"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${GREEN}📚 Documentation:${NC}"
echo "• Installation Guide: doc/CMS_INSTALLATION_GUIDE.md"
echo "• Comprehensive Guide: doc/CMS_COMPREHENSIVE_GUIDE.md"
echo "• API Reference: doc/CMS_API_REFERENCE.md"
echo "• Implementation Summary: doc/CMS_IMPLEMENTATION_SUMMARY.md"
echo ""
echo "Ready to install? Follow the steps above! 🚀"
echo ""
