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
        self.admin_user_id = None
        self.job_seeker_user_id = None
        self.job_id = None
        self.application_id = None

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
                    print(f"   Response: {response.json()}")
                except:
                    print(f"   Response: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_admin_login(self):
        """Test admin login with provided credentials"""
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "auth/login",
            200,
            data={"email": "admin@jobswish.com", "password": "admin123"}
        )
        if success and 'id' in response:
            self.admin_user_id = response['id']
            print(f"   Admin user ID: {self.admin_user_id}")
            return True
        return False

    def test_job_seeker_registration(self):
        """Test job seeker registration"""
        timestamp = datetime.now().strftime('%H%M%S')
        email = f"jobseeker_{timestamp}@test.com"
        
        success, response = self.run_test(
            "Job Seeker Registration",
            "POST",
            "auth/register",
            200,
            data={
                "email": email,
                "password": "testpass123",
                "name": f"Test JobSeeker {timestamp}",
                "role": "job_seeker"
            }
        )
        if success and 'id' in response:
            self.job_seeker_user_id = response['id']
            print(f"   Job seeker user ID: {self.job_seeker_user_id}")
            return True
        return False

    def test_job_seeker_profile_creation(self):
        """Test job seeker profile with email, phone, github fields"""
        success, response = self.run_test(
            "Job Seeker Profile Creation",
            "PUT",
            "profile",
            200,
            data={
                "email": "jobseeker@example.com",
                "phone": "+1234567890",
                "github": "https://github.com/testuser",
                "skills": "Python, JavaScript, React, Node.js",
                "experience": {"years": 3, "companies": [{"name": "TechCorp", "role": "Developer"}]},
                "education": {"has_bachelors": True, "has_masters": False},
                "location": {"country": "USA", "state": "CA", "city": "San Francisco"}
            }
        )
        return success

    def test_get_profile(self):
        """Test getting job seeker profile"""
        success, response = self.run_test(
            "Get Job Seeker Profile",
            "GET",
            "profile",
            200
        )
        if success:
            # Verify required fields are present
            if 'email' in response and 'phone' in response and 'github' in response:
                print(f"   Profile fields verified: email, phone, github present")
                return True
            else:
                print(f"   Missing required profile fields")
        return False

    def test_recruiter_job_posting(self):
        """Test recruiter can post a new job"""
        # First login as admin (recruiter)
        if not self.test_admin_login():
            return False
            
        success, response = self.run_test(
            "Recruiter Job Posting",
            "POST",
            "jobs",
            200,
            data={
                "title": "Senior Python Developer",
                "company_name": "TechCorp Inc",
                "salary_min": 80000,
                "salary_max": 120000,
                "description": "We are looking for a senior Python developer with experience in web development.",
                "short_note": "Great opportunity for growth",
                "country": "USA",
                "state": "CA", 
                "city": "San Francisco",
                "requirements": {
                    "bachelor_required": True,
                    "master_required": False,
                    "certification_required": False,
                    "notes": "Python, Django, REST APIs"
                }
            }
        )
        if success and 'id' in response:
            self.job_id = response['id']
            print(f"   Job ID: {self.job_id}")
            return True
        return False

    def test_job_seeker_matches(self):
        """Test job seeker can see matches after profile complete"""
        # Login as job seeker
        timestamp = datetime.now().strftime('%H%M%S')
        email = f"jobseeker_{timestamp}@test.com"
        
        # Register and login job seeker
        reg_success, reg_response = self.run_test(
            "Job Seeker Registration for Matches",
            "POST", 
            "auth/register",
            200,
            data={
                "email": email,
                "password": "testpass123",
                "name": f"Test JobSeeker {timestamp}",
                "role": "job_seeker"
            }
        )
        
        if not reg_success:
            return False
            
        # Create profile with skills
        profile_success, _ = self.run_test(
            "Create Profile for Matches",
            "PUT",
            "profile", 
            200,
            data={
                "email": email,
                "skills": "Python, Django, REST APIs",
                "experience": {"years": 2, "companies": []},
                "education": {"has_bachelors": True, "has_masters": False}
            }
        )
        
        if not profile_success:
            return False
            
        # Test matches endpoint
        success, response = self.run_test(
            "Get Job Matches",
            "GET",
            "matches",
            200
        )
        
        if success:
            print(f"   Found {len(response)} matches")
            return True
        return False

    def test_job_application(self):
        """Test job seeker can apply to a job"""
        if not self.job_id:
            print("   No job ID available for application test")
            return False
            
        success, response = self.run_test(
            "Job Application",
            "POST",
            f"applications/{self.job_id}",
            200
        )
        
        if success:
            print(f"   Application successful")
            return True
        return False

    def test_recruiter_view_applicants(self):
        """Test recruiter can view applicants"""
        # Login as admin (recruiter)
        if not self.test_admin_login():
            return False
            
        if not self.job_id:
            print("   No job ID available for viewing applicants")
            return False
            
        success, response = self.run_test(
            "View Job Applicants",
            "GET",
            f"jobs/{self.job_id}/applicants",
            200
        )
        
        if success:
            print(f"   Found {len(response)} applicants")
            if len(response) > 0:
                self.application_id = response[0].get('application_id')
                print(f"   Application ID: {self.application_id}")
            return True
        return False

    def test_recruiter_shortlist_applicant(self):
        """Test recruiter can shortlist an applicant"""
        if not self.application_id:
            print("   No application ID available for shortlisting")
            return False
            
        success, response = self.run_test(
            "Shortlist Applicant",
            "PUT",
            f"applications/{self.application_id}/action",
            200,
            data={"action": "shortlist"}
        )
        return success

    def test_recruiter_reject_applicant(self):
        """Test recruiter can reject an applicant (should update status, not delete)"""
        if not self.application_id:
            print("   No application ID available for rejection")
            return False
            
        success, response = self.run_test(
            "Reject Applicant",
            "PUT", 
            f"applications/{self.application_id}/action",
            200,
            data={"action": "reject"}
        )
        return success

    def test_insights_status(self):
        """Test insights tab shows rejection count"""
        # Login as job seeker first
        timestamp = datetime.now().strftime('%H%M%S')
        email = f"jobseeker_{timestamp}@test.com"
        
        reg_success, _ = self.run_test(
            "Job Seeker Registration for Insights",
            "POST",
            "auth/register", 
            200,
            data={
                "email": email,
                "password": "testpass123",
                "name": f"Test JobSeeker {timestamp}",
                "role": "job_seeker"
            }
        )
        
        if not reg_success:
            return False
            
        success, response = self.run_test(
            "Get Insights Status",
            "GET",
            "insights/status",
            200
        )
        
        if success and 'rejection_count' in response:
            print(f"   Rejection count: {response['rejection_count']}")
            print(f"   Eligible for insights: {response.get('eligible', False)}")
            return True
        return False

    def test_auth_endpoints(self):
        """Test basic auth endpoints"""
        # Test /auth/me endpoint
        success, response = self.run_test(
            "Get Current User",
            "GET",
            "auth/me",
            200
        )
        
        if success:
            print(f"   Current user: {response.get('email', 'Unknown')}")
            
        # Test logout
        logout_success, _ = self.run_test(
            "Logout",
            "POST",
            "auth/logout",
            200
        )
        
        return success and logout_success

