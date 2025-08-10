FROM eclipse-temurin:21-jre-alpine

WORKDIR /runner

RUN apk add --no-cache curl bash nodejs npm

COPY package*.json /runner/
RUN npm ci --omit=dev

COPY start.sh /runner/start.sh
COPY get_jar.sh /runner/get_jar.sh
COPY worker.js /runner/worker.js
RUN chmod +x /runner/start.sh /runner/get_jar.sh

ENV EULA=TRUE
ENV JOB_QUEUE=mc_jobs
ENV DATA_DIR=/data
ENV SERVERS_DIR=/data/servers
ENV DOWNLOAD_DIR=/data/downloads

RUN mkdir -p /data /data/servers /data/downloads

VOLUME ["/data"]

CMD ["bash", "/runner/start.sh"]
