import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/SupabaseAuthContext";
import { Toaster } from "sonner";

// New Pages
import NewAuthPage from "./pages/NewAuthPage";
import NewApplicantDashboard from "./pages/NewApplicantDashboard";
import NewResumeBuilder from "./pages/NewResumeBuilder";

// Old Pages (keep for recruiter temporarily)
import RecruiterHome from "./pages/RecruiterHome";
import PostJob from "./pages/PostJob";
import JobApplicants from "./pages/JobApplicants";

function ProtectedRoute({ children, allowedRoles }) {
  const { user, profile, loading } = useAuth();

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

  if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function HomeRouter() {
  const { user, profile } = useAuth();

  if (!user) return <Navigate to="/auth" replace />;
  if (!profile) {
    return (
      <div className="app-wrapper">
        <div className="mobile-container flex items-center justify-center">
          <div className="spinner" />
        </div>
      </div>
    );
  }

  if (profile.role === 'applicant') {
    return <NewApplicantDashboard />;
  }

  return <RecruiterHome />;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-center" richColors />
        <Routes>
          <Route path="/auth" element={<NewAuthPage />} />
          <Route path="/" element={<ProtectedRoute><HomeRouter /></ProtectedRoute>} />
          }
          <Route path="/resume" element={<ProtectedRoute allowedRoles={['applicant']}><NewResumeBuilder /></ProtectedRoute>} />
          }
          <Route path="/post-job" element={<ProtectedRoute allowedRoles={['recruiter']}><PostJob /></ProtectedRoute>} />
          }
          <Route path="/job/:jobId/applicants" element={<ProtectedRoute allowedRoles={['recruiter']}><JobApplicants /></ProtectedRoute>} />
          }
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
