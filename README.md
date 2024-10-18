# k6 run

Install k6 from: https://grafana.com/docs/k6/latest/set-up/install-k6/

```
K6_WEB_DASHBOARD=true k6 run contest.js
```

## InfluxDB Setup (optional)

Install xk6 from: https://grafana.com/docs/k6/latest/results-output/real-time/influxdb/

Create data directory for influxdb

```bash
mkdir -p influxdb/data
mkdir -p influxdb/config
```

Start influxdb docker

```bash
docker run \
    -p 8086:8086 \
    -v "$PWD/influxdb/data:/var/lib/influxdb2" \
    -v "$PWD/influxdb/config:/etc/influxdb2" \
    influxdb:2
```

Open http://localhost:8086 and setup new organisation in influxdb

Start k6

```bash
K6_INFLUXDB_ORGANIZATION="<organisation>" \
K6_INFLUXDB_BUCKET="<bucket>" \
K6_INFLUXDB_TOKEN="***" \
K6_INFLUXDB_ADDR="http://localhost:8086" \
BASE_URL=https://test.indiaicpc.in \
K6_WEB_DASHBOARD=true \
./k6 run submission.js -o xk6-influxdb
```

## Load testing scripts

- contest.js (Simulate user activity during contest)
- login_10000.js (Simulte user login part)
- register_10000.js (Register 10000 new teams/users with gatling_reg_<0-1000> username format)
- submission.js (Solution submission load testing)
- queue.js (Send queue metrics to influxdb)

