from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate, get_user_model
from .models import Message
from .serializers import MessageSerializer

User = get_user_model()


class MessageViewSet(viewsets.ModelViewSet):
    queryset = Message.objects.all()
    serializer_class = MessageSerializer


class LoginView(APIView):
    """Simple login view that returns a token on successful authentication."""
    permission_classes = []

    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        if not email or not password:
            return Response({'detail': 'Email and password required'}, status=status.HTTP_400_BAD_REQUEST)

        # Try to authenticate — assumes User.email is used for login or username fallback
        user = authenticate(request, username=email, password=password)
        if user is None:
            # Try authenticating by username if email auth not configured
            try:
                user_obj = User.objects.filter(email=email).first()
                if user_obj:
                    user = authenticate(request, username=user_obj.username, password=password)
            except Exception:
                user = None

        if user is None:
            return Response({'detail': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

        token, created = Token.objects.get_or_create(user=user)
        return Response({'token': token.key, 'user': {'id': user.id, 'username': getattr(user, 'username', ''), 'email': getattr(user, 'email', '')}})


class RegisterView(APIView):
    """Simple registration view that creates a user with email and password."""
    permission_classes = []

    def post(self, request):
        full_name = request.data.get('fullName') or request.data.get('full_name') or ''
        email = request.data.get('email')
        password = request.data.get('password')
        user_id = request.data.get('userId') or request.data.get('user_id') or ''

        if not email or not password:
            return Response({'detail': 'Email and password required'}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(email=email).exists():
            return Response({'detail': 'User with this email already exists'}, status=status.HTTP_400_BAD_REQUEST)

        # Create user — if your User model requires username, use email as username
        username = email.split('@')[0]
        user = User.objects.create_user(username=username, email=email, password=password)
        # Optionally save full name or custom fields if present
        if hasattr(user, 'first_name') and full_name:
            user.first_name = full_name
            user.save()

        token, created = Token.objects.get_or_create(user=user)
        return Response({'token': token.key, 'user': {'id': user.id, 'username': user.username, 'email': user.email}}, status=status.HTTP_201_CREATED)

