import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { 
  Briefcase, Plus, Users, SignOut, CheckCircle, XCircle 
} from '@phosphor-icons/react';
import { toast } from 'sonner';

const API = process.env.REACT_APP_BACKEND_URL;

function JobCard({ job, onClick }) {
  return (
    <div 
      className="job-card p-5 mb-4 cursor-pointer hover:shadow-lg transition-shadow"
      onClick={onClick}
      data-testid="recruiter-job-card"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-medium text-[#1C2B23]">{job.title}</h3>
          <p className="text-sm text-[#4A5D53]">{job.company_name}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
          job.is_active ? 'bg-[#A8D5BA]/20 text-[#70AF88]' : 'bg-[#E8E6DF] text-[#7B8E83]'
        }`}>
          {job.is_active ? 'Active' : 'Closed'}
        </span>
      </div>
      <div className="flex items-center gap-2 text-sm text-[#7B8E83]">
        <Users size={16} />
        <span>{job.applicant_count} applicant{job.applicant_count !== 1 ? 's' : ''}</span>
      </div>
    </div>
  );
}

export default function RecruiterHome() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const { data } = await axios.get(`${API}/api/jobs/recruiter`, { withCredentials: true });
      setJobs(data);
    } catch (e) {
      toast.error('Failed to load jobs');
    }
    setLoading(false);
  };

  const activeJobs = jobs.filter(j => j.is_active);
  const closedJobs = jobs.filter(j => !j.is_active);

  return (
    <div className="app-wrapper">
      <div className="mobile-container">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 flex items-center justify-between border-b border-[#E8E6DF]">
          <div>
            <h1 className="text-xl font-medium text-[#1C2B23]">Hi, {user?.name?.split(' ')[0]}</h1>
            <p className="text-sm text-[#7B8E83]">Recruiter Dashboard</p>
          </div>
          <button
            onClick={logout}
            className="w-10 h-10 rounded-full bg-[#FAFAFA] flex items-center justify-center text-[#4A5D53] hover:bg-[#E8A3A3]/20 transition-colors"
            data-testid="logout-btn"
          >
            <SignOut size={20} />
          </button>
        </div>

        {/* Stats */}
        <div className="px-6 py-4 grid grid-cols-2 gap-4">
          <div className="bg-[#A8D5BA]/10 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle size={20} weight="duotone" className="text-[#70AF88]" />
              <span className="text-sm text-[#4A5D53]">Active Jobs</span>
            </div>
            <p className="text-2xl font-medium text-[#1C2B23]">{activeJobs.length}</p>
          </div>
          <div className="bg-[#D2B48C]/10 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <XCircle size={20} weight="duotone" className="text-[#B08D5E]" />
              <span className="text-sm text-[#4A5D53]">Closed Jobs</span>
            </div>
            <p className="text-2xl font-medium text-[#1C2B23]">{closedJobs.length}</p>
          </div>
        </div>

        {/* Jobs list */}
        <div className="flex-1 px-6 overflow-y-auto custom-scrollbar pb-24">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="spinner" />
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-[#FAFAFA] flex items-center justify-center mx-auto mb-4">
                <Briefcase size={32} weight="duotone" className="text-[#7B8E83]" />
              </div>
              <h3 className="font-medium text-[#1C2B23] mb-1">No jobs posted yet</h3>
              <p className="text-sm text-[#7B8E83]">Create your first job posting</p>
            </div>
          ) : (
            <>
              {activeJobs.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-sm font-medium text-[#7B8E83] uppercase tracking-wide mb-3">Active Jobs</h2>
                  {activeJobs.map(job => (
                    <JobCard key={job.id} job={job} onClick={() => navigate(`/job/${job.id}/applicants`)} />
                  ))}
                </div>
              )}
              {closedJobs.length > 0 && (
                <div>
                  <h2 className="text-sm font-medium text-[#7B8E83] uppercase tracking-wide mb-3">Closed Jobs</h2>
                  {closedJobs.map(job => (
                    <JobCard key={job.id} job={job} onClick={() => navigate(`/job/${job.id}/applicants`)} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Post job button */}
        <div className="absolute bottom-6 left-6 right-6">
          <button
            onClick={() => navigate('/post-job')}
            className="btn-primary flex items-center justify-center gap-2"
            data-testid="post-job-btn"
          >
            <Plus size={20} weight="bold" />
            Post New Job
          </button>
        </div>
      </div>
    </div>
  );
}
