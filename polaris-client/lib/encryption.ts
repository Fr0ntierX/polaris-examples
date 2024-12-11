import axios from "axios";
import { RSAEncryptionService } from "./RSAEncryptionService";
import { Buffer } from "buffer";

// Fetch the container's public key
const getContainerPublicKey = async (containerUrl: string): Promise<string> => {
  try {
    const url = new URL(containerUrl);

    const response = await axios.get(`${url.origin}/secure-container/properties`);
    return response.data.publicKey;
  } catch (error: any) {
    throw new Error(`Failed to fetch container properties: ${error.message}`);
  }
};

// Encrypt the data
const encryptData = async (data: string, publicKey: string): Promise<Buffer> => {
  const { encryptedData } = await RSAEncryptionService.encrypt({
    data: Buffer.from(data),
    publicKey,
  });
  return encryptedData;
};

export const encryptDataForContainer = async (data: string, containerUrl: string): Promise<Buffer> => {
  try {
    const publicKey = await getContainerPublicKey(containerUrl);
    const encryptedData = await encryptData(data, publicKey);
    return encryptedData;
  } catch (error: any) {
    throw new Error(`Failed to encrypt data: ${error.message}`);
  }
};
