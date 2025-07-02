from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlmodel import SQLModel, create_engine, select
from passlib.context import CryptContext
import random
import os
from dotenv import load_dotenv
import sys
from sqlalchemy import text, inspect
import pytz

# Patch for bcrypt/__about__ issue
import bcrypt
if not hasattr(bcrypt, '__about__'):
    bcrypt.__about__ = type('obj', (object,), {
        '__version__': bcrypt.__version__
    })

from models import (
    User, Journal, JournalEntry, AuthorUpdate, RefereeUpdate, Settings,
    UserRole, JournalEntryStatus, ArticleType,
    ArticleLanguage, JournalEditorLink, JournalEntryAuthorLink, JournalEntryRefereeLink
)

# Load environment variables from .env file
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable not set")

# Connection parameters
engine = create_engine(DATABASE_URL, echo=True)  # echo=True logs SQL queries for debugging

# Setup password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Password hashing function
def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def clear_existing_data(session):
    """Clear all existing data from the database except user ID 1 and journal ID 1"""
    try:
        # Delete in the correct order to respect foreign key constraints
        print("🧹 Clearing existing data (preserving user ID 1 and journal ID 1)...")
        
        # Helper function to safely delete from table if it exists
        def safe_delete(table_name, condition=""):
            try:
                # Check if table exists
                result = session.execute(text(f"""
                    SELECT EXISTS (
                        SELECT FROM information_schema.tables 
                        WHERE table_name = '{table_name}'
                    )
                """)).scalar()
                
                if result:
                    delete_sql = f"DELETE FROM {table_name}"
                    if condition:
                        delete_sql += f" {condition}"
                    session.execute(text(delete_sql))
                    print(f"   ✅ Cleared {table_name}")
                else:
                    print(f"   ⚠️ Table {table_name} doesn't exist, skipping")
            except Exception as e:
                print(f"   ⚠️ Error clearing {table_name}: {e}")
        
        # Delete updates first (simpler approach - delete all since we'll recreate them)
        safe_delete("referee_updates")
        safe_delete("author_updates")
        
        # Delete links (except those for journal ID 1 and user ID 1)
        safe_delete("journal_entry_referee_link")
        safe_delete("journal_entry_author_link")
        safe_delete("journal_editor_link", "WHERE journal_id != 1 AND user_id != 1")
        
        # Delete journal entries (except those in journal ID 1)
        safe_delete("journalentry", "WHERE journal_id != 1")
        
        # Delete journals (except journal ID 1)
        safe_delete("journal", "WHERE id != 1")
        
        # Delete users except user ID 1 (owner)
        safe_delete("users", "WHERE id != 1")
        
        # Delete settings
        safe_delete("settings")
        
        session.commit()
        print("🎯 All existing data cleared successfully (user ID 1 and journal ID 1 preserved)!")
        
    except Exception as e:
        print(f"⚠️ Error clearing data: {e}")
        session.rollback()
        raise

