import { IncomingMessage, ServerResponse } from 'node:http';
import { Socket } from 'node:net';
import { app } from '../src/backend/server.js';

export interface MockResponse {
  status: number;
  headers: Record<string, string | string[]>;
  body: any;
  text: string;
}

export function dispatchRequest(
  method: string,
  url: string,
  body?: any,
  customHeaders: Record<string, string> = {}
): Promise<MockResponse> {
  return new Promise((resolve, reject) => {
    const socket = new Socket();
    const req = new IncomingMessage(socket);

    req.method = method.toUpperCase();
    req.url = url;

    const payload = body ? JSON.stringify(body) : '';
    req.headers = {
      host: 'localhost',
      'content-type': 'application/json',
      'content-length': String(Buffer.byteLength(payload)),
      ...customHeaders,
    };

    const res = new ServerResponse(req);
    let responseBody = '';
    const headers: Record<string, string | string[]> = {};

    res.write = function (chunk: any) {
      if (chunk) {
        responseBody += chunk.toString();
      }
      return true;
    };

    res.end = function (chunk: any) {
      if (chunk) {
        responseBody += chunk.toString();
      }

      const rawHeaders = res.getHeaders();
      for (const [key, val] of Object.entries(rawHeaders)) {
        if (val !== undefined) headers[key] = val as any;
      }

      let parsedBody: any = responseBody;
      try {
        parsedBody = JSON.parse(responseBody);
      } catch {
        parsedBody = responseBody;
      }

      resolve({
        status: res.statusCode,
        headers,
        body: parsedBody,
        text: responseBody,
      });
      return this;
    };

    // Forward to Express application
    app(req, res);

    // Push request body into incoming stream
    if (payload) {
      req.push(payload);
    }
    req.push(null);
  });
}
