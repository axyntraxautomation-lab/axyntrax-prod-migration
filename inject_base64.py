import re

# 1. Read the new base64 string
with open("b64_result.txt", "r") as f:
    new_b64 = f.read().strip()

# 2. Read the target file
target_file = "web/src/app/api/module/download/route.ts"
with open(target_file, "r", encoding="utf-8") as f:
    content = f.read()

# 3. Replace the Buffer.from line using regex to match the long string
pattern = r'const z = Buffer\.from\("[A-Za-z0-9+/=]+", "base64"\);'
replacement = f'const z = Buffer.from("{new_b64}", "base64");'

new_content = re.sub(pattern, replacement, content)

# 4. Check if the replacement actually changed something
if new_content != content:
    with open(target_file, "w", encoding="utf-8") as f:
        f.write(new_content)
    print("SUCCESS: Base64 string updated in route.ts!")
else:
    print("WARNING: Base64 replacement could not be applied or was already present.")
