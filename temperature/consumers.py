import json
from asgiref.sync import async_to_sync
from channels.generic.websocket import WebsocketConsumer
from datetime import datetime

from .models import Record
from .serializers import RecordSerializer


class RecordConsumer(WebsocketConsumer):
    running = False

    def connect(self):
        self.accept()
        self.init_channels()


    def disconnect(self, close_code):
        self.running = False


    def init_channels(self):
        self.running = True
        async_to_sync(self.channel_layer.group_add)('feverdetector', self.channel_name)


    def record_add(self, event):
        self.send(text_data=json.dumps({
            'status': 'add',
            'data': event["data"],
            'summary': self.summary(),
        }))
 

    def receive(self, text_data):
        json_data = json.loads(text_data)
        action = json_data.get('action')

        if action:
            if action == "init":
                records = Record.objects.all().order_by('-created_at')[:1000]
                serializes = RecordSerializer(records, many=True)

                self.send(text_data=json.dumps({
                    'status': 'init',
                    'data': serializes.data,
                    'summary': self.summary(),
                }))

            elif action == "init-screen":
                record = Record.objects.all().order_by('-created_at')[:1]
                serializes = RecordSerializer(record, many=True)

                self.send(text_data=json.dumps({
                    'status': 'init-screen',
                    'data': serializes.data,
                }))

            elif action == 'reconnect':
                self.init_channels()


    def summary(self):
        summary = {}
        summary['count'] = Record.objects.all().count()
        summary['fever'] = Record.objects.filter(value__gt=37.5).count()
        summary['today_count'] = Record.objects.filter(created_at__date=datetime.today()).count()
        summary['today_fever'] = Record.objects.filter(created_at__date=datetime.today(), value__gt=37.5).count()
        return summary