def seed_database():
    # Create session
    with Session(engine) as session:
        # Always clear existing data except user ID 1 and journal ID 1
        print("🚀 Starting database seeding process...")
        clear_existing_data(session)
        
        # Continue with seeding...
        # First, check if we need to update the userrole enum in the database
        try:
            # Check if 'owner' is already in the enum
            result = session.execute(text("SELECT enum_range(NULL::userrole)")).scalar()
            if 'owner' not in result:
                print("Adding 'owner' to userrole enum type...")
                
                # Try to add the value directly first
                try:
                    session.execute(text("ALTER TYPE userrole ADD VALUE 'owner' AFTER 'admin'"))
                    session.commit()
                    print("✅ Added 'owner' to userrole enum type.")
                except Exception as add_error:
                    print(f"Could not directly add the enum value: {add_error}")
                    print("Attempting to work around the issue by inserting directly...")
                    
                    # Alternative approach: Insert the value directly using a type cast
                    try:
                        # First, create owner user with a temporary role to be updated
                        owner_user = User(
                            id=1,
                            email="owner@owner.com",
                            name="Owner User",
                            title="Prof. Dr.",
                            bio="System owner with full access",
                            telephone="555-0000",
                            science_branch="Social Sciences",
                            location=random.choice(cities),
                            yoksis_id="Y00001",
                            orcid_id="0000-0000-0000-0001",
                            role=UserRole.admin,  # Temporary role
                            is_auth=True,
                            hashed_password=get_password_hash("ownerpassword"),
                            confirmation_token="owner_token",
                            confirmation_token_created_at=datetime.utcnow(),
                            marked_for_deletion=False,  # Admins should not be marked for deletion
                            tutorial_done=True  # Admins should have completed the tutorial
                        )
                        session.add(owner_user)
                        session.commit()
                        
                        # Then update the user's role directly using SQL
                        session.execute(text(f"UPDATE users SET role = 'owner'::userrole WHERE id = 1"))
                        session.commit()
                        print("✅ Added owner user with role updated via SQL.")
                        
                        # Remove the owner user from the creation list since we just created it
                        users = [user for user in users if user.id != 1]
                    except Exception as insert_error:
                        print(f"Failed alternative approach: {insert_error}")
                        # Continue anyway and let the script try its best
        except Exception as e:
            print(f"WARNING: Error checking or updating enum type: {e}")
            print("This might cause issues with creating the owner user. Continuing anyway...")
        
        # Using the actual database enum values (not the model enum values)
        # Database has: SOCIAL_SCIENCES, NATURAL_SCIENCES, FORMAL_SCIENCES, APPLIED_SCIENCES, HUMANITIES
        
        science_branch_samples = [
            "Educational Sciences", "Science and Mathematics", "Philology", "Fine Arts", "Law", "Theology",
            "Architecture, Planning and Design", "Engineering", "Social, Human and Administrative Sciences",
            "Social Sciences", "Applied Sciences", "Humanities", "Agriculture, Forestry and Aquaculture",
            "Sports Sciences", "Health Sciences"
        ]
        
        user_title_samples = [
            "Prof. Dr.", "Assoc. prof.", "Faculty Member/Dr.", "Dr.",
            "Instructor", "Dr. Lecturer", "Research Assistant Doctor", "Other"
        ]

        # Additional cities for more variety
        cities = [
            "Istanbul", "Ankara", "Izmir", "Bursa", "Antalya", "Adana", "Trabzon", "Konya", 
            "Kayseri", "Mersin", "Eskişehir", "Diyarbakır", "Gaziantep", "Samsun", "Van", 
            "Denizli", "Manisa", "Malatya", "Hatay", "Erzurum", "Çanakkale", "Edirne"
        ]
        
        # Turkish names for realistic user data
        turkish_male_names = [
            "Ahmet", "Mehmet", "Mustafa", "Ali", "Hasan", "Hüseyin", "İbrahim", "İsmail", "Osman", "Süleyman",
            "Yusuf", "Abdullah", "Ömer", "Fatih", "Emre", "Burak", "Murat", "Serkan", "Kemal", "Cemal",
            "Erhan", "Tolga", "Cem", "Onur", "Barış", "Taner", "Volkan", "Özkan", "Erdem", "Gökhan"
        ]
        
        turkish_female_names = [
            "Fatma", "Ayşe", "Emine", "Hatice", "Zeynep", "Elif", "Merve", "Büşra", "Seda", "Esra",
            "Özlem", "Sevgi", "Pınar", "Dilek", "Serpil", "Gülşen", "Nesrin", "Sibel", "Tülay", "Gonca",
            "Burcu", "Ebru", "Gamze", "Hülya", "İpek", "Jale", "Kezban", "Lale", "Meryem", "Nurten"
        ]
        
        turkish_surnames = [
            "Yılmaz", "Kaya", "Demir", "Şahin", "Çelik", "Yıldız", "Yıldırım", "Öztürk", "Aydin", "Özdemir",
            "Arslan", "Doğan", "Kılıç", "Aslan", "Çetin", "Kara", "Koç", "Kurt", "Özkan", "Şimşek", 
            "Erdoğan", "Güneş", "Akbaş", "Aktaş", "Bulut", "Duman", "Erdem", "Gül", "Karaca", "Korkmaz",
            "Özgür", "Polat", "Sarı", "Taş", "Tekin", "Tunç", "Uysal", "Vural", "Yaman", "Zengin"
        ]
        
        # Check if admin users already exist
        admin2_exists = session.execute(text("SELECT id FROM users WHERE id = 2")).first()
        admin3_exists = session.execute(text("SELECT id FROM users WHERE id = 3")).first()
        
        # Create admin users (2) with Turkish names
        users = []
        
        # Create admin user 2 if it doesn't exist
        if not admin2_exists:
            admin2_name = f"{random.choice(turkish_male_names)} {random.choice(turkish_surnames)}"
            print(f"🔍 Creating admin user 2 with Turkish name: {admin2_name}")
            admin2 = User(
                id=2,
                email="admin2@admin.com",
                name=admin2_name,
                title="Prof. Dr.",
                bio="Sistem yöneticisi",
                telephone="555-0020",
                science_branch="Social Sciences",
                location=random.choice(cities),
                yoksis_id="Y000002",
                orcid_id="0000-0000-0000-0002",
                role=UserRole.admin,
                is_auth=True,
                hashed_password=get_password_hash("admin2password"),
                confirmation_token="admin2_token",
                confirmation_token_created_at=datetime.utcnow(),
                marked_for_deletion=False,
                tutorial_done=True
            )
            users.append(admin2)
            print(f"✅ Added admin user 2: {admin2.name} to users list")
        else:
            print("Admin user 2 already exists, skipping creation")
        
        # Create admin user 3 if it doesn't exist
        if not admin3_exists:
            admin3_name = f"{random.choice(turkish_female_names)} {random.choice(turkish_surnames)}"
            print(f"🔍 Creating admin user 3 with Turkish name: {admin3_name}")
            admin3 = User(
                id=3,
                email="admin3@admin.com",
                name=admin3_name,
                title="Prof. Dr.",
                bio="Sistem yöneticisi",
                telephone="555-0030",
                science_branch="Social Sciences",
                location=random.choice(cities),
                yoksis_id="Y000003",
                orcid_id="0000-0000-0000-0003",
                role=UserRole.admin,
                is_auth=True,
                hashed_password=get_password_hash("admin3password"),
                confirmation_token="admin3_token",
                confirmation_token_created_at=datetime.utcnow(),
                marked_for_deletion=False,
                tutorial_done=True
            )
            users.append(admin3)
            print(f"✅ Added admin user 3: {admin3.name} to users list")
        else:
            print("Admin user 3 already exists, skipping creation")
        
        # Check if owner user exists in the database
        owner_exists = session.execute(text("SELECT id FROM users WHERE id = 1")).first()
        
        # If we cleared data but preserved user ID 1, we should update their name to Turkish
        if owner_exists:
            try:
                owner_name = f"{random.choice(turkish_male_names)} {random.choice(turkish_surnames)}"
                session.execute(
                    text("UPDATE users SET name = :name, bio = :bio WHERE id = 1"),
                    {"name": owner_name, "bio": "Tam yetkili sistem sahibi"}
                )
                session.commit()
                print(f"✅ Updated owner user (ID 1) with Turkish name: {owner_name}")
            except Exception as update_error:
                print(f"⚠️ Could not update owner user name: {update_error}")
        
        # Create owner users (3 total)
        # First, the primary owner
        if not owner_exists:
            try:
                owner_name = f"{random.choice(turkish_male_names)} {random.choice(turkish_surnames)}"
                owner_user = User(
                    id=1,
                    email="owner@owner.com",
                    name=owner_name,
                    title="Prof. Dr.",
                    bio="Tam yetkili sistem sahibi",
                    telephone="555-0000",
                    science_branch="Social Sciences",
                    location=random.choice(cities),
                    yoksis_id="Y00001",
                    orcid_id="0000-0000-0000-0001",
                    role=UserRole.owner,
                    is_auth=True,
                    hashed_password=get_password_hash("ownerpassword"),
                    confirmation_token="owner_token",
                    confirmation_token_created_at=datetime.utcnow(),
                    marked_for_deletion=False,  # Owners should not be marked for deletion
                    tutorial_done=True  # Owners should have completed the tutorial
                )
                users.append(owner_user)
                print("Added primary owner user to be created")
            except Exception as owner_error:
                print(f"Could not create primary owner user: {owner_error}")
                # Use admin role as fallback
                try:
                    owner_name = f"{random.choice(turkish_male_names)} {random.choice(turkish_surnames)}"
                    owner_user = User(
                        id=1,
                        email="owner@owner.com",
                        name=owner_name,
                        title="Prof. Dr.",
                        bio="Tam yetkili sistem sahibi",
                        telephone="555-0000",
                        science_branch="Social Sciences",
                        location=random.choice(cities),
                        yoksis_id="Y00001",
                        orcid_id="0000-0000-0000-0001",
                        role=UserRole.admin,  # Fallback to admin role
                        is_auth=True,
                        hashed_password=get_password_hash("ownerpassword"),
                        confirmation_token="owner_token",
                        confirmation_token_created_at=datetime.utcnow(),
                        marked_for_deletion=False,  # Should not be marked for deletion
                        tutorial_done=True  # Should have completed the tutorial
                    )
                    users.append(owner_user)
                    print("Added primary owner user with admin role as fallback")
                except Exception as fallback_error:
                    print(f"Could not create primary owner user even with fallback: {fallback_error}")
        else:
            print("Primary owner user already exists, skipping creation")
        
        # Check if additional owner users already exist
        owner2_exists = session.execute(text("SELECT id FROM users WHERE id = 40")).first()
        owner3_exists = session.execute(text("SELECT id FROM users WHERE id = 41")).first()
        
        # Add 2 more owner users with different IDs
        try:
            # Owner user 2
            if not owner2_exists:
                owner2_name = f"{random.choice(turkish_female_names)} {random.choice(turkish_surnames)}"
                owner_user2 = User(
                    id=40,  # Using a higher ID to avoid conflicts (after all other users)
                    email="owner2@owner.com",
                    name=owner2_name,
                    title="Prof. Dr.",
                    bio="İkinci sistem sahibi - tam yetki",
                    telephone="555-0100",
                    science_branch="Architecture, Planning and Design",
                    location=random.choice(cities),
                    yoksis_id="Y00040",
                    orcid_id="0000-0000-0000-0040",
                    role=UserRole.owner,
                    is_auth=True,
                    hashed_password=get_password_hash("owner2password"),
                    confirmation_token="owner2_token",
                    confirmation_token_created_at=datetime.utcnow(),
                    marked_for_deletion=False,  # Should not be marked for deletion
                    tutorial_done=True  # Should have completed the tutorial
                )
                users.append(owner_user2)
                print("Added second owner user")
            else:
                print("Second owner user already exists, skipping creation")
            
            # Owner user 3
            if not owner3_exists:
                owner3_name = f"{random.choice(turkish_male_names)} {random.choice(turkish_surnames)}"
                owner_user3 = User(
                    id=41,  # Using a higher ID to avoid conflicts
                    email="owner3@owner.com",
                    name=owner3_name,
                    title="Assoc. prof.",
                    bio="Üçüncü sistem sahibi - tam yetki",
                    telephone="555-0101",
                    science_branch="Engineering",
                    location=random.choice(cities),
                    yoksis_id="Y00041",
                    orcid_id="0000-0000-0000-0041",
                    role=UserRole.owner,
                    is_auth=True,
                    hashed_password=get_password_hash("owner3password"),
                    confirmation_token="owner3_token",
                    confirmation_token_created_at=datetime.utcnow(),
                    marked_for_deletion=False,  # Should not be marked for deletion
                    tutorial_done=True  # Should have completed the tutorial
                )
                users.append(owner_user3)
                print("Added third owner user")
            else:
                print("Third owner user already exists, skipping creation")
        except Exception as e:
            print(f"Could not create additional owner users: {e}")
        
        # Editor users (10) - Doubled from 5
        editors = []
        for i in range(1, 11):
            selected_title = random.choice(user_title_samples)
            selected_bio_specialization = random.choice([
                'Kentsel Çalışmalar', 'Mimarlık', 'Tasarım', 'Kültürel Çalışmalar', 'Sosyal Bilimler',
                'Sürdürülebilir Tasarım', 'Miras Koruma', 'Kentsel Planlama', 'Dijital Mimarlık',
                'Altyapı Tasarımı', 'İç Mimarlık', 'Peyzaj Mimarlığı'
            ])
            selected_science_branch = random.choice(science_branch_samples)
            selected_location = random.choice(cities)
            
            # Random chance for tutorial completion and deletion marking
            tutorial_done = random.random() < 0.9  # 90% chance of having completed tutorial
            marked_for_deletion = random.random() < 0.05  # 5% chance of being marked for deletion

            # Generate Turkish name
            gender = random.choice(['male', 'female'])
            if gender == 'male':
                first_name = random.choice(turkish_male_names)
            else:
                first_name = random.choice(turkish_female_names)
            surname = random.choice(turkish_surnames)
            full_name = f"{first_name} {surname}"

            editor = User(
                id=i+3,  # Start IDs at 4 (after 3 admins)
                email=f"editor{i}@example.com",
                name=full_name,
                title=selected_title,
                bio=f"{selected_bio_specialization} konusunda uzman editör",
                telephone=f"555-1{i}00",
                science_branch=selected_science_branch,
                location=selected_location,
                yoksis_id=f"Y1234{i}",
                orcid_id=f"0000-0001-1234-{i:03d}",
                role=UserRole.editor,
                is_auth=True,
                hashed_password=get_password_hash(f"editor{i}password"),
                confirmation_token=f"editor{i}_token",
                confirmation_token_created_at=datetime.utcnow(),
                marked_for_deletion=marked_for_deletion,
                tutorial_done=tutorial_done
            )
            editors.append(editor)
        users.extend(editors)
        
        # Author users (16) - Doubled from 8
        authors = []
        for i in range(1, 17):
            selected_title = random.choice(user_title_samples)
            selected_bio_specialization = random.choice([
                'mimarlık', 'kentsel planlama', 'tasarım teorisi', 'sosyal mekanlar', 'kültürel miras',
                'peyzaj tasarımı', 'tarihi koruma', 'sürdürülebilir kentsel gelişim', 
                'mimarlık tarihi', 'dijital tasarım', 'parametrik tasarım', 'mekansal analiz',
                'kentsel sosyoloji', 'altyapı planlaması', 'yapı malzemeleri', 'mimari akustik'
            ])
            selected_science_branch = random.choice(science_branch_samples)
            selected_location = random.choice(cities)

            # Random chance for tutorial completion and deletion marking
            tutorial_done = random.random() < 0.7  # 70% chance of having completed tutorial
            marked_for_deletion = random.random() < 0.1  # 10% chance of being marked for deletion

            # Generate Turkish name
            gender = random.choice(['male', 'female'])
            if gender == 'male':
                first_name = random.choice(turkish_male_names)
            else:
                first_name = random.choice(turkish_female_names)
            surname = random.choice(turkish_surnames)
            full_name = f"{first_name} {surname}"

            author = User(
                id=i+13,  # Start at 14 (after 3 admins + 10 editors)
                email=f"author{i}@example.com",
                name=full_name,
                title=selected_title,
                bio=f"{selected_bio_specialization} alanında araştırmacı",
                telephone=f"555-2{i:02d}",
                science_branch=selected_science_branch,
                location=selected_location,
                yoksis_id=f"Y2345{i:02d}",
                orcid_id=f"0000-0002-2345-{i:03d}",
                role=UserRole.author,
                is_auth=True,
                hashed_password=get_password_hash(f"author{i}password"),
                confirmation_token=f"author{i}_token",
                confirmation_token_created_at=datetime.utcnow(),
                marked_for_deletion=marked_for_deletion,
                tutorial_done=tutorial_done
            )
            authors.append(author)
        users.extend(authors)
        
        # Referee users (10) - Doubled from 5
        referees = []
        for i in range(1, 11):
            selected_title = random.choice(user_title_samples)
            selected_bio_specialization = random.choice([
                'kentsel planlama', 'mimarlık tarihi', 'yapı', 'tasarım teorisi', 'sosyal mekanlar',
                'kentsel tasarım', 'tarihi koruma', 'sürdürülebilir yapı', 'kamusal mekanlar',
                'tasarım değerlendirmesi', 'mimari eleştiri', 'mekansal analiz', 'kentsel altyapı'
            ])
            selected_science_branch = random.choice(science_branch_samples)
            selected_location = random.choice(cities)

            # Random chance for tutorial completion and deletion marking
            tutorial_done = random.random() < 0.8  # 80% chance of having completed tutorial
            marked_for_deletion = random.random() < 0.08  # 8% chance of being marked for deletion
            
            # Generate Turkish name
            gender = random.choice(['male', 'female'])
            if gender == 'male':
                first_name = random.choice(turkish_male_names)
            else:
                first_name = random.choice(turkish_female_names)
            surname = random.choice(turkish_surnames)
            full_name = f"{first_name} {surname}"
            
            referee = User(
                id=i+29,  # Start at 30 (after 3 admins + 10 editors + 16 authors)
                email=f"referee{i}@example.com",
                name=full_name,
                title=selected_title,
                bio=f"{selected_bio_specialization} konusunda uzman hakem",
                telephone=f"555-3{i:02d}",
                science_branch=selected_science_branch,
                location=selected_location,
                yoksis_id=f"Y3456{i:02d}",
                orcid_id=f"0000-0003-3456-{i:03d}",
                role=UserRole.referee,
                is_auth=True,
                hashed_password=get_password_hash(f"referee{i}password"),
                confirmation_token=f"referee{i}_token",
                confirmation_token_created_at=datetime.utcnow(),
                marked_for_deletion=marked_for_deletion,
                tutorial_done=tutorial_done
            )
            referees.append(referee)
        users.extend(referees)
        
        # Add users to session individually with proper error handling
        users_added = 0
        for user in users:
            try:
                # Check one more time if user exists before adding
                existing = session.execute(text(f"SELECT id FROM users WHERE id = {user.id}")).first()
                if not existing:
                    session.add(user)
                    users_added += 1
                    print(f"✅ Added user {user.name} (ID: {user.id})")
                else:
                    print(f"⚠️ User with ID {user.id} already exists, skipping")
            except Exception as e:
                print(f"❌ Error adding user {user.id}: {e}")
        
        print(f"📊 Total users added: {users_added}")
        
        # Flush to get IDs
        session.flush()
        
        # Check if journal ID 1 exists and update it with Turkish info if needed
        journal1_exists = session.execute(text("SELECT id FROM journal WHERE id = 1")).first()
        if journal1_exists:
            try:
                session.execute(
                    text("UPDATE journal SET title = :title, title_en = :title_en, editor_notes = :notes WHERE id = 1"),
                    {
                        "title": "İnsan ve Mekan Dergisi", 
                        "title_en": "Journal of Human and Space",
                        "notes": "İnsan ve Mekan için editör notları"
                    }
                )
                session.commit()
                print("✅ Updated journal ID 1 with Turkish information")
            except Exception as update_error:
                print(f"⚠️ Could not update journal ID 1: {update_error}")
        
        # Create 12 journals (more than doubled from 5)
        # Admin users (IDs 1, 2, 3) will be assigned as editor-in-chief
        admin_ids = [1, 2, 3]  # Owner and 2 admin users
        
        journals = []
        
        # Create journal ID 1 if it doesn't exist
        if not journal1_exists:
            journals.append(
                Journal(
                    id=1,
                    title="İnsan ve Mekan Dergisi",
                    title_en="Journal of Human and Space",
                    created_date=datetime(2023, 5, 1),
                    issue="Issue 1",
                    issue_en="Issue 1",
                    is_published=True,
                    publication_date=datetime(2023, 5, 5),
                    publication_place="Istanbul",
                    cover_photo="cover1.jpg",
                    meta_files="meta1.zip",
                    editor_notes="İnsan ve Mekan için editör notları",
                    full_pdf="humanspace_full.pdf",
                    editor_in_chief_id=admin_ids[0]  # First admin (owner)
                )
            )
        
        # Continue with other journals starting from ID 100
        additional_journals = [
            Journal(
                id=100,
                title="İnsan ve Mekan Dergisi",
                title_en="Journal of Human and Space",
                created_date=datetime(2023, 5, 1),
                issue="Issue 1",
                issue_en="Issue 1",
                is_published=True,
                publication_date=datetime(2023, 5, 5),
                publication_place="Istanbul",
                cover_photo="cover1.jpg",
                meta_files="meta1.zip",
                editor_notes="İnsan ve Mekan için editör notları",
                full_pdf="humanspace_full.pdf",
                editor_in_chief_id=admin_ids[0]  # First admin (owner)
            ),
            Journal(
                id=101,
                title="Günümüz Mimarisi",
                title_en="Architecture Today",
                created_date=datetime(2023, 6, 15),
                issue="Volume 5, Issue 2",
                issue_en="Volume 5, Issue 2",
                is_published=True,
                publication_date=datetime(2023, 6, 20),
                publication_place="Ankara",
                cover_photo="arch_cover.jpg",
                meta_files="arch_meta.zip",
                editor_notes="Günümüz Mimarisi için editör notları",
                full_pdf="arch_full.pdf",
                editor_in_chief_id=admin_ids[1]  # Second admin
            ),
            Journal(
                id=102,
                title="Kentsel Tasarım Üç Aylık",
                title_en="Urban Design Quarterly",
                created_date=datetime(2023, 7, 10),
                issue="Yaz Sayısı",
                issue_en="Summer Issue",
                is_published=True,
                publication_date=datetime(2023, 7, 15),
                publication_place="Izmir",
                cover_photo="urban_cover.jpg",
                meta_files="urban_meta.zip",
                editor_notes="Kentsel Tasarım için editör notları",
                full_pdf="urban_full.pdf",
                editor_in_chief_id=admin_ids[2]  # Third admin
            ),
            Journal(
                id=103,
                title="Çağdaş Mekanlar",
                title_en="Contemporary Spaces",
                created_date=datetime(2023, 8, 5),
                issue="Sonbahar Koleksiyonu",
                issue_en="Fall Collection",
                is_published=False,
                publication_date=None,
                publication_place="Bursa",
                cover_photo="spaces_cover.jpg",
                meta_files="spaces_meta.zip",
                editor_notes="Çağdaş Mekanlar için taslak notlar",
                full_pdf=None,
                editor_in_chief_id=admin_ids[0]  # First admin
            ),
            Journal(
                id=104,
                title="Miras ve Kültür",
                title_en="Heritage & Culture",
                created_date=datetime(2023, 9, 1),
                issue="Yıllık Sayı",
                issue_en="Annual Edition",
                is_published=False,
                publication_date=None,
                publication_place="Antalya",
                cover_photo="heritage_cover.jpg",
                meta_files="heritage_meta.zip",
                editor_notes="Miras ve Kültür için taslak notlar",
                full_pdf=None,
                editor_in_chief_id=admin_ids[1]  # Second admin
            ),
            # New journals
            Journal(
                id=105,
                title="Sürdürülebilir Mimarlık İncelemesi",
                title_en="Sustainable Architecture Review",
                created_date=datetime(2023, 10, 5),
                issue="Cilt 3, Sayı 4",
                issue_en="Volume 3, Issue 4",
                is_published=True,
                publication_date=datetime(2023, 10, 10),
                publication_place="Adana",
                cover_photo="sustain_cover.jpg",
                meta_files="sustain_meta.zip",
                editor_notes="Sürdürülebilir Mimarlık için editör notları",
                full_pdf="sustain_full.pdf",
                editor_in_chief_id=admin_ids[2]  # Third admin
            ),
            Journal(
                id=106,
                title="Kamusal Mekan Üç Aylık",
                title_en="Public Space Quarterly",
                created_date=datetime(2023, 11, 15),
                issue="Kış Sayısı",
                issue_en="Winter Issue",
                is_published=True,
                publication_date=datetime(2023, 11, 20),
                publication_place="Trabzon",
                cover_photo="public_cover.jpg",
                meta_files="public_meta.zip",
                editor_notes="Kamusal Mekan için editör notları",
                full_pdf="public_full.pdf",
                editor_in_chief_id=admin_ids[0]  # First admin
            ),
            Journal(
                id=107,
                title="Dijital Tasarım Dergisi",
                title_en="Digital Design Journal",
                created_date=datetime(2023, 12, 10),
                issue="Özel Sayı",
                issue_en="Special Edition",
                is_published=True,
                publication_date=datetime(2023, 12, 15),
                publication_place="Konya",
                cover_photo="digital_cover.jpg",
                meta_files="digital_meta.zip",
                editor_notes="Dijital Tasarım için editör notları",
                full_pdf="digital_full.pdf",
                editor_in_chief_id=admin_ids[1]  # Second admin
            ),
            Journal(
                id=108,
                title="Kentsel Müdahaleler",
                title_en="Urban Interventions",
                created_date=datetime(2024, 1, 5),
                issue="Cilt 1, Sayı 1",
                issue_en="Volume 1, Issue 1",
                is_published=False,
                publication_date=None,
                publication_place="Eskişehir",
                cover_photo="urban_int_cover.jpg",
                meta_files="urban_int_meta.zip",
                editor_notes="Kentsel Müdahaleler için taslak notlar",
                full_pdf=None,
                editor_in_chief_id=admin_ids[2]  # Third admin
            ),
            Journal(
                id=109,
                title="Tarihi Koruma Çalışmaları",
                title_en="Historical Preservation Studies",
                created_date=datetime(2024, 2, 10),
                issue="Yıldönümü Sayısı",
                issue_en="Anniversary Issue",
                is_published=False,
                publication_date=None,
                publication_place="Diyarbakır",
                cover_photo="history_cover.jpg",
                meta_files="history_meta.zip",
                editor_notes="Tarihi Koruma için taslak notlar",
                full_pdf=None,
                editor_in_chief_id=admin_ids[0]  # First admin
            ),
            Journal(
                id=110,
                title="Eleştirel Mimarlık İncelemesi",
                title_en="Critical Architecture Review",
                created_date=datetime(2024, 3, 15),
                issue="Bahar Sayısı",
                issue_en="Spring Edition",
                is_published=False,
                publication_date=None,
                publication_place="Samsun",
                cover_photo="critical_cover.jpg",
                meta_files="critical_meta.zip",
                editor_notes="Eleştirel Mimarlık için taslak notlar",
                full_pdf=None,
                editor_in_chief_id=admin_ids[1]  # Second admin
            ),
            Journal(
                id=111,
                title="Mekansal Analitik Dergisi",
                title_en="Spatial Analytics Journal",
                created_date=datetime(2024, 4, 20),
                issue="Veri Sayısı",
                issue_en="Data Edition",
                is_published=False,
                publication_date=None,
                publication_place="Çanakkale",
                cover_photo="spatial_cover.jpg",
                meta_files="spatial_meta.zip",
                editor_notes="Mekansal Analitik için taslak notlar",
                full_pdf=None,
                editor_in_chief_id=admin_ids[2]  # Third admin
            )
        ]
        
        # Add additional journals to the main list
        journals.extend(additional_journals)
        
        for journal in journals:
            session.add(journal)
        
        session.flush()
        
        # Create journal editor links
        # Each journal has its chief editor plus 2-3 additional editors
        editor_links = []
        
        # Handle journal ID 1 if it exists but doesn't have editor links
        if journal1_exists:
            # Check for existing editor links using the correct table name
            existing_links = 0
            try:
                existing_links = session.execute(text("SELECT COUNT(*) FROM journal_editor_link WHERE journal_id = 1")).scalar()
            except:
                pass  # If table doesn't exist, existing_links remains 0
            
            if existing_links == 0:
                # Add chief editor for journal ID 1
                editor_links.append(JournalEditorLink(journal_id=1, user_id=admin_ids[0]))
                print("✅ Added editor link for preserved journal ID 1")
        
        # Handle all other journals (IDs 1 and 100-111)
        journal_ids_to_process = []
        if not journal1_exists:
            journal_ids_to_process.append(1)  # Include journal ID 1 if we created it
        journal_ids_to_process.extend(range(100, 112))  # Add journals 100-111
        
        for j_id in journal_ids_to_process:
            # Find the journal object to get the chief editor ID
            journal_obj = None
            if j_id == 1:
                for j in journals:
                    if j.id == 1:
                        journal_obj = j
                        break
            else:
                # For journals 100-111, find them in the additional_journals
                journal_index = j_id - 100  # Convert from j_id (100-111) to index (0-11)
                if journal_index < len(additional_journals):
                    journal_obj = additional_journals[journal_index]
            
            if journal_obj:
                # Add chief editor
                editor_links.append(JournalEditorLink(journal_id=j_id, user_id=journal_obj.editor_in_chief_id))
                
                # Add 2-3 additional editors (randomly selected)
                available_editors = [i for i in range(4, 14) if i != journal_obj.editor_in_chief_id]  # Editor IDs 4-13
                if available_editors:  # Only if we have editors available
                    num_additional = min(random.randint(2, 3), len(available_editors))
                    additional_editors = random.sample(available_editors, k=num_additional)
                    for e_id in additional_editors:
                        editor_links.append(JournalEditorLink(journal_id=j_id, user_id=e_id))
        
        for link in editor_links:
            session.add(link)
        
        session.flush()
        
        # Create journal entries (increased to 8-10 per journal)
        journal_entries = []
        entry_id = 1
        entry_authors_map = {}
        entry_referees_map = {}
        
        article_themes = [
            'Urban Spaces', 'Architecture', 'Design Theory', 'Cultural Heritage', 'Social Environments',
            'Sustainable Design', 'Public Spaces', 'Digital Architecture', 'Historical Preservation',
            'Urban Infrastructure', 'Social Housing', 'Architectural Education', 'Spatial Computing',
            'Building Materials', 'Urban Ecology', 'Smart Cities', 'Architectural Psychology',
            'Landscape Design', 'Cultural Spaces', 'Urban Mobility'
        ]
        
        article_themes_tr = [
            'Kentsel Mekanlar', 'Mimarlık', 'Tasarım Teorisi', 'Kültürel Miras', 'Sosyal Ortamlar',
            'Sürdürülebilir Tasarım', 'Kamusal Mekanlar', 'Dijital Mimarlık', 'Tarihi Koruma',
            'Kentsel Altyapı', 'Sosyal Konut', 'Mimarlık Eğitimi', 'Mekansal Bilişim',
            'Yapı Malzemeleri', 'Kentsel Ekoloji', 'Akıllı Şehirler', 'Mimarlık Psikolojisi',
            'Peyzaj Tasarımı', 'Kültürel Mekanlar', 'Kentsel Mobilite'
        ]
        
        article_approaches = [
            'Analysis of', 'Study on', 'Review of', 'Perspective on', 'Evaluation of', 
            'Critical View of', 'Case Study on', 'Comparison of', 'Development in', 
            'Survey of', 'Historical Analysis of', 'Methodology for', 'New Approaches to',
            'Theoretical Framework for', 'Implementation of', 'Design Principles for'
        ]
        
        article_approaches_tr = [
            'Analizi', 'Çalışması', 'İncelemesi', 'Bakış Açısı', 'Değerlendirmesi', 
            'Eleştirel Görüşü', 'Vaka Çalışması', 'Karşılaştırması', 'Gelişimi', 
            'Araştırması', 'Tarihsel Analizi', 'Metodolojisi', 'Yeni Yaklaşımlar',
            'Teorik Çerçeve', 'Uygulaması', 'Tasarım İlkeleri'
        ]
        
        # Create entries for all journals (ID 1 and 100-111)
        journal_ids_for_entries = []
        if not journal1_exists:
            journal_ids_for_entries.append(1)  # Include journal ID 1 if we created it
        journal_ids_for_entries.extend(range(100, 112))  # Add journals 100-111
        
        for j_id in journal_ids_for_entries:
            num_entries = random.randint(8, 10)  # Increased from 4-5 to 8-10
            
            for e in range(num_entries):
                # Select 1-3 random authors from expanded author pool
                author_count = random.randint(1, 3)
                entry_authors = random.sample(range(14, 30), author_count)  # IDs 14-29 are authors
                
                # Select 1-3 random referees from expanded referee pool
                referee_count = random.randint(0, 3)  # Increased max from 2 to 3
                if referee_count > 0:
                    entry_referees = random.sample(range(30, 40), referee_count)  # IDs 30-39 are referees
                else:
                    entry_referees = []

                # Select random status
                status = random.choice([
                    JournalEntryStatus.WAITING_FOR_PAYMENT,
                    JournalEntryStatus.WAITING_FOR_AUTHORS,
                    JournalEntryStatus.WAITING_FOR_REFEREES,
                    JournalEntryStatus.WAITING_FOR_EDITORS,
                    JournalEntryStatus.ACCEPTED,
                    JournalEntryStatus.NOT_ACCEPTED
                ])
                
                # Turkish keywords
                turkish_keyword_options = [
                    "kentsel", "mimarlık", "tasarım", "kültür", "miras", "mekan", "çevre", 
                    "sosyal", "planlama", "teori", "sürdürülebilir", "dijital", "tarihi", "kamusal", 
                    "altyapı", "ekoloji", "akıllı", "mobilite", "peyzaj", "koruma",
                    "konut", "eğitim", "malzeme", "teknoloji", "yenileme", "restorasyon",
                    "toplum", "kentleşme", "yaşam", "işlev", "estetik", "yapı", "insan"
                ]
                
                # English keywords
                english_keyword_options = [
                    "urban", "architecture", "design", "culture", "heritage", "space", "environment", 
                    "social", "planning", "theory", "sustainable", "digital", "historical", "public", 
                    "infrastructure", "ecology", "smart", "mobility", "landscape", "conservation",
                    "housing", "education", "material", "technology", "renovation", "restoration",
                    "community", "urbanization", "living", "function", "aesthetics", "building", "human"
                ]
                
                # More varied page numbers
                start_page = random.randint(1, 150)
                end_page = start_page + random.randint(5, 50)

                # Generate random dates for created_date and publication_date
                created_date = datetime(random.choice([2023, 2024]), random.randint(1, 12), random.randint(1, 28))
                # publication_date will be after created_date
                publication_date = created_date + timedelta(days=random.randint(30, 180))
                
                # Generate paired titles in Turkish and English
                selected_theme_index = random.randint(0, len(article_themes) - 1)
                selected_approach_index = random.randint(0, len(article_approaches) - 1)
                
                tr_title = f"{article_themes_tr[selected_theme_index]} {article_approaches_tr[selected_approach_index]}"
                en_title = f"{article_approaches[selected_approach_index]} {article_themes[selected_theme_index]}"
                
                # Generate Turkish and English keywords separately
                turkish_keywords = ", ".join(random.sample(turkish_keyword_options, k=random.randint(3, 6)))
                english_keywords = ", ".join(random.sample(english_keyword_options, k=random.randint(3, 6)))
                
                journal_entries.append(
                    JournalEntry(
                        id=entry_id,
                        title=tr_title,
                        title_en=en_title,
                        created_date=created_date,
                        publication_date=publication_date,
                        abstract_tr=f"TR Abstract for article {entry_id} exploring important aspects of the subject matter with detailed methodology and findings.",
                        abstract_en=f"EN Abstract for article {entry_id} with comprehensive analysis, methodology, and conclusions.",
                        keywords=turkish_keywords,
                        keywords_en=english_keywords,
                        page_number=f"{start_page}-{end_page}",
                        article_type=random.choice(list(ArticleType)),
                        language=random.choice(list(ArticleLanguage)),
                        doi=f"10.1001/jhs.{random.choice([2023, 2024])}.{entry_id:03d}",
                        file_path=f"articles/article_{entry_id}_original.pdf",
                        download_count=random.randint(0, 250),  # Increased max from 100 to 250
                        read_count=random.randint(50, 1000),  # Increased max from 500 to 1000
                        status=status,
                        journal_id=j_id
                    )
                )
                # Store author and referee IDs for later association
                entry_authors_map[entry_id] = entry_authors
                entry_referees_map[entry_id] = entry_referees
                entry_id += 1
        
        for entry in journal_entries:
            session.add(entry)
        
        session.flush()
        
        # Create the author and referee relationships after the entries exist
        for entry in journal_entries:
            # Add authors for this entry
            if entry.id in entry_authors_map:
                for author_id in entry_authors_map[entry.id]:
                    author_link = JournalEntryAuthorLink(journal_entry_id=entry.id, user_id=author_id)
                    session.add(author_link)
            
            # Add referees for this entry
            if entry.id in entry_referees_map:
                for referee_id in entry_referees_map[entry.id]:
                    referee_link = JournalEntryRefereeLink(journal_entry_id=entry.id, user_id=referee_id)
                    session.add(referee_link)
        
        session.flush()
        
        # Create author updates (2-4 per entry) - increased from 1-2
        author_updates = []
        author_update_id = 1
        
        update_notes = [
            "Makale için geri bildirimler doğrultusunda güncellemeler yapıldı.",
            "İstenildiği gibi metodoloji bölümü iyileştirildi.",
            "Yeni veri analizi eklendi ve sonuçlar güncellendi.",
            "Hakem yorumlarına dayalı teorik çerçeve revize edildi.",
            "Ek kaynaklar ile literatür taraması genişletildi.",
            "Argüman yeniden yapılandırıldı ve ana kavramlar netleştirildi.",
            "Metodoloji ile ilgili hakem endişeleri giderildi.",
            "Ana argümanları desteklemek için yeni vaka çalışmaları eklendi.",
            "Veri ve araştırma sonuçlarının görselleştirmesi iyileştirildi.",
            "Pratik uygulamalar ile sonuç bölümü güçlendirildi."
        ]
        
        for je in journal_entries:
            num_updates = random.randint(2, 4)  # Increased from 1-2 to 2-4
            
            for update_number in range(num_updates):
                # Get author IDs for this entry
                author_ids = [link.user_id for link in session.query(JournalEntryAuthorLink).filter(JournalEntryAuthorLink.journal_entry_id == je.id).all()]
                
                if author_ids:
                    # Select random author from the entry's authors
                    author_id = random.choice(author_ids)
                    
                    # Create more varied update metadata
                    update_version = update_number + 2  # Versions start at v2
                    
                    # Add more specific update notes
                    specific_note = random.choice(update_notes)
                    
                    author_updates.append(
                        AuthorUpdate(
                            id=author_update_id,
                            title=f"Güncellendi: {je.title}",
                            abstract_en=f"Makale özeti versiyon {update_version} - geliştirilmiş netlik ve detay ile güncellendi.",
                            abstract_tr=f"TR özeti versiyon {update_version} - güncellenmiş ve genişletilmiştir.",
                            keywords=je.keywords + f", güncellendi-v{update_version}",
                            keywords_en=je.keywords_en + f", güncellendi-v{update_version}" if je.keywords_en else f"güncellendi-v{update_version}",
                            file_path=f"entry{je.id}_v{update_version}.pdf",
                            notes=f"{specific_note} (Güncelleme v{update_version})",
                            created_date=datetime.now(pytz.timezone('Europe/Istanbul')).replace(tzinfo=None),
                            entry_id=je.id,
                            author_id=author_id
                        )
                    )
                    author_update_id += 1
        
        for update in author_updates:
            session.add(update)
        
        # Create referee updates (2-5 per entry) - increased from 1-3
        referee_updates = []
        referee_update_id = 1
        
        referee_feedback = [
            "Lütfen metodoloji ile ilgili endişeleri giderin.",
            "Kaynak eksiklikleri düzeltilmeli.",
            "Sonuç bölümünü revize edin.",
            "Veri görselleştirmesini iyileştirin.",
            "Teorik çerçevenin güçlendirilmesi gerekiyor.",
            "Literatür taraması eksik kalmış.",
            "Araştırma sorularının netleştirilmesi gerekiyor.",
            "İstatistiksel analizin doğrulanması gerekiyor.",
            "Etik değerlendirmeler genişletilmeli.",
            "Bulguları daha geniş literatürde bağlamsallaştırın.",
            "Tarihsel arka plan bölümü genişletilmeli.",
            "Araştırma bulgularının önemini netleştirin.",
            "Pratik uygulamalar için çıkarımlar geliştirilmeli.",
            "Diyagramlar ve görseller iyileştirilmeli.",
            "Araştırma sınırlılıkları kabul edilmeli."
        ]
        
        for je in journal_entries:
            # Increased chance of having referee updates
            if random.random() < 0.9:  # 90% chance to have updates (up from 80%)
                num_updates = random.randint(2, 5)  # Increased from 1-3 to 2-5
                
                for update_idx in range(num_updates):
                    # Get referee IDs for this entry
                    referee_ids = [link.user_id for link in session.query(JournalEntryRefereeLink).filter(JournalEntryRefereeLink.journal_entry_id == je.id).all()]
                    
                    if referee_ids:
                        # Select random referee from the entry's referees
                        referee_id = random.choice(referee_ids)
                    else:
                        # Fallback to any referee
                        referee_id = random.randint(30, 39)  # IDs 30-39 are referees
                    
                    # For variety, create review rounds
                    review_round = update_idx + 1
                    
                    # Select specific feedback for this update
                    specific_feedback = random.choice(referee_feedback)
                    
                    referee_updates.append(
                        RefereeUpdate(
                            id=referee_update_id,
                            file_path=f"entry{je.id}_hakem_v{review_round}.pdf",
                            notes=f"{specific_feedback} (Hakem Değerlendirmesi {review_round})",
                            created_date=datetime.now(pytz.timezone('Europe/Istanbul')).replace(tzinfo=None),
                            entry_id=je.id,
                            referee_id=referee_id
                        )
                    )
                    referee_update_id += 1
        
        for update in referee_updates:
            session.add(update)
        
        '''
        # Create settings (keep as is - single settings record)
        settings = Settings(
            id=1,
            active_journal_id=1
        )
        
        session.add(settings)
        '''
        # Commit all changes
        session.commit()
        
        print("✅ Database seeded successfully.")

        # Reset sequences to ensure future IDs are correct
        reset_sequences(engine)
        print("✅ Database sequences reset successfully.")

