# Aphrodite Web App

### Built using Javascript, Bundled using Webpack.

Written on VSCode Linux. Commands below are BASH and can be run in a VSCode Terminal.

## Prerequisites
NodeJs 16
```
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt-get install -y nodejs
```


## Installation
- [Setup Firebase CLI and Initialize Project](https://firebase.google.com/docs/cli#install-cli-mac-linux)

Clone the Repo (private) and install
```
git clone https://github.com/DanielMoore4875/AphroditeWebApp
cd AphroditeWebApp
npm install
```

Make sure webpack is installed
```
npm i webpack webpack-cli -D
npm install webpack-node-externals
```

Install Firebase CLI (for hosting the app)
```
npm install -g firebase-tools
```

## Configuration
Using webpack to bundle code
- [Webpack Config](https://webpack.js.org/configuration/)

Look at the `webpack.config.js` file to understand config options in this project.

## Bundle and Send
Run to create a bundle.js file that will be placed into public folder
```
npm run build
```

Run to deploy files in public directory to Firebase Hosting (after configuring it)
```
firebase deploy
```

## Development
Needs to be run whenever changes are made (mostly changes made to index.js)
```
npm run build
```

Helpful to use Live Server in VSCode to run a local version of the code before pushing it to Firebase

- [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer)

