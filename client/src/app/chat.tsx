import { useEffect, useState } from 'react'

import styles from './chat.module.css'
import User from './user'
import MessagePanel from './message-panel'
import socket from '@/socket'
import { UserType } from '@/types'

export default function Chat() {
  const [users, setUsers] = useState<UserType[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string>('')

  useEffect(() => {
    const initUserProps = (user: UserType): UserType => ({
      ...user,
      messages: [],
      hasNewMessages: false,
    })

    function onConnect() {
      setUsers(
        users.map((user) => {
          if (user.self) {
            return {
              ...user,
              connected: true,
            }
          } else {
            return user
          }
        }),
      )
    }

    function onDisconnect() {
      setUsers(
        users.map((user) => {
          if (user.self) {
            return {
              ...user,
              connected: false,
            }
          } else {
            return user
          }
        }),
      )
    }

    function onUsers(us: UserType[]) {
      const newUsers = us.map((u) => {
        const existingUser = users.find((user) => user.userID === u.userID)
        if (existingUser) {
          return {
            ...existingUser,
            connected: u.connected,
          }
        }
        return {
          ...initUserProps(u),
          // TODO socket.userID
          self: u.userID === (socket as any).userID,
        }
      })
      // put the current user first and sort others by username
      setUsers(
        newUsers.sort((a, b) => {
          if (a.self) return -1
          if (b.self) return 1
          if (a.username < b.username) return -1
          return a.username > b.username ? 1 : 0
        }),
      )
    }

    function onUserConnected(u: UserType) {
      const existingUserIndex = users.findIndex(
        (user) => user.userID === u.userID,
      )
      if (existingUserIndex !== -1) {
        setUsers([
          ...users.slice(0, existingUserIndex),
          { ...users[existingUserIndex], connected: true },
          ...users.slice(existingUserIndex + 1),
        ])
      } else {
        setUsers([...users, initUserProps(u)])
      }
    }

    function onUserDisconnected(id: string) {
      const index = users.findIndex((user) => user.userID === id)
      if (index !== -1) {
        setUsers([
          ...users.slice(0, index),
          {
            ...users[index],
            connected: false,
          },
          ...users.slice(index + 1),
        ])
      }
    }

    function onPrivateMessage({
      content,
      from,
      to,
    }: {
      content: string
      from: string
      to: string
    }) {
      // TODO socket.userID
      const fromSelf = (socket as any).userID === from
      const userIndex = users.findIndex(
        (user) => user.userID === (fromSelf ? to : from),
      )
      if (userIndex !== -1) {
        const user = users[userIndex]
        setUsers([
          ...users.slice(0, userIndex),
          {
            ...user,
            messages: [...user.messages, { content, fromSelf }],
            hasNewMessages: user.userID !== selectedUserId,
          },
          ...users.slice(userIndex + 1),
        ])
      }
    }

    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)
    socket.on('users', onUsers)
    socket.on('user connected', onUserConnected)
    socket.on('user disconnected', onUserDisconnected)
    socket.on('private message', onPrivateMessage)

    return () => {
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
      socket.off('users', onUsers)
      socket.off('user connected', onUserConnected)
      socket.off('user disconnected', onUserDisconnected)
      socket.off('private message', onPrivateMessage)
    }
  }, [users, selectedUserId])

  function onSelectUser(user: UserType) {
    return function () {
      // TODO
      user.hasNewMessages = false
      setSelectedUserId(user.userID)
    }
  }

  function onMessage(user: UserType, content: string) {
    socket.emit('private message', {
      content,
      to: user.userID,
    })
    const index = users.findIndex((u) => u.userID === user.userID)
    setUsers([
      ...users.slice(0, index),
      {
        ...user,
        messages: [...user.messages, { content, fromSelf: true }],
      },
      ...users.slice(index + 1),
    ])
  }

  return (
    <>
      <div className={styles['left-panel']}>
        {users.map((user) => (
          <User
            key={user.userID}
            user={user}
            selected={selectedUserId === user.userID}
            onSelectUser={onSelectUser(user)}
          />
        ))}
      </div>
      {(function () {
        if (selectedUserId) {
          const user = users.find((user) => user.userID === selectedUserId)
          if (user) {
            return (
              <MessagePanel
                className={styles['right-panel']}
                user={user}
                onMessage={onMessage}
              />
            )
          }
        }
        return null
      })()}
    </>
  )
}
