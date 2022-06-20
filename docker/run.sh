#!/bin/sh

if [ -n "${HTPASSWD}" ]; then
  echo ${HTPASSWD} > /etc/nginx/auth.htpasswd
fi

nginx -g "daemon off;"
