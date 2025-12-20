"use client"

import Link from "next/link";
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Settings, ChevronDown } from "lucide-react";
import { Button } from "./ui/button";

// Instructor Sign In Button - shown when not authenticated
export function InstructorSignInButton() {
  return (
    <Link href="/instructor/signin">
      <Button 
        className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
      >
        Instructor Sign In
      </Button>
    </Link>
  );
}

// Instructor Authenticated Button - shown when instructor is signed in
interface InstructorData {
  username: string;
}

export function InstructorAuthenticatedButton() {
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
  const [instructorData, setInstructorData] = useState<InstructorData | null>(null);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    // Fetch instructor data
    const fetchInstructorData = async () => {
      try {
        const response = await fetch('/api/instructor');
        if (response.ok) {
          const instructor = await response.json();
          setInstructorData({ username: instructor.username });
        }
      } catch (error) {
        console.error('Failed to fetch instructor data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInstructorData();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowSettingsDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSignOut = async () => {
    try {
      await fetch('/api/instructor', { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'signout' }),
      });
      setShowSettingsDropdown(false);
      router.push('/');
      router.refresh();
    } catch (error) {
      console.error('Failed to sign out:', error);
    }
  };

  // Default instructor profile picture - using a generic instructor/teacher icon
  const defaultInstructorImage = "https://ui-avatars.com/api/?name=Instructor&background=007ACC&color=fff&size=128";

  return (
    <div className="flex items-center space-x-6">
      <nav className="flex items-center space-x-6">
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setShowSettingsDropdown(!showSettingsDropdown)}
            className="text-gray-400 hover:text-white font-semibold flex items-center"
          >
            <Settings className="mr-2" />Settings
            <ChevronDown className="ml-2 text-xs" />
          </button>
          
          {showSettingsDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-light-steel-blue rounded-lg shadow-lg z-50">
              <div className="py-2">
                <div className="px-4 py-2">
                  <button
                    onClick={handleSignOut}
                    className="w-full text-left text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>
      <div className="flex items-center space-x-3">
        {loading ? (
          <span className="text-gray-300">Loading...</span>
        ) : (
          <span className="text-gray-300">{instructorData?.username || 'Instructor'}</span>
        )}
        <img 
          src={defaultInstructorImage}
          className="w-8 h-8 rounded-full"
          alt="Instructor avatar"
        />
      </div>
    </div>
  );
}

