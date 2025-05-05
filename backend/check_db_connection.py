import os
from dotenv import load_dotenv
import psycopg2

# Load environment variables
load_dotenv()

# Print all environment variables for debugging
print("=== Environment Variables ===")
for key, value in os.environ.items():
    if "PASSWORD" in key or "SECRET" in key:
        print(f"{key}=*****")  # Don't print sensitive data
    else:
        print(f"{key}={value}")
print("============================")

# Get database connection info
db_url = os.getenv("DATABASE_URL")
print(f"DATABASE_URL: {db_url}")

# Parse the DB URL
if db_url:
    # Format typically: postgresql://user:password@host:port/dbname
    try:
        # Parse the URL components manually
        if "://" in db_url:
            protocol_part, rest = db_url.split("://", 1)
            print(f"Protocol: {protocol_part}")
            
            auth_host_part, db_name = rest.split("/", 1)
            print(f"DB Name: {db_name}")
            
            if "@" in auth_host_part:
                auth_part, host_part = auth_host_part.split("@", 1)
                print(f"Host Part: {host_part}")
                
                if ":" in auth_part:
                    username, password = auth_part.split(":", 1)
                    print(f"Username: {username}")
                    print(f"Password: {'*' * len(password) if password else 'None'}")
                else:
                    username = auth_part
                    password = None
                    print(f"Username: {username}")
                    print(f"Password: None")
            else:
                host_part = auth_host_part
                username = None
                password = None
                print(f"Host Part: {host_part}")
                print("Username: None")
                print("Password: None")

            # Try to connect
            print("\nAttempting to connect to database...")
            conn = None
            try:
                if "postgres" in db_url or "postgresql" in db_url:
                    # Extract connection parameters from the URL
                    user = username
                    password_str = password
                    host = host_part.split(":")[0] if ":" in host_part else host_part
                    port = host_part.split(":")[1] if ":" in host_part else "5432"
                    
                    conn = psycopg2.connect(
                        user=user,
                        password=password_str,
                        host=host,
                        port=port,
                        database=db_name
                    )
                    cursor = conn.cursor()
                    cursor.execute("SELECT version();")
                    db_version = cursor.fetchone()
                    print(f"Connection successful! Database version: {db_version}")
                    cursor.close()
            except Exception as e:
                print(f"Connection error: {e}")
            finally:
                if conn:
                    conn.close()
                    
    except Exception as e:
        print(f"Error parsing DATABASE_URL: {e}")
else:
    print("DATABASE_URL environment variable is not set!")

# Try to get postgres env variables
postgres_user = os.getenv("POSTGRES_USER")
postgres_password = os.getenv("POSTGRES_PASSWORD") 
postgres_db = os.getenv("POSTGRES_DB")
postgres_host = os.getenv("POSTGRES_HOST", "postgres")

print("\n=== PostgreSQL Environment Variables ===")
print(f"POSTGRES_USER: {postgres_user}")
print(f"POSTGRES_PASSWORD: {'*****' if postgres_password else 'Not set'}")
print(f"POSTGRES_DB: {postgres_db}")
print(f"POSTGRES_HOST: {postgres_host}")

if postgres_user and postgres_password and postgres_db:
    # Try to connect with these credentials
    print("\nAttempting to connect with POSTGRES_* variables...")
    try:
        conn = psycopg2.connect(
            user=postgres_user,
            password=postgres_password,
            host=postgres_host,
            port="5432",
            database=postgres_db
        )
        cursor = conn.cursor()
        cursor.execute("SELECT version();")
        db_version = cursor.fetchone()
        print(f"Connection successful! Database version: {db_version}")
        
        # Generate correct DATABASE_URL
        correct_url = f"postgresql://{postgres_user}:{postgres_password}@{postgres_host}:5432/{postgres_db}"
        print(f"\nSuggested DATABASE_URL: postgresql://{postgres_user}:****@{postgres_host}:5432/{postgres_db}")
        
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"Connection error: {e}")
else:
    print("\nMissing some PostgreSQL environment variables. Can't test connection.") 