import time

from django.test import TestCase
from selenium import webdriver
from webdriver_manager.chrome import ChromeDriverManager
from django.contrib.staticfiles.testing import StaticLiveServerTestCase
from django.urls import reverse


# Create your test for the views here.

class MapViewsTestCase(TestCase):

    def setUp(self):
        self.browser = webdriver.Chrome(ChromeDriverManager().install())

    def tearDown(self):
        self.browser.close()

    def test_map_is_displayed(self):
        self.browser.get('http://localhost:8000/cgmap/')
        self.assertEqual(
            self.browser.find_element_by_id('main'), self.browser.find_element_by_class_name('leaflet-container')
        )

    def test_index(self):
        resp = self.client.get('/cgmap/')
        self.assertEqual(resp.status_code, 200)

