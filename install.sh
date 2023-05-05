#!/bin/bash

DIR="./node_modules"
if [ -d "$DIR" ]; then
        echo "Refreshing modules ..."
        rm -rf node_module
else
        echo "Installing modules ..."
fi

npm install

echo "ready to run with the command : npm run start"
