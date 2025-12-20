from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import authenticate, get_user_model
from django.utils import timezone
from .models import Message, Course, ClassSession, StudentCourse, AttentionRecord, UserProfile, CourseMaterial
from .serializers import (MessageSerializer, CourseSerializer, ClassSessionSerializer, 
                         StudentCourseSerializer, UserSerializer, AttentionRecordSerializer, FeatureRecordSerializer,
                         CourseMaterialSerializer)
from .models import FeatureRecord
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from .models import Course, ClassSession, StudentCourse, UserProfile
from .serializers import CourseSerializer, ClassSessionSerializer, StudentCourseSerializer, UserSerializer
from django.contrib.auth.models import User
from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, BasePermission
from rest_framework import status
from django.contrib.auth.models import User
from .models import Course, ClassSession, UserProfile
from .serializers import ClassSessionSerializer
from .models import StudentCourse
from .serializers import StudentCourseSerializer



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


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_user(request):
    """Return basic profile info for the authenticated user."""
    user = request.user
    role = 'student'
    user_code = ''
    try:
        if hasattr(user, 'profile'):
            role = user.profile.role
            user_code = user.profile.user_code
    except Exception:
        pass

    return Response({
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'role': role,
        'user_code': user_code,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def record_attention(request):
    """Record attention score for a student in a class."""
    class_session_id = request.data.get('class_session_id')
    attention_score = request.data.get('attention_score')
    duration_seconds = request.data.get('duration_seconds')
    
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
    # Optional: record effective focused duration in seconds
    try:
        if duration_seconds is not None:
            record.duration_seconds = int(duration_seconds)
            record.save()
    except Exception:
        pass
    
    return Response(AttentionRecordSerializer(record).data, status=status.HTTP_201_CREATED)


# Feature recording endpoint
@api_view(['POST', 'GET'])
@permission_classes([IsAuthenticated])
def feature_records(request):
    if request.method == 'POST':
        class_session_id = request.data.get('class_session_id')
        features = request.data.get('features')
        if not class_session_id or features is None:
            return Response({'detail': 'class_session_id and features required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            cs = ClassSession.objects.get(id=class_session_id)
        except ClassSession.DoesNotExist:
            return Response({'detail': 'Class session not found'}, status=status.HTTP_404_NOT_FOUND)
        fr = FeatureRecord.objects.create(student=request.user, class_session=cs, features=features)
        return Response(FeatureRecordSerializer(fr).data, status=status.HTTP_201_CREATED)

    # GET recent features
    events = FeatureRecord.objects.filter(student=request.user).order_by('-timestamp')[:200]
    serializer = FeatureRecordSerializer(events, many=True)
    return Response(serializer.data)


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


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def teacher_overview(request):
    """Return overview stats for the authenticated teacher (students, classes, avg attention)."""
    sessions = ClassSession.objects.filter(teacher=request.user)
    total_classes = sessions.count()

    # Collect unique students across all courses taught by this teacher
    student_ids = set()
    for session in sessions:
        enrollments = StudentCourse.objects.filter(course=session.course)
        for enrollment in enrollments:
            student_ids.add(enrollment.student.id)

    total_students = len(student_ids)

    # Calculate average attention across students
    total_attention = 0
    total_records = 0
    for sid in student_ids:
        records = AttentionRecord.objects.filter(student_id=sid)
        for r in records:
            total_attention += r.attention_score
            total_records += 1

    average_attention = round((total_attention / total_records) if total_records > 0 else 0)

    return Response({
        'teacher': {
            'id': request.user.id,
            'name': f"{request.user.first_name} {request.user.last_name}".strip() or request.user.username,
            'email': request.user.email,
        },
        'total_students': total_students,
        'total_classes': total_classes,
        'average_attention': average_attention
    })


# Pomodoro events
@api_view(['POST', 'GET'])
@permission_classes([IsAuthenticated])
def pomodoro_events(request):
    """Create or fetch pomodoro events for the authenticated student."""
    if request.method == 'POST':
        class_session_id = request.data.get('class_session_id')
        event_type = request.data.get('event_type')
        reason = request.data.get('reason', '')
        if not class_session_id or not event_type:
            return Response({'detail': 'class_session_id and event_type required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            cs = ClassSession.objects.get(id=class_session_id)
        except ClassSession.DoesNotExist:
            return Response({'detail': 'Class session not found'}, status=status.HTTP_404_NOT_FOUND)
        ev = __import__('api.models', fromlist=['PomodoroEvent']).PomodoroEvent.objects.create(
            student=request.user,
            class_session=cs,
            event_type=event_type,
            reason=reason
        )
        return Response({'id': ev.id, 'event_type': ev.event_type, 'timestamp': ev.timestamp}, status=status.HTTP_201_CREATED)

    # GET: return recent events for student
    events = __import__('api.models', fromlist=['PomodoroEvent']).PomodoroEvent.objects.filter(student=request.user).order_by('-timestamp')[:50]
    serializer = __import__('api.serializers', fromlist=['PomodoroEventSerializer']).PomodoroEventSerializer(events, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def pomodoro_metrics(request):
    """Return aggregated pomodoro metrics for the authenticated student."""
    from django.db.models import Count
    PomodoroEvent = __import__('api.models', fromlist=['PomodoroEvent']).PomodoroEvent
    total_events = PomodoroEvent.objects.filter(student=request.user).count()
    auto_pauses = PomodoroEvent.objects.filter(student=request.user, event_type='auto_pause').count()
    # effective study time from AttentionRecord
    from .models import AttentionRecord
    records = AttentionRecord.objects.filter(student=request.user)
    total_effective = sum(r.duration_seconds for r in records)
    return Response({'total_events': total_events, 'auto_pauses': auto_pauses, 'effective_seconds': total_effective})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def student_report(request):
    """Return an aggregated report for the authenticated student.

    Response JSON structure:
    {
      "summary": { "average_attention": 78, "total_sessions": 10, "total_minutes": 600 },
      "timeline": [{"timestamp": "2025-12-01T10:00:00Z","attention": 78}, ...],
      "by_hour": [{"hour": 10, "attention": 82}, ...],
      "class_comparison": [{"course": "ALG101","student_avg": 78, "class_avg": 71}],
      "pomodoro_metrics": { ... }
    }
    """
    from django.db.models import Avg, Count
    from .models import AttentionRecord, FeatureRecord, StudentCourse, ClassSession
    from datetime import timedelta

    # Optional filters from query params
    period = request.GET.get('period', 'month')
    subject = request.GET.get('subject')

    records = AttentionRecord.objects.filter(student=request.user)

    # apply period filter
    days = 30
    if period == 'week':
        days = 7
    elif period == 'semester':
        days = 120
    cutoff = timezone.now() - timedelta(days=days)
    records = records.filter(timestamp__gte=cutoff)

    # apply subject filter if provided (accept course id or code)
    if subject:
        try:
            # if numeric, treat as course id
            course_id = int(subject)
            records = records.filter(class_session__course__id=course_id)
        except Exception:
            records = records.filter(class_session__course__code__icontains=subject)

    # Summary
    avg_att = int(records.aggregate(a=Avg('attention_score'))['a'] or 0)
    total_sessions = records.count()
    total_minutes = int(sum(r.duration_seconds for r in records) / 60)

    # Timeline (last 50)
    timeline_qs = records.order_by('-timestamp')[:50]
    timeline = [
        { 'timestamp': r.timestamp.isoformat(), 'attention': r.attention_score }
        for r in reversed(timeline_qs)
    ]

    # Attention by hour (DB-agnostic using ExtractHour)
    from django.db.models.functions import ExtractHour
    by_hour_qs = records.annotate(hour=ExtractHour('timestamp')).values('hour').annotate(att=Avg('attention_score')).order_by('hour')
    by_hour = [{ 'hour': int(item['hour'] or 0), 'attention': int(item['att'] or 0) } for item in by_hour_qs]

    # Class comparison: for each enrolled course compute student avg and class avg
    class_comp = []
    enrolled = StudentCourse.objects.filter(student=request.user)
    for sc in enrolled:
        course = sc.course
        # student avg for this course
        student_avg = records.filter(class_session__course=course).aggregate(a=Avg('attention_score'))['a'] or 0
        # class avg across students
        class_avg = AttentionRecord.objects.filter(class_session__course=course).aggregate(a=Avg('attention_score'))['a'] or 0
        class_comp.append({ 'course': course.code, 'course_name': course.name, 'student_avg': int(student_avg), 'class_avg': int(class_avg) })

    # Pomodoro metrics (reuse existing logic)
    from .models import PomodoroEvent
    total_events = PomodoroEvent.objects.filter(student=request.user).count()
    auto_pauses = PomodoroEvent.objects.filter(student=request.user, event_type='auto_pause').count()
    pomodoro_metrics_data = { 'total_events': total_events, 'auto_pauses': auto_pauses, 'effective_minutes': total_minutes }

    return Response({
        'summary': { 'average_attention': avg_att, 'total_sessions': total_sessions, 'total_minutes': total_minutes, 'period': period },
        'timeline': timeline,
        'by_hour': by_hour,
        'class_comparison': class_comp,
        'pomodoro_metrics': pomodoro_metrics_data
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_users(request):
    """Get all users in the system (admin only)."""
    if not hasattr(request.user, 'profile') or request.user.profile.role != 'admin':
        return Response({'detail': 'Only admins can access this'}, status=status.HTTP_403_FORBIDDEN)
    
    users = User.objects.all()
    users_data = []
    for user in users:
        # valores reales de BD
        role = 'student'
        user_code = f"USR{str(user.id).zfill(3)}"
        if hasattr(user, 'profile'):
            role = user.profile.role
            user_code = user.profile.user_code  # EST001, DOC001, ADM002
        
        users_data.append({
            'id': user.id,                      # id numérico de auth_user
            'userCode': user_code,              # código amigable
            'name': f"{user.first_name} {user.last_name}".strip() or user.username,
            'email': user.email,
            'role': role.capitalize(),          # "Student", "Teacher", "Admin"
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

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def admin_courses(request):
    """Listar y crear cursos (solo admin)."""
    if not hasattr(request.user, 'profile') or request.user.profile.role != 'admin':
        return Response({'detail': 'Only admins can access this'}, status=status.HTTP_403_FORBIDDEN)

    if request.method == 'GET':
        courses = Course.objects.all().order_by('code')
        return Response(CourseSerializer(courses, many=True).data)

    # POST - crear curso
    serializer = CourseSerializer(data=request.data)
    if serializer.is_valid():
        course = serializer.save()
        return Response(CourseSerializer(course).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def teacher_class_sessions(request):
    """Sesiones de clase creadas por el docente autenticado."""
    # Solo docentes
    if not hasattr(request.user, 'profile') or request.user.profile.role != 'teacher':
        return Response({'detail': 'Only teachers can access this'}, status=status.HTTP_403_FORBIDDEN)

    if request.method == 'GET':
        sessions = ClassSession.objects.filter(teacher=request.user).order_by('-date', '-time')
        return Response(ClassSessionSerializer(sessions, many=True).data)

    # POST - crear sesión nueva
    data = request.data.copy()
    data['teacher_id'] = request.user.id  # se fuerza al docente actual
    serializer = ClassSessionSerializer(data=data)
    if serializer.is_valid():
        session = serializer.save()
        return Response(ClassSessionSerializer(session).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def teacher_student_courses(request):
    """Asignar estudiantes a cursos y listar matriculados (solo docentes)."""
    if not hasattr(request.user, 'profile') or request.user.profile.role != 'teacher':
        return Response({'detail': 'Only teachers can access this'}, status=status.HTTP_403_FORBIDDEN)

    if request.method == 'GET':
        course_id = request.query_params.get('course_id')
        if not course_id:
            return Response({'detail': 'course_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        enrollments = StudentCourse.objects.filter(course_id=course_id).select_related('student', 'course')
        return Response(StudentCourseSerializer(enrollments, many=True).data)

    # POST - matricular estudiante
    student_id = request.data.get('student_id')
    course_id = request.data.get('course_id')
    if not student_id or not course_id:
        return Response({'detail': 'student_id and course_id are required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        student = User.objects.get(id=student_id)
        course = Course.objects.get(id=course_id)
    except (User.DoesNotExist, Course.DoesNotExist):
        return Response({'detail': 'Student or course not found'}, status=status.HTTP_404_NOT_FOUND)

    # crear o recuperar matrícula
    enrollment, created = StudentCourse.objects.get_or_create(student=student, course=course)
    return Response(
        StudentCourseSerializer(enrollment).data,
        status=status.HTTP_201_CREATED if created else status.HTTP_200_OK
    )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_assign_teacher(request):
    # Solo admins
    if not hasattr(request.user, 'profile') or request.user.profile.role != 'admin':
        return Response({'detail': 'Only admins can access this'}, status=status.HTTP_403_FORBIDDEN)

    course_id = request.data.get('course_id')
    teacher_id = request.data.get('teacher_id')

    if not course_id or not teacher_id:
        return Response({'detail': 'course_id and teacher_id are required'}, status=status.HTTP_400_BAD_REQUEST)

    course = get_object_or_404(Course, id=course_id)
    teacher = get_object_or_404(User, id=teacher_id)
    # Verificamos que su perfil sea docente
    if not hasattr(teacher, 'profile') or teacher.profile.role != 'teacher':
        return Response({'detail': 'Selected user is not a teacher'}, status=status.HTTP_400_BAD_REQUEST)

    # Crea una sesión “base” o la próxima sesión programada
    session = ClassSession.objects.create(
        course=course,
        teacher=teacher,
        title=f"Sesión inicial - {course.code}",
        date=timezone.now().date(),
        time=timezone.now().time(),
        duration_minutes=60,
        status="upcoming",
    )

    return Response(ClassSessionSerializer(session).data, status=status.HTTP_201_CREATED)

class IsTeacher(BasePermission):
    """
    Permiso personalizado para permitir solo a los usuarios con rol 'docente'.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and hasattr(request.user, 'profile') and request.user.profile.role == 'teacher'

class CourseMaterialViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar los materiales de un curso.
    Los docentes pueden crear, actualizar y eliminar.
    Los estudiantes solo pueden leer.
    """
    queryset = CourseMaterial.objects.all().order_by('-uploaded_at')
    serializer_class = CourseMaterialSerializer

    def get_permissions(self):
        """
        Permisos instanciados para una acción específica.
        """
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            self.permission_classes = [IsAuthenticated, IsTeacher]
        else: # list, retrieve, by_course
            self.permission_classes = [IsAuthenticated]
        return super().get_permissions()

    @action(detail=False, methods=['get'], url_path='by-course/(?P<course_id>[^/.]+)')
    def by_course(self, request, course_id=None):
        """
        Obtiene todos los materiales para un curso específico.
        """
        # El estudiante debe estar inscrito en el curso para ver los materiales
        is_enrolled = StudentCourse.objects.filter(student=request.user, course_id=course_id).exists()
        is_teacher = ClassSession.objects.filter(teacher=request.user, course_id=course_id).exists()

        if not (is_enrolled or is_teacher or (hasattr(request.user, 'profile') and request.user.profile.role == 'admin')):
            return Response({'detail': 'No está autorizado para ver los materiales de este curso.'}, status=status.HTTP_403_FORBIDDEN)
        
        materials = self.get_queryset().filter(course_id=course_id)
        serializer = self.get_serializer(materials, many=True)
        return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_enroll_student(request):
    if not hasattr(request.user, 'profile') or request.user.profile.role != 'admin':
        return Response({'detail': 'Only admins can access this'}, status=status.HTTP_403_FORBIDDEN)

    student_id = request.data.get('student_id')
    course_id = request.data.get('course_id')

    if not student_id or not course_id:
        return Response({'detail': 'student_id and course_id are required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        student = User.objects.get(id=student_id)
        course = Course.objects.get(id=course_id)
    except (User.DoesNotExist, Course.DoesNotExist):
        return Response({'detail': 'Student or course not found'}, status=status.HTTP_404_NOT_FOUND)

    # Opcional: asegurar que el usuario es estudiante
    if not hasattr(student, 'profile') or student.profile.role != 'student':
        return Response({'detail': 'Selected user is not a student'}, status=status.HTTP_400_BAD_REQUEST)

    enrollment, created = StudentCourse.objects.get_or_create(
        student=student,
        course=course,
    )

    return Response(
        StudentCourseSerializer(enrollment).data,
        status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
    )

