"use client";

import { Buffer } from "buffer";

export interface EncryptionKeyAndIV {
  key: string;
  iv: string;
}

export interface WrapKeyParams {
  /** The key to wrap in base64 format */
  keyToWrap: string;

  /** The public key to wrap the key with */
  publicKey: string;
}

export interface UnwrapKeyParams {
  /** The key to unwrap in base64 format */
  keyToUnwrap: string;
}

export interface GetEncryptedDataHeaderParams {
  /** The encryption key */
  key: Buffer;

  /** The IV */
  iv: Buffer;

  /** The encryption auth tag */
  authTag: Buffer;

  /** The public key to wrap the key and IV with in base64 format */
  publicKey: string;
}

export interface GetEncryptedDataHeaderResult {
  /** Header as string */
  header: string;

  /** Header as buffer */
  headerBuffer: Buffer;
}

export interface ParseEncryptedDataHeaderParams {
  encryptedData: Buffer;
}

export interface ParseEncryptedDataHeaderResult {
  /** The encryption key */
  key: Buffer;

  /** The IV */
  iv: Buffer;

  /** The encryption auth tag */
  authTag: Buffer;

  /** The ciphertext */
  ciphertext: Buffer;
}

export interface EncryptParams {
  /** Data to encrypt */
  data: Buffer;

  /** Public key used to wrap the encryption key with */
  publicKey: string;
}

export interface EncryptResult {
  /** The encrypted data */
  encryptedData: Buffer;
}

export interface DecryptParams extends EncryptResult {
  /** The encryption key and IV to decrypt the data with instead of taking them from the header */
  encryptionKeyAndIV?: EncryptionKeyAndIV;
}

export class RSAEncryptionService {
  /* Ephemeral key pair */
  private keyPair: CryptoKeyPair | undefined = undefined;

  /**
   * Initialize the key service
   */
  async init() {
    this.keyPair = await window.crypto.subtle.generateKey(
      {
        name: "RSA-OAEP",
        modulusLength: 4096,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256",
      },
      true,
      ["encrypt", "decrypt"]
    );
  }

  /**
   * Get the ephimeral public key in PEM format
   *
   * @returns The public key in PEM format
   */
  async getPublicKey(): Promise<string> {
    if (!this.keyPair) throw new Error("Key pair not initialized");

    const exported = await window.crypto.subtle.exportKey("spki", this.keyPair.publicKey);

    const exportedAsString = String.fromCharCode(...new Uint8Array(exported));
    const exportedAsBase64 = btoa(exportedAsString);
    const exportedAsBase64WithNewLines = exportedAsBase64.match(/.{1,64}/g)?.join("\n");
    const pemKey = `-----BEGIN PUBLIC KEY-----\n${exportedAsBase64WithNewLines}\n-----END PUBLIC KEY-----`;

    return pemKey;
  }

  /**
   * Import a public key in PEM format
   *
   * @param pemKey The public key in PEM format
   * @returns The public key as a CryptoKey
   */
  static async importPublicKey(pemKey: string): Promise<CryptoKey> {
    // Remove the PEM header and footer
    const pemHeader = "-----BEGIN PUBLIC KEY-----";
    const pemFooter = "-----END PUBLIC KEY-----";
    const pemContents = pemKey.replace(pemHeader, "").replace(pemFooter, "").replace(/\s+/g, "");

    // Decode the base64 string to an ArrayBuffer
    const binaryDer = Buffer.from(pemContents, "base64");

    // Import the ArrayBuffer as a public key
    return window.crypto.subtle.importKey(
      "spki",
      binaryDer.buffer,
      {
        name: "RSA-OAEP",
        hash: "SHA-256",
      },
      true,
      ["encrypt"]
    );
  }

  /**
   * Wrap a symmetric encryption key with a given public key.
   *
   * PCKS1 padding is used with a sha256 hash.
   *
   * @param keyToWrap The key to wrap in base64 format
   * @param publicKey The public key to wrap the key with
   * @returns The wrapped key in base64 format
   */
  static async wrapKey({ keyToWrap, publicKey }: WrapKeyParams): Promise<string> {
    const publicKeyObject = await RSAEncryptionService.importPublicKey(publicKey);

    // Decode the base64 encoded key to wrap
    const keyToWrapBuffer = Buffer.from(keyToWrap, "base64");

    // Wrap the key using the public key
    const wrappedKey = await window.crypto.subtle.encrypt(
      {
        name: "RSA-OAEP",
      },
      publicKeyObject,
      keyToWrapBuffer
    );

    // Convert the wrapped key to a base64 string
    return Buffer.from(wrappedKey).toString("base64");
  }

  /**
   * Unwrap a symmetric encryption key with the configured private key
   *
   * @param key The key to unwrap in base64 format
   * @returns The unwrapped key in base64 format
   */
  async unwrapKey({ keyToUnwrap }: UnwrapKeyParams): Promise<string> {
    if (!this.keyPair) throw new Error("Key pair not initialized");

    // Decode the base64 encoded wrapped key
    const wrappedKeyBuffer = Buffer.from(keyToUnwrap, "base64");

    // Unwrap the key using the private key
    const unwrappedKey = await window.crypto.subtle.decrypt(
      {
        name: "RSA-OAEP",
      },
      this.keyPair.privateKey,
      wrappedKeyBuffer
    );

    // Convert the unwrapped key to a base64 string
    return Buffer.from(unwrappedKey).toString("base64");
  }

