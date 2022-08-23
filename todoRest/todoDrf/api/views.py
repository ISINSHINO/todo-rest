from rest_framework import viewsets
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .serializers import TaskSerializer
from .models import Task
from .mixins import MyPaginationMixin

class TaskViewSet(viewsets.ViewSet, MyPaginationMixin):
    """Task model set."""
    allTasks = Task.objects.all()
    activeTasks = Task.objects.filter(completed=False)
    completedTasks = Task.objects.filter(completed=True)

    def list(self, request):
        """Return paginated tasks."""
        page = self.paginate_queryset(self.queryset)
        if page is not None:
            serializer = self.serializer_class(page, many=True)
            content = {
                "all": self.allTasks,
                "active": self.activeTasks,
                "completed": self.completedTasks,
            }
            return self.get_paginated_response(serializer.data)

    def retrieve(self, request, pk=None):
        """Return task with exact primary key."""
        tasks = Task.objects.all()
        task = get_object_or_404(tasks, pk=pk)
        serializer = TaskSerializer(task)
        return Response(serializer.data)

    def post(self, request):
        """Create new task and save it."""
        serializer = TaskSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"message": "Successfully created"})

    def partial_update(self, request, *args, **kwargs):
        """Change task name or status."""
        pk = kwargs.get("pk", None)
        if not pk:
            return Response({"message": "Method PATCH not allowed"})

        try:
            instance = Task.objects.get(pk=pk)
        except:
            return Response({"message": "Method PATCH not allowed"})

        serializer = TaskSerializer(data=request.data, instance=instance)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"message": "Successfully updated"})

    def destroy(self, request, *args, **kwargs):
        """Delete task with exact primary key."""
        pk = kwargs.get("pk", None)
        if not pk:
            return Response({"message": "Method DELETE not allowed"})

        try:
            instance = Task.objects.get(pk=pk)
        except:
            return Response({"message": "Method DELETE not allowed"})

        instance.delete()
        return Response({"message": "Successfully deleted"})

    def clear_completed(self, request):
        """Delete all completed tasks."""
        instance = Task.objects.filter(completed=True)
        instance.delete()
        return Response({"message": "Successfully deleted"})

    def complete_all(self, request):
        """Mark all tasks as completed."""
        instance = Task.objects.all()
        for task in instance:
            task.completed = request.data['completed']
            task.save()
        return Response({"message": "Successfully deleted"})