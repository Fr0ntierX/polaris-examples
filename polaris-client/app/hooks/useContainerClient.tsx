import { useMemo } from "react";
import axios from "axios";

import {
  createAxiosRequestInterceptor,
  createAxiosResponseInterceptor,
  EphemeralKeyHandler,
  PolarisSDK,
} from "@fr0ntier-x/polaris-sdk";

interface Props {
  requestUrl: string;
  enableEncryption: boolean;
}

const useContainerClient = ({ requestUrl, enableEncryption }: Props) => {
  const polarisSDK = useMemo(() => new PolarisSDK(new EphemeralKeyHandler()), []);

  const axiosClient = useMemo(() => {
    try {
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

      return client;
    } catch (error) {
      return undefined;
    }
  }, [requestUrl, enableEncryption, polarisSDK]);

  return { axiosClient };
};

export default useContainerClient;
