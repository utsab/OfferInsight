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

export default function InstructorDashboard() {
  const [students, setStudents] = useState<StudentData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {students.map((student) => (
            <div
              key={student.id}
              className="bg-gray-600 border border-light-steel-blue rounded-lg px-3 py-3 hover:border-electric-blue transition-colors w-fit"
            >
              {/* Header with name and status indicators */}
              <div className="flex items-center gap-3 mb-3">
                <h2 className="text-white font-medium text-lg whitespace-nowrap">{student.name}</h2>
                <div className="flex items-center gap-3">
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

