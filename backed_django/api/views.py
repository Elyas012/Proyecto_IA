import os
import json
import threading
import numpy as np
import tensorflow as tf
import joblib
from pypdf import PdfReader
import mimetypes
from rest_framework.permissions import AllowAny
from rest_framework.decorators import api_view, permission_classes


# Imports de Django y REST Framework
from django.conf import settings
from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.models import User
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.http import JsonResponse, FileResponse
from django.views.decorators.csrf import csrf_exempt
from django.db.models import Avg, Count
from django.db.models.functions import ExtractHour

from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import IsAuthenticated, BasePermission, AllowAny

# NUEVA LIBRERÍA DE GOOGLE
from google import genai
from google.genai import types

# Google OAuth
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

# Facebook OAuth
import requests

# Imports de tus modelos y serializadores locales
from .models import (
    Message, Course, ClassSession, StudentCourse, AttentionRecord, UserProfile, 
    CourseMaterial, PomodoroSession, PomodoroEvent, FeatureRecord, 
    Quiz, Question, StudentQuizAttempt
)
from .serializers import (
    MessageSerializer, CourseSerializer, ClassSessionSerializer, 
    StudentCourseSerializer, UserSerializer, AttentionRecordSerializer, 
    FeatureRecordSerializer, CourseMaterialSerializer
)

User = get_user_model()

# ==========================================
# CONFIGURACIÓN GLOBAL (MODELOS IA & VARIABLES)
# ==========================================

# ⚠️ PEGA TU API KEY AQUÍ O ÚSALA DESDE VARIABLES DE ENTORNO
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")

MODEL_PATH = os.path.join(settings.BASE_DIR, 'api', 'model_lstm_distractions_FIXED.h5')
SCALER_PATH = os.path.join(settings.BASE_DIR, 'api', 'scaler.pkl')

_model_lock = threading.Lock()
model = None
scaler = None

# EMA para suavizar (después de model/scaler)
_ema_lock = threading.Lock()
current_ema = 50.0  # Inicial 50%
alpha = 0.3  # Suavidad (0.1=lento, 0.5=rápido)

def update_ema(new_score):
    """Exponential Moving Average"""
    global current_ema
    with _ema_lock:
        current_ema = alpha * new_score + (1 - alpha) * current_ema
        return current_ema

def ensure_model_loaded():
    """Singleton thread-safe - RETORNA model directamente"""
    global model, scaler
    
    with _model_lock:
        if model is None:
            print("🚀 CARGANDO LSTM (THREAD-SAFE)...")
            try:
                custom_objects = {
                    'InputtLayer': tf.keras.layers.Input,
                    'InputLayer': tf.keras.layers.Input,
                    'Input': tf.keras.layers.Input,
                    'DTypePolicy': tf.keras.mixed_precision.Policy('float32'),
                }
                
                model = tf.keras.models.load_model(MODEL_PATH, custom_objects=custom_objects, compile=False)
                model.compile(optimizer='adam', loss='binary_crossentropy')
                
                from sklearn.preprocessing import StandardScaler
                scaler = StandardScaler()
                # Dummy fit para inicializar, idealmente cargar el scaler.pkl real si existe
                dummy_data = np.array([[0.28, 0.25]] * 30).reshape(-1, 2)
                scaler.fit(dummy_data)
                
                print("🎉 ✅ LSTM CARGADO GLOBAL!")
                
            except Exception as e:
                print(f"💥 ERROR CARGANDO LSTM: {e}")
                model = None
                scaler = None
        
        return model is not None

# ==========================================
# VISTAS DE PREDICCIÓN (LSTM)
# ==========================================

