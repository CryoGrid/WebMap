from django.urls import path
from .views import MapView, AboutView, ContactView, LegalView

urlpatterns = [
    path('', MapView.as_view(), name='index'),
    path('about/', AboutView.as_view(), name='about'),
    path('contact/', ContactView.as_view(), name='contact'),
    path('legal/', LegalView.as_view(), name='legal')
]
