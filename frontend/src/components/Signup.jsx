import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Building, Eye, EyeOff, Shield, ArrowRight, AlertCircle, CheckCircle, Calendar } from 'lucide-react';

export default function Signup() {
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    password: '',
    confirmPassword: '',
    email: '',
    department: '',
    role: '',
    gender: '',
    reportingToId: null,
    employeeId: '',
    joinDate: '',
  });
  const [departments, setDepartments] = useState([]);
  const [roles, setRoles] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [reportingPersons, setReportingPersons] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [notification, setNotification] = useState({ message: '', type: '' });
  const [focusedField, setFocusedField] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null); // To store the authenticated user's role
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  const normalizeDepartment = (deptName) => {
    if (!deptName) return '';
    return deptName; // No normalization needed since backend uses "Admin (Administration)"
  };

  const isReportingPersonRequired = () => {
    const isAdminHR = formData.department === 'Admin (Administration)' && formData.role.toUpperCase() === 'HR';
    return !isAdminHR && formData.role.toUpperCase() !== 'DIRECTOR';
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (token) {
          // Fetch current user to check if they are Super Admin
          const userResponse = await fetch('http://localhost:8081/api/users/me', {
            headers: { 'Authorization': `Bearer ${token}` },
          });
          if (userResponse.ok) {
            const userData = await userResponse.json();
            setCurrentUser(userData);
          } else if (userResponse.status === 401) {
            localStorage.removeItem('authToken');
            setNotification({ message: 'Session expired. Please log in again.', type: 'error' });
          }
        }

        const deptResponse = await fetch('http://localhost:8081/api/departments', {
          headers: { 'Content-Type': 'application/json' },
        });
        if (deptResponse.ok) {
          const data = await deptResponse.json();
          setDepartments(data);
          if (data.length > 0) setFormData(prev => ({ ...prev, department: data[0].name }));
        } else {
          const data = await deptResponse.json().catch(() => ({}));
          setNotification({ message: `Failed to load departments: ${data.message || 'Unknown error'}`, type: 'error' });
        }

        const rolesResponse = await fetch('http://localhost:8081/api/roles', {
          headers: { 'Content-Type': 'application/json' },
        });
        if (rolesResponse.ok) {
          const data = await rolesResponse.json();
          const formattedRoles = data.map(role => ({
            id: role.id,
            name: role.name.toUpperCase(),
            displayName: role.name,
          }));
          setRoles(formattedRoles);
          if (formattedRoles.length > 0) setFormData(prev => ({ ...prev, role: formattedRoles[0].name }));
        } else {
          const data = await rolesResponse.json().catch(() => ({}));
          setNotification({ message: `Failed to load roles: ${data.message || 'Unknown error'}`, type: 'error' });
        }

        const usersResponse = await fetch('http://localhost:8081/api/auth/users', {
          headers: { 'Content-Type': 'application/json' },
        });
        if (usersResponse.ok) {
          const data = await usersResponse.json();
          setAllUsers(data);
          updateReportingPersons(data);
        } else {
          const data = await usersResponse.json().catch(() => ({}));
          setNotification({ message: `Failed to load users: ${data.message || 'Unknown error'}`, type: 'error' });
        }
      } catch (error) {
        console.error('Error fetching initial data:', error);
        setNotification({ message: 'Network or server error occurred.', type: 'error' });
      }
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (notification.message) {
      const timer = setTimeout(() => setNotification({ message: '', type: '' }), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  useEffect(() => {
    if (allUsers.length > 0) {
      updateReportingPersons(allUsers);
    }
  }, [allUsers, searchTerm]);

  const updateReportingPersons = (users) => {
    if (!isReportingPersonRequired()) {
      setReportingPersons([]);
      return;
    }
    const filtered = users.filter(user =>
        user.role &&
        user.status === 'ACTIVE' &&
        (!searchTerm || user.fullName.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setReportingPersons(filtered);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'department' ? normalizeDepartment(value) : value,
    }));
    if (name === 'reportingToId' && value) {
      setSearchTerm('');
      setIsDropdownOpen(false);
    }
  };

  const handleSearchInput = (e) => {
    setSearchTerm(e.target.value.toLowerCase());
    setIsDropdownOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setNotification({ message: 'Passwords do not match!', type: 'error' });
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{8,}$/;
    if (!passwordRegex.test(formData.password)) {
      setNotification({
        message: 'Password must have at least 1 uppercase letter, 1 lowercase letter, and 1 special character.',
        type: 'error',
      });
      return;
    }

    if (
        !formData.fullName ||
        !formData.username ||
        !formData.email ||
        !formData.role ||
        !formData.gender ||
        !formData.employeeId ||
        !formData.joinDate
    ) {
      setNotification({
        message: 'Please fill in all required fields, including Employee ID and Join Date.',
        type: 'error',
      });
      return;
    }

    if (formData.role.toUpperCase() !== 'DIRECTOR' && !formData.department) {
      setNotification({ message: 'Department is required.', type: 'error' });
      return;
    }

    if (isReportingPersonRequired() && !formData.reportingToId) {
      setNotification({ message: 'Please select a reporting person.', type: 'error' });
      return;
    }

    setIsLoading(true);

    const isAdminHR = formData.department === 'Admin (Administration)' && formData.role.toUpperCase() === 'HR';
    const isSuperAdmin = currentUser?.role.toUpperCase() === 'SUPERADMIN';

    const userData = {
      fullName: formData.fullName,
      username: formData.username,
      password: formData.password,
      email: formData.email,
      department: formData.role.toUpperCase() === 'DIRECTOR' ? null : formData.department,
      role: formData.role.toUpperCase(),
      gender: formData.gender,
      reportingToId: isReportingPersonRequired() ? formData.reportingToId : null,
      employeeId: formData.employeeId,
      joinDate: formData.joinDate,
    };

    console.log('Submitting userData:', userData);

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('http://localhost:8081/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`, // Include token for authentication
        },
        body: JSON.stringify(userData),
      });

      const responseData = await response.json();

      if (response.ok) {
        const statusMessage = isSuperAdmin && isAdminHR
            ? 'Your HR account has been created successfully. You can now sign in.'
            : isAdminHR
                ? 'Your HR signup request has been submitted and is awaiting Super Admin approval.'
                : 'Your signup request has been submitted and is awaiting HR approval.';
        setNotification({ message: statusMessage, type: 'success' });
        setFormData({
          fullName: '',
          username: '',
          password: '',
          confirmPassword: '',
          email: '',
          department: departments.length > 0 ? departments[0].name : '',
          role: roles.length > 0 ? roles[0].name : '',
          gender: '',
          reportingToId: null,
          employeeId: '',
          joinDate: '',
        });
        setSearchTerm('');
        setIsDropdownOpen(false);
        setTimeout(() => navigate('/'), 3000);
      } else {
        setNotification({ message: `Signup failed: ${responseData.message || 'Unknown error'}`, type: 'error' });
      }
    } catch (error) {
      console.error('Signup error:', error);
      setNotification({ message: 'An error occurred during signup. Please try again.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => setPasswordVisible(!passwordVisible);
  const toggleConfirmPasswordVisibility = () => setConfirmPasswordVisible(!confirmPasswordVisible);

  const handleClickOutside = (event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setIsDropdownOpen(false);
      setSearchTerm('');
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
                <h2 className="text-2xl font-semibold text-blue-900">Create Your Account</h2>
                <p className="text-sm text-gray-600 mt-1">Join the BISAG-N team</p>
              </div>

              {notification.message && (
                  <div className="mb-6 flex items-center p-4 rounded-lg border border-gray-200">
                    {notification.type === 'success' ? (
                        <CheckCircle size={20} className="flex-shrink-0 mr-3 text-green-600" />
                    ) : (
                        <AlertCircle size={20} className="flex-shrink-0 mr-3 text-red-600" />
                    )}
                    <p className={`text-sm font-medium ${notification.type === 'success' ? 'text-green-700' : 'text-red-700'}`}>
                      {notification.message}
                    </p>
                  </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">Full Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User size={20} className={`text-gray-400 ${focusedField === 'fullName' ? 'text-blue-900' : ''}`} />
                    </div>
                    <input
                        id="fullName"
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        onFocus={() => setFocusedField('fullName')}
                        onBlur={() => setFocusedField('')}
                        className="pl-10 block w-full h-10 rounded-md border border-gray-300 bg-gray-50 text-gray-900 focus:border-blue-900 focus:ring-1 focus:ring-blue-900 transition-all duration-200"
                        placeholder="John Doe"
                        required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700">Username</label>
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
                        placeholder="johndoe"
                        required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail size={20} className={`text-gray-400 ${focusedField === 'email' ? 'text-blue-900' : ''}`} />
                    </div>
                    <input
                        id="email"
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        onFocus={() => setFocusedField('email')}
                        onBlur={() => setFocusedField('')}
                        className="pl-10 block w-full h-10 rounded-md border border-gray-300 bg-gray-50 text-gray-900 focus:border-blue-900 focus:ring-1 focus:ring-blue-900 transition-all duration-200"
                        placeholder="john.doe@bisag-n.gov.in"
                        required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="employeeId" className="block text-sm font-medium text-gray-700">Employee ID</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User size={20} className={`text-gray-400 ${focusedField === 'employeeId' ? 'text-blue-900' : ''}`} />
                    </div>
                    <input
                        id="employeeId"
                        type="text"
                        name="employeeId"
                        value={formData.employeeId}
                        onChange={handleChange}
                        onFocus={() => setFocusedField('employeeId')}
                        onBlur={() => setFocusedField('')}
                        className="pl-10 block w-full h-10 rounded-md border border-gray-300 bg-gray-50 text-gray-900 focus:border-blue-900 focus:ring-1 focus:ring-blue-900 transition-all duration-200"
                        placeholder="E12345"
                        required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="joinDate" className="block text-sm font-medium text-gray-700">Join Date</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Calendar size={20} className={`text-gray-400 ${focusedField === 'joinDate' ? 'text-blue-900' : ''}`} />
                    </div>
                    <input
                        id="joinDate"
                        type="date"
                        name="joinDate"
                        value={formData.joinDate}
                        onChange={handleChange}
                        onFocus={() => setFocusedField('joinDate')}
                        onBlur={() => setFocusedField('')}
                        className="pl-10 block w-full h-10 rounded-md border border-gray-300 bg-gray-50 text-gray-900 focus:border-blue-900 focus:ring-1 focus:ring-blue-900 transition-all duration-200"
                        required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="department" className="block text-sm font-medium text-gray-700">Department</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Building size={20} className={`text-gray-400 ${focusedField === 'department' ? 'text-blue-900' : ''}`} />
                    </div>
                    <select
                        id="department"
                        name="department"
                        value={formData.department}
                        onChange={handleChange}
                        onFocus={() => setFocusedField('department')}
                        onBlur={() => setFocusedField('')}
                        disabled={formData.role.toUpperCase() === 'DIRECTOR'}
                        className={`pl-10 pr-4 block w-full h-10 rounded-md border border-gray-300 bg-gray-50 text-gray-900 focus:border-blue-900 focus:ring-1 focus:ring-blue-900 transition-all duration-200 appearance-none ${formData.role.toUpperCase() === 'DIRECTOR' ? 'opacity-50 cursor-not-allowed' : ''}`}
                        required={formData.role.toUpperCase() !== 'DIRECTOR'}
                    >
                      <option value="">Select Department</option>
                      {departments.map(dept => (
                          <option key={dept.id || `dept-${dept.name}`} value={dept.name}>
                            {dept.name}
                          </option>
                      ))}
                    </select>
                  </div>
                  {formData.role.toUpperCase() === 'DIRECTOR' && (
                      <p className="text-xs text-gray-500 mt-1">Directors do not belong to any department.</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700">Role</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Building size={20} className={`text-gray-400 ${focusedField === 'role' ? 'text-blue-900' : ''}`} />
                    </div>
                    <select
                        id="role"
                        name="role"
                        value={formData.role}
                        onChange={handleChange}
                        onFocus={() => setFocusedField('role')}
                        onBlur={() => setFocusedField('')}
                        className="pl-10 pr-4 block w-full h-10 rounded-md border border-gray-300 bg-gray-50 text-gray-900 focus:border-blue-900 focus:ring-1 focus:ring-blue-900 transition-all duration-200 appearance-none"
                        required
                    >
                      <option value="">Select Role</option>
                      {roles.map(role => (
                          <option key={role.id || `role-${role.name}`} value={role.name}>{role.displayName}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {isReportingPersonRequired() && (
                    <div className="space-y-2" ref={dropdownRef}>
                      <label htmlFor="reportingToId" className="block text-sm font-medium text-gray-700">Reporting To</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <User size={20} className={`text-gray-400 ${focusedField === 'reportingToId' ? 'text-blue-900' : ''}`} />
                        </div>
                        <div
                            className="pl-10 pr-4 block w-full h-10 rounded-md border border-gray-300 bg-gray-50 text-gray-900 focus:border-blue-900 focus:ring-1 focus:ring-blue-900 transition-all duration-200 cursor-pointer"
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        >
                          {formData.reportingToId ? reportingPersons.find(p => p.id === formData.reportingToId)?.fullName || 'Select Reporting Person' : 'Select Reporting Person'}
                        </div>
                        {isDropdownOpen && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                              <input
                                  type="text"
                                  value={searchTerm}
                                  onChange={handleSearchInput}
                                  onKeyDown={(e) => e.key === 'Escape' && setIsDropdownOpen(false)}
                                  placeholder="Type to search..."
                                  className="w-full p-2 border-b border-gray-300 focus:outline-none"
                                  autoFocus
                              />
                              {reportingPersons.length > 0 ? (
                                  reportingPersons.map(person => (
                                      <div
                                          key={person.id}
                                          onClick={() => {
                                            setFormData(prev => ({ ...prev, reportingToId: person.id }));
                                            setIsDropdownOpen(false);
                                          }}
                                          className="p-2 hover:bg-gray-100 cursor-pointer"
                                      >
                                        {person.fullName} ({person.role})
                                      </div>
                                  ))
                              ) : (
                                  <div className="p-2 text-gray-500">No options available</div>
                              )}
                            </div>
                        )}
                      </div>
                    </div>
                )}
                {!isReportingPersonRequired() && formData.department && formData.role && (
                    <p className="text-xs text-gray-500 mt-1">
                      {formData.role.toUpperCase() === 'DIRECTOR' ? 'Directors do not report to anyone.' : 'HR members in Admin department do not require a reporting person.'}
                    </p>
                )}

                <div className="space-y-2">
                  <label htmlFor="gender" className="block text-sm font-medium text-gray-700">Gender</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User size={20} className={`text-gray-400 ${focusedField === 'gender' ? 'text-blue-900' : ''}`} />
                    </div>
                    <select
                        id="gender"
                        name="gender"
                        value={formData.gender}
                        onChange={handleChange}
                        onFocus={() => setFocusedField('gender')}
                        onBlur={() => setFocusedField('')}
                        className="pl-10 pr-4 block w-full h-10 rounded-md border border-gray-300 bg-gray-50 text-gray-900 focus:border-blue-900 focus:ring-1 focus:ring-blue-900 transition-all duration-200 appearance-none"
                        required
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
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
                        placeholder="Create a strong password"
                        required
                    />
                    <button
                        type="button"
                        onClick={togglePasswordVisibility}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-blue-900"
                    >
                      {passwordVisible ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Password must be at least 8 characters long</p>
                </div>

                <div className="space-y-2">
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">Confirm Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock size={20} className={`text-gray-400 ${focusedField === 'confirmPassword' ? 'text-blue-900' : ''}`} />
                    </div>
                    <input
                        id="confirmPassword"
                        type={confirmPasswordVisible ? 'text' : 'password'}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        onFocus={() => setFocusedField('confirmPassword')}
                        onBlur={() => setFocusedField('')}
                        className="pl-10 pr-10 block w-full h-10 rounded-md border border-gray-300 bg-gray-50 text-gray-900 focus:border-blue-900 focus:ring-1 focus:ring-blue-900 transition-all duration-200"
                        placeholder="Confirm password"
                        required
                    />
                    <button
                        type="button"
                        onClick={toggleConfirmPasswordVisibility}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-blue-900"
                    >
                      {confirmPasswordVisible ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className={`w-full h-10 rounded-md font-medium text-white transition-all duration-200 ${
                        isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-900 hover:bg-blue-800 focus:ring-2 focus:ring-blue-900 focus:ring-offset-2'
                    }`}
                >
                  {isLoading ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
                        <span>Submitting...</span>
                      </div>
                  ) : (
                      <div className="flex items-center justify-center space-x-2">
                        <span>Submit Request</span>
                        <ArrowRight size={18} />
                      </div>
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Already have an account?{' '}
                  <Link to="/" className="font-medium text-blue-900 hover:text-blue-800">Sign in</Link>
                </p>
              </div>
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">Secure signup powered by BISAG-N</p>
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