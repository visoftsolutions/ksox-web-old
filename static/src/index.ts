import Fastify from "fastify";
import trapsPluginCallback from "@dnlup/fastify-traps";
import fastifyStatic from "@fastify/static";

// Allow for dynamic port and host
const PORT = parseInt(process.env.PORT ?? "3000");
const HOST = process.env.HOST ?? "0.0.0.0";

const start = async () => {
  // Create the fastify server
  // https://www.fastify.io/docs/latest/Guides/Getting-Started/
  const fastify = Fastify({
    logger: true,
  });

  await fastify.register(trapsPluginCallback);

  await fastify.register(fastifyStatic, {
    root: "/public",
  });

  // Start the fastify server
  await fastify.listen({ port: PORT, host: HOST });
};

start();