  /**
   * Get the encrypted data header
   *
   * @param key The encryption key
   * @param iv The IV
   * @param authTag The encryption auth tag
   * @param publicKey The public key to wrap the key and IV with in base64 format
   * @returns The encrypted data header and its size
   */
  static async getEncryptedDataHeader({
    key,
    iv,
    authTag,
    publicKey,
  }: GetEncryptedDataHeaderParams): Promise<GetEncryptedDataHeaderResult> {
    // Create the header
    const header = JSON.stringify({
      wrappedKey: await RSAEncryptionService.wrapKey({ keyToWrap: key.toString("base64"), publicKey }),
      wrappedIV: await RSAEncryptionService.wrapKey({ keyToWrap: iv.toString("base64"), publicKey }),
      authTag: authTag.toString("base64"),
    });

    // Get the size of the header
    const headerSizeBuffer = Buffer.alloc(4);
    headerSizeBuffer.writeUInt32BE(Buffer.byteLength(header));

    // Combine the header size and the header
    const headerBuffer = Buffer.concat([headerSizeBuffer, Buffer.from(header)]);

    return {
      header,
      headerBuffer,
    };
  }

  async parseEncryptedDataHeader({
    encryptedData,
  }: ParseEncryptedDataHeaderParams): Promise<ParseEncryptedDataHeaderResult> {
    const headerLength = encryptedData.readUInt32BE(0);
    const { wrappedKey, wrappedIV, authTag } = JSON.parse(encryptedData.subarray(4, headerLength + 4).toString());

    // Unwrap the encryption key and IV
    const key = Buffer.from(await this.unwrapKey({ keyToUnwrap: wrappedKey }), "base64");
    const iv = Buffer.from(await this.unwrapKey({ keyToUnwrap: wrappedIV }), "base64");

    const ciphertext = encryptedData.subarray(headerLength + 4);

    return { key, iv, authTag: Buffer.from(authTag, "base64"), ciphertext };
  }

  /**
   * Encrypt data using AES-256
   *
   * @param data Data to encrypt
   * @param publicKey Public key used to wrap the encryption key with
   *
   * @returns The generated key in base64 format
   */
  static async encrypt({ data, publicKey }: EncryptParams): Promise<EncryptResult> {
    // Generate new AEW encryption key and IV
    const key = await window.crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt"]);
    const iv = window.crypto.getRandomValues(new Uint8Array(12));

    // Encrypt the data
    const encryptedData = await window.crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv,
      },
      key,
      data
    );

    // Split the ciphertext and the auth tag
    const authTag = Buffer.from(encryptedData.slice(encryptedData.byteLength - 16));
    const ciphertext = Buffer.from(encryptedData.slice(0, encryptedData.byteLength - 16));

    // Get the header
    const exportedKey = Buffer.from(await window.crypto.subtle.exportKey("raw", key));

    const { headerBuffer } = await RSAEncryptionService.getEncryptedDataHeader({
      key: exportedKey,
      iv: Buffer.from(iv),
      authTag,
      publicKey,
    });

    return { encryptedData: Buffer.concat([headerBuffer, ciphertext]) };
  }

  /**
   * Decrypt data using AES-256
   *
   * @param data Data to decrypt
   * @param encryptionKey Symmetric encryption key in base64 format
   * @param iv IV in base64 format
   * @param authTag Authentication tag in base64 format
   * @returns The decrypted data
   */
  async decrypt({ encryptedData, encryptionKeyAndIV }: DecryptParams): Promise<Buffer> {
    let key = Buffer.from(encryptionKeyAndIV?.key || "", "base64");
    let iv = Buffer.from(encryptionKeyAndIV?.iv || "", "base64");
    let dataToDecrypt = encryptedData;

    // Parse the header to get the key and IV if not provided
    if (!encryptionKeyAndIV) {
      const parsedHeader = await this.parseEncryptedDataHeader({ encryptedData });
      key = parsedHeader.key;
      iv = parsedHeader.iv;

      dataToDecrypt = Buffer.concat([parsedHeader.ciphertext, parsedHeader.authTag]);
    }

    // Convert the key to a CryptoKey
    const keyObject = await window.crypto.subtle.importKey("raw", key, "AES-GCM", true, ["decrypt"]);

    // Decrypt the data
    const decrypted = await window.crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv,
        tagLength: 128,
      },
      keyObject,
      dataToDecrypt
    );

    return Buffer.from(decrypted);
  }

  /**
   * Encrypt a file with a given public key
   *
   * @param inputFile The file to encrypt
   * @param publicKey The public key to use for encryption
   * @returns The encrypted data as a Blob
   */
  async encryptFile({ inputFile, publicKey }: any): Promise<Blob> {
    const fileReader = new FileReader();
    fileReader.readAsArrayBuffer(inputFile);

    return new Promise((resolve, reject) => {
      fileReader.onload = async (event: any) => {
        const fileData = event.target.result;

        try {
          const encryptedResult = await RSAEncryptionService.encrypt({ data: fileData, publicKey });

          const encryptedBlob = new Blob([encryptedResult.encryptedData], {
            type: "application/octet-stream",
          });

          resolve(encryptedBlob);
        } catch (error) {
          reject(error);
        }
      };

      fileReader.onerror = () => {
        reject(new Error("Error reading input file"));
      };
    });
  }
}
