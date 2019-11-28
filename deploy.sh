#!/bin/bash
set -e # exit with nonzero exit code if anything fails

echo "TRAVIS_BUILD_DIR=${TRAVIS_BUILD_DIR}"

echo "Add ssh key to remote server..."
openssl aes-256-cbc -K $encrypted_d1b137041ec5_key -iv $encrypted_d1b137041ec5_iv -in deploy@morty.enc -out ~/.ssh/deploy@morty -d
chmod 600 ~/.ssh/deploy@morty
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/deploy@morty

echo "Sync with remote folder..."
rsync -r --delete-after --quiet "${TRAVIS_BUILD_DIR}/dist/" deploy@ibragimov.by:~/files/ibragimov.by/currency
