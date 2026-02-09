from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Message, Course, ClassSession, StudentCourse, AttentionRecord, UserProfile, CourseMaterial
from .models import FeatureRecord


class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = '__all__'


class UserProfileSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField()
    
    class Meta:
        model = UserProfile
        fields = ['user', 'role', 'user_id', 'phone', 'bio', 'avatar_url', 'is_active']


class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'profile']


class CourseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = ['id', 'name', 'code', 'description', 'created_at']


class AttentionRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = AttentionRecord
        fields = ['id', 'student', 'class_session', 'attention_score', 'attention_level', 'timestamp', 'duration_seconds']


class FeatureRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = FeatureRecord
        fields = '__all__'


class ClassSessionSerializer(serializers.ModelSerializer):
    course = CourseSerializer(read_only=True)
    course_id = serializers.IntegerField(write_only=True)
    teacher = UserSerializer(read_only=True)
    teacher_id = serializers.IntegerField(write_only=True)
    attention_records = AttentionRecordSerializer(many=True, read_only=True)
    
    class Meta:
        model = ClassSession
        fields = ['id', 'course', 'course_id', 'teacher', 'teacher_id', 'title', 'date', 'time', 'duration_minutes', 'status', 'created_at', 'attention_records']


class PomodoroEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = __import__('api.models', fromlist=['PomodoroEvent']).PomodoroEvent
        fields = ['id', 'student', 'class_session', 'event_type', 'reason', 'timestamp']


class StudentCourseSerializer(serializers.ModelSerializer):
    course = CourseSerializer(read_only=True)
    student = UserSerializer(read_only=True)
    
    class Meta:
        model = StudentCourse
        fields = ['id', 'student', 'course', 'enrolled_at']


class CourseMaterialSerializer(serializers.ModelSerializer):
    # ✅ CAMBIO: Campo calculado para saber si tiene quiz
    has_quiz = serializers.SerializerMethodField()
    # ✅ NUEVO: URL para descargar el archivo (en lugar de ruta directa)
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = CourseMaterial
        # ✅ CAMBIO: Agregado 'has_quiz' y 'video_url' a la lista
        fields = ['id', 'course', 'title', 'description', 'file', 'file_type', 'video_url', 'is_active', 'uploaded_at', 'has_quiz', 'file_url']

    def get_has_quiz(self, obj):
        """Devuelve True si existe un quiz generado para este material"""
        return hasattr(obj, 'generated_quiz')
    
    def get_file_url(self, obj):
        """
        Devuelve la ruta relativa para descargar el archivo.
        Si es un enlace externo (video_url), devuelve None.
        """
        # Si es un enlace externo, no hay file_url
        if obj.file_type == 'link' or obj.video_url:
            return None
        # Si hay archivo, devolver ruta de descarga
        if obj.file:
            return f'/media/course-materials/{obj.id}/download/'
        return None

    def create(self, validated_data):
        file = validated_data.get('file')
        video_url = validated_data.get('video_url')
        
        # Si hay archivo, determinar tipo por extensión
        if file:
            file_name = file.name.lower()
            if file_name.endswith('.pdf'):
                validated_data['file_type'] = 'pdf'
            elif file_name.endswith(('.mp4', '.mov', '.avi', '.wmv')): 
                validated_data['file_type'] = 'video'
            else:
                validated_data['file_type'] = 'other'
        # Si hay video_url, el tipo es 'link'
        elif video_url:
            validated_data['file_type'] = 'link'
        
        return super().create(validated_data)

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        
        # Convertir file_type a material_type para compatibilidad con el frontend
        if 'file_type' in representation:
            file_type = representation.pop('file_type')
            # Si es 'link', es un video externo
            if file_type == 'link':
                representation['material_type'] = 'video'
            else:
                representation['material_type'] = file_type
        
        # No exponer el path directo del archivo
        if 'file' in representation:
            representation.pop('file')
        
        return representation