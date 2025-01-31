import { NextRequest, NextResponse } from "next/server";
import { EphemeralKeyHandler, PolarisSDK } from "@fr0ntier-x/polaris-sdk";

export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const requestUrl = req.nextUrl.searchParams.get("url");

    const response = await fetch(
      `${requestUrl}/polaris-container/attestationToken`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.statusText}`);
    }

    const { attestation_token } = await response.json();

    const polarisSK = new PolarisSDK(new EphemeralKeyHandler());
    const isValid = await polarisSK.verifyAttestationToken(attestation_token);

    return NextResponse.json({
      message: isValid
        ? "The container TEE is valid"
        : "The container TEE is invalid",
    });
  } catch (error: any) {
    console.error("Error:", error);
    return NextResponse.json(
      { message: "Error fetching or verifying token", error: error.message },
      { status: 500 }
    );
  }
}
