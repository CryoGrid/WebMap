# Create your views here.
from django.contrib.postgres import serializers
from django.core.serializers import serialize
from django.shortcuts import render
from django.http import HttpResponse
from django.template import loader
from django.views.generic import TemplateView

from .models import CryoGridData, ForcingData


class MapView(TemplateView):

    template_name = 'cgmap/index.html'

    def get(self, request, *args, **kwargs):
        cg = CryoGridData.objects.all()
        fd = ForcingData.objects.all()
        data_json = serialize("json", cg)
        return render(request, self.template_name, {'data': data_json})
