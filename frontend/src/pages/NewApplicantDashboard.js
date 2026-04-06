import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/SupabaseAuthContext';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import {
  Heart, X, Briefcase, ListBullets, ClipboardText,
  SignOut, CheckCircle, Star, MapPin, Money, User, Lightbulb, ArrowClockwise, Lock
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import { supabase, generateEmbedding, cosineSimilarity, generateInsights } from '../lib/supabase';

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
        <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-full bg-[#10B981] flex items-center justify-center">
          <Heart size={40} weight="fill" className="text-white" />
        </div>
      </motion.div>
      <motion.div className="swipe-overlay-left" style={{ opacity: leftOpacity }}>
        <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-full bg-[#EF4444] flex items-center justify-center">
          <X size={40} weight="bold" className="text-white" />
        </div>
      </motion.div>

      <div className="match-badge" data-testid="match-score">
        <Star size={16} weight="fill" className="text-[#10B981]" />
        {job.match_score}% Match
      </div>

      <div className="h-full flex flex-col">
        <div className="h-[30%] lg:h-[35%] bg-gradient-to-br from-[#10B981] to-[#059669] flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-4 left-4 w-32 h-32 rounded-full bg-white/30" />
            <div className="absolute bottom-4 right-4 w-24 h-24 rounded-full bg-white/20" />
          </div>
          <div className="w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
            <Briefcase size={32} weight="duotone" className="text-white md:w-10 md:h-10 lg:w-12 lg:h-12" />
          </div>
        </div>

        <div className="flex-1 p-4 md:p-6 lg:p-8 flex flex-col overflow-hidden">
          <h2 className="text-lg md:text-xl lg:text-2xl font-medium text-[#111827] mb-1">{job.title}</h2>
          <p className="text-[#6B7280] font-medium mb-2 md:mb-3">{job.company_name || 'Company'}</p>

          <div className="flex items-center gap-3 md:gap-4 text-xs md:text-sm text-[#9CA3AF] mb-3 md:mb-4">
            {job.city && (
              <span className="flex items-center gap-1">
                <MapPin size={14} weight="duotone" />
                {job.city}, {job.state}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Money size={14} weight="duotone" />
              {formatSalary(job.salary_min, job.salary_max)}
            </span>
          </div>

          <p className="text-[#6B7280] text-sm md:text-base flex-1 line-clamp-3 lg:line-clamp-4 mb-3 md:mb-4">
            {job.description || 'No description available'}
          </p>

          <div className="flex flex-wrap gap-2">
            {job.bachelor_required && (
              <span className="px-2 md:px-3 py-1 bg-[#10B981]/15 text-[#10B981] text-xs font-medium rounded-full">Bachelor's</span>
            )}
            {job.master_required && (
              <span className="px-2 md:px-3 py-1 bg-[#10B981]/15 text-[#10B981] text-xs font-medium rounded-full">Master's</span>
            )}
            {job.phd_required && (
              <span className="px-2 md:px-3 py-1 bg-[#10B981]/15 text-[#10B981] text-xs font-medium rounded-full">PhD</span>
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
          <h3 className="font-medium text-[#111827]">{job.title}</h3>
          <p className="text-sm text-[#6B7280]">{job.company_name || 'Company'}</p>
        </div>
        <div className="px-2 py-1 bg-[#10B981]/15 text-[#10B981] text-xs font-medium rounded-full flex items-center gap-1">
          <Star size={12} weight="fill" />
          {job.match_score}%
        </div>
      </div>
      <div className="flex items-center gap-3 text-xs text-[#9CA3AF] mb-3">
        {job.city && (
          <span className="flex items-center gap-1">
            <MapPin size={14} />
            {job.city}
          </span>
        )}
        <span className="flex items-center gap-1">
          <Money size={14} />
          {formatSalary(job.salary_min, job.salary_max)}
        </span>
      </div>
      <p className="text-sm text-[#6B7280] line-clamp-2 mb-4">{job.description || 'No description'}</p>
      {applied ? (
        <div className="py-3 bg-[#10B981]/15 text-[#10B981] rounded-full font-medium text-center text-sm flex items-center justify-center gap-2">
          <CheckCircle size={16} weight="bold" />
          Applied
        </div>
      ) : (
        <button
          onClick={() => onApply(job.id)}
          className="w-full py-3 bg-[#10B981] text-white rounded-full font-medium text-sm hover:bg-[#059669] transition-colors"
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
    pending: 'bg-[#F59E0B] text-white',
    shortlisted: 'bg-[#10B981] text-white',
    rejected: 'bg-[#EF4444] text-white',
  };

  return (
    <div className="job-card p-5 mb-4" data-testid="application-card">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-medium text-[#111827]">{app.job?.title || 'Job Title'}</h3>
          <p className="text-sm text-[#6B7280]">{app.job?.company_name || 'Company'}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${statusColors[app.status]}`}>
          {app.status}
        </span>
      </div>
      <p className="text-xs text-[#9CA3AF] mt-2">
        Applied: {new Date(app.created_at).toLocaleDateString()}
      </p>
      {app.match_score && (
        <div className="mt-2 flex items-center gap-1 text-sm text-[#10B981]">
          <Star size={14} weight="fill" />
          {app.match_score}% Match
        </div>
      )}
    </div>
  );
}

function InsightsView({ user, profile }) {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [rejectionCount, setRejectionCount] = useState(0);
  const [canRegenerate, setCanRegenerate] = useState(true);

  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    setLoading(true);
    try {
      // Count rejections
      const { count, error: countError } = await supabase
        .from('applications')
        .select('*', { count: 'exact', head: true })
        .eq('applicant_id', user.id)
        .eq('status', 'rejected');

      if (countError) throw countError;
      setRejectionCount(count || 0);

      // Fetch existing insights
      const { data, error } = await supabase
        .from('insights')
        .select('*')
        .eq('applicant_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (data) {
        setInsights(data);
        // Check if 24 hours have passed
        const createdAt = new Date(data.created_at);
        const hoursSince = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
        setCanRegenerate(hoursSince >= 24);
      }
    } catch (error) {
      if (error.code !== 'PGRST116') { // Not found error
        console.error('Error fetching insights:', error);
      }
    }
    setLoading(false);
  };

  const handleGenerateInsights = async () => {
    if (rejectionCount < 5) {
      toast.error('Need at least 5 rejections to unlock insights');
      return;
    }

    setGenerating(true);
    try {
      // Build profile summary
      const profileParts = [];
      if (profile?.skills) profileParts.push(`Skills: ${profile.skills}`);
      if (profile?.experience) profileParts.push(`Experience: ${profile.experience}`);
      if (profile?.education_level) profileParts.push(`Education: ${profile.education_level}`);

      const profileSummary = profileParts.join('. ');

      // Create prompt for AI
      const prompt = `You are a career advisor analyzing why a job applicant is getting rejected.

Applicant Profile:
${profileSummary}

Rejection Count: ${rejectionCount}

Provide concise, actionable insights in 3 sections:
1. Possible Reasons for Rejection (2-3 bullet points)
2. Profile Improvement Suggestions (2-3 bullet points)
3. Job Search Strategy Tips (2-3 bullet points)

Keep each bullet point under 20 words. Be specific and practical.`;

      // Generate insights using Mistral
      const insightText = await generateInsights(prompt);

      // Save to database
      const { data, error } = await supabase
        .from('insights')
        .insert([{
          applicant_id: user.id,
          content: insightText,
          rejection_count: rejectionCount
        }])
        .select()
        .single();

      if (error) throw error;

      setInsights(data);
      setCanRegenerate(false);
      toast.success('Insights generated successfully!');
    } catch (error) {
      console.error('Error generating insights:', error);
      toast.error('Failed to generate insights');
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

  // Not enough rejections
  if (rejectionCount < 5) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="w-20 h-20 rounded-full bg-[#10B981]/20 flex items-center justify-center mb-4">
          <Lock size={40} weight="duotone" className="text-[#10B981]" />
        </div>
        <h3 className="text-lg font-medium text-[#111827] mb-2">Insights Locked</h3>
        <p className="text-[#9CA3AF] mb-2">
          Get rejected from at least <span className="font-semibold text-[#111827]">5 jobs</span> to unlock AI-powered insights
        </p>
        <p className="text-sm text-[#9CA3AF]">
          Current rejections: <span className="font-semibold">{rejectionCount}</span>
        </p>
      </div>
    );
  }

  // Has cached insights
  if (insights) {
    return (
      <div className="p-6 overflow-y-auto h-full custom-scrollbar">
        <div className="job-card p-6 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb size={24} weight="duotone" className="text-[#10B981]" />
            <h3 className="text-lg font-medium text-[#111827]">AI Career Insights</h3>
          </div>

          <div className="bg-[#F9FAFB] rounded-xl p-4 mb-4 whitespace-pre-wrap text-sm text-[#6B7280] leading-relaxed">
            {insights.content}
          </div>

          <p className="text-xs text-[#9CA3AF] mb-4">
            Generated: {new Date(insights.created_at).toLocaleString()}
          </p>

          <button
            onClick={handleGenerateInsights}
            disabled={!canRegenerate || generating}
            className={`w-full py-3 rounded-full font-medium flex items-center justify-center gap-2 transition-all ${
              canRegenerate && !generating
                ? 'bg-[#10B981] text-white hover:bg-[#059669]'
                : 'bg-[#E5E7EB] text-[#9CA3AF] cursor-not-allowed'
            }`}
            data-testid="regenerate-insights-btn"
          >
            <ArrowClockwise size={18} className={generating ? 'animate-spin' : ''} />
            {generating ? 'Regenerating...' : canRegenerate ? 'Regenerate Insights' : 'Available in 24h'}
          </button>
        </div>
      </div>
    );
  }

  // No insights yet - show generate button
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <div className="w-20 h-20 rounded-full bg-[#10B981]/15 flex items-center justify-center mb-4">
        <Lightbulb size={40} weight="duotone" className="text-[#10B981]" />
      </div>
      <h3 className="text-lg font-medium text-[#111827] mb-2">Ready for Insights</h3>
      <p className="text-[#9CA3AF] mb-6 max-w-sm">
        Get AI-powered analysis on why you might be getting rejected and how to improve your profile.
      </p>
      <button
        onClick={handleGenerateInsights}
        disabled={generating}
        className="px-8 py-3 bg-[#10B981] text-white rounded-full font-medium flex items-center justify-center gap-2 hover:bg-[#059669] transition-colors disabled:opacity-60"
        data-testid="generate-insights-btn"
      >
        {generating ? (
          <>
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Lightbulb size={20} weight="duotone" />
            Generate Insights
          </>
        )}
      </button>
    </div>
  );
}

export default function NewApplicantDashboard() {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('for-you');
  const [matches, setMatches] = useState([]);
  const [allJobs, setAllJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [appliedJobIds, setAppliedJobIds] = useState(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile && profile.role === 'applicant' && activeTab !== 'insights') {
      fetchData();
    }
  }, [activeTab, profile]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'for-you') {
        await fetchMatches();
      } else if (activeTab === 'all-jobs') {
        await fetchAllJobs();
      } else if (activeTab === 'applications') {
        await fetchApplications();
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    }
    setLoading(false);
  };

  const fetchMatches = async () => {
    try {
      // Get rejected job IDs
      const { data: rejectedData } = await supabase
        .from('rejected_jobs')
        .select('job_id')
        .eq('applicant_id', user.id);

      const rejectedIds = rejectedData?.map(r => r.job_id) || [];

      // Get applied job IDs
      const { data: appliedData } = await supabase
        .from('applications')
        .select('job_id')
        .eq('applicant_id', user.id);

      const appliedIds = appliedData?.map(a => a.job_id) || [];

      // Build query for active jobs
      let query = supabase
        .from('jobs')
        .select('*')
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString());

      // Exclude rejected and applied jobs
      if ([...rejectedIds, ...appliedIds].length > 0) {
        query = query.not('id', 'in', `(${[...rejectedIds, ...appliedIds].join(',')})`);
      }

      // Filter by city if enabled
      if (profile?.show_only_city_jobs && profile?.city) {
        query = query.eq('city', profile.city);
      }

      const { data: jobs, error } = await query.limit(50);

      if (error) throw error;

      // Calculate match scores
      const jobsWithScores = await Promise.all(
        jobs.map(async (job) => {
          const matchScore = await calculateMatchScore(job);
          return { ...job, match_score: matchScore };
        })
      );

      // Sort by match score
      jobsWithScores.sort((a, b) => b.match_score - a.match_score);
      setMatches(jobsWithScores);
    } catch (error) {
      console.error('Error fetching matches:', error);
      throw error;
    }
  };

  const fetchAllJobs = async () => {
    try {
      // Get rejected job IDs
      const { data: rejectedData } = await supabase
        .from('rejected_jobs')
        .select('job_id')
        .eq('applicant_id', user.id);

      const rejectedIds = rejectedData?.map(r => r.job_id) || [];

      // Get applied job IDs for marking
      const { data: appliedData } = await supabase
        .from('applications')
        .select('job_id')
        .eq('applicant_id', user.id);

      const appliedIds = appliedData?.map(a => a.job_id) || [];
      setAppliedJobIds(new Set(appliedIds));

      // Build query
      let query = supabase
        .from('jobs')
        .select('*')
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString());

      // Exclude rejected jobs
      if (rejectedIds.length > 0) {
        query = query.not('id', 'in', `(${rejectedIds.join(',')})`);
      }

      // Filter by city if enabled
      if (profile?.show_only_city_jobs && profile?.city) {
        query = query.eq('city', profile.city);
      }

      const { data: jobs, error } = await query.limit(100);

      if (error) throw error;

      // Calculate match scores
      const jobsWithScores = await Promise.all(
        jobs.map(async (job) => {
          const matchScore = await calculateMatchScore(job);
          return { ...job, match_score: matchScore };
        })
      );

      setAllJobs(jobsWithScores);
    } catch (error) {
      console.error('Error fetching all jobs:', error);
      throw error;
    }
  };

  const fetchApplications = async () => {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          job:jobs(*)
        `)
        .eq('applicant_id', user.id)
        .neq('status', 'rejected')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setApplications(data || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
      throw error;
    }
  };

  const calculateMatchScore = async (job) => {
    try {
      // Build resume text
      const resumeParts = [];
      if (profile?.skills) resumeParts.push(`Skills: ${profile.skills}`);
      if (profile?.experience) resumeParts.push(`Experience: ${profile.experience}`);
      if (profile?.projects) resumeParts.push(`Projects: ${profile.projects}`);

      const resumeText = resumeParts.join('. ');

      // Build job text
      const jobParts = [];
      jobParts.push(`Job title: ${job.title}`);
      if (job.description) jobParts.push(`Description: ${job.description}`);
      if (job.experience_needed) jobParts.push(`Experience needed: ${job.experience_needed}`);

      const jobText = jobParts.join('. ');

      // Generate embeddings
      const [resumeEmbedding, jobEmbedding] = await Promise.all([
        generateEmbedding(resumeText),
        generateEmbedding(jobText)
      ]);

      // Calculate similarity
      const similarity = cosineSimilarity(resumeEmbedding, jobEmbedding);
      return Math.max(0, Math.min(100, Math.round(similarity * 100)));
    } catch (error) {
      console.error('Error calculating match score:', error);
      return 50; // Default score on error
    }
  };

  const handleSwipe = async (direction) => {
    const job = matches[0];
    if (!job) return;

    try {
      if (direction === 'right') {
        // Apply to job
        const matchScore = job.match_score;
        const { error } = await supabase
          .from('applications')
          .insert([{
            applicant_id: user.id,
            job_id: job.id,
            status: 'pending',
            match_score: matchScore
          }]);

        if (error) throw error;
        toast.success('Applied successfully!');
        setAppliedJobIds(prev => new Set([...prev, job.id]));
      } else {
        // Reject job
        const { error } = await supabase
          .from('rejected_jobs')
          .insert([{
            applicant_id: user.id,
            job_id: job.id
          }]);

        if (error) throw error;
      }

      // Remove from matches
      setMatches(prev => prev.slice(1));
    } catch (error) {
      console.error('Error handling swipe:', error);
      toast.error('Action failed');
    }
  };

  const handleApply = async (jobId) => {
    try {
      const job = allJobs.find(j => j.id === jobId);
      const matchScore = job?.match_score || 50;

      const { error } = await supabase
        .from('applications')
        .insert([{
          applicant_id: user.id,
          job_id: jobId,
          status: 'pending',
          match_score: matchScore
        }]);

      if (error) throw error;

      toast.success('Applied successfully!');
      setAppliedJobIds(prev => new Set([...prev, jobId]));
    } catch (error) {
      console.error('Error applying:', error);
      toast.error('Failed to apply');
    }
  };

  const currentJob = matches[0];

  // Redirect to resume builder if profile incomplete
  if (profile && (!profile.skills || profile.skills.trim().length === 0)) {
    return (
      <div className="app-wrapper">
        <div className="mobile-container">
          <div className="px-6 pt-6 pb-4 flex items-center justify-between border-b border-[#E5E7EB]">
            <div>
              <h1 className="text-xl lg:text-2xl font-medium text-[#111827]">Hi, {profile?.name?.split(' ')[0]}</h1>
              <p className="text-sm text-[#9CA3AF]">Complete your profile</p>
            </div>
            <button
              onClick={logout}
              className="w-10 h-10 rounded-full bg-[#F9FAFB] flex items-center justify-center text-[#6B7280] hover:bg-[#EF4444]/10 transition-colors"
              data-testid="logout-btn"
            >
              <SignOut size={20} />
            </button>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-24 h-24 lg:w-32 lg:h-32 rounded-full bg-[#10B981]/15 flex items-center justify-center mb-6">
              <User size={48} weight="duotone" className="text-[#10B981] lg:w-16 lg:h-16" />
            </div>
            <h2 className="text-2xl lg:text-3xl font-medium text-[#111827] mb-3">Build Your Profile</h2>
            <p className="text-[#9CA3AF] mb-8 max-w-sm lg:text-lg">
              Complete your profile with skills and experience to start seeing personalized job matches.
            </p>
            <button
              onClick={() => navigate('/resume')}
              className="px-8 py-4 bg-[#10B981] text-white rounded-full font-medium hover:bg-[#059669] transition-colors"
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
        <div className="px-6 pt-6 pb-4 flex items-center justify-between border-b border-[#E5E7EB]">
          <div>
            <h1 className="text-xl lg:text-2xl font-medium text-[#111827]">Hi, {profile?.name?.split(' ')[0]}</h1>
            <p className="text-sm text-[#9CA3AF]">Find your dream job</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/resume')}
              className="w-10 h-10 rounded-full bg-[#F9FAFB] flex items-center justify-center text-[#6B7280] hover:bg-[#10B981]/10 transition-colors"
              data-testid="profile-btn"
            >
              <User size={20} weight="duotone" />
            </button>
            <button
              onClick={logout}
              className="w-10 h-10 rounded-full bg-[#F9FAFB] flex items-center justify-center text-[#6B7280] hover:bg-[#EF4444]/10 transition-colors"
              data-testid="logout-btn"
            >
              <SignOut size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 relative overflow-hidden pb-20">
          {activeTab === 'insights' ? (
            <InsightsView user={user} profile={profile} />
          ) : loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="spinner" />
            </div>
          ) : activeTab === 'for-you' ? (
            <div className="h-full relative">
              <AnimatePresence mode="popLayout">
                {currentJob && (
                  <JobCard key={currentJob.id} job={currentJob} onSwipe={handleSwipe} />
                )}
              </AnimatePresence>

              {!currentJob && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
                  <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-full bg-[#10B981]/15 flex items-center justify-center mb-4">
                    <CheckCircle size={40} weight="duotone" className="text-[#10B981] lg:w-12 lg:h-12" />
                  </div>
                  <h3 className="text-lg lg:text-xl font-medium text-[#111827] mb-2">All caught up!</h3>
                  <p className="text-[#9CA3AF]">Check back later for new matches</p>
                </div>
              )}

              {currentJob && (
                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-6">
                  <button
                    onClick={() => handleSwipe('left')}
                    className="w-16 h-16 lg:w-20 lg:h-20 rounded-full bg-white shadow-lg flex items-center justify-center text-[#EF4444] active:scale-95 transition-transform hover:shadow-xl"
                    data-testid="reject-btn"
                  >
                    <X size={28} weight="bold" />
                  </button>
                  <button
                    onClick={() => handleSwipe('right')}
                    className="w-16 h-16 lg:w-20 lg:h-20 rounded-full bg-[#10B981] shadow-lg flex items-center justify-center text-white active:scale-95 transition-transform hover:shadow-xl hover:bg-[#059669]"
                    data-testid="apply-swipe-btn"
                  >
                    <Heart size={28} weight="fill" />
                  </button>
                </div>
              )}
            </div>
          ) : activeTab === 'all-jobs' ? (
            <div className="p-6 overflow-y-auto h-full custom-scrollbar">
              {allJobs.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-[#9CA3AF]">No jobs available</p>
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
                  <p className="text-[#9CA3AF]">No applications yet</p>
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
            onClick={() => setActiveTab('for-you')}
            className={`nav-item ${activeTab === 'for-you' ? 'active' : ''}`}
            data-testid="nav-for-you"
          >
            <Heart size={22} weight={activeTab === 'for-you' ? 'duotone' : 'regular'} />
            <span className="text-[10px] font-medium">For You</span>
          </button>
          <button
            onClick={() => setActiveTab('all-jobs')}
            className={`nav-item ${activeTab === 'all-jobs' ? 'active' : ''}`}
            data-testid="nav-all-jobs"
          >
            <ListBullets size={22} weight={activeTab === 'all-jobs' ? 'duotone' : 'regular'} />
            <span className="text-[10px] font-medium">All Jobs</span>
          </button>
          <button
            onClick={() => setActiveTab('applications')}
            className={`nav-item ${activeTab === 'applications' ? 'active' : ''}`}
            data-testid="nav-applications"
          >
            <ClipboardText size={22} weight={activeTab === 'applications' ? 'duotone' : 'regular'} />
            <span className="text-[10px] font-medium">My Applications</span>
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
