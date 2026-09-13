import io
import pdfplumber


def extract_text_from_pdf(file):
    """
    Extracts text from a PDF file object or FastAPI UploadFile.
    Returns extracted text as a string, or raises an exception on failure.
    """
    text = ""
    # If it's a FastAPI UploadFile, use file.file (SpooledTemporaryFile)
    target = getattr(file, "file", file)

    with pdfplumber.open(target) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"

    return text.strip()