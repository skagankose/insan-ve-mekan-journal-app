import os
import uuid
import subprocess
from pathlib import Path
from fastapi import UploadFile, HTTPException, status
from datetime import datetime
import shutil

# Base directory for storing uploaded files
UPLOAD_DIR = Path("uploads")

# Make sure the upload directory exists
if not UPLOAD_DIR.exists():
    UPLOAD_DIR.mkdir(parents=True)

def validate_image(filename: str):
    """
    Validate that file is an image file (.png, .jpg, or .jpeg)
    
    Args:
        filename: The filename to validate
        
    Returns:
        bool: True if valid, raises exception if not
    """
    allowed_extensions = ['.png', '.jpg', '.jpeg']
    ext = os.path.splitext(filename.lower())[1]
    if ext not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only .png, .jpg, or .jpeg files are allowed for images."
        )
    return True

def validate_docx(filename: str):
    """
    Validate that file is a .docx file
    
    Args:
        filename: The filename to validate
        
    Returns:
        bool: True if valid, raises exception if not
    """
    if not filename.lower().endswith('.docx'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only .docx files are allowed."
        )
    return True

def validate_pdf(filename: str):
    """
    Validate that file is a PDF file
    
    Args:
        filename: The filename to validate
        
    Returns:
        bool: True if valid, raises exception if not
    """
    if not filename.lower().endswith('.pdf'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only .pdf files are allowed."
        )
    return True

def docx_to_pdf(docx_path, pdf_path):
    """
    Convert a .docx file to PDF using Pandoc
    
    Args:
        docx_path: Path to the .docx file
        pdf_path: Path to save the PDF file
        
    Returns:
        bool: True if conversion was successful, False otherwise
    """
    try:
        # Check if pandoc is installed
        result = subprocess.run(['which', 'pandoc'], capture_output=True, text=True)
        if not result.stdout.strip():
            print("Warning: Pandoc is not installed. PDF conversion will not work.")
            return False
            
        # Use pandoc to convert docx to pdf
        cmd = [
            'pandoc',
            str(docx_path),
            '-o', str(pdf_path),
            '--pdf-engine=wkhtmltopdf'
        ]
        
        subprocess.run(cmd, check=True, capture_output=True)
        print(f"Successfully converted {docx_path} to {pdf_path}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"Error in Pandoc conversion: {e.stderr}")
        return False
    except Exception as e:
        print(f"Error converting docx to pdf: {e}")
        return False

def save_upload_file(upload_file: UploadFile, folder: str = "", validate_func=None) -> str:
    """
    Save an uploaded file to disk and return the file path.
    
    Args:
        upload_file: The uploaded file object
        folder: Optional subfolder within the uploads directory
        validate_func: Optional function to validate the file type
        
    Returns:
        str: The relative path to the saved file
    """
    # Get the original filename and extension
    filename = upload_file.filename
    if not filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Filename is required."
        )
    
    # Validate file type if a validation function is provided
    if validate_func:
        validate_func(filename)
    
    # Create a unique filename to avoid collisions
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    unique_id = str(uuid.uuid4())[:8]
    
    # Keep original filename but add uniqueness
    name, extension = os.path.splitext(filename)
    unique_filename = f"{name}_{timestamp}_{unique_id}{extension}"
    
    # Create target folder if needed
    target_folder = UPLOAD_DIR
    if folder:
        target_folder = UPLOAD_DIR / folder
        if not target_folder.exists():
            target_folder.mkdir(parents=True)
    
    # Define the file path
    file_path = target_folder / unique_filename
    
    # Save the file
    with file_path.open("wb") as buffer:
        shutil.copyfileobj(upload_file.file, buffer)
    
    # Close the file
    upload_file.file.close()
    
    return str(file_path)

def delete_upload_file(file_path: str) -> None:
    """
    Delete an uploaded file from disk.
    
    Args:
        file_path: The relative path to the file to delete
    """
    if not file_path:
        print("No file path provided")
        return
        
    # Convert string path to Path object
    path = Path(file_path)
    print(f"Original file path: {path}")
    
    # If path is not absolute, assume it's relative to UPLOAD_DIR
    if not path.is_absolute():
        # If the path starts with 'uploads/', remove it to avoid double-nesting
        if str(path).startswith('uploads/'):
            path = Path(str(path)[8:])  # Remove 'uploads/' prefix
        path = UPLOAD_DIR / path
        print(f"Resolved path with UPLOAD_DIR: {path}")
    
    # Delete the file if it exists
    if path.exists():
        print(f"Found file at {path}, deleting...")
        path.unlink()
        print("File deleted successfully")
    else:
        print(f"File not found at {path}")
        
    # Also try to delete the corresponding PDF file if it exists
    if path.suffix.lower() == '.docx':
        pdf_path = path.with_suffix('.pdf')
        print(f"Checking for PDF version at: {pdf_path}")
        if pdf_path.exists():
            print("Found PDF version, deleting...")
            pdf_path.unlink()
            print("PDF version deleted successfully")
        else:
            print("No PDF version found")

def delete_upload_directory(directory: str) -> None:
    """
    Delete a directory and all its contents from the uploads directory.
    
    Args:
        directory: The relative path to the directory to delete
    """
    if not directory:
        print("No directory path provided")
        return
    
    # Convert string path to Path object
    path = Path(directory)
    print(f"Original directory path: {path}")
    
    # If path is not absolute, assume it's relative to UPLOAD_DIR
    if not path.is_absolute():
        # If the path starts with 'uploads/', remove it to avoid double-nesting
        if str(path).startswith('uploads/'):
            path = Path(str(path)[8:])  # Remove 'uploads/' prefix
        path = UPLOAD_DIR / path
        print(f"Resolved path with UPLOAD_DIR: {path}")
    
    # Delete the directory and all its contents if it exists
    if path.exists():
        print(f"Found directory at {path}, deleting...")
        shutil.rmtree(path)
        print("Directory deleted successfully")
    else:
        print(f"Directory not found at {path}") 