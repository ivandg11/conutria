import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/ClientLayout';

import LandingPage from './pages/LandingPage';
import SubscriptionPlans from './pages/SuscriptionPlans';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Patients from './pages/Patients';
import PatientForm from './pages/PatientForm';
import PatientDetail from './pages/PatientDetail';
import ConsultationForm from './pages/ConsultationForm';
import SuperadminDashboard from './pages/SuperadminDashboard';
import SetupPassword from './pages/SetupPassword';
import PaymentResult from './pages/PaymentResult';
import Account from './pages/Account';
import Support from './pages/Support';
import Agenda from './pages/Agenda';
import LegalDocuments from './pages/LegalDocuments';
import WeeklyCheckin from './pages/WeeklyCheckin';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Página pública */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/planes" element={<SubscriptionPlans />} />
          <Route path="/crear-contrasena" element={<SetupPassword />} />
          <Route path="/pago/resultado" element={<PaymentResult />} />
          <Route path="/seguimiento-semanal" element={<WeeklyCheckin />} />
          <Route path="/aviso-de-privacidad" element={<LegalDocuments type="privacy" />} />
          <Route path="/terminos-de-uso" element={<LegalDocuments type="terms" />} />

          {/* Inicio de sesión */}
          <Route path="/login" element={<Login />} />
          <Route path="/recuperar-contrasena" element={<ForgotPassword />} />
          <Route path="/restablecer-contrasena" element={<ResetPassword />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole="SUPERADMIN">
                <SuperadminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Secciones privadas */}
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Patients />} />
            <Route path="/account" element={<Account />} />
            <Route path="/support" element={<Support />} />
            <Route path="/agenda" element={<Agenda />} />
            <Route path="/patients/new" element={<PatientForm />} />
            <Route path="/patients/:id/edit" element={<PatientForm />} />
            <Route path="/patients/:id" element={<PatientDetail />} />

            <Route
              path="/patients/:id/consultations/new"
              element={<ConsultationForm />}
            />

            <Route
              path="/consultations/:consultationId/edit"
              element={<ConsultationForm />}
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
