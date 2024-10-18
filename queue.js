import http from 'k6/http';
import { Gauge } from 'k6/metrics';

const queue_submitted = new Gauge('queue_submitted');
const queue_correct = new Gauge('queue_correct');
const queue_judging = new Gauge('queue_judging');
const queue_queued = new Gauge('queue_queued');

export const options = {
    stages: [
        { duration: '3s', target: 1 },
        { duration: '60m', target: 1 },
    ]
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:12345';

function captureQueueMetric() {
    const submissionsPage = http.get(`${BASE_URL}/jury/submissions?view=all`, {
        headers: {
            "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
            "accept-language": "en-US,en;q=0.9,ru;q=0.8",
            "cache-control": "max-age=0",
            "sec-ch-ua": "\" Not A;Brand\";v=\"99\", \"Chromium\";v=\"101\", \"Google Chrome\";v=\"101\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"Linux\"",
            "sec-fetch-dest": "document",
            "sec-fetch-mode": "navigate",
            "sec-fetch-site": "same-origin",
            "sec-fetch-user": "?1",
            "upgrade-insecure-requests": "1",
            "cookie": "domjudge_refresh=1; domjudge_submissionsfilter=%7B%7D; domjudge_refresh=1; domjudge_scorefilter=%5B%5D; PHPSESSID=h30j6cq6433k7qkab6ha2jlknu; domjudge_submissionview=0",
            "Referer": "https://test.indiaicpc.in/jury/judgehosts",
            "Referrer-Policy": "same-origin"
        }
    });
    const submitted = submissionsPage.html().find('body > div > div > div > div:nth-child(4) > div > span.badge.badge-info').text().split(' ')[0];
    const correct = submissionsPage.html().find('body > div > div > div > div:nth-child(4) > div > span.badge.badge-success').text().split(' ')[0];
    const judgingElem = submissionsPage.html().find('body > div > div > div > div:nth-child(4) > div > span.badge.badge-primary');
    const queuedElem = submissionsPage.html().find('body > div > div > div > div:nth-child(4) > div > span.badge.badge-danger');

    let judging = 0;
    if (judgingElem) {
        judging = judgingElem.text().split(' ')[0];
    }

    let queued = 0;
    if (queuedElem) {
        queued = queuedElem.text().split(' ')[0];
    }

    console.log(submitted, correct, judging, queued);

    queue_submitted.add(Number(submitted));
    queue_correct.add(Number(correct));
    queue_judging.add(Number(judging));
    queue_queued.add(Number(queued));
}

// Main scenario
export default function () {
  setInterval(() => {
    captureQueueMetric();
  }, 5000);
}

