import React, { createContext, useState, useRef, useEffect } from 'react'
import { io } from 'socket.io-client'
import Peer from 'simple-peer'

const SocketContext = createContext()

// const socket = io('http://localhost:5000')
const socket = io('https://video-calling-web-app.herokuapp.com')

const ContextProvider = ({ children }) => {
  const [callAccepted, setCallAccepted] = useState(false)
  const [callEnded, setCallEnded] = useState(false)
  const [stream, setStream] = useState(null)
  const [name, setName] = useState('')
  const [call, setCall] = useState({})
  const [me, setMe] = useState('')
  const [callingOrNot, setCallingOrNot] = useState(false)

  const myVideo = useRef()
  const userVideo = useRef()
  const connectionRef = useRef()

  useEffect(() => {
    // Requesting permissions from the user
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((currentStream) => {
        setStream(currentStream)

        myVideo.current.srcObject = currentStream
      })
    
    // sockets
    socket.on('me', (id) => {setMe(id)})

    socket.on('callUser', ({ from, name: callerName, signal }) => {
      setCall({ isReceivingCall: true, from, name: callerName, signal });
    })
  }, [])

  const answerCall = () => {
    setCallAccepted(true)

    const peer = new Peer({ initiator: false, trickle: false, stream })

    peer.on('signal', (data) => {
      socket.emit('answerCall', { signal: data, to: call.from })
    })

    peer.on('stream', (currentStream) => {
      userVideo.current.srcObject = currentStream
    })

    peer.signal(call.signal)

    connectionRef.current = peer
  }

  const callUser = (id) => {
    setCallingOrNot(true)
    const peer = new Peer({ initiator: true, trickle: false, stream })

    peer.on('signal', (data) => {
      socket.emit('callUser', { userToCall: id, signalData: data, from: me, name })
    })

    peer.on('stream', (currentStream) => {
      userVideo.current.srcObject = currentStream
    })

    socket.on('callAccepted', (signal) => {
      setCallAccepted(true)
      setCallingOrNot(false)

      peer.signal(signal)
    })

    connectionRef.current = peer
  }

  const leaveCall = () => {
    setCallEnded(true)

    connectionRef.current.destroy()

    window.location.reload()
  }

  const value = {
    call,
    callAccepted,
    callingOrNot,
    myVideo,
    userVideo,
    stream,
    name,
    setName,
    callEnded,
    me,
    callUser,
    leaveCall,
    answerCall
  }

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  )
}

export { ContextProvider, SocketContext }