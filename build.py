import os

def build():
    with open('build/index.html', 'r', encoding='utf-8') as f:
        html = f.read()

    with open('build/style.css', 'r', encoding='utf-8') as f:
        css = f.read()

    with open('build/app.js', 'r', encoding='utf-8') as f:
        js = f.read()

    # The user asked for FontAwesome and Chart.js from CDN
    chartjs = '<script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.0/chart.umd.min.js"></script>'
    
    html = html.replace('<style id="injected-style"></style>', f'<style>\n{css}\n</style>')
    html = html.replace('<script id="injected-js"></script>', f'{chartjs}\n<script>\n{js}\n</script>')

    with open('gym_management_system.html', 'w', encoding='utf-8') as f:
        f.write(html)
    
    print("Build complete: gym_management_system.html")

if __name__ == '__main__':
    build()
