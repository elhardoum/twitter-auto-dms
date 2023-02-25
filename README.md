# Twitter Auto DMs

Send automated messages (DMs) to your new Twitter followers

![Imgur Image](https://i.imgur.com/71UgxiP.jpg)

## Running the app

Copy `.env.sample` to `.env` and add your environment variables.

The project uses mongodb for persisting data. You're expected to provide a mongodb connection string via the `MONGODB_URI` environment variable. You may use mongodb atlas for a free cloud database instance, or skip to the docker instructions if you don't wish to install mongodb and/or the app.

First, install the app dependencies, if not done already

```sh
npm install
```

Then, you may run the app any of the following modes:

```sh
# development
npm run start

# watch mode
npm run start:dev

# production mode
npm run start:prod
```

### Run with Docker

The public docker image makes it easy to run an instance of the app as it also comes with a running self-hosted mongodb instance.

You're expected to pass any required environment variables to the image while running a container. Please make sure not to pass `MONGODB_URI` in order to use the self-hosted mongodb instance.

```sh
# pass environment variables inline
docker run --rm -p 3000:80 \
  -e COOKIE_SECRET=some-very-secret-value \
  -e TWITTER_API_KEY=your_api_key \
  -e TWITTER_API_KEY_SECRET=your_api_secret \
  elhardoum/twitter-auto-dms:latest
```

Or use a `.env` file for passing the environment variables:

```sh
# pass environment variables via a file
docker run --rm -p 3000:80 --env-file .env elhardoum/twitter-auto-dms:latest
```

Finally, to persist mongodb data to your local machine, you can use a volume:

```sh
# first, make a data storage folder if not done previously
mkdir -p data/db

# next, mount it to the existing volume
docker run --rm -p 3000:80 \
  -e COOKIE_SECRET=some-very-secret-value \
  -e TWITTER_API_KEY=your_api_key \
  -e TWITTER_API_KEY_SECRET=your_api_secret \
  -v $(pwd)/data/db:/data/db \
  elhardoum/twitter-auto-dms:latest
```

The app should briefly be running at `http://127.0.0.1:3000`. Once everything works, you may consider running the app in detached mode via `docker run -d ...`, and/or restart on errors `--restart always` (without passing the `--rm` flag).

## Test

```sh
# unit tests
npm run test

# e2e tests
npm run test:e2e

# test coverage
npm run test:cov
```

## Todo

- [x] base functionality
- [x] unit tests
- [ ] documentation
- [x] docker deployment
- [ ] fix safari cookies issue
