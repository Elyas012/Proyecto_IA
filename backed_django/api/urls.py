from rest_framework.routers import DefaultRouter
from django.urls import path
from .views import (MessageViewSet, LoginView, RegisterView, student_courses, 
                   record_attention, teacher_students, teacher_overview, admin_users, 
                   admin_active_sessions, pomodoro_events, pomodoro_metrics, 
                   feature_records, current_user, CourseMaterialViewSet, predict_distractions)  # 🆕 AGREGAR AQUÍ
from django.urls import path
from . import views

router = DefaultRouter()
router.register(r'messages', MessageViewSet, basename='message')
router.register(r'course-materials', CourseMaterialViewSet, basename='coursematerial')

urlpatterns = router.urls + [
    path('auth/login/', LoginView.as_view(), name='api-login'),
    path('auth/register/', RegisterView.as_view(), name='api-register'),
    path('auth/me/', current_user, name='api-me'),
    path('student/courses/', student_courses, name='student-courses'),
    path('student/record-attention/', record_attention, name='record-attention'),
    path('student/pomodoro-events/', pomodoro_events, name='pomodoro-events'),
    path('student/pomodoro-metrics/', pomodoro_metrics, name='pomodoro-metrics'),
    path('student/pomodoro-status/', views.pomodoro_status, name='pomodoro-status'),
    path('student/feature-records/', feature_records, name='feature-records'),
    path('student/report/', views.student_report, name='student-report'),
    path('teacher/students/', teacher_students, name='teacher-students'),
    path('teacher/overview/', teacher_overview, name='teacher-overview'),
    path('admin/users/', admin_users, name='admin-users'),
    path('admin/active-sessions/', admin_active_sessions, name='admin-active-sessions'),
    path('admin/courses/', views.admin_courses),
    path('teacher/class-sessions/', views.teacher_class_sessions),
    path('teacher/student-courses/', views.teacher_student_courses),
    path("admin/assign-teacher/", views.admin_assign_teacher, name="admin-assign-teacher"),
    path("admin/enroll-student/", views.admin_enroll_student, name="admin-enroll-student"),
    
    # ENDPOINT LSTM 
    path('predict-distractions/', predict_distractions, name='predict-distractions'),
]
