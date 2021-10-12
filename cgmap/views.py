# Create your views here.
import datetime
import json
import numpy
import numpy as np

from django.contrib import messages
from django.core.serializers import serialize
from django.db import connection
from django.shortcuts import render
from django.http import JsonResponse, HttpResponseBadRequest
from django.views.decorators.csrf import csrf_exempt
from django.views.generic import TemplateView

from .models import MapGrid, Date, DepthLevel


# This class contains to logic for the main page where the map is initiated
class MapView(TemplateView):
    template_name = 'cgmap/index.html'
    today = datetime.date.today()
    print('current date: ', today)
    if Date.objects.filter(time=today).exists():
        date_idx = Date.objects.get(time=today)

    # get request is called at initial load of the page, it sets up the grid layer and loads the data for the grid cells
    def get(self, request, *args, **kwargs):
        context = super().get_context_data(**kwargs)

        # depth level is set to 0, because the ui slider starts at the index of 0
        context['depth_level'] = 0
        context['cg_data'] = {}
        date_id = int(self.date_idx.id)

        # postgreSQL DB index starts at 1
        depth_id = int(context['depth_level']) + 1
        with connection.cursor() as cursor:
            cursor.execute("SELECT z_level FROM cgmap_depthlevel WHERE id=%s;" % depth_id)
            depth = cursor.fetchone()
            cursor.execute(
                "SELECT grid_id, name, depth_level1[%s], tair[%s] FROM temperature_depth_level" % (date_id, date_id))
            cg = cursor.fetchall()
            # turn query data into json data
            for cg_data in cg:
                json_data = {
                    'grid_id': cg_data[0],
                    'file_name': cg_data[1],
                    'soil_temp': cg_data[2],
                    'air_temp': cg_data[3],
                    'depth_idx': depth_id,
                    'depth_level': depth,
                    'date': self.today
                }
                context['cg_data'].update({cg_data[0]: json_data})
        # query to get shape data for grid map
        geojson = serialize('geojson', MapGrid.objects.all(), geometry_field='feature')
        return render(request, self.template_name,
                      {'grid_data': geojson, 'context': context['depth_level'], 'cg_data': context['cg_data']})

    # request function to get data for selected depth level
    @csrf_exempt
    def get_depth_level_data(self, **kwargs):
        if self.method == 'POST':
            print('___________Request: ', self.method, ' with type ', type(self), '___________')
            temp = {'cg_data': {}}
            today = datetime.date.today()
            date_idx = Date.objects.get(time=today).id
            # postgreSQL DB index starts at 1
            depth_id = int(self.POST.get('url_data')) + 1
            with connection.cursor() as cursor:
                cursor.execute("SELECT z_level FROM cgmap_depthlevel WHERE id=%s;" % depth_id)
                depth = cursor.fetchone()
                cursor.execute(
                    "SELECT grid_id, depth_level%s[%s] FROM temperature_depth_level" % (depth_id, date_idx))
                cg = cursor.fetchall()
                for data in cg:
                    json_data = {
                        'id': data[0],
                        'soil_temp': data[1],
                        'depth_level': depth,
                        'depth_idx': str(depth_id),
                    }
                    temp['cg_data'].update({data[0]: json_data})
                print('filter query: ', temp['cg_data'][1415])
            return JsonResponse([{'cg_data': temp['cg_data']}, {'depth_level': depth_id}], safe=False)
        else:
            return HttpResponseBadRequest('This view can not handle method {0}'. \
                                          format(self.method), status=405)

    # request function to get data for selected cell for the chart
    @csrf_exempt
    def get_cell_data(self, **kwargs):
        if self.method == 'POST':
            print('___________Request: ', self.method, ' with type ', type(self), ' ___________')
            today = datetime.date.today()
            # date_idx = Date.objects.get(time=today).id
            # definition of interval
            start_interval = 14611  # id for 2020-01-01
            end_interval = start_interval + 365  # id for 2020-12-31
            depth_level = int(self.POST.get('url_data'))
            idx = self.POST.get('idx')
            with connection.cursor() as cursor:
                cursor.execute(
                    "SELECT depth_level%s[%s:%s], depth_level5[%s:%s], depth_level8[%s:%s], tair[%s:%s] FROM temperature_depth_level WHERE grid_id = %s;" % (
                        depth_level, start_interval, end_interval, start_interval, end_interval, start_interval,
                        end_interval, start_interval, end_interval, idx
                    )
                )
                cg = cursor.fetchall()
                cursor.execute(
                    "SELECT time FROM cgmap_date WHERE id >= %s and id <= %s;" % (
                        start_interval, end_interval
                    )
                )
                interval = cursor.fetchall()
            return JsonResponse([{'cell_data': cg}, {'depth_level': depth_level}, {'date_interval': interval}],
                                safe=False)
        else:
            return HttpResponseBadRequest('This view can not handle method {0}'. \
                                          format(self.method), status=405)

    # request function to get data for trumpet curve
    @csrf_exempt
    def get_max_min(self):
        if self.method == 'POST':
            print('___________Request: ', self.method, ' with type ', type(self), ' ___________')
            idx = self.POST.get('idx')
            start_interval = 14611  # id for 2020-01-01
            end_interval = start_interval + 365  # id for 2020-12-31
            depth_list = {}
            with connection.cursor() as cursor:
                for x in range(1, 16):
                    cursor.execute(
                        "SELECT depth_level%s[%s:%s] FROM temperature_depth_level WHERE grid_id = %s;" % (
                            x, start_interval, end_interval, idx
                        )
                    )
                    cg = cursor.fetchall()
                    depth_list[x] = [float(i) for i in cg[0][0]]
            for idx in depth_list:
                arr = np.array(depth_list[idx])
                json_data = {
                    'min': np.round(np.min(arr), 2),
                    'max': np.round(np.max(arr), 2),
                    'mean': np.round(np.mean(arr), 2),
                    'median': np.round(np.median(arr), 2),
                    'max_quantile': np.round(np.quantile(arr, 0.9), 2),
                    'min_quantile': np.round(np.quantile(arr, 0.1), 2),
                }
                depth_list[idx] = json_data
            return JsonResponse([{'depth_list': depth_list}],
                                safe=False)
        else:
            return HttpResponseBadRequest('This view can not handle method {0}'. \
                                          format(self.method), status=405)

    # request function to get data for trumpet curve
    @csrf_exempt
    def get_ground_profile(self):
        if self.method == 'POST':
            print('___________Request: ', self.method, ' with type ', type(self), ' ___________')
            idx = self.POST.get('idx')
            start_interval = 14611  # id for 2020-01-01
            end_interval = start_interval + 365  # id for 2020-12-31
            depth_list = {}
            with connection.cursor() as cursor:
                for x in range(1, 11):
                    cursor.execute(
                        "SELECT depth_level%s[%s:%s] FROM temperature_depth_level WHERE grid_id = %s;" % (
                            x, start_interval, end_interval, idx
                        )
                    )
                    cg = cursor.fetchall()
                    depth_list[x] = [float(i) for i in cg[0][0]]
                cursor.execute(
                    "SELECT id, z_level FROM cgmap_depthlevel"
                )
                z_level = cursor.fetchall()
                cursor.execute(
                    "SELECT time FROM cgmap_date WHERE id >= %s and id <= %s;" % (
                        start_interval, end_interval
                    )
                )
                interval = cursor.fetchall()

            for idx in depth_list:
                z_level.sort()
                temp = []
                for i, val in enumerate(depth_list[idx]):
                    temp.append({'x': interval[i][0], 'y': float(z_level[idx-1][1]), 'r': val})

                json_data = {
                    'data': temp,
                }
                depth_list[idx] = json_data

            return JsonResponse([{'depth_list': depth_list}, {'date_interval': interval}],
                                safe=False)
        else:
            return HttpResponseBadRequest('This view can not handle method {0}'. \
                                          format(self.method), status=405)


class AboutView(TemplateView):
    template_name = 'cgmap/about.html'

    def get(self, request, *args, **kwargs):
        return render(request, self.template_name)


class ContactView(TemplateView):
    template_name = 'cgmap/contact.html'

    def get(self, request, *args, **kwargs):
        return render(request, self.template_name)


class LegalView(TemplateView):
    template_name = 'cgmap/legal.html'

    def get(self, request, *args, **kwargs):
        return render(request, self.template_name)
