# Create your views here.
import datetime

from django.core.serializers import serialize
from django.shortcuts import render
from django.http import JsonResponse, Http404, HttpResponseBadRequest
from django.template import RequestContext
from django.views import View
from django.views.decorators.csrf import csrf_exempt
from django.views.generic import TemplateView
import json
import pickle

from .models import CryoGridData, ForcingData, MapGrid, Date


class MapView(TemplateView):
    template_name = 'cgmap/index.html'
    today = datetime.date.today()
    date_idx = Date.objects.get(time=today)

    def get(self, request, *args, **kwargs):
        context = super().get_context_data(**kwargs)
        if context.get('depth_level') is None:
            context['depth_level'] = 0
        else:
            context['depth_level'] = 'new_depth_level'

        context['cg_data'] = {}
        context['fc_data'] = {}
        print('selected date: ', self.date_idx.time, ' with id: ', self.date_idx.id)
        '''
        for fc in ForcingData.objects.defer("tair"):
            print('forcing data: ', fc)
            f = ForcingData.objects.values_list("tair").get(id=fc.id)
            tair = f[0][self.date_idx.id]
            json_data = {
                'grid_id': fc.grid_id,
                'file_name': fc.name,
                'air_temp': tair,
            }
            context['fc_data'].update({fc.grid_id: json_data})

        for cg in CryoGridData.objects.defer("tsoil"):
            t = CryoGridData.objects.values_list("tsoil").get(id=cg.id)
            tsoil = t[0][context['depth_level']][self.date_idx.id]
            json_data = {
                'grid_id': cg.grid_id,
                'file_name': cg.name,
                'soil_temp': tsoil,
                'date': self.today
            }
            context['cg_data'].update({cg.grid_id: json_data})
        '''
        cg = CryoGridData.objects.all().filter(grid_id=1415)
        for data in cg:
            json_data = {
                'grid_id': data.grid_id,
                'file_name': data.name,
                'soil_temp': data.tsoil[context['depth_level']][self.date_idx.id],
                'date': self.today
            }
            context['cg_data'].update({data.grid_id: json_data})

        print('context cg_data length: ', len(context['cg_data']))
        fc = ForcingData.objects.all().filter(grid_id=1415)
        print('data type fc: ', fc)
        for data in fc:
            json_data = {
                'grid_id': data.grid_id,
                'file_name': data.name,
                'air_temp': data.tair[self.date_idx.id],
            }
            context['fc_data'].update({data.grid_id: json_data})

            print('fc_data length: ', len(context['fc_data']))
        # context['depth'] = list(MapGrid.objects.values())
        # print('context data depth: ', context['depth'])
        geojson = serialize('geojson', MapGrid.objects.all(), geometry_field='feature')
        print('context', context, ' data type: ', type(context))
        return render(request, self.template_name, {'grid_data': geojson, 'context': context['depth_level'], 'cg_data': context['cg_data'], 'fc_data': context['fc_data']})

    @csrf_exempt
    def get_depth_level_data(self, **kwargs):
        if self.method == 'POST':
            print('___________Request: ', self.method, ' with type ', type(self), ' ___________')
            print('send data from view: ', self.POST.get('url_data'))
            today = datetime.date.today()
            date_idx = Date.objects.get(time=today)
            depth_level = self.POST.get('url_data')
            cg = CryoGridData.objects.all().filter(grid_id=1415)
            for data in cg:
                json_data = {
                    'id': data.grid_id,
                    'file_name': data.name,
                    'soil_temp': data.tsoil[int(depth_level)][date_idx.id],
                    'date': today
                }
            print('created json data: ', json_data, 'with date index: ', date_idx.id)
            return JsonResponse([{1415: json_data}, {'depth_level': depth_level}], safe=False)
        else:
            return HttpResponseBadRequest('This view can not handle method {0}'. \
                                          format(self.method), status=405)

    def get_grid_data(self, grid_id, *args, **kwargs):
        context = super().get_context_data(**kwargs)
        cg_data = CryoGridData.objects.filter.all(grid=grid_id)
        fc_data = ForcingData.objects.filter.all(grid=grid_id)
        context['cg_data'] = cg_data
        context['fc_data'] = fc_data
        return JsonResponse({'context': context}, safe=False)
