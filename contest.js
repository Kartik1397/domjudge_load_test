import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { randomString } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';
import { FormData } from 'https://jslib.k6.io/formdata/0.0.2/index.js';

const java = open('bodies/test-hello.java', 'b');
const c = open('bodies/test-hello.c', 'b');

export const options = {
    stages: [
        { duration: '3s', target: 10 },
        { duration: '30s', target: 10 },
        { duration: '2m', target: 10 },
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
    return `gatling${randomString(5)}`;
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

function submitSolution(langId, file) {
    const submitPage = http.get(`${BASE_URL}/team/submit`);
    const csrfToken = submitPage.html().find('input[name="submit_problem[_token]"]').attr('value');
    const problemId = submitPage.body.match(/<option value="([^"]*)">A - /)[1];

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

function requestClarification(username) {
    const clarPage = http.get(`${BASE_URL}/team/clarifications/add`);
    const csrfToken = clarPage.html().find('input[name="team_clarification[_token]"]').attr('value');
    const subjectId = clarPage.body.match(/<option value="([^"]*-general)">General/)[1];

    const clarificationRes = http.post(`${BASE_URL}/team/clarifications/add`, {
        'team_clarification[recipient]': 'dummy',
        'team_clarification[subject]': subjectId,
        'team_clarification[message]': `${username} needs help`,
        'team_clarification[_token]': csrfToken,
        'submit': '',
    });

    check(clarificationRes, {
        'Request clarification success': (r) => r.status === 200,
    });
}

// Main scenario
export default function () {
    const username = generateUser();
    const password = username; // For simplicity, using the same value for password

    group('Contest simulation', function () {
        register(username, password);

        login(username, password);
        sleep(2);

        const res = http.get(`${BASE_URL}/team/`);
        sleep(5);

        submitSolution('java', java);
        sleep(10);

        http.get(`${BASE_URL}/team/scoreboard`);
        sleep(10);

        http.get(`${BASE_URL}/team/team/${username}`);
        sleep(5);

        requestClarification(username);
        sleep(6);

        submitSolution('c', c);
        sleep(15);

        http.get(`${BASE_URL}/team/scoreboard`);
    });
}

// Spectator scenario
export function spectator() {
    http.get(`${BASE_URL}/public/`);
    sleep(30);
}
