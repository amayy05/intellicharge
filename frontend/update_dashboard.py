import re

with open('src/components/CoPilotDashboard.jsx', 'r', encoding='utf-8') as f:
    dashboard = f.read()

# Replace the chat sidebar
chat_sidebar_regex = r'<div className="w-full lg:w-\[460px\] xl:w-\[500px\].*?</main>'

new_dashboard = re.sub(chat_sidebar_regex, 
    '<AgentChat currentLat={location.lat} currentLng={location.lng} currentBattery={batteryPct} currentConnector={connectorType} /></main>', 
    dashboard, 
    flags=re.DOTALL)

with open('src/components/CoPilotDashboard.jsx', 'w', encoding='utf-8') as f:
    f.write(new_dashboard)

print('Done replacing chat sidebar in CoPilotDashboard.jsx')
