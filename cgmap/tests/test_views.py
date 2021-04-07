from django.test import TestCase


# Create your test for the views here.

class MapViewsTestCase(TestCase):
    def test_index(self):
        resp = self.client.get('/cgmap/')
        self.assertEqual(resp.status_code, 200)
