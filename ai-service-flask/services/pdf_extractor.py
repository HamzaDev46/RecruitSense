import pdfplumber


def extract_text_from_pdf(file):
    """
    Extracts text from a PDF file object.
    Returns extracted text as a string, or raises an exception on failure.
    """
    text = ""

    with pdfplumber.open(file) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"

    return text.strip()