def reset_sequences(engine):
    """Reset the sequence counters in the database to match the maximum IDs."""
    from sqlalchemy import text, inspect
    
    # First, get a list of actual sequences in the database
    with engine.connect() as conn:
        # This query gets all sequences from PostgreSQL
        result = conn.execute(text("SELECT relname FROM pg_class WHERE relkind = 'S';"))
        existing_sequences = [row[0] for row in result]
        print(f"Found sequences in database: {existing_sequences}")
        
        # Tables to check
        tables = [
            "journalentry", "journal", "users", "settings",
            "author_updates", "referee_updates"
        ]
        
        # Process each table separately
        for table in tables:
            # Check if table exists
            try:
                # Try to reset sequence in a separate connection to avoid transaction issues
                with engine.connect() as reset_conn:
                    reset_conn.execute(text(f"SELECT 1 FROM {table} LIMIT 1"))
                    
                    # Check if sequence exists
                    sequence_name = f"{table}_id_seq"
                    if sequence_name in existing_sequences:
                        if table == "journal":
                            # For journals, ensure the sequence is set higher than our highest journal ID (111)
                            reset_conn.execute(text(f"SELECT setval('{sequence_name}', (SELECT GREATEST(COALESCE(MAX(id), 1), 111) FROM {table}), true)"))
                            reset_conn.commit()
                            print(f"INFO: Successfully reset sequence for {table} to value higher than 111")
                        else:
                            reset_conn.execute(text(f"SELECT setval('{sequence_name}', (SELECT COALESCE(MAX(id), 1) FROM {table}), true)"))
                            reset_conn.commit()
                            print(f"INFO: Successfully reset sequence for {table}")
                    else:
                        print(f"INFO: Sequence {sequence_name} not found in database, skipping")
            except Exception as e:
                print(f"Warning: Could not reset sequence for {table}: {e}")

