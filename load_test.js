import http from 'k6/http';
import { sleep, check } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 10 }, // Normal
    { duration: '3m', target: 50 }, // Spike
    { duration: '1m', target: 0 },  // Scale down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests must complete below 2s
    http_req_failed: ['rate<0.02'],    // Error rate < 2%
  },
};

export default function () {
  const responses = http.batch([
    ['GET', 'https://axyntrax-automation-suite.vercel.app/'],
    ['GET', 'https://axyntrax-automation-suite.vercel.app/registro'],
    ['GET', 'https://axyntrax-automation-suite.vercel.app/descargar'],
    ['GET', 'https://axyntrax-automation-suite.vercel.app/faq'],
  ]);

  check(responses[0], {
    'home status is 200': (r) => r.status === 200,
  });

  sleep(1);
}
