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

### 3. Remove Mock/Feature Toggle Code (if never used)
- `app/dashboard/page.tsx`:
  - `ENABLE_DASHBOARD_MOCKS = false` - Mock data toggle (lines 89, 303, 341, 461, 495, 609, 643, 759, 792, 900, 1152)
  - `ENABLE_DATE_FIELD_EDITING = false` - Date editing toggle (lines 96, 1967, 2094, 2222, 2352, 2581, 2785, 2933, 3068)
  - Consider removing if these features are never used

### 4. Review Documentation Files
- `notes.md` - This file (TODO list - might be outdated)
- `HYDRATION_FIXES.md` - Documentation (might be outdated, check if still relevant)
- `README.md` - Still references tutorial content, update for actual project

### 5. Review Utility Scripts
- `resetIdSequence.js` - Database utility script (might be obsolete if not used)

### 6. Remove Unused Dependencies (CONFIRMED UNUSED)
- `@heroicons/react` - Not imported anywhere in code
- `@tanstack/react-table` - Not imported anywhere in code
- `@vercel/postgres` - Not imported anywhere in code (using Prisma instead)
- `zod` - Not imported anywhere in code
- `use-debounce` - Not imported anywhere in code
- `@radix-ui/react-avatar` - Not imported anywhere in code
- `@radix-ui/react-collapsible` - Not imported anywhere in code
- `@radix-ui/react-dropdown-menu` - Not imported anywhere in code
- `@radix-ui/react-navigation-menu` - Not imported anywhere in code
- `bcrypt` - Not imported anywhere in code (WORK_FACTOR env var also unused)
- `@types/bcrypt` - Not needed if bcrypt is removed

### 7. Review Potentially Unused Onboarding Page
- `app/onboarding/page.tsx` - Simple navigation page that might not be needed if users go directly to page1/page2/page3

## Original TODO Items
- column config needs to be removed from the regular pages, it's just for the route
- Applications: Date_Created
- LinkedIn outreach: Date_Created
