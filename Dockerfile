FROM node:16-alpine

WORKDIR /usr/src/app

COPY . .

RUN npm install

RUN npm run build

# map your host port to 80 via -p 1234:80
ENV HTTP_PORT=80
EXPOSE 80

# install mongodb server
RUN echo 'http://dl-cdn.alpinelinux.org/alpine/v3.9/main' >> /etc/apk/repositories
RUN echo 'http://dl-cdn.alpinelinux.org/alpine/v3.9/community' >> /etc/apk/repositories
RUN apk update && apk add mongodb yaml-cpp=0.6.2-r2 busybox-extras

# mongodb volume
RUN mkdir -p /data/db
VOLUME /data/db

# assert mongodb connection is running
HEALTHCHECK --interval=30s --timeout=3s \
  CMD echo -n |telnet 0.0.0.0 27017 2>/dev/null || exit 1

ENV MONGODB_DBNAME=twitter-dms
ENV MONGODB_URI="mongodb://0.0.0.0:27017/twitter-dms?retryWrites=true&w=majority"

ENTRYPOINT ["sh", "-c", "mongod --fork --logpath /var/log/mongod.log && npm run start:prod"]
