# 11. Problems Encountered and How We Solved Them

| # | Problem | Cause | Fix |
|---|---|---|---|
| 1 | Jenkins showed plugin dependency errors after "Install suggested plugins" | The setup wizard installed plugins that depend on each other in an order that failed | We baked the plugins into the Jenkins image with jenkins-plugin-cli (git, workflow-aggregator, docker-workflow, credentials-binding, plain-credentials, timestamper) and chose "None" in the setup wizard |
| 2 | The database schema could break when Jenkins deployed | The compose file bind-mounted ./db/init.sql. Under Jenkins, the path is resolved by the host's Docker, not inside the Jenkins container, so the file may not be found | We added db/Dockerfile, which copies init.sql into the image. No bind mount is needed |
| 3 | Pipeline could not find the secret file | Credential ID typos: ".env" and "nufindit-env." instead of "nufindit-env" | We corrected the ID in the Jenkins credential edit dialog so it matches the Jenkinsfile exactly |
| 4 | Deploy failed in builds #1 and #2 with a container name conflict | A leftover container from a manual run was still using the name | We removed the stack with docker compose -p nufindit-devops down (never -v, so data stays) and ran the build again |
| 5 | Smoke Test failed with "Connection refused" in builds #3 to #5 | wget inside the proxy container resolved localhost to the IPv6 address, but nginx listens on IPv4 only | We changed the smoke test to use 127.0.0.1 |
| 6 | auth-api and items-api went into restart loops | The code and Dockerfiles of the two APIs were mixed up (wrong ports and files in the wrong folders) | We rewrote the files in each folder and checked every file against its folder |
| 7 | Build #19 hung for almost 9 hours | The laptop went to sleep during the build | We aborted the build and ran it again (#20 passed). We now turn off Windows sleep before demos |
| 8 | Build #21 failed at Deploy with "removal of container ... already in progress" | A race condition: Docker was still removing the old container when Compose tried to recreate it | We added a one-time retry (after 10 seconds) to the Deploy stage. Build #22 passed |
| 9 | Files pasted into the VS Code editor were empty | The editor paste did not keep the content | We write files from the terminal with @'...'@ piped into Set-Content and verify them with Get-ChildItem |

## Lessons learned
- Keep configuration inside images (db/Dockerfile, proxy/Dockerfile) so deployments do not depend on host paths.
- A test of the real deployment path (the smoke test through the proxy) finds problems that unit tests cannot.
- Always pass the project name (-p nufindit-devops) and never use down -v, to protect the db-data volume.
- Pipeline credentials must match the Jenkinsfile exactly, character for character.

## Known limitations
- The trigger is Poll SCM (up to about 2 minutes of delay) instead of a webhook, because Jenkins runs on a laptop and we did not set up a public tunnel such as ngrok.
- Jenkins uses the Docker socket and runs as root. This is acceptable for a lab only (Section 7.8).
- The db image has no build tag, so a rollback changes the application services but not the db image.
- Tags such as node:20-alpine and jenkins:lts-jdk17 follow a release channel, not an exact version.

