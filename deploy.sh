#!/bin/bash

set -e

echo "===> Moving to project folder"
cd /root/RiderMeter

echo "===> Pulling latest code from GitHub"
git pull origin main

echo "===> Installing dependencies"
npm install

echo "===> Building app"
npm run build

if pm2 describe RiderMeter >/dev/null 2>&1; then
  echo "===> Restarting PM2 process"
  PORT=3000 pm2 restart RiderMeter --update-env
else
  echo "===> Starting PM2 process"
  PORT=3000 pm2 start npm --name RiderMeter -- start
fi

echo "===> Saving PM2 state"
pm2 save

echo "===> Deploy completed successfully"
