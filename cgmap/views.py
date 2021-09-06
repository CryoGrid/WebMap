# Create your views here.
import datetime
import json

from django.contrib import messages
from django.core.serializers import serialize
from django.db import connection
from django.shortcuts import render
from django.http import JsonResponse, HttpResponseBadRequest
from django.views.decorators.csrf import csrf_exempt
from django.views.generic import TemplateView

from .models import MapGrid, Date


class MapView(TemplateView):
    template_name = 'cgmap/index.html'
    today = datetime.date.today()
    print('current date: ', today)
    if Date.objects.filter(time=today).exists():
        date_idx = Date.objects.get(time=today)

    def get(self, request, *args, **kwargs):
        context = super().get_context_data(**kwargs)

        if request.session.test_cookie_worked():
            request.session.delete_test_cookie()
        else:
            request.session.set_test_cookie()
            messages.error(request, 'Please enable cookie')

        if context.get('depth_level') is None:
            context['depth_level'] = 0
        else:
            context['depth_level'] = 'new_depth_level'

        context['cg_data'] = {}
        date_id = int(self.date_idx.id)+1
        with connection.cursor() as cursor:
            cursor.execute("SELECT grid_id, name, depth_level1[1][%s], tair[%s] FROM temperature_depth_level" % (date_id, date_id))
            cg = cursor.fetchall()
            for cg_data in cg:
                # entry = depth.values_list('depth_level1', 'tair').filter(grid_id__exact=cg.grid_id)
                json_data = {
                    'grid_id': cg_data[0],
                    'file_name': cg_data[1],
                    'soil_temp': cg_data[2],
                    'air_temp': cg_data[3],
                    'depth_level': '1',
                    'date': self.today
                }
                context['cg_data'].update({cg_data[0]: json_data})
        geojson = serialize('geojson', MapGrid.objects.all(), geometry_field='feature')
        request.session['depth_level'] = context['depth_level']
        return render(request, self.template_name,
                      {'grid_data': geojson, 'context': context['depth_level'], 'cg_data': context['cg_data']})

    @csrf_exempt
    def get_depth_level_data(self, **kwargs):
        if self.method == 'POST':
            print('___________Request: ', self.method, ' with type ', type(self), '___________')
            temp = {'cg_data': {}}
            today = datetime.date.today()
            self.session['depth_level'] = self.POST.get('url_data')
            date_idx = Date.objects.get(time=today).id+1
            depth_level = int(self.POST.get('url_data'))+1
            with connection.cursor() as cursor:
                cursor.execute("SELECT grid_id, depth_level%s[1][%s] FROM temperature_depth_level" % (depth_level, date_idx))
                cg = cursor.fetchall()
                for data in cg:
                    json_data = {
                        'id': data[0],
                        'soil_temp': data[1],
                        'depth_level': str(depth_level),
                    }
                    temp['cg_data'].update({data[0]: json_data})
                print('filter query: ', temp['cg_data'][1415])
            print('______________________session data, stored depth_level: ', self.session['depth_level'], '__________________________')
            return JsonResponse([{'cg_data': temp['cg_data']}, {'depth_level': depth_level}], safe=False)
        else:
            return HttpResponseBadRequest('This view can not handle method {0}'. \
                                          format(self.method), status=405)

    @csrf_exempt
    def get_cell_data(self, **kwargs):
        if self.method == 'POST':
            print('___________Request: ', self.method, ' with type ', type(self), ' ___________')
            depth_level = int(self.POST.get('url_data'))
            idx = self.POST.get('idx')
            print('depth_level: ', depth_level, ' idx: ', idx)
            with connection.cursor() as cursor:
                cursor.execute("SELECT depth_level%s FROM temperature_depth_level WHERE grid_id = %s" % (depth_level, idx))
                cg = cursor.fetchall()
                print('data type of selected data: ', type(cg[0][0][0]))
            self.session['cell_data'] = str(cg[0][0][0])
            print('____________________session data with cell data: ', self.session, '_________________________________')
            return JsonResponse([{'cell_data': cg[0][0][0]}, {'depth_level': depth_level}], safe=False)
        else:
            return HttpResponseBadRequest('This view can not handle method {0}'. \
                                          format(self.method), status=405)

