#!/bin/bash

while true; do
    node ./app.js
    TIME=$( date '+%F_%H:%M:%S' )
    echo $'\n----------------------------------'
    echo "[-] $TIME Application Crashed, Restarting..."
    echo $'----------------------------------\n'
    sleep 1
done