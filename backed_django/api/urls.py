from rest_framework.routers import DefaultRouter
from django.urls import path
from .views import MessageViewSet, LoginView, RegisterView

router = DefaultRouter()
router.register(r'messages', MessageViewSet, basename='message')

urlpatterns = router.urls + [
	path('auth/login/', LoginView.as_view(), name='api-login'),
	path('auth/register/', RegisterView.as_view(), name='api-register'),
]
