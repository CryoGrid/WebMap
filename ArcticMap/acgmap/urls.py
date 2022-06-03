from django.conf import settings
from django.conf.urls.static import static
from django.urls import path
from .views import MapView, AboutView, ContactView, LegalView

urlpatterns = [
    path('', MapView.as_view(), name='index'),
    path('about/', AboutView.as_view(), name='about'),
    path('contact/', ContactView.as_view(), name='contact'),
    path('legal/', LegalView.as_view(), name='legal'),
    path('get_cell_data/', MapView.get_cell_data, name='cell_data'),
]

urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
