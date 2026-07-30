import { Link, useLocation } from "react-router-dom";
import { useCart } from "../context/CartContext";
import "./Navbar.css";

interface NavbarProps {
    user: {
        name: string;
        role?: string;
        email: string;
    } | null;
    onLogout: () => void;
}

const Navbar = ({ user, onLogout }: NavbarProps) => {
    const location = useLocation();
    const { totalCount, toggleCart } = useCart();

    // Get user initials for avatar
    const getInitials = (name?: string) => {
        if (!name) return "U";
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .substring(0, 2);
    };

    return (
        <nav className="navbar">
            <div className="navbar-container">
                <Link to="/products" className="navbar-brand">
                    <span className="brand-logo">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="12 2 2 7 12 12 22 7 12 2" />
                            <polyline points="2 17 12 22 22 17" />
                            <polyline points="2 12 12 17 22 12" />
                        </svg>
                    </span>
                    <span className="brand-text">Supabase Portal</span>
                </Link>

                {user && (
                    <div className="navbar-navigation-links">
                        <Link to="/dashboard" className={`navbar-nav-item ${location.pathname === "/dashboard" ? "active" : ""}`}>
                            Dashboard
                        </Link>
                        <Link to="/products" className={`navbar-nav-item ${location.pathname === "/products" ? "active" : ""}`}>
                            Products
                        </Link>
                        <Link to="/orders" className={`navbar-nav-item ${location.pathname === "/orders" ? "active" : ""}`}>
                            Orders
                        </Link>
                        {user.role === "Buyer" ? (
                            <button
                                type="button"
                                className={`navbar-nav-item navbar-cart-trigger ${location.pathname === "/cart" ? "active" : ""}`}
                                onClick={toggleCart}
                                aria-label="Open cart sidebar"
                            >
                                <span>Cart</span>
                                {totalCount > 0 && <span className="navbar-cart-count-badge">{totalCount}</span>}
                            </button>
                        ) : (
                            <Link to="/cart" className={`navbar-nav-item ${location.pathname === "/cart" ? "active" : ""}`}>
                                Cart
                            </Link>
                        )}
                    </div>
                )}

                {user && (
                    <div className="navbar-user-section">
                        <div className="user-profile-summary">
                            <div className="user-avatar">
                                {getInitials(user.name)}
                            </div>
                            <div className="user-details-summary">
                                <span className="user-display-name">{user.name}</span>
                                <span className={`user-role-badge role-${user.role?.toLowerCase()}`}>
                                    {user.role}
                                </span>
                            </div>
                        </div>

                        <button onClick={onLogout} className="navbar-logout-btn" aria-label="Sign Out">
                            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                            </svg>
                            <span>Logout</span>
                        </button>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
