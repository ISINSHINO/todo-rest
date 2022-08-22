from rest_framework.decorators import api_view
from rest_framework import viewsets
from rest_framework.response import Response
from .serializers import TaskSerializer
from .models import Task
from django.shortcuts import get_object_or_404
"""
API Overview
"""

class TaskViewSet(viewsets.ViewSet):
    def list(request, self):
        tasks = Task.objects.all().order_by('id')
        serializer = TaskSerializer(tasks, many = True)
        return Response(serializer.data)

    def retrieve(self, request, pk=None):
        tasks = Task.objects.all()
        task = get_object_or_404(tasks, pk=pk)
        serializer = TaskSerializer(task)
        return Response(serializer.data)

    def post(self, request):
        # входные данные преобразуются в объект сериализатор
        serializer = TaskSerializer(data=request.data)
        # проверяются на соответствие модели
        serializer.is_valid(raise_exception=True)
        # добавляются в базу данных
        serializer.save()
        return Response({"message": "Successfully created"})

    def patch(self, request, *args, **kwargs):
        # если ключ есть, то он иначе None
        pk = kwargs.get("pk", None)
        # если его нет, то вернуть ошибку
        if not pk:
            content = {"message": "Method PATCH not allowed"}
            return Response(content)

        # если запись по ключу получить нельзя, то ошибка
        try:
            instance = Task.objects.get(pk=pk)
        except:
            return Response({"message": "Method PATCH not allowed"})

        # входные данные преобразуются в объект сериализатор
        serializer = TaskSerializer(data=request.data, instance=instance)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"message": "Successfully updated"})

    def destroy(self, request, *args, **kwargs):
        # если ключ есть, то он иначе None
        pk = kwargs.get("pk", None)
        # если его нет, то вернуть ошибку
        if not pk:
            return Response({"message": "Method DELETE not allowed"})

        # если запись по ключу получить нельзя, то ошибка
        try:
            instance = Task.objects.get(pk=pk)
        except:
            return Response({"message": "Method DELETE not allowed"})

        instance.delete()
        return Response({"message": "Successfully deleted"})

    def clear_completed(self, request):
        instance = Task.objects.filter(completed=True)
        instance.delete()
        return Response({"message": "Successfully deleted"})

    def complete_all(self, request):
        instance = Task.objects.all()
        for task in instance:
            task.completed = request.data['completed']
            task.save()
        return Response({"message": "Successfully deleted"})
        
