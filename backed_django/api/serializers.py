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
        # ✅ CAMBIO: Agregado 'has_quiz' a la lista
        fields = ['id', 'course', 'title', 'description', 'file', 'file_type', 'is_active', 'uploaded_at', 'has_quiz', 'file_url']

    def get_has_quiz(self, obj):
        """Devuelve True si existe un quiz generado para este material"""
        return hasattr(obj, 'generated_quiz')
    
    def get_file_url(self, obj):
        """Genera la URL para descargar el archivo a través de la API"""
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(f'/api/media/course-materials/{obj.id}/download/')
        return f'/api/media/course-materials/{obj.id}/download/'

    def create(self, validated_data):
        file = validated_data.get('file')
        if file:
            file_name = file.name.lower()
            if file_name.endswith('.pdf'):
                validated_data['file_type'] = 'pdf'
            elif file_name.endswith(('.mp4', '.mov', '.avi', '.wmv')): 
                validated_data['file_type'] = 'video'
            else:
                validated_data['file_type'] = 'other' 
        return super().create(validated_data)

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        # Rename 'file_type' to 'material_type' for frontend compatibility
        if 'file_type' in representation:
            representation['material_type'] = representation.pop('file_type')
        
        # No exponer el path directo, usar file_url en su lugar
        if 'file' in representation:
            representation.pop('file')
        
        return representation