@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def predict_distractions(request):
    lstm_available = ensure_model_loaded()
    
    try:
        data = request.data
        features = [[0.28, 0.25]] if not data.get('features') else data['features'][:15]
        features_array = np.array(features)
        
        # 🆗 LSTM PRIMERO (si disponible)
        if ensure_model_loaded() and model is not None and scaler is not None:
            try:
                # Pad/Truncate
                if len(features_array) < 15:
                    padding = np.zeros((15 - len(features_array), 2))
                    features_array = np.vstack([features_array, padding])
                else:
                    features_array = features_array[:15]
                
                features_scaled = scaler.transform(features_array)
                features_reshaped = features_scaled.reshape(1, 15, 2)
                
                # 🆗 INVERSIÓN: Distracción → ATENCIÓN
                raw_score = model.predict(features_reshaped, verbose=0)[0][0]
                attention_score_raw = (1.0 - raw_score) * 100

                # 🆗 SUAVIZAR con EMA
                attention_score = update_ema(attention_score_raw)

                level = "low" if attention_score <= 30 else "medium" if attention_score <= 70 else "high"

                return JsonResponse({
                    'distraction_score': round(float(attention_score), 1),
                    'level': level,
                    'model_used': 'lstm_v1_ema'
                })
            except Exception as lstm_error:
                print(f"LSTM predict error: {lstm_error}")

        # ✅ FALLBACK (si LSTM falla)
        avg_ear = np.mean(features_array[:, 0])
        avg_mar = np.mean(features_array[:, 1])
        score = max(0, min(100, (avg_ear * 200 + (1 - avg_mar) * 100) / 2))
        level = "high" if score >= 70 else "medium" if score >= 45 else "low"
        
        return JsonResponse({
            'distraction_score': round(score, 1),
            'level': level,
            'model_used': 'ear_mar_fallback'
        })
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

# ==========================================
# AUTH VIEWS
# ==========================================

class MessageViewSet(viewsets.ModelViewSet):
    queryset = Message.objects.all()
    serializer_class = MessageSerializer

class LoginView(APIView):
    permission_classes = []

    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        if not email or not password:
            return Response({'detail': 'Email and password required'}, status=status.HTTP_400_BAD_REQUEST)

        user = authenticate(request, username=email, password=password)
        if user is None:
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

        username = email.split('@')[0]
        user = User.objects.create_user(username=username, email=email, password=password)
        if full_name:
            user.first_name = full_name
            user.save()

        role = 'student'
        if user_id.startswith('DOC'):
            role = 'teacher'
        elif user_id.startswith('ADM'):
            role = 'admin'

        UserProfile.objects.create(user=user, role=role, user_code=user_id)
        token, created = Token.objects.get_or_create(user=user)
        return Response({'token': token.key, 'user': {'id': user.id, 'username': user.username, 'email': user.email, 'role': role}}, status=status.HTTP_201_CREATED)

