# servidorBalanceDeCarga

## Comandos:


pm2 start server.js --name="clusterGeneral" -i 1


pm2 start server.js --name="fork" -- -- 8081


pm2 start server.js --name="cluster1" -i 1 -- -- 8082


pm2 start server.js --name="cluster2" -i 1 -- -- 8083


pm2 start server.js --name="cluster3" -i 1 -- -- 8084


pm2 start server.js --name="cluster4" -i 1 -- -- 8085
