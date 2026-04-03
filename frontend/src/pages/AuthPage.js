import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Briefcase, User, Eye, EyeSlash } from '@phosphor-icons/react';
import { toast } from 'sonner';

export default function AuthPage() {
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
          <div className="w-20 h-20 rounded-3xl bg-[#A8D5BA] flex items-center justify-center mb-4 shadow-lg">
            <Briefcase size={40} weight="duotone" className="text-[#112217]" />
          </div>
          <h1 className="text-3xl font-medium text-[#1C2B23] tracking-tight">Jobswish</h1>
          <p className="text-[#7B8E83] mt-2">Find your perfect match</p>
        </div>

        <div className="bg-[#FAFAFA] p-1 rounded-full flex mb-8">
          <button
            type="button"
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-3 rounded-full font-medium transition-all ${
              isLogin ? 'bg-white shadow-sm text-[#1C2B23]' : 'text-[#7B8E83]'
            }`}
            data-testid="login-tab"
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-3 rounded-full font-medium transition-all ${
              !isLogin ? 'bg-white shadow-sm text-[#1C2B23]' : 'text-[#7B8E83]'
            }`}
            data-testid="register-tab"
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 animate-fade-in">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-[#1C2B23] mb-2 ml-1">Full Name</label>
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
            <label className="block text-sm font-medium text-[#1C2B23] mb-2 ml-1">Email</label>
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
            <label className="block text-sm font-medium text-[#1C2B23] mb-2 ml-1">Password</label>
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
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#7B8E83]"
              >
                {showPassword ? <EyeSlash size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-[#1C2B23] mb-3 ml-1">I am a...</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('job_seeker')}
                  className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${
                    role === 'job_seeker'
                      ? 'border-[#A8D5BA] bg-[#A8D5BA]/10'
                      : 'border-[#E8E6DF] hover:border-[#A8D5BA]/50'
                  }`}
                  data-testid="role-job-seeker"
                >
                  <User size={28} weight={role === 'job_seeker' ? 'duotone' : 'regular'} className="text-[#70AF88]" />
                  <span className="font-medium text-[#1C2B23]">Job Seeker</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('recruiter')}
                  className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${
                    role === 'recruiter'
                      ? 'border-[#D2B48C] bg-[#D2B48C]/10'
                      : 'border-[#E8E6DF] hover:border-[#D2B48C]/50'
                  }`}
                  data-testid="role-recruiter"
                >
                  <Briefcase size={28} weight={role === 'recruiter' ? 'duotone' : 'regular'} className="text-[#B08D5E]" />
                  <span className="font-medium text-[#1C2B23]">Recruiter</span>
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
                <div className="w-5 h-5 border-2 border-[#112217]/30 border-t-[#112217] rounded-full animate-spin" />
                {isLogin ? 'Signing in...' : 'Creating account...'}
              </span>
            ) : (
              isLogin ? 'Sign In' : 'Create Account'
            )}
          </button>
        </form>

        {isLogin && (
          <p className="text-center text-[#7B8E83] text-sm mt-6">
            Demo: admin@jobswish.com / admin123
          </p>
        )}
      </div>
    </div>
  );
}
