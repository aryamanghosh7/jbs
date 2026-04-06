import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/SupabaseAuthContext';
import { supabase } from '../lib/supabase';
import {
  ArrowLeft, GraduationCap, Certificate, Briefcase,
  MapPin, Code, Plus, X, Upload, Check, Phone, Envelope, GithubLogo,
  FolderOpen
} from '@phosphor-icons/react';
import { Switch } from '../components/ui/switch';
import { toast } from 'sonner';

export default function NewResumeBuilder() {
  const navigate = useNavigate();
  const { user, updateProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Contact Info
  const [whatsapp, setWhatsapp] = useState('');
  const [github, setGithub] = useState('');

  // Experience
  const [experience, setExperience] = useState('');

  // Education entries
  const [bachelorsEntries, setBachelorsEntries] = useState([]);
  const [mastersEntries, setMastersEntries] = useState([]);
  const [certificationEntries, setCertificationEntries] = useState([]);
  const [phdEntries, setPhdEntries] = useState([]);
  const [showBachelors, setShowBachelors] = useState(false);
  const [showMasters, setShowMasters] = useState(false);
  const [showCertification, setShowCertification] = useState(false);
  const [showPhd, setShowPhd] = useState(false);

  // Skills & Projects
  const [skills, setSkills] = useState('');
  const [projects, setProjects] = useState('');

  // Previous Companies
  const [showPreviousCompanies, setShowPreviousCompanies] = useState(false);
  const [companies, setCompanies] = useState([]);

  // Location
  const [country, setCountry] = useState('');
  const [state, setState] = useState('');
  const [city, setCity] = useState('');
  const [showOnlyCityJobs, setShowOnlyCityJobs] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profile) {
        setWhatsapp(profile.whatsapp || '');
        setGithub(profile.github || '');
        setExperience(profile.experience || '');
        setSkills(profile.skills || '');
        setProjects(profile.projects || '');
        setCountry(profile.country || '');
        setState(profile.state || '');
        setCity(profile.city || '');
        setShowOnlyCityJobs(profile.show_only_city_jobs || false);
      }

      // Fetch education entries
      const { data: educationData } = await supabase
        .from('education_entries')
        .select('*')
        .eq('profile_id', user.id);

      if (educationData) {
        setBachelorsEntries(educationData.filter(e => e.degree_type === 'bachelors'));
        setMastersEntries(educationData.filter(e => e.degree_type === 'masters'));
        setCertificationEntries(educationData.filter(e => e.degree_type === 'certification'));
        setPhdEntries(educationData.filter(e => e.degree_type === 'phd'));

        setShowBachelors(educationData.some(e => e.degree_type === 'bachelors'));
        setShowMasters(educationData.some(e => e.degree_type === 'masters'));
        setShowCertification(educationData.some(e => e.degree_type === 'certification'));
        setShowPhd(educationData.some(e => e.degree_type === 'phd'));
      }

      // Fetch previous companies
      const { data: companiesData } = await supabase
        .from('previous_companies')
        .select('*')
        .eq('profile_id', user.id);

      if (companiesData && companiesData.length > 0) {
        setCompanies(companiesData);
        setShowPreviousCompanies(true);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const uploadCertificate = async (file) => {
    if (!file) return null;

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('certificates')
      .upload(fileName, file);

    if (error) {
      console.error('Upload error:', error);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('certificates')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const addEducationEntry = (type) => {
    const newEntry = { degree_name: '', certificate_url: '', isNew: true };

    if (type === 'bachelors') {
      setBachelorsEntries([...bachelorsEntries, newEntry]);
    } else if (type === 'masters') {
      setMastersEntries([...mastersEntries, newEntry]);
    } else if (type === 'certification') {
      setCertificationEntries([...certificationEntries, newEntry]);
    } else if (type === 'phd') {
      setPhdEntries([...phdEntries, newEntry]);
    }
  };

  const updateEducationEntry = (type, index, field, value) => {
    const update = (entries) => entries.map((entry, i) =>
      i === index ? { ...entry, [field]: value } : entry
    );

    if (type === 'bachelors') {
      setBachelorsEntries(update(bachelorsEntries));
    } else if (type === 'masters') {
      setMastersEntries(update(mastersEntries));
    } else if (type === 'certification') {
      setCertificationEntries(update(certificationEntries));
    } else if (type === 'phd') {
      setPhdEntries(update(phdEntries));
    }
  };

  const removeEducationEntry = async (type, index, entryId) => {
    if (entryId) {
      await supabase.from('education_entries').delete().eq('id', entryId);
    }

    const remove = (entries) => entries.filter((_, i) => i !== index);

    if (type === 'bachelors') {
      setBachelorsEntries(remove(bachelorsEntries));
    } else if (type === 'masters') {
      setMastersEntries(remove(mastersEntries));
    } else if (type === 'certification') {
      setCertificationEntries(remove(certificationEntries));
    } else if (type === 'phd') {
      setPhdEntries(remove(phdEntries));
    }
  };

  const handleFileUpload = async (type, index, file) => {
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be under 5MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Only image files are allowed');
      return;
    }

    toast.info('Uploading certificate...');
    const url = await uploadCertificate(file);

    if (url) {
      updateEducationEntry(type, index, 'certificate_url', url);
      toast.success('Certificate uploaded!');
    } else {
      toast.error('Upload failed');
    }
  };

  const addCompany = () => {
    setCompanies([...companies, { company_name: '', role: '', isNew: true }]);
  };

  const updateCompany = (index, field, value) => {
    setCompanies(companies.map((c, i) =>
      i === index ? { ...c, [field]: value } : c
    ));
  };

  const removeCompany = async (index, companyId) => {
    if (companyId) {
      await supabase.from('previous_companies').delete().eq('id', companyId);
    }
    setCompanies(companies.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!skills.trim()) {
      toast.error('Please add your skills for better job matching');
      return;
    }

    if (skills.split(/\s+/).length > 300) {
      toast.error('Skills must be under 300 words');
      return;
    }

    if (projects && projects.length > 300) {
      toast.error('Project links must be under 300 characters');
      return;
    }

    setSaving(true);
    try {
      // Update profile
      await updateProfile({
        whatsapp,
        github,
        experience,
        skills,
        projects,
        country,
        state,
        city,
        show_only_city_jobs: showOnlyCityJobs
      });

      // Handle education entries
      const saveEducation = async (entries, type) => {
        for (const entry of entries) {
          if (entry.isNew) {
            await supabase.from('education_entries').insert({
              profile_id: user.id,
              degree_type: type,
              degree_name: entry.degree_name,
              certificate_url: entry.certificate_url
            });
          } else if (entry.id) {
            await supabase.from('education_entries')
              .update({
                degree_name: entry.degree_name,
                certificate_url: entry.certificate_url
              })
              .eq('id', entry.id);
          }
        }
      };

      if (showBachelors) await saveEducation(bachelorsEntries, 'bachelors');
      if (showMasters) await saveEducation(mastersEntries, 'masters');
      if (showCertification) await saveEducation(certificationEntries, 'certification');
      if (showPhd) await saveEducation(phdEntries, 'phd');

      // Handle companies
      if (showPreviousCompanies) {
        for (const company of companies) {
          if (company.isNew) {
            await supabase.from('previous_companies').insert({
              profile_id: user.id,
              company_name: company.company_name,
              role: company.role
            });
          } else if (company.id) {
            await supabase.from('previous_companies')
              .update({
                company_name: company.company_name,
                role: company.role
              })
              .eq('id', company.id);
          }
        }
      }

      toast.success('Profile saved successfully!');
      navigate('/');
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const EducationSection = ({ title, type, entries, setEntries, show, setShow, icon: Icon }) => (
    <div className="mb-6">
      <div className="flex items-center justify-between p-4 bg-[#F9FAFB] rounded-2xl mb-3">
        <span className="text-[#111827] font-medium">{title}</span>
        <Switch
          checked={show}
          onCheckedChange={(checked) => {
            setShow(checked);
            if (checked && entries.length === 0) {
              addEducationEntry(type);
            }
          }}
        />
      </div>

      {show && (
        <div className="ml-4 space-y-3">
          {entries.map((entry, index) => (
            <div key={index} className="p-4 bg-[#F9FAFB] rounded-xl space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={entry.degree_name}
                  onChange={(e) => updateEducationEntry(type, index, 'degree_name', e.target.value)}
                  placeholder="Degree name"
                  className="input-field flex-1"
                />
                <button
                  onClick={() => removeEducationEntry(type, index, entry.id)}
                  className="w-12 h-12 rounded-xl bg-[#EF4444]/20 flex items-center justify-center text-[#EF4444]"
                >
                  <X size={18} />
                </button>
              </div>

              <div>
                <label className="block text-sm text-[#6B7280] mb-2">Upload certificate (JPEG)</label>
                <input
                  type="file"
                  accept="image/jpeg,image/jpg"
                  onChange={(e) => handleFileUpload(type, index, e.target.files[0])}
                  className="hidden"
                  id={`${type}-upload-${index}`}
                />
                <label
                  htmlFor={`${type}-upload-${index}`}
                  className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-[#E5E7EB] rounded-xl cursor-pointer hover:border-[#10B981] transition-colors"
                >
                  {entry.certificate_url ? (
                    <span className="text-[#10B981] flex items-center gap-2">
                      <Check size={16} /> Uploaded
                    </span>
                  ) : (
                    <span className="text-[#9CA3AF] flex items-center gap-2">
                      <Upload size={16} /> Upload JPEG
                    </span>
                  )}
                </label>
              </div>
            </div>
          ))}

          <button
            onClick={() => addEducationEntry(type)}
            className="flex items-center gap-2 text-[#10B981] font-medium text-sm"
          >
            <Plus size={18} />
            Add Another {title}
          </button>
        </div>
      )}
    </div>
  );

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
        <div className="px-6 pt-6 pb-4 flex items-center gap-4 border-b border-[#E5E7EB]">
          <button
            onClick={() => navigate('/')}
            className="w-10 h-10 rounded-full bg-[#F9FAFB] flex items-center justify-center text-[#6B7280]"
            data-testid="back-btn"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl lg:text-2xl font-medium text-[#111827]">Build Resume</h1>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 pb-32 space-y-8">
          {/* Contact Information */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Phone size={24} weight="duotone" className="text-[#10B981]" />
              <h2 className="text-lg font-medium text-[#111827]">Contact Information</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#111827] mb-2 ml-1">
                  WhatsApp Number
                </label>
                <div className="relative">
                  <Phone size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                  <input
                    type="tel"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="+1 234 567 8900"
                    className="input-field pl-12"
                    data-testid="whatsapp-input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#111827] mb-2 ml-1">
                  GitHub Link <span className="text-[#9CA3AF]">(optional)</span>
                </label>
                <div className="relative">
                  <GithubLogo size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                  <input
                    type="url"
                    value={github}
                    onChange={(e) => setGithub(e.target.value)}
                    placeholder="https://github.com/yourusername"
                    className="input-field pl-12"
                    data-testid="github-input"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Experience */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Briefcase size={24} weight="duotone" className="text-[#10B981]" />
              <h2 className="text-lg font-medium text-[#111827]">Experience</h2>
            </div>

            <textarea
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              placeholder="Describe your work experience..."
              className="input-field min-h-[120px] resize-none"
              data-testid="experience-input"
            />
          </section>

          {/* Education */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <GraduationCap size={24} weight="duotone" className="text-[#10B981]" />
              <h2 className="text-lg font-medium text-[#111827]">Education</h2>
            </div>

            <EducationSection
              title="Bachelor's Degree"
              type="bachelors"
              entries={bachelorsEntries}
              setEntries={setBachelorsEntries}
              show={showBachelors}
              setShow={setShowBachelors}
              icon={GraduationCap}
            />

            <EducationSection
              title="Master's Degree"
              type="masters"
              entries={mastersEntries}
              setEntries={setMastersEntries}
              show={showMasters}
              setShow={setShowMasters}
              icon={GraduationCap}
            />

            <EducationSection
              title="Certification"
              type="certification"
              entries={certificationEntries}
              setEntries={setCertificationEntries}
              show={showCertification}
              setShow={setShowCertification}
              icon={Certificate}
            />

            <EducationSection
              title="PhD"
              type="phd"
              entries={phdEntries}
              setEntries={setPhdEntries}
              show={showPhd}
              setShow={setShowPhd}
              icon={GraduationCap}
            />
          </section>

          {/* Skills & Projects */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Code size={24} weight="duotone" className="text-[#10B981]" />
              <h2 className="text-lg font-medium text-[#111827]">Skills & Strengths</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#111827] mb-2 ml-1">
                  Skills <span className="text-red-500">*</span> <span className="text-[#9CA3AF]">(max 300 words)</span>
                </label>
                <textarea
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  placeholder="e.g. Python, JavaScript, React, AWS, Team Leadership..."
                  className="input-field min-h-[100px] resize-none"
                  data-testid="skills-input"
                />
                <p className="text-xs text-[#9CA3AF] mt-1 ml-1">
                  {skills.split(/\s+/).filter(Boolean).length}/300 words
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#111827] mb-2 ml-1">
                  Project Links <span className="text-[#9CA3AF]">(max 300 characters)</span>
                </label>
                <textarea
                  value={projects}
                  onChange={(e) => setProjects(e.target.value)}
                  placeholder="Paste project URLs or descriptions..."
                  className="input-field min-h-[100px] resize-none"
                  data-testid="projects-input"
                />
                <p className="text-xs text-[#9CA3AF] mt-1 ml-1">
                  {projects.length}/300 characters
                </p>
              </div>
            </div>
          </section>

          {/* Previous Companies */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Briefcase size={24} weight="duotone" className="text-[#10B981]" />
              <h2 className="text-lg font-medium text-[#111827]">Previous Companies</h2>
            </div>

            <div className="flex items-center justify-between p-4 bg-[#F9FAFB] rounded-2xl mb-3">
              <span className="text-[#111827] font-medium">I have previous work experience</span>
              <Switch
                checked={showPreviousCompanies}
                onCheckedChange={(checked) => {
                  setShowPreviousCompanies(checked);
                  if (checked && companies.length === 0) {
                    addCompany();
                  }
                }}
              />
            </div>

            {showPreviousCompanies && (
              <div className="space-y-3">
                {companies.map((company, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={company.role}
                      onChange={(e) => updateCompany(index, 'role', e.target.value)}
                      placeholder="Role"
                      className="input-field flex-1"
                    />
                    <input
                      type="text"
                      value={company.company_name}
                      onChange={(e) => updateCompany(index, 'company_name', e.target.value)}
                      placeholder="Company name"
                      className="input-field flex-1"
                    />
                    <button
                      onClick={() => removeCompany(index, company.id)}
                      className="w-12 h-12 rounded-xl bg-[#EF4444]/20 flex items-center justify-center text-[#EF4444]"
                    >
                      <X size={18} />
                    </button>
                  </div>
                ))}

                <button
                  onClick={addCompany}
                  className="flex items-center gap-2 text-[#10B981] font-medium"
                >
                  <Plus size={18} />
                  Add Company
                </button>
              </div>
            )}
          </section>

          {/* Location */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <MapPin size={24} weight="duotone" className="text-[#10B981]" />
              <h2 className="text-lg font-medium text-[#111827]">Location</h2>
            </div>

            <div className="space-y-4">
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="City"
                className="input-field"
                data-testid="city-input"
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
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="Country"
                className="input-field"
                data-testid="country-input"
              />

              <div className="flex items-center justify-between p-4 bg-[#F9FAFB] rounded-2xl">
                <span className="text-[#111827]">Show jobs only in my city</span>
                <Switch
                  checked={showOnlyCityJobs}
                  onCheckedChange={setShowOnlyCityJobs}
                  data-testid="city-only-toggle"
                />
              </div>
            </div>
          </section>
        </div>

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
