# Ocean.js React Native Demo app

Demo React Native app using ocean.js to buy assets

## Prerequisites
- node.js (install from [here](https://nodejs.org/en/download/))
- phone (Android or iOS) with Expo Go installed
- WalletConnect project (create an account & project from [here](https://cloud.walletconnect.com/sign-up))
- Magic Link project (create an account & project from [here](https://dashboard.magic.link/signup))

## Installation

1. Install dependencies
```bash
$ npm install
```

2. Create the `.env` file from the env example file
```bash
$ cp .env.example .env
```

3. Add the necessary env variables

## Usage

1. Run the app
```bash
$ npm start
```

2. Install the Expo app on your phone and scan the QR code

Note: You need to be on the same network in order to connect to the app. If you cannot connect due to some network conditions/firewall rules you can run the app with tunneling:
```bash
$ npm start -- --tunnel
```