def migrate_status_values(engine):
    """Update existing journal entries with old status values to the new ones."""
    
    with Session(engine) as session:
        # Map old values to new values
        status_mapping = {
            "waiting_for_writer": "waiting_for_authors",
            "waiting_for_arbitrator": "waiting_for_referees",
            "completed": "accepted",
            "waiting_for_editor": "waiting_for_editors"
        }
        
        # Update entries with old values
        for old_status, new_status in status_mapping.items():
            entries_to_update = session.query(JournalEntry).filter(JournalEntry.status == old_status).all()
            
            for entry in entries_to_update:
                print(f"Updating entry {entry.id} status from '{old_status}' to '{new_status}'")
                entry.status = new_status
        
        # Commit changes
        session.commit()
        print("✅ Status migration completed successfully.")

def update_enum_types(engine):
    """Update the enum types in the database to include new values like 'owner' for UserRole."""
    from sqlalchemy import text
    from sqlmodel import Session
    
    # Connect to database
    with Session(engine) as session:
        try:
            # Check if 'owner' is already in the enum
            result = session.execute(text("SELECT enum_range(NULL::userrole)")).scalar()
            enum_values = result.strip('{}').split(',')
            
            if 'owner' not in enum_values:
                print("Need to update 'userrole' enum to include 'owner'")
                
                # Try direct method first - might work if no tables reference the type
                try:
                    session.execute(text("ALTER TYPE userrole ADD VALUE 'owner'"))
                    session.commit()
                    print("✅ Added 'owner' to userrole enum directly")
                    return True
                except Exception as e:
                    print(f"Could not directly add 'owner' to enum: {e}")
                
                # Try copying the old values and recreating the enum
                try:
                    # Use a transaction for this process
                    connection = engine.connect()
                    transaction = connection.begin()
                    
                    # Get existing roles except 'owner'
                    existing_roles = session.execute(text("SELECT enum_range(NULL::userrole)")).scalar()
                    print(f"Existing roles: {existing_roles}")
                    
                    # Create a new enum type with all values including 'owner'
                    new_values = existing_roles.strip('{}').split(',')
                    new_values.append('owner')
                    new_values_str = "'" + "', '".join(new_values) + "'"
                    
                    connection.execute(text(f"""
                        -- Create a temporary type with all values including the new one
                        CREATE TYPE userrole_new AS ENUM ({new_values_str});
                        
                        -- Drop the old type with CASCADE if you have tables referencing it
                        -- WARNING: This can cause data loss if not handled carefully
                        -- ALTER TABLE users ALTER COLUMN role DROP DEFAULT;
                        -- DROP TYPE userrole CASCADE;
                        
                        -- Rename the new type to the old name
                        -- ALTER TYPE userrole_new RENAME TO userrole;
                    """))
                    
                    # Commit the transaction
                    transaction.commit()
                    connection.close()
                    
                    print("⚠️ Created a new enum type userrole_new")
                    print("Manual steps required to complete the update:")
                    print("1. Use pg_dump to backup your database")
                    print("2. Manually update the enum type in the database")
                    
                    return False
                except Exception as enum_error:
                    print(f"Failed to update enum types: {enum_error}")
                    return False
            else:
                print("✅ 'owner' already exists in userrole enum")
                return True
        except Exception as e:
            print(f"Error checking enum types: {e}")
            return False

