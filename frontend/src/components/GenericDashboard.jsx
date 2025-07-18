import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, CalendarCheck, FileText, Clock, CheckCircle, XCircle, AlertCircle, User, Menu, X, LogOut, Users, Trash2, Upload } from 'lucide-react';

// List of document types from the provided document
const documentTypes = [
  'offer_letter', 'joining_form', 'ISA_affidavit', 'police_verification', 'Aadhaar', 'Pan',
  'passbook', 'qualification_degree_certificate', 'experience_letter', 'LC_sign_stamp_document',
];

// Additional document types for non-freshers
const previousCompanyDocumentTypes = [
  'previous_experience_letter', 'relieving_letter', 'payslip', 'reference_letter',
];

export default function GenericDashboard() {
  const [userData, setUserData] = useState(null);
  const [holidays, setHolidays] = useState([]);
  const [leaveBalance, setLeaveBalance] = useState({
    casualLeave: { total: 12, used: 0, remaining: 0 },
    earnedLeave: { total: 20, used: 0, remaining: 0, usedFirstHalf: 0, usedSecondHalf: 0, carryover: 0 },
    maternityLeave: { total: 182, used: 0, remaining: 182 },
    paternityLeave: { total: 15, used: 0, remaining: 15 },
    leaveWithoutPay: { total: 300, used: 0, remaining: 300 },
  });
  const [leaveApplications, setLeaveApplications] = useState([]);
  const [subordinates, setSubordinates] = useState([]);
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [cancellableLeaves, setCancellableLeaves] = useState([]);
  const [leaveFormData, setLeaveFormData] = useState({
    leaveType: 'CL',
    startDate: '',
    endDate: '',
    reason: '',
  });
  const [profileFormData, setProfileFormData] = useState({
    dob: '',
    photo: null,
    fatherName: '',
    motherName: '',
    isFresher: true,
    documents: {},
    previousCompanyDocuments: {},
  });
  const [profileVerificationStatus, setProfileVerificationStatus] = useState('PENDING'); // PENDING, SUBMITTED, VERIFIED, REJECTED
  const [leaveDays, setLeaveDays] = useState(0);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeView, setActiveView] = useState('dashboard');
  const navigate = useNavigate();

  const today = new Date().toISOString().split('T')[0];
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const EL_FIRST_HALF = 10;
  const EL_SECOND_HALF = 10;

  // Fetch user data, profile status, subordinates, pending leaves, and holidays
  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          setError('Please log in to continue');
          navigate('/');
          return;
        }

        // Fetch user data
        const response = await fetch('http://localhost:8081/api/users/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          const joinDate = new Date(data.joinDate);
          const joinYear = joinDate.getFullYear();
          const joinMonth = joinDate.getMonth() + 1;
          const monthsAccrued = currentYear === joinYear
              ? Math.max(0, currentMonth - joinMonth + 1)
              : currentMonth;
          data.accruedCl = Math.min(12, monthsAccrued);
          data.reportingTo = data.reportingToName ? { fullName: data.reportingToName } : { fullName: null };
          setUserData(data);

          // Fetch profile verification status
          const profileResponse = await fetch('http://localhost:8081/api/users/profile-status', {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (profileResponse.ok) {
            const profileData = await profileResponse.json();
            setProfileVerificationStatus(profileData.status || 'PENDING');
            if (profileData.profile) {
              setProfileFormData({
                dob: profileData.profile.dob || '',
                photo: null, // Photo is not stored in state after fetch
                fatherName: profileData.profile.fatherName || '',
                motherName: profileData.profile.motherName || '',
                isFresher: profileData.profile.isFresher !== undefined ? profileData.profile.isFresher : true,
                documents: profileData.profile.documents || {},
                previousCompanyDocuments: profileData.profile.previousCompanyDocuments || {},
              });
            }
          }

          // Fetch subordinates
          const subordinatesResponse = await fetch('http://localhost:8081/api/users/subordinates', {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (subordinatesResponse.ok) {
            const subordinatesData = await subordinatesResponse.json();
            setSubordinates(subordinatesData);
          } else {
            setSubordinates([]);
          }

          // Fetch pending leaves
          const pendingResponse = await fetch('http://localhost:8081/api/leaves/pending', {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (pendingResponse.ok) {
            const pendingData = await pendingResponse.json();
            setPendingLeaves(pendingData);
          } else {
            setPendingLeaves([]);
          }

          // Fetch holidays
          const holidaysResponse = await fetch('http://localhost:8081/api/holidays', {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (holidaysResponse.ok) {
            const holidaysData = await holidaysResponse.json();
            setHolidays(holidaysData.map(h => h.date));
          } else {
            console.error('Failed to fetch holidays:', holidaysResponse.status);
            setHolidays([]);
          }
        } else if (response.status === 401) {
          setError('Session expired. Please log in again.');
          localStorage.removeItem('authToken');
          navigate('/');
        } else {
          setError('Failed to fetch user data.');
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('An error occurred. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  // Fetch cancellable leaves when subordinates state changes
  useEffect(() => {
    const fetchCancellableLeaves = async () => {
      if (subordinates.length > 0) {
        try {
          const token = localStorage.getItem('authToken');
          if (!token) {
            setError('Session expired. Please log in again.');
            localStorage.removeItem('authToken');
            navigate('/');
            return;
          }
          const cancellableResponse = await fetch('http://localhost:8081/api/leaves/cancellable', {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (cancellableResponse.ok) {
            const cancellableData = await cancellableResponse.json();
            setCancellableLeaves(cancellableData);
          } else {
            setCancellableLeaves([]);
          }
        } catch (err) {
          console.error('Error fetching cancellable leaves:', err);
          setCancellableLeaves([]);
        }
      } else {
        setCancellableLeaves([]);
      }
    };

    fetchCancellableLeaves();
  }, [subordinates, navigate]);

  // Fetch leave balance and applications
  useEffect(() => {
    const fetchLeaveData = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('authToken');
        if (!token) return;

        const balanceResponse = await fetch('http://localhost:8081/api/leaves/balance', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (balanceResponse.ok) {
          const balanceData = await balanceResponse.json();
          const sanitizedBalance = {
            casualLeave: balanceData.casualLeave || { total: 12, used: 0, remaining: 0 },
            earnedLeave: balanceData.earnedLeave || {
              total: 20, used: 0, remaining: 0, usedFirstHalf: 0, usedSecondHalf: 0, carryover: 0,
            },
            maternityLeave: balanceData.maternityLeave || { total: 182, used: 0, remaining: 182 },
            paternityLeave: balanceData.paternityLeave || { total: 15, used: 0, remaining: 15 },
            leaveWithoutPay: balanceData.leaveWithoutPay || { total: 300, used: 0, remaining: 300 },
          };
          Object.keys(sanitizedBalance).forEach((key) => {
            sanitizedBalance[key].used = Number((sanitizedBalance[key].used || 0).toFixed(1));
            sanitizedBalance[key].remaining = Number((sanitizedBalance[key].remaining || 0).toFixed(1));
            if (key === 'earnedLeave') {
              sanitizedBalance[key].usedFirstHalf = Number((sanitizedBalance[key].usedFirstHalf || 0).toFixed(1));
              sanitizedBalance[key].usedSecondHalf = Number((sanitizedBalance[key].usedSecondHalf || 0).toFixed(1));
              sanitizedBalance[key].carryover = Number((sanitizedBalance[key].carryover || 0).toFixed(1));
            }
          });
          setLeaveBalance(sanitizedBalance);
        }

        const applicationsResponse = await fetch('http://localhost:8081/api/leaves', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (applicationsResponse.ok) {
          const applicationsData = await applicationsResponse.json();
          setLeaveApplications(applicationsData);
        }
      } catch (err) {
        console.error('Error fetching leave data:', err);
        setError('An error occurred while fetching leave data.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaveData();
  }, [navigate]);

  // useEffect for success message timeout
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // useEffect for leave form updates
  useEffect(() => {
    if (leaveFormData.startDate && (leaveFormData.leaveType === 'ML' || leaveFormData.leaveType === 'PL')) {
      const calculatedEndDate = calculateEndDate(leaveFormData.startDate, leaveFormData.leaveType);
      setLeaveFormData((prev) => ({ ...prev, endDate: calculatedEndDate }));
    }
    if (leaveFormData.startDate) {
      const days = calculateLeaveDays(
          leaveFormData.startDate,
          leaveFormData.endDate,
          leaveFormData.leaveType
      );
      setLeaveDays(days);
    } else {
      setLeaveDays(0);
    }
  }, [leaveFormData.startDate, leaveFormData.endDate, leaveFormData.leaveType]);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    setUserData(null);
    navigate('/');
  };

  const isNonWorkingDay = (date) => {
    if (!date || isNaN(new Date(date).getTime())) return false;
    const formattedDate = new Date(date).toISOString().split('T')[0];
    return holidays.includes(formattedDate);
  };

  const calculateLeaveDays = (startDate, endDate, leaveType) => {
    const start = new Date(startDate);
    if (isNaN(start.getTime())) return 0;

    if (leaveType === 'HALF_DAY_CL' || leaveType === 'HALF_DAY_EL' || leaveType === 'HALF_DAY_LWP') {
      if (isNonWorkingDay(startDate)) return 0;
      return 0.5;
    }

    if (leaveType === 'ML') return 182;
    if (leaveType === 'PL') return 15;
    if (!endDate) return 0;

    const end = new Date(endDate);
    if (isNaN(end.getTime())) return 0;

    if (leaveType === 'EL') {
      return Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    }

    let currentDate = new Date(start);
    let days = 0;
    while (currentDate <= end) {
      if (!isNonWorkingDay(currentDate)) {
        days += 1;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return days;
  };

  const calculateEndDate = (startDate, leaveType) => {
    if (!startDate) return '';
    const start = new Date(startDate);
    if (isNaN(start.getTime())) return '';
    if (leaveType === 'ML') {
      start.setDate(start.getDate() + 181);
    } else if (leaveType === 'PL') {
      start.setDate(start.getDate() + 14);
    } else {
      return leaveFormData.endDate;
    }
    return start.toISOString().split('T')[0];
  };

  const hasOverlappingLeaves = (startDate, endDate, leaveType) => {
    const start = new Date(startDate);
    if (isNaN(start.getTime())) return false;
    const newStart = start;
    const newEnd = (leaveType === 'HALF_DAY_CL' || leaveType === 'HALF_DAY_EL' || leaveType === 'HALF_DAY_LWP')
        ? new Date(startDate)
        : new Date(endDate);
    if (isNaN(newEnd.getTime())) return false;

    return leaveApplications.some((application) => {
      if (application.status === 'REJECTED') return false;
      const existingStart = new Date(application.startDate);
      const existingEnd = (application.leaveType === 'HALF_DAY_CL' || application.leaveType === 'HALF_DAY_EL' || application.leaveType === 'HALF_DAY_LWP')
          ? new Date(application.startDate)
          : new Date(application.endDate);
      if (isNaN(existingStart.getTime()) || isNaN(existingEnd.getTime())) return false;
      return existingStart <= newEnd && existingEnd >= newStart;
    });
  };

  const calculateAvailableClForMonth = (applicationMonth, applicationYear) => {
    const joinDate = new Date(userData?.joinDate);
    const joinYear = joinDate.getFullYear();
    const joinMonth = joinDate.getMonth() + 1;
    let totalClAccrued = 0;

    if (applicationYear < joinYear || (applicationYear === joinYear && applicationMonth < joinMonth)) {
      return 0;
    }

    const endMonth = (joinYear === applicationYear) ? Math.min(applicationMonth, 12) : applicationMonth;
    const startMonth = (joinYear === applicationYear) ? joinMonth : 1;

    for (let month = startMonth; month <= endMonth; month++) {
      totalClAccrued += 1;
    }

    const totalUsedCl = leaveApplications
        .filter(app => (app.leaveType === 'CL' || app.leaveType === 'HALF_DAY_CL') &&
            (app.status === 'APPROVED' || app.status === 'PENDING') &&
            new Date(app.startDate).getFullYear() === applicationYear &&
            new Date(app.startDate).getMonth() + 1 <= applicationMonth)
        .reduce((total, app) => total + calculateLeaveDays(app.startDate, app.endDate, app.leaveType), 0);

    return Math.max(0, totalClAccrued - totalUsedCl);
  };

  const handleLeaveSubmit = async () => {
    setIsSubmitting(true);
    setError('');
    setSuccessMessage('');

    if (leaveFormData.startDate) {
      const selectedDate = new Date(leaveFormData.startDate);
      const todayDate = new Date(today);
      const earliestAllowedDate = new Date(todayDate.setDate(todayDate.getDate() - 6));
      if (leaveFormData.leaveType === 'CL' || leaveFormData.leaveType === 'HALF_DAY_CL') {
        if (selectedDate < earliestAllowedDate) {
          setError('Casual leave can only be applied for dates within the last 6 days, including today');
          setIsSubmitting(false);
          return;
        }
      } else {
        if (selectedDate < new Date(today)) {
          setError('Start date cannot be in the past for non-casual leave types');
          setIsSubmitting(false);
          return;
        }
      }
    }

    if (!leaveFormData.startDate || !leaveFormData.reason) {
      setError('Please fill all required fields');
      setIsSubmitting(false);
      return;
    }

    if (
        leaveFormData.leaveType !== 'HALF_DAY_CL' &&
        leaveFormData.leaveType !== 'HALF_DAY_EL' &&
        leaveFormData.leaveType !== 'HALF_DAY_LWP' &&
        leaveFormData.leaveType !== 'ML' &&
        leaveFormData.leaveType !== 'PL' &&
        !leaveFormData.endDate
    ) {
      setError('Please provide an end date');
      setIsSubmitting(false);
      return;
    }

    if (
        leaveFormData.endDate &&
        new Date(leaveFormData.endDate) < new Date(leaveFormData.startDate)
    ) {
      setError('End date cannot be earlier than start date');
      setIsSubmitting(false);
      return;
    }

    if (
        (leaveFormData.leaveType === 'HALF_DAY_CL' ||
            leaveFormData.leaveType === 'HALF_DAY_EL' ||
            leaveFormData.leaveType === 'HALF_DAY_LWP') &&
        isNonWorkingDay(leaveFormData.startDate)
    ) {
      setError('Half-day leave cannot be applied on a holiday');
      setIsSubmitting(false);
      return;
    }

    const leaveDays = calculateLeaveDays(
        leaveFormData.startDate,
        leaveFormData.endDate,
        leaveFormData.leaveType
    );
    if (leaveDays === 0) {
      setError('No working days selected for leave');
      setIsSubmitting(false);
      return;
    }

    const endDateForOverlap =
        leaveFormData.leaveType === 'HALF_DAY_CL' ||
        leaveFormData.leaveType === 'HALF_DAY_EL' ||
        leaveFormData.leaveType === 'HALF_DAY_LWP'
            ? leaveFormData.startDate
            : leaveFormData.endDate;
    if (hasOverlappingLeaves(leaveFormData.startDate, endDateForOverlap, leaveFormData.leaveType)) {
      setError(`You already have a leave application overlapping with the dates ${leaveFormData.startDate} to ${endDateForOverlap}.`);
      setIsSubmitting(false);
      return;
    }

    if (leaveFormData.leaveType === 'CL' || leaveFormData.leaveType === 'HALF_DAY_CL') {
      const startDate = new Date(leaveFormData.startDate);
      const applicationMonth = startDate.getMonth() + 1;
      const applicationYear = startDate.getFullYear();
      const joinDate = new Date(userData?.joinDate);
      const joinYear = joinDate.getFullYear();
      const joinMonth = joinDate.getMonth() + 1;

      if (applicationYear > currentYear || (applicationYear === currentYear && applicationMonth > currentMonth)) {
        setError('CL application is only allowed up to the current month');
        setIsSubmitting(false);
        return;
      }

      if (joinYear === currentYear && applicationMonth < joinMonth) {
        setError('Cannot apply CL for a month before your joining date');
        setIsSubmitting(false);
        return;
      }

      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`http://localhost:8081/api/leaves/available-cl/${applicationYear}/${applicationMonth}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const availableCl = await response.json();
          const availableClForMonth = availableCl.availableCl || 0;
          if (availableClForMonth < leaveDays) {
            setError(`Insufficient CL balance for ${startDate.toLocaleString('default', { month: 'long' })}: ${availableClForMonth.toFixed(1)}`);
            setIsSubmitting(false);
            return;
          }
        } else {
          setError('Failed to fetch available CL balance.');
          setIsSubmitting(false);
          return;
        }
      } catch (err) {
        console.error('Error fetching available CL:', err);
        setError('An error occurred while checking CL balance.');
        setIsSubmitting(false);
        return;
      }
    }

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('Session expired. Please log in again.');
        localStorage.removeItem('authToken');
        navigate('/');
        setIsSubmitting(false);
        return;
      }

      const leaveTypeMap = {
        CL: 'casualLeave',
        EL: 'earnedLeave',
        ML: 'maternityLeave',
        PL: 'paternityLeave',
        HALF_DAY_CL: 'casualLeave',
        HALF_DAY_EL: 'earnedLeave',
        LWP: 'leaveWithoutPay',
        HALF_DAY_LWP: 'leaveWithoutPay',
      };

      if (!['EL', 'HALF_DAY_EL', 'CL', 'HALF_DAY_CL'].includes(leaveFormData.leaveType)) {
        const leaveKey = leaveTypeMap[leaveFormData.leaveType];
        const remainingLeaves = leaveBalance[leaveKey]?.remaining || 0;
        if (remainingLeaves < leaveDays) {
          setError(`Insufficient ${leaveKey.replace(/([A-Z])/g, ' $1').trim()} balance: ${remainingLeaves}`);
          setIsSubmitting(false);
          return;
        }
      }

      const endDate =
          leaveFormData.leaveType === 'HALF_DAY_CL' ||
          leaveFormData.leaveType === 'HALF_DAY_EL' ||
          leaveFormData.leaveType === 'HALF_DAY_LWP'
              ? leaveFormData.startDate
              : leaveFormData.endDate;

      const response = await fetch('http://localhost:8081/api/leaves', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          leaveType: leaveFormData.leaveType,
          startDate: leaveFormData.startDate,
          endDate,
          reason: leaveFormData.reason,
          isHalfDay: leaveFormData.leaveType === 'HALF_DAY_CL' ||
              leaveFormData.leaveType === 'HALF_DAY_EL' ||
              leaveFormData.leaveType === 'HALF_DAY_LWP',
        }),
      });

      if (response.ok) {
        setSuccessMessage(`Leave application submitted successfully! Awaiting approval from ${
            userData?.reportingTo?.fullName || 'your reporting manager'
        }.`);
        setLeaveFormData({
          leaveType: 'CL',
          startDate: '',
          endDate: '',
          reason: '',
        });
        setLeaveDays(0);
        setActiveView('leave-applications');

        // Re-fetch leave balance and applications
        try {
          const balanceResponse = await fetch('http://localhost:8081/api/leaves/balance', {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (balanceResponse.ok) {
            const balanceData = await balanceResponse.json();
            const sanitizedBalance = {
              casualLeave: balanceData.casualLeave || { total: 12, used: 0, remaining: 0 },
              earnedLeave: balanceData.earnedLeave || {
                total: 20, used: 0, remaining: 0, usedFirstHalf: 0, usedSecondHalf: 0, carryover: 0,
              },
              maternityLeave: balanceData.maternityLeave || { total: 182, used: 0, remaining: 182 },
              paternityLeave: balanceData.paternityLeave || { total: 15, used: 0, remaining: 15 },
              leaveWithoutPay: balanceData.leaveWithoutPay || { total: 300, used: 0, remaining: 300 },
            };
            Object.keys(sanitizedBalance).forEach((key) => {
              sanitizedBalance[key].used = Number((sanitizedBalance[key].used || 0).toFixed(1));
              sanitizedBalance[key].remaining = Number((sanitizedBalance[key].remaining || 0).toFixed(1));
              if (key === 'earnedLeave') {
                sanitizedBalance[key].usedFirstHalf = Number((sanitizedBalance[key].usedFirstHalf || 0).toFixed(1));
                sanitizedBalance[key].usedSecondHalf = Number((sanitizedBalance[key].usedSecondHalf || 0).toFixed(1));
                sanitizedBalance[key].carryover = Number((sanitizedBalance[key].carryover || 0).toFixed(1));
              }
            });
            setLeaveBalance(sanitizedBalance);
          }

          const applicationsResponse = await fetch('http://localhost:8081/api/leaves', {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (applicationsResponse.ok) {
            const applicationsData = await applicationsResponse.json();
            setLeaveApplications(applicationsData);
          }
        } catch (err) {
          console.error('Error refreshing leave data:', err);
          setError('An error occurred while refreshing leave data.');
        }
      } else {
        let errorMessage = 'Failed to submit leave application';
        if (response.status === 401) {
          setError('Session expired. Please log in again.');
          localStorage.removeItem('authToken');
          navigate('/');
        } else {
          try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
          } catch (jsonError) {
            errorMessage = `Server error: ${response.status} ${response.statusText}`;
          }
          setError(errorMessage);
        }
      }
    } catch (err) {
      console.error('Error submitting leave:', err);
      setError('An error occurred while submitting the application');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProfileSubmit = async () => {
    setIsSubmitting(true);
    setError('');
    setSuccessMessage('');

    // Debug: Log the documents to verify state
    console.log('profileFormData:', profileFormData);

    // Validate required fields
    if (!profileFormData.dob || !profileFormData.fatherName || !profileFormData.motherName || !profileFormData.photo) {
      setError('Please fill all required fields and upload a photo');
      setIsSubmitting(false);
      return;
    }

    // Validate documents
    const hasDocuments = Object.values(profileFormData.documents).some(file => file instanceof File);
    if (!hasDocuments) {
      setError('Please upload at least one document');
      setIsSubmitting(false);
      return;
    }

    // Validate previous company documents if not a fresher
    if (!profileFormData.isFresher) {
      const hasPreviousDocs = Object.values(profileFormData.previousCompanyDocuments).some(file => file instanceof File);
      if (!hasPreviousDocs) {
        setError('Please upload at least one previous company document');
        setIsSubmitting(false);
        return;
      }
    }

    // Validate file sizes (example: max 5MB)
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    if (profileFormData.photo && profileFormData.photo.size > MAX_FILE_SIZE) {
      setError('Photo file size exceeds 5MB');
      setIsSubmitting(false);
      return;
    }
    for (const [key, file] of Object.entries(profileFormData.documents)) {
      if (file && file.size > MAX_FILE_SIZE) {
        setError(`Document ${key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} file size exceeds 5MB`);
        setIsSubmitting(false);
        return;
      }
    }
    if (!profileFormData.isFresher) {
      for (const [key, file] of Object.entries(profileFormData.previousCompanyDocuments)) {
        if (file && file.size > MAX_FILE_SIZE) {
          setError(`Previous company document ${key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} file size exceeds 5MB`);
          setIsSubmitting(false);
          return;
        }
      }
    }

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('Session expired. Please log in again.');
        localStorage.removeItem('authToken');
        navigate('/');
        setIsSubmitting(false);
        return;
      }

      const formData = new FormData();
      formData.append('dob', profileFormData.dob);
      formData.append('fatherName', profileFormData.fatherName);
      formData.append('motherName', profileFormData.motherName);
      formData.append('isFresher', profileFormData.isFresher.toString());
      if (profileFormData.photo) {
        formData.append('photo', profileFormData.photo);
      }
      // Send documents as individual fields (e.g., documents.offer_letter)
      Object.entries(profileFormData.documents).forEach(([key, file]) => {
        if (file) formData.append(`documents.${key}`, file);
      });
      if (!profileFormData.isFresher) {
        Object.entries(profileFormData.previousCompanyDocuments).forEach(([key, file]) => {
          if (file) formData.append(`previousCompanyDocuments.${key}`, file);
        });
      }

      const response = await fetch('http://localhost:8081/api/users/profile', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        setSuccessMessage('Profile submitted successfully for HR verification!');
        setProfileVerificationStatus('SUBMITTED');
        setProfileFormData({
          dob: '',
          photo: null,
          fatherName: '',
          motherName: '',
          isFresher: true,
          documents: {},
          previousCompanyDocuments: {},
        });
        setActiveView('profile');
      } else {
        let errorMessage = 'Failed to submit profile';
        if (response.status === 401) {
          setError('Session expired. Please log in again.');
          localStorage.removeItem('authToken');
          navigate('/');
        } else {
          try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorData.error || `Server error: ${response.status}`;
          } catch (jsonError) {
            errorMessage = `Server error: ${response.status} ${response.statusText}`;
          }
          setError(errorMessage);
        }
      }
    } catch (err) {
      console.error('Error submitting profile:', err);
      setError('An error occurred while submitting the profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLeaveAction = async (leaveId, action) => {
    setIsSubmitting(true);
    setError('');
    setSuccessMessage('');

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('Session expired. Please log in again.');
        localStorage.removeItem('authToken');
        navigate('/');
        setIsSubmitting(false);
        return;
      }

      const response = await fetch(`http://localhost:8081/api/leaves/${leaveId}/${action}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setSuccessMessage(`Leave ${action}d successfully!`);
        const pendingResponse = await fetch('http://localhost:8081/api/leaves/pending', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (pendingResponse.ok) {
          const pendingData = await pendingResponse.json();
          setPendingLeaves(pendingData);
        }
        setActiveView('pending-leaves');
      } else {
        let errorMessage = `Failed to ${action} leave`;
        if (response.status === 401) {
          setError('Session expired. Please log in again.');
          localStorage.removeItem('authToken');
          navigate('/');
        } else {
          try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
          } catch (jsonError) {
            errorMessage = `Server error: ${response.status} ${response.statusText}`;
          }
          setError(errorMessage);
        }
      }
    } catch (err) {
      console.error(`Error ${action}ing leave:`, err);
      setError(`An error occurred while ${action}ing the leave`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelLeave = async (leaveId) => {
    setIsSubmitting(true);
    setError('');
    setSuccessMessage('');

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('Session expired. Please log in again.');
        localStorage.removeItem('authToken');
        navigate('/');
        setIsSubmitting(false);
        return;
      }

      const response = await fetch(`http://localhost:8081/api/leaves/${leaveId}/cancel`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setSuccessMessage('Leave cancelled successfully!');
        const cancellableResponse = await fetch('http://localhost:8081/api/leaves/cancellable', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (cancellableResponse.ok) {
          const cancellableData = await cancellableResponse.json();
          setCancellableLeaves(cancellableData);
        }
      } else {
        let errorMessage = 'Failed to cancel leave';
        if (response.status === 401) {
          setError('Session expired. Please log in again.');
          localStorage.removeItem('authToken');
          navigate('/');
        } else {
          try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
          } catch (jsonError) {
            errorMessage = `Server error: ${response.status} ${response.statusText}`;
          }
          setError(errorMessage);
        }
      }
    } catch (err) {
      console.error('Error cancelling leave:', err);
      setError('An error occurred while cancelling the leave');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'APPROVED':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'REJECTED':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING':
        return 'text-yellow-600 bg-yellow-50';
      case 'APPROVED':
        return 'text-green-600 bg-green-50';
      case 'REJECTED':
        return 'text-red-600 bg-red-50';
      case 'SUBMITTED':
        return 'text-blue-600 bg-blue-50';
      case 'VERIFIED':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const leaveTypeMap = {
    CL: 'casualLeave',
    EL: 'earnedLeave',
    ML: 'maternityLeave',
    PL: 'paternityLeave',
    HALF_DAY_CL: 'casualLeave',
    HALF_DAY_EL: 'earnedLeave',
    LWP: 'leaveWithoutPay',
    HALF_DAY_LWP: 'leaveWithoutPay',
  };

  const isLeaveTypeAvailable = (leaveType) => {
    if (leaveType === 'EL' || leaveType === 'HALF_DAY_EL') {
      const totalEligible = EL_FIRST_HALF + EL_SECOND_HALF;
      const totalUsed = leaveBalance.earnedLeave.usedFirstHalf + leaveBalance.earnedLeave.usedSecondHalf;
      if (currentMonth <= 6) {
        return leaveBalance.earnedLeave.usedFirstHalf < EL_FIRST_HALF - leaveBalance.earnedLeave.usedSecondHalf ||
            totalUsed < totalEligible;
      }
      const secondHalfEligible = EL_SECOND_HALF + leaveBalance.earnedLeave.carryover;
      return leaveBalance.earnedLeave.usedSecondHalf < secondHalfEligible;
    }

    const leaveKey = leaveTypeMap[leaveType];
    return leaveBalance[leaveKey]?.remaining > 0;
  };

  const totalRemainingLeaves = Number(
      (leaveBalance.casualLeave.remaining + leaveBalance.earnedLeave.remaining).toFixed(1)
  );

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';
    return date.toISOString().split('T')[0];
  };

  const handleFileChange = (e, docType, isPreviousCompany = false) => {
    const file = e.target.files[0];
    if (file) {
      if (isPreviousCompany) {
        setProfileFormData({
          ...profileFormData,
          previousCompanyDocuments: {
            ...profileFormData.previousCompanyDocuments,
            [docType]: file,
          },
        });
      } else {
        setProfileFormData({
          ...profileFormData,
          documents: {
            ...profileFormData.documents,
            [docType]: file,
          },
        });
      }
    }
  };

  const renderProfileView = () => {
    if (isLoading) {
      return (
          <div className="flex justify-center items-center h-64">
            <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
            </svg>
          </div>
      );
    }

    return (
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-gray-900">Profile Details</h2>
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="mb-4">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(profileVerificationStatus)}`}>
              {getStatusIcon(profileVerificationStatus)}
              <span className="ml-1">{profileVerificationStatus === 'VERIFIED' ? 'Profile Verified' : profileVerificationStatus}</span>
            </span>
            </div>
            {profileVerificationStatus === 'VERIFIED' ? (
                <div className="text-center py-6">
                  <p className="text-green-600 text-lg font-medium">Your profile has been verified by HR.</p>
                  <p className="text-gray-600">All submitted details and documents have been approved.</p>
                </div>
            ) : (
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                      <input
                          type="date"
                          value={profileFormData.dob}
                          onChange={(e) => setProfileFormData({ ...profileFormData, dob: e.target.value })}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          disabled={profileVerificationStatus === 'SUBMITTED'}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Passport Size Photo</label>
                      <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setProfileFormData({ ...profileFormData, photo: e.target.files[0] })}
                          className="w-full p-2 border border-gray-300 rounded-md"
                          disabled={profileVerificationStatus === 'SUBMITTED'}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Father's Name</label>
                      <input
                          type="text"
                          value={profileFormData.fatherName}
                          onChange={(e) => setProfileFormData({ ...profileFormData, fatherName: e.target.value })}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          disabled={profileVerificationStatus === 'SUBMITTED'}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Mother's Name</label>
                      <input
                          type="text"
                          value={profileFormData.motherName}
                          onChange={(e) => setProfileFormData({ ...profileFormData, motherName: e.target.value })}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          disabled={profileVerificationStatus === 'SUBMITTED'}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Are you a Fresher?</label>
                      <select
                          value={profileFormData.isFresher}
                          onChange={(e) => setProfileFormData({ ...profileFormData, isFresher: e.target.value === 'true' })}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          disabled={profileVerificationStatus === 'SUBMITTED'}
                      >
                        <option value={true}>Yes, I am a Fresher</option>
                        <option value={false}>No, I have previous work experience</option>
                      </select>
                    </div>
                  </div>
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold text-gray-700 mb-4">Upload Documents</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      {documentTypes.map((docType) => (
                          <div key={docType}>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              {docType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                            </label>
                            <input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={(e) => handleFileChange(e, docType)}
                                className="w-full p-2 border border-gray-300 rounded-md"
                                disabled={profileVerificationStatus === 'SUBMITTED'}
                            />
                            {profileFormData.documents[docType] && (
                                <p className="text-sm text-green-600 mt-1">File selected: {profileFormData.documents[docType].name}</p>
                            )}
                          </div>
                      ))}
                    </div>
                  </div>
                  {!profileFormData.isFresher && (
                      <div className="mt-6">
                        <h3 className="text-lg font-semibold text-gray-700 mb-4">Previous Company Documents</h3>
                        <div className="grid md:grid-cols-2 gap-4">
                          {previousCompanyDocumentTypes.map((docType) => (
                              <div key={docType}>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  {docType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                                </label>
                                <input
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    onChange={(e) => handleFileChange(e, docType, true)}
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                    disabled={profileVerificationStatus === 'SUBMITTED'}
                                />
                                {profileFormData.previousCompanyDocuments[docType] && (
                                    <p className="text-sm text-green-600 mt-1">File selected: {profileFormData.previousCompanyDocuments[docType].name}</p>
                                )}
                              </div>
                          ))}
                        </div>
                      </div>
                  )}
                  {profileVerificationStatus !== 'SUBMITTED' && (
                      <button
                          onClick={handleProfileSubmit}
                          disabled={isSubmitting}
                          className={`w-full flex justify-center items-center py-2.5 px-4 mt-6 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                              isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-700 hover:bg-blue-800'
                          } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200`}
                      >
                        {isSubmitting ? (
                            <span className="flex items-center">
                      <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                      </svg>
                      Submitting...
                    </span>
                        ) : (
                            'Submit Profile for Verification'
                        )}
                      </button>
                  )}
                </div>
            )}
          </div>
        </div>
    );
  };

  const leaveBalanceMetrics = [
    {
      key: 'total-leave-balance',
      title: 'Total Leave Balance (CL + EL)',
      value: totalRemainingLeaves,
      borderColor: 'border-purple-500',
      icon: <User size={24} className="text-purple-500" />,
      details: [{ label: 'Total Remaining', value: totalRemainingLeaves }],
    },
    {
      key: 'casual-leave',
      title: 'Casual Leave (CL)',
      borderColor: 'border-blue-500',
      icon: <CalendarCheck size={24} className="text-blue-500" />,
      details: [
        { label: 'Total Annual', value: leaveBalance.casualLeave.total },
        { label: 'Accrued This Year', value: userData?.accruedCl || 0, textColor: 'text-blue-600' },
        { label: 'Used', value: leaveBalance.casualLeave.used.toFixed(1), textColor: 'text-red-600' },
        { label: 'Remaining', value: leaveBalance.casualLeave.remaining.toFixed(1), textColor: 'text-green-600' },
      ],
    },
    {
      key: 'earned-leave',
      title: 'Earned Leave (EL)',
      borderColor: 'border-green-500',
      icon: <Calendar size={24} className="text-green-500" />,
      details: [
        { label: 'Total Annual', value: leaveBalance.earnedLeave.total },
        { label: 'Carryover', value: leaveBalance.earnedLeave.carryover.toFixed(1), textColor: 'text-blue-600' },
        { label: 'Used First Half', value: leaveBalance.earnedLeave.usedFirstHalf.toFixed(1), textColor: 'text-red-600' },
        { label: 'Used Second Half', value: leaveBalance.earnedLeave.usedSecondHalf.toFixed(1), textColor: 'text-red-600' },
        { label: 'Remaining', value: leaveBalance.earnedLeave.remaining.toFixed(1), textColor: 'text-green-600' },
      ],
      note: currentMonth <= 6 && leaveBalance.earnedLeave.usedSecondHalf > 0
          ? `Pending advance EL: ${leaveBalance.earnedLeave.usedSecondHalf.toFixed(1)} days. Total EL balance after approval: ${(leaveBalance.earnedLeave.total - leaveBalance.earnedLeave.usedFirstHalf - leaveBalance.earnedLeave.usedSecondHalf).toFixed(1)} days.`
          : null,
    },
    ...(userData?.gender?.toUpperCase() === 'FEMALE'
        ? [{
          key: 'maternity-leave',
          title: 'Maternity Leave (ML)',
          borderColor: 'border-pink-500',
          icon: <Calendar size={24} className="text-pink-500" />,
          details: [
            { label: 'Total', value: leaveBalance.maternityLeave.total },
            { label: 'Used', value: leaveBalance.maternityLeave.used.toFixed(1), textColor: 'text-red-600' },
            { label: 'Remaining', value: leaveBalance.maternityLeave.remaining.toFixed(1), textColor: 'text-green-600' },
          ],
        }]
        : []),
    ...(userData?.gender?.toUpperCase() === 'MALE'
        ? [{
          key: 'paternity-leave',
          title: 'Paternity Leave (PL)',
          borderColor: 'border-blue-500',
          icon: <Calendar size={24} className="text-blue-500" />,
          details: [
            { label: 'Total', value: leaveBalance.paternityLeave.total },
            { label: 'Used', value: leaveBalance.paternityLeave.used.toFixed(1), textColor: 'text-red-600' },
            { label: 'Remaining', value: leaveBalance.paternityLeave.remaining.toFixed(1), textColor: 'text-green-600' },
          ],
        }]
        : []),
    {
      key: 'leave-without-pay',
      title: 'Leave Without Pay (LWP)',
      borderColor: 'border-gray-500',
      icon: <Calendar size={24} className="text-gray-500" />,
      details: [
        { label: 'Used', value: leaveBalance.leaveWithoutPay.used.toFixed(1), textColor: 'text-red-600' },
      ],
    },
  ];

  const renderDashboardView = () => {
    if (isLoading) {
      return (
          <div className="flex justify-center items-center h-64">
            <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
            </svg>
          </div>
      );
    }

    return (
        <div className="space-y-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Leave Balance Overview</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {leaveBalanceMetrics.map((metric) => (
                  <div
                      key={metric.key}
                      className={`bg-white rounded-lg p-5 border-l-4 ${metric.borderColor} shadow-md hover:shadow-lg transition-all duration-200`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-700">{metric.title}</h3>
                      {metric.icon}
                    </div>
                    <div className="space-y-3">
                      {metric.details.map((detail, index) => (
                          <div key={index} className="flex justify-between items-center">
                            <span className="text-gray-600">{detail.label}</span>
                            <span className={`font-bold text-xl ${detail.textColor || 'text-gray-900'}`}>
                        {detail.value}
                      </span>
                          </div>
                      ))}
                      {metric.note && (
                          <p className="text-sm text-gray-600 mt-2">{metric.note}</p>
                      )}
                    </div>
                  </div>
              ))}
            </div>
          </div>
        </div>
    );
  };

  const renderApplyLeaveView = () => {
    const isHalfDay = leaveFormData.leaveType === 'HALF_DAY_CL' || leaveFormData.leaveType === 'HALF_DAY_EL' || leaveFormData.leaveType === 'HALF_DAY_LWP';
    const isFixedDuration = leaveFormData.leaveType === 'ML' || leaveFormData.leaveType === 'PL';
    const minDate = (leaveFormData.leaveType === 'CL' || leaveFormData.leaveType === 'HALF_DAY_CL')
        ? new Date(new Date().setDate(new Date().getDate() - 6)).toISOString().split('T')[0]
        : today;

    return (
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-gray-900">Apply for Leave</h2>
          <div className="bg-white rounded-lg shadow-lg p-6">
            {currentMonth <= 6 && leaveBalance.earnedLeave.usedSecondHalf > 0 && (leaveFormData.leaveType === 'EL' || leaveFormData.leaveType === 'HALF_DAY_EL') && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-yellow-800 font-medium">
                    Pending advance EL: {leaveBalance.earnedLeave.usedSecondHalf.toFixed(1)} days.
                  </p>
                </div>
            )}
            {(leaveFormData.leaveType === 'CL' || leaveFormData.leaveType === 'HALF_DAY_CL') && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-blue-800 font-medium">
                    Accrued CL: {(userData?.accruedCl || 0).toFixed(1)} days.
                  </p>
                </div>
            )}
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Leave Type</label>
                  <select
                      value={leaveFormData.leaveType}
                      onChange={(e) => setLeaveFormData({
                        ...leaveFormData,
                        leaveType: e.target.value,
                        endDate: ''
                      })}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      autoComplete="off"
                  >
                    <option value="CL" disabled={!isLeaveTypeAvailable('CL')}>
                      Casual Leave {isLeaveTypeAvailable('CL') ? '' : '(Unavailable)'}
                    </option>
                    <option value="EL" disabled={!isLeaveTypeAvailable('EL')}>
                      Earned Leave
                    </option>
                    <option value="HALF_DAY_CL" disabled={!isLeaveTypeAvailable('HALF_DAY_CL')}>
                      Half-Day CL
                    </option>
                    <option value="HALF_DAY_EL" disabled={!isLeaveTypeAvailable('HALF_DAY_EL')}>
                      Half-Day EL
                    </option>
                    {userData?.gender?.toUpperCase() === 'FEMALE' && (
                        <option value="ML" disabled={!isLeaveTypeAvailable('ML')}>
                          Maternity Leave
                        </option>
                    )}
                    {userData?.gender?.toUpperCase() === 'MALE' && (
                        <option value="PL" disabled={!isLeaveTypeAvailable('PL')}>
                          Paternity Leave
                        </option>
                    )}
                    <option value="LWP" disabled={!isLeaveTypeAvailable('LWP')}>
                      Leave Without Pay
                    </option>
                    <option value="HALF_DAY_LWP" disabled={!isLeaveTypeAvailable('HALF_DAY_LWP')}>
                      Half-Day LWP
                    </option>
                  </select>
                  {leaveBalance[leaveTypeMap[leaveFormData.leaveType]]?.remaining <= 0 && !['EL', 'HALF_DAY_EL', 'CL', 'HALF_DAY_CL'].includes(leaveFormData.leaveType) && (
                      <div className="text-red-600 text-sm mt-1">
                        No remaining {leaveFormData.leaveType.replace(/_/g, ' ').toLowerCase()} available.
                      </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Calendar size={18} className="text-gray-400" />
                    </div>
                    <input
                        type="date"
                        value={leaveFormData.startDate}
                        onChange={(e) => {
                          const startDate = e.target.value;
                          setLeaveFormData({ ...leaveFormData, startDate });
                          if (isNonWorkingDay(startDate) && (leaveFormData.leaveType === 'HALF_DAY_CL' || leaveFormData.leaveType === 'HALF_DAY_EL' || leaveFormData.leaveType === 'HALF_DAY_LWP')) {
                            setError('Half-day leave cannot be applied on a non-working day');
                          } else {
                            setError('');
                          }
                        }}
                        min={minDate}
                        className={`pl-10 w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${leaveFormData.startDate && leaveFormData.startDate < minDate ? 'border-red-500 bg-red-50' : ''}`}
                        autoComplete="off"
                    />
                  </div>
                  {leaveFormData.startDate && leaveFormData.startDate < minDate && (
                      <div className="text-red-600 text-sm mt-1">
                        Date is outside the allowed range.
                      </div>
                  )}
                </div>
                {!isHalfDay && !isFixedDuration && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Calendar size={18} className="text-gray-400" />
                        </div>
                        <input
                            type="date"
                            value={leaveFormData.endDate}
                            onChange={(e) => setLeaveFormData({ ...leaveFormData, endDate: e.target.value })}
                            min={leaveFormData.startDate || today}
                            className={`pl-10 w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${leaveFormData.endDate && leaveFormData.startDate && leaveFormData.endDate < leaveFormData.startDate ? 'border-red-500 bg-red-50' : ''}`}
                            autoComplete="off"
                        />
                      </div>
                      {leaveFormData.endDate && leaveFormData.startDate && leaveFormData.endDate < leaveFormData.startDate && (
                          <div className="text-red-600 text-sm mt-1">
                            End date cannot be before start date.
                          </div>
                      )}
                    </div>
                )}
                {isFixedDuration && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Calendar size={18} className="text-gray-400" />
                        </div>
                        <input
                            type="date"
                            value={leaveFormData.endDate}
                            readOnly
                            className="pl-10 w-full p-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
                            autoComplete="off"
                        />
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {leaveFormData.leaveType === 'ML' ? 'Maternity leave: 182 days.' : 'Paternity leave: 15 days.'}
                      </p>
                    </div>
                )}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                  <textarea
                      value={leaveFormData.reason}
                      onChange={(e) => setLeaveFormData({ ...leaveFormData, reason: e.target.value })}
                      rows="3"
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      autoComplete="off"
                      placeholder="Provide a reason for your leave"
                  ></textarea>
                </div>
              </div>
              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  Total leave days: <span className="font-bold">{leaveDays.toFixed(1)}</span>
                </p>
              </div>
              <button
                  onClick={handleLeaveSubmit}
                  disabled={
                      isSubmitting ||
                      !leaveFormData.startDate ||
                      !leaveFormData.reason ||
                      ((leaveFormData.leaveType !== 'HALF_DAY_CL' &&
                              leaveFormData.leaveType !== 'HALF_DAY_EL' &&
                              leaveFormData.leaveType !== 'HALF_DAY_LWP' &&
                              leaveFormData.leaveType !== 'ML' &&
                              leaveFormData.leaveType !== 'PL') &&
                          !leaveFormData.endDate) ||
                      (leaveFormData.startDate && leaveFormData.startDate < minDate) ||
                      (leaveFormData.endDate && leaveFormData.startDate && leaveFormData.endDate < leaveFormData.startDate && leaveFormData.leaveType !== 'ML' && leaveFormData.leaveType !== 'PL') ||
                      leaveDays === 0
                  }
                  className={`w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                      isSubmitting ||
                      !leaveFormData.startDate ||
                      !leaveFormData.reason ||
                      leaveDays === 0
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-blue-700 hover:bg-blue-800'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200`}
              >
                {isSubmitting ? (
                    <span className="flex items-center">
                  <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                  </svg>
                  Submitting...
                </span>
                ) : (
                    'Submit Application'
                )}
              </button>
            </div>
          </div>
        </div>
    );
  };

  const renderLeaveApplicationsView = () => {
    if (isLoading) {
      return (
          <div className="flex justify-center items-center h-64">
            <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
            </svg>
          </div>
      );
    }

    return (
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-gray-900">My Leave Applications</h2>
          <div className="bg-white rounded-lg shadow-lg p-6">
            {leaveApplications.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Type</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Start Date</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">End Date</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Applied On</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Reason</th>
                    </tr>
                    </thead>
                    <tbody>
                    {leaveApplications.map((application) => (
                        <tr key={application.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4">{application.leaveType || 'N/A'}</td>
                          <td className="py-3 px-4">{formatDate(application.startDate)}</td>
                          <td className="py-3 px-4">
                            {(application.leaveType === 'HALF_DAY_CL' ||
                                application.leaveType === 'HALF_DAY_EL' ||
                                application.leaveType === 'HALF_DAY_LWP')
                                ? `${formatDate(application.startDate)} (Half-Day)`
                                : application.endDate ? formatDate(application.endDate) : 'N/A'}
                          </td>
                          <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(application.status)}`}>
                          {getStatusIcon(application.status)}
                          <span className="ml-1">{application.status || 'Unknown'}</span>
                        </span>
                          </td>
                          <td className="py-3 px-4">{formatDate(application.appliedOn)}</td>
                          <td className="py-3 px-4">{application.reason || 'N/A'}</td>
                        </tr>
                    ))}
                    </tbody>
                  </table>
                </div>
            ) : (
                <div className="text-center py-6">
                  <p className="text-gray-600">No leave applications found.</p>
                </div>
            )}
          </div>
        </div>
    );
  };

  const renderSubordinatesView = () => {
    if (subordinates.length === 0) return null;
    if (isLoading) {
      return (
          <div className="flex justify-center items-center h-64">
            <svg
                className="animate-spin h-8 w-8 text-blue-500"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
            >
              <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
              ></circle>
              <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8H4z"
              ></path>
            </svg>
          </div>
      );
    }

    return (
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-gray-900">Subordinates</h2>
          <div className="bg-white rounded-lg shadow-lg p-6">
            {subordinates.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-gray-700">
                        Name
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">
                        Department
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">
                        Total Leave Balance
                      </th>
                    </tr>
                    </thead>
                    <tbody>
                    {subordinates.map((subordinate) => (
                        <tr
                            key={subordinate.id}
                            className="border-b hover:bg-gray-50"
                        >
                          <td className="py-3 px-4">
                            {subordinate.fullName || "N/A"}
                          </td>
                          <td className="py-3 px-4">
                            {subordinate.department || "N/A"}
                          </td>
                          <td className="py-3 px-4">
                            {subordinate.leaveBalance
                                ? (
                                    (subordinate.leaveBalance.casualLeave?.remaining ||
                                        0) +
                                    (subordinate.leaveBalance.earnedLeave?.remaining ||
                                        0)
                                ).toFixed(1)
                                : "N/A"}{" "}
                            days
                          </td>
                        </tr>
                    ))}
                    </tbody>
                  </table>
                </div>
            ) : (
                <div className="text-center py-6">
                  <p className="text-gray-600">No subordinates found.</p>
                </div>
            )}
          </div>
        </div>
    );
  };

    const renderPendingLeavesView = () => {
        if (subordinates.length === 0) return null;
        if (isLoading) {
            return (
                <div className="flex justify-center items-center h-64">
                    <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                    </svg>
                </div>
            );
        }

        return (
            <div className="space-y-6">
                <h2 className="text-2xl font-semibold text-gray-900">Pending Leave Approvals</h2>
                <div className="bg-white rounded-lg shadow-lg p-6">
                    {pendingLeaves.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                <tr className="border-b">
                                    <th className="text-left py-3 px-4 font-medium text-gray-700">Employee Name</th>
                                    <th className="text-left py-3 px-4 font-medium text-gray-700">Leave Type</th>
                                    <th className="text-left py-3 px-4 font-medium text-gray-700">Start Date</th>
                                    <th className="text-left py-3 px-4 font-medium text-gray-700">End Date</th>
                                    <th className="text-left py-3 px-4 font-medium text-gray-700">Reason</th>
                                    <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                                </tr>
                                </thead>
                                <tbody>
                                {pendingLeaves.map((leave) => (
                                    <tr key={leave.id} className="border-b hover:bg-gray-50">
                                        <td className="py-3 px-4">{leave.employeeName || 'N/A'}</td>
                                        <td className="py-3 px-4">{leave.leaveType || 'N/A'}</td>
                                        <td className="py-3 px-4">{formatDate(leave.startDate)}</td>
                                        <td className="py-3 px-4">
                                            {(leave.leaveType === 'HALF_DAY_CL' ||
                                                leave.leaveType === 'HALF_DAY_EL' ||
                                                leave.leaveType === 'HALF_DAY_LWP')
                                                ? `${formatDate(leave.startDate)} (Half-Day)`
                                                : leave.endDate ? formatDate(leave.endDate) : 'N/A'}
                                        </td>
                                        <td className="py-3 px-4">{leave.reason || 'N/A'}</td>
                                        <td className="py-3 px-4 flex space-x-2">
                                            <button
                                                onClick={() => handleLeaveAction(leave.id, 'approve')}
                                                disabled={isSubmitting}
                                                className={`flex items-center px-3 py-1.5 text-sm font-medium rounded-md ${
                                                    isSubmitting
                                                        ? 'bg-gray-300 cursor-not-allowed'
                                                        : 'bg-green-600 hover:bg-green-700 text-white'
                                                }`}
                                            >
                                                <CheckCircle size={16} className="mr-1" />
                                                Approve
                                            </button>
                                            <button
                                                onClick={() => handleLeaveAction(leave.id, 'reject')}
                                                disabled={isSubmitting}
                                                className={`flex items-center px-3 py-1.5 text-sm font-medium rounded-md ${
                                                    isSubmitting
                                                        ? 'bg-gray-300 cursor-not-allowed'
                                                        : 'bg-red-600 hover:bg-red-700 text-white'
                                                }`}
                                            >
                                                <XCircle size={16} className="mr-1" />
                                                Reject
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-6">
                            <p className="text-gray-600">No pending leave applications.</p>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderCancellableLeavesView = () => {
        if (isLoading) {
            return (
                <div className="flex justify-center items-center h-64">
                    <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                    </svg>
                </div>
            );
        }

        return (
            <div className="space-y-6">
                <h2 className="text-2xl font-semibold text-gray-900">Cancellable Leaves</h2>
                <div className="bg-white rounded-lg shadow-lg p-6">
                    {cancellableLeaves.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                <tr className="border-b">
                                    <th className="text-left py-3 px-4 font-medium text-gray-700">Leave Type</th>
                                    <th className="text-left py-3 px-4 font-medium text-gray-700">Start Date</th>
                                    <th className="text-left py-3 px-4 font-medium text-gray-700">End Date</th>
                                    <th className="text-left py-3 px-4 font-medium text-gray-700">Reason</th>
                                    <th className="text-left py-3 px-4 font-medium text-gray-700">Action</th>
                                </tr>
                                </thead>
                                <tbody>
                                {cancellableLeaves.map((leave) => (
                                    <tr key={leave.id} className="border-b hover:bg-gray-50">
                                        <td className="py-3 px-4">{leave.leaveType || 'N/A'}</td>
                                        <td className="py-3 px-4">{formatDate(leave.startDate)}</td>
                                        <td className="py-3 px-4">
                                            {(leave.leaveType === 'HALF_DAY_CL' ||
                                                leave.leaveType === 'HALF_DAY_EL' ||
                                                leave.leaveType === 'HALF_DAY_LWP')
                                                ? `${formatDate(leave.startDate)} (Half-Day)`
                                                : leave.endDate ? formatDate(leave.endDate) : 'N/A'}
                                        </td>
                                        <td className="py-3 px-4">{leave.reason || 'N/A'}</td>
                                        <td className="py-3 px-4">
                                            <button
                                                onClick={() => handleCancelLeave(leave.id)}
                                                disabled={isSubmitting}
                                                className={`flex items-center px-3 py-1.5 text-sm font-medium rounded-md ${
                                                    isSubmitting
                                                        ? 'bg-gray-300 cursor-not-allowed'
                                                        : 'bg-red-600 hover:bg-red-700 text-white'
                                                }`}
                                            >
                                                <Trash2 size={16} className="mr-1" />
                                                Cancel
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-6">
                            <p className="text-gray-600">No cancellable leaves found.</p>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Error and Success Messages */}
            {error && (
                <div className="fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-md flex items-center z-50">
                    <AlertCircle size={20} className="mr-2" />
                    <span>{error}</span>
                </div>
            )}
            {successMessage && (
                <div className="fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg shadow-md flex items-center z-50">
                    <CheckCircle size={20} className="mr-2" />
                    <span>{successMessage}</span>
                </div>
            )}

            {/* Mobile Sidebar Toggle */}
            <div className="md:hidden p-4">
                <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="text-gray-700 focus:outline-none"
                >
                    {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            <div className="flex">
                {/* Sidebar */}
                <div
                    className={`${
                        isSidebarOpen ? "block" : "hidden"
                    } md:block w-64 bg-white shadow-lg h-screen fixed md:static z-40`}
                >
                    <div className="p-6 border-b">
                        <h1 className="text-2xl font-bold text-gray-900">HR Dashboard</h1>
                    </div>
                    <nav className="mt-6">
                        <button
                            onClick={() => {
                                setActiveView("dashboard");
                                setIsSidebarOpen(false);
                            }}
                            className={`w-full flex items-center px-6 py-3 text-sm font-medium ${
                                activeView === "dashboard"
                                    ? "bg-blue-100 text-blue-700"
                                    : "text-gray-600 hover:bg-gray-50"
                            }`}
                        >
                            <User size={20} className="mr-3" />
                            Dashboard
                        </button>
                        <button
                            onClick={() => {
                                setActiveView("profile");
                                setIsSidebarOpen(false);
                            }}
                            className={`w-full flex items-center px-6 py-3 text-sm font-medium ${
                                activeView === "profile"
                                    ? "bg-blue-100 text-blue-700"
                                    : "text-gray-600 hover:bg-gray-50"
                            }`}
                        >
                            <User size={20} className="mr-3" />
                            Profile
                        </button>
                        <button
                            onClick={() => {
                                setActiveView("apply-leave");
                                setIsSidebarOpen(false);
                            }}
                            className={`w-full flex items-center px-6 py-3 text-sm font-medium ${
                                activeView === "apply-leave"
                                    ? "bg-blue-100 text-blue-700"
                                    : "text-gray-600 hover:bg-gray-50"
                            }`}
                        >
                            <FileText size={20} className="mr-3" />
                            Apply Leave
                        </button>
                        <button
                            onClick={() => {
                                setActiveView("leave-applications");
                                setIsSidebarOpen(false);
                            }}
                            className={`w-full flex items-center px-6 py-3 text-sm font-medium ${
                                activeView === "leave-applications"
                                    ? "bg-blue-100 text-blue-700"
                                    : "text-gray-600 hover:bg-gray-50"
                            }`}
                        >
                            <Calendar size={20} className="mr-3" />
                            My Leave Applications
                        </button>
                        {subordinates.length > 0 && (
                            <>
                                <button
                                    onClick={() => {
                                        setActiveView("subordinates");
                                        setIsSidebarOpen(false);
                                    }}
                                    className={`w-full flex items-center px-6 py-3 text-sm font-medium ${
                                        activeView === "subordinates"
                                            ? "bg-blue-100 text-blue-700"
                                            : "text-gray-600 hover:bg-gray-50"
                                    }`}
                                >
                                    <Users size={20} className="mr-3" />
                                    Subordinates
                                </button>
                                <button
                                    onClick={() => {
                                        setActiveView("pending-leaves");
                                        setIsSidebarOpen(false);
                                    }}
                                    className={`w-full flex items-center px-6 py-3 text-sm font-medium ${
                                        activeView === "pending-leaves"
                                            ? "bg-blue-100 text-blue-700"
                                            : "text-gray-600 hover:bg-gray-50"
                                    }`}
                                >
                                    <Clock size={20} className="mr-3" />
                                    Pending Leaves
                                </button>
                                <button
                                    onClick={() => {
                                        setActiveView("cancellable-leaves");
                                        setIsSidebarOpen(false);
                                    }}
                                    className={`w-full flex items-center px-6 py-3 text-sm font-medium ${
                                        activeView === "cancellable-leaves"
                                            ? "bg-blue-100 text-blue-700"
                                            : "text-gray-600 hover:bg-gray-50"
                                    }`}
                                >
                                    <Trash2 size={20} className="mr-3" />
                                    Cancellable Leaves
                                </button>
                            </>
                        )}
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center px-6 py-3 text-sm font-medium text-red-600 hover:bg-red-50"
                        >
                            <LogOut size={20} className="mr-3" />
                            Logout
                        </button>
                    </nav>
                </div>

                {/* Main Content */}
                <div className="flex-1 p-6 md:p-8">
                    {activeView === "dashboard" && renderDashboardView()}
                    {activeView === "profile" && renderProfileView()}
                    {activeView === "apply-leave" && renderApplyLeaveView()}
                    {activeView === "leave-applications" && renderLeaveApplicationsView()}
                    {activeView === "subordinates" && renderSubordinatesView()}
                    {activeView === "pending-leaves" && renderPendingLeavesView()}
                    {activeView === "cancellable-leaves" && renderCancellableLeavesView()}
                </div>
            </div>
        </div>
    );
}