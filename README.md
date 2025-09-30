# Dehydrated hooks
Hooks for the dehydrated acme client.  For the most part, these are quick and dirty hacks to get things working.
If they work for you great!  If not, please put in a pull request.

Dehydrated can be found at https://dehydrated.io/ .

# Hooks
## gds/hook.js
This is a hook for Google Domains ACME API.  If your domains are stored at https://domains.google.com this is the
hook you need.

To use this, copy config.ini.dist to config.ini, making sure it is in the same directory as the script.  Then modify
it to add your domains and their auth tokens in the "domains" section.  Information about obtaining auth tokens can
be found here:  https://support.google.com/domains/answer/7630973?authuser=0&hl=en#acme_dns

## namecom/hook.js
This is a hook for the name.com API.  If your domains are stored at https://name.com this is the
hook you need.

To use this, copy config.ini.dist to config.ini, making sure it is in the same directory as the script.  Then modify
it to add your domains and auth tokens.  Information about obtaining auth tokens can
be found here:  https://docs.name.com/getting-started

# Pull Requests
I welcome pull requests.  In the pull request please explain exactly what the change does.  Thanks!

# Notes
I hope this is useful to you, but I don't guarantee that it will work.  I don't have the time to really do tech
support that is not related to an actual bug in the code.
