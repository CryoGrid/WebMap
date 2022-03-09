from django.shortcuts import render
from django.http import HttpResponse

from django.views.generic import TemplateView


# Create your views here.
class MapView(TemplateView):
    template_name = 'acgmap/index.html'

    # get request is called at initial load of the page and sets up the map
    def get(self, request, *args, **kwargs):
        return render(request, self.template_name,)
