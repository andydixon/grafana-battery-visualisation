# Grafana Battery Visualisation

I hate writing documentation, and since I will have ADHD brain, I will forget how to do this.

```
npm install
npm run build
cp -r dist /var/lib/grafana/plugins/andydixon-battery-panel
```

in `/etc/grafana/grsfana.ini` add `andydixon-battery-panel` to `allow_loading_unsigned_plugins`