def fix_enum_manual():
    """Print SQL commands that can be used to manually fix the enum type."""
    print("\n=== MANUAL ENUM TYPE UPDATE INSTRUCTIONS ===")
    print("If automatic enum update failed, you can run these commands manually in your database:")
    print("IMPORTANT: Backup your database first!")
    print("\n```sql")
    print("-- 1. Create a backup of users table")
    print("CREATE TABLE users_backup AS SELECT * FROM users;")
    print("")
    print("-- 2. Create new enum type with all values including 'owner'")
    print("CREATE TYPE userrole_new AS ENUM ('author', 'editor', 'referee', 'admin', 'owner');")
    print("")
    print("-- 3. Create a new column with the new enum type")
    print("ALTER TABLE users ADD COLUMN role_new userrole_new;")
    print("")
    print("-- 4. Update the new column with values from the old column")
    print("UPDATE users SET role_new = role::text::userrole_new;")
    print("")
    print("-- 5. Drop the old column and rename the new one")
    print("ALTER TABLE users DROP COLUMN role;")
    print("ALTER TABLE users RENAME COLUMN role_new TO role;")
    print("")
    print("-- 6. Drop the old enum type and rename the new one")
    print("DROP TYPE userrole;")
    print("ALTER TYPE userrole_new RENAME TO userrole;")
    print("```\n")
    print("After running these commands, try running seed.py again.")
    print("===================================================\n")

def update_missing_tokens(engine):
    """
    Updates any journal entries that don't have random tokens by generating and saving them.
    """
    from sqlmodel import Session, select
    from models import JournalEntry
    
    with Session(engine) as session:
        # Find all entries without random tokens
        statement = select(JournalEntry).where(JournalEntry.random_token == None)
        entries_without_tokens = session.exec(statement).all()
        
        count = 0
        # Generate and save tokens
        for entry in entries_without_tokens:
            token = entry.generate_random_token()
            if token:
                count += 1
                session.add(entry)
        
        # Commit all changes
        session.commit()
        print(f"✅ Generated random tokens for {count} journal entries")

if __name__ == "__main__":
    # First update enum types
    enum_updated = update_enum_types(engine)
    print(f"Enum update status: {'Success' if enum_updated else 'Failed/Manual Steps Required'}")
    
    if not enum_updated:
        fix_enum_manual()
    
    # Then seed the database
    seed_database()
    # Migrate any existing status values if needed
    migrate_status_values(engine)
    # Update missing random tokens
    update_missing_tokens(engine)