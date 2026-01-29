"use client"

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface UserData {
  id: string;
  name: string;
  email: string | null;
  activeStatus: number; // 0 = red, 1 = yellow, 2 = green
  progressStatus: number; // 0 = red, 1 = yellow, 2 = green
  referralCount: number; // Number of referrals received
  applications: {
    lastMonth: number;
    allTime: number;
  };
  coffeeChats: {
    lastMonth: number;
    allTime: number;
  };
  events: {
    lastMonth: number;
    allTime: number;
  };
  leetCode: {
    lastMonth: number;
    allTime: number;
  };
}

// ============================================================================
// DEBUG MODE - Toggle this boolean to enable/disable dummy debug cards
// Set to true to show 20 dummy user cards for testing the UI layout
// Set to false to fetch real user data from the API
// ============================================================================
const DEBUG_MODE = false;

// ============================================================================
// DEBUG: Generate dummy user data for testing
// This function creates 20 mock users with varied metrics and statuses
// to help visualize different card states in the dashboard
// ============================================================================
function generateDebugUsers(): UserData[] {
  const names = [
    'Alice Johnson', 'Bob Smith', 'Charlie Brown', 'Diana Prince', 'Ethan Hunt',
    'Fiona Chen', 'George Williams', 'Hannah Kim', 'Isaac Newton', 'Julia Roberts',
    'Kevin Zhang', 'Laura Martinez', 'Michael Jordan', 'Nancy Drew', 'Oliver Twist',
    'Patricia Lee', 'Quinn Anderson', 'Rachel Green', 'Steve Jobs', 'Tina Turner'
  ];

  return names.map((name, index) => {
    // Vary the data to show different status combinations
    const hasGoodProgress = index % 4 === 0; // Every 4th user has good progress
    const hasMediumProgress = index % 4 === 1; // Every 4th user has medium progress
    const isActive = index % 3 === 0; // Every 3rd user is active
    const isMediumActive = index % 3 === 1; // Every 3rd user is medium active

    // Determine statuses
    const activeStatus = isActive ? 2 : (isMediumActive ? 1 : 0); // 2=green, 1=yellow, 0=red
    const progressStatus = hasGoodProgress ? 2 : (hasMediumProgress ? 1 : 0);

    // Generate varied metrics
    const applicationsLastMonth = hasGoodProgress ? Math.floor(Math.random() * 5) + 2 : (hasMediumProgress ? 1 : Math.floor(Math.random() * 2));
    const eventsLastMonth = hasGoodProgress ? Math.floor(Math.random() * 3) + 1 : (hasMediumProgress ? Math.floor(Math.random() * 2) : 0);
    const coffeeChatsLastMonth = hasGoodProgress ? Math.floor(Math.random() * 6) + 4 : (hasMediumProgress ? Math.floor(Math.random() * 5) + 2 : Math.floor(Math.random() * 3));
    const leetCodeLastMonth = hasGoodProgress ? Math.floor(Math.random() * 10) + 4 : (hasMediumProgress ? Math.floor(Math.random() * 5) + 2 : Math.floor(Math.random() * 3));

    // Generate referral count - some users have referrals (exciting!)
    const referralCount = hasGoodProgress && index % 5 === 0 
      ? Math.floor(Math.random() * 3) + 1  // 1-3 referrals for some successful users
      : hasGoodProgress && index % 7 === 0
      ? Math.floor(Math.random() * 2) + 1  // 1-2 referrals for others
      : 0; // Most users have 0 referrals

    return {
      id: `debug-${index}`,
      name: name,
      email: `${name.toLowerCase().replace(' ', '.')}@example.com`,
      activeStatus,
      progressStatus,
      referralCount,
      applications: {
        lastMonth: applicationsLastMonth,
        allTime: applicationsLastMonth * 5 + Math.floor(Math.random() * 20)
      },
      coffeeChats: {
        lastMonth: coffeeChatsLastMonth,
        allTime: coffeeChatsLastMonth * 4 + Math.floor(Math.random() * 30)
      },
      events: {
        lastMonth: eventsLastMonth,
        allTime: eventsLastMonth * 3 + Math.floor(Math.random() * 15)
      },
      leetCode: {
        lastMonth: leetCodeLastMonth,
        allTime: leetCodeLastMonth * 6 + Math.floor(Math.random() * 50)
      }
    };
  });
}

