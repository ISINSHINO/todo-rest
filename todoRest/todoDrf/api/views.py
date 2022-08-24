from rest_framework import viewsets
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .serializers import TaskSerializer
from .models import Task
from .mixins import TaskPagination
from rest_framework.response import Response
from rest_framework import status

class TaskViewSet(viewsets.ViewSet, TaskPagination):
    """Task model set."""
    paginator = TaskPagination()

    def list(self, request):
        """Return paginated tasks."""
        query_status_dict = {
            'active' : Task.objects.filter(completed = False).order_by('pk'),
            'completed' : Task.objects.filter(completed = True).order_by('pk'),
            'all' : Task.objects.all().order_by('pk'),
        }
        allTasks = query_status_dict['all'].count()
        activeTasks = query_status_dict['active'].count()
        completedTasks = query_status_dict['completed'].count()
        
        queryset = query_status_dict[request.query_params['status']]
        page = self.paginator.paginate_queryset(queryset = queryset, request = request)
        serializer = TaskSerializer(page, many = True)
        return self.paginator.get_paginated_response(serializer.data, allTasks, activeTasks, completedTasks)

    def retrieve(self, request, pk=None):
        """Return task with exact primary key."""
        tasks = Task.objects.all()
        task = get_object_or_404(tasks, pk=pk)
        serializer = TaskSerializer(task)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        """Create new task and save it."""
        serializer = TaskSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"message": "Successfully created"}, status=status.HTTP_200_OK)

    def partial_update(self, request, *args, **kwargs):
        """Change task name or status."""
        pk = kwargs.get("pk", None)
        if not pk:
            return Response({"message": "Method PATCH not allowed"}, status=status.HTTP_405_METHOD_NOT_ALLOWED)

        try:
            instance = Task.objects.get(pk=pk)
        except:
            return Response({"message": "Method PATCH not allowed"}, status=status.HTTP_405_METHOD_NOT_ALLOWED)

        serializer = TaskSerializer(data=request.data, instance=instance, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"message": "Successfully updated"}, status=status.HTTP_200_OK)

    def destroy(self, request, *args, **kwargs):
        """Delete task with exact primary key."""
        pk = kwargs.get("pk", None)
        if not pk:
            return Response({"message": "Method DELETE not allowed"}, status=status.HTTP_405_METHOD_NOT_ALLOWED)

        try:
            instance = Task.objects.get(pk=pk)
        except:
            return Response({"message": "Method DELETE not allowed"}, status=status.HTTP_405_METHOD_NOT_ALLOWED)

        instance.delete()
        return Response({"message": "Successfully deleted"}, status=status.HTTP_200_OK)

    def clear_completed(self, request):
        """Delete all completed tasks."""
        instance = Task.objects.filter(completed=True)
        instance.delete()
        return Response({"message": "Successfully deleted"}, status=status.HTTP_200_OK)

    def complete_all(self, request):
        """Mark all tasks as completed."""
        instance = Task.objects.all().update(completed = request.data['completed'])
        return Response({"message": "Successfully updated"}, status=status.HTTP_200_OK)