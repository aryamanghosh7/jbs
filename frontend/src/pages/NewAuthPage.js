import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/SupabaseAuthContext';
import { Briefcase, User, Eye, EyeSlash } from '@phosphor-icons/react';
import { toast } from 'sonner';

export default function NewAuthPage() {
  const { user, loading, login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="app-wrapper">
        <div className="mobile-container flex items-center justify-center">
          <div className="spinner" />
        </div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    if (isLogin) {
      const result = await login(email, password);
      if (!result.success) {
        toast.error(result.error);
      }
    } else {
      if (!role) {
        toast.error('Please select a role');
        setSubmitting(false);
        return;
      }
      const result = await register(email, password, name, role);
      if (!result.success) {
        toast.error(result.error);
      }
    }
    setSubmitting(false);
  };

  return (
    <div className="app-wrapper">
      <div className="mobile-container px-6 py-12 overflow-y-auto custom-scrollbar">
        <div className="flex flex-col items-center mb-10 animate-fade-in">
          <div className="w-20 h-20 rounded-3xl bg-[#10B981] flex items-center justify-center mb-4 shadow-lg">
            <span className="text-4xl">💫</span>
          </div>
          <h1 className="text-3xl font-medium text-[#111827] tracking-tight">JobSwish</h1>
          <p className="text-[#9CA3AF] mt-2">Find your perfect match</p>
        </div>

        <div className="bg-[#F9FAFB] p-1 rounded-full flex mb-8">
          <button
            type="button"
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-3 rounded-full font-medium transition-all ${
              isLogin ? 'bg-white shadow-sm text-[#111827]' : 'text-[#9CA3AF]'
            }`}
            data-testid="login-tab"
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-3 rounded-full font-medium transition-all ${
              !isLogin ? 'bg-white shadow-sm text-[#111827]' : 'text-[#9CA3AF]'
            }`}
            data-testid="register-tab"
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 animate-fade-in">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-[#111827] mb-2 ml-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-field"
                placeholder="John Doe"
                required={!isLogin}
                data-testid="name-input"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-[#111827] mb-2 ml-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="you@example.com"
              required
              data-testid="email-input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#111827] mb-2 ml-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field pr-12"
                placeholder="Enter password"
                required
                data-testid="password-input"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9CA3AF]"
              >
                {showPassword ? <EyeSlash size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-[#111827] mb-3 ml-1">I am a...</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('applicant')}
                  className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${
                    role === 'applicant'
                      ? 'border-[#10B981] bg-[#10B981]/10'
                      : 'border-[#E5E7EB] hover:border-[#10B981]/50'
                  }`}
                  data-testid="role-applicant"
                >
                  <User size={28} weight={role === 'applicant' ? 'duotone' : 'regular'} className="text-[#10B981]" />
                  <span className="font-medium text-[#111827]">Job Seeker</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('recruiter')}
                  className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${
                    role === 'recruiter'
                      ? 'border-[#10B981] bg-[#10B981]/10'
                      : 'border-[#E5E7EB] hover:border-[#10B981]/50'
                  }`}
                  data-testid="role-recruiter"
                >
                  <Briefcase size={28} weight={role === 'recruiter' ? 'duotone' : 'regular'} className="text-[#10B981]" />
                  <span className="font-medium text-[#111827]">Recruiter</span>
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="btn-primary mt-6"
            data-testid="auth-submit"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {isLogin ? 'Signing in...' : 'Creating account...'}
              </span>
            ) : (
              isLogin ? 'Sign In' : 'Create Account'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
