import cookie from "@fastify/cookie";
import fastifyWebsocket from "@fastify/websocket";
import fastify from "fastify";
import { createPoll } from "../routes/create-poll";
import { getPoll } from "../routes/get-poll";
import { voteOnPoll } from "../routes/vote-on-poll";
import { pollResult } from "../ws/poll-results";

const app = fastify()

app.register(cookie, {
  secret: "i-seek-for-my-little-secret",
  hook: 'onRequest',
})

app.register(createPoll)
app.register(getPoll)
app.register(voteOnPoll)

app.register(fastifyWebsocket)
app.register(pollResult)

app
.listen({ port: 3333 })
.then(() => console.log("HTTP server running on port http://localhost:3333/"))