def main():
    print("🚀 Starting Jobswish API Testing...")
    print("=" * 50)
    
    tester = JobswishAPITester()
    
    # Test sequence following the review request requirements
    tests = [
        ("Admin Login", tester.test_admin_login),
        ("Recruiter Job Posting", tester.test_recruiter_job_posting),
        ("Job Seeker Registration", tester.test_job_seeker_registration),
        ("Job Seeker Profile Creation", tester.test_job_seeker_profile_creation),
        ("Get Job Seeker Profile", tester.test_get_profile),
        ("Job Seeker Matches", tester.test_job_seeker_matches),
        ("Job Application", tester.test_job_application),
        ("Recruiter View Applicants", tester.test_recruiter_view_applicants),
        ("Recruiter Shortlist Applicant", tester.test_recruiter_shortlist_applicant),
        ("Recruiter Reject Applicant", tester.test_recruiter_reject_applicant),
        ("Insights Status", tester.test_insights_status),
        ("Auth Endpoints", tester.test_auth_endpoints)
    ]
    
    failed_tests = []
    
    for test_name, test_func in tests:
        try:
            if not test_func():
                failed_tests.append(test_name)
        except Exception as e:
            print(f"❌ {test_name} failed with exception: {str(e)}")
            failed_tests.append(test_name)
    
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} passed")
    
    if failed_tests:
        print(f"❌ Failed tests: {', '.join(failed_tests)}")
        return 1
    else:
        print("✅ All tests passed!")
        return 0

if __name__ == "__main__":
    sys.exit(main())