class GoogleAuthView(APIView):
    """
    Vista para manejar la autenticación con Google OAuth.
    Recibe el ID token de Google y valida/crea el usuario.
    """
    permission_classes = []

    def post(self, request):
        token = request.data.get('token')
        
        if not token:
            return Response({'detail': 'Token is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Verificar el token con Google
            idinfo = id_token.verify_oauth2_token(
                token, 
                google_requests.Request(), 
                settings.GOOGLE_OAUTH_CLIENT_ID
            )
            
            # Extraer información del usuario
            email = idinfo.get('email')
            name = idinfo.get('name', '')
            google_id = idinfo.get('sub')
            
            if not email:
                return Response({'detail': 'Email not provided by Google'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Buscar o crear usuario
            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'username': email.split('@')[0],
                    'first_name': name,
                }
            )
            
            # Si el usuario es nuevo, crear su perfil
            if created:
                UserProfile.objects.create(
                    user=user, 
                    role='student',  # Por defecto, todos los usuarios de Google son estudiantes
                    user_code=f'EST-{google_id[:8]}'  # Generar un código único
                )
            
            # Obtener o crear token de autenticación
            auth_token, _ = Token.objects.get_or_create(user=user)
            
            # Obtener rol del usuario
            role = 'student'
            try:
                if hasattr(user, 'profile'):
                    role = user.profile.role
            except:
                pass
            
            return Response({
                'token': auth_token.key,
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'role': role,
                    'name': user.first_name
                }
            }, status=status.HTTP_200_OK)
            
        except ValueError as e:
            # Token inválido
            return Response({'detail': f'Invalid token: {str(e)}'}, status=status.HTTP_401_UNAUTHORIZED)
        except Exception as e:
            return Response({'detail': f'Authentication failed: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class FacebookAuthView(APIView):
    """
    Vista para manejar la autenticación con Facebook OAuth.
    Recibe el access token de Facebook y valida/crea el usuario.
    """
    permission_classes = []

    def post(self, request):
        access_token = request.data.get('accessToken')
        
        if not access_token:
            return Response({'detail': 'Access token is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Verificar el token con Facebook Graph API
            debug_token_url = f'https://graph.facebook.com/debug_token'
            params = {
                'input_token': access_token,
                'access_token': f"{settings.FACEBOOK_APP_ID}|{settings.FACEBOOK_APP_SECRET}"
            }
            
            debug_response = requests.get(debug_token_url, params=params)
            debug_data = debug_response.json()
            
            if not debug_data.get('data', {}).get('is_valid'):
                return Response({'detail': 'Invalid Facebook token'}, status=status.HTTP_401_UNAUTHORIZED)
            
            # Obtener información del usuario de Facebook
            user_info_url = f'https://graph.facebook.com/me'
            params = {
                'fields': 'id,name,email',
                'access_token': access_token
            }
            
            user_response = requests.get(user_info_url, params=params)
            user_data = user_response.json()
            
            email = user_data.get('email')
            name = user_data.get('name', '')
            facebook_id = user_data.get('id')
            
            if not email:
                return Response({'detail': 'Email not provided by Facebook'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Buscar o crear usuario
            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'username': email.split('@')[0],
                    'first_name': name,
                }
            )
            
            # Si el usuario es nuevo, crear su perfil
            if created:
                UserProfile.objects.create(
                    user=user, 
                    role='student',  # Por defecto, todos los usuarios de Facebook son estudiantes
                    user_code=f'EST-FB-{facebook_id[:8]}'  # Generar un código único
                )
            
            # Obtener o crear token de autenticación
            auth_token, _ = Token.objects.get_or_create(user=user)
            
            # Obtener rol del usuario
            role = 'student'
            try:
                if hasattr(user, 'profile'):
                    role = user.profile.role
            except:
                pass
            
            return Response({
                'token': auth_token.key,
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'role': role,
                    'name': user.first_name
                }
            }, status=status.HTTP_200_OK)
            
        except requests.RequestException as e:
            return Response({'detail': f'Facebook API error: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except Exception as e:
            return Response({'detail': f'Authentication failed: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# ==========================================
# STUDENT VIEWS
# ==========================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def student_courses(request):
    enrollments = StudentCourse.objects.filter(student=request.user)
    courses = []
    for enrollment in enrollments:
        sessions = ClassSession.objects.filter(course=enrollment.course, status__in=['active', 'upcoming']).order_by('date', 'time')
        for session in sessions:
            courses.append({
                'id': session.id,
                'course_id': session.course.id,
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
    class_session_id = request.data.get('class_session_id')
    score = (request.data.get('distraction_score') or 
             request.data.get('attention_score') or 
             request.data.get('attention_score', 50))
    duration_seconds = request.data.get('duration_seconds')
    
    if not class_session_id or score is None:
        return Response({'detail': 'class_session_id and score required'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        class_session = ClassSession.objects.get(id=class_session_id)
    except ClassSession.DoesNotExist:
        return Response({'detail': 'Class session not found'}, status=status.HTTP_404_NOT_FOUND)
    
    if float(score) >= 80:
        level = 'high'
    elif float(score) >= 50:
        level = 'medium'
    else:
        level = 'low'
    
    record = AttentionRecord.objects.create(
        student=request.user,
        class_session=class_session,
        attention_score=float(score),
        attention_level=level,
        raw_features=request.data.get('raw_features')
    )
    
    try:
        if duration_seconds is not None:
            record.duration_seconds = int(duration_seconds)
            record.save()
    except Exception:
        pass
    
    return Response(AttentionRecordSerializer(record).data, status=status.HTTP_201_CREATED)

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

        # Update PomodoroSession status
        pomodoro_session, created = PomodoroSession.objects.get_or_create(
            student=request.user,
            class_session=cs,
            defaults={'status': 'idle', 'current_cycle_start_time': None}
        )

        return Response(FeatureRecordSerializer(fr).data, status=status.HTTP_201_CREATED)

    events = FeatureRecord.objects.filter(student=request.user).order_by('-timestamp')[:200]
    serializer = FeatureRecordSerializer(events, many=True)
    return Response(serializer.data)

# ==========================================
# TEACHER VIEWS
# ==========================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def teacher_students(request):
    sessions = ClassSession.objects.filter(teacher=request.user)
    students_data = {}
    
    for session in sessions:
        enrollments = StudentCourse.objects.filter(course=session.course)
        for enrollment in enrollments:
            if enrollment.student.id not in students_data:
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
    sessions = ClassSession.objects.filter(teacher=request.user)
    total_classes = sessions.count()

    student_ids = set()
    for session in sessions:
        enrollments = StudentCourse.objects.filter(course=session.course)
        for enrollment in enrollments:
            student_ids.add(enrollment.student.id)

    total_students = len(student_ids)

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

# ==========================================
# POMODORO VIEWS
# ==========================================

@api_view(['POST', 'GET'])
@permission_classes([IsAuthenticated])
def pomodoro_events(request):
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
        
        ev = PomodoroEvent.objects.create(
            student=request.user,
            class_session=cs,
            event_type=event_type,
            reason=reason
        )

        pomodoro_session, created = PomodoroSession.objects.get_or_create(
            student=request.user,
            class_session=cs,
            defaults={'status': 'idle'}
        )

        if event_type == 'start':
            pomodoro_session.status = 'working'
            if pomodoro_session.work_elapsed_time_on_pause:
                pomodoro_session.current_cycle_start_time = timezone.now() - pomodoro_session.work_elapsed_time_on_pause
                pomodoro_session.work_elapsed_time_on_pause = None
            else:
                pomodoro_session.current_cycle_start_time = timezone.now()
        elif event_type == 'auto_pause' or event_type == 'manual_pause':
            if pomodoro_session.status == 'working' and pomodoro_session.current_cycle_start_time:
                elapsed_work_time = timezone.now() - pomodoro_session.current_cycle_start_time
                pomodoro_session.work_elapsed_time_on_pause = elapsed_work_time
                pomodoro_session.current_cycle_number += 1

            pomodoro_session.status = 'paused'
            pomodoro_session.current_cycle_start_time = timezone.now()
            pomodoro_session.last_distraction_time = None 
        elif event_type == 'end':
            pomodoro_session.status = 'idle'
            pomodoro_session.current_cycle_start_time = None
            pomodoro_session.work_elapsed_time_on_pause = None
        
        pomodoro_session.save()
        return Response({'id': ev.id, 'event_type': ev.event_type, 'timestamp': ev.timestamp}, status=status.HTTP_201_CREATED)

    events = PomodoroEvent.objects.filter(student=request.user).order_by('-timestamp')[:50]
    serializer = __import__('api.serializers', fromlist=['PomodoroEventSerializer']).PomodoroEventSerializer(events, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def pomodoro_status(request):
    class_session_id = request.query_params.get('class_session_id')
    if not class_session_id:
        return Response({'detail': 'class_session_id required'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        cs = ClassSession.objects.get(id=class_session_id)
    except ClassSession.DoesNotExist:
        return Response({'detail': 'Class session not found'}, status=status.HTTP_404_NOT_FOUND)

    pomodoro_session, created = PomodoroSession.objects.get_or_create(
        student=request.user,
        class_session=cs,
        defaults={'status': 'idle', 'current_cycle_start_time': None}
    )

    return Response({
        'status': pomodoro_session.status,
        'time_remaining_in_current_phase': pomodoro_session.time_remaining_in_current_phase,
        'is_distracted_during_pause': pomodoro_session.is_distracted_during_pause,
        'work_duration_minutes': pomodoro_session.work_duration_minutes,
        'pause_duration_minutes': pomodoro_session.pause_duration_minutes,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def pomodoro_metrics(request):
    total_events = PomodoroEvent.objects.filter(student=request.user).count()
    auto_pauses = PomodoroEvent.objects.filter(student=request.user, event_type='auto_pause').count()
    records = AttentionRecord.objects.filter(student=request.user)
    total_effective = sum(r.duration_seconds for r in records)
    return Response({'total_events': total_events, 'auto_pauses': auto_pauses, 'effective_seconds': total_effective})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def student_report(request):
    period = request.GET.get('period', 'month')
    subject = request.GET.get('subject')

    records = AttentionRecord.objects.filter(student=request.user)

    days = 30
    if period == 'week':
        days = 7
    elif period == 'semester':
        days = 120
    cutoff = timezone.now() - timezone.timedelta(days=days)
    records = records.filter(timestamp__gte=cutoff)

    if subject:
        try:
            course_id = int(subject)
            records = records.filter(class_session__course__id=course_id)
        except Exception:
            records = records.filter(class_session__course__code__icontains=subject)

    avg_att = int(records.aggregate(a=Avg('attention_score'))['a'] or 0)
    total_sessions = records.count()
    total_minutes = int(sum(r.duration_seconds for r in records) / 60)

    timeline_qs = records.order_by('-timestamp')[:50]
    timeline = [
        { 'timestamp': r.timestamp.isoformat(), 'attention': r.attention_score }
        for r in reversed(timeline_qs)
    ]

    by_hour_qs = records.annotate(hour=ExtractHour('timestamp')).values('hour').annotate(att=Avg('attention_score')).order_by('hour')
    by_hour = [{ 'hour': int(item['hour'] or 0), 'attention': int(item['att'] or 0) } for item in by_hour_qs]

    class_comp = []
    enrolled = StudentCourse.objects.filter(student=request.user)
    for sc in enrolled:
        course = sc.course
        student_avg = records.filter(class_session__course=course).aggregate(a=Avg('attention_score'))['a'] or 0
        class_avg = AttentionRecord.objects.filter(class_session__course=course).aggregate(a=Avg('attention_score'))['a'] or 0
        class_comp.append({ 'course': course.code, 'course_name': course.name, 'student_avg': int(student_avg), 'class_avg': int(class_avg) })

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

# ==========================================
# ADMIN VIEWS
# ==========================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_users(request):
    if not hasattr(request.user, 'profile') or request.user.profile.role != 'admin':
        return Response({'detail': 'Only admins can access this'}, status=status.HTTP_403_FORBIDDEN)
    
    users = User.objects.all()
    users_data = []
    for user in users:
        role = 'student'
        user_code = f"USR{str(user.id).zfill(3)}"
        if hasattr(user, 'profile'):
            role = user.profile.role
            user_code = user.profile.user_code
        
        users_data.append({
            'id': user.id,
            'userCode': user_code,
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
    if not hasattr(request.user, 'profile') or request.user.profile.role != 'admin':
        return Response({'detail': 'Only admins can access this'}, status=status.HTTP_403_FORBIDDEN)
    
    sessions = ClassSession.objects.filter(status__in=['active', 'upcoming']).order_by('-date')
    sessions_data = []
    
    for session in sessions:
        students_count = StudentCourse.objects.filter(course=session.course).count()
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
    if not hasattr(request.user, 'profile') or request.user.profile.role != 'admin':
        return Response({'detail': 'Only admins can access this'}, status=status.HTTP_403_FORBIDDEN)

    if request.method == 'GET':
        courses = Course.objects.all().order_by('code')
        return Response(CourseSerializer(courses, many=True).data)

    serializer = CourseSerializer(data=request.data)
    if serializer.is_valid():
        course = serializer.save()
        return Response(CourseSerializer(course).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def teacher_class_sessions(request):
    if not hasattr(request.user, 'profile') or request.user.profile.role != 'teacher':
        return Response({'detail': 'Only teachers can access this'}, status=status.HTTP_403_FORBIDDEN)

    if request.method == 'GET':
        sessions = ClassSession.objects.filter(teacher=request.user).order_by('-date', '-time')
        return Response(ClassSessionSerializer(sessions, many=True).data)

    data = request.data.copy()
    data['teacher_id'] = request.user.id
    serializer = ClassSessionSerializer(data=data)
    if serializer.is_valid():
        session = serializer.save()
        return Response(ClassSessionSerializer(session).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def teacher_student_courses(request):
    if not hasattr(request.user, 'profile') or request.user.profile.role != 'teacher':
        return Response({'detail': 'Only teachers can access this'}, status=status.HTTP_403_FORBIDDEN)

    if request.method == 'GET':
        course_id = request.query_params.get('course_id')
        if not course_id:
            return Response({'detail': 'course_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        enrollments = StudentCourse.objects.filter(course_id=course_id).select_related('student', 'course')
        return Response(StudentCourseSerializer(enrollments, many=True).data)

    student_id = request.data.get('student_id')
    course_id = request.data.get('course_id')
    if not student_id or not course_id:
        return Response({'detail': 'student_id and course_id are required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        student = User.objects.get(id=student_id)
        course = Course.objects.get(id=course_id)
    except (User.DoesNotExist, Course.DoesNotExist):
        return Response({'detail': 'Student or course not found'}, status=status.HTTP_404_NOT_FOUND)

    enrollment, created = StudentCourse.objects.get_or_create(student=student, course=course)
    return Response(
        StudentCourseSerializer(enrollment).data,
        status=status.HTTP_201_CREATED if created else status.HTTP_200_OK
    )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_assign_teacher(request):
    if not hasattr(request.user, 'profile') or request.user.profile.role != 'admin':
        return Response({'detail': 'Only admins can access this'}, status=status.HTTP_403_FORBIDDEN)

    course_id = request.data.get('course_id')
    teacher_id = request.data.get('teacher_id')

    if not course_id or not teacher_id:
        return Response({'detail': 'course_id and teacher_id are required'}, status=status.HTTP_400_BAD_REQUEST)

    course = get_object_or_404(Course, id=course_id)
    teacher = get_object_or_404(User, id=teacher_id)
    if not hasattr(teacher, 'profile') or teacher.profile.role != 'teacher':
        return Response({'detail': 'Selected user is not a teacher'}, status=status.HTTP_400_BAD_REQUEST)

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
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and hasattr(request.user, 'profile') and request.user.profile.role == 'teacher'

class CourseMaterialViewSet(viewsets.ModelViewSet):
    queryset = CourseMaterial.objects.all().order_by('-uploaded_at')
    serializer_class = CourseMaterialSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            self.permission_classes = [IsAuthenticated, IsTeacher]
        else:
            self.permission_classes = [IsAuthenticated]
        return super().get_permissions()

    @action(detail=False, methods=['get'], url_path='by-course/(?P<course_id>[^/.]+)')
    def by_course(self, request, course_id=None):
        is_enrolled = StudentCourse.objects.filter(student=request.user, course_id=course_id).exists()
        is_teacher = ClassSession.objects.filter(teacher=request.user, course_id=course_id).exists()

        if not (is_enrolled or is_teacher or (hasattr(request.user, 'profile') and request.user.profile.role == 'admin')):
            return Response({'detail': 'No está autorizado para ver los materiales de este curso.'}, status=status.HTTP_403_FORBIDDEN)
        
        materials = self.get_queryset().filter(course_id=course_id)
        serializer = self.get_serializer(materials, many=True)
        return Response(serializer.data)

# ==========================================
# MEDIA FILE SERVING (PRODUCTION-SAFE)
# ==========================================

@api_view(['GET'])
@permission_classes([AllowAny])
def download_course_material(request, material_id):
    """
    Descarga pública controlada de materiales del curso.
    Compatible con iframe / react-pdf en producción.
    """
    material = get_object_or_404(CourseMaterial, id=material_id, is_active=True)

    # Verificar que el campo file no esté vacío
    if not material.file:
        return Response(
            {'detail': 'Este material no tiene un archivo asociado.'},
            status=status.HTTP_404_NOT_FOUND
        )

    try:
        # Usar material.file.path que ya incluye MEDIA_ROOT
        file_path = material.file.path
        
        # Verificar que el archivo existe físicamente
        if not os.path.exists(file_path):
            return Response(
                {
                    'detail': 'El archivo no se encontró en el servidor.',
                    'file_path_expected': file_path,
                    'file_field': str(material.file),
                    'help': 'El archivo puede haberse eliminado o no se subió correctamente.'
                },
                status=status.HTTP_404_NOT_FOUND
            )

        # Abrir y servir el archivo
        file_obj = open(file_path, 'rb')
        mime_type, _ = mimetypes.guess_type(file_path)
        mime_type = mime_type or 'application/pdf'

        response = FileResponse(file_obj, content_type=mime_type)
        response['Content-Disposition'] = f'inline; filename="{os.path.basename(file_path)}"'
        return response

    except Exception as e:
        return Response(
            {
                'detail': f'Error al servir el archivo: {str(e)}',
                'error_type': type(e).__name__
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


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

# ==========================================
# QUIZ & AI GEN (CORREGIDO PARA NUEVA LIBRERIA)
# ==========================================

@api_view(['POST'])
@permission_classes([IsAuthenticated, IsTeacher])
def generate_quiz_ai(request):
    """
    Genera un Quiz de 10 preguntas basado en un material subido.
    Utiliza google-genai v1.0+
    """
    material_id = request.data.get('material_id')
    
    try:
        material = CourseMaterial.objects.get(id=material_id)
    except CourseMaterial.DoesNotExist:
        return Response({'detail': f'Material con ID {material_id} no encontrado'}, status=status.HTTP_404_NOT_FOUND)
    
    # Validar que el usuario sea profesor del curso
    if not ClassSession.objects.filter(teacher=request.user, course=material.course).exists():
        return Response({'detail': 'No tienes permisos para generar un quiz para este material'}, status=status.HTTP_403_FORBIDDEN)
    
    # 1. Extraer texto del archivo
    text_content = ""
    try:
        # Validar que el archivo existe
        if not material.file or not os.path.exists(material.file.path):
            return Response({
                'detail': f'El archivo del material no existe en el servidor: {material.file.name if material.file else "Sin archivo"}'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if material.file.name.lower().endswith('.pdf'):
            reader = PdfReader(material.file.path)
            for page in reader.pages[:5]: 
                text_content += page.extract_text() or ""
        else:
            with open(material.file.path, 'r', encoding='utf-8', errors='ignore') as f:
                text_content = f.read()
    except FileNotFoundError as e:
        return Response({'detail': f'Archivo no encontrado: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({'detail': f'Error leyendo archivo: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)

    if len(text_content) < 50:
        return Response({'detail': 'El archivo contiene muy poco texto para generar un examen.'}, status=status.HTTP_400_BAD_REQUEST)

    # 2. Configurar y Llamar a Gemini (SDK NUEVO)
    try:
        if not GEMINI_API_KEY:
            return Response({'detail': 'API Key de Gemini no configurada'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        client = genai.Client(api_key=GEMINI_API_KEY)
        
        prompt = f"""
        Eres un profesor experto. Basado en el siguiente texto educativo, genera un examen de 10 preguntas de selección múltiple.
        El formato de salida DEBE ser estrictamente un JSON válido (sin markdown) con esta estructura:
        [
          {{
            "question": "¿Enunciado de la pregunta?",
            "options": ["Opción A", "Opción B", "Opción C", "Opción D"],
            "correct_index": 0,
            "explanation": "Breve explicación de por qué es correcta"
          }}
        ]
        
        Texto del material:
        {text_content[:10000]} 
        """ 

        response = client.models.generate_content(
            model='gemini-2.5-flash-lite',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json"
            )
        )
        
        # Al usar response_mime_type="application/json", response.text ya es JSON limpio
        quiz_data = json.loads(response.text)
        
        # 3. Guardar en Base de Datos
        Quiz.objects.filter(course_material=material).delete()
        
        quiz = Quiz.objects.create(
            course_material=material,
            title=f"Evaluación: {material.title}"
        )
        
        for q in quiz_data:
            Question.objects.create(
                quiz=quiz,
                text=q['question'],
                options=q['options'],
                correct_answer=q['correct_index'],
                explanation=q.get('explanation', '')
            )
            
        return Response({'detail': 'Quiz generado exitosamente', 'quiz_id': quiz.id}, status=status.HTTP_201_CREATED)
        
    except json.JSONDecodeError as e:
        return Response({'detail': f'Error al parsear respuesta de IA (JSON inválido): {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    except KeyError as e:
        return Response({'detail': f'Respuesta de IA con estructura inesperada, falta el campo: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"Error generando quiz: {error_trace}")
        return Response({'detail': f'Error generando quiz con IA: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_quiz(request, material_id):
    material = get_object_or_404(CourseMaterial, id=material_id)
    try:
        quiz = material.generated_quiz
    except Quiz.DoesNotExist:
        return Response({'detail': 'No hay evaluación disponible para este material'}, status=404)
        
    questions = quiz.questions.all()
    data = {
        'quiz_id': quiz.id,
        'title': quiz.title,
        'questions': [
            {
                'id': q.id,
                'text': q.text,
                'options': q.options
            } for q in questions
        ]
    }
    return Response(data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_quiz(request):
    quiz_id = request.data.get('quiz_id')
    answers = request.data.get('answers')
    
    quiz = get_object_or_404(Quiz, id=quiz_id)
    questions = quiz.questions.all()
    
    score_count = 0
    mistakes = []
    
    for question in questions:
        user_answer = answers.get(str(question.id))
        if user_answer is not None and int(user_answer) == question.correct_answer:
            score_count += 1
        else:
            correct_opt = question.options[question.correct_answer] if question.correct_answer < len(question.options) else "Desconocida"
            mistakes.append(f"- Tema: {question.text}. Correcta: {correct_opt}")
            
    final_score = (score_count / len(questions)) * 10
    
    # 4. Generar Feedback con Gemini (SDK NUEVO)
    feedback = "¡Excelente trabajo! Has dominado el tema."
    if mistakes:
        try:
            client = genai.Client(api_key=GEMINI_API_KEY)
            
            error_context = "\n".join(mistakes[:5])
            prompt = f"""
            Un estudiante sacó {final_score}/10 en una prueba.
            Se equivocó en:
            {error_context}
            
            Dame una recomendación corta (max 3 líneas), motivadora y directa para que mejore en esos temas específicos. Háblale de "tú".
            """
            
            resp = client.models.generate_content(
                model='gemini-2.5-flash-lite',
                contents=prompt
            )
            feedback = resp.text
        except Exception as e:
            print(f"Error feedback IA: {e}")
            feedback = "Revisa los temas en los que fallaste para reforzar tu aprendizaje."

    StudentQuizAttempt.objects.create(
        student=request.user,
        quiz=quiz,
        score=final_score,
        feedback=feedback
    )
    
    return Response({
        'score': final_score,
        'feedback': feedback,
        'passed': final_score >= 7
    })