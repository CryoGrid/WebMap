from django.urls import path
from .views import MapView

urlpatterns = [
    path('', MapView.as_view(), name='index'),
    path('<int:get_depth_map>/', MapView.as_view(), name='get_depth_map'),
]
