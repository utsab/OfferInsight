import Image from 'next/image';
import Link from 'next/link';
import { UserButton } from './user-button';
import './navbar.css';

export function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="logo-container">
          <Link href="/">
            <Image 
              src="/images/logo-dark.png" 
              alt="Company Logo" 
              width={300} 
              height={100} 
              priority
            />
          </Link>
        </div>
        <UserButton />
      </div>
    </nav>
  );
} 