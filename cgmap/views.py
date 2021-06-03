# Create your views here.
from django.core.serializers import serialize
from django.shortcuts import render
from django.http import HttpResponse
from django.template import loader
from django.views.generic import TemplateView

from .models import CryoGridData, ForcingData, MapGrid


class MapView(TemplateView):

    template_name = 'cgmap/index.html'

    def get(self, request, *args, **kwargs):
        # cg = CryoGridData.objects.all()
        # fd = ForcingData.objects.all()
        geojson = serialize('geojson', MapGrid.objects.all(), geometry_field='feature')
        # data_json = serialize("json", cg)
        return render(request, self.template_name, {'grid_data': geojson})
