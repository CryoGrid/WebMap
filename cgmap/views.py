# Create your views here.
import datetime

from django.core.serializers import serialize
from django.db import connection
from django.shortcuts import render
from django.http import JsonResponse, Http404, HttpResponseBadRequest
from django.template import RequestContext
from django.views import View
from django.views.decorators.csrf import csrf_exempt
from django.views.generic import TemplateView
import json
import pickle

from .models import CryoGridData, ForcingData, MapGrid, Date, TemperatureDepthLevel


class MapView(TemplateView):
    template_name = 'cgmap/index.html'
    today = datetime.date.today()
    print('current date: ', today)
    if Date.objects.filter(time=today).exists():
        date_idx = Date.objects.get(time=today)
        print('idx: ', date_idx, ' for current date: ', today)

    def get(self, request, *args, **kwargs):
        context = super().get_context_data(**kwargs)
        if context.get('depth_level') is None:
            context['depth_level'] = 0
        else:
            context['depth_level'] = 'new_depth_level'

        context['cg_data'] = {}
        context['fc_data'] = {}
        depth = TemperatureDepthLevel.objects.defer("depth_level2", "depth_level3", "depth_level4", "depth_level5",
                                                    "depth_level6",
                                                    "depth_level7", "depth_level8", "depth_level9", "depth_level10",
                                                    "depth_level11",
                                                    "depth_level12", "depth_level13", "depth_level14", "depth_level15")

        cg_queryset = CryoGridData.objects.defer("tsoil")
        print('date idx:', self.date_idx.id)
        print('getting cryo grid data into cache')
        for cg_data in depth:
            # entry = depth.values_list('depth_level1', 'tair').filter(grid_id__exact=cg.grid_id)
            json_data = {
                'grid_id': cg_data.grid_id,
                'file_name': cg_data.name,
                'soil_temp': cg_data.depth_level1[0][self.date_idx.id],
                'air_temp': cg_data.tair[self.date_idx.id],
                'date': self.today
            }
            context['cg_data'].update({cg_data.grid_id: json_data})
        '''
        cg = CryoGridData.objects.all().filter(grid_id=1415)
        for data in cg:
            entry = depth.values_list('depth_level1', 'tair').filter(grid_id__exact=data.grid_id)
            print('second entry length: ', len(entry[0][1]), 'entry length first entry: ', len(entry[0][0][0]), ' with datatype: ', type(entry[0][0]))
            json_data = {
                'grid_id': data.grid_id,
                'file_name': data.name,
                'soil_temp': entry[0][0][0][self.date_idx.id],
                'air_temp': entry[0][1][self.date_idx.id],
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
        '''
        # context['depth'] = list(MapGrid.objects.values())
        # print('context data depth: ', context['depth'])
        geojson = serialize('geojson', MapGrid.objects.all(), geometry_field='feature')
        # print('context', context, ' data type: ', type(context))
        return render(request, self.template_name,
                      {'grid_data': geojson, 'context': context['depth_level'], 'cg_data': context['cg_data']})

    @csrf_exempt
    def get_depth_level_data(self, **kwargs):
        if self.method == 'POST':
            print('___________Request: ', self.method, ' with type ', type(self), ' ___________')
            temp = {'cg_data': {}}
            today = datetime.date.today()
            date_idx = Date.objects.get(time=today).id+1
            depth_level = int(self.POST.get('url_data'))+1
            print('data_idx: ', date_idx, ' and depth level: ', depth_level)
            with connection.cursor() as cursor:
                cursor.execute("SELECT grid_id, depth_level%s[1][%s] FROM temperature_depth_level" % (depth_level, date_idx))
                cg = cursor.fetchall()
                for data in cg:
                    json_data = {
                        'id': data[0],
                        'soil_temp': data[1],
                    }
                    temp['cg_data'].update({data[0]: json_data})
                # columns = [col[0] for col in cursor.description]
                # dct = [dict(zip(columns, row)) for row in cursor.fetchall()]
                print('filter query: ', temp['cg_data'][1415])

            return JsonResponse([{'cg_data': temp['cg_data']}, {'depth_level': depth_level}], safe=False)
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

