from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta

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
    
    # 🆕 NUEVO: Para guardar features del modelo LSTM
    raw_features = models.JSONField(null=True, blank=True)  # [[ear,mar], ...]

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.student.username} - {self.class_session.course.code} - {self.attention_score}%"

class FeatureRecord(models.Model):
    """Store computed facial feature vectors for training/analysis (privacy: no images)."""
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='feature_records')
    class_session = models.ForeignKey(ClassSession, on_delete=models.CASCADE, related_name='feature_records')
    features = models.JSONField()  # e.g. {leftEAR, rightEAR, mar, pitch, yaw, roll}
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.timestamp} - {self.student.username} - features"

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

class PomodoroEvent(models.Model):
    EVENT_TYPES = [
        ('auto_pause', 'Auto Pause'),
        ('manual_pause', 'Manual Pause'),
        ('start', 'Start'),
        ('end', 'End'),
    ]
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='pomodoro_events')
    class_session = models.ForeignKey(ClassSession, on_delete=models.CASCADE, related_name='pomodoro_events')
    event_type = models.CharField(max_length=30, choices=EVENT_TYPES)
    reason = models.CharField(max_length=255, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.timestamp} - {self.student.username} - {self.event_type}"

class PomodoroSession(models.Model):
    """
    Tracks the active pomodoro session for a student within a class session.
    This model will hold the current state and timing information.
    """
    STATUS_CHOICES = [
        ('idle', 'Idle'),
        ('working', 'Working'),
        ('paused', 'Paused'),
        ('break_distracted', 'Break Distracted') # New status for distraction during break
    ]

    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='active_pomodoro_sessions')
    class_session = models.ForeignKey(ClassSession, on_delete=models.CASCADE, related_name='active_pomodoro_sessions')
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='idle')
    
    # Timestamps for tracking current work/pause cycles
    current_cycle_start_time = models.DateTimeField(null=True, blank=True)
    last_recorded_distraction_time = models.DateTimeField(null=True, blank=True) # Retained for potential general distraction reporting
    
    # New fields for enhanced pomodoro functionality
    work_elapsed_time_on_pause = models.DurationField(null=True, blank=True) # Stores elapsed work time when paused
    current_cycle_number = models.IntegerField(default=1) # Tracks the current pomodoro cycle
    distraction_start_time = models.DateTimeField(null=True, blank=True) # For 30-second distraction tolerance in breaks
    was_break_distracted = models.BooleanField(default=False) # Indicates if any distraction occurred during the break
    total_distraction_duration = models.DurationField(default=timedelta(seconds=0)) # Accumulates total distraction time during a break
    
    # Configuration for pomodoro (can be set per session or globally)
    work_duration_minutes = models.IntegerField(default=5)  # 5 minutes for work
    pause_duration_minutes = models.IntegerField(default=2) # 2 minutes for pause

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('student', 'class_session') # Only one active session per student per class

    def __str__(self):
        return f"Pomodoro {self.student.username} in {self.class_session.course.code} - Status: {self.status}"

    @property
    def time_remaining_in_current_phase(self):
        if not self.current_cycle_start_time:
            return 0 # Or handle as an error/not started

        now = timezone.now()
        elapsed_time = now - self.current_cycle_start_time
        
        if self.status == 'working':
            total_duration = timedelta(minutes=self.work_duration_minutes)
        elif self.status == 'paused' or self.status == 'break_distracted':
            total_duration = timedelta(minutes=self.pause_duration_minutes)
        else: # idle
            return 0 # No active phase with a strict countdown

        remaining = total_duration - elapsed_time
        return max(0, int(remaining.total_seconds())) # Return in seconds

    @property
    def is_distracted_during_pause(self):
        # Returns True if currently in a break_distracted state,
        # or if a distraction was recently recorded during a 'paused' state.
        if self.status == 'break_distracted':
            return True
        if self.status == 'paused' and self.last_recorded_distraction_time:
            # Consider a distraction relevant if it happened within the current pause period
            # Or just check if there's a last_distraction_time since it would have been reset on new pause
            return True # Simplified for now, as time_remaining_in_current_phase will handle exact timing
        return False

class CourseMaterial(models.Model):
    """Material de un curso (PDF, video, etc.)"""
    FILE_TYPE_CHOICES = [('pdf', 'PDF'), ('video', 'Video'), ('other', 'Otro')]

    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='materials')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    file = models.FileField(upload_to='course_materials/')
    file_type = models.CharField(max_length=20, choices=FILE_TYPE_CHOICES, default='other')
    is_active = models.BooleanField(default=True) # Added field
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.course.code} - {self.title}"
