# Jobswish - Product Requirements Document

## Original Problem Statement
Build a Tinder-like job matching app called "Jobswish" with:
- Mobile-first layout with minimal UI and smooth swipe animations
- Colors: #A8D5BA (mint green), #FFFFFF (white), #D2B48C (tan/beige)
- Email/password authentication with two roles: Job Seeker and Recruiter
- AI matching using NVIDIA embedding API

## User Personas

### Job Seeker
- Looking for employment opportunities
- Wants personalized job recommendations
- Swipes through job cards to apply or reject
- Builds resume/profile for matching

### Recruiter
- Posts job listings
- Reviews applicants with match scores
- Can shortlist/reject candidates
- Uses AI shortlist feature for efficiency

## Core Requirements (Static)

### Authentication
- [x] JWT-based email/password auth
- [x] Role selection on signup (job_seeker/recruiter)
- [x] httpOnly cookie-based session

### Job Seeker Features
- [x] Resume builder with:
  - Education (Bachelor's/Master's toggles + JPEG upload)
  - Certifications (multiple JPEG uploads)
  - Experience (years + companies list)
  - Skills (text - required for matching)
  - Projects (text area)
  - Location (country/state/city + "show only city jobs" toggle)
- [x] Matches tab - swipeable job cards with match scores
- [x] All Jobs tab - list view with apply button
- [x] Applications tab - status tracking (pending/shortlisted)

### Recruiter Features
- [x] Post job screen with all required fields
- [x] Dashboard showing active/closed jobs with stats
- [x] Applicants view per job
- [x] Shortlist section
- [x] AI Shortlist button (top 20% when 10+ applicants)
- [x] End Offer button (closes job, removes pending apps)

### AI Matching System
- [x] NVIDIA NV-EmbedQA-E5-V5 for embeddings
- [x] Cosine similarity for match scoring
- [x] Embedding caching to reduce API calls

## What's Been Implemented

### 2026-04-03: Initial MVP
- Full authentication system with JWT
- Job seeker resume builder
- Swipeable job cards with framer-motion
- Recruiter job posting and management
- AI matching with NVIDIA embeddings
- Applicant shortlist/reject functionality
- AI auto-shortlist feature
- Job closing functionality

## Architecture

### Backend (FastAPI)
- `/app/backend/server.py` - Main API with all endpoints
- MongoDB collections: users, profiles, jobs, applications, rejected_jobs, embeddings

### Frontend (React)
- `/app/frontend/src/pages/AuthPage.js` - Login/Register
- `/app/frontend/src/pages/JobSeekerHome.js` - Matches, All Jobs, Applications tabs
- `/app/frontend/src/pages/RecruiterHome.js` - Dashboard
- `/app/frontend/src/pages/ResumeBuilder.js` - Profile builder
- `/app/frontend/src/pages/PostJob.js` - Job creation
- `/app/frontend/src/pages/JobApplicants.js` - Applicant management

## Prioritized Backlog

### P0 (Done)
- [x] Authentication
- [x] Job posting
- [x] Job matching
- [x] Applications

### P1 (Future)
- [ ] Email notifications for status changes
- [ ] In-app messaging between recruiter and candidates
- [ ] Advanced filtering options
- [ ] Saved/bookmarked jobs

### P2 (Nice to Have)
- [ ] Social login (Google/LinkedIn)
- [ ] Video interview integration
- [ ] Company profiles/reviews
- [ ] Salary insights/analytics

## Next Tasks
1. Add email notifications when application status changes
2. Implement search/filter for jobs
3. Add company logo support in job postings
4. Build analytics dashboard for recruiters
