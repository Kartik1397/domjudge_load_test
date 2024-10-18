import http from 'k6/http';
import { check, group, sleep } from 'k6';

export const options = {
    stages: [
        { duration: '3s', target: 10 },
        { duration: '1m', target: 400 },
        { duration: '10m', target: 400 },
    ],
    thresholds: {
        http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
    },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:12345';

const headers = {
    'Content-Type': 'application/x-www-form-urlencoded',
};

// Helper functions
function generateUser() {
    return `gatling_reg_${Date.now() % 10000}`;
}

function register(username, password) {
    const regPage = http.get(`${BASE_URL}/register`);

    let csrfToken = regPage.html().find('input[name="user_registration[_token]"]').attr('value');

    const regRes = http.post(`${BASE_URL}/register`, {
        'user_registration[username]': username,
        'user_registration[name]': username,
        'user_registration[teamName]': username,
        'user_registration[plainPassword][first]': password,
        'user_registration[plainPassword][second]': password,
        'user_registration[existingAffiliation]': '1',
        'user_registration[_token]': csrfToken,
    }, { headers });

    let regSuccess = check(regRes, {
        'register success': (r) => r.status === 200,
    });

    if (!regSuccess) {
        console.log(`Registration failed for user: ${username}`);
        return;
    }
}

// Main scenario
export default function () {
    const username = generateUser();
    const password = username; // For simplicity, using the same value for password

    group('Registration simulation', function () {
        register(username, password);
    });
}

// Spectator scenario
export function spectator() {
    http.get(`${BASE_URL}/public/`);
    sleep(30);
}