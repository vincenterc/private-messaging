import styles from './status-icon.module.css'

export default function StatusIcon({ connected }: { connected: boolean }) {
  return (
    <i className={`${styles.icon} ${connected ? styles['connected'] : ''}`} />
  )
}
