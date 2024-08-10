import { FormEvent, useState } from 'react'
import { UserType } from '@/types'
import styles from './message-panel.module.css'
import StatusIcon from './status-icon'

export default function MessagePanel({
  className,
  user,
  onMessage,
}: {
  className: string
  user: UserType
  onMessage: (user: UserType, content: string) => void
}) {
  const [content, setContent] = useState('')
  const wetherToDisplaySender = (index: number): boolean =>
    index === 0 ||
    user.messages[index - 1].fromSelf !== user.messages[index].fromSelf

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    onMessage(user, content)
    setContent('')
  }

  return (
    <div className={className}>
      <div className={styles.header}>
        <StatusIcon connected={user.connected} />
        {user.username}
      </div>

      <ul className={styles.messages}>
        {user.messages.map((message, index) => (
          <li className={styles.message} key={index}>
            {wetherToDisplaySender(index) && (
              <div className={styles.sender}>
                {message.fromSelf ? '(yourself)' : user.username}
              </div>
            )}
            {message.content}
          </li>
        ))}
      </ul>

      <form className={styles.form} onSubmit={handleSubmit}>
        <textarea
          className={styles.input}
          placeholder="Your message..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <button className={styles['send-button']} disabled={content.length < 0}>
          Send
        </button>
      </form>
    </div>
  )
}
