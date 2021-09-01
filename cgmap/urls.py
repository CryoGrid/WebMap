from django.urls import path
from .views import MapView

urlpatterns = [
    path('', MapView.as_view(), name='index'),
    path('get_depth_level_data/', MapView.get_depth_level_data, name='index'),
    path('get_cell_data/', MapView.get_cell_data, name='index'),

]
