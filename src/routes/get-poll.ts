import { FastifyInstance } from "fastify"
import { z } from 'zod'
import { prisma } from "../lib/prisma"
import { redis } from "../lib/redis"

export async function getPoll(app: FastifyInstance) {
  app.get("/polls/:pollId", async (req, rep) => {
    const getPollParams = z.object({
      pollId: z.string().uuid()
    })
    const { pollId } = getPollParams.parse(req.params)
  
    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
      include: {
        options: {
          select: {
            id: true,
            title: true,
          }
        }
      }
    })

    if (!poll) return rep.status(400).send({ message: "poll not found" })

    const result = await redis.zrange(pollId, 0, -1, "WITHSCORES")
    // ['26b0b181-b99c-4887-ab77-c452a00212af', '0']
    // { id: 3 }
    const votes = result.reduce((obj, row, i) => {
      if (i % 2 === 0) {
        const score = result[i + 1]
        // merges 2 objects
        Object.assign(obj, { [row]: Number(score) })
      }
      return obj
    }, {} as Record<string, number>)

    return rep.send({
      poll: {
        id: poll.id,
        title: poll.title,
        options: poll.options.map(opt => {
          return {
            id: opt.id,
            title: opt.title,
            score: (opt.id in votes) ? votes[opt.id] : 0
          }
        })
      }
    })
  })
}