"""
File Upload Security Utility
Provides file validation, sanitization, and MIME-type checks to prevent
path traversal attacks, DoS via oversized files, and malicious executable uploads.
"""
import os
import re
from werkzeug.utils import secure_filename
from config import Config

# Explicit blacklist for dangerous executable and script extensions
DANGEROUS_EXTENSIONS = {
    "exe", "bat", "cmd", "sh", "bash", "ps1", "py", "pyc",
    "js", "ts", "jsx", "tsx", "html", "htm", "php", "phtml",
    "vbs", "vbe", "wsf", "wsh", "msi", "com", "scr", "jar",
    "cgi", "pl", "asp", "aspx", "jsp"
}


def sanitize_filename(filename: str) -> str:
    """
    Sanitizes a filename to prevent path traversal and shell injection attacks.
    Removes directory paths, null bytes, and non-whitelisted characters.
    """
    if not filename:
        return "unnamed_artifact"
    
    # Strip null bytes
    filename = filename.replace("\x00", "")
    
    # Standard werkzeug filename sanitization
    clean_name = secure_filename(filename)
    if not clean_name:
        clean_name = "unnamed_artifact"
        
    return clean_name


def validate_file_upload(file_obj, max_size_bytes: int = None):
    """
    Validates uploaded file against security rules:
    1. Ensures file is present and has a non-empty name.
    2. Validates file extension is in ALLOWED_EXTENSIONS and not in DANGEROUS_EXTENSIONS.
    3. Validates MIME type matches whitelisted document / image types.
    4. Validates file size within limit.

    Returns:
        tuple (is_valid: bool, error_info: dict | None, sanitized_name: str)
    """
    if not file_obj or not file_obj.filename:
        return False, {
            "code": "MISSING_FILE",
            "message": "No file was attached to the upload request."
        }, ""

    raw_filename = file_obj.filename.strip()
    clean_name = sanitize_filename(raw_filename)

    # Extract extension
    parts = clean_name.rsplit(".", 1)
    if len(parts) < 2 or not parts[1]:
        return False, {
            "code": "INVALID_FILE_EXTENSION",
            "message": "Files must have a valid extension."
        }, clean_name

    ext = parts[1].lower()

    # Block dangerous scripts/executables
    if ext in DANGEROUS_EXTENSIONS:
        return False, {
            "code": "DANGEROUS_FILE_TYPE",
            "message": f"Uploading executable or script files (.{ext}) is strictly prohibited."
        }, clean_name

    # Check extension against whitelist
    if ext not in Config.ALLOWED_EXTENSIONS:
        return False, {
            "code": "UNSUPPORTED_FILE_TYPE",
            "message": f"File extension .{ext} is not supported. Allowed formats: {', '.join(sorted(Config.ALLOWED_EXTENSIONS))}"
        }, clean_name

    # Check content type / MIME
    content_type = getattr(file_obj, "content_type", "")
    if content_type:
        content_type = content_type.lower().split(";")[0].strip()
        if content_type not in Config.ALLOWED_MIME_TYPES:
            return False, {
                "code": "INVALID_MIME_TYPE",
                "message": f"MIME type '{content_type}' is not permitted."
            }, clean_name

    # Check file size if available from stream
    max_size = max_size_bytes or Config.MAX_CONTENT_LENGTH
    # Check Content-Length if available, or inspect stream length
    file_obj.seek(0, os.SEEK_END)
    size = file_obj.tell()
    file_obj.seek(0)  # Reset stream position

    if size > max_size:
        max_mb = max_size / (1024 * 1024)
        return False, {
            "code": "FILE_TOO_LARGE",
            "message": f"File size ({size / (1024 * 1024):.2f}MB) exceeds the maximum allowed limit of {max_mb:.0f}MB."
        }, clean_name

    return True, None, clean_name
