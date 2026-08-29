import re

path = 'c:/Users/This PC/Downloads/UniScout_1.5.1/UniScout_1.5/frontend/src/components/Dashboard.jsx'

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

def replacer(match):
    middle = match.group(1)
    prop = match.group(2)
    return f"border ${{formData.{prop} ? 'bg-white border-blue-100' : 'bg-red-50 border-red-500'}}{middle}value={{formData.{prop}}}"

pattern = r"border \$\{formData\. \? 'bg-white border-blue-100' : 'bg-red-50 border-red-500'\}(\s+rounded-xl[^>]+)value=\{formData\.(\w+)\}"

new_content = re.sub(pattern, replacer, content)

with open(path, 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Fix completed")
