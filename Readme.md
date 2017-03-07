## __Read Me__
----------------------

## Installation Notes
  * Installed NPM, NodeJS and MongoDB Softwares
  * git clone "repo_url" 
  * On root directory 
     1. npm install
     2. grunt (to start server)
        grunt --environment <name of environment /> to start server in a specific environment. see config/config.js for valid environments.

## Seed Tasks
  * node clear_data.js
  * node seeds/seed.js
  * node seeds/question_bank.js
    
## Debug Mode
  * devtool app.js --watch

## to debug in chrome
   * npm install -g node-inspector
   * node-debug --hidden='["node_modules/", "public/js/libraries/"]' app.js
     * note that hiding node_modules will dramatically speed up the initialization of nodeinspector since it crawls javascript as part of its initialization.
   * Then open chrome at localhost:8080/?port=5858. Be patient, it crawls all the javascript so it takes a while to start.
   * It will stop at the first line of code in app.js.
   * use the chrome debug tool as you would if debugging clientside javascript :-)
   * note - we should probably add a grunt task for this so that we can specify the environment to startup in.

## Code Standards
    jshint <file_loc>

## Schema Generators
    yo mongoose:schema "article|title:String,excerpt:String,content:String,published:Boolean,created:Date"

## sso
   * Go to config/config.js and enable saml for your chosen environment.
   * The seed now includes the user named populo. Be sure to run the seed so that you have that user.
   * You will be redirected to the IMC secureauth login.
   * Enter username: populo12
   * Enter password: Im@cHe11O!
   * You should then be redirected to the dashboard if all goes well.

## To tunnel to remote database
   * ssh -fN -i <your-personal-private-key /> -L 27018:localhost:27017 <your-username />@ec2-52-204-233-115.compute-1.amazonaws.com
   * To connect local running app to remote database through tunnel edit config/config.js mongodb connection string for the appropriate environment. i.e.
     * mongodb://populo_assessment:Populo_Assessment@52.204.233.115:27018/assessment_staging
   * to connect local mongo client to remote database through tunnel:
     * $ mongo -p 27018