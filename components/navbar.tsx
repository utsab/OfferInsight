import Image from "next/image";
import Link from "next/link";
import { UserButton } from "./user-button";
import "./navbar.css";

export function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link href="/" className="logo-container">
          <Image
            src="/images/logo-dark.png"
            alt="Company Logo"
            width={200}
            height={50}
            priority
          />
        </Link>
        <div className="user-button-container">
          <UserButton />
        </div>
      </div>
    </nav>
  );
}
