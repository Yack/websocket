require('dotenv').config()

const cors = require('cors')
const app = require('express')()
const http = require('http').Server(app)
const io = require('socket.io')(http)
const redisAdapter = require('socket.io-redis')
const redis = require('redis')
const bodyParser = require('body-parser')
const amqp = require('amqplib')
const ApiRoute = require('./api.route')
const jwt = require('jsonwebtoken')

const init = async () => {
  try {
    app.use(cors())
    app.use(bodyParser.json())

    // Use Redis
    const pub = redis.createClient({ host: process.env.REDIS_HOST, port: process.env.REDIS_PORT, password: process.env.REDIS_PASSWORD })
    const sub = redis.createClient({ host: process.env.REDIS_HOST, port: process.env.REDIS_PORT, password: process.env.REDIS_PASSWORD })
    const adapter = redisAdapter({ pubClient: pub, subClient: sub })

    // Create the 2 clients
    adapter.pubClient.on('error', (e) => console.log('Redis pubClient error:', e))
    adapter.subClient.on('error', (e) => console.log('Redis subClient error:', e))

    // Plug our adaptor into Socket
    io.adapter(adapter)

    // Set up the route
    ApiRoute(io, app)

    io.use((socket, next) => {
      if (socket.handshake.query && socket.handshake.query.token) {
        jwt.verify(socket.handshake.query.token, provess.env.SECRET, (err, decoded) => {
          if(err) return next(new Error('Authentication error'));
          socket.decoded = decoded;
          next();
        });
      } else {
        next(new Error('Authentication error'));
      }
    })

    io.on('connection', (socket) => {
      socket.join('system')
      socket.on('sync', ({ sync, action }) => socket.to(sync).emit('sync', { action }))
      socket.on('joins', ({ channelIds }) => channelIds.map(channelId => socket.join(channelId)))
      socket.on('join', ({ channelId }) => socket.join(channelId))
      socket.on('leave', ({ channelId }) => socket.leave(channelId))
      socket.on('joinChannel', ({ userIds, channelId }) => userIds.map(userId => socket.to(userId).emit('joinChannel', { channelId })))
      socket.on('joinChannelTeam', ({ teamId, channelId }) => socket.to(teamId).emit('joinChannel', { channelId }))
      socket.on('leaveChannelTeam', ({ teamId, channelId }) => socket.to(teamId).emit('leaveChannelTeam', { channelId }))
      socket.on('joinTeam', ({ userIds, teamId }) => userIds.map(userId => socket.to(userId).emit('joinTeam', { teamId })))
      socket.on('leaveChannel', ({ userIds, channelId }) => userIds.map(userId => socket.to(userId).emit('leaveChannel', { channelId })))
      socket.on('leaveTeam', ({ userIds, teamId }) => userIds.map(userId => socket.to(userId).emit('leaveTeam', { teamId })))
    })

    http.listen(process.env.PORT, () => console.log('Websocket server up on', process.env.PORT, process.env.REDIS_HOST, process.env.REDIS_PORT))
  } catch (e) {
    console.log('>>>ERROR START<<<')
    console.log(e)
    console.log('>>>ERROR END<<<')
  }
}

init()
