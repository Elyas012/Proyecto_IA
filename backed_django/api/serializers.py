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
    class Meta:
        model = CourseMaterial
        fields = ['id', 'course', 'title', 'description', 'file', 'file_type', 'is_active', 'uploaded_at']

    def create(self, validated_data):
        file = validated_data.get('file')
        if file:
            file_name = file.name.lower()
            if file_name.endswith('.pdf'):
                validated_data['file_type'] = 'pdf'
            elif file_name.endswith(('.mp4', '.mov', '.avi', '.wmv')): # Added .wmv
                validated_data['file_type'] = 'video'
            else:
                validated_data['file_type'] = 'other' # Ensure other types are explicitly set
        return super().create(validated_data)

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        # Rename 'file_type' to 'material_type' for frontend compatibility
        if 'file_type' in representation:
            representation['material_type'] = representation.pop('file_type')
        
        if instance.file and hasattr(instance.file, 'url'):
            representation['file'] = instance.file.url
        return representation
