"use client"

import { useEffect, useState } from 'react';

interface StudentData {
  id: string;
  name: string;
  email: string | null;
  activeStatus: number; // 0 = red, 1 = yellow, 2 = green
  progressStatus: number; // 0 = red, 1 = yellow, 2 = green
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
// Set to true to show 20 dummy student cards for testing the UI layout
// Set to false to fetch real student data from the API
// ============================================================================
const DEBUG_MODE = true;

// ============================================================================
// DEBUG: Generate dummy student data for testing
// This function creates 20 mock students with varied metrics and statuses
// to help visualize different card states in the dashboard
// ============================================================================
function generateDebugStudents(): StudentData[] {
  const names = [
    'Alice Johnson', 'Bob Smith', 'Charlie Brown', 'Diana Prince', 'Ethan Hunt',
    'Fiona Chen', 'George Williams', 'Hannah Kim', 'Isaac Newton', 'Julia Roberts',
    'Kevin Zhang', 'Laura Martinez', 'Michael Jordan', 'Nancy Drew', 'Oliver Twist',
    'Patricia Lee', 'Quinn Anderson', 'Rachel Green', 'Steve Jobs', 'Tina Turner'
  ];

  return names.map((name, index) => {
    // Vary the data to show different status combinations
    const hasGoodProgress = index % 4 === 0; // Every 4th student has good progress
    const hasMediumProgress = index % 4 === 1; // Every 4th student has medium progress
    const isActive = index % 3 === 0; // Every 3rd student is active
    const isMediumActive = index % 3 === 1; // Every 3rd student is medium active

    // Determine statuses
    const activeStatus = isActive ? 2 : (isMediumActive ? 1 : 0); // 2=green, 1=yellow, 0=red
    const progressStatus = hasGoodProgress ? 2 : (hasMediumProgress ? 1 : 0);

    // Generate varied metrics
    const applicationsLastMonth = hasGoodProgress ? Math.floor(Math.random() * 5) + 2 : (hasMediumProgress ? 1 : Math.floor(Math.random() * 2));
    const eventsLastMonth = hasGoodProgress ? Math.floor(Math.random() * 3) + 1 : (hasMediumProgress ? Math.floor(Math.random() * 2) : 0);
    const coffeeChatsLastMonth = hasGoodProgress ? Math.floor(Math.random() * 6) + 4 : (hasMediumProgress ? Math.floor(Math.random() * 5) + 2 : Math.floor(Math.random() * 3));
    const leetCodeLastMonth = hasGoodProgress ? Math.floor(Math.random() * 10) + 4 : (hasMediumProgress ? Math.floor(Math.random() * 5) + 2 : Math.floor(Math.random() * 3));

    return {
      id: `debug-${index}`,
      name: name,
      email: `${name.toLowerCase().replace(' ', '.')}@example.com`,
      activeStatus,
      progressStatus,
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
  const [students, setStudents] = useState<StudentData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ============================================================================
    // DEBUG: Skip API call and use dummy data if debug mode is enabled
    // ============================================================================
    if (DEBUG_MODE) {
      setStudents(generateDebugStudents());
      setLoading(false);
      return;
    }

    // ============================================================================
    // PRODUCTION: Fetch real student data from the API
    // ============================================================================
    async function fetchStudents() {
      try {
        const response = await fetch('/api/instructor/students');
        if (!response.ok) {
          throw new Error('Failed to fetch students');
        }
        const data = await response.json();
        setStudents(data.students || []);
      } catch (error) {
        console.error('Error fetching students:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchStudents();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-6">Instructor Dashboard</h1>
          <div className="text-gray-400">Loading students...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Instructor Dashboard</h1>
        
        <div 
          className="grid gap-4"
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, auto))' }}
        >
          {students.map((student) => (
            <div
              key={student.id}
              className="bg-gray-600 border border-light-steel-blue rounded-lg px-3 py-3 hover:border-electric-blue transition-colors w-fit"
              style={{ minWidth: '320px' }}
            >
              {/* Name on first line */}
              <div className="mb-2">
                <h2 className="text-white font-medium text-lg whitespace-nowrap">{student.name}</h2>
              </div>

              {/* Active and Progress status indicators on second line */}
              <div className="flex items-center gap-3 mb-3">
                {/* Active indicator */}
                <div className="flex items-center gap-1.5">
                  <div className={`w-4 h-4 rounded-full ${
                    student.activeStatus === 2 ? 'bg-green-500' : 
                    student.activeStatus === 1 ? 'bg-yellow-500' : 
                    'bg-red-500'
                  }`}></div>
                  <span className="text-gray-300 text-sm font-medium">Active</span>
                </div>
                {/* Progress indicator */}
                <div className="flex items-center gap-1.5">
                  <div className={`w-4 h-4 rounded-full ${
                    student.progressStatus === 2 ? 'bg-green-500' : 
                    student.progressStatus === 1 ? 'bg-yellow-500' : 
                    'bg-red-500'
                  }`}></div>
                  <span className="text-gray-300 text-sm font-medium">Progress</span>
                </div>
              </div>

              {/* Stats */}
              <div className="space-y-2.5">
                {/* Applications */}
                <div>
                  <div className="text-gray-300 text-sm font-medium mb-1"># of Applications</div>
                  <div className="flex justify-between text-gray-400 text-sm">
                    <span>Last Month: <span className="text-white">{student.applications.lastMonth}</span></span>
                    <span>All Time: <span className="text-white">{student.applications.allTime}</span></span>
                  </div>
                </div>

                {/* In Person Events */}
                <div>
                  <div className="text-gray-300 text-sm font-medium mb-1"># of In Person Events</div>
                  <div className="flex justify-between text-gray-400 text-sm">
                    <span>Last Month: <span className="text-white">{student.events.lastMonth}</span></span>
                    <span>All Time: <span className="text-white">{student.events.allTime}</span></span>
                  </div>
                </div>

                {/* Coffee Chats */}
                <div>
                  <div className="text-gray-300 text-sm font-medium mb-1"># of Coffee Chat Attempts</div>
                  <div className="flex justify-between text-gray-400 text-sm">
                    <span>Last Month: <span className="text-white">{student.coffeeChats.lastMonth}</span></span>
                    <span>All Time: <span className="text-white">{student.coffeeChats.allTime}</span></span>
                  </div>
                </div>

                {/* LeetCode Problems */}
                <div>
                  <div className="text-gray-300 text-sm font-medium mb-1"># of LeetCode Problems</div>
                  <div className="flex justify-between text-gray-400 text-sm">
                    <span>Last Month: <span className="text-white">{student.leetCode.lastMonth}</span></span>
                    <span>All Time: <span className="text-white">{student.leetCode.allTime}</span></span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {students.length === 0 && !loading && (
          <div className="text-gray-400 text-center py-8">No students found.</div>
        )}
      </div>
    </div>
  );
}

