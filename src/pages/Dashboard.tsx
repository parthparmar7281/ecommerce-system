import "./dashboard.css";
import { useAuth } from "../context/AuthContext";

const Dashboard = () => {
    const { user } = useAuth();

    return (
        <div className="dashboard-page-wrapper">
            <div className="dashboard-content">
                <div className="welcome-header">
                    <h1 className="welcome-title">Welcome back, {user?.name || "User"}!</h1>
                    <p className="welcome-subtitle">Here is a quick overview of your profile and system credentials.</p>
                </div>

                <div className="dashboard-grid">
                    <div className="dashboard-card">
                        <div className="card-title-area">
                            <div className="card-icon">
                                <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                                </svg>
                            </div>
                            <h3>Profile Information</h3>
                        </div>

                        <div className="profile-details-list">
                            <div className="profile-detail-item">
                                <div className="detail-label-section">
                                    <svg className="detail-icon" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                                    </svg>
                                    <span>Full Name</span>
                                </div>
                                <div className="detail-value-section">{user?.name}</div>
                            </div>

                            <div className="profile-detail-item">
                                <div className="detail-label-section">
                                    <svg className="detail-icon" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                                    </svg>
                                    <span>Email Address</span>
                                </div>
                                <div className="detail-value-section">{user?.email}</div>
                            </div>

                            <div className="profile-detail-item">
                                <div className="detail-label-section">
                                    <svg className="detail-icon" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.599-3.75A11.952 11.952 0 0112 2.714z" />
                                    </svg>
                                    <span>Role Type</span>
                                </div>
                                <div className="detail-value-section">{user?.role}</div>
                            </div>

                            <div className="profile-detail-item">
                                <div className="detail-label-section">
                                    <svg className="detail-icon" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-2.824-1.502-5.18-3.858-6.68-6.68l1.293-.97c.362-.271.528-.733.417-1.173L6.763 3.552a1.125 1.125 0 00-1.091-.852H3.75A2.25 2.25 0 001.5 5.156c0 .54.025 1.077.075 1.609z" />
                                    </svg>
                                    <span>Phone Contact</span>
                                </div>
                                <div className="detail-value-section">{user?.phone}</div>
                            </div>

                            <div className="profile-detail-item">
                                <div className="detail-label-section">
                                    <svg className="detail-icon" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                                    </svg>
                                    <span>City Location</span>
                                </div>
                                <div className="detail-value-section">{user?.city}</div>
                            </div>
                        </div>
                    </div>

                    <div className="stats-container">
                        <div className="dashboard-card">
                            <div className="card-title-area">
                                <div className="card-icon">
                                    <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" />
                                    </svg>
                                </div>
                                <h3>Quick Stats</h3>
                            </div>

                            <div className="stats-container">
                                <div className="stat-box">
                                    <div className="stat-label">Security Tier</div>
                                    <div className="stat-value highlight-purple">
                                        {user?.role === "Admin" ? "Level 3" : user?.role === "Employee" ? "Level 2" : "Level 1"}
                                    </div>
                                </div>

                                <div className="stat-box">
                                    <div className="stat-label">Account Status</div>
                                    <div className="stat-value highlight-cyan">Active</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;