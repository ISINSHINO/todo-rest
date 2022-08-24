
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework import status


class TaskPagination(PageNumberPagination):
    page_size = 5

    def get_paginated_response(self, data, allTasks, activeTasks, completedTasks):
        return Response({
            'count': self.page.paginator.count,
            'all' : allTasks,
            'active' : activeTasks,
            'completed' : completedTasks,
            'results': data,
        }, status=status.HTTP_200_OK)