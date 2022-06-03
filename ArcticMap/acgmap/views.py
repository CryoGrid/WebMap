import datetime

from django.core.serializers import serialize
from django.db import connection
from django.shortcuts import render
from django.http import HttpResponse, JsonResponse, HttpResponseBadRequest
from django.views.decorators.csrf import csrf_exempt

from django.views.generic import TemplateView

from .models import MapGrid, Date


# Create your views here.
class MapView(TemplateView):
    template_name = 'acgmap/index.html'

    # get request is called at initial load of the page and sets up the map
    def get(self, request, *args, **kwargs):
        context = super().get_context_data(**kwargs)
        start_date = int(Date.objects.get(year='1850-01-01 00:00:00+01').id)
        end_date = int(Date.objects.get(year='1900-01-01 00:00:00+01').id)
        print('start date id: ', start_date, ' end date id: ', end_date)
        # depth level is set to 38, for the standard depth of 9.95 m
        context['depth_level'] = 38
        context['cg_data'] = {}
        # date_id = int(self.date_idx.id)

        # postgreSQL DB index starts at 1
        depth_id = int(context['depth_level'])
        with connection.cursor() as cursor:
            cursor.execute("SELECT z_level FROM acgmap_depthlevel WHERE id=%s;" % depth_id)
            depth = cursor.fetchone()
            # cursor.execute("SELECT grid_id, alt FROM acgmap_cryogriddata;")
            # alt = cursor.fetchall()
            cursor.execute(
                "SELECT grid_id, name, t_av_preindustrial_51[%s], t_max_preindustrial_51[%s], t_min_preindustrial_51[%s] FROM acgmap_cryogriddata" % (
                    depth_id, depth_id, depth_id
                ))
            cg = cursor.fetchall()
            # turn query data into json data
            for cg_data in cg:
                json_data = {
                    'grid_id': cg_data[0],
                    'file_name': cg_data[1],
                    'av_preindustrial_51': cg_data[2],
                    'max_preindustrial_51': cg_data[3],
                    'min_preindustrial_51': cg_data[4],
                    'depth_idx': depth_id,
                    'depth_level': depth,
                    'date': start_date,

                }
                context['cg_data'].update({cg_data[0]: json_data})
            # add alt value to cg data json
            # for val in alt:
            #    context['cg_data'][val[0]]['alt'] = float(val[1])
        # query to get shape data for grid map
        geojson = serialize('geojson', MapGrid.objects.all(), geometry_field='feature')
        return render(request, self.template_name, {'grid_data': geojson, 'cg_data': context['cg_data']})

    # request function to get data for selected cell for the chart
    @csrf_exempt
    def get_cell_data(self):
        if self.method == 'POST':
            print('___________Request: ', self.method, ' with type ', type(self), '___________')
            temp = {'cg_data': {}}
            idx = self.POST.get('idx')
            with connection.cursor() as cursor:
                cursor.execute(
                    "SELECT t_av_preindustrial_51, t_min_preindustrial_51, t_max_preindustrial_51," +
                    " t_av_iceage_51, t_min_iceage_51, t_max_iceage_51, " +
                    " t_av_historical_51, t_min_historical_51, t_max_historical_51 FROM acgmap_cryogriddata WHERE grid_id = %s;" % (
                        idx
                    ))
                cg = cursor.fetchall()
                for data in cg:
                    json_data = {
                        'arr_av_preindustrial_51': tuple([float(i) for i in data[0]]),
                        'arr_min_preindustrial_51': tuple([float(i) for i in data[1]]),
                        'arr_max_preindustrial_51': tuple([float(i) for i in data[2]]),
                        'arr_av_iceage_51': tuple([float(i) for i in data[3]]),
                        'arr_min_iceage_51': tuple([float(i) for i in data[4]]),
                        'arr_max_iceage_51': tuple([float(i) for i in data[5]]),
                        'arr_av_historical_51': tuple([float(i) for i in data[6]]),
                        'arr_min_historical_51': tuple([float(i) for i in data[7]]),
                        'arr_max_historical_51': tuple([float(i) for i in data[8]]),
                    }
                    temp['cg_data'].update({'data': json_data})
            return JsonResponse([{'cg_data': temp['cg_data']}], safe=False)
        else:
            return HttpResponseBadRequest('This view can not handle method {0}'. \
                                          format(self.method), status=405)


class AboutView(TemplateView):
    template_name = 'acgmap/index.html'

    def get(self, request, *args, **kwargs):
        return render(request, self.template_name)


class ContactView(TemplateView):
    template_name = 'acgmap/index.html'

    def get(self, request, *args, **kwargs):
        return render(request, self.template_name)


class LegalView(TemplateView):
    template_name = 'acgmap/index.html'

    def get(self, request, *args, **kwargs):
        return render(request, self.template_name)
