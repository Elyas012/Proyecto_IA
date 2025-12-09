from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Message, Course, ClassSession, StudentCourse, AttentionRecord, UserProfile


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


class ClassSessionSerializer(serializers.ModelSerializer):
    course = CourseSerializer(read_only=True)
    course_id = serializers.IntegerField(write_only=True)
    teacher = UserSerializer(read_only=True)
    teacher_id = serializers.IntegerField(write_only=True)
    attention_records = AttentionRecordSerializer(many=True, read_only=True)
    
    class Meta:
        model = ClassSession
        fields = ['id', 'course', 'course_id', 'teacher', 'teacher_id', 'title', 'date', 'time', 'duration_minutes', 'status', 'created_at', 'attention_records']


class StudentCourseSerializer(serializers.ModelSerializer):
    course = CourseSerializer(read_only=True)
    student = UserSerializer(read_only=True)
    
    class Meta:
        model = StudentCourse
        fields = ['id', 'student', 'course', 'enrolled_at']

