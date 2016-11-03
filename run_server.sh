#!/bin/bash

sudo service apache2 stop
sudo python3 -m http.server 80
