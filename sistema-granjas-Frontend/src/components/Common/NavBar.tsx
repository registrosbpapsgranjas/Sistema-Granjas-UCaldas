// src/components/Navbar.tsx
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import LogoutButton from "./LogoutButton";

export default function Navbar() {
    const { user, isAuthenticated } = useAuth();

    return (
        <nav className="bg-green-800 text-white p-4">
            <div className="container mx-auto flex justify-between items-center">
                <h1 className="text-xl font-bold">AgroTech UCaldas</h1>

                <div className="flex items-center space-x-4">
                    {!isAuthenticated ? (
                        <>
                            <Link to="/login" className="hover:text-green-200">Login</Link>
                            <Link to="/register" className="hover:text-green-200">Registro</Link>
                        </>
                    ) : (
                        <>
                            <span className="text-green-200">
                                {user?.nombre} ({user?.rol})
                            </span>
                            <LogoutButton variant="minimal" className="text-white hover:text-green-200" />
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}
