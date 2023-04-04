module.exports = {
  apps: [{
    script: "./src/index.js",
    watch: true,
    // Delay between restart
    // Specify delay between watch interval
    watch_delay: 6000,
    // Specify which folder to ignore
    ignore_watch: ["node_modules", "client/img"],
  }]
}
