#!/usr/bin/env bash
rm -rf public
mkdir public
cd ../wcm-frontend
npm run build
cp -R dist/* ../wcm-backend/public
