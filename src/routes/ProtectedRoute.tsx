import { Navigate, Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
import CartSidebar from "../components/CartSidebar";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = () => {
    const { user, loading, logout } = useAuth();

    if (loading) {
        return (
            <div
                style={{
                    minHeight: "100vh",
                    background: "#0a090e",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    color: "#ffffff"
                }}
            >
                <div style={{ textAlign: "center" }}>
                    <div className="spinner" style={{ width: "40px", height: "40px", borderWidth: "3px", margin: "0 auto 16px" }}></div>
                    <div style={{ color: "#9ca3af", fontSize: "14px", fontWeight: 500 }}>Verifying Credentials...</div>
                </div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/" replace />;
    }

    return (
        <div style={{ position: "relative", minHeight: "100vh" }}>
            <Navbar user={user} onLogout={logout} />
            <div className="portal-background"></div>
            <Outlet context={{ user }} />
            <CartSidebar />
        </div>
    );
};

export default ProtectedRoute;
