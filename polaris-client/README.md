# Polaris Client

A simple Next.js application that enables the user to communicate with any Polaris Container with optional encrypted communication enabled.

This application can be used as a reference how to implement encrypted communication and to explore the format of the encrypted HTTP requests and responses. More details on the encryption protocol can be found in the [Polaris documentation](https://docs.fr0ntierx.com/polaris-proxy/encryption).

This application can be used with any Polaris Container by providing a valid request endpoint and optionally enabling encryption.

## Running the Polaris Client

To run the Polaris Client locally, you can use the following commands:

```bash
yarn install

yarn dev
```

You can then immediately start doing requests towards a demo Polaris Container deployed with the [Anonymization Service](../anonymization-service/).

## Encrypted Communication

The Polaris Client is able to handle encrypted communication with Polaris Conainers using axios helpers from the [Polaris SDK](https://docs.fr0ntierx.com/polaris-sdk/#http-request-helpers). Setting up the an axios client with the request and response interceptores is straightforward:

```javascript
const polarisSDK = new PolarisSDK(new EphemeralKeyHandler());

const client = axios.create({
  baseURL: new URL(requestUrl).origin,
  headers: {
    "Content-Type": "application/json",
  },
});

if (enableEncryption) {
  client.interceptors.request.use(createAxiosRequestInterceptor({ polarisSDK }));
  client.interceptors.response.use(createAxiosResponseInterceptor({ polarisSDK }));
}
```

You can find a full example implementation in the [useContainerClient hook](./app/hooks/useContainerClient.tsx).
