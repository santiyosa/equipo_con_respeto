import os
from dotenv import load_dotenv

print("--- Diagnostic Script Start ---")

# 1. Print the variable as Python sees it initially
initial_url = os.getenv("DATABASE_URL")
print(f"1. DATABASE_URL from the initial environment is: {initial_url}")

# Try to encode it to see the raw bytes
try:
    if initial_url:
        print(f"   As bytes: {initial_url.encode('utf-8')}")
except Exception as e:
    print(f"   Error encoding to UTF-8: {e}")

print("-" * 30)

# 2. Load .env from the file system
load_dotenv(override=True, encoding='latin-1')

# 3. Print the variable after forcing an override from the .env file
final_url = os.getenv("DATABASE_URL")
print(f"2. DATABASE_URL after loading .env with override is: {final_url}")

print("--- Diagnostic Script End ---")
