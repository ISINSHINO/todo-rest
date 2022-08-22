from rest_framework import viewsets
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .serializers import TaskSerializer
from .models import Task
from rest_framework.settings import api_settings
"""
API Overview
"""

class TaskViewSet(viewsets.ViewSet):
    pagination_class = api_settings.DEFAULT_PAGINATION_CLASS 
    queryset = Task.objects.all()
    serializer_class = TaskSerializer

    def list(self, request):
        page = self.paginate_queryset(self.queryset)
        if page is not None:
            serializer = self.serializer_class(page, many=True)
            return self.get_paginated_response(serializer.data)


        # tasks = Task.objects.all().order_by('id')
        # serializer = TaskSerializer(tasks, many = True)
        # return Response(serializer.data)

    def paginator(self):
        """
        The paginator instance associated with the view, or `None`.
        """
        if not hasattr(self, '_paginator'):
            if self.pagination_class is None:
                self._paginator = None
            else:
                self._paginator = self.pagination_class()
        return self._paginator

    def paginate_queryset(self, queryset):
         """
         Return a single page of results, or `None` if pagination is disabled.
         """
         if self.paginator is None:
             return None
         return self.paginator.paginate_queryset(queryset, self.request, view=self)

    def get_paginated_response(self, data):
         """
         Return a paginated style `Response` object for the given output data.
         """
         assert self.paginator is not None
         return self.paginator.get_paginated_response(data)

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

    def partial_update(self, request, *args, **kwargs):
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
        
