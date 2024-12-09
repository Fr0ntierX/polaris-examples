# Polaris Examples

This repository contains examples workloads and clients for Polaris.

## Anonymization Service

An example Python server that implements anonymization using the [`scrubadub`](https://scrubadub.readthedocs.io/en/stable/) library. It exposes 2 test endpoints:

- `GET /` - A simple health check endpoint that returns the message "Hello from the Anonymization Service!"
- `POST /anonymize` - An endpoint that takes a JSON payload with a `text` field and returns the anonymized text.

### Running the Anonymization Service

You can run the Annonymization Service locally using the following command:

```bash
pip install -r requirements.txt

uvicorn server:app --host 0.0.0.0 --port 8000
```

### Example Requests

You can make anonymization requests to the server using the `/anonymize` endpoint:

```
curl -X POST http://localhost:8000/anonymize \
-H "Content-Type: application/json" \
-d '{"text": "Hey, my email is john@example.com and you can reach me at 1800 555-1123"}'
```

### Docker Image

You can use the pre-build Docker image [`fr0ntierx/anonymization-service`](https://hub.docker.com/r/fr0ntierx/anonymization-service) from DockerHub if you want to directly dpeloy the anonymization service.

## Polaris Client

A simple Next.js application that enables the user to communicate with any Polaris Container with optional encrypted communication enabled. It can be used as a reference how to implement encrypted communication and to explore the format of the encrypted HTTP requests and responses. More details on the encryption protocol can be found in the [Polaris documentation](https://docs.fr0ntierx.com/polaris-proxy/encryption).
