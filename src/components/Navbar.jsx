import { Link } from "react-router-dom";
export default function Navbar() {
  return (
    <nav className="bg-primary text-white p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold">Institute Logo</Link>
        <div className="space-x-4">
          <Link to="/login" className="hover:underline">Admin Login</Link>
        </div>
      </div>
    </nav>
  );
}
