from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import authenticate, get_user_model
from django.utils import timezone
from .models import Message, Course, ClassSession, StudentCourse, AttentionRecord, UserProfile
from .serializers import (MessageSerializer, CourseSerializer, ClassSessionSerializer, 
                         StudentCourseSerializer, UserSerializer, AttentionRecordSerializer)

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
        role = 'student'
        try:
            if hasattr(user, 'profile'):
                role = user.profile.role
        except:
            pass
        return Response({'token': token.key, 'user': {'id': user.id, 'username': getattr(user, 'username', ''), 'email': getattr(user, 'email', ''), 'role': role}})


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
        if full_name:
            user.first_name = full_name
            user.save()

        # Determine role from user_id prefix
        role = 'student'
        if user_id.startswith('DOC'):
            role = 'teacher'
        elif user_id.startswith('ADM'):
            role = 'admin'

        # Create user profile
        UserProfile.objects.create(user=user, role=role, user_code=user_id)

        token, created = Token.objects.get_or_create(user=user)
        return Response({'token': token.key, 'user': {'id': user.id, 'username': user.username, 'email': user.email, 'role': role}}, status=status.HTTP_201_CREATED)


# Student endpoints
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def student_courses(request):
    """Get courses enrolled by the authenticated student."""
    enrollments = StudentCourse.objects.filter(student=request.user)
    courses = []
    for enrollment in enrollments:
        # Get upcoming and active sessions for this course
        sessions = ClassSession.objects.filter(course=enrollment.course, status__in=['active', 'upcoming']).order_by('date', 'time')
        for session in sessions:
            courses.append({
                'id': session.id,
                'name': session.course.name,
                'professor': f"{session.teacher.first_name} {session.teacher.last_name}".strip() or session.teacher.username,
                'time': str(session.time),
                'date': str(session.date),
                'status': session.status,
                'course_code': session.course.code
            })
    return Response(courses)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def record_attention(request):
    """Record attention score for a student in a class."""
    class_session_id = request.data.get('class_session_id')
    attention_score = request.data.get('attention_score')
    
    if not class_session_id or attention_score is None:
        return Response({'detail': 'class_session_id and attention_score required'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        class_session = ClassSession.objects.get(id=class_session_id)
    except ClassSession.DoesNotExist:
        return Response({'detail': 'Class session not found'}, status=status.HTTP_404_NOT_FOUND)
    
    # Determine attention level
    if attention_score >= 80:
        level = 'high'
    elif attention_score >= 50:
        level = 'medium'
    else:
        level = 'low'
    
    record = AttentionRecord.objects.create(
        student=request.user,
        class_session=class_session,
        attention_score=attention_score,
        attention_level=level
    )
    
    return Response(AttentionRecordSerializer(record).data, status=status.HTTP_201_CREATED)


# Teacher endpoints
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def teacher_students(request):
    """Get students in classes taught by authenticated teacher."""
    sessions = ClassSession.objects.filter(teacher=request.user)
    students_data = {}
    
    for session in sessions:
        enrollments = StudentCourse.objects.filter(course=session.course)
        for enrollment in enrollments:
            if enrollment.student.id not in students_data:
                # Get average attention for this student
                records = AttentionRecord.objects.filter(student=enrollment.student)
                avg_attention = 0
                if records.exists():
                    avg_attention = sum(r.attention_score for r in records) / len(records)
                
                students_data[enrollment.student.id] = {
                    'id': f"EST{str(enrollment.student.id).zfill(3)}",
                    'name': f"{enrollment.student.first_name} {enrollment.student.last_name}".strip() or enrollment.student.username,
                    'email': enrollment.student.email,
                    'averageAttention': round(avg_attention),
                    'lastClass': 'Hace 2 horas',
                    'status': 'high' if avg_attention >= 80 else ('medium' if avg_attention >= 50 else 'low'),
                    'sessionsAttended': len(records),
                    'totalSessions': len(sessions)
                }
    
    return Response(list(students_data.values()))


# Admin endpoints
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_users(request):
    """Get all users in the system (admin only)."""
    if not hasattr(request.user, 'profile') or request.user.profile.role != 'admin':
        return Response({'detail': 'Only admins can access this'}, status=status.HTTP_403_FORBIDDEN)
    
    users = User.objects.all()
    users_data = []
    for user in users:
        role = 'student'
        user_id = f"USR{str(user.id).zfill(3)}"
        if hasattr(user, 'profile'):
            role = user.profile.role
            user_id = user.profile.user_code
        
        users_data.append({
            'id': user_id,
            'name': f"{user.first_name} {user.last_name}".strip() or user.username,
            'email': user.email,
            'role': role.capitalize(),
            'status': 'active',
            'lastConnection': 'Hace 5 minutos',
            'registrationDate': str(user.date_joined.date())
        })
    
    return Response(users_data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_active_sessions(request):
    """Get active and upcoming class sessions."""
    if not hasattr(request.user, 'profile') or request.user.profile.role != 'admin':
        return Response({'detail': 'Only admins can access this'}, status=status.HTTP_403_FORBIDDEN)
    
    sessions = ClassSession.objects.filter(status__in=['active', 'upcoming']).order_by('-date')
    sessions_data = []
    
    for session in sessions:
        # Count enrolled students
        students_count = StudentCourse.objects.filter(course=session.course).count()
        
        # Get average attention
        records = AttentionRecord.objects.filter(class_session=session)
        avg_attention = 0
        if records.exists():
            avg_attention = sum(r.attention_score for r in records) / len(records)
        
        sessions_data.append({
            'id': session.id,
            'className': session.course.name,
            'teacher': f"{session.teacher.first_name} {session.teacher.last_name}".strip() or session.teacher.username,
            'studentsCount': students_count,
            'startTime': str(session.time),
            'averageAttention': round(avg_attention)
        })
    
    return Response(sessions_data)

