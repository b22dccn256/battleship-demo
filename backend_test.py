import requests
import sys
import json
from datetime import datetime

class BattleShipAPITester:
    def __init__(self, base_url="https://naval-battle-tcp.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}" if not endpoint.startswith('http') else endpoint
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        if headers:
            test_headers.update(headers)

        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)

            success = response.status_code == expected_status
            
            if success:
                print(f"   Status: {response.status_code} ✅")
                try:
                    response_data = response.json()
                    print(f"   Response: {json.dumps(response_data, indent=2)[:200]}...")
                    self.log_test(name, True)
                    return True, response_data
                except:
                    self.log_test(name, True, "No JSON response")
                    return True, {}
            else:
                error_msg = f"Expected {expected_status}, got {response.status_code}"
                try:
                    error_detail = response.json()
                    error_msg += f" - {error_detail}"
                except:
                    error_msg += f" - {response.text[:100]}"
                
                print(f"   Status: {response.status_code} ❌")
                print(f"   Error: {error_msg}")
                self.log_test(name, False, error_msg)
                return False, {}

        except requests.exceptions.RequestException as e:
            error_msg = f"Request failed: {str(e)}"
            print(f"   Error: {error_msg}")
            self.log_test(name, False, error_msg)
            return False, {}

    def test_root_endpoint(self):
        """Test root API endpoint"""
        return self.run_test("Root API", "GET", "", 200)

    def test_user_registration(self, username, password):
        """Test user registration"""
        success, response = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            200,
            data={"username": username, "password": password}
        )
        if success and 'access_token' in response:
            self.token = response['access_token']
            print(f"   Token obtained: {self.token[:20]}...")
            return True
        return False

    def test_user_login(self, username, password):
        """Test user login"""
        success, response = self.run_test(
            "User Login",
            "POST",
            "auth/login",
            200,
            data={"username": username, "password": password}
        )
        if success and 'access_token' in response:
            self.token = response['access_token']
            print(f"   Token obtained: {self.token[:20]}...")
            return True
        return False

    def test_get_user_profile(self):
        """Test get current user profile"""
        return self.run_test("Get User Profile", "GET", "auth/me", 200)

    def test_leaderboard(self):
        """Test leaderboard endpoint"""
        return self.run_test("Get Leaderboard", "GET", "leaderboard", 200)

    def test_game_history(self):
        """Test game history endpoint"""
        return self.run_test("Get Game History", "GET", "history", 200)

    def test_invalid_login(self):
        """Test login with invalid credentials"""
        return self.run_test(
            "Invalid Login",
            "POST",
            "auth/login",
            400,
            data={"username": "nonexistent", "password": "wrongpass"}
        )

    def test_unauthorized_access(self):
        """Test accessing protected endpoint without token"""
        old_token = self.token
        self.token = None
        success, _ = self.run_test("Unauthorized Access", "GET", "auth/me", 401)
        self.token = old_token
        return success

def main():
    print("🚀 Starting BattleShip API Tests")
    print("=" * 50)
    
    tester = BattleShipAPITester()
    test_user = f"testuser_{datetime.now().strftime('%H%M%S')}"
    test_password = "TestPass123!"

    # Test sequence
    print("\n📋 Running API Tests...")
    
    # 1. Test root endpoint
    tester.test_root_endpoint()
    
    # 2. Test user registration
    if not tester.test_user_registration(test_user, test_password):
        print("❌ Registration failed, stopping tests")
        return 1

    # 3. Test user profile
    tester.test_get_user_profile()
    
    # 4. Test leaderboard
    tester.test_leaderboard()
    
    # 5. Test game history
    tester.test_game_history()
    
    # 6. Test invalid login
    tester.test_invalid_login()
    
    # 7. Test unauthorized access
    tester.test_unauthorized_access()
    
    # 8. Test login with existing user
    tester.test_user_login(test_user, test_password)

    # Print final results
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print("⚠️  Some tests failed!")
        print("\nFailed tests:")
        for result in tester.test_results:
            if not result['success']:
                print(f"  - {result['test']}: {result['details']}")
        return 1

if __name__ == "__main__":
    sys.exit(main())