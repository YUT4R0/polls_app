import { PrismaClient } from '@prisma/client'
import Fastify from "fastify"
import { z } from 'zod'

const app = Fastify()
const prisma = new PrismaClient()

app.post("/polls", async (req, rep) => {
  const createPollBody = z.object({
    title: z.string()
  })
  const { title } = createPollBody.parse(req.body)

  const poll = await prisma.poll.create({
    data: { title: title }
  })

  return rep.status(201).send({
    pollId: poll.id
  })
})

app
.listen({ port: 3333 })
.then(() => console.log("HTTP server running on port http://localhost:3333/"))