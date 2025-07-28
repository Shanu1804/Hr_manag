import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Lock, AlertCircle, CheckCircle, Eye, EyeOff, Shield, ArrowRight } from 'lucide-react';

export default function Login() {
    const [formData, setFormData] = useState({ username: '', password: '' });
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [focusedField, setFocusedField] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const savedUsername = localStorage.getItem('rememberedUsername');
        if (savedUsername) {
            setFormData((prev) => ({ ...prev, username: savedUsername }));
            setRememberMe(true);
        }
    }, []);

    useEffect(() => {
        if (successMessage) {
            const timer = setTimeout(() => setSuccessMessage(''), 5000);
            return () => clearTimeout(timer);
        }
    }, [successMessage]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
        setSuccessMessage('');
    };

    const togglePasswordVisibility = () => setPasswordVisible(!passwordVisible);

    const handleLogin = async (e) => {
        e.preventDefault();

        if (!formData.username || !formData.password) {
            setError('Username and password are required');
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch('http://localhost:8081/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });


            const data = await response.json();


            if (response.ok) {
                localStorage.setItem('authToken', data.token);
                localStorage.setItem('role', data.role || '');

                if (rememberMe) {
                    localStorage.setItem('rememberedUsername', formData.username);
                } else {
                    localStorage.removeItem('rememberedUsername');
                }

                setSuccessMessage('Login successful!');
                const userRole = (data.role || '').toUpperCase();

                if (!userRole) {
                    setError('No role provided by server');
                    setIsLoading(false);
                    return;
                }

                switch (userRole) {
                    case 'HR':
                        navigate('/hr-dashboard', { replace: true });
                        break;
                    case 'DIRECTOR':
                        navigate('/director-dashboard', { replace: true });

                        break;
                    case 'SUPER_ADMIN':
                        navigate('/superadmin-dashboard', { replace: true });

                        break;
                    default:
                        navigate('/dashboard', { replace: true });

                        break;
                }
                setIsLoading(false);
            } else {
                setError(data.message || 'Invalid username or password');
                setIsLoading(false);
            }
        } catch (err) {
            setError('An error occurred. Please try again later.');
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <header className="bg-blue-900 text-white shadow-lg">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <img src="/Images/bisag_logo.png" alt="BISAG-N Logo" className="h-10 w-10 rounded-full" />
                        <div>
                            <h1 className="text-xl font-semibold">BISAG-N HRMS</h1>
                            <p className="text-sm">Engineering to Imagengineering</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Shield className="w-4 h-4" />
                        <span className="text-sm font-medium">Secure Access Portal</span>
                    </div>
                </div>
            </header>

            <main className="flex-1 flex items-center justify-center p-6">
                <div className="w-full max-w-md">
                    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8">
                        <div className="mb-6 text-center">
                            <h2 className="text-2xl font-semibold text-blue-900">Welcome to BISAG-N</h2>
                            <p className="text-sm text-gray-600 mt-1">Sign in to access your dashboard</p>
                        </div>

                        {error && (
                            <div className="mb-6 flex items-center p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
                                <AlertCircle size={20} className="flex-shrink-0 mr-3 text-red-600" />
                                <p className="text-sm font-medium">{error}</p>
                            </div>
                        )}

                        {successMessage && (
                            <div className="mb-6 flex items-center p-4 bg-green-50 text-green-700 rounded-lg border border-green-200">
                                <CheckCircle size={20} className="flex-shrink-0 mr-3 text-green-600" />
                                <p className="text-sm font-medium">{successMessage}</p>
                            </div>
                        )}

                        <form onSubmit={handleLogin} className="space-y-6">
                            <div className="space-y-2">
                                <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                                    Username
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <User size={20} className={`text-gray-400 ${focusedField === 'username' ? 'text-blue-900' : ''}`} />
                                    </div>
                                    <input
                                        id="username"
                                        type="text"
                                        name="username"
                                        value={formData.username}
                                        onChange={handleChange}
                                        onFocus={() => setFocusedField('username')}
                                        onBlur={() => setFocusedField('')}
                                        className="pl-10 block w-full h-10 rounded-md border border-gray-300 bg-gray-50 text-gray-900 focus:border-blue-900 focus:ring-1 focus:ring-blue-900 transition-all duration-200"
                                        placeholder="Enter your username"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                    Password
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock size={20} className={`text-gray-400 ${focusedField === 'password' ? 'text-blue-900' : ''}`} />
                                    </div>
                                    <input
                                        id="password"
                                        type={passwordVisible ? 'text' : 'password'}
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        onFocus={() => setFocusedField('password')}
                                        onBlur={() => setFocusedField('')}
                                        className="pl-10 pr-10 block w-full h-10 rounded-md border border-gray-300 bg-gray-50 text-gray-900 focus:border-blue-900 focus:ring-1 focus:ring-blue-900 transition-all duration-200"
                                        placeholder="Enter your password"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={togglePasswordVisibility}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-blue-900 transition-colors duration-200"
                                    >
                                        {passwordVisible ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <label className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        checked={rememberMe}
                                        onChange={(e) => setRememberMe(e.target.checked)}
                                        className="h-4 w-4 text-blue-900 border-gray-300 rounded focus:ring-blue-900"
                                    />
                                    <span className="text-sm text-gray-600">Remember me</span>
                                </label>
                                <Link
                                    to="/forgot-username"
                                    className="text-sm text-blue-900 hover:text-blue-800 transition-colors duration-200"
                                >
                                    Forgot password?
                                </Link>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className={`w-full h-10 rounded-md font-medium text-white transition-all duration-200 ${
                                    isLoading
                                        ? 'bg-gray-400 cursor-not-allowed'
                                        : 'bg-blue-900 hover:bg-blue-800 focus:ring-2 focus:ring-blue-900 focus:ring-offset-2'
                                }`}
                            >
                                {isLoading ? (
                                    <div className="flex items-center justify-center space-x-2">
                                        <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
                                        <span>Signing in...</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center space-x-2">
                                        <span>Sign In</span>
                                        <ArrowRight size={18} />
                                    </div>
                                )}
                            </button>
                        </form>

                        <div className="mt-6 text-center">
                            <p className="text-sm text-gray-600">
                                Don't have an account?{' '}
                                <Link
                                    to="/signup"
                                    className="font-medium text-blue-900 hover:text-blue-800 transition-colors duration-200"
                                >
                                    Create account
                                </Link>
                            </p>
                        </div>
                    </div>

                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-500">
                            Secure login powered by BISAG-N
                        </p>
                    </div>
                </div>
            </main>

            <footer className="bg-blue-900 text-white py-4 text-center">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex items-center justify-center space-x-2 mb-2">
                        <Shield className="w-4 h-4" />
                        <p className="text-sm">© 2025 BISAG-N. All rights reserved.</p>
                    </div>
                    <p className="text-xs">Bhaskaracharya National Institute for Space Applications and Geo-informatics</p>
                </div>
            </footer>
        </div>
    );
}