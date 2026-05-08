from django.http import HttpResponse
import os

def home_view(request):
    template_path = os.path.join(os.path.dirname(__file__), 'home.html')
    with open(template_path, 'r', encoding='utf-8') as f:
        html = f.read()
    return HttpResponse(html)