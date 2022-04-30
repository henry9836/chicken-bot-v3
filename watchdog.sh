#!/bin/bash
pushd /home/asurobot/chicken-bot/
while true; do

    #Apply any updates
    echo "[+] Checking and Downloading Git Updates..."
    git stash
    git fetch --all
    git reset --hard origin/main
    git stash pop
    echo "[+] Done."

    #Start the bot
    echo $'[+] Starting Discord Bot...\n'
    ../.bin/node ./app.js

    #Crashed record and restart
    TIME=$( date '+%F_%H:%M:%S' )
    echo $'\n----------------------------------'
    echo "[-] $TIME Application Crashed, Restarting..."
    echo $'----------------------------------\n'
    sleep 1
done
popd
