'use client';

import { useState, useEffect, useRef } from 'react';
import { SignOut } from "./auth-components"
import { Settings, ChevronDown, User, Cog } from "lucide-react";

interface UserData {
  name: string | null;
  image: string | null;
}

export function AuthenticatedUserButton() {
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
  const [userData, setUserData] = useState<UserData>({ name: null, image: null });
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fetch user data
    const fetchUserData = async () => {
      try {
        const response = await fetch('/api/users/onboarding2');
        if (response.ok) {
          const user = await response.json();
          setUserData({
            name: user.name,
            image: user.image
          });
        }
      } catch (error) {
        console.error('Failed to fetch user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
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
                {/* ===== PROFILE & PREFERENCES: Commented out until features are implemented ===== */}
                {/* Uncomment the buttons below when Profile and Preferences features are ready */}
                {/* 
                <button 
                  onClick={() => setShowSettingsDropdown(false)}
                  className="w-full text-left px-4 py-2 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors flex items-center"
                >
                  <User className="mr-2" />Profile
                </button>
                <button 
                  onClick={() => setShowSettingsDropdown(false)}
                  className="w-full text-left px-4 py-2 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors flex items-center"
                >
                  <Cog className="mr-2" />Preferences
                </button>
                <hr className="border-light-steel-blue my-1" />
                */}
                <div className="px-4 py-2">
                  <SignOut />
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
          <span className="text-gray-300">{userData.name || 'User'}</span>
        )}
        <img 
          src={userData.image || "https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-3.jpg"} 
          className="w-8 h-8 rounded-full"
          alt="User avatar"
        />
      </div>
    </div>
  )
}
