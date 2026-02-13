from rest_framework.routers import DefaultRouter
from django.urls import path
from .views import (MessageViewSet, LoginView, RegisterView, GoogleAuthView, FacebookAuthView, student_courses, 
                    record_attention, teacher_students, teacher_overview, admin_users, 
                    admin_active_sessions, pomodoro_events, pomodoro_metrics, 
                    feature_records, current_user, CourseMaterialViewSet, predict_distractions,
                    download_course_material)
from . import views

router = DefaultRouter()
router.register(r'messages', MessageViewSet, basename='message')
router.register(r'course-materials', CourseMaterialViewSet, basename='coursematerial')

urlpatterns = router.urls + [
    # Auth
    path('auth/login/', LoginView.as_view(), name='api-login'),
    path('auth/register/', RegisterView.as_view(), name='api-register'),
    path('auth/google/', GoogleAuthView.as_view(), name='api-google-auth'),
    path('auth/facebook/', FacebookAuthView.as_view(), name='api-facebook-auth'),
    path('auth/me/', current_user, name='api-me'),
    
    # Student
    path('student/courses/', student_courses, name='student-courses'),
    path('student/record-attention/', record_attention, name='record-attention'),
    path('student/pomodoro-events/', pomodoro_events, name='pomodoro-events'),
    path('student/pomodoro-metrics/', pomodoro_metrics, name='pomodoro-metrics'),
    path('student/pomodoro-status/', views.pomodoro_status, name='pomodoro-status'),
    path('student/pomodoro-reset/', views.pomodoro_reset, name='pomodoro-reset'),
    path('student/feature-records/', feature_records, name='feature-records'),
    path('student/report/', views.student_report, name='student-report'),
    
    # Teacher & Admin
    path('teacher/students/', teacher_students, name='teacher-students'),
    path('teacher/overview/', teacher_overview, name='teacher-overview'),
    path('teacher/pomodoro-config/', views.pomodoro_config, name='teacher-pomodoro-config'),
    path('admin/users/', admin_users, name='admin-users'),
    path('admin/users/<int:user_id>/', views.admin_user_detail, name='admin-user-detail'),
    path('admin/active-sessions/', admin_active_sessions, name='admin-active-sessions'),
    path('admin/courses/', views.admin_courses),
    path('admin/courses/<int:course_id>/', views.admin_course_detail),
    path('admin/courses/<int:course_id>/students/', views.admin_course_students),
    path('admin/enroll-students-bulk/', views.admin_enroll_students_bulk),
    path('teacher/class-sessions/', views.teacher_class_sessions),
    path('teacher/student-courses/', views.teacher_student_courses),
    path("admin/assign-teacher/", views.admin_assign_teacher, name="admin-assign-teacher"),
    path("admin/enroll-student/", views.admin_enroll_student, name="admin-enroll-student"),

    # Media Files (Production-safe)
    path('media/course-materials/<int:material_id>/download/', download_course_material, name='download-course-material'),

    # --- ZONA QUIZ (CORREGIDA) ---
    path('teacher/generate-quiz/', views.generate_quiz_ai),
    
    # ⚠️ CAMBIO IMPORTANTE AQUÍ:
    # Antes tenías: 'student/quiz/<int:material_id>/'
    # Ahora usamos esta ruta que es la que tu botón "Prueba" seguramente está buscando:
    path('course-materials/<int:material_id>/quiz/', views.get_quiz, name='get-quiz'),
    
    path('student/submit-quiz/', views.submit_quiz),

    # AI / LSTM
    path('predict-distractions/', predict_distractions, name='predict-distractions'),
]