export default function InstructorDashboard() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    // ============================================================================
    // DEBUG: Skip API call and use dummy data if debug mode is enabled
    // ============================================================================
    if (DEBUG_MODE) {
      setUsers(generateDebugUsers());
      setLoading(false);
      return;
    }

    // ============================================================================
    // PRODUCTION: Fetch real user data from the API
    // ============================================================================
    async function fetchUsers() {
      try {
        const response = await fetch('/api/instructor/students');
        if (!response.ok) {
          throw new Error('Failed to fetch users');
        }
        const data = await response.json();
        setUsers(data.students || []);
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, []);

  // Filter and sort users
  const filteredAndSortedUsers = users
    .filter((user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      const comparison = a.name.localeCompare(b.name);
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-6">Instructor Dashboard</h1>
          <div className="text-gray-400">Loading users...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Instructor Dashboard</h1>
        
        {/* Search and Sort Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          {/* Search Input */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-electric-blue focus:ring-1 focus:ring-electric-blue"
            />
          </div>
          
          {/* Sort Dropdown */}
          <div className="sm:w-48">
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-electric-blue focus:ring-1 focus:ring-electric-blue"
            >
              <option value="asc">Sort: A-Z</option>
              <option value="desc">Sort: Z-A</option>
            </select>
          </div>
        </div>
        
        {/* Result Count */}
        {!loading && users.length > 0 && (
          <div className="text-gray-400 text-sm mb-4">
            Showing {filteredAndSortedUsers.length} of {users.length} user{users.length !== 1 ? 's' : ''}
            {searchQuery && ` matching "${searchQuery}"`}
          </div>
        )}
        
        <div className="flex flex-col gap-3">
          {filteredAndSortedUsers.map((user) => (
            <div
              key={user.id}
              className="bg-gray-600 border border-light-steel-blue rounded-lg px-6 py-4 hover:border-electric-blue transition-colors w-full"
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                {/* Left side: Name (clickable), Status, and Referrals */}
                <div className="flex flex-col gap-2 min-w-0">
                  {/* Top row: Name + Active/Progress lights inline */}
                  <div className="flex flex-wrap items-center gap-4 min-w-0">
                    {/* Name - Clickable Link */}
                    <div className="min-w-0">
                      <Link
                        href={`/dashboard?userId=${user.id}`}
                        className="text-white font-medium text-lg hover:text-electric-blue transition-colors whitespace-nowrap"
                      >
                        {user.name}
                      </Link>
                    </div>

                    {/* Active and Progress status indicators */}
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-4">
                        {/* Active indicator */}
                        <div className="flex items-center gap-1.5">
                          <div className={`w-4 h-4 rounded-full flex-shrink-0 ${
                            user.activeStatus === 2 ? 'bg-green-500' : 
                            user.activeStatus === 1 ? 'bg-yellow-500' : 
                            'bg-red-500'
                          }`}></div>
                          <span className="text-gray-300 text-sm font-medium whitespace-nowrap">Active</span>
                        </div>
                        {/* Progress indicator */}
                        <div className="flex items-center gap-1.5">
                          <div className={`w-4 h-4 rounded-full flex-shrink-0 ${
                            user.progressStatus === 2 ? 'bg-green-500' : 
                            user.progressStatus === 1 ? 'bg-yellow-500' : 
                            'bg-red-500'
                          }`}></div>
                          <span className="text-gray-300 text-sm font-medium whitespace-nowrap">Progress</span>
                        </div>
                      </div>

                      {/* Referrals - Prominent green display when user has referrals, below Active/Progress lights */}
                      {user.referralCount > 0 && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-900/30 border border-green-500 rounded-lg w-fit">
                          <span className="text-green-400 font-bold text-base whitespace-nowrap">
                            🎉 {user.referralCount} Referral{user.referralCount !== 1 ? 's' : ''}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Stats - Responsive grid that wraps on smaller screens */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 flex-1 min-w-0">
                  {/* Applications */}
                  <div className="min-w-0">
                    <div className="text-gray-300 text-sm font-medium mb-1">Applications</div>
                    <div className="text-gray-400 text-sm flex flex-col">
                      <span>Last Month: <span className="text-white font-medium">{user.applications.lastMonth}</span></span>
                      <span>All Time: <span className="text-white font-medium">{user.applications.allTime}</span></span>
                    </div>
                  </div>

                  {/* In Person Events */}
                  <div className="min-w-0">
                    <div className="text-gray-300 text-sm font-medium mb-1">Events</div>
                    <div className="text-gray-400 text-sm flex flex-col">
                      <span>Last Month: <span className="text-white font-medium">{user.events.lastMonth}</span></span>
                      <span>All Time: <span className="text-white font-medium">{user.events.allTime}</span></span>
                    </div>
                  </div>

                  {/* Coffee Chats */}
                  <div className="min-w-0">
                    <div className="text-gray-300 text-sm font-medium mb-1">Coffee Chats</div>
                    <div className="text-gray-400 text-sm flex flex-col">
                      <span>Last Month: <span className="text-white font-medium">{user.coffeeChats.lastMonth}</span></span>
                      <span>All Time: <span className="text-white font-medium">{user.coffeeChats.allTime}</span></span>
                    </div>
                  </div>

                  {/* LeetCode Problems */}
                  <div className="min-w-0">
                    <div className="text-gray-300 text-sm font-medium mb-1">LeetCode</div>
                    <div className="text-gray-400 text-sm flex flex-col">
                      <span>Last Month: <span className="text-white font-medium">{user.leetCode.lastMonth}</span></span>
                      <span>All Time: <span className="text-white font-medium">{user.leetCode.allTime}</span></span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredAndSortedUsers.length === 0 && !loading && (
          <div className="text-gray-400 text-center py-8">
            {searchQuery ? 'No users found matching your search.' : 'No users found.'}
          </div>
        )}
      </div>
    </div>
  );
}

