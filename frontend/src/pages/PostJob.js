import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft } from '@phosphor-icons/react';
import { Switch } from '../components/ui/switch';
import { toast } from 'sonner';

const API = process.env.REACT_APP_BACKEND_URL;

export default function PostJob() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [salaryMin, setSalaryMin] = useState('');
  const [salaryMax, setSalaryMax] = useState('');
  const [description, setDescription] = useState('');
  const [shortNote, setShortNote] = useState('');
  const [country, setCountry] = useState('');
  const [state, setState] = useState('');
  const [city, setCity] = useState('');

  // Requirements
  const [bachelorRequired, setBachelorRequired] = useState(false);
  const [masterRequired, setMasterRequired] = useState(false);
  const [certificationRequired, setCertificationRequired] = useState(false);
  const [requirementNotes, setRequirementNotes] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title || !companyName || !salaryMin || !salaryMax || !description || !country || !state || !city) {
      toast.error('Please fill all required fields');
      return;
    }

    if (requirementNotes.split(/\s+/).filter(Boolean).length > 500) {
      toast.error('Requirement notes must be under 500 words');
      return;
    }

    setSaving(true);
    try {
      await axios.post(`${API}/api/jobs`, {
        title,
        company_name: companyName,
        salary_min: parseInt(salaryMin),
        salary_max: parseInt(salaryMax),
        description,
        short_note: shortNote,
        country,
        state,
        city,
        requirements: {
          bachelor_required: bachelorRequired,
          master_required: masterRequired,
          certification_required: certificationRequired,
          notes: requirementNotes
        }
      }, { withCredentials: true });
      
      toast.success('Job posted successfully!');
      navigate('/');
    } catch (e) {
      console.error('Error posting job:', e);
      toast.error(e.response?.data?.detail || 'Failed to post job');
    }
    setSaving(false);
  };

  return (
    <div className="app-wrapper">
      <div className="mobile-container">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 flex items-center gap-4 border-b border-[#E8E6DF]">
          <button
            onClick={() => navigate('/')}
            className="w-10 h-10 rounded-full bg-[#FDF8F0] flex items-center justify-center text-[#4A5D53]"
            data-testid="back-btn"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl lg:text-2xl font-medium text-[#1C2B23]">Post a Job</h1>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar p-6 pb-32 space-y-5">
          <div>
            <label className="block text-sm font-medium text-[#1C2B23] mb-2 ml-1">Job Title <span className="text-[#C75050]">*</span></label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Senior Software Engineer"
              className="input-field"
              required
              data-testid="job-title-input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1C2B23] mb-2 ml-1">Company Name <span className="text-[#C75050]">*</span></label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g. Tech Corp"
              className="input-field"
              required
              data-testid="company-name-input"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#1C2B23] mb-2 ml-1">Min Salary <span className="text-[#C75050]">*</span></label>
              <input
                type="number"
                value={salaryMin}
                onChange={(e) => setSalaryMin(e.target.value)}
                placeholder="50000"
                className="input-field"
                required
                data-testid="salary-min-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1C2B23] mb-2 ml-1">Max Salary <span className="text-[#C75050]">*</span></label>
              <input
                type="number"
                value={salaryMax}
                onChange={(e) => setSalaryMax(e.target.value)}
                placeholder="100000"
                className="input-field"
                required
                data-testid="salary-max-input"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1C2B23] mb-2 ml-1">Description <span className="text-[#C75050]">*</span></label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the role and responsibilities..."
              className="input-field min-h-[120px] resize-none"
              required
              data-testid="description-input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1C2B23] mb-2 ml-1">Short Note</label>
            <input
              type="text"
              value={shortNote}
              onChange={(e) => setShortNote(e.target.value)}
              placeholder="A brief note about this position"
              className="input-field"
              data-testid="short-note-input"
            />
          </div>

          <div className="pt-4 border-t border-[#E8E6DF]">
            <h3 className="text-sm font-medium text-[#1C2B23] mb-4">Location <span className="text-[#C75050]">*</span></h3>
            <div className="space-y-4">
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="Country"
                className="input-field"
                required
                data-testid="job-country-input"
              />
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="State"
                className="input-field"
                required
                data-testid="job-state-input"
              />
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="City"
                className="input-field"
                required
                data-testid="job-city-input"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-[#E8E6DF]">
            <h3 className="text-sm font-medium text-[#1C2B23] mb-4">Requirements</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-[#FDF8F0] rounded-2xl">
                <span className="text-[#1C2B23]">Bachelor's Required</span>
                <Switch 
                  checked={bachelorRequired} 
                  onCheckedChange={setBachelorRequired}
                  data-testid="bachelor-required-toggle"
                />
              </div>
              <div className="flex items-center justify-between p-4 bg-[#FDF8F0] rounded-2xl">
                <span className="text-[#1C2B23]">Master's Required</span>
                <Switch 
                  checked={masterRequired} 
                  onCheckedChange={setMasterRequired}
                  data-testid="master-required-toggle"
                />
              </div>
              <div className="flex items-center justify-between p-4 bg-[#FDF8F0] rounded-2xl">
                <span className="text-[#1C2B23]">Certification Required</span>
                <Switch 
                  checked={certificationRequired} 
                  onCheckedChange={setCertificationRequired}
                  data-testid="cert-required-toggle"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1C2B23] mb-2 ml-1">
                  Requirement Notes <span className="text-[#7B8E83]">(max 500 words)</span>
                </label>
                <textarea
                  value={requirementNotes}
                  onChange={(e) => setRequirementNotes(e.target.value)}
                  placeholder="Additional requirements or qualifications..."
                  className="input-field min-h-[100px] resize-none"
                  data-testid="requirement-notes-input"
                />
                <p className="text-xs text-[#7B8E83] mt-1 ml-1">{requirementNotes.split(/\s+/).filter(Boolean).length}/500 words</p>
              </div>
            </div>
          </div>
        </form>

        {/* Submit button */}
        <div className="absolute bottom-6 left-6 right-6">
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={saving}
            className="w-full py-4 bg-[#2D5A3D] text-white rounded-full font-medium hover:bg-[#244A32] transition-colors disabled:opacity-60"
            data-testid="submit-job-btn"
          >
            {saving ? 'Posting...' : 'Post Job'}
          </button>
        </div>
      </div>
    </div>
  );
}
