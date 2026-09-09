import os
import re

def fix_project(directory):
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith(".jsx") or file.endswith(".js"):
                path = os.path.join(root, file)
                try:
                    with open(path, "r", encoding="utf-8") as f:
                        content = f.read()
                    
                    # 1. Fix Firebase imports
                    new_content = re.sub(r"from\s+['\"]\.\./(services/)?firebase['\"]", "from '@/lib/firebase'", content)
                    # 2. Fix slugUtils imports
                    new_content = re.sub(r"from\s+['\"]\.\./(utils/)?slugUtils['\"]", "from '@/lib/slugUtils'", new_content)
                    # 3. Fix Link to=
                    new_content = re.sub(r"<Link\s+([^>]*?)to=", r"<Link \1href=", new_content)

                    if content != new_content:
                        with open(path, "w", encoding="utf-8") as f:
                            f.write(new_content)
                        print(f"Fixed {path}")
                except Exception as e:
                    print(f"Error processing {path}: {e}")

if __name__ == "__main__":
    fix_project(".")
