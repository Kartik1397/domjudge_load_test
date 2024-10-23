import http from 'k6/http';
import { check, group, sleep } from 'k6';

export const options = {
    stages: [
        { duration: '3s', target: 10 },
        { duration: '2m', target: 5000 },
        { duration: '10m', target: 5000 },
    ],
    thresholds: {
        http_req_duration: ['p(95)<1000'], // 95% of requests should be below 500ms
    },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:12345';

const headers = {
    'Content-Type': 'application/x-www-form-urlencoded',
};

// Helper functions
function generateUser() {
    return `gatling_reg_${Date.now() % 4000}`
}

// User actions
function login(username, password) {
    let res = http.get(`${BASE_URL}/login`);

    check(res, {
        'login page retrieved': (r) => r.status === 200,
    });

    let csrfToken = res.html().find('input[name="_csrf_token"]').attr('value');

    check(csrfToken, {
        'CSRF token found': (token) => token !== '',
    });

    let loginPayload = {
        _username: username,
        _password: password,
        _csrf_token: csrfToken,
    };

    let loginRes = http.post(`${BASE_URL}/login`, loginPayload, { headers });

    let loginSuccess = check(loginRes, {
        'login success': (r) => r.status === 200,
    });

    if (!loginSuccess) {
        console.log(`Login failed for user: ${username}`);
        return;
    }
}

function teamPage() {
    const res = http.get(`${BASE_URL}/team/`);
    check(res, {
        'Team page successful': (r) => r.status === 200,
    });
}

// Main scenario
export default function () {
    const username = generateUser();
    const password = username; // For simplicity, using the same value for password

    group('Login simulation', function () {
        login(username, password);

        sleep(120);
        teamPage();

        sleep(120);
        teamPage();

        sleep(120);
        teamPage();

        sleep(120);
        teamPage();

        sleep(120);
        teamPage();

        sleep(120);
        teamPage();
    });
}

