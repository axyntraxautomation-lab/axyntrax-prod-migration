import zipfile
import base64
import os

zip_path = "new_dashboard.zip"
with zipfile.ZipFile(zip_path, 'w', compression=zipfile.ZIP_DEFLATED) as zip_ref:
    # Write the file as "dashboard.html" inside the zip, NOT the whole path.
    zip_ref.write("extracted_dashboard/dashboard.html", arcname="dashboard.html")

print("Zip created successfully!")

with open(zip_path, "rb") as f:
    encoded = base64.b64encode(f.read()).decode("utf-8")

print("\n=== BASE64 OUTPUT ===")
print(encoded)
print("=====================\n")

# Save encode to a file so I can copy-paste safely if it's very long
with open("b64_result.txt", "w") as out:
    out.write(encoded)
print("Base64 content saved to b64_result.txt")
