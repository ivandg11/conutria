import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Patients from './pages/Patients';
import PatientForm from './pages/PatientForm';
import PatientDetail from './pages/PatientDetail';
import ConsultationForm from './pages/ConsultationForm';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Página pública */}
          <Route path="/" element={<LandingPage />} />

          {/* Inicio de sesión */}
          <Route path="/login" element={<Login />} />

          {/* Secciones privadas */}
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Patients />} />
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
