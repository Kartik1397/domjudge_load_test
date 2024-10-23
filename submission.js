import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { FormData } from 'https://jslib.k6.io/formdata/0.0.2/index.js';

const java = open('bodies/test-hello.java', 'b');
const c = open('bodies/test-hello.c', 'b');
const cpp = open('bodies/firework.cpp', 'cpp');

export const options = {
    stages: [
        { duration: '1s', target: 1 },
        { duration: '1m', target: 500 },
        { duration: '5m', target: 500 },
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

function submitSolution(langId, file) {
    const submitPage = http.get(`${BASE_URL}/team/submit`);
    const csrfToken = submitPage.html().find('input[name="submit_problem[_token]"]').attr('value');
    const problemId = submitPage.body.match(/<option value="([^"]*)">E - /)[1];

    const fd = new FormData();
    fd.append('submit_problem[_token]', csrfToken);
    fd.append('submit_problem[problem]', problemId);
    fd.append('submit_problem[language]', langId);
    fd.append('submit_problem[code][]', http.file(file, `${langId}.${langId}`, 'text/plain'));
    fd.append('submit', '');

    const submitRes = http.post(
        `${BASE_URL}/team/submit`,
        fd.body(),
        {
            headers: { 'Content-Type': 'multipart/form-data; boundary=' + fd.boundary },
        }
    );

    check(submitRes, {
        'Submit solution success': (r) => r.status === 200,
    });
}

// Main scenario
export default function () {
    const username = generateUser();
    const password = username; // For simplicity, using the same value for password

    group('Submit solution simulation', function () {
        login(username, password);
        sleep(60);
        setInterval(() => {
            submitSolution('cpp', cpp);
        }, 60000);
    });
}

