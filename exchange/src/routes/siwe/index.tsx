import { component$ } from "@builder.io/qwik";
import { type DocumentHead, server$, useLocation, type RouteLocation, Form } from "@builder.io/qwik-city";
import { generateNonce, SiweMessage } from "siwe";
import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { createClient } from "redis";
import uuid from "uuid";
import { useAuthSignin } from "../plugin@auth";

const setNonceCookie = server$(async () => {
  const nonce = generateNonce();
  const id = uuid.v4();
  const redisClient = await createClient({
    url: process.env.REDIS_URL ?? "redis://localhost/",
  })
    .on("error", (err) => console.log("Redis Client Error", err))
    .connect();
  redisClient.set(`nonce:${nonce}`, id, { EX: 300 });
  return nonce;
});

const createRedisClient = async () => {
  return await createClient({
    url: process.env.REDIS_URL,
  })
    .on("error", (err) => console.error("Redis Client Error", err))
    .connect();
};

const setupSession = server$(async function (message: string, signature: `0x${string}`) {
  const redisClient = await createRedisClient();
  console.info(`message ${message}`);
  console.info(`signature ${signature}`);

  const siweMessage = new SiweMessage(message);

  try {
    const { data } = await siweMessage.verify({ signature });
    const nonceKey = `nonce:${data.nonce}`;
    const result = await redisClient.getEx(nonceKey, { EX: Number(process.env.SESSION_EXPIRY_SECONDS) });
    if (!result) {
      throw new Error("Nonce not found in session.");
    }
  } catch (error: any) {
    console.error("Failed to set up session", error);

    if (error.message.includes("Nonce not found in session")) {
      return { message: "Invalid nonce." };
    }

    return { message: "Invalid signature." };
  }

  return { message: "Ok" };
});

const signMessage = async (location: RouteLocation) => {
  const privateKey = `0x617272a8812eb1dfb697e32db43191f0475a75aa7f93606f34741f6318cd1cab`;
  const account = privateKeyToAccount(privateKey);
  const wallet = createWalletClient({
    account,
    transport: http("https://mainnet.infura.io/v3/"),
  });
  const nonce = await setNonceCookie();
  console.log(`nonce: ${nonce}`);
  const message = new SiweMessage({
    domain: location.url.host,
    address: account.address,
    statement: "Sign in with Ethereum to the app.",
    uri: location.url.origin,
    version: "1",
    chainId: 1,
    nonce,
  }).prepareMessage();
  const signature = await wallet.signMessage({
    message,
  });
  const response = await setupSession(message, signature);
  console.log(response);
};

const logOnServer = server$((message) => {
  console.log(message);
});

export default component$(() => {
  const location = useLocation();
  const signIn = useAuthSignin();

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* <Form action={signIn}>
        <input type="hidden" name="providerId" value="ethereum" />
        <input type="hidden" name="hello" value="world" />
        <button>Sign In</button>
      </Form> */}
      <button
        onClick$={async () => {
          const privateKey = `0x617272a8812eb1dfb697e32db43191f0475a75aa7f93606f34741f6318cd1cab`;
          const account = privateKeyToAccount(privateKey);
          const wallet = createWalletClient({
            account,
            transport: http("https://mainnet.infura.io/v3/"),
          });
          const nonce = await setNonceCookie();
          console.log(`nonce: ${nonce}`);
          const message = new SiweMessage({
            domain: location.url.host,
            address: account.address,
            statement: "Sign in with Ethereum to the app.",
            uri: location.url.origin,
            version: "1",
            chainId: 1,
            nonce,
          }).prepareMessage();
          const signature = await wallet.signMessage({
            message,
          });
          // const response = await setupSession(message, signature);
          const response = await signIn.submit({ options: { message, signature, redirect: false } });
          console.log(response);
        }}
      >
        Sign In
      </button>
    </div>
  );
});

export const head: DocumentHead = {
  title: "Signin With Ethereum",
};
