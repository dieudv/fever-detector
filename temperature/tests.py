import unittest
from django.test import Client


class PostTest(unittest.TestCase):
    def setUp(self):
        # Every test needs a client.
        self.client = Client()

    def test_details(self):
        # Issue a POST request.
        photo = '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'
        response = self.client.post('/api/', {'value': '37.4', 'photo': photo})

        # Check that the response is 201 OK.
        self.assertEqual(response.status_code, 201)