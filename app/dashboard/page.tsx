'use client';

import { useState } from 'react';

export default function Page() {
  const [activeTab, setActiveTab] = useState('applications');

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
  };

  const handleHabitCardClick = (cardId: string) => {
    setActiveTab(cardId);
  };

  return (
    <div className="bg-gray-900 text-white min-h-screen">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-8 py-8">
        {/* Main Navigation Tabs */}
        <section className="mb-8">
          <div className="flex border-b border-light-steel-blue bg-gray-800 rounded-t-lg">
            <button 
              onClick={() => handleTabClick('overview')}
              className={`main-tab-btn flex-1 py-4 px-6 text-center font-semibold border-r border-light-steel-blue transition-colors ${
                activeTab === 'overview' 
                  ? 'bg-electric-blue text-white' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              <i className="fas fa-gauge-high mr-2"></i>Overview
            </button>
            <button 
              onClick={() => handleTabClick('applications')}
              className={`main-tab-btn flex-1 py-4 px-6 text-center font-semibold border-r border-light-steel-blue transition-colors ${
                activeTab === 'applications' 
                  ? 'bg-electric-blue text-white' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              <i className="fas fa-file-lines mr-2"></i>Applications
            </button>
            <button 
              onClick={() => handleTabClick('interviews')}
              className={`main-tab-btn flex-1 py-4 px-6 text-center font-semibold border-r border-light-steel-blue transition-colors ${
                activeTab === 'interviews' 
                  ? 'bg-electric-blue text-white' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              <i className="fas fa-comments mr-2"></i>Interviews
            </button>
            <button 
              onClick={() => handleTabClick('events')}
              className={`main-tab-btn flex-1 py-4 px-6 text-center font-semibold border-r border-light-steel-blue transition-colors ${
                activeTab === 'events' 
                  ? 'bg-electric-blue text-white' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              <i className="fas fa-users mr-2"></i>Events
            </button>
            <button 
              onClick={() => handleTabClick('leetcode')}
              className={`main-tab-btn flex-1 py-4 px-6 text-center font-semibold transition-colors ${
                activeTab === 'leetcode' 
                  ? 'bg-electric-blue text-white' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              <i className="fas fa-code mr-2"></i>LeetCode
            </button>
          </div>
        </section>

        {/* Overview Content */}
        {activeTab === 'overview' && (
          <div>
            {/* Projected Offer Section */}
            <section className="bg-gradient-to-r from-electric-blue to-blue-600 rounded-lg p-8 mb-8 text-center">
              <h2 className="text-2xl font-bold text-white mb-2">Projected Offer Date</h2>
              <div className="text-6xl font-bold text-white mb-2">March 15, 2024</div>
              <p className="text-blue-100 text-lg">Based on your current progress and habits</p>
              <div className="mt-4 flex justify-center space-x-8 text-blue-100">
                <div className="text-center">
                  <div className="text-2xl font-bold">67%</div>
                  <div className="text-sm">Confidence Level</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">89</div>
                  <div className="text-sm">Days Remaining</div>
                </div>
              </div>
            </section>

            {/* Habit Overview Section */}
            <section>
              <h3 className="text-2xl font-bold text-white mb-6">Habit Overview</h3>
              <div className="grid grid-cols-4 gap-6">
                <div 
                  onClick={() => handleHabitCardClick('applications')}
                  className="bg-gray-800 border border-light-steel-blue rounded-lg p-6 hover:border-electric-blue transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <i className="fas fa-file-lines text-electric-blue text-xl"></i>
                      <h4 className="text-white font-semibold">Applications</h4>
                    </div>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>
                  <div className="text-3xl font-bold text-white mb-1">23</div>
                  <div className="text-sm text-gray-400 mb-3">This month</div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Goal: 20</span>
                    <span className="text-green-400">+15%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2 mt-3">
                    <div className="bg-electric-blue h-2 rounded-full" style={{width: '115%'}}></div>
                  </div>
                </div>

                <div 
                  onClick={() => handleHabitCardClick('interviews')}
                  className="bg-gray-800 border border-light-steel-blue rounded-lg p-6 hover:border-electric-blue transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <i className="fas fa-comments text-electric-blue text-xl"></i>
                      <h4 className="text-white font-semibold">Interviews</h4>
                    </div>
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  </div>
                  <div className="text-3xl font-bold text-white mb-1">8</div>
                  <div className="text-sm text-gray-400 mb-3">This month</div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Goal: 10</span>
                    <span className="text-yellow-400">-20%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2 mt-3">
                    <div className="bg-yellow-500 h-2 rounded-full" style={{width: '80%'}}></div>
                  </div>
                </div>

                <div 
                  onClick={() => handleHabitCardClick('events')}
                  className="bg-gray-800 border border-light-steel-blue rounded-lg p-6 hover:border-electric-blue transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <i className="fas fa-users text-electric-blue text-xl"></i>
                      <h4 className="text-white font-semibold">Events</h4>
                    </div>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>
                  <div className="text-3xl font-bold text-white mb-1">4</div>
                  <div className="text-sm text-gray-400 mb-3">This month</div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Goal: 3</span>
                    <span className="text-green-400">+33%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2 mt-3">
                    <div className="bg-electric-blue h-2 rounded-full" style={{width: '133%'}}></div>
                  </div>
                </div>

                <div 
                  onClick={() => handleHabitCardClick('leetcode')}
                  className="bg-gray-800 border border-light-steel-blue rounded-lg p-6 hover:border-electric-blue transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <i className="fas fa-code text-electric-blue text-xl"></i>
                      <h4 className="text-white font-semibold">LeetCode</h4>
                    </div>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>
                  <div className="text-3xl font-bold text-white mb-1">47</div>
                  <div className="text-sm text-gray-400 mb-3">This month</div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Goal: 40</span>
                    <span className="text-green-400">+18%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2 mt-3">
                    <div className="bg-electric-blue h-2 rounded-full" style={{width: '118%'}}></div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* Applications Content */}
        {activeTab === 'applications' && (
          <section className="bg-gray-800 border border-light-steel-blue rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-xl font-bold text-white">High Quality Applications</h4>
              <button className="bg-electric-blue hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors">
                <i className="fas fa-plus mr-2"></i>Add Application
              </button>
            </div>
            <div className="grid grid-cols-4 gap-6">
              <div className="bg-gray-700 rounded-lg p-4">
                <h5 className="text-white font-semibold mb-4 flex items-center">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                  To Do (5)
                </h5>
                <div className="space-y-3">
                  <div className="bg-gray-600 border border-light-steel-blue rounded-lg p-3 cursor-move hover:border-electric-blue transition-colors">
                    <div className="text-white font-medium mb-1">Google Software Engineer</div>
                    <div className="text-gray-400 text-sm mb-2">Mountain View, CA</div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-yellow-400">Due: Dec 15</span>
                      <span className="text-gray-500">High Priority</span>
                    </div>
                  </div>
                  <div className="bg-gray-600 border border-light-steel-blue rounded-lg p-3 cursor-move hover:border-electric-blue transition-colors">
                    <div className="text-white font-medium mb-1">Microsoft Product Manager</div>
                    <div className="text-gray-400 text-sm mb-2">Seattle, WA</div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-yellow-400">Due: Dec 20</span>
                      <span className="text-gray-500">Medium Priority</span>
                    </div>
                  </div>
                  <div className="bg-gray-600 border border-light-steel-blue rounded-lg p-3 cursor-move hover:border-electric-blue transition-colors">
                    <div className="text-white font-medium mb-1">Tesla Software Engineer</div>
                    <div className="text-gray-400 text-sm mb-2">Austin, TX</div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-yellow-400">Due: Dec 18</span>
                      <span className="text-gray-500">High Priority</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-700 rounded-lg p-4">
                <h5 className="text-white font-semibold mb-4 flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                  In Progress (3)
                </h5>
                <div className="space-y-3">
                  <div className="bg-gray-600 border border-light-steel-blue rounded-lg p-3 cursor-move hover:border-electric-blue transition-colors">
                    <div className="text-white font-medium mb-1">Meta Data Scientist</div>
                    <div className="text-gray-400 text-sm mb-2">Menlo Park, CA</div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-blue-400">Resume customization</span>
                      <span className="text-gray-500">75%</span>
                    </div>
                  </div>
                  <div className="bg-gray-600 border border-light-steel-blue rounded-lg p-3 cursor-move hover:border-electric-blue transition-colors">
                    <div className="text-white font-medium mb-1">Stripe Backend Engineer</div>
                    <div className="text-gray-400 text-sm mb-2">San Francisco, CA</div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-blue-400">Cover letter draft</span>
                      <span className="text-gray-500">60%</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-700 rounded-lg p-4">
                <h5 className="text-white font-semibold mb-4 flex items-center">
                  <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
                  Submitted (8)
                </h5>
                <div className="space-y-3">
                  <div className="bg-gray-600 border border-light-steel-blue rounded-lg p-3 cursor-move hover:border-electric-blue transition-colors">
                    <div className="text-white font-medium mb-1">Amazon SDE Intern</div>
                    <div className="text-gray-400 text-sm mb-2">Seattle, WA</div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-purple-400">Submitted Dec 10</span>
                      <span className="text-gray-500">Pending</span>
                    </div>
                  </div>
                  <div className="bg-gray-600 border border-light-steel-blue rounded-lg p-3 cursor-move hover:border-electric-blue transition-colors">
                    <div className="text-white font-medium mb-1">Netflix Engineering</div>
                    <div className="text-gray-400 text-sm mb-2">Los Gatos, CA</div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-purple-400">Submitted Dec 8</span>
                      <span className="text-gray-500">Under Review</span>
                    </div>
                  </div>
                  <div className="bg-gray-600 border border-light-steel-blue rounded-lg p-3 cursor-move hover:border-electric-blue transition-colors">
                    <div className="text-white font-medium mb-1">Uber Software Engineer</div>
                    <div className="text-gray-400 text-sm mb-2">San Francisco, CA</div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-purple-400">Submitted Dec 5</span>
                      <span className="text-gray-500">Under Review</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-700 rounded-lg p-4">
                <h5 className="text-white font-semibold mb-4 flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  Completed (7)
                </h5>
                <div className="space-y-3">
                  <div className="bg-gray-600 border border-light-steel-blue rounded-lg p-3 cursor-move hover:border-electric-blue transition-colors">
                    <div className="text-white font-medium mb-1">Apple iOS Developer</div>
                    <div className="text-gray-400 text-sm mb-2">Cupertino, CA</div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-green-400">Interview Scheduled</span>
                      <span className="text-green-500">Success</span>
                    </div>
                  </div>
                  <div className="bg-gray-600 border border-light-steel-blue rounded-lg p-3 cursor-move hover:border-electric-blue transition-colors">
                    <div className="text-white font-medium mb-1">Shopify Backend Engineer</div>
                    <div className="text-gray-400 text-sm mb-2">Ottawa, ON</div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-green-400">Interview Scheduled</span>
                      <span className="text-green-500">Success</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Interviews Content */}
        {activeTab === 'interviews' && (
          <section className="bg-gray-800 border border-light-steel-blue rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-xl font-bold text-white">Interview Pipeline</h4>
              <button className="bg-electric-blue hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors">
                <i className="fas fa-plus mr-2"></i>Schedule Interview
              </button>
            </div>
            <div className="grid grid-cols-4 gap-6">
              <div className="bg-gray-700 rounded-lg p-4">
                <h5 className="text-white font-semibold mb-4 flex items-center">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                  Scheduled (3)
                </h5>
                <div className="space-y-3">
                  <div className="bg-gray-600 border border-light-steel-blue rounded-lg p-3 cursor-move hover:border-electric-blue transition-colors">
                    <div className="text-white font-medium mb-1">Google SWE Interview</div>
                    <div className="text-gray-400 text-sm mb-2">Dec 20, 2:00 PM</div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-yellow-400">Technical Round</span>
                      <span className="text-gray-500">1 hour</span>
                    </div>
                  </div>
                  <div className="bg-gray-600 border border-light-steel-blue rounded-lg p-3 cursor-move hover:border-electric-blue transition-colors">
                    <div className="text-white font-medium mb-1">Meta Data Scientist</div>
                    <div className="text-gray-400 text-sm mb-2">Dec 22, 10:00 AM</div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-yellow-400">Behavioral Round</span>
                      <span className="text-gray-500">45 min</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-700 rounded-lg p-4">
                <h5 className="text-white font-semibold mb-4 flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                  In Progress (2)
                </h5>
                <div className="space-y-3">
                  <div className="bg-gray-600 border border-light-steel-blue rounded-lg p-3 cursor-move hover:border-electric-blue transition-colors">
                    <div className="text-white font-medium mb-1">Microsoft PM Interview</div>
                    <div className="text-gray-400 text-sm mb-2">Currently in progress</div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-blue-400">Case Study</span>
                      <span className="text-gray-500">Live</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-700 rounded-lg p-4">
                <h5 className="text-white font-semibold mb-4 flex items-center">
                  <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
                  Completed (5)
                </h5>
                <div className="space-y-3">
                  <div className="bg-gray-600 border border-light-steel-blue rounded-lg p-3 cursor-move hover:border-electric-blue transition-colors">
                    <div className="text-white font-medium mb-1">Apple iOS Interview</div>
                    <div className="text-gray-400 text-sm mb-2">Completed Dec 12</div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-purple-400">Passed to next round</span>
                      <span className="text-green-500">Success</span>
                    </div>
                  </div>
                  <div className="bg-gray-600 border border-light-steel-blue rounded-lg p-3 cursor-move hover:border-electric-blue transition-colors">
                    <div className="text-white font-medium mb-1">Netflix Engineering</div>
                    <div className="text-gray-400 text-sm mb-2">Completed Dec 10</div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-purple-400">Awaiting results</span>
                      <span className="text-gray-500">Pending</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-700 rounded-lg p-4">
                <h5 className="text-white font-semibold mb-4 flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  Offers (2)
                </h5>
                <div className="space-y-3">
                  <div className="bg-gray-600 border border-light-steel-blue rounded-lg p-3 cursor-move hover:border-electric-blue transition-colors">
                    <div className="text-white font-medium mb-1">Shopify Backend</div>
                    <div className="text-gray-400 text-sm mb-2">Offer received Dec 8</div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-green-400">$120k + equity</span>
                      <span className="text-green-500">Accepted</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Events Content */}
        {activeTab === 'events' && (
          <section className="bg-gray-800 border border-light-steel-blue rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-xl font-bold text-white">Event Tracking</h4>
              <button className="bg-electric-blue hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors">
                <i className="fas fa-plus mr-2"></i>Add Event
              </button>
            </div>
            <div className="grid grid-cols-4 gap-6">
              <div className="bg-gray-700 rounded-lg p-4">
                <h5 className="text-white font-semibold mb-4 flex items-center">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                  Upcoming (4)
                </h5>
                <div className="space-y-3">
                  <div className="bg-gray-600 border border-light-steel-blue rounded-lg p-3 cursor-move hover:border-electric-blue transition-colors">
                    <div className="text-white font-medium mb-1">Tech Career Fair</div>
                    <div className="text-gray-400 text-sm mb-2">Dec 18, 10:00 AM</div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-yellow-400">San Francisco</span>
                      <span className="text-gray-500">In-person</span>
                    </div>
                  </div>
                  <div className="bg-gray-600 border border-light-steel-blue rounded-lg p-3 cursor-move hover:border-electric-blue transition-colors">
                    <div className="text-white font-medium mb-1">Startup Networking</div>
                    <div className="text-gray-400 text-sm mb-2">Dec 20, 6:00 PM</div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-yellow-400">Palo Alto</span>
                      <span className="text-gray-500">Networking</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-700 rounded-lg p-4">
                <h5 className="text-white font-semibold mb-4 flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                  Attending (2)
                </h5>
                <div className="space-y-3">
                  <div className="bg-gray-600 border border-light-steel-blue rounded-lg p-3 cursor-move hover:border-electric-blue transition-colors">
                    <div className="text-white font-medium mb-1">AI/ML Meetup</div>
                    <div className="text-gray-400 text-sm mb-2">Currently attending</div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-blue-400">Live now</span>
                      <span className="text-gray-500">Online</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-700 rounded-lg p-4">
                <h5 className="text-white font-semibold mb-4 flex items-center">
                  <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
                  Attended (6)
                </h5>
                <div className="space-y-3">
                  <div className="bg-gray-600 border border-light-steel-blue rounded-lg p-3 cursor-move hover:border-electric-blue transition-colors">
                    <div className="text-white font-medium mb-1">Google Tech Talk</div>
                    <div className="text-gray-400 text-sm mb-2">Attended Dec 10</div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-purple-400">3 connections made</span>
                      <span className="text-green-500">Success</span>
                    </div>
                  </div>
                  <div className="bg-gray-600 border border-light-steel-blue rounded-lg p-3 cursor-move hover:border-electric-blue transition-colors">
                    <div className="text-white font-medium mb-1">Startup Demo Day</div>
                    <div className="text-gray-400 text-sm mb-2">Attended Dec 5</div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-purple-400">2 connections made</span>
                      <span className="text-green-500">Success</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-700 rounded-lg p-4">
                <h5 className="text-white font-semibold mb-4 flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  Follow-ups (3)
                </h5>
                <div className="space-y-3">
                  <div className="bg-gray-600 border border-light-steel-blue rounded-lg p-3 cursor-move hover:border-electric-blue transition-colors">
                    <div className="text-white font-medium mb-1">Netflix Recruiter</div>
                    <div className="text-gray-400 text-sm mb-2">Follow-up scheduled</div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-green-400">LinkedIn message sent</span>
                      <span className="text-green-500">Active</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* LeetCode Content */}
        {activeTab === 'leetcode' && (
          <section className="bg-gray-800 border border-light-steel-blue rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-xl font-bold text-white">LeetCode Progress</h4>
              <button className="bg-electric-blue hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors">
                <i className="fas fa-plus mr-2"></i>Log Practice
              </button>
            </div>
            <div className="grid grid-cols-4 gap-6">
              <div className="bg-gray-700 rounded-lg p-4">
                <h5 className="text-white font-semibold mb-4 flex items-center">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                  To Practice (8)
                </h5>
                <div className="space-y-3">
                  <div className="bg-gray-600 border border-light-steel-blue rounded-lg p-3 cursor-move hover:border-electric-blue transition-colors">
                    <div className="text-white font-medium mb-1">Two Sum</div>
                    <div className="text-gray-400 text-sm mb-2">Easy - Arrays</div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-yellow-400">Not started</span>
                      <span className="text-gray-500">Easy</span>
                    </div>
                  </div>
                  <div className="bg-gray-600 border border-light-steel-blue rounded-lg p-3 cursor-move hover:border-electric-blue transition-colors">
                    <div className="text-white font-medium mb-1">Valid Parentheses</div>
                    <div className="text-gray-400 text-sm mb-2">Easy - Stack</div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-yellow-400">Not started</span>
                      <span className="text-gray-500">Easy</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-700 rounded-lg p-4">
                <h5 className="text-white font-semibold mb-4 flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                  In Progress (5)
                </h5>
                <div className="space-y-3">
                  <div className="bg-gray-600 border border-light-steel-blue rounded-lg p-3 cursor-move hover:border-electric-blue transition-colors">
                    <div className="text-white font-medium mb-1">Binary Tree Inorder</div>
                    <div className="text-gray-400 text-sm mb-2">Medium - Trees</div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-blue-400">Working on it</span>
                      <span className="text-gray-500">60%</span>
                    </div>
                  </div>
                  <div className="bg-gray-600 border border-light-steel-blue rounded-lg p-3 cursor-move hover:border-electric-blue transition-colors">
                    <div className="text-white font-medium mb-1">Merge Intervals</div>
                    <div className="text-gray-400 text-sm mb-2">Medium - Arrays</div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-blue-400">Working on it</span>
                      <span className="text-gray-500">40%</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-700 rounded-lg p-4">
                <h5 className="text-white font-semibold mb-4 flex items-center">
                  <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
                  Completed (12)
                </h5>
                <div className="space-y-3">
                  <div className="bg-gray-600 border border-light-steel-blue rounded-lg p-3 cursor-move hover:border-electric-blue transition-colors">
                    <div className="text-white font-medium mb-1">Reverse Linked List</div>
                    <div className="text-gray-400 text-sm mb-2">Easy - Linked Lists</div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-purple-400">Completed Dec 10</span>
                      <span className="text-green-500">Solved</span>
                    </div>
                  </div>
                  <div className="bg-gray-600 border border-light-steel-blue rounded-lg p-3 cursor-move hover:border-electric-blue transition-colors">
                    <div className="text-white font-medium mb-1">Maximum Subarray</div>
                    <div className="text-gray-400 text-sm mb-2">Medium - Arrays</div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-purple-400">Completed Dec 8</span>
                      <span className="text-green-500">Solved</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-700 rounded-lg p-4">
                <h5 className="text-white font-semibold mb-4 flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  Mastered (8)
                </h5>
                <div className="space-y-3">
                  <div className="bg-gray-600 border border-light-steel-blue rounded-lg p-3 cursor-move hover:border-electric-blue transition-colors">
                    <div className="text-white font-medium mb-1">Climbing Stairs</div>
                    <div className="text-gray-400 text-sm mb-2">Easy - DP</div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-green-400">Multiple solutions</span>
                      <span className="text-green-500">Mastered</span>
                    </div>
                  </div>
                  <div className="bg-gray-600 border border-light-steel-blue rounded-lg p-3 cursor-move hover:border-electric-blue transition-colors">
                    <div className="text-white font-medium mb-1">Longest Common Subsequence</div>
                    <div className="text-gray-400 text-sm mb-2">Medium - DP</div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-green-400">Multiple solutions</span>
                      <span className="text-green-500">Mastered</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
    </main>
    </div>
  );
}