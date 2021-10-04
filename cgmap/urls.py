from django.urls import path
from .views import MapView, AboutView, ContactView, LegalView

urlpatterns = [
    path('', MapView.as_view(), name='index'),
    path('get_depth_level_data/', MapView.get_depth_level_data, name='depth_level_data'),
    path('get_cell_data/', MapView.get_cell_data, name='cell_data'),
    path('get_max_min/', MapView.get_max_min, name='max_min'),
    path('about/', AboutView.as_view(), name='about'),
    path('contact/', ContactView.as_view(), name='contact'),
    path('legal/', LegalView.as_view(), name='legal')
]
