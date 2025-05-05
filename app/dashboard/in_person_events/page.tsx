import React from "react";

export default function InPersonEventsPage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">In-Person Events</h1>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {/* Scheduled Column */}
        <div className="flex-shrink-0 w-80 bg-gray-100 rounded-lg shadow-md">
          <div className="p-3 bg-blue-500 text-white rounded-t-lg">
            <h2 className="font-semibold">Scheduled</h2>
          </div>
          <div className="p-2 min-h-[500px]">
            {/* Event items will be added here later */}
          </div>
        </div>

        {/* Attended Column */}
        <div className="flex-shrink-0 w-80 bg-gray-100 rounded-lg shadow-md">
          <div className="p-3 bg-green-500 text-white rounded-t-lg">
            <h2 className="font-semibold">Attended</h2>
          </div>
          <div className="p-2 min-h-[500px]">
            {/* Event items will be added here later */}
          </div>
        </div>

        {/* Connected Online Column */}
        <div className="flex-shrink-0 w-80 bg-gray-100 rounded-lg shadow-md">
          <div className="p-3 bg-purple-500 text-white rounded-t-lg">
            <h2 className="font-semibold">Connected Online</h2>
          </div>
          <div className="p-2 min-h-[500px]">
            {/* Event items will be added here later */}
          </div>
        </div>
      </div>
    </div>
  );
}
