#!/bin/bash
mkdir -p ~/mongodb/data
mongod --dbpath ~/mongodb/data --port 27017
