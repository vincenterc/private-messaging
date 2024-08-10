import { FormEvent, useState } from 'react'

import styles from './select-username.module.css'

export default function SelectUsername({
  onSelectUsername,
}: {
  onSelectUsername: (username: string) => void
}) {
  const [username, setUserName] = useState('')

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    onSelectUsername(username)
  }

  return (
    <div className={styles['select-username']}>
      <form onSubmit={handleSubmit}>
        <input
          placeholder="Your username..."
          value={username}
          onChange={(e) => setUserName(e.target.value)}
        />
        <button disabled={username.length <= 2}>Send</button>
      </form>
    </div>
  )
}
