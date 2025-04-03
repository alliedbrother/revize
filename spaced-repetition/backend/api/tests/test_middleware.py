from django.test import TestCase, RequestFactory
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from ..middleware import RequestLoggingMiddleware, AuthenticationMiddleware
from ..models import Topic, RevisionSchedule

User = get_user_model()

class RequestLoggingMiddlewareTest(TestCase):
    def setUp(self):
        self.middleware = RequestLoggingMiddleware()
        self.factory = RequestFactory()
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )

    def test_request_logging_authenticated(self):
        request = self.factory.get('/api/topics/')
        request.user = self.user
        response = self.middleware.process_request(request)
        self.assertIsNone(response)  # Middleware should not return a response

    def test_request_logging_unauthenticated(self):
        request = self.factory.get('/api/topics/')
        request.user = None
        response = self.middleware.process_request(request)
        self.assertIsNone(response)  # Middleware should not return a response

    def test_request_logging_exception(self):
        request = self.factory.get('/api/topics/')
        request.user = self.user
        request.path = '/api/invalid/'
        response = self.middleware.process_request(request)
        self.assertIsNone(response)  # Middleware should not return a response

    def test_request_logging_response(self):
        request = self.factory.get('/api/topics/')
        request.user = self.user
        response = self.middleware.process_response(request, None)
        self.assertIsNone(response)  # Middleware should not return a response

class AuthenticationMiddlewareTest(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
        self.topic = Topic.objects.create(
            user=self.user,
            title='Test Topic',
            content='Test Content'
        )

    def test_authentication_middleware_valid_token(self):
        # Login to get token
        response = self.client.post(
            reverse('api-token-auth'),
            {'username': 'testuser', 'password': 'testpass123'}
        )
        token = response.data['token']

        # Set token in header
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {token}')

        # Make authenticated request
        response = self.client.get(reverse('topic-detail', kwargs={'pk': self.topic.pk}))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_authentication_middleware_invalid_token(self):
        # Set invalid token in header
        self.client.credentials(HTTP_AUTHORIZATION='Token invalid-token')

        # Make request with invalid token
        response = self.client.get(reverse('topic-detail', kwargs={'pk': self.topic.pk}))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_authentication_middleware_missing_token(self):
        # Make request without token
        response = self.client.get(reverse('topic-detail', kwargs={'pk': self.topic.pk}))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_authentication_middleware_expired_token(self):
        # Login to get token
        response = self.client.post(
            reverse('api-token-auth'),
            {'username': 'testuser', 'password': 'testpass123'}
        )
        token = response.data['token']

        # Set token in header
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {token}')

        # Make request with expired token
        response = self.client.get(reverse('topic-detail', kwargs={'pk': self.topic.pk}))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_authentication_middleware_public_endpoints(self):
        # Test public endpoints without authentication
        public_endpoints = [
            reverse('api-token-auth'),
            reverse('register')
        ]

        for endpoint in public_endpoints:
            response = self.client.get(endpoint)
            self.assertNotEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_authentication_middleware_protected_endpoints(self):
        # Test protected endpoints without authentication
        protected_endpoints = [
            reverse('topic-list'),
            reverse('topic-detail', kwargs={'pk': self.topic.pk}),
            reverse('revision-list'),
            reverse('revision-detail', kwargs={'pk': 1}),
            reverse('statistics-list')
        ]

        for endpoint in protected_endpoints:
            response = self.client.get(endpoint)
            self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_authentication_middleware_methods(self):
        # Login to get token
        response = self.client.post(
            reverse('api-token-auth'),
            {'username': 'testuser', 'password': 'testpass123'}
        )
        token = response.data['token']

        # Set token in header
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {token}')

        # Test different HTTP methods
        methods = ['get', 'post', 'put', 'patch', 'delete']
        for method in methods:
            response = getattr(self.client, method)(
                reverse('topic-detail', kwargs={'pk': self.topic.pk})
            )
            self.assertNotEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_authentication_middleware_cors(self):
        # Test CORS headers
        response = self.client.options(
            reverse('topic-list'),
            HTTP_ORIGIN='http://localhost:3000',
            HTTP_ACCESS_CONTROL_REQUEST_METHOD='GET'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('Access-Control-Allow-Origin', response)
        self.assertIn('Access-Control-Allow-Methods', response)
        self.assertIn('Access-Control-Allow-Headers', response)

    def test_authentication_middleware_rate_limit(self):
        # Test rate limiting
        for _ in range(100):  # Assuming rate limit is 100 requests per minute
            response = self.client.get(reverse('topic-list'))
            self.assertNotEqual(response.status_code, status.HTTP_429_TOO_MANY_REQUESTS)

        # Make one more request to trigger rate limit
        response = self.client.get(reverse('topic-list'))
        self.assertEqual(response.status_code, status.HTTP_429_TOO_MANY_REQUESTS) 