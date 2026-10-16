import re

with open('stitch_design.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Extract body content
body_match = re.search(r'<body[^>]*>(.*?)</body>', html, re.DOTALL)
if body_match:
    body = body_match.group(1)
    
    # Basic HTML to JSX conversions
    body = body.replace('class=', 'className=')
    body = body.replace('for=', 'htmlFor=')
    body = body.replace('<!--', '{/*')
    body = body.replace('-->', '*/}')
    
    # Simple inline style replacement (not perfect for complex ones, but handles url(...) mostly)
    def style_replacer(match):
        style_content = match.group(1)
        # convert 'background-image: url(...) ; opacity: ...' to react style object roughly
        # For our html we know there's only one style with background-image
        if 'background-image' in style_content:
            return 'style={{ backgroundImage: "url(\'https://lh3.googleusercontent.com/aida-public/AB6AXuBTQdg8STmhWlNxLpD7-jtQSbYOHaf4cEsMIrx-ruhQZ4d8HaOHXUYbh3GgR8of2Hypa-aywxvO_IALhOZgcdl0RZprnhGXwQDGA8JFyvExLEMJXTG_Nlz4NIgzRfjt7Oj_3UDjpSaIiJ0vdjhINK75HWpee4zvzPxDJdGKXkiGfn94ZfLcY_IEpS-0DYrFoQLzpxAdJbsV_0y9YXauA_Qamp2nr4oCR500xyQYRSXLREDHgH57dB1a\')" }}'
        return 'style={{}}'
        
    body = re.sub(r'style=\"([^\"]+)\"', style_replacer, body)
    
    # Self closing tags
    body = re.sub(r'<img(.*?)(?<!/)>', r'<img\1 />', body)
    body = re.sub(r'<input(.*?)(?<!/)>', r'<input\1 />', body)
    body = re.sub(r'<br(.*?)(?<!/)>', r'<br\1 />', body)
    body = re.sub(r'<hr(.*?)(?<!/)>', r'<hr\1 />', body)
    
    # SVG attributes
    body = re.sub(r'<path(.*?)></path>', r'<path\1 />', body)
    body = re.sub(r'<circle(.*?)></circle>', r'<circle\1 />', body)
    body = re.sub(r'<rect(.*?)></rect>', r'<rect\1 />', body)
    body = re.sub(r'<stop(.*?)></stop>', r'<stop\1 />', body)
    body = re.sub(r'<feDropShadow(.*?)></feDropShadow>', r'<feDropShadow\1 />', body)
    
    # JSX attribute cases
    attrs = [
        'stroke-width', 'stroke-linejoin', 'stroke-linecap', 'stroke-dasharray',
        'stroke-opacity', 'font-family', 'font-size', 'font-weight', 'letter-spacing',
        'stop-color', 'stop-opacity', 'fill-rule', 'clip-rule', 'xmlns:xlink'
    ]
    for attr in attrs:
        camel = attr.split('-')
        if len(camel) > 1:
            camel = camel[0] + ''.join(x.title() for x in camel[1:])
        elif ':' in attr:
            parts = attr.split(':')
            camel = parts[0] + parts[1].title()
        body = body.replace(f'{attr}=', f'{camel}=')
        
    body = body.replace('onsubmit=', 'onSubmit=')

    with open('src/components/CoPilotDashboard.jsx', 'w', encoding='utf-8') as out:
        out.write('import React, { useState } from "react";\n')
        out.write('import MapView from "./MapView";\n')
        out.write('import AgentChat from "./AgentChat";\n\n')
        out.write('export default function CoPilotDashboard({ location, batteryPct, setBatteryPct, connectorType, setConnectorType, recommendationData, onSearch }) {\n  return (\n    <div className="min-h-screen bg-[#F9F7F2] font-body text-[#181A19] antialiased selection:bg-[#E8E4DC] selection:text-[#181A19]">\n')
        out.write(body)
        out.write('\n    </div>\n  );\n}\n')
        
    print('Converted successfully.')
else:
    print('Failed to extract body.')
