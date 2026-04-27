import re
import os

html_path = r'c:\Users\Shubham jain\OneDrive\Attachments\Desktop\NC3\index.html'
with open(html_path, 'r', encoding='utf-8') as f:
    html = f.read()

# Extract styles
style_pattern = re.compile(r'<style>(.*?)</style>', re.DOTALL)
styles = style_pattern.findall(html)
if styles:
    with open(r'c:\Users\Shubham jain\OneDrive\Attachments\Desktop\NC3\style.css', 'w', encoding='utf-8') as f:
        f.write(styles[0].strip())
    html = style_pattern.sub('<link rel="stylesheet" href="style.css">', html, count=1)

# Extract scripts
script_pattern = re.compile(r'<script>(.*?)</script>', re.DOTALL)
scripts = script_pattern.findall(html)
if scripts:
    with open(r'c:\Users\Shubham jain\OneDrive\Attachments\Desktop\NC3\script.js', 'w', encoding='utf-8') as f:
        f.write(scripts[0].strip())
    html = script_pattern.sub('<script src="script.js"></script>', html, count=1)

# Inject Globe CDN
head_injection = """  <link rel="stylesheet" href="style.css">
  <script src="//unpkg.com/three"></script>
  <script src="//unpkg.com/globe.gl"></script>"""
html = html.replace('<link rel="stylesheet" href="style.css">', head_injection)

# Add globe container to auth screen
auth_screen_regex = r'(<div class="screen" id="auth-screen">)'
html = re.sub(auth_screen_regex, r'\1\n    <div id="globeViz" style="position:absolute; inset:0; z-index:-1;"></div>', html)

with open(html_path, 'w', encoding='utf-8') as f:
    f.write(html)

print("Split successful!")
