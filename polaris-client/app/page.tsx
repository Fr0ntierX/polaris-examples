"use client";

import { useCallback, useState } from "react";
import Loader from "./components/Loader";

import useContainerClient from "./hooks/useContainerClient";

export default function Home() {
  // Request state
  const [enableEncryption, setEnableEncryption] = useState(true);
  const [requestUrl, setRequestUrl] = useState("http://35.238.1.96:3000/anonymize");
  const [requestBody, setRequestBody] = useState(
    '{\n  "text": "Hey, my email is john@example.com and you can reach me at 1800 555-1123"\n}'
  );

  // Response state
  const [response, setResponse] = useState("");
  const [responseStatus, setResponseStatus] = useState("");
  const [loading, setLoading] = useState(false);

  // The axios client
  const { axiosClient } = useContainerClient({ requestUrl, enableEncryption });

  // Handle the request
  const handleRequest = useCallback(async () => {
    if (!axiosClient) return;

    setLoading(true);
    setResponseStatus("");
    setResponse("");

    try {
      const { status, statusText, data } = await axiosClient.post(requestUrl, requestBody);
      const parsedData = Buffer.isBuffer(data) ? data.toString() : JSON.stringify(data);

      setResponseStatus(String(status));

      if (parsedData) {
        setResponse(parsedData);
      } else {
        setResponse(statusText);
      }
    } catch (error) {
      console.error("Error communicating with the Polaris container", error);
      setResponse(`Error communicating with the Polaris container ${error}`);
    }

    setLoading(false);
  }, [axiosClient, requestBody, requestUrl]);

  return (
    <div className="p-8 flex flex-col items-center justify-center max-w-[600px] mx-auto space-y-8">
      <div className="space-y-4">
        <h1 className="text-center text-2xl font-bold">Polaris Client</h1>
        <p className="">
          This is a sample application for encrypted or unencrypted communication with Polaris containers. The default
          request is configured for the Fr0ntierX demo Anonymization Service.
        </p>
      </div>

      <div className="w-full space-y-2">
        <h2 className="text-md font-bold">Request Parameters</h2>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="enableEncryption"
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            onChange={(e) => setEnableEncryption(e.target.checked)}
            checked={enableEncryption}
          />
          <label htmlFor="enableEncryption" className="text-xs font-bold text-gray-700">
            Enable Encryption
          </label>
        </div>

        <div className="flex flex-col">
          <label htmlFor="requestUrl" className="text-xs font-bold text-gray-700">
            URL:
          </label>
          <input
            type="text"
            id="requestUrl"
            className="flex-grow p-2 border border-gray-300 rounded-md text-sm"
            placeholder="Enter server URL"
            value={requestUrl}
            onChange={(e) => setRequestUrl(e.target.value)}
          />
        </div>

        <div className="flex flex-col">
          <label htmlFor="requestBody" className="text-xs font-bold text-gray-700">
            Body:
          </label>

          <textarea
            id="requestBody"
            className="w-full text-sm p-2 border border-gray-300 rounded-md h-32 font-mono"
            onChange={(e) => setRequestBody(e.target.value)}
            value={requestBody}
          ></textarea>
        </div>
      </div>

      <div className="w-full space-y-1">
        <h2 className="text-md font-bold">Response</h2>

        <div className="flex space-x-2 items-center">
          <div className="text-sm">Status:</div>
          <div className="font-bold">{responseStatus}</div>
        </div>

        <div className="relative">
          <textarea
            className="w-full text-sm p-2 border border-gray-300 rounded-md h-32 font-mono"
            readOnly
            value={response}
          ></textarea>
          <div className="absolute right-1/2 top-1/2 my-[-10px]">{loading && <Loader />}</div>
        </div>
      </div>

      <button
        className="w-full py-2 px-4 bg-gray-200 text-gray-800 hover:bg-gray-300 rounded disabled:text-gray-400 disabled:bg-gray-100 flex justify-center items-center gap-x-3"
        onClick={handleRequest}
        disabled={!axiosClient || loading}
      >
        Submit Request
      </button>
    </div>
  );
}
