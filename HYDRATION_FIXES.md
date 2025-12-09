# Hydration Mismatch Fixes

This document outlines the hydration mismatch issues that were identified and fixed in the OfferInsight application.

## What is Hydration Mismatch?

Hydration mismatch occurs when the HTML rendered on the server doesn't match what React renders on the client. This happens because:

1. **Server-side rendering (SSR)** generates HTML on the server
2. **Client-side hydration** takes over and renders the same component
3. If the output differs, React throws a hydration mismatch error

## Issues Found and Fixed

### 1. Date Calculations in Client Components

**Problem**: Using `new Date()` directly in client components causes different values on server vs client due to timing differences.

**Files Fixed**:
- `app/onboarding/page1-v2/page.tsx` - Year calculation for graduation year dropdown
- `app/onboarding/page3-v2/page.tsx` - Estimated offer date calculation

**Solution**: Move date calculations to `useEffect` to ensure they only run on the client side.

### 2. Date Calculations in Server Components

**Problem**: Server and client can have different timezone offsets, causing date range calculations to differ.

**Files Fixed**:
- `app/dashboard/page.tsx` - Week and month date range calculations
- `app/api/dashboard-metrics/route.ts` - Month date range calculations
- `app/actions/dashboard-metrics.ts` - Week and month date range calculations

**Solution**: Created `app/lib/date-utils.ts` with consistent date handling functions that normalize timezone differences.

### 3. Client Context Loading States

**Problem**: Context providers that fetch data on mount can cause loading state mismatches between server and client.

**Files Fixed**:
- `app/contexts/DashboardMetricsContext.tsx` - Added `hasMounted` state to prevent initial fetch on server
- `app/ui/dashboard/total-progress-wrapper.tsx` - Added client-side mounting check

**Solution**: Use `hasMounted` state to ensure data fetching only happens after client-side hydration.

## New Utility Functions

### `app/lib/date-utils.ts`

Created centralized date utility functions:

- `getConsistentDate()` - Returns a date object that works consistently on server and client
- `getCurrentWeekDateRange()` - Gets Monday-Sunday date range with consistent handling
- `getCurrentMonthDateRange()` - Gets first-last day of month with consistent handling
- `formatDateForDisplay()` - Formats dates consistently for display

## Best Practices for Preventing Hydration Mismatches

### 1. Date Handling
```typescript
// ❌ Bad - Can cause hydration mismatch
const currentYear = new Date().getFullYear();

// ✅ Good - Use useEffect for client-side only
const [currentYear, setCurrentYear] = useState(2024);
useEffect(() => {
  setCurrentYear(new Date().getFullYear());
}, []);

// ✅ Good - Use utility functions for server components
import { getCurrentMonthDateRange } from '@/app/lib/date-utils';
const { firstDayOfMonth, lastDayOfMonth } = getCurrentMonthDateRange();
```

### 2. Client Context Loading States
```typescript
// ❌ Bad - Can cause hydration mismatch
const [isLoading, setIsLoading] = useState(true);
useEffect(() => {
  fetchData();
}, []);

// ✅ Good - Check if component has mounted
const [hasMounted, setHasMounted] = useState(false);
const [isLoading, setIsLoading] = useState(true);

useEffect(() => {
  setHasMounted(true);
}, []);

useEffect(() => {
  if (hasMounted) {
    fetchData();
  }
}, [hasMounted]);
```

### 3. Browser-Only APIs
```typescript
// ❌ Bad - Will cause hydration mismatch
const userAgent = window.navigator.userAgent;

// ✅ Good - Check if running on client
const [userAgent, setUserAgent] = useState('');
useEffect(() => {
  setUserAgent(window.navigator.userAgent);
}, []);
```

### 4. Random Values
```typescript
// ❌ Bad - Different values on server vs client
const randomId = Math.random().toString(36);

// ✅ Good - Generate on client side only
const [randomId, setRandomId] = useState('');
useEffect(() => {
  setRandomId(Math.random().toString(36));
}, []);
```

## Testing Hydration Fixes

To verify that hydration mismatches are fixed:

1. **Build and start the production server**:
   ```bash
   pnpm build
   pnpm start
   ```

2. **Check browser console** - Should not see hydration mismatch warnings

3. **Test key pages**:
   - Dashboard page (with date calculations)
   - Onboarding pages (with year dropdowns)
   - Any pages with client-side data fetching

4. **Use React DevTools** - Check for hydration warnings in the console

## Monitoring

To prevent future hydration mismatches:

1. **Always test in production mode** - Development mode is more forgiving
2. **Use React's Strict Mode** - Helps catch potential issues
3. **Monitor browser console** - Watch for hydration warnings
4. **Code review** - Check for patterns that can cause mismatches

## Files Modified

- `app/onboarding/page1-v2/page.tsx`
- `app/onboarding/page3-v2/page.tsx`
- `app/dashboard/page.tsx`
- `app/contexts/DashboardMetricsContext.tsx`
- `app/ui/dashboard/total-progress-wrapper.tsx`
- `app/api/dashboard-metrics/route.ts`
- `app/actions/dashboard-metrics.ts`
- `app/dashboard/in_person_events/page.tsx`
- `app/lib/date-utils.ts` (new file)

All changes maintain the same functionality while ensuring consistent rendering between server and client.
