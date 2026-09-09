import os

components_dir = r"c:\Users\kevin\Documents\WEB25\muni-app\app-turismo\app-turismo-next\components"

for root, dirs, files in os.walk(components_dir):
    for file in files:
        if file.endswith('.jsx') or file.endswith('.js'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
                
            original_content = content
            
            # Fix firebase imports
            content = content.replace("'../../services/firebase'", "'@/lib/firebase'")
            content = content.replace('"../../services/firebase"', "'@/lib/firebase'")
            content = content.replace("'../services/firebase'", "'@/lib/firebase'")
            content = content.replace('"../services/firebase"', "'@/lib/firebase'")
            content = content.replace("'../services/firebaseLite'", "'@/lib/firebase'")
            content = content.replace('"../services/firebaseLite"', "'@/lib/firebase'")
            content = content.replace("'firebase/firestore/lite'", "'firebase/firestore'")
            
            # Remove SEO usages
            if file == 'HomeClient.jsx':
                lines = content.split('\n')
                new_lines = []
                in_seo = False
                for line in lines:
                    if 'import SEO' in line:
                        continue
                    if '<SEO' in line:
                        if '/>' in line:
                            continue
                        else:
                            in_seo = True
                            continue
                    if in_seo:
                        if '/>' in line:
                            in_seo = False
                        continue
                    new_lines.append(line)
                content = '\n'.join(new_lines)
            
            if content != original_content:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(content)
                    print(f"Updated {filepath}")
