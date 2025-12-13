from rest_framework.routers import DefaultRouter
from django.urls import path
from .views import (MessageViewSet, LoginView, RegisterView, student_courses, 
                   record_attention, teacher_students, admin_users, admin_active_sessions, pomodoro_events, pomodoro_metrics)

router = DefaultRouter()
router.register(r'messages', MessageViewSet, basename='message')

urlpatterns = router.urls + [
    path('auth/login/', LoginView.as_view(), name='api-login'),
    path('auth/register/', RegisterView.as_view(), name='api-register'),
    path('student/courses/', student_courses, name='student-courses'),
    path('student/record-attention/', record_attention, name='record-attention'),
    path('student/pomodoro-events/', pomodoro_events, name='pomodoro-events'),
    path('student/pomodoro-metrics/', pomodoro_metrics, name='pomodoro-metrics'),
    path('teacher/students/', teacher_students, name='teacher-students'),
    path('admin/users/', admin_users, name='admin-users'),
    path('admin/active-sessions/', admin_active_sessions, name='admin-active-sessions'),
]
