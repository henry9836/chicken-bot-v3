#!/bin/bash

echo "[+] Updating Package Manager..."
sudo apt-get update

echo "[+] Installing NodeJS-16..."
sudo apt-get install curl 
curl -sL https://deb.nodesource.com/setup_16.x | sudo -E bash - 
sudo apt-get install nodejs npm

echo "[+] Installing Modules..."
npm install discord.js process semver e621 mongodb mongoose fs --save

echo "[+] Done."