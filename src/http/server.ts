import cookie from "@fastify/cookie";
import fastify from "fastify";
import { createPoll } from "../routes/create-poll";
import { getPoll } from "../routes/get-poll";
import { voteOnPoll } from "../routes/vote-on-poll";

const app = fastify()

app.register(cookie, {
  secret: "i-seek-for-my-little-secret",
  hook: 'onRequest',
})

app.register(createPoll)
app.register(getPoll)
app.register(voteOnPoll)

app
.listen({ port: 3333 })
.then(() => console.log("HTTP server running on port http://localhost:3333/"))