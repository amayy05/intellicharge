import re

with open('src/components/CoPilotDashboard.jsx', 'r', encoding='utf-8') as f:
    dashboard = f.read()

# Extract the chat block
chat_match = re.search(r'<div className="w-full lg:w-\[460px\] xl:w-\[500px\](.*?)</main>', dashboard, re.DOTALL)
if chat_match:
    # the capture group captures from just after the start of the div until the end of the main tag
    chat_html = '<div className="w-full lg:w-[460px] xl:w-[500px]' + chat_match.group(1)
    
    # fix the closing tags to match what we expect for just the chat sidebar
    chat_html = chat_html.replace('</div></div></div></main>', '</div>')
    
    with open('chat_html.txt', 'w', encoding='utf-8') as f:
        f.write(chat_html)
    print('Saved chat HTML')
else:
    print('Could not find chat block')
