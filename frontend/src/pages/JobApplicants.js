import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { 
  ArrowLeft, Star, Check, X, Robot, HandWaving,
  Envelope, Briefcase, GraduationCap, Certificate, MapPin,
  Phone, WhatsappLogo, Code, FolderOpen
} from '@phosphor-icons/react';
import { toast } from 'sonner';

const API = process.env.REACT_APP_BACKEND_URL;

function FullResumeCard({ applicant, onShortlist, onReject, showActions = true }) {
  const profile = applicant.profile || {};
  
  const handleEmailContact = () => {
    const email = profile.email || applicant.email;
    if (email) {
      window.open(`mailto:${email}?subject=Regarding Your Job Application&body=Hi ${applicant.name},`, '_blank');
    } else {
      toast.error('No email available for this candidate');
    }
  };

  const handleWhatsAppContact = () => {
    const phone = profile.phone;
    if (phone) {
      // Remove spaces, dashes, and ensure proper format
      const cleanPhone = phone.replace(/[\s\-\(\)]/g, '').replace(/^\+/, '');
      window.open(`https://wa.me/${cleanPhone}?text=Hi ${applicant.name}, I'm reaching out regarding your job application.`, '_blank');
    } else {
      toast.error('No WhatsApp number available for this candidate');
    }
  };

  return (
    <div className="job-card p-6 mb-6" data-testid="applicant-card">
      {/* Header with name and match score */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg lg:text-xl font-medium text-[#1C2B23]">{applicant.name}</h3>
          <p className="text-sm text-[#4A5D53]">{applicant.email}</p>
        </div>
        <div className="flex items-center gap-1 px-3 py-1.5 bg-[#A8D5BA]/20 text-[#70AF88] text-sm font-semibold rounded-full">
          <Star size={16} weight="fill" />
          {applicant.match_score}% Match
        </div>
      </div>

      {/* Contact Info */}
      {(profile.email || profile.phone) && (
        <div className="bg-[#FAFAFA] rounded-2xl p-4 mb-4">
          <h4 className="text-xs uppercase tracking-wide text-[#7B8E83] font-semibold mb-3">Contact Information</h4>
          <div className="space-y-2">
            {profile.email && (
              <div className="flex items-center gap-2 text-sm text-[#4A5D53]">
                <Envelope size={16} className="text-[#70AF88]" />
                {profile.email}
              </div>
            )}
            {profile.phone && (
              <div className="flex items-center gap-2 text-sm text-[#4A5D53]">
                <Phone size={16} className="text-[#70AF88]" />
                {profile.phone}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Skills */}
      {profile.skills && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Code size={18} className="text-[#B08D5E]" />
            <h4 className="text-sm font-medium text-[#1C2B23]">Skills</h4>
          </div>
          <p className="text-sm text-[#4A5D53] bg-[#FAFAFA] rounded-xl p-3">{profile.skills}</p>
        </div>
      )}

      {/* Experience */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Briefcase size={18} className="text-[#70AF88]" />
          <h4 className="text-sm font-medium text-[#1C2B23]">Experience</h4>
        </div>
        <div className="bg-[#FAFAFA] rounded-xl p-3">
          <p className="text-sm text-[#4A5D53] mb-2">
            <span className="font-medium">{profile.experience?.years || 0} years</span> of experience
          </p>
          {profile.experience?.companies?.length > 0 && (
            <div className="space-y-2 mt-3 pt-3 border-t border-[#E8E6DF]">
              {profile.experience.companies.map((c, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-[#1C2B23] font-medium">{c.name}</span>
                  <span className="text-[#7B8E83]">{c.role}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Education */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <GraduationCap size={18} className="text-[#70AF88]" />
          <h4 className="text-sm font-medium text-[#1C2B23]">Education</h4>
        </div>
        <div className="flex flex-wrap gap-2">
          {profile.education?.has_bachelors && (
            <span className="px-3 py-1.5 bg-[#A8D5BA]/20 text-[#70AF88] text-xs font-medium rounded-full flex items-center gap-1">
              <Check size={12} weight="bold" /> Bachelor's Degree
            </span>
          )}
          {profile.education?.has_masters && (
            <span className="px-3 py-1.5 bg-[#D2B48C]/20 text-[#B08D5E] text-xs font-medium rounded-full flex items-center gap-1">
              <Check size={12} weight="bold" /> Master's Degree
            </span>
          )}
          {!profile.education?.has_bachelors && !profile.education?.has_masters && (
            <span className="text-sm text-[#7B8E83]">No degree information provided</span>
          )}
        </div>
      </div>

      {/* Certifications */}
      {(profile.certifications?.length || 0) > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Certificate size={18} className="text-[#B08D5E]" />
            <h4 className="text-sm font-medium text-[#1C2B23]">Certifications</h4>
          </div>
          <span className="px-3 py-1.5 bg-[#D2B48C]/20 text-[#B08D5E] text-xs font-medium rounded-full">
            {profile.certifications.length} certificate{profile.certifications.length > 1 ? 's' : ''} uploaded
          </span>
        </div>
      )}

      {/* Projects */}
      {profile.projects && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <FolderOpen size={18} className="text-[#70AF88]" />
            <h4 className="text-sm font-medium text-[#1C2B23]">Projects</h4>
          </div>
          <p className="text-sm text-[#4A5D53] bg-[#FAFAFA] rounded-xl p-3 whitespace-pre-wrap">{profile.projects}</p>
        </div>
      )}

      {/* Location */}
      {(profile.location?.city || profile.location?.country) && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <MapPin size={18} className="text-[#70AF88]" />
            <h4 className="text-sm font-medium text-[#1C2B23]">Location</h4>
          </div>
          <p className="text-sm text-[#4A5D53]">
            {[profile.location.city, profile.location.state, profile.location.country].filter(Boolean).join(', ')}
          </p>
        </div>
      )}

      {/* Contact Buttons */}
      <div className="flex gap-3 mb-4">
        <button
          onClick={handleEmailContact}
          className="flex-1 py-3 bg-[#FAFAFA] hover:bg-[#A8D5BA]/20 text-[#4A5D53] rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
          data-testid="email-contact-btn"
        >
          <Envelope size={20} weight="duotone" className="text-[#70AF88]" />
          Email
        </button>
        <button
          onClick={handleWhatsAppContact}
          className="flex-1 py-3 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
          data-testid="whatsapp-contact-btn"
        >
          <WhatsappLogo size={20} weight="fill" />
          WhatsApp
        </button>
      </div>

      {/* Actions */}
      {showActions && applicant.status === 'pending' && (
        <div className="flex gap-3 pt-4 border-t border-[#E8E6DF]">
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

function CompactApplicantCard({ applicant, onShortlist, onReject, onClick }) {
  const profile = applicant.profile || {};

  return (
    <div 
      className="job-card p-5 mb-4 cursor-pointer hover:shadow-lg transition-shadow"
      onClick={onClick}
      data-testid="applicant-card-compact"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-medium text-[#1C2B23]">{applicant.name}</h3>
          <p className="text-sm text-[#4A5D53]">{applicant.email}</p>
        </div>
        <div className="flex items-center gap-1 px-2 py-1 bg-[#A8D5BA]/20 text-[#70AF88] text-sm font-medium rounded-full">
          <Star size={14} weight="fill" />
          {applicant.match_score}%
        </div>
      </div>

      {/* Quick stats */}
      <div className="flex flex-wrap gap-2 mb-3 text-xs">
        {profile.experience?.years > 0 && (
          <span className="flex items-center gap-1 px-2 py-1 bg-[#FAFAFA] rounded-full text-[#4A5D53]">
            <Briefcase size={12} />
            {profile.experience.years} years
          </span>
        )}
        {profile.education?.has_bachelors && (
          <span className="flex items-center gap-1 px-2 py-1 bg-[#FAFAFA] rounded-full text-[#4A5D53]">
            <GraduationCap size={12} />
            Bachelor's
          </span>
        )}
        {profile.location?.city && (
          <span className="flex items-center gap-1 px-2 py-1 bg-[#FAFAFA] rounded-full text-[#4A5D53]">
            <MapPin size={12} />
            {profile.location.city}
          </span>
        )}
      </div>

      <p className="text-xs text-[#70AF88] font-medium">Click to view full resume →</p>

      {/* Actions */}
      {applicant.status === 'pending' && (
        <div className="flex gap-3 mt-4" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onShortlist(applicant.application_id)}
            className="flex-1 py-2.5 bg-[#A8D5BA] text-[#112217] rounded-full text-sm font-medium flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
            data-testid="shortlist-btn"
          >
            <Check size={16} weight="bold" />
            Shortlist
          </button>
          <button
            onClick={() => onReject(applicant.application_id)}
            className="flex-1 py-2.5 bg-[#E8A3A3]/20 text-[#E8A3A3] rounded-full text-sm font-medium flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
            data-testid="reject-applicant-btn"
          >
            <X size={16} weight="bold" />
            Reject
          </button>
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
  const [selectedApplicant, setSelectedApplicant] = useState(null);

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
      setSelectedApplicant(null);
      fetchData();
    } catch (e) {
      toast.error('Failed to shortlist');
    }
  };

  const handleReject = async (appId) => {
    try {
      await axios.put(`${API}/api/applications/${appId}/action`, { action: 'reject' }, { withCredentials: true });
      toast.success('Candidate rejected');
      setSelectedApplicant(null);
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

  // Show full resume view for selected applicant
  if (selectedApplicant) {
    return (
      <div className="app-wrapper">
        <div className="mobile-container">
          {/* Header */}
          <div className="px-6 pt-6 pb-4 flex items-center gap-4 border-b border-[#E8E6DF]">
            <button
              onClick={() => setSelectedApplicant(null)}
              className="w-10 h-10 rounded-full bg-[#FAFAFA] flex items-center justify-center text-[#4A5D53]"
              data-testid="back-to-list-btn"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-lg lg:text-xl font-medium text-[#1C2B23]">Candidate Resume</h1>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
            <FullResumeCard 
              applicant={selectedApplicant}
              onShortlist={handleShortlist}
              onReject={handleReject}
            />
          </div>
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
              <h1 className="text-lg lg:text-xl font-medium text-[#1C2B23]">{job?.title}</h1>
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
                <CompactApplicantCard 
                  key={a.application_id} 
                  applicant={a} 
                  onShortlist={handleShortlist}
                  onReject={handleReject}
                  onClick={() => setSelectedApplicant(a)}
                />
              ))
            )
          ) : (
            shortlisted.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-[#7B8E83]">No shortlisted candidates</p>
              </div>
            ) : (
              // Show FULL resume for shortlisted candidates
              shortlisted.map(a => (
                <FullResumeCard 
                  key={a.application_id} 
                  applicant={{ ...a, status: 'shortlisted' }} 
                  onShortlist={handleShortlist}
                  onReject={handleReject}
                  showActions={false}
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
