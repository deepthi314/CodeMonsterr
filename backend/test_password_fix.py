import sys
import os

# Add the current directory to sys.path so we can import auth
sys.path.append(os.getcwd())

import auth

def test_password_fix():
    print("Testing password hashing with >72 characters...")
    
    # A password longer than 72 characters (100 'a's)
    long_password = "a" * 100
    print(f"Password length: {len(long_password)}")
    
    try:
        # Step 1: Hash the long password
        hashed = auth.get_password_hash(long_password)
        print("Successfully hashed long password.")
        
        # Step 2: Verify the long password
        is_valid = auth.verify_password(long_password, hashed)
        if is_valid:
            print("Successfully verified long password!")
        else:
            print("Failed to verify long password.")
            return False
            
        # Step 3: Test with incorrect password
        is_invalid = auth.verify_password(long_password + "incorrect", hashed)
        if not is_invalid:
            print("Successfully rejected incorrect password.")
        else:
            print("Failed: Incorrect password was accepted.")
            return False
            
        # Step 4: Test a normal length password to ensure no regression
        normal_password = "mypassword123"
        normal_hashed = auth.get_password_hash(normal_password)
        if auth.verify_password(normal_password, normal_hashed):
            print("Successfully verified normal password.")
        else:
            print("Failed to verify normal password.")
            return False
            
        print("\nAll password tests PASSED!")
        return True
        
    except ValueError as e:
        print(f"Caught expected/unexpected ValueError: {e}")
        return False
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        return False

if __name__ == "__main__":
    success = test_password_fix()
    if not success:
        sys.exit(1)
