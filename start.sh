#!/bin/bash
npm start 2>&1 | tee $(date "+%Y%m%d%H%M").log
