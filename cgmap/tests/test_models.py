from django.test import TestCase  # subclass jof unittest.TestCase and has same functionalities
import unittest
from ..models import ForcingData, SoilCharacteristics, SoilType, CryoGridData


# Create your tests for the models here.
class MapModelTestCase(TestCase):

    def setUp(self):
        self.cg_data = CryoGridData(name='5213',
                                    lat=52.38131276242783,
                                    long=13.066351933955268,
                                    start_date='01.01.2020')
        self.forcing_data = ForcingData(name='wind speed',
                                        description='this is the description of the wind speed.', )
        self.soil_type = SoilType(
            name='soil type a1',
            description='this is the description of this soil type.',
            min_depth=45,
            max_depth=250,
        )
        self.soil_characteristics = SoilCharacteristics(
            name='characteristics 1',
            description='this is the description of the calculated characteristics of the soil type.',
            min_depth=13,
            max_depth=89,
        )

    def tearDown(self):
        pass

    def test_cryo_grid_data_display(self):
        data = CryoGridData.objects.all()
        for val in data:
            self.assertEqual(val.name, '5213')

    def test_forcing_data_display(self):
        self.assertEqual(str(self.forcing_data), self.forcing_data.name)

    def test_soil_type_display(self):
        self.assertEqual(str(self.soil_type), self.soil_type.name)

    def test_soil_characteristics_display(self):
        self.assertEqual(str(self.soil_characteristics), self.soil_characteristics.name)


if __name__ == '__main__':
    unittest.main()
