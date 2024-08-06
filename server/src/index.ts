import { createServer } from 'http'

const server = createServer()
const PORT = process.env.PORT || 3000

server.listen(PORT, () =>
  console.log(`server listening at http://localhost:${PORT}`),
)
