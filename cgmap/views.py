# Create your views here.

from django.shortcuts import render
from django.http import HttpResponse
from django.template import loader
from django.views.generic import TemplateView


class MapView(TemplateView):

    template_name = 'cgmap/index.html'

    def get(self, request, *args, **kwargs):
        return render(request, self.template_name)
