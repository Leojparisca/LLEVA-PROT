
import requests
import json
import sys
import time
from datetime import datetime

class LLEVAAPITester:
    def __init__(self, base_url="https://kudvqtflwwyazpzgxtib.supabase.co"):
        self.base_url = base_url
        self.anon_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1ZHZxdGZsd3d5YXpwemd4dGliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgyNzExNjEsImV4cCI6MjA2Mzg0NzE2MX0.IBhdlaUpPwzX54uMpwLm6Ww8mdkmSESk9760oKxOaAE"
        self.headers = {
            "apikey": self.anon_key,
            "Content-Type": "application/json"
        }
        self.auth_token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_user_email = f"test_user_{int(time.time())}@example.com"
        self.test_user_password = "Test123456!"

    def run_test(self, name, method, endpoint, expected_status, data=None, auth_required=False):
        """Run a single API test"""
        url = f"{self.base_url}/rest/v1/{endpoint}"
        headers = self.headers.copy()
        
        if auth_required and self.auth_token:
            headers["Authorization"] = f"Bearer {self.auth_token}"

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

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
                    print(f"Response: {response.json()}")
                except:
                    print(f"Response: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_auth_signup(self):
        """Test user signup with Supabase Auth"""
        url = f"{self.base_url}/auth/v1/signup"
        data = {
            "email": self.test_user_email,
            "password": self.test_user_password,
            "data": {
                "full_name": "Test User",
                "user_type": "customer"
            }
        }
        
        print(f"\n🔍 Testing Auth Signup...")
        try:
            response = requests.post(url, json=data, headers=self.headers)
            
            if response.status_code == 200:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                response_data = response.json()
                self.auth_token = response_data.get("access_token")
                self.user_id = response_data.get("user", {}).get("id")
                print(f"Created test user: {self.test_user_email}")
                return True, response_data
            else:
                print(f"❌ Failed - Status: {response.status_code}")
                print(f"Response: {response.json()}")
                return False, {}
                
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_auth_signin(self):
        """Test user signin with Supabase Auth"""
        url = f"{self.base_url}/auth/v1/token?grant_type=password"
        data = {
            "email": self.test_user_email,
            "password": self.test_user_password
        }
        
        print(f"\n🔍 Testing Auth Signin...")
        try:
            response = requests.post(url, json=data, headers=self.headers)
            
            if response.status_code == 200:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                response_data = response.json()
                self.auth_token = response_data.get("access_token")
                return True, response_data
            else:
                print(f"❌ Failed - Status: {response.status_code}")
                print(f"Response: {response.json()}")
                return False, {}
                
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_create_profile(self):
        """Test creating a user profile"""
        if not self.user_id or not self.auth_token:
            print("❌ Cannot test profile creation without user authentication")
            return False, {}
            
        data = {
            "id": self.user_id,
            "full_name": "Test User",
            "user_type": "customer",
            "phone": "+1234567890",
            "city": "Test City"
        }
        
        return self.run_test(
            "Create Profile", 
            "POST", 
            "profiles", 
            201, 
            data=data,
            auth_required=True
        )

    def test_get_profile(self):
        """Test getting a user profile"""
        if not self.user_id or not self.auth_token:
            print("❌ Cannot test profile retrieval without user authentication")
            return False, {}
            
        return self.run_test(
            "Get Profile", 
            "GET", 
            f"profiles?id=eq.{self.user_id}&select=*", 
            200, 
            auth_required=True
        )

    def test_create_trip(self):
        """Test creating a trip"""
        if not self.user_id or not self.auth_token:
            print("❌ Cannot test trip creation without user authentication")
            return False, {}
            
        data = {
            "customer_id": self.user_id,
            "pickup_location": "Test Pickup Location",
            "destination": "Test Destination",
            "vehicle_type": "taxi",
            "taxi_type": "básico",
            "status": "pending"
        }
        
        return self.run_test(
            "Create Trip", 
            "POST", 
            "trips", 
            201, 
            data=data,
            auth_required=True
        )

    def test_create_delivery_order(self):
        """Test creating a delivery order"""
        if not self.user_id or not self.auth_token:
            print("❌ Cannot test delivery order creation without user authentication")
            return False, {}
        
        # First, get a merchant
        success, merchants = self.run_test(
            "Get Merchants", 
            "GET", 
            "merchants?select=*", 
            200
        )
        
        if not success or not merchants:
            print("❌ Cannot test delivery order creation without merchants")
            return False, {}
            
        merchant_id = merchants[0]["id"] if merchants else None
        
        if not merchant_id:
            print("❌ No merchant found for delivery order test")
            return False, {}
            
        data = {
            "customer_id": self.user_id,
            "merchant_id": merchant_id,
            "pickup_location": "Test Merchant Location",
            "delivery_location": "Test Delivery Location",
            "order_details": "Test order details",
            "status": "pending"
        }
        
        return self.run_test(
            "Create Delivery Order", 
            "POST", 
            "delivery_orders", 
            201, 
            data=data,
            auth_required=True
        )

    def test_get_merchants(self):
        """Test getting merchants"""
        return self.run_test(
            "Get Merchants", 
            "GET", 
            "merchants?select=*", 
            200
        )

def main():
    tester = LLEVAAPITester()
    
    # Test authentication
    auth_success, _ = tester.test_auth_signup()
    if not auth_success:
        # Try signin if signup fails (user might already exist)
        auth_success, _ = tester.test_auth_signin()
        if not auth_success:
            print("❌ Authentication failed, stopping tests")
            return 1
    
    # Test profile operations
    profile_success, _ = tester.test_create_profile()
    if profile_success:
        tester.test_get_profile()
    
    # Test trip creation
    tester.test_create_trip()
    
    # Test merchants and delivery
    tester.test_get_merchants()
    tester.test_create_delivery_order()
    
    # Print results
    print(f"\n📊 Tests passed: {tester.tests_passed}/{tester.tests_run}")
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())
