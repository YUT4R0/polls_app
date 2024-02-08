import { FastifyInstance } from "fastify"
import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import { prisma } from "../lib/prisma"
import { redis } from "../lib/redis"

export async function voteOnPoll(app: FastifyInstance) {
  app.post("/polls/:pollId/votes", async (req, rep) => {
    const voteOnPollBody = z.object({
      pollOptionId: z.string().uuid()
    })
    const voteOnPollParams = z.object({
      pollId: z.string().uuid(),
    })
    
    const { pollOptionId } = voteOnPollBody.parse(req.body)
    const { pollId } = voteOnPollParams.parse(req.params)

    let { sessionId } = req.cookies
    /* verifies if user has already voted */
    if (sessionId) {
      const userPreviousVoteOnPoll = await prisma.vote.findUnique({
        where: {
          sessionId_pollId: {
            sessionId,
            pollId
          }
        }
      })
      /* deletes previous vote if user votes on a diff poll option */
      if (userPreviousVoteOnPoll && userPreviousVoteOnPoll.pollOptionId !== pollOptionId) {
        await prisma.vote.delete({
          where: {
            id: userPreviousVoteOnPoll.id
          }
        })
        await redis.zincrby(pollId, -1, userPreviousVoteOnPoll.pollOptionId)
      } else if (userPreviousVoteOnPoll) {
        return rep.status(400).send({ message: "this user has already voted on this poll" })
      }
    }    
    /* identifies specific user based on signed cookie */
    if (!sessionId) {
      sessionId = randomUUID()
      rep.setCookie("sessionId", sessionId, {
        path: "/",
        maxAge: 60 * 60 * 24 * 30, // 30 days
        signed: true,
        httpOnly: true
      })
    }
    
    await prisma.vote.create({
      data: {
        sessionId,
        pollId,
        pollOptionId,
      }
    })

    await redis.zincrby(pollId, 1, pollOptionId)

    return rep.status(201).send()
  })
}