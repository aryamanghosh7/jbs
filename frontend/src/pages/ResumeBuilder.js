import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  ArrowLeft, GraduationCap, Certificate, Briefcase, 
  MapPin, Code, Plus, X, Upload, Check, Phone, Envelope
} from '@phosphor-icons/react';
import { Switch } from '../components/ui/switch';
import { toast } from 'sonner';

const API = process.env.REACT_APP_BACKEND_URL;

export default function ResumeBuilder() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Contact Info
  const [contactEmail, setContactEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Education
  const [hasBachelors, setHasBachelors] = useState(false);
  const [bachelorsDocs, setBachelorsDocs] = useState(null);
  const [hasMasters, setHasMasters] = useState(false);
  const [mastersDocs, setMastersDocs] = useState(null);

  // Certifications
  const [certifications, setCertifications] = useState([]);

  // Experience
  const [yearsExp, setYearsExp] = useState(0);
  const [companies, setCompanies] = useState([]);

  // Skills & Projects
  const [skills, setSkills] = useState('');
  const [projects, setProjects] = useState('');

  // Location
  const [country, setCountry] = useState('');
  const [state, setState] = useState('');
  const [city, setCity] = useState('');
  const [showOnlyCityJobs, setShowOnlyCityJobs] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data } = await axios.get(`${API}/api/profile`, { withCredentials: true });
      if (data) {
        setContactEmail(data.email || '');
        setPhone(data.phone || '');
        setHasBachelors(data.education?.has_bachelors || false);
        setBachelorsDocs(data.education?.bachelors_doc || null);
        setHasMasters(data.education?.has_masters || false);
        setMastersDocs(data.education?.masters_doc || null);
        setCertifications(data.certifications || []);
        setYearsExp(data.experience?.years || 0);
        setCompanies(data.experience?.companies || []);
        setSkills(data.skills || '');
        setProjects(data.projects || '');
        setCountry(data.location?.country || '');
        setState(data.location?.state || '');
        setCity(data.location?.city || '');
        setShowOnlyCityJobs(data.location?.show_only_city_jobs || false);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleFileUpload = (e, setter) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be under 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setter(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const addCertification = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be under 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setCertifications(prev => [...prev, event.target.result]);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeCertification = (index) => {
    setCertifications(prev => prev.filter((_, i) => i !== index));
  };

  const addCompany = () => {
    setCompanies(prev => [...prev, { name: '', role: '' }]);
  };

  const updateCompany = (index, field, value) => {
    setCompanies(prev => prev.map((c, i) => i === index ? { ...c, [field]: value } : c));
  };

  const removeCompany = (index) => {
    setCompanies(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!contactEmail || !phone) {
      toast.error('Please fill in your email and phone number');
      return;
    }
    if (!skills.trim()) {
      toast.error('Please add your skills for better job matching');
      return;
    }

    setSaving(true);
    try {
      await axios.put(`${API}/api/profile`, {
        email: contactEmail,
        phone,
        education: {
          has_bachelors: hasBachelors,
          bachelors_doc: bachelorsDocs,
          has_masters: hasMasters,
          masters_doc: mastersDocs
        },
        certifications,
        experience: {
          years: yearsExp,
          companies
        },
        skills,
        projects,
        location: {
          country,
          state,
          city,
          show_only_city_jobs: showOnlyCityJobs
        }
      }, { withCredentials: true });
      toast.success('Profile saved successfully!');
      navigate('/');
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to save profile');
    }
    setSaving(false);
  };

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
        <div className="px-6 pt-6 pb-4 flex items-center gap-4 border-b border-[#E8E6DF]">
          <button
            onClick={() => navigate('/')}
            className="w-10 h-10 rounded-full bg-[#FAFAFA] flex items-center justify-center text-[#4A5D53]"
            data-testid="back-btn"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl lg:text-2xl font-medium text-[#1C2B23]">Build Resume</h1>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 pb-32 space-y-8">
          {/* Contact Information Section */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Phone size={24} weight="duotone" className="text-[#70AF88]" />
              <h2 className="text-lg font-medium text-[#1C2B23]">Contact Information</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1C2B23] mb-2 ml-1">
                  Email Address *
                </label>
                <div className="relative">
                  <Envelope size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7B8E83]" />
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="your.email@example.com"
                    className="input-field pl-12"
                    required
                    data-testid="contact-email-input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1C2B23] mb-2 ml-1">
                  Phone / WhatsApp Number *
                </label>
                <div className="relative">
                  <Phone size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7B8E83]" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 234 567 8900"
                    className="input-field pl-12"
                    required
                    data-testid="phone-input"
                  />
                </div>
                <p className="text-xs text-[#7B8E83] mt-1 ml-1">Include country code for WhatsApp</p>
              </div>
            </div>
          </section>

          {/* Education Section */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <GraduationCap size={24} weight="duotone" className="text-[#70AF88]" />
              <h2 className="text-lg font-medium text-[#1C2B23]">Education</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-[#FAFAFA] rounded-2xl">
                <span className="text-[#1C2B23]">Bachelor's Degree</span>
                <Switch 
                  checked={hasBachelors} 
                  onCheckedChange={setHasBachelors}
                  data-testid="bachelors-toggle"
                />
              </div>
              {hasBachelors && (
                <div className="ml-4">
                  <label className="block text-sm text-[#7B8E83] mb-2">Upload certificate (optional)</label>
                  <input
                    type="file"
                    accept="image/jpeg,image/png"
                    onChange={(e) => handleFileUpload(e, setBachelorsDocs)}
                    className="hidden"
                    id="bachelors-upload"
                  />
                  <label
                    htmlFor="bachelors-upload"
                    className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-[#E8E6DF] rounded-xl cursor-pointer hover:border-[#A8D5BA] transition-colors"
                  >
                    {bachelorsDocs ? (
                      <span className="text-[#70AF88] flex items-center gap-2"><Check size={16} /> Uploaded</span>
                    ) : (
                      <span className="text-[#7B8E83] flex items-center gap-2"><Upload size={16} /> Upload JPEG</span>
                    )}
                  </label>
                </div>
              )}

              <div className="flex items-center justify-between p-4 bg-[#FAFAFA] rounded-2xl">
                <span className="text-[#1C2B23]">Master's Degree</span>
                <Switch 
                  checked={hasMasters} 
                  onCheckedChange={setHasMasters}
                  data-testid="masters-toggle"
                />
              </div>
              {hasMasters && (
                <div className="ml-4">
                  <label className="block text-sm text-[#7B8E83] mb-2">Upload certificate (optional)</label>
                  <input
                    type="file"
                    accept="image/jpeg,image/png"
                    onChange={(e) => handleFileUpload(e, setMastersDocs)}
                    className="hidden"
                    id="masters-upload"
                  />
                  <label
                    htmlFor="masters-upload"
                    className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-[#E8E6DF] rounded-xl cursor-pointer hover:border-[#A8D5BA] transition-colors"
                  >
                    {mastersDocs ? (
                      <span className="text-[#70AF88] flex items-center gap-2"><Check size={16} /> Uploaded</span>
                    ) : (
                      <span className="text-[#7B8E83] flex items-center gap-2"><Upload size={16} /> Upload JPEG</span>
                    )}
                  </label>
                </div>
              )}
            </div>
          </section>

          {/* Certifications Section */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Certificate size={24} weight="duotone" className="text-[#B08D5E]" />
              <h2 className="text-lg font-medium text-[#1C2B23]">Certifications</h2>
            </div>

            <div className="space-y-3">
              {certifications.map((cert, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-[#FAFAFA] rounded-xl">
                  <span className="text-sm text-[#4A5D53]">Certificate {index + 1}</span>
                  <button
                    onClick={() => removeCertification(index)}
                    className="w-8 h-8 rounded-full bg-[#E8A3A3]/20 flex items-center justify-center text-[#E8A3A3]"
                    data-testid={`remove-cert-${index}`}
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
              <input
                type="file"
                accept="image/jpeg,image/png"
                onChange={addCertification}
                className="hidden"
                id="cert-upload"
              />
              <label
                htmlFor="cert-upload"
                className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-[#E8E6DF] rounded-xl cursor-pointer hover:border-[#A8D5BA] transition-colors"
                data-testid="add-cert-btn"
              >
                <Plus size={20} className="text-[#7B8E83]" />
                <span className="text-[#7B8E83]">Add Certification</span>
              </label>
            </div>
          </section>

          {/* Experience Section */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Briefcase size={24} weight="duotone" className="text-[#70AF88]" />
              <h2 className="text-lg font-medium text-[#1C2B23]">Experience</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1C2B23] mb-2 ml-1">Years of Experience</label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={yearsExp}
                  onChange={(e) => setYearsExp(parseInt(e.target.value) || 0)}
                  className="input-field"
                  data-testid="years-exp-input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1C2B23] mb-2 ml-1">Previous Companies</label>
                <div className="space-y-3">
                  {companies.map((company, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={company.name}
                        onChange={(e) => updateCompany(index, 'name', e.target.value)}
                        placeholder="Company name"
                        className="input-field flex-1"
                        data-testid={`company-name-${index}`}
                      />
                      <input
                        type="text"
                        value={company.role}
                        onChange={(e) => updateCompany(index, 'role', e.target.value)}
                        placeholder="Role"
                        className="input-field flex-1"
                        data-testid={`company-role-${index}`}
                      />
                      <button
                        onClick={() => removeCompany(index)}
                        className="w-12 h-12 rounded-xl bg-[#E8A3A3]/20 flex items-center justify-center text-[#E8A3A3]"
                        data-testid={`remove-company-${index}`}
                      >
                        <X size={18} />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={addCompany}
                    className="flex items-center gap-2 text-[#70AF88] font-medium"
                    data-testid="add-company-btn"
                  >
                    <Plus size={18} />
                    Add Company
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Skills Section */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Code size={24} weight="duotone" className="text-[#B08D5E]" />
              <h2 className="text-lg font-medium text-[#1C2B23]">Skills & Projects</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1C2B23] mb-2 ml-1">Skills * (required for matching)</label>
                <textarea
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  placeholder="e.g. Python, JavaScript, React, AWS..."
                  className="input-field min-h-[100px] resize-none"
                  data-testid="skills-input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1C2B23] mb-2 ml-1">Projects</label>
                <textarea
                  value={projects}
                  onChange={(e) => setProjects(e.target.value)}
                  placeholder="Describe your notable projects..."
                  className="input-field min-h-[120px] resize-none"
                  data-testid="projects-input"
                />
              </div>
            </div>
          </section>

          {/* Location Section */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <MapPin size={24} weight="duotone" className="text-[#70AF88]" />
              <h2 className="text-lg font-medium text-[#1C2B23]">Location</h2>
            </div>

            <div className="space-y-4">
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="Country"
                className="input-field"
                data-testid="country-input"
              />
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="State"
                className="input-field"
                data-testid="state-input"
              />
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="City"
                className="input-field"
                data-testid="city-input"
              />

              <div className="flex items-center justify-between p-4 bg-[#FAFAFA] rounded-2xl">
                <span className="text-[#1C2B23]">Show jobs only in my city</span>
                <Switch 
                  checked={showOnlyCityJobs} 
                  onCheckedChange={setShowOnlyCityJobs}
                  data-testid="city-only-toggle"
                />
              </div>
            </div>
          </section>
        </div>

        {/* Save button */}
        <div className="absolute bottom-6 left-6 right-6">
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary"
            data-testid="save-resume-btn"
          >
            {saving ? 'Saving...' : 'Save Resume'}
          </button>
        </div>
      </div>
    </div>
  );
}
