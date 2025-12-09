from django.db import models
from django.contrib.auth.models import User

# Create your models here.

class Message(models.Model):
    text = models.CharField(max_length=255)

    def __str__(self):
        return self.text


class Course(models.Model):
    """Curso o materia impartida"""
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.code} - {self.name}"


class ClassSession(models.Model):
    """Sesión de clase (una clase impartida en una fecha/hora específica)"""
    STATUS_CHOICES = [('active', 'Activa'), ('upcoming', 'Próxima'), ('completed', 'Completada')]
    
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='sessions')
    teacher = models.ForeignKey(User, on_delete=models.CASCADE, related_name='taught_sessions')
    title = models.CharField(max_length=255, blank=True)
    date = models.DateField()
    time = models.TimeField()
    duration_minutes = models.IntegerField(default=60)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='upcoming')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date', '-time']

    def __str__(self):
        return f"{self.course.code} - {self.date} {self.time}"


class StudentCourse(models.Model):
    """Relación entre estudiante y curso (inscripción)"""
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='enrolled_courses')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='enrolled_students')
    enrolled_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('student', 'course')

    def __str__(self):
        return f"{self.student.username} - {self.course.code}"


class AttentionRecord(models.Model):
    """Registro de atención de un estudiante en una clase"""
    ATTENTION_LEVEL_CHOICES = [('high', 'Alta'), ('medium', 'Media'), ('low', 'Baja')]
    
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='attention_records')
    class_session = models.ForeignKey(ClassSession, on_delete=models.CASCADE, related_name='attention_records')
    attention_score = models.IntegerField(default=0)  # 0-100
    attention_level = models.CharField(max_length=20, choices=ATTENTION_LEVEL_CHOICES, default='medium')
    timestamp = models.DateTimeField(auto_now_add=True)
    duration_seconds = models.IntegerField(default=0)  # Duración de la clase en segundos

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.student.username} - {self.class_session.course.code} - {self.attention_score}%"


class UserProfile(models.Model):
    """Perfil extendido del usuario"""
    ROLE_CHOICES = [('student', 'Estudiante'), ('teacher', 'Docente'), ('admin', 'Administrador')]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='student')
    user_code = models.CharField(max_length=50, unique=True)  # EST001, DOC001, etc.
    phone = models.CharField(max_length=20, blank=True)
    bio = models.TextField(blank=True)
    avatar_url = models.URLField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} ({self.role})"

