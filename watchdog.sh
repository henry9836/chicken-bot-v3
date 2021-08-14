#!/bin/bash

while true; do

    #Apply any updates
    echo "[+] Checking and Downloading Git Updates..."
    git stash
    git fetch --all
    git reset --hard origin/main
    #git checkout main
    git stash pop
    echo "[+] Done."

    echo "[+] Starting Discord Bot..."
    node ./app.js
    TIME=$( date '+%F_%H:%M:%S' )
    echo $'\n----------------------------------'
    echo "[-] $TIME Application Crashed, Restarting..."
    echo $'----------------------------------\n'
    sleep 1
done