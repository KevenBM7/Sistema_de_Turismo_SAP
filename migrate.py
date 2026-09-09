import os
import shutil
import re

SRC_DIR = r"c:\Users\kevin\Documents\WEB25\muni-app\app-turismo\src"
DEST_DIR = r"c:\Users\kevin\Documents\WEB25\muni-app\app-turismo\app-turismo-next"

def process_jsx_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    needs_client = False
    
    # Check for client-side hooks/features
    if re.search(r'useState|useEffect|useContext|useRef|useMemo|useCallback|useRouter|useParams|usePathname|useSearchParams|useNavigate|useLocation|window\.|navigator\.|localStorage|sessionStorage|onSnapshot|firebase/auth|react-hot-toast', content):
        needs_client = True

    lines = content.split('\n')
    new_lines = []
    has_link = False

    for line in lines:
        if 'react-router-dom' in line:
            if 'Link' in line:
                has_link = True
                line = re.sub(r',\s*Link', '', line)
                line = re.sub(r'Link\s*,?', '', line)
                if 'import {}' in line or 'import { }' in line:
                    continue # Skip empty import
            line = line.replace('useNavigate', 'useRouter')
            line = line.replace('react-router-dom', 'next/navigation')
        
        # Replace import.meta.env
        line = line.replace('import.meta.env.VITE_', 'process.env.NEXT_PUBLIC_')
        line = line.replace('import.meta.env.', 'process.env.')
        
        # Replace relative paths to pages (for CSS and other imports)
        line = line.replace('../pages/', '../legacy_pages/')
        line = line.replace('./pages/', './legacy_pages/')
        
        new_lines.append(line)
        
    content = '\n'.join(new_lines)
    
    # Replace navigate( to router.push(
    content = content.replace('navigate(', 'router.push(')
    content = content.replace('useNavigate()', 'useRouter()')
    content = content.replace('useNavigate', 'useRouter')
    
    if has_link:
        content = "import Link from 'next/link';\n" + content
        
    if needs_client and not content.strip().startswith("'use client'") and not content.strip().startswith('"use client"'):
        content = "'use client';\n\n" + content

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

def copy_and_transform(src_base, dest_base, path_rel=""):
    src_full = os.path.join(src_base, path_rel)
    dest_full = os.path.join(dest_base, path_rel)
    
    if os.path.isdir(src_full):
        os.makedirs(dest_full, exist_ok=True)
        for item in os.listdir(src_full):
            copy_and_transform(src_base, dest_base, os.path.join(path_rel, item))
    else:
        # Don't overwrite files we manually made
        skip_files = ['FirebaseProvider.jsx', 'SiteDetailClient.jsx', 'MapClient.jsx', 'AuthGuards.jsx']
        if os.path.exists(dest_full) and any(x in dest_full for x in skip_files):
            return
            
        shutil.copy2(src_full, dest_full)
        if dest_full.endswith('.jsx') or dest_full.endswith('.js'):
            try:
                process_jsx_file(dest_full)
            except Exception as e:
                print(f"Error processing {dest_full}: {e}")

print("Copying components...")
copy_and_transform(os.path.join(SRC_DIR, "components"), os.path.join(DEST_DIR, "components"))

print("Copying context...")
copy_and_transform(os.path.join(SRC_DIR, "context"), os.path.join(DEST_DIR, "context"))

print("Copying hooks...")
copy_and_transform(os.path.join(SRC_DIR, "hooks"), os.path.join(DEST_DIR, "hooks"))

print("Copying utils...")
copy_and_transform(os.path.join(SRC_DIR, "utils"), os.path.join(DEST_DIR, "utils"))

print("Copying styles...")
copy_and_transform(os.path.join(SRC_DIR, "styles"), os.path.join(DEST_DIR, "styles"))

print("Copying legacy pages (to resolve CSS and component imports)...")
copy_and_transform(os.path.join(SRC_DIR, "pages"), os.path.join(DEST_DIR, "legacy_pages"))

print("Copying public assets...")
PUBLIC_SRC = r"c:\Users\kevin\Documents\WEB25\muni-app\app-turismo\public"
PUBLIC_DEST = os.path.join(DEST_DIR, "public")
if os.path.exists(PUBLIC_SRC):
    for item in os.listdir(PUBLIC_SRC):
        if item == 'manifest.json':
            continue
        src_item = os.path.join(PUBLIC_SRC, item)
        dest_item = os.path.join(PUBLIC_DEST, item)
        if os.path.isdir(src_item):
            shutil.copytree(src_item, dest_item, dirs_exist_ok=True)
        else:
            shutil.copy2(src_item, dest_item)

print("Migration script finished!")
