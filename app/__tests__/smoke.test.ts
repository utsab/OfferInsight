/**
 * Simple smoke tests to verify the site loads correctly
 * 
 * This test suite checks that key files exist and can be found.
 * 
 * Note: For a more comprehensive test that verifies the entire site compiles
 * and works correctly, run `npm run build` which will check:
 * - TypeScript compilation
 * - Next.js build process
 * - All page and API route compilation
 * - Prisma schema validation
 * 
 * This is the best way to verify "does the site load correctly" end-to-end.
 */

import * as fs from 'fs';
import * as path from 'path';

describe('Site Smoke Tests - File Existence', () => {
  const rootDir = path.resolve(__dirname, '../..');

  describe('Key Pages Exist', () => {
    it('should have homepage file', () => {
      const homepagePath = path.join(rootDir, 'app', 'page.tsx');
      expect(fs.existsSync(homepagePath)).toBe(true);
    });

    it('should have instructor dashboard page', () => {
      const instructorPath = path.join(rootDir, 'app', 'instructor', 'dashboard', 'page.tsx');
      expect(fs.existsSync(instructorPath)).toBe(true);
    });

    it('should have main dashboard page', () => {
      const dashboardPath = path.join(rootDir, 'app', 'dashboard', 'page.tsx');
      expect(fs.existsSync(dashboardPath)).toBe(true);
    });
  });

  describe('API Routes Exist', () => {
    it('should have applications_with_outreach route', () => {
      const routePath = path.join(rootDir, 'app', 'api', 'applications_with_outreach', 'route.ts');
      expect(fs.existsSync(routePath)).toBe(true);
    });

    it('should have linkedin_outreach route', () => {
      const routePath = path.join(rootDir, 'app', 'api', 'linkedin_outreach', 'route.ts');
      expect(fs.existsSync(routePath)).toBe(true);
    });

    it('should have in_person_events route', () => {
      const routePath = path.join(rootDir, 'app', 'api', 'in_person_events', 'route.ts');
      expect(fs.existsSync(routePath)).toBe(true);
    });

    it('should have leetcode route', () => {
      const routePath = path.join(rootDir, 'app', 'api', 'leetcode', 'route.ts');
      expect(fs.existsSync(routePath)).toBe(true);
    });

    it('should have dashboard-metrics route', () => {
      const routePath = path.join(rootDir, 'app', 'api', 'dashboard-metrics', 'route.ts');
      expect(fs.existsSync(routePath)).toBe(true);
    });

    it('should have instructor students route', () => {
      const routePath = path.join(rootDir, 'app', 'api', 'instructor', 'students', 'route.ts');
      expect(fs.existsSync(routePath)).toBe(true);
    });
  });

  describe('Configuration Files Exist', () => {
    it('should have next.config.mjs', () => {
      const configPath = path.join(rootDir, 'next.config.mjs');
      expect(fs.existsSync(configPath)).toBe(true);
    });

    it('should have package.json', () => {
      const packagePath = path.join(rootDir, 'package.json');
      expect(fs.existsSync(packagePath)).toBe(true);
    });

    it('should have tsconfig.json', () => {
      const tsconfigPath = path.join(rootDir, 'tsconfig.json');
      expect(fs.existsSync(tsconfigPath)).toBe(true);
    });

    it('should have jest.config.js', () => {
      const jestPath = path.join(rootDir, 'jest.config.js');
      expect(fs.existsSync(jestPath)).toBe(true);
    });
  });
});

