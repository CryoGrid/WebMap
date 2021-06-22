# Create your views here.
import datetime

from django.core.serializers import serialize
from django.shortcuts import render
from django.http import JsonResponse, Http404
from django.template import RequestContext
from django.views import View
from django.views.generic import TemplateView
import json

from .models import CryoGridData, ForcingData, MapGrid


class MapView(TemplateView):
    template_name = 'cgmap/index.html'

    def get(self, request, *args, **kwargs):
        date = datetime.date.today()
        print('today: ', date)
        # cg = CryoGridData.objects.all().filter(CryoGridData.time == date)
        # print('current cg data: ', cg)
        # fc = ForcingData.objects.all().filter(ForcingData.grid == 114)
        # print('fc at grid 114: ', fc)
        context = super().get_context_data(**kwargs)
        print('init context: ', context)
        if context.get('depth_level') is None:
            context['depth_level'] = 0
        else:
            context['depth_level'] = 'new_depth_level'

        # context['depth'] = list(MapGrid.objects.values())
        # print('context data depth: ', context['depth'])
        geojson = serialize('geojson', MapGrid.objects.all(), geometry_field='feature')
        print('context', context, ' data type: ', type(context))
        return render(request, self.template_name, {'grid_data': geojson, 'context': context['depth_level']})

    def set_depth_level(self, depth, *args, **kwargs):
        context = super().get_context_data(**kwargs)
        context['depth_level'] = int(depth)
        cg_data = CryoGridData.objects.filter.all(tsoil_id=depth)
        context['cg_data_depth'] = cg_data
        return JsonResponse({'context': context['cg_data_depth']})

    def get_grid_data(self, grid_id, *args, **kwargs):
        context = super().get_context_data(**kwargs)
        cg_data = CryoGridData.objects.filter.all(grid=grid_id)
        fc_data = ForcingData.objects.filter.all(grid=grid_id)
        context['cg_data'] = cg_data
        context['fc_data'] = fc_data
        return JsonResponse({'context': context})
