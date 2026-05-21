import re

with open('/mnt/wdpassport/Portfolio/styles.css', 'r') as f:
    content = f.read()

# Splitting to avoid :root block
root_start = content.find(':root {')
root_end = content.find('}', root_start)

pre_root = content[:root_start]
root_content = content[root_start:root_end]
post_root = content[root_end:]

def replace_hex(text):
    # Mapping
    replacements = {
        r'#ffffff\b': 'var(--white)',
        r'#fff\b': 'var(--white)',
        r'#fafaf9\b': 'var(--light-bg)',
        r'#292524\b': 'var(--text)',
        r'#064e3b\b': 'var(--primary)',
        r'#022c22\b': 'var(--primary-dark)',
        r'#f59e0b\b': 'var(--accent)',
        r'#f0f0f0\b': 'var(--card-border)',
        r'#1e40af\b': 'var(--sub-heading)',
        r'#28a745\b': 'var(--exp-full)',
        r'#6f42c1\b': 'var(--exp-part)',
        r'#dc3545\b': 'var(--exp-trainee)'
    }
    for hex_code, var_name in replacements.items():
        text = re.sub(hex_code, var_name, text, flags=re.IGNORECASE)
    return text

new_post_root = replace_hex(post_root)
new_pre_root = replace_hex(pre_root)

new_content = new_pre_root + root_content + new_post_root

with open('/mnt/wdpassport/Portfolio/styles.css', 'w') as f:
    f.write(new_content)

print("Done")
