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

echo "===> Restarting PM2 process"
pm2 restart RiderMeter

echo "===> Saving PM2 state"
pm2 save

echo "===> Deploy completed successfully"
