import os
from dotenv import load_dotenv
import sys

# Load environment variables
load_dotenv()

# Get Postgres credentials from environment
postgres_user = os.getenv("POSTGRES_USER")
postgres_password = os.getenv("POSTGRES_PASSWORD")
postgres_db = os.getenv("POSTGRES_DB")
postgres_host = os.getenv("POSTGRES_HOST", "postgres")

if not all([postgres_user, postgres_password, postgres_db]):
    print("ERROR: Missing required PostgreSQL environment variables.")
    print(f"POSTGRES_USER: {'Found' if postgres_user else 'MISSING'}")
    print(f"POSTGRES_PASSWORD: {'Found' if postgres_password else 'MISSING'}")
    print(f"POSTGRES_DB: {'Found' if postgres_db else 'MISSING'}")
    
    # Try to get them from command line if not found
    if not postgres_user:
        postgres_user = input("Enter PostgreSQL username: ")
    if not postgres_password:
        postgres_password = input("Enter PostgreSQL password: ")
    if not postgres_db:
        postgres_db = input("Enter PostgreSQL database name: ")
    if not postgres_host:
        postgres_host = input("Enter PostgreSQL host (default 'postgres'): ") or "postgres"

# Generate the correct DATABASE_URL
correct_url = f"postgresql://{postgres_user}:{postgres_password}@{postgres_host}:5432/{postgres_db}"

# Check if current DATABASE_URL is correct
current_url = os.getenv("DATABASE_URL", "")
if current_url == correct_url:
    print("DATABASE_URL is already correctly set!")
    sys.exit(0)

print(f"Current DATABASE_URL: {current_url if current_url else 'Not set'}")
print(f"Correct DATABASE_URL: postgresql://{postgres_user}:****@{postgres_host}:5432/{postgres_db}")

# Look for .env file
env_file_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".env")
if not os.path.exists(env_file_path):
    env_file_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
    
if not os.path.exists(env_file_path):
    # Create a new .env file in the backend directory
    env_file_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
    print(f"Creating a new .env file at {env_file_path}")
    with open(env_file_path, "w") as f:
        f.write(f"DATABASE_URL={correct_url}\n")
        f.write(f"POSTGRES_USER={postgres_user}\n")
        f.write(f"POSTGRES_PASSWORD={postgres_password}\n")
        f.write(f"POSTGRES_DB={postgres_db}\n")
        f.write(f"POSTGRES_HOST={postgres_host}\n")
    print("Created .env file with correct database configuration.")
else:
    # Update existing .env file
    print(f"Updating existing .env file at {env_file_path}")
    
    # Read current content
    with open(env_file_path, "r") as f:
        lines = f.readlines()
    
    # Check if DATABASE_URL exists in the file
    has_db_url = any(line.startswith("DATABASE_URL=") for line in lines)
    
    if has_db_url:
        # Replace DATABASE_URL line
        new_lines = []
        for line in lines:
            if line.startswith("DATABASE_URL="):
                new_lines.append(f"DATABASE_URL={correct_url}\n")
            else:
                new_lines.append(line)
        
        # Write updated content
        with open(env_file_path, "w") as f:
            f.writelines(new_lines)
    else:
        # Append DATABASE_URL line
        with open(env_file_path, "a") as f:
            f.write(f"\nDATABASE_URL={correct_url}\n")
    
    print("Updated .env file with correct DATABASE_URL.")
    
print("\nPlease restart your backend container for changes to take effect:")
print("docker-compose restart backend") 