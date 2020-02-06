# Legacy Yack websocket server

This was the initial websocket server Yack used. The repo includes Docker build files, GitLab CI files & Ansible deployment files. It has since been deprecated in favour of an MQTT broker.

This (old) way of doing things has the API messaging this server with RabbitMQ or using the REST API end points. Also uses Redis as the backend for SocketIO.

Main reason for the deprecation was questionable Socket support for future & simplification of the messaging backbone. MQTT brokers give you clusterability/shardability out of the box.
