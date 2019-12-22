const amqp = require('amqplib')

module.exports = async (io, app) => {
  const connection = await amqp.connect('amqp://user:bitnami@localhost:5672')
  const channel = await connection.createChannel()

  channel.prefetch(1)
  channel.consume("processing.requests", (msg) => {
    console.log(" [x] Received %s", msg.content.toString())
  }, { noAck: true })

  // Debug
  app.get('/up', (req, res) => {
    res.send({ answer: 42  })
  })

  // Notifications
  app.post('/api/v1/notifications', (req, res) => {
    const { notification, userId } = req.body;

    io.sockets.to(userId).emit('sync', {
      action: {
        type: 'ADD_NOTIFICATION',
        payload: notification
      }
    })

    res.send({ success: true })
  })

  // Image previews
  app.post('/api/v1/image_preview', (req, res) => {
    const { uri, channelId, messageId, attachmentId } = req.body;

    io.sockets.to(channelId).emit('sync', {
      action: {
        type: 'UPDATE_CHANNEL_MESSAGE_ATTACHMENT_PREVIEW',
        payload: {
          uri,
          channelId,
          messageId,
          attachmentId,
        },
      }
    })

    res.send({ success: true })
  })

  // Message create
  app.post('/api/v1/webhook/create', (req, res) => {
    const { channelId, message, teamId } = req.body;

    // The message object is the whole message
    io.sockets.to(channelId).emit('sync', {
      action: {
        type: 'CREATE_CHANNEL_MESSAGE',
        payload: {
          message,
          channelId,
          teamId,
        }
      }
    })

    res.send({ success: true })
  })

  // Update a single message
  app.post('/api/v1/webhook/update', (req, res) => {
    const { channelId, messageId, message, teamId } = req.body;

    // We explicitly show what's being passed
    // so it's easier to see
    // message: { message, attachments, app }
    io.sockets.to(channelId).emit('sync', {
      action: {
        type: 'UPDATE_CHANNEL_MESSAGE',
        payload: {
          message,
          messageId,
          channelId,
          teamId,
        }
      }
    })

    res.send({ success: true })
  })

  // Webhook: message delete
  app.post('/api/v1/webhook/delete', (req, res) => {
    const { channelId, messageId } = req.body;

    io.sockets.to(channelId).emit('sync', {
      action: {
        type: 'DELETE_CHANNEL_MESSAGE',
        payload: {
          messageId,
          channelId,
        }
      }
    })

    res.send({ success: true })
  })

  // Delete multiple resource IDs
  app.post('/api/v1/webhook/resource_id/delete', (req, res) => {
    const { channelId, messageIds, teamId } = req.body;

    // We explicitly show what's being passed
    // so it's easier to see
    // message: { message, attachments, app: { resourceId } }
    io.sockets.to(channelId).emit('sync', {
      action: {
        type: 'DELETE_CHANNEL_APP_MESSAGES_WITH_RESOURCE_IDS',
        payload: {
          messageIds,
          channelId,
          teamId,
        }
      }
    })

    res.send({ success: true })
  })

  // Update multiple resource IDs
  app.post('/api/v1/webhook/resource_id/update', (req, res) => {
    const { channelId, messageIds, message, teamId } = req.body;

    // We explicitly show what's being passed
    // so it's easier to see
    // message: { message, attachments, app: { resourceId } }
    io.sockets.to(channelId).emit('sync', {
      action: {
        type: 'UPDATE_CHANNEL_APP_MESSAGES_WITH_RESOURCE_IDS',
        payload: {
          message,
          messageIds,
          channelId,
          teamId,
        }
      }
    })

    res.send({ success: true })
  })

  // Create channel app
  app.post('/api/v1/universe/install', (req, res) => {
    const { channelId, app } = req.body;

    // res.send({ answer: 42  })
    // Install on 1 channel
    io.sockets.to(channelId).emit('sync', {
      action: {
        type: 'CREATE_CHANNEL_APP',
        payload: {
          app,
          channelId,
        }
      }
    })

    res.send({ success: true })
  })

  // Update channel app detail
  app.post('/api/v1/universe/update_app', (req, res) => {
    // res.send({ answer: 42  })
    // Find all channels with this app
    // Send updated app to those channels
    const { channelIds, app, appId } = req.body;

    // Send to all
    channelIds.map(channelId => {
      io.sockets.to(channelId).emit('sync', {
        action: {
          type: 'CREATE_CHANNEL_APP',
          payload: {
            app,
            appId,
            channelId,
          }
        }
      })
    })

    res.send({ success: true })
  })

  // Update channel app active
  app.post('/api/v1/universe/update_active', (req, res) => {
    // res.send({ answer: 42  })
    // Send message to 1 channel
    const { channelId, appId, active } = req.body;

    // res.send({ answer: 42  })
    // Install on 1 channel
    io.sockets.to(channelId).emit('sync', {
      action: {
        type: 'UPDATE_CHANNEL_APP_ACTIVE',
        payload: {
          appId,
          active,
          channelId,
        }
      }
    })

    res.send({ success: true })
  })

  // Delete channel app
  app.post('/api/v1/universe/uninstall', (req, res) => {
    const { channelId, appId } = req.body;

    // res.send({ answer: 42  })
    // Install on 1 channel
    io.sockets.to(channelId).emit('sync', {
      action: {
        type: 'DELETE_CHANNEL_APP',
        payload: {
          appId,
          channelId,
        }
      }
    })

    res.send({ success: true })
  })

  // Delete channel app
  app.post('/api/v1/universe/delete', (req, res) => {
    const { channelIds, appId } = req.body;

    // Send to all
    channelIds.map(channelId => {
      io.sockets.to(channelId).emit('sync', {
        action: {
          type: 'DELETE_CHANNEL_APP',
          payload: {
            appId,
            channelId,
          }
        }
      })
    })

    res.send({ success: true })
  })
}
