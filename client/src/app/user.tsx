import { UserType } from '@/types'
import styles from './user.module.css'
import StatusIcon from './status-icon'

export default function User({
  user,
  selected,
  onSelectUser,
}: {
  user: UserType
  selected: boolean
  onSelectUser: () => void
}) {
  return (
    <div
      className={`${styles.user} ${selected ? styles.selected : ''}`}
      onClick={onSelectUser}
    >
      <div className={styles.description}>
        <div>
          {user.username} {user.self ? ' (yourself)' : ''}
        </div>
        <div className={styles.status}>
          <StatusIcon connected={user.connected} />
          {user.connected ? 'online' : 'offline'}
        </div>
      </div>
      {user.hasNewMessages && <div className={styles['new-messages']}>!</div>}
    </div>
  )
}
