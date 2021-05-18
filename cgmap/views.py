# Create your views here.

from django.shortcuts import render
from django.http import HttpResponse
from django.template import loader
from django.views.generic import TemplateView

from .models import CryoGridData


class MapView(TemplateView):

    template_name = 'cgmap/index.html'

    def get(self, request, *args, **kwargs):
        cg = CryoGridData.objects.all()
        return render(request, self.template_name, {'cg_data': cg})
