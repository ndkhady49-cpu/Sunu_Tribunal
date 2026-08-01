from django.urls import path
from .views import ChatbotView, GenerateDocumentView

urlpatterns = [
    path('ask/', ChatbotView.as_view(), name='chatbot_ask'),
    path('generate-doc/', GenerateDocumentView.as_view(), name='chatbot_generate_doc'),
]
