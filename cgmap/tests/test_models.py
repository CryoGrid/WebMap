from django.test import TestCase

from cgmap.models import ForcingData


# Create your tests for the models here.


class MapModelTestCase(TestCase):

    def test_string_representation(self):
        forcing_data = ForcingData(name='wind speed')
        self.assertEqual(str(forcing_data), forcing_data.name)
