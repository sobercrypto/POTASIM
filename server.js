require('dotenv').config();
const path = require("path");
const flavors = require("./src/api/flavors");
const fetch = require('node-fetch');

// Require the framework and instantiate it
const fastify = require("fastify")({
  logger: true
});

// Setup our static files
fastify.register(require("fastify-static"), {
  root: path.join(__dirname, "public"),
  prefix: "/" // optional: default '/'
});

// Our home page route
fastify.get("/", function(request, reply) {
  return reply.sendFile("index.html");
});

// Proxy route for Anthropic API
fastify.post("/proxy", async (request, reply) => {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(request.body)
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    fastify.log.error(error);
    reply.code(500).send({ error: 'Failed to fetch from Anthropic API' });
  }
});

fastify.get("/api/flavors", flavors);

// Run the server
fastify.listen({
  port: process.env.PORT || 3000,
  host: '0.0.0.0'
}, function(err, address) {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  fastify.log.info(`server listening on ${address}`);
});
