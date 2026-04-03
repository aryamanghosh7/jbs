import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { 
  Heart, X, Briefcase, ListBullets, ClipboardText, 
  User, MapPin, Money, Star, SignOut, CheckCircle, NotePencil,
  Lightbulb, ArrowClockwise, Lock
} from '@phosphor-icons/react';
import { toast } from 'sonner';

const API = process.env.REACT_APP_BACKEND_URL;

function isProfileComplete(profile) {
  if (!profile) return false;
  return profile.skills && profile.skills.trim().length > 0;
}

function JobCard({ job, onSwipe }) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const rightOpacity = useTransform(x, [0, 100], [0, 1]);
  const leftOpacity = useTransform(x, [-100, 0], [1, 0]);

  const handleDragEnd = (_, info) => {
    if (info.offset.x > 100) {
      onSwipe('right');
    } else if (info.offset.x < -100) {
      onSwipe('left');
    }
  };

  const formatSalary = (min, max) => {
    const format = (n) => n >= 1000 ? `${(n/1000).toFixed(0)}k` : n;
    return `$${format(min)} - $${format(max)}`;
  };

  return (
    <motion.div
      className="absolute inset-4 md:inset-6 lg:inset-8 job-card cursor-grab active:cursor-grabbing"
      style={{ x, rotate }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.9}
      onDragEnd={handleDragEnd}
      exit={{ x: x.get() > 0 ? 500 : -500, opacity: 0, transition: { duration: 0.3 } }}
      data-testid="job-card"
    >
      <motion.div className="swipe-overlay-right" style={{ opacity: rightOpacity }}>
        <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-full bg-[#2D5A3D] flex items-center justify-center">
          <Heart size={40} weight="fill" className="text-white" />
        </div>
      </motion.div>
      <motion.div className="swipe-overlay-left" style={{ opacity: leftOpacity }}>
        <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-full bg-[#C75050] flex items-center justify-center">
          <X size={40} weight="bold" className="text-white" />
        </div>
      </motion.div>

      <div className="match-badge" data-testid="match-score">
        <Star size={16} weight="fill" className="text-[#2D5A3D]" />
        {job.match_score}% Match
      </div>

      <div className="h-full flex flex-col">
        <div className="h-[30%] lg:h-[35%] bg-gradient-to-br from-[#2D5A3D] to-[#1B3926] flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-4 left-4 w-32 h-32 rounded-full bg-white/30" />
            <div className="absolute bottom-4 right-4 w-24 h-24 rounded-full bg-white/20" />
          </div>
          <div className="w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
            <Briefcase size={32} weight="duotone" className="text-white md:w-10 md:h-10 lg:w-12 lg:h-12" />
          </div>
        </div>

        <div className="flex-1 p-4 md:p-6 lg:p-8 flex flex-col overflow-hidden">
          <h2 className="text-lg md:text-xl lg:text-2xl font-medium text-[#1C2B23] mb-1">{job.title}</h2>
          <p className="text-[#4A5D53] font-medium mb-2 md:mb-3">{job.company_name}</p>

          <div className="flex items-center gap-3 md:gap-4 text-xs md:text-sm text-[#7B8E83] mb-3 md:mb-4">
            <span className="flex items-center gap-1">
              <MapPin size={14} weight="duotone" />
              {job.city}, {job.state}
            </span>
            <span className="flex items-center gap-1">
              <Money size={14} weight="duotone" />
              {formatSalary(job.salary_min, job.salary_max)}
            </span>
          </div>

          <p className="text-[#4A5D53] text-sm md:text-base flex-1 line-clamp-3 lg:line-clamp-4 mb-3 md:mb-4">{job.description}</p>

          <div className="flex flex-wrap gap-2">
            {job.requirements?.bachelor_required && (
              <span className="px-2 md:px-3 py-1 bg-[#2D5A3D]/15 text-[#2D5A3D] text-xs font-medium rounded-full">Bachelor's</span>
            )}
            {job.requirements?.master_required && (
              <span className="px-2 md:px-3 py-1 bg-[#D2B48C]/20 text-[#B08D5E] text-xs font-medium rounded-full">Master's</span>
            )}
            {job.requirements?.certification_required && (
              <span className="px-2 md:px-3 py-1 bg-[#2D5A3D]/15 text-[#2D5A3D] text-xs font-medium rounded-full">Certification</span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function AllJobsCard({ job, onApply, applied }) {
  const formatSalary = (min, max) => {
    const format = (n) => n >= 1000 ? `${(n/1000).toFixed(0)}k` : n;
    return `$${format(min)} - $${format(max)}`;
  };

  return (
    <div className="job-card p-5 mb-4" data-testid="all-jobs-card">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-medium text-[#1C2B23]">{job.title}</h3>
          <p className="text-sm text-[#4A5D53]">{job.company_name}</p>
        </div>
        <div className="px-2 py-1 bg-[#2D5A3D]/15 text-[#2D5A3D] text-xs font-medium rounded-full flex items-center gap-1">
          <Star size={12} weight="fill" />
          {job.match_score}%
        </div>
      </div>
      <div className="flex items-center gap-3 text-xs text-[#7B8E83] mb-3">
        <span className="flex items-center gap-1">
          <MapPin size={14} />
          {job.city}
        </span>
        <span className="flex items-center gap-1">
          <Money size={14} />
          {formatSalary(job.salary_min, job.salary_max)}
        </span>
      </div>
      <p className="text-sm text-[#4A5D53] line-clamp-2 mb-4">{job.description}</p>
      {applied ? (
        <div className="py-3 bg-[#2D5A3D]/15 text-[#2D5A3D] rounded-full font-medium text-center text-sm flex items-center justify-center gap-2">
          <CheckCircle size={16} weight="bold" />
          Applied
        </div>
      ) : (
        <button
          onClick={() => onApply(job.id)}
          className="w-full py-3 bg-[#2D5A3D] text-white rounded-full font-medium text-sm hover:bg-[#244A32] transition-colors"
          data-testid="apply-btn"
        >
          Apply Now
        </button>
      )}
    </div>
  );
}

function ApplicationCard({ app }) {
  const statusColors = {
    pending: 'bg-[#D2B48C] text-[#2D1D09]',
    shortlisted: 'bg-[#2D5A3D] text-white',
    rejected: 'bg-[#C75050] text-white',
  };

  return (
    <div className="job-card p-5 mb-4" data-testid="application-card">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-medium text-[#1C2B23]">{app.title}</h3>
          <p className="text-sm text-[#4A5D53]">{app.company_name}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${statusColors[app.status]}`}>
          {app.status}
        </span>
      </div>
      <p className="text-xs text-[#7B8E83] mt-2">
        Applied: {new Date(app.applied_at).toLocaleDateString()}
      </p>
    </div>
  );
}

function InsightsTab() {
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API}/api/insights/status`, { withCredentials: true });
      setStatus(data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const { data } = await axios.post(`${API}/api/insights/generate`, {}, { withCredentials: true });
      setStatus(prev => ({
        ...prev,
        has_cached: true,
        cached_insight: data.insight,
        generated_at: data.generated_at,
        can_regenerate: false
      }));
      toast.success(data.from_cache ? 'Loaded cached insights' : 'Insights generated!');
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to generate insights');
    }
    setGenerating(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="spinner" />
      </div>
    );
  }

  if (!status?.eligible) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="w-20 h-20 rounded-full bg-[#D2B48C]/20 flex items-center justify-center mb-4">
          <Lock size={40} weight="duotone" className="text-[#B08D5E]" />
        </div>
        <h3 className="text-lg font-medium text-[#1C2B23] mb-2">Insights Locked</h3>
        <p className="text-[#7B8E83] mb-2">
          Get rejected from at least <span className="font-semibold text-[#1C2B23]">5 jobs</span> to unlock insights
        </p>
        <p className="text-sm text-[#7B8E83]">
          Current rejections: <span className="font-semibold">{status?.rejection_count || 0}</span>
        </p>
      </div>
    );
  }

  if (status?.has_cached && status?.cached_insight) {
    return (
      <div className="p-6 overflow-y-auto h-full custom-scrollbar">
        <div className="job-card p-6 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb size={24} weight="duotone" className="text-[#2D5A3D]" />
            <h3 className="text-lg font-medium text-[#1C2B23]">Your Rejection Insights</h3>
          </div>
          
          <div className="bg-[#FDF8F0] rounded-xl p-4 mb-4 whitespace-pre-wrap text-sm text-[#4A5D53] leading-relaxed">
            {status.cached_insight}
          </div>

          {status.generated_at && (
            <p className="text-xs text-[#7B8E83] mb-4">
              Generated: {new Date(status.generated_at).toLocaleString()}
            </p>
          )}

          <button
            onClick={handleGenerate}
            disabled={!status.can_regenerate || generating}
            className={`w-full py-3 rounded-full font-medium flex items-center justify-center gap-2 transition-all ${
              status.can_regenerate && !generating
                ? 'bg-[#2D5A3D] text-white hover:bg-[#244A32]'
                : 'bg-[#E8E6DF] text-[#7B8E83] cursor-not-allowed'
            }`}
            data-testid="regenerate-insights-btn"
          >
            <ArrowClockwise size={18} className={generating ? 'animate-spin' : ''} />
            {generating ? 'Regenerating...' : status.can_regenerate ? 'Regenerate Insights' : 'Available in 24h'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <div className="w-20 h-20 rounded-full bg-[#2D5A3D]/15 flex items-center justify-center mb-4">
        <Lightbulb size={40} weight="duotone" className="text-[#2D5A3D]" />
      </div>
      <h3 className="text-lg font-medium text-[#1C2B23] mb-2">Ready for Insights</h3>
      <p className="text-[#7B8E83] mb-6 max-w-sm">
        Discover why you might be getting rejected and how to improve your profile based on AI analysis.
      </p>
      <button
        onClick={handleGenerate}
        disabled={generating}
        className="px-8 py-3 bg-[#2D5A3D] text-white rounded-full font-medium flex items-center justify-center gap-2 hover:bg-[#244A32] transition-colors disabled:opacity-60"
        data-testid="analyze-profile-btn"
      >
        {generating ? (
          <>
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Analyzing...
          </>
        ) : (
          <>
            <Lightbulb size={20} weight="duotone" />
            Analyze My Profile
          </>
        )}
      </button>
    </div>
  );
}

export default function JobSeekerHome() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('matches');
  const [matches, setMatches] = useState([]);
  const [allJobs, setAllJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [profileChecked, setProfileChecked] = useState(false);
  const [appliedJobIds, setAppliedJobIds] = useState(new Set());

  useEffect(() => {
    checkProfile();
  }, []);

  useEffect(() => {
    if (profileChecked && isProfileComplete(profile) && activeTab !== 'insights') {
      fetchData();
    }
  }, [activeTab, profileChecked, profile]);

  const checkProfile = async () => {
    try {
      const { data } = await axios.get(`${API}/api/profile`, { withCredentials: true });
      setProfile(data);
    } catch (e) {
      console.error(e);
    }
    setProfileChecked(true);
    setLoading(false);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'matches') {
        const { data } = await axios.get(`${API}/api/matches`, { withCredentials: true });
        setMatches(data);
      } else if (activeTab === 'all') {
        const [jobsRes, appsRes] = await Promise.all([
          axios.get(`${API}/api/alljobs`, { withCredentials: true }),
          axios.get(`${API}/api/applications`, { withCredentials: true })
        ]);
        setAllJobs(jobsRes.data);
        setAppliedJobIds(new Set(appsRes.data.map(a => a.job_id)));
      } else if (activeTab === 'applications') {
        const { data } = await axios.get(`${API}/api/applications`, { withCredentials: true });
        setApplications(data);
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to load data');
    }
    setLoading(false);
  };

  const handleSwipe = async (direction) => {
    const job = matches[0];
    if (!job) return;

    try {
      if (direction === 'right') {
        await axios.post(`${API}/api/applications/${job.id}`, {}, { withCredentials: true });
        toast.success('Applied successfully!');
        setAppliedJobIds(prev => new Set([...prev, job.id]));
      } else {
        await axios.post(`${API}/api/reject/${job.id}`, {}, { withCredentials: true });
      }
      setMatches(prev => prev.slice(1));
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Action failed');
    }
  };

  const handleApply = async (jobId) => {
    try {
      await axios.post(`${API}/api/applications/${jobId}`, {}, { withCredentials: true });
      toast.success('Applied successfully!');
      setAppliedJobIds(prev => new Set([...prev, jobId]));
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to apply');
    }
  };

  const currentJob = matches[0];

  if (!profileChecked) {
    return (
      <div className="app-wrapper">
        <div className="mobile-container flex items-center justify-center">
          <div className="spinner" />
        </div>
      </div>
    );
  }

  if (!isProfileComplete(profile)) {
    return (
      <div className="app-wrapper">
        <div className="mobile-container">
          <div className="px-6 pt-6 pb-4 flex items-center justify-between border-b border-[#E8E6DF]">
            <div>
              <h1 className="text-xl lg:text-2xl font-medium text-[#1C2B23]">Hi, {user?.name?.split(' ')[0]}</h1>
              <p className="text-sm text-[#7B8E83]">Complete your profile</p>
            </div>
            <button
              onClick={logout}
              className="w-10 h-10 rounded-full bg-[#FDF8F0] flex items-center justify-center text-[#4A5D53] hover:bg-[#C75050]/10 transition-colors"
              data-testid="logout-btn"
            >
              <SignOut size={20} />
            </button>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-24 h-24 lg:w-32 lg:h-32 rounded-full bg-[#2D5A3D]/15 flex items-center justify-center mb-6">
              <NotePencil size={48} weight="duotone" className="text-[#2D5A3D] lg:w-16 lg:h-16" />
            </div>
            <h2 className="text-2xl lg:text-3xl font-medium text-[#1C2B23] mb-3">Build Your Resume</h2>
            <p className="text-[#7B8E83] mb-8 max-w-sm lg:text-lg">
              Complete your profile with skills and experience to start seeing personalized job matches.
            </p>
            <button
              onClick={() => navigate('/resume')}
              className="px-8 py-4 bg-[#2D5A3D] text-white rounded-full font-medium hover:bg-[#244A32] transition-colors"
              data-testid="complete-profile-btn"
            >
              Complete Profile
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-wrapper">
      <div className="mobile-container">
        <div className="px-6 pt-6 pb-4 flex items-center justify-between border-b border-[#E8E6DF]">
          <div>
            <h1 className="text-xl lg:text-2xl font-medium text-[#1C2B23]">Hi, {user?.name?.split(' ')[0]}</h1>
            <p className="text-sm text-[#7B8E83]">Find your dream job</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/resume')}
              className="w-10 h-10 rounded-full bg-[#FDF8F0] flex items-center justify-center text-[#4A5D53] hover:bg-[#2D5A3D]/10 transition-colors"
              data-testid="profile-btn"
            >
              <User size={20} weight="duotone" />
            </button>
            <button
              onClick={logout}
              className="w-10 h-10 rounded-full bg-[#FDF8F0] flex items-center justify-center text-[#4A5D53] hover:bg-[#C75050]/10 transition-colors"
              data-testid="logout-btn"
            >
              <SignOut size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 relative overflow-hidden pb-20">
          {activeTab === 'insights' ? (
            <InsightsTab />
          ) : loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="spinner" />
            </div>
          ) : activeTab === 'matches' ? (
            <div className="h-full relative">
              <AnimatePresence mode="popLayout">
                {currentJob && (
                  <JobCard key={currentJob.id} job={currentJob} onSwipe={handleSwipe} />
                )}
              </AnimatePresence>
              
              {!currentJob && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
                  <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-full bg-[#2D5A3D]/15 flex items-center justify-center mb-4">
                    <CheckCircle size={40} weight="duotone" className="text-[#2D5A3D] lg:w-12 lg:h-12" />
                  </div>
                  <h3 className="text-lg lg:text-xl font-medium text-[#1C2B23] mb-2">All caught up!</h3>
                  <p className="text-[#7B8E83]">Check back later for new matches</p>
                </div>
              )}

              {currentJob && (
                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-6">
                  <button
                    onClick={() => handleSwipe('left')}
                    className="w-16 h-16 lg:w-20 lg:h-20 rounded-full bg-white shadow-lg flex items-center justify-center text-[#C75050] active:scale-95 transition-transform hover:shadow-xl"
                    data-testid="reject-btn"
                  >
                    <X size={28} weight="bold" />
                  </button>
                  <button
                    onClick={() => handleSwipe('right')}
                    className="w-16 h-16 lg:w-20 lg:h-20 rounded-full bg-[#2D5A3D] shadow-lg flex items-center justify-center text-white active:scale-95 transition-transform hover:shadow-xl hover:bg-[#244A32]"
                    data-testid="apply-swipe-btn"
                  >
                    <Heart size={28} weight="fill" />
                  </button>
                </div>
              )}
            </div>
          ) : activeTab === 'all' ? (
            <div className="p-6 overflow-y-auto h-full custom-scrollbar">
              {allJobs.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-[#7B8E83]">No jobs available</p>
                </div>
              ) : (
                allJobs.map(job => (
                  <AllJobsCard 
                    key={job.id} 
                    job={job} 
                    onApply={handleApply} 
                    applied={appliedJobIds.has(job.id)}
                  />
                ))
              )}
            </div>
          ) : (
            <div className="p-6 overflow-y-auto h-full custom-scrollbar">
              {applications.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-[#7B8E83]">No applications yet</p>
                </div>
              ) : (
                applications.map(app => (
                  <ApplicationCard key={app.id} app={app} />
                ))
              )}
            </div>
          )}
        </div>

        <div className="bottom-nav">
          <button
            onClick={() => setActiveTab('matches')}
            className={`nav-item ${activeTab === 'matches' ? 'active' : ''}`}
            data-testid="nav-matches"
          >
            <Heart size={22} weight={activeTab === 'matches' ? 'duotone' : 'regular'} />
            <span className="text-[10px] font-medium">Matches</span>
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`nav-item ${activeTab === 'all' ? 'active' : ''}`}
            data-testid="nav-all-jobs"
          >
            <ListBullets size={22} weight={activeTab === 'all' ? 'duotone' : 'regular'} />
            <span className="text-[10px] font-medium">All Jobs</span>
          </button>
          <button
            onClick={() => setActiveTab('applications')}
            className={`nav-item ${activeTab === 'applications' ? 'active' : ''}`}
            data-testid="nav-applications"
          >
            <ClipboardText size={22} weight={activeTab === 'applications' ? 'duotone' : 'regular'} />
            <span className="text-[10px] font-medium">Applied</span>
          </button>
          <button
            onClick={() => setActiveTab('insights')}
            className={`nav-item ${activeTab === 'insights' ? 'active' : ''}`}
            data-testid="nav-insights"
          >
            <Lightbulb size={22} weight={activeTab === 'insights' ? 'duotone' : 'regular'} />
            <span className="text-[10px] font-medium">Insights</span>
          </button>
        </div>
      </div>
    </div>
  );
}
