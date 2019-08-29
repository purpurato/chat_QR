
# Start server


# Create iptable to redirect to a given port

sudo iptables -t nat -I PREROUTING -p tcp --dport 443 -j REDIRECT --to-ports 8443

https://certbot.eff.org/