# Infrastructure Notes

- Compose project: nufindit-devops, network: nufindit-net (user-defined).
- Only the proxy publishes a port (8080 to 80). The database and APIs are not exposed.
- Services: proxy, frontend, items-api, auth-api, db.
- db uses postgres:16-alpine with the named volume db-data, so data survives restarts.
- Health checks: db (pg_isready) and both APIs (/health).
- depends_on with service_healthy makes the APIs wait for the database.
- Images are tagged nufindit/<service>:${TAG}, where TAG is the Jenkins build number.
