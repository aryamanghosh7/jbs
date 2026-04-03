import requests
import sys
from datetime import datetime

class InsightsAPITester:
    def __init__(self, base_url="https://swift-match-3.preview.emergentagent.com"):
        self.base_url = base_url
        self.session = requests.Session()
        self.tests_run = 0
        self.tests_passed = 0

    def run_test(self, name, method, endpoint, expected_status, data=None):
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
                    print(f"   Response: {response.text[:200]}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_job_seeker_login(self):
        """Login as job seeker"""
        success, response = self.run_test(
            "Job Seeker Login",
            "POST",
            "auth/login",
            200,
            data={"email": "testseeker2@example.com", "password": "Test123!"}
        )
        return success

    def test_insights_status(self):
        """Test insights status endpoint"""
        success, response = self.run_test(
            "Insights Status",
            "GET",
            "insights/status",
            200
        )
        
        if success:
            print(f"   📊 Rejection count: {response.get('rejection_count', 0)}")
            print(f"   🔓 Eligible: {response.get('eligible', False)}")
            print(f"   💾 Has cached: {response.get('has_cached', False)}")
            print(f"   🔄 Can regenerate: {response.get('can_regenerate', True)}")
            
            # Check required fields
            required_fields = ['rejection_count', 'eligible', 'has_cached', 'can_regenerate']
            if all(field in response for field in required_fields):
                print("   ✅ All required fields present")
                return True, response
            else:
                print("   ❌ Missing required fields")
        
        return False, {}

    def test_insights_generate_insufficient(self):
        """Test insights generate with insufficient rejections (should fail)"""
        success, response = self.run_test(
            "Insights Generate (Insufficient Rejections)",
            "POST",
            "insights/generate",
            400
        )
        
        if success and 'detail' in response:
            if 'rejections' in response['detail'].lower():
                print("   ✅ Correctly rejects with insufficient rejections")
                return True
        
        return False

def main():
    print("🚀 Testing Insights API Endpoints...")
    tester = InsightsAPITester()
    
    # Login as job seeker
    if not tester.test_job_seeker_login():
        print("❌ Job seeker login failed, stopping tests")
        return 1
    
    # Test insights status
    success, status_response = tester.test_insights_status()
    if not success:
        print("❌ Insights status test failed")
        return 1
    
    # Test insights generate (should fail due to insufficient rejections)
    if not tester.test_insights_generate_insufficient():
        print("❌ Insights generate test failed")
        return 1
    
    # Print results
    print(f"\n📊 Tests passed: {tester.tests_passed}/{tester.tests_run}")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All insights tests passed!")
        return 0
    else:
        print("⚠️  Some insights tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())