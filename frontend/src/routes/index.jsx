import { Routes, Route } from 'react-router-dom';
import LoginPage from '../pages/LoginPage';
import SignupPage from '../pages/SignupPage';
import ForgotUsernamePage from '../pages/ForgotUsernamePage';
import HRDashboardPage from '../pages/HRDashboardPage';
import ResetPasswordPage from '../pages/ResetPasswordPage';
import DirectorDashboardPage from '../pages/DirectorDashboardPage';
import GenericDashboardPage from "../pages/GenericDashboardPage.jsx";
import SuperAdminDashPage from '../pages/SuperAdminDashPage.jsx';
const AppRoutes = () => {
  return (
    <Routes>
        <Route path="/dashboard" element={<GenericDashboardPage/>}/>
      <Route path="/director-dashboard" element={<DirectorDashboardPage />} />
        <Route path="/superadmin-dashboard" element={<SuperAdminDashPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/forgot-username" element={<ForgotUsernamePage />} />
      <Route path="/hr-dashboard" element={<HRDashboardPage />} />
    </Routes>
  );
};

export default AppRoutes;