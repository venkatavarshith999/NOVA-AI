import io
import PyPDF2
from docx import Document

def parse_pdf(file_bytes: bytes) -> str:
    reader = PyPDF2.PdfReader(io.BytesIO(file_bytes))
    text = ""
    for page in reader.pages:
        page_text = page.extract_text()
        if page_text:
            text += page_text + "\n"
    return text

def parse_docx(file_bytes: bytes) -> str:
    doc = Document(io.BytesIO(file_bytes))
    text = "\n".join([paragraph.text for paragraph in doc.paragraphs])
    return text

def parse_image(file_bytes: bytes) -> str:
    # Mock image parsing
    return "Image content analysis: [uploaded image]"

def parse_file(filename: str, file_bytes: bytes) -> str:
    ext = filename.split('.')[-1].lower() if '.' in filename else ''
    
    if ext == 'pdf':
        return parse_pdf(file_bytes)
    elif ext in ['docx', 'doc']:
        return parse_docx(file_bytes)
    elif ext in ['png', 'jpg', 'jpeg']:
        return parse_image(file_bytes)
    else:
        # Default fallback (e.g. txt)
        try:
            return file_bytes.decode('utf-8')
        except UnicodeDecodeError:
            return "Unsupported file format or unreadable text."
