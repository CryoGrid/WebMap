# Create your views here.
import datetime

from django.core.serializers import serialize
from django.shortcuts import render
from django.http import JsonResponse, Http404
from django.template import RequestContext
from django.views import View
from django.views.generic import TemplateView
import json

from .models import CryoGridData, ForcingData, MapGrid, Date


class MapView(TemplateView):
    template_name = 'cgmap/index.html'

    def get(self, request, *args, **kwargs):
        today = datetime.date.today()
        print('today: ', today)

        context = super().get_context_data(**kwargs)
        print('init context: ', context)
        if context.get('depth_level') is None:
            context['depth_level'] = 0
        else:
            context['depth_level'] = 'new_depth_level'

        date_idx = Date.objects.get(time=today)

        print('selected date: ', date_idx.time, ' with id: ', date_idx.id)

        cg = CryoGridData.objects.all().filter(grid_id=1415)
        for data in cg:
            json_data = {
                'grid_id': data.grid_id,
                'file_name': data.name,
                'soil_temp': data.tsoil[context['depth_level']][date_idx.id],
                'date': today
            }
            if context.get('cg_data') is None:
                context['cg_data'] = json_data
            else:
                context['cg_data'].update(json_data)

        print('context cg_data length: ', len(context['cg_data']))
        fc = ForcingData.objects.all().filter(grid_id=1415)
        print('data type fc: ', fc)
        for data in fc:
            json_data = {
                'grid_id': data.grid_id,
                'file_name': data.name,
                'air_temp': data.tair[date_idx.id],
            }
            if context.get('fc_data') is None:
                context['fc_data'] = json_data
            else:
                context['fc_data'].update(json_data)
            print('fc_data length: ', len(context['fc_data']))
        # context['depth'] = list(MapGrid.objects.values())
        # print('context data depth: ', context['depth'])
        geojson = serialize('geojson', MapGrid.objects.all(), geometry_field='feature')
        print('context', context, ' data type: ', type(context))
        return render(request, self.template_name, {'grid_data': geojson, 'context': context['depth_level'], 'cg_data': context['cg_data'], 'fc_data': context['fc_data']})

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
