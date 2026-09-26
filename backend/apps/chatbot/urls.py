from django.urls import path
from .views import ChatbotView, AssistantGreffeView, GenerateDocumentView

urlpatterns = [
    path('ask/', ChatbotView.as_view(), name='chatbot_ask'),
    path('admin/', AssistantGreffeView.as_view(), name='chatbot_admin'),
    path('generate-doc/', GenerateDocumentView.as_view(), name='chatbot_generate_doc'),
]
