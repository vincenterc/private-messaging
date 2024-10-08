'use client'

import { useEffect, useState } from 'react'
import socket from '@/socket'

import './page.css'
import { lato } from './font'
import SelectUsername from './select-username'
import Chat from './chat'

const LocalStorageKeys = {
  SessionID: 'SessionID',
}

export default function Page() {
  const [isUsernameSelected, setIsUsernameSelected] = useState(false)

  useEffect(() => {
    const sessionID = localStorage.getItem(LocalStorageKeys.SessionID)

    if (sessionID) {
      setIsUsernameSelected(true)
      socket.auth = { sessionID }
      socket.connect()
    }

    function onSession({
      sessionID,
      userID,
    }: {
      sessionID: string
      userID: string
    }) {
      socket.auth = { sessionID }
      localStorage.setItem(LocalStorageKeys.SessionID, sessionID)
      // TODO socket.userID
      ;(socket as any).userID = userID
    }

    function onConnectError(err: Error) {
      if (err.message === 'invalid username') {
        setIsUsernameSelected(false)
      }
    }

    socket.on('session', onSession)
    socket.on('connect_error', onConnectError)

    return () => {
      socket.off('session', onSession)
      socket.off('connect_error', onConnectError)
    }
  }, [])

  function onSelectUsername(username: string) {
    setIsUsernameSelected(true)
    socket.auth = { username }
    socket.connect()
  }

  return (
    <div id="app" className={lato.variable}>
      {!isUsernameSelected ? (
        <SelectUsername onSelectUsername={onSelectUsername} />
      ) : (
        <Chat />
      )}
    </div>
  )
}
