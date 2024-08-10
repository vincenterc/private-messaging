'use client'

import { useEffect, useState } from 'react'
import socket from '@/socket'

import './page.css'
import { lato } from './font'
import SelectUsername from './select-username'
import Chat from './chat'

export default function Page() {
  const [usernameAlreadySelected, setUsernameAlreadySelected] = useState(false)

  useEffect(() => {
    function onConnectError(err: Error) {
      if (err.message === 'invalid username') {
        setUsernameAlreadySelected(false)
      }
    }

    socket.on('connect_error', onConnectError)

    return () => {
      socket.off('connect_error', onConnectError)
    }
  }, [])

  function onSelectUsername(username: string) {
    setUsernameAlreadySelected(true)
    socket.auth = { username }
    socket.connect()
  }

  return (
    <div id="app" className={lato.variable}>
      {!usernameAlreadySelected ? (
        <SelectUsername onSelectUsername={onSelectUsername} />
      ) : (
        <Chat />
      )}
    </div>
  )
}
