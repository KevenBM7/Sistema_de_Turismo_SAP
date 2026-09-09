import os
import re

def fix_links(directory):
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith(".jsx") or file.endswith(".js"):
                path = os.path.join(root, file)
                with open(path, "r", encoding="utf-8") as f:
                    content = f.read()
                
                # Replace Link to={...} with Link href={...}
                new_content = re.sub(r"<Link\s+([^>]*?)to=", r"<Link \1href=", content)
                
                if content != new_content:
                    with open(path, "w", encoding="utf-8") as f:
                        f.write(new_content)
                    print(f"Fixed Link in {path}")

fix_links(".")