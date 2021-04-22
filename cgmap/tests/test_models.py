from django.test import TestCase

from ..models import ForcingData, SoilCharacteristics, SoilType, CryoGridData


# Create your tests for the models here.
class MapModelTestCase(TestCase):

    def test_cryo_grid_data_display(self):
        cryo_grid_data = CryoGridData(
            lat=52.38131276242783,
            long=13.066351933955268,
        )

    def test_forcing_data_display(self):
        forcing_data = ForcingData(
            name='wind speed',
            description='this is the description of the wind speed.',
        )
        self.assertEqual(str(forcing_data), forcing_data.name)

    def test_soil_type_display(self):
        soil_type = SoilType(
            name='soil type a1',
            description='this is the description of this soil type.',
            min_depth=45,
            max_depth=250,
        )
        self.assertEqual(str(soil_type), soil_type.name)

    def test_soil_characteristics_display(self):
        soil_characteristics = SoilCharacteristics(
            name='characteristics 1',
            description='this is the description of the calculated characteristics of the soil type.',
            min_depth=13,
            max_depth=89,
        )
        self.assertEqual(str(soil_characteristics), soil_characteristics.name)
