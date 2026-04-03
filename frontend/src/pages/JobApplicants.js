import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { 
  ArrowLeft, Star, Check, X, Robot, HandWaving,
  Envelope, Briefcase, GraduationCap, Certificate, MapPin
} from '@phosphor-icons/react';
import { toast } from 'sonner';

const API = process.env.REACT_APP_BACKEND_URL;

function ApplicantCard({ applicant, onShortlist, onReject }) {
  const [expanded, setExpanded] = useState(false);
  const profile = applicant.profile || {};

  return (
    <div className="job-card p-5 mb-4" data-testid="applicant-card">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-medium text-[#1C2B23]">{applicant.name}</h3>
          <p className="text-sm text-[#4A5D53] flex items-center gap-1">
            <Envelope size={14} />
            {applicant.email}
          </p>
        </div>
        <div className="flex items-center gap-1 px-2 py-1 bg-[#A8D5BA]/20 text-[#70AF88] text-sm font-medium rounded-full">
          <Star size={14} weight="fill" />
          {applicant.match_score}%
        </div>
      </div>

      {/* Quick stats */}
      <div className="flex flex-wrap gap-2 mb-4 text-xs">
        {profile.experience?.years > 0 && (
          <span className="flex items-center gap-1 px-2 py-1 bg-[#FAFAFA] rounded-full text-[#4A5D53]">
            <Briefcase size={12} />
            {profile.experience.years} years exp
          </span>
        )}
        {profile.education?.has_bachelors && (
          <span className="flex items-center gap-1 px-2 py-1 bg-[#FAFAFA] rounded-full text-[#4A5D53]">
            <GraduationCap size={12} />
            Bachelor's
          </span>
        )}
        {profile.education?.has_masters && (
          <span className="flex items-center gap-1 px-2 py-1 bg-[#FAFAFA] rounded-full text-[#4A5D53]">
            <GraduationCap size={12} />
            Master's
          </span>
        )}
        {(profile.certifications?.length || 0) > 0 && (
          <span className="flex items-center gap-1 px-2 py-1 bg-[#FAFAFA] rounded-full text-[#4A5D53]">
            <Certificate size={12} />
            {profile.certifications.length} certs
          </span>
        )}
        {profile.location?.city && (
          <span className="flex items-center gap-1 px-2 py-1 bg-[#FAFAFA] rounded-full text-[#4A5D53]">
            <MapPin size={12} />
            {profile.location.city}
          </span>
        )}
      </div>

      {/* Expandable details */}
      {expanded && (
        <div className="border-t border-[#E8E6DF] pt-4 mb-4 space-y-3 animate-fade-in">
          {profile.skills && (
            <div>
              <p className="text-xs text-[#7B8E83] mb-1">Skills</p>
              <p className="text-sm text-[#1C2B23]">{profile.skills}</p>
            </div>
          )}
          {profile.projects && (
            <div>
              <p className="text-xs text-[#7B8E83] mb-1">Projects</p>
              <p className="text-sm text-[#1C2B23] line-clamp-3">{profile.projects}</p>
            </div>
          )}
          {profile.experience?.companies?.length > 0 && (
            <div>
              <p className="text-xs text-[#7B8E83] mb-1">Previous Companies</p>
              <div className="space-y-1">
                {profile.experience.companies.map((c, i) => (
                  <p key={i} className="text-sm text-[#1C2B23]">
                    {c.name} - {c.role}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <button
        onClick={() => setExpanded(!expanded)}
        className="text-sm text-[#70AF88] font-medium mb-4"
      >
        {expanded ? 'Show less' : 'View resume'}
      </button>

      {/* Actions */}
      {applicant.status === 'pending' && (
        <div className="flex gap-3">
          <button
            onClick={() => onShortlist(applicant.application_id)}
            className="flex-1 py-3 bg-[#A8D5BA] text-[#112217] rounded-full font-medium flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
            data-testid="shortlist-btn"
          >
            <Check size={18} weight="bold" />
            Shortlist
          </button>
          <button
            onClick={() => onReject(applicant.application_id)}
            className="flex-1 py-3 bg-[#E8A3A3]/20 text-[#E8A3A3] rounded-full font-medium flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
            data-testid="reject-applicant-btn"
          >
            <X size={18} weight="bold" />
            Reject
          </button>
        </div>
      )}

      {applicant.status === 'shortlisted' && (
        <div className="py-3 bg-[#A8D5BA]/20 text-[#70AF88] rounded-full font-medium text-center flex items-center justify-center gap-2">
          <Check size={18} weight="bold" />
          Shortlisted
        </div>
      )}
    </div>
  );
}

export default function JobApplicants() {
  const navigate = useNavigate();
  const { jobId } = useParams();
  const [job, setJob] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [shortlisted, setShortlisted] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [jobId]);

  const fetchData = async () => {
    try {
      const [jobRes, applicantsRes, shortlistRes] = await Promise.all([
        axios.get(`${API}/api/jobs/${jobId}`, { withCredentials: true }),
        axios.get(`${API}/api/jobs/${jobId}/applicants`, { withCredentials: true }),
        axios.get(`${API}/api/jobs/${jobId}/shortlist`, { withCredentials: true })
      ]);
      setJob(jobRes.data);
      setApplicants(applicantsRes.data);
      setShortlisted(shortlistRes.data);
    } catch (e) {
      toast.error('Failed to load data');
    }
    setLoading(false);
  };

  const handleShortlist = async (appId) => {
    try {
      await axios.put(`${API}/api/applications/${appId}/action`, { action: 'shortlist' }, { withCredentials: true });
      toast.success('Candidate shortlisted!');
      fetchData();
    } catch (e) {
      toast.error('Failed to shortlist');
    }
  };

  const handleReject = async (appId) => {
    try {
      await axios.put(`${API}/api/applications/${appId}/action`, { action: 'reject' }, { withCredentials: true });
      toast.success('Candidate rejected');
      fetchData();
    } catch (e) {
      toast.error('Failed to reject');
    }
  };

  const handleAIShortlist = async () => {
    try {
      const { data } = await axios.post(`${API}/api/jobs/${jobId}/ai-shortlist`, {}, { withCredentials: true });
      toast.success(data.message);
      fetchData();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'AI shortlist failed');
    }
  };

  const handleCloseJob = async () => {
    if (!window.confirm('Are you sure you want to close this job? Pending applications will be removed.')) return;
    
    try {
      await axios.post(`${API}/api/jobs/${jobId}/close`, {}, { withCredentials: true });
      toast.success('Job closed successfully');
      navigate('/');
    } catch (e) {
      toast.error('Failed to close job');
    }
  };

  const pendingApplicants = applicants.filter(a => a.status === 'pending');

  if (loading) {
    return (
      <div className="app-wrapper">
        <div className="mobile-container flex items-center justify-center">
          <div className="spinner" />
        </div>
      </div>
    );
  }

  return (
    <div className="app-wrapper">
      <div className="mobile-container">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-[#E8E6DF]">
          <div className="flex items-center gap-4 mb-3">
            <button
              onClick={() => navigate('/')}
              className="w-10 h-10 rounded-full bg-[#FAFAFA] flex items-center justify-center text-[#4A5D53]"
              data-testid="back-btn"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex-1">
              <h1 className="text-lg font-medium text-[#1C2B23]">{job?.title}</h1>
              <p className="text-sm text-[#7B8E83]">{job?.company_name}</p>
            </div>
            {!job?.is_active && (
              <span className="px-3 py-1 bg-[#E8E6DF] text-[#7B8E83] text-xs font-medium rounded-full">Closed</span>
            )}
          </div>

          {/* Tabs */}
          <div className="bg-[#FAFAFA] p-1 rounded-full flex">
            <button
              onClick={() => setActiveTab('all')}
              className={`flex-1 py-2 rounded-full text-sm font-medium transition-all ${
                activeTab === 'all' ? 'bg-white shadow-sm text-[#1C2B23]' : 'text-[#7B8E83]'
              }`}
              data-testid="all-applicants-tab"
            >
              All ({applicants.length})
            </button>
            <button
              onClick={() => setActiveTab('shortlisted')}
              className={`flex-1 py-2 rounded-full text-sm font-medium transition-all ${
                activeTab === 'shortlisted' ? 'bg-white shadow-sm text-[#1C2B23]' : 'text-[#7B8E83]'
              }`}
              data-testid="shortlisted-tab"
            >
              Shortlisted ({shortlisted.length})
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 pb-48">
          {activeTab === 'all' ? (
            applicants.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-[#FAFAFA] flex items-center justify-center mx-auto mb-4">
                  <HandWaving size={32} weight="duotone" className="text-[#7B8E83]" />
                </div>
                <h3 className="font-medium text-[#1C2B23] mb-1">No applicants yet</h3>
                <p className="text-sm text-[#7B8E83]">Wait for candidates to apply</p>
              </div>
            ) : (
              applicants.map(a => (
                <ApplicantCard 
                  key={a.application_id} 
                  applicant={a} 
                  onShortlist={handleShortlist}
                  onReject={handleReject}
                />
              ))
            )
          ) : (
            shortlisted.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-[#7B8E83]">No shortlisted candidates</p>
              </div>
            ) : (
              shortlisted.map(a => (
                <ApplicantCard 
                  key={a.application_id} 
                  applicant={{ ...a, status: 'shortlisted' }} 
                  onShortlist={handleShortlist}
                  onReject={handleReject}
                />
              ))
            )
          )}
        </div>

        {/* Action buttons */}
        {job?.is_active && (
          <div className="absolute bottom-6 left-6 right-6 space-y-3">
            <button
              onClick={handleAIShortlist}
              className="btn-primary flex items-center justify-center gap-2"
              data-testid="ai-shortlist-btn"
            >
              <Robot size={20} weight="duotone" />
              AI Shortlist Top 20%
            </button>
            <button
              onClick={handleCloseJob}
              className="btn-secondary"
              data-testid="close-job-btn"
            >
              End Offer & Close Job
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
