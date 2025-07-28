import { useState, useEffect } from 'react';
import { Users, Clock, UserCheck, Briefcase, LogOut, UserPlus, Building, Menu, X, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ExcelJS from 'exceljs';

export default function SuperAdminDash() {
    const [userData, setUserData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [notification, setNotification] = useState({ message: '', type: '' });
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [pendingSignups, setPendingSignups] = useState([]);
    const [selectedSignup, setSelectedSignup] = useState(null);
    const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
    const [activeView, setActiveView] = useState('dashboard');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                const token = localStorage.getItem('authToken');
                if (!token) {
                    setError('Please log in to continue');
                    navigate('/');
                    return;
                }

                const userResponse = await fetch('http://localhost:8081/api/users/me', {
                    headers: { 'Authorization': `Bearer ${token}` },
                });
                if (userResponse.ok) {
                    const userData = await userResponse.json();
                    if (userData.role.toUpperCase() !== 'SUPER_ADMIN') {
                        setError('Access denied. This dashboard is for the Super Admin only.');
                        navigate('/');
                        return;
                    }
                    setUserData(userData);
                } else if (userResponse.status === 401) {
                    setError('Session expired. Please log in again.');
                    localStorage.removeItem('authToken');
                    navigate('/');
                    return;
                } else {
                    setError('Failed to fetch user data');
                    return;
                }

                const pendingResponse = await fetch('http://localhost:8081/api/superadmin/pending-signups', {
                    headers: { 'Authorization': `Bearer ${token}` },
                });
                if (pendingResponse.ok) {
                    setPendingSignups(await pendingResponse.json());
                } else {
                    setError('Failed to fetch pending signups');
                }
            } catch (err) {
                setError('Failed to load dashboard data');
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [navigate]);

    useEffect(() => {
        if (notification.message) {
            const timer = setTimeout(() => setNotification({ message: '', type: '' }), 5000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    const handleApproveSignup = async (userId, action) => {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                setNotification({ message: 'Session expired. Please log in again.', type: 'error' });
                navigate('/');
                return;
            }
            const endpoint = action === 'approve'
                ? `/api/superadmin/approve-hr-signup/${userId}`
                : `/api/superadmin/disapprove-hr-signup/${userId}`;
            const response = await fetch(`http://localhost:8081${endpoint}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: action === 'disapprove' ? JSON.stringify({ reason: 'Admin decision' }) : null,
            });

            if (response.ok) {
                // Fetch the updated list of pending signups to ensure UI consistency
                const pendingResponse = await fetch('http://localhost:8081/api/superadmin/pending-signups', {
                    headers: { 'Authorization': `Bearer ${token}` },
                });
                if (pendingResponse.ok) {
                    const updatedSignups = await pendingResponse.json();
                    setPendingSignups(updatedSignups);
                    setSelectedSignup(null);
                    setIsApproveModalOpen(false);
                    setNotification({ message: `Signup ${action === 'approve' ? 'approved' : 'rejected'} successfully`, type: 'success' });
                } else {
                    setNotification({ message: 'Failed to refresh pending signups', type: 'error' });
                }
            } else {
                const errorData = await response.json();
                setNotification({ message: `Failed to ${action} signup: ${errorData.message || 'Server error'}`, type: 'error' });
            }
        } catch (err) {
            setNotification({ message: 'Network error: Unable to process request', type: 'error' });
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('authToken');
        navigate('/');
    };



    const renderPendingSignups = () => {
        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-semibold text-gray-900">Pending Signups</h2>
                </div>
                <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">ID</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">Full Name</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">Username</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">Email</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">Department</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">Role</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">Action</th>
                            </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                            {pendingSignups.map(signup => (
                                <tr key={signup.id} className="hover:bg-gray-50 transition duration-150">
                                    <td className="px-6 py-4 whitespace-nowrap">{signup.id}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{signup.fullName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{signup.username}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{signup.email}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{signup.department}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{signup.role}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <button
                                            onClick={() => { setSelectedSignup(signup); setIsApproveModalOpen(true); }}
                                            className="text-blue-600 hover:text-blue-800 font-medium mr-2"
                                        >
                                            Review
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    const renderApproveModal = () => {
        if (!selectedSignup) return null;
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-semibold text-gray-900">Approve Signup</h3>
                        <button onClick={() => { setIsApproveModalOpen(false); setSelectedSignup(null); }} className="text-gray-500 hover:text-gray-700">
                            <X size={20} />
                        </button>
                    </div>
                    <div className="mb-6">
                        <p className="text-gray-700">Are you sure you want to approve the signup for <strong>{selectedSignup.fullName}</strong>?</p>
                    </div>
                    <div className="flex justify-end space-x-3">
                        <button
                            onClick={() => { setIsApproveModalOpen(false); setSelectedSignup(null); }}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => handleApproveSignup(selectedSignup.id, 'approve')}
                            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
                        >
                            Approve
                        </button>
                        <button
                            onClick={() => handleApproveSignup(selectedSignup.id, 'disapprove')}
                            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
                        >
                            Reject
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const renderMainContent = () => {
        if (isLoading) {
            return (
                <div className="flex justify-center items-center h-64">
                    <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M12 2a10 10 0 0110 10 10 10 0 01-10 10 10 10 0 01-10-10 10 10 0 0110-10zM12 4a8 8 0 00-8 8 8 8 0 008 8 8 8 0 008-8 8 8 0 00-8-8z"></path>
                    </svg>
                </div>
            );
        }

        if (error) {
            return (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                    <p className="text-sm text-red-700">{error}</p>
                </div>
            );
        }

        if (activeView === 'pending-signups') {
            return renderPendingSignups();
        }

        return (
            <div className="space-y-8">
                <div className="bg-white rounded-lg shadow-lg p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">Super Admin Overview</h2>
                    <p className="text-gray-600">Manage HR signups and system oversight.</p>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50 flex font-sans">
            <div className={`fixed inset-y-0 left-0 z-30 w-64 bg-blue-900 text-white transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-300 ease-in-out shadow-lg`}>
                <div className="flex items-center justify-between p-4 border-b border-blue-800">
                    <div className="flex items-center space-x-3">
                        <img src="/Images/bisag_logo.png" alt="BISAG-N Logo" className="h-10 w-10 rounded-full" />
                        <span className="text-xl font-semibold">BISAG-N HRMS</span>
                    </div>
                    <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden">
                        <X size={24} />
                    </button>
                </div>
                <nav className="p-4 space-y-2">
                    <button
                        onClick={() => setActiveView('dashboard')}
                        className={`flex items-center w-full p-3 text-left rounded-lg transition duration-200 ${
                            activeView === 'dashboard' ? 'bg-blue-800' : 'hover:bg-blue-800'
                        }`}
                    >
                        <Users size={20} className="mr-3" />
                        Dashboard
                    </button>
                    <button
                        onClick={() => setActiveView('pending-signups')}
                        className={`flex items-center w-full p-3 text-left rounded-lg transition duration-200 ${
                            activeView === 'pending-signups' ? 'bg-blue-800' : 'hover:bg-blue-800'
                        }`}
                    >
                        <UserCheck size={20} className="mr-3" />
                        Pending Signups
                    </button>
                    <button onClick={handleLogout} className="flex items-center w-full p-3 text-left rounded-lg hover:bg-red-600 transition duration-200">
                        <LogOut size={20} className="mr-3" />
                        Logout
                    </button>
                </nav>
            </div>

            <div className="flex-1 flex flex-col lg:ml-64">
                <header className="bg-white shadow-lg p-4 flex items-center justify-between">
                    <div className="flex items-center">
                        <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden mr-4">
                            <Menu size={24} className="text-gray-700" />
                        </button>
                        <h1 className="text-2xl font-semibold text-gray-900">Super Admin Dashboard</h1>
                    </div>
                    <div className="flex items-center space-x-4">
                        <span className="text-gray-700 font-medium">Welcome, {userData?.fullName}</span>
                        <img src="/Images/bisag_logo.png" alt="BISAG-N Logo" className="h-8 w-8 rounded-full" />
                    </div>
                </header>

                <main className="flex-1 p-8">
                    {notification.message && (
                        <div className={`border rounded-lg p-4 mb-8 shadow-sm ${notification.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                            <p className="text-sm font-medium">{notification.message}</p>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8 shadow-sm">
                            <p className="text-sm text-red-800 font-medium">{error}</p>
                        </div>
                    )}

                    <div className="space-y-8">
                        {renderMainContent()}
                    </div>
                </main>

                <footer className="bg-blue-900 text-white py-4 text-center">
                    <p className="text-sm">© 2025 BISAG-N. All rights reserved.</p>
                </footer>
            </div>

            {renderApproveModal()}
        </div>
    );
}