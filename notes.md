# TODO:

## Code Cleanup Tasks

### 1. Remove Debug Console.log Statements
- `auth.ts` lines 28-29, 36 - Debug logs in session callback
- `app/server.ts` line 9 - "Unauthorized!!!!!!!!!!!!!!!!!!!!!!" debug message
- `app/onboarding/page.tsx` line 8 - Same debug message
- Check all 24 files with console.log statements and remove debug ones

### 2. Clean Up Large Commented Code Blocks
- `auth.ts` lines 61-134 - Entire commented NextAuth configuration (70+ lines)
  - Consider removing if not needed for reference

### 3. Review Documentation Files
- `HYDRATION_FIXES.md` - Documentation (might be outdated, check if still relevant)

### 4. Review Utility Scripts
- `resetIdSequence.js` - Database utility script (might be obsolete if not used)

### 5. Review Potentially Unused Onboarding Page
- `app/onboarding/page.tsx` - Simple navigation page that might not be needed if users go directly to page1/page2/page3
