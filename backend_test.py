import requests
import sys
import json
from datetime import datetime

class JobswishAPITester:
    def __init__(self, base_url="https://swift-match-3.preview.emergentagent.com"):
        self.base_url = base_url
        self.session = requests.Session()
        self.tests_run = 0
        self.tests_passed = 0
        self.admin_user = None
        self.job_seeker_user = None
        self.recruiter_user = None
        self.test_job_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, cookies=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = self.session.get(url, headers=headers)
            elif method == 'POST':
                response = self.session.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = self.session.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = self.session.delete(url, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json()
                except:
                    return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_detail = response.json()
                    print(f"   Error: {error_detail}")
                except:
                    print(f"   Response: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_admin_login(self):
        """Test admin login"""
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "auth/login",
            200,
            data={"email": "admin@jobswish.com", "password": "admin123"}
        )
        if success:
            self.admin_user = response
            return True
        return False

    def test_register_job_seeker(self):
        """Test job seeker registration"""
        timestamp = datetime.now().strftime('%H%M%S')
        success, response = self.run_test(
            "Register Job Seeker",
            "POST",
            "auth/register",
            200,
            data={
                "email": f"jobseeker_{timestamp}@test.com",
                "password": "TestPass123!",
                "name": f"Job Seeker {timestamp}",
                "role": "job_seeker"
            }
        )
        if success:
            self.job_seeker_user = response
            return True
        return False

    def test_register_recruiter(self):
        """Test recruiter registration"""
        timestamp = datetime.now().strftime('%H%M%S')
        success, response = self.run_test(
            "Register Recruiter",
            "POST",
            "auth/register",
            200,
            data={
                "email": f"recruiter_{timestamp}@test.com",
                "password": "TestPass123!",
                "name": f"Recruiter {timestamp}",
                "role": "recruiter"
            }
        )
        if success:
            self.recruiter_user = response
            return True
        return False

    def test_auth_me(self):
        """Test get current user"""
        success, _ = self.run_test(
            "Get Current User",
            "GET",
            "auth/me",
            200
        )
        return success

    def test_logout(self):
        """Test logout"""
        success, _ = self.run_test(
            "Logout",
            "POST",
            "auth/logout",
            200
        )
        return success

    def test_create_job(self):
        """Test job creation (as recruiter)"""
        if not self.recruiter_user:
            print("❌ No recruiter user available for job creation")
            return False
            
        success, response = self.run_test(
            "Create Job",
            "POST",
            "jobs",
            200,
            data={
                "title": "Senior Software Engineer",
                "company_name": "Test Tech Corp",
                "salary_min": 80000,
                "salary_max": 120000,
                "description": "We are looking for a senior software engineer to join our team.",
                "short_note": "Great opportunity for growth",
                "country": "USA",
                "state": "California",
                "city": "San Francisco",
                "requirements": {
                    "bachelor_required": True,
                    "master_required": False,
                    "certification_required": False,
                    "notes": "5+ years experience required"
                }
            }
        )
        if success and 'id' in response:
            self.test_job_id = response['id']
            return True
        return False

    def test_get_jobs(self):
        """Test get all jobs"""
        success, response = self.run_test(
            "Get All Jobs",
            "GET",
            "jobs",
            200
        )
        return success

    def test_get_recruiter_jobs(self):
        """Test get recruiter's jobs"""
        success, response = self.run_test(
            "Get Recruiter Jobs",
            "GET",
            "jobs/recruiter",
            200
        )
        return success

    def test_update_profile(self):
        """Test profile update (as job seeker)"""
        success, _ = self.run_test(
            "Update Profile",
            "PUT",
            "profile",
            200,
            data={
                "education": {
                    "has_bachelors": True,
                    "has_masters": False
                },
                "certifications": [],
                "experience": {
                    "years": 3,
                    "companies": [{"name": "Test Corp", "role": "Developer"}]
                },
                "skills": "Python, JavaScript, React, FastAPI",
                "projects": "Built several web applications using modern frameworks",
                "location": {
                    "country": "USA",
                    "state": "California", 
                    "city": "San Francisco",
                    "show_only_city_jobs": False
                }
            }
        )
        return success

    def test_get_profile(self):
        """Test get profile"""
        success, _ = self.run_test(
            "Get Profile",
            "GET",
            "profile",
            200
        )
        return success

    def test_get_matches(self):
        """Test get job matches"""
        success, _ = self.run_test(
            "Get Job Matches",
            "GET",
            "matches",
            200
        )
        return success

    def test_apply_to_job(self):
        """Test job application"""
        if not self.test_job_id:
            print("❌ No test job available for application")
            return False
            
        success, _ = self.run_test(
            "Apply to Job",
            "POST",
            f"applications/{self.test_job_id}",
            200
        )
        return success

    def test_get_applications(self):
        """Test get user applications"""
        success, _ = self.run_test(
            "Get Applications",
            "GET",
            "applications",
            200
        )
        return success

    def test_get_job_applicants(self):
        """Test get job applicants (as recruiter)"""
        if not self.test_job_id:
            print("❌ No test job available")
            return False
            
        success, _ = self.run_test(
            "Get Job Applicants",
            "GET",
            f"jobs/{self.test_job_id}/applicants",
            200
        )
        return success

    def test_reject_job(self):
        """Test job rejection"""
        if not self.test_job_id:
            print("❌ No test job available for rejection")
            return False
            
        success, _ = self.run_test(
            "Reject Job",
            "POST",
            f"reject/{self.test_job_id}",
            200
        )
        return success

def main():
    print("🚀 Starting Jobswish API Tests...")
    tester = JobswishAPITester()

    # Test authentication flows
    print("\n" + "="*50)
    print("TESTING AUTHENTICATION")
    print("="*50)
    
    if not tester.test_admin_login():
        print("❌ Admin login failed, stopping tests")
        return 1
    
    if not tester.test_auth_me():
        print("❌ Auth me failed")
        return 1
    
    if not tester.test_logout():
        print("❌ Logout failed")
        return 1

    # Test registration
    if not tester.test_register_job_seeker():
        print("❌ Job seeker registration failed")
        return 1
    
    if not tester.test_logout():
        print("❌ Logout after job seeker registration failed")
        return 1
    
    if not tester.test_register_recruiter():
        print("❌ Recruiter registration failed")
        return 1

    # Test recruiter functionality
    print("\n" + "="*50)
    print("TESTING RECRUITER FUNCTIONALITY")
    print("="*50)
    
    if not tester.test_create_job():
        print("❌ Job creation failed")
        return 1
    
    if not tester.test_get_recruiter_jobs():
        print("❌ Get recruiter jobs failed")
        return 1
    
    if not tester.test_get_jobs():
        print("❌ Get all jobs failed")
        return 1

    # Switch to job seeker
    print("\n" + "="*50)
    print("TESTING JOB SEEKER FUNCTIONALITY")
    print("="*50)
    
    # Login as job seeker
    if tester.job_seeker_user:
        success, _ = tester.run_test(
            "Job Seeker Login",
            "POST",
            "auth/login",
            200,
            data={
                "email": tester.job_seeker_user['email'],
                "password": "TestPass123!"
            }
        )
        if not success:
            print("❌ Job seeker login failed")
            return 1
    
    if not tester.test_update_profile():
        print("❌ Profile update failed")
        return 1
    
    if not tester.test_get_profile():
        print("❌ Get profile failed")
        return 1
    
    if not tester.test_get_matches():
        print("❌ Get matches failed")
        return 1
    
    if not tester.test_apply_to_job():
        print("❌ Job application failed")
        return 1
    
    if not tester.test_get_applications():
        print("❌ Get applications failed")
        return 1

    # Switch back to recruiter for applicant management
    print("\n" + "="*50)
    print("TESTING APPLICANT MANAGEMENT")
    print("="*50)
    
    if tester.recruiter_user:
        success, _ = tester.run_test(
            "Recruiter Login",
            "POST",
            "auth/login",
            200,
            data={
                "email": tester.recruiter_user['email'],
                "password": "TestPass123!"
            }
        )
        if not success:
            print("❌ Recruiter login failed")
            return 1
    
    if not tester.test_get_job_applicants():
        print("❌ Get job applicants failed")
        return 1

    # Print final results
    print("\n" + "="*50)
    print("TEST RESULTS")
    print("="*50)
    print(f"📊 Tests passed: {tester.tests_passed}/{tester.tests_run}")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print(f"❌ {tester.tests_run - tester.tests_passed} tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())