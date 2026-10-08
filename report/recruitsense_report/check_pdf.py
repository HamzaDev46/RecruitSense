import os

# Check if PyPDF2 or similar exists
try:
    import PyPDF2
    print("PyPDF2 is available")
except Exception as e:
    print("PyPDF2 error:", e)

# Also check pdf files in project
for root, dirs, files in os.walk('.'):
    for f in files:
        if f.endswith('.pdf'):
            path = os.path.join(root, f)
            size = os.path.getsize(path)
            print(f"{path} ({size} bytes)")
