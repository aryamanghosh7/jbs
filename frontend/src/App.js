import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { Toaster } from "sonner";

// Pages
import AuthPage from "./pages/AuthPage";
import JobSeekerHome from "./pages/JobSeekerHome";
import RecruiterHome from "./pages/RecruiterHome";
import ResumeBuilder from "./pages/ResumeBuilder";
import PostJob from "./pages/PostJob";
import JobApplicants from "./pages/JobApplicants";

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="app-wrapper">
        <div className="mobile-container flex items-center justify-center">
          <div className="spinner" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function HomeRouter() {
  const { user } = useAuth();
  
  if (!user) return <Navigate to="/auth" replace />;
  
  if (user.role === 'job_seeker') {
    return <JobSeekerHome />;
  }
  
  return <RecruiterHome />;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-center" richColors />
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/" element={<ProtectedRoute><HomeRouter /></ProtectedRoute>} />
          <Route path="/resume" element={<ProtectedRoute allowedRoles={['job_seeker']}><ResumeBuilder /></ProtectedRoute>} />
          <Route path="/post-job" element={<ProtectedRoute allowedRoles={['recruiter']}><PostJob /></ProtectedRoute>} />
          <Route path="/job/:jobId/applicants" element={<ProtectedRoute allowedRoles={['recruiter']}><JobApplicants /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
