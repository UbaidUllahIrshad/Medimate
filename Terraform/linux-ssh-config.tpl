cat <<EOF >> ~/.ssh/config

Host medimate-node
    HostName ${hostname}
    User ${user}
    IdentityFile ${identityfile}
EOF