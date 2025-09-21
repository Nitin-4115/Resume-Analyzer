# backend/parser.py
import fitz
import docx

def extract_text(file_path):
    if file_path.lower().endswith('.pdf'):
        doc = fitz.open(file_path)
        return "".join(page.get_text() for page in doc)
    elif file_path.lower().endswith('.docx'):
        doc = docx.Document(file_path)
        return "\n".join([para.text for para in doc.paragraphs])
    raise ValueError("Unsupported file type")