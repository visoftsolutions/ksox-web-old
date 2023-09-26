import { serverAuth$ } from "@builder.io/qwik-auth";
import Credentials from "@auth/core/providers/credentials";
import type { Provider } from "@auth/core/providers";

export const { onRequest, useAuthSession, useAuthSignin, useAuthSignout } = serverAuth$(({ env }) => ({
  secret: env.get("AUTH_SECRET"),
  trustHost: true,
  providers: [
    Credentials({
      id: "ethereum",
      name: "Ethereum",
      type: "credentials",
      credentials: {
        message: {
          label: "Message",
          type: "text",
          placeholder: "0x0",
          hidden: true,
          value: "0xFFFF",
        },
        signature: {
          label: "Signature",
          type: "text",
          placeholder: "0x0",
          hidden: true,
          value: "0xFF",
        },
      },
      async authorize(credentials, request) {
        console.log(credentials);
        console.log(await request.text());
        const user = {
          id: "1",
        };
        return user;
      },
    }),
  ] as Provider